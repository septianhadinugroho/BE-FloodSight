const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (request, h) => {
  const token = request.headers.authorization?.split(' ')[1];
  if (!token) {
    return h.response({ error: 'Token tidak ditemukan' }).code(401).takeover();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.auth = { userId: decoded.userId };
    return h.continue;
  } catch (error) {
    return h.response({ error: 'Token tidak valid' }).code(401).takeover();
  }
};

module.exports = [
  {
    method: 'POST',
    path: '/register',
    options: {
      payload: {
        parse: true,
        allow: 'application/json',
      },
    },
    handler: async (request, h) => {
      try {
        const { name, email, city, longitude, latitude, password } = request.payload;
        if (!name || !email || !password) {
          return h.response({ error: 'Name, email, dan password wajib diisi.' }).code(400);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return h.response({ error: 'Email sudah terdaftar.' }).code(400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
          name: name.trim(),
          email: email.toLowerCase(),
          city,
          longitude,
          latitude,
          password: hashedPassword,
        });

        const savedUser = await user.save();
        const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET, { expiresIn: '1h' });
        return h.response({ user: savedUser, token }).code(201);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'POST',
    path: '/login',
    options: {
      payload: {
        parse: true,
        allow: 'application/json',
      },
    },
    handler: async (request, h) => {
      try {
        console.log('Login attempt - Payload:', request.payload);
        const { email, password } = request.payload;

        // Validasi payload
        if (!email || !password) {
          console.log('Missing email or password:', { email, password });
          return h.response({ error: 'Email dan password wajib diisi.' }).code(400);
        }

        // Cari user dengan email
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        console.log('User query result:', user ? `User found: ${user._id}` : 'No user found');

        if (!user) {
          return h.response({ error: 'Email tidak ditemukan.' }).code(400);
        }

        // Cek password
        const match = await bcrypt.compare(password, user.password);
        console.log('Password comparison result:', match);

        if (!match) {
          return h.response({ error: 'Password salah.' }).code(400);
        }

        // Buat token
        if (!JWT_SECRET) {
          console.error('JWT_SECRET is not defined');
          throw new Error('Server configuration error: Missing JWT_SECRET');
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Token generated for user:', user._id);

        // Siapkan respons tanpa password
        const userResponse = user.toObject();
        delete userResponse.password;

        return h.response({ message: 'Login berhasil', user: userResponse, token }).code(200);
      } catch (error) {
        console.error('Error in /login:', {
          message: error.message,
          stack: error.stack,
          payload: request.payload,
        });
        return h.response({ error: 'Terjadi kesalahan server', details: error.message }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/users',
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: async (request, h) => {
      try {
        const users = await User.find().select('-password');
        return h.response(users).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/users/{id}',
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: async (request, h) => {
      try {
        const { userId } = request.auth;
        if (userId !== request.params.id) {
          return h.response({ error: 'Akses ditolak' }).code(403);
        }
        const user = await User.findById(request.params.id).select('-password');
        if (!user) {
          return h.response({ error: 'User tidak ditemukan' }).code(404);
        }
        return h.response(user).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'PUT',
    path: '/users/{id}',
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: async (request, h) => {
      try {
        const { userId } = request.auth;
        if (userId !== request.params.id) {
          return h.response({ error: 'Akses ditolak' }).code(403);
        }
        const { name, email, city, longitude, latitude, password } = request.payload;
        const updateData = { name, email, city, longitude, latitude };
        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        if (!updatedUser) {
          return h.response({ error: 'User tidak ditemukan' }).code(404);
        }
        return h.response(updatedUser).code(200);
      } catch (error) {
        console.error('Error saat update user:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'DELETE',
    path: '/users/{id}',
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: async (request, h) => {
      try {
        const { userId } = request.auth;
        if (userId !== request.params.id) {
          return h.response({ error: 'Akses ditolak' }).code(403);
        }
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
          return h.response({ error: 'User tidak ditemukan' }).code(404);
        }
        return h.response({ message: 'User berhasil dihapus' }).code(200);
      } catch (error) {
        console.error('Error saat delete user:', error);
        return h.response({ error: error.message }).code(500);
      }
    },
  },
];