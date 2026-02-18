import React from 'react';

const CryptoBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Animated Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Radial Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      
      {/* Floating Crypto Symbols */}
      <div className="absolute inset-0">
        {/* Bitcoin */}
        <div className="absolute top-[10%] left-[5%] text-4xl opacity-[0.06] animate-float-slow">₿</div>
        <div className="absolute top-[60%] right-[8%] text-5xl opacity-[0.04] animate-float-medium">₿</div>
        
        {/* Ethereum */}
        <div className="absolute top-[20%] right-[15%] text-4xl opacity-[0.05] animate-float-medium">Ξ</div>
        <div className="absolute bottom-[25%] left-[12%] text-5xl opacity-[0.04] animate-float-slow">Ξ</div>
        
        {/* Dollar */}
        <div className="absolute top-[40%] left-[20%] text-3xl opacity-[0.03] animate-float-fast">$</div>
        <div className="absolute bottom-[15%] right-[25%] text-4xl opacity-[0.04] animate-float-slow">$</div>
        
        {/* Chart symbols */}
        <div className="absolute top-[75%] left-[35%] text-3xl opacity-[0.04] animate-float-medium">📈</div>
        <div className="absolute top-[15%] left-[45%] text-2xl opacity-[0.03] animate-float-fast">📊</div>
        
        {/* More crypto symbols */}
        <div className="absolute top-[50%] right-[5%] text-3xl opacity-[0.03] animate-float-slow">◈</div>
        <div className="absolute bottom-[40%] left-[8%] text-4xl opacity-[0.04] animate-float-medium">⬡</div>
        <div className="absolute top-[30%] left-[60%] text-3xl opacity-[0.03] animate-float-fast">◇</div>
      </div>
      
      {/* Animated Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
            <stop offset="50%" stopColor="rgb(59, 130, 246)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-pulse" />
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="url(#line-gradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
      </svg>
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default CryptoBackground;
