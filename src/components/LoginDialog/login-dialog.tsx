import {AccountCircle, Login} from "@mui/icons-material";
import {Button, Dialog, DialogContent, DialogContentText} from "@mui/material";

import React from "react";

export const LoginDialog: React.VFC = () => {
    // const [loggingIn, setLoggingIn] = React.useState(false);

    return (
        <Dialog maxWidth="xs" open={false}>
            <DialogContent sx={{textAlign: "center"}}>
                <AccountCircle sx={{fontSize: 64}} />
                <DialogContentText sx={{marginTop: 2, marginBottom: 2}}>Sign in.</DialogContentText>
                <Button variant="contained" startIcon={<Login />} onClick={() => true}>
                    Sign in
                </Button>
            </DialogContent>
        </Dialog>
    );
};
