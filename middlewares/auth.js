const jwt = require('jsonwebtoken');

const verifyToken = (request, h) => {
  const token = request.headers.authorization?.split(' ')[1];
  if (!token) {
    return h.response({ error: 'Token tidak ditemukan' }).code(401).takeover();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.auth = { userId: decoded.userId };
    return h.continue;
  } catch (error) {
    return h.response({ error: 'Token tidak valid' }).code(401).takeover();
  }
};

module.exports = { verifyToken };