const express = require("express");
const Banner = require("../models/Banner");
const upload = require("../middlewares/uploadBanner");

const router = express.Router();

/* =========================
   GET ALL BANNERS
========================= */
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});

/* =========================
   CREATE BANNER
========================= */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const banner = new Banner({
      title: req.body.title,
      image: `/uploads/banners/${req.file.filename}`,
      status: req.body.status === "true" || req.body.status === true,
    });

    await banner.save();
    res.status(201).json(banner);
  } catch (err) {
    console.log(err); // ADD THIS
    res.status(400).json({ message: "Failed to create banner" });
  }
});

/* =========================
   TOGGLE STATUS
========================= */
router.patch("/:id/status", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    banner.status = !banner.status;
    await banner.save();

    res.json({ status: banner.status });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

/* =========================
   DELETE BANNER
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete banner" });
  }
});

module.exports = router;
