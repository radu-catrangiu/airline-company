const schemas = {
    login_tokens: {
        bsonType: "object",
        properties: {
            id: {
                bsonType: "string"
            },
            user_id: {
                bsonType: "string"
            }
        }
    },
    users: {
        bsonType: "object",
        properties: {
            id: {
                bsonType: "string"
            },
            name: {
                bsonType: "string",
                minLength: 3
            },
            email: {
                bsonType: "string",
                minLength: 3
            },
            password: {
                bsonType: "string",
                minLength: 3
            },
            age: {
                bsonType: "int"
            }
        }
    },
    stats: {

    },
    bookings: {
        bsonType: "object",
        properties: {
            id: {
                bsonType: "string"
            },
            flight_ids: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                }
            },
            bought: {
                bsonType: "boolean"
            }
        }
    },
    tickets: {
        bsonType: "object",
        required: ["source", "destination", "departure_hour", "departure_day", "duration", "seats", "cost"],
        properties: {
            source: {
                bsonType: "string",
                minLength: 2
            },
            destination: {
                bsonType: "string",
                minLength: 2
            },
            departure_hour: {
                bsonType: "int",
                minimum: 0,
                maximum: 23,
                exclusiveMaximum: false,
                description: "must be an integer in [ 0, 23 ] and is required"
            },
            departure_day: {
                bsonType: "int",
                minimum: 1,
                maximum: 365,
                exclusiveMaximum: false,
                description: "must be an integer in [ 1, 365 ] and is required"
            },
            duration: {
                bsonType: "int",
                minimum: 1
            },
            seats: {
                bsonType: "int"
            },
            cost: {
                bsonType: "double",
                minimum: 1
            }
        }
    }
};

const indexes = {
    login_tokens: {
        id: 1
    },
    users: {
        id: 1,
        email: 1
    },
    stats: undefined,
    bookings: {
        id: 1
    },
    tickets: {
        id: 1
    }
}

module.exports = {
    mongo: {
        url: "ds239873.mlab.com:39873/bd2",
        user: "padawan",
        password: "123Parola",
        db: "bd2",
        collections: {
            bookings: "bookings",
            login_tokens: "login_tokens",
            users: "users",
            stats: "stats",
            tickets: "tickets"
        },
        schemas: schemas,
        indexes: indexes
    },
    port: 8080
};
