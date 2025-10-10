import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";
import { useAuth } from "../AuthRoutes";

interface PricingCardProps {
  title: string;
  price: string;
  duration: string;
  features: string[];
  limitations?: string[];
  ctaText: string;
  ctaLink: string;
  isHighlighted?: boolean;
  isExternal?: boolean;
  planKey?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  duration,
  features,
  limitations = [],
  ctaText,
  ctaLink,
  isHighlighted = false,
  isExternal = false,
  planKey = "trial",
}) => {
  const { t } = useTranslation();
  const { authenticated } = useAuth(); // Only using this for the check

  return (
    <div
      className={`flex flex-col p-6 rounded-lg shadow-md border ${
        isHighlighted
          ? "bg-white border-primary transform scale-105 z-10"
          : "bg-gray-50 border-gray-200"
      } transition-all duration-300 h-full`}
    >
      {/* ... (rest of the card content is unchanged) */}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-primary">{price}</span>
        <span className="text-gray-600 ml-1">{duration}</span>
      </div>

      <div className="flex-grow">
        <h4 className="font-semibold text-gray-700 mb-2">{t("Features")}:</h4>
        <ul className="mb-4 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {limitations && limitations.length > 0 && (
          <>
            <h4 className="font-semibold text-gray-700 mb-2">
              {t("Limitations")}:
            </h4>
            <ul className="mb-4 space-y-2">
              {limitations.map((limitation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span className="text-gray-600">{limitation}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-auto pt-4">
        {authenticated ? (
          // IF AUTHENTICATED: Show a disabled button with a helpful message.
          <div className="relative group w-full">
            <Button
              as="button"
              variant={isHighlighted ? "primary" : "outline-primary"}
              className="w-full cursor-not-allowed"
              disabled
            >
              {ctaText}
            </Button>
            <div
              className="absolute bottom-full left-1/2 z-20 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 text-sm font-normal text-white bg-gray-800 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              role="tooltip"
            >
              {t(
                "already_logged_in_tooltip",
                "You are already logged in."
              )}
            </div>
          </div>
        ) : (
          // IF NOT AUTHENTICATED: Render the button exactly as it was in your original code.
          <Button
            as={Link}
            to="/plan-form" // This uses the original hardcoded link
            state={{ plan: planKey }}
            variant={isHighlighted ? "primary" : "outline-primary"}
            className="w-full"
          >
            {ctaText}
          </Button>
        )}
      </div>
    </div>
  );
};


// The PriceCards component remains unchanged.
const PriceCards: React.FC = () => {
  const { t } = useTranslation();

  const tiers = [
    {
      title: t("30day_free_trial"),
      price: t("Free"),
      duration: t("30days"),
      features: [
        t("Accessscenarios"),
        t("Limitedrecords"),
        t("Educationalresources"),
      ],
      limitations: [t("Somedisabled"), t("Requiresform")],
      ctaText: t("Register"),
      ctaLink: "/free-trial-form",
      isExternal: false,
      isHighlighted: true,

      planKey: "trial",
    },
    {
      title: t("get_formal_quote"),
      price: "",
      duration: "",
      features: [
        t("this_will_enable_send_formalquote"),
      ],
      limitations: [],
      ctaText: t("Register"),
      ctaLink: "https://www.simulationcollective.com/quote",
      isExternal: true,
      planKey: "offline",
      isHighlighted: true,
    },
    {
      title: t("1year_licence"),
      price: "£1000",
      duration: t("/year"),
      features: [
        t("Unlimitedpatientaccess"),
        t("Fullfeatureset"),
        t("Regularupdates"),
        t("Prioritysupport"),
      ],
      ctaText: t("subscribe"),
      ctaLink: "https://www.simulationcollective.com/quote",
      isHighlighted: true,
      isExternal: true,
      planKey: "subscription",
    },
    {
      title: t("5_year_licence"),
      price: "£3000",
      duration: t("5year"),
      features: [
        t("5yearaccess"),
        t("Unlimitedfeatures"),
        t("Allfutureupdates"),
        t("Dedicatedsupport"),
      ],
      limitations: [],
      ctaText: t("buyplan"),
      ctaLink: "https://www.simulationcollective.com/quote",
      isExternal: true,
      planKey: "perpetual",
      isHighlighted: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-0 md:-mt-20  relative z-20">
        {tiers.map((tier, index) => (
          <PricingCard key={index} {...tier} planKey={tier.planKey} />
        ))}
      </div>
    </div>
  );
};

export default PriceCards;