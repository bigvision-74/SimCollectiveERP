import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "./Base/Button";

const CallToAction = () => {
  const { t } = useTranslation();

  return (
    <div className="py-16 px-4 bg-[#7aaaaa] text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">
          {t("Ready to transform medical education?")}
        </h2>
        <p className="text-xl mb-8 opacity-90">
          {t("Join hundreds of institutions using our platform")}
        </p>
        <div className="space-x-4">
          <Button
            as={Link}
            to="/pricing"
            className="bg-white text-primary outline-primary hover:bg-gray-100 transition space-x-4 px-8 py-3 font-bold rounded-lg inline-block"
          >
            {t("View Plans")}
          </Button>
          <Link
            to="/contact"
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:bg-opacity-10 transition inline-block"
          >
            {t("Contact Sales")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
