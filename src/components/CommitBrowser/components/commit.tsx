import {Avatar, ListItem, ListItemAvatar, ListItemText, Typography} from "@mui/material";

import React from "react";

export type CommitProps = {
    summary: string;
    message: string;
    user: string;
    timestamp: number;
};

export const Commit: React.FC<CommitProps> = props => {
    return (
        <ListItem alignItems="flex-start">
            <ListItemAvatar>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />
            </ListItemAvatar>
            <ListItemText
                primary={props.summary}
                secondary={
                    <>
                        <Typography sx={{display: "inline"}} component="span" variant="body2" color="text.primary">
                            {`${props.user}, ${new Date(props.timestamp).getDate()}/${new Date(
                                props.timestamp
                            ).getMonth()}/${new Date(props.timestamp).getFullYear()} - `}
                        </Typography>
                        {props.message}
                    </>
                }
            />
        </ListItem>
    );
};
