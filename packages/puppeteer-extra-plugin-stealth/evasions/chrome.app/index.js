"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
const withUtils_1 = __importDefault(require("../_utils/withUtils"));
/**
 * Mock the `chrome.app` object if not available (e.g. when running headless).
 */
class ChromeAppPlugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/chrome.app';
    }
    async onPageCreated(page) {
        await (0, withUtils_1.default)(page).evaluateOnNewDocument((utils) => {
            const { chrome } = window;
            if (!chrome) {
                // Use the exact property descriptor found in headful Chrome
                // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
                Object.defineProperty(window, 'chrome', {
                    writable: true,
                    enumerable: true,
                    configurable: false,
                    value: {} // We'll extend that later
                });
            }
            // That means we're running headful and don't need to mock anything
            if ('app' in chrome) {
                return; // Nothing to do here
            }
            const makeError = {
                ErrorInInvocation: (fn) => {
                    const err = new TypeError(`Error in invocation of app.${fn}()`);
                    return utils.stripErrorWithAnchor(err, `at ${fn} (eval at <anonymous>`);
                }
            };
            // There's a some static data in that property which doesn't seem to change,
            // we should periodically check for updates: `JSON.stringify(window.app, null, 2)`
            const STATIC_DATA = JSON.parse(`
{
  "isInstalled": false,
  "InstallState": {
    "DISABLED": "disabled",
    "INSTALLED": "installed",
    "NOT_INSTALLED": "not_installed"
  },
  "RunningState": {
    "CANNOT_RUN": "cannot_run",
    "READY_TO_RUN": "ready_to_run",
    "RUNNING": "running"
  }
}
        `.trim());
            chrome.app = {
                ...STATIC_DATA,
                get isInstalled() {
                    return false;
                },
                getDetails: function getDetails() {
                    if (arguments.length) {
                        throw makeError.ErrorInInvocation(`getDetails`);
                    }
                    return null;
                },
                getIsInstalled: function getDetails() {
                    if (arguments.length) {
                        throw makeError.ErrorInInvocation(`getIsInstalled`);
                    }
                    return false;
                },
                runningState: function getDetails() {
                    if (arguments.length) {
                        throw makeError.ErrorInInvocation(`runningState`);
                    }
                    return 'cannot_run';
                }
            };
            utils.patchToStringNested(chrome.app);
        });
    }
}
exports.default = (pluginConfig) => new ChromeAppPlugin(pluginConfig);
//# sourceMappingURL=index.js.map