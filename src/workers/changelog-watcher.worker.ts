import {Changelog} from "@utils/file-system/changelog";

import {
    ChangelogWatcherRequestTypes,
    ChangelogWatcherRequests,
    ChangelogWatcherResponseTypes,
    ChangelogWatcherResponses,
} from "@shared-types/changelog";

import {Webworker} from "./worker-utils";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<ChangelogWatcherResponses, ChangelogWatcherRequests>({self});

const changelog = new Changelog();
let lastTimestamp = 0;

const refreshChangelog = () => {
    if (!changelog.isInitialized()) {
        return;
    }
    changelog.maybeRefresh();
    if (changelog.modifiedTimestamp() > lastTimestamp) {
        webworker.postMessage(ChangelogWatcherResponseTypes.MODIFIED);
        lastTimestamp = changelog.modifiedTimestamp();
    }
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(refreshChangelog, 3000);

webworker.on(ChangelogWatcherRequestTypes.SET_DIRECTORY, ({directory}) => {
    changelog.setDirectory(directory);
});

webworker.on(ChangelogWatcherRequestTypes.APPEND_COMMIT, ({commit}) => {
    changelog.appendCommit(commit);
});

webworker.on(ChangelogWatcherRequestTypes.GET_CHANGES_FOR_FILE, ({filePath}) => {
    webworker.postMessage(ChangelogWatcherResponseTypes.CHANGES_FOR_FILE, {
        changes: changelog.getChangesForFile(filePath),
    });
});

webworker.on(ChangelogWatcherRequestTypes.GET_ALL_CHANGES, () => {
    webworker.postMessage(ChangelogWatcherResponseTypes.ALL_CHANGES, {
        changes: changelog.getAllChanges(),
    });
});
