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
    const { amount, currency = "gbp", metadata, planType } = req.body;

    if (planType === "Subscription") {
      const { email, name } = metadata;
      if (!email || !name) {
        return res
          .status(400)
          .json({ success: false, error: "Name and email are required." });
      }

      const customer = await stripeService.createCustomer(name, email, metadata.paymentMethod);

      const result = await stripeService.createSubscription(
        customer.id,
        "price_1Rq7ynCo2aH46uX6JWtB3SPZ", 
        metadata
      );
      return res.json({
        success: true,
        clientSecret: result.clientSecret,
        subscriptionId: result.subscriptionId,
        paymentIntentId: result.paymentIntentId,
        customerId: result.customerId,
        isManualPayment: result.isManualPayment,  
      });
    } else {
      // Handle one-time payment (Perpetual License)
      const amountNumber = Number(amount);
      if (!amountNumber || amountNumber <= 0) {
        return res
          .status(400)
          .json({ success: false, error: "Valid positive amount is required" });
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
        requiresSetup: false,
      });
    }
  } catch (error) {
    console.error("Create payment controller error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to create payment",
      });
  }
};

exports.confirmPayment = async (req, res) => {
  let transaction;
  try {
    const {
      paymentIntentId,
      subscriptionId,
      isManualPayment,
      customerId,
      isSubscription,
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

    const requiredFields = {
      paymentIntentId,
      billingName,
      planTitle,
      planDuration,
      fname,
      lname,
      username,
      email,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Organization image is required",
      });
    }

    const paymentIntent = await stripeService.retrievePaymentIntent(
      paymentIntentId
    );
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ success: false /*...*/ });
    }

    if (
      isSubscription === "true" &&
      isManualPayment === "true" &&
      subscriptionId
    ) {
      const invoiceId = paymentIntent.metadata.invoice_id;
      if (!invoiceId) {
        throw new Error(
          "Critical: Manual payment succeeded but invoice_id is missing from metadata."
        );
      }

      try {
        const invoice = await stripeClient.invoices.pay(invoiceId, {
          payment_method: paymentIntent.payment_method,
        });

        const finalSubscription = await stripeService.retrieveSubscription(
          subscriptionId
        );
        if (finalSubscription.status !== "active") {
          console.warn(
            `Subscription ${subscriptionId} is still not active after invoice payment. Status: ${finalSubscription.status}. Manual review may be needed.`
          );
        }
      } catch (invoiceError) {
        return res.status(500).json({
          success: false,
          error:
            "Your payment was processed, but there was a final issue activating your subscription. Please contact support and provide your payment ID.",
        });
      }
    }

    if (
      isSubscription === "true" &&
      subscriptionId &&
      req.body.isManualPayment !== "true"
    ) {
      const subscription = await stripeService.retrieveSubscription(
        subscriptionId
      );
      if (
        subscription.status !== "active" &&
        subscription.status !== "trialing"
      ) {
        return res.status(400).json({
          success: false,
          error: `Subscription not active. Status: ${subscription.status}`,
        });
      }
    }

    transaction = await knex.transaction();

    const existingOrg = await transaction("organisations")
      .where({ org_email: email })
      .first();

    if (existingOrg) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Email already associated with an organization",
      });
    }

    const code = generateCode();
    const thumbnail = await uploadFile(image, "image", code);
    const organisation_id = await generateOrganisationId();

    const [orgId] = await transaction("organisations").insert({
      name: institutionName,
      organisation_id: organisation_id,
      org_email: email,
      organisation_icon: thumbnail.Location,
      organisation_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create the user
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

    const [userId] = await transaction("users")
      .insert(userData)
      .returning("id");

    const paymentRecord = {
      payment_id: paymentIntent.id,
      amount: parseFloat((paymentIntent.amount / 100).toFixed(2)),
      currency: paymentIntent.currency,
      method: paymentIntent.payment_method_types?.[0] || "card",
      userId: userId,
      created_at: new Date(),
    };

    await transaction("payment").insert(paymentRecord);

    const passwordSetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
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
      console.error("Failed to send welcome email:", emailError);
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Payment confirmed and account created successfully",
      userId,
      organisationId: organisation_id,
      subscriptionId: subscriptionId || null,
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

exports.updatePlan = async (req, res) => {
  let transaction;
  try {
    const { paymentIntentId, planTitle, planDuration, email } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment Intent ID is required",
      });
    }

    const requiredFields = {
      planTitle,
      planDuration,
      email,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
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

    transaction = await knex.transaction();

    const paymentRecord = {
      payment_id: paymentIntent.id,
      amount: parseFloat((paymentIntent.amount / 100).toFixed(2)),
      currency: paymentIntent.currency,
      method: paymentIntent.payment_method_types[0],
      created_at: new Date(),
    };

    const userData = {
      uemail: email,
      planType: planTitle,
      updated_at: new Date(),
    };

    const [user] = await transaction("users")
      .where("uemail", email)
      .select("id");

    if (!user) throw new Error("User not found");
    paymentRecord.userId = user.id;

    await transaction("users").update(userData).where("uemail", email);

    await transaction("payment").insert(paymentRecord);

    await transaction.commit();

    res.json({
      success: true,
      message: "Payment confirmed.",
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
