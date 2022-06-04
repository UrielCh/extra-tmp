"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
const _utils_1 = __importDefault(require("../_utils"));
const withUtils_1 = __importDefault(require("../_utils/withUtils"));
const mimeTypes_1 = require("./mimeTypes");
const plugins_1 = require("./plugins");
const magicArray_1 = require("./magicArray");
const functionMocks_1 = require("./functionMocks");
const data = require('./data.json');
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
class NavigatorPlugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/navigator.plugins';
    }
    async onPageCreated(page) {
        await (0, withUtils_1.default)(page).evaluateOnNewDocument((utils, { fns, data }) => {
            fns = utils.materializeFns(fns);
            // That means we're running headful
            const hasPlugins = 'plugins' in navigator && navigator.plugins.length;
            if (hasPlugins) {
                return; // nothing to do here
            }
            const mimeTypes = fns.generateMimeTypeArray(utils, fns)(data.mimeTypes);
            const plugins = fns.generatePluginArray(utils, fns)(data.plugins);
            // Plugin and MimeType cross-reference each other, let's do that now
            // Note: We're looping through `data.plugins` here, not the generated `plugins`
            for (const pluginData of data.plugins) {
                pluginData.__mimeTypes.forEach((type, index) => {
                    plugins[pluginData.name][index] = mimeTypes[type];
                    Object.defineProperty(plugins[pluginData.name], type, {
                        value: mimeTypes[type],
                        writable: false,
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(mimeTypes[type], 'enabledPlugin', {
                        value: type === 'application/x-pnacl'
                            ? mimeTypes['application/x-nacl'].enabledPlugin // these reference the same plugin, so we need to re-use the Proxy in order to avoid leaks
                            : new Proxy(plugins[pluginData.name], {}),
                        writable: false,
                        enumerable: false,
                        configurable: true
                    });
                });
            }
            const patchNavigator = (name, value) => utils.replaceProperty(Object.getPrototypeOf(navigator), name, {
                get() {
                    return value;
                }
            });
            patchNavigator('mimeTypes', mimeTypes);
            patchNavigator('plugins', plugins);
            // All done
        }, {
            // We pass some functions to evaluate to structure the code more nicely
            fns: _utils_1.default.stringifyFns({
                generateMimeTypeArray: mimeTypes_1.generateMimeTypeArray,
                generatePluginArray: plugins_1.generatePluginArray,
                generateMagicArray: magicArray_1.generateMagicArray,
                generateFunctionMocks: functionMocks_1.generateFunctionMocks
            }),
            data
        });
    }
}
exports.default = (pluginConfig) => new NavigatorPlugin(pluginConfig);
//# sourceMappingURL=index.js.map