const uuid = require('uuidv4');

exports.login = (env, params, done) => {
    const token = uuid();
    env.set_cookie("login_token", token);
    done(null, {"token" : token});
}

exports.create = (env, params, done) => {

}