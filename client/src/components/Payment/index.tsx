import React, { useState } from "react";
import { FormLabel } from "@/components/Base/Form";
import { useTranslation } from "react-i18next";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Button from "@/components/Base/Button";
import {
  createPaymentAction,
  confirmPaymentAction,
} from "@/actions/paymentAction";

interface PlanDetails {
  title: string;
  price: string;
  duration: string;
}

interface FormData {
  institutionName: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  country: string;
  gdprConsent: boolean;
  image: File | null;
}

interface PaymentInformationProps {
  plan: PlanDetails;
  formData: FormData;
  onSubmit: (paymentId: string) => void;
}

interface PaymentActionResponse {
  success: boolean;
  error?: string;
  clientSecret?: string;
  paymentIntentId?: string;
  payment?: any;
}

const PaymentInformation: React.FC<PaymentInformationProps> = ({
  plan,
  formData,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const stripe = useStripe();
  const elements = useElements();

  const handleChange = (field: keyof typeof cardComplete) => (event: any) => {
    if (error && event.complete) {
      setError(null);
    }

    setCardComplete({
      ...cardComplete,
      [field]: event.complete,
    });

    if (event.error) {
      setError(event.error.message);
    }
  };


const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();

  // Validate Stripe initialization
  if (!stripe || !elements) {
    setError("Stripe has not been properly initialized");
    return;
  }

  // Validate card completion
  if (!cardComplete.cardNumber || !cardComplete.cardExpiry || !cardComplete.cardCvc) {
    setError("Please fill in all card details correctly");
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    // Process price
    const priceString = plan.price.replace(/[^0-9.-]+/g, "");
    const priceNumber = Number(priceString);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      throw new Error("Invalid price format");
    }

    // Create payment intent
    const amountInPence = Math.round(priceNumber * 100);
    const paymentResponse: PaymentActionResponse = await createPaymentAction({
      amount: amountInPence,
      currency: "gbp",
      metadata: {
        institutionName: formData.institutionName,
        customerName: `${formData.firstName} ${formData.lastName}`,
        plan: plan.title,
        duration: plan.duration,
      },
    });

    if (!paymentResponse.success || !paymentResponse.clientSecret) {
      throw new Error(paymentResponse.error || "Failed to create payment");
    }

    // Confirm card payment
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      throw new Error("Card number element not found");
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      paymentResponse.clientSecret,
      {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            address: {
              country: "GB",
            },
          },
        },
      }
    );

    if (stripeError) {
      throw new Error(stripeError.message || "Payment failed");
    }

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      throw new Error(
        paymentIntent 
          ? `Payment not completed. Status: ${paymentIntent.status}`
          : "Payment intent is null"
      );
    }

    // Create FormData for confirmation
    const formDataToSend = new FormData();
    formDataToSend.append("paymentIntentId", paymentIntent.id);
    formDataToSend.append("billingName", `${formData.firstName} ${formData.lastName}`);
    formDataToSend.append("institutionName", formData.institutionName);
    formDataToSend.append("planTitle", plan.title);
    formDataToSend.append("planDuration", plan.duration);
    formDataToSend.append("fname", formData.firstName);
    formDataToSend.append("lname", formData.lastName);
    formDataToSend.append("username", formData.username);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("country", formData.country);
    
    // Only append image if it exists
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    // Send confirmation with FormData
    const confirmationResponse = await confirmPaymentAction(formDataToSend);

    if (!confirmationResponse.success) {
      throw new Error(confirmationResponse.error || "Payment confirmation failed");
    }

    // Success
    setIsSubmitting(false);
    onSubmit(paymentIntent.id);
    
  } catch (err: any) {
    console.error("Payment error:", err);
    setError(err.message || "An error occurred during payment");
    setIsSubmitting(false);
  }
};

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        "::placeholder": {
          color: "#aab7c4",
        },
        iconColor: "#424770",
      },
      invalid: {
        color: "#e53e3e",
        iconColor: "#e53e3e",
      },
      complete: {
        color: "#28a745",
        iconColor: "#28a745",
      },
    },
    hidePostalCode: true,
  };

  const isFormReady =
    stripe &&
    elements &&
    cardComplete.cardNumber &&
    cardComplete.cardExpiry &&
    cardComplete.cardCvc &&
    !isSubmitting;

  return (
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("Payment Information")}
        </h2>
        <p className="text-gray-600 mt-1">
          {t("Complete your purchase with secure payment")}
        </p>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {plan.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("Subscription Plan")}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                {plan.price}
              </span>
              <span className="block text-sm text-gray-500">
                {plan.duration}
              </span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="text-sm">
              <span className="font-medium text-gray-700">
                {t("Billed to")}:
              </span>
              <span className="ml-2 text-gray-600">
                {formData.firstName+ " " +formData.lastName}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-2">{error}</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <FormLabel
                htmlFor="card-number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("Card Number")} *
              </FormLabel>
              <div
                className={`p-3 border rounded-md transition-colors ${
                  cardComplete.cardNumber
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                }`}
              >
                <CardNumberElement
                  id="card-number"
                  options={cardElementOptions}
                  className="w-full"
                  onChange={handleChange("cardNumber")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel
                  htmlFor="card-expiry"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("Expiration Date")} *
                </FormLabel>
                <div
                  className={`p-3 border rounded-md transition-colors ${
                    cardComplete.cardExpiry
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                  }`}
                >
                  <CardExpiryElement
                    id="card-expiry"
                    options={cardElementOptions}
                    onChange={handleChange("cardExpiry")}
                  />
                </div>
              </div>

              <div>
                <FormLabel
                  htmlFor="card-cvc"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("CVC")} *
                </FormLabel>
                <div
                  className={`p-3 border rounded-md transition-colors ${
                    cardComplete.cardCvc
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-gray-400 focus-within:border-blue-500"
                  }`}
                >
                  <CardCvcElement
                    id="card-cvc"
                    options={cardElementOptions}
                    onChange={handleChange("cardCvc")}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              disabled={!isFormReady}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("Processing...")}
                </div>
              ) : (
                `${t("Complete Payment")} - ${plan.price}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInformation;
