
import React from 'react';
import LogoIcon from '../icons/LogoIcon';
import GlobeSlashIcon from '../icons/GlobeSlashIcon';
import Button from '../ui/Button';

interface RegionLockViewProps {
  onLogout: () => void;
}

const RegionLockView: React.FC<RegionLockViewProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-8">
         <GlobeSlashIcon className="w-24 h-24 text-red-500 mx-auto" />
      </div>
      <div className="flex justify-center items-center gap-3 mb-4">
        <LogoIcon />
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">FortinXchange</h1>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mt-4">Service Not Available</h2>
      <p className="text-slate-600 mt-2 max-w-md mb-8">
        We're sorry, but FortinXchange services are not currently available in your region. We are working to expand our services and hope to support your region in the future.
      </p>
      <Button variant="secondary" onClick={onLogout}>Logout</Button>
    </div>
  );
};

export default RegionLockView;
