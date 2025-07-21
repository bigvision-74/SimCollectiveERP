import { loadStripe } from '@stripe/stripe-js';
import env from '../../env'

const stripePublicKey = env.STRIPE_PUBLIC_KEY || '';


export const stripePromise = loadStripe(stripePublicKey);