import {
    CircularProgress,
    FormControl,
    FormHelperText,
    MenuItem,
    Select,
} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setPathToPythonInterpreter} from "@redux/reducers/preferences";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";

import * as path from "path";

import "./preference-item.css";

enum PreferenceItemState {
    VALIDATING = 0,
    VALID,
    INVALID,
}

enum PreferenceItemLoadingState {
    LOADING = 0,
    LOADED,
    ERROR,
}

export const PythonInterpreter: React.FC = () => {
    const dispatch = useAppDispatch();

    const [localValue, setLocalValue] = React.useState<string>(
        useAppSelector(state => state.preferences.pathToPythonInterpreter)
    );
    const [options, setOptions] = React.useState<string[]>([]);
    const [loadingState, setLoadingState] =
        React.useState<PreferenceItemLoadingState>(
            PreferenceItemLoadingState.LOADING
        );
    const [state, setState] = React.useState<{
        state: PreferenceItemState;
        message: string;
    }>({
        state: PreferenceItemState.VALID,
        message: "",
    });

    React.useEffect(() => {
        setLoadingState(PreferenceItemLoadingState.LOADING);
        ipcRenderer.send("find-python-interpreters");
        ipcRenderer.once("python-interpreters", (event, arg) => {
            if (arg.success) {
                setLoadingState(PreferenceItemLoadingState.LOADED);
            } else {
                setLoadingState(PreferenceItemLoadingState.ERROR);
            }
            setOptions(arg.options);
        });
    }, [setOptions, setLoadingState]);

    React.useEffect(() => {
        setState({state: PreferenceItemState.VALID, message: ""});
        setState({state: PreferenceItemState.VALIDATING, message: ""});
        if (localValue === "") {
            return;
        }
        ipcRenderer.send("check-if-python-interpreter", localValue);
        ipcRenderer.once("python-interpreter-check", (event, arg) => {
            if (arg.success) {
                setState({
                    state: PreferenceItemState.VALID,
                    message: "",
                });

                dispatch(setPathToPythonInterpreter(localValue));
            } else {
                setState({
                    state: PreferenceItemState.INVALID,
                    message: arg.message,
                });
            }
        });
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [localValue]);

    const handleValueChanged = (value: string) => {
        const opts: FileExplorerOptions = {
            filters: [
                {
                    name: "Python interpreter",
                    extensions: ["*"],
                },
            ],
            defaultPath: path.dirname(localValue as string),
        };
        if (value === "custom") {
            ipcRenderer.invoke("select-file", opts).then(files => {
                if (files) {
                    setLocalValue(files[0]);
                }
            });
            return;
        }
        setLocalValue(value);
    };

    return (
        <div className="PreferenceItem">
            <span className="PreferenceTitle">Python interpreter</span>
            <span className="PreferenceDescription">
                Select the Python interpreter that you are using with Webviz.
            </span>
            <div className="PreferenceValue">
                <FormControl
                    error={state.state === PreferenceItemState.INVALID}
                >
                    {loadingState === PreferenceItemLoadingState.LOADING && (
                        <CircularProgress />
                    )}
                    {loadingState === PreferenceItemLoadingState.LOADED && (
                        <>
                            <Select
                                value={localValue as string}
                                onChange={e =>
                                    handleValueChanged(e.target.value)
                                }
                                className="PreferenceInput"
                                displayEmpty
                                renderValue={(value: string) =>
                                    value === "" ? (
                                        <i>Please select...</i>
                                    ) : (
                                        value
                                    )
                                }
                            >
                                {options.map(option => (
                                    <MenuItem value={option}>{option}</MenuItem>
                                ))}
                                {!options.includes(localValue as string) && (
                                    <MenuItem value={localValue as string}>
                                        {localValue}
                                    </MenuItem>
                                )}
                                <MenuItem value="custom">
                                    Select from system...
                                </MenuItem>
                            </Select>
                            {state.state === PreferenceItemState.INVALID && (
                                <FormHelperText>{state.message}</FormHelperText>
                            )}
                        </>
                    )}
                </FormControl>
            </div>
        </div>
    );
};
