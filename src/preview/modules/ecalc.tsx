import {FlowDiagram, FlowDiagramExplorer} from "@equinor/flow-diagram-explorer";

import React from "react";

import {ModuleBasicProps} from "../modules-basics";

const Ecalc: React.FC<ModuleBasicProps> = props => {
    if (props.data !== null) {
        const diagram = JSON.parse(props.data);
        return (
            <FlowDiagramExplorer flowDiagram={diagram as FlowDiagram | FlowDiagram[]} width="100vw" height="100vh" />
        );
    }
    return null;
};

export default Ecalc;
