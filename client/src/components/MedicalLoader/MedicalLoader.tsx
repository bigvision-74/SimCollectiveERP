// MedicalLoader.tsx
import { LucideProps } from "lucide-react";
import { ComponentType } from "react";

const MEDICAL_ICONS = ["Activity", "Pill", "Stethoscope", "Syringe"] as const;

export const MedicalLoader = ({
  iconSize = 16,
  color = "currentColor",
  bounceDelay = 0.1,
  className = "",
}: {
  iconSize?: number;
  color?: string;
  bounceDelay?: number;
  className?: string;
}) => {
  return (
    <div className={`flex justify-center items-center h-full ${className}`}>
      {MEDICAL_ICONS.map((icon, i) => {
        const LucideIcon = require(`lucide-react`)[
          icon
        ] as ComponentType<LucideProps>;
        return (
          <div
            key={icon}
            className="animate-bounce"
            style={{
              animationDelay: `${i * bounceDelay}s`,
              color,
            }}
          >
            <LucideIcon size={iconSize} />
          </div>
        );
      })}
    </div>
  );
};

// Add default export
export default MedicalLoader;
