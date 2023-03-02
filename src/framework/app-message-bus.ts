import {changelogWatcherService} from "@services/changelog-service";
import {fileChangesWatcherService} from "@services/file-changes-service";
import {fileOperationsService} from "@services/file-operations-service";
import {fileSystemWatcherService} from "@services/file-system-service";

export const AppMessageBus = {
    changelog: changelogWatcherService.getMessageBus(),
    fileSystem: fileSystemWatcherService.getMessageBus(),
    fileChanges: fileChangesWatcherService.getMessageBus(),
    fileOperations: fileOperationsService.getMessageBus(),
};
