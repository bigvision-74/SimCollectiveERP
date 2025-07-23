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


function Main() {
  const { t } = useTranslation();
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
      errors.email = t("Email is required");
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = t("Please enter a valid email address");
      isValid = false;
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = t("Password is required");
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = t("Password must be at least 6 characters");
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
      const userId = user.id;

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
      if (error.response.data.message == "User not found") {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: t("loginError1"),
        }));
      } else if (
        error.response.data.message == "User account has been deleted"
      ) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: t("loginError2"),
        }));
      } else if (
        error.response.data.message == "Organization has been deleted"
      ) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api: t("loginError3"),
        }));
      } else if (error.response.data.message == "Invalid email or password") {
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

  return (
    <div className="flex h-screen">
      {/* Left Side - Full Height Image */}
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

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {t("SignIn")}
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your credentials to access your account
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
          <div className="space-y-6">
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
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("LoggingIn")}
                </div>
              ) : (
                t("Login")
              )}
            </Button>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Don't have an account?{" "}
              <a href="/contact-us" className="text-primary hover:text-primary">
                Contact administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
