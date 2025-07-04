import React from 'react';
import './trusted.css';
import { Trans } from 'react-i18next';
import nhs from '@/assetsA/images/trustedLogos/nhs-w.png'
import system from '@/assetsA/images/trustedLogos/system-w.png'
import a from '@/assetsA/images/trustedLogos/a-w.png'
import pro from '@/assetsA/images/trustedLogos/pro-w.png'

const Clients = () => {
  return (
    <section id='clients' className='scrollColor py-12'>
      <div
        className='container mx-auto text-center mt-3 mb-3'
        data-aos='fade-up'
      >
        <h2 className='text-white siteHeading trustedHomeHeading'>
          {/* Trusted by <span className='text-orange-600'>Industry</span> */}
          <Trans i18nKey='trusted_by_industry'>
            <span className='orangeColor'>Industry</span>
          </Trans>
        </h2>
      </div>

      <div className='container mx-auto mt-8 companiesLogos' data-aos='fade-up'>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-16'>
          <div className='client-logo'>
            <img
              src={nhs}
              className='trustedLogos w-full h-auto object-contain'
              alt='NHS'
            />
          </div>

          <div className='client-logo'>
            <img
              src={system}
              className='trustedLogos w-full h-auto object-contain'
              alt='System'
            />
          </div>

          <div className='client-logo'>
            <img
              src={a}
              className='trustedLogos w-full h-auto object-contain'
              alt='A'
            />
          </div>

          <div className='client-logo'>
            <img
              src={pro}
              className='trustedLogos w-full h-auto object-contain'
              alt='Pro'
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Clients;
