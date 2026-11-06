import React from 'react';
import trustGoLogo from '../../assets/brands/trust-go.png';
import ixRentalLogo from '../../assets/brands/ix-rental.png';

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
    <img
      src={ixRentalLogo}
      alt="IX RENTAL"
      className={`h-7 w-auto object-contain shrink-0 ${className}`}
    />
  );
}
