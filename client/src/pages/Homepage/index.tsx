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
// import ContactModal from "../ContactModal/ContactModal";
// import banner from '@/assetsA/images/insightXrBanner.jpeg';
// import banner from "@/assetsA/images/Banner/pikaso_embed.jpeg";
import LazyImage from "@/components/LazyImage";

const FeatureSection = React.lazy(
  () => import("@/components/HomePageComponents/Features")
);
const StatsSection = React.lazy(
  () => import("@/components/HomePageComponents/StatSection")
);
const FeaturesSlider = React.lazy(
  () => import("@/components/HomePageComponents/Slider")
);
const FeatureCards = React.lazy(
  () => import("@/components/HomePageComponents/FeatureCards")
);
const FeatureComparison = React.lazy(
  () => import("@/components/HomePageComponents/FeatureComparison")
);
const TestimonialsCarousel = React.lazy(
  () => import("@/components/HomePageComponents/Testimonial")
);
const CallToAction = React.lazy(
  () => import("@/components/HomePageComponents/CallToAction")
);

const Main: React.FC = () => {
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

      <section id="hero" className="hero-section dark-background relative ">
        <img
          className="absolute top-0 left-0 w-full h-full object-cover"
          src={'#'}
          alt="InsightXR Oculus Image"
        />
        <div className="container relative z-10 homeBannerHeading mr-[258px]">
          <div className="row">
            <div className="col-lg-10 col-md-12 col-sm-12 ml-md-0 ml-sm-0">
              <h2 className="text-white siteBannerHeading responsive-heading">
                {t("bannner_heading")}
              </h2>
              <h2 className="text-white -mt-2 siteBannerHeading responsive-heading">
                {t("banner_heading1")}
              </h2>
              <p className="mt-4 bannerPara text-white responsive-paragraph">
                {t("bannner_para")}
              </p>
              <p className="-mt-1 bannerPara text-white responsive-paragraph">
                {t("bannner_para1")}
              </p>
              <p className="-mt-1 bannerPara text-white responsive-paragraph">
                {t("bannner_para2")}
              </p>
              <button
                className="animated-button mt-10 getDemoHome"
                onClick={toggleModal}
              >
                <span className="text">{t("banner_button")}</span>
                <span className="circle"></span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="arr-1"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
              </button>
              {/* <ContactModal isOpen={isModalOpen} toggleModal={toggleModal} /> */}
            </div>
          </div>
        </div>
      </section>

      <div className="scroll-reveal-section">
        <Suspense>
          <FeatureSection />
        </Suspense>
      </div>
      <div className="scroll-reveal-section">
        <Suspense>
          <FeatureComparison />
        </Suspense>
      </div>
      <div className="scroll-reveal-section">
        <Suspense>
          <FeaturesSlider />
        </Suspense>
      </div>
      <div className="scroll-reveal-section">
        <Suspense>
          <FeatureCards />
        </Suspense>
      </div>
      <div className="scroll-reveal-section">
        <Suspense>
          <Clients />
        </Suspense>
      </div>
      <div className="scroll-reveal-section backgroundImage">
        <Suspense>
          <TestimonialsCarousel />
        </Suspense>
      </div>
      <div className="scroll-reveal-section">
        <Suspense>
          <StatsSection />
        </Suspense>
      </div>
      <div className="scroll-reveal-section">
        <Suspense>
          <CallToAction />
        </Suspense>
      </div>
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
            {" "}
            <Lucide icon="ArrowUp" className="w-6 h-6 "/>
          </button>
        )}
      </div>

      <div className="  bg-[#0f1f39]">
        <Footer />
      </div>
    </div>
  );
};

export default Main;
