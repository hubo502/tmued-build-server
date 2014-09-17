var Templates = require('./templates');
var Helpers = require('./helpers');
var Transport = require('./transports');
var Archive = require('./archive');
var Builder = require('./builder');
var log = require('./utils/log');
var eventBus = require('./event-bus');
/**
 * 构建主流程 
 * @param {Object} configs 用户的配置文件
 * @return {Stream}
 */
exports.build = function(configs){
	
	var args = {
		base:"workspaces",
		workspace:"_boris",
	};
	
	log.info('build','start');
	//获取计算依赖
	var deps = Helpers.calcDeps(configs);
	
	//生成待打包临时文件
	var pkgs = Helpers.generatePackages(deps,args);
	
	//执行打包
	Builder.start(pkgs);
	
	eventBus.on('build.complete',doArchive);
	
};

function doArchive(pkgs){
	log.debug('build.complete',pkgs);
}

function calcDeps(){
	
}