import React from 'react';
import LegacySelfserviceApp from '../App';
import { PickupPreparationApp } from './customer-journey/public-api';

export function customerEntryFlow(search: string): 'customer' | 'selfservice' {
  return new URLSearchParams(search).get('flow') === 'selfservice' ? 'selfservice' : 'customer';
}

const SelfserviceRouter: React.FC = () => customerEntryFlow(window.location.search) === 'selfservice'
  ? <LegacySelfserviceApp />
  : <PickupPreparationApp />;

export default SelfserviceRouter;
