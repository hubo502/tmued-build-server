var util = require('util');
var EventEmitter = require('events').EventEmitter;
util.inherits(module.exports, EventEmitter);

exports = module.exports;
exports.version = require('./package').version;

exports.plugin = require('./lib/plugin');
exports.config = require('./lib/config');

exports.install = require('./lib/install');
exports.build = require('./lib/build');
exports.tmued_build = require('./lib/tmued-build');
exports.info = require('./lib/info');
exports.login = require('./lib/login');
exports.publish = require('./lib/publish').publish;
exports.upload = require('./lib/publish').upload;
exports.unpublish = require('./lib/unpublish');
exports.search = require('./lib/search');
exports.doc = require('./lib/doc');
exports.test = require('./lib/test');

// plugins should use spm.log
exports.log = require('./lib/utils/log');
exports.run = require('./lib/utils/run');

// register sdk
exports.sdk = {};
exports.sdk.iduri = require('./lib/sdk/iduri');
exports.sdk.yuan = require('./lib/sdk/yuan');
exports.sdk.file = require('./lib/sdk/file');
exports.sdk.module = require('./lib/sdk/module');
exports.sdk.git = require('./lib/sdk/git');
exports.root = __dirname;