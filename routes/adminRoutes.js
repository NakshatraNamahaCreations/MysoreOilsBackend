const express = require("express");
const { registerAdmin, loginAdmin, updateAdmin } = require("../Controllers/adminController");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/update/:id", updateAdmin);

module.exports = router;
