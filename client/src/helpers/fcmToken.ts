import { messaging } from "../../firebaseConfig"; // adjust path
import { getToken } from "firebase/messaging";

const VAPID_KEY =
  "BH74260Md6psQJDaDEoBOhDynZginbFMNCJOQxAAwh4lVxgOKvvtQO9hqsthCh4UFYS_0p1KgBA64Fk1P6X5ZVI";

export async function getFcmToken() {
  // 1. Check browser support
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // 2. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // 3. Register service worker
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    );
    await navigator.serviceWorker.ready;

    // 4. Get FCM token with retry logic
    try {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (!token) {
        console.warn('No token received');
        return null;
      }
      
      console.log('FCM Token:', token);
      return token;
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      // Retry once after delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
    }
  } catch (error) {
    console.error('FCM Error:', error);
    return null;
  }
}