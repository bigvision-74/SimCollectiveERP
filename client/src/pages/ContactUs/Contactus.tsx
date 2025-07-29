import React from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/Base/Button";
import Header from "@/components/HomeHeader";
import Banner from "@/components/Banner/Banner";
import contactBanner from "@/assetsA/images/Banner/contactBanner1.jpg";
import Footer from "@/components/HomeFooter";
import { FormInput, FormTextarea, FormLabel } from "@/components/Base/Form";

const ContactPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <Banner
        imageUrl={contactBanner}
        altText="Contact banner"
        textClassName=""
        text={
          <div className="text-white  mb-4 ">
            <p className="font-bold text-2xl">
              {t("We'd Love to Hear From You")}
            </p>
            <p className="">
              Have questions about our medical simulation platform? Our team is
              here to help. Reach out for support, partnership inquiries, or to
              learn more about our solutions.
            </p>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {t("Contact Us")}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                {t("Send us a message")}
              </h3>
              <form>
                <div className="mb-4">
                  <FormLabel htmlFor="name">{t("Your Name")}</FormLabel>
                  <FormInput
                    type="text"
                    id="name"
                    placeholder={t("Enter your name")}
                  />
                </div>
                <div className="mb-4">
                  <FormLabel htmlFor="email">{t("Email Address")}</FormLabel>
                  <FormInput
                    type="email"
                    id="email"
                    placeholder={t("Enter your email")}
                  />
                </div>
                <div className="mb-4">
                  <FormLabel htmlFor="subject">{t("Subject")}</FormLabel>
                  <FormInput
                    type="text"
                    id="subject"
                    placeholder={t("Enter subject")}
                  />
                </div>
                <div className="mb-4">
                  <FormLabel htmlFor="message">{t("Message")}</FormLabel>
                  <FormTextarea
                    id="message"
                    rows={5}
                    placeholder={t("Enter your message")}
                  />
                </div>
                <Button variant="primary" className="w-full">
                  {t("Send Message")}
                </Button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">
                {t("Contact Information")}
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{t("Email")}</h4>
                  <p className="text-gray-600">support@medsimulation.com</p>
                </div>
                <div>
                  <h4 className="font-medium">{t("Phone")}</h4>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
                <div>
                  <h4 className="font-medium">{t("Address")}</h4>
                  <p className="text-gray-600">
                    123 Medical Innovation Drive
                    <br />
                    San Francisco, CA 94107
                    <br />
                    United States
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">{t("Office Hours")}</h4>
                  <p className="text-gray-600">
                    Monday - Friday: 9:00 AM - 5:00 PM
                    <br />
                    Saturday - Sunday: Closed
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
