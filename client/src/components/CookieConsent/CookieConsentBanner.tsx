import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import { useCookieConsent } from "@/contexts/cookieConsentContext";

const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation();
  const { hasDecided, acceptAll, rejectOptional, openPreferences } =
    useCookieConsent();

  if (hasDecided) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200/60 bg-white/95 backdrop-blur-lg shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:border-darkmode-400 dark:bg-darkmode-600/95">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-700 dark:text-slate-300 lg:max-w-2xl">
          {t(
            "cookie_banner_desc",
            "We use essential cookies to make our platform work. With your permission, we'd also like to use optional cookies to understand how you use our platform and to help us improve it."
          )}{" "}
          <Link to="/policies" className="underline hover:opacity-80 transition">
            {t("cookie_banner_policy_link", "Review our Policies")}
          </Link>
          .
        </p>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            className="flex-1 lg:flex-none"
            onClick={openPreferences}
          >
            {t("cookie_manage_settings", "Manage Settings")}
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            className="flex-1 lg:flex-none"
            onClick={rejectOptional}
          >
            {t("cookie_reject_optional", "Reject Optional")}
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            className="flex-1 lg:flex-none"
            onClick={acceptAll}
          >
            {t("cookie_accept_all", "Accept All")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
