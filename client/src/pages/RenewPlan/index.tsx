import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Select from "react-select";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import formbanner from "@/assetsA/images/Banner/subspayment1.jpg";
import Footer from "@/components/HomeFooter";
import { FormInput, FormLabel } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Notification from "@/components/Base/Notification";
import { NotificationElement } from "@/components/Base/Notification";
import { confirmUpdatePaymentAction } from "@/actions/paymentAction";
import { createPaymentAction } from "@/actions/paymentAction";
import { stripePromise } from "@/utils/stripe";

// Interfaces
interface PlanDetails {
  title: string;
  price: string;
  duration: string;
  features: string[];
  limitations?: string[];
}

interface Country {
  name: {
    common: string;
  };
  cca2: string;
  flags: {
    png: string;
    svg: string;
  };
}

type CountryOption = {
  value: string;
  label: JSX.Element;
  flag: string;
  countryCode: string;
  name: string;
};

type FormDataType = {
  institutionName: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  country: string;
  gdprConsent: boolean;
  image: File | null;
};

interface PaymentActionResponse {
  success: boolean;
  clientSecret?: string;
  error?: string;
}

// Payment Form Component
const PaymentForm = ({
  plan,
  formData,
  onSuccess,
}: {
  plan: PlanDetails;
  formData: FormDataType;
  onSuccess: () => void;
}) => {
  const username = localStorage.getItem("username");
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

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

  // Payment Flow Core Logic
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // 1. Validate Stripe initialization
    if (!stripe || !elements) {
      setError("Stripe has not been properly initialized");
      return;
    }

    // 2. Validate card details
    if (
      !cardComplete.cardNumber ||
      !cardComplete.cardExpiry ||
      !cardComplete.cardCvc
    ) {
      setError("Please fill in all card details correctly");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 3. Process price (convert to pence)
      const priceString = plan.price.replace(/[^0-9.-]+/g, "");
      const priceNumber = Number(priceString);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        throw new Error("Invalid price format");
      }
      const amountInPence = Math.round(priceNumber * 100);

      // 4. Create payment intent
      const paymentResponse = await createPaymentAction({
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
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(paymentResponse.clientSecret, {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: `${formData.firstName} ${formData.lastName}`,
              address: {
                country: "GB",
              },
            },
          },
        });

      if (stripeError) throw new Error(stripeError.message);
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        throw new Error("Payment failed");
      }

      // 6. Send confirmation to backend
      const formDataToSend = new FormData();
      formDataToSend.append("paymentIntentId", paymentIntent.id);
      formDataToSend.append("planTitle", plan.title);
      formDataToSend.append("planDuration", plan.duration);
      formDataToSend.append("email", localStorage.getItem("user") || "");

      const confirmationResponse = await confirmUpdatePaymentAction(
        formDataToSend
      );

      if (!confirmationResponse.success) {
        throw new Error(
          confirmationResponse.error || "Payment confirmation failed"
        );
      }

      navigate("/dashboard-admin");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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
              <span className="ml-2 text-gray-600">{username}</span>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Lucide
                    icon="XCircle"
                    className="text-red-400 w-5 h-5 mt-0.5"
                  />
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
                  <Lucide
                    icon="Loader"
                    className="animate-spin -ml-1 mr-3 w-5 h-5 text-white"
                  />
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

// Main Page Component
const PlanFormPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlan = location.state?.planType;
  console.log(selectedPlan, "selectedPlanselectedPlan");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(selectedPlan || "subscription");
  const [image, setImage] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null
  );

  useEffect(() => {
    stripePromise
      .then(() => {
        setStripeLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load Stripe:", error);
      });
  }, []);
  const [formData, setFormData] = useState<FormDataType>({
    institutionName: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    country: "",
    gdprConsent: false,
    image: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successNotification = useRef<NotificationElement>();

  const plans: Record<string, PlanDetails> = {
    subscription: {
      title: t("Subscription"),
      price: "£1000",
      duration: t("/year"),
      features: [
        t("Unlimited patient access"),
        t("Full feature set"),
        t("Regular updates"),
        t("Priority support"),
      ],
    },
    perpetual: {
      title: t("Perpetual License"),
      price: "£3000",
      duration: t("(one-time)"),
      features: [
        t("Lifetime access"),
        t("Unlimited features"),
        t("All future updates"),
        t("Dedicated support"),
      ],
    },
  };

  //   const fetchCountries = async () => {
  //     setIsLoadingCountries(true);
  //     try {
  //       const response = await fetch(
  //         "https://restcountries.com/v3.1/all?fields=name,flags,cca2"
  //       );
  //       const data = await response.json();

  //       const formattedCountries: CountryOption[] = data.map((country: Country) => ({
  //         value: country.cca2,
  //         label: (
  //           <div className="flex items-center">
  //             <img
  //               src={country.flags.svg}
  //               alt={`${country.name.common} flag`}
  //               className="mr-2 w-6 h-6"
  //             />
  //             <span>{country.name.common}</span>
  //           </div>
  //         ),
  //         flag: country.flags.svg,
  //         countryCode: country.cca2?.toLowerCase() || "",
  //         name: country.name.common,
  //       }));

  //       setCountries(formattedCountries.sort((a, b) => a.name.localeCompare(b.name)));
  //     } catch (error) {
  //       console.error("Error fetching countries:", error);
  //     } finally {
  //       setIsLoadingCountries(false);
  //     }
  //   };

  useEffect(() => {
    // fetchCountries();

    stripePromise
      .then(() => {
        setStripeLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load Stripe:", error);
      });
  }, []);

  const handleSuccess = () => {
    if (successNotification.current) {
      successNotification.current.showToast();
    }
    // You might want to navigate to a success page or reset the form
    // navigate("/payment-success");
  };

  const handleTabChange = (planKey: string) => {
    if (plans[planKey]) {
      setActiveTab(planKey);
    }
  };

  return (
    <>
      <Header />
      <Banner
        imageUrl={formbanner}
        altText="Doc banner"
        textClassName=""
        text={
          <div className="text-white text-3xl mb-4 w-[800px] mr-[600px]">
            <p className="font-bold">
              {t("Complete Your Registration and Secure Your Access")}
            </p>
            <p className="text-lg">
              Fill out your details and proceed with payment to unlock access to
              our immersive medical simulation training. Experience cutting-edge
              learning tools designed for educators, students, and professionals
              committed to advancing healthcare education.
            </p>
          </div>
        }
      />
      <div className="container mx-auto px-4 py-12 relative">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t("Selected Plan")}
            </h2>

            <div className="flex border-b border-gray-200 mb-6">
              {Object.keys(plans).map((planKey) => (
                <button
                  key={planKey}
                  className={`px-4 py-2 font-medium ${
                    activeTab === planKey
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => {
                    handleTabChange(planKey), setActiveTab(planKey);
                  }}
                >
                  {plans[planKey].title}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-primary">
                  {plans[activeTab].price}
                </span>
                <span className="text-gray-600 ml-2">
                  {plans[activeTab].duration}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  {t("Features")}:
                </h4>
                <ul className="space-y-2">
                  {plans[activeTab].features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Lucide
                        icon="Check"
                        className="text-green-500 mr-2 w-5 h-5"
                      />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plans[activeTab]?.limitations && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    {t("Limitations")}:
                  </h4>
                  <ul className="space-y-2">
                    {plans[activeTab].limitations?.map((limitation, index) => (
                      <li key={index} className="flex items-start">
                        <Lucide
                          icon="X"
                          className="text-red-400 mr-2 w-5 h-5"
                        />
                        <span className="text-gray-600">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {stripeLoaded ? (
            <Elements stripe={stripePromise}>
              <PaymentForm
                plan={plans[activeTab]}
                formData={formData}
                onSuccess={handleSuccess}
              />
            </Elements>
          ) : (
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-center">
              <div className="flex items-center">
                <Lucide icon="Loader" className="animate-spin mr-2 w-5 h-5" />
                <span>Loading payment system...</span>
              </div>
            </div>
          )}
        </div>

        <Notification
          getRef={(el) => {
            successNotification.current = el;
          }}
          className="flex"
        >
          <Lucide icon="CheckCircle" className="text-success w-6 h-6" />
          <div className="ml-4 mr-4">
            <div className="font-medium">
              {t("Thank you for your payment!")}
            </div>
            <div className="mt-1 text-slate-500">
              Your transaction has been processed successfully.
            </div>
          </div>
        </Notification>
      </div>

      <Footer />
    </>
  );
};

export default PlanFormPage;
