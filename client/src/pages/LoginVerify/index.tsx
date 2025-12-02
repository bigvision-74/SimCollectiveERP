// import React, { useState, useEffect, useRef } from "react";
// import ThemeSwitcher from "@/components/ThemeSwitcher";
// import loginImg from "@/assetsA/images/login (2).jpg";
// import fallbackLogo from "@/assetsA/images/simVprLogo.png";
// import illustrationUrl from "@/assets/images/illustration.svg";
// import { FormInput, FormCheck, FormLabel } from "@/components/Base/Form";
// import Button from "@/components/Base/Button";
// import clsx from "clsx";
// import { useNavigate, useLocation, Link } from "react-router-dom";
// import {
//   verifyAction,
//   getCodeAction,
//   addOnlineUserAction,
//   getUserAction,
// } from "@/actions/userActions";
// import Alert from "@/components/Base/Alert";
// import Lucide from "@/components/Base/Lucide";
// import { loginUser } from "@/actions/authAction";
// import { t } from "i18next";
// import Alerts from "@/components/Alert";
// import { messaging } from "../../../firebaseConfig";
// import { getToken } from "firebase/messaging";
// import { getFcmToken } from "../../helpers/fcmToken";
// import { getSettingsAction } from "@/actions/settingAction";
// import { useAppContext } from "@/contexts/sessionContext";
// import { getLanguageAction } from "@/actions/adminActions";
// import { useTranslation } from "react-i18next";
// import { Menu } from "@/components/Base/Headless";

// interface Language {
//   id: number;
//   name: string;
//   code: string;
//   flag: string;
//   status: string;
// }
// function Main() {
//   const navigate = useNavigate();

//   const location = useLocation();
//   const { data } = location.state || {};

//   interface FormData {
//     code: string;
//   }

//   interface FormErrors {
//     code?: string;
//   }

//   const [formData, setFormData] = useState<FormData>({
//     code: "",
//   });
//   const { loadUser } = useAppContext();
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [showAlert, setShowAlert] = useState<{
//     variant: "success" | "danger";
//     message: string;
//   } | null>(null);
//   const [formErrors, setFormErrors] = useState<FormErrors>({});
//   const [showAlerterror, setShowAlerterror] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [loadingotp, setLoadingotp] = useState(false);
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
//   const [logoUrl, setLogoUrl] = useState<string | null>(null);
//   const { i18n, t } = useTranslation();

//   const validateForm = (): boolean => {
//     const errors: FormErrors = {};

//     if (!formData.code) {
//       errors.code = t("EnterOTP");
//     } else if (formData.code.length < 6) {
//       errors.code = t("atleast6characters");
//     }

//     setFormErrors(errors);

//     return Object.keys(errors).length === 0;
//   };

//   const handleInputChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const target = e.target;
//     const { name, value } = target;

//     setFormData((prev) => ({ ...prev, [name]: value }));

//     const errors: Partial<typeof formErrors> = {};
//     if (name === "code") {
//       if (!value) {
//         errors.code = "";
//       } else if (value.length < 6) {
//         errors.code = t("atleast6characters");
//       } else {
//         errors.code = "";
//       }
//     }

//     setFormErrors((prevErrors) => ({
//       ...prevErrors,
//       ...errors,
//     }));
//   };

//   // get log icon
//   useEffect(() => {
//     const fetchLogo = async () => {
//       try {
//         const res = await getSettingsAction();
//         if (res?.coloredLogo) {
//           setLogoUrl(res.coloredLogo);
//         }
//       } catch (error) {
//         console.error("Failed to load logo from settings:", error);
//       }
//     };
//     fetchLogo();
//   }, []);

//   const user = localStorage.getItem("user");

//   const ResendOtp = async () => {
//     setLoadingotp(false);

//     try {
//       setLoadingotp(true);
//       if (user) {
//         const resend = await getCodeAction(user);
//         localStorage.setItem("status", "true");

//         if (resend) {
//           setLoadingotp(false);

//           setShowAlert({
//             variant: "success",
//             message: t("resent"),
//           });

//           setTimeout(() => {
//             setShowAlert(null);
//           }, 5000);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching code:", error);
//     }
//   };

//   const handleSubmit = async () => {
//     setLoading(false);
//     setShowAlerterror(false);
//     if (validateForm()) {
//       setLoading(true);

//       try {
//         if (user === null) {
//           console.error("User not found in localStorage");
//           return;
//         }

//         const formDataToSend = new FormData();
//         formDataToSend.append("code", formData.code);
//         formDataToSend.append("email", user);
//         const fcmToken = "";

//         if (fcmToken) {
//           formDataToSend.append("fcm_token", fcmToken);
//         } else {
//           formDataToSend.append("fcm_token", "");
//         }

//         const verifiedResponse = await verifyAction(formDataToSend);

//         if (verifiedResponse) {

//             const FormDataOnlineUser = new FormData();
//             let ipAddress;
//             let latitudeData: string | undefined;
//             let longitudeData: string | undefined;
//             let cityData: string | undefined;

//             const getIpAddress = async () => {
//               try {
//                 const response = await fetch(
//                   "https://api.ipify.org?format=json"
//                 );
//                 const data = await response.json();
//                 return data.ip;
//               } catch (error) {
//                 console.error("Error fetching IP address:", error);
//               }
//             };

//             const getGeolocationByIp = async (ipAddress: string) => {
//               const url = `https://get.geojs.io/v1/ip/geo/${ipAddress}.json`;
//               try {
//                 const response = await fetch(url);
//                 if (!response.ok) {
//                   throw new Error("Network response was not ok");
//                 }
//                 const data = await response.json();

//                 const { latitude, longitude, country_code } = data;
//                 latitudeData = latitude;
//                 longitudeData = longitude;
//                 cityData = country_code;
//               } catch (error) {
//                 console.error("Error fetching geolocation data:", error);
//               }
//             };

//             const role = localStorage.getItem("role");

//             if (role != "Superadmin") {
//               const submitFormWithLocationData = async () => {
//                 try {
//                   const users = await getUserAction(user);
//                   const userId = users.id;
//                   ipAddress = await getIpAddress();
//                   await getGeolocationByIp(ipAddress);
//                   FormDataOnlineUser.append("ipAddress", ipAddress);
//                   FormDataOnlineUser.append("latitude", latitudeData || "null");
//                   FormDataOnlineUser.append(
//                     "longitude",
//                     longitudeData || "null"
//                   );
//                   FormDataOnlineUser.append("city", cityData || "null");
//                   FormDataOnlineUser.append("userid", userId);
//                   const onlineUser = await addOnlineUserAction(
//                     FormDataOnlineUser
//                   );
//                 } catch (error) {
//                   console.error("Error submitting form:", error);
//                 }
//               };
//               submitFormWithLocationData();
//             }

//             localStorage.setItem("role", verifiedResponse.data.role);
//             localStorage.setItem("successMessage", "Login successful");

//             await loadUser();

//             switch (verifiedResponse.data.role) {
//               case "Superadmin":
//                 navigate("/dashboard");
//                 break;
//               case "Admin":
//                 navigate("/dashboard-admin");
//                 break;
//               case "Faculty":
//                 navigate("/dashboard-faculty");
//                 break;
//               case "User":
//                 navigate("/dashboard-user");
//                 break;
//               case "Observer":
//                 navigate("/dashboard-observer");
//                 break;
//               case "Administrator":
//                 navigate("/dashboard-administrator");
//                 break;
//               default:
//                 console.error("Unknown role:", verifiedResponse.data.role);
//             }
          
//         } else {
//           console.error("Verification failed");
//           setShowAlerterror(true);
//           setTimeout(() => {
//             setShowAlerterror(false);
//           }, 3000);
//         }
//       } catch (error: any) {
//         console.error("Error:", error);
//         const errorMessage =
//           error.response?.data?.message ||
//           "An error occurred during verification";
//         setShowAlerterror(errorMessage);
//         setTimeout(() => {
//           setShowAlerterror(false);
//         }, 3000);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const [ShowEmailSuccessAlert, setShowEmailSuccessAlert] = useState(false);

//   useEffect(() => {
//     const EmailsuccessMessage = localStorage.getItem("EmailsuccessMessage");
//     if (EmailsuccessMessage) {
//       setShowEmailSuccessAlert(true);
//       setTimeout(() => {
//         setShowEmailSuccessAlert(false);
//       }, 3000);
//       localStorage.removeItem("EmailsuccessMessage");
//     }
//   }, []);

//   const handleBackToLogin = () => {
//     navigate("/login");
//   };

//   const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
//     const paste = e.clipboardData.getData("text").trim();
//     if (/^\d{6}$/.test(paste)) {
//       const codeArray = paste.split("");
//       setFormData({ ...formData, code: paste });
//       codeArray.forEach((digit, i) => {
//         if (inputRefs.current[i]) {
//           inputRefs.current[i]!.value = digit;
//         }
//       });

//       inputRefs.current[5]?.focus();
//       e.preventDefault();
//     }
//   };
//   const validateCode = (code: string): FormErrors => {
//     const errors: FormErrors = {};
//     if (!code) {
//       errors.code = t("EnterOTP");
//     } else if (code.length < 6) {
//       errors.code = t("Codemustbe6numbers");
//     }
//     return errors;
//   };
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     index: number
//   ) => {
//     const { value } = e.target;
//     if (/^\d?$/.test(value)) {
//       const newCode = formData.code.split("");
//       newCode[index] = value;
//       const joinedCode = newCode.join("");
//       setFormData({ ...formData, code: joinedCode });
//       setFormErrors(validateCode(joinedCode));

//       if (value && index < 5) {
//         inputRefs.current[index + 1]?.focus();
//       }
//     }
//   };

//   const handleKeyDown = (e: { key: string }, index: number) => {
//     if (e.key === "Backspace" && !formData.code[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const renderInputs = () => {
//     const codeArr = formData.code.padEnd(6, " ").split("");
//     return codeArr.map((digit, i) => (
//       <input
//         key={i}
//         type="tel"
//         inputMode="numeric"
//         pattern="[0-9]*"
//         maxLength={1}
//         value={digit.trim()}
//         onChange={(e) => handleChange(e, i)}
//         onKeyDown={(e) => handleKeyDown(e, i)}
//         onPaste={handlePaste}
//         ref={(el) => (inputRefs.current[i] = el)}
//         className="w-12 h-12 text-center border border-gray-300 rounded-md mx-1 text-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
//       />
//     ));
//   };

//   const [languages, setLanguages] = React.useState<Language[]>([]);
//   const fetchLanguage = async () => {
//     try {
//       const res = await getLanguageAction();
//       const updatedLanguages = res.map((language: Language) => ({
//         ...language,
//         active: language.status === "active",
//       }));

//       setLanguages(updatedLanguages);
//     } catch (error) {
//       console.error("Error fetching languages:", error);
//     }
//   };

//   useEffect(() => {
//     fetchLanguage();
//   }, []);
//   const currentLangLabel =
//     languages.find((lang) => lang.code === i18n.language)?.name ||
//     i18n.language;

//   const currentLanguageFlag =
//     languages.find((lang) => lang.code === i18n.language)?.flag ||
//     i18n.language;

//   return (
//     <div className="flex h-screen">
//       {/* language drop down  */}
//       <div className="absolute top-12 right-4 z-50">
//         <Menu>
//           <Menu.Button
//             as={Button}
//             style={{
//               border: "none",
//               outline: "none",
//               background: "rgba(255, 255, 255, 0.2)",
//             }}
//           >
//             <span className="text-white flex">
//               <img
//                 src={`https://flagcdn.com/w320/${currentLanguageFlag.toLowerCase()}.png`}
//                 alt={`flag`}
//                 className="mr-2 w-6 h-6"
//               />
//               <span className="text-dark">{currentLangLabel} </span>
//             </span>
//             <Lucide
//               icon="ChevronDown"
//               className="w-5 h-5 ml-2 text-dark"
//               bold
//             />
//           </Menu.Button>
//           <Menu.Items className="w-[11rem] mt-2 bg-white border  rounded-lg shadow-md max-h-60 overflow-y-auto z-50">
//             {languages
//               .filter((lang) => lang.status == "active")
//               .map((lang, key) => (
//                 <Menu.Item key={key}>
//                   <button
//                     onClick={() => {
//                       i18n.changeLanguage(lang.code)
//                     }}
//                     className={`flex items-center block p-2 w-full text-left text-black mr-5`}
//                   >
//                     <img
//                       src={`https://flagcdn.com/w320/${lang.flag.toLowerCase()}.png`}
//                       alt={`${lang.name} flag`}
//                       className="mr-2 w-6 h-6"
//                     />
//                     <p className="text-grey-800">{lang.name}</p>
//                   </button>
//                 </Menu.Item>
//               ))}
//           </Menu.Items>
//         </Menu>
//       </div>
//       {/* language drop down end  */}
//       {/* Left Side - Full Height Image */}
//       <div className="w-1/2 hidden md:block relative">
//         {/* Background Image */}
//         <a href="/">
//           <img
//             className="absolute w-24 mt-12 ml-56 "
//             src={logoUrl || fallbackLogo}
//             alt="InpatientSIM Logo"
//           />
//         </a>
//         <img
//           src={loginImg}
//           alt="Side Visual"
//           className="w-full h-full object-cover"
//         />

//         {/* Logo Overlay */}
//         {/* <img
//           src={logoUrl}
//           alt="Company Logo"
//           className="h-12 absolute top-6 left-6 z-10"
//         /> */}
//       </div>

//       {/* Right Side - Verification Form */}
//       <div className="w-full md:w-1/2 flex items-center justify-center p-8">
//         <div className="max-w-md mx-auto">
//           <Lucide
//             icon="ArrowLeftCircle"
//             className="w-10 h-10 mb-10 leftArrow cursor-pointer text-primary"
//             onClick={handleBackToLogin}
//           />

//           <h2 className="text-3xl font-bold text-gray-800 mb-2">
//             {t("Verification")}
//           </h2>
//           <p className="text-gray-600 mb-8">{t("reallyyou")}</p>

//           {showAlerterror && (
//             <Alert variant="soft-danger" className="flex items-center mb-6">
//               <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />
//               {showAlerterror}
//             </Alert>
//           )}

//           {ShowEmailSuccessAlert && (
//             <Alert variant="soft-success" className="flex items-center mb-6">
//               <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />
//               {t("Emailsentsuccessfully")}
//             </Alert>
//           )}

//           {showAlert && (
//             <Alert variant="soft-success" className="flex items-center mb-6">
//               <Lucide
//                 icon={
//                   showAlert.variant === "success"
//                     ? "CheckSquare"
//                     : "AlertTriangle"
//                 }
//                 className="w-6 h-6 mr-2"
//               />
//               {showAlert.message}
//             </Alert>
//           )}

//           <div className="flex items-center">
//             <p className="text-sm text-yellow-800 bg-yellow-100 px-3 py-2 rounded-md">
//               {t("EmailsentsuccessfullyNote")}
//             </p>
//           </div>

//           <div className="space-y-6 mt-3">
//             <div>
//               <label
//                 htmlFor="code"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 {t("EnterVerificationCode")}
//               </label>
//               <div className="flex justify-between mt-4">{renderInputs()}</div>
//               {formErrors.code && (
//                 <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
//               )}
//             </div>

//             <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
//               <Button
//                 variant="primary"
//                 className="w-full py-3 px-4 rounded-lg font-medium text-white bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
//                 onClick={handleSubmit}
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <div className="loader">
//                     <div className="dot"></div>
//                     <div className="dot"></div>
//                     <div className="dot"></div>
//                   </div>
//                 ) : (
//                   t("Verify")
//                 )}
//               </Button>

//               <Button
//                 variant="outline-secondary"
//                 className="w-full py-3 px-4 rounded-lg font-medium text-primary border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition"
//                 onClick={ResendOtp}
//                 disabled={loadingotp}
//               >
//                 {loadingotp ? (
//                   <div className="loader1">
//                     <div className="dot1"></div>
//                     <div className="dot1"></div>
//                     <div className="dot1"></div>
//                   </div>
//                 ) : (
//                   t("ResendOTP")
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Main;



import React, { useState, useEffect, useRef } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import loginImg from "@/assetsA/images/login (2).jpg";
import fallbackLogo from "@/assetsA/images/simVprLogo.png";
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
import { messaging } from "../../../firebaseConfig";
import { getToken } from "firebase/messaging";
import { getFcmToken } from "../../helpers/fcmToken";
import { getSettingsAction } from "@/actions/settingAction";
import { useAppContext } from "@/contexts/sessionContext";
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
  const { loadUser } = useAppContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showAlerterror, setShowAlerterror] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingotp, setLoadingotp] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { i18n, t } = useTranslation();

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.code) {
      errors.code = t("EnterOTP");
    } else if (formData.code.length < 6) {
      errors.code = t("atleast6characters");
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
        errors.code = t("atleast6characters");
      } else {
        errors.code = "";
      }
    }

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));
  };

  // get log icon
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await getSettingsAction();
        if (res?.coloredLogo) {
          setLogoUrl(res.coloredLogo);
        }
      } catch (error) {
        console.error("Failed to load logo from settings:", error);
      }
    };
    fetchLogo();
  }, []);

  const user = localStorage.getItem("user");

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
          }, 5000);
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

        const formDataToSend = new FormData();
        formDataToSend.append("code", formData.code);
        // Ensure backend accepts username here if "user" is now username
        formDataToSend.append("email", user); 
        const fcmToken = "";

        if (fcmToken) {
          formDataToSend.append("fcm_token", fcmToken);
        } else {
          formDataToSend.append("fcm_token", "");
        }

        const verifiedResponse = await verifyAction(formDataToSend);

        if (verifiedResponse) {

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

            // Only track if not Superadmin (logic from original code)
            if (role != "Superadmin") {
              const submitFormWithLocationData = async () => {
                try {
                  const users = await getUserAction(user);
                  const userId = users.id;
                  ipAddress = await getIpAddress();
                  if(ipAddress) await getGeolocationByIp(ipAddress);
                  
                  FormDataOnlineUser.append("ipAddress", ipAddress || "");
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

            await loadUser();

            switch (verifiedResponse.data.role) {
              case "Superadmin":
                navigate("/dashboard");
                break;
              case "Admin":
                navigate("/dashboard-admin");
                break;
              case "Faculty":
                navigate("/dashboard-faculty");
                break;
              case "User":
                navigate("/dashboard-user");
                break;
              case "Observer":
                navigate("/dashboard-observer");
                break;
              case "Administrator":
                navigate("/dashboard-administrator");
                break;
              default:
                console.error("Unknown role:", verifiedResponse.data.role);
            }
          
        } else {
          console.error("Verification failed");
          setShowAlerterror(true);
          setTimeout(() => {
            setShowAlerterror(false);
          }, 3000);
        }
      } catch (error: any) {
        console.error("Error:", error);
        const errorMessage =
          error.response?.data?.message ||
          "An error occurred during verification";
        setShowAlerterror(errorMessage);
        setTimeout(() => {
          setShowAlerterror(false);
        }, 3000);
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
      setTimeout(() => {
        setShowEmailSuccessAlert(false);
      }, 3000);
      localStorage.removeItem("EmailsuccessMessage");
    }
  }, []);

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      const codeArray = paste.split("");
      setFormData({ ...formData, code: paste });
      codeArray.forEach((digit, i) => {
        if (inputRefs.current[i]) {
          inputRefs.current[i]!.value = digit;
        }
      });

      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };
  const validateCode = (code: string): FormErrors => {
    const errors: FormErrors = {};
    if (!code) {
      errors.code = t("EnterOTP");
    } else if (code.length < 6) {
      errors.code = t("Codemustbe6numbers");
    }
    return errors;
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { value } = e.target;
    if (/^\d?$/.test(value)) {
      const newCode = formData.code.split("");
      newCode[index] = value;
      const joinedCode = newCode.join("");
      setFormData({ ...formData, code: joinedCode });
      setFormErrors(validateCode(joinedCode));

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: { key: string }, index: number) => {
    if (e.key === "Backspace" && !formData.code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderInputs = () => {
    const codeArr = formData.code.padEnd(6, " ").split("");
    return codeArr.map((digit, i) => (
      <input
        key={i}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        value={digit.trim()}
        onChange={(e) => handleChange(e, i)}
        onKeyDown={(e) => handleKeyDown(e, i)}
        onPaste={handlePaste}
        ref={(el) => (inputRefs.current[i] = el)}
        className="w-12 h-12 text-center border border-gray-300 rounded-md mx-1 text-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
      />
    ));
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

      </div>

      {/* Right Side - Verification Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md mx-auto">
          <Lucide
            icon="ArrowLeftCircle"
            className="w-10 h-10 mb-10 leftArrow cursor-pointer text-primary"
            onClick={handleBackToLogin}
          />

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
            <Alert variant="soft-success" className="flex items-center mb-6">
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

          <div className="flex items-center">
            <p className="text-sm text-yellow-800 bg-yellow-100 px-3 py-2 rounded-md">
              {t("EmailsentsuccessfullyNote")}
            </p>
          </div>

          <div className="space-y-6 mt-3">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("EnterVerificationCode")}
              </label>
              <div className="flex justify-between mt-4">{renderInputs()}</div>
              {formErrors.code && (
                <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
              )}
            </div>

            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <Button
                variant="primary"
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
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
                  t("Verify")
                )}
              </Button>

              <Button
                variant="outline-secondary"
                className="w-full py-3 px-4 rounded-lg font-medium text-primary border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition"
                onClick={ResendOtp}
                disabled={loadingotp}
              >
                {loadingotp ? (
                  <div className="loader1">
                    <div className="dot1"></div>
                    <div className="dot1"></div>
                    <div className="dot1"></div>
                  </div>
                ) : (
                  t("ResendOTP")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
