"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareLooseVersionStrings = exports.getStealthFingerPrint = exports.getVanillaFingerPrint = exports.dummyHTMLPath = exports.vanillaPuppeteer = exports.addExtra = void 0;
const assert_1 = __importDefault(require("assert"));
const puppeteer_extra_1 = require("puppeteer-extra");
var puppeteer_extra_2 = require("puppeteer-extra");
Object.defineProperty(exports, "addExtra", { enumerable: true, get: function () { return puppeteer_extra_2.addExtra; } });
var puppeteer_1 = require("puppeteer");
Object.defineProperty(exports, "vanillaPuppeteer", { enumerable: true, get: function () { return __importDefault(puppeteer_1).default; } });
const puppeteer_2 = __importDefault(require("puppeteer"));
// 
const fpCollectPath = require.resolve('fpcollect/dist/fpCollect.min.js');
var fpCollect;
const getFingerPrintFromPage = async (page) => {
    return page.evaluate(() => fpCollect.generateFingerprint()); // eslint-disable-line
};
exports.dummyHTMLPath = require('path').join(__dirname, './fixtures/dummy.html');
const getFingerPrint = async (puppeteer, pageFn) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('file://' + exports.dummyHTMLPath);
    await page.addScriptTag({ path: fpCollectPath });
    const fingerPrint = await getFingerPrintFromPage(page);
    let pageFnResult = null;
    if (pageFn) {
        pageFnResult = await pageFn(page);
    }
    await browser.close();
    return { ...fingerPrint, pageFnResult };
};
const getVanillaFingerPrint = async (pageFn) => getFingerPrint(puppeteer_2.default, pageFn);
exports.getVanillaFingerPrint = getVanillaFingerPrint;
const getStealthFingerPrint = async (Plugin, pageFn, pluginOptions = null) => getFingerPrint((0, puppeteer_extra_1.addExtra)(puppeteer_2.default).use(Plugin(pluginOptions)), pageFn);
exports.getStealthFingerPrint = getStealthFingerPrint;
// Expecting the input string to be in one of these formats:
// - The UA string
// - The shorter version string from Puppeteers browser.version()
// - The shortest four-integer string
const parseLooseVersionString = (looseVersionString) => looseVersionString
    .match(/(\d+\.){3}\d+/)[0]
    .split('.')
    .map(x => parseInt(x));
const compareLooseVersionStrings = (version0, version1) => {
    const parsed0 = parseLooseVersionString(version0);
    const parsed1 = parseLooseVersionString(version1);
    (0, assert_1.default)(parsed0.length == 4);
    (0, assert_1.default)(parsed1.length == 4);
    for (let i = 0; i < parsed0.length; i++) {
        if (parsed0[i] < parsed1[i]) {
            return -1;
        }
        else if (parsed0[i] > parsed1[i]) {
            return 1;
        }
    }
    return 0;
};
exports.compareLooseVersionStrings = compareLooseVersionStrings;
//# sourceMappingURL=util.js.map