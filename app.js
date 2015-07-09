var cooptaz_conf = {
  req_basic_auth_pass: '<0>',
  mail_transporter_pass: '<1>',
  base_url: '<2>',
  mongodb_address: '<3>',
  parse_app_id: '<4>',
  parse_rest_api_key: '<5>'
};

//var env = process.env.NODE_ENV || 'development';

var env = 'development';

//var time = require('time')(Date);

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var basicAuth = require('basic-auth-connect');

var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var mongoose = require('mongoose');

var rest = require('restler');

var app = express();
app.locals.ENV = env;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

var jsonParser = bodyParser.json();
var auth = basicAuth('whyers', cooptaz_conf.req_basic_auth_pass);
//app.use(basicAuth('whyers', cooptaz_conf.req_basic_auth_pass));

app.use(jsonParser);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var hbs = require('nodemailer-express-handlebars');
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

var df = require('dateformat');

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

mongoose.connect('mongodb://' + cooptaz_conf.mongodb_address + '/cooptaz');

var RecommendationSchema = mongoose.Schema({
  contributor_firstname: String,
  contributor_lastname: String,
  contributor_email: String,
  contributor_unit: String,

  contact_civility: String,
  contact_firstname: String,
  contact_lastname: String,
  contact_phone: String,
  contact_email: String,
  contact_zip: String,
  contact_city: String,
  contact_is_colleague: String,
  contact_needs_description: String,
  contact_type_of_callback: String,

  submitted_date: Date,
  attributed_at_date: Date,
  done_date: Date,
  canceled_date: Date,

  agent_email: String,
  agent_firstname: String,
  agent_lastname: String,
  agent_network_name: String,
  agent_has_contacted: String,
  agent_message: String,

  status: String
});

var Recommendation = mongoose.model('Recommendation', RecommendationSchema);

app.get('/', function(req, res, next) {
  res.render('index', { title: 'Coopt\'Allianz v1.0.0' });
});

app.get('/api/push_notification', function (req, res, next) {
  push_notification('test', 'test', true, null);
  res.send('OK');
});












app.get('/superviseur/:dispatcher/recommandations/:object_id', function (req, res, next) {

  if (req.params.dispatcher != 'AEL_1' && req.params.dispatcher != 'AEL_2' && req.params.dispatcher != 'COOPTAZ' && req.params.dispatcher != 'TEST') {
    var e = new Error('Superviseur inconnu');
    e.status = 404;
    next(e);
    return;
  }

  Recommendation.findOne({ _id: req.params.object_id }, function (e1, recommendation) {
    if (e1) {
      var e = new Error('Demande de contact introuvable');
      e.status = 404;
      next(e);
      return;
    }

    var params = recommendation;
    params['title'] = 'Demande de contact';
    
    if (recommendation.status == 'pending') {  
      // PENDING
      //
      if (recommendation.submitted_date) {
        params['formatted_submitted_date'] = 'Le ' + df(recommendation.submitted_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('dispatch_pending', params);

    } else if (recommendation.status == 'attributed') {
      // ATTRIBUTED
      //
      if (recommendation.submitted_date) {
        params['formatted_submitted_date'] = 'Le ' + df(recommendation.submitted_date, 'dddd d mmmm yyyy à HH:MM');
      }

      if (recommendation.attributed_at_date) {
        params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_at_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('dispatch_attributed', params);
    }
  });
});


app.get('/recommandations/:object_id/details', function (req, res, next) {

  Recommendation.findOne({ _id: req.params.object_id }, function (e1, recommendation) {
    if (e1) {
      var e = new Error('Demande de contact introuvable');
      e.status = 404;
      next(e);
      return;
    }

    var params = recommendation;
    params['title'] = 'Demande de contact';
    
    if (recommendation.status == 'pending' || recommendation.status == 'attributed') {  
      // PENDING ou ATTRIBUTED
      //
      if (recommendation.attributed_at_date) {
        params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_at_date, 'dddd d mmmm yyyy à HH:MM');
      } else {
        params['formatted_attributed_at_date'] = 'Non Attribuée';
      }

      var now = new Date();
      var formatted_now = df(now, 'dddd d mmmm yyyy');
      var message = 'Bonjour ' + recommendation.contributor_firstname + ',\nJe vous remercie d’avoir recommandé Allianz à ' + recommendation.contact_civility + ' ' + recommendation.contact_lastname + '.\nJ\'ai traité la demande de contact ce ' + formatted_now + '.';
      params['message'] = message;

      res.render('recommendation_attributed', params);

    } else if (recommendation.status == 'done') {
      // PERFORMED
      //
      if (recommendation.attributed_at_date) {
        params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_at_date, 'dddd d mmmm yyyy à HH:MM');
      }

      if (recommendation.performed_date) {
        params['formatted_performed_date'] = 'le ' + df(recommendation.performed_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('recommendation_done', params);

    } else if (recommendation.status == 'canceled') { 
      // CANCELED
      //
      if (recommendation.attributed_at_date) {
        params['formatted_attributed_at_date'] = 'Le ' + df(recommendation.attributed_at_date, 'dddd d mmmm yyyy à HH:MM');
      }

      if (recommendation.canceled_date) {
        params['formatted_canceled_date'] = 'le ' + df(recommendation.canceled_date, 'dddd d mmmm yyyy à HH:MM');
      }

      res.render('recommendation_canceled', params);

    }
  });

});

app.post('/api/recommendations/done', function (req, res, next) {

  if (!req.body) {
    res.json({ status: 'FAIL' });
    return;
  }

  Recommendation.findOne({ _id: req.body.recommendation_id }, function (e1, recommendation) {
    if (e1) {
      res.json({ status: 'FAIL' });
      return;
    }

    console.log(req.body.agent_firstname);
    console.log(req.body.agent_lastname);
    console.log(req.body.agent_network_name);
    console.log(req.body.agent_message);
    console.log(req.body.agent_has_contacted);

    var now = new Date();

    recommendation.status = 'done';
    recommendation.performed_date = now;

    recommendation.agent_firstname = req.body.agent_firstname;
    recommendation.agent_lastname = req.body.agent_lastname;
    recommendation.agent_network_name = req.body.agent_network_name;
    recommendation.agent_message = req.body.agent_message;
    recommendation.agent_has_contacted = req.body.agent_has_contacted;

    recommendation.save(function (e2) {
      if (e2) {
        res.json({ status: 'FAIL' });
        return;
      }

      var options = {
        headers: {
          'X-Parse-Application-Id': cooptaz_conf.parse_app_id,
          'X-Parse-REST-API-Key': cooptaz_conf.parse_rest_api_key
        }
      };

      var expert = req.body.agent_firstname;
      var message = expert + ': ' + req.body.agent_message;
      message = truncate(message, 160, '…');
      message = message.replace(/'/g, "\'");
      message = message.replace(/"/g, '\"');
      message = message.replace(/\\/g, '\\');
      message = message.replace(/\//g, '\/');

      var json = {
        'channels': [ 'w' + req.body.recommendation_id ],
        'data': {
          'alert': message,
          'title': 'Coopt\'Allianz'
        }
      };

      rest.postJson('https://api.parse.com/1/push', json, options).on('complete', function(data, response) {
        console.log('PUSH NOTIFICATIONS', data);
      });

      res.json({ status: 'OK' });
    });
  });
});


app.post('/api/recommendations/attribute_at', function (req, res, next) {

  if (!req.body) {
    res.json({ status: 'FAIL' });
    return;
  }

  Recommendation.findOne({ _id: req.body.recommendation_id }, function (e1, recommendation) {
    if (e1) {
      res.json({ status: 'FAIL' });
      return;
    }

    console.log(req.body.recommendation_id);
    console.log(req.body.agent_email);

    recommendation.status = 'attributed';
    recommendation.attributed_at_date = new Date();

    recommendation.agent_email = req.body.agent_email;

    recommendation.save(function (e2) {
      if (e2) {
        res.json({ status: 'FAIL' });
        return;
      }

      // MAIL D : dispatcher to agent
      //
      var now = new Date();
      var from = 'Coopt\'Allianz <no-reply@coopt-allianz.com>';

      var long_date = df(now, 'dddd d mmmm yyyy à HH:MM');
      var short_date = df(now, 'dd/mm/yyyy');

      var dispatcher_email = 'admin@whyers.com'; // jeremy.zaghdoun@allianz.fr
      var dispatcher_name = 'TEST';
      var subject = 'COOPT\'ALLIANZ - À RAPPELER SOUS 24h - ' + req.body.contact_civility + ' ' + req.body.contact_lastname + ' - ' + short_date;

      var ctx_template_d = req.body;
      ctx_template_d.email_title_d = 'NOUVELLE DEMANDE DE CONTACT';
      ctx_template_d.email_subtitle_d = 'Le ' + long_date;

      ctx_template_d.link_d = 'http://' + cooptaz_conf.base_url + '/recommandations/' + recommendation._id + '/details';

      ctx_template_d.recommendation_date = long_date;

      var mail_d_options = {
        from: from,
        to: dispatcher_email,
        //subject: 'COOPT’ALLIANZ - À RAPPELER SOUS 24h - ' + req.body.contact_lastname + ' - ' + short_date,
        subject: subject,
        template: 'template_d',
        context: ctx_template_d
      };

      mailer.sendMail(mail_d_options, function(error, info){
        if (error){
          console.log('ERROR: MAIL: template_d >', error);
        } else {
          console.log('OK: MAIL: template_d >', info.response);
        }
      });

      res.json({ status: 'OK' });
    });
  });
});







app.get('/recommandations/:object_id/annulation', function (req, res, next) {

  //var exists = true;

  Recommendation.findOne({ _id: req.params.object_id }, function (e1, recommendation) {
    if (e1) {
      var e = new Error('Demande de contact introuvable');
      e.status = 404;
      next(e);
      return;
    }

    if (recommendation.status != 'canceled') {

      var now = new Date();
      //now.setTimezone('Europe/Paris');

      recommendation.status = 'canceled';
      recommendation.canceled_date = now;

      recommendation.save(function (e2) {
        if (e2) {
          var e = new Error('Une erreur s\'est produite lors de l\'annulation de la demande de contact');
          e.status = 404;
          next(e);
          return;
        }

        res.render('cancel', { title: 'Annulation demande de contact', item: req.params.object_id });
      });
    } else {
      res.render('cancel', { title: 'Annulation demande de contact', item: req.params.object_id });
    }
  });
});




app.post('/api/recommendations', auth, function (req, res) {
  if (!req.body) {
    res.json({ status: 'FAIL', error: { error_id: 1001, error_message: 'La requête ne possède aucune donnée.' } });
    return;
  }

  var now = new Date();

  var r = new Recommendation();

  r.contributor_firstname = req.body.contributor_firstname;
  r.contributor_lastname = req.body.contributor_lastname;
  r.contributor_email = req.body.contributor_email;
  r.contributor_unit = req.body.contributor_unit;

  r.contact_civility = req.body.contact_civility;
  r.contact_firstname = req.body.contact_firstname;
  r.contact_lastname = req.body.contact_lastname;
  r.contact_phone = req.body.contact_phone;
  r.contact_email = req.body.contact_email;
  r.contact_zip = req.body.contact_zip;
  r.contact_city = req.body.contact_city;
  r.contact_is_colleague = req.body.contact_is_colleague;
  r.contact_needs_description = req.body.contact_needs_description;
  r.contact_type_of_callback = req.body.contact_type_of_callback;

  r.submitted_date = now;
  r.attributed_at_date = null;
  r.performed_date = null;
  r.canceled_date = null;

  r.status = 'pending';

  r.save(function (err) {
    if (err) {
      res.json({ status: 'FAIL', error: { error_id: 1002, error_message: 'La recommandation n\'a pas pu être enregistré.' } });
      return;
    }

    var from = 'Coopt\'Allianz <no-reply@coopt-allianz.com>';

    // MAIL A : system to contributor
    //
    var ctx_template_a = req.body;
    ctx_template_a.email_title_a = 'CONFIRMATION TRANSFERT DE CONTACT';

    var mail_a_options = {
      from: from,
      to: req.body.contributor_email,
      subject: ctx_template_a.email_title_a,
      template: 'template_a',
      context: ctx_template_a
    };

    mailer.sendMail(mail_a_options, function(error, info){
      if (error){
        console.log('ERROR: MAIL: template_a >', error);
      } else {
        console.log('OK: MAIL: template_a >', info.response);
      }
    });

    // MAIL B : system to contact
    //
    var ctx_template_b = req.body;
    ctx_template_b.email_title_b = 'CONFIRMATION DEMANDE DE CONTACT';
    ctx_template_b.link_b = 'http://' + cooptaz_conf.base_url + '/recommandations/' + r._id + '/annulation';

    ctx_template_b.expert = req.body.contact_type_of_callback == 'distance' ? 'conseiller' : 'agent général';

    var mail_b_options = {
      from: from,
      to: req.body.contact_email,
      subject: ctx_template_b.email_title_b,
      template: 'template_b',
      context: ctx_template_b
    };

    mailer.sendMail(mail_b_options, function(error, info){
      if (error){
        console.log('ERROR: MAIL: template_b >', error);
      } else {
        console.log('OK: MAIL: template_b >', info.response);
      }
    });

    // MAIL C : system to dispatcher
    //
    var long_date = df(now, 'dddd d mmmm yyyy à HH:MM');
    var short_date = df(now, 'dd/mm/yyyy');

    var dispatcher_email = 'admin@whyers.com'; // jeremy.zaghdoun@allianz.fr
    var dispatcher_name = 'TEST';
    var subject = 'TEST - À RAPPELER SOUS 24h - ' + req.body.contact_civility + ' ' + req.body.contact_lastname + ' - ' + short_date;

    if (env != 'development') {
      if (req.body.contact_is_colleague == 'true') {
        dispatcher_email = 'AEL@allianz.fr';
        dispatcher_name = 'AEL_1';
        subject = 'OS – COOPT\'ALLIANZ – A rappeler dans les 24h - ' + req.body.contact_civility + ' ' + req.body.contact_lastname + ' - ' + short_date;
      } else {
        if (req.body.contact_type_of_callback == 'distance') {
          dispatcher_email = 'AEL@allianz.fr';
          dispatcher_name = 'AEL_2';
          subject = 'COOPT\'ALLIANZ – A rappeler dans les 24h - ' + req.body.contact_civility + ' ' + req.body.contact_lastname + ' - ' + short_date;
        } else {
          dispatcher_email = 'cooptallianz@allianz.fr';
          dispatcher_name = 'COOPTAZ';
          subject = 'COOPT\'ALLIANZ – A rencontrer - ' + req.body.contact_civility + ' ' + req.body.contact_lastname + ' - ' + short_date;
        }
      }
    }

    var ctx_template_c = req.body;
    ctx_template_c.email_title_c = 'A RAPPELER SOUS 24h - ' + req.body.contact_civility + ' ' + req.body.contact_lastname;
    //ctx_template_c.email_title_c = subject;
    ctx_template_c.email_subtitle_c = 'Le ' + long_date;

    ctx_template_c.link_c = 'http://' + cooptaz_conf.base_url + '/superviseur/' + dispatcher_name + '/recommandations/' + r._id;

    ctx_template_c.recommendation_date = long_date;

    var mail_c_options = {
      from: from,
      to: dispatcher_email,
      //subject: 'COOPT’ALLIANZ - À RAPPELER SOUS 24h - ' + req.body.contact_lastname + ' - ' + short_date,
      subject: subject,
      template: 'template_c',
      context: ctx_template_c
    };

    mailer.sendMail(mail_c_options, function(error, info){
      if (error){
        console.log('ERROR: MAIL: template_c >', error);
      } else {
        console.log('OK: MAIL: template_c >', info.response);
      }
    });

    res.json({ status: 'OK', result: 'w' + r._id + '' });
  });
});





















function push_notification(channel, message, increment, callback) {
  var options = {
    headers: {
      'X-Parse-Application-Id': cooptaz_conf.parse_app_id,
      'X-Parse-REST-API-Key': cooptaz_conf.parse_rest_api_key
    }
  };

  message = truncate(message, 140, '…');
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


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Page introuvable');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//module.exports = app;

app.listen(3000, function () {
  console.log('App running...');
});
