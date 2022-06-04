"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
// no typing available
const fpscanner = require('fpscanner');
const util_1 = require("./util");
const _1 = __importDefault(require("../."));
// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
    const version = process.env.PUPPETEER_VERSION;
    if (!version) {
        return false;
    }
    if (version === '1.9.0' || version === '1.6.2') {
        return true;
    }
    return false;
};
(0, ava_1.default)('vanilla: will fail multiple fpscanner tests', async (t) => {
    const fingerPrint = await (0, util_1.getVanillaFingerPrint)();
    const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint);
    const failedChecks = Object.values(testedFingerPrints).filter((val) => val.consistent < 3);
    if (isOldPuppeteerVersion()) {
        t.is(failedChecks.length, 8);
    }
    else {
        t.is(failedChecks.length, 7);
    }
});
(0, ava_1.default)('stealth: will not fail a single fpscanner test', async (t) => {
    const fingerPrint = await (0, util_1.getStealthFingerPrint)(_1.default);
    const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint);
    const failedChecks = Object.values(testedFingerPrints).filter((val) => val.consistent < 3);
    if (failedChecks.length) {
        console.warn('The following fingerprints failed:', failedChecks);
    }
    if ((0, util_1.compareLooseVersionStrings)(fingerPrint.userAgent, '89.0.4339.0') >= 0) {
        // Updated navigator.webdriver behavior breaks the fpscanner tests.
        t.is(failedChecks.length, 1);
        t.is(failedChecks[0].name, 'WEBDRIVER');
    }
    else {
        t.is(failedChecks.length, 0);
    }
});
//# sourceMappingURL=fpscanner.test.js.map