"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
const withUtils_1 = __importDefault(require("../_utils/withUtils"));
/**
 * Pass the Languages Test. Allows setting custom languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 */
class NavigatorLanguagesPlugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/navigator.languages';
    }
    get defaults() {
        return {
            languages: [] // Empty default, otherwise this would be merged with user defined array override
        };
    }
    async onPageCreated(page) {
        await (0, withUtils_1.default)(page).evaluateOnNewDocument((utils, { opts }) => {
            const languages = opts.languages.length
                ? opts.languages
                : ['en-US', 'en'];
            utils.replaceGetterWithProxy(Object.getPrototypeOf(navigator), 'languages', utils.makeHandler().getterValue(Object.freeze([...languages])));
        }, {
            opts: this.opts
        });
    }
}
exports.default = (pluginConfig) => new NavigatorLanguagesPlugin(pluginConfig);
//# sourceMappingURL=index.js.map