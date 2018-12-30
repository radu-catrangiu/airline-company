const app = require('express')();
const body_parser = require('body-parser');
const async = require('async');
const path = require('path');
const fs = require('fs');

app.use(body_parser.json());

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

app.get("*", (request, result) => {
    console.error('* : ' + request.path);
    switch (request.path) {
        case '/':
            result.sendFile(path.resolve(__dirname + '/../www/index.html'));
            break;
        case '/admin':
            result.sendFile(path.resolve(__dirname + '/../www/admin/admin.html'));
            break;
        case '/admin.js':
            result.sendFile(path.resolve(__dirname + '/../www/admin/admin.js'));
            break;
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

exports.init = (port, rpc_config, modules, callback) => {
    const services = rpc_config.services;
    const service_names = Object.keys(rpc_config.services);
    const env = modules;

    async.each(service_names, (service_name, done) => {
        const handler = services[service_name].handler;

        app.post(service_name, (request, response) => {
            const method = request.body.method;
            const params = request.body.params;
            const service_handler = handler[method];

            if (service_handler == undefined) {
                const data = {
                    message: "Method not found"
                };
                return send_error(data, response);
            }

            console.debug("POST to " + service_name);

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

    if (data instanceof Array || data instanceof String) {
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

    Object.assign(jsonrpc.error, data);
    response.send(jsonrpc);
}