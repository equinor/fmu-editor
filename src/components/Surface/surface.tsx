import React from "react";

import "./surface.css";

export type SurfaceProps = {
    elevation: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
};

export const Surface: React.FC<SurfaceProps> = props => {
    return (
        <div className={`${props.className ? `${props.className} ` : ``}surface surface-${props.elevation}`}>
            {props.children}
        </div>
    );
};
