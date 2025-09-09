import React, { useState, useEffect } from "react";
import loginImg from "@/assetsA/images/login (2).jpg";
import { FormInput, FormCheck } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import clsx from "clsx";
import { Link, useNavigate } from "react-router-dom";
import {
  loginAction,
  getUserAction,
  getCodeAction,
} from "@/actions/userActions";
import Alert from "@/components/Base/Alert";
import Lucide from "@/components/Base/Lucide";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import fallbackLogo from "@/assetsA/images/simVprLogo.png";
import "./loginStyle.css";
import { getSettingsAction } from "@/actions/settingAction";
// import Menu from "../Base/Headless/Menu";
import { Menu } from "@/components/Base/Headless";
import { getLanguageAction } from "@/actions/adminActions";

interface Language {
  id: number;
  name: string;
  code: string;
  flag: string;
  status: string;
}
function Main() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    api: "",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { i18n, t } = useTranslation();

  const navigate = useNavigate();

  useEffect(() => {
    const storedemail = localStorage.getItem("email");
    const storedPassword = localStorage.getItem("password");
    if (storedemail && storedPassword) {
      setFormData({ email: storedemail, password: storedPassword });
      setRememberMe(true);
    }
  }, []);

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    const reset = localStorage.getItem("reset");
    if (reset) {
      setShowSuccessAlert(true);
      localStorage.removeItem("reset");
    }
  }, []);

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

  const validateEmail = (email: string): boolean => {
    // Basic email validation regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = (): boolean => {
    const errors: Partial<typeof formErrors> = {};
    let isValid = true;

    // Email validation
    if (!formData.email.trim()) {
      errors.email = t("emailValidation1");
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = t("emailValidation3");
      isValid = false;
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = t("Passwordrequired");
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = t("Passwordleast6characters");
      isValid = false;
    }

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));

    return isValid;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const handleCheckboxChange = () => {
    setRememberMe((prev) => !prev);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop();
      if (cookieValue) {
        return cookieValue.split(";").shift();
      }
    }
    return undefined;
  };

  const fetchData = async (email: string) => {
    try {
      await getCodeAction(email);
    } catch (error) {
      console.error("Error fetching code:", error);
    }
  };

  useEffect(() => {
    const savedemail = getCookie("email");
    if (savedemail) {
      setFormData((prev) => ({ ...prev, email: savedemail }));
    }
  }, []);

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setFormErrors({ email: "", password: "", api: "" });

    try {
      const user = await getUserAction(formData.email);
      const email = user.uemail;

      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("rememberMe", rememberMe ? "true" : "false");

      const login = await loginAction(formDataToSend);

      if (login) {
        if (rememberMe) {
          document.cookie = `email=${formData.email}; max-age=${
            7 * 24 * 60 * 60
          }; path=/`;
        } else {
          document.cookie = `email=${formData.email}; path=/`;
        }

        localStorage.setItem("email", formData.email);
        localStorage.setItem("user", formData.email);
        localStorage.setItem("EmailsuccessMessage", "Email sent Successfully");

        const dataToSend = { email: email, password: formData.password };

        fetchData(formData.email);
        navigate("/verify", { state: { data: dataToSend } });
      } else {
        document.cookie = "email=; Max-Age=0; path=/";
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: "Authentication failed.",
        }));
      }
    } catch (error: any) {
      setShowAlert({
        variant: "danger",
        message: t("ErrorInLogin"),
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
      if (error.response.data.message == t("Usernotfound")) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: t("loginError1"),
        }));
      } else if (
        error.response.data.message == t("Useraccounthasbeendeleted")
      ) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: t("loginError2"),
        }));
      } else if (
        error.response.data.message == t("Organizationhasbeendeleted")
      ) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: t("loginError3"),
        }));
      } else if (error.response.data.message == t("Invalidemailorpassword")) {
        setShowAlert({
          variant: "danger",
          message: t("loginError4"),
        });

        setTimeout(() => {
          setShowAlert(null);
        }, 3000);
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: t("loginError4"),
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
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
                      i18n.changeLanguage(lang.code),
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
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

      {/* Left Side - Full Height Image */}
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
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {t("SignIn")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("Enteryourcredentialstoaccessyouraccount")}
            </p>
          </div>

          {/* Success & Error Alerts */}
          {showSuccessAlert && (
            <Alert variant="soft-success" className="flex items-center mb-6">
              <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />
              {t("PasswordResetSuccessfully")}
            </Alert>
          )}
          {formErrors.api && (
            <Alert variant="soft-danger" className="flex items-center mb-6">
              <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />
              {formErrors.api}
            </Alert>
          )}

          {/* Form Inputs */}

          <div className="space-y-6 ">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("enter_email")}
              </label>
              <FormInput
                type="text"
                id="email"
                className={clsx(
                  "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
                  {
                    "border-gray-300": !formErrors.email,
                    "border-red-500": formErrors.email,
                  }
                )}
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {formErrors.email && (
                <span className="text-red-500 text-sm mt-1 block">
                  {formErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("EnterPassword")}
              </label>
              <div className="relative">
                <FormInput
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  className={clsx(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12",
                    {
                      "border-gray-300": !formErrors.password,
                      "border-red-500": formErrors.password,
                    }
                  )}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password.trim()}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={togglePasswordVisibility}
                >
                  <Lucide
                    icon={passwordVisible ? "Eye" : "EyeOff"}
                    className="w-5 h-5"
                  />
                </button>
              </div>
              {formErrors.password && (
                <span className="text-red-500 text-sm mt-1 block">
                  {formErrors.password}
                </span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              {/* <div className="flex items-center">
                <FormCheck.Input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={handleCheckboxChange}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t("Rememberme")}
                </label>
              </div> */}
              <a
                href="/forgot"
                className="text-sm text-primary hover:text-primary"
              >
                {t("ForgotPassword")}
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 px-4 rounded-lg font-medium text-white bg-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
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
                t("Login")
              )}
            </Button>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              {t("Dontaccount")}{" "}
              <a href="/contact-us" className="text-primary hover:text-primary">
                {t("Contactadministrator")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
