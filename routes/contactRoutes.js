const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

router.post("/contact", async (req, res) => {
  try {
    const contact = await Contact.create(req.body);

    res.status(201).json({
      success: true,
      message: "Contact submitted successfully",
      data: contact
    });
  } catch (error) {
    console.error("Contact Save Error:", error); // 👈 ADD THIS
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

router.get("/admin/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// DELETE CONTACT
router.delete("/admin/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await Contact.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
});

module.exports = router;