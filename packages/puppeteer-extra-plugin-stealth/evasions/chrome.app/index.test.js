"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const util_1 = require("../../test/util");
const _1 = __importDefault(require("."));
/* global chrome */
var window;
var chrome;
(0, ava_1.default)('stealth: will add convincing chrome.app object', async (t) => {
    const puppeteer = (0, util_1.addExtra)(util_1.vanillaPuppeteer).use((0, _1.default)({}));
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const results = await page.evaluate(() => {
        const catchErr = (fn, ...args) => {
            try {
                return fn.apply(this, args);
            }
            catch ({ name, message, stack }) {
                return { name, message, stack };
            }
        };
        return {
            app: {
                exists: window.chrome && 'app' in window.chrome,
                toString: chrome.app.toString(),
                deepToString: chrome.app.runningState.toString()
            },
            data: {
                getIsInstalled: chrome.app.getIsInstalled(),
                runningState: chrome.app.runningState(),
                getDetails: chrome.app.getDetails(),
                InstallState: chrome.app.InstallState,
                RunningState: chrome.app.RunningState
            },
            errors: {
                getIsInstalled: catchErr(chrome.app.getDetails, 'foo').message,
                stackOK: !catchErr(chrome.app.getDetails, 'foo').stack.includes('at getDetails')
            }
        };
    });
    t.deepEqual(results, {
        app: {
            exists: true,
            toString: '[object Object]',
            deepToString: 'function getDetails() { [native code] }'
        },
        data: {
            InstallState: {
                DISABLED: 'disabled',
                INSTALLED: 'installed',
                NOT_INSTALLED: 'not_installed'
            },
            RunningState: {
                CANNOT_RUN: 'cannot_run',
                READY_TO_RUN: 'ready_to_run',
                RUNNING: 'running'
            },
            getDetails: null,
            getIsInstalled: false,
            runningState: 'cannot_run'
        },
        errors: {
            getIsInstalled: 'Error in invocation of app.getDetails()',
            stackOK: true
        }
    });
});
//# sourceMappingURL=index.test.js.map