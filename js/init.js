$(document).bind("mobileinit", function(){
	$( 'div[data-role="page"]' ).live( 'pageshow',function(event, ui){
		window.pageID = event.target.id;
		
		if (!(typeof window.Buzz.iosocket === 'undefined') && window.Buzz.iosocket !== null) {
			if (window.pageID == "account") {
				window.Buzz.functions.loginCheck();
			} else {
				// Ask the server for a status update
				window.Buzz.iosocket.emit("status", {});
			}
		}
		

	});
	
	$( 'div[data-role="page"]' ).live( 'pageinit',function(event, ui){
		if (window.Buzz.handlers[event.target.id] != null) {
			$.each(window.Buzz.handlers[event.target.id], function(k,v) {
				$("#"+k).click(v);
			});
		}
		//alert("Inited"+event.target.id);
		
		// TODO: Initialize ALL the click handlers here. Need to know which page we are on
		// and bind all events for that page. Questions might be tricky... always unbind before binding again.
	});
});