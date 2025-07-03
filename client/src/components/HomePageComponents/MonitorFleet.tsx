import React from 'react';
import {
  CheckCircle,
  Monitor,
  Wifi,
  Settings,
  Command,
  Video,
  Eye,
} from 'lucide-react';

const MonitorFleet = () => {
  return (
    <section className='features-section bg-gray-100 py-12'>
      <div className='container text-center mb-10'>
        <h2 className='text-4xl  text-gray-800 mb-4'>
          Distribute <span> Content & Monitor </span> Fleet Activity and Health
        </h2>
        <p className='text-lg text-gray-600'>
          Efficient tools for XR deployment, providing real-time monitoring and
          control.
        </p>
      </div>

      <div className='container grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='flex items-start p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition duration-300'>
          <Video className='orangeColor mr-4' size={40} />
          <div>
            <h3 className='text-xl  text-gray-800 mb-2'>
              Deploy your library of apps, files, videos, and webXR links
            </h3>
            <p className='text-gray-600'>
              Manage all your content in one place and distribute seamlessly to
              your XR devices.
            </p>
          </div>
        </div>

        <div className='flex items-start p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition duration-300'>
          <Settings className='orangeColor mr-4' size={40} />
          <div>
            <h3 className='text-xl  text-gray-800 mb-2'>
              Configure devices with bundles of XR content, firmware, and
              settings
            </h3>
            <p className='text-gray-600'>
              Simplify the deployment process by configuring devices in bulk.
            </p>
          </div>
        </div>

        <div className='flex items-start p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition duration-300'>
          <CheckCircle className='orangeColor mr-4' size={40} />
          <div>
            <h3 className='text-xl  text-gray-800 mb-2'>
              Remotely manage content versions and updates
            </h3>
            <p className='text-gray-600'>
              Keep your devices up-to-date with the latest content and firmware.
            </p>
          </div>
        </div>

        <div className='flex items-start p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition duration-300'>
          <Wifi className='orangeColor mr-4' size={40} />
          <div>
            <h3 className='text-xl  text-gray-800 mb-2'>
              Track device statuses, installed content, wifi connection,
              location and more
            </h3>
            <p className='text-gray-600'>
              Monitor device health in real-time to ensure smooth XR
              deployments.
            </p>
          </div>
        </div>

        <div className='flex items-start p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition duration-300'>
          <Command className='orangeColor mr-4' size={40} />
          <div>
            <h3 className='text-xl  text-gray-800 mb-2'>
              Control devices in real-time with a suite of remote commands
            </h3>
            <p className='text-gray-600'>
              Remotely command your devices for adjustments and troubleshooting.
            </p>
          </div>
        </div>

        <div className='flex items-start p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition duration-300'>
          <Eye className='orangeColor mr-4' size={40} />
          <div>
            <h3 className='text-xl text-gray-800 mb-2'>
              Activate Remote Screen Streaming to troubleshoot with complete
              clarity
            </h3>
            <p className='text-gray-600'>
              View and control devices remotely to resolve issues with ease.
            </p>
          </div>
        </div>
      </div>

      <div className='container text-center mt-12'>
        <a
          href='#'
          className='inline-block orangeColorBg text-white px-8 py-4 rounded-lg text-lg  hover:bg-orange-600 transition duration-300'
        >
          Learn More About the Product
        </a>
      </div>
    </section>
  );
};

export default MonitorFleet;
