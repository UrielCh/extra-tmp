import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import { Page } from 'puppeteer'

export interface PluginOptions {
}

/**
 * Minimal stealth plugin template, not being used. :-)
 *
 * Feel free to copy this folder as the basis for additional detection evasion plugins.
 */
class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): string {
    return 'stealth/evasions/_template'
  }

  async onPageCreated(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      console.debug('hello world')
    })
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
