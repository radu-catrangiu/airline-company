const uuidv4 = require('uuidv4');
const admin = require('./admin');

exports.get_optimal_route = (env, params, done) => {
    params.source = params.source.toLowerCase();
    params.destination = params.destination.toLowerCase();

    admin.list(env, {}, (error, results) => {
        if (error) {
            return done(error);
        }

        const data = results.filter(flight =>
            flight.seats > flight.bought &&
            flight.booked <= parseInt(flight.seats * 1.1)
        );

        return find_optimal_route(params, data, done);
    });
};

exports.book_ticket = async (env, data, done) => {
    const post = {
        id: uuidv4(),
        flight_ids: data.flight_ids,
        bought: false
    };

    const cursor = env.tickets.find({ id: { $in: post.flight_ids } });
    let result;
    try {
        result = await cursor.toArray();
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }

    // Check if reserved is > 110 % * Seats
    const overbooked = result.some(f => f.reserved + 1 > parseInt(f.seats * 1.1));
    if (overbooked) {
        return done({ code: 501, error: "Flight is overbooked" });
    }

    try {
        env.tickets.updateMany(
            { id: { $in: post.flight_ids } },
            { $inc: { booked: 1 } }
        );
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }

    try {
        await env.bookings.insertOne(post);
        return done(null, { id: post.id });
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }
};

exports.buy_ticket = async (env, data, done) => {
    // Do something with billing data
    console.log(data.billing_info);
    console.log(data.booking_id);

    let result;
    try {
        result = await env.bookings.findOne({ id: data.booking_id });
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }

    let flight_ids = result.flight_ids || [];
    try {
        env.tickets.updateMany(
            { id: { $in: flight_ids } },
            { $inc: { booked: -1, bought: 1 } }
        );
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }

    try {
        env.bookings.updateOne(
            { id: data.booking_id },
            { $set: { bought: true } }
        );
        return done(null, { status: 0 });
    } catch (error) {
        console.log(error);
        return done({ code: 1001, error: "Database error" });
    }
};

exports.get_booking = async (env, data, done) => {
    let result;
    try {
        result = await env.bookings.findOne({ id: data.code });
    } catch (error) {
        console.log(error);
        return done({ code: 1002, error: "Internal server error" });
    }

    let flight_ids = result.flight_ids || [];
    let already_bought = result.bought;
    let flights;
    try {
        flights = await env.tickets.find({ id: { $in: flight_ids } }).toArray();
    } catch (error) {
        console.log(error);
        return done({ code: 1002, error: "Internal server error" });
    }

    flights = flights.map(f => {
        return {
            departure_day: f.departure_day,
            departure_hour: f.departure_hour,
            duration: f.duration,
            source: f.source,
            destination: f.destination,
            seats: f.seats
        }
    })
    
    done(null, { flights, bought: already_bought });
};

function find_optimal_route(data, flights, done) {
    let stack = [];
    let distances = {};
    let sources = {};

    sources[data.source] = null;
    distances[data.source] = 0;

    // Try to find direct flight
    let direct_flights = flights.filter(flight =>
        flight.source === data.source &&
        flight.destination === data.destination &&
        flight.departure_day >= data.departure_day
    );

    // If direct flight found send result
    if (direct_flights.length > 0) {
        return done(null, direct_flights.map(e => e));
    }

    // Find linking flight with given source and departure day later 
    // or on the same day as the given day
    let flight_links = flights.filter(flight =>
        flight.source == data.source &&
        flight.departure_day >= data.departure_day
    );

    // Compute the time cost for each flight
    flight_links.forEach(flight => {
        distances[flight.destination] = distances[flight.source] + compute_distance(sources[flight.source], flight);
        flight.time_cost = distances[flight.destination];
    });

    // Sort flight links by time_cost
    flight_links = flight_links.sort((a, b) => b.time_cost - a.time_cost);

    // Add sorted flight links to stack
    stack = stack.concat(flight_links);

    while (stack.length !== 0) {
        let flight = stack.pop();
        let flight_links;

        // Mark flight as visited
        flight.visited = true;

        // Add flight to sources object (so we can retrace flights)
        sources[flight.destination] = {
            source: flight.source,
            flight: flight
        };

        // Find flight links in the same day or later than the current flight
        flight_links = flights.filter(f =>
            f.source == flight.destination && !f.visited &&
            (
                (f.departure_day > flight.departure_day) ||
                (
                    f.departure_day == flight.departure_day &&
                    f.departure_hour >= flight.departure_hour + flight.duration
                )
            )
        );

        // Compute time cost for each flight link
        flight_links.forEach(flight => {
            distances[flight.destination] = distances[flight.source] + compute_distance(sources[flight.source], flight);
            flight.time_cost = distances[flight.destination];
        });

        // Sort flight links by time cost
        flight_links = flight_links.sort((a, b) => b.time_cost - a.time_cost);

        // Add to stack sorted flight links
        stack = stack.concat(
            flight_links
        );
    }

    // Result array
    const result = [];

    // Retrace flights in reverse from given destination to given source
    let flight = sources[data.destination];
    while (flight) {
        result.push(flight.flight);
        flight = sources[flight.source];
    }

    if (result.length > data.max_flights) {
        let new_flights = flights.filter(f => f.id !== sources[data.destination].flight.id);
        new_flights.forEach(f => { f.visited = false });

        return find_optimal_route(data, new_flights, done);
    } else {
        done(null, result.map(e => e));
    }

}

// Function that computes a metric for sorting flights in the find_optimal_route algorithm
function compute_distance(source, destination) {
    if (source === null) {
        return destination.duration;
    } else {
        source = source.flight;
    }

    let res = 0;
    const days = destination.departure_day - source.departure_day;
    const hours = destination.departure_hour - source.departure_hour;

    if (days == 0) {
        res = hours;
    } else {
        res = days * 24 + hours;
    }

    return res + source.duration;
}
