const Prediction = require('../models/prediction.model');
const Axios = require('axios');
const jwt = require('jsonwebtoken'); // Add this import
const { verifyToken } = require('../middlewares/auth');

const getLocationDetails = async (latitude, longitude) => {
  try {
    const response = await Axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
    );
    const data = response.data;
    return {
      kecamatan: data.address.suburb || 'Unknown',
      kabupaten: data.address.city || data.address.town || 'Unknown',
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      kecamatan: 'Unknown',
      kabupaten: 'Unknown',
    };
  }
};

const predictFlood = (tahun, bulan, latitude, longitude) => {
  const floodProneMonths = ['Januari', 'Februari', 'Maret', 'November', 'Desember'];
  const isFloodProneMonth = floodProneMonths.includes(bulan);
  const isFloodProneArea = latitude < -6.0 && longitude > 106.8;
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

        if (latitude < -6.8 || latitude > -5.7 || longitude < 106.3 || longitude > 107.2) {
          return h.response({ error: 'Koordinat di luar wilayah Jabodetabek' }).code(400);
        }

        const { kecamatan, kabupaten } = await getLocationDetails(latitude, longitude);
        const prediksi_label = predictFlood(tahun, bulan, latitude, longitude);

        const prediction = new Prediction({
          userId,
          tahun,
          bulan,
          latitude,
          longitude,
          kecamatan,
          kabupaten,
          prediksi_label,
        });
        await prediction.save();

        return h.response({
          prediksi_label,
          kecamatan,
          kabupaten,
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