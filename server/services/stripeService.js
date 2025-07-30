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

    stripeClient = stripe(secretKey);

    const subscription = await stripeClient.subscriptions.retrieve(
      "sub_1RqUTwCo2aH46uX64JkeLnzb",
      {
        expand: ["latest_invoice.payment_intent"],
      }
    );
    // console.log(subscription)
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    throw error;
  }
}

initializeStripe().catch((err) => {
  console.error("Stripe initialization error:", err);
});

exports.createPaymentIntent = async (amount, currency = "gbp", metadata) => {
  try {
    if (!stripeClient) {
      console.log("[Stripe] Initializing Stripe client...");
      await initializeStripe();
    }

    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("Amount must be a valid number");
    }

    const paymentIntentParams = {
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      metadata: metadata,
    };

    const paymentIntent = await stripeClient.paymentIntents.create(
      paymentIntentParams
    );

    return paymentIntent;
  } catch (error) {
    throw error;
  }
};

exports.retrievePaymentIntent = async (paymentIntentId) => {
  try {
    if (!stripeClient) {
      await initializeStripe();
    }
    return await stripeClient.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    throw error;
  }
};

exports.createCustomer = async (name, email, paymentMethod) => {
  if (!stripeClient) await initializeStripe();
  try {
    const existingCustomers = await stripeClient.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    const customer = await stripeClient.customers.create({
      name,
      email,
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    return customer;
  } catch (error) {
    console.error("Stripe service error creating customer:", error);
    throw error;
  }
};

exports.payInvoice = async (invoiceId) => {
  if (!stripeClient) await initializeStripe();
  try {
    const invoice = await stripeClient.invoices.pay(invoiceId, {
      expand: ["payment_intent"],
    });

    return invoice.payment_intent;
  } catch (error) {
    console.error(
      `[Fallback] Error calling invoices.pay() for invoice ${invoiceId}:`,
      error
    );
    throw error;
  }
};

exports.createSubscription = async (customerId, priceId, metadata) => {
  if (!stripeClient) await initializeStripe();
  try {
    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      metadata,
      collection_method: "charge_automatically",
      off_session: true,
      expand: ["latest_invoice.payment_intent"],
    });

    let paymentIntent = subscription.latest_invoice?.payment_intent;

    if (!paymentIntent && subscription.latest_invoice?.status === "open") {
      const invoice = subscription.latest_invoice;

      paymentIntent = await stripeClient.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          subscription_id: subscription.id,
          invoice_id: invoice.id,
          ...metadata,
        },
        setup_future_usage: "on_session",
      });
    }

    if (!paymentIntent) {
      throw new Error(
        "Could not create or retrieve a PaymentIntent for the subscription's invoice."
      );
    }

    const isManualPayment = !subscription.latest_invoice?.payment_intent;

    return {
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      paymentIntentId: paymentIntent.id,
      customerId: customerId,
      isManualPayment: isManualPayment,
    };
  } catch (error) {
    console.error("Stripe service error creating subscription:", error);
    throw error;
  }
};

exports.retrieveSubscription = async (subscriptionId) => {
  if (!stripeClient) await initializeStripe();
  try {
    const subscription = await stripeClient.subscriptions.retrieve(
      subscriptionId,
      {
        expand: ["default_payment_method", "latest_invoice"],
      }
    );
    return subscription;
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    throw error;
  }
};

exports.cancelSubscription = async (subscriptionId) => {
  if (!stripeClient) await initializeStripe();
  try {
    const subscription = await stripeClient.subscriptions.cancel(
      subscriptionId
    );
    return subscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
};

exports.completeSubscriptionPayment = async (
  subscriptionId,
  paymentIntentId
) => {
  if (!stripeClient) await initializeStripe();
  try {
    const paymentIntent = await stripeClient.paymentIntents.retrieve(
      paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment intent not succeeded: ${paymentIntent.status}`);
    }

    const subscription = await stripeClient.subscriptions.retrieve(
      subscriptionId,
      {
        expand: ["latest_invoice"],
      }
    );

    const invoice = subscription.latest_invoice;

    const updatedSubscription = await stripeClient.subscriptions.update(
      subscriptionId,
      {
        default_payment_method: paymentIntent.payment_method,
      }
    );

    const paidInvoice = await stripeClient.invoices.pay(invoice.id, {
      payment_method: paymentIntent.payment_method,
    });

    const finalSubscription = await stripeClient.subscriptions.retrieve(
      subscriptionId
    );

    return {
      subscription: finalSubscription,
      invoice: paidInvoice,
      paymentIntent,
    };
  } catch (error) {
    console.error("Error completing subscription payment:", error);
    throw error;
  }
};

exports.payInvoice = async (invoiceId) => {
  if (!stripeClient) await initializeStripe();
  try {
    const invoice = await stripeClient.invoices.pay(invoiceId, {
      expand: ["payment_intent"],
    });
    return invoice;
  } catch (error) {
    console.error("Error paying invoice:", error);
    throw error;
  }
};

exports.updateSubscription = async (subscriptionId, updates) => {
  if (!stripeClient) await initializeStripe();
  try {
    const subscription = await stripeClient.subscriptions.update(
      subscriptionId,
      updates
    );
    return subscription;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};
