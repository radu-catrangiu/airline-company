const app = require('express')();
const body_parser = require('body-parser');
const cookie_parser = require('cookie-parser');
const async = require('async');
const path = require('path');
const fs = require('fs');

app.use(body_parser.json());
app.use(cookie_parser());

// Read the resources directory
const resources = fs.readdirSync(path.resolve(__dirname + '/../www/resources'));

app.get('/resources/*', (req, res) => {
    console.error('/resources/* : ' + req.path);
    const file = req.path.split('/').pop();
    if (resources.includes(file)) {
        res.sendFile(path.resolve(__dirname + '/../www/resources/' + file));
    } else {
        res.sendStatus(403);
    }
});

exports.init = (port, rpc_config, modules, callback) => {
    const services = rpc_config.services;
    const service_names = Object.keys(rpc_config.services);

    app.get("*", async (request, result) => {
        const cookies = request.cookies;
        console.error('* : ' + request.path);

        switch (request.path) {
            case '/':
                return result.sendFile(path.resolve(__dirname + '/../www/index.html'));
            case '/admin':
                return result.sendFile(path.resolve(__dirname + '/../www/admin/admin.html'));
            case '/admin.js':
                return result.sendFile(path.resolve(__dirname + '/../www/admin/admin.js'));
        }

        if (! await modules.auth(cookies.login_token)) {
            return result.sendStatus(403);
        }

        switch (request.path) {
            case '/client':
                result.sendFile(path.resolve(__dirname + '/../www/client/client.html'));
                break;
            case '/client.js':
                result.sendFile(path.resolve(__dirname + '/../www/client/client.js'));
                break;
            case '/booking':
                if (!request.query.id) result.sendStatus(403);
                result.sendFile(path.resolve(__dirname + '/../www/client/booking.html'));
                break;
            case '/booking.js':
                result.sendFile(path.resolve(__dirname + '/../www/client/booking.js'));
                break;
            default:
                result.sendStatus(403);
                break;
        }
    });

    async.each(service_names, (service_name, done) => {
        const env = modules;
        const handler = services[service_name].handler;
        const useAuth = services[service_name].useAuth;

        app.post(service_name, async (request, response) => {
            const method = request.body.method;
            const params = request.body.params;
            const service_handler = handler[method];
            const set_cookie = function (name, value, options) {
                response.cookie(name, value, options)
            }
            const cookies = request.cookies;

            if (service_handler == undefined) {
                const data = {
                    message: "Method not found"
                };
                return send_error(data, response);
            }

            console.debug("POST to " + service_name);

            if (service_name === '/account') {
                env.set_cookie = set_cookie;
                env.cookies = cookies;
            }

            if (useAuth) {
                if (! await env.auth(cookies.login_token)) {
                    const data = {
                        message: "Not logged in"
                    };
                    set_cookie('login_token', "");
                    return send_error(data, response);
                }
            }

            service_handler(env, params, (err, res) => {
                if (err) {
                    send_error(err, response);
                } else {
                    send_result(res, response);
                }
            });

        });

        done();
    }, err => err ? callback(err) : app.listen(port, callback));
}

function send_result(data, response) {
    const jsonrpc = {
        "id": 1,
        "jsonrpc": "2.0",
        "result": {}
    };

    if (data instanceof Array || typeof data === 'string') {
        jsonrpc.result = data;
    } else {
        Object.assign(jsonrpc.result, data);
    }

    response.send(jsonrpc);
}

function send_error(data, response) {
    const jsonrpc = {
        "id": 1,
        "jsonrpc": "2.0",
        "error": {}
    };

    if (data instanceof Array || typeof data === 'string') {
        jsonrpc.error = data;
    } else {
        Object.assign(jsonrpc.error, data);
    }

    response.send(jsonrpc);
}