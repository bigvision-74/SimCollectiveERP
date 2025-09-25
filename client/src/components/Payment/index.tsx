import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  createSubscriptionAction,
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
  image?: File | null;
}

interface PaymentActionResponse {
  success: boolean;
  error?: string;
  clientSecret?: string;
  customerId?: string;
  subscriptionId?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  requiresAction?: boolean;
  // Add these new properties
  requiresRetry?: boolean;
  processing?: boolean;
  requiresNewPaymentMethod?: boolean;
}

interface PaymentInformationProps {
  plan: PlanDetails;
  formData: FormData;
  onSubmit: (subscriptionId: string | null, paymentId: string | null) => void;
}

const PaymentInformation: React.FC<PaymentInformationProps> = ({
  plan,
  formData,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState<{
    cardNumber: boolean;
    cardExpiry: boolean;
    cardCvc: boolean;
  }>({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const stripe = useStripe();
  const elements = useElements();

  const handleChange = (field: keyof typeof cardComplete) => (event: any) => {
    if (error && event.complete) setError(null);
    setCardComplete({ ...cardComplete, [field]: event.complete });
    if (event.error) setError(event.error.message);
  };

const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  if (!stripe || !elements) {
    setError(t("Stripehasnotbeenproperly"));
    return;
  }

  if (
    !cardComplete.cardNumber ||
    !cardComplete.cardExpiry ||
    !cardComplete.cardCvc
  ) {
    setError(t("Pleasefillinall"));
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    const metadata = {
      institutionName: String(formData.institutionName || ""),
      name: String(
        `${formData.firstName || ""} ${formData.lastName || ""}`.trim()
      ),
      amount: "1",
      // amount: plan.price,
      email: String(formData.email || ""),
      plan: String(plan.title || ""),
      duration: String(plan.duration || ""),
      planType: String(plan.title || ""),
    };

    const paymentMethod = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardNumberElement)!,
      billing_details: {
        name: metadata.name,
        email: metadata.email,
      },
    });

    if (paymentMethod.error) {
      throw new Error(paymentMethod.error.message);
    }

    const formDataToSend = new FormData();
    formDataToSend.append("institutionName", metadata.institutionName);
    formDataToSend.append("billingName", metadata.name);
    formDataToSend.append("planTitle", metadata.plan);
    formDataToSend.append("planDuration", metadata.duration);
    formDataToSend.append("planType", metadata.planType);
    formDataToSend.append("fname", formData.firstName);
    formDataToSend.append("lname", formData.lastName);
    formDataToSend.append("username", formData.username);
    formDataToSend.append("email", metadata.email);
    formDataToSend.append("country", formData.country);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    if (plan.title === "5 Year Licence" || plan.title === "1 Year Licence") {
      // One-time payment logic (unchanged)
      const paymentResponse: PaymentActionResponse =
        await createPaymentAction({
          planType: metadata.planType,
          metadata: {
            ...metadata,
            paymentMethod: paymentMethod.paymentMethod.id,
          },
        });

      if (
        !paymentResponse.success ||
        !paymentResponse.clientSecret ||
        !paymentResponse.customerId
      ) {
        throw new Error(
          paymentResponse.error || t("Failedtoinitiatepayment")
        );
      }

      const { error: paymentError, paymentIntent } =
        await stripe.confirmCardPayment(paymentResponse.clientSecret, {
          payment_method: paymentMethod.paymentMethod.id,
        });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status !== "succeeded") {
        throw new Error(
          `Payment not completed. Status: ${paymentIntent.status}`
        );
      }

      if (paymentResponse.paymentIntentId) {
        formDataToSend.append("paymentId", paymentResponse.paymentIntentId);
      }

      formDataToSend.append("customerId", paymentResponse.customerId);
      formDataToSend.append(
        "amount",
        String(paymentResponse.amount || plan.price)
      );
      formDataToSend.append("currency", paymentResponse.currency || "gbp");
      formDataToSend.append(
        "method",
        paymentResponse.paymentMethod || "card"
      );

      const confirmationResponse = await confirmPaymentAction(formDataToSend);
      if (!confirmationResponse.success) {
        throw new Error(
          confirmationResponse.error || t("Paymentconfirmationfailed")
        );
      }

      setIsSubmitting(false);
      if (paymentResponse.paymentIntentId) {
        navigate("/success");
      }
    } 
    
  } catch (err: any) {
    console.error("Payment error:", err);
    setError(err.message || t("Anerrorduringpayment"));
    setIsSubmitting(false);
  }
};
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        "::placeholder": { color: "#aab7c4" },
        iconColor: "#424770",
      },
      invalid: { color: "#e53e3e", iconColor: "#e53e3e" },
      complete: { color: "#28a745", iconColor: "#28a745" },
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
          {t("PaymentInformation")}
        </h2>
        <p className="text-gray-600 mt-1">
          {t("Completepurchasesecurepayment")}
        </p>
      </div>
      <div className="p-6">
        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {plan.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{t(plan.title)}</p>
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
                {t("Billedto")}:
              </span>
              <span className="ml-2 text-gray-600">
                {formData.firstName + " " + formData.lastName}
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
                {t("CardNumber")} *
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
                  {t("ExpirationDate")} *
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
                <div className="flex items-center justify-center gap-2">
                  <div className="loader">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              ) : (
                `${t("CompletePayment")} - ${plan.price}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInformation;
