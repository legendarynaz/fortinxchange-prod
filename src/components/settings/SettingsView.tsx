import React from 'react';
import TwoFactorSetup from '../security/TwoFactorSetup';
import Card from '../ui/Card';

interface SettingsViewProps {
  userEmail: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userEmail }) => {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-sky-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>
        
        {/* Security Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Security</h2>
          <TwoFactorSetup userEmail={userEmail} />
        </section>

        {/* Account Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Account</h2>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
                <p className="text-slate-900 dark:text-white">{userEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Status</label>
                <p className="text-green-600 dark:text-green-400 font-medium">Active</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Preferences</h2>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 dark:text-white font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Receive emails about transactions and security</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 dark:text-white font-medium">Price Alert Notifications</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Browser notifications when alerts trigger</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default SettingsView;
