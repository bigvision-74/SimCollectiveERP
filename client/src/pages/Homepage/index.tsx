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

const Home: React.FC = () => {
  const [showScroll, setShowScroll] = useState(false);
  const { t } = useTranslation();

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
        altText="Doc banner"
        textClassName=""
        text={
          <div className="text-bannerTest">
            {/* <p className="font-bold text-3xl text-gray-700"> {t("EnhancingMedical")}</p>
            <p className="text-xl mt-5">{t("Ourplatformoffers")}</p> */}
            <p className="font-bold text-3xl text-gray-700">
              Immersive Medical Training Through Virtual Simulation
            </p>
            <p className="text-xl mt-5">
              Experience lifelike virtual patient cases with dynamic, evolving
              scenarios designed to sharpen clinical judgment, diagnostic
              accuracy, and decision-making skills. Our platform bridges the gap
              between theory and real-world practice, empowering healthcare
              professionals to learn, adapt, and excel.
            </p>
          </div>
        }
      />
      <FeaturesGrid />
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
