import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import formbanner from "@/assetsA/images/Banner/formbanner1.jpg";
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
          <div className="text-white  mb-4  ">
            <p className="font-bold text-2xl"> {t("StayUpdated")}</p>
            <p className="">{t("Subscribetoreceive")}</p>
          </div>
        }
      />

      <Cards />
      <Footer />
    </>
  );
};

export default PricingPage;
