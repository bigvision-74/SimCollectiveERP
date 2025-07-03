import React, { useEffect, useState } from 'react';
import './style.css';
import { useTranslation } from 'react-i18next';
import final from '@/assetsA/images/Final-logo-InsightXR.png';
import LazyImage from '@/components/LazyImage';

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { t } = useTranslation();
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className='bg-[#0f1f39]'>
      <footer className='py-4 footerColor footerSection '>
        <div className='container mx-auto text-center '>
          <div className='grid grid-cols-1 md:grid-cols-3 '>
            <div className='col Xrfooterlogo '>
              <LazyImage
                src={final}
                alt='MXR logo'
                className='footerLogo mb-4 mx-auto w-72 h-auto ml-[-0px]'
              />
              <p className='text-white footerPara text-left'>
                {t('insightXR_para')}
              </p>
              <div className='mt-4 socialLinks flex justify-center mb-5 float-left '>
                <a>
                  <i
                    className='bi bi-twitter mr-2 OrgIcons'
                    style={{ color: '#fd6f39' }}
                  ></i>
                </a>
                <a>
                  <i
                    className='bi bi-facebook mr-2 OrgIcons'
                    style={{ color: '#fd6f39' }}
                  ></i>
                </a>
                <a>
                  <i
                    className='bi bi-instagram mr-2 OrgIcons'
                    style={{ color: '#fd6f39' }}
                  ></i>
                </a>
                <a>
                  <i
                    className='bi bi-linkedin mr-2 OrgIcons'
                    style={{ color: '#fd6f39' }}
                  ></i>
                </a>
              </div>
            </div>

            {/* usefulLinks Column */}
            <div className='ml-36 col mt-12 usefulLinks'>
              <h3 className='orangeColor text-2xl mb-3 text-left'>
                {t('footer_links')}
              </h3>
              <ul className='text-white list-none space-y-2 text-left'>
                <li>
                  <a href='/pricingPage' className='footerLinks'>
                    {t('pricing')}
                  </a>
                </li>
                <li>
                  <a href='/contact' className='footerLinks'>
                    {t('contactus')}
                  </a>
                </li>
                <li>
                  <a href='/term-conditions' className='footerLinks'>
                    {t('termconditions')}
                  </a>
                </li>
                <li>
                  <a href='/platform' className='footerLinks'>
                    {t('analityics_resources')}
                  </a>
                </li>
                <li>
                  <a href='/GDPR' className='footerLinks'>
                    {t('gdpr')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Solutions Column */}
            <div className='ml-36 col mt-12 solutionLinks'>
              <h3 className='orangeColor text-2xl mb-3 text-left'>
                {t('solutions')}
              </h3>
              <ul className='text-white list-none space-y-2 text-left'>
                <li>
                  <a href='/solutions' className='footerLinks'>
                    {t('enterprise_solution')}
                  </a>
                </li>
                <li>
                  <a href='/solutions' className='footerLinks'>
                    {t('academic_solution')}
                  </a>
                </li>
                <li>
                  <a href='/solutions' className='footerLinks'>
                    {t('healthcare_solution')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className='footerBorder mt-3 mx-auto  border-t border-gray-500'></div>

        <div className='container mx-auto text-center mt-5 text-white px-4 copyrightInfo'>
          <p className='mt-10'>
            <span className='orangeColor'> © </span> {new Date().getFullYear()}{' '}
            {t('Copyright')}{' '}
            <span className='orangeColor'>{t('insight_xr')}</span>.{' '}
            {t('Rights')}.
          </p>
          <p className='mt-2'>
            {t('powered_by')}{' '}
            <span className='orangeColor'>Meta Extended Reality</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
