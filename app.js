var cooptaz_conf = {
  req_basic_auth_pass: '<0>',
  mail_transporter_pass: '<1>',
  base_url: '<2>',
  mongodb_address: '<3>',
  beta_parse_app_id: '<4>',
  beta_parse_rest_api_key: '<5>',
  inhouse_parse_app_id: '<6>',
  inhouse_parse_rest_api_key: '<7>'
};

cooptaz_conf['env'] = 'development';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var models = require('./models/models')(mongoose, cooptaz_conf.mongodb_address);
global.models = models;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

var jsonParser = bodyParser.json();

app.use(jsonParser);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// routes
//

var index = require('./routes/index');
var api = require('./routes/api')(cooptaz_conf);
var contact = require('./routes/contact');
var recommandations = require('./routes/recommandations');
var dispatcher = require('./routes/dispatcher');

app.use('/', index);
app.use('/api', api);
app.use('/contact', contact);
app.use('/recommandations', recommandations);
app.use('/dispatcher', dispatcher);

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
