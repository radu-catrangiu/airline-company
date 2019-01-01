const uuid = require('uuidv4');

exports.login = async (env, params, done) => {
    const token = uuid();
    let result;

    try {
        result = await env.users.findOne({ email: params.email });
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }

    if (!result) {
        return done("User not found");
    }

    if (result.password === params.password) {
        try {
            await env.login_tokens.insertOne({
                id: token,
                user_id: result.id,
                timestamp: Date.now()
            });
        } catch (error) {
            console.log(error);
            return done("Could not create token");
        }
        env.set_cookie("login_token", token);
        done(null, { "token": token });
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
        tickets_booked: [],
        tickets_bought: []
    };

    try {
        await env.users.insertOne(post);
    } catch (error) {
        return done("Could not insert");
    }

    exports.login(env, post, (err, res) => {
        if (!err) {
            return done(null, { status: 0 });
        } else {
            return done(err);
        }
    });
}

exports.check_token = async (env, params, done) => {
    if (!params.token || params.token.length === 0) {
        return done("Invalid token");
    }

    let result;
    try {
        result = await env.login_tokens.findOne({ id: params.token });
    } catch (error) {
        return done("Database error");
    }

    if (result) {
        return done(null, "Valid token");
    } else {
        return done("Invalid token");
    }
}