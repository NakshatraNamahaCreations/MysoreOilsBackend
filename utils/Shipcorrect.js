const axios = require("axios");
const Order = require("../models/Order");

/* ---------------- HELPERS ---------------- */

const mapPaymentMode = (mode) => {
  if (mode === "COD") return "COD";
  return "PREPAID";
};

const cleanPhone = (phone = "") =>
  phone.toString().replace(/\D/g, "").slice(-10);

const cleanPincode = (pin = "") =>
  pin.toString().replace(/\D/g, "").slice(0, 6);

const normalizeAddress = (addr = {}) => {
  return {
    fullName:
      addr.name ||
      `${addr.firstName || ""} ${addr.lastName || ""}`.trim(),

    address1: addr.addressLine1 || addr.address || "",
    address2: addr.addressLine2 || addr.landmark || "",
    landmark: addr.landmark || "",
    city: addr.city,
    state: addr.state,
    pincode: cleanPincode(addr.pincode),
    phone: cleanPhone(addr.mobileNumber || addr.phone),
    email: addr.email || "mysoreoils.social@gmail.com",
  };
};

/* ---------------- CREATE ORDER ---------------- */

exports.createShipcorrectOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate("address")
      .lean();

    if (!order) throw new Error("Order not found");

    const addr = normalizeAddress(order.address);

    const item = order.items[0]; // ShipCorrect accepts single item per call

    const payload = {
      api_key: process.env.SHIPCORRECT_API_KEY,

      customer_name: addr.fullName,
      customer_email: addr.email,

      customer_address1: addr.address1,
      customer_address2: addr.address2,
      customer_address_landmark: addr.landmark,

      customer_address_state: addr.state,
      customer_address_city: addr.city,
      customer_address_pincode: addr.pincode,

      customer_contact_number1: addr.phone,
      customer_contact_number2: "",

      product_id: item.productId || "1",
      product_name: item.productName,
      sku: item.sku || `SKU-${Date.now()}`,

      mrp: String(item.price),
      product_size: "Standard",
      product_weight: String(order.weight || 1),
      product_color: "Standard",

      pay_mode: mapPaymentMode(order.paymentMode),
      quantity: String(item.quantity),

      total_amount: String(order.amount),
      client_order_no: order.customOrderId || order._id.toString(),
    };

    console.log("📦 ShipCorrect Payload:", payload);

    const response = await axios.post(
      "https://www.shipcorrect.com/api/createForwardOrder.php",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ ShipCorrect Response:", response.data);

    return response.data;

  } catch (err) {
    console.error(
      "❌ ShipCorrect Error:",
      err.response?.data || err.message
    );
    return null;
  }
};
