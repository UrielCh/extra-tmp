"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.argsToIgnore = void 0;
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
exports.argsToIgnore = [
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-component-extensions-with-background-pages'
];
/**
 * A CDP driver like puppeteer can make use of various browser launch arguments that are
 * adversarial to mimicking a regular browser and need to be stripped when launching the browser.
 */
class Plugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts = {}) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/defaultArgs';
    }
    get requirements() {
        return new Set(['runLast']); // So other plugins can modify launch options before
    }
    async beforeLaunch(options = {}) {
        options.ignoreDefaultArgs = options.ignoreDefaultArgs || [];
        const ignoreDefaultArgs = options.ignoreDefaultArgs;
        if (ignoreDefaultArgs === true) {
            // that means the user explicitly wants to disable all default arguments
            return;
        }
        exports.argsToIgnore.forEach(arg => {
            if (ignoreDefaultArgs.includes(arg)) {
                return;
            }
            ignoreDefaultArgs.push(arg);
        });
    }
}
exports.default = (pluginConfig) => new Plugin(pluginConfig);
