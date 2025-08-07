const stripeService = require("../services/stripeService");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { uploadFile } = require("../services/S3_Services");
const fs = require("fs");
const ejs = require("ejs");
const welcomeEmail = fs.readFileSync(
  "./EmailTemplates/WelcomeAdmin.ejs",
  "utf8"
);
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
    const { planType, metadata } = req.body;
    console.log(metadata);

    // Validate required fields
    const { email, name, paymentMethod, plan, duration } = metadata;
    if (!email || !name || !paymentMethod || !plan || !duration || !planType) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    const customer = await stripeService.createCustomer(
      name,
      email,
      paymentMethod
    );

    if (planType === "Subscription") {
      const setupIntent = await stripeService.createSetupIntent(customer.id);

      res.json({
        success: true,
        clientSecret: setupIntent.client_secret,
        customerId: customer.id,
      });
    } else if (planType === "Perpetual License") {
      // Parse amount by removing non-numeric characters (e.g., '£', '$')
      const amountStr = metadata.amount
        ? String(metadata.amount).replace(/[^0-9.]/g, "")
        : "0";
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid amount for payment" });
      }

      const paymentIntent = await stripeService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency: metadata.currency || "gbp",
        customer: customer.id,
        payment_method: paymentMethod,
        off_session: false,
        confirm: false,
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId: customer.id,
        amount: amount,
        currency: metadata.currency || "gbp",
        paymentMethod: paymentMethod,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Invalid plan type" });
    }
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const { customerId, paymentMethod, setupIntentId, metadata } = req.body;

    if (!metadata || typeof metadata !== "object") {
      return res
        .status(400)
        .json({ success: false, error: "Metadata must be a valid object" });
    }

    const invalidMetadataFields = Object.entries(metadata)
      .filter(([_, value]) => typeof value !== "string" || !value)
      .map(([key]) => key);
    if (invalidMetadataFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid metadata fields: ${invalidMetadataFields.join(
          ", "
        )} must be non-empty strings`,
      });
    }

    if (setupIntentId) {
      try {
        const setupIntent = await stripeService.retrieveSetupIntent(
          setupIntentId
        );
        if (setupIntent.status !== "succeeded") {
          return res.status(400).json({
            success: false,
            error: `SetupIntent not succeeded. Status: ${setupIntent.status}`,
          });
        }
      } catch (error) {
        console.warn(
          "Failed to validate SetupIntent, proceeding anyway:",
          error.message
        );
      }
    }

    const subscription = await stripeService.createSubscription(
      customerId,
      metadata.planId || process.env.PRICE_ID,
      paymentMethod,
      metadata
    );

    res.json(subscription);
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res
        .status(400)
        .json({ success: false, error: "Subscription ID is required" });
    }

    const subscription = await stripeService.retrieveSubscription(
      subscriptionId
    );
    res.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const {
      subscriptionId,
      paymentId,
      customerId,
      billingName,
      institutionName,
      planTitle,
      planDuration,
      planType,
      fname,
      lname,
      username,
      email,
      country,
      amount,
      currency,
      method,
    } = req.body;
    const image = req.file;

    // Validate required fields
    const requiredFields = {
      billingName,
      planTitle,
      planDuration,
      planType,
      fname,
      lname,
      username,
      email,
      customerId,
      amount,
      currency,
      method,
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

    const amountStr = amount ? String(amount).replace(/[^0-9.]/g, "") : "0";

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Organization image is required",
      });
    }

    if (planType === "Subscription" && !subscriptionId) {
      return res.status(400).json({
        success: false,
        error: "Subscription ID is required for Subscription plan",
      });
    }

    if (planType === "Perpetual License" && !paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID is required for Perpetual License plan",
      });
    }

    if (planType === "Subscription") {
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
    } else {
      const paymentIntent = await stripeService.retrievePaymentIntent(
        paymentId
      );
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          error: `Payment not successful. Status: ${paymentIntent.status}`,
        });
      }
    }

    const existingOrg = await knex("organisations")
      .where({ org_email: email })
      .first();
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: "Email already associated with an organization",
      });
    }

    const code = generateCode();
    const thumbnail = await uploadFile(image, "image", code);
    const organisation_id = await generateOrganisationId();

    const [orgId] = await knex("organisations").insert({
      name: institutionName,
      organisation_id,
      org_email: email,
      organisation_icon: thumbnail.Location,
      organisation_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const userData = {
      fname,
      lname,
      username,
      uemail: email,
      role: "Admin",
      password: 0,
      organisation_id: orgId,
      planType,
      user_unique_id: code,
      created_at: new Date(),
      updated_at: new Date(),
      user_thumbnail: thumbnail.Location,
    };

    const [userId] = await knex("users").insert(userData).returning("id");

    const [paymentRecordId] = await knex("payment").insert({
      payment_id: planType === "Subscription" ? subscriptionId : paymentId,
      amountStr,
      currency,
      method,
      created_at: new Date(),
      updated_at: new Date(),
      userId: String(userId),
    });

    let subscriptionRecordId;
    if (planType === "Subscription") {
      const subscription = await stripeService.retrieveSubscription(
        subscriptionId
      );
      [subscriptionRecordId] = await knex("subscriptions").insert({
        subscription_id: subscriptionId,
        customer_id: customerId,
        status: subscription.status,
        plan_title: planTitle,
        plan_duration: planDuration,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

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
      amount: parseFloat(amountStr),
      paymethod: method,
      institution: institutionName,
      plan: planTitle,
      datee: new Date().toLocaleDateString("en-GB").split("/").join("-"),
    };

    const renderedEmail = compiledWelcome(emailData);

    try {
      await sendMail(email, "Welcome to SimVPR!", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.json({
      success: true,
      message: `${planType} confirmed and account created successfully`,
      userId,
      organisationId: organisation_id,
      subscriptionId: planType === "Subscription" ? subscriptionId : undefined,
      paymentId: planType === "Perpetual License" ? paymentId : undefined,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
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
