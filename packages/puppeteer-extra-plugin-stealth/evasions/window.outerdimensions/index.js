"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
/**
 * Fix missing window.outerWidth/window.outerHeight in headless mode
 * Will also set the viewport to match window size, unless specified by user
 */
class WindowOuterDimensionsPlugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/window.outerdimensions';
    }
    async onPageCreated(page) {
        // Chrome returns undefined, Firefox false
        await page.evaluateOnNewDocument(() => {
            try {
                if (window.outerWidth && window.outerHeight) {
                    return; // nothing to do here
                }
                const windowFrame = 85; // probably OS and WM dependent
                window.outerWidth = window.innerWidth;
                window.outerHeight = window.innerHeight + windowFrame;
            }
            catch (err) { }
        });
    }
    async beforeLaunch(options = {}) {
        // Have viewport match window size, unless specified by user
        // https://github.com/GoogleChrome/puppeteer/issues/3688
        if (!('defaultViewport' in options)) {
            options.defaultViewport = null;
        }
        return options;
    }
}
exports.default = (pluginConfig) => new WindowOuterDimensionsPlugin(pluginConfig);
//# sourceMappingURL=index.js.map