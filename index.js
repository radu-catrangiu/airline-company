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
		"/ping": {
			"handler": require('./api/ping.js'),
			"useAuth": "BACKEND_TOKEN",
			"useDestination": false,
			// "validationSchema": schema
        },
        "/login" : {
			"handler": require('./api/login.js'),
			"useAuth": "BACKEND_TOKEN",
			"useDestination": false,
			// "validationSchema": schema
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

