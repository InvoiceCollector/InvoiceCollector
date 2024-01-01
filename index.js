const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('./src/server.js');

const app = express()
app.use(bodyParser.json());
const server = new Server();

//TODO REMOVE
process.env["PORT"] = 3000;

ENV_VARIABLES = [
    "PORT",
]

app.get('/api/v1/collectors', (req, res) => {
    console.log(`GET collectors`);

    const response = server.collectors()

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
});

app.post('/api/v1/collect/:collector', async (req, res) => {
    console.log(`POST collect ${req.params.collector}`);

    try {
        const response = await server.post_collect(req.params.collector, req.body);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        console.error(e);
        res.status(400).end(JSON.stringify({type: "error", reason: e.message}));
    }
});

app.get('/api/v1/collect/:token', async (req, res) => {
    console.log(`GET collect ${req.params.collector}`);
	//TODO const response = await server.get_collect(req.params.token);

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
