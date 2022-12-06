import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Button} from "@mui/material";

import React from "react";

import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setCurrentCommit} from "@redux/reducers/ui";

import "./changes-browser.css";
import {CurrentChanges} from "./components/current-changes";
import {LoggedChanges} from "./components/logged-changes";

export const ChangesBrowser: React.VFC = () => {
    const [view, setView] = React.useState<"current" | "logged">("logged");

    const userFileChanges = useUserFileChanges();
    const currentCommit = useAppSelector(state => state.ui.currentCommit);
    const dispatch = useAppDispatch();

    const handleViewChange = React.useCallback(
        (value: "current" | "logged") => {
            setView(value);
            dispatch(setCurrentCommit(undefined));
        },
        [dispatch]
    );

    React.useEffect(() => {
        if (currentCommit && view === "current") {
            setView("logged");
        }
    }, [currentCommit, view]);

    return (
        <Surface elevation="raised" className="ChangesBrowser">
            {view === "logged" && (
                <>
                    {userFileChanges.length > 0 && (
                        <Button
                            onClick={() => handleViewChange("current")}
                            sx={{width: "100%", borderRadius: 0}}
                            variant="contained"
                        >
                            {userFileChanges.length} file change{userFileChanges.length > 1 && "s"} to commit
                        </Button>
                    )}
                    <LoggedChanges />
                </>
            )}
            {view === "current" && <CurrentChanges />}
        </Surface>
    );
};
