const express = require("express");
const router = express.Router();
const paymentController = require("../Controllers/paymentController");

router.post("/initiate", paymentController.initiatePayment);
router.get("/verify", paymentController.verifyPayment);

module.exports = router;
