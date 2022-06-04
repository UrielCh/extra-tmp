"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const util = __importStar(require("./util"));
const __1 = __importDefault(require(".."));
var compareLooseVersionStrings;
// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
    const version = process.env.PUPPETEER_VERSION;
    const isOld = version && (version === '1.9.0' || version === '1.6.2');
    return isOld;
};
/* global HTMLIFrameElement */
/* global Notification */
(0, ava_1.default)('stealth: will pass Paul Irish', async (t) => {
    const browser = await util.addExtra(util.vanillaPuppeteer)
        .use((0, __1.default)())
        .launch({ headless: true });
    const page = await browser.newPage();
    await page.exposeFunction('compareLooseVersionStrings', util.compareLooseVersionStrings);
    const detectionResults = await page.evaluate(detectHeadless);
    await browser.close();
    if (isOldPuppeteerVersion()) {
        t.true(true);
        return;
    }
    const wasHeadlessDetected = Object.values(detectionResults).some(Boolean);
    if (wasHeadlessDetected) {
        console.log(detectionResults);
    }
    t.false(wasHeadlessDetected);
});
async function detectHeadless() {
    const results = {};
    async function test(name, fn) {
        const detectionPassed = await fn();
        if (detectionPassed)
            console.log(`Chrome headless detected via ${name}`);
        results[name] = detectionPassed;
    }
    await test('userAgent', (_) => {
        return /HeadlessChrome/.test(window.navigator.userAgent);
    });
    // navigator.webdriver behavior change since release 89.0.4339.0. See also #448
    if (await compareLooseVersionStrings(navigator.userAgent, '89.0.4339.0') >= 0) {
        await test('navigator.webdriver is not false', (_) => {
            return navigator.webdriver !== false;
        });
    }
    else {
        // Detects the --enable-automation || --headless flags
        // Will return true in headful if --enable-automation is provided
        await test('navigator.webdriver present', (_) => {
            return 'webdriver' in navigator;
        });
        await test('navigator.webdriver not undefined', (_) => {
            return navigator.webdriver !== undefined;
        });
        /* eslint-disable no-proto */
        await test('navigator.webdriver property overridden', (_) => {
            return (Object.getOwnPropertyDescriptor(navigator.__proto__, 'webdriver') !==
                undefined);
        });
        await test('navigator.webdriver prop detected', (_) => {
            for (const prop in navigator) {
                if (prop === 'webdriver') {
                    return true;
                }
            }
            return false;
        });
    }
    await test('window.chrome missing', (_) => {
        return /Chrome/.test(window.navigator.userAgent) && !window.chrome;
    });
    await test('permissions API', async (_) => {
        const permissionStatus = await navigator.permissions.query({
            name: 'notifications'
        });
        return (Notification.permission === 'denied' &&
            permissionStatus.state === 'prompt');
    });
    await test('permissions API overriden', (_) => {
        const permissions = window.navigator.permissions;
        if (permissions.query.toString() !== 'function query() { [native code] }')
            return true;
        if (permissions.query.toString.toString() !==
            'function toString() { [native code] }')
            return true;
        if (permissions.query.toString.hasOwnProperty('[[Handler]]') && // eslint-disable-line
            permissions.query.toString.hasOwnProperty('[[Target]]') && // eslint-disable-line
            permissions.query.toString.hasOwnProperty('[[IsRevoked]]') // eslint-disable-line
        )
            return true;
        if (permissions.hasOwnProperty('query'))
            return true; // eslint-disable-line
    });
    await test('navigator.plugins empty', (_) => {
        return navigator.plugins.length === 0;
    });
    await test('navigator.languages blank', (_) => {
        return navigator.languages === '';
    });
    await test('iFrame for fresh window object', (_) => {
        // evaluateOnNewDocument scripts don't apply within [srcdoc] (or [sandbox]) iframes
        // https://github.com/GoogleChrome/puppeteer/issues/1106#issuecomment-359313898
        const iframe = document.createElement('iframe');
        iframe.srcdoc = 'page intentionally left blank';
        document.body.appendChild(iframe);
        // Verify iframe prototype isn't touched
        const descriptors = Object.getOwnPropertyDescriptors(HTMLIFrameElement.prototype);
        if (descriptors.contentWindow.get.toString() !==
            'function get contentWindow() { [native code] }')
            return true;
        // Verify iframe isn't remapped to main window
        if (iframe.contentWindow === window)
            return true;
        // Here we would need to rerun all tests with `iframe.contentWindow` as `window`
        // Example:
        return iframe.contentWindow.navigator.plugins.length === 0;
    });
    // This detects that a devtools protocol agent is attached.
    // So it will also pass true in headful Chrome if the devtools window is attached
    await test('toString', (_) => {
        let gotYou = 0;
        const spooky = /./;
        spooky.toString = function () {
            gotYou++;
            return 'spooky';
        };
        console.debug(spooky);
        return gotYou > 1;
    });
    return results;
}
//# sourceMappingURL=cat-and-mouse.test.js.map