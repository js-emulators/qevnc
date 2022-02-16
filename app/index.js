const fs = require("fs");

const path = require("path");

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

var settings = JSON.parse(fs.readFileSync("../settings.json").toString());

function json_to_args(e) {
  var n = [];
  for (var t in e) {
    n.push("-" + t + " " + e[t]);
  }
  return n.join(" ")
}

settings = json_to_args(settings);

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
app.use(express.json())
var httpServer = http.createServer(app);
app.get('/vnc.js', function(req, res){
  res.sendFile(__dirname + '/vnc.js');
})

app.post('/api/init', function(req, res){
	var port = portgen();
	var http_default = "59" + port;
	var e = settings.split(" ");
	e.push("-vnc");
	e.push("127.0.0.1:" + http_default);
	res.send({success: true, port: "59" + port});
	global.processes[http_default] = spawn("qemu-system-x86_64 " + e, {shell: true, stdio: "inherit"});
});
app.post('/api/reboot', function(req, res){
	var port = portgen();
	var port_to_kill = req.body.port;
	console.log(req.body, req.body.port);
	var http_default = "59" + port;
	var e = settings.split(" ");
	e.push("-vnc");
	e.push("127.0.0.1:" + http_default);
portrm(port_to_kill)
setTimeout(function(){
	global.processes[http_default] = spawn("qemu-system-x86_64 " + e, {shell: true, stdio: "inherit"});
}, 5000);
	res.send({success: true, port: "59" + port});
	});
app.post('/api/off', function(req, res){
		var port_to_kill = req.body.port;
portrm(port_to_kill);
	res.send({success: true});
});

app.get('/', function(req, res){
	res.send(`
	<style>
.display {
	position: fixed;
	transform: translate(-50%, -50%);
	left: 50%;
	top: 50%;
}
</style>
<body>
  <script src="vnc.js"></script>
  <div style="position: absolute; transform: translate(-50%, -50%); top: 10%; background: white; left: 50%; opacity: 50%; border-style: solid; z-index: 9999999999999999999999999; display: none;" id="control">
<button style="border: none; background: none; cursor: pointer; margin: 0; padding: 0;" onclick="reboot()" id="reboot-btn"><img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMjUiCiAgIGhlaWdodD0iMjUiCiAgIHZpZXdCb3g9IjAgMCAyNSAyNSIKICAgaWQ9InN2ZzIiCiAgIHZlcnNpb249IjEuMSIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45MSByMTM3MjUiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImRpc2Nvbm5lY3Quc3ZnIgogICBpbmtzY2FwZTpleHBvcnQtZmlsZW5hbWU9Ii9ob21lL29zc21hbi9kZXZlbC9ub1ZOQy9pbWFnZXMvZHJhZy5wbmciCiAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSI5MCIKICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjkwIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzNCIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9ImJhc2UiCiAgICAgcGFnZWNvbG9yPSIjOTU5NTk1IgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnpvb209IjE2IgogICAgIGlua3NjYXBlOmN4PSIyNS4wNTcwNyIKICAgICBpbmtzY2FwZTpjeT0iMTEuNTk0ODU4IgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIHVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpzbmFwLWJib3g9InRydWUiCiAgICAgaW5rc2NhcGU6YmJveC1wYXRocz0idHJ1ZSIKICAgICBpbmtzY2FwZTpiYm94LW5vZGVzPSJ0cnVlIgogICAgIGlua3NjYXBlOnNuYXAtYmJveC1lZGdlLW1pZHBvaW50cz0idHJ1ZSIKICAgICBpbmtzY2FwZTpvYmplY3QtcGF0aHM9InRydWUiCiAgICAgc2hvd2d1aWRlcz0idHJ1ZSIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTEzNiIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iMjciCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpzbmFwLXNtb290aC1ub2Rlcz0idHJ1ZSIKICAgICBpbmtzY2FwZTpvYmplY3Qtbm9kZXM9InRydWUiCiAgICAgaW5rc2NhcGU6c25hcC1pbnRlcnNlY3Rpb24tcGF0aHM9InRydWUiCiAgICAgaW5rc2NhcGU6c25hcC1ub2Rlcz0idHJ1ZSIKICAgICBpbmtzY2FwZTpzbmFwLWdsb2JhbD0iZmFsc2UiPgogICAgPGlua3NjYXBlOmdyaWQKICAgICAgIHR5cGU9Inh5Z3JpZCIKICAgICAgIGlkPSJncmlkNDEzNiIgLz4KICA8L3NvZGlwb2RpOm5hbWVkdmlldz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE3Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZT48L2RjOnRpdGxlPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlua3NjYXBlOmxhYmVsPSJMYXllciAxIgogICAgIGlua3NjYXBlOmdyb3VwbW9kZT0ibGF5ZXIiCiAgICAgaWQ9ImxheWVyMSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC0xMDI3LjM2MjIpIj4KICAgIDxnCiAgICAgICBpZD0iZzUxNzEiCiAgICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjQuMDYyNDk5LC02LjE1Nzc1ZS00KSI+CiAgICAgIDxwYXRoCiAgICAgICAgIGlkPSJwYXRoNTExMCIKICAgICAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwxMDI3LjM2MjIpIgogICAgICAgICBkPSJtIDM5Ljc0NDE0MSwzLjQ5NjA5MzggYyAtMC43Njk5MjMsMCAtMS41Mzk2MDcsMC4yOTE1NDY4IC0yLjEyMTA5NCwwLjg3MzA0NjggbCAtMi41NjY0MDYsMi41NjY0MDYzIDEuNDE0MDYyLDEuNDE0MDYyNSAyLjU2NjQwNiwtMi41NjY0MDYzIGMgMC40MDM5NzQsLTAuNDA0IDEuMDEwMDg5LC0wLjQwNCAxLjQxNDA2MywwIGwgMi44MjgxMjUsMi44MjgxMjUgYyAwLjQwMzk4LDAuNDAzOSAwLjQwMzkwNywxLjAxMDE2MjEgMCwxLjQxNDA2MjkgbCAtMi41NjY0MDYsMi41NjY0MDYgMS40MTQwNjIsMS40MTQwNjIgMi41NjY0MDYsLTIuNTY2NDA2IGMgMS4xNjMwNDEsLTEuMTYyOSAxLjE2Mjk2OCwtMy4wNzkxODc0IDAsLTQuMjQyMTg3NCBMIDQxLjg2NTIzNCw0LjM2OTE0MDYgQyA0MS4yODM3NDcsMy43ODc2NDA2IDQwLjUxNDA2MywzLjQ5NjA5MzcgMzkuNzQ0MTQxLDMuNDk2MDkzOCBaIE0gMzkuMDE3NTc4LDkuMDE1NjI1IGEgMS4wMDAxLDEuMDAwMSAwIDAgMCAtMC42ODc1LDAuMzAyNzM0NCBsIC0wLjQ0NTMxMiwwLjQ0NTMxMjUgMS40MTQwNjIsMS40MTQwNjIxIDAuNDQ1MzEzLC0wLjQ0NTMxMiBBIDEuMDAwMSwxLjAwMDEgMCAwIDAgMzkuMDE3NTc4LDkuMDE1NjI1IFogbSAtNi4zNjMyODEsMC43MDcwMzEyIGEgMS4wMDAxLDEuMDAwMSAwIDAgMCAtMC42ODc1LDAuMzAyNzM0OCBMIDI4LjQzMTY0MSwxMy41NjI1IGMgLTEuMTYzMDQyLDEuMTYzIC0xLjE2Mjk3LDMuMDc5MTg3IDAsNC4yNDIxODggbCAyLjgyODEyNSwyLjgyODEyNCBjIDEuMTYyOTc0LDEuMTYzMTAxIDMuMDc5MjEzLDEuMTYzMTAxIDQuMjQyMTg3LDAgbCAzLjUzNTE1NiwtMy41MzUxNTYgYSAxLjAwMDEsMS4wMDAxIDAgMSAwIC0xLjQxNDA2MiwtMS40MTQwNjIgbCAtMy41MzUxNTYsMy41MzUxNTYgYyAtMC40MDM5NzQsMC40MDQgLTEuMDEwMDg5LDAuNDA0IC0xLjQxNDA2MywwIGwgLTIuODI4MTI1LC0yLjgyODEyNSBjIC0wLjQwMzk4MSwtMC40MDQgLTAuNDAzOTA4LC0xLjAxMDE2MiAwLC0xLjQxNDA2MyBsIDMuNTM1MTU2LC0zLjUzNzEwOSBBIDEuMDAwMSwxLjAwMDEgMCAwIDAgMzIuNjU0Mjk3LDkuNzIyNjU2MiBaIG0gMy4xMDkzNzUsMi4xNjIxMDk4IC0yLjM4MjgxMywyLjM4NDc2NSBhIDEuMDAwMSwxLjAwMDEgMCAxIDAgMS40MTQwNjMsMS40MTQwNjMgbCAyLjM4MjgxMiwtMi4zODQ3NjYgLTEuNDE0MDYyLC0xLjQxNDA2MiB6IgogICAgICAgICBzdHlsZT0iY29sb3I6IzAwMDAwMDtmb250LXN0eWxlOm5vcm1hbDtmb250LXZhcmlhbnQ6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXN0cmV0Y2g6bm9ybWFsO2ZvbnQtc2l6ZTptZWRpdW07bGluZS1oZWlnaHQ6bm9ybWFsO2ZvbnQtZmFtaWx5OnNhbnMtc2VyaWY7dGV4dC1pbmRlbnQ6MDt0ZXh0LWFsaWduOnN0YXJ0O3RleHQtZGVjb3JhdGlvbjpub25lO3RleHQtZGVjb3JhdGlvbi1saW5lOm5vbmU7dGV4dC1kZWNvcmF0aW9uLXN0eWxlOnNvbGlkO3RleHQtZGVjb3JhdGlvbi1jb2xvcjojMDAwMDAwO2xldHRlci1zcGFjaW5nOm5vcm1hbDt3b3JkLXNwYWNpbmc6bm9ybWFsO3RleHQtdHJhbnNmb3JtOm5vbmU7ZGlyZWN0aW9uOmx0cjtibG9jay1wcm9ncmVzc2lvbjp0Yjt3cml0aW5nLW1vZGU6bHItdGI7YmFzZWxpbmUtc2hpZnQ6YmFzZWxpbmU7dGV4dC1hbmNob3I6c3RhcnQ7d2hpdGUtc3BhY2U6bm9ybWFsO2NsaXAtcnVsZTpub256ZXJvO2Rpc3BsYXk6aW5saW5lO292ZXJmbG93OnZpc2libGU7dmlzaWJpbGl0eTp2aXNpYmxlO29wYWNpdHk6MTtpc29sYXRpb246YXV0bzttaXgtYmxlbmQtbW9kZTpub3JtYWw7Y29sb3ItaW50ZXJwb2xhdGlvbjpzUkdCO2NvbG9yLWludGVycG9sYXRpb24tZmlsdGVyczpsaW5lYXJSR0I7c29saWQtY29sb3I6IzAwMDAwMDtzb2xpZC1vcGFjaXR5OjE7ZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoyO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2UtZGFzaG9mZnNldDowO3N0cm9rZS1vcGFjaXR5OjE7Y29sb3ItcmVuZGVyaW5nOmF1dG87aW1hZ2UtcmVuZGVyaW5nOmF1dG87c2hhcGUtcmVuZGVyaW5nOmF1dG87dGV4dC1yZW5kZXJpbmc6YXV0bztlbmFibGUtYmFja2dyb3VuZDphY2N1bXVsYXRlIgogICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIiAvPgogICAgICA8cmVjdAogICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjcwNzEwNjc4LC0wLjcwNzEwNjc4LDAuNzA3MTA2NzgsMC43MDcxMDY3OCwwLDApIgogICAgICAgICB5PSI3NTIuMjk1NDEiCiAgICAgICAgIHg9Ii03MTIuMzEyNjIiCiAgICAgICAgIGhlaWdodD0iMTguMDAwMDE3IgogICAgICAgICB3aWR0aD0iMyIKICAgICAgICAgaWQ9InJlY3Q1MTE2IgogICAgICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MjtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLWRhc2hvZmZzZXQ6MDtzdHJva2Utb3BhY2l0eToxIiAvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==" width="50" style="filter: invert(100%);"> 
</button>
</div>
<div id="reboot_message" style="border: 1px solid black; position: fixed; transform: translate(-50%, -50%); top: 50%; left: 50%; font-family: 'Lucida Console', 'Courier New', monospace; background: white; display: none; z-index: 99999999999999999999999999999999999999999999999999;">Rebooting virtual machine...</div>
      <div id="screen-wrapper" class="display" style="display: none;">
          <canvas id="screen" style="background: black;">
          </canvas>
        </div>
		<button id="connect" style="position: absolute; transform: translate(-50%, -50%); left: 50%; top: 50%;" onclick="init()">Connect</button>
		<small style="position: absolute; transform: translate(-50%, -50%); left: 50%; top: 60%; display: none;"> Initializing virtual machine... </small>
<script>
function init(){
document.querySelector('#connect').disabled = true;
document.querySelector('small').style.display = "block";
bootUp();
};

function bootUp(){
fetch('http://localhost:8080/api/init', {
    method: 'POST'
})
.then(res => res.json())
.then(function(res){
window.vnc_port = res.port;
setTimeout(function(){
 vnc(svnc => {
    /* attach screen to canvas, create client */
var canvas = document.getElementById('screen'),
  screen = new svnc.Screen(canvas),
  client = new svnc.Client(screen);

var screenWrapper = document.getElementById('screen-wrapper');

  var config = {
    host: "127.0.0.1",
    port: res.port
  };

  /* connect to a vnc server */
  client.connect(config).then(function() {
    screenWrapper.style.display = 'block';
document.querySelector('#connect').style.display = "none";
document.querySelector('#control').style.display = "block";
document.querySelector('small').style.display = "none";
document.body.onbeforeunload = function(){
fetch('http://localhost:8080/api/off', {
    method: 'POST',
	  headers: {
        'Content-Type': 'application/json'
    },
	body: JSON.stringify({port: window.vnc_port})
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
fetch('http://localhost:8080/api/reboot', {
    method: 'POST',
	  headers: {
        'Content-Type': 'application/json'
    },
	body: JSON.stringify({port: window.vnc_port})
})
.then(res => res.json())
.then(function(res){
const context = document.querySelector('canvas').getContext('2d');
	document.querySelector('#reboot_message').style.display = 'block';
		document.querySelector('#reboot-btn').style.display = 'none';
context.clearRect(0, 0, document.querySelector('canvas').width, document.querySelector('canvas').height);

setTimeout(function(){
 vnc(svnc => {
    /* attach screen to canvas, create client */
var canvas = document.getElementById('screen'),
  screen = new svnc.Screen(canvas),
  client = new svnc.Client(screen);

var screenWrapper = document.getElementById('screen-wrapper');

  var config = {
    host: "127.0.0.1",
    port: res.port
  };

  /* connect to a vnc server */
  client.connect(config).then(function() {
    screenWrapper.style.display = 'block';
	document.querySelector('#reboot_message').style.display = 'none';
		document.querySelector('#reboot-btn').style.display = 'block';
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

const loadMainWindow = () => {
	var debugging = false;
    const mainWindow = new BrowserWindow({
        width : 1040,
        height: 807,
		 maximizable : false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadURL("http://localhost:8080");
	
	mainWindow.setResizable(false);
		
	    if (debugging == true) {    mainWindow.webContents.openDevTools()    }
}

appe.on("ready", loadMainWindow);

appe.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    appe.quit();
  }
});
appe.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        loadMainWindow();
    }
});
