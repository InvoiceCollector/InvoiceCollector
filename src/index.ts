import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { StatusError, TermsConditionsError } from "./error"
import { Server } from "./server"

// Configure express
const app = express()
app.use(express.json());
app.use(Server.i18n.init);
app.use('/views', express.static(path.join(__dirname, '..', 'views')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
declare global {
    namespace Express {
        interface Request {
            setLocale: (locale: string) => void;
        }
    }
}

// Create server
const server = new Server();
const ENV_VARIABLES = [
    "PORT",
    "REGISTRY_SERVER_ENDPOINT",
    "DATABASE_URI",
    "SECRET_MANAGER_TYPE"
]

// ---------- BEARER TOKEN NEEDED ----------

app.post('/api/v1/authorize', async (req, res) => {
    try {
        // Perform authorization
        console.log('POST authorize');
        const response = await server.post_authorize(req.headers.authorization, req.body.remote_id, req.body.locale, req.body.email);

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        handle_error(e, req, res);
    }
});

app.delete('/api/v1/user', async (req, res) => {
    try {
        // Delete user
        console.log('DELETE user');
        await server.delete_user(req.headers.authorization, req.body.remote_id);

        // Build response
        res.end()
    } catch (e) {
        handle_error(e, req, res);
    }
});

app.post('/api/v1/collect', async (req, res) => {
    try {
        // Collect invoices
        console.log(`POST collect ${req.body.credential_id}`);
        const response = await server.post_collect(req.headers.authorization, req.body.credential_id);

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        handle_error(e, req, res);
    }
});

// ---------- OAUTH TOKEN NEEDED ----------

app.get('/api/v1/user', async (req, res) => {
    try {
        // Check user has accepted terms and conditions
        console.log(`GET user`);
        const context = await server.get_user(req.query.token, req.query.verificationCode);

        // Render user.ejs
        res.render('user/user', context);
    } catch (e) {
        handle_error(e, req, res);
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
        handle_error(e, req, res);
    }
});

app.post('/api/v1/credential', async (req, res) => {
    try {
        // Save credential
        console.log(`POST credential`);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await server.post_credential(req.query.token, req.body.key, req.body.params, ip);

        // Build response
        res.end()
    } catch (e) {
        handle_error(e, req, res);
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
        handle_error(e, req, res);
    }
});

// ---------- NO OAUTH TOKEN NEEDED ----------

app.get('/api/v1/collectors', (req, res) => {
    try {
        // List all collectors
        console.log(`GET collectors`);
        const response = server.get_collectors(req.query.locale);

        // Build response
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
    } catch (e) {
        handle_error(e, req, res);
    }
});

// Handle non-existing endpoints
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(404).end(JSON.stringify({type: "error", reason: "Endpoint not found"}));
});

function handle_error(e, req, res){
    if(e instanceof StatusError) {
        res.setHeader('Content-Type', 'application/json');
        res.status(e.status_code).end(JSON.stringify({type: "error", message: e.message}));
    }
    else if (e instanceof TermsConditionsError) {
        console.error(e.message);
        res.render('terms_conditions/terms_conditions', {token: req.query.token});
    }
    else {
        console.error(e);
        let reason;
        if (process.env.ENV === 'debug') {
            reason = e.message;
        }
        else {
            reason = "Internal server error"
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(500).end(JSON.stringify({type: "error", reason}));
    }
}

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
