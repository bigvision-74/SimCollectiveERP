import React, { Suspense, useEffect, useState } from "react";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/banner";
import Footer from "@/components/HomeFooter";
import "./platform.css";

// import aboutBanner from '../../assetsA/images/Platfoam2.png';
import aboutBanner from "../../assetsA/images/Banner/Platfoam2.jpg";
import { useTranslation } from "react-i18next";
import Lucide from "@/components/Base/Lucide";

const ContentManagement = React.lazy(
  () => import("@/components/PlatformCompo/Content")
);
const HardwareManagement = React.lazy(
  () => import("@/components/PlatformCompo/HardwareManagement")
);
const LearningJourney = React.lazy(
  () => import("@/components/PlatformCompo/LearningJourney")
);
const TrainerPlatform = React.lazy(
  () => import("@/components/PlatformCompo/Trainer")
);
const AdvancedAnalytics = React.lazy(
  () => import("@/components/PlatformCompo/AdvancedAnalytics")
);
const ScalableSecure = React.lazy(
  () => import("@/components/PlatformCompo/Scaleable")
);
const WhyChooseXR = React.lazy(
  () => import("@/components/PlatformCompo/WhyChooseXR")
);

const Platform: React.FC = () => {
  const [showScroll, setShowScroll] = useState(false);
  const [isPricingInView, setIsPricingInView] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const handleScroll = () => {
      const pricingSection = document.getElementById("pricing");
      if (pricingSection) {
        const sectionTop = pricingSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        setIsPricingInView(sectionTop < windowHeight - 200);
      }
      setShowScroll(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <Banner
        imageSrc={aboutBanner}
        heading={t("InsightXRPlatformPage")}
        paragraphs={[t("committed"), t("passionately")]}
        buttonText="Learn More"
        onButtonClick={() => console.log("Learn More Clicked")}
      />
      <div className="relative">
        <Suspense>
          <ContentManagement />
        </Suspense>
        <Suspense>
          <HardwareManagement />
        </Suspense>
        <Suspense>
          <LearningJourney />
        </Suspense>
        <Suspense>
          <TrainerPlatform />
        </Suspense>
        <Suspense>
          <AdvancedAnalytics />
        </Suspense>
        <Suspense>
          <ScalableSecure />
        </Suspense>
        <Suspense>
          <WhyChooseXR />
        </Suspense>
        {showScroll && (
          <button
            onClick={scrollToTop}
            className="scrollToTop"
            style={{
              position: "fixed",
              bottom: "18px",
              right: "30px",
              zIndex: "1000",
              backgroundColor: "#fd6f39",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Lucide icon="ArrowUp" className="w-6 h-6" />
          </button>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Platform;
