// import React, { ReactNode } from "react";

// interface BannerProps {
//   imageUrl: string;
//   altText?: string;
//   text?: ReactNode;
//   className?: string;
//   imageClassName?: string;
//   textClassName?: string;
//   coverImage?: boolean;
//   onClick?: () => void;
//   minTextSize?: string; // Added prop for minimum text size
//   maxTextSize?: string;
// }

// const Banner: React.FC<BannerProps> = ({
//   imageUrl,
//   altText = "",
//   text,
//   className = "",
//   imageClassName = "",
//   textClassName = "",
//   coverImage = false,
//   onClick,
//   minTextSize = "text-xs", // Default minimum size
//   maxTextSize = "text-4xl",
// }) => {
//   return (
//     <div
//       className={`relative overflow-hidden ${className}`}
//       onClick={onClick}
//       style={{ cursor: onClick ? "pointer" : "default" }}
//     >
//       <img
//         src={imageUrl}
//         alt={altText}
//         // className={`${
//         //   coverImage ? "w-full h-full object-cover" : ""
//         // } ${imageClassName}`}
//       />
//       {text && (
//         <div
//           className={`absolute inset-0 flex items-center justify-center ${textClassName}`}
//         >
//           <div className="text-center p-4">{text}</div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Banner;

import React, { ReactNode } from "react";
import "./style.css";
interface BannerProps {
  imageUrl: string;
  altText?: string;
  text?: ReactNode;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  coverImage?: boolean;
  onClick?: () => void;
  minTextSize?: string;
  maxTextSize?: string;
}

const Banner: React.FC<BannerProps> = ({
  imageUrl,
  altText = "",
  text,
  className = "",
  imageClassName = "",
  textClassName = "",
  coverImage = false,
  onClick,
  minTextSize = "text-xs",
  maxTextSize = "text-2xl",
}) => {
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Responsive Image */}
      <img
        src={imageUrl}
        alt={altText}
        className={`w-full h-full ${
          coverImage ? "object-cover" : "object-contain"
        } ${imageClassName}`}
        loading="lazy"
      />

      {/* Responsive Text Container */}
      {text && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${textClassName}`}
        >
          <div
            className={`
            text-center 
            p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6  
            w-[90%] xs:w-[88%] sm:w-[85%] md:w-[80%] lg:w-[75%] xl:w-[70%]  
            ${minTextSize} 
            xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:${maxTextSize} 
          `}
          >
            {text}
          </div>
        </div>
      )}
    </div>
  );
};

export default Banner;
