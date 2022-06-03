import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import * as RemoteDevTools from './lib/RemoteDevTools'
import ow from 'ow'
import { Browser, Page } from 'puppeteer';
import { DevToolsTunnel } from './lib/RemoteDevTools'

/**
 * As the tunnel page is public the plugin will require basic auth.
 *
 * You can set your own credentials using `opts` or `setAuthCredentials()`.
 *
 * If you don't specify basic auth credentials the plugin will
 * generate a password and print it to STDOUT.
 *
 * **opts**
 * @param {Object} opts - Options
 * @param {Object} [opts.auth] - Basic auth credentials for the public page
 * @param {string} [opts.auth.user] - Username (default: 'user')
 * @param {string} [opts.auth.pass] - Password (will be generated if not provided)
 * @param {Object} [opts.prefix] - The prefix to use for the localtunnel.me subdomain (default: 'devtools-tunnel')
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * const devtools = require('puppeteer-extra-plugin-devtools')({
 *   auth: { user: 'francis', pass: 'president' }
 * })
 * puppeteer.use(devtools)
 *
 * puppeteer.launch().then(async browser => {
 *   console.log('tunnel url:', (await devtools.createTunnel(browser)).url)
 *   // => tunnel url: https://devtools-tunnel-n9aogqwx3d.localtunnel.me
 * })
 */
class Plugin extends PuppeteerExtraPlugin {
  _browserSessions: {[key:string]: DevToolsTunnel};

  constructor(opts = {}) {
    super(opts)

    // To store a wsEndpoint (= browser instance) > tunnel reference
    this._browserSessions = {}
  }

  get name() {
    return 'devtools'
  }

  get defaults() {
    return {
      prefix: 'devtools-tunnel',
      auth: {
        user: 'user',
        pass: require('crypto')
          .randomBytes(20)
          .toString('hex')
      }
    }
  }

  /**
   * Create a new public tunnel.
   *
   * Supports multiple browser instances (will create a new tunnel for each).
   *
   * @param  {Puppeteer.Browser} browser - The browser to create the tunnel for (there can be multiple)
   * @return {Tunnel} The {@link Tunnel} instance
   *
   * @example
   * const puppeteer = require('puppeteer-extra')
   * const devtools = require('puppeteer-extra-plugin-devtools')()
   * devtools.setAuthCredentials('bob', 'swordfish')
   * puppeteer.use(devtools)
   *
   * ;(async () => {
   *   const browserFleet = await Promise.all(
   *     [...Array(3)].map(slot => puppeteer.launch())
   *   )
   *   for (const [index, browser] of browserFleet.entries()) {
   *     const {url} = await devtools.createTunnel(browser)
   *     console.info(`Browser ${index}'s devtools frontend can be found at: ${url}`)
   *   }
   * })()
   * // =>
   * // Browser 0's devtools frontend can be found at: https://devtools-tunnel-fzenb4zuav.localtunnel.me
   * // Browser 1's devtools frontend can be found at: https://devtools-tunnel-qe2t5rghme.localtunnel.me
   * // Browser 2's devtools frontend can be found at: https://devtools-tunnel-pp83sdi4jo.localtunnel.me
   */
  async createTunnel(browser: Browser) {
    ow(browser, ow.object.hasKeys('wsEndpoint'))

    const wsEndpoint = (browser as any).wsEndpoint()
    if (!this._browserSessions[wsEndpoint]) {
      const tunnel = new Tunnel(wsEndpoint, this.opts);
      this._browserSessions[wsEndpoint] = await tunnel.create()
    }

    this._printGeneratedPasswordWhenNotOverridden(
      this._browserSessions[wsEndpoint].url
    )
    this.debug('createTunnel', {
      wsEndpoint,
      sessions: Object.keys(this._browserSessions)
    })
    return this._browserSessions[wsEndpoint]
  }

  /**
   * Set the basic auth credentials for the public tunnel page.
   *
   * Alternatively the credentials can be defined when instantiating the plugin.
   *
   * @param {string} user - Username
   * @param {string} pass - Password
   *
   * @example
   * const puppeteer = require('puppeteer-extra')
   * const devtools = require('puppeteer-extra-plugin-devtools')()
   * puppeteer.use(devtools)
   *
   * puppeteer.launch().then(async browser => {
   *   devtools.setAuthCredentials('bob', 'swordfish')
   *   const tunnel = await devtools.createTunnel(browser)
   * })
   */
  setAuthCredentials(user: string, pass: string) {
    ow(user, ow.string.nonEmpty)
    ow(pass, ow.string.nonEmpty)
    this.opts.auth = { user, pass }
    this.debug('updated credentials', this.opts.auth)
    return this
  }

  /**
   * Convenience function to get the local devtools frontend URL.
   *
   * @param  {Puppeteer.Browser} browser
   * @return {string}
   *
   * @example
   * const puppeteer = require('puppeteer-extra')
   * const devtools = require('puppeteer-extra-plugin-devtools')()
   * puppeteer.use(devtools)
   *
   * puppeteer.launch().then(async browser => {
   *   console.log(devtools.getLocalDevToolsUrl(browser))
   *   // => http://localhost:55952
   * })
   */
  getLocalDevToolsUrl(browser: Browser) {
    ow(browser, ow.object.hasKeys('wsEndpoint'))

    const wsEndpoint = (browser as any).wsEndpoint()
    return new RemoteDevTools.DevToolsLocal(wsEndpoint).url
  }

  /**
   * Prints the generated auth credentials, when not overriden by the user.
   *
   * As the tunnel is public we make basic auth a requirement,
   * without forcing the user to specify their own credentials.
   *
   * @ignore
   */
  _printGeneratedPasswordWhenNotOverridden(url) {
    if (this.opts.auth.pass.length !== 40) {
      return
    }
    console.info(`
      DevTools Tunnel: You haven't specified basic auth credentials.

      Here are the generated ones, for your convenience:

        - user: 'user'
        - pass: '${this.opts.auth.pass}'

      Public Url: ${url}

      You can specify your own auth credentials when instantiating the plugin,
      or by using the plugin.setAuthCredentials(user, pass) method.
    `)
  }
}

/**
 * The devtools tunnel for a browser instance.
 *
 */
class Tunnel extends RemoteDevTools.DevToolsTunnel {
  constructor(wsEndpoint: string, opts = {}) {
    super(wsEndpoint, opts)
  }

  /**
   * Get the public devtools frontend url.
   *
   * @return {string} - url
   *
   * @example
   * const tunnel = await devtools.createTunnel(browser)
   * console.log(tunnel.url)
   * // => https://devtools-tunnel-sdoqqj95vg.localtunnel.me
   */
  get url() {
    return super.url
  }

  /**
   * Get the devtools frontend deep link for a specific page.
   *
   * @param  {Puppeteer.Page} page
   * @return {string} - url
   *
   * @example
   * const page = await browser.newPage()
   * const tunnel = await devtools.createTunnel(browser)
   * console.log(tunnel.getUrlForPage(page))
   * // => https://devtools-tunnel-bmkjg26zmr.localtunnel.me/devtools/inspector.html?ws(...)
   */
  getUrlForPage(page: Page) {
    ow(page, ow.object.hasKeys('_target._targetInfo.targetId'))
    const pageId = (page as any)._target._targetInfo.targetId
    return super.getUrlForPageId(pageId)
  }

  /**
   * Close the tunnel.
   *
   * The tunnel will automatically stop when your script exits.
   *
   * @example
   * const tunnel = await devtools.createTunnel(browser)
   * tunnel.close()
   */
  close() {
    return super.close()
  }
}

export = function(pluginConfig?: any) {
  return new Plugin(pluginConfig)
}
