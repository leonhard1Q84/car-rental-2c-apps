import React from 'react';
import { OverviewScreen } from '../modules/selfservice-rental/overview';

const OverviewRoute: React.FC<Record<string, unknown>> = (props) => <OverviewScreen {...(props as any)} />;

export default OverviewRoute;
