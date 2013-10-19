// Generated by CoffeeScript 1.6.3
var Doc, app, check, clients, config, crypto, db, expect, express, getUserFrom, io, log, mongo, server, sha1, stringify,
  __hasProp = {}.hasOwnProperty;

config = require('./config.json');

express = require('express');

app = express();

server = require('http').createServer(app);

io = require('socket.io').listen(server);

crypto = require('crypto');

mongo = require('mongojs');

/*
  Global variables
*/


db = mongo.connect(config.database, ['keys']);

log = io.log;

/*
  Clients list.
  namespace/user_id => socket
*/


clients = {};

/*
  Socket.io configuration
*/


io.configure('production', function() {
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
  io.set('log level', 1);
  return io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});

/*
  Global configuration
*/


io.configure(function() {
  return io.set('authorization', function(handshakeData, callback) {
    handshakeData.namespace = handshakeData.query['namespace'];
    return callback(null, true);
  });
});

/*
  Cross domain requests
*/


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  return next();
});

/*
  Body parser
*/


app.use(express.bodyParser());

/*
  Start server listening on port.
*/


server.listen(config.server.port);

/*
  Check status
*/


app.get('/status', function(req, res) {
  return res.send('All systems operational');
});

/*
  Check JSON function
*/


expect = function(json, pattern, throws, current) {
  var at, condition, key, value;
  if (current == null) {
    current = [];
  }
  condition = false;
  for (key in pattern) {
    if (!__hasProp.call(pattern, key)) continue;
    value = pattern[key];
    at = current.concat([key]);
    if (typeof value === 'boolean') {
      condition = value === true ? json[key] != null : json[key] == null;
      if (!condition && throws) {
        throw (value === true ? 'expected' : 'unexpected') + ' ' + at.join(' ');
      }
    } else {
      if (json[key] != null) {
        condition = expect(json[key], value, throws, at);
      } else {
        condition = false;
        if (throws) {
          throw 'expected ' + at.join(' ');
        }
      }
    }
  }
  return condition;
};

/*
  Message sent.
*/


app.post('/send', function(req, res) {
  var body, error, json,
    _this = this;
  json = new Buffer(req.body.encode, 'base64').toString('utf8').substring(0, 3000);
  try {
    body = JSON.parse(json);
  } catch (_error) {
    error = _error;
    return res.json({
      error: 'json error'
    });
  }
  return check(body, function(error, data, doc) {
    var socket, throws;
    if (data === null) {
      return res.json({
        error: error
      });
    }
    try {
      expect(data, {
        room: true,
        user: {
          id: true
        }
      }, throws = true);
    } catch (_error) {
      error = _error;
      return res.json({
        error: error
      });
    }
    socket = clients[doc.namespace + '/' + data.user.id];
    if (socket == null) {
      return res.json({
        error: 'no socket'
      });
    }
    socket.broadcast.to(data.room).emit('message', data);
    socket.emit('message', data);
    return res.json({
      error: false
    });
  });
});

/*
  Get user from socket
*/


getUserFrom = function(socket, callback) {
  return socket.get('user', function(error, user) {
    if (user && error === null) {
      return callback(user);
    } else {
      return socket.emit('reconnect');
    }
  });
};

/*
  Dynamic namespaces for socket.io
*/


io.sockets.on('connection', function(socket) {
  var namespace;
  namespace = '/' + socket.handshake.namespace.toLowerCase();
  if (io.namespaces[namespace]) {
    return;
  }
  return io.of(namespace).on('connection', function(socket) {
    socket.on('login', function(body) {
      if (body.ip != null) {
        body.ip = socket.handshake.address.address;
      }
      return check(body, function(error, data) {
        var ocs, throws, usersList;
        if (error !== null) {
          return socket.emit('error', error);
        }
        try {
          expect(data, {
            user: {
              id: true
            }
          }, throws = true);
        } catch (_error) {
          error = _error;
          return socket.emit('error', error);
        }
        if (ocs = clients[namespace + '/' + data.user.id]) {
          ocs.emit('error', 'over client connected');
        }
        clients[namespace + '/' + data.user.id] = socket;
        socket.join('private-' + data.user.id);
        socket.set('user', data.user);
        usersList = [];
        io.of(namespace).clients().forEach(function(client) {
          return getUserFrom(client, function(user) {
            return usersList.push(user);
          });
        });
        socket.emit('synchronize', usersList);
        return socket.emit('login_success');
      });
    });
    socket.on('join', function(room) {
      return getUserFrom(socket, function(user) {
        socket.join(room);
        log.debug(namespace + '/' + room + ': join ' + user.name);
        return io.of(namespace)["in"](room).emit('user_join', user);
      });
    });
    return socket.on('disconnect', function() {
      return getUserFrom(socket, function(user) {
        delete clients[namespace + '/' + user.id];
        return io.of(namespace).emit('user_leave', user);
      });
    });
  });
});

/*
   SHA1 function
*/


sha1 = function(input) {
  return crypto.createHash('sha1').update(input, 'utf8').digest('hex');
};

/*
  Stringify function
*/


stringify = function(data) {
  var key, value;
  if (typeof data === 'object') {
    return '[' + ((function() {
      var _results;
      _results = [];
      for (key in data) {
        value = data[key];
        _results.push(key + ':' + stringify(value));
      }
      return _results;
    })()).join(',') + ']';
  } else {
    return data.toString();
  }
};

/*
  Doc Class
*/


Doc = (function() {
  function Doc(i) {
    var _ref, _ref1, _ref2, _ref3;
    this.domain = (_ref = i.domain) != null ? _ref : 'nodomain';
    this.namespace = (_ref1 = i.namespace) != null ? _ref1 : '/' + this.domain;
    this.key = (_ref2 = i.key) != null ? _ref2 : '';
    this.maxOnline = (_ref3 = i.maxOnline) != null ? _ref3 : 5;
  }

  return Doc;

})();

/*
  data may contain next:
    hash - hash of all staff
    domain - domain for finding key

  callback may be a function (error, data, doc)
*/


check = function(data, callback) {
  var userHash;
  if (data._hash === null) {
    return callback('no hash', null);
  }
  userHash = data._hash;
  delete data._hash;
  return db.keys.findOne({
    domain: data._domain
  }, function(error, json) {
    var checkHash, doc;
    if (json === null || error !== null) {
      return callback('key not found', null, null);
    }
    doc = new Doc(json);
    data._key = doc.key;
    checkHash = sha1(stringify(data));
    delete data._key;
    delete data._domain;
    if (userHash === checkHash) {
      return callback(null, data, doc);
    } else {
      return callback('hash not match', null, null);
    }
  });
};

/*
//@ sourceMappingURL=server.map
*/
