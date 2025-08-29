import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../Base/Button";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-700  font-bold  mb-6">
            {t(
              "Inpatient EPR: The Intuitive Electronic Patient Record for Simulation & Education"
            )}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t(
              "Practice patient care, investigations, and testing in a safe, realistic, and expandable environment."
            )}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="primary1">{t("Start Free 30-Day Trial")}</Button>
            <Button variant="outline-primary1">{t("Request Pricing")}</Button>
          </div>
          <p className="mt-8 text-gray-500">
            {t(
              "Designed by healthcare subject matter experts to meet today's training needs — and built to grow with your feedback."
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
