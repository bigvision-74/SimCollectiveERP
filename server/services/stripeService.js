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

    await stripeClient.paymentMethods.attach(paymentMethod, { customer: customerId });
    await stripeClient.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethod },
    });

    console.log("Creating subscription with alternative approach for SCA handling...");

    // ALTERNATIVE APPROACH: Create subscription with expand from the start
    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId || process.env.PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: sanitizedMetadata,
      expand: ['latest_invoice.payment_intent'], // Expand from creation
    });

    console.log("Subscription created:", { 
      id: subscription.id, 
      status: subscription.status,
      hasLatestInvoice: !!subscription.latest_invoice,
      invoiceStatus: subscription.latest_invoice?.status,
      hasPaymentIntent: !!(subscription.latest_invoice?.payment_intent)
    });

    // Handle different subscription statuses
    switch (subscription.status) {
      case 'active':
      case 'trialing':
        console.log("Subscription is already active/trialing");
        return {
          success: true,
          subscriptionId: subscription.id,
          customerId,
          status: subscription.status,
          requiresAction: false,
          clientSecret: null
        };

      case 'incomplete':
        console.log("Subscription is incomplete, checking payment intent...");
        
        // Check if we have the payment intent from the expanded response
        if (subscription.latest_invoice?.payment_intent) {
          const paymentIntent = subscription.latest_invoice.payment_intent;
          console.log("Payment Intent found from subscription creation:", {
            id: paymentIntent.id,
            status: paymentIntent.status,
            hasClientSecret: !!paymentIntent.client_secret
          });
          
          return handlePaymentIntentStatus(paymentIntent, subscription, customerId);
        }

        // If no payment intent in the expanded response, try the invoice pay approach
        const invoiceId = subscription.latest_invoice?.id || subscription.latest_invoice;
        
        if (!invoiceId) {
          console.error("No invoice found for incomplete subscription");
          return {
            success: false,
            error: "Subscription created but no invoice found",
            subscriptionId: subscription.id
          };
        }

        console.log(`Trying to pay invoice: ${invoiceId}`);
        
        try {
          // Attempt to pay the invoice
          const paidInvoice = await stripeClient.invoices.pay(invoiceId, {
            expand: ["payment_intent"]
          });

          console.log("Invoice paid successfully without SCA");
          return {
            success: true,
            subscriptionId: subscription.id,
            customerId,
            status: 'active',
            requiresAction: false,
            clientSecret: null,
            paymentIntentId: paidInvoice.payment_intent?.id
          };

        } catch (payError) {
          console.log("Invoice payment failed, analyzing error...");
          
          if (payError.code === 'invoice_payment_intent_requires_action') {
            console.log("SCA required, implementing comprehensive retrieval...");
            
            // Wait a moment for Stripe to process
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try multiple approaches with retries
            const paymentIntent = await findPaymentIntentWithRetry(
              subscription.id, 
              invoiceId, 
              customerId
            );
            
            if (paymentIntent) {
              return handlePaymentIntentStatus(paymentIntent, subscription, customerId);
            } else {
              // Last resort: Create a new payment intent manually
              console.log("Creating manual payment intent as last resort...");
              return await createManualPaymentIntent(subscription, customerId, paymentMethod);
            }
          } else {
            console.error("Unexpected error paying invoice:", payError);
            throw payError;
          }
        }
        break;

      case 'incomplete_expired':
        return {
          success: false,
          error: "Subscription creation expired. Please try again.",
          subscriptionId: subscription.id
        };

      default:
        console.warn(`Unexpected subscription status: ${subscription.status}`);
        return {
          success: false,
          error: `Unexpected subscription status: ${subscription.status}`,
          subscriptionId: subscription.id
        };
    }

  } catch (error) {
    console.error("Error in createSubscription flow:", error);
    return { 
      success: false, 
      error: error.message || "Failed to create subscription.",
      details: error.code || 'unknown_error'
    };
  }
};

// Enhanced function to find payment intent with multiple retries and strategies
async function findPaymentIntentWithRetry(subscriptionId, invoiceId, customerId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Payment Intent retrieval attempt ${attempt}/${maxRetries}`);
    
    try {
      // Strategy 1: Get subscription with expansion
      console.log("Attempting: Subscription with expanded payment intent");
      const subscription = await stripeClient.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent']
      });
      
      if (subscription.latest_invoice?.payment_intent?.client_secret) {
        console.log("Found via subscription expansion");
        return subscription.latest_invoice.payment_intent;
      }

      // Strategy 2: Get invoice directly
      console.log("Attempting: Direct invoice retrieval");
      const invoice = await stripeClient.invoices.retrieve(invoiceId, {
        expand: ['payment_intent']
      });
      
      if (invoice.payment_intent?.client_secret) {
        console.log("Found via invoice expansion");
        return invoice.payment_intent;
      }

      // Strategy 3: List recent payment intents for customer
      console.log("Attempting: Customer payment intents list");
      const paymentIntents = await stripeClient.paymentIntents.list({
        customer: customerId,
        limit: 20,
        created: { gte: Math.floor(Date.now() / 1000) - 300 } // Last 5 minutes
      });

      const matchingPI = paymentIntents.data.find(pi => 
        (pi.invoice === invoiceId || 
         pi.metadata?.subscription_id === subscriptionId) &&
        ['requires_action', 'requires_source_action', 'requires_confirmation'].includes(pi.status)
      );

      if (matchingPI?.client_secret) {
        console.log("Found via payment intents list");
        return matchingPI;
      }

      // Strategy 4: Check if there's a setup intent we can use
      console.log("Attempting: Setup intent conversion");
      const setupIntents = await stripeClient.setupIntents.list({
        customer: customerId,
        limit: 10
      });

      const recentSetupIntent = setupIntents.data.find(si => 
        si.status === 'succeeded' && 
        si.created > (Date.now() / 1000) - 600 // Last 10 minutes
      );

      if (recentSetupIntent) {
        console.log("Found recent setup intent, creating payment intent from it");
        // Create a payment intent using the setup intent's payment method
        return await createPaymentIntentFromSetupIntent(recentSetupIntent, invoiceId, customerId);
      }

    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return null;
}

// Create payment intent from setup intent
async function createPaymentIntentFromSetupIntent(setupIntent, invoiceId, customerId) {
  try {
    const invoice = await stripeClient.invoices.retrieve(invoiceId);
    
    // First try with automatic payment methods (no confirmation_method)
    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: customerId,
        payment_method: setupIntent.payment_method,
        confirm: true,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          invoice_id: invoiceId,
          created_from_setup_intent: setupIntent.id
        }
      });
      return paymentIntent;
    } catch (autoError) {
      console.log("Automatic payment methods failed, trying manual confirmation:", autoError.message);
      
      // Fallback to manual confirmation without automatic_payment_methods
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: customerId,
        payment_method: setupIntent.payment_method,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
        metadata: {
          invoice_id: invoiceId,
          created_from_setup_intent: setupIntent.id
        }
      });
      return paymentIntent;
    }

  } catch (error) {
    console.error("Failed to create payment intent from setup intent:", error);
    return null;
  }
}

// Last resort: Create a manual payment intent
async function createManualPaymentIntent(subscription, customerId, paymentMethod) {
  try {
    console.log("Creating manual payment intent for subscription");
    
    // Get the invoice to know how much to charge
    const invoiceId = subscription.latest_invoice?.id || subscription.latest_invoice;
    const invoice = await stripeClient.invoices.retrieve(invoiceId);
    
    if (invoice.amount_due <= 0) {
      console.log("Invoice has no amount due, marking as successful");
      return {
        success: true,
        subscriptionId: subscription.id,
        customerId,
        status: 'active',
        requiresAction: false
      };
    }

    // First try with automatic payment methods (no confirmation_method)
    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: customerId,
        payment_method: paymentMethod,
        confirm: true,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          subscription_id: subscription.id,
          invoice_id: invoiceId,
          manual_creation: 'true'
        }
      });

      console.log("Manual payment intent created with automatic methods:", {
        id: paymentIntent.id,
        status: paymentIntent.status
      });

      return handlePaymentIntentStatus(paymentIntent, subscription, customerId);

    } catch (autoError) {
      console.log("Automatic payment methods failed, trying manual confirmation:", autoError.message);
      
      // Fallback to manual confirmation without automatic_payment_methods
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: customerId,
        payment_method: paymentMethod,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
        metadata: {
          subscription_id: subscription.id,
          invoice_id: invoiceId,
          manual_creation: 'true'
        }
      });

      console.log("Manual payment intent created with manual confirmation:", {
        id: paymentIntent.id,
        status: paymentIntent.status
      });

      return handlePaymentIntentStatus(paymentIntent, subscription, customerId);
    }

  } catch (error) {
    console.error("Failed to create manual payment intent:", error);
    return {
      success: false,
      error: "Could not process payment. Please try again or use a different payment method.",
      subscriptionId: subscription.id,
      requiresRetry: true
    };
  }
}

// Enhanced helper function
function handlePaymentIntentStatus(paymentIntent, subscription, customerId) {
    console.log("Processing payment intent:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      hasClientSecret: !!paymentIntent.client_secret,
      amount: paymentIntent.amount
    });
    
    const baseResponse = {
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status,
      paymentMethod: "card",
      paymentIntentId: paymentIntent.id
    };

    switch (paymentIntent.status) {
      case "succeeded":
        return {
          success: true,
          ...baseResponse,
          status: 'active',
          clientSecret: null,
          requiresAction: false
        };
        
      case "requires_action":
      case "requires_source_action":
      case "requires_confirmation":
        if (!paymentIntent.client_secret) {
          console.error("Payment Intent requires action but has no client_secret");
          return {
            success: false,
            error: "Payment requires authentication but authentication details are missing",
            subscriptionId: subscription.id
          };
        }
        
        console.log("3D Secure authentication required");
        return {
          success: true,
          ...baseResponse,
          clientSecret: paymentIntent.client_secret,
          requiresAction: true
        };
        
      case "requires_payment_method":
        return {
          success: false,
          error: "Payment method was declined. Please try a different payment method.",
          subscriptionId: subscription.id,
          requiresNewPaymentMethod: true
        };
        
      case "processing":
        return {
          success: true,
          ...baseResponse,
          status: 'incomplete',
          clientSecret: paymentIntent.client_secret,
          requiresAction: false,
          processing: true,
          message: "Payment is being processed. Please wait..."
        };
        
      case "canceled":
        return {
          success: false,
          error: "Payment was canceled. Please try again.",
          subscriptionId: subscription.id
        };
        
      default:
        console.warn(`Unexpected payment intent status: ${paymentIntent.status}`);
        return {
          success: false,
          error: `Payment failed with status: ${paymentIntent.status}`,
          subscriptionId: subscription.id,
          paymentIntentStatus: paymentIntent.status
        };
    }
}

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

exports.createPaymentIntent = async ({
  amount,
  currency,
  customer,
  payment_method,
  off_session,
  confirm,
}) => {
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
};

exports.retrievePaymentIntent = async (paymentIntentId) => {
  try {
    if (!stripeClient) await initializeStripe();
    const paymentIntent = await stripeClient.paymentIntents.retrieve(
      paymentIntentId
    );
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
};
