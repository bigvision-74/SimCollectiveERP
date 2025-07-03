// import React from 'react';
// import { Check } from 'lucide-react';
// import Lucide from '@/components/Base/Lucide';
// import ContactModal from '@/pages/ContactModal/ContactModal';
// import { useState } from 'react';
// import { Trans, useTranslation } from 'react-i18next';
// const XrDeployments = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const { t } = useTranslation();
//   const toggleModal = () => {
//     setIsModalOpen(!isModalOpen);
//   };
//   return (
//     <section id='features' className='features-sectionHome bg-white p-10'>
//       <div className='container'>
//         <div className='flex gap-6 justify-between mb-10'>
//           <div className='lg:w-1/2 flex items-center -ml-16 features-img-bg'>
//             <img
//               src='/src/assetsA/images/device-deployment.png'
//               className='img-fluid h-85 mt-4 XrDeploymentHomeImg '
//               alt='Take Control'
//             />
//           </div>
//           <div
//             className='lg:w-1/2 flex flex-col justify-center items-start rightSectionXrdeploy mt-10'
//             data-aos='fade-up'
//           >
//             <h2 className='siteHeading mb-6 XrDeploymentHome '>
//               {t('take_control_of_xr')}
//             </h2>
//             <h2 className='siteHeading mb-2 XrDeploymentHome orangeColor '>
//               {t('take_control_of_xr1')}
//             </h2>

//             <div className='p-5'>
//               {[
//                 t('deployments_para'),
//                 t('deployments_para1'),
//                 t('deployments_para2'),
//                 t('deployments_para3'),
//                 t('deployments_para4'),
//                 t('deployments_para5'),
//                 // 'Configure your devices with bundles of XR content, firmware, and settings.',
//                 // 'Remotely manage content versions and updates.',
//                 // 'Track device statuses, installed content, wifi connection, location, and more.',
//                 // 'Control devices in real-time with a suite of remote commands.',
//                 // 'Activate Remote Screen Streaming to troubleshoot with complete clarity.',
//               ].map((text, index) => (
//                 <div className='flex items-start mt-4' key={index}>
//                   <Lucide
//                     icon='ChevronRight'
//                     className='w-5 h-5 orangeColor mr-2'
//                     bold
//                   />
//                   <span className='font-normal'>{text}</span>
//                 </div>
//               ))}
//             </div>

//             <button
//               onClick={toggleModal}
//               className='orangeColorBg text-white mt-4 self-start hover:bg-orange-500 p-3 rounded ml-5 flex'
//             >
//               {t('banner_button')}{' '}
//               {/* <Lucide icon='ArrowRight' className='w-5 h-5' bold /> */}
//             </button>
//             <ContactModal isOpen={isModalOpen} toggleModal={toggleModal} />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default XrDeployments;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Lucide from '@/components/Base/Lucide';
import ContactModal from '@/pages/ContactModal/ContactModal';

const XrDeployments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <section
      id='features'
      className='features-sectionHome bg-white p-6 lg:p-10'
    >
      <div className='container mx-auto'>
        <div className='flex flex-col lg:flex-row gap-10 items-center'>
          <div className='lg:w-1/2 flex justify-center lg:justify-start'>
            <img
              src='/src/assetsA/images/device-deployment.png'
              className=' w-full max-w-md lg:max-w-full h-auto XrDeploymentHomeImg'
              alt='Take Control'
            />
          </div>

          <div
            className='lg:w-1/2 flex flex-col justify-center items-start'
            data-aos='fade-up'
          >
            <h2 className='siteHeading mb-4 text-center lg:text-left'>
              {t('take_control_of_xr')}
            </h2>
            <h2 className='siteHeading mb-6 text-center lg:text-left orangeColor'>
              {t('take_control_of_xr1')}
            </h2>

            <div className='p-4'>
              {[
                t('deployments_para'),
                t('deployments_para1'),
                t('deployments_para2'),
                t('deployments_para3'),
                t('deployments_para4'),
                t('deployments_para5'),
              ].map((text, index) => (
                <div className='flex items-start mt-4' key={index}>
                  <Lucide
                    icon='ChevronRight'
                    className='w-5 h-5 orangeColor mr-2'
                    bold
                  />
                  <span className='font-normal'>{text}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <button
              onClick={toggleModal}
              className='orangeColorBg text-white mt-6 hover:bg-orange-500 py-3 px-6 rounded flex items-center'
            >
              {t('banner_button')}
            </button>

            <ContactModal isOpen={isModalOpen} toggleModal={toggleModal} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default XrDeployments;
