import {Providers} from "@microsoft/mgt-element";
import {Msal2Provider} from "@microsoft/mgt-msal2-provider";

import React from "react";

Providers.globalProvider = new Msal2Provider({
    clientId: "6f2755e8-06e5-4f2e-8129-029c1c71d347",
});

export const MicrosoftGraphService: React.FC = props => {
    return <>{props.children}</>;
};
