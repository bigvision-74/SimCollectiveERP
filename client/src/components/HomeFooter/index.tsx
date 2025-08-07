// import React, { useEffect, useState } from "react";
// import "./style.css";
// import { useTranslation } from "react-i18next";
// import LazyImage from "@/components/LazyImage";
// import vpr from "@/assetsA/images/simVprLogo.png";

// const Footer: React.FC = () => {
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
//   const { t } = useTranslation();
//   useEffect(() => {
//     setCurrentYear(new Date().getFullYear());
//   }, []);

//   return (
//     <div className="">
//       <footer className="py-4   bg-gradient-to-br from-[#8be2f7] via-[#7dd8f0] to-[#6fcee9] shadow-lg backdrop-blur-[4px] ">
//         <div className="container mx-auto text-center mt-2 text-white px-4 copyrightInfo">
//           <p className="mt-10">
//             <span className="text-primary"> © </span> {new Date().getFullYear()}{" "}
//             {t("Copyright")} <span className="text-primary">{t("SimVPR")}</span>
//             . {t("Rights")}.
//           </p>
//           <p className="mt-2">
//             {t("powered_by")}{" "}
//             <span className="text-primary">Meta Extended Reality</span>
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Footer;


import React, { useEffect, useState } from "react";
import "./style.css";
import { useTranslation } from "react-i18next";
import LazyImage from "@/components/LazyImage";
import vpr from "@/assetsA/images/simVprLogo.png";

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { t } = useTranslation();
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="">
      <footer className="py-4 bg-[rgba(214,219,255,0.2)] backdrop-blur-lg" >
        <div className="container mx-auto text-center mt-2 text-gray-700 px-4 copyrightInfo">
          <p className="mt-10">
            <span className="text-gray-800 font-bold"> © </span> {new Date().getFullYear()}{" "}
            {t("Copyright")} <span className="text-gray-800 font-bold">{t("SimVPR")}</span>
            . {t("Rights")}.
          </p>
          <p className="mt-2">
            {t("powered_by")}{" "}
            <span className="text-gray-800 font-bold">Meta Extended Reality</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
