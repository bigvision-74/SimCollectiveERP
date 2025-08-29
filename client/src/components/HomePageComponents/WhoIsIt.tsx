// import React from "react";
// import { useTranslation } from "react-i18next";
// import Lucide from "../Base/Lucide";

// const WhoIsItForSection = () => {
//   const { t } = useTranslation();

//   const audiences = [
//     {
//       title: "Medical & Nursing Students",
//       description: "Gain hands-on experience before stepping onto the ward",
//       icon: <Lucide icon="GraduationCap" className="w-6 h-6 text-primary" />,
//     },
//     {
//       title: "Educators & Universities",
//       description:
//         "Enhance teaching with an interactive, digital learning tool",
//       icon: <Lucide icon="Users" className="w-6 h-6 text-primary" />,
//     },
//     {
//       title: "Healthcare Professionals",
//       description: "Refresh skills and support structured training programs",
//       icon: <Lucide icon="Briefcase" className="w-6 h-6 text-primary" />,
//     },
//   ];

//   return (
//     <section className="py-16 bg-white">
//       <div className="container mx-auto px-4">
//         <div className="max-w-4xl mx-auto">
//           <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//             {t("Who is It for?")}
//           </h2>

//           <div className="grid md:grid-cols-3 gap-8 mt-12">
//             {audiences.map((audience, index) => (
//               <div key={index} className="text-center">
//                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   {audience.icon}
//                 </div>
//                 <h3 className="font-semibold text-lg mb-2">
//                   {t(audience.title)}
//                 </h3>
//                 <p className="text-gray-600">{t(audience.description)}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default WhoIsItForSection;

import React from "react";
import { useTranslation } from "react-i18next";
import Lucide from "../Base/Lucide";

const WhoIsItForSection = () => {
  const { t } = useTranslation();

  const audiences = [
    {
      title: "Medical & Nursing Students",
      description: "Gain hands-on experience before stepping onto the ward",
      icon: <Lucide icon="GraduationCap" className="w-6 h-6 text-primary" />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Educators & Universities",
      description:
        "Enhance teaching with an interactive, digital learning tool",
      icon: <Lucide icon="Users" className="w-6 h-6 text-primary" />,

      color: "bg-green-100 text-green-600",
    },
    {
      title: "Healthcare Professionals",
      description: "Refresh skills and support structured training programs",
      icon: <Lucide icon="Briefcase" className="w-6 h-6 text-primary" />,

      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-700 mb-6">
              {t("Who is It for?")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform is designed for healthcare learners and educators at
              all levels, providing realistic clinical scenarios in a safe
              learning environment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {audiences.map((audience, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
              >
                <div
                  className={`w-14 h-14 ${audience.color} rounded-xl flex items-center justify-center mb-6`}
                >
                  {audience.icon}
                </div>
                <h3 className="font-bold text-lg mb-3 text-gray-800">
                  {t(audience.title)}
                </h3>
                <p className="text-gray-600 mb-4">{t(audience.description)}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <ul className="text-sm text-gray-500">
                    {audience.title === "Medical & Nursing Students" && (
                      <>
                        <li className="mb-2 flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          Clinical skill development
                        </li>
                        <li className="mb-2 flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          Safe practice environment
                        </li>
                        <li className="flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          OSCE preparation
                        </li>
                      </>
                    )}
                    {audience.title === "Educators & Universities" && (
                      <>
                        <li className="mb-2 flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          Curriculum integration
                        </li>
                        <li className="mb-2 flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          Student progress tracking
                        </li>
                        <li className="flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          Custom scenario creation
                        </li>
                      </>
                    )}
                    {audience.title === "Healthcare Professionals" && (
                      <>
                        <li className="mb-2 flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          Skill refreshment
                        </li>
                        <li className="mb-2 flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          New procedure training
                        </li>
                        <li className="flex items-center">
                          <Lucide
                            icon="CheckCircle"
                            className="w-4 h-4 text-green-500 mr-2"
                          />
                          Continuing education
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoIsItForSection;
