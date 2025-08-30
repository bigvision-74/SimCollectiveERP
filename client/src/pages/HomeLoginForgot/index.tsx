import React, { useState, useEffect, useRef } from "react";
import illustrationUrl from "@/assets/images/illustration.svg";
import { FormInput, FormCheck } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import clsx from "clsx";
import { Link, useNavigate } from "react-router-dom";
import { resetLinkAction } from "@/actions/userActions";
import Alert from "@/components/Base/Alert";
import Lucide from "@/components/Base/Lucide";
import "./style.css";
import { t } from "i18next";
import fallbackLogo from "@/assetsA/images/simVprLogo.png";
import loginImg from "@/assetsA/images/login (2).jpg";
import { getSettingsAction } from "@/actions/settingAction";
import { getLanguageAction } from "@/actions/adminActions";
import { useTranslation } from "react-i18next";
import { Menu } from "@/components/Base/Headless";

interface Language {
  id: number;
  name: string;
  code: string;
  flag: string;
  status: string;
}
function Forgot() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  interface FormData {
    uemail: string;
  }

  interface FormErrors {
    uemail?: string;
    api?: string;
  }

  const [formData, setFormData] = useState<FormData>({
    uemail: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    uemail: "",
  });
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // get log icon
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await getSettingsAction();
        if (res?.logo) {
          setLogoUrl(res.logo);
        }
      } catch (error) {
        console.error("Failed to load logo from settings:", error);
      }
    };

    fetchLogo();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (canResend) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            setCanResend(false);
            setSuccessMessage("");
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [canResend]);

  const validateForm = (): boolean => {
    const errors: Partial<FormErrors> = {};

    if (!formData.uemail) {
      errors.uemail = t("enter_email");
      setLoading(false);
    }

    setFormErrors(errors as FormErrors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(false);
    setLoading(true);
    setSuccessMessage("");
    if (validateForm()) {
      try {
        const formDataToSend = new FormData();

        formDataToSend.append("email", formData.uemail);

        const sendLink = await resetLinkAction(formDataToSend);
        setLoading(false);
        setSuccessMessage(t("Linksentsuccessfully"));
        setCanResend(true);
      } catch (error) {
        console.log("Error : ", error);
        setFormErrors({ api: "Error occurred. Please try again." });
        setLoading(false);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "uemail") {
      setFormErrors((prev) => ({
        ...prev,
        uemail: !value ? "Email is required" : "",
      }));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const [languages, setLanguages] = React.useState<Language[]>([]);
  const fetchLanguage = async () => {
    try {
      const res = await getLanguageAction();
      const updatedLanguages = res.map((language: Language) => ({
        ...language,
        active: language.status === "active",
      }));

      setLanguages(updatedLanguages);
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  useEffect(() => {
    fetchLanguage();
  }, []);
  const currentLangLabel =
    languages.find((lang) => lang.code === i18n.language)?.name ||
    i18n.language;

  const currentLanguageFlag =
    languages.find((lang) => lang.code === i18n.language)?.flag ||
    i18n.language;

  return (
    <>
      <div className="flex h-screen">
        {/* language drop down  */}
        <div className="absolute top-12 right-4 z-50">
          <Menu>
            <Menu.Button
              as={Button}
              style={{
                border: "none",
                outline: "none",
                background: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <span className="text-white flex">
                <img
                  src={`https://flagcdn.com/w320/${currentLanguageFlag.toLowerCase()}.png`}
                  alt={`flag`}
                  className="mr-2 w-6 h-6"
                />
                <span className="text-dark">{currentLangLabel} </span>
              </span>
              <Lucide
                icon="ChevronDown"
                className="w-5 h-5 ml-2 text-dark"
                bold
              />
            </Menu.Button>
            <Menu.Items className="w-[11rem] mt-2 bg-white border  rounded-lg shadow-md max-h-60 overflow-y-auto z-50">
              {languages
                .filter((lang) => lang.status == "active")
                .map((lang, key) => (
                  <Menu.Item key={key}>
                    <button
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`flex items-center block p-2 w-full text-left text-black mr-5`}
                    >
                      <img
                        src={`https://flagcdn.com/w320/${lang.flag.toLowerCase()}.png`}
                        alt={`${lang.name} flag`}
                        className="mr-2 w-6 h-6"
                      />
                      <p className="text-grey-800">{lang.name}</p>
                    </button>
                  </Menu.Item>
                ))}
            </Menu.Items>
          </Menu>
        </div>
        {/* language drop down end  */}
        {/* BEGIN: Login Info */}
        <div className="w-1/2 hidden md:block relative">
          {/* Background Image */}
          <a href="/">
            <img
              className="absolute w-24 mt-12 ml-56 "
              src={logoUrl || fallbackLogo}
              alt="SimVPR Logo"
            />
          </a>
          <img
            src={loginImg}
            alt="Side Visual"
            className="w-full h-full object-cover"
          />

          {/* Logo Overlay */}
        </div>
        {/* END: Login Info */}
        {/* BEGIN: Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            {/* <Lucide
                  icon='ArrowLeftCircle'
                  className='w-10 h-10 -mt-36 mb-40'
                  onClick={handleBackToLogin}
                />{' '} */}
            <Lucide
              icon="ArrowLeftCircle"
              className="w-10 h-10 mb-10 leftArrow cursor-pointer text-primary"
              onClick={handleBackToLogin}
            />
            {formErrors.api && (
              <Alert variant="soft-danger" className="flex items-center mb-2">
                <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />{" "}
                {formErrors.api}
              </Alert>
            )}
            {successMessage && (
              <Alert variant="soft-success" className="flex items-center mb-2">
                <Lucide icon="CheckCircle" className="w-6 h-6 mr-2" />{" "}
                {successMessage}
              </Alert>
            )}
            <h2 className="text-3xl font-bold text-gray-800 mb-2 ">
              {t("ForgotPassword1")}
            </h2>
            <p className="text-gray-600 mb-8">{t("Enteryouremailto")}</p>
            <div className="mt-8 intro-x">
              <FormInput
                id="crud-form-1"
                type="text"
                className="block px-4 py-3 intro-x min-w-full xl:min-w-[350px] mb-2"
                name="uemail"
                placeholder={t("email")}
                value={formData.uemail}
                onChange={handleInputChange}
              />
              {formErrors.uemail && (
                <p className="text-red-500 text-sm">{formErrors.uemail}</p>
              )}
            </div>
            <div className="mt-5 text-center intro-x xl:mt-8 xl:text-left">
              <Button
                onClick={handleSubmit}
                variant="primary"
                className="min-w-[160px] px-4 py-3 text-center align-top xl:mr-3"
                disabled={loading || canResend}
              >
                {loading ? (
                  <div className="loader">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : canResend ? (
                  `${t("ResendLink")} (${countdown}s)`
                ) : (
                  <>{t("SendLink")}</>
                )}
              </Button>
            </div>
          </div>
        </div>
        {/* END: Login Form */}
      </div>
    </>
  );
}

export default Forgot;
