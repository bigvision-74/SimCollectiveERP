// import React, { useState, useEffect } from "react";
// import logoUrl from "@/assets/images/Final-logo-InsightXR.png";
// import { FormInput, FormCheck } from "@/components/Base/Form";
// import Button from "@/components/Base/Button";
// import clsx from "clsx";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   loginAction,
//   getUserAction,
//   getCodeAction,
// } from "@/actions/userActions";
// import Alert from "@/components/Base/Alert";
// import Lucide from "@/components/Base/Lucide";
// import { t } from "i18next";
// import { useTranslation } from "react-i18next";

// import "./loginStyle.css";
// // import axios from 'axios';
// // import LoadingIcon from '@/components/Base/LoadingIcon';
// function Main() {
//   const { t } = useTranslation();

//   const [passwordVisible, setPasswordVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [showAlert, setShowAlert] = useState<{
//     variant: "success" | "danger";
//     message: string;
//   } | null>(null);
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//   });
//   const [formErrors, setFormErrors] = useState({
//     username: "",
//     password: "",
//     api: "",
//   });

//   const navigate = useNavigate();

//   useEffect(() => {
//     const storedUsername = localStorage.getItem("username");
//     const storedPassword = localStorage.getItem("password");
//     if (storedUsername && storedPassword) {
//       setFormData({
//         username: storedUsername,
//         password: storedPassword,
//       });
//       setRememberMe(true);
//     }
//   }, []);

//   const [showSuccessAlert, setShowSuccessAlert] = useState(false);

//   useEffect(() => {
//     const reset = localStorage.getItem("reset");
//     if (reset) {
//       setShowSuccessAlert(true);
//       localStorage.removeItem("reset");
//     }
//   }, []);

//   const validateForm = (): boolean => {
//     const errors: Partial<typeof formErrors> = {};

//     setFormErrors((prevErrors) => ({
//       ...prevErrors,
//       ...errors,
//     }));

//     return Object.keys(errors).length === 0;
//   };

//   const handleInputChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     const errors: Partial<typeof formErrors> = {};

//     setFormErrors((prevErrors) => ({
//       ...prevErrors,
//       ...errors,
//     }));
//   };

//   const handleCheckboxChange = () => {
//     setRememberMe((prev) => !prev);
//   };

//   const togglePasswordVisibility = () => {
//     setPasswordVisible((prev) => !prev);
//   };

//   const getCookie = (name: string) => {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) {
//       const cookieValue = parts.pop();
//       if (cookieValue) {
//         return cookieValue.split(";").shift();
//       }
//     }
//     return undefined;
//   };

//   // const user = localStorage.getItem('user');

//   const fetchData = async (username: string) => {
//     try {
//       await getCodeAction(username);
//     } catch (error) {
//       console.error("Error fetching code:", error);
//     }
//   };

//   useEffect(() => {
//     const savedUsername = getCookie("username");
//     if (savedUsername) {
//       setFormData((prev) => ({ ...prev, username: savedUsername }));
//     }
//   }, []);
//   const handleSubmit = async () => {
//     setLoading(false);
//     setShowAlert(null);
//     if (validateForm()) {
//       setLoading(true);
//       setFormErrors({ username: "", password: "", api: "" });
//       try {
//         const user = await getUserAction(formData.username);
//         const email = user.uemail;
//         const userId = user.id;

//         // if (loginUserFirebase) {
//         const formDataToSend = new FormData();
//         formDataToSend.append("username", formData.username);
//         formDataToSend.append("password", formData.password);
//         formDataToSend.append("rememberMe", rememberMe ? "true" : "false");
//         // formDataToSend.append('idToken', loginUserFirebase.idToken);

//         const login = await loginAction(formDataToSend);

//         if (login) {
//           if (rememberMe) {
//             document.cookie = `username=${formData.username}; max-age=${
//               7 * 24 * 60 * 60
//             }; path=/`;
//           } else {
//             document.cookie = `username=${formData.username}; path=/`;
//           }

//           localStorage.setItem("username", formData.username);
//           localStorage.setItem("user", formData.username);
//           localStorage.setItem(
//             "EmailsuccessMessage",
//             "Email sent Successfully"
//           );

//           const dataToSend = { email: email, password: formData.password };
//           fetchData(formData.username);
//           navigate("/verify", { state: { data: dataToSend } });
//         } else {
//           document.cookie = "username=; Max-Age=0; path=/";
//           setFormErrors((prevErrors) => ({
//             ...prevErrors,
//             api: "Authentication failed.",
//           }));
//         }
//       } catch (error: any) {
//         setShowAlert({
//           variant: "danger",
//           message: t("ErrorInLogin"),
//         });

//         setTimeout(() => {
//           setShowAlert(null);
//         }, 3000);
//         if (error.response.data.message == "User not found") {
//           setFormErrors((prevErrors) => ({
//             ...prevErrors,
//             api: t("loginError1"),
//           }));
//         } else if (
//           error.response.data.message == "User account has been deleted"
//         ) {
//           setFormErrors((prevErrors) => ({
//             ...prevErrors,
//             api: t("loginError2"),
//           }));
//         } else if (
//           error.response.data.message == "Organization has been deleted"
//         ) {
//           setFormErrors((prevErrors) => ({
//             ...prevErrors,
//             api: t("loginError3"),
//           }));
//         } else if (
//           error.response.data.message == "Invalid username or password"
//         ) {
//           setFormErrors((prevErrors) => ({
//             ...prevErrors,
//             api: t("loginError4"),
//           }));
//         }
//       } finally {
//         setLoading(false);
//       }
//     }
//   };
//   const handleKeyDown = (e: any) => {
//     if (e.key === "Enter") {
//       handleSubmit();
//     }
//   };

//   return (
//     <>
//       <div
//         className={clsx([
//           "p-3 sm:px-8 relative h-screen lg:overflow-hidden xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600",
//           "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-[#0f1f39]/20 before:rounded-[100%] before:dark:bg-darkmode-400",
//           "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:rounded-[100%] after:dark:bg-darkmode-900 after:bg-black/50 loginBg",
//         ])}
//       >
//         <main />
//         <div className="container relative z-10 sm:px-10">
//           <div className="block grid-cols-2 gap-4 xl:grid">
//             <div className="flex flex-col min-h-screen">
//               <div className="pt-5 -intro-x">
//                 <Link to="/" className="inline-block">
//                   <img
//                     alt="Midone Tailwind HTML Admin Template"
//                     className="w-100 sm:w-10 md:w-12 lg:w-16 xl:w-80 block visible XrLogoLogin"
//                     src={logoUrl}
//                   />
//                 </Link>
//               </div>

//               <div className="my-auto">
//                 <div className="-mt-20 text-4xl font-bold leading-tight text-white -intro-x max-w-xl xl:max-w-lg">
//                   <span>{t("Empower")}</span>
//                   <p className="mt-2">{t("streamlined")}</p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center justify-center min-h-screen py-5 xl:h-auto xl:py-0">
//               <div
//                 className="w-[500px] h-[450px] px-5 py-8 rounded-md shadow-md xl:ml-20 xl:p-14
//                  bg-[#0200007e] dark:bg-darkmode-600 sm:px-8 xl:shadow-none overflow-hidden"
//               >
//                 {showSuccessAlert && (
//                   <Alert
//                     variant="soft-success"
//                     className="flex items-center mb-2"
//                   >
//                     <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />{" "}
//                     {t("PasswordResetSuccessfully")}
//                   </Alert>
//                 )}
//                 {formErrors.api && (
//                   <Alert
//                     variant="soft-danger"
//                     className="flex items-center mb-2"
//                   >
//                     <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />{" "}
//                     {formErrors.api}
//                   </Alert>
//                 )}
//                 <h2 className="text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left text-white">
//                   {t("SignIn")}
//                 </h2>
//                 <div className="mt-8 intro-x">
//                   <FormInput
//                     type="text"
//                     className="block px-4 py-3 intro-x min-w-full xl:min-w-[350px] mb-2"
//                     name="username"
//                     placeholder={t("EnterUsername")}
//                     value={formData.username}
//                     onChange={handleInputChange}
//                     aria-describedby="username-error"
//                     onKeyDown={(e) => handleKeyDown(e)}
//                   />
//                   {formErrors.username && (
//                     <span id="username-error" className="text-red-500 ">
//                       {formErrors.username}
//                     </span>
//                   )}
//                   <div className="relative mt-4">
//                     <FormInput
//                       type={passwordVisible ? "text" : "password"}
//                       className="block px-4 py-3 pr-10 intro-x min-w-full xl:min-w-[350px] mb-2"
//                       name="password"
//                       placeholder={t("EnterPassword")}
//                       value={formData.password.trim()}
//                       onChange={handleInputChange}
//                       aria-describedby="password-error"
//                       style={{ zIndex: 1 }}
//                       onKeyDown={(e) => handleKeyDown(e)}
//                     />
//                     <button
//                       type="button"
//                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
//                       style={{ zIndex: 2 }}
//                       onClick={togglePasswordVisibility}
//                     >
//                       <Lucide
//                         icon={passwordVisible ? "Eye" : "EyeOff"}
//                         className="w-4 h-4 "
//                       />
//                     </button>
//                   </div>
//                   {formErrors.password && (
//                     <span id="password-error" className="text-red-500 ">
//                       {formErrors.password}
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex mt-4 text-xs intro-x text-slate-600 dark:text-slate-500 sm:text-sm">
//                   <div className="flex items-center mr-auto">
//                     <FormCheck.Input
//                       id="remember-me"
//                       type="checkbox"
//                       className="mr-2 border"
//                       checked={rememberMe}
//                       onChange={handleCheckboxChange}
//                     />
//                     <label
//                       className="cursor-pointer select-none font-normal text-white"
//                       htmlFor="remember-me"
//                     >
//                       {t("Rememberme")}
//                     </label>
//                   </div>
//                   <a className="text-white" href="/forgot">
//                     {t("ForgotPassword")}
//                   </a>
//                 </div>
//                 <div className="mt-5 text-center intro-x xl:mt-8 xl:text-left">
//                   <Button
//                     type="submit"
//                     variant="primary"
//                     className="w-full px-4 py-3 align-top xl:w-32 xl:mr-3 mb-5"
//                     onClick={handleSubmit}
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <div className="loader">
//                         <div className="dot"></div>
//                         <div className="dot"></div>
//                         <div className="dot"></div>
//                       </div>
//                     ) : (
//                       t("Login")
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default Main;

import React, { useState, useEffect } from "react";
import logoUrl from "@/assets/images/Final-logo-InsightXR.png";
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

import "./loginStyle.css";

function Main() {
  const { t } = useTranslation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    username: "",
    password: "",
    api: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedPassword = localStorage.getItem("password");
    if (storedUsername && storedPassword) {
      setFormData({
        username: storedUsername,
        password: storedPassword,
      });
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

  const validateForm = (): boolean => {
    const errors: Partial<typeof formErrors> = {};

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

    const errors: Partial<typeof formErrors> = {};

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));
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

  // const user = localStorage.getItem('user');

  const fetchData = async (username: string) => {
    try {
      await getCodeAction(username);
    } catch (error) {
      console.error("Error fetching code:", error);
    }
  };

  useEffect(() => {
    const savedUsername = getCookie("username");
    if (savedUsername) {
      setFormData((prev) => ({ ...prev, username: savedUsername }));
    }
  }, []);
  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);
    if (validateForm()) {
      setLoading(true);
      setFormErrors({ username: "", password: "", api: "" });
      try {
        const user = await getUserAction(formData.username);
        const email = user.uemail;
        const userId = user.id;

        // if (loginUserFirebase) {
        const formDataToSend = new FormData();
        formDataToSend.append("username", formData.username);
        formDataToSend.append("password", formData.password);
        formDataToSend.append("rememberMe", rememberMe ? "true" : "false");
        // formDataToSend.append('idToken', loginUserFirebase.idToken);

        const login = await loginAction(formDataToSend);

        if (login) {
          if (rememberMe) {
            document.cookie = `username=${formData.username}; max-age=${
              7 * 24 * 60 * 60
            }; path=/`;
          } else {
            document.cookie = `username=${formData.username}; path=/`;
          }

          localStorage.setItem("username", formData.username);
          localStorage.setItem("user", formData.username);
          localStorage.setItem(
            "EmailsuccessMessage",
            "Email sent Successfully"
          );

          const dataToSend = { email: email, password: formData.password };
          fetchData(formData.username);
          navigate("/verify", { state: { data: dataToSend } });
        } else {
          document.cookie = "username=; Max-Age=0; path=/";
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
        } else if (
          error.response.data.message == "Invalid username or password"
        ) {
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            api: t("loginError4"),
          }));
        }
      } finally {
        setLoading(false);
      }
    }
  };
  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };
  return (
    <>
      <div
        className={clsx([
          "p-3 sm:px-8 relative h-screen lg:overflow-hidden xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600",
          "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-[#0f1f39]/20 before:rounded-[100%] before:dark:bg-darkmode-400",
          "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:rounded-[100%] after:dark:bg-darkmode-900 after:bg-black/50 loginBg",
        ])}
      >
        <div className="container relative z-10 sm:px-10">
          <div className="block grid-cols-2 gap-4 xl:grid">
            {/* Left side - hidden on mobile */}
            <div className="hidden xl:flex flex-col min-h-screen">
              <div className="pt-5 -intro-x">
                <Link to="/" className="inline-block">
                  <img
                    alt="Midone Tailwind HTML Admin Template"
                    className="w-80 block visible XrLogoLogin"
                    src="#"
                  />
                </Link>
              </div>
              <div className="my-auto">
                <div className="-mt-20 text-4xl font-bold leading-tight text-white -intro-x max-w-xl xl:max-w-lg">
                  <span>{t("Empower")}</span>
                  <p className="mt-2">{t("streamlined")}</p>
                </div>
              </div>
            </div>

            {/* Right side - form - always visible */}
            <div className="flex items-center justify-center min-h-screen py-5 xl:h-auto xl:py-0">
              <div
                className="w-full max-w-md px-5 py-8 rounded-md shadow-md xl:ml-20 xl:p-14 
                 bg-[#0200007e] dark:bg-darkmode-600 sm:px-8 xl:shadow-none overflow-hidden"
              >
                {/* Show logo on mobile */}
                <div className="xl:hidden mb-6 text-center">
                  <Link to="/" className="inline-block">
                    <img
                      alt="Midone Tailwind HTML Admin Template"
                      className="w-40 mx-auto block XrLogoLogin"
                      src="#"
                    />
                  </Link>
                </div>

                {showSuccessAlert && (
                  <Alert
                    variant="soft-success"
                    className="flex items-center mb-2"
                  >
                    <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />{" "}
                    {t("PasswordResetSuccessfully")}
                  </Alert>
                )}
                {formErrors.api && (
                  <Alert
                    variant="soft-danger"
                    className="flex items-center mb-2"
                  >
                    <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />{" "}
                    {formErrors.api}
                  </Alert>
                )}
                <h2 className="text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left text-white">
                  {t("SignIn")}
                </h2>
                <div className="mt-8 intro-x">
                  <FormInput
                    type="text"
                    className="block px-4 py-3 intro-x min-w-full xl:min-w-[350px] mb-2"
                    name="username"
                    placeholder={t("EnterUsername")}
                    value={formData.username}
                    onChange={handleInputChange}
                    aria-describedby="username-error"
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                  {formErrors.username && (
                    <span id="username-error" className="text-red-500 ">
                      {formErrors.username}
                    </span>
                  )}
                  <div className="relative mt-4">
                    <FormInput
                      type={passwordVisible ? "text" : "password"}
                      className="block px-4 py-3 pr-10 intro-x min-w-full xl:min-w-[350px] mb-2"
                      name="password"
                      placeholder={t("EnterPassword")}
                      value={formData.password.trim()}
                      onChange={handleInputChange}
                      aria-describedby="password-error"
                      style={{ zIndex: 1 }}
                      onKeyDown={(e) => handleKeyDown(e)}
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
                  {formErrors.password && (
                    <span id="password-error" className="text-red-500 ">
                      {formErrors.password}
                    </span>
                  )}
                </div>
                <div className="flex mt-4 text-xs intro-x text-slate-600 dark:text-slate-500 sm:text-sm">
                  <div className="flex items-center mr-auto">
                    <FormCheck.Input
                      id="remember-me"
                      type="checkbox"
                      className="mr-2 border"
                      checked={rememberMe}
                      onChange={handleCheckboxChange}
                    />
                    <label
                      className="cursor-pointer select-none font-normal text-white"
                      htmlFor="remember-me"
                    >
                      {t("Rememberme")}
                    </label>
                  </div>
                  <a className="text-white" href="/forgot">
                    {t("ForgotPassword")}
                  </a>
                </div>
                <div className="mt-5 text-center intro-x xl:mt-8 xl:text-left">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full px-4 py-3 align-top xl:w-32 xl:mr-3 mb-5"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
