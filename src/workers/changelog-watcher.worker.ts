import {Changelog} from "@utils/changelog";

import {ChangelogWatcherRequest, ChangelogWatcherResponse} from "@shared-types/changelog";

const changelog = new Changelog();
let lastTimestamp = 0;

const refreshChangelog = () => {
    if (!changelog.isInitialized()) {
        return;
    }
    changelog.maybeRefresh();
    if (changelog.modifiedTimestamp() > lastTimestamp) {
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({type: ChangelogWatcherResponse.MODIFIED});
        lastTimestamp = changelog.modifiedTimestamp();
    }
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(refreshChangelog, 3000);

// eslint-disable-next-line no-restricted-globals
self.addEventListener("message", event => {
    switch (event.data.type) {
        case ChangelogWatcherRequest.SET_DIRECTORY:
            changelog.setDirectory(event.data.directory);
            break;
        case ChangelogWatcherRequest.APPEND_COMMIT:
            changelog.appendCommit(event.data.commit);
            // eslint-disable-next-line no-restricted-globals
            self.postMessage({type: ChangelogWatcherResponse.COMMIT_APPENDED});
            break;
        case ChangelogWatcherRequest.GET_CHANGES_FOR_FILE:
            // eslint-disable-next-line no-restricted-globals
            self.postMessage({
                type: ChangelogWatcherResponse.CHANGES_FOR_FILE,
                changes: changelog.getChangesForFile(event.data.filePath),
            });
            break;
        default:
    }
});
