const express = require("express");
const router = express.Router();

const orderController = require("../Controllers/orderController");

/* PAYMENT ROUTES */
router.post("/payment/initiate", orderController.initiatePayment);
router.post("/payment/verify", orderController.verifyPayment);

/* ADMIN / ORDER ROUTES */
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);

module.exports = router;
