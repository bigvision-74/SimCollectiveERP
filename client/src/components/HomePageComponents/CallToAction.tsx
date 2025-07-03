import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, Translation, useTranslation } from 'react-i18next';
import Button from '../Base/Button';
import { useState } from 'react';
import ContactModal from '@/pages/ContactModal/ContactModal';

const CallToAction: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className='bg-gray-50 py-12'>
      <div className='container mx-auto text-center max-w-8xl px-4'>
        <h2 className='siteHeading  mb-10'>
          {t('GetStarted')}{' '}
          <span className='orangeColor'>{t('InsightXRH')} </span>
          {t('Today')}
        </h2>
        <p className='text-lg text-gray-700 mb-8'>{t('ExperienceThePower')}</p>
        <div className='flex flex-col sm:flex-row justify-center items-center gap-4'>
          <Button
            as='a'
            onClick={toggleModal}
            variant='primary'
            className='mr-2 shadow-md '
          >
            {t('RequestaDemo')}
          </Button>
          <Button
            as='a'
            href='/contact'
            variant='dark'
            className='mr-2 shadow-md bg-[#0f1f39] '
          >
            {t('ContactUs')}
          </Button>
        </div>
        <ContactModal isOpen={isModalOpen} toggleModal={toggleModal} />
      </div>
    </section>
  );
};

export default CallToAction;
