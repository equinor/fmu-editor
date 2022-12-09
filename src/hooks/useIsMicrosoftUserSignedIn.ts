import {ProviderState, Providers} from "@microsoft/mgt-element";

import React from "react";

export const useIsSignedIn = (): boolean => {
    const [isSignedIn, setIsSignedIn] = React.useState(false);

    React.useEffect(() => {
        const updateState = () => {
            const provider = Providers.globalProvider;
            setIsSignedIn(provider && provider.state === ProviderState.SignedIn);
        };

        Providers.onProviderUpdated(updateState);
        updateState();

        return () => {
            Providers.removeProviderUpdatedListener(updateState);
        };
    }, []);

    return isSignedIn;
};
