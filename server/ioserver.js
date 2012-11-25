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
		return new function(err, user) {
			if (user == null) {
				shasum = crypto.createHash('sha1');
		        shasum.update(data.username);
		
		        var retObj = new Object();
		        retObj.status = "success";
		        retObj.loginHash = shasum.digest("hex");
		        retObj.username = data.username;
		
				if (user_by_hash != null) {
					user_by_hash.username = data.username;
					user_by_hash.loginHash = retObj.loginHash;
					user_by_hash.nameChanges++;
					
					db.users.save(user_by_hash);	
				} else {
					db.users.save({username: data.username, hash: retObj.loginHash, nameChanges: 0});
				}
		        
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
	
	socket.on('registration', (function(socket) { 
		return function(data) {
			if (data.action == "register") {
				if (data.loginHash != null) {
					db.users.findOne({hash:data.loginHash},(function(socket,data) {
						return function(err, user) {
							if (user != null && data.username != "") {
								db.users.findOne({username:data.username}, new RegistrationClosure(socket,data,user_by_hash).go);

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
						}

						socket.emit("registration", retObj);
						return;
					}
				})(socket));

				
			}
		};
	})(socket));

	socket.on('answer', (function(socket) { 
		return function(data) {
			
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
			db.status.findOne({_id:1}, (nextCommand(sck)));
		}     
        };
}

function nextCommand(sck) {
	return function(err, status) {
		var next = status.step+1;
		
		db.status.update({_id:1},{$set:{step:next}});

		(ioEventStatus(sck, true))();
	}
}

function ioEventStatus(sck, broadcast) {
	return function(data) {
		db.status.findOne({_id:1},(function(sck, broadcast) {                                      
                                                return function(err, status) {
                                                		if (status === null) return;
                                                                emitPayload(sck, status, broadcast);
                                                        };
                                        })(sck, broadcast));
         };
}

function emitPayload(sck, data, broadcast) {
	if (data === null) return;

	var payload = new Object();
	payload.secondsLeft = data.seconds_left;

	db.steps.findOne({step:data.step}, (function(payload, broadcast) {
			return function(err, step) {
				if (step.screen == "question") {
                			payload.questionName = "question"+step.fkey;

                			db.questions.findOne({_id:step.fkey}, (function(payload, broadcast) {
                        			return function(err, question) {
                                			payload.question = question.text;
                                			payload.answers = question.answers;
                                			if (broadcast) {
                                        			sck.broadcast.emit("question", payload);
                                			} else {
                                        			sck.emit("question",payload);
                                			}
                        			};
                			})(payload, broadcast));
        			} else if (step.screen == "graph") {
                			db.questions.findOne({_id:step.fkey}, (function(payload, broadcast) {
                        			return function(err, question) {
                                			payload.question = question.text;
                                			payload.answers = question.answers;
                                			payload.results = question.result_count;
                                			if (broadcast) {
                                        			sck.broadcast.emit("graph", payload);
                                			} else {
                                        			sck.emit("graph", payload);
                                			}
                        			};
                			})(payload, broadcast));
        			} else if (step.screen == "photo") {
					payload.photoName = step.fkey+".jpg";
					if (broadcast) {
                                        	sck.broadcast.emit("photo", payload);
                                        } else {
                                                sck.emit("photo", payload);
                                        }
				}
			};
		})(payload, broadcast)
	);

}
