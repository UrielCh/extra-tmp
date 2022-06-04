import Utils from '../_utils'

import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import withUtils from '../_utils/withUtils'
import { Page } from 'puppeteer'

export interface PluginOptions {
  languages: string[];
}

/**
 * Pass the Languages Test. Allows setting custom languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 */
class NavigatorLanguagesPlugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): string {
    return 'stealth/evasions/navigator.languages'
  }

  get defaults(): PluginOptions {
    return {
      languages: [] // Empty default, otherwise this would be merged with user defined array override
    }
  }

  async onPageCreated(page: Page): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, { opts }: {opts: PluginOptions}) => {
        const languages: string[] = opts.languages.length
          ? opts.languages
          : ['en-US', 'en']
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'languages',
          utils.makeHandler().getterValue(Object.freeze([...languages]))
        )
      },
      {
        opts: this.opts
      }
    )
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new NavigatorLanguagesPlugin(pluginConfig)
