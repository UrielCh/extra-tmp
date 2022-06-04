'use strict'

const puppeteer = require('puppeteer-extra')
// Enable stealth plugin
const stealth = require('puppeteer-extra-plugin-stealth').default();
puppeteer.use(stealth)
;(async () => {
  // Launch the browser in headless mode and set up a page.
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: true
  })
  const page = await browser.newPage()

  // Navigate to the page that will perform the tests.
  const testUrl =
    'https://intoli.com/blog/' +
    'not-possible-to-block-chrome-headless/chrome-headless-test.html'
  await page.goto(testUrl)

  // Save a screenshot of the results.
  const screenshotPath = '/tmp/headless-test-result.png'
  await page.screenshot({ path: screenshotPath })
  console.log('have a look at the screenshot:', screenshotPath)

  await browser.close()
})()
