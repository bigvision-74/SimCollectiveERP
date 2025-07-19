// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import Button from "@/components/Base/Button";
// import { PlanTabs } from "../SubscriptionPlans/SubsPlan";
// interface PlanSelectionFormProps {
//   selectedPlan: string;
//   onPlanChange: (plan: string) => void;
//   onSubmit: (formData: FormData) => void;
// }

// interface FormData {
//   institutionName: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   country: string;
//   gdprConsent: boolean;
// }

// const PlanSelectionForm: React.FC<PlanSelectionFormProps> = ({
//   selectedPlan,
//   onPlanChange,
//   onSubmit,
// }) => {
//   const { t } = useTranslation();
//   const [formData, setFormData] = useState<FormData>({
//     institutionName: "",
//     firstName: "",
//     lastName: "",
//     email: "",
//     country: "",
//     gdprConsent: false,
//   });

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target;
//     const checked =
//       type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(formData);
//   };

//   return (
//     <div className="flex flex-col md:flex-row gap-8 container mx-auto px-4 py-8">
//       {/* Left Side - Plan Tabs */}
//       <div className="w-full md:w-1/2">
//         <PlanTabs selectedPlan={selectedPlan} onPlanChange={onPlanChange} />
//       </div>

//       {/* Right Side - Form */}
//       <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-md">
//         <h2 className="text-2xl font-bold text-gray-800 mb-6">
//           {t("Complete Your Registration")}
//         </h2>
//         <p className="text-gray-600 mb-6">
//           {t("You're applying for:")}{" "}
//           <span className="font-semibold text-primary">{selectedPlan}</span>
//         </p>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label
//               htmlFor="institutionName"
//               className="block text-sm font-medium text-gray-700"
//             >
//               {t("Institution Name")}*
//             </label>
//             <input
//               type="text"
//               id="institutionName"
//               name="institutionName"
//               required
//               value={formData.institutionName}
//               onChange={handleChange}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label
//                 htmlFor="firstName"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 {t("First Name")}*
//               </label>
//               <input
//                 type="text"
//                 id="firstName"
//                 name="firstName"
//                 required
//                 value={formData.firstName}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="lastName"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 {t("Last Name")}*
//               </label>
//               <input
//                 type="text"
//                 id="lastName"
//                 name="lastName"
//                 required
//                 value={formData.lastName}
//                 onChange={handleChange}
//                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
//               />
//             </div>
//           </div>

//           <div>
//             <label
//               htmlFor="email"
//               className="block text-sm font-medium text-gray-700"
//             >
//               {t("Email")}*
//             </label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               required
//               value={formData.email}
//               onChange={handleChange}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="country"
//               className="block text-sm font-medium text-gray-700"
//             >
//               {t("Country")}*
//             </label>
//             <select
//               id="country"
//               name="country"
//               required
//               value={formData.country}
//               onChange={handleChange}
//               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
//             >
//               <option value="">{t("Select Country")}</option>
//               <option value="UK">United Kingdom</option>
//               <option value="US">United States</option>
//               {/* Add more countries as needed */}
//             </select>
//           </div>

//           <div className="flex items-start">
//             <div className="flex items-center h-5">
//               <input
//                 id="gdprConsent"
//                 name="gdprConsent"
//                 type="checkbox"
//                 required
//                 checked={formData.gdprConsent}
//                 onChange={handleChange}
//                 className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
//               />
//             </div>
//             <div className="ml-3 text-sm">
//               <label
//                 htmlFor="gdprConsent"
//                 className="font-medium text-gray-700"
//               >
//                 {t("I agree to the GDPR terms and conditions")}*
//               </label>
//               <p className="text-gray-500">
//                 {t("We'll handle your data according to our privacy policy")}
//               </p>
//             </div>
//           </div>

//           <div className="pt-4">
//             <Button
//               type="submit"
//               variant="primary"
//               className="w-full justify-center"
//             >
//               {t("Submit Application")}
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default PlanSelectionForm;
