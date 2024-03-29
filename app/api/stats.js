exports.update = (env, params, done) => {
    if (params.collection === 'tickets') {
        update_tickets_stats(env);
    } else {
        update_users_stats(env);
    }

    done(null, { "status": 0 });
};

exports.list = async (env, params, done) => {
    let result;

    if (params.collection === 'tickets') {
        const cursor = env.tickets_stats.find();
        try {
            result = await cursor.toArray();
        } catch (error) {
            return done({ error: 'Failed to list items' });
        }
    } else {
        const cursor = env.users_stats.find();
        try {
            result = await cursor.toArray();
        } catch (error) {
            return done({ error: 'Failed to list items' });
        }
    }

    done(null, result);
}

function update_users_stats(env) {
    env.users.mapReduce(
        function mapFunc() {
            const key = (parseInt(this.age / 10) * 10) + 's';

            emit(key, {
                count: 1,
                bought: {
                    flights: this.tickets_bought.reduce((acc, val) => acc + val.flights, 0),
                    cost: this.tickets_bought.reduce((acc, val) => acc + val.cost, 0)
                },
                booked: {
                    flights: this.tickets_booked.reduce((acc, val) => acc + val.flights, 0),
                    cost: this.tickets_booked.reduce((acc, val) => acc + val.cost, 0)
                }
            });
        },
        function reduceFunc(key, values) {
            let obj = {
                count: 0,
                bought: {
                    flights: 0,
                    cost: 0
                },
                booked: {
                    flights: 0,
                    cost: 0
                }
            }
            for (let i = 0; i < values.length; i++) {
                obj.count += values[i].count;
                obj.bought.flights += values[i].bought.flights;
                obj.bought.cost += values[i].bought.cost;
                obj.booked.flights += values[i].booked.flights;
                obj.booked.cost += values[i].booked.cost;
            }
            return obj;
        },
        {
            out: "users_stats",
            finalize: function (key, value) {
                return compute_avg(['bought', 'booked'], value);
            }
        }
    );
}

function update_tickets_stats(env) {
    env.tickets.mapReduce(
        function mapFunc() {
            emit("cost", this.cost);
            emit("potential_revenue", this.seats * this.cost);
            emit("eventual_revenue", this.booked * this.cost);
            emit("revenue", this.bought * this.cost);
        },
        function reduceFunc(key, values) {
            let description = get_tickets_stats_description(key);
            const avg = values.reduce((acc, e) => acc + e, 0) / values.length;
            let obj = {
                min: Math.min(...values),
                max: Math.max(...values),
                avg: trunct_two_decimals(avg),
                description
            };

            return obj;
        },
        { out: "tickets_stats" }
    );
}