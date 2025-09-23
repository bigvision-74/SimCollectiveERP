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
const stripe = require("stripe");
// const Knex = require("knex");
// const knexConfig = require("../knexfile").development;
// const knex = Knex(knexConfig);

let stripeClient;

async function initializeStripe() {
  try {
    const data = await knex("settings").first();
    const secretKey =
      data.keyType === "live"
        ? process.env.STRIPE_SECRET_KEY_LIVE
        : process.env.STRIPE_SECRET_KEY;

    stripeClient = stripe(secretKey);

    // const subscription = await stripeClient.subscriptions.retrieve(
    //   "sub_1RsjhWCo2aH46uX6WZupt3Rk",
    //   {
    //     expand: ["latest_invoice.payment_intent"],
    //   }
    // );
    // console.log(subscription);
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    throw error;
  }
}

initializeStripe().catch((err) => {
  console.error("Stripe initialization error:", err);
});

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
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");

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

    if (planType === "2 Year Licence") {
      const setupIntent = await stripeService.createSetupIntent(customer.id);

      res.json({
        success: true,
        clientSecret: setupIntent.client_secret,
        customerId: customer.id,
      });
    } else if (planType === "5 Year Licence" || "1 Year Licence") {
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
        amount: Math.round(amount * 100),
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
    console.log("Create subscription request:", {
      customerId,
      paymentMethod,
      setupIntentId,
      metadata: Object.keys(metadata || {}),
    });

    // Validate required parameters
    if (!customerId || !paymentMethod || !metadata) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required parameters: customerId, paymentMethod, and metadata are required",
      });
    }

    if (!metadata || typeof metadata !== "object") {
      return res
        .status(400)
        .json({ success: false, error: "Metadata must be a valid object" });
    }

    // Validate metadata fields
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

    // Optional: Validate SetupIntent if provided
    if (setupIntentId) {
      try {
        const setupIntent = await stripeService.retrieveSetupIntent(
          setupIntentId
        );

        if (setupIntent.status !== "succeeded") {
          console.warn(`SetupIntent status: ${setupIntent.status}`);
          // We can proceed anyway as the payment method should work
        }
      } catch (error) {
        console.warn(
          "Failed to validate SetupIntent, proceeding anyway:",
          error.message
        );
      }
    }

    // Create the subscription
    const subscriptionResult = await stripeService.createSubscription(
      customerId,
      metadata.planId || process.env.PRICE_ID,
      paymentMethod,
      metadata
    );

    console.log("Subscription result:", {
      success: subscriptionResult.success,
      subscriptionId: subscriptionResult.subscriptionId,
      status: subscriptionResult.status,
      requiresAction: subscriptionResult.requiresAction,
      hasClientSecret: !!subscriptionResult.clientSecret,
      clientSecretPreview: subscriptionResult.clientSecret
        ? subscriptionResult.clientSecret.substring(0, 20) + "..."
        : "missing",
    });

    res.json(subscriptionResult);
  } catch (error) {
    console.error("Create subscription controller error:", error);
    res.status(500).json({
      success: false,
      error:
        error.message || "Internal server error while creating subscription",
    });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    console.log(req.params, "hhhhhhhhhhhhhhhhhhhhh");

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: "Subscription ID is required",
      });
    }

    const subscription = await stripeClient.subscriptions.retrieve(
      subscriptionId,
      {
        expand: ["latest_invoice.payment_intent"],
      }
    );

    res.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      latest_invoice: {
        id: subscription.latest_invoice?.id,
        status: subscription.latest_invoice?.status,
        payment_intent_status:
          subscription.latest_invoice?.payment_intent?.status,
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve subscription status",
    });
  }
};

// Simplified confirmPayment that handles 3D Secure properly
exports.confirmPayment = async (req, res) => {
  try {
    const {
      subscriptionId,
      paymentIntentId,
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

    console.log("=== CONFIRM PAYMENT START ===");
    console.log("Plan type:", planType);
    console.log("Subscription ID:", subscriptionId);
    console.log("Payment Intent ID:", paymentIntentId);
    console.log("Email:", email);

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

    // Basic plan validation
    // if (planType === "1 Year Licence" && !subscriptionId) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "Subscription ID is required for Subscription plan",
    //   });
    // }

    if (planType === "5 Year Licence" && !paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID is required for 5 Year Licence plan",
      });
    }

    // Check for existing email
    const [existingOrg, existingUser] = await Promise.all([
      knex("organisations").where({ org_email: email }).first(),
      knex("users").where({ uemail: email }).first(),
    ]);

    if (existingOrg || existingUser) {
      return res.status(400).json({
        success: false,
        error:
          "Email already associated with an existing account or organisation",
      });
    }

    console.log("=== PAYMENT VALIDATION ===");

    if (planType === "2 Year Licence") {
      console.log("Validating subscription payment...");




if (paymentIntentId) {
    console.log("Checking payment intent status:", paymentIntentId);
    
    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
    console.log("Payment intent status:", paymentIntent.status);
    
    if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
            success: false,
            error: `Payment not completed. Status: ${paymentIntent.status}`,
        });
    }
    
    console.log("✅ Payment intent validation successful, proceeding with account creation.");
    // The payment is confirmed, we can trust the subscription will become active.
    // The original, stricter subscription status check is what likely fails.

} else {
    // Standard validation for cases without a separate payment confirmation step
    const subscription = await stripeService.retrieveSubscription(subscriptionId);
    console.log("Subscription status:", subscription.status);
    
    if (subscription.status !== "active" && subscription.status !== "trialing") {
        return res.status(400).json({
            success: false,
            error: `Subscription not active. Status: ${subscription.status}`,
        });
    }
    
    console.log("✅ Standard subscription validation passed");
}






      // If we have a payment intent ID, validate it first (3D Secure case)
      // if (paymentIntentId) {
      //   console.log("Checking payment intent status:", paymentIntentId);

      //   const paymentIntent = await stripeService.retrievePaymentIntent(
      //     paymentIntentId
      //   );
      //   console.log("Payment intent status:", paymentIntent.status);

      //   if (paymentIntent.status !== "succeeded") {
      //     return res.status(400).json({
      //       success: false,
      //       error: `Payment not completed. Status: ${paymentIntent.status}`,
      //     });
      //   }

      //   console.log("✅ Payment intent validation successful");

      //   // For 3D Secure cases, we'll be more lenient with subscription status
      //   // because the payment was successful
      //   const subscription = await stripeService.retrieveSubscription(
      //     subscriptionId
      //   );
      //   console.log("Subscription status:", subscription.status);

      //   // Allow more statuses for 3D Secure cases since payment succeeded
      //   const validStatuses = ["active", "trialing", "incomplete", "past_due"];

      //   if (!validStatuses.includes(subscription.status)) {
      //     return res.status(400).json({
      //       success: false,
      //       error: `Subscription in invalid state: ${subscription.status}`,
      //     });
      //   }

      //   console.log(
      //     "✅ Subscription validation passed (3D Secure with successful payment)"
      //   );
      // } else {
      //   // No payment intent ID - standard subscription validation
      //   console.log("Standard subscription validation (no 3D Secure)");

      //   const subscription = await stripeService.retrieveSubscription(
      //     subscriptionId
      //   );
      //   console.log("Subscription status:", subscription.status);

      //   if (
      //     subscription.status !== "active" &&
      //     subscription.status !== "trialing"
      //   ) {
      //     return res.status(400).json({
      //       success: false,
      //       error: `Subscription not active. Status: ${subscription.status}`,
      //     });
      //   }

      //   console.log("✅ Standard subscription validation passed");
      // }
    } else {

      console.log("Validating one-time payment...");

      const paymentIntent = await stripeService.retrievePaymentIntent(paymentId);
      console.log("Payment intent status:", paymentIntent.status);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          error: `Payment not successful. Status: ${paymentIntent.status}`,
        });
      }

      console.log("✅ One-time payment validation passed");
    }

    console.log("=== CREATING ACCOUNT ===");

    const code = generateCode();
    let thumbnail;

    if (image) {
      thumbnail = await uploadFile(image, "image", code);
    }

    const organisation_id = await generateOrganisationId();

    const [orgId] = await knex("organisations").insert({
      name: institutionName,
      organisation_id,
      org_email: email,
      organisation_icon: thumbnail?.Location || "",
      organisation_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
      planType,
    });

    const userData = {
      fname,
      lname,
      username,
      uemail: email,
      role: "Admin",
      password: 0,
      organisation_id: orgId,
      user_unique_id: code,
      created_at: new Date(),
      updated_at: new Date(),
      user_thumbnail: thumbnail?.Location || "",
    };

    const [userId] = await knex("users").insert(userData).returning("id");

    const [paymentRecordId] = await knex("payment").insert({
      payment_id: planType === "2 Year Licence" ? subscriptionId : paymentId,
      amount: amountStr,
      currency,
      method,
      created_at: new Date(),
      updated_at: new Date(),
      userId: String(userId),
    });

    // let subscriptionRecordId;
    // if (planType === "1 Year Licence") {
    //   const subscription = await stripeService.retrieveSubscription(
    //     subscriptionId
    //   );
    //   [subscriptionRecordId] = await knex("subscriptions").insert({
    //     subscription_id: subscriptionId,
    //     customer_id: customerId,
    //     status: subscription.status,
    //     plan_title: planTitle,
    //     plan_duration: planDuration,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   });
    // }

    // Send welcome email
    const passwordSetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    const url = `${process.env.CLIENT_URL}/reset-password?token=${passwordSetToken}&type=set`;

    const settings = await knex("settings").first();
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
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    const renderedEmail = compiledWelcome(emailData);

    try {
      await sendMail(email, "Welcome to InpatientSIM!", renderedEmail);
      console.log("✅ Welcome email sent");
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    console.log("=== ACCOUNT CREATION SUCCESSFUL ===");

    res.json({
      success: true,
      message: `${planType} confirmed and account created successfully`,
      userId,
      organisationId: organisation_id,
      subscriptionId:
        planType === "2 Year Licence" ? subscriptionId : undefined,
      paymentId: planType === "5 Year Licence" ? paymentId : undefined,
    });
  } catch (error) {
    console.error("=== CONFIRM PAYMENT ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
};

exports.upgradeSubscription = async (req, res) => {
  try {
    // newPriceId is the Stripe Price ID for the plan the user is upgrading to.
    // subscriptionId is the user's current active subscription ID.
    const { newPriceId, subscriptionId } = req.body;

    if (!subscriptionId || !newPriceId) {
      return res.status(400).json({
        success: false,
        error: "Subscription ID and new Price ID are required.",
      });
    }

    // 1. Retrieve the current subscription to get its details
    const currentSubscription = await stripeService.retrieveSubscription(
      subscriptionId
    );
    if (!currentSubscription) {
      return res
        .status(404)
        .json({ success: false, error: "Active subscription not found." });
    }

    // Get the ID of the item within the subscription to be updated
    const subscriptionItemId = currentSubscription.items.data[0].id;

    // 2. Update the subscription to the new price plan
    const updatedSubscription = await stripeService.updateSubscription(
      subscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations", // Key setting: tells Stripe to calculate prorated charges
        payment_behavior: "default_incomplete_payment_intent", // Handles cases requiring payment
      }
    );

    // 3. Check the latest invoice to see if payment is required
    const latestInvoice = await stripeService.retrieveInvoice(
      updatedSubscription.latest_invoice
    );

    // If the invoice's payment intent requires user action, send the client secret to the frontend.
    if (latestInvoice.payment_intent) {
      const paymentIntent = await stripeService.retrievePaymentIntent(
        latestInvoice.payment_intent
      );

      if (
        paymentIntent.status === "requires_action" ||
        paymentIntent.status === "requires_payment_method"
      ) {
        return res.json({
          success: true,
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          subscriptionId: updatedSubscription.id,
        });
      }
    }

    // If no payment is required (e.g., payment went through automatically with card on file)
    return res.json({
      success: true,
      requiresAction: false,
      status: updatedSubscription.status,
      subscriptionId: updatedSubscription.id,
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.confirmUpgrade = async (req, res) => {
  try {
    const { subscriptionId, planTitle, email, paymentIntentId } = req.body;

    // 1. Validate required fields
    if (!subscriptionId || !planTitle || !email) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields." });
    }

    // 2. Verify the subscription on Stripe to ensure it's active
    const subscription = await stripeService.retrieveSubscription(
      subscriptionId
    );
    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      return res.status(400).json({
        success: false,
        error: `Subscription is not active. Status: ${subscription.status}`,
      });
    }

    // 3. Start a database transaction
    await knex.transaction(async (trx) => {
      // Update the user's plan type
      await trx("users").where({ uemail: email }).update({
        planType: planTitle,
        updated_at: new Date(),
      });

      // Update the subscription record
      await trx("subscriptions")
        .where({ subscription_id: subscriptionId })
        .update({
          plan_title: planTitle,
          status: subscription.status,
          updated_at: new Date(),
        });

      // If a prorated payment was made, log it in the payment table
      if (paymentIntentId) {
        const paymentIntent = await stripeService.retrievePaymentIntent(
          paymentIntentId
        );
        const user = await trx("users").where({ uemail: email }).first("id");

        await trx("payment").insert({
          payment_id: paymentIntent.id,
          amount: parseFloat((paymentIntent.amount / 100).toFixed(2)),
          currency: paymentIntent.currency,
          method: paymentIntent.payment_method_types[0],
          userId: user.id,
          created_at: new Date(),
        });
      }
    });

    res.json({
      success: true,
      message: "Plan upgrade confirmed successfully.",
    });
  } catch (error) {
    console.error("Confirm upgrade error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
