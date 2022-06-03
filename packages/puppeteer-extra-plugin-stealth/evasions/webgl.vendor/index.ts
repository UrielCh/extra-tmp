import { Page } from 'puppeteer'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import withUtils from '../_utils/withUtils'
import utilsGlobal from '../_utils'

interface WebGlVendorPluginOption {
  vendor: string; 
  renderer: string;
}

/**
 * Fix WebGL Vendor/Renderer being set to Google in headless mode
 *
 * Example data (Apple Retina MBP 13): {vendor: "Intel Inc.", renderer: "Intel(R) Iris(TM) Graphics 6100"}
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.vendor] - The vendor string to use (default: `Intel Inc.`)
 * @param {string} [opts.renderer] - The renderer string (default: `Intel Iris OpenGL Engine`)
 */
class WebGlVendorPlugin extends PuppeteerExtraPlugin {
  constructor(opts: Partial<WebGlVendorPluginOption> = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/webgl.vendor'
  }

  /* global WebGLRenderingContext WebGL2RenderingContext */
  async onPageCreated(page: Page) {
    await withUtils(page).evaluateOnNewDocument((utils: typeof utilsGlobal, opts: WebGlVendorPluginOption) => {
      const getParameterProxyHandler = {
        apply: function(target: any, ctx: any, args: any) {
          const param = (args || [])[0]
          const result = utils.cache.Reflect.apply(target, ctx, args)
          // UNMASKED_VENDOR_WEBGL
          if (param === 37445) {
            return opts.vendor || 'Intel Inc.' // default in headless: Google Inc.
          }
          // UNMASKED_RENDERER_WEBGL
          if (param === 37446) {
            return opts.renderer || 'Intel Iris OpenGL Engine' // default in headless: Google SwiftShader
          }
          return result
        }
      }

      // There's more than one WebGL rendering context
      // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext#Browser_compatibility
      // To find out the original values here: Object.getOwnPropertyDescriptors(WebGLRenderingContext.prototype.getParameter)
      const addProxy = (obj: any, propName: string) => {
        utils.replaceWithProxy(obj, propName, getParameterProxyHandler)
      }
      // For whatever weird reason loops don't play nice with Object.defineProperty, here's the next best thing:
      addProxy(WebGLRenderingContext.prototype, 'getParameter')
      addProxy(WebGL2RenderingContext.prototype, 'getParameter')
    }, this.opts)
  }
}

export = (pluginConfig: Partial<WebGlVendorPluginOption>) => new WebGlVendorPlugin(pluginConfig)
