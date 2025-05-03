import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;

export const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log("Decoded token:", decoded);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      // console.log("User not found in database:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(403).json({ message: "Forbidden - Invalid or expired token" });
  }
};
