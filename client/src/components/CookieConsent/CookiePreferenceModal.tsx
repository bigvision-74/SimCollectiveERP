import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@/components/Base/Headless/Dialog";
import Button from "@/components/Base/Button";
import { FormSwitch, FormLabel } from "@/components/Base/Form";
import { useCookieConsent } from "@/contexts/cookieConsentContext";

const CookiePreferenceModal: React.FC = () => {
  const { t } = useTranslation();
  const { consent, isPreferenceCenterOpen, closePreferences, savePreferences } =
    useCookieConsent();

  const [draft, setDraft] = useState(consent);

  useEffect(() => {
    if (isPreferenceCenterOpen) {
      setDraft(consent);
    }
  }, [isPreferenceCenterOpen, consent]);

  const categories: {
    key: keyof typeof draft;
    title: string;
    description: string;
  }[] = [
    {
      key: "analytics",
      title: t("cookie_pref_analytics_title", "Performance & Analytics Cookies"),
      description: t(
        "cookie_pref_analytics_desc",
        "These allow us to count unique visits, identify web traffic sources, and pinpoint system errors or crash zones. All data collected is aggregated and entirely anonymized."
      ),
    },
    {
      key: "functionality",
      title: t("cookie_pref_functionality_title", "Functionality Cookies"),
      description: t(
        "cookie_pref_functionality_desc",
        "These help our website remember choices you make, such as persistent language options, localized regional configurations, or custom dashboard preferences."
      ),
    },
    {
      key: "targeting",
      title: t("cookie_pref_targeting_title", "Targeting & Advertising Cookies"),
      description: t(
        "cookie_pref_targeting_desc",
        "These may be used by our marketing partners to build a light profile of your professional interests and display relevant software promotions to you on outside websites."
      ),
    },
  ];

  return (
    <Dialog
      open={isPreferenceCenterOpen}
      onClose={closePreferences}
      size="lg"
    >
      <Dialog.Panel>
        <Dialog.Title>
          <h2 className="mr-auto text-base font-medium">
            {t("cookie_pref_title", "Cookie Preference Center")}
          </h2>
        </Dialog.Title>
        <Dialog.Description className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">
                {t("cookie_pref_necessary_title", "Strictly Necessary Cookies")}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t(
                  "cookie_pref_necessary_desc",
                  "These cookies are essential for our website to function properly. They manage secure user log-ins, preserve active sessions, and secure billing areas. No personal profile data is tracked through these."
                )}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center">
              <FormSwitch.Input
                type="checkbox"
                checked
                disabled
                readOnly
              />
            </div>
          </div>

          {categories.map((category) => (
            <div
              key={category.key}
              className="flex items-start justify-between gap-4 border-t border-slate-200/60 pt-5 dark:border-darkmode-400"
            >
              <div>
                <FormLabel htmlFor={`cookie-pref-${category.key}`} className="font-medium">
                  {category.title}
                </FormLabel>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {category.description}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center">
                <FormSwitch.Input
                  id={`cookie-pref-${category.key}`}
                  type="checkbox"
                  checked={draft[category.key]}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      [category.key]: e.target.checked,
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </Dialog.Description>
        <Dialog.Footer>
          <Button
            type="button"
            variant="outline-secondary"
            className="mr-2"
            onClick={closePreferences}
          >
            {t("Cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => savePreferences(draft)}
          >
            {t("cookie_save_preferences", "Save My Preferences")}
          </Button>
        </Dialog.Footer>
      </Dialog.Panel>
    </Dialog>
  );
};

export default CookiePreferenceModal;
