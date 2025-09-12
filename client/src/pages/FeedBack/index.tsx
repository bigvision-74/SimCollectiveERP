import React, { useEffect, useState } from "react";
import { FormInput, FormLabel, FormTextarea } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import { createFeedbackRequestAction } from "@/actions/userActions";
import { getAdminOrgAction } from "@/actions/adminActions";

interface FormData {
  name: string;
  email: string;
  feedback: string;
}

interface FormErrors {
  name: string;
  email: string;
  feedback: string;
}

const Feedback: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    feedback: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    email: "",
    feedback: "",
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const [currentOrgId, setCurrentOrgId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Fetch org + user id when component mounts
  useEffect(() => {
    const fetchOrgAndUser = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        if (userEmail) {
          const userData = await getAdminOrgAction(String(userEmail));
          setCurrentOrgId(userData?.orgid || null);
          setCurrentUserId(userData?.id || null);
        }
      } catch (error) {
        console.error("Error fetching org/user:", error);
      }
    };

    fetchOrgAndUser();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<FormErrors> = {};

    if (!formData.name.trim()) {
      errors.name = t("Name is required");
    } else if (formData.name.trim().length < 2) {
      errors.name = t("Name must be at least 2 characters");
    }

    if (!formData.email.trim()) {
      errors.email = t("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("Enter a valid email");
    }

    if (!formData.feedback.trim()) {
      errors.feedback = t("Feedback cannot be empty");
    } else if (formData.feedback.trim().length < 10) {
      errors.feedback = t("Feedback must be at least 10 characters");
    }

    setFormErrors(errors as FormErrors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  //   save feed back form function
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setAlert(null);

    try {
      await createFeedbackRequestAction(
        formData.name,
        formData.email,
        formData.feedback,
        currentUserId || undefined,
        currentOrgId || undefined
      );

      setAlert({
        variant: "success",
        message: t("Feedback submitted successfully!"),
      });

      setFormData({ name: "", email: "", feedback: "" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setAlert({
        variant: "danger",
        message: t("Something went wrong. Try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {" "}
      {alert && <Alerts data={alert} />}
      <div className="grid grid-cols-12 gap-6 mt-8">
        <div className="col-span-12 lg:col-span-8 intro-y">
          <div className="p-6 bg-white dark:bg-[#1e1e2d] rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">{t("feedback_form")}</h2>

            {/* Name */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <FormLabel htmlFor="name" className="font-bold">
                  {t("your_name")}
                </FormLabel>
                <span className="text-xs text-gray-500 font-bold">
                  {t("organisation_details_validations2char")}
                </span>
              </div>
              <FormInput
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full ${clsx({
                  "border-danger": formErrors.name,
                })}`}
                placeholder={t("enter_your_name")}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <FormLabel htmlFor="email" className="font-bold">
                  {t("your_email")}
                </FormLabel>
                <span className="text-xs text-gray-500 font-bold">
                  {t("required")}
                </span>
              </div>
              <FormInput
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full ${clsx({
                  "border-danger": formErrors.email,
                })}`}
                placeholder={t("enter_your_email")}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <FormLabel htmlFor="feedback" className="font-bold">
                  {t("your_feedback")}
                </FormLabel>
                <span className="text-xs text-gray-500 font-bold">
                  {t("required")}
                </span>
              </div>
              <FormTextarea
                id="feedback"
                name="feedback"
                rows={5}
                value={formData.feedback}
                onChange={handleChange}
                className={`w-full ${clsx({
                  "border-danger": formErrors.feedback,
                })}`}
                placeholder={t("write_your_feedback_here")}
              />
              {formErrors.feedback && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.feedback}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto sm:px-8"
                onClick={handleSubmit}
                disabled={loading}
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
                  t("Submit")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Feedback;
