var log = require('./utils/log');
var util = require('util');
var camelCase = require('camel-case');

exports.createJsonFile = function(pkg){
	var tmpl = {
		name:pkg.name,
		version:pkg.version || '1.0.0',
		spm:{
			main:pkg.name+'.js',
			dependencies:pkg.deps,
			buildArgs:_formatBuildArgs(pkg)
		}
	};
	
	return JSON.stringify(tmpl);
	
	//构建参数
	function _formatBuildArgs(pkg){
		log.debug('args',pkg.fullDeps);
		var fullDeps = pkg.fullDeps;
		var skipable = [];
		var args = '--include all';
		
		//计算可以忽略的模块
		for(var i = 0;i<fullDeps.length;i++){
			var dep = fullDeps[i];
			if(dep.indexOf('!skip')>0){
				skipable.push(dep.split('@')[0]);
			}	
		}
		
		if(skipable.length)
		args += ' --skip '+skipable.join(',');
		
		return args;
	}
};

exports.createIndexFile = function(pkg){
	var tmpl = '';
	for(var k in pkg.deps){
		tmpl += util.format("exports.%s = require('%s');",camelCase(k),k);
	}
	log.debug('indexFile',tmpl);
	return tmpl;
	
};

exports.createHtmlFile = function(){
	
};
