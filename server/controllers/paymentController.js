const stripeService = require("../services/stripeService");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { uploadFile } = require("../services/S3_Services");

function generateCode(length = 6) {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    code += digits[randomIndex];
  }
  return code;
}


exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "gbp", metadata } = req.body;

    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0 || isNaN(amountNumber)) {
      return res.status(400).json({
        success: false,
        error: "Valid positive amount is required",
      });
    }

    const paymentIntent = await stripeService.createPaymentIntent(
      amountNumber,
      currency,
      metadata
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create payment intent",
    });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const {
      paymentIntentId,
      billingName,
      institutionName,
      planTitle,
      planDuration,
      fname,
      lname,
      username,
      email,
      country,
    } = req.body;
    console.log("Received data:", req.file);

    const image = req.file;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment Intent ID is required",
      });
    }

    if (!billingName || !planTitle || !planDuration || !fname || !lname || !username || !email) {
      return res.status(400).json({
        success: false,
        error: "All billing details are required",
      });
    }

    const paymentIntent = await stripeService.retrievePaymentIntent(
      paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    const paymentRecord = {
      payment_id: paymentIntent.id,
      amount: parseFloat((paymentIntent.amount / 100).toFixed(2)),
      currency: paymentIntent.currency,
      method: paymentIntent.payment_method_types[0],
      created_at: new Date(),
    };

    const code = generateCode();
    const thumbnail = await uploadFile(image, "image", code);

    const userData = {
      fname: fname,
      lname: lname,
      username: username,
      uemail: email,
      role: "admin",
      password: 0,
      planType: planTitle,
      user_unique_id: code,
      created_at: new Date(),
      updated_at: new Date(),
      user_thumbnail: thumbnail.Location,
    };

    const [id] = await knex("users").insert(userData).returning("id");
    paymentRecord.userId = id;

    const savedPayment = await knex("payment").insert(paymentRecord);
    
    res.json({ success: true, payment: savedPayment });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
};
