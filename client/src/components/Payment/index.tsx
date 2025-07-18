import React, { useState } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel } from "@/components/Base/Form";
import { useTranslation } from "react-i18next";

interface PlanDetails {
  title: string;
  price: string;
  duration: string;
}

interface FormData {
  institutionName: string;
  firstName: string;
  lastName: string;
}

interface PaymentInformationProps {
  plan: PlanDetails;
  formData: FormData;
  onSubmit: () => void;
}

const PaymentInformation: React.FC<PaymentInformationProps> = ({
  plan,
  formData,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmit();
  };

  return (
    <div className="lg:w-1/2 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {t("Payment Information")}
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {plan.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{t("plan")}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">
              {plan.price}
            </span>
            <span className="block text-sm text-gray-500">{plan.duration}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm">
            <span className="font-medium text-gray-700">{t("billed")}:</span>
            <span className="ml-2 text-gray-600">
              {formData.institutionName}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <FormLabel
              htmlFor="cardNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("Card Number")} *
            </FormLabel>
            <FormInput
              type="text"
              id="cardNumber"
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel
                htmlFor="expiryDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("Expiry Date")} *
              </FormLabel>
              <FormInput
                type="text"
                id="expiryDate"
                name="expiryDate"
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <FormLabel
                htmlFor="cvv"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("CVV")} *
              </FormLabel>
              <FormInput
                type="text"
                id="cvv"
                name="cvv"
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <FormLabel
              htmlFor="cardName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("Name on Card")} *
            </FormLabel>
            <FormInput
              type="text"
              id="cardName"
              name="cardName"
              placeholder={`${formData.firstName} ${formData.lastName}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("Processing...") : t("Complete Payment")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentInformation;
