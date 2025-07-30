// services/stripeSubscriptionService.js

const stripe = require('stripe');
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

let stripeClient;

async function initializeStripe() {
  try {
    const data = await knex('settings').first(); 
    const secretKey = data.keyType === 'live' 
      ? process.env.STRIPE_SECRET_KEY_LIVE 
      : process.env.STRIPE_SECRET_KEY;
    
    stripeClient = stripe(secretKey);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }
}

initializeStripe().catch(err => {
  console.error('Stripe initialization error:', err);
});

exports.createAnnualSubscription = async (customerId, priceId, metadata = {}) => {
  try {
    if (!stripeClient) {
      await initializeStripe();
    }

    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: metadata,
      collection_method: 'charge_automatically',
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

exports.cancelSubscription = async (subscriptionId) => {
  try {
    if (!stripeClient) {
      await initializeStripe();
    }

    const canceledSubscription = await stripeClient.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true }
    );

    return canceledSubscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

exports.getSubscription = async (subscriptionId) => {
  try {
    if (!stripeClient) {
      await initializeStripe();
    }

    return await stripeClient.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
};