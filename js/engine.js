(function() {
    var loadMe = function() {
		window.onload = function() {
	        	var socket = io.connect('http://prometheus.espinha.pt:80');
	        	window.iosocket = socket;
	        	
			  	socket.on("question",function (questionData) {
			  		if (window.pageID != "question" ) {
						$.mobile.changePage("app.html");
						return;
					}
					
					var questionText = questionData["question"];
					$("#questionTitle").html(questionText);
				
					$.each(questionData["answers"], function(index, value) {
						  index++;
						  $("#answer"+index).click((function(idx){
						  			return function (e) {
											e.stopImmediatePropagation();
										    e.preventDefault();
										    alert("Clicked "+idx);
										    //Do important stuff....
									  };
						  		})(index)
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
					
				});
				
				var photoName = "";
				socket.on("photo", function (data) {
						if (window.pageID != "photo" ) {
							$.mobile.changePage("photo.html");
						} else {
							$("#photoSlot").html("<img style=\"width:100%;\" src=\"photos/"+data["photoName"]+"\" />");
						}
					}
				);
				
				socket.on("graph", function (data) {
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
				});
				
				// Ask the server for a status update
				socket.emit("status", {});
			}
	}
	
	loadMe();
})();