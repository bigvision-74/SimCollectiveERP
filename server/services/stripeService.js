const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (amount, currency = 'gbp', metadata) => {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }

    const paymentIntent = await stripe.paymentIntents.create({
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
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    throw error;
  }
};