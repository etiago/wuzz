(function() {
	var socket = io.connect('http://prometheus.fritz.box:80');
	window.Buzz = new Object();
	
	window.Buzz.iosocket = socket;
	
	window.Buzz.ui = new Object();
	window.Buzz.ui["btnChangeClick"] = function() {
			$.mobile.changePage("account.html");
	};
	
	window.Buzz.handlers = new Object();
	
	window.Buzz.handlers["account"] = new Object();
	window.Buzz.handlers["account"]["btnSave"] = function(e){

		socket.emit("registration", {action:"register",username:$("#inUsername").val()});
	};
	
	window.Buzz.functions = new Object();
	
	window.Buzz.functions["loginCheck"] = function() {
		//$("#btnSave").unbind();
		//$("#btnSave").click(window.Buzz.ui.btnSave);
			
		if (localStorage.loginHash) {
			socket.emit("registration", {action:"checkHash",loginHash:localStorage.loginHash});
		} else {
			$.mobile.changePage("account.html");
		}
	}
	
	window.Buzz.callbacks = new Object();
	
	window.Buzz.callbacks["account"] = function(data) {
			if (window.pageID != "account" ) {
				$.mobile.changePage("account.html");
			} else {
				
			}
	};
	
	window.Buzz.callbacks["graph"] = function (data) {
			if (window.pageID != "graph" ) {
				$.mobile.changePage("graph.html");
			} else {
				var graphData = new Array();
				graphData[0] = new Array();
				
				$.each( data.results, function(i, n){
					graphData[0].push([data.answers[i],n]);
				});
				$("#graphTitle").html("Results for \""+data.question+"\"");
				
				var plot1 = $.jqplot('pie1', graphData, {
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
	}
		
	window.Buzz.callbacks["photo"] = function (data) {
				if (window.pageID != "photo" ) {
					$.mobile.changePage("photo.html");
				} else {
					$("#photoSlot").html("<img style=\"width:100%;\" src=\"photos/"+data["photoName"]+"\" />");
				}
	};
	
	window.Buzz.callbacks["question"] = function (questionData) {
			if (window.pageID != "question" ) {
				$.mobile.changePage("app.html");
				return;
			}
			
			var questionText = questionData["question"];
			$("#questionTitle").html(questionText);
		
			$.each(questionData["answers"], function(index, value) {
				  index++;
				  $("#answer"+index).unbind();
				  $("#answer"+index).click((function(idx, socket){
				  			return function (e) {
									e.stopImmediatePropagation();
								    e.preventDefault();
		
									socket.emit("answer", {user:"xxx",answer:idx});
									
								    //Do important stuff....
							  };
				  		})(index, socket)
				  );
		
				  $("#answer"+index+" .ui-btn-text").html(value);
				  $("#answer"+index).css("display","block");
			});
		
			window.tickID = setInterval((function(secondsLeft) {
					return function() {
						secondsLeft--;
						if (secondsLeft == 0) {
							clearInterval(window.tickID);
							delete(window.tickID);
							
							setTimeout((function(){return function() {window.iosocket.emit("status", {})};})(),3000);
						}
						$("#timeLeft").html("Time left: "+secondsLeft+" seconds.");
						
						
					};
				})(questionData["secondsLeft"]),1000);
		$("#lblUsername").html(localStorage.username);
		
		
	};
	
	window.Buzz.callbacks["registration"] = function(data) {
		if (data["status"] == "success") {
			localStorage.loginHash = data["loginHash"];
			localStorage.username = data["username"];
			socket.emit("status", {});
			
			return;
		}
		
		if (data["status"] == "error") {
			// Show error
			if (data["error"] == "nonexistant_hash") {
				
			}	
			
		}
	};
	
	window.Buzz.initializeCallbacks = function() {
		//socket.on("account", window.Buzz.callbacks["account"]);
		socket.on("registration", window.Buzz.callbacks["registration"]);
		
		socket.on("question",window.Buzz.callbacks["question"]);
	
		var photoName = "";
		socket.on("photo", window.Buzz.callbacks["photo"]);
		
		socket.on("graph", window.Buzz.callbacks["graph"]);
	}
    
	window.onload = function() {
		window.Buzz.functions.loginCheck();
    	window.Buzz.initializeCallbacks();
	}
})();