import React, { ReactNode } from "react";

interface BannerProps {
  imageUrl: string;
  altText?: string;
  text?: ReactNode;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  coverImage?: boolean;
  onClick?: () => void;
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
}) => {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <img
        src={imageUrl}
        alt={altText}
        // className={`${
        //   coverImage ? "w-full h-full object-cover" : ""
        // } ${imageClassName}`}
      />
      {text && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${textClassName}`}
        >
          <div className="text-center p-4">{text}</div>
        </div>
      )}
    </div>
  );
};

export default Banner;
