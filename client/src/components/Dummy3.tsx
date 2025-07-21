import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "./Base/Button";
<<<<<<< HEAD
=======
import { useNavigate } from "react-router-dom";
>>>>>>> f946d98e865cd6bc94ee8efbf58367b42546601a

const CallToAction = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="py-16 px-4 bg-[#12a6e42b] text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-700">
          {t("Ready to transform medical education?")}
        </h2>
        <p className="text-xl mb-8 opacity-90 text-gray-700">
          {t("Join hundreds of institutions using our platform")}
        </p>
        <div className="space-x-4">
          <Button
<<<<<<< HEAD
            as={Link}
            to="/pricing"
            className="bg-white text-primary outline-primary hover:bg-gray-100 transition space-x-4 px-8 py-3 font-bold rounded-lg inline-block"
          >
            {t("View Plans")}
          </Button>
          <Link
            to="/contact"
            className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:bg-opacity-10 transition inline-block"
=======
            variant="primary"
            className="px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            onClick={() => navigate("/pricing")}
>>>>>>> f946d98e865cd6bc94ee8efbf58367b42546601a
          >
            {t("Contact Sales")}
          </Button>
          <Button
            variant="soft-primary"
            className="px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            onClick={() => navigate("/contact")}
          >
            {t("Contact Sales")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
