import {FlowDiagram, FlowDiagramExplorer} from "@equinor/flow-diagram-explorer";
import {ModuleBasicProps} from "@preview/modules-basics";

import React from "react";

const Ecalc: React.FC<ModuleBasicProps> = props => {
    if (props.data !== null) {
        const diagram = JSON.parse(props.data);
        return <FlowDiagramExplorer flowDiagram={diagram as FlowDiagram | FlowDiagram[]} width="100%" height="100%" />;
    }
    return null;
};

export default Ecalc;
