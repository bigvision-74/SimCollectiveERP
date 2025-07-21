const admin = require('firebase-admin');
const serviceAccount = require('./firebaseConfig.json');
const defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


module.exports = {
  defaultApp,
};
