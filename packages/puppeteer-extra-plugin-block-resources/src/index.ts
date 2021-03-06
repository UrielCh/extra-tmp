import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import { Page } from 'puppeteer'

/**
 * Typing copyed from Puppeter
 */
type ResourceType = ('Document' | 'Stylesheet' | 'Image' | 'Media' | 'Font' | 'Script' | 'TextTrack' | 'XHR' | 'Fetch' | 'EventSource' | 'WebSocket' | 'Manifest' | 'SignedExchange' | 'Ping' | 'CSPViolationReport' | 'Preflight' | 'Other');
declare type ErrorCode = 'aborted' | 'accessdenied' | 'addressunreachable' | 'blockedbyclient' | 'blockedbyresponse' | 'connectionaborted' | 'connectionclosed' | 'connectionfailed' | 'connectionrefused' | 'connectionreset' | 'internetdisconnected' | 'namenotresolved' | 'timedout' | 'failed';
declare interface ContinueRequestOverrides {
  /**
   * If set, the request URL will change. This is not a redirect.
   */
  url?: string;
  method?: string;
  postData?: string;
  headers?: Record<string, string>;
}

interface HTTPRequest {
  resourceType(): Lowercase<ResourceType>;
  abort(errorCode?: ErrorCode): Promise<void>;
  continue(overrides?: ContinueRequestOverrides): Promise<void>;
}

export interface PluginOptions {
  availableTypes: Set<string>,
  // Block nothing by default
  blockedTypes: Set<string>
}

/**
 * Block resources (images, media, css, etc.) in puppeteer.
 *
 * Supports all resource types, blocking can be toggled dynamically.
 *
 * @param {Object} opts - Options
 * @param {Set<string>} [opts.blockedTypes] - Specify which resourceTypes to block (by default none)
 *
 * @example
 * puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
 *   blockedTypes: new Set(['image', 'stylesheet'])
 * }))
 *
 * //
 * // and/or dynamically:
 * //
 *
 * const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')()
 * puppeteer.use(blockResourcesPlugin)
 *
 * const browser = await puppeteer.launch({ headless: false })
 * const page = await browser.newPage()
 *
 * blockResourcesPlugin.blockedTypes.add('image')
 * await page.goto('http://www.msn.com/', {waitUntil: 'domcontentloaded'})
 *
 * blockResourcesPlugin.blockedTypes.add('stylesheet')
 * blockResourcesPlugin.blockedTypes.add('other') // e.g. favicon
 * await page.goto('http://news.ycombinator.com', {waitUntil: 'domcontentloaded'})
 *
 * blockResourcesPlugin.blockedTypes.delete('stylesheet')
 * blockResourcesPlugin.blockedTypes.delete('other')
 * blockResourcesPlugin.blockedTypes.add('media')
 * blockResourcesPlugin.blockedTypes.add('script')
 * await page.goto('http://www.youtube.com', {waitUntil: 'domcontentloaded'})
 */
class BlockResourcesPlugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): string {
    return 'block-resources'
  }

  get defaults(): PluginOptions {
    return {
      availableTypes: new Set([
        'document',
        'stylesheet',
        'image',
        'media',
        'font',
        'script',
        'texttrack',
        'xhr',
        'fetch',
        'eventsource',
        'websocket',
        'manifest',
        'other'
      ]),
      // Block nothing by default
      blockedTypes: new Set([])
    }
  }

  /**
   * Get all available resource types.
   *
   * Resource type will be one of the following: `document`, `stylesheet`, `image`, `media`, `font`, `script`, `texttrack`, `xhr`, `fetch`, `eventsource`, `websocket`, `manifest`, `other`.
   *
   * @type {Set<string>} - A Set of all available resource types.
   */
  get availableTypes(): Set<string> {
    return this.defaults.availableTypes
  }

  /**
   * Get all blocked resource types.
   *
   * Blocked resource types can be configured either through `opts` or by modifying this property.
   *
   * @type {Set<string>} - A Set of all blocked resource types.
   */
  get blockedTypes(): Set<string> {
    return this.opts.blockedTypes
  }

  /**
   * @private
   */
  onRequest(request: HTTPRequest): Promise<void> {
    const type = request.resourceType()
    const shouldBlock = this.blockedTypes.has(type)
    this.debug('onRequest', { type, shouldBlock })
    return shouldBlock ? request.abort() : request.continue()
  }

  /**
   * @private
   */
  async onPageCreated(page: Page): Promise<void> {
    this.debug('onPageCreated', { blockedTypes: this.blockedTypes })
    await page.setRequestInterception(true)
    page.on('request', this.onRequest.bind(this))
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new BlockResourcesPlugin(pluginConfig)
