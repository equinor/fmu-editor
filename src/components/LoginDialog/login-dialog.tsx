import {useIsSignedIn} from "@hooks/useIsMicrosoftUserSignedIn";
import {Providers} from "@microsoft/mgt-react";
import {AccountCircle, Login} from "@mui/icons-material";
import {Button, Dialog, DialogContent, DialogContentText} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";

import {IpcMessages} from "@shared-types/ipc";

export const LoginDialog: React.VFC = () => {
    const [loggingIn, setLoggingIn] = React.useState(false);
    const signedIn = useIsSignedIn();

    React.useEffect(() => {
        const provider = Providers.globalProvider;
        if (provider && provider.login && signedIn === false) {
            setLoggingIn(true);
            provider.login();
            ipcRenderer.send(IpcMessages.LOGGED_OUT);
            return;
        }
        if (signedIn === true) {
            ipcRenderer.send(IpcMessages.LOGGED_IN);
            setLoggingIn(false);
        }
    }, [signedIn]);

    const handleLoginClick = () => {
        const provider = Providers.globalProvider;
        if (provider && provider.login) {
            setLoggingIn(true);
            provider.login();
        }
    };

    return (
        <Dialog maxWidth="xs" open={signedIn === false || loggingIn}>
            <DialogContent sx={{textAlign: "center"}}>
                <AccountCircle sx={{fontSize: 64}} />
                <DialogContentText sx={{marginTop: 2, marginBottom: 2}}>
                    Please sign in to use this app.
                </DialogContentText>
                <Button variant="contained" startIcon={<Login />} onClick={() => handleLoginClick()}>
                    Sign in
                </Button>
            </DialogContent>
        </Dialog>
    );
};
