import {CircularProgress, Typography} from "@mui/material";
import {Stack} from "@mui/system";
import {ChangelogWatcherTopics, changelogWatcherService} from "@services/changelog-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscSourceControl} from "react-icons/vsc";

import {CommitList} from "@components/CommitList";
import {Surface} from "@components/Surface";

import {useAppDispatch} from "@redux/hooks";
import {setCurrentCommit} from "@redux/reducers/ui";

import {ICommit, ISnapshotCommitBundle} from "@shared-types/changelog";
import {NotificationType} from "@shared-types/notifications";

import "./commit-browser.css";

export const CommitBrowser: React.FC = () => {
    const [initialized, setInitialized] = React.useState<boolean>(false);
    const [commitBundles, setCommitBundles] = React.useState<ISnapshotCommitBundle[]>([]);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        const getChangelogChanges = () => {
            changelogWatcherService
                .getAllChanges()
                .then(result => {
                    setCommitBundles(result);
                })
                .catch(error => {
                    notificationsService.publishNotification({
                        type: NotificationType.ERROR,
                        message: error,
                    });
                })
                .finally(() => {
                    setInitialized(true);
                });
        };
        getChangelogChanges();

        const unsubscribeFunc = changelogWatcherService
            .getMessageBus()
            .subscribe(ChangelogWatcherTopics.MODIFIED, getChangelogChanges);

        return unsubscribeFunc;
    }, []);

    const handleCommitClick = React.useCallback(
        (commit: ICommit, snapshotPath: string, compareSnapshotPath: string) => {
            dispatch(setCurrentCommit({...commit, snapshotPath, compareSnapshotPath}));
        },
        [dispatch]
    );

    const makeContent = () => {
        if (!initialized) {
            return (
                <Stack direction="column" className="CommitBrowserEmpty" spacing={2}>
                    <CircularProgress />
                    <Typography variant="body2">Loading commits...</Typography>
                </Stack>
            );
        }

        if (commitBundles.length === 0) {
            return (
                <Stack direction="column" className="CommitBrowserEmpty" spacing={2}>
                    <VscSourceControl size={40} />
                    <Typography variant="body2">No commits in the current working directory yet</Typography>
                </Stack>
            );
        }

        return <CommitList commitBundles={commitBundles} onCommitClick={handleCommitClick} />;
    };

    return (
        <Surface elevation="none" className="CommitBrowser" id="commit-browser">
            <div className="CommitBrowserContent">{makeContent()}</div>
        </Surface>
    );
};
