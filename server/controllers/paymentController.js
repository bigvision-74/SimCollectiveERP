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
  let transaction;
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

    // Validate required fields
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment Intent ID is required",
      });
    }

    const requiredFields = {
      billingName,
      planTitle,
      planDuration,
      fname,
      lname,
      username,
      email
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Organization image is required",
      });
    }

    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    transaction = await knex.transaction();

    const existingOrg = await transaction("organisations")
      .where({ org_email: email })
      .first();

    if (existingOrg) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Email already associated with an organization" 
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
    const organisation_id = await generateOrganisationId();


    const [orgId] = await transaction("organisations").insert({
      name: institutionName,
      organisation_id: organisation_id,
      org_email: email,
      organisation_icon: thumbnail.Location,
      organisation_deleted: false,
    });


    const userData = {
      fname: fname,
      lname: lname,
      username: username,
      uemail: email,
      role: "Admin",
      password: 0, 
      organisation_id: orgId,
      planType: planTitle,
      user_unique_id: code,
      created_at: new Date(),
      updated_at: new Date(),
      user_thumbnail: thumbnail.Location,
    };

    const [userId] = await transaction("users").insert(userData).returning("id");
    paymentRecord.userId = userId;

    await transaction("payment").insert(paymentRecord);

    const passwordSetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const url = `${process.env.CLIENT_URL}/reset-password?token=${passwordSetToken}&type=set`;

    const emailData = {
      name: fname,
      org: institutionName,
      url,
      username: email,
      date: new Date().getFullYear(),
    };
    const renderedEmail = compiledWelcome(emailData);

    try {
      await sendMail(email, "Welcome to SimVPR!", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);s
    }

    await transaction.commit();

    res.json({ 
      success: true, 
      message: "Payment confirmed and account created successfully",
      userId,
      organisationId: organisation_id
    });

  } catch (error) {
    console.error("Confirm payment error:", error);
    if (transaction) await transaction.rollback();
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
};
