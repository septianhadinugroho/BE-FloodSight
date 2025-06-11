const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tahun: {
    type: Number,
    required: true,
  },
  bulan: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  prediksi_label: {
    type: Boolean,
    required: true,
  },
  kabupaten: {
    type: String,
    required: true,
  },
  kecamatan: {
    type: String,
    required: true,
  },
  tanggal: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Prediction', predictionSchema);