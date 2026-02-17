const Order = require("../models/Order");
const Address = require("../models/Address");
const Product = require("../models/Product");
const { createShipcorrectOrder } = require("../utils/Shipcorrect");

/* ======================================================
   CREATE ORDER (COD - NO PAYMENT)
====================================================== */
exports.createOrder = async (req, res) => {
  try {
    const { amount, items, addressId } = req.body;

    if (!amount || !items?.length || !addressId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    /* =============================
       CHECK STOCK FIRST
    ============================== */
    for (const item of items) {
      const product = await Product.findOne({
        name: item.productName,
      });

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.productName}`,
        });
      }
    }

    /* =============================
       CREATE ORDER
    ============================== */
    const merchantOrderId = `ORD_${Date.now()}_${Math.floor(Math.random()*1000)}`;


    const order = await Order.create({
      address: addressId,
      merchantOrderId,
      amount,
      paymentMode: "COD",
      items, // ✅ save full items array
      status: "Payment Pending",
    });

    /* =============================
       REDUCE STOCK
    ============================== */
    for (const item of items) {
      const product = await Product.findOne({
        name: item.productName,
      });

      product.stock -= item.quantity;
      product.soldStock =
        (product.soldStock || 0) + item.quantity;

      await product.save();
    }

    /* =============================
       CREATE SHIPCORRECT ORDER
    ============================== */
    try {
      const shipRes = await createShipcorrectOrder(order._id);

      if (shipRes?.status === "success") {
        order.shipcorrectOrderNo = shipRes.order_no;
        await order.save();
      }
    } catch (err) {
      console.error("ShipCorrect Error:", err.message);
    }

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });

  } catch (err) {
    console.error("Order Creation Error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

/* ======================================================
   ADMIN APIs
====================================================== */

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("address")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("address");

    if (!order)
      return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch {
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(order);
  } catch {
    res.status(500).json({ error: "Failed to update order" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete order" });
  }
};
