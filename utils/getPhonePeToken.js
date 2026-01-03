require("dotenv").config(); 

const fetch = require("node-fetch");

// ✅ Read from environment variables
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || "1"; 
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;

async function getPhonePeToken() {
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };

  // Build body string exactly like Postman
  const body =
    `client_id=${CLIENT_ID}&` +
    `client_version=${CLIENT_VERSION}&` +
    `client_secret=${CLIENT_SECRET}&` +
    `grant_type=client_credentials`;

  console.log("🔐 PhonePe Token Request:", body);

  const response = await fetch("https://api.phonepe.com/apis/identity-manager/v1/oauth/token", {
    method: "POST",
    headers,
    body,
  });

  const text = await response.text();
  console.log("📩 PhonePe Raw Token Response:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected response from PhonePe: ${text}`);
  }

  if (!response.ok) {
    throw new Error(`PhonePe token request failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

module.exports = getPhonePeToken;
