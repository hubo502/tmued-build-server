var spm = require('../spm');
var build = spm.tmued_build;
var log = require('./utils/log');
var path = require('path');
var eventBus = require('./event-bus');

var dest = path.join(spm.root,'workspaces','_boris','dist');

exports.start = function(pkgs) {
	if(pkgs.length == 0){
		eventBus.emit('build.complete',pkgs);
	}else{
		doBuild(pkgs,0);
		eventBus.on('build.done',buildDoneHandler);
	}
};

function buildDoneHandler(pkgs,idx){
	log.debug('next',pkgs,idx);

	if(pkgs[++idx] !== undefined){
		doBuild(pkgs,idx);
	}else{
		eventBus.emit('build.complete',pkgs);
	}
}

function doBuild(pkgs,idx){
	
	var src = pkgs[idx].src;
	
	log.debug('doBuild',src);
	var args = {};
	
	args.cwd = path.join(spm.root,src);
	args.dest = dest;
	args.install = true;

	build(args, function(err) {
		if (err) {
			log.error('error', err.message);
			log.debug('error', err.stack);
			process.exit(1);
		}

		log.info('finish', 'building');
		eventBus.emit('build.done',pkgs,idx);
	});
};
