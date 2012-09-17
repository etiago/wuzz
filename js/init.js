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
});