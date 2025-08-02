const jwt = require("jsonwebtoken");
const { connectToDatabase } = require("./mongodb");
const User = require("./models/User");

const authenticateToken = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new Error("Access token required");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      throw new Error("User not found or account deactivated");
    }

    return user;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    throw new Error(error.message || "Invalid token");
  }
};

const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const handleCors = (req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
};

module.exports = {
  authenticateToken,
  setCorsHeaders,
  handleCors,
};
