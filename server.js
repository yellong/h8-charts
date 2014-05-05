var express = require('express');

var app = express();

app.use( express.static( __dirname ) );

app.listen(4040);
console.log('sever listen in port 4040');