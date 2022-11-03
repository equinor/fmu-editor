import React from "react";

import "./list.css";

export type ListProps = {
    indentation?: number;
};

export const List: React.FC<ListProps> = props => {
    return (
        <div
            className="List"
            style={{
                marginLeft: props.indentation
                    ? `${props.indentation}px`
                    : "0px",
            }}
        >
            {props.children}
        </div>
    );
};
