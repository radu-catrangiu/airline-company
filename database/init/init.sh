cd /init/

pwd

tar -xzf backup.archive

mongorestore -d bd2 /init/backup/bd2/

rm -rf /init/backup/

mongo bd2 --eval "db.createUser({
     user: 'padawan',
     pwd: '123Parola',
     roles:
       [
         { role: 'readWrite', db: 'bd2' }
       ]
   })"

mongo bd2 --eval "db.system.js.save({
                _id: 'get_tickets_stats_description',
                value: function (key) {
                    switch (key) {
                        case 'cost':
                            return 'ticket cost';
                        case 'potential_revenue':
                            return 'revenue if airplane full';
                        case 'eventual_revenue':
                            return 'revenue if all current bookings are bought';
                        case 'revenue':
                            return 'current revenue';
                    }
                }
            });"

mongo bd2 --eval "db.system.js.save({
                _id: 'trunct_two_decimals',
                value: function (avg) {
                    return parseInt(avg * 100) / 100
                }
            });"

mongo bd2 --eval "db.system.js.save({
                _id: 'compute_avg',
                value: function (keys, value) {
                    for (k of keys) {
                        if (value[k].flights === 0) {
                            value[k].avg_cost = 0;
                        } else {
                            value[k].avg_cost = Math.round(value[k].cost / value[k].flights);
                        }
                    }

                    return value;
                }
            });"
