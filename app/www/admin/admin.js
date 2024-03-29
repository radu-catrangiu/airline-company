new Vue({
    el: '#app',
    data() {
        return {
            flights: null,
            flight_data: {
                "source": "",
                "destination": "",
                "departure_hour": 0,
                "departure_day": 0,
                "duration": 0,
                "seats": 0,
                "cost": 0
            },
            clear_data: false,
            error: "",
            stats: {},
            stats_update_btn_class: "btn btn-primary",
            stats_update_btn: "Update",
            tickets_stast: {}
        }
    },
    filters: {
        capitalize(value) {
            if (typeof (value) == 'string')
                return value.toUpperCase();
            else
                return 'UNDEFINED'
        },
        pretty(value) {
            return JSON.stringify(value, null, 4);
        }
    },
    methods: {
        f_delete(id) {
            delete_post({ "id": id });
            this.flights = this.flights.filter(flight => flight.id !== id);
            refresh(this);
        },
        f_create() {
            this.flight_data.departure_hour = parseInt(this.flight_data.departure_hour);
            this.flight_data.departure_day = parseInt(this.flight_data.departure_day);
            this.flight_data.duration = parseInt(this.flight_data.duration);
            this.flight_data.seats = parseInt(this.flight_data.seats);
            this.flight_data.cost = parseInt(this.flight_data.cost);

            var valid = check_errors(this);

            if (valid) {
                $('.modal').modal('hide');
                insert_post(this.flight_data);
                refresh(this);
                reset_data(this);
            }
        },
        f_create_cancel() {
            reset_data(this);
        },
        stats_update() {
            this.stats_update_btn_class = "btn btn-secondary";
            this.stats_update_btn = 'Updating';
            users_stats_update(this);
            setTimeout(() => {
                users_stats_list(this);
                this.stats_update_btn_class = "btn btn-primary";
                this.stats_update_btn = 'Update';
            }, 2500);
        },
        tickets_stats_update() {
            this.stats_update_btn_class = "btn btn-secondary";
            this.stats_update_btn = 'Updating';
            tickets_stats_update(this);
            setTimeout(() => {
                tickets_stats_list(this);
                this.stats_update_btn_class = "btn btn-primary";
                this.stats_update_btn = 'Update';
            }, 2500);
        }
    },
    mounted() {
        refresh(this);
        users_stats_list(this);
        tickets_stats_list(this);
    }
});

function users_stats_update(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "update",
        "params": {}
    };
    axios
        .post('/stats', obj)
        .then(
            response => {
                console.log("Users stats updated!");
            }
        );
}

function tickets_stats_update(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "update",
        "params": {
            "collection": "tickets"
        }
    };
    axios
        .post('/stats', obj)
        .then(
            response => {
                console.log("Tickets stats updated!");
            }
        );
}

function users_stats_list(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "list",
        "params": {}
    };
    axios
        .post('/stats', obj)
        .then(
            response => self.stats = response.data.result.map(elem => {
                elem.id = elem._id;
                elem._id = "People in their " + elem.id;
                return elem;
            })
        );
}

function tickets_stats_list(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "list",
        "params": {
            "collection": "tickets"
        }
    };
    axios
        .post('/stats', obj)
        .then(
            response => self.tickets_stast = response.data.result
        );
}

function refresh(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "list",
        "params": {}
    };
    axios
        .post('/admin', obj)
        .then(
            response => self.flights = response.data.result
        );
}

function reset_data(self) {
    if (self.clear_data) {
        self.flight_data = {
            "source": "",
            "destination": "",
            "departure_hour": 0,
            "departure_day": 0,
            "duration": 0,
            "seats": 0
        };
    }
}

function delete_post(params) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "delete",
        "params": params
    };
    axios.post('/admin', obj);
}

function insert_post(params) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "insert",
        "params": params
    };
    axios.post('/admin', obj);
}

function check_errors(self) {
    var pretty_name = {
        source: 'Source',
        destination: 'Destination',
        departure_hour: 'Departure Hour',
        departure_day: 'Departure Day',
        duration: 'Flight Duration',
        seats: 'Number of seats'
    };
    var valid;
    for (var key in self.flight_data) {
        var obj = {};
        obj[key] = self.flight_data[key];
        valid = tv4.validate(obj, schema);

        if (!valid) {
            self.error = pretty_name[key] + ' : ' + tv4.error.message;
            return valid;
        }
    }
    self.error = "";
    return valid;
}

var schema = {
    type: "object",
    properties: {
        source: {
            type: "string",
            minLength: 2
        },
        destination: {
            type: "string",
            minLength: 2
        },
        departure_hour: {
            type: "integer",
            minimum: 0,
            maximum: 23
        },
        departure_day: {
            type: "integer",
            minimum: 1,
            maximum: 365
        },
        duration: {
            type: "integer",
            minimum: 1
        },
        seats: {
            type: "integer",
            minimum: 0
        },
        cost: {
            type: "integer",
            minimum: 1
        }
    }
};