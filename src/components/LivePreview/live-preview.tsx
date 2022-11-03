import {Edit as EditIcon, Visibility} from "@mui/icons-material";
import {
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";

import React from "react";

import {LayoutObject} from "@utils/yaml-parser";

import {PluginPreview} from "@components/PluginPreview";

import {useAppSelector} from "@redux/hooks";

import {NavigationType} from "@shared-types/navigation";
import {Menu} from "../Menu";

import "./live-preview.css";

export enum PreviewMode {
    Edit = "EDIT",
    View = "VIEW",
}
export const LivePreview: React.FC = () => {
    const [navigationItems, setNavigationItems] =
        React.useState<NavigationType>([]);
    const [title, setTitle] = React.useState<string>("");
    const mode = PreviewMode.View;
    const [currentPageContent, setCurrentPageContent] = React.useState<
        LayoutObject[]
    >([]);
    const theme = useTheme();

    const file = useAppSelector(state =>
        state.files.files.find(el => el.filePath === state.files.activeFile)
    );

    React.useEffect(() => {
        if (!file || file.yamlObjects.length === 0) {
            setNavigationItems([]);
            setCurrentPageContent([]);
            setTitle("");
            return;
        }

        setTitle(file.title);
        setNavigationItems(file.navigationItems);
    }, [file, file?.yamlObjects]);

    React.useEffect(() => {
        setCurrentPageContent(
            (file?.currentPage?.children as LayoutObject[]) || []
        );
    }, [file?.currentPage]);

    return (
        <div className="LivePreview">
            <Paper
                square
                className="LivePreview__Title"
                style={{backgroundColor: theme.palette.background.paper}}
            >
                <Stack
                    spacing={4}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="subtitle1">
                        {title || <em>No title defined yet</em>}
                    </Typography>
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={() => {}}
                        aria-label="preview mode"
                    >
                        <ToggleButton
                            value={PreviewMode.Edit}
                            aria-label="edit mode"
                            disabled
                        >
                            <Tooltip
                                title="This feature is coming soon."
                                style={{pointerEvents: "auto"}}
                            >
                                <EditIcon />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton
                            value={PreviewMode.View}
                            aria-label="view mode"
                        >
                            <Visibility />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Paper>
            <div className="LivePreview__Content">
                <div className="LivePreview__Menu">
                    <Menu navigationItems={navigationItems} />
                </div>
                {currentPageContent.length > 0 ? (
                    <div className="LivePreview__Page">
                        {currentPageContent.map((plugin: LayoutObject) => (
                            <PluginPreview key={plugin.id} data={plugin} />
                        ))}
                    </div>
                ) : (
                    <div
                        className="LivePreview__NoContent"
                        style={{color: theme.palette.text.primary}}
                    >
                        Please select a page or plugin object to show its
                        content.
                    </div>
                )}
                {}
            </div>
        </div>
    );
};
