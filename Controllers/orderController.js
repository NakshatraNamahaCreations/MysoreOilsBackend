const Order = require("../models/Order");
const Address = require("../models/Address");
const Product = require("../models/Product");
const { createShipcorrectOrder } = require("../utils/Shipcorrect");

const orderController = {

  /* ================= CREATE ORDER ================= */
  createOrder: async (req, res) => {
    try {
      const {
        addressId,
        amount,
        paymentMode,
        quantity,
        productImage,
        productName,
      } = req.body;

      // Validate required fields
      if (!addressId || !amount || !paymentMode || !quantity || !productName) {
        return res.status(400).json({
          error: "All fields are required, including productName.",
        });
      }

      // Validate address
      const addressExists = await Address.findById(addressId);
      if (!addressExists) {
        return res.status(404).json({ error: "Address not found." });
      }

      // Find product
      const product = await Product.findOne({ name: productName });
      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }

      // Check stock
      if (product.stock < quantity) {
        return res.status(400).json({
          error: "Insufficient stock available.",
        });
      }

      // Update stock
      product.stock -= quantity;
      product.soldStock = (product.soldStock || 0) + quantity;
      await product.save();

      // Create order
      const newOrder = new Order({
        address: addressId,
        amount,
        paymentMode,
        quantity,
        productImage,
        productName,
        status: "Pending",
      });

      await newOrder.save();

      /* ================= SHIPCORRECT INTEGRATION ================= */
      try {
        const shipcorrectResponse =
          await createShipcorrectOrder(newOrder._id);

        // Save ShipCorrect order number if success
        if (
          shipcorrectResponse &&
          shipcorrectResponse.status === "success"
        ) {
          newOrder.shipcorrectOrderNo =
            shipcorrectResponse.order_no;

          await newOrder.save();
        }
      } catch (shipErr) {
        console.error(
          "❌ ShipCorrect failed:",
          shipErr.message
        );
        // Do not stop order creation if shipping fails
      }

      return res.status(201).json({
        message: "Order created successfully",
        order: newOrder,
      });

    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        error: "Server error while creating order",
      });
    }
  },

  /* ================= GET ALL ORDERS ================= */
  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("address")
        .sort({ createdAt: -1 });

      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({
        error: "Server error while fetching orders",
      });
    }
  },

  /* ================= GET SINGLE ORDER ================= */
  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate("address");

      if (!order)
        return res.status(404).json({ error: "Order not found" });

      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({
        error: "Server error while fetching order",
      });
    }
  },

  /* ================= DELETE ORDER ================= */
  deleteOrder: async (req, res) => {
    try {
      const order = await Order.findByIdAndDelete(req.params.id);

      if (!order)
        return res.status(404).json({ error: "Order not found" });

      res.status(200).json({
        message: "Order deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Server error while deleting order",
      });
    }
  },

  /* ================= UPDATE ORDER STATUS ================= */
  updateOrderStatus: async (req, res) => {
    try {
      const { status } = req.body;

      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate("address");

      if (!updatedOrder)
        return res.status(404).json({ error: "Order not found" });

      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        error: "Server error while updating status",
      });
    }
  },
};

module.exports = orderController;
