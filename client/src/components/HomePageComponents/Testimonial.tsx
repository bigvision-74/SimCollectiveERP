import React from 'react';
// import Slider from 'react-slick';
import { Trans, Translation, useTranslation } from 'react-i18next';

const TestimonialsCarousel: React.FC = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      quote:
        'InsightXR revolutionised our training, allowing us to track performance and improve learning outcomes with data-driven insights.',
      author: 'Training Director, Healthcare Institution',
    },
    {
      quote:
        'We’ve seen a remarkable increase in learner engagement and retention since adopting InsightXR.',
      author: 'HR Manager, Corporate Training',
    },
    {
      quote:
        'InsightXR has been a game-changer for our education programs. The analytics and engagement tools are unmatched.',
      author: 'Education Specialist, Academic Institution',
    },
  ];
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    adaptiveHeight: true,
  };

  return (
    <section className='bg-gray-50 py-12'>
      <div className='container mx-auto max-w-4xl px-4 text-center'>
        <h2 className='siteHeading mb-8'>
          <span className='orangeColor'>{t('Success')}</span> {t('Stories')}
        </h2>
        {/* <Slider {...settings}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className='p-6 bg-white rounded-lg shadow-lg border border-gray-200'
            >
              <p className='text-lg italic text-gray-700 mb-4'>
                "{testimonial.quote}"
              </p>
              <h3 className='text-gray-900 font-semibold'>
                — {testimonial.author}
              </h3>
            </div>
          ))}
        </Slider> */}
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
