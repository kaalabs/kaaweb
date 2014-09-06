var sys = require('sys');
var net = require('net');
var plugwiseApi = require('./plugwise');
var mqtt = require('mqtt');
var client = mqtt.createClient(1883, '192.168.2.10');

var plugwise = plugwiseApi.init({
	log: 1,
	serialport: '/dev/ttyUSB1'
}); // connect to your usb port


client.subscribe('/if.plugwise/+/CMD');

client.on('connect', function(){
	client.subscribe('/if.plugwise/+/CMD');
	client.on('message', function(topic, message) {
		console.log('MQTT Plugwise Message received: ' + topic + ' ' + message);
		var elmarr = topic.split("/");
		var alength = elmarr.length;
		var pwmac = elmarr[2];
		var pwcommand = message;
		console.log('Plugwise MAC: ' + pwmac + ' ' + pwcommand);
		var appliance = plugwise(pwmac);
		if (pwcommand === 'ON') {
			appliance.poweron();
			console.log('Plugwise command ON has been sent');
		}
		if (pwcommand === 'OFF') {
			appliance.poweroff();
			console.log('Plugwise command OFF has been sent');
		}
		if (pwcommand === 'INFO') {
			appliance.powerinfo(function(result) {
				var verbruik = 0.001;
				if (isNaN(result.watt) === false) {
					verbruik = result.watt;
				}
				console.log('Power info: ', verbruik.toString());
				var topic = '/if.plugwise/' + pwmac + '/STATUS/verbruik';
				client.publish(topic, verbruik.toString());
			});
		}
	});
});