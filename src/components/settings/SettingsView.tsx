import React, { useEffect, useState } from 'react';
import TwoFactorSetup from '../security/TwoFactorSetup';
import Card from '../ui/Card';
import { canUseLedger, canUseTrezor, connectLedgerEvm, connectTrezorEvm, loadHardwareAccount, forgetHardwareAccount, type HardwareAccount } from '../../services/hardwareWalletService';
import { Usb, PlugZap } from 'lucide-react';

interface SettingsViewProps {
  userEmail: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userEmail }) => {
  const [ledgerAcc, setLedgerAcc] = useState<HardwareAccount | null>(null);
  const [trezorAcc, setTrezorAcc] = useState<HardwareAccount | null>(null);
  const [hwError, setHwError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<'ledger' | 'trezor' | null>(null);

  useEffect(() => {
    setLedgerAcc(loadHardwareAccount('ledger'));
    setTrezorAcc(loadHardwareAccount('trezor'));
  }, []);

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleConnect = async (type: 'ledger' | 'trezor') => {
    setHwError('');
    setIsConnecting(type);
    try {
      if (type === 'ledger') {
        const acc = await connectLedgerEvm();
        setLedgerAcc(acc);
      } else {
        const acc = await connectTrezorEvm();
        setTrezorAcc(acc);
      }
    } catch (e: any) {
      setHwError(e?.message || 'Connection failed');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = (type: 'ledger' | 'trezor') => {
    forgetHardwareAccount(type);
    if (type === 'ledger') setLedgerAcc(null); else setTrezorAcc(null);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-sky-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>
        
        {/* Security Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Security</h2>
          <TwoFactorSetup userEmail={userEmail} />
        </section>

        {/* Hardware Wallets */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Hardware Wallets</h2>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <div className="space-y-4">
              {hwError && (
                <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{hwError}</div>
              )}
              {/* Ledger */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Usb className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium">Ledger (Ethereum)</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {ledgerAcc ? `Connected: ${shorten(ledgerAcc.address)}` : canUseLedger() ? 'Connect via WebUSB (Chrome/Edge on HTTPS)' : 'Requires HTTPS + WebUSB support'}
                    </p>
                  </div>
                </div>
                {ledgerAcc ? (
                  <button onClick={() => handleDisconnect('ledger')} className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-red-400 hover:bg-red-500/10">Disconnect</button>
                ) : (
                  <button onClick={() => handleConnect('ledger')} disabled={!canUseLedger() || isConnecting==='ledger'} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
                    {isConnecting==='ledger' ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </div>
              {/* Trezor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <PlugZap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium">Trezor (Ethereum)</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {trezorAcc ? `Connected: ${shorten(trezorAcc.address)}` : canUseTrezor() ? 'Connect via Trezor Connect (HTTPS)' : 'Requires HTTPS'}
                    </p>
                  </div>
                </div>
                {trezorAcc ? (
                  <button onClick={() => handleDisconnect('trezor')} className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-red-400 hover:bg-red-500/10">Disconnect</button>
                ) : (
                  <button onClick={() => handleConnect('trezor')} disabled={!canUseTrezor() || isConnecting==='trezor'} className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
                    {isConnecting==='trezor' ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          </Card>
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
