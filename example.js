var http = require('http');

var server = http.createServer(function (req, res) {
    res.end('Hello, world');
});

server.listen(process.env.PORT || 80);
