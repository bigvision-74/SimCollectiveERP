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
          <div className="text-white text-3xl mb-4  w-[800px] mr-[600px]">
            <p className="font-bold">
              {" "}
              {t("Enhancing Medical Learning Through Simulation")}
            </p>
            <p className="text-lg ">
              our platform provides lifelike virtual patient records designed to
              support clinical training, decision-making, and diagnostic skills.
              With dynamic case scenarios and interactive data, we bridge the
              gap between theory and real-world medical practice.
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

      <div className="bg-[#4aa3df]">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
