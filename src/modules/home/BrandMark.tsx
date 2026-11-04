import React from 'react';
import trustGoLogo from '../../assets/brands/trust-go.png';

export function BrandMark({ brandCode, className = '' }: { brandCode?: string; className?: string }) {
  if (brandCode === 'TG' || brandCode === 'TRUST_GO') {
    return (
      <img
        src={trustGoLogo}
        alt="TRUST GO"
        className={`h-8 w-auto rounded object-contain shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      aria-label="IX RENTAL"
      className={`size-8 rounded-lg bg-[var(--customer-color-brand,#FF5A00)] flex items-center justify-center text-white font-black text-xs tracking-wider shadow-sm shrink-0 ${className}`}
    >
      IX
    </div>
  );
}
