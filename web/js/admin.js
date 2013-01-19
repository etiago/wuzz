(function() {
	var socket = io.connect('http://localhost:8080');
	
	window.BuzzAdmin = new Object();
	
	// window.BuzzAdmin.populateQuestion = function(questionTest, options) {
// 		
	// };
	
	window.BuzzAdmin.timers = new Object();
	
	window.BuzzAdmin.timers["introUpdate"] = function() {
		
	};
	
	window.BuzzAdmin.enabledTimers = new Object();
	
	window.BuzzAdmin.callbacks = new Object();
	
	window.BuzzAdmin.callbacks["intro"] = function(data) {
		// if (window.BuzzAdmin.enabledTimers["introUpdate"]) {
			// clearInterval(window.BuzzAdmin.enabledTimers["introUpdate"]);
// 			
		// }
		// window.BuzzAdmin.enabledTimers["introUpdate"] = setInterval(window.BuzzAdmin.timers.introUpdate,3000);
	};
	
	window.BuzzAdmin.callbacks["question"] = function(data) {
		alert("Got cb");
	};
	
	
	window.BuzzAdmin.ui = new Object();
	
	window.BuzzAdmin.ui.click = new Object();
	
	window.BuzzAdmin.ui.click["btnSaveConfigs"] = function() {
		window.BuzzAdmin.psk = $("#psk").val();
		$("#configs").slideUp();
	};
	
	window.BuzzAdmin.ui.click["btnWrench"] = function() {
		$("#configs").slideDown();
	};
	
	window.onload = function() {
		$("#btn_start").click(function() {
			$("#contents").slideUp();
			$("#contents").empty();
			
			socket.emit("status",{});
		});
		
		$("#btnSaveConfigs").click(window.BuzzAdmin.ui.click.btnSaveConfigs);
		$("#btnWrench").click(window.BuzzAdmin.ui.click.btnWrench);
		
		socket.on("intro", window.BuzzAdmin.callbacks.intro);
		socket.on("question",window.BuzzAdmin.callbacks.question);
		socket.on("graph",window.BuzzAdmin.callbacks.graph);
		socket.on("photo",window.BuzzAdmin.callbacks.question);
	}
})();