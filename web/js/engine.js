/*global window */
/*global io */
/*global $ */
/*global localStorage */
/*global clearInterval */
/*global setTimeout */
/*global setInterval */

(function() {
	var socket = io.connect('http://buzz.wedding:8080');
	window.Buzz = {};
	
	window.Buzz.iosocket = socket;
	
	window.Buzz.chosenAnswer = -1;
	
	window.Buzz.handlers = {};
	
	//window.Buzz.handlers["global"] = {};
	window.Buzz.handlers.h_btnSettings = function() {
			
			$.mobile.changePage("account.html");
	};
	
	window.Buzz.handlers.i_btnRegister = function() {
			$.mobile.changePage("account.html");
	};
	
	window.Buzz.handlers.acc_btnSave = function(){
		var obj = {};
		obj.action = "register";
		obj.username = $("#inUsername").val();
		obj.language = $("#selLanguage").val();
		
		if (localStorage.loginHash) {
			obj.loginHash = localStorage.loginHash;
		}
		
		socket.emit("registration", obj);
	};
	
	window.Buzz.handlers.app_btnSubmit = function() {
		if (window.Buzz.chosenAnswer >= 0 && window.Buzz.chosenAnswer <= 3) {
			if (localStorage.language == "chinese") {
				$("#voteConfimationMsg").html("投票成功");
			} else if (localStorage.language == "portuguese") {
				$("#voteConfimationMsg").html("Voto registado!");
			} else {
				$("#voteConfimationMsg").html("Vote submitted!");
			}
			$("#voteConfirmationDiv").slideDown();
			
			socket.emit("answer", {username:localStorage.username,hash:localStorage.loginHash,answer:window.Buzz.chosenAnswer});
		}
	};
	
	window.Buzz.functions = {};
	
	window.Buzz.functions.loginCheck = function() {
		// If we have local login data, verify it
		if (localStorage.loginHash) {
			socket.emit("registration", {action:"checkHash",loginHash:localStorage.loginHash});
			return;
		}
		
		// Otherwise ask for status
		socket.emit("status",{});
	};
	
	window.Buzz.functions.pagebeforeshow = {};
	
	window.Buzz.functions.pagebeforeshow.account = function() {
		if (localStorage.username) {
			$("#inUsername").val(localStorage.username);
		}	
	};
	
	window.Buzz.functions.pagebeforeshow.account = function() {
		if (localStorage.username) {
			$("#inUsername").val(localStorage.username);
		}	
	};
	
	window.Buzz.functions.pagebeforeshow.intro = function() {
		if (localStorage.username) {
			if (localStorage.language == "chinese") {
				$("#i_lblMessage").html("谢谢 <strong>"+localStorage.username+"</strong>！ 游戏马上开始。");
			} else if (localStorage.language == "portuguese") {
				$("#i_lblMessage").html("Obrigado <strong>"+localStorage.username+"</strong>! O jogo vai começar dentro de momentos.");
			} else{
				$("#i_lblMessage").html("Thanks <strong>"+localStorage.username+"</strong>! The game will start momentarily.");
			}
		} else {
			if (localStorage.language == "chinese") {
				$("#i_lblMessage").html("欢迎欢迎，请输入一个用户名。");
			} else if (localStorage.language == "portuguese") {
				$("#i_lblMessage").html("Bemvindo! Escolhe um nome de utilizador.");
			} else{
				$("#i_lblMessage").html("Welcome stranger! Please choose a username.");
			}
		}
	};
	
	window.Buzz.callbacks = {};
	
	window.Buzz.callbacks.intro = function() {
		if (window.pageID != "intro" ) {
			$.mobile.changePage("index.html");
		} else {
			
		}
	};
	
	window.Buzz.callbacks.account = function() {
			if (window.pageID != "account" ) {
				$.mobile.changePage("account.html");
			} else {
				
			}
	};
	
	window.Buzz.callbacks.graph = function (data) {
			if (window.pageID != "graph" ) {
				$.mobile.changePage("graph.html");
			} else {
				var graphData = [];
				graphData[0] = [];
				
				var answersArray = data.answers;
				if (localStorage.language == "chinese") {
					answersArray = data.answers_cn;
				} else if (localStorage.language == "portuguese") {
					answersArray = data.answers_pt;
				}
				
				$.each( data.results, function(i, n){
					graphData[0].push([answersArray[i],n]);
				});
				
				if (localStorage.language == "chinese") {
					$("#graphTitle").html("\""+data.question_cn+"\" 的投票结果");
				} else if (localStorage.language == "portuguese") {
					$("#graphTitle").html("Resultados para \""+data.question_pt+"\"");
				} else {
					$("#graphTitle").html("Results for \""+data.question+"\"");
				}
				
				$("#pie1").empty();
				
				$.jqplot('pie1', graphData, {
					gridPadding: {top:0, bottom:38, left:0, right:0},
					seriesDefaults:{
						renderer:$.jqplot.PieRenderer, 
						trendline:{ show:false }, 
						rendererOptions: { padding: 8, showDataLabels: true }
					},
					legend:{
						show:true, 
						placement: 'outside', 
						rendererOptions: {
							numberRows: 1
						}, 
						location:'s',
						marginTop: '15px'
					}       
				});
			}
	};
		
	window.Buzz.callbacks.photo = function (data) {
				if (window.pageID != "photo" ) {
					$.mobile.changePage("photo.html");
				} else {
					$("#photoSlot").html("<img style=\"width:100%;\" src=\"photos/"+data.photoName+"\" />");
				}
	};
	
	window.Buzz.callbacks.question = function (questionData) {
			if (window.pageID != "question" ) {
				$.mobile.changePage("question.html");
				return;
			}
			
			if (localStorage.language == "chinese") {
				$("#app_btnSubmit"+" .ui-btn-text").html("投票");
			} else if (localStorage.language == "portuguese") {
				$("#app_btnSubmit"+" .ui-btn-text").html("Submeter");
			} else {
				$("#app_btnSubmit"+" .ui-btn-text").html("Submit");
			}
			
			var questionText = questionData.question;
			var answers = questionData.answers;
			
			if (localStorage.language == "chinese") {
				questionText = questionData.question_cn;	
				answers = questionData.answers_cn;
			} else if (localStorage.language == "portuguese") {
				questionText = questionData.question_pt;
				answers = questionData.answers_pt;
			}
			
			$("#questionTitle").html(questionText);
		
			$.each(answers, function(index, value) {
				index++;
				$("#answer"+index).unbind();
				$("#answer"+index).click((function(idx, socket){
						return function (e) {
								e.stopImmediatePropagation();
								e.preventDefault();
					
								for (var i=1;i<=4;i++)
									$("#answer"+i).buttonMarkup({ theme: "a" , icon:""});
								
								$(this).buttonMarkup({ theme: "c" , icon:"check"});
								idx--;
								window.Buzz.chosenAnswer = idx;
						};
					})(index, socket)
				);

				$("#answer"+index+" .ui-btn-text").html(value);
				$("#answer"+index).css("display","block");
			});
		
			
			if (window.tickID !== null) {
				clearInterval(window.tickID);
			}
			window.tickID = setInterval((function(secondsLeft) {
					return function() {
						secondsLeft--;
						if (secondsLeft === 0) {
							clearInterval(window.tickID);
							delete(window.tickID);
							
							setTimeout((function(){
								return function() {
									window.iosocket.emit("status", {});
								};
							})(),3000);
						}
						if (localStorage.language == "english") {
							$("#timeLeft").html("Time left: "+secondsLeft+" seconds.");
						} else if (localStorage.language == "chinese") {
							$("#timeLeft").html("还剩"+secondsLeft+"秒.");
						} else if (localStorage.language == "portuguese") {
							$("#timeLeft").html("Tempo restante: "+secondsLeft+" segundos.");
						}  
					};
				})(questionData["secondsLeft"]),1000);
			
			$("#lblUsername").html(localStorage.username);
		
		
	};
	
	window.Buzz.callbacks.registration = function(data) {
		if (data.status == "success") {
			localStorage.loginHash = data.loginHash;
			localStorage.username = data.username;
			localStorage.language = data.language;
			
			socket.emit("status", {});
			
			return;
		}
		
		if (data.status == "error") {
			// Show error
			if (data.error == "nonexistant_hash") {
				
			} else if (data.error == "empty_hash") {
				// This really shouldn't happen, just preventing smartass hackers
				
			} else if (data.error == "user_exists") {
				// Self-explanatory
				$("#usernameErrorDiv").slideDown();
			}
			
			// Eh screw it, just delete it always and recheck
			delete localStorage.loginHash;
			delete localStorage.username;
			socket.emit("status",{});
		}
	};
	
	window.Buzz.callbacks.final = function(data) {
		if (window.pageID != "final" ) {
			$.mobile.changePage("final.html");
			return;
		}
		
		var secondPlace = "";
		var thirdPlace = "";
		
		var points = "";
		
		if (localStorage.language == "chinese") {
			secondPlace = "亚军 ";
			thirdPlace = "季军 ";
			
			points = "分";
			
			$("#finalTitle").html("冠军是。。。");
		} else if (localStorage.language == "portuguese") {
			secondPlace = "Segundo lugar: ";
			thirdPlace = "Terceiro lugar: ";
			
			points = "pontos";
			
			$("#finalTitle").html("O vencedor é...");
		} else {
			secondPlace = "Runner up: ";
			thirdPlace = "Third place: ";
			
			points = "points";
			
			$("#finalTitle").html("The winner is...");
		}
		
		secondPlace += data.top[1].username+" [ "+data.top[1].points + " " + points+" ]";
		thirdPlace += data.top[2].username+" [ "+data.top[2].points + " " + points + " ]";
		
		$("#secondPlace").html(secondPlace);
		$("#thirdPlace").html(thirdPlace);
		
		$("#divWinner").html(data.top[0].username+" [ "+data.top[0].points + " " + points+" ]");
	};
	
	// TODO: Redirect based on rules
	function StatusReply(trigger) {
		this.go = (function() {
			return function(data) {
				var noLoginPages = {intro:"index.html"};
				
				if (trigger in noLoginPages) {
					$.mobile.changePage(noLoginPages[trigger]);
					return;
				}
				
				if (trigger == "registration") {
					window.Buzz.callbacks[trigger](data);
					return;
				}
				
				if (localStorage.username == null || localStorage.loginHash == null) {
					$.mobile.changePage("account.html");
					return;
				}
				
				window.Buzz.callbacks[trigger](data);
				return;
			};
		})();
	}
	
	window.Buzz.initializeCallbacks = function() {
		//socket.on("account", window.Buzz.callbacks["account"]);
		
		socket.on("intro", new StatusReply("intro").go);
		
		socket.on("registration", new StatusReply("registration").go);
		
		socket.on("question",new StatusReply("question").go);
	
		var photoName = "";
		socket.on("photo", new StatusReply("photo").go);
		
		socket.on("graph", new StatusReply("graph").go);
		
		socket.on("final", new StatusReply("final").go);
		
		// socket.on("intro", window.Buzz.callbacks["intro"]);
// 		
		// socket.on("registration", window.Buzz.callbacks["registration"]);
// 		
		// socket.on("question",window.Buzz.callbacks["question"]);
// 	
		// var photoName = "";
		// socket.on("photo", window.Buzz.callbacks["photo"]);
// 		
		// socket.on("graph", window.Buzz.callbacks["graph"]);
	}
    
	window.onload = function() {
		window.Buzz.functions.loginCheck();
    	window.Buzz.initializeCallbacks();
	}
})();