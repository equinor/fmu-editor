import {Avatar, ListItem, ListItemAvatar} from "@mui/material";

import React from "react";

import {useAppSelector} from "@redux/hooks";

import uniqolor from "uniqolor";

export type CommitProps = {
    id: string;
    message: string;
    user: string;
    onClick?: () => void;
};

export const Commit: React.FC<CommitProps> = props => {
    const split = props.message.split("\n");
    const summary = split[0];
    const currentCommit = useAppSelector(state => state.ui.currentCommit);
    return (
        <ListItem
            alignItems="center"
            className={`CommitItem${currentCommit?.id === props.id ? " CommitItem--selected" : ""}`}
            onClick={() => props.onClick !== undefined && props.onClick()}
        >
            <ListItemAvatar>
                <Avatar
                    alt={props.user}
                    title={props.user}
                    src="/static/images/avatar/1.jpg"
                    sx={{width: 24, height: 24, backgroundColor: uniqolor(props.user).color}}
                />
            </ListItemAvatar>
            {summary}
        </ListItem>
    );
};
