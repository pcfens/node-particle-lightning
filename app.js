var express = require('express')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var Particle = require('particle-api-js');
var particle = new Particle();

var fs = require('fs')

if (process.env.CONFIG_FILE) {
  var config = JSON.parse(fs.readFileSync(process.env.CONFIG_FILE, 'utf8'));
} else {
  if (fs.existsSync('./config.json')){
    var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  } else if (process.env.CONFIG_BODY) {
    var config = JSON.parse(fs.env.CONFIG_BODY);
  } else {
    console.log('A config file should be specified in the CONFIG_FILE environment');
    console.log('variable or should exist at config.json.');
    console.log('If you want to use an environment variable, you can put JSON in an');
    console.log('environment variable named CONFIG_BODY');
    process.exit(1);
  }
}

server.listen(config['port']);
app.use(express.static('public'));
console.log('Listening on port ' + config['port']);

io.of('lightning_sensor').on('connection', function(socket){
  var date = new Date();
  socket.emit('sensor-interrupt', {
    type: 'message',
    message: 'Connected',
    timestamp: date.getHours() + ':' + date.getMinutes()
  });
});

particle.login(config['particle']).then(
  function(data){
    token = data.body.access_token;
    particle.getEventStream({ deviceId: 'mine', auth: token }).then(function(stream) {
      stream.on('event', function(data) {
        console.log('Event: ', data.name);
        var date = new Date();

        if(data.name == 'lightning/strike'){
          io.of('lightning_sensor').emit('sensor-interrupt', {
            type: 'strike',
            distance: data.data,
            timestamp: date.getHours() + ':' + date.getMinutes()
          });
        } else {
          io.of('lightning_sensor').emit('sensor-interrupt', {
            type: 'noise',
            message: data.data,
            timestamp: date.getHours() + ':' + date.getMinutes()
          });
        }
      });
    });
  },
  function(err) {
    console.log('It broke: ', err)
  }
)
