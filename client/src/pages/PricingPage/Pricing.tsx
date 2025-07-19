import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import formbanner from "@/assetsA/images/Banner/formbanner.jpg";
import Footer from "@/components/HomeFooter";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Cards from "@/components/PriceCards/PriceCards";

const PricingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <Banner
        imageUrl={formbanner}
        altText="Doc banner"
        textClassName=""
        text={
          <div className="text-white text-3xl mb-4  w-[800px] mr-[600px]">
            <p className="font-bold">
              {" "}
              {t("Stay Updated with the Future of Medical Simulation")}
            </p>
            <p className="text-lg ">
              Subscribe to receive the latest updates, new case releases, and
              insights on virtual patient training. Join our community of
              educators, students, and professionals advancing medical learning
              through innovation.
            </p>
          </div>
        }
      />

      <Cards />
      <Footer />
    </>
  );
};

export default PricingPage;
