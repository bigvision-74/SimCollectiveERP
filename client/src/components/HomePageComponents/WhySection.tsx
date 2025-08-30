import React from "react";
import { useTranslation } from "react-i18next";
import Lucide from "../Base/Lucide";

const WhySection = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: "Intuitive Interface",
      description: "No steep learning curve",
      icon: <Lucide icon="ArrowUp" className="w-6 h-6 text-primary" />,
    },
    {
      title: "Safe Practice",
      description: "Mistakes become opportunities to learn",
      icon: <Lucide icon="Shield" className="w-6 h-6 text-primary" />,
    },
    {
      title: "Realistic Workflows",
      description: "Mirrors actual hospital EPR systems",
      icon: <Lucide icon="RefreshCw" className="w-6 h-6 text-primary" />,
    },
    {
      title: "Flexible Use",
      description: "Ideal for teaching, OSCE prep, or self-directed learning",
      icon: <Lucide icon="Settings" className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-700 mb-6 text-center">
            {t("Why Inpatient EPR?")}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {t(feature.title)}
                    </h3>
                    <p className="text-gray-600">{t(feature.description)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySection;
