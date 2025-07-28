const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { createPaymentIntent, confirmPayment } = require("../controllers/paymentController");

router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment',upload.single("image"), confirmPayment);

module.exports = router;
