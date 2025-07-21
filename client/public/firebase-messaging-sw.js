// /public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

// Initialize Firebase (same config as your firebaseConfig.js)
const firebaseConfig = {
  apiKey: "AIzaSyCiah84a7VS84hiTCxQMhdgwsU5-PoyBxY",
  authDomain: "er-p-d1b00.firebaseapp.com",
  projectId: "er-p-d1b00",
  storageBucket: "er-p-d1b00.firebasestorage.app",
  messagingSenderId: "767022427421",
  appId: "1:767022427421:web:a54be22b659c8101ebc5f4",
  measurementId: "G-9MXR9X6FP0",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message', payload);
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.ico'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
