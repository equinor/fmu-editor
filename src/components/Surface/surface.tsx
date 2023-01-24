import React from "react";

import "./surface.css";

export type SurfaceProps = {
    elevation: "none" | "raised" | "overlay" | "sticky" | "temporary-nav" | "above-scrim";
    className?: string;
};

export const Surface: React.FC<SurfaceProps> = props => {
    return (
        <div className={`${props.className ? `${props.className} ` : ``}surface elevation-${props.elevation}`}>
            {props.children}
        </div>
    );
};
