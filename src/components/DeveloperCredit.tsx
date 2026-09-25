import React from 'react';

interface DeveloperCreditProps {
  compact?: boolean;
  className?: string;
}

export const DeveloperCredit: React.FC<DeveloperCreditProps> = ({ compact = false, className = '' }) => (
  <div className={`flex items-center justify-center gap-2 text-slate-400 ${className}`}>
    <div className={`${compact ? 'h-5 w-5 text-[7px]' : 'h-6 w-6 text-[8px]'} flex shrink-0 items-center justify-center rounded-md bg-linear-to-br from-slate-800 to-blue-700 font-black tracking-tight text-white shadow-sm`}>
      RLL
    </div>
    <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} leading-none`}>
      Desenvolvido por <span className="font-black text-slate-600">RLL Solutions</span>
    </p>
  </div>
);
