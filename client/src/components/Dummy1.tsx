import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

const FeaturesGrid = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: "mdi:brain",
      title: t("RealisticScenarios"),
      description: t("Authenticpatient"),
    },
    {
      icon: "mdi:chart-line",
      title: t("PerformanceAnalytics"),
      description: t("Trackimprove"),
    },
    {
      icon: "mdi:account-group",
      title: t("CollaborativeLearning"),
      description: t("Team-based exercises with peer feedback"),
    },
    {
      icon: "mdi:cellphone",
      title: t("MobileFriendly"),
      description: t("Accesstraining"),
    },
  ];

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          {t("WhyChoosePlatform")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 bg-gray-50 rounded-lg">
              <Icon
                icon={feature.icon}
                className="text-primary text-4xl mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesGrid;
