import {ListItem, ListItemAvatar, ListItemSecondaryAction} from "@mui/material";

import React from "react";

import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppSelector} from "@redux/hooks";

export type CommitProps = {
    id: string;
    message: string;
    user: string;
    datetime: number;
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
                <Avatar user={props.user} size={24} />
            </ListItemAvatar>
            <div className="CommitItem__Text">{summary}</div>
            <ListItemSecondaryAction
                className={`CommitItem__Time${currentCommit?.id === props.id ? " CommitItem__Time--selected" : ""}`}
            >
                {new Date(props.datetime).toLocaleTimeString()}
            </ListItemSecondaryAction>
        </ListItem>
    );
};
