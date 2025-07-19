const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (amount, currency = 'gbp', metadata) => {
  try {
    // Ensure amount is a valid number
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents/pence and ensure integer
      currency: currency.toLowerCase(), // Ensure lowercase currency
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
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    throw error;
  }
};