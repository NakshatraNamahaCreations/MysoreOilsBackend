const axios = require("axios");
const getPhonePeToken = require("./getPhonePeToken");

const PHONEPE_PAY_URL =
  "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

async function initiatePhonePePayment({
  orderId,
  amount,
  callbackUrl,
}) {
  try {
    const token = await getPhonePeToken();

    const payload = {
    //   merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: `ORD_${Date.now()}`,
      merchantUserId: `USER_${orderId}`,
      amount: amount * 100, // in paise
      redirectUrl: callbackUrl,
      redirectMode: "REDIRECT",
      callbackUrl: callbackUrl,
      mobileNumber: "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    console.log("📦 PhonePe Payload:", payload);

    // ✅ BASE64 encode payload
    const base64Payload = Buffer.from(
      JSON.stringify(payload)
    ).toString("base64");

    const response = await axios.post(
      PHONEPE_PAY_URL,
      {
        request: base64Payload,
      },
      {
        headers: {
          Authorization: `O-Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ PhonePe Response:", response.data);

    const redirectUrl =
      response.data?.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
      throw new Error("Redirect URL not received from PhonePe");
    }

    return { redirectUrl };

  } catch (error) {
    console.error(
      "❌ PhonePe Payment Error:",
      error.response?.data || error.message
    );

    throw new Error("PhonePe payment initiation failed");
  }
}

async function verifyPhonePePayment(transactionId) {
  return true;
}

module.exports = {
  initiatePhonePePayment,
  verifyPhonePePayment,
};
