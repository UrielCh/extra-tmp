"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PLUGIN_NAME = 'stealth';
const ava_1 = __importDefault(require("ava"));
const _1 = __importDefault(require("."));
(0, ava_1.default)('is a function', async (t) => {
    t.is(typeof _1.default, 'function');
});
(0, ava_1.default)('should have the basic class members', async (t) => {
    const instance = (0, _1.default)();
    t.is(instance.name, PLUGIN_NAME);
    t.true(instance._isPuppeteerExtraPlugin);
});
(0, ava_1.default)('should have the public child class members', async (t) => {
    const instance = (0, _1.default)();
    const prototype = Object.getPrototypeOf(instance);
    const childClassMembers = Object.getOwnPropertyNames(prototype);
    t.true(childClassMembers.includes('constructor'));
    t.true(childClassMembers.includes('name'));
    t.true(childClassMembers.includes('name'));
    t.true(childClassMembers.includes('defaults'));
    t.true(childClassMembers.includes('availableEvasions'));
    t.true(childClassMembers.includes('enabledEvasions'));
    t.is(childClassMembers.length, 7);
});
(0, ava_1.default)('should have opts with default values', async (t) => {
    const instance = (0, _1.default)();
    t.deepEqual(instance.opts.enabledEvasions, instance.availableEvasions);
});
(0, ava_1.default)('should add all dependencies dynamically', async (t) => {
    const instance = (0, _1.default)();
    const deps = new Set([...instance.opts.enabledEvasions].map(e => `${PLUGIN_NAME}/evasions/${e}`));
    t.deepEqual(instance.dependencies, deps);
});
(0, ava_1.default)('should add all dependencies dynamically including changes', async (t) => {
    const instance = (0, _1.default)();
    const fakeDep = 'foobar';
    instance.enabledEvasions = new Set([fakeDep]);
    t.deepEqual(instance.dependencies, new Set([`${PLUGIN_NAME}/evasions/${fakeDep}`]));
});
//# sourceMappingURL=index.test.js.map