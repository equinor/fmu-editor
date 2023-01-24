import {ProviderState, Providers} from "@microsoft/mgt-element";

import React from "react";

export const useIsSignedIn = (): boolean => {
    const [isSignedIn, setIsSignedIn] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const updateState = () => {
            const provider = Providers.globalProvider;
            if (!provider || provider.state === ProviderState.Loading) {
                setIsSignedIn(null);
                return;
            }

            setIsSignedIn(provider.state === ProviderState.SignedIn);
        };

        Providers.onProviderUpdated(updateState);
        updateState();

        return () => {
            Providers.removeProviderUpdatedListener(updateState);
        };
    }, []);

    return isSignedIn;
};
