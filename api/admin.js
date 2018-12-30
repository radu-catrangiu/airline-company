const uuidv4 = require('uuidv4');

exports.insert = async (env, params, done) => {
    const id = uuidv4();
    const data = {
        "id": id,
        "source": params.source,
        "destination": params.destination,
        "departure_hour": params.departure_hour,
        "departure_day": params.departure_day,
        "duration": params.duration,
        "seats": params.seats,
        "cost": params.cost,
        "booked" : 0,
        "bought" : 0
    };

    try {
        await env.tickets.insertOne(data, true);
        done(null, { id: data.id });
    } catch (error) {
        console.log(error);
        done({ error: 'Failed to insert item' });
    }
}

exports.delete = (env, params, done) => {
    const data = {
        id: params.id
    }

    try {
        env.tickets.deleteOne(data);
        done(null, { status: 0 });
    } catch(error) {
        console.log(error);
        done({ error: 'Failed to delete item'});
    }
};

exports.list = async (env, params, done) => {
    let result;
    const cursor = env.tickets.find();
    try {
        result = await cursor.toArray();
    } catch (error) {
        return done({ error: 'Failed to list items'});
    }

    result.forEach(element => {
        delete element._id;
    });

    done(null, result);
}