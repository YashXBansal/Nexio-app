import express from "express";
import { login, signout, signup } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/signout", signout);

export default router;
// This code defines an Express router for authentication routes. It imports the necessary modules and functions, creates a new router instance, and sets up three POST routes: "/signup", "/login", and "/signout". Each route is associated with a corresponding controller function (signup, login, signout) that handles the request and response. Finally, the router is exported for use in other parts of the application.