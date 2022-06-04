"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
/**
 * Minimal stealth plugin template, not being used. :-)
 *
 * Feel free to copy this folder as the basis for additional detection evasion plugins.
 */
class Plugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/_template';
    }
    async onPageCreated(page) {
        await page.evaluateOnNewDocument(() => {
            console.debug('hello world');
        });
    }
}
exports.default = (pluginConfig) => new Plugin(pluginConfig);
//# sourceMappingURL=index.js.map