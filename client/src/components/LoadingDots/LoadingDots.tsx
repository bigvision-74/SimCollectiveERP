import React from "react";

const LoadingDots = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <div className="load-row">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
);

export default LoadingDots;

// import React from "react";
// import Lucide from "@/components/Base/Lucide";

// const MedicalLoader = () => (
//   <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
//     <div className="flex space-x-4">
//       {["Activity", "Pill", "Stethoscope", "Syringe"].map((icon, index) => (
//         <div
//           key={icon}
//           className="animate-bounce text-primary"
//           style={{ animationDelay: `${index * 0.15}s` }}
//         >
//           <Lucide icon={icon} className="w-8 h-8" />
//         </div>
//       ))}
//     </div>
//   </div>
// );

// export default MedicalLoader;

// import React, { useState, useEffect } from "react";
// import "./LoadingDots.css";

// interface LoadingDotsProps {
//   fullPage?: boolean;
//   timeout?: number; // Time in milliseconds before showing "slow loading" message
// }

// const LoadingDots: React.FC<LoadingDotsProps> = ({
//   fullPage = true,
//   timeout = 3000,
// }) => {
//   const [showSlowMessage, setShowSlowMessage] = useState(false);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setShowSlowMessage(true);
//     }, timeout);

//     return () => clearTimeout(timer);
//   }, [timeout]);

//   return (
//     <div className={`loading-container ${fullPage ? "full-page" : ""}`}>
//       <div className="loading-dots">
//         <div className="dot"></div>
//         <div className="dot"></div>
//         <div className="dot"></div>
//       </div>
//       {showSlowMessage && (
//         <div className="slow-loading-message">
//           This is taking longer than expected. Please wait...
//         </div>
//       )}
//     </div>
//   );
// };

// export default LoadingDots;
