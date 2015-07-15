var http = require('http');
var express = require('express');

var router = express.Router();

router.get('/recommandation/:short_id/annuler', function (req, res, next) {

	console.log('/recommandation/contact');

	models.Recommendation.findOne({ short_id: req.params.short_id }, function (e1, recommendation) {
		if (e1) {
			next(error(404, 'Demande de contact introuvable'));
			return;
		}

		if (recommendation.status != 'canceled') {

			recommendation.status = 'canceled';
			recommendation.canceled_date = new Date();

			recommendation.save(function (e2) {
				if (e2) {
					next(error(404, 'Une erreur s\'est produite lors de l\'annulation de la demande de contact'));
					return;
				}

				res.render('cancel', { title: 'Annulation demande de contact', item: req.params.short_id });
			});
		} else {
			res.render('cancel', { title: 'Annulation demande de contact', item: req.params.short_id });
		}
	});
});

function error (code, msg) {
	var err = new Error(msg || http.STATUS_CODES[code]);
	err.status = code;
	return err;
}

module.exports = router;