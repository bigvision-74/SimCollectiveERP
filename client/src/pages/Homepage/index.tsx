import React, { useState, useEffect, Suspense } from "react";
import "../../style.css";
import "./style.css";
import Footer from "@/components/HomeFooter";
import Header from "@/components/HomeHeader";
import Clients from "@/components/TrustedBy/TrustedBy";
import { useTranslation } from "react-i18next";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Lucide from "@/components/Base/Lucide";
import Banner from "@/components/Banner/Banner";
import DocBanner from "@/assetsA/images/Banner/bluebgdoc1.jpg";
import FeaturesGrid from "@/components/Dummy1";
import CallToAction from "@/components/Dummy3";
import HeroSection from "@/components/HomePageComponents/Herosection";
import WhatIsSection from "@/components/HomePageComponents/WhatisSection";
import WhySection from "@/components/HomePageComponents/WhySection";
import WhoIsItForSection from "@/components/HomePageComponents/WhoIsIt";
import Button from "@/components/Base/Button";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

const Home: React.FC = () => {
  const [showScroll, setShowScroll] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowScroll(true);
    } else {
      setShowScroll(false);
    }
    const sections = document.querySelectorAll(".scroll-reveal-section");
    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (sectionTop < windowHeight - 100) {
        section.classList.add("scroll-visible");
      } else {
        section.classList.remove("scroll-visible");
      }
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div>
      <Header />

      <Banner
        imageUrl={DocBanner}
        altText="Doctor banner"
        textClassName=""
        text={
          <div className="text-bannerTest">
            <p className="font-bold text-4xl text-primary">
              {/* {t("ImmersiveMedical")} */}
              {t(
                "Inpatient EPR: The Intuitive Electronic Patient Record for Simulation & Education"
              )}
            </p>
            {/* <p className="text-xl mt-5">{t("Experiencelifelike")}</p> */}
            <p className="text-xl mt-5">
              {" "}
              {t(
                "Practice patient care, investigations, and testing in a safe, realistic, and expandable environment."
              )}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button
                onClick={() => navigate("/plan-form")}
                className="text-base"
                variant="primary1"
              >
                {t("Start Free 30-Day Trial")}
              </Button>
              <Button
                onClick={() => navigate("/pricing")}
                className="text-base"
                variant="outline-primary1"
              >
                {t("Request Pricing")}
              </Button>
            </div>
            <p className="mt-8 text-gray-500 text-base">
              {t(
                "Designed by healthcare subject matter experts to meet today's training needs — and built to grow with your feedback."
              )}
            </p>
          </div>
        }
      />

      {/* <HeroSection /> */}
      <WhatIsSection />
      <WhySection />
      <WhoIsItForSection />
      {/* <FeaturesGrid /> */}
      <CallToAction />

      <div className="scrollToTopArrow">
        {showScroll && (
          <button
            onClick={scrollToTop}
            className="scrollToTop"
            style={{
              position: "fixed",
              bottom: "18px",
              right: "30px",
              zIndex: "1000",
              backgroundColor: "#5b21b6",
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
            {" "}
            <Lucide icon="ArrowUp" className="w-6 h-6 " />
          </button>
        )}
      </div>

      <div className="">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
