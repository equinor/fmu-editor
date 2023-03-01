import { changelogWatcherService } from "@services/changelog-service"
import { fileSystemWatcherService } from "@services/file-system-service"

export const AppMessageBus = {
    changelog: changelogWatcherService.getMessageBus(),
    fileSystem: fileSystemWatcherService.getMessageBus(),
}
