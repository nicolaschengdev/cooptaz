(function($) {

	$( 'form' ).submit(function (e) {
  		e.preventDefault();

  		var errors = [];

  		var email = $('input[name="email"]').val();
  		var is_email = isEmail(email);

  		if (is_email == false) {
  			errors.push("Email de votre expert");
  		}

  		if (errors.length > 0) {
  			BootstrapDialog.alert({
	            title: 'ERREUR',
	            message: 'Veuillez vérifier l\'email renseigné<br><br>' + email,
	            type: BootstrapDialog.TYPE_DANGER,
	            closable: true,
	            draggable: true,
	            buttonLabel: 'OK',
	            callback: function(result) {
	                //result will be true if button was click, while it will be false if users close the dialog directly.
	                //alert('Result is: ' + result);
	            }
	        });
  		} else {
  			var data = {
  				recommendation_id: $('input[name="_id"]').val(),
  				agent_email: email,
  			};

  			$.ajax({
				type: 'POST',
				url: '/api/recommendations/attribute_at',
				data: data,
				dataType: 'json',
				success: function(value, textStatus, jqXHR){
					console.log(value, textStatus, jqXHR);

					if (value.status == 'OK') {
						BootstrapDialog.alert('Un email a été envoyé à votre expert pour traitement de la demande.');
					} else {
						BootstrapDialog.alert('Une erreur s\'est produite. Réessez plus tard ou conctacter un administrateur.');
					}
				},
			});
  		}
	});

	function isEmail(email) {
 		var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    	return re.test(email);
	}

}) (jQuery);