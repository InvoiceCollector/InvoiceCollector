const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const { StatusError } = require('./error.js')
const { Server } = require('./server.js');

const app = express()
app.use(bodyParser.json());
const server = new Server();

ENV_VARIABLES = [
    "PORT",
    "REDIS_HOST",
    "REDIS_PORT",
    "LOG_SERVER_ENDPOINT"
]

// ---------- AUTHORIZE ----------

function handle_error(e, res){
    let status = 500;
    if(e instanceof StatusError) {
        status = e.status_code;
    }
    else {
        console.error(e);
    }
    res.status(status).end(JSON.stringify({type: "error", reason: e.message}));
}

app.post('/api/v1/authorize', async (req, res) => {
    try {
        // Perform authorization
        console.log('POST authorize');
        const response = await server.post_authorize(req.headers.authorization, req.body.remote_id);

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        handle_error(e, res);
    }
});

// ---------- OAUTH TOKEN NEEDED ----------

app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/api/v1/user', (req, res) => {
    try {
        // Check if token exists
        server.get_token_mapping(req.query.token);

        // Send user.html
        res.sendFile(path.join(__dirname, '..', 'public', 'user.html'));
    } catch (e) {
        handle_error(e, res);
    }
});

app.get('/api/v1/credentials', async (req, res) => {
    try {
        // Get credentials
        console.log(`GET credentials`);
        const credentials = await server.get_credentials(req.query.token)

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(credentials));
    } catch (e) {
        handle_error(e, res);
    }
});

app.post('/api/v1/credential', async (req, res) => {
    try {
        // Save credential
        console.log(`POST credential`);
        await server.post_credential(req.query.token, req.body.key, req.body.params);

        // Build response
        res.end()
    } catch (e) {
        handle_error(e, res);
    }
});

app.delete('/api/v1/credential/:id', async (req, res) => {
    try {
        // Delete credential
        console.log(`DELETE credential ${req.params.id}`);
        await server.delete_credential(req.query.token, req.params.id);

        // Build response
        res.end()
    } catch (e) {
        handle_error(e, res);
    }
});

// ---------- NO OAUTH TOKEN NEEDED ----------

app.get('/api/v1/collectors', (req, res) => {
    try {
        // List all collectors
        console.log(`GET collectors`);
        const response = server.collectors();

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        handle_error(e, res);
    }
});

app.post('/api/v1/collect', async (req, res) => {
    try {
        // Collect invoices
        console.log(`POST collect ${req.body.collector}`);
        const response = await server.post_collect(req.authorization, req.body.collector);

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        handle_error(e, res);
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
