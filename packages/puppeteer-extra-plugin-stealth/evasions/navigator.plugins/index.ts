import { Page } from 'puppeteer'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import Utils from '../_utils'
import withUtils from '../_utils/withUtils'

import { generateMimeTypeArray } from './mimeTypes';
import { generatePluginArray } from './plugins';
import { generateMagicArray } from  './magicArray';
import { generateFunctionMocks } from './functionMocks';

const data = require('./data.json')

interface NavigatorPluginOption {
}
/**
 * In headless mode `navigator.mimeTypes` and `navigator.plugins` are empty.
 * This plugin emulates both of these with functional mocks to match regular headful Chrome.
 *
 * Note: mimeTypes and plugins cross-reference each other, so it makes sense to do them at the same time.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/mimeTypes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MimeTypeArray
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/plugins
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PluginArray
 */
class NavigatorPlugin extends PuppeteerExtraPlugin {
  constructor(opts: Partial<NavigatorPluginOption> = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.plugins'
  }

  async onPageCreated(page: Page) {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, { fns, data } : {fns: any, data: any}) => {
        fns = utils.materializeFns(fns)

        // That means we're running headful
        const hasPlugins = 'plugins' in navigator && navigator.plugins.length
        if (hasPlugins) {
          return // nothing to do here
        }

        const mimeTypes = fns.generateMimeTypeArray(utils, fns)(data.mimeTypes)
        const plugins = fns.generatePluginArray(utils, fns)(data.plugins)

        // Plugin and MimeType cross-reference each other, let's do that now
        // Note: We're looping through `data.plugins` here, not the generated `plugins`
        for (const pluginData of data.plugins) {
          pluginData.__mimeTypes.forEach((type: string, index: number) => {
            plugins[pluginData.name][index] = mimeTypes[type]

            Object.defineProperty(plugins[pluginData.name], type, {
              value: mimeTypes[type],
              writable: false,
              enumerable: false, // Not enumerable
              configurable: true
            })
            Object.defineProperty(mimeTypes[type], 'enabledPlugin', {
              value:
                type === 'application/x-pnacl'
                  ? mimeTypes['application/x-nacl'].enabledPlugin // these reference the same plugin, so we need to re-use the Proxy in order to avoid leaks
                  : new Proxy(plugins[pluginData.name], {}), // Prevent circular references
              writable: false,
              enumerable: false, // Important: `JSON.stringify(navigator.plugins)`
              configurable: true
            })
          })
        }

        const patchNavigator = (name: string, value: any) =>
          utils.replaceProperty(Object.getPrototypeOf(navigator), name, {
            get() {
              return value
            }
          })

        patchNavigator('mimeTypes', mimeTypes)
        patchNavigator('plugins', plugins)

        // All done
      },
      {
        // We pass some functions to evaluate to structure the code more nicely
        fns: Utils.stringifyFns({
          generateMimeTypeArray,
          generatePluginArray,
          generateMagicArray,
          generateFunctionMocks
        }),
        data
      }
    )
  }
}

export = function(pluginConfig: Partial<NavigatorPluginOption>) {
  return new NavigatorPlugin(pluginConfig)
}
