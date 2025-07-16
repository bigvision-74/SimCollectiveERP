import React from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// import Slider from 'react-slick';
import './slider.css';
import './style.css';

import icon1 from '../../assetsA/images/sliderIcons/icon1.svg';
import icon2 from '../../assetsA/images/sliderIcons/icon2.svg';
import icon3 from '../../assetsA/images/sliderIcons/icon3.svg';
import icon4 from '../../assetsA/images/sliderIcons/icon4.svg';
import icon5 from '../../assetsA/images/sliderIcons/icon5.svg';
import icon6 from '../../assetsA/images/sliderIcons/icon6.svg';
import Lucide from '../Base/Lucide';
import LazyImage from '@/components/LazyImage';
import { Trans, useTranslation } from 'react-i18next';

const Slicksettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  cssEase: 'ease-in-out',
  responsive: [
    { breakpoint: 1366, settings: { slidesToShow: 3, slidesToScroll: 1 } },
    { breakpoint: 1112, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    { breakpoint: 834, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
  ],
};

const FeaturesSlider = () => {
  const { t } = useTranslation();
  const features = [
    {
      id: 1,
      title: t('features_heading-1'),
      description: [
        t('features_heading-para1'),
        t('features_heading-para11'),
        t('features_heading-para111'),
      ],
      icon: icon1,
    },
    {
      id: 2,
      title: t('features_heading-2'),
      description: [
        t('features_heading-para2'),
        t('features_heading-para22'),
        t('features_heading-para222'),
      ],
      icon: icon2,
    },
    {
      id: 3,
      title: t('features_heading-3'),
      description: [
        t('features_heading-para3'),
        t('features_heading-para33'),
        t('features_heading-para333'),
      ],
      icon: icon3,
    },
    {
      id: 4,
      title: t('features_heading-4'),
      description: [
        t('features_heading-para4'),
        t('features_heading-para44'),
        t('features_heading-para444'),
      ],
      icon: icon4,
    },
    {
      id: 5,
      title: t('features_heading-5'),
      description: [
        t('features_heading-para5'),
        t('features_heading-para55'),
        t('features_heading-para555'),
      ],
      icon: icon5,
    },
    {
      id: 6,
      title: t('features_heading-6'),
      description: [
        t('features_heading-para6'),
        t('features_heading-para66'),
        t('features_heading-para666'),
      ],
      icon: icon6,
    },
  ];

  return (
    <section id='pricing' className='bg-white features-slider-section py-14'>
      <div className='container mx-auto text-center mt-10' data-aos='fade-up'>
        <h2 className='siteHeading animate-jump-in'>
          <Trans i18nKey='key_features'>
            Key <span className='orangeColor'>Features</span>
          </Trans>
        </h2>
      </div>

      <div className='container mt-5 mb-10 items-center'>
        {/* <Slider {...Slicksettings}>
          {features.map((feature) => (
            <div key={feature.id} className='p-6'>
              <div className='feature-card border-y-4 orangeColorBorder p-6 rounded-lg h-full flex flex-col justify-between shadow-md'>
                <div className='feature-header'>
                  <h1 className='siteCardNumber orangeColor'>
                    {feature.id < 10 ? `0${feature.id}` : feature.id}
                  </h1>
                  <h3 className='siteSubheading mt-5 mb-4'>{feature.title}</h3>
                </div>
                <div className='flex-grow'>
                  {feature.description.map((line, index) => (
                    <div className='flex items-start' key={index}>
                      <div className='flex-none rightArrowSlider'>
                        <Lucide
                          icon='ChevronRight'
                          className='w-5 h-5 text-primary mr-2 mt-5 rightArrowSlider'
                          bold
                        />
                      </div>
                      <p className='mt-5'>{line}</p>
                    </div>
                  ))}
                </div>
                <div className='feature-iconSlider mt-3 flex justify-center'>
                  <LazyImage
                    src={feature.icon}
                    alt='Feature Icon'
                    className='h-20 w-20'
                    placeholder=''
                  />
                </div>
              </div>
            </div>
          ))}
        </Slider> */}
      </div>
    </section>
  );
};

export default FeaturesSlider;
