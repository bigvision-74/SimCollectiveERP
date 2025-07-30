import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";

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

  return (
    <div
      className={`flex flex-col p-6 rounded-lg shadow-md border ${
        isHighlighted
          ? "bg-white border-primary transform scale-105 z-10"
          : "bg-gray-50 border-gray-200"
      } transition-all duration-300 h-full`}
    >
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
        {/* <Button
          as={Link}
          to={ctaLink}
          variant={isHighlighted ? "primary" : "outline-primary"}
          className="w-full"
        >
          {ctaText}
        </Button> */}

        <Button
          as={Link}
          to="/plan-form"
          state={{ plan: planKey }}
          variant={isHighlighted ? "primary" : "outline-primary"}
          className="w-full"
        >
          {ctaText}
        </Button>
      </div>
    </div>
  );
};

const PriceCards: React.FC = () => {
  const { t } = useTranslation();

  const tiers = [
    {
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
      ctaText: t("Go to form"),
      ctaLink: "/free-trial-form",
      isExternal: false,
      planKey: "trial",
    },
    {
      title: t("Subscription"),
      price: "£1000",
      duration: t("/year"),
      features: [
        t("Unlimited patient access"),
        t("Full feature set"),
        t("Regular updates"),
        t("Priority support"),
      ],
      ctaText: t("Go to form"),
      ctaLink: "https://www.simulationcollective.com/quote",
      isHighlighted: true,
      isExternal: true,
      planKey: "subscription",
    },
    {
      title: t("Perpetual License"),
      price: "£3000",
      duration: t("(one-time)"),
      features: [
        t("Lifetime access"),
        t("Unlimited features"),
        t("All future updates"),
        t("Dedicated support"),
      ],
      limitations: [],
      ctaText: t("Go to form"),
      ctaLink: "https://www.simulationcollective.com/quote",
      isExternal: true,
      planKey: "perpetual",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-0 md:-mt-20  relative z-20">
        {tiers.map((tier, index) => (
          <PricingCard key={index} {...tier} planKey={tier.planKey} />
        ))}
      </div>
    </div>
  );
};

export default PriceCards;
