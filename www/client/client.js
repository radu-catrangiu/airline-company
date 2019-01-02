new Vue({
    el: '#app',
    data() {
        return {
            flights: [],
            flight_data: {
                "source": "",
                "destination": "",
                "max_flights": "",
                "departure_day": ""
            },
            search_count: 0,
            clear_data: true,
            error: "",
            booking_error: "",
            booking_response: null,
            booking_response_link: null,
            show_booking_response: false,
            user_name: "",
            tickets_booked: [],
            tickets_bought: []
        }
    },
    filters: {
        capitalize(value) {
            if (typeof (value) == 'string')
                return value.toUpperCase();
            else
                return 'UNDEFINED'
        }
    },
    methods: {
        search() {
            this.booking_error = null;
            this.error = null;
            this.show_booking_response = false;
            this.flight_data.departure_day = parseInt(this.flight_data.departure_day);
            this.flight_data.max_flights = parseInt(this.flight_data.max_flights);
            var valid = check_errors(this);
            if (valid) {
                request_optimal_route(this);
                this.search_count++;
            }
        },
        book_flights() {
            request_book_flights(this);
        },
        logout() {
            deleteCookie('login_token');
        }
    },
    computed: {
        search_case() {
            if (this.search_count === 0) {
                return 0;
            }

            if (this.flights instanceof Array && this.flights.length == 0) {
                return 1;
            } else {
                return 2;
            }
        }
    },
    mounted() {
        console.log(getCookie('login_token'));
        if (getCookie('login_token').length === 0) {
            window.location.replace('/');
        }
        get_user_info(this);
    }
});

function get_user_info(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "get_user_info",
        "params": {}
    };
    axios
        .post('/client', obj)
        .then(
            response => {
                var tickets_booked = response.data.result.tickets_booked;
                var tickets_bought = response.data.result.tickets_bought;
                self.user_name = response.data.result.name;
                tickets_booked.forEach(elem => {
                    var obj = {
                        "id": 1,
                        "jsonrpc": "2.0",
                        "method": "get_booking",
                        "params": {
                            "code": elem.ticket
                        }
                    };
                    axios
                        .post('/client', obj)
                        .then(response => {
                            var flights = response.data.result.flights;
                            var n = flights.length - 1;
                            flights.reverse();
                            self.tickets_booked.push({
                                source: flights[0].source,
                                destination: flights[n].destination,
                                link: '/booking?id=' + elem.ticket
                            });
                        });
                });
                tickets_bought.forEach(elem => {
                    var obj = {
                        "id": 1,
                        "jsonrpc": "2.0",
                        "method": "get_booking",
                        "params": {
                            "code": elem.ticket
                        }
                    };
                    axios
                        .post('/client', obj)
                        .then(response => {
                            var flights = response.data.result.flights;
                            var n = flights.length - 1;
                            flights.reverse();
                            self.tickets_bought.push({
                                source: flights[0].source,
                                destination: flights[n].destination,
                                link: '/booking?id=' + elem.ticket
                            });
                        });
                });
            }
        );
}

function request_optimal_route(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "get_optimal_route",
        "params": self.flight_data
    };
    axios
        .post('/client', obj)
        .then(
            response => {
                self.flights = response.data.result;
                if (self.flights instanceof Array) {
                    self.flights.reverse();
                }
            }
        );
}

function request_book_flights(self) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "book_ticket",
        "params": {
            "flight_ids": self.flights.map(f => f.id)
        }
    };
    axios
        .post('/client', obj)
        .then(
            response => {
                if (response.data.error) {
                    self.booking_error = response.data.error;
                    return;
                }
                const link = '/booking?id=' + response.data.result.id;
                self.booking_response_link = link;
                self.show_booking_response = true;
            });
}

function check_errors(self) {
    var pretty_name = {
        source: 'Source',
        destination: 'Destination',
        departure_day: 'Departure Day',
        max_flights: 'Max Flights'
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

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteCookie(cname) {
    var d = new Date(); //Create an date object
    d.setTime(d.getTime() - (1000 * 60 * 60 * 24)); //Set the time to the past. 1000 milliseonds = 1 second
    var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
    window.document.cookie = cname + "=" + "; " + expires;//Set the cookie with name and the expiration date
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
        departure_day: {
            type: "integer",
            minimum: 1,
            maximum: 365
        },
        max_flights: {
            type: "integer",
            minimum: 1
        }
    }
};