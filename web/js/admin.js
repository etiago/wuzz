(function() {
	var socket = io.connect('http://buzz.wedding:8080');
	
	window.BuzzAdmin = {};
	
	// window.BuzzAdmin.populateQuestion = function(questionTest, options) {
// 		
	// };
	
	window.BuzzAdmin.timers = {};
	
	window.BuzzAdmin.timers.introUpdate = function() {
		
	};
	
	window.BuzzAdmin.enabledTimers = {};
	
	window.BuzzAdmin.callbacks = {};
	
	window.BuzzAdmin.status = {};
	
	window.BuzzAdmin.status.currentWindow = "#contentsInit";
	
	window.BuzzAdmin.callbacks.intro = function() {

	};
	
	window.BuzzAdmin.callbacks.graph = function(data) {
		$(window.BuzzAdmin.status.currentWindow).slideUp();
		window.BuzzAdmin.status.currentWindow = "#contentsGraph";
		
		$("#progressMenu").show();
		$("#contentsGraph").slideDown();
		
		var graphData = [];
		graphData[0] = [];
		
		$.each( data.results, function(i, n){
			graphData[0].push([data.answers[i],n]);
		});
		$("#graphTitle").html("Results for \""+data.question+"\"");
		
		
		$("#graphImage").empty();
		
		$.jqplot('graphImage', graphData, {
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
	};

	window.BuzzAdmin.callbacks.photo = function(data) {
		$(window.BuzzAdmin.status.currentWindow).slideUp();
		window.BuzzAdmin.status.currentWindow = "#contentsPhoto"; 
		
		$("#photo").empty();
		$("#photo").append("<img class=\"photoImg\" src=\"photos/"+data.photoName+"\" />");
		
		$("#progressMenu").show();
		$("#contentsPhoto").slideDown();
	};
	
	window.BuzzAdmin.callbacks.question = function(data) {
		$(window.BuzzAdmin.status.currentWindow).slideUp();
		window.BuzzAdmin.status.currentWindow = "#contentsQuestion"; 
		
		$("#questionTitle").html(data.question);
		$("#answerList").empty();
		
		data.answers.forEach(function(answer) {
			$("#answerList").append("<li class=\"answerElement\">"+answer+"</li>");
		});
		
		
		// TODO: Need timer
		$("#progressMenu").show();
		$("#contentsQuestion").slideDown();
	};
	
	window.BuzzAdmin.callbacks["final"] = function(data) {
		$(window.BuzzAdmin.status.currentWindow).slideUp();
		window.BuzzAdmin.status.currentWindow = "#contentsFinish";
		
		$("#progressMenu").hide();
		$("#contentsFinish").slideDown();
		
		$("#divWinner").html(data.top[0].username + " [ "+data.top[0].points+" points]");
		
		$("#secondPlace").html("Runner-up: "+data.top[1].username + " [ "+data.top[1].points+" points]");
		$("#thirdPlace").html("Third place: "+data.top[2].username + " [ "+data.top[2].points+" points]");
	};
	
	window.BuzzAdmin.ui = {};
	
	window.BuzzAdmin.ui.click = {};
	
	window.BuzzAdmin.ui.click.btnSaveConfigs = function() {
		window.BuzzAdmin.psk = $("#psk").val();
		$("#configs").slideUp();
	};
	
	window.BuzzAdmin.ui.click.btnWrench = function() {
		$("#configs").slideDown();
	};
	
	window.BuzzAdmin.ui.click.btnStart = function() {
		if (!window.BuzzAdmin.psk) return;
		
		socket.emit(window.BuzzAdmin.psk, {command:"next"});
		//socket.emit("status",{});
	};
	

	
	window.onload = function() {
		$("#btnSaveConfigs").click(window.BuzzAdmin.ui.click.btnSaveConfigs);
		$("#btnWrench").click(window.BuzzAdmin.ui.click.btnWrench);
		$("#btnStart").click(window.BuzzAdmin.ui.click.btnStart);
		$("#btnNext").click(window.BuzzAdmin.ui.click.btnStart);

		socket.on("intro", window.BuzzAdmin.callbacks.intro);
		socket.on("question",window.BuzzAdmin.callbacks.question);
		socket.on("graph",window.BuzzAdmin.callbacks.graph);
		socket.on("photo",window.BuzzAdmin.callbacks.photo);
		socket.on("final",window.BuzzAdmin.callbacks.final);
	};
})();