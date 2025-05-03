import express from "express";
import {
  login,
  signout,
  signup,
  onboard,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/signout", signout);

router.post("/onboarding", protectedRoute, onboard);

// Checks if the user is logged in and returns the user object
router.get("/me", protectedRoute, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;
