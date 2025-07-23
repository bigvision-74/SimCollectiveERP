const stripe = require('stripe');
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

let stripeClient;

async function initializeStripe() {
  try {
    const data = await knex('settings').first(); 
    console.log(data,"nnnnnnnnn")
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

exports.createPaymentIntent = async (amount, currency = 'gbp', metadata) => {
  try {
    if (!stripeClient) {
      await initializeStripe();
    }

    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount), 
      currency: currency.toLowerCase(),
      metadata: metadata
    });
    return paymentIntent;
  } catch (error) {
    console.error('Stripe service error:', error);
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