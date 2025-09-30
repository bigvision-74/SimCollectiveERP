import React from "react";
import versionData from "./version.json";

const Version = () => {
  const buildDate = versionData?.buildDate ? new Date(versionData.buildDate) : null;

  const formattedDate = buildDate
    ? buildDate.toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";
  
  const fullDateString = buildDate ? buildDate.toISOString() : "No date available";

  return (
    <div
      className="fixed bottom-0 left-0 px-3 py-2 bg-gray-700/70 text-white text-xs z-50 flex items-center space-x-2 backdrop-blur-sm rounded-tr-lg transition-all duration-300 ease-in-out"
      title={`Build Date: ${fullDateString}`}
    >
      {/* SVG Tag Icon */}
      {/* <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 15h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H21"
        />
      </svg> */}
      <span className="font-semibold tracking-wider">v{versionData.version}</span>
      <span className="text-gray-500">•</span>
      <span className="text-gray-300">{formattedDate}</span>
    </div>
  );
};

export default Version;