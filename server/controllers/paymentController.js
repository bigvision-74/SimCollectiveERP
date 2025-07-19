const stripeService = require("../services/stripeService");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'gbp', metadata } = req.body;

    // Convert amount to number and validate
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0 || isNaN(amountNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid positive amount is required' 
      });
    }
    
    const paymentIntent = await stripeService.createPaymentIntent(amountNumber, currency, metadata);
    
    res.json({ 
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create payment intent'
    });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const {
      paymentIntentId,
      billingName,
      institutionName,
      planTitle,
      planDuration,
    } = req.body;

    // Fix: Validate required fields
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Payment Intent ID is required",
      });
    }

    if (!billingName || !institutionName || !planTitle || !planDuration) {
      return res.status(400).json({
        success: false,
        error: "All billing details are required",
      });
    }

    const paymentIntent = await stripeService.retrievePaymentIntent(
      paymentIntentId
    );

    console.log("Payment Intent Status:", paymentIntent.status);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // Fix: Create payment record structure
    const paymentRecord = {
      stripe_payment_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      payment_method: paymentIntent.payment_method_types[0],
      billing_name: billingName,
      institution_name: institutionName,
      plan_title: planTitle,
      plan_duration: planDuration,
      created_at: new Date(),
    };

    // TODO: Uncomment and implement when Payment model is ready
    // const savedPayment = await Payment.create(paymentRecord);
    // res.json({ success: true, payment: savedPayment });

    // For now, return success with payment record
    res.json({
      success: true,
      payment: paymentRecord,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
};
