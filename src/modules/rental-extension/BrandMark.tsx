import React from 'react';
import trustGoLogo from '../../assets/brands/trust-go.png';

export function BrandMark({ brandCode }: { brandCode?: string }) {
  if (brandCode === 'TG' || brandCode === 'TRUST_GO') {
    return <img src={trustGoLogo} alt="Trust Go" className="h-8 w-28 shrink-0 rounded object-contain" />;
  }
  return (
    <div
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--customer-color-orange-500,#FF5A00)] text-xs font-black text-white shadow-xs"
    >
      IX
    </div>
  );
}
