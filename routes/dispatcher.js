var express = require('express');
var router = express.Router();
var df = require('dateformat');

router.get('/:dispatcher_name/recommandations/:object_id', function (req, res, next) {

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

  if (req.params.dispatcher_name != 'AEL_1' && req.params.dispatcher_name != 'AEL_2' && req.params.dispatcher_name != 'COOPTAZ' && req.params.dispatcher_name != 'TEST') {
    var e = new Error('Dispatcher inconnu');
    e.status = 404;
    next(e);
    return;
  }

  models.Recommendation.findOne({ _id: req.params.object_id }, function (e1, recommendation) {
    if (e1) {
      var e = new Error('Demande de contact introuvable');
      e.status = 404;
      next(e);
      return;
    }

    var params = recommendation;

    params['title'] = 'Demande de contact';
    
    if (recommendation.status == 'pending') {  
      //
      // PENDING
      //
      if (recommendation.submitted_date) {
        params['formatted_submitted_date'] = 'Le ' + df(recommendation.submitted_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('dispatch_pending', params);

    } else if (recommendation.status == 'attributed') {
      //
      // ATTRIBUTED
      //
      if (recommendation.submitted_date) {
        params['formatted_submitted_date'] = 'Le ' + df(recommendation.submitted_date, 'dddd d mmmm yyyy à HH:MM');
      }

      if (recommendation.attributed_date) {
        params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('dispatch_attributed', params);
    } else if (recommendation.status == 'completed') {
      //
      // DONE
      //
      if (recommendation.submitted_date) {
        params['formatted_submitted_date'] = 'Le ' + df(recommendation.submitted_date, 'dddd d mmmm yyyy à HH:MM');
      }

      if (recommendation.attributed_at_date) {
        params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_date, 'dddd d mmmm yyyy à HH:MM');
      }

      if (recommendation.completed_date) {
        params['formatted_done_date'] = 'Le ' + df(recommendation.completed_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('dispatch_done', params);
    } else if (recommendation.status == 'canceled') {
      //
      // CANCELED
      //
      if (recommendation.submitted_date) {
        params['formatted_submitted_date'] = 'Le ' + df(recommendation.submitted_date, 'dddd d mmmm yyyy à HH:MM');
      }

      if (recommendation.canceled_date) {
        params['formatted_canceled_date'] = 'Le ' + df(recommendation.canceled_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('dispatch_canceled', params);
    }
  });
});

module.exports = router;