import React from 'react';
import './style.css';
import { useTranslation } from 'react-i18next';
import LazyImage from '@/components/LazyImage';

import knowledge from '../../assetsA/images/icons/whiteicon1.png';
import engagement from '../../assetsA/images/icons/whiteicon2.png';
import confidence from '../../assetsA/images/icons/whiteicon3.png';

const StatsSection: React.FC = () => {
  const { t } = useTranslation();
  const stats = [
    {
      icon: knowledge,
      value: '75%',
      description: t('knowledge'),
      delay: 200,
    },
    {
      icon: engagement,
      value: '90%',
      description: t('engagement'),
      delay: 300,
    },
    {
      icon: confidence,
      value: '40%',
      description: t('confidence'),
      delay: 400,
    },
  ];

  return (
    <section id='about' className='stats-section py-12 backgroundImage'>
      <div
        className='container mx-auto px-4'
        data-aos='fade-up'
        data-aos-delay='100'
      >
        <div className='flex justify-center px-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-8xl w-full'>
            {stats.map((stat, index) => (
              <div
                key={index}
                className='stat-box text-center p-6 bg-white rounded-lg shadow-lg border-4 border-transparent hover:border-[#fd6f39] transition-all duration-300 h-72'
                data-aos='fade-up'
                data-aos-delay={stat.delay}
              >
                <div className='relative p-4'>
                  <div className='stat-icon-container mx-auto transition-transform duration-300 transform hover:scale-105 p-4 rounded-full orangeColorBg'>
                    <LazyImage
                      src={stat.icon}
                      alt={stat.description}
                      className='stat-icon'
                      placeholder=''
                    />
                  </div>
                </div>
                <h3 className='stat-value text-black text-2xl mt-4'>
                  {stat.value}
                </h3>
                <p className='siteParagraph mt-3'>{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
        <p className='text-white text-xl text-center mt-8'>
          {t('InsightXR_transforms')}
        </p>
      </div>
    </section>
  );
};

export default StatsSection;
