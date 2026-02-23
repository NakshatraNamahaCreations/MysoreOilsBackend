const axios = require("axios");
const getPhonePeToken = require("./getPhonePeToken");

const PHONEPE_BASE_URL = process.env.PHONEPE_API_URL;

/* =====================================================
   INITIATE PHONEPE PAYMENT (Checkout v2)
===================================================== */

exports.initiatePhonePePayment = async ({
  merchantTransactionId,
  amount,
}) => {
  try {
    const accessToken = await getPhonePeToken();

    const payload = {
      merchantOrderId: merchantTransactionId,
      amount: amount * 100, // convert to paise
      expireAfter: 1200, // 20 mins
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `${process.env.BACKEND_URL}/api/payments/verify?merchantId=${merchantTransactionId}`,
        },
      },
    };

    console.log("📦 PhonePe Payload:", payload);

    const response = await axios.post(
      `${PHONEPE_BASE_URL}/checkout/v2/pay`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      }
    );

    const result = response.data;

    console.log("📤 PhonePe Initiation Response:", result);

    if (response.status !== 200 || !result?.redirectUrl) {
      throw new Error("PhonePe initiation failed");
    }

    return {
      success: true,
      redirectUrl: result.redirectUrl,
    };

  } catch (error) {
    console.error(
      "❌ PhonePe Initiation Error:",
      error.response?.data || error.message
    );

    throw new Error("PhonePe payment initiation failed");
  }
};


/* =====================================================
   VERIFY PHONEPE PAYMENT (Checkout v2)
===================================================== */

exports.verifyPhonePePayment = async (merchantTransactionId) => {
  try {
    const accessToken = await getPhonePeToken();

    const statusUrl = `${PHONEPE_BASE_URL}/checkout/v2/order/${merchantTransactionId}/status`;

    const response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
      },
    });

    console.log("📩 PhonePe Status Response:", response.data);

    return response.data;

  } catch (error) {
    console.error(
      "❌ PhonePe Verification Error:",
      error.response?.data || error.message
    );

    throw new Error("PhonePe verification failed");
  }
};