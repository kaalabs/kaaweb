require('newrelic');
var fs = require('fs');
var Primus = require('primus');
var http = require('http');
var express = require('express');
var app = express(),
	bodyParser = require('body-parser'),
	errorHandler = require('errorhandler'),
	methodOverride = require('method-override'),
	port = parseInt(process.env.PORT, 10) || 8080;

var sys = require('sys');
var net = require('net');
var mqtt = require('mqtt');
var client = mqtt.createClient(1883, '192.168.2.10');
var stormpath = require('express-stormpath');

app.use(stormpath.init(app, {
	apiKeyFile: 'apiKey.properties',
	application: 'https://api.stormpath.com/v1/applications/22EY2HrW2LVxbPIPmNhFnL',
	secretKey: 'Potgieterstraat27',
	redirectUrl: '/kaaweb/index.html',
}));

app.get('/', stormpath.loginRequired, function(req, res) {
	//  app.get('/', function(req, res)  {
	res.redirect('/kaaweb/index.html');
	//    console.log('succes!!!!!');

});
app.get('/kaaweb', stormpath.loginRequired, function(req, res) {
	//  app.get('/', function(req, res)  {
	res.redirect('/kaaweb/index.html');
	//    console.log('succes!!!!!');
});

app.use('/kaaweb', express.static(__dirname + '/public'));

app.use(errorHandler({
	dumpExceptions: true,
	showStack: true
}));

app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

var httpServer = http.createServer(app),
	primus = new Primus(httpServer, {
		port: 8080,
		transformer: 'engine.io'
	});

//
// Listen to incoming socket data
//

primus.on('connection', function connection(spark) {
	console.log('primus connected');
	spark.on('data', function received(data) {
		if (data.room == 'subscribe') {
			console.log(spark.id, 'received message:', data);
			console.log('Subscribing to ' + data.topic);
			client.subscribe(data.topic);
		} else {
			if (data.room == 'publish') {
				console.log('Publishing topic: ' + data.topic + 'payload: ' + data.payload);
				client.publish(data.topic, data.payload);
			}
		}
	});

	//publish MQTT messages to Socket
	client.on('message', function(topic, message) {
		console.log(message);
		sys.puts(topic + '=' + message);
		spark.write({
			'room': 'mqtt',
			'topic': String(topic),
			'payload': String(message)
		});
	});
});
primus.library();
primus.save(__dirname + '/primus.js', function save(err) {});

httpServer.listen(port, function() {
	console.log('Open http://localhost:' + port + ' in your browser');
});
