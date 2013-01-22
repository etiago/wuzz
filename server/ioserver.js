var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

var crypto = require('crypto')
  , shasum = crypto.createHash('sha1');

// app.js
var databaseUrl = "buzz"; // "username:password@example.com/mydb"
var collections = ["questions","configs","status","steps","users"]
var db = require("mongojs").connect(databaseUrl, collections);

app.listen(80);

//var redis = require("redis"),
//redisClient = redis.createClient();

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

function RegistrationClosure(socket, data, user_by_hash) {
	this.go = (function() {
		return function(err, user) {
			if (user == null) {
				shasum = crypto.createHash('sha1');
		        shasum.update(data.username);
		
		        var retObj = new Object();
		        retObj.status = "success";
		        retObj.loginHash = shasum.digest("hex");
		        retObj.username = data.username;
				
				var language = "english";
				if (data.language == "chinese") {
					language = "chinese";
				} else if (data.language == "portuguese") {
					language = "portuguese";
				}
				
				if (user_by_hash != null) {
					user_by_hash.username = data.username;
					user_by_hash.hash = retObj.loginHash;
					user_by_hash.nameChanges++;
					user_by_hash.language = language;
					
					db.users.save(user_by_hash);	
				} else {
					db.users.save({username: data.username, hash: retObj.loginHash, language: language, nameChanges: 0, correctAnswers: 0});
				}
		        
		        retObj.language = language;
				socket.emit("registration", retObj);
				return;
			} else {
				var retObj = new Object();
		
				retObj.status = "error";
				retObj.error = "user_exists";
		
				socket.emit("registration", retObj);
		
				return;
			}
		};
	})();
}

io.sockets.on('connection', function(socket) {
	socket.on('status', (ioEventStatus(socket, false)));
	
	socket.on('answer', (function(socket){
		return function(data) {
			console.log("Got an answer with data %j",data);
			
			db.users.findOne({username:data.username,hash:data.hash}, (function(socket,data) {
				return function(err, user) {
					if (user != null) {
						console.log("User is not null and is %j", user);
						
						var stepsCursor = db.steps.find().limit(1).sort({step:"1"}, (function(socket,data,user){
							return function(err, step) {
								step = step[0];
								
								console.log("Found the step %j",step);
								
								if (step.screen != "question") {
									// We're not answering questions... skip?
									
									return;
								}
								
								db.questions.findOne({_id:step.fkey}, (function(socket,data,user) {
									return function(err, question) {
										console.log("Found the question %j",question);
										
										if (!question.hasOwnProperty("participants")) {
											question.participants = [];
										}
										
										if (question.participants.indexOf(user.username)!=-1) {
											// Already responded, do nothing.
											console.log("Already responded");
											
											return;
										}
										
										if (data.answer >= question.answers.length || data.answer < 0) {
											// Out of bounds, ignore.
											console.log("Out of bounds");
											return;
										}
										
										
										
										if (!question.hasOwnProperty("results")) {
											question.results = new Object();
										}
										
										if (!question.results.hasOwnProperty(data.answer)) {
											question.results[data.answer] = [];
										}
										
										if (!question.hasOwnProperty("result_count")) {
											question.result_count = new Object();
										}
										
										if (!question.result_count.hasOwnProperty(data.answer)) {
											question.result_count[data.answer] = 0;
										}
										
										question.participants.push(user.username);
										
										question.results[data.answer].push(user.username);
										
										question.result_count[data.answer] += 1;
										
										db.questions.save(question);
										
										if (question.rightanswer == data.answer) {
											user.correctAnswers++;
											
											db.users.save(user);
										}
										
										console.log("updated");
									};
								})(socket,data,user));
							};
						})(socket,data,user));
					} else {
						// Couldn't find user. Do nothing?
						console.log("User is null.");
						
					}
				};
			})(socket,data));
		};
	})(socket));
	
	socket.on('registration', (function(socket) { 
		return function(data) {
			if (data.action == "register") {
				if (data.loginHash != null) {
					db.users.findOne({hash:data.loginHash},(function(socket,data) {
						return function(err, user) {
							if (user != null && data.username != "") {
								db.users.findOne({username:data.username}, new RegistrationClosure(socket,data,user).go);

								return;
							} else {
								var retObj = new Object();
								retObj.status = "error";
								retObj.error = "nonexistant_hash";
							
								socket.emit("registration", retObj);
								return;
							}
						};
					})(socket,data));
					
					return;
				}
				
				if (data.username != null) {
					db.users.findOne({username:data.username},new RegistrationClosure(socket,data).go);
					
					return;
				}				
			}

			if (data.action == "checkHash") {
				var retObj = new Object();
				if (data.loginHash === "") {
					retObj.status = "error";
					retObj.error = "empty_hash";

					socket.emit("registration", retObj);
					return;
				}
				
				db.users.findOne({hash:data.loginHash},(function(socket) {
					return function(err,user) {
						var retObj = new Object();
						if(user === null) {
							retObj.status = "error";
							retObj.error = "nonexistant_hash";
						} else {
							retObj.status = "success";
							retObj.username = user.username;
							retObj.loginHash = user.hash;
							retObj.language = user.language;
						}

						socket.emit("registration", retObj);
						return;
					}
				})(socket));

				
			}
		};
	})(socket));

	db.configs.findOne({_id:"private_key"}, (setCommandHook(socket)));
	//redisClient.get("private_key", (setCommandHook(socket)));
});

function setCommandHook(sck) {
	return function(err, config) {
        	sck.on(config.value, (processCommand(sck)));
	};
}

function processCommand(sck) {
	return function(data) {
		if (data["command"] == "next") {
			nextCommand(sck);
		}     
	};
}

function nextCommand(sck) {
	var payload = new Object();

	var stepsCursor = db.steps.find().limit(1).sort({step:"1"},(function(socket){
		return function(err, step) {
			db.steps.remove(step[0]);
			
			(ioEventStatus(sck, true))();
		};
	})(sck));
	
	//db.steps.update({_id:1},{$set:{step:next}});
}

function ioEventStatus(sck, broadcast) {
	return function(data) {
		// var stepsCursor = db.steps.find()
		// stepsCursor.sort({step:"1"}).limit(1);
// 		
		// cursor.nextObject((function(socket,data,broadcast){
			// return function(err, step) {
				// if (step === null) return;
// 				
// 				
			// }
		// })());
							
		// db.status.findOne({_id:1},(function(sck, broadcast) {                                      
			// return function(err, status) {
				// if (status === null) return;

                emitPayload(sck, broadcast);
            // };
        // })(sck, broadcast));
     };
}

function emitPayload(sck, broadcast) {
	console.log("Emitting payload.");
	var payload = new Object();

	var stepsCursor = db.steps.find().limit(1).sort({step:1}, (function(socket,payload, broadcast){
		return function(err, step) {
				step = step[0];
								
				payload.secondsLeft = step.seconds_left;

				if (step.screen == "intro") {
					if (broadcast) {
						io.sockets.emit("intro", {});
					} else {
						sck.emit("intro", {});
					}
				} else if (step.screen == "question") {
                	payload.questionName = "question"+step.fkey;

        			db.questions.findOne({_id:step.fkey}, (function(payload, broadcast) {
                			return function(err, question) {
                					console.log("Question to emit: %j", question);
                        			payload.question = question.text;
                        			payload.answers = question.answers;
                        			payload.question_cn = question.text_ch;
                        			payload.answers_cn = question.answer_ch;
                        			payload.question_pt = question.text_pt;
                        			payload.answers_pt = question.answer_pt;
                        			
                        			if (broadcast) {
                        				// This is better than sck.broadcast as it emits to client too
                        				io.sockets.emit("question", payload);
                        			} else {
                        				sck.emit("question",payload);
                        			}
                        			
                        			console.log("Emitted this: %j. Broadcast: "+broadcast,payload);
                			};
        			})(payload, broadcast));
    			} else if (step.screen == "graph") {
	    			db.questions.findOne({_id:step.fkey}, (function(payload, broadcast) {
	            			return function(err, question) {
	                    			payload.question = question.text;
	                    			payload.answers = question.answers;
	                    			payload.results = question.result_count;
	                    			payload.question_cn = question.text_ch;
                        			payload.answers_cn = question.answer_ch;
                        			payload.question_pt = question.text_pt;
                        			payload.answers_pt = question.answer_pt;
                        			
	                    			if (broadcast) {
	                    				io.sockets.emit("graph", payload);
	                    			} else {
	                    				sck.emit("graph", payload);
	                    			}
	            			};
	    			})(payload, broadcast));
    			} else if (step.screen == "photo") {
					payload.photoName = step.fkey+".jpg";
					
					if (broadcast) {
						io.sockets.emit("photo", payload);
					} else {
						sck.emit("photo", payload);
					}
				}
				
			};
		})(sck, payload, broadcast)
	);
}
