exports.update = (env, params, done) => {
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
            out: "stats",
            finalize: function (key, value) {
                for (k of ['bought', 'booked']) {
                    if (value[k].flights === 0) {
                        value[k].avg_cost = 0;
                    } else {
                        value[k].avg_cost = Math.round(value[k].cost / value[k].flights);
                    }
                }

                return value;
            }
        }
    );

    done(null, { "status": 0 });
};

exports.list = async (env, params, done) => {
    let result;
    const cursor = env.stats.find();
    try {
        result = await cursor.toArray();
    } catch (error) {
        return done({ error: 'Failed to list items' });
    }

    done(null, result);
}