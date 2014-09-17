var yaml_config = require('node-yaml-config');

var configs = yaml_config.load('./configs/base.yaml','development');

exports.get = function(key){
	return configs[key] || null;
};
