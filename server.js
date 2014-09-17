var express = require('express');
var app = express();

app.get('/test', function(req, res){
  
  
  
  res.send('hello world');
});

app.listen(1234);