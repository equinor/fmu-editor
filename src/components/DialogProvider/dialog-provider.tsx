import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, useTheme} from "@mui/material";

import React from "react";

import {ConfirmationDialog} from "@shared-types/confirmation-dialog";

type IConfirmationDialogContext = React.Dispatch<React.SetStateAction<ConfirmationDialog>>;
export const DialogContext = React.createContext<IConfirmationDialogContext>(() => null);

export const DialogProvider: React.FC = ({children}) => {
    const theme = useTheme();
    const [dialog, setDialog] = React.useState<ConfirmationDialog>(null);

    const handleConfirm = () => {
        setDialog(null);
        dialog.confirmFunc();
    };

    const handleClose = () => {
        setDialog(null);
        dialog.closeFunc();
    };

    return (
        <DialogContext.Provider value={setDialog}>
            {dialog && (
                <Dialog
                    open
                    onClose={handleClose}
                    aria-labelledby="dialogmodal-title"
                    aria-describedby="dialogmodal-description"
                    PaperProps={{
                        style: {
                            backgroundColor: theme.palette.background.default,
                        },
                    }}
                >
                    <DialogTitle id="alert-dialog-title">{dialog.title}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">{dialog.content}</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>{dialog.closeText}</Button>
                        <Button onClick={handleConfirm} autoFocus>
                            {dialog.confirmText}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
            {children}
        </DialogContext.Provider>
    );
};
