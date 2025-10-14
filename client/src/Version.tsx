import React from "react";
import versionData from "./version.json";

const Version = () => {
//   const buildDate = versionData?.buildDate ? new Date(versionData.buildDate) : null;

//   const formattedDate = buildDate
//     ? buildDate.toLocaleString(undefined, {
//         year: "numeric",
//         month: "numeric",
//         day: "numeric",
//         hour: "numeric",
//         minute: "2-digit",
//       })
//     : "N/A";
  
//   const fullDateString = buildDate ? buildDate.toISOString() : "No date available";

//   return (
//     <div
//       className="fixed bottom-0 left-0 px-3 py-2 bg-gray-700/70 text-white text-xs z-50 flex items-center space-x-2 backdrop-blur-sm rounded-tr-lg transition-all duration-300 ease-in-out"
//       title={`Build Date: ${fullDateString}`}
//     >
//       <span className="font-semibold tracking-wider">v{versionData.version}</span>
//       <span className="text-gray-500">•</span>
//       <span className="text-gray-300">{formattedDate}</span>
//     </div>
//   );
};

export default Version;