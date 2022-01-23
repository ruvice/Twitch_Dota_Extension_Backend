/*
    Todo:
    1. Implement PubSub Message
    2. Remove unnecessary code if 1 works
    3. Consider looking into ways streamers can customise messages
*/
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
var jwt = require('jsonwebtoken');
const axios = require('axios')

const queries = require('./queries');

const httpLink = createHttpLink({
  uri: 'https://api.stratz.com/graphql',
  fetch: fetch
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = process.env.STRATZ_API_TOKEN
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { INIT_VOTE_HERO, getSteamId32 } = require('./helper')
const { handleEventString, getRandom } = require('./queryHelper')

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
const PORT = 3000;

let viewerClients = {}; // Identifies viewers
/* viewerClients = {
    streamerId: [viewerIp1, viewerIp2...]
}
*/
let gsiClients = []; // Identifies streamers using Dota 2 GSI
let voteHero = {}
let streamerIDMapping = {}

var eventEmitter = require('events').EventEmitter;
var events = new eventEmitter();

// GSI Client Code
function gsi_client (ip, auth) {
    this.ip = ip;
    this.auth = auth;
    this.gamestate = {};
}
gsi_client.prototype.__proto__ = eventEmitter.prototype;

function Check_client(req, res, next) {
    // Check if this IP is already talking to us
    for (var i = 0; i < gsiClients.length; i++) {
        if (gsiClients[i].ip == req.ip) {
            req.client = gsiClients[i];
            return next();
        }
    }

    // Create a new client
    gsiClients.push(new gsi_client(req.ip, req.body.auth));
    req.client = gsiClients[gsiClients.length - 1];
    req.client.gamestate = req.body;

    // Notify about the new client
    events.emit('newclient', gsiClients[gsiClients.length - 1]);

    next();
}

function Emit_all(prefix, obj, emitter) {
    Object.keys(obj).forEach(function(key) {
        // For scanning keys and testing
        // emitter.emit("key", ""+prefix+key);
        // console.log("Emitting '"+prefix+key+"' - " + obj[key]);
        emitter.emit(prefix+key, obj[key]);
    });
}

function Recursive_emit(prefix, changed, body, emitter) {
    Object.keys(changed).forEach(function(key) {
        if (typeof(changed[key]) == 'object') {
            if (body[key] != null) { // safety check
                Recursive_emit(prefix+key+":", changed[key], body[key], emitter);
            }
        } else {
            // Got a key
            if (body[key] != null) {
                if (typeof body[key] == 'object') {
                    // Edge case on added:item/ability:x where added shows true at the top level
                    // and doesn't contain each of the child keys
                    Emit_all(prefix+key+":", body[key], emitter);
                } else {
                    // For scanning keys and testing
                    // emitter.emit("key", ""+prefix+key);
                    // console.log("Emitting '"+prefix+key+"' - " + body[key]);
                    emitter.emit(prefix+key, body[key]);
                }
            }
        }
    });
}

function Process_changes(section) {
    return function(req, res, next) {
        if (req.body[section]) {
            // console.log("Starting recursive emit for '" + section + "'");
            Recursive_emit("", req.body[section], req.body, req.client);
        }
        next();
    }
}

function Update_gamestate(req, res, next) {
    req.client.gamestate = req.body;
    next();
}

function New_data(req, res) {
    req.client.emit('newdata', req.body);
    res.end();
}

// Not sure how critical this is, not used atm
function Check_auth(tokens) {
    return function(req, res, next) {
        if (tokens) {
            if (req.body.auth && // Body has auth
                (req.body.auth.token == tokens || // tokens was a single string or
                (tokens.constructor === Array && // tokens was an array and
                tokens.indexOf(req.body.auth.token) != -1))) { // containing the token
                next();
            } else {
                // Not a valid auth, drop the message
                console.log("Dropping message from IP: " + req.ip + ", no valid auth token");
                res.end();
            }
        } else {
            next();
        }
    }
}

function sendEventsToAll(newEvent, streamerId) {
    viewerClients[streamerId]?.forEach(client => client.response.write(`data: ${JSON.stringify(newEvent)}\n\n`))
    // viewerClients.forEach(client => client.response.write(`data: ${JSON.stringify(newEvent)}\n\n`))
}


app.post('/',
    // Check_auth(tokens),
    Check_client,
    Update_gamestate,
    Process_changes('previously'),
    Process_changes('added'),
    New_data);

app.listen(process.env.PORT || PORT, () => {
  console.log(`Events service listening at https://twitch-dota-extension-backend.herokuapp.com/${PORT}`)
})


// GSI event
events.on('newclient', async function(client) {
    console.log("New client connection, IP address: " + client.ip);
    if (client.auth && client.auth.token) {
        console.log("Auth token: " + client.auth.token);
    } else {
    console.log("No Auth token");
    }
    
    client.on('player:activity', function(activity) {
        console.log(`Activity: ${activity}`)
    });

    client.on('map:win_team', function(win_team) {
        console.log(`Win Team: ${win_team}`)
        console.log(`On Team: ${client.gamestate.player.team_name}`)
        let isVictory = false
        if (win_team ==  client.gamestate.player.team_name) {
            isVictory = true
        }
        const eventInfo = {
            type: 'outcome',
            data: isVictory,
        }
        const tooltipString = handleEventString.outcome[0](isVictory)
        console.log(tooltipString)
        const clientSteamId32 = getSteamId32(BigInt(client.gamestate.player.steamid))
        return sendEventsToAll(eventInfo, clientSteamId32);
    });
    client.on('hero:level', function(level) {
        const clientSteamId32 = getSteamId32(BigInt(client.gamestate.player.steamid))
        console.log("Now level " + level);
        const eventInfo = {
            type: 'levelup',
            data: level,
        }
        const variables = {
            steamAccountId: clientSteamId32
        }
        if (level === 1) {
            const selectedQuery = getRandom(queries.begin.length-1)
            apolloClient.query({query: queries.begin[selectedQuery], variables})
            .then((result) => {
                const tooltipString = handleEventString.begin[selectedQuery](result)
                console.log(tooltipString)
            })
        } else {
            const selectedQuery = getRandom(queries.level.length-1)
            apolloClient.query({query: queries.level[selectedQuery], variables})
            .then((result) => {
                console.log(result)
                const tooltipString = handleEventString.level[selectedQuery](result, level) 
                const jwtToken = jwt.sign({
                    channel_id: streamerIDMapping[clientSteamId32],
                    pubsub_perms: {
                        send: ["broadcast"],
                    },
                    role: 'external',
                  }, process.env.TWITCH_SECRET, { expiresIn: '1h' });

                axios.post(`https://api.twitch.tv/helix/extensions/pubsub`, body={
                    'broadcaster_id': `${streamerIDMapping[clientSteamId32]}`,
                    'message': JSON.stringify({tooltipString: `${tooltipString}`}),
                    'target': ['broadcast'],
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`,
                            'Client_Id': `${Buffer.from(process.env.TWITCH_CLIENT_ID, 'base64')}`,
                            'Content_Type': 'application/json',
                        }
                    }
                )
                .then(res => {
                    console.log(`statusCode: ${res.status}`)
                    console.log(res)
                })
                .catch(error => {
                    console.error(error)
                })
                // axios({
                //     method: 'post',
                //     url: `https://api.twitch.tv/extensions/message/${streamerIDMapping[clientSteamId32]}`,
                //     headers: {
                //         'Authorization': `Bearer ${jwtToken}`,
                //         'Client-ID': `${process.env.TWITCH_CLIENT_ID}`,
                //         'Content_Type': 'application/json',
                //     },
                //     data: {
                //         channel_id: `${streamerIDMapping[clientSteamId32]}`,
                //         message: {tooltipString: `${tooltipString}`},
                //         targets: ['broadcast'],
                //     }
                // });
                console.log(tooltipString)
                console.log(result)
            })
            .catch((result) => console.log(result))
        }
        return sendEventsToAll(eventInfo, clientSteamId32);
    });
    client.on('player:kills', function(kills) {
        console.log(`Kills: ${kills}`)
        console.log(client.gamestate.player.kill_list)
        const eventInfo = {
            type: 'kill',
            data: {
                killList: client.gamestate.player.kill_list,
                kills: kills,
            },
        }
        const clientSteamId32 = getSteamId32(BigInt(client.gamestate.player.steamid))
        return sendEventsToAll(eventInfo, clientSteamId32);
    });
    client.on('hero:id', function(id){
        console.log("Picked " + id);
        const eventInfo = {
            type: 'pick',
            data: id,
        }
        const clientSteamId32 = getSteamId32(BigInt(client.gamestate.player.steamid))
        const variables = {
            heroId: id,
            steamAccountId: clientSteamId32
        }
        const selectedQuery = getRandom(queries.pick.length-1)
        apolloClient.query({query: queries.pick[selectedQuery], variables})
            .then((result) => {
                const tooltipString = handleEventString.pick[selectedQuery](result, id)
                console.log(tooltipString)
            })
            .catch((rejected) => console.log(rejected))
        return sendEventsToAll(eventInfo, clientSteamId32);
    })
});


// ...
// When new viewer connects
function eventsHandler(request, response, next) {
    const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    const streamerId = request.params.streamerId
    console.log(streamerId)

    const data = `data: Waiting for event\n\n`;

    response.write(data);

    const clientId = request.ip

    const newClient = {
        id: clientId,
        response
    };

    if (viewerClients[streamerId]){
        viewerClients[streamerId].push(newClient);
    } else {
        viewerClients[streamerId] = [newClient];
    }

    request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        viewerClients[streamerId] = viewerClients[streamerId]?.filter(client => client.id !== clientId);
    });
}

app.get('/events/:streamerId', eventsHandler);

function initHandler(req, res) {
    const channelId = req.body.channelId
    const streamerId = req.params.streamerId
    console.log(channelId)
    if (!(streamerId in streamerIDMapping)) {
        streamerIDMapping[streamerId] = channelId
    }
}
app.post('/init/:streamerId', initHandler);


// Voting
// Todo: function for votes, sendToAll doesnt work
function addVote(request, respsonse, next) {
    /*
    exampleBody = {
        streamerId: 12345,
        heroId: 43
    }
    */
    const newVote = request.body;
    voteHero[newVote.streamerId][newVote.heroId] += 1;
    respsonse.json(voteHero[newVote.streamerId]);
    const voteEventInfo = {
        type: 'voteHero',
        data: voteHero[newVote.streamerId]
    }
    return sendEventsToAll(voteEventInfo, newVote.streamerId);
}

function initVote(request, respsonse, next) {
    /*
    exampleBody = {
        streamerId: 12345
    }
    */
    const newVote = request.body;
    console.log(newVote)
    const streamerId = newVote.streamerId
    voteHero[streamerId] = INIT_VOTE_HERO;
    // Hard reset
    Object.keys(voteHero[streamerId]).forEach((key) => {
        voteHero[streamerId][key] = 0
    })
    respsonse.json(voteHero[streamerId]);
    const voteEventInfo = {
        type: 'voteHero',
        data: voteHero[streamerId]
    }
    console.log(voteHero)
    return sendEventsToAll(voteEventInfo, streamerId);
}

function stopVote(request, respsonse, next) {
    /*
    exampleBody = {
        streamerId: 12345
    }
    */
    const { streamerId } = request.body;
    delete voteHero[streamerId];
    respsonse.json(null);
    const voteEventInfo = {
        type: 'voteHero',
        data: null
    }
    console.log(voteHero)
    return sendEventsToAll(voteEventInfo, streamerId);
}

function getVote(request, response, next){
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    const streamerId = request.params.streamerId
    const data = `${JSON.stringify(voteHero[streamerId])}`
    response.write(data);
    response.end()
}
app.post('/vote/hero', addVote)
app.post('/initvote/hero', initVote)
app.post('/stopvote/hero', stopVote)
app.get('/votes/:streamerId', getVote)