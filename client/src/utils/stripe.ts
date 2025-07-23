import { loadStripe } from '@stripe/stripe-js';
import env from '../../env';
import { getSettingsAction } from '@/actions/settingAction';

const getStripePublicKey = async() => {
  const settings = await getSettingsAction();
  const keyType = settings?.keyType;
  console.log(keyType,"nnnnnnnnnnnnnnnnnn")
  if (keyType === 'live') {
    return env.STRIPE_PUBLIC_KEY_LIVE || env.STRIPE_PUBLIC_KEY || '';
  }
  return env.STRIPE_PUBLIC_KEY || env.STRIPE_PUBLIC_KEY || '';
};

export const stripePromise = (async () => {
  const stripePublicKey = await getStripePublicKey();
  return loadStripe(stripePublicKey);
})();