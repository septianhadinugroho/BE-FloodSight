require('dotenv').config();

const Hapi = require('@hapi/hapi');
const mongoose = require('mongoose');
const User = require("./models/user.model");
const userRoutes = require('./routes/user.routes');

const init = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        const server = Hapi.server({
            port: process.env.PORT || 3000,
            host: 'localhost'
        });

        server.route({
            method: 'GET',
            path: '/',
            handler: (request, h) => {
                return 'Hello Hapi with MongoDB Atlas!';
            }
        });

        server.route(userRoutes);

        await server.start();
        console.log('Server running on %s', server.info.uri);

    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
};

init();