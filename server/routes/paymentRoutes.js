const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  createPaymentIntent,
  confirmPayment,
  updatePlan,
  createSubscription,
  createCustomer,
  attachPaymentMethod,
  getSubscriptionStatus,
  upgradeSubscription,
  confirmUpgrade,
} = require("../controllers/paymentController");

router.post("/create-payment-intent", createPaymentIntent);
router.post("/confirm-payment", upload.single("image"), confirmPayment);
router.post("/create-subscription", createSubscription);
router.get("/updated-subscription", getSubscriptionStatus);
// router.put("/updatePayment", updatePlan);
router.post("/confirm-upgrade", confirmUpgrade);
router.post("/upgrade-subscription", upgradeSubscription);

module.exports = router;
