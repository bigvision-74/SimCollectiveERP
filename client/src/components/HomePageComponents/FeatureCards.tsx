import React from "react";
import "./style.css";
import enterprise from "../../assetsA/images/icons/orangePeople.svg";
import academic from "../../assetsA/images/icons/orangeDesktop.svg";
import healthcare from "../../assetsA/images/icons/orangeVr.svg";
import Construction from "../../assetsA/images/icons/Construction-Trades-icon.svg";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LazyImage from "@/components/LazyImage";

const features = [
  { id: 1, key: "Healthcare", icon: healthcare, link: "/solutions/healthcare" },
  {
    id: 2,
    key: "Education",
    icon: academic,
    link: "/solutions/academic-institutions",
  },
  { id: 3, key: "Corporate", icon: enterprise, link: "/solutions/healthcare" },
  {
    id: 4,
    key: "Construction",
    icon: Construction,
    link: "/solutions/healthcare",
  },
];

const FeatureCards: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="bg-[#0f1f3921] py-12 ">
      <div className="container mx-auto text-center mb-10">
        <h2 className="siteHeading solutionOverviewHeading mt-10 mb-10">
          <span className="orangeColor">{t("solutions")} </span> {t("overview")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 min-h-[300px] max-w-7xl mx-auto px-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-cardOverview relative flex flex-col items-center justify-center group h-full mt-5 bg-white rounded-xl overflow-hidden transition-all duration-500 ease-in-out"
            >
              <div className="flex flex-col items-center justify-center transition-all duration-500 ease-in-out group-hover:mt-0 group-hover:translate-y-[-40%]">
                <LazyImage
                  className="feature-icon mb-4 w-20 h-20 transition-transform duration-500 ease-in-out group-hover:scale-115"
                  src={feature.icon}
                  alt={feature.key}
                  placeholder=""
                />
                <h3 className="siteSubheading group-hover:text-primary transition-colors ease-in-out">
                  {t(`features.${feature.key}.title`)}
                </h3>
              </div>
              <div className="absolute bottom-12 w-full px-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-5 transition-all duration-500 ease-in-out">
                <p className="text-center featurespara">
                  {t(`features.${feature.key}.description`)}
                </p>
                {/* <Link
                  to={feature.link}
                  className='learn-more mt-12 items-center justify-center transition-colors duration-500 ease-in-out'
                >
                  {t('learnMore')}
                </Link> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
