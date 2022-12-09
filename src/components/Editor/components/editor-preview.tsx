import React from "react";

import {ResizablePanels} from "@components/ResizablePanels";

export type EditorPreviewProps = {
    editor: React.ReactElement<any, any>;
    preview: React.ReactElement<any, any>;
    previewVisible: boolean;
};

export const EditorPreview: React.VFC<EditorPreviewProps> = props => {
    if (props.previewVisible) {
        return (
            <ResizablePanels direction="horizontal" id="editor-preview">
                <div className="EditorPreviewEditor">{props.editor}</div>
                <div className="EditorPreviewPreview">{props.preview}</div>
            </ResizablePanels>
        );
    }
    return props.editor;
};
