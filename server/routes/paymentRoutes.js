const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");

const { createPaymentIntent, confirmPayment } = require("../controllers/paymentController");

router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment', confirmPayment);

module.exports = router;
