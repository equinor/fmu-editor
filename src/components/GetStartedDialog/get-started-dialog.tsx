import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MobileStepper from "@mui/material/MobileStepper";
import Typography from "@mui/material/Typography";
import {useTheme} from "@mui/material/styles";

import React from "react";

import {PythonInterpreter} from "@components/Preferences/components/python-interpreter";
import {WebvizSchema} from "@components/Preferences/components/webviz-schema";
import {WebvizTheme} from "@components/Preferences/components/webviz-theme";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setInitialConfigurationDone} from "@redux/reducers/uiCoach";

import WCELogo from "@assets/wce-logo.svg";

import "./get-started-dialog.css";

export const GetStartedDialog: React.FC = () => {
    const [activeStep, setActiveStep] = React.useState(0);
    const theme = useTheme();

    const isInitialized = useAppSelector(
        state => state.uiCoach.initialConfigurationDone
    );
    const preferences = useAppSelector(state => state.preferences);

    const [open, setOpen] = React.useState(false);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (!isInitialized) {
            setOpen(true);
        }
    }, [isInitialized]);

    const handleClose = () => {
        setOpen(false);
        if (activeStep === 4) {
            dispatch(setInitialConfigurationDone(true));
        }
    };

    const isCurrentSettingValid = (): boolean => {
        if (activeStep === 1) {
            return preferences.pathToPythonInterpreter !== "";
        }
        if (activeStep === 2) {
            return preferences.pathToYamlSchemaFile !== "";
        }
        if (activeStep === 3) {
            return true;
        }
        return false;
    };

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const makeStep = (step: number): React.ReactNode => {
        if (step === 0) {
            return (
                <div style={{textAlign: "center"}}>
                    <img
                        src={WCELogo}
                        alt=""
                        style={{height: 100, marginBottom: 16}}
                    />
                    <Typography gutterBottom variant="h6">
                        Welcome to
                    </Typography>
                    <Typography gutterBottom variant="h4">
                        Webviz Config Editor
                    </Typography>
                    <Typography gutterBottom variant="body2">
                        Get quickly started by setting some preferences.
                    </Typography>
                </div>
            );
        }
        if (step === 1) {
            return <PythonInterpreter />;
        }
        if (step === 2) {
            return <WebvizSchema />;
        }
        if (step === 3) {
            return <WebvizTheme />;
        }
        if (step === 4) {
            return (
                <div style={{textAlign: "center"}}>
                    <div className="wrapper">
                        <svg
                            className="checkmark"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 52 52"
                        >
                            <circle
                                className="checkmark__circle"
                                cx="26"
                                cy="26"
                                r="25"
                                fill="none"
                            />
                            <path
                                className="checkmark__check"
                                fill="none"
                                d="M14.1 27.2l7.1 7.2 16.7-16.8"
                            />
                        </svg>
                    </div>
                    <Typography gutterBottom variant="body2">
                        You are all set!
                    </Typography>
                </div>
            );
        }
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
                <DialogContent>{makeStep(activeStep)}</DialogContent>
                <DialogActions>
                    {activeStep === 0 && (
                        <>
                            <Button size="small" onClick={handleClose}>
                                I&apos;ll do it later
                            </Button>
                            <Button size="small" onClick={handleNext}>
                                Set preferences now
                                {theme.direction === "rtl" ? (
                                    <KeyboardArrowLeft />
                                ) : (
                                    <KeyboardArrowRight />
                                )}
                            </Button>
                        </>
                    )}
                    {activeStep === 4 && (
                        <>
                            <Button size="small" onClick={handleClose}>
                                Perfect
                            </Button>
                        </>
                    )}
                    {activeStep > 0 && activeStep < 4 && (
                        <MobileStepper
                            variant="progress"
                            steps={5}
                            position="static"
                            activeStep={activeStep}
                            sx={{maxWidth: 400, flexGrow: 1}}
                            nextButton={
                                <Button
                                    size="small"
                                    onClick={handleNext}
                                    disabled={
                                        activeStep === 5 ||
                                        !isCurrentSettingValid()
                                    }
                                >
                                    Next
                                    {theme.direction === "rtl" ? (
                                        <KeyboardArrowLeft />
                                    ) : (
                                        <KeyboardArrowRight />
                                    )}
                                </Button>
                            }
                            backButton={
                                <Button
                                    size="small"
                                    onClick={handleBack}
                                    disabled={activeStep === 0}
                                >
                                    {theme.direction === "rtl" ? (
                                        <KeyboardArrowRight />
                                    ) : (
                                        <KeyboardArrowLeft />
                                    )}
                                    Back
                                </Button>
                            }
                        />
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};
