/*global window */
/*global $ */
/*global document */

$(document).bind("mobileinit", function(){
	
	$( 'div[data-role="page"]' ).live( 'pageshow',function(event){
		window.pageID = event.target.id;
		
		if (typeof window.Buzz.iosocket !== 'undefined' && window.Buzz.iosocket !== null) {
			if (window.pageID == "account") {
				//window.Buzz.functions.pagebeforeshow["account"]();
			} else {
				// Ask the server for a status update
				window.Buzz.iosocket.emit("status", {});
			}
		}
		

	});
	
	$( 'div[data-role="page"]' ).live( 'pagebeforeshow',function(event){
		if (event.target.id in window.Buzz.functions.pagebeforeshow){
			window.Buzz.functions.pagebeforeshow[event.target.id]();
		}
	});
	
	$( 'div[data-role="page"]' ).live( 'pageinit',function(){
		
		// Tiago: Still not fully convinced by this solution. Should do
		// sth more elegant rather than iterate through all.
		if (window.Buzz.handlers !== null) {
			$.each(window.Buzz.handlers, function(k,v) {
				if ($("#"+k).length === 0) return true;
				
				$("#"+k).unbind();
				$("#"+k).click(v);
				//delete window.Buzz.handlers[k];
			});
		}
		//alert("Inited"+event.target.id);
		
		// TODO: Initialize ALL the click handlers here. Need to know which page we are on
		// and bind all events for that page. Questions might be tricky... always unbind before binding again.
	});
});