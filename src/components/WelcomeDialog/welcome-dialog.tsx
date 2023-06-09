import {useFileChanges} from "@hooks/useFileChanges";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import {useEnvironmentService} from "@services/environment-service";

import React from "react";
import Tour, {ReactourStep} from "reactour";

import {File} from "@utils/file-system/file";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setChangesBrowserView, setCurrentCommit, setFirstTimeUser, setView} from "@redux/reducers/ui";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {ChangesBrowserView, View} from "@shared-types/ui";

import path from "path";

import {animateMouseClick} from "./animations";

const FILE_ORIGINS = [FileChangeOrigin.USER, FileChangeOrigin.BOTH];

export const WelcomeDialog: React.FC = () => {
    const [tourOpen, setTourOpen] = React.useState<boolean>(false);

    const open = useAppSelector(state => state.ui.firstTimeUser);
    const fmuDirectoryPath = useAppSelector(state => state.files.fmuDirectoryPath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const files = useAppSelector(state => state.files.files);
    const {fileChanges} = useFileChanges(FILE_ORIGINS);
    const {username} = useEnvironmentService();

    const dispatch = useAppDispatch();

    const file = files.find(f => f.filePath === activeFilePath);

    const uncommitted = fileChanges.some(change => {
        const changeFile = new File(change.relativePath, workingDirectoryPath);
        return (
            changeFile.getUserVersion(username).relativePath() ===
            path.relative(workingDirectoryPath, file?.filePath || "")
        );
    });

    const makeTourSteps = React.useCallback(() => {
        const tourSteps: ReactourStep[] = [];

        if (!tourOpen) {
            return tourSteps;
        }

        if (fmuDirectoryPath === "") {
            tourSteps.push({
                selector: "#select-fmu-directory-button",
                content:
                    "To get started, please select an FMU directory. Please do not use an FMU directory that is used in production, as this editor is still in development and may cause issues. You could for example use a local copy of the Drogon example repo for testing.",
            });
            return tourSteps;
        }
        if (workingDirectoryPath === "") {
            tourSteps.push({
                selector: "#select-model-version-button",
                content: "Then, select a model version.",
            });
            return tourSteps;
        }

        if (activeFilePath === "") {
            tourSteps.push(
                {
                    selector: "#status-bar-user-directory",
                    content: `Now you have set your FMU directory to "${fmuDirectoryPath}" and the model version to "${workingDirectoryPath}". The editor is now creating a copy of the selected FMU model just for you. You can watch the progress in the status bar.`,
                    action: () => {
                        dispatch(setView(View.Editor));
                    },
                },
                {
                    selector: "#status-bar-fmu-directory",
                    content: "You can always change both, the FMU directory...",
                },
                {
                    selector: "#status-bar-working-directory",
                    content: "...and the model version in the status bar.",
                },
                {
                    selector: "#status-bar-user",
                    content:
                        "You do also see your user name here. This is the name all your changes will be saved under.",
                },
                {
                    selector: "#inner-content-wrapper",
                    content:
                        "You are currently looking at the editor environment. Here, you can make changes to files in your own copy of the currently selected FMU working directory.",
                },
                {
                    selector: "#explorer",
                    content:
                        "On the left hand side, you see a file explorer where you can browse your copy of the FMU working directory.",
                },
                {
                    selector: "#create-new-file-button",
                    content: "You can add new files...",
                },
                {
                    selector: "#create-new-folder-button",
                    content: "...and folders...",
                },
                {
                    selector: "#refresh-explorer-button",
                    content: "..., refresh the explorer's content...",
                },
                {
                    selector: "#collapse-explorer-button",
                    content: "...and collapse all folders.",
                },
                {
                    selector: "#explorer",
                    content:
                        "You can open files for editing by clicking on them. When double-clicking on file, you open it permanently. Please open a valid file now.",
                }
            );
            return tourSteps;
        }

        if (activeFilePath !== "" && files.length > 0 && !uncommitted) {
            tourSteps.push(
                {
                    selector: "#editor-wrapper",
                    content: "Files that can be edited will be shown in the editor.",
                    action: () => {
                        dispatch(setView(View.Editor));
                    },
                },
                {
                    selector: "#issues",
                    content: "Any issues or problems with the currently opened file are viewed in the issues panel.",
                },
                {
                    selector: "#file-tabs-actions",
                    content: "There are also some actions you can perform on the currently opened file.",
                },
                {
                    selector: "#close-all-editors-button",
                    content: "You can close all open files...",
                },
                {
                    selector: "#open-preview-button",
                    content: "...open a preview of the currently opened file (if available)...",
                },
                {
                    selector: "#open-file-source-control-button",
                    content: "... and open source control for the currently opened file.",
                },
                {
                    selector: "#editor",
                    content: "Please edit the currently opened file now and save your changes by pressing Ctrl+S.",
                }
            );
            return tourSteps;
        }

        if (uncommitted) {
            tourSteps.push(
                {
                    selector: "#page-selector",
                    content: "This is the page selector. You can switch between editing and source control mode.",
                    action: () => {
                        dispatch(setView(View.Editor));
                    },
                },
                {
                    selector: "#page-selector",
                    content: "By clicking on the source control icon, you can switch to source control mode.",
                    action: (domNode: any) => {
                        animateMouseClick({
                            target: domNode,
                            flyIn: true,
                            onFinished: () => {
                                window.setTimeout(() => {
                                    dispatch(setView(View.SourceControl));
                                    dispatch(setChangesBrowserView(ChangesBrowserView.LoggedChanges));
                                    dispatch(setCurrentCommit(undefined));
                                }, 100);
                            },
                        });
                    },
                },
                {
                    selector: "#inner-content-wrapper",
                    content:
                        "The source control feature gives you an overview of all changes that were made in your selected model version. You can see who made the changes, when they were made and what was changed.",
                    action: () => {
                        dispatch(setChangesBrowserView(ChangesBrowserView.LoggedChanges));
                        dispatch(setCurrentCommit(undefined));
                    },
                },
                {
                    selector: "#current-changes-button",
                    content:
                        "You can see all uncommitted changes that you have made by clicking on the current changes button.",
                    action: (domNode: any) => {
                        animateMouseClick({
                            target: domNode,
                            flyIn: true,
                            onFinished: () => {
                                window.setTimeout(() => {
                                    dispatch(setChangesBrowserView(ChangesBrowserView.CurrentChanges));
                                    dispatch(setCurrentCommit(undefined));
                                }, 100);
                            },
                        });
                    },
                },
                {
                    selector: "#current-changes",
                    content:
                        "You can select which changes you want to commit by staging files. If you then write a commit message and click on the 'Push Changes' button, your changes will be committed to the main model directory.",
                    action: () => {
                        dispatch(setChangesBrowserView(ChangesBrowserView.CurrentChanges));
                        dispatch(setCurrentCommit(undefined));
                    },
                },
                {
                    selector: "#commit-browser",
                    content: "Your commit will appear in the commit list. You can click on it to see its details.",
                    action: () => {
                        dispatch(setChangesBrowserView(ChangesBrowserView.LoggedChanges));
                        dispatch(setCurrentCommit(undefined));
                    },
                },
                {
                    selector: "#inner-content-wrapper",
                    content:
                        "That's it! Thank you for using FMU editor. If you have any feedback, please let us know :-)",
                    action: () => {
                        dispatch(setView(View.Editor));
                    },
                }
            );
        }
        return tourSteps;
    }, [tourOpen, dispatch, fmuDirectoryPath, workingDirectoryPath, activeFilePath, files, uncommitted]);

    const handleCancel = () => {
        dispatch(setFirstTimeUser(false));
        setTourOpen(false);
    };

    const handleStartTour = () => {
        dispatch(setFirstTimeUser(false));
        setTourOpen(true);
    };

    const key = new Date().getTime().toString();

    return (
        <>
            <Dialog open={open} onClose={handleCancel}>
                <DialogTitle>Welcome to FMU editor</DialogTitle>
                <DialogContent>
                    This seems to be your first time using FMU editor. If you like, you can take a tour of the
                    application.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleStartTour}>Take a tour</Button>
                    <Button onClick={handleCancel}>No, thank you</Button>
                </DialogActions>
            </Dialog>
            <Tour
                disableFocusLock
                disableInteraction={uncommitted}
                key={key}
                goToStep={0}
                steps={makeTourSteps()}
                isOpen={tourOpen}
                onRequestClose={handleCancel}
            />
        </>
    );
};
