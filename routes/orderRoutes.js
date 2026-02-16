const express = require("express");
const router = express.Router();
const orderController = require("../Controllers/orderController");
const { createShipcorrectOrder } = require("../utils/Shipcorrect");

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);

// ShipCorrect integration
router.post("/shipcorrect/:orderId", async (req, res) => {
  try {
    const response = await createShipcorrectOrder(req.params.orderId);

    if (!response || response.status !== "success") {
      return res.status(400).json({
        message: "ShipCorrect order creation failed",
      });
    }

    res.json({
      message: "Order sent to ShipCorrect successfully",
      data: response,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
