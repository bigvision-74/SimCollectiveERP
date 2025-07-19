// import React from "react";
// import { useTranslation } from "react-i18next";

// interface PlanTabsProps {
//   selectedPlan: string;
//   onPlanChange: (plan: string) => void;
// }

// const PlanTabs: React.FC<PlanTabsProps> = ({ selectedPlan, onPlanChange }) => {
//   const { t } = useTranslation();

//   const plans = [
//     {
//       id: "trial",
//       title: t("Limited Trial"),
//       price: t("Free"),
//       duration: t("30 days"),
//       features: [
//         t("Access to basic scenarios"),
//         t("Limited patient records"),
//         t("Educational resources"),
//       ],
//       limitations: [t("Some features disabled"), t("Registration required")],
//     },
//     {
//       id: "subscription",
//       title: t("Subscription"),
//       price: "£1000",
//       duration: t("per year"),
//       features: [
//         t("Unlimited patient access"),
//         t("Full feature set"),
//         t("Regular updates"),
//         t("Priority support"),
//       ],
//     },
//     {
//       id: "perpetual",
//       title: t("Perpetual License"),
//       price: "£3000",
//       duration: t("one-time"),
//       features: [
//         t("Lifetime access"),
//         t("Unlimited features"),
//         t("All future updates"),
//         t("Dedicated support"),
//       ],
//     },
//   ];

//   return (
//     <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
//       <h3 className="text-xl font-bold text-gray-800 mb-4">
//         {t("Selected Plan")}: {selectedPlan}
//       </h3>

//       <div className="border-b border-gray-200">
//         <nav className="-mb-px flex space-x-8">
//           {plans.map((plan) => (
//             <button
//               key={plan.id}
//               onClick={() => onPlanChange(plan.title)}
//               className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
//                 selectedPlan === plan.title
//                   ? "border-primary text-primary"
//                   : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               }`}
//             >
//               {plan.title}
//             </button>
//           ))}
//         </nav>
//       </div>

//       <div className="pt-4">
//         {plans
//           .filter((plan) => plan.title === selectedPlan)
//           .map((plan) => (
//             <div key={plan.id}>
//               <div className="flex items-baseline mb-4">
//                 <span className="text-3xl font-bold text-primary">
//                   {plan.price}
//                 </span>
//                 <span className="ml-1 text-gray-600">{plan.duration}</span>
//               </div>

//               <h4 className="font-semibold text-gray-700 mb-2">
//                 {t("Features")}:
//               </h4>
//               <ul className="mb-4 space-y-2">
//                 {plan.features.map((feature, index) => (
//                   <li key={index} className="flex items-start">
//                     <span className="text-green-500 mr-2">✓</span>
//                     <span className="text-gray-700">{feature}</span>
//                   </li>
//                 ))}
//               </ul>

//               {plan.limitations && (
//                 <>
//                   <h4 className="font-semibold text-gray-700 mb-2">
//                     {t("Limitations")}:
//                   </h4>
//                   <ul className="space-y-2">
//                     {plan.limitations.map((limitation, index) => (
//                       <li key={index} className="flex items-start">
//                         <span className="text-red-400 mr-2">•</span>
//                         <span className="text-gray-600">{limitation}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </>
//               )}
//             </div>
//           ))}
//       </div>
//     </div>
//   );
// };

// export { PlanTabs };
