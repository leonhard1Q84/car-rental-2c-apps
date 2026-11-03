import React from 'react';
import { TripEndedScreen } from '../modules/trip-ended';

const TripEndedRoute: React.FC<Record<string, unknown>> = (props) => <TripEndedScreen {...(props as any)} />;

export default TripEndedRoute;
