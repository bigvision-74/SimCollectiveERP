import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "./Base/Button";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="py-16 px-4 bg-[#12a6e42b] text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-700">
          {t("Readytotransform")}
        </h2>
        <p className="text-xl mb-8 opacity-90 text-gray-700">
          {t("Joinhundreds")}
        </p>
        <div className="space-x-4">
          <Button variant="primary" as={Link} to="/pricing">
            {t("ViewPlans")}
          </Button>
          <Button variant="outline-primary" as={Link} to="/contact">
            {t("ContactSales")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
