var express = require('express');
var router = express.Router();
var df = require('dateformat');


router.get('/:object_id/details', function (req, res, next) {

	df.i18n = {
		dayNames: [
			'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam',
			'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
		],
		monthNames: [
			'Jan', 'Févr', 'Mars', 'avril', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc',
			'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
		]
	};

	models.Recommendation.findOne({ _id: req.params.object_id }, function (e1, recommendation) {
		if (e1) {
			var e = new Error('Demande de contact introuvable');
			e.status = 404;
			next(e);
			return;
		}

		var params = recommendation;
		params['title'] = 'Demande de contact';
    
		if (recommendation.status == 'pending' || recommendation.status == 'attributed') {
			//
			// PENDING ou ATTRIBUTED
			//
			if (recommendation.attributed_date) {
				params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_date, 'dddd d mmmm yyyy à HH:MM');
			} else {
				params['formatted_attributed_at_date'] = 'Non Attribuée';
			}

			var now = new Date();
			var formatted_now = df(now, 'dddd d mmmm yyyy');
			var message = 'Bonjour ' + recommendation.contributor_firstname + ',\nJe vous remercie d’avoir recommandé Allianz à ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname + '.\nJ\'ai traité la demande de contact ce ' + formatted_now + '.';
			params['message'] = message;

			res.render('recommendation_attributed', params);

		} else if (recommendation.status == 'completed') {
			//
			// DONE
			//
			if (recommendation.attributed_at_date) {
				params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_date, 'dddd d mmmm yyyy à HH:MM');
			}

			if (recommendation.completed_date) {
				params['formatted_done_date'] = 'le ' + df(recommendation.completed_date, 'dddd d mmmm yyyy à HH:MM');
			}

			res.render('recommendation_done', params);

		} else if (recommendation.status == 'canceled') { 
			//
			// CANCELED
			//
			if (recommendation.attributed_date) {
				params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_date, 'dddd d mmmm yyyy à HH:MM');
			}

			if (recommendation.canceled_date) {
				params['formatted_canceled_date'] = 'le ' + df(recommendation.canceled_date, 'dddd d mmmm yyyy à HH:MM');
			}

			res.render('recommendation_canceled', params);
  		}
	});
});

module.exports = router;
