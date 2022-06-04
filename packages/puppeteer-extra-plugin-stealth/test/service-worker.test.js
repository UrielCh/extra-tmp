"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const util_1 = require("./util");
const __1 = __importDefault(require(".."));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Create a simple HTTP server. Service Workers cannot be served from file:// URIs
const httpServer = async () => {
    const server = await http_1.default
        .createServer((req, res) => {
        let contents, type;
        if (req.url === '/sw.js') {
            contents = fs_1.default.readFileSync(path_1.default.join(__dirname, './fixtures/sw.js'));
            type = 'application/javascript';
        }
        else {
            contents = fs_1.default.readFileSync(path_1.default.join(__dirname, './fixtures/dummy-with-service-worker.html'));
            type = 'text/html';
        }
        res.setHeader('Content-Type', type);
        res.writeHead(200);
        res.end(contents);
    })
        .listen(0); // random free port
    return `http://127.0.0.1:${server.address().port}/`;
};
let browser;
let page;
let worker;
ava_1.default.before(async (t) => {
    const address = await httpServer();
    console.log(`Server is running on port ${address}`);
    browser = await (0, util_1.addExtra)(util_1.vanillaPuppeteer)
        .use((0, __1.default)())
        .launch({ headless: true });
    page = await browser.newPage();
    const workerP = new Promise(resolve => {
        browser.on('targetcreated', async (target) => {
            if (target.type() === 'service_worker') {
                resolve(target.worker());
            }
        });
    });
    await page.goto(address);
    worker = await workerP;
});
ava_1.default.after(async (t) => {
    await browser.close();
});
ava_1.default.skip('stealth: inconsistencies between page and worker', async (t) => {
    const pageFP = await page.evaluate(detectFingerprint);
    const workerFP = await worker.evaluate(detectFingerprint);
    t.deepEqual(pageFP, workerFP);
});
ava_1.default.serial.skip('stealth: creepjs has good trust score', async (t) => {
    page.goto('https://abrahamjuliot.github.io/creepjs/');
    const select = await page.waitForSelector('#fingerprint-data .unblurred');
    if (!select)
        return;
    const textContent = await select.getProperty('textContent');
    if (!textContent)
        return;
    const score = (await textContent.jsonValue());
    t.true(parseInt(score) > 80, `The creepjs score is: ${parseInt(score)}% but it should be at least 80%`);
});
/* global OffscreenCanvas */
function detectFingerprint() {
    const results = {};
    const props = [
        'userAgent',
        'language',
        'hardwareConcurrency',
        'deviceMemory',
        'languages',
        'platform'
    ];
    props.forEach(el => {
        results[el] = navigator[el].toString();
    });
    const canvasOffscreenWebgl = new OffscreenCanvas(256, 256);
    const contextWebgl = canvasOffscreenWebgl.getContext('webgl');
    if (contextWebgl) {
        const rendererInfo = contextWebgl.getExtension('WEBGL_debug_renderer_info');
        if (rendererInfo) {
            results.webglVendor = contextWebgl.getParameter(rendererInfo.UNMASKED_VENDOR_WEBGL);
            results.webglRenderer = contextWebgl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL);
        }
    }
    results.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return results;
}
//# sourceMappingURL=service-worker.test.js.map