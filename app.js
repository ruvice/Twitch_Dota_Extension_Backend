const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/status', (request, response) => response.json({clients: clients.length}));

const PORT = process.env.PORT;

let clients = [];
let facts = [];

app.listen(PORT, () => {
  console.log(`Facts Events service listening at https://twitch-dota-extension-backend.herokuapp.com/${PORT}`)
})

// ...

function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify(facts)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}
console.log(clients)

app.get('/events', eventsHandler);

// ...

function sendEventsToAll(newFact) {
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
}

var d2gsi = require('dota2-gsi');
var server = new d2gsi(
  {
    port: PORT
  }
);

server.events.on('newclient', function(client) {
    console.log("New client connection, IP address: " + client.ip);
    if (client.auth && client.auth.token) {
        console.log("Auth token: " + client.auth.token);
    } else {
        console.log("No Auth token");
    }

    client.on('player:activity', function(activity) {
        if (activity == 'playing') console.log("Game started!");
    });
    client.on('hero:level', function(level) {
        console.log("Now level " + level);
        return sendEventsToAll(`Now level ${level}`);
    });
    client.on('abilities:ability0:can_cast', function(can_cast) {
        if (can_cast) console.log("Ability0 off cooldown!");
    });
});