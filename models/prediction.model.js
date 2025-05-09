const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  year: {
    type: Number,
    default: null,
  },
  month: {
    type: Number,
    default: null,
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  kabupaten: {
    type: String,
    default: null,
  },
  kecamatan: {
    type: String,
    default: null,
  },
  avg_ndvi: {
    type: Number,
    default: null,
  },
  curah_hujan: {
    type: Number,
    default: null,
  },
  prediksi_label: {
    type: Boolean,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);