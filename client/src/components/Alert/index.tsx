import React from 'react';
import Lucide from '@/components/Base/Lucide';
import Alert from '@/components/Base/Alert';
type IconName = 'CheckSquare' | 'AlertTriangle';
import './style.css';
interface AlertProps {
  data: {
    variant: 'success' | 'danger';
    message: string;
  };
}

const Alerts: React.FC<AlertProps> = ({ data }) => {
  let icon: IconName;

  switch (data.variant) {
    case 'success':
      icon = 'CheckSquare';
      break;
    case 'danger':
      icon = 'AlertTriangle';
      break;
    default:
      icon = 'AlertTriangle';
  }

  return (
    <div className=''>
      <Alert
        variant={data.variant === 'success' ? 'soft-success' : 'soft-danger'}
        className='flex items-center mb-3 '
      >
        <Lucide icon={icon} className='w-6 h-6 mr-2' />
        {data.message}
      </Alert>
    </div>
  );
};

export default Alerts;
