const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || "1";
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;

async function getPhonePeToken() {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  const body =
    `client_id=${CLIENT_ID}&` +
    `client_version=${CLIENT_VERSION}&` +
    `client_secret=${CLIENT_SECRET}&` +
    `grant_type=client_credentials`;

  console.log("🔐 PhonePe Token Request:", body);

  try {
    const response = await axios.post(
      "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
      body,
      { headers }
    );

    console.log("📩 PhonePe Token Response:", response.data);
    return response.data.access_token;

  } catch (error) {
    console.error("❌ PhonePe Token Error:", error.response?.data || error.message);

    throw new Error(
      `PhonePe token request failed: ${JSON.stringify(
        error.response?.data || error.message
      )}`
    );
  }
}

module.exports = getPhonePeToken;
