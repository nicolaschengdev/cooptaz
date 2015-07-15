(function($) {

	$( 'form' ).submit(function (e) {
  		e.preventDefault();

  		var errors = [];

  		var firstname = $('input[name="firstname"]').val();
  		var lastname = $('input[name="lastname"]').val();
  		var network_name = $('.dropdown-menu>li.selected').length > 0 ? $('.dropdown-menu>li.selected').find('a').text() : '';
  		var message = $('textarea').val();
  		var contacted = $('input[type="checkbox"]').attr('checked')  ? 'true' : 'false';

  		if (firstname.length < 2) {
  			errors.push('Votre prénom');
  		}

  		if (lastname.length < 2) {
  			errors.push('Votre nom de famille');
  		}

  		if (network_name.length == 0) {
  			errors.push('Votre réseau d\'appartenance');
  		}

  		if (message.length < 10) {
  			errors.push('Votre message');
  		}

  		if (errors.length > 0) {
  			BootstrapDialog.alert({
	            title: 'ERREUR',
	            message: 'Veuillez vérifier les informations suivantes:<br><br>' + errors.join('<br>'),
	            type: BootstrapDialog.TYPE_DANGER,
	            closable: true,
	            draggable: true,
	            buttonLabel: 'OK',
	            callback: function(result) {
	                // result will be true if button was click, while it will be false if users close the dialog directly.
	                //alert('Result is: ' + result);
	            }
	        });
  		} else {
  			var data = {
  				recommendation_id: $('input[name="_id"]').val(),
  				agent_firstname: firstname,
  				agent_lastname: lastname,
  				agent_network_name: network_name,
  				agent_message: message,
  				agent_has_contacted: contacted
  			};

  			$.ajax({
				type: 'POST',
				url: '/api/v1.0/recommendations/complete',
				data: data,
				dataType: 'json',
				success: function(value, textStatus, jqXHR){

					if (value.status == 'OK') {
						BootstrapDialog.alert('Votre message a bien été envoyé. Nous vous en remercions. Vous pouvez désormais fermer cette page.');
					} else {
						BootstrapDialog.alert('Une erreur s\'est produite. Réessez plus tard ou conctacter un administrateur.');
					}
				},
			});
  		}

  		//$('button[type="submit"]').prop('disabled', true);

	});

	$( '.dropdown ul li a' ).click(function (e) {
		var $target = $(e.target);
		var val = $target.text();
		$( '.dropdown ul li ').removeClass('selected');
		$( '.dropdown button .value').css({color: '#000'}).text(val);
		$target.parent().addClass('selected');
	});

}) (jQuery);