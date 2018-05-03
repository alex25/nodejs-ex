//  OpenShift sample Node application
var express    = require('express'),
    app        = express(), 
    bodyParser = require('body-parser'),    
    morgan     = require('morgan');

console.log('paso la conexion!');

Object.assign=require('object-assign')

//app.engine('html', require('ejs').renderFile);
//app.use(morgan('combined'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

/**
* Generates number of random geolocation points given a center and a radius.
* @param  {Object} center A JS object with lat and lng attributes.
* @param  {number} radius Radius in meters.
* @param {number} count Number of points to generate.
* @return {array} Array of Objects with lat and lng attributes.
*/
function generateRandomPoints(center, radius, count) {
  var points = [];
  for (var i=0; i<count; i++) {
    points.push(generateRandomPoint(center, radius));
  }
  return points;
}


/**
* Generates number of random geolocation points given a center and a radius.
* Reference URL: http://goo.gl/KWcPE.
* @param  {Object} center A JS object with lat and lng attributes.
* @param  {number} radius Radius in meters.
* @return {Object} The generated random points as JS object with lat and lng attributes.
*/
function generateRandomPoint(center, radius) {
  var x0 = center.lng;
  var y0 = center.lat;
  // Convert Radius from meters to degrees.
  var rd = radius/111300;

  var u = Math.random();
  var v = Math.random();

  var w = rd * Math.sqrt(u);
  var t = 2 * Math.PI * v;
  var x = w * Math.cos(t);
  var y = w * Math.sin(t);

  var xp = x/Math.cos(y0);

  // Resulting point.
  return {'lat': y+y0, 'lng': xp+x0};
}

app.post('/randomPoints', function (req, res) {
  console.log('reqbody: '+JSON.stringify(req.body));
  // Usage Example.
  // Generates 100 points that is in a 1km radius from the given lat and lng point.
  var randomGeoPoints = generateRandomPoints({'lat':req.body.latitude, 'lng':req.body.longitude}, 500, 10);
  res.contentType('application/json');
  res.send(JSON.stringify(randomGeoPoints));

});

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.

    res.send('{ pageCount: -1 }');

});

app.post('/updateUserData', function (req, res) {
  console.log('reqbody: '+JSON.stringify(req.body));
  if (!db) {
      initDb(function(err){});
    }
    if (db) {
      var collection = db.collection('users');
      collection.insert({user: req.body.user, latitude:req.body.latitude, longitude:req.body.longitude});
    }

    res.contentType('application/json');
    res.send('{ response:ok }');

});

app.post('/login', function (req, res) {
  console.log('reqbody: '+JSON.stringify(req.body));
  if (!db) {
      initDb(function(err){});
    }
    if (db) {
     // var collection = db.collection('users');
     // collection.insert({user: req.body.user, latitude:req.body.latitude, logitude:req.body.logitude});
    }

    res.contentType('application/json');
    res.send('{ response:ok }');

});

app.get('/deleteUserData', function (req, res) {
  if (!db) {
      initDb(function(err){});
    }
    if (db) {
      var collection = db.collection('users');
      collection.drop();
    }

    res.contentType('application/json');
    res.send('{ response:ok }');

});

app.get('/getAllUsersData', function (req, res) {

    if (!db) {
      initDb(function(err){});
    }
    if (db) {
      
      db.collection('users').find().toArray(function(err, docs) {
        //imprimimos en la consola el resultado
        for(i in docs){
          delete docs[i]._id;
        }
        console.log(JSON.stringify(docs));
        console.dir(docs);
        res.contentType('application/json');
        res.send(JSON.stringify(docs));
      });
    } 


});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

//app.listen(port);
//console.log('todo list RESTful API server started on: ' + port);


module.exports = app ;
