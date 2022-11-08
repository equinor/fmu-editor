import CloseIcon from "@mui/icons-material/Close";
import {Avatar, DialogContentText, Stack, TextField, Typography} from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import {useTheme} from "@mui/material/styles";

import React from "react";

import "./get-started-dialog.css";

export const GetStartedDialog: React.FC = () => {
    const theme = useTheme();

    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const handleSaveFileRequest = () => {
            setOpen(true);
        };
        document.addEventListener("save-file", handleSaveFileRequest);

        return () => {
            document.removeEventListener("save-file", handleSaveFileRequest);
        };
    }, []);

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = () => {
        setOpen(false);
    };

    return (
        <div>
            <Dialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={open}
                className="GettingStartedDialog"
            >
                <DialogTitle sx={{m: 0, p: 2, border: 0}}>
                    <div>Commit changes</div>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            color: () => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText style={{marginBottom: 16}}>
                        <Stack direction="row" spacing={2}>
                            <Avatar>RT</Avatar>
                            <Typography>
                                Ruben Manuel Thoms
                                <br />
                                <Typography variant="body2">2022-11-08 - 15:48</Typography>
                            </Typography>
                        </Stack>
                    </DialogContentText>
                    <TextField autoFocus label="Summary" fullWidth variant="filled" />
                    <TextField label="Description" fullWidth variant="filled" multiline rows={5} />
                </DialogContent>
                <DialogActions>
                    <Button size="small" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button size="small" color="primary" onClick={handleSave} variant="contained">
                        Commit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
