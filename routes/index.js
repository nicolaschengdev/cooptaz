var express = require('express');
var router = express.Router();

var VERSION = 'v1.0';

router.get('/', function(req, res, next) {
	res.render('index', { title: 'Coopt\'Allianz ' + VERSION });
});

module.exports = router;