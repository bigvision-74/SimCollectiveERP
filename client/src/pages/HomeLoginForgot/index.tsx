import { useState, useEffect } from "react";
import logoUrl from "@/assetsA/images/Final-logo-InsightXR.png";
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
import { useTranslation } from "react-i18next";

function Forgot() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  interface FormData {
    username: string;
  }

  interface FormErrors {
    username?: string;
    api?: string;
  }

  const [formData, setFormData] = useState<FormData>({
    username: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    username: "",
  });
  const [successMessage, setSuccessMessage] = useState<string>("");
  // const [linkerror, setLinkerror] = useState(false)
  // const [linksuccess, setLinksuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

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

    if (!formData.username) {
      errors.username = t("Enterusername");
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

        formDataToSend.append("username", formData.username);

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
    if (name === "username") {
      setFormErrors((prev) => ({
        ...prev,
        username:
          value && value.length < 4
            ? "Username must contain at least 4 characters"
            : "",
      }));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleBackToLogin = () => {
    navigate("/login");
  };
  return (
    <>
      <div
        className={clsx([
          "p-3 sm:px-8 relative h-screen lg:overflow-hidden xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600",
          "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-[#0f1f39]/20 before:rounded-[100%] before:dark:bg-darkmode-400",
          "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:rounded-[100%] after:dark:bg-darkmode-900 after:bg-black/50 loginBg loginBgforget",
        ])}
      >
        <div className="container relative z-10 sm:px-10">
          <div className="block grid-cols-2 gap-4 xl:grid">
            {/* BEGIN: Login Info */}
            <div className="flex-col hidden min-h-screen xl:flex">
              <div className="pt-5 -intro-x">
                <Link to="/" className="inline-block">
                  <img
                    alt="Midone Tailwind HTML Admin Template"
                    className="w-100 sm:w-10 md:w-12 lg:w-16 xl:w-80 block visible XrLogoLogin"
                    src={logoUrl}
                  />
                </Link>
              </div>
              <div className="my-auto">
                {/* <img
                  alt='Midone Tailwind HTML Admin Template'
                  className='w-1/2 -mt-16 -intro-x'
                  src={illustrationUrl}
                /> */}
                <div className="-mt-20 text-4xl font-bold leading-tight text-white -intro-x max-w-xl xl:max-w-lg">
                  <span>{t("Empower")}</span>
                  <p className="mt-2">{t("streamlined")}</p>
                </div>
                <div className="mt-5 text-lg text-white -intro-x text-opacity-70 dark:text-slate-400"></div>
              </div>
            </div>
            {/* END: Login Info */}
            {/* BEGIN: Login Form */}
            <div className="flex items-center justify-center min-h-screen py-5 xl:h-auto xl:py-0">
              <div
                className="w-[600px] h-[450px] px-5 py-8 rounded-md shadow-md xl:ml-20 xl:p-14 
                 bg-[#0200007e] dark:bg-darkmode-600 sm:px-8 xl:shadow-none overflow-hidden"
              >
                {/* <Lucide
                  icon='ArrowLeftCircle'
                  className='w-10 h-10 -mt-36 mb-40'
                  onClick={handleBackToLogin}
                />{' '} */}
                <Lucide
                  icon="ArrowLeftCircle"
                  className="w-10 h-10 mb-10 leftArrow cursor-pointer text-white"
                  onClick={handleBackToLogin}
                />
                {formErrors.api && (
                  <Alert
                    variant="soft-danger"
                    className="flex items-center mb-2"
                  >
                    <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />{" "}
                    {formErrors.api}
                  </Alert>
                )}
                {successMessage && (
                  <Alert
                    variant="soft-success"
                    className="flex items-center mb-2"
                  >
                    <Lucide icon="CheckCircle" className="w-6 h-6 mr-2" />{" "}
                    {successMessage}
                  </Alert>
                )}
                <h2 className="text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left text-white">
                  {t("ForgotPassword1")}
                </h2>

                <div className="mt-8 intro-x">
                  <FormInput
                    id="crud-form-1"
                    type="text"
                    className="block px-4 py-3 intro-x min-w-full xl:min-w-[350px] mb-2"
                    name="username"
                    placeholder={t("Username")}
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                  {formErrors.username && (
                    <p className="text-red-500 text-sm">
                      {formErrors.username}
                    </p>
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
                      <>
                        {t("SendLink")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* END: Login Form */}
          </div>
        </div>
      </div>
    </>
  );
}

export default Forgot;
