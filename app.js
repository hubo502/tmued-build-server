var express = require('express');
var app = express();

var packer = require('zip-stream');


app.engine('html',function(req,res,next){
	console.log('parse html %s %s', req.method, req.url);
	next();
});
app.all('*', requireAuthentication);

function requireAuthentication(){
	console.log('auth');
}

app.get('/', function(req, res) {
	res.send('hello world');
});

app.get('/test', function(req, res) {
	var archive = new packer();
	// OR new packer(options)
	archive.on('error', function(err) {
		res.send('error');
	});

	archive.entry('string contents', {
		name : 'test/string.txt'
	}, function(err, entry) {
		if (err)
			res.send('error');
			
		archive.entry(null, {
			name : 'directory/'
		}, function(err, entry) {
			if (err)
				res.send('error');
				
			archive.finish();
			archive.pipe(res);
		});
	});

});

app.listen(1234);
console.log('start listening....on 1234');
