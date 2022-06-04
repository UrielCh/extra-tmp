"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
const withUtils_1 = __importDefault(require("../_utils/withUtils"));
/**
 * Set the hardwareConcurrency to 4 (optionally configurable with `hardwareConcurrency`)
 *
 * @see https://arh.antoinevastel.com/reports/stats/osName_hardwareConcurrency_report.html
 *
 * @param {Object} [opts] - Options
 * @param {number} [opts.hardwareConcurrency] - The value to use in `navigator.hardwareConcurrency` (default: `4`)
 */
class NavigatorHardwareConcurrencyPlugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/navigator.hardwareConcurrency';
    }
    get defaults() {
        return {
            hardwareConcurrency: 4
        };
    }
    async onPageCreated(page) {
        await (0, withUtils_1.default)(page).evaluateOnNewDocument((utils, { opts }) => {
            utils.replaceGetterWithProxy(Object.getPrototypeOf(navigator), 'hardwareConcurrency', utils.makeHandler().getterValue(opts.hardwareConcurrency));
        }, {
            opts: this.opts
        });
    }
}
exports.default = (pluginConfig) => new NavigatorHardwareConcurrencyPlugin(pluginConfig);
//# sourceMappingURL=index.js.map