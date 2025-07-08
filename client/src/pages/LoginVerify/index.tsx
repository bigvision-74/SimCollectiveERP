import React, { useState, useEffect } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import logoUrl from "@/assetsA/images/Final-logo-InsightXR.png";
import loginImg from "@/assetsA/images/login (2).jpg";
import illustrationUrl from "@/assets/images/illustration.svg";
import { FormInput, FormCheck, FormLabel } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import clsx from "clsx";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  verifyAction,
  getCodeAction,
  addOnlineUserAction,
  getUserAction,
} from "@/actions/userActions";
import Alert from "@/components/Base/Alert";
import Lucide from "@/components/Base/Lucide";
import { loginUser } from "@/actions/authAction";
import { t } from "i18next";
import Alerts from "@/components/Alert";

function Main() {
  const navigate = useNavigate();

  const location = useLocation();
  const { data } = location.state || {};

  interface FormData {
    code: string;
  }

  interface FormErrors {
    code?: string;
  }

  const [formData, setFormData] = useState<FormData>({
    code: "",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showAlerterror, setShowAlerterror] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingotp, setLoadingotp] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.code) {
      errors.code = "Enter OTP";
    } else if (formData.code.length < 6) {
      errors.code = "Code must be 6 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target;
    const { name, value } = target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    const errors: Partial<typeof formErrors> = {};
    if (name === "code") {
      if (!value) {
        errors.code = "";
      } else if (value.length < 6) {
        errors.code = "Code must be at least 6 characters";
      } else {
        errors.code = "";
      }
    }

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));
  };

  const user = localStorage.getItem("user");

  // useEffect(() => {
  //   if (user === null) {
  //     console.error('User not found in localStorage');
  //     return;
  //   }

  //   const fetchData = async () => {
  //     try {
  //       await getCodeAction(user);
  //       localStorage.setItem('status', 'true');
  //     } catch (error) {
  //       console.error('Error fetching code:', error);
  //     }
  //   };
  //   fetchData();
  // }, [user]);

  const ResendOtp = async () => {
    setLoadingotp(false);

    try {
      setLoadingotp(true);
      if (user) {
        const resend = await getCodeAction(user);
        localStorage.setItem("status", "true");

        if (resend) {
          setLoadingotp(false);

          setShowAlert({
            variant: "success",
            message: t("resent"),
          });

          setTimeout(() => {
            setShowAlert(null);
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error fetching code:", error);
    }
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlerterror(false);

    if (validateForm()) {
      setLoading(true);

      try {
        if (user === null) {
          console.error("User not found in localStorage");
          return;
        }
        // console.log(user, "user");
        const formDataToSend = new FormData();
        formDataToSend.append("code", formData.code);
        formDataToSend.append("email", user);

        const verifiedResponse = await verifyAction(formDataToSend);

        if (verifiedResponse) {
          const loginUserFirebase = await loginUser(data.email, data.password);
          if (loginUserFirebase) {
            const FormDataOnlineUser = new FormData();
            let ipAddress;
            let latitudeData: string | undefined;
            let longitudeData: string | undefined;
            let cityData: string | undefined;

            const getIpAddress = async () => {
              try {
                const response = await fetch(
                  "https://api.ipify.org?format=json"
                );
                const data = await response.json();
                return data.ip;
              } catch (error) {
                console.error("Error fetching IP address:", error);
              }
            };

            const getGeolocationByIp = async (ipAddress: string) => {
              const url = `https://get.geojs.io/v1/ip/geo/${ipAddress}.json`;
              try {
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error("Network response was not ok");
                }
                const data = await response.json();

                const { latitude, longitude, country_code } = data;
                latitudeData = latitude;
                longitudeData = longitude;
                cityData = country_code;
              } catch (error) {
                console.error("Error fetching geolocation data:", error);
              }
            };

            const role = localStorage.getItem("role");

            if (role != "superadmin") {
              const submitFormWithLocationData = async () => {
                try {
                  const users = await getUserAction(user);
                  const userId = users.id;
                  ipAddress = await getIpAddress();
                  await getGeolocationByIp(ipAddress);
                  FormDataOnlineUser.append("ipAddress", ipAddress);
                  FormDataOnlineUser.append("latitude", latitudeData || "null");
                  FormDataOnlineUser.append(
                    "longitude",
                    longitudeData || "null"
                  );
                  FormDataOnlineUser.append("city", cityData || "null");
                  FormDataOnlineUser.append("userid", userId);
                  const onlineUser = await addOnlineUserAction(
                    FormDataOnlineUser
                  );
                } catch (error) {
                  console.error("Error submitting form:", error);
                }
              };
              submitFormWithLocationData();
            }

            localStorage.setItem("role", verifiedResponse.data.role);
            localStorage.setItem("successMessage", "Login successful");

            switch (verifiedResponse.data.role) {
              case "superadmin":
                navigate("/dashboard");
                break;
              case "admin":
                navigate("/dashboard-admin");
                break;
              case "manager":
                navigate("/dashboard-instructor");
                break;
              case "worker":
                navigate("/dashboard-user");
                break;
              default:
                console.error("Unknown role:", verifiedResponse.data.role);
            }
          }
        } else {
          console.error("Verification failed");
          setShowAlerterror(true);
        }
      } catch (error: any) {
        console.error("Error:", error);
        const errorMessage =
          error.response?.data?.message ||
          "An error occurred during verification";
        setShowAlerterror(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const [ShowEmailSuccessAlert, setShowEmailSuccessAlert] = useState(false);

  useEffect(() => {
    const EmailsuccessMessage = localStorage.getItem("EmailsuccessMessage");
    if (EmailsuccessMessage) {
      setShowEmailSuccessAlert(true);
      localStorage.removeItem("EmailsuccessMessage");
    }
  }, []);

  const handleBackToLogin = () => {
    navigate("/login");
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

      {/* Right Side - Verification Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md mx-auto">
          <div
            className="flex items-center mb-6 cursor-pointer"
            onClick={handleBackToLogin}
          >
            <Lucide icon="ArrowLeft" className="w-5 h-5 mr-2 text-gray-600" />
            <span className="text-gray-600 hover:text-gray-800">
              Back to login
            </span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {t("Verification")}
          </h2>
          <p className="text-gray-600 mb-8">{t("reallyyou")}</p>

          {showAlerterror && (
            <Alert variant="soft-danger" className="flex items-center mb-6">
              <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />
              {showAlerterror}
            </Alert>
          )}

          {ShowEmailSuccessAlert && (
            <Alert variant="soft-success" className="flex items-center mb-6">
              <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />
              {t("Emailsentsuccessfully")}
            </Alert>
          )}

          {showAlert && (
            <Alert
              variant={showAlert.variant}
              className="flex items-center mb-6"
            >
              <Lucide
                icon={
                  showAlert.variant === "success"
                    ? "CheckSquare"
                    : "AlertTriangle"
                }
                className="w-6 h-6 mr-2"
              />
              {showAlert.message}
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("EnterVerificationCode")}
              </label>
              <FormInput
                type="text"
                id="code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                name="code"
                placeholder="Enter 6-digit code"
                value={formData.code}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {formErrors.code && (
                <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
              )}
            </div>

            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <Button
                variant="primary"
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
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
                    Verifying...
                  </div>
                ) : (
                  t("Verify")
                )}
              </Button>

              <Button
                variant="outline-secondary"
                className="w-full py-3 px-4 rounded-lg font-medium text-blue-600 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                onClick={ResendOtp}
                disabled={loadingotp}
              >
                {loadingotp ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
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
                    Sending...
                  </div>
                ) : (
                  t("ResendOTP")
                )}
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Didn't receive the code?{" "}
              <button
                onClick={ResendOtp}
                className="text-blue-600 hover:text-blue-800"
              >
                {t("ResendOTP")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
