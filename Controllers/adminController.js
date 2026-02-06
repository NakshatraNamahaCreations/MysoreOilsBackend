const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (admin) => {
  return jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc Register new Admin
// @route POST /api/admin/register
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let adminExists = await Admin.findOne({ email });
    if (adminExists) return res.status(400).json({ message: "Admin already exists" });

    let admin = await Admin.create({ username, email, password });

    res.status(201).json({
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      token: generateToken(admin),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc Login Admin
// @route POST /api/admin/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      token: generateToken(admin),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc Update Admin details
// @route PUT /api/admin/update/:id
const updateAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const admin = await Admin.findById(req.params.id);

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.username = username || admin.username;
    admin.email = email || admin.email;
    if (password) admin.password = password;

    await admin.save();
    res.json({ message: "Admin updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

module.exports = { registerAdmin, loginAdmin, updateAdmin };
