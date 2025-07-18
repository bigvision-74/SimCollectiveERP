import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import formbanner from "@/assetsA/images/Banner/formbanner.jpg";
import Footer from "@/components/HomeFooter";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
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
const PlanFormPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // const response = await fetch("https://restcountries.com/v3.1/all");
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,flags,cca2,countries",
          {
            headers: {
              Connection: "keep-alive",
              Accept: "application/json",
            },
          }
        );
        const data = await response.json();
        const sortedCountries = data.sort((a: Country, b: Country) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sortedCountries);
        console.log("Error data", data);
      } catch (error) {
        console.log("Error fetching countries:", error);
        // setCountries([
        //   { name: { common: "United Kingdom" }, cca2: "GB" },
        //   { name: { common: "United States" }, cca2: "US" },
        //   { name: { common: "Canada" }, cca2: "CA" },
        // ]);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const selectedPlan = location.state?.plan || "trial";

  const plans = {
    trial: {
      title: t("Limited Trial"),
      price: t("Free"),
      duration: t("(30 days)"),
      features: [
        t("Access to basic scenarios"),
        t("Limited patient records"),
        t("Educational resources"),
      ],
      limitations: [
        t("Some features disabled"),
        t("Requires registration form"),
      ],
    },
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

  const [formData, setFormData] = useState({
    institutionName: "",
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    gdprConsent: false,
  });

  const [activeTab, setActiveTab] = useState(selectedPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("Form submitted:", { ...formData, plan: activeTab });

    setTimeout(() => {
      setIsSubmitting(false);
      alert(t("Thank you for your submission!"));
      navigate("/login");
    }, 1500);
  };

  return (
    <>
      <Header />
      <Banner
        imageUrl={formbanner}
        altText="Doc banner"
        textClassName=""
        text={
          <div className="text-white text-3xl mb-4  w-[800px] mr-[600px]">
            <p className="font-bold">
              {" "}
              {t("Stay Updated with the Future of Medical Simulation")}
            </p>
            <p className="text-lg ">
              Subscribe to receive the latest updates, new case releases, and
              insights on virtual patient training. Join our community of
              educators, students, and professionals advancing medical learning
              through innovation.
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
                  onClick={() => setActiveTab(planKey)}
                >
                  {plans[planKey as keyof typeof plans].title}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-primary">
                  {plans[activeTab as keyof typeof plans].price}
                </span>
                <span className="text-gray-600 ml-2">
                  {plans[activeTab as keyof typeof plans].duration}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  {t("Features")}:
                </h4>
                <ul className="space-y-2">
                  {plans[activeTab as keyof typeof plans].features.map(
                    (feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {plans[activeTab as keyof typeof plans].limitations && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    {t("Limitations")}:
                  </h4>
                  <ul className="space-y-2">
                    {plans[activeTab as keyof typeof plans].limitations?.map(
                      (limitation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          <span className="text-gray-600">{limitation}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t("Registration Form")}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <FormLabel
                    htmlFor="institutionName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("Institution Name")} *
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t("First Name")} *
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
                      {t("Last Name")} *
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

                <div>
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

                <div>
                  <FormLabel
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("Country")} *
                  </FormLabel>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={isLoadingCountries}
                  >
                    <option value="">
                      {isLoadingCountries
                        ? t("Loading countries...")
                        : t("Select Country")}
                    </option>
                    {countries.map((country) => (
                      <option key={country.cca2} value={country.cca2}>
                        <div className="flex items-center">
                          <img
                            src={country.flags.png}
                            alt={`${country.name.common} flag`}
                            className="w-5 h-3 mr-2"
                          />
                          {country.name.common}
                        </div>
                      </option>
                    ))}
                  </select>
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
                      {t("I agree to the GDPR terms and privacy policy")} *
                    </FormLabel>
                    <p className="text-gray-500">
                      {t(
                        "We'll handle your data in accordance with our privacy policy."
                      )}
                    </p>
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
                  {isSubmitting ? t("Processing...") : t("Submit Application")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PlanFormPage;
