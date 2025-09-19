const stripe = require("stripe");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

let stripeClient;

async function initializeStripe() {
  try {
    const data = await knex("settings").first();
    const secretKey =
      data.keyType === "live"
        ? process.env.STRIPE_SECRET_KEY_LIVE
        : process.env.STRIPE_SECRET_KEY;
console.log(secretKey, "secretKeysecretKey");
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

exports.createCustomer = async (name, email, paymentMethod) => {
  try {
    if (!stripeClient) await initializeStripe();
    const existingCustomers = await stripeClient.customers.list({
      email,
      limit: 1,
    });
    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      if (paymentMethod) {
        await stripeClient.paymentMethods.attach(paymentMethod, {
          customer: customer.id,
        });
        await stripeClient.customers.update(customer.id, {
          invoice_settings: { default_payment_method: paymentMethod },
        });
      }
      return customer;
    }

    return await stripeClient.customers.create({
      name,
      email,
      payment_method: paymentMethod,
      invoice_settings: { default_payment_method: paymentMethod },
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

exports.createSetupIntent = async (customerId) => {
  if (!stripeClient) await initializeStripe();
  try {
    return await stripeClient.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });
  } catch (error) {
    console.error("Error creating SetupIntent:", error);
    throw error;
  }
};

exports.createSubscription = async (
  customerId,
  priceId,
  paymentMethod,
  metadata
) => {
  try {
    if (!stripeClient) await initializeStripe();
    const sanitizedMetadata = {};
    for (const [key, value] of Object.entries(metadata || {})) {
      sanitizedMetadata[key] = String(value || "");
    }
    await stripeClient.paymentMethods.attach(paymentMethod, {
      customer: customerId,
    });
    await stripeClient.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethod },
    });

    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId || process.env.PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: sanitizedMetadata,
      expand: ["latest_invoice"],
    });

    if (subscription.status === "incomplete" && subscription.latest_invoice) {
      const invoice = subscription.latest_invoice;

      const paidInvoice = await stripeClient.invoices.pay(invoice.id, {
        expand: ["payment_intent"],
      });

      if (paidInvoice.status === "paid") {
        return {
          success: true,
          subscriptionId: subscription.id,
          customerId,
          status: "active",
          clientSecret: null,
          paymentIntentId: paidInvoice.payment_intent
            ? paidInvoice.payment_intent.id
            : null,
          requiresAction: false,
        };
      }

      if (
        paidInvoice.payment_intent &&
        paidInvoice.payment_intent.status === "requires_action"
      ) {
        const paymentIntent = paidInvoice.payment_intent;
        return {
          success: true,
          subscriptionId: subscription.id,
          customerId,
          status: "incomplete",
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          requiresAction: true,
        };
      }

      throw new Error(`Unhandled invoice status: ${paidInvoice.status}`);
    }

    return {
      success: true,
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status,
      clientSecret: null,
      paymentIntentId: null,
      requiresAction: false,
    };
  } catch (error) {
    console.error("ERROR in createSubscription", error);
    return { success: false, error: error.message };
  }
};

exports.retrieveSetupIntent = async (setupIntentId) => {
  try {
    if (!stripeClient) await initializeStripe();
    return await stripeClient.setupIntents.retrieve(setupIntentId);
  } catch (error) {
    console.error("Error retrieving SetupIntent:", error);
    throw error;
  }
};

exports.retrieveSubscription = async (subscriptionId) => {
  try {
    if (!stripeClient) await initializeStripe();
    return await stripeClient.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method", "latest_invoice"],
    });
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    throw error;
  }
};

exports.handleWebhook = async (req, res) => {
  if (!stripeClient) await initializeStripe();
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).json({ success: false, error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "invoice.paid":
        const invoice = event.data.object;
        await knex("subscriptions")
          .insert({
            subscription_id: invoice.subscription,
            customer_id: invoice.customer,
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
          })
          .onConflict("subscription_id")
          .merge({ status: "active", updated_at: new Date() });
        break;
      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        await knex("subscriptions")
          .where({ subscription_id: failedInvoice.subscription })
          .update({ status: "past_due", updated_at: new Date() });
        break;
      case "customer.subscription.updated":
        const subscription = event.data.object;
        await knex("subscriptions")
          .where({ subscription_id: subscription.id })
          .update({ status: subscription.status, updated_at: new Date() });
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res
      .status(500)
      .json({ success: false, error: "Webhook processing failed" });
  }
};


exports.createPaymentIntent = async ({ amount, currency, customer, payment_method, off_session, confirm }) => {
    try {
      if (!stripeClient) await initializeStripe();
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: customer,
        payment_method: payment_method,
        off_session: off_session,
        confirm: confirm,
        payment_method_types: ["card"],
      });
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }


  exports.retrievePaymentIntent = async(paymentIntentId) => {
    try {
      if (!stripeClient) await initializeStripe();
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }
