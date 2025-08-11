// import React from "react";
// import { useTranslation } from "react-i18next";
// import Button from "@/components/Base/Button";
// import Header from "@/components/HomeHeader";
// import Banner from "@/components/Banner/Banner";
// import contactBanner from "@/assetsA/images/Banner/contactBanner1.jpg";
// import Footer from "@/components/HomeFooter";
// import { FormInput, FormTextarea, FormLabel } from "@/components/Base/Form";

// const ContactPage: React.FC = () => {
//   const { t } = useTranslation();

//   return (
//     <>
//       <Header />
//       <Banner
//         imageUrl={contactBanner}
//         altText="Contact banner"
//         textClassName=""
//         text={
//           <div className="text-white  mb-4 ">
//             <p className="font-bold text-2xl">{t("WeHearFromYou")}</p>
//             <p className="">{t("Havequestions")}</p>
//           </div>
//         }
//       />

//       <div className="container mx-auto px-4 py-12">
//         <div className="max-w-4xl mx-auto">
//           <h2 className="text-3xl font-bold mb-8 text-center">
//             {t("ContactUs")}
//           </h2>

//           <div className="grid md:grid-cols-2 gap-8">
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <h3 className="text-xl font-semibold mb-4">
//                 {t("Sendusmessage")}
//               </h3>
//               <form>
//                 <div className="mb-4">
//                   <FormLabel htmlFor="name">{t("YourName")}</FormLabel>
//                   <FormInput
//                     type="text"
//                     id="name"
//                     placeholder={t("Enteryourname")}
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <FormLabel htmlFor="email">{t("EmailAddress")}</FormLabel>
//                   <FormInput
//                     type="email"
//                     id="email"
//                     placeholder={t("Enteryouremail")}
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <FormLabel htmlFor="subject">{t("Subject")}</FormLabel>
//                   <FormInput
//                     type="text"
//                     id="subject"
//                     placeholder={t("Entersubject")}
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <FormLabel htmlFor="message">{t("Message")}</FormLabel>
//                   <FormTextarea
//                     id="message"
//                     rows={5}
//                     placeholder={t("Enteryourmessage")}
//                   />
//                 </div>
//                 <Button variant="primary" className="w-full">
//                   {t("SendMessage")}
//                 </Button>
//               </form>
//             </div>

//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <h3 className="text-xl font-semibold mb-4">
//                 {t("ContactInformation")}
//               </h3>
//               <div className="space-y-4">
//                 <div>
//                   <h3 className=" font-bold">{t("Email1")}</h3>
//                   <p className="text-gray-600">hellohester@simulationman.com</p>
//                 </div>
//                 <div>
//                   <h3 className=" font-bold">{t("Phone")}</h3>
//                   <p className="text-gray-600">+44 (0)2380 119 933</p>
//                 </div>
//                 <div>
//                   <h3 className=" font-bold">{t("Address")}</h3>
//                   <p className="text-gray-600">
//                     Unit 42,
//                     <br />
//                     Basepoint Centre, Caxton Close,
//                     <br />
//                     Andover, UK
//                     <br />
//                     SP10 3FG
//                   </p>
//                 </div>
//                 {/* <div>
//                   <h4 className="font-medium">{t("OfficeHours")}</h4>
//                   <p className="text-gray-600">
//                     Monday - Friday: 9:00 AM - 5:00 PM
//                     <br />
//                     Saturday - Sunday: Closed
//                   </p>
//                 </div> */}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <Footer />
//     </>
//   );
// };

// export default ContactPage;

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import contactBanner from "@/assetsA/images/Banner/contactBanner1.jpg";
import Footer from "@/components/HomeFooter";
import { FormInput, FormTextarea, FormLabel } from "@/components/Base/Form";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateField = (fieldName: keyof typeof formData, value: string) => {
    if (!value.trim()) {
      return t("fieldRequired");
    }

    if (fieldName === "email" && !validateEmail(value)) {
      return t("invalidEmail");
    }

    return "";
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name as keyof typeof formData, value),
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof typeof formData, value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    if (isValid) {
      console.log("Form submitted:", formData);
      alert(t("MessageSentSuccessfully"));
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setErrors({});
    }
  };

  return (
    <>
      <Header />
      <Banner
        imageUrl={contactBanner}
        altText="Contact banner"
        textClassName=""
        text={
          <div className="text-white  mb-4 ">
            <p className="font-bold text-4xl text-primary">
              {t("WeHearFromYou")}
            </p>
            <p className="text-xl mt-5 text-gray-700">{t("Havequestions")}</p>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {t("ContactUs")}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                {t("Sendusmessage")}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <FormLabel htmlFor="name">{t("YourName")}</FormLabel>
                  <FormInput
                    type="text"
                    id="name"
                    name="name"
                    placeholder={t("Enteryourname")}
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.name ? "border-danger" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div className="mb-4">
                  <FormLabel htmlFor="email">{t("EmailAddress")}</FormLabel>
                  <FormInput
                    type="email"
                    id="email"
                    name="email"
                    placeholder={t("Enteryouremail")}
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.email ? "border-danger" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="mb-4">
                  <FormLabel htmlFor="subject">{t("Subject")}</FormLabel>
                  <FormInput
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder={t("Entersubject")}
                    value={formData.subject}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.subject ? "border-danger" : ""}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <FormLabel htmlFor="message">{t("Message")}</FormLabel>
                  <FormTextarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder={t("Enteryourmessage")}
                    value={formData.message}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.message ? "border-danger" : ""}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>
                <Button type="submit" variant="primary" className="w-full">
                  {t("SendMessage")}
                </Button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                {t("ContactInformation")}
              </h3>
              <div className="space-y-4">
                <div>
                  <h3 className=" font-bold">{t("Email1")}</h3>
                  <p className="text-gray-600">hellohester@simulationman.com</p>
                </div>
                <div>
                  <h3 className=" font-bold">{t("Phone")}</h3>
                  <p className="text-gray-600">+44 (0)2380 119 933</p>
                </div>
                <div>
                  <h3 className=" font-bold">{t("Address")}</h3>
                  <p className="text-gray-600">
                    Unit 42,
                    <br />
                    Basepoint Centre, Caxton Close,
                    <br />
                    Andover, UK
                    <br />
                    SP10 3FG
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ContactPage;
