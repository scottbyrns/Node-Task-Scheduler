var exec = require('child_process').exec;
var fs = require('fs');
var http = require('http');



var redis = require("redis");
var txClient = redis.createClient();
var rxClient = redis.createClient();

var reactions = {};

rxClient.on("message", function (channel, message) {
	if (reactions[channel + "|" + message]) {
		reactions[channel + "|" + message].callback(reactions[channel + "|" + message].subroutine);
	}
});

rxClient.subscribe("NASCOM");


reactions["NASCOM|FETCH-SDO-171A"] = {
	callback: function () {
		


		var fileWriteStream = fs.createWriteStream("./0171-" + new Date() + ".jpg");

		var options = {
		    host:'sdo.gsfc.nasa.gov',
		    port:80,
		    path:'/assets/img/latest/latest_4096_0171.jpg'
		};

		http.get(options,function(res){

		    res.on('data', function (chunk) {
		        fileWriteStream.write(chunk);
		    });

		    res.on('end',function(){
		        fileWriteStream.end();
				txClient.publish("NASCOM", "DID-FETCH-SDO-171A");
				console.log("File written. Sleeeping for 15 minutes.");
		    });
		});

		
	},
	subroutine: {}
}

reactions["NASCOM|STORE-SDO-171A"] = {
	callback: function () {
		txClient.publish("NASCOM", "DID-STORE-SDO-171A");
	},
	subroutine: {}
}

reactions["NASCOM|NOTIFY-SDO-171A-BEACON"] = {
	callback: function () {
		
		exec("terminal-notifier -message \"Nascom Beacon Received\" -title \"An update for the A151 beacon has been recorded.\"");
		
	},
	subroutine: {}
}

