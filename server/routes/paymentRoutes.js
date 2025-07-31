const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { createPaymentIntent, confirmPayment, updatePlan, createSubscription, createCustomer, attachPaymentMethod } = require("../controllers/paymentController");

router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment',upload.single("image"), confirmPayment);
// router.post('/create-subscription', createSubscription);
// router.post('/create-customer', createCustomer); 
router.put('/updatePayment', updatePlan);
// router.post('/attachPaymentMethod', attachPaymentMethod);

module.exports = router;
