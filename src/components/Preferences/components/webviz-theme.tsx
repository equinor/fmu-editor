import {CircularProgress, MenuItem, Select} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setWebvizTheme} from "@redux/reducers/preferences";

import "./preference-item.css";

enum PreferenceItemLoadingState {
    LOADING = 0,
    LOADED,
    ERROR,
}

export const WebvizTheme: React.FC = () => {
    const dispatch = useAppDispatch();

    const pythonInterpreter = useAppSelector(
        state => state.preferences.pathToPythonInterpreter
    );

    const [localValue, setLocalValue] = React.useState<string>(
        useAppSelector(state => state.preferences.webvizTheme)
    );
    const [options, setOptions] = React.useState<string[]>([]);
    const [loadingState, setLoadingState] =
        React.useState<PreferenceItemLoadingState>(
            PreferenceItemLoadingState.LOADED
        );

    React.useEffect(() => {
        setLoadingState(PreferenceItemLoadingState.LOADING);
        ipcRenderer.send("get-webviz-themes", pythonInterpreter);
        ipcRenderer.once("webviz-themes", (event, arg) => {
            if (arg.success) {
                setLoadingState(PreferenceItemLoadingState.LOADED);
            } else {
                setLoadingState(PreferenceItemLoadingState.ERROR);
            }
            setOptions(arg.themes);
        });
    }, [setOptions, setLoadingState, pythonInterpreter]);

    React.useEffect(() => {
        dispatch(setWebvizTheme(localValue));
    }, [localValue, dispatch]);

    const handleValueChanged = (value: string) => {
        setLocalValue(value);
    };

    return (
        <div className="PreferenceItem">
            <span className="PreferenceTitle">Theme</span>
            <span className="PreferenceDescription">
                Select the theme you want to use with Webviz.
            </span>
            <div className="PreferenceValue">
                <>
                    {loadingState === PreferenceItemLoadingState.LOADING && (
                        <CircularProgress />
                    )}
                    {loadingState === PreferenceItemLoadingState.LOADED && (
                        <Select
                            value={localValue as string}
                            onChange={e => handleValueChanged(e.target.value)}
                            className="PreferenceInput"
                            displayEmpty
                        >
                            <MenuItem value="">
                                <em>Default</em>
                            </MenuItem>
                            {options.map(option => (
                                <MenuItem value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    )}
                </>
            </div>
        </div>
    );
};
