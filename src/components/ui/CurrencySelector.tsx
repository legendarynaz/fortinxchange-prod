import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, AVAILABLE_CURRENCIES, type FiatCurrency } from '../../context/CurrencyContext';
import ChevronDownIcon from '../icons/ChevronDownIcon';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === currency);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: FiatCurrency) => {
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
      >
        <span className="text-base">{currentCurrency?.flag}</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{currency}</span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50">
          {AVAILABLE_CURRENCIES.map((curr) => (
            <button
              key={curr.code}
              onClick={() => handleSelect(curr.code)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                currency === curr.code ? 'bg-sky-50 dark:bg-sky-900/30' : ''
              }`}
            >
              <span className="text-lg">{curr.flag}</span>
              <div>
                <span className="font-medium text-slate-900 dark:text-white">{curr.code}</span>
                <span className="text-slate-500 dark:text-slate-400 ml-2">{curr.name}</span>
              </div>
              {currency === curr.code && (
                <svg className="w-4 h-4 ml-auto text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
