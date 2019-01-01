exports.update = (env, params, done) => {
    env.users.mapReduce(
        function mapFunc() {
            const key = (parseInt(this.age / 10) * 10) + 's';

            emit({type: "bought", key}, {
                count: 1,
                flights: this.tickets_bought.reduce((acc, val) => acc + val.flights, 0),
                cost: this.tickets_bought.reduce((acc, val) => acc + val.cost, 0)
            });

            emit({type: "booked", key}, {
                count: 1,
                flights: this.tickets_booked.reduce((acc, val) => acc + val.flights, 0),
                cost: this.tickets_booked.reduce((acc, val) => acc + val.cost, 0)
            });
        },
        function reduceFunc(key, values) {
            let obj = {
                count: 0,
                flights: 0,
                cost: 0
            }
            for (let i = 0; i < values.length; i++) {
                obj.count += values[i].count;
                obj.flights += values[i].flights;
                obj.cost += values[i].cost;
            }
            return obj;
        },
        {
            out: "stats",
            finalize: function (key, value) {
                if (value.flights === 0) {
                    value.avg_cost = 0;
                } else {
                    value.avg_cost = value.cost / value.flights;
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
        return done({ error: 'Failed to list items'});
    }

    done(null, result);
}