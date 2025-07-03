import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import Button from './components/Base/Button';
import Lucide from './components/Base/Lucide';

export function ErrorBoundary1() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-darkmode-800'>
      <div className='w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md dark:bg-darkmode-600'>
        <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900'>
          <Lucide
            icon='AlertTriangle'
            className='h-6 w-6 text-red-600 dark:text-red-300'
          />
        </div>
        <h2 className='mt-3 text-lg font-medium text-slate-900 dark:text-slate-100'>
          {t('title')}
        </h2>
        <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
          {t('sorryinconvenience')}
        </p>

        <div className='mt-6 flex flex-col sm:flex-row gap-3'>
          <Button
            variant='primary'
            className='w-full justify-center'
            onClick={() => window.location.reload()}
          >
            <Lucide icon='RefreshCw' className='w-4 h-4 mr-2' />
            {t('refresh')}
          </Button>

          <Button
            variant='outline-secondary'
            className='w-full justify-center'
            onClick={handleGoBack}
          >
            <Lucide icon='ArrowLeft' className='w-4 h-4 mr-2' />
            {t('goBack')}
          </Button>
        </div>

        <p className='mt-4 text-xs text-slate-400 dark:text-slate-500'>
          {t('contactSupport')}
        </p>
      </div>
    </div>
  );
}
