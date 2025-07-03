import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import Lucide from '../Base/Lucide';
import { useTranslation } from 'react-i18next';
import './FeatureCom.css';
const FeatureComparisonTable: React.FC = () => {
  const { t } = useTranslation();
  const features = [
    {
      feature: t('ContentManagement'),
      insightXR: true,
      insightXRDescription: t('ContentManagementpara1'),
      otherPlatforms: true,
      otherPlatformsDescription: t('ContentManagementpara2'),
    },
    {
      feature: t('LearningManagement'),
      insightXR: true,
      insightXRDescription: t('LearningManagementPara1'),
      otherPlatforms: false,
      otherPlatformsDescription: t('LearningManagementPara2'),
    },
    {
      feature: t('AdvancedAnalytics'),
      insightXR: true,
      insightXRDescription: t('AdvancedAnalyticspara1'),
      otherPlatforms: false,
      otherPlatformsDescription: t('AdvancedAnalyticspara2'),
    },
    {
      feature: t('InstructorControl'),
      insightXR: true,
      insightXRDescription: t('InstructorControlPara1'),
      otherPlatforms: false,
      otherPlatformsDescription: t('InstructorControlPara2'),
    },
    {
      feature: t('GamificationCollective'),
      insightXR: true,
      insightXRDescription: t('GamificationCollectivePara1'),
      otherPlatforms: false,
      otherPlatformsDescription: t('GamificationCollectivePara2'),
    },
    {
      feature: t('Security'),
      insightXR: true,
      insightXRDescription: t('SecurityPara1'),
      otherPlatforms: false,
      otherPlatformsDescription: t('SecurityPara2'),
    },
    {
      feature: t('IntegrationCapabilities'),
      insightXR: true,
      insightXRDescription: t('IntegrationCapabilitiesPara1'),
      otherPlatforms: false,
      otherPlatformsDescription: t('IntegrationCapabilitiesPara2'),
    },
    {
      feature: t('CollaborationTools'),
      insightXR: true,
      insightXRDescription: t('CollaborationToolsPara1'),
      otherPlatforms: false,
      otherPlatformsDescription: t('CollaborationToolsPara2'),
    },
    {
      feature: t('HardwareCompatibility'),
      insightXR: true,
      insightXRDescription: t('HardwareCompatibilityPara1'),
      otherPlatforms: true,
      otherPlatformsDescription: t('HardwareCompatibilityPara2'),
    },
  ];

  return (
    <section className='bg-[#0f1f3921] py-16'>
      <div className='container mx-auto max-w-8xl px-6'>
        <h2 className='siteHeading text-center mb-8   tracking-tight'>
          {t('FeatureComparison')}
          <span className='orangeColor'> {t('InsightXRH')} </span>
          {t('OtherXrPlatforms')}
        </h2>
        <div className='overflow-x-auto shadow-md rounded-lg'>
          <table className=' w-full text-left border-collapse table-auto'>
            <thead className='bg-orange-600'>
              <tr>
                <th className='p-4 border-b text-white text-sm font-semibold uppercase text-center'>
                  {t('Features')}
                </th>
                <th className='p-4 border-b text-white border-gray-300 text-sm font-semibold uppercase text-center'>
                  {t('InsightXRH')}
                </th>
                <th className='p-4 border-b text-white border-gray-300 text-sm font-semibold uppercase text-center'>
                  {t('OnlyOtherXrPlatforms')}
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className='p-4 border border-gray-300 text-base font-bold '>
                    {feature.feature}
                  </td>
                  <td
                    className='p-4 border
                   border-gray-300'
                  >
                    <div className='flex items-center gap-3'>
                      {feature.insightXR ? (
                        <Lucide
                          icon='CheckCircle'
                          className='text-green-500 flex-shrink-0'
                          style={{ width: '24px', height: '24px' }}
                          bold
                        />
                      ) : (
                        <Lucide
                          icon='XCircle'
                          className='text-red-600 flex-shrink-0'
                          style={{ width: '24px', height: '24px' }}
                          bold
                        />
                      )}
                      <span className='text-gray-700'>
                        {feature.insightXRDescription}
                      </span>
                    </div>
                  </td>
                  <td className='p-4 border-b border-gray-300'>
                    <div className='flex items-center gap-3'>
                      {feature.otherPlatforms ? (
                        <Lucide
                          icon='CheckCircle'
                          className='text-green-500 flex-shrink-0'
                          style={{ width: '24px', height: '24px' }}
                          bold
                        />
                      ) : (
                        <Lucide
                          icon='XCircle'
                          className='text-red-600 flex-shrink-0'
                          style={{ width: '24px', height: '24px' }}
                          bold
                        />
                      )}
                      <span className='text-gray-700'>
                        {feature.otherPlatformsDescription}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default FeatureComparisonTable;
