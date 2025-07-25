const admin = require('firebase-admin');
<<<<<<< HEAD
const serviceAccount = require('./firebaseConfig.json'); 
=======
const serviceAccount = require('./firebaseConfig.json');
>>>>>>> refs/remotes/origin/main
const defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


module.exports = {
  defaultApp,
};
