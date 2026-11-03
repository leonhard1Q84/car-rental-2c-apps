import React from 'react';
import { OverviewScreen } from '../modules/overview';

const OverviewRoute: React.FC<Record<string, unknown>> = (props) => <OverviewScreen {...(props as any)} />;

export default OverviewRoute;
