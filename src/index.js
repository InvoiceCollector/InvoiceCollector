const express = require('express');
const bodyParser = require('body-parser');

const { MissingField } = require('./error.js')
const { Server } = require('./server.js');

const app = express()
app.use(bodyParser.json());
const server = new Server();

process.env.PORT = 8080

ENV_VARIABLES = [
    "PORT",
]

app.get('/api/v1/collectors', (req, res) => {
    console.log(`GET collectors`);

    const response = server.collectors()

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
});

app.post('/api/v1/collect', async (req, res) => {
    try {
        //Check if webhook field is missing
        if(!req.body.hasOwnProperty("webhook")) {
            throw new MissingField("webhook");
        }

        //Check if collector field is missing
        if(!req.body.hasOwnProperty("collector")) {
            throw new MissingField("collector");
        }

        console.log(`POST collect ${req.body.collector}`);

        const response = await server.post_collect(req.body.collector, req.body.params);
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
