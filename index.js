const config = require('./config');
const server = require('./server/server');
const modules = require('./modules');

if (process.env.debug) {
    console.debug = console.log;
} else {
    console.debug = () => {};
}

const rpc_config = {
	"services": {
		"/admin": {
            "handler": require('./api/admin.js'),
            "useAuth": false
        },
        "/stats": {
            "handler": require('./api/stats.js'),
            "useAuth": false
        },
        "/client" : {
            "handler": require('./api/client.js'),
            "useAuth": true
        },
        "/account" : {
            "handler": require('./api/account.js'),
            "useAuth": false
        }
	}
};

modules.load_modules((err, modules) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    server.init(config.port, rpc_config, modules, (err, res) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        console.log("Server started on port " + config.port);
    });
});

