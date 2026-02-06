const bcrypt = require("bcrypt");
const User = require("../models/Customer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Register a new user
exports.register = async (req, res) => {
    try {
      console.log("🔍 Received Request:", req.body); 
  
      const { firstname, lastname, email, mobilenumber, password } = req.body;
  
      // Check if all fields are provided
      if (!firstname || !lastname || !email || !mobilenumber || !password) {
        return res.status(400).json({ message: " All fields are required." });
      }
  
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists. Please log in." });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create new user
      const newUser = new User({
        firstname,
        lastname,
        email,
        mobilenumber,
        password: hashedPassword,
      });
  
      await newUser.save();
  
      console.log("✅ User Registered Successfully:", newUser);
      res.status(201).json({ message: "✅ User registered successfully!" });
  
    } catch (error) {
      console.error("❌ Server Error:", error);
      res.status(500).json({ message: "❌ Internal Server Error", error: error.message });
    }
  };


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "⚠️ User not found" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "❌ Invalid credentials" });
        }

        // ✅ Send user ID in the response
        res.status(200).json({
            message: "✅ Login successful",
            user: {
                id: user._id,  // ✅ Ensure this is included
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.mobilenumber,
                countryCode: "+91",
            }
        });

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: " Server error", error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log("📩 Forgot Password Request for:", email);
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log("❌ No user found for email:", email);
        return res.status(404).json({ message: "User not found" });
      }
  
      const token = crypto.randomBytes(32).toString("hex");
      user.resetToken = token;
      user.resetTokenExpiry = Date.now() + 3600000;
      await user.save();
  
      console.log("✅ Token generated and saved:", token);
  
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });
  
      const resetLink = `https://aves.in/reset-password/${token}`;
  
      const mailOptions = {
        from: process.env.MAIL_USER,
        to: user.email,
        subject: "Reset Password",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log("✅ Mail sent");
  
      res.status(200).json({ message: "Reset link sent to your email." });
  
    } catch (error) {
      console.error("❌ Forgot Password Error:", error.message);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
  
  
  // Reset Password
  exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;
  
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
  
    try {
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
      });
  
      if (!user) return res.status(400).json({ message: "Invalid or expired token" });
  
      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
  
      res.status(200).json({ message: "Password reset successful" });
  
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };




// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
  try {
      const users = await User.find().select("-password"); // Exclude password
      res.status(200).json(users);
  } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
