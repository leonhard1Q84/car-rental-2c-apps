import React from 'react';
import trustGoLogo from '../../assets/brands/trust-go.png';
import ixRentalLogo from '../../assets/brands/ix-rental.png';

export function BrandMark({ brandCode }: { brandCode?: string }) {
  if (brandCode === 'TG' || brandCode === 'TRUST_GO') {
    return <img src={trustGoLogo} alt="Trust Go" className="h-8 w-28 shrink-0 rounded object-contain" />;
  }
  return <img src={ixRentalLogo} alt="IX RENTAL" className="h-7 w-auto shrink-0 object-contain" />;
}
