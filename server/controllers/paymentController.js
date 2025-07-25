const stripeService = require("../services/stripeService");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { uploadFile } = require("../services/S3_Services");
const fs = require("fs");
const ejs = require("ejs");
const welcomeEmail = fs.readFileSync("./EmailTemplates/Welcome.ejs", "utf8");
const compiledWelcome = ejs.compile(welcomeEmail);
const sendMail = require("../helpers/mailHelper");
const jwt = require("jsonwebtoken");

function generateCode(length = 6) {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    code += digits[randomIndex];
  }
  return code;
}

async function generateOrganisationId(length = 12) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
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

    const image = req.file;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment Intent ID is required",
      });
    }

    if (
      !billingName ||
      !planTitle ||
      !planDuration ||
      !fname ||
      !lname ||
      !username ||
      !email
    ) {
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
      role: "Admin",
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

      const organisation_id = await generateOrganisationId();
      const existingOrg = await knex("organisations")
      .where({ org_email: email })
      .first();

    if (existingOrg) {
      return res
        .status(400)
        .json({ message: "Email already associated with an organization" });
    }

        await knex("organisations").insert({
      name: institutionName,
      organisation_id: organisation_id,
      org_email: email,
      organisation_icon: thumbnail.Location,
      organisation_deleted: false
    });

    const passwordSetToken = jwt.sign({ id }, process.env.JWT_SECRET);
    const url = `${process.env.CLIENT_URL}/reset-password?token=${passwordSetToken}&type=set`;

    const emailData = {
      name: fname,
      org: paymentIntentId,
      url,
      username: email,
      date: new Date().getFullYear(),
    };
    const renderedEmail = compiledWelcome(emailData);

    try {
      await sendMail(email, "Welcome to SimVPR!", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    res.json({ success: true, payment: savedPayment });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
};
