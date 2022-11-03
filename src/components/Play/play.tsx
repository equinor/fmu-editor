import {Error, Terminal} from "@mui/icons-material";
import {
    CircularProgress,
    Grid,
    Paper,
    Typography,
    useTheme,
} from "@mui/material";
import {
    WebvizBuildState,
    useWebvizBuildService,
} from "@services/webviz-build-service";

import React from "react";
import Iframe from "react-iframe";

import {ResizablePanels} from "@components/ResizablePanels";

import "./play.css";

const formatConsoleLine = (line: string): JSX.Element => {
    const colorTable: {
        [key: string]: {color: string; backgroundColor: string};
    } = {
        "37;43m": {color: "#fff", backgroundColor: "#DEA900"},
        "37;41m": {color: "#fff", backgroundColor: "#890000"},
    };
    /* eslint-disable no-control-regex */
    const regexp = /(\x1b[[0-9]{1,};?[0-9]{0,}m)([^\x1b]{0,})/g;

    const matches = line.matchAll(regexp);
    const output: JSX.Element[] = [];
    Array.from(matches).forEach((match, index) => {
        if (match.length > 1) {
            const colorCode = match[1].replace("\x1b[", "");
            const colorExists = Object.keys(colorTable).find(
                el => el === colorCode
            );
            const color = colorExists
                ? colorTable[colorCode]
                : {color: "inherit", backgroundColor: "inherit"};
            output.push(
                <span
                    style={{
                        color: color.color,
                        backgroundColor: color.backgroundColor,
                    }}
                    /* eslint-disable react/no-array-index-key */
                    key={`line-element-${index}`}
                >
                    {match[2]}
                </span>
            );
        } else {
            output.push(<span>{match[2]}</span>);
        }
    });
    return <>{output}</>;
};

export const Play: React.FC = () => {
    const webvizBuilder = useWebvizBuildService();
    const [pageAccessible, setPageAccessible] = React.useState<boolean>(false);
    const [noResponse, setNoResponse] = React.useState<boolean>(false);
    const [noPermission, setNoPermission] = React.useState<boolean>(false);

    const theme = useTheme();

    React.useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        let checks = 0;
        const checkIfPageAccessible = () => {
            fetch(
                `http://localhost:${webvizBuilder.port}?ott=${webvizBuilder.token}`
            )
                .then(response => {
                    setPageAccessible(response.ok);
                    timeout = null;
                    if (!response.ok) {
                        checks++;
                        if (response.status === 404) {
                            if (checks > (3 * 60 * 1000) / 3000) {
                                setNoResponse(true);
                                return;
                            }
                            timeout = setTimeout(checkIfPageAccessible, 3000);
                        } else {
                            setNoPermission(true);
                        }
                    }
                })
                .catch(() => {
                    setPageAccessible(false);
                });
        };
        timeout = setTimeout(checkIfPageAccessible, 3000);
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [webvizBuilder.port, webvizBuilder.token]);

    return (
        <div className="Play">
            <ResizablePanels id="Play-Console" direction="vertical">
                {webvizBuilder.builderState !== WebvizBuildState.Loaded ||
                !pageAccessible ||
                noResponse ||
                noPermission ? (
                    <Grid
                        container
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                        spacing={2}
                        className="Playground"
                        style={{height: "100%"}}
                    >
                        {(webvizBuilder.builderState ===
                            WebvizBuildState.FileError ||
                            webvizBuilder.builderState ===
                                WebvizBuildState.PythonError) && (
                            <>
                                <Grid item>
                                    <Error fontSize="large" color="action" />
                                </Grid>
                                <Grid item>
                                    <Typography
                                        variant="body1"
                                        color={theme.palette.text.primary}
                                    >
                                        An error occurred.
                                    </Typography>
                                </Grid>
                            </>
                        )}
                        {webvizBuilder.builderState ===
                            WebvizBuildState.UnsavedFile && (
                            <>
                                <Grid item>
                                    <Error fontSize="large" color="action" />
                                </Grid>
                                <Grid item>
                                    <Typography
                                        variant="body1"
                                        color={theme.palette.text.primary}
                                    >
                                        Your file has to be saved before it can
                                        be displayed.
                                    </Typography>
                                </Grid>
                            </>
                        )}
                        {noResponse && (
                            <>
                                <Grid item>
                                    <Error fontSize="large" color="action" />
                                </Grid>
                                <Grid item>
                                    <Typography
                                        variant="body1"
                                        color={theme.palette.text.primary}
                                    >
                                        Timeout for building your app exceeded.
                                        Something has gone wrong.
                                    </Typography>
                                </Grid>
                            </>
                        )}
                        {noPermission && (
                            <>
                                <Grid item>
                                    <Error fontSize="large" color="action" />
                                </Grid>
                                <Grid item>
                                    <Typography
                                        variant="body1"
                                        color={theme.palette.text.primary}
                                    >
                                        Permission to access your dashboard
                                        denied. Something has gone wrong.
                                    </Typography>
                                </Grid>
                            </>
                        )}
                        {webvizBuilder.builderState ===
                            WebvizBuildState.Loading &&
                            !noResponse && (
                                <>
                                    <Grid item>
                                        <CircularProgress />
                                    </Grid>
                                    <Grid item>
                                        <Typography
                                            variant="body1"
                                            color={theme.palette.text.primary}
                                        >
                                            Building the Webviz dashboard...
                                        </Typography>
                                    </Grid>
                                </>
                            )}
                        {webvizBuilder.builderState ===
                            WebvizBuildState.Loaded &&
                            !pageAccessible &&
                            !noResponse &&
                            !noPermission && (
                                <>
                                    <Grid item>
                                        <CircularProgress />
                                    </Grid>
                                    <Grid item>
                                        <Typography
                                            variant="body1"
                                            color={theme.palette.text.primary}
                                            style={{textAlign: "center"}}
                                        >
                                            Starting the Webviz dashboard...
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color={theme.palette.text.secondary}
                                            style={{textAlign: "center"}}
                                        >
                                            <i>
                                                Depending on the size of your
                                                app and the data that needs to
                                                be loaded, this might take a
                                                while.
                                            </i>
                                        </Typography>
                                    </Grid>
                                </>
                            )}
                    </Grid>
                ) : (
                    <div
                        style={{
                            backgroundColor: "#fff",
                            height: "100%",
                            width: "100%",
                        }}
                    >
                        <Iframe
                            url={`http://localhost:${webvizBuilder.port}?ott=${webvizBuilder.token}`}
                            width="100%"
                            height="100%"
                        />
                    </div>
                )}
                <div
                    className="Console"
                    style={{color: theme.palette.text.primary}}
                >
                    <Paper
                        elevation={1}
                        style={{padding: 16}}
                        sx={{borderRadius: 0}}
                    >
                        <Grid
                            container
                            columnSpacing={2}
                            spacing={5}
                            direction="row"
                            alignItems="center"
                        >
                            <Grid item>
                                <Terminal color="action" />
                            </Grid>
                            <Grid item>Terminal</Grid>
                        </Grid>
                    </Paper>
                    <div className="ConsoleContent">
                        {webvizBuilder.consoleMessages.map(msg => (
                            <div className="ConsoleLine" key={msg}>
                                {formatConsoleLine(msg)}
                            </div>
                        ))}
                    </div>
                </div>
            </ResizablePanels>
        </div>
    );
};
