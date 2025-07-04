import React from "react";
import "./style.css";
import { Trans, useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import manage from "../../assetsA/images/sliderIcons/icon1.svg";
import deploy from "../../assetsA/images/sliderIcons/icon2.svg";
import performance from "../../assetsA/images/sliderIcons/icon3.svg";
import monitor from "../../assetsA/images/sliderIcons/icon4.svg";
// import LazyVideo from "../LazyVideo";
import platform from "../../assetsA/images/platformBlur5.jpg";

const FeatureSection: React.FC = () => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <section id="features" className="py-12 -ml-2">
      <div className="container mx-auto ">
        <div className="flex flex-col lg:flex-row gap-8 items-start max-w-8xl mx-auto  mt-10">
          <div className="lg:w-1/2 mr-5">
            <h2 className="siteHeading">
              <Trans i18nKey="question">
                What is <span className="orangeColor">InsightXR</span>?
              </Trans>
            </h2>
            <p className="-mt-5">{t("paragraphs.forget_rate")}</p>

            <div className="mt-8 flex items-start gap-3">
              <img src={manage} alt="" className="w-16 h-16" />
              <p>
                <b className="orangeColor">{t("paragraphs.ManageXR")} </b>
                <br />
                {t("paragraphs.ManageXR2")}
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <img src={deploy} alt="" className="w-16 h-16" />
              <p>
                <b className="orangeColor">
                  {t("paragraphs.Deploy_Immersive")}{" "}
                </b>
                <br />
                {t("paragraphs.Deploy_Immersive2")}
              </p>
            </div>

            <div className="mt-2 flex items-start gap-3">
              <img src={performance} alt="" className="w-16 h-16" />
              <p>
                <b className="orangeColor">
                  {t("paragraphs.Analyse_Performance")}{" "}
                </b>
                <br />
                {t("paragraphs.Analyse_Performance2")}
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <img src={monitor} alt="" className="w-16 h-16" />
              <p>
                <b className="orangeColor">
                  {t("paragraphs.Monitor_Real_Time")}{" "}
                </b>
                <br />
                {t("paragraphs.Monitor_Real_Time2")}
              </p>
            </div>
          </div>

          <div
            ref={ref}
            className="featureSectionVideo overflow-hidden rounded-lg flex items-center justify-center w-full mt-8 mx-auto"
            style={{
              maxWidth: "100%",
              aspectRatio: "16/9",
            }}
          >
            <LazyVideo
              src="https://insightxr.s3.eu-west-2.amazonaws.com/sitevideo/InsightXRVideo.mp4"
              poster={platform}
              type="video/mp4"
              alt="Content and course demo video"
              className="w-full h-full object-cover rounded-lg"
              controls
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
