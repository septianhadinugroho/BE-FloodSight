const Prediction = require('../models/prediction.model');

module.exports = [
  // Tambah prediksi baru
  {
    method: 'POST',
    path: '/predictions',
    options: {
      payload: {
        parse: true,
        allow: 'application/json'
      }
    },
    handler: async (request, h) => {
      try {
        const {
          user,
          year,
          month,
          latitude,
          longitude,
          kabupaten,
          kecamatan,
          avg_ndvi,
          curah_hujan,
          prediksi_label
        } = request.payload;

        const prediction = new Prediction({
          user,
          year,
          month,
          latitude,
          longitude,
          kabupaten,
          kecamatan,
          avg_ndvi,
          curah_hujan,
          prediksi_label
        });

        const saved = await prediction.save();
        return h.response(saved).code(201);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    }
  },

  // Ambil semua prediksi
  {
    method: 'GET',
    path: '/predictions',
    handler: async (request, h) => {
      try {
        const predictions = await Prediction.find().populate('user');
        return h.response(predictions).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    }
  },

  // Ambil prediksi berdasarkan ID
  {
    method: 'GET',
    path: '/predictions/{id}',
    handler: async (request, h) => {
      try {
        const prediction = await Prediction.findById(request.params.id).populate('user');
        if (!prediction) {
          return h.response({ error: 'Prediction not found' }).code(404);
        }
        return h.response(prediction).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    }
  },

  // Ambil semua prediksi berdasarkan user ID
  {
    method: 'GET',
    path: '/predictions/user/{userId}',
    handler: async (request, h) => {
      try {
        const predictions = await Prediction.find({ user: request.params.userId }).sort({ createdAt: -1 });
        return h.response(predictions).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    }
  },

  // Hapus prediksi
  {
    method: 'DELETE',
    path: '/predictions/{id}',
    handler: async (request, h) => {
      try {
        const deleted = await Prediction.findByIdAndDelete(request.params.id);
        if (!deleted) {
          return h.response({ error: 'Prediction not found' }).code(404);
        }
        return h.response({ message: 'Prediction deleted successfully' }).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    }
  }
];