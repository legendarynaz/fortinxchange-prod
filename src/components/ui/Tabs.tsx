import React from 'react';

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onTabClick: (tab: T) => void;
  size?: 'sm' | 'md';
}

export const Tabs = <T extends string>({ tabs, activeTab, onTabClick, size = 'md' }: TabsProps<T>) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-1.5 text-sm',
  };

  return (
    <div className="flex items-center space-x-2 bg-sky-100/70 p-1 rounded-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`
            w-full rounded-md font-medium transition-colors duration-200
            ${sizeClasses[size]}
            ${activeTab === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:bg-sky-200/60 hover:text-slate-700'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};