import {InputBase} from "@mui/material";

import React from "react";

import "./input.css";

export type InputProps = {
    value: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    maxLength?: number;
    maxRows?: number;
    rows?: number;
    multiline?: boolean;
    fontSize?: number | string;
    disabled?: boolean;
};

export const Input: React.FC<InputProps> = props => {
    const [length, setLength] = React.useState<number>(0);

    const handleChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setLength(event.target.value.length);
            if (props.onChange) props.onChange(event);
        },
        [props]
    );

    return (
        <InputBase
            className="Input"
            onChange={handleChange}
            value={props.value}
            placeholder={props.placeholder}
            inputProps={{maxLength: props.maxLength}}
            endAdornment={
                props.maxLength && <span className="Input--character-count-adornment">{props.maxLength - length}</span>
            }
            multiline={props.multiline}
            rows={props.rows}
            maxRows={props.maxRows}
            style={{fontSize: props.fontSize}}
            disabled={props.disabled}
        />
    );
};
