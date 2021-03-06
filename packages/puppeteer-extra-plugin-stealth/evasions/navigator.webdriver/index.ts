import Puppeteer from 'puppeteer'
import { PuppeteerExtraPlugin, PuppeteerLaunchOption } from 'puppeteer-extra-plugin'

interface PluginOptions {
}

/**
 * Pass the Webdriver Test.
 * Will delete `navigator.webdriver` property.
 */
class NavigatorWebdriverPlugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.webdriver'
  }

  async onPageCreated(page: Puppeteer.Page) {
    await page.evaluateOnNewDocument(() => {
      if (navigator.webdriver === false) {
        // Post Chrome 89.0.4339.0 and already good
      } else if (navigator.webdriver === undefined) {
        // Pre Chrome 89.0.4339.0 and already good
      } else {
        // Pre Chrome 88.0.4291.0 and needs patching
        delete Object.getPrototypeOf(navigator).webdriver
      }
    })
  }

  // Post Chrome 88.0.4291.0
  // Note: this will add an infobar to Chrome with a warning that an unsupported flag is set
  // To remove this bar on Linux, run: mkdir -p /etc/opt/chrome/policies/managed && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json
  async beforeLaunch(options: PuppeteerLaunchOption = {}): Promise<PuppeteerLaunchOption> {
    options.args = options.args || [];
    // If disable-blink-features is already passed, append the AutomationControlled switch
    const idx = options.args.findIndex((arg: string) => arg.startsWith('--disable-blink-features='));
    if (idx !== -1) {
      const arg = options.args[idx];
      options.args[idx] = `${arg},AutomationControlled`;
    } else {
      options.args.push('--disable-blink-features=AutomationControlled');
    }
    return options;
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new NavigatorWebdriverPlugin(pluginConfig)
