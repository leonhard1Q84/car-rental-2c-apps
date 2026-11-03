import React from 'react';
import { PickupInspectionScreen } from '../modules/pickup-inspection';

const PickupInspectionRoute: React.FC<Record<string, unknown>> = (props) => <PickupInspectionScreen {...(props as any)} />;

export default PickupInspectionRoute;
