
import React from 'react';
import LogoIcon from '../icons/LogoIcon';
import WrenchScrewdriverIcon from '../icons/WrenchScrewdriverIcon';

const MaintenanceView: React.FC = () => {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-8">
         <WrenchScrewdriverIcon className="w-24 h-24 text-sky-500 mx-auto" />
      </div>
      <div className="flex justify-center items-center gap-3 mb-4">
        <LogoIcon />
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">FortinXchange</h1>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mt-4">Under Maintenance</h2>
      <p className="text-slate-600 mt-2 max-w-md">
        Our platform is currently undergoing scheduled maintenance to improve your experience. We'll be back online shortly. Thank you for your patience.
      </p>
    </div>
  );
};

export default MaintenanceView;
