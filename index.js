require('dotenv').config();

const Hapi = require('hapi');
const mongoose = require('mongoose');
const User = require("./models/user.model");

// koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('MongoDB connection error:', err));

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: 'localhost'
    });

    // contoh route
    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello Hapi with MongoDB Atlas!';
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

init();