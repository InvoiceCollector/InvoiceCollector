const express = require('express');
const { Server } = require('./src/server.js');
const fs = require('fs');

const app = express()
const server = new Server();

//TODO REMOVE
process.env["PORT"] = 3000;

ENV_VARIABLES = [
    "PORT",
]

app.get('/collectors', (req, res) => {
    const response = server.collectors()

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
});

app.post('/collect/:collector', (req, res) => {
    try {
        const response = server.collect(req.params.collector, req.body);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        res.status(400).send(e);
    }
});

app.get('/collect/:token', async (req, res) => {
	//TODO const response = await server.getStatus(req.params.token);

    res.setHeader('Content-Type', 'application/json');
    //res.end(JSON.stringify(response));
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

(async () => {
    if(has_env_variables()){
        await server.start();
        app.listen(process.env.PORT, () => {
            console.log(`App listening on port ${process.env.PORT}`)
        });
    }
    else {
        console.log(`In order to start the server, you must set following env variables: ${ENV_VARIABLES.join(', ')}`)
    }
})();
