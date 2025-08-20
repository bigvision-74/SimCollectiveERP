import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Elements } from "@stripe/react-stripe-js";
import Select from "react-select";
import { stripePromise } from "@/utils/stripe";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import formbanner from "@/assetsA/images/Banner/subspayment1.jpg";
import Footer from "@/components/HomeFooter";
import { FormInput, FormLabel } from "@/components/Base/Form";
import PaymentInformation from "@/components/Payment";
import Lucide from "@/components/Base/Lucide";
import Notification from "@/components/Base/Notification";
import { NotificationElement } from "@/components/Base/Notification";
import { getInstNameAction } from "@/actions/organisationAction";
import { addRequestAction } from "@/actions/organisationAction";
import ReCAPTCHA from "react-google-recaptcha";
import env from "../../../env";

interface PlanDetails {
  title: string;
  price: string;
  duration: string;
  features: string[];
  limitations?: string[];
}

interface FormErrors {
  institutionName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  country?: string;
  gdprConsent?: string;
  image?: string;
  captcha?: string;
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
  paymentMethodId: string;
  gdprConsent: boolean;
  image: File | null;
  website?: string;
  captcha?: string;
};

const PlanFormPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlan = location.state?.plan || "trial";
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(selectedPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successNotification = useRef<NotificationElement>();
  const [errors, setErrors] = useState<FormErrors>({});
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const recaptchaKey = env.RECAPTCHA_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  console.log(captchaToken, "captchaToken");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateUsername = (username: string) => {
    const re = /^[a-zA-Z0-9_]{4,20}$/;
    return re.test(username);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = t("InstitutionNameRequired");
      isValid = false;
    } else if (formData.institutionName.trim().length < 2) {
      newErrors.institutionName = t("InstitutionNameMinLength");
      isValid = false;
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("FirstNameRequired");
      isValid = false;
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = t("FirstNameMinLength");
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("LastNameRequired");
      isValid = false;
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = t("LastNameMinLength");
      isValid = false;
    }

    if (!formData.username.trim()) {
      newErrors.username = t("UsernameRequired");
      isValid = false;
    } else if (!validateUsername(formData.username)) {
      newErrors.username = t("UsernameInvalid");
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = t("EmailRequired");
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("EmailInvalid");
      isValid = false;
    }

    if (!formData.country) {
      newErrors.country = t("CountryRequired");
      isValid = false;
    }

    if (!formData.gdprConsent) {
      newErrors.gdprConsent = t("GDPRConsentRequired");
      isValid = false;
    }

    if (!formData.image) {
      newErrors.image = t("ImageRequired");
      isValid = false;
    }

    // 🚨 Add captcha validation
    if (!formData.captcha) {
      newErrors.captcha = t("CaptchaRequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    stripePromise
      .then(() => {
        setStripeLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load Stripe:", error);
      });
  }, []);

  const fetchCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,flags,cca2",
        {
          headers: {
            Connection: "keep-alive",
            Accept: "application/json",
          },
        }
      );
      const data = await response.json();

      const formattedCountries: CountryOption[] = data.map((country: any) => ({
        value: country.cca2,
        label: (
          <div className="flex items-center">
            <img
              src={country.flags.svg}
              alt={`${country.name.common} flag`}
              className="mr-2 w-6 h-6"
            />
            <span>{country.name.common}</span>
          </div>
        ),
        flag: country.flags.svg,
        countryCode: country.cca2?.toLowerCase() || "",
        name: country.name.common,
      }));

      setCountries(
        formattedCountries.sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const plans: Record<string, PlanDetails> = {
    trial: {
      title: t("LimitedTrial"),
      price: t("Free"),
      duration: t("(30days)"),
      features: [
        t("Accessscenarios"),
        t("Limitedrecords"),
        t("Educationalresources"),
      ],
      limitations: [t("Somedisabled"), t("Requiresform")],
    },
    subscription: {
      title: t("Subscription"),
      price: "£1000",
      duration: t("/year"),
      features: [
        t("Unlimitedpatientaccess"),
        t("Fullfeatureset"),
        t("Regularupdates"),
        t("Prioritysupport"),
      ],
    },
    perpetual: {
      title: t("PerpetualLicense"),
      price: "£3000",
      duration: t("(one-time)"),
      features: [
        t("Lifetimeaccess"),
        t("Unlimitedfeatures"),
        t("Allfutureupdates"),
        t("Dedicatedsupport"),
      ],
    },
    offline: {
      title: t("OfflinePayment"),
      price: "",
      duration: "",
      features: [
        t("Lifetimeaccess"),
        t("Unlimitedfeatures"),
        t("Allfutureupdates"),
        t("Dedicatedsupport"),
      ],
    },
  };

  const [formData, setFormData] = useState<FormDataType>({
    institutionName: "",
    paymentMethodId: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    country: "",
    gdprConsent: false,
    image: null,
    website: "",
  });

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    // Update form data first
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear existing error if any
    if (errors[name as keyof FormErrors]) {
      if (name === "institutionName" && value.trim().length >= 2) {
        setErrors((prev) => ({ ...prev, institutionName: undefined }));
      } else if (name === "firstName" && value.trim().length >= 2) {
        setErrors((prev) => ({ ...prev, firstName: undefined }));
      } else if (name === "lastName" && value.trim().length >= 2) {
        setErrors((prev) => ({ ...prev, lastName: undefined }));
      } else if (value) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }

    if (name === "institutionName" && value.trim().length >= 2) {
      try {
        const response = await getInstNameAction(value);
        if (response.exists) {
          setErrors((prev) => ({
            ...prev,
            institutionName: "Institution name already exists",
          }));
        }
      } catch (error) {
        console.error("Error checking institution name:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.website) {
      console.warn("Spam bot detected");
      return;
    }

    if (!validateForm()) {
      return;
    }

    // ✅ Get captcha token directly from the ref
    const token = recaptchaRef.current?.getValue();

    if (!token) {
      setErrors((prev) => ({
        ...prev,
        captcha: t("CaptchaRequired"),
      }));
      return;
    }

    setFormCompleted(true);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("institution", formData.institutionName);
    formDataToSubmit.append("fname", formData.firstName);
    formDataToSubmit.append("lname", formData.lastName);
    formDataToSubmit.append("username", formData.username);
    formDataToSubmit.append("email", formData.email);
    formDataToSubmit.append("country", formData.country);
    formDataToSubmit.append("type", selectedPlan);
    formDataToSubmit.append("gdprConsent", String(formData.gdprConsent));
    if (formData.image) {
      formDataToSubmit.append("thumbnail", formData.image);
    }
    formDataToSubmit.append("captcha", token);

    if (activeTab === "trial") {
      setIsSubmitting(true);
      const res = await addRequestAction(formDataToSubmit);
      if (res.success) {
        setTimeout(() => {
          setIsSubmitting(false);
          alert(t("Thank"));
          navigate("/");
        }, 1500);
      } else {
        setIsSubmitting(false);
        if (res.message === "Email already exists") {
          setErrors((prev) => ({
            ...prev,
            email: t("emailExist"),
          }));
        } else if (
          res.message ===
          "This domain is already registered. Only one free account per domain is allowed."
        ) {
          setErrors((prev) => ({
            ...prev,
            email: t("domainExist"),
          }));
        }
      }
    } else if (activeTab === "offline") {
      setIsSubmitting(true);
      try {
        const res = await addRequestAction(formDataToSubmit);
        if (res.success) {
          recaptchaRef.current?.reset();
          setTimeout(() => {
            setIsSubmitting(false);
            alert(t("Thank"));
            navigate("/");
          }, 1500);
        } else {
          setIsSubmitting(false);
          if (res.message === "Email already exists") {
            setErrors((prev) => ({
              ...prev,
              email: t("emailExist"),
            }));
          }
        }
      } catch (error) {
        setIsSubmitting(false);
        console.error("Error submitting form:", error);
      }
    } else {
      setShowPaymentInfo(true);
    }
  };

  const handlePaymentSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      successNotification.current?.showToast();
      navigate("/");
    }, 1500);
  };

  useEffect(() => {
    if (activeTab === "trial") {
      setShowPaymentInfo(false);
      setFormCompleted(false);
    }
  }, [activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          <div className="text-white  mb-4 ">
            <p className="font-bold text-4xl text-primary">
              {t("CompleteYourRegistration")}
            </p>
            <p className="text-xl mt-5 text-gray-700">
              {t("Filloutyourdetails")}
            </p>
          </div>
        }
      />
      <div className="container mx-auto px-4 py-12 relative">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t("SelectedPlan")}
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
                  onClick={() => setActiveTab(planKey)}
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
                      <span className="text-green-500 mr-2">✓</span>
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
                        <span className="text-red-400 mr-2">•</span>
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
              {!showPaymentInfo ? (
                <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {t("RegistrationForm")}
                  </h2>

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      {/* Honeypot field (hidden from users) */}
                      <FormInput
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="hidden"
                        autoComplete="off"
                      />

                      <div>
                        <FormLabel
                          htmlFor="institutionName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {t("InstitutionName")} *
                        </FormLabel>
                        <FormInput
                          type="text"
                          id="institutionName"
                          name="institutionName"
                          value={formData.institutionName}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border ${
                            errors.institutionName
                              ? "border-danger"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                        />
                        {errors.institutionName && (
                          <p className="mt-1 text-sm text-danger">
                            {errors.institutionName}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                          <FormLabel
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("FirstName")} *
                          </FormLabel>
                          <FormInput
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${
                              errors.firstName
                                ? "border-danger"
                                : "border-gray-300"
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-danger">
                              {errors.firstName}
                            </p>
                          )}
                        </div>

                        <div>
                          <FormLabel
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("LastName")} *
                          </FormLabel>
                          <FormInput
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${
                              errors.lastName
                                ? "border-danger"
                                : "border-gray-300"
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-danger">
                              {errors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          {/* Form fields remain the same as before */}
                          <div className="mb-5">
                            <FormLabel
                              htmlFor="username"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              {t("UserName")} *
                            </FormLabel>
                            <FormInput
                              type="text"
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border ${
                                errors.username
                                  ? "border-danger"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                            />
                            {errors.username && (
                              <p className="mt-1 text-sm text-danger">
                                {errors.username}
                              </p>
                            )}
                          </div>

                          <div className="mb-5">
                            <FormLabel
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              {t("Email")} *
                            </FormLabel>
                            <FormInput
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border ${
                                errors.email
                                  ? "border-danger"
                                  : "border-gray-300"
                              } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                            />
                            {errors.email && (
                              <p className="mt-1 text-sm text-danger">
                                {errors.email}
                              </p>
                            )}
                          </div>

                          <div className="mb-4">
                            <FormLabel
                              htmlFor="country"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              {t("Country")} *
                            </FormLabel>
                            <Select
                              options={countries}
                              value={selectedCountry}
                              onChange={(option) => {
                                setSelectedCountry(option as CountryOption);
                                setFormData((prev) => ({
                                  ...prev,
                                  country: (option as CountryOption).value,
                                }));
                                // Clear error when country is selected
                                setErrors((prev) => ({
                                  ...prev,
                                  country: undefined,
                                }));
                              }}
                              onBlur={() => {
                                // Validate on blur
                                if (!formData.country) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    country: t("CountryRequired"),
                                  }));
                                }
                              }}
                              placeholder={t("SelectCountry")}
                              className="basic-single mt-2"
                              classNamePrefix="select"
                              isSearchable={true}
                              noOptionsMessage={() => t("NoCountriesFound")}
                              loadingMessage={() => t("LoadingCountries")}
                              styles={{
                                input: (base) => ({
                                  ...base,
                                  "input:focus": {
                                    boxShadow: "none",
                                    outline: "none",
                                  },
                                }),
                                control: (base, state) => ({
                                  ...base,
                                  boxShadow: state.isFocused
                                    ? errors.country
                                      ? "0 0 0 1px #dc2626" // Red for error state
                                      : "0 0 0 1px #5b21b645" // Primary color for focus
                                    : "none",
                                  borderColor: errors.country
                                    ? "#dc2626" // Red border for error
                                    : state.isFocused
                                    ? "#5b21b645" // Primary color for focus
                                    : base.borderColor,
                                  "&:hover": {
                                    borderColor: errors.country
                                      ? "#dc2626" // Keep red on hover if error
                                      : state.isFocused
                                      ? "#5b21b645" // Primary color on hover when focused
                                      : base.borderColor,
                                  },
                                }),
                                placeholder: (base) => ({
                                  ...base,
                                  color: errors.country
                                    ? "#dc2626"
                                    : base.color,
                                }),
                              }}
                              formatOptionLabel={(option: CountryOption) => (
                                <div className="flex items-center">
                                  <img
                                    src={option.flag}
                                    alt={`${option.name} flag`}
                                    className="mr-2 w-6 h-6 rounded-sm object-cover"
                                  />
                                  <span>{option.name}</span>
                                </div>
                              )}
                              getOptionValue={(option: CountryOption) =>
                                option.value
                              }
                            />
                            {errors.country && (
                              <p className="mt-1 text-sm text-danger">
                                {errors.country}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-center lg:justify-end">
                          <div className="w-full sm:w-64 lg:w-56 xl:w-64">
                            <div
                              className={`p-4 border-2 border-dashed rounded-md shadow-sm ${
                                errors.image
                                  ? "border-danger"
                                  : "border-gray-400/40"
                              }`}
                            >
                              {image ? (
                                <div className="relative aspect-square mx-auto">
                                  <img
                                    className="rounded-md w-full h-full object-cover"
                                    alt="Uploaded preview"
                                    src={image}
                                  />
                                  <button
                                    onClick={handleRemoveImage}
                                    className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 -mt-2 -mr-2 text-white rounded-full bg-primary hover:zoom-in"
                                    title="Remove this profile photo?"
                                  >
                                    <Lucide icon="X" className="w-5 h-5" bold />
                                  </button>
                                </div>
                              ) : (
                                <div className="relative aspect-square mx-auto cursor-pointer flex flex-col items-center justify-center  ">
                                  <Lucide
                                    icon="Image"
                                    className="w-10 h-10 text-gray-400 mb-3"
                                  />
                                  <p className="text-gray-500 font-medium text-center">
                                    {t("UploadPhoto")}
                                  </p>
                                  <FormInput
                                    type="file"
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                      handleImageUpload(e);
                                      if (e.target.files?.[0]) {
                                        setErrors((prev) => ({
                                          ...prev,
                                          image: undefined,
                                        }));
                                      }
                                    }}
                                    onBlur={() => {
                                      if (!formData.image) {
                                        setErrors((prev) => ({
                                          ...prev,
                                          image: t("ImageRequired"),
                                        }));
                                      }
                                    }}
                                    ref={fileInputRef}
                                    accept="image/*"
                                  />
                                </div>
                              )}
                            </div>
                            {errors.image && (
                              <p className="mt-1 text-sm text-danger text-center">
                                {errors.image}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="gdprConsent"
                            name="gdprConsent"
                            type="checkbox"
                            checked={formData.gdprConsent}
                            onChange={handleInputChange}
                            className={`w-4 h-4 text-primary ${
                              errors.gdprConsent
                                ? "border-danger"
                                : "border-gray-300"
                            } rounded focus:ring-primary`}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <FormLabel
                            htmlFor="gdprConsent"
                            className="font-medium text-gray-700"
                          >
                            {t("Iagree")} *
                          </FormLabel>
                          <p className="text-gray-400">{t("Wehandle")}</p>
                          {errors.gdprConsent && (
                            <p className="mt-1 text-sm text-danger">
                              {errors.gdprConsent}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* reCAPTCHA */}
                    <div className="mt-4">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={recaptchaKey}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            captcha: value || "",
                          }))
                        }
                      />

                      {errors.captcha && (
                        <p className="mt-1 text-sm text-danger">
                          {errors.captcha}
                        </p>
                      )}
                    </div>

                    <div className="mt-8">
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="loader">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                          </div>
                        ) : (
                          t("Submit")
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <PaymentInformation
                  plan={plans[activeTab]}
                  formData={formData}
                  onSubmit={handlePaymentSubmit}
                />
              )}
            </Elements>
          ) : (
            <div></div>
          )}
        </div>

        <Notification
          getRef={(el) => {
            successNotification.current = el;
          }}
          className="flex"
        >
          <Lucide icon="CheckCircle" className="text-success" />
          <div className="ml-4 mr-4">
            <div className="font-medium">{t("Thankpayment")}</div>
            <div className="mt-1 text-slate-500">{t("Yourtransaction")}</div>
          </div>
        </Notification>
      </div>

      <Footer />
    </>
  );
};

export default PlanFormPage;
