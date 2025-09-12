import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import contactBanner from "@/assetsA/images/Banner/contactBanner1.jpg";
import Footer from "@/components/HomeFooter";
import { FormInput, FormTextarea, FormLabel } from "@/components/Base/Form";
import { createContactAction } from "@/actions/userActions";
import Alerts from "@/components/Alert";

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
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState<null | {
    variant: "success" | "danger";
    message: string;
  }>(null);

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

    if (fieldName === "name" && value.length > 50) {
      return t("nameTooLong");
    }

    if (fieldName === "subject" && value.length > 100) {
      return t("subjectTooLong");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(false);
    setShowAlert(null);

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
      setLoading(true);
      setShowAlert(null);

      try {
        // prepare data
        const contactData = {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        };

        // ✅ call backend action
        const result = await createContactAction(contactData);

        if (result.success) {
          // reset form
          setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
          });

          setErrors({});
          setShowAlert({
            variant: "success",
            message: t("MessageSentSuccessfully"),
          });
        } else {
          setErrors((prev) => ({
            ...prev,
            general: result.error || t("formSubmissionError"),
          }));
          setShowAlert({
            variant: "danger",
            message: result.error || t("formSubmissionError"),
          });
        }
      } catch (error) {
        console.error("Error submitting the form:", error);
        setErrors((prev) => ({
          ...prev,
          general: t("formSubmissionError"),
        }));
        setShowAlert({
          variant: "danger",
          message: t("formSubmissionError"),
        });
      } finally {
        setLoading(false);
      }
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
          {showAlert && <Alerts data={showAlert} />}

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
                    maxLength={50}
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
                    maxLength={100}
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
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full sm:w-auto sm:px-8"
                    onClick={handleSubmit}
                    disabled={loading} // 👈 disable while loading
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="loader">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                    ) : (
                      t("SendMessage")
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                {t("ContactInformation")}
              </h3>
              <div className="space-y-4">
                <div>
                  <h3 className=" font-bold">{t("Email1")}</h3>
                  <p className="text-gray-600">
                    hellohester@simulationcollective.com
                  </p>
                </div>
                <div>
                  <h3 className=" font-bold">{t("Phone")}</h3>
                  <p className="text-gray-600">(+44) 20 7193 5407</p>
                </div>
                <div>
                  <h3 className=" font-bold">{t("Address")}</h3>
                  <p className="text-gray-600">
                    20-22
                    <br />
                    Wenlock Road,
                    <br />
                    London, N1 7GU,
                    <br />
                    England
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
