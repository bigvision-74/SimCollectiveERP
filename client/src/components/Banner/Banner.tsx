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
import bannerTest from "@/assetsA/images/Banner/bannerTest.jpg";

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
  aspectRatio?: string;
}

const Banner: React.FC<BannerProps> = ({
  imageUrl,
  altText = "",
  text,
  className = "",
  imageClassName = "",
  textClassName = "",
  coverImage = true,
  onClick,
  minTextSize = "text-xs",
  maxTextSize = "text-2xl",
  // aspectRatio = "aspect-[16/9]",
}) => {
  return (
    <div
      className={`relative h-[70vh] overflow-hidden ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Responsive Image with better mobile handling */}
      <img
        // src={imageUrl}
        src={bannerTest}
        alt={altText}
        className={`absolute top-0 left-0 w-full h-full object-cover`}
        loading="lazy"
        decoding="async"
      />

      {text && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${textClassName}`}
        >
          <div
            className={`
              text-center
              p-4 sm:p-6 md:p-8
              w-[90%] sm:w-[80%] md:w-[60%] xlg:mr-[600px]
              ${minTextSize} 
              sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:${maxTextSize}
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
