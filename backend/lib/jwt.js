const jwt = require("jsonwebtoken");

/**
 * Генерация JWT токена
 * @param {Object} payload - Данные для токена (userId, email)
 * @returns {string} JWT токен
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

/**
 * Проверка JWT токена
 * @param {string} token - JWT токен
 * @returns {Object} Декодированные данные
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Декодирование токена без проверки (только для чтения)
 * @param {string} token - JWT токен
 * @returns {Object|null} Декодированные данные или null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
