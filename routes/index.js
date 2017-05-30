var express = require('express');
var router = express.Router();

var request = require('request');
var fs = require('fs');
var request = require('request');
var mkdirp = require('mkdirp');

var crypto = require('crypto');

var download = function(url, dest) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url);

    // verify response code
    sendReq.on('response', function(response) {
        if (response.statusCode !== 200) {
            return response.statusCode;
        }
    });

    // check for request errors
    sendReq.on('error', function (err) {
        //fs.unlink(dest);
        return -1;
    });

    sendReq.pipe(file);

    file.on('finish', function() {
        file.close(); 
        return 0;
    });

    file.on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        return -1;
    });
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.options('/AMZItem', function(req, res, next) {
	res.set("Access-Control-Allow-Origin","*");
	res.set("Access-Control-Allow-Headers","Content-Type");
	next();
});

function getLast(str, c) {
	var i = str.lastIndexOf(c);
	return (i < 0) ? '' : str.substr(i);
}

function removeLast(str,c){
	var i = str.lastIndexOf(c);
	return str.substr(0,i);
}

function saveToDB(obj){
	request.post(
	    'http://localhost:5000/AMZItem',
	    { json: obj},
	    function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            console.log(body)
	        }
	    }
	);
}

router.post('/AMZItem', function(req, res, next) {
	res.set("Access-Control-Allow-Origin","*");
	res.set("Access-Control-Allow-Headers","Content-Type");

	//var title_md5 = crypto.createHash('md5').update(req.body.title).digest('hex');

	var newUrl = "http://zbox-desktop:81/";
	var basedir = "/var/www/storage" + '/' + req.body.asin;
	mkdirp(basedir );

	for (var i in req.body.pictures) {
		var url = req.body.pictures[i];
		var suffix = getLast(url,'.');
		url = removeLast(url,'.'); //remove .jpg
		url = removeLast(url,'.'); //remove ._sr30,50_
		url = url + suffix

		var filename = basedir + '/' + i + suffix;


		download(url,filename);
		// var file = fs.createWriteStream(filename);
		// var request = http.get(url, function(response) {
		//   response.pipe(file);
		// });

		req.body.pictures[i] = newUrl + req.body.asin + '/' + i + suffix;
	}

	saveToDB(req.body);

	res.render('index', { title: 'Express' });

});

module.exports = router;
