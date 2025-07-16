import * as lucideIcons from "lucide-react";
import { twMerge } from "tailwind-merge";
 
export const { icons } = lucideIcons;
 
interface LucideProps extends React.ComponentPropsWithoutRef<"svg"> {
  icon: keyof typeof icons;
  title?: string;
  bold?: boolean; // Add a bold prop
}
 
function Lucide(props: LucideProps) {
  const { icon, className, bold, ...computedProps } = props;
  const Component = icons[icon];
 
  const strokeWidthClass = bold ? "stroke-2.5" : "stroke-1.5";
 
  return (
    <Component
      {...computedProps}
      className={twMerge([strokeWidthClass, "w-5 h-5", className])}
    />
  );
}
 
export default Lucide;
 
 