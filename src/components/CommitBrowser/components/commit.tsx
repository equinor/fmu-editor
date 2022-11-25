import {Avatar, ListItem, ListItemAvatar, ListItemText, Typography} from "@mui/material";

import React from "react";

export type CommitProps = {
    message: string;
    user: string;
    timestamp: number;
};

export const Commit: React.FC<CommitProps> = props => {
    const split = props.message.split("\n");
    const summary = split[0];
    let description = "";
    if (split.length > 1) description = split.slice(1).join("\n");
    return (
        <ListItem alignItems="flex-start">
            <ListItemAvatar>
                <Avatar alt={props.user} title={props.user} src="/static/images/avatar/1.jpg" />
            </ListItemAvatar>
            <ListItemText
                primary={summary}
                secondary={
                    <>
                        <Typography sx={{display: "inline"}} component="span" variant="body2" color="text.primary">
                            {`${new Date(props.timestamp).getHours()}:${new Date(
                                props.timestamp
                            ).getMinutes()}:${new Date(props.timestamp).getSeconds()} — `}
                        </Typography>
                        {description}
                    </>
                }
            />
        </ListItem>
    );
};
