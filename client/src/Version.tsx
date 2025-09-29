import React from 'react';
import versionData from './version.json';

const Version = () => {
  return (
    <div className="fixed bottom-0 left-0 p-2 bg-gray-800/75 text-white text-xs z-50">
      Version: {versionData.version}
    </div>
  );
};

export default Version;