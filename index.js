require('dotenv').config();

const Hapi = require('@hapi/hapi');
const mongoose = require('mongoose');
const Axios = require('axios');
const User = require('./models/user.model');
const Prediction = require('./models/prediction.model');
const userRoutes = require('./routes/user.routes');
const predictionRoutes = require('./routes/prediction.routes');
const { jabodetabekAreas } = require('./data/jabodetabekAreas'); // Import CommonJS

const init = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    const server = Hapi.server({
      port: process.env.PORT || 3000,
      host: 'localhost',
      routes: {
        cors: true, // Enable CORS for React frontend
      },
    });

    // Default route
    server.route({
      method: 'GET',
      path: '/',
      handler: (request, h) => {
        return 'Hello Hapi with MongoDB Atlas!';
      },
    });

    // Weather API route
    server.route({
      method: 'GET',
      path: '/api/weather',
      handler: async (request, h) => {
        const data = {};
        const failed = [];

        // Helper function to delay requests (avoid rate limiting)
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Fetch data for each area
        for (const area of jabodetabekAreas) {
          try {
            const response = await Axios.get(
              `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${area.adm4}`,
              { timeout: 5000 } // 5-second timeout per request
            );
            if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
              data[area.name] = response.data;
            } else {
              console.warn(`No valid data for ${area.name}:`, response.data);
              failed.push(area.name);
            }
          } catch (error) {
            console.error(`Failed to fetch weather for ${area.name}:`, error.message);
            failed.push(area.name);
          }
          // Delay 1 second to avoid BMKG rate limit (60 req/min)
          await delay(1000);
        }

        return {
          data,
          failed,
          error: failed.length === jabodetabekAreas.length
            ? 'Gagal mengambil semua data cuaca. Periksa kode adm4 atau koneksi.'
            : failed.length > 0
            ? `Gagal mengambil data cuaca untuk: ${failed.join(', ')}.`
            : null,
        };
      },
    });

    // Register existing routes
    server.route(userRoutes);
    server.route(predictionRoutes);

    await server.start();
    console.log('Server running on %s', server.info.uri);
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

init();