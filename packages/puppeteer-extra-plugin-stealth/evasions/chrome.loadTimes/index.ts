import Utils from '../_utils'

import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

import withUtils from '../_utils/withUtils'
import { Page } from 'puppeteer'

interface NtEntry {
  nextHopProtocol: string;// 'h2',
  type: string;// 'other'
}

export interface PluginOptions {}
/**
 * Mock the `chrome.loadTimes` function if not available (e.g. when running headless).
 * It's a deprecated (but unfortunately still existing) chrome specific API to fetch browser timings and connection info.
 *
 * Internally chromium switched the implementation to use the WebPerformance API,
 * so we can do the same to create a fully functional mock. :-)
 *
 * Note: We're using the deprecated PerformanceTiming API instead of the new Navigation Timing Level 2 API on purpopse.
 *
 * @see https://developers.google.com/web/updates/2017/12/chrome-loadtimes-deprecated
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming
 * @see https://source.chromium.org/chromium/chromium/src/+/master:chrome/renderer/loadtimes_extension_bindings.cc;l=124?q=loadtimes&ss=chromium
 * @see `chrome.csi` evasion
 *
 */
class ChromeLoadTimesPlugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): string {
    return 'stealth/evasions/chrome.loadTimes'
  }

  async onPageCreated(page: Page): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, { opts }: {opts: PluginOptions}) => {
        const {chrome} = window as any;
        if (!chrome) {
          // Use the exact property descriptor found in headful Chrome
          // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
          Object.defineProperty(window, 'chrome', {
            writable: true,
            enumerable: true,
            configurable: false, // note!
            value: {} // We'll extend that later
          })
        }

        // That means we're running headful and don't need to mock anything
        if ('loadTimes' in chrome) {
          return // Nothing to do here
        }

        // Check that the Navigation Timing API v1 + v2 is available, we need that
        if (
          !window.performance ||
          !window.performance.timing ||
          !(window as any).PerformancePaintTiming
        ) {
          return
        }

        const { performance } = window

        // Some stuff is not available on about:blank as it requires a navigation to occur,
        // let's harden the code to not fail then:
        const ntEntryFallback = {
          nextHopProtocol: 'h2',
          type: 'other'
        }

        // The API exposes some funky info regarding the connection
        const protocolInfo = {
          get connectionInfo() {
            const ntEntry =
              (performance.getEntriesByType('navigation')[0] || ntEntryFallback) as unknown as NtEntry
            return ntEntry.nextHopProtocol
          },
          get npnNegotiatedProtocol() {
            // NPN is deprecated in favor of ALPN, but this implementation returns the
            // HTTP/2 or HTTP2+QUIC/39 requests negotiated via ALPN.
            const ntEntry =
              (performance.getEntriesByType('navigation')[0] || ntEntryFallback) as unknown as NtEntry
            return ['h2', 'hq'].includes(ntEntry.nextHopProtocol)
              ? ntEntry.nextHopProtocol
              : 'unknown'
          },
          get navigationType() {
            const ntEntry =
              (performance.getEntriesByType('navigation')[0] || ntEntryFallback) as unknown as NtEntry
            return ntEntry.type
          },
          get wasAlternateProtocolAvailable() {
            // The Alternate-Protocol header is deprecated in favor of Alt-Svc
            // (https://www.mnot.net/blog/2016/03/09/alt-svc), so technically this
            // should always return false.
            return false
          },
          get wasFetchedViaSpdy() {
            // SPDY is deprecated in favor of HTTP/2, but this implementation returns
            // true for HTTP/2 or HTTP2+QUIC/39 as well.
            const ntEntry =
              (performance.getEntriesByType('navigation')[0] || ntEntryFallback) as unknown as NtEntry
            return ['h2', 'hq'].includes(ntEntry.nextHopProtocol)
          },
          get wasNpnNegotiated() {
            // NPN is deprecated in favor of ALPN, but this implementation returns true
            // for HTTP/2 or HTTP2+QUIC/39 requests negotiated via ALPN.
            const ntEntry =
              (performance.getEntriesByType('navigation')[0] || ntEntryFallback) as unknown as NtEntry
            return ['h2', 'hq'].includes(ntEntry.nextHopProtocol)
          }
        }

        const { timing } = window.performance

        // Truncate number to specific number of decimals, most of the `loadTimes` stuff has 3
        function toFixed(num: number, fixed: number) {
          var re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?')
          const m = num.toString().match(re);
          if (!m)
            return '0'
          return m[0]
        }

        const timingInfo = {
          get firstPaintAfterLoadTime() {
            // This was never actually implemented and always returns 0.
            return 0
          },
          get requestTime() {
            return timing.navigationStart / 1000
          },
          get startLoadTime() {
            return timing.navigationStart / 1000
          },
          get commitLoadTime() {
            return timing.responseStart / 1000
          },
          get finishDocumentLoadTime() {
            return timing.domContentLoadedEventEnd / 1000
          },
          get finishLoadTime() {
            return timing.loadEventEnd / 1000
          },
          get firstPaintTime() {
            const fpEntry = performance.getEntriesByType('paint')[0] || {
              startTime: timing.loadEventEnd / 1000 // Fallback if no navigation occured (`about:blank`)
            }
            return toFixed(
              (fpEntry.startTime + performance.timeOrigin) / 1000,
              3
            )
          }
        }

        chrome.loadTimes = function() {
          return {
            ...protocolInfo,
            ...timingInfo
          }
        }
        utils.patchToString(chrome.loadTimes)
      },
      {
        opts: this.opts
      }
    )
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new ChromeLoadTimesPlugin(pluginConfig)
