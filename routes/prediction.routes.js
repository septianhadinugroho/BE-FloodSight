const Prediction = require('../models/prediction.model');
const Axios = require('axios');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/auth');

const predictFlood = (tahun, bulan, latitude, longitude) => {
  // Placeholder for ML model integration
  // TODO: Replace with actual ML model prediction logic from [ML_MODEL_LINK]
  const floodProneMonths = ['Januari', 'Februari', 'Maret', 'November', 'Desember'];
  const isFloodProneMonth = floodProneMonths.includes(bulan);
  const isFloodProneArea = latitude <= -6.8 && longitude >= 107.2
  return isFloodProneMonth && isFloodProneArea && Math.random() > 0.5;
};

module.exports = [
  {
    method: 'POST',
    path: '/api/predict',
    options: {
      pre: [{ method: verifyToken }],
      payload: {
        parse: true,
        allow: 'application/json',
      },
    },
    handler: async (request, h) => {
      try {
        const { tahun, bulan, latitude, longitude } = request.payload;
        const { userId } = request.auth;

        if (!tahun || !bulan || !latitude || !longitude) {
          return h.response({ error: 'Tahun, bulan, latitude, dan longitude wajib diisi' }).code(400);
        }

        if (latitude <= -6.8 || latitude >= -5.9 || longitude <= 106.3 || longitude >= 107.2) {
          return h.response({ error: 'Koordinat di luar wilayah Jabodetabek' }).code(400);
        }

        const prediksi_label = predictFlood(tahun, bulan, latitude, longitude);

        const prediction = new Prediction({
          userId,
          tahun,
          bulan,
          latitude,
          longitude,
          prediksi_label,
        });
        await prediction.save();

        return h.response({
          prediksi_label,
        }).code(200);
      } catch (error) {
        console.error('Prediction error:', error);
        return h.response({ error: 'Terjadi kesalahan server', details: error.message }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/api/predictions',
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: async (request, h) => {
      try {
        const { userId } = request.auth;
        const predictions = await Prediction.find({ userId }).select('-userId');
        return h.response(predictions).code(200);
      } catch (error) {
        console.error('Error fetching predictions:', error);
        return h.response({ error: 'Terjadi kesalahan server', details: error.message }).code(500);
      }
    },
  },
];