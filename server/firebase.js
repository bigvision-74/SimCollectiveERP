const admin = require('firebase-admin');
const serviceAccount = require('./firebaseConfig.json'); 
const serviceAccount2 = require('./serviceAccountKey.json');

const defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Secondary app
const secondaryApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount2),
  },
  'secondary'
);

module.exports = {
  defaultApp,
  secondaryApp,
};
