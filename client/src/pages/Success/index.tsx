import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/HomeHeader";
import Footer from "@/components/HomeFooter";
import { motion } from "framer-motion";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";

const index: React.FC = () => {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header/>

      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 overflow-auto">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          {/* Header Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-indigo-700 p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-600 p-3 rounded-full">
                <Lucide
                  icon="CheckCircle"
                  className="h-12 w-12 text-indigo-100"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">{t("title1")}</h1>
            <p className="mt-2 text-indigo-100">{t("subtitle")}</p>
          </motion.div>

          {/* Content Section */}
          <div className="p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-6"
            >
              {/* Email Card */}
              <div className="flex items-start p-4 bg-indigo-50 rounded-lg">
                <div className="flex-shrink-0 bg-white p-3 rounded-full shadow-sm">
                  <Lucide icon="Mail" className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    {t("emailTitle")}
                  </h3>
                  <p className="mt-1 text-gray-600">{t("emailMessage")}</p>
                </div>
              </div>

              {/* Password Card */}
              <div className="flex items-start p-4 bg-indigo-50 rounded-lg">
                <div className="flex-shrink-0 bg-white p-3 rounded-full shadow-sm">
                  <Lucide icon="Key" className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    {t("passwordTitle")}
                  </h3>
                  <p className="mt-1 text-gray-600">{t("passwordMessage")}</p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <Button
                  variant="primary"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t("cta")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Confetti effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -50,
                  opacity: 1,
                  rotate: Math.random() * 360,
                }}
                animate={{
                  y: window.innerHeight,
                  opacity: 0,
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  ease: "linear",
                  delay: Math.random() * 0.5,
                }}
                style={{
                  position: "absolute",
                  width: 10 + Math.random() * 10,
                  height: 10 + Math.random() * 10,
                  backgroundColor: ["#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"][
                    Math.floor(Math.random() * 4)
                  ],
                }}
                className="rounded-sm"
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default index;
