import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import clsx from "clsx";
import logoUrl from "@/assetsA/images/simVprLogo.png";
import { FormInput } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import Alert from "@/components/Base/Alert";
import Lucide from "@/components/Base/Lucide";
import { resetPasswordAction } from "@/actions/userActions";
import { useTranslation } from "react-i18next";
import loginImg from "@/assetsA/images/login (2).jpg";
import fallbackLogo from "@/assetsA/images/simVprLogo.png";
import { getLanguageAction } from "@/actions/adminActions";
import { Menu } from "@/components/Base/Headless";
import { getSettingsAction } from "@/actions/settingAction";
interface Language {
  id: number;
  name: string;
  code: string;
  flag: string;
  status: string;
}
function ResetPassword() {
  const { i18n, t } = useTranslation();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const passwordErrors: string[] = [];
  const useQuery = () => {
    const { search } = useLocation();
    return new URLSearchParams(search);
  };

  const query = useQuery();
  const token: string = query.get("token") ?? "defaultToken";
  const type = query.get("type");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({
    password: "",
    confirmPassword: "",
    api: "",
  });

  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: Partial<typeof formErrors> = {};

    const passwordErrors = [];

    if (!formData.password) {
      errors.password = " Password is required.";
    }
    if (formData.password.length < 8) {
      passwordErrors.push("8 characters");
    }
    if (!/(?=.*[a-z])/.test(formData.password)) {
      passwordErrors.push("one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      passwordErrors.push("one uppercase letter");
    }
    if (!/(?=.*\d)/.test(formData.password)) {
      passwordErrors.push("one digit");
    }
    if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      passwordErrors.push("one special character");
    }

    if (passwordErrors.length > 0) {
      errors.password = `Password must contain: ${passwordErrors.join(", ")}`;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm Password is required.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      if (value.length < 8) {
        passwordErrors.push("8 characters");
      }
      if (!/(?=.*[a-z])/.test(value)) {
        passwordErrors.push("one lowercase letter");
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        passwordErrors.push("one uppercase letter");
      }
      if (!/(?=.*\d)/.test(value)) {
        passwordErrors.push("one digit");
      }
      if (!/(?=.*[@$!%*?&])/.test(value)) {
        passwordErrors.push("one special character");
      }

      setFormErrors((prev) => ({
        ...prev,
        password:
          passwordErrors.length > 0
            ? `Password must contain: ${passwordErrors.join(", ")}`
            : "",
      }));
    } else if (name === "confirmPassword") {
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== formData.password ? "Passwords do not match." : "",
      }));
    }
  };

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

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };
  const toggleconfirmPasswordVisibility = () => {
    setConfirmPasswordVisible((prev) => !prev);
  };

  const handleSubmit = async () => {
    setLoading(false);
    if (validateForm()) {
      setLoading(true);
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        api: "",
      }));
      try {
        // const loginUserFirebase = await loginUser(email, formData.password);

        // if (loginUserFirebase) {
        const formDataToSend = new FormData();
        formDataToSend.append("password", formData.password);
        formDataToSend.append("token", token);
        formDataToSend.append("type", type || "");

        const resetPassword = await resetPasswordAction(formDataToSend);

        if (resetPassword) {
          localStorage.setItem("reset", "Password Reset");
          navigate("/login");
        } else {
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            api:
              resetPassword.message ||
              "Reset password failed. Please try again.",
          }));
        }
      } catch (error: any) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api:
            error.response?.data?.message ||
            "An error occurred. Please try again.",
        }));
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
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
                    onClick={() => {
                      i18n.changeLanguage(lang.code)
                    }}
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
      <div className="w-1/2 hidden md:block relative">
        {/* Background Image */}
        <a href="/">
          <img
            className="absolute w-24 mt-12 ml-56 "
            src={logoUrl || fallbackLogo}
            alt="InpatientSIM Logo"
          />
        </a>
        <img
          src={loginImg}
          alt="Side Visual"
          className="w-full h-full object-cover"
        />

        {/* Logo Overlay */}
        {/* <img
          src={logoUrl}
          alt="Company Logo"
          className="h-12 absolute top-6 left-6 z-10"
        /> */}
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md mx-auto">
          {formErrors.api && (
            <Alert variant="soft-danger" className="flex items-center mb-2">
              <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />{" "}
              {formErrors.api}
            </Alert>
          )}

          {/* <Lucide
            icon="ArrowLeftCircle"
            className="w-10 h-10 mb-10 leftArrow cursor-pointer text-primary"
            onClick={handleBackToLogin}
          /> */}
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {type === "set" ? t("SetPassword") : t("ResetPassword")}
          </h2>
          <p className="text-gray-600 mb-8">{t("Createnewaccount")}</p>

          <div className="mt-8 intro-x">
            <div className="relative mt-4 w-full xl:w-[350px]">
              <FormInput
                type={passwordVisible ? "text" : "password"}
                className="block px-4 py-3 pr-10 w-full mb-2"
                name="password"
                placeholder={t("EnterPassword")}
                value={formData.password.trim()}
                onChange={handleInputChange}
                aria-describedby="password-error"
                style={{ zIndex: 1 }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                style={{ zIndex: 2 }}
                onClick={togglePasswordVisibility}
              >
                <Lucide
                  icon={passwordVisible ? "Eye" : "EyeOff"}
                  className="w-4 h-4 "
                />
              </button>
            </div>
            <div className="min-h-[1.5rem]">
              {formErrors.password && (
                <span id="password-error" className="text-red-500 mt-1">
                  {formErrors.password}
                </span>
              )}
            </div>
            <div className="relative mt-4 w-full xl:w-[350px]">
              <FormInput
                type={confirmPasswordVisible ? "text" : "password"}
                className="block px-4 py-3 pr-10 w-full mb-2"
                name="confirmPassword"
                placeholder={t("ConfirmNewPassword")}
                value={formData.confirmPassword.trim()}
                onChange={handleInputChange}
                aria-describedby="confirm-password-error"
                style={{ zIndex: 1 }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                style={{ zIndex: 2 }}
                onClick={toggleconfirmPasswordVisibility}
              >
                <Lucide
                  icon={confirmPasswordVisible ? "Eye" : "EyeOff"}
                  className="w-4 h-4 "
                />
              </button>
            </div>
          </div>
          <div className="min-h-[1.5rem]">
            {formErrors.confirmPassword && (
              <span id="confirm-password-error" className="text-red-500 mt-1">
                {formErrors.confirmPassword}
              </span>
            )}
          </div>
          <div className="mt-5 text-center intro-x xl:mt-8 xl:text-left">
            <Button
              variant="primary"
              className="w-full px-4 py-3 align-top xl:w-32 xl:mr-3"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <div className="loader">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
