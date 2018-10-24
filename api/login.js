const uuid = require('uuidv4');

exports.login = (env, params, done) => {
    done(null, {"token" : uuid()});
}