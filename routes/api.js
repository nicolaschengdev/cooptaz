var http = require('http');
var express = require('express');
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var df = require('dateformat');
var shortid = require('shortid');
var url = require('url');
var rest = require('restler');

module.exports = function (cooptaz_conf) {
	var router = express.Router(),
		Status = {
			OK: 'OK',
			FAIL: 'FAIL'
		},
		VERSION = 'v1.0',
		USER = 'whyers',
		FROM = 'Coopt\'Allianz <no-reply@coopt-allianz.com>';

	var check_auth = function (req, res, next) {

		var authorization = req.headers.authorization;
		var realm = 'Authorization Required';

		if (req.xhr) return next();
		if (req.user) return next();
		if (!authorization) return unauthorized(res, realm);

		var parts = authorization.split(' ');

		if (parts.length !== 2) return next(error(400));

		var scheme = parts[0],
			credentials = new Buffer(parts[1], 'base64').toString(),
			index = credentials.indexOf(':');

		if ('Basic' != scheme || index < 0) return next(error(400));

		var user = credentials.slice(0, index),
			pass = credentials.slice(index + 1);

		if (user == USER && pass == cooptaz_conf.req_basic_auth_pass) {
			req.user = req.remoteUser = user;
			next();
		} else {
			unauthorized(res, realm);
		}
	}

	var check_v = function (req, res, next) {
		//console.log('version =', req.params.version);
		next();
	}

	var check_body = function (req, res, next) {
		if (!req.body || 'object' !== typeof req.body || size(req.body) == 0) {
			next(error(400));
		} else {
			next();
		}
	}

	var options = {
		viewEngine: {
	   		extname: '.hbs',
			layoutsDir: 'views/email/',
			defaultLayout : false,
			partialsDir : 'views/partials/'
		},
		viewPath: 'views/email/',
		extName: '.hbs'
	};

	var mailer = nodemailer.createTransport({
		service: 'gmail',
		auth: {
	    	user: 'admin@whyers.com',
	    	pass: cooptaz_conf.mail_transporter_pass
		}
	});

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

	mailer.use('compile', hbs(options));

	// SCORES
	//
	models.Score.count({}, function (err, c) {

		if (c < 10) {

			console.log('scores.length = ', c);

			for (var i = 0; i < 10 - c; i++) {
				var score = new models.Score();
				score.name = 'Allianz';
				score.img_url = null;
				score.points = 0;
				score.modified_date = new Date();
				score.contributor_install_id = '';
				score.save();
			}
		}
	});

	router.get('/version', function (req, res, next) {
		res.json({ status: Status.OK, result: VERSION });
	});



	router.get('/:version/contributors/:install_id/messages', [check_auth, check_v], function (req, res, next) {
		models.Message.find({ 'install_id': req.params.install_id }, function (err, messages) {
			if (err) {
				res.json({ status: Status.FAIL });
				return;
			}

			res.json({ status: Status.OK, result: messages });
		});
	});

	

	router.get('/:version/scores', [check_auth, check_v], function (req, res, next) {
		
		var query =  url.parse(req.url, true).query;

		console.log(query);

		//models.Score.find({ limit: 10 }, null, { sort: { points: 'descending' }}, function (err, scores) {
		models.Score.find({}).limit(10).sort({points: -1}).exec(function (err, scores) {
			if (err) {
				res.json({ status: Status.FAIL });
				return;
			}

			res.json({ status: Status.OK, result: scores });
		});
	});


	router.post('/:version/feedbacks', [check_auth, check_v, check_body], function (req, res, next) {

		var now = new Date();

		var feedback = models.Feedback();

		feedback.note = req.body.note;
		feedback.message = req.body.message;
		feedback.app_version = req.body.app_version;
		feedback.app_build = req.body.app_build;
		feedback.created_date = now;
		feedback.contributor_email = req.body.contributor_email;
		
		feedback.save(function (err) {
			if (err) {
				res.json({ status: Status.FAIL, error: { error_id: 101, error_message: 'L\'enregistrement n\'a pas pu être effectué'  } });
				return;
			}

			res.json({ status: Status.OK, result: null });
		});
	});



	router.post('/:version/recommendations', [check_auth, check_v, check_body], function (req, res, next) {

		models.Contributor.findOne({ install_id: req.body.contributor_install_id }, function (err, contributor) {
			if (!contributor) {
				contributor = new models.Contributor();
				contributor.install_id  = req.body.contributor_install_id;
			}

			var now = new Date();

			contributor.firstname = req.body.contributor_firstname;
			contributor.lastname = req.body.contributor_lastname;
			contributor.email = req.body.contributor_email;
			contributor.unit = req.body.contributor_unit;
			contributor.save();

			var contact = new models.Contact();
			contact.civility = req.body.contact_civility;
			contact.firstname = req.body.contact_firstname;
			contact.lastname = req.body.contact_lastname;
			contact.phone = req.body.contact_phone;
			contact.email = req.body.contact_email;
			contact.zip = req.body.contact_zip;
			contact.city = req.body.contact_city;
			contact.is_colleague = req.body.contact_is_colleague == "true";
			contact.save();

			var recommendation = new models.Recommendation();

			recommendation.contributor_firstname = contributor.firstname;
			recommendation.contributor_lastname = contributor.lastname;
			recommendation.contributor_email = contributor.email;
 			recommendation.contributor_unit = contributor.unit;
			recommendation.contributor_install_id = contributor.install_id;

			recommendation.contact_civility = contact.civility;
	        recommendation.contact_firstname = contact.firstname;
	        recommendation.contact_lastname = contact.lastname;
	        recommendation.contact_phone = contact.phone;
	        recommendation.contact_email = contact.email;
	        recommendation.contact_zip = contact.zip;
	        recommendation.contact_city = contact.city;
	        recommendation.contact_is_colleague = contact.is_colleague;

			recommendation.short_id = shortid.generate();
			recommendation.needs_description = req.body.recommendation_needs_description;
			recommendation.type_of_callback = req.body.recommendation_type_of_callback;
			recommendation.submitted_date = now;
			recommendation.attributed_date = null;
			recommendation.completed_date = null;
			recommendation.canceled_date = null;

			recommendation.env = req.body.recommendation_env;
			recommendation.status = 'pending';

			recommendation.save(function (err) {
				if (err) {
					res.json({ status: Status.FAIL, error: { error_id: 100, error_message: 'La recommandation n\'a pas pu être enregistré.' } });
					return;
				}

				models.Score.findOne({ install_id: recommendation.contributor_install_id }, function (err, score) {
					if (!score) {
						score = new models.Score();
						score.points = 0;
						score.install_id  = recommendation.contributor_install_id;
					}

					score.name = recommendation.contributor_firstname + ' ' + recommendation.contributor_lastname[0] + '.';
					score.img_url = null;
					score.modified_date = new Date();
					score.points = score.points + 3;		
					score.save();
				});

				var recommendation_id = recommendation._id;

				// MAIL A : system to contributor
				//
				var ctx_template_a = req.body;
				ctx_template_a.email_title_a = 'CONFIRMATION TRANSFERT DE CONTACT';

				var mail_a_options = {
					from: FROM,
					to: recommendation.contributor_email,
					subject: ctx_template_a.email_title_a,
					template: 'template_a',
					context: ctx_template_a
				};

				mailer.sendMail(mail_a_options, function (error, info) {
					if (error) {
						console.log('ERROR: MAIL: template_a >', error);
					} else {
						console.log('OK: MAIL: template_a >', info.response);
					}
				});

				// MAIL B : system to contact
				//
				var ctx_template_b = req.body;
				ctx_template_b.email_title_b = 'CONFIRMATION DEMANDE DE CONTACT';
				ctx_template_b.link_b = 'http://' + cooptaz_conf.base_url + '/contact/recommandation/' + recommendation.short_id + '/annuler';

				ctx_template_b.expert = recommendation.type_of_callback == 'distance' ? 'conseiller' : 'agent général';

				var mail_b_options = {
					from: FROM,
					to: recommendation.contact_email,
					subject: ctx_template_b.email_title_b,
					template: 'template_b',
					context: ctx_template_b
				};

				mailer.sendMail(mail_b_options, function (error, info) {
					if (error) {
						console.log('ERROR: MAIL: template_b >', error);
					} else {
						console.log('OK: MAIL: template_b >', info.response);
					}
				});

				// MAIL C : system to dispatcher
				//
				var long_date = df(now, 'dddd d mmmm yyyy à HH:MM');
				var short_date = df(now, 'dd/mm/yyyy');

				var dispatcher_email = 'admin@whyers.com';
				var dispatcher_name = 'TEST';
				var subject = 'TEST - À RAPPELER SOUS 24h - ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname + ' - ' + short_date;

				if (cooptaz_conf.env != 'development') {
					if (recommendation.contact_is_colleague == 'true') {
						dispatcher_email = 'AEL@allianz.fr';
						dispatcher_name = 'AEL_1';
						subject = 'OS – COOPT\'ALLIANZ – A rappeler dans les 24h - ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname + ' - ' + short_date;
					} else {
						if (recommendation.type_of_callback == 'distance') {
							dispatcher_email = 'AEL@allianz.fr';
							dispatcher_name = 'AEL_2';
							subject = 'COOPT\'ALLIANZ – A rappeler dans les 24h - ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname + ' - ' + short_date;
						} else {
							//dispatcher_email = 'cooptallianz@allianz.fr';
							dispatcher_email = 'cooptaz@allianz.fr';
							dispatcher_name = 'COOPTAZ';
							subject = 'COOPT\'ALLIANZ – A rencontrer - ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname + ' - ' + short_date;
						}
					}
				}

				var ctx_template_c = req.body;
				ctx_template_c.email_title_c = 'A RAPPELER SOUS 24h - ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname;
				ctx_template_c.email_subtitle_c = 'Le ' + long_date;

				ctx_template_c.link_c = 'http://' + cooptaz_conf.base_url + '/dispatcher/' + dispatcher_name + '/recommandations/' + recommendation_id;

				ctx_template_c.recommendation_date = long_date;

				var mail_c_options = {
					from: FROM,
					to: dispatcher_email,
					subject: subject,
					template: 'template_c',
					context: ctx_template_c
				};

				mailer.sendMail(mail_c_options, function (error, info) {
					if (error){
						console.log('ERROR: MAIL: template_c >', error);
					} else {
						console.log('OK: MAIL: template_c >', info.response);
					}
				});

	    		res.json({ status: Status.OK, result: 'w' + recommendation_id + '' });
			});
		});
	});




	router.post('/:version/recommendations/attribute', [check_auth, check_v, check_body], function (req, res, next) {

	 	models.Recommendation.findOne({ _id: req.body.recommendation_id }, function (e1, recommendation) {
	    	if (e1) {
	      		res.json({ status: Status.FAIL });
	      		return;
	    	}

	    	recommendation.status = 'attributed';
	    	recommendation.attributed_date = new Date();

	    	recommendation.agent_email = req.body.agent_email;

	    	recommendation.save(function (e2) {
	      		if (e2) {
	        		res.json({ status: Status.FAIL });
	        		return;
	      		}

				// MAIL D : dispatcher to agent
				//
				var now = new Date();

				var long_date = df(now, 'dddd d mmmm yyyy à HH:MM');
				var short_date = df(now, 'dd/mm/yyyy');

				var subject = 'COOPT\'ALLIANZ - À RAPPELER SOUS 24h - ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname + ' - ' + short_date;

				var ctx_template_d = req.body;

				ctx_template_d.contributor_firstname = recommendation.contributor_firstname;
				ctx_template_d.contributor_lastname = recommendation.contributor_lastname;
				ctx_template_d.email_title_d = 'NOUVELLE DEMANDE DE CONTACT';
				ctx_template_d.email_subtitle_d = 'Le ' + long_date;

				ctx_template_d.link_d = 'http://' + cooptaz_conf.base_url + '/recommandations/' + recommendation._id + '/details';

				ctx_template_d.recommendation_date = long_date;

				var mail_d_options = {
					from: FROM,
					to: recommendation.agent_email,
					subject: subject,
					template: 'template_d',
					context: ctx_template_d
				};

				mailer.sendMail(mail_d_options, function (error, info) {
					if (error){
						console.log('ERROR: MAIL: template_d >', error);
					} else {
						console.log('OK: MAIL: template_d >', info.response);
					}
				});

				res.json({ status: Status.OK });
			});
		});
	});









	router.post('/:version/recommendations/complete', [check_auth, check_v, check_body], function (req, res, next) {

		models.Recommendation.findOne({ _id: req.body.recommendation_id }, function (e1, recommendation) {
			if (e1) {
		  		res.json({ status: Status.FAIL });
		  		return;
			}

			var now = new Date();

			recommendation.status = 'complete';
			recommendation.completed_date = now;

			recommendation.agent_firstname = req.body.agent_firstname;
			recommendation.agent_lastname = req.body.agent_lastname;
			recommendation.agent_network_name = req.body.agent_network_name;
			recommendation.agent_message = req.body.agent_message;
			recommendation.agent_has_contacted = req.body.agent_has_contacted;

			recommendation.save(function (e2) {
				if (e2) {
		    		res.json({ status: Status.FAIL });
		    		return;
		  		}

				var expert = req.body.agent_firstname;
				var message = expert + ': ' + req.body.agent_message;

				var msg = new models.Message();
				msg.title = 'Remerciement de ' + recommendation.agent_firstname;
				msg.created_datestring = df(now, 'dddd d mmmm yyyy à HH:MM');
				msg.message = message;
				msg.install_id = recommendation.contributor_install_id;

				msg.save();

				push_notification(recommendation.env, 'w' + req.body.recommendation_id, message, true, null);

		  		res.json({ status: Status.OK });
			});
		});
	});

	function push_notification(env, channel, message, increment, callback) {
		
		var parse_app_id = (env === 'beta') ? cooptaz_conf.beta_parse_app_id : cooptaz_conf.inhouse_parse_app_id;
		var parse_rest_api_key = (env === 'beta') ? cooptaz_conf.beta_parse_rest_api_key : cooptaz_conf.inhouse_parse_rest_api_key;

		var options = {
			headers: {
				'X-Parse-Application-Id': parse_app_id,
				'X-Parse-REST-API-Key': parse_rest_api_key
			}
		};

		message = truncate(message, 160, '…');
		message = message.replace(/'/g, "\'");
		message = message.replace(/"/g, '\"');
		message = message.replace(/\\/g, '\\');
		message = message.replace(/\//g, '\/');

		var json = {
			channels: [ channel ],
			data: {
				alert: message,
				//'sound': 'cheering.caf',
				title: 'CooptAllianz',
				message_id: '321p09t'
			}
		};

		if (increment) {
			json.data.badge = 'Increment';
		}

		rest.postJson('https://api.parse.com/1/push', json, options).on('complete', function(data, response) {

			console.log('PUSH NOTIFICATION SENT');

			if (callback) {
				callback(data.result);
			}
		});
	}

	function truncate(str, maxLength, suffix) {
		if (str.length > maxLength) {
			str = str.substring(0, maxLength + 1); 
			str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
			str = str + suffix;
		}
		return str;
	}

	function unauthorized (res, realm) {
		res.statusCode = 401;
		res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
		res.end('Unauthorized');
	}

	function error (code, msg) {
		var err = new Error(msg || http.STATUS_CODES[code]);
		err.status = code;
		return err;
	}

	function size (obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	}

	return router;
}