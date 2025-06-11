const Prediction = require('../models/prediction.model');
const Axios = require('axios');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/auth');

// Opsional: Gunakan axios-retry jika diinstal
let axiosRetry;
try {
  axiosRetry = require('axios-retry').default;
  axiosRetry(Axios, {
    retries: 3, // Coba ulang 3 kali
    retryDelay: (retryCount) => retryCount * 2000, // Delay 2, 4, 6 detik
    retryCondition: (error) => {
      return error.code === 'ECONNABORTED' || error.response?.status >= 500;
    },
  });
} catch (error) {
  console.warn('axios-retry tidak tersedia, melanjutkan tanpa retry:', error.message);
}

// Map month names to numbers for Flask API
const monthMap = {
  Januari: 1,
  Februari: 2,
  Maret: 3,
  April: 4,
  Mei: 5,
  Juni: 6,
  Juli: 7,
  Agustus: 8,
  September: 9,
  Oktober: 10,
  November: 11,
  Desember: 12,
};

// Fungsi untuk memformat nama kecamatan
const formatKecamatan = (name) => {
  if (!name) return '';

  // Kamus suku kata umum untuk kecamatan
  const commonPrefixes = [
    'tambun', 'pondok', 'cimanggis', 'sawangan', 'bojong', 'cibinong',
    'gunung', 'sukaraja', 'ciledug', 'karawang', 'cikarang', 'cibitung',
    'setia', 'jati', 'mekar', 'mulya', 'sari', 'gede', 'selatan', 'utara', 
    'timur', 'barat', 'tengah',
  ];

  let formattedName = name.toLowerCase();

  // Coba pisahkan berdasarkan prefix umum
  for (const prefix of commonPrefixes) {
    if (formattedName.startsWith(prefix) && formattedName.length > prefix.length) {
      const suffix = formattedName.slice(prefix.length);
      if (commonPrefixes.includes(suffix.toLowerCase()) || suffix.length > 3) {
        formattedName = `${prefix}${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
        break;
      }
    }
  }

  // Tambah spasi sebelum huruf besar (untuk kasus seperti pondokGede)
  formattedName = formattedName.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Kapitalisasi setiap kata
  return formattedName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

// Function to call the Flask ML model API
const predictFlood = async (tahun, bulan, latitude, longitude) => {
  try {
    const monthNumber = monthMap[bulan];
    if (!monthNumber) {
      throw new Error('Nama bulan tidak valid');
    }

    const ML_API_URL = process.env.ML_API_URL;
    console.log(`Mengirim request ke Flask API: ${ML_API_URL}/predict?year=${tahun}&month=${monthNumber}&latitude=${latitude}&longitude=${longitude}`);

    const response = await Axios.get(`${ML_API_URL}/predict`, {
      params: {
        year: tahun,
        month: monthNumber,
        latitude,
        longitude,
      },
      timeout: 60000, // 60 detik
    });

    console.log('Respons Flask API:', response.data);

    if (response.data.success) {
      return {
        prediksi_label: response.data.prediction === 1,
        metadata: {
          ...response.data.metadata,
          district: {
            NAME_2: response.data.metadata.district.NAME_2, // Tidak dimanipulasi
            NAME_3: formatKecamatan(response.data.metadata.district.NAME_3), // Format kecamatan
          },
        },
      };
    } else {
      throw new Error(response.data.error || 'Gagal mendapatkan prediksi dari model ML');
    }
  } catch (error) {
    console.error('Error saat memanggil Flask API:', error.message, error.response?.data);
    throw error;
  }
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

        // Validasi input
        if (!tahun || !bulan || !latitude || !longitude) {
          return h.response({ error: 'Tahun, bulan, latitude, dan longitude wajib diisi' }).code(400);
        }

        // Validasi koordinat Jabodetabek
        if (latitude <= -6.8 || latitude >= -5.9 || longitude <= 106.3 || longitude >= 107.2) {
          return h.response({ error: 'Koordinat di luar wilayah Jabodetabek' }).code(400);
        }

        // Dapatkan prediksi dan metadata dari ML model
        const { prediksi_label, metadata } = await predictFlood(tahun, bulan, latitude, longitude);

        // Simpan prediksi ke database
        const prediction = new Prediction({
          userId,
          tahun,
          bulan,
          latitude,
          longitude,
          prediksi_label,
          kabupaten: metadata.district.NAME_2, // Simpan asli
          kecamatan: metadata.district.NAME_3, // Simpan sudah diformat
        });
        await prediction.save();

        console.log(`Prediksi tersimpan: ${tahun}-${bulan} at (${latitude}, ${longitude}): ${prediksi_label}`);

        return h.response({
          prediksi_label,
          metadata,
        }).code(200);
      } catch (error) {
        console.error('Error prediksi:', error);
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
        // Format hanya kecamatan saat mengembalikan data
        const formattedPredictions = predictions.map((prediction) => ({
          ...prediction.toObject(),
          kecamatan: formatKecamatan(prediction.kecamatan),
        }));
        return h.response(formattedPredictions).code(200);
      } catch (error) {
        console.error('Error mengambil prediksi:', error);
        return h.response({ error: 'Terjadi kesalahan server', details: error.message }).code(500);
      }
    },
  },
];