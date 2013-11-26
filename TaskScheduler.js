// API



var fs = require('fs');
var redis = require("redis");
var txClient = redis.createClient();
var rxClient = redis.createClient();

var reactions = {};

rxClient.on("message", function (channel, message) {
	if (reactions[channel + "|" + message]) {
		reactions[channel + "|" + message].callback(reactions[channel + "|" + message].subroutine);
	}
});


// Redis
// ==> Caveats
// To have launchd start redis at login:
//     ln -sfv /usr/local/opt/redis/*.plist ~/Library/LaunchAgents
// Then to load redis now:
//     launchctl load ~/Library/LaunchAgents/homebrew.mxcl.redis.plist
// Or, if you don't want/need launchctl, you can just run:
//     redis-server /usr/local/etc/redis.conf
// ==> Summary


// An instruction is a message issued with a context on which that message is to take effect.
var Instruction = function (channel, message) {
	
	this.channel = channel;
	this.message = message;
	
};

Instruction.prototype = {
	start: function () {
		txClient.publish(this.channel, this.message);
	}
};

// A reaction will run when a messge is received in the channel specified
// It will trigger the execution of a subroutine that branches from the subroutine in motion.
var Reaction = function (channel, message, subroutine) {

	this.channel = channel;
	this.message = message;
	this.subroutine = subroutine;
	
};

// A subroutine is composed of a sequence of instructions that will be executed in a linear order.
var Subroutine = function (name, description, sequence) {

	this.name = name;
	this.description = description;
	this.sequence = sequence || [];
	this.reactions = [];
	
};

Subroutine.prototype = {

	addInstruction: function (instruction) {
		this.sequence.push(instruction);
	},
	
	addReaction: function (reaction) {
		this.reactions.push(reaction);
	},
	
	start: function () {
	
		for (var i = 0, len = this.sequence.length; i < len; i += 1) {
			
			this.sequence[i].start();
			
		}
		
		for (var i = 0, len = this.reactions.length; i < len; i += 1) {
			

			var reaction = this.reactions[i];
			
			reactions[reaction.channel + "|" + reaction.message] = {
			
				callback: function (subroutine) {
					subroutine.start();
				},
				subroutine: reaction.subroutine
				
			};
			
			rxClient.subscribe(reaction.channel);
			// rxClient.on(reaction.channel, function (reaction) {
// 				return function (message) {
// 					console.log(message);
// 					if (message == reaction.message) {
// 						reaction.subroutine.start();
// 					}
// 				}
// 			}(reaction));
			
			// registerCallback(reaction.channel, reaction.message, function (subroutine) { subroutine.start(); });
			
		}
		
	}
	
};

// A task is a unit work described that composes a procedural set of subroutines.
var Task = function (name, description, subroutines) {
	
	this.name = name;
	this.description = description;
	this.subroutines = subroutines || [];
	
};

Task.prototype = {
	
	addSubroutine: function (subroutine) {
		this.subroutines.push(subroutine);
	},
	
	start: function () {
		
		for (var i = 0, len = this.subroutines.length; i < len; i += 1) {
			
			this.subroutines[i].start();
			
		}
		
	}
	
};

// A map of temporal relationships to objects.
var Schedule = function (onEntryCallback) {
	this.onEntryCallback = onEntryCallback || function () {console.error("No onEntryCallback");};
	this.temporalMap = {};
	
	this.addSingleEntry(
		(new Date()*1),
		{
			name:"power on self test"
		}
	);
	
	this.start();
};

Schedule.prototype = {
	
	start: function () {
		setInterval(function (that) {
			
			var self = that;
			
			return function () {

				for (var item in self.temporalMap) {
					
					var time = item;
					
					if (time*1 < new Date()*1) {
						// console.log(time*1, new Date()*1);
						

						
					
						if (self.temporalMap[time].nextInterval > 0) {
							console.log(time);
							self.temporalMap[(new Date()*1 + self.temporalMap[time].nextInterval)] = self.temporalMap[time];
							
							self.onEntryCallback(
								self.temporalMap[time*1].payload
							);
							
							delete self.temporalMap[time];
							
						}
						
						else {
							
							self.onEntryCallback(
								self.temporalMap[time*1].payload
							);
							
							delete self.temporalMap[time];
							
						}
						
						
					}
				}
			}
		}(this), 15)
	},

	addRepeatingEntry: function (date, frequency, data) {
		date = date * 1;
		this.temporalMap[date*1] = {
			nextInterval: frequency,
			payload: data
		};
		
	},
	
	addSingleEntry: function (date, data) {
		date = date * 1;
		this.temporalMap[date] = {
			nextInterval: -1,
			payload: data
		};
		
	}
	
};

var TaskScheduler = function () {
	
	this.schedule = new Schedule(function (that) {
		var self = that;
		return function () {
			self.onEvent.call(self, arguments[0]);
		};
	}(this));
	
};

TaskScheduler.prototype = {
	
	parseTask: function (taskData) {
	
	
	
		var task = new Task(taskData.name, taskData.description);
		
		for (var p = 0, plen = taskData.subroutines.length; p < plen; p += 1) {

			task.addSubroutine(this.parseSubroutine(taskData.subroutines[p]));

		}
	
		return task;
		
	},
	
	
	parseSubroutine: function (subroutineData) {
	
	
			var subroutine = new Subroutine(subroutineData.name, subroutineData.description);
			
			
			for (var s = 0, slen = subroutineData.sequence.length; s < slen; s += 1) {
				
				subroutine.addInstruction(
					this.parseInstruction(subroutineData.sequence[s])
				);
				
			}
			
			
			for (var r = 0, rlen = subroutineData.reactions.length; r < rlen; r += 1) {
				
				subroutine.addReaction(
					this.parseReaction(subroutineData.reactions[r])
				);
				
			}
			
			return subroutine;
			
	
		
	},
	
	
	parseInstruction: function (subroutineData) {

		var instruction = new Instruction(subroutineData.channel, subroutineData.message);
		
		return instruction;
		
	},
	
	parseReaction: function (reacitonData) {
		// for (var r = 0, rlen = subroutines.reactions.length; r < rlen; r += 1) {
			
			// var reactionData = subroutines.reactions[r];
			
			var reaction = new Reaction(
								reacitonData.channel,
								reacitonData.message,
								this.parseSubroutine(
									reacitonData.subroutine
								)
							);
			
			
							return reaction;
			
		// }
	},
	
	loadTasks: function (path) {
		var tasks = fs.readFileSync(path);
		tasks = JSON.parse(tasks);
		
		for (var t = 0, tlen = tasks.length; t < tlen; t += 1) {
			
			var taskData = tasks[t];
			
			var task = this.parseTask(taskData);
			this.scheduleTask(task, new Date(), taskData.frequency);
			
		}
		
		console.log(tasks);
	},

	onEvent: function (task) {
		if (task instanceof Task) {
			task.start();
		}
		else
		{
			console.error("TaskScheduler#onEvent", "Not a task.");
		}
	},
	
	scheduleTask: function (task, time, repeat) {
		
		if (repeat) {
			this.schedule.addRepeatingEntry(time, repeat, task);
		}
		else
		{
			this.schedule.addSingleEntry(time, task);
		}
	}
	
};


var a = new TaskScheduler();

a.loadTasks("tasks.json");