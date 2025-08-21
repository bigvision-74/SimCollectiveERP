import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/HomeHeader";
import Footer from "@/components/HomeFooter";
import { motion } from "framer-motion";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { useNavigate } from "react-router-dom";

const Index: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 overflow-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 text-center p-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="flex justify-center mb-6"
          >
            <div className="bg-[#4f46e5] p-4 rounded-full">
              <Lucide
                icon="Check"
                className="h-10 w-10 text-white"
                strokeWidth={2.5}
                bold
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-800">{t("title2")}</h1>
            <p className="mt-3 text-gray-500 max-w-sm mx-auto">{t("subtitle2")}</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 bg-indigo-50 border border-indigo-200/80 rounded-lg p-4"
          >
            <div className="flex items-center">
              <Lucide
                icon="Info"
                className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"
              />
              <p className="text-sm text-indigo-800 text-left">
                {t("review_message", "Our administrator will review and you will be informed via email. Please check your mail.")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-10"
          >
            <Button
              variant="primary"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                navigate("/");
              }}
            >
              <Lucide icon="Home" className="h-4 w-4" />
              <span>{t("cta")}</span>
            </Button>
          </motion.div>
        </motion.div>

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

export default Index;