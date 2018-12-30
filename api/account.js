const uuid = require('uuidv4');

exports.login = async (env, params, done) => {
    const token = uuid();
    let result;

    try {
        result = await env.members.findOne({ email: params.email });
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }

    if (result.password === params.password) {
        env.set_cookie("login_token", token);
        done(null, {"token" : token});
    } else {
        done("Wrong password");
    }
}

exports.create = async (env, params, done) => {
    const post = {
        id: uuid(),
        name: params.name,
        email: params.email,
        age: params.age,
        password: params.password,
        expenses: 0
    };

    try {
        await env.members.insertOne(post);
    } catch (error) {
        return done("Could not insert");
    }

    exports.login(env, post, (err, res) => {
        if (!err) {
            return done(null, {status: 0});
        } else {
            return done(err);
        }
    });
}