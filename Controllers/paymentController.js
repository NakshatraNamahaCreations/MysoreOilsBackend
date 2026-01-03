const fetch = require("node-fetch");
const Order = require("../models/Order");
const getPhonePeToken = require("../utils/getPhonePeToken");
const { v4: uuidv4 } = require("uuid");

const generateUniqueTransactionId = () => {
  return `TX_${uuidv4()}`;
};


// 🔹 INITIATE PAYMENT
exports.initiatePayment = async (req, res) => {
  try {
    const { amount, items, addressId,   customerId } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });
    if (!items || items.length <= 0) {
      return res.status(400).json({ error: "Items are not present" });
    }

    const accessToken = await getPhonePeToken();
    const merchantTransactionId = generateUniqueTransactionId();

    // 1️⃣ Create Pending Order before redirect
    const pendingOrder = await Order.create({
      merchantOrderId: merchantTransactionId,
customerId,
      amount,
      address: addressId,
      items,
      status: "Pending",
      paymentMode: "Online",
      createdAt: new Date(),
    });

    console.log("📝 Pending order created:", pendingOrder._id);

    // 2️⃣ Prepare PhonePe payload
    const payload = {
      merchantOrderId: merchantTransactionId,
      amount: amount * 100,
      expireAfter: 1200,
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `https://api.themysoreoils.com/api/payment/verify?merchantId=${merchantTransactionId}`,
        },
      },
    };

    // 3️⃣ Send request to PhonePe
    const response = await fetch(
      `${process.env.PHONEPE_API_URL}/checkout/v2/pay`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok || !result?.redirectUrl) {
      // rollback pending order if PhonePe fails
      await Order.deleteOne({ _id: pendingOrder._id });
      throw new Error("PhonePe initiation failed");
    }

    res.status(200).json({
      success: true,
      phonepeResponse: {
        redirectUrl: result.redirectUrl,
        merchantTransactionId,
      },
    });
  } catch (err) {
    console.error("Payment initiation error:", err);
    res.status(500).json({ error: "Error initiating payment" });
  }
};

// 🔹 VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const { merchantId } = req.query; // merchantTransactionId
    if (!merchantId) {
      return res.status(400).json({ error: "merchantId is required" });
    }

    console.log("👉 Incoming verifyPayment request:", merchantId);

    // 1️⃣ Fetch pending order
    const order = await Order.findOne({ merchantOrderId: merchantId });
    if (!order) {
      console.error("❌ No order found for merchantId:", merchantId);
      return res.redirect(
        `https://themysoreoils.com/payment-failed?merchantId=${merchantId}`
      );
    }

    // 2️⃣ Get PhonePe token
    const accessToken = await getPhonePeToken();

    // 3️⃣ Call PhonePe status API
    const statusUrl = `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantId}/status`;

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
      },
    });

    const statusResult = await response.json();
    console.log("📩 PhonePe Verification Response:", statusResult);

    if (statusResult?.state === "COMPLETED") {
      // ✅ Update order
      order.status = "Paid";
      order.paymentTransactionId = statusResult.transactionId;
      order.updatedAt = new Date();
      await order.save();

      console.log("✅ Payment Success. Order updated:", order._id);
      return res.redirect(
        `https://themysoreoils.com/thankyou?merchantId=${merchantId}`
      );
    }

    // ❌ Payment failed → delete order
    await Order.deleteOne({ _id: order._id });
    console.error("❌ Payment not successful. Order deleted:", order._id);

    return res.redirect(
      `https://themysoreoils.com/payment-failed?merchantId=${merchantId}`
    );
  } catch (err) {
    console.error("💥 Payment verification error:", err);
    return res.status(500).json({ error: "Error verifying payment" });
  }
};


// exports.initiatePayment = async (req, res) => {

//   // console.log("req.body", req.body)
//   try {
//     const { amount, items, addressId } = req.body;
//     if (!amount) return res.status(400).json({ error: "Amount is required" });

//    if(items.length <= 0){
//     return res.status(400).json({error: "Items are not present"})
//    }
//     const accessToken = await getPhonePeToken();
//     const merchantTransactionId = generateUniqueTransactionId();

//     const payload = {
//       merchantOrderId: merchantTransactionId,
//       amount: amount * 100,
//       expireAfter: 1200,
//       paymentFlow: {
//         type: "PG_CHECKOUT",
//         // merchantUrls: {
//         //     redirectUrl: `${process.env.FRONTEND_URL}/payment-status`,
//         //   callbackUrl: `${process.env.BACKEND_URL}/api/payment/verify`,

//         merchantUrls: {
//           redirectUrl: `https://api.themysoreoils.com/api/payment/verify?merchantId=${merchantTransactionId}`,
//         },
//       },
//     };

//     const response = await fetch(
//       `${process.env.PHONEPE_API_URL}/checkout/v2/pay`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `O-Bearer ${accessToken}`,
//         },
//         body: JSON.stringify(payload),
//       }
//     );

//     const result = await response.json();
//     if (!response.ok || !result?.redirectUrl) {
//       throw new Error("PhonePe initiation failed");
//     }

//     // ✅ only return redirect URL + transaction ID
//     res.status(200).json({
//       success: true,
//       phonepeResponse: {
//         redirectUrl: result.redirectUrl,
//         merchantTransactionId,
//         amount,
//         items: items,
//         addressId,
//       },
//     });
//   } catch (err) {
//     console.error("Payment initiation error:", err);
//     res.status(500).json({ error: "Error initiating payment" });
//   }
// };


// exports.verifyPayment = async (req, res) => {
//   console.log("verify req.body", req.body)
//   try {
//     const { merchantId } = req.query; // this is merchantTransactionId
//       const { items, addressId } = req.body; 
//     if (!merchantId) {
//       console.error("❌ Missing merchantId");
//       return res.status(400).json({ error: "merchantId is required" });
//     }

//     console.log("👉 Incoming verifyPayment request:", merchantId);

//     // 1️⃣ Get PhonePe token
//     const accessToken = await getPhonePeToken();
//     console.log("✅ Got PhonePe accessToken:", accessToken?.slice(0, 20) + "...");

//     // 2️⃣ Call PhonePe status API (correct format needs merchantId + transactionId)
//  const statusUrl = `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantId}/status`;
//     console.log("🌐 PhonePe Status URL:", statusUrl);

//     const response = await fetch(statusUrl, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `O-Bearer ${accessToken}`,
//       },
//     });

//     const statusResult = await response.json();
//     console.log("📩 PhonePe Verification Response:", statusResult);
//     console.log("📩 PhonePe STATUS:", statusResult.state);

//     if (!statusResult || typeof statusResult !== "object") {
//       console.error("Invalid response structure from PhonePe:", statusResult);
//       return res.status(500).json({
//         success: false,
//         error: "Invalid response from payment gateway.",
//       });
//     }

    
//     if ( statusResult?.state === "COMPLETED") {
//       console.log("✅ Payment Success. Creating order...");

      
//       const newOrder = await Order.create({
//         merchantOrderId: merchantId,
//         amount: statusResult.amount / 100, 
//         address: addressId,
//         items, 
//         status: "Paid",
//         paymentMode: "Online",
//         paymentTransactionId: statusResult.transactionId,
//         createdAt: new Date(),
//       });

//       console.log("Order created:", newOrder._id);

//       return res.redirect(`https://themysoreoils.com/thankyou?merchantId=${merchantId}`);
//     }


//     console.error("❌ Payment not successful:", statusResult.data?.state);
//     return res.redirect(`https://themysoreoils.com/payment-failed?merchantId=${merchantId}`);

//   } catch (err) {
//     console.error("💥 Payment verification error:", err);
//     return res.status(500).json({ error: "Error verifying payment" });
//   }
// };

