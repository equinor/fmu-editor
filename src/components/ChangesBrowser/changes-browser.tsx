import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Button} from "@mui/material";

import React from "react";

import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setChangesBrowserView, setCurrentCommit} from "@redux/reducers/ui";

import {ChangesBrowserView} from "@shared-types/ui";

import "./changes-browser.css";
import {CurrentChanges} from "./components/current-changes";
import {LoggedChanges} from "./components/logged-changes";

export const ChangesBrowser: React.VFC = () => {
    const view = useAppSelector(state => state.ui.changesBrowserView);

    const userFileChanges = useUserFileChanges();
    const currentCommit = useAppSelector(state => state.ui.currentCommit);
    const dispatch = useAppDispatch();

    const handleViewChange = React.useCallback(
        (value: ChangesBrowserView) => {
            dispatch(setChangesBrowserView(value));
            dispatch(setCurrentCommit(undefined));
        },
        [dispatch]
    );

    React.useEffect(() => {
        if (currentCommit && view === ChangesBrowserView.CurrentChanges) {
            dispatch(setChangesBrowserView(ChangesBrowserView.LoggedChanges));
        }
    }, [currentCommit, view, dispatch]);

    return (
        <Surface elevation="raised" className="ChangesBrowser">
            {view === ChangesBrowserView.LoggedChanges && (
                <>
                    {userFileChanges.length > 0 && (
                        <Button
                            id="current-changes-button"
                            onClick={() => handleViewChange(ChangesBrowserView.CurrentChanges)}
                            sx={{width: "100%", borderRadius: 0}}
                            variant="contained"
                            title="Click here to see your file changes"
                        >
                            {userFileChanges.length} file change{userFileChanges.length > 1 && "s"} to commit
                        </Button>
                    )}
                    <LoggedChanges />
                </>
            )}
            {view === ChangesBrowserView.CurrentChanges && <CurrentChanges />}
        </Surface>
    );
};
