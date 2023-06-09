import React from "react";

import "./surface.css";

export type SurfaceProps = {
    id?: string;
    elevation: "none" | "raised" | "overlay" | "sticky" | "temporary-nav" | "above-scrim";
    className?: string;
};

export const Surface: React.FC<SurfaceProps> = props => {
    return (
        <div
            id={props.id}
            className={`${props.className ? `${props.className} ` : ``}Surface elevation-${props.elevation}`}
        >
            {props.children}
        </div>
    );
};
