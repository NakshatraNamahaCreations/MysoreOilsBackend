const Order = require("../models/Order");
const Address = require("../models/Address");
const Product = require("../models/Product");

const { createShipcorrectOrder } = require("../utils/Shipcorrect");
const {
  initiatePhonePePayment,
  verifyPhonePePayment,
} = require("../utils/getPhonePeToken");

/* ======================================================
   INITIATE PAYMENT (CREATE TEMP ORDER)
====================================================== */
exports.initiatePayment = async (req, res) => {
  try {
    const { amount, items, addressId, callbackUrl } = req.body;

    if (!amount || !items?.length || !addressId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Create temporary order
    const order = await Order.create({
      address: addressId,
      items,
      amount,
      paymentMode: "ONLINE",
      status: "Payment Pending",
    });

    const phonepeResponse = await initiatePhonePePayment({
      orderId: order._id,
      amount,
      callbackUrl,
    });

    res.status(200).json({
      phonepeResponse,
      orderId: order._id,
    });

  } catch (err) {
    console.error("Payment Initiation Error:", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};


/* ======================================================
   VERIFY PAYMENT (PHONEPE CALLBACK)
====================================================== */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;

    if (!orderId || !transactionId) {
      return res.redirect(
        "https://themysoreoils.com/payment-failed"
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.redirect(
        "https://themysoreoils.com/payment-failed"
      );
    }

    /* =============================
       VERIFY PAYMENT
    ============================== */
    const isPaid = await verifyPhonePePayment(transactionId);

    if (!isPaid) {
      order.status = "Payment Failed";
      await order.save();

      return res.redirect(
        "https://themysoreoils.com/payment-failed"
      );
    }

    /* =============================
       REDUCE STOCK
    ============================== */
    for (const item of order.items) {
      const product = await Product.findOne({
        name: item.productName,
      });

      if (!product || product.stock < item.quantity) {
        return res.redirect(
          "https://themysoreoils.com/payment-failed"
        );
      }

      product.stock -= item.quantity;
      product.soldStock =
        (product.soldStock || 0) + item.quantity;

      await product.save();
    }

    order.status = "Paid";
    order.transactionId = transactionId;
    await order.save();

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

    /* =============================
       SUCCESS REDIRECT
    ============================== */
    return res.redirect(
      `https://themysoreoils.com/thank-you`
    );

  } catch (err) {
    console.error("Payment Verification Error:", err);

    return res.redirect(
      "https://themysoreoils.com/payment-failed"
    );
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
