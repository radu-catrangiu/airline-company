const app = require('express')();
const body_parser = require('body-parser');
const async = require('async');

app.use(body_parser.json());

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
        "result" : {}
    };

    Object.assign(jsonrpc.result, data);
    response.send(jsonrpc);
}

function send_error(data, response) {
    const jsonrpc = {
        "id": 1,
        "jsonrpc": "2.0",
        "error" : {}
    };

    Object.assign(jsonrpc.error, data);
    response.send(jsonrpc);
}