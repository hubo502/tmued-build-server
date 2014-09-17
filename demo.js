var fs = require('fs');
var dst = 'configs.sample.js';
var Main = require('./tm/main');
var log = require('./tm/utils/log');
var app_configs = require('./tm/utils/configs');

log.config({verbose:true,color:true});

//测试模式,配置文件通过文件读取
fs.readFile(dst, function (err, data) {
  if (err) throw err;
  var buildParams = JSON.parse(String(data));
  Main.build(buildParams);
});