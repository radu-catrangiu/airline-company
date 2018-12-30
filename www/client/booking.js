var app = new Vue({
    el: '#app',
    data() {
        return {
            billing_info: {
                "card_number": "",
                "name": "",
                "expiry_month": "",
                "expiry_year": "",
                "card_cvv": ""
            },
            flights: [],
            id: "",
            plural: "",
            bought: false,
            error: null
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
        buy_flights() {
            if (this.flights.length > 0) {
                this.error = null;
                this.billing_info.expiry_month = parseInt(this.billing_info.expiry_month);
                this.billing_info.expiry_year = parseInt(this.billing_info.expiry_year);

                const valid = check_errors(this);
                
                if (!valid) {
                    return;
                } 

                buy(this, (error) => {
                    if (!error){
                        $('.modal').modal('hide');
                        this.bought = true;
                    } else {
                        this.error = error;
                    }
                });
            }
        },
        insert_card_details() {
            $('.modal').modal('show');
        }
    },
    mounted() {
        this.id = (new URL(document.location)).searchParams.get('id');
        var obj = {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "get_booking",
            "params": {
                "code": this.id
            }
        };
        axios
            .post('/client', obj)
            .then(
                response => {
                    this.flights = response.data.result.flights;
                    this.bought = response.data.result.bought;
                    this.plural = this.flights.length > 1 ? "s" : "";
                }
            );
    }
});

function buy(self, done) {
    var obj = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "buy_ticket",
        "params": {
            "booking_id": self.id,
            "billing_info": self.billing_info
        }
    };
    axios
        .post('/client', obj)
        .then(
            response => {
                if (response.data.error) {
                    done(response.data.error);
                } else {
                    done();
                }
            }
        );
}

function check_errors(self) {
    console.log(self.billing_info)
    var pretty_name = {
        card_number: 'Card Number',
        name: 'Name',
        expiry_month: 'Expiry Month',
        expiry_year: 'Expiry Year',
        card_cvv: "CVV"
    };
    for (var key in self.billing_info) {
        var obj = {};
        obj[key] = self.billing_info[key];
        var valid = tv4.validate(obj, schema);

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
        card_number: {
            type: "string",
            minLength: 2,
        },
        name: {
            type: "string",
            minLength: 2
        },
        expiry_month: {
            type: "number",
            minimum: 1,
            maximum: 12
        },
        expiry_year: {
            type: "number",
            minimum: 18,
            maximum: 40
        },
        card_cvv: {
            type: "string",
            minLength: 3,
            maxLength: 3
        }
    }
};