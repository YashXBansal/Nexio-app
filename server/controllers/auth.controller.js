import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { upsertStreamUser } from "../lib/stream.js";

const JWT_SECRET = process.env.JWT_SECRET;

const signupSchema = z.object({
  fullName: z.string().min(3),
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  password: z.string().min(6),
});

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = signupSchema.parse(req.body);
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({
        message: "Email already exists. PLease use a different one.",
      });
    const idx = Math.floor(Math.random() * 100) + 1; // generate a random number between 1 and 100.
    const randomProfilePic = `https://avatar.iran.liara.run/public/${idx}.png`;
    const newUser = new User({
      fullName,
      email,
      password,
      profilePic: randomProfilePic,
    });
    await newUser.save();

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(
        `Stream user created/updated successfully for ${newUser.fullName}`
      );
    } catch (error) {
      console.error("Error creating/updating Stream user:", error);
      return res.status(500).json({
        message: "Error creating/updating Stream user",
      });
    }

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevents XSS attacks
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // prevent CSRF attacks
    });
    res
      .status(201)
      .json({ message: "User registered", user: newUser, success: true });
  } catch (err) {
    console.log("Error in signup:", err);
    res.status(400).json({ error: err.errors || err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevents XSS attacks
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // prevent CSRF attacks
    });
    res.status(201).json({ message: "Login successful" });
  } catch (err) {
    console.log("Error in login:", err);
    res.status(400).json({ error: err.errors || err.message });
  }
};

export const signout = (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "User signed out" });
};

// export const onboard = async (req, res) => {
//   console.log("Onboarding user:", req.user);
//   try {
//     const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;
//     const userId = req.user._id;

//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { fullName, profilePic },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ message: "User onboarded successfully", user: updatedUser });
//   } catch (err) {
//     console.log("Error in onboarding:", err);
//     res.status(400).json({ error: err.errors || err.message });
//   }
// }

export const onboard = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user found in request" });
    }

    const {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      profilePic, // Optional
    } = req.body;

    // Validate required fields
    const requiredFields = {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
    };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    const updateData = {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      ...(profilePic && { profilePic }), // only include if provided
      isOnboarded: true,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(
        `Stream user created/updated successfully for ${updatedUser.fullName}`
      );
    } catch (streamError) {
      console.error("Error creating/updating Stream user:", streamError);
      return res.status(500).json({
        message: "Error creating/updating Stream user",
      });
    }

    res.status(200).json({
      message: "User onboarded successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in onboarding:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};
