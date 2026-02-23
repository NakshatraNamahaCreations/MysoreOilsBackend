const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid");
const { createShipcorrectOrder } = require("../utils/Shipcorrect");
const {
  initiatePhonePePayment,
  verifyPhonePePayment,
} = require("../utils/phonepe");

/* ================= INITIATE PAYMENT ================= */

exports.initiatePayment = async (req, res) => {
  try {
    const { amount, items, addressId, customerId } = req.body;

    if (!amount || !items?.length || !addressId) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const merchantTransactionId = `TX_${uuidv4()}`;

    const normalizedItems = items.map((it) => ({
      productName: it.productName || it.name || "Unnamed Product",
      productImage: it.productImage || it.image || "",
      price: it.price,
      quantity: it.quantity,
    }));

    const pendingOrder = await Order.create({
      merchantTransactionId,
      customerId,
      amount,
      address: addressId,
      items: normalizedItems,
      status: "Payment Pending",
      paymentMode: "Online",
    });

    const phonepe = await initiatePhonePePayment({
      merchantTransactionId,
      amount,
    });

    return res.status(200).json({
      success: true,
      redirectUrl: phonepe.redirectUrl,
    });

  } catch (err) {
    console.error("Payment initiation error:", err);
    return res.status(500).json({
      error: "Error initiating payment",
    });
  }
};


/* ================= VERIFY PAYMENT ================= */

exports.verifyPayment = async (req, res) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.redirect(
        "https://themysoreoils.com/payment-failed"
      );
    }

    const order = await Order.findOne({
      merchantTransactionId: merchantId,
    }).populate("address");

    if (!order) {
      return res.redirect(
        "https://themysoreoils.com/payment-failed"
      );
    }

    const statusResult = await verifyPhonePePayment(
      merchantId
    );

    const paymentState = statusResult?.state;

    console.log("📩 PhonePe State:", paymentState);

    /* ===== SUCCESS ===== */
    if (paymentState === "COMPLETED") {
      order.status = "Paid";
      order.paymentTransactionId =
        statusResult?.transactionId;
      await order.save();

      try {
        const shipment = await createShipcorrectOrder(
          order._id
        );

        if (shipment) {
          await Order.findByIdAndUpdate(order._id, {
            $set: {
              shiprocket: shipment,
            },
          });
        }
      } catch (err) {
        console.error("Shipment creation failed:", err);
      }

      return res.redirect(
        "https://themysoreoils.com/thankyou"
      );
    }

    /* ===== FAILED / CANCELLED / EXPIRED ===== */
    order.status = "Failed";
    await order.save();

    return res.redirect(
      "https://themysoreoils.com/payment-failed"
    );

  } catch (err) {
    console.error("Payment verification error:", err);

    return res.redirect(
      "https://themysoreoils.com/payment-failed"
    );
  }
};