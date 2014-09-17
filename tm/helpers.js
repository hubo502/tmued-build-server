var log = require('./utils/log');
var path = require('path');
var fs = require('fs');
var repositoryPath = require('./utils/configs').get('repository');
var isEmpty = require('is-empty');
var union = require('array-union');
var clone = require('clone');
var mkdirp = require('mkdirp');
var rmdir = require('remove');
var templates = require('./templates');

//防止递归调用死循环
var repeat = 0;

//没有deps的节点
var endNodes = [];

/**
 * 计算依赖
 * @param {Object} pkgs 传入的配置数据
 * @returns {Object} 计算完成的配置信息
 */
exports.calcDeps = function(pkgs) {

	log.info('calcDeps start', 'calc ' + pkgs.length + ' module(s)');
	endNodes = [];

	//获取完整依赖
	for (var i = 0; i < pkgs.length; i++) {
		var pkg = pkgs[i];
		pkg.fullDeps = _calcFullDeps(pkg);
		log.info('full deps', '[' + pkg.name + ']', pkg.fullDeps.join(','));
	}

	//去除重复依赖
	for (var j = 0; j < pkgs.length; j++) {
		_skipDuplicateDeps(pkgs, pkgs[j]);
	}

	log.debug('calcDeps', 'result:', pkgs);
	log.info('calcDeps', "complete");

	return pkgs;
};

//计算一个包的完整依赖
function _calcFullDeps(pkg) {

	var foundDeps = [];
	foundDeps = _calcModuleDeps(_depToArr(pkg.deps), foundDeps);
	return foundDeps;

}

/**
 * 计算单个子模块的完整依赖
 * @param {Array} deps 单个模块的参数
 * @param {Object} found 已经找到的依赖
 * @return
 */
function _calcModuleDeps(deps, found) {

	log.debug('found', found.join(','));
	found = union(found, deps);
	for (var i = 0; i < deps.length; i++) {

		if (endNodes.indexOf(deps[i]) >= 0) {
			log.debug('endNode', deps[i]);
			continue;
		}

		var mdl = _decodeDep(deps[i]);
		var moduleName = mdl[0];
		var version = mdl[1];

		var foundDeps = _lookupDepsInRepository(moduleName, version);

		if (foundDeps.length > 0) {

			var prevLength = found.length;

			found = union(found, foundDeps);

			//用于防止a b相互依赖造成的死循环
			if (found.length == prevLength) {
				repeat++;
			}
			if (repeat > 100) {
				repeat = 0;
				break;
			}

			found = _calcModuleDeps(foundDeps, found);

		} else {
			endNodes.push(deps[i]);
		}
	}
	return found;
}

/**
 * 在库中查找模块的依赖
 * @param {String} moduleName
 * @param {String} version
 * @return {Object} 依赖列表  or NULL
 */
function _lookupDepsInRepository(moduleName, version) {
	var pkgPath = path.join(repositoryPath, moduleName, version, 'index.json');
	
	var foundDeps = _getDeps(fs.readFileSync(pkgPath));

	log.debug('deps', moduleName, '#[' + foundDeps.join(',') + ']');

	return foundDeps;
}

/**
 * 将依赖转换为['name@ver','...']的格式
 */
function _depToArr(obj) {
	var arr = [];
	for (var k in obj) {
		arr.push(_encodeDep(k, obj[k]));
	}
	return arr;
}

function _encodeDep(k, v) {
	return k + '@' + v;
}

function _decodeDep(str) {
	return str.split('@');
}

/**
 * 从json文件中获取依赖
 * @param {String} data 读取的json数据
 * @return {Object} or NULL
 */
function _getDeps(data) {

	var moduleInfo = JSON.parse(data) || {};
	var deps = {};

	if ( typeof moduleInfo.spm === 'object') {
		var _deps = moduleInfo.spm.dependencies;
		if (!isEmpty(_deps))
			deps = _deps;
	} else {
		log.warn(moduleInfo.name, 'spm not defined');
	}
	return _depToArr(deps);
}

/**
 * 处理重复的依赖
 * @param {Object} pkgs 所有配置信息
 * @param {Object} calcPkg  需要计算的包的配置信息
 */
function _skipDuplicateDeps(pkgs, calcPkg) {

	//log.debug('skipDuplicate',pkg.name);
	var requirePkgs = calcPkg.require;
	var depsInRequirePkgs = [];
	log.debug('calcSkip', 'current package:' + calcPkg.name);
	//如果当前包不依赖任何前置包,则返回
	if (requirePkgs.length == 0) {
		log.debug('calcSkip', calcPkg.name + ' does not require other package.');
		return;
	}

	//获取require中包的所有依赖
	for (var i = 0; i < requirePkgs.length; i++) {
		var requirePkgName = requirePkgs[i];
		var depsInRequirePkg = _getPkg(requirePkgName, pkgs).fullDeps;
		depsInRequirePkgs = union(depsInRequirePkgs, depsInRequirePkg);
	}

	//计算可忽略的依赖
	_calcSkipableDeps(calcPkg.fullDeps, depsInRequirePkgs);
	log.info('calcSkip', 'skipable:' + depsInRequirePkgs.join(','));
	log.info('calcSkip', calcPkg.fullDeps.join(','));
	log.info('calcSkip', 'complete');

}

/**
 * 计算可以忽略的依赖,标上!skip
 * @param {Array} dst 待计算的包
 * @param {Array} ref 前置包的完整依赖,如果这里面有,dst中的依赖可以被忽略
 */
function _calcSkipableDeps(dst, ref) {
	for (var i = 0; i < dst.length; i++) {
		var dep = dst[i];
		if (ref.indexOf(dep) >= 0) {
			dst[i] = _markSkipable(dst[i], true);
		}
	}
};

/**
 * 标注是否可忽略
 * @param {String} dep 依赖项
 * @param {Boolean} skipable 是否忽略
 */
function _markSkipable(dep, skipable) {

	//skipable未定义
	if ( typeof skipable !== 'boolean')
		return dep;

	if (skipable) {

		//可忽略,但是已有!skip标记
		if (dep.indexOf('!skip') > 0)
			return dep;

		//可忽略,没有!skip标记
		dep += '!skip';

	} else {

		//不可忽略,移除所有!skip标记
		dep = dep.replace(/!skip/g, '');

	}

	return dep;

}

/**
 * 从完整配置列表中获取指定的包
 * @param {String} name 要获取的包名
 * @param {Object} pkgs 完整包配置
 */
function _getPkg(name, pkgs) {

	var foundPkg = null;

	for (var i = 0; i < pkgs.length; i++) {
		if (pkgs[i].name == name) {
			foundPkg = pkgs[i];
			break;
		}
	}

	return foundPkg;
}

/**
 * 创建待打包文件
 * @param {Object} pkgs 依赖数据信息
 * @param {Object} args 打包的相关参数
 */
exports.generatePackages = function(pkgs, args) {

	var workspace = path.join(args.base, args.workspace);
	log.debug('generatePkg', pkgs);
	var srcs = [];
	
	mkdirp.sync(workspace);
	
	for (var i = 0; i < pkgs.length; i++) {
		pkgs[i].src = _createPackage(pkgs[i]);
	}

	function _createPackage(pkg) {
		log.debug('createPkg', pkg.name);
		var packagePath = path.join(workspace, pkg.name);
		_cleanDirSync(packagePath);
		var jsonFile  = templates.createJsonFile(pkg);
		var indexFile = templates.createIndexFile(pkg);
		
		fs.writeFileSync(path.join(packagePath,pkg.name+'.js'), indexFile);
		fs.writeFileSync(path.join(packagePath,'package.json'), jsonFile);
		
		return packagePath;
	}
	
	return pkgs;

};

/**
 * 创建目录,有内容则清空
 * @param {String} path
 */
function _cleanDirSync(path) {
	try {
		if (fs.existsSync(path)) {
			rmdir.removeSync(path);
		}
		mkdirp.sync(path);
	} catch(err) {
		log.error('cleanDir', err);
	}
}
