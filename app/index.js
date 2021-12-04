global.processes = [];
var existing_ports = [];
function portgen(){
var rnlength = Math.random().toString().split('.').pop().split('').length;
var rnum = Math.random().toString().split('.').pop().split('').slice(0, 2);
global.new_rnum="";
if (rnum[0] == '0') {
new_rnum = '1' +  rnum[1]
}
else {
new_rnum = rnum.join('');
}
if (existing_ports.indexOf(new_rnum) !== -1) {
existing_ports.push(new_rnum);
} 
return new_rnum;
}

function portrm(port){
       existing_ports = existing_ports.filter(function(ele){ 
            return ele != port; 
        });
		global.processes[port].kill();
		
}

var { spawn } = require('child_process');
var http = require('http');
var express = require('express');
var svnc = require('../index.js');

/* serve your app */
var app = express();
app.use(require('express-all-allow')())
var httpServer = http.createServer(app);
app.get('/vnc.js', function(req, res){
  res.sendFile(__dirname + '/vnc.js');
})

app.post('/api/init', function(req, res){
	var port = portgen();
	var http_default = "59" + port;
	res.send({success: true, port: "59" + port});
	global.processes[http_default] = spawn("qemu-system-x86_64", ["-boot","d","-cdrom","kolibri.iso","-vnc","127.0.0.1:" + port], {stdio: "inherit"});
});
app.post('/api/reboot', function(req, res){
	var port = portgen();
	var port_to_kill = req.body.port;
	var http_default = "59" + port;
portrm(port_to_kill)
setTimeout(function(){
	global.processes[http_default] = spawn("qemu-system-x86_64", ["-boot","d","-cdrom","kolibri.iso","-vnc","127.0.0.1:" + port], {stdio: "inherit"});
}, 5000);
	res.send({success: true, port: "59" + port});
	});
app.post('/api/off', function(req, res){
		var port_to_kill = req.body.port;
portrm(port_to_kill);
	res.send({success: true});
});
app.get('/', function(req, res){
  res.send(`<body>
  <script src="vnc.js"></script>
      <div id="screen-wrapper" style="display: none;">
          <canvas id="screen">
          </canvas>
        </div>
		<button style="position: absolute; transform: translate(-50%, -50%); left: 50%; top: 50%;" onclick="init()">Connect</button>
		<small style="position: absolute; transform: translate(-50%, -50%); left: 50%; top: 60%; display: none;"> Initializing virtual machine... </small>
<script>
function init(){
document.querySelector('button').disabled = true;
document.querySelector('small').style.display = "block";
bootUp();
};

function bootUp(){
fetch('/api/init', {
    method: 'POST'
})
.then(res => res.json())
.then(function(res){
setTimeout(function(){
 vnc(svnc => {
    /* attach screen to canvas, create client */
var canvas = document.getElementById('screen'),
  screen = new svnc.Screen(canvas),
  client = new svnc.Client(screen);

var screenWrapper = document.getElementById('screen-wrapper');

 window.config = {
    host: "127.0.0.1",
    port: res.port
  };

alert(config.port);
  /* connect to a vnc server */
  client.connect(config).then(function() {
    screenWrapper.style.display = 'block';
document.querySelector('button').style.display = "none";
document.querySelector('small').style.display = "none";
document.body.onbeforeunload = function(){
fetch('/api/off', {
    method: 'POST',
	body: JSON.stringify({port: config.port})
})
}
  }).catch(function(error) {
    console.error('Connect failed:', error);
  })
}, false);
}, 10000);
})
;
}

function reboot(){
fetch('/api/reboot', {
    method: 'POST'
})
.then(function(){
const context = document.querySelector('canvas').getContext('2d');

context.clearRect(0, 0, document.querySelector('canvas').width, document.querySelector('canvas').height);

setTimeout(function(){
 vnc(svnc => {
    /* attach screen to canvas, create client */
var canvas = document.getElementById('screen'),
  screen = new svnc.Screen(canvas),
  client = new svnc.Client(screen);

var screenWrapper = document.getElementById('screen-wrapper');

 window.config = {
    host: "127.0.0.1",
    port: "5904"
  };

  /* connect to a vnc server */
  client.connect(config).then(function() {
    screenWrapper.style.display = 'block';
  }).catch(function(error) {
    console.error('Connect failed:', error);
  })
}, false);
}, 15000);
})
;
}
</script>
</body>`);
})
httpServer.listen(8080);
console.log('Listening on port', 8080);

/* fire up simplevnc server */
var server = new svnc.Server(httpServer);
server.on('connect', function(client){
  console.log('svnc client connected');
})
server.on('disconnect', function(client){
  console.log('svnc client disconnected');
})
server.on('error', function(err){
  console.error('svnc error', err)
})