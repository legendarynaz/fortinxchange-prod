// Minimal Hardware Wallet Service with lazy-loaded SDKs
// Only loads SDKs on explicit user action to avoid popups/iframes at startup

export type DerivationPath = string; // e.g. m/44'/60'/0'/0/0

export interface HardwareAccount {
  address: string;
  derivationPath: DerivationPath;
  type: 'ledger' | 'trezor';
}

const LEDGER_KEY = 'hw_ledger_evm';
const TREZOR_KEY = 'hw_trezor_evm';

export const canUseLedger = () =>
  typeof window !== 'undefined' && window.isSecureContext && 'usb' in navigator;

export const canUseTrezor = () =>
  typeof window !== 'undefined' && window.isSecureContext;

export function saveHardwareAccount(acc: HardwareAccount) {
  const key = acc.type === 'ledger' ? LEDGER_KEY : TREZOR_KEY;
  localStorage.setItem(key, JSON.stringify(acc));
}

export function loadHardwareAccount(type: 'ledger' | 'trezor'): HardwareAccount | null {
  const key = type === 'ledger' ? LEDGER_KEY : TREZOR_KEY;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as HardwareAccount) : null;
  } catch {
    return null;
  }
}

export function forgetHardwareAccount(type: 'ledger' | 'trezor') {
  const key = type === 'ledger' ? LEDGER_KEY : TREZOR_KEY;
  localStorage.removeItem(key);
}

export async function connectLedgerEvm(path: DerivationPath = "m/44'/60'/0'/0/0"): Promise<HardwareAccount> {
  if (!canUseLedger()) throw new Error('Ledger requires HTTPS and a browser with WebUSB (e.g., Chrome).');

  const transportMod = await import('@ledgerhq/hw-transport-webusb');
  const ethMod = await import('@ledgerhq/hw-app-eth');

  let transport: any;
  try {
    transport = await transportMod.default.create();
    const Eth = ethMod.default as any;
    const eth = new Eth(transport);
    const { address } = await eth.getAddress(path, true);

    const acc: HardwareAccount = { address, derivationPath: path, type: 'ledger' };
    saveHardwareAccount(acc);
    return acc;
  } catch (e: any) {
    if (e?.message?.includes('No device selected')) throw new Error('No Ledger selected. Please connect & select your device.');
    if (e?.message?.includes('denied')) throw new Error('Connection denied on Ledger. Please approve and try again.');
    if (e?.message?.includes('locked')) throw new Error('Unlock your Ledger, then open the Ethereum app.');
    throw new Error(e?.message || 'Ledger connection failed');
  } finally {
    try { await transport?.close?.(); } catch {}
  }
}

export async function connectTrezorEvm(path: DerivationPath = "m/44'/60'/0'/0/0"): Promise<HardwareAccount> {
  if (!canUseTrezor()) throw new Error('Trezor requires a secure (HTTPS) context.');

  const trezor = (await import('@trezor/connect-web')).default;
  await trezor.init({
    lazyLoad: true,
    manifest: {
      email: 'support@4ortin-x.com',
      appUrl: 'https://4ortin-x.com',
      appName: '4ortin-X Wallet',
    },
  });

  const res = await trezor.ethereumGetAddress({ path, showOnTrezor: true });
  if (!res.success) {
    throw new Error(res.payload?.error || 'Trezor connection failed');
  }

  const acc: HardwareAccount = { address: res.payload.address, derivationPath: path, type: 'trezor' };
  saveHardwareAccount(acc);
  return acc;
}
