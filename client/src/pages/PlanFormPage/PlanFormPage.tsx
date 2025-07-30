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
import { set } from "lodash";

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
  };

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  console.log("Form Data:", formData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.username ||
      !formData.country ||
      !formData.gdprConsent ||
      !formData.image
    ) {
      alert(t("Pleasefill"));
      return;
    }

    setFormCompleted(true);

    if (activeTab === "trial") {
      setIsSubmitting(true);

      setTimeout(() => {
        setIsSubmitting(false);
        alert(t("Thank"));
        navigate("/");
      }, 1500);
    } else {
      setShowPaymentInfo(true);
    }
  };

  const handlePaymentSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      // Show notification instead of alert
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
            <p className="font-bold text-2xl">
              {t("CompleteYourRegistration")}
            </p>
            <p className="">{t("Filloutyourdetails")}</p>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      {/* <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <div className="mb-5">
                            <FormLabel
                              htmlFor="username"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              {t("User Name")} *
                            </FormLabel>
                            <FormInput
                              type="text"
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              required
                            />
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              required
                            />
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
                              }}
                              placeholder="Select a country"
                              className="basic-single mt-2"
                              classNamePrefix="select"
                              isSearchable={true}
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
                                    ? "0 0 0 1px #5b21b645"
                                    : "none",
                                  borderColor: state.isFocused
                                    ? "#5b21b645"
                                    : base.borderColor,
                                  "&:hover": {
                                    borderColor: state.isFocused
                                      ? "#5b21b645"
                                      : base.borderColor,
                                  },
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
                          </div>
                        </div>

                        <div className="mx-auto w-52 xl:mr-0 xl:ml-6 mt-3">
                          <div className="p-4 border-2 border-dashed rounded-md shadow-sm border-gray-400/40 dark:border-darkmode-400 ">
                            {image ? (
                              <div className="relative h-44 mx-auto image-fit">
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
                              <div className="relative mx-auto cursor-pointer h-44 text-center">
                                <p className="text-gray-500 font-bold">
                                  Upload Photo
                                </p>

                                <FormInput
                                  type="file"
                                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={handleImageUpload}
                                  ref={fileInputRef}
                                  accept="image/*"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div> */}

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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              required
                            />
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              required
                            />
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
                              }}
                              placeholder="Select a country"
                              className="basic-single mt-2"
                              classNamePrefix="select"
                              isSearchable={true}
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
                                    ? "0 0 0 1px #5b21b645"
                                    : "none",
                                  borderColor: state.isFocused
                                    ? "#5b21b645"
                                    : base.borderColor,
                                  "&:hover": {
                                    borderColor: state.isFocused
                                      ? "#5b21b645"
                                      : base.borderColor,
                                  },
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
                          </div>
                        </div>

                        <div className="flex justify-center lg:justify-end">
                          <div className="w-full sm:w-64 lg:w-56 xl:w-64">
                            <div className="p-4 border-2 border-dashed rounded-md shadow-sm border-gray-400/40">
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
                                <div className="relative aspect-square mx-auto cursor-pointer flex flex-col items-center justify-center">
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
                                    onChange={handleImageUpload}
                                    ref={fileInputRef}
                                    accept="image/*"
                                  />
                                </div>
                              )}
                            </div>
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
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            required
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
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {activeTab === "trial"
                          ? t("Submit")
                          : t("ProceedPayment")}
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
