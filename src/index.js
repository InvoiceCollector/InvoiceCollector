const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const { MissingField } = require('./error.js')
const { Server } = require('./server.js');

const app = express()
app.use(bodyParser.json());
const server = new Server();

ENV_VARIABLES = [
    "PORT",
]

// ---------- AUTHORIZE ----------

app.post('/api/v1/authorize', async (req, res) => {
    try {
        // Check if bearer field is missing
        if(!req.headers.hasOwnProperty("authorization") || !req.headers.authorization.startsWith("Bearer ")) {
            res.status(401).end("Invalid Bearer token");
        }
        const bearer = req.headers.authorization.split(' ')[1];

        //Check if callback field is missing
        if(!req.body.hasOwnProperty("callback")) {
            throw new MissingField("callback");
        }

        //Check if collector field is missing
        if(!req.body.hasOwnProperty("user_id")) {
            throw new MissingField("user_id");
        }

        // Perform authorization
        console.log('POST authorize');
        const response = await server.post_authorize(bearer, req.body.callback, req.body.user_id);

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        console.error(e);
        res.status(400).end(JSON.stringify({type: "error", reason: e.message}));
    }
});

// ---------- OAUTH TOKEN NEEDED ----------

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/api/v1/user', (req, res) => {
    // Check if token exists in query
    if(!req.query.hasOwnProperty("token") || !server.tokens.hasOwnProperty(req.query.token)) {
        res.status(401).end("Invalid token");
    }
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

// ---------- NO OAUTH TOKEN NEEDED ----------

app.get('/api/v1/collectors', (req, res) => {
    console.log(`GET collectors`);

    const response = server.collectors()

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
});

app.post('/api/v1/collect', async (req, res) => {
    try {
        //Check if callback field is missing
        if(!req.body.hasOwnProperty("callback")) {
            throw new MissingField("callback");
        }

        //Check if collector field is missing
        if(!req.body.hasOwnProperty("collector")) {
            throw new MissingField("collector");
        }

        console.log(`POST collect ${req.body.collector}`);

        const response = await server.post_collect(req.body);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        console.error(e);
        res.status(400).end(JSON.stringify({type: "error", reason: e.message}));
    }
});

function has_env_variables(){
	for(let env_var of ENV_VARIABLES) {
		if(! (env_var in process.env)) {
			return false
		}
	}
	return true
}

//Start
if(has_env_variables()){
    app.listen(process.env.PORT, () => {
        console.log(`App listening on port ${process.env.PORT}`)
    });
}
else {
    console.log(`In order to start the server, you must set following env variables: ${ENV_VARIABLES.join(', ')}`)
}
