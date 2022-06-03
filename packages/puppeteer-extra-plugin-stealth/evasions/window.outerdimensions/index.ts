import { Page } from 'puppeteer'
import { PuppeteerLaunchOption } from 'puppeteer-extra-plugin'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

export interface WindowOuterDimensionsPluginOptions {}

/**
 * Fix missing window.outerWidth/window.outerHeight in headless mode
 * Will also set the viewport to match window size, unless specified by user
 */
class WindowOuterDimensionsPlugin extends PuppeteerExtraPlugin<WindowOuterDimensionsPluginOptions> {
  constructor(opts: Partial<WindowOuterDimensionsPluginOptions> = {}) {
    super(opts)
  }

  get name(): string {
    return 'stealth/evasions/window.outerdimensions'
  }

  async onPageCreated(page: Page): Promise<void> {
    // Chrome returns undefined, Firefox false
    await page.evaluateOnNewDocument(() => {
      try {
        if (window.outerWidth && window.outerHeight) {
          return // nothing to do here
        }
        const windowFrame = 85; // probably OS and WM dependent
        (window as any).outerWidth = window.innerWidth;
        (window as any).outerHeight = window.innerHeight + windowFrame
      } catch (err) {}
    })
  }

  async beforeLaunch(options: PuppeteerLaunchOption = {}) {
    // Have viewport match window size, unless specified by user
    // https://github.com/GoogleChrome/puppeteer/issues/3688
    if (!('defaultViewport' in options)) {
      options.defaultViewport = null
    }
    return options
  }
}

export default function(pluginConfig: Partial<WindowOuterDimensionsPluginOptions>) {
  return new WindowOuterDimensionsPlugin(pluginConfig)
}
