"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_extra_plugin_1 = require("puppeteer-extra-plugin");
const withUtils_1 = __importDefault(require("../_utils/withUtils"));
/**
 * Fix `Notification.permission` behaving weirdly in headless mode
 *
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=1052332
 */
class NavigatorPermissionsPlugin extends puppeteer_extra_plugin_1.PuppeteerExtraPlugin {
    constructor(opts) {
        super(opts);
    }
    get name() {
        return 'stealth/evasions/navigator.permissions';
    }
    /* global Notification Permissions PermissionStatus */
    async onPageCreated(page) {
        await (0, withUtils_1.default)(page).evaluateOnNewDocument((utils, opts) => {
            const isSecure = document.location.protocol.startsWith('https');
            // In headful on secure origins the permission should be "default", not "denied"
            if (isSecure) {
                utils.replaceGetterWithProxy(Notification, 'permission', {
                    apply() {
                        return 'default';
                    }
                });
            }
            // Another weird behavior:
            // On insecure origins in headful the state is "denied",
            // whereas in headless it's "prompt"
            if (!isSecure) {
                const handler = {
                    apply(target, ctx, args) {
                        const param = (args || [])[0];
                        const isNotifications = param && param.name && param.name === 'notifications';
                        if (!isNotifications) {
                            return utils.cache.Reflect.apply(...arguments);
                        }
                        return Promise.resolve(Object.setPrototypeOf({
                            state: 'denied',
                            onchange: null
                        }, PermissionStatus.prototype));
                    }
                };
                // Note: Don't use `Object.getPrototypeOf` here
                utils.replaceWithProxy(Permissions.prototype, 'query', handler);
            }
        }, this.opts);
    }
}
exports.default = (pluginConfig) => new NavigatorPermissionsPlugin(pluginConfig);
//# sourceMappingURL=index.js.map