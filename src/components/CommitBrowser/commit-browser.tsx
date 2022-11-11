import {List, Paper, Typography} from "@mui/material";

import React from "react";

import "./commit-browser.css";
import {Commit} from "./components/commit";

export const CommitBrowser: React.FC = () => {
    return (
        <Paper elevation={4} className="CommitBrowser">
            <Typography variant="h5">Commits</Typography>
            <List sx={{width: "100%", maxWidth: 360}}>
                <Commit
                    summary="Initial commit"
                    message="This is the initial commit"
                    user="John Doe"
                    timestamp={new Date().getTime()}
                />
            </List>
        </Paper>
    );
};
