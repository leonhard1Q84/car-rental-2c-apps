import React from 'react';
import LegacySelfserviceApp from '../App';
import { PickupPreparationApp } from '../modules/pickup-preparation/public-api';

const SelfserviceRouter: React.FC = () => {
  return new URLSearchParams(window.location.search).get('flow') === 'pickup-preparation'
    ? <PickupPreparationApp />
    : <LegacySelfserviceApp />;
};

export default SelfserviceRouter;
