import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createPaymentIntent = async (amount: number, metadata: Record<string, string>) => {
  return await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata,
  });
};

export const confirmPayment = async (paymentIntentId: string) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};