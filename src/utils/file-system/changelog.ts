/* eslint-disable max-classes-per-file */
import {DIRECTORY_PATHS, SYSTEM_FILES} from "@global/constants";

import {ICommit, IGlobalChangelog, ILocalChangelog, ISnapshotCommitBundle} from "@shared-types/changelog";

import {Directory} from "./directory";
import {File} from "./file";

export class Changelog {
    private workingDirectoryPath: string | null;
    private changelog: IGlobalChangelog | null;
    private changelogFile: File | null;

    constructor(workingDirectoryPath: string | null = null) {
        this.workingDirectoryPath = workingDirectoryPath;
        this.changelog = null;
        this.changelogFile = null;
        this.maybeRefresh();
    }

    public isInitialized(): boolean {
        return this.workingDirectoryPath !== null;
    }

    public modifiedTimestamp(): number {
        if (!this.workingDirectoryPath) {
            return 0;
        }

        this.createLocalChangelogFileIfNotExists();
        if (!this.changelog) {
            return 0;
        }

        return this.changelog.modified;
    }

    public setWorkingDirectoryPath(workingDirectoryPath: string) {
        this.workingDirectoryPath = workingDirectoryPath;
        this.changelog = null;
        this.maybeRefresh();
    }

    private static changelogIsCorrectlyFormatted(content: any): boolean {
        return (
            content &&
            content.created &&
            content.directory &&
            content.modified &&
            content.log &&
            Array.isArray(content.log)
        );
    }

    private createLocalChangelogFileIfNotExists(): boolean {
        if (!this.workingDirectoryPath) {
            return false;
        }

        if (this.changelogFile && this.changelogFile.exists()) {
            const content = this.changelogFile.readJson();
            if (Changelog.changelogIsCorrectlyFormatted(content)) {
                return false;
            }
        }

        const currentTimestamp = new Date().getTime();

        const currentChangelog: ILocalChangelog = {
            created: currentTimestamp,
            directory: this.workingDirectoryPath,
            modified: currentTimestamp,
            log: [],
        };

        this.changelogFile.writeJson(currentChangelog);
        return true;
    }

    public maybeRefresh() {
        if (!this.workingDirectoryPath) {
            return;
        }

        if (!this.changelogFile) {
            this.changelogFile = new File(SYSTEM_FILES.CHANGELOG, this.workingDirectoryPath);
        }

        this.createLocalChangelogFileIfNotExists();

        const content = this.changelogFile.readJson();

        this.changelog = {
            created: content.created,
            directory: content.directory,
            modified: content.modified,
            log: [
                ...this.getSnapshotCommits(),
                {
                    snapshotPath: null,
                    modified: content.modified,
                    commits: content.log,
                },
            ],
        };
    }

    public get(): IGlobalChangelog {
        this.createLocalChangelogFileIfNotExists();
        if (!this.changelog) {
            throw new Error("Changelog not initialized");
        }
        return this.changelog;
    }

    private getSnapshotCommits: () => ISnapshotCommitBundle[] = () => {
        if (!this.workingDirectoryPath) {
            return [];
        }

        if (!this.changelogFile.exists()) {
            return [];
        }

        const snapshotDirectory = new Directory(DIRECTORY_PATHS.SNAPSHOTS, this.workingDirectoryPath);

        const snapshotFolders = snapshotDirectory.getContent().filter(item => item.isDirectory());
        const snapshots: ISnapshotCommitBundle[] = [];
        snapshotFolders.forEach(folder => {
            const changelogFile = new File(SYSTEM_FILES.CHANGELOG, folder.absolutePath());
            if (!changelogFile.exists()) {
                return;
            }

            const snapshotChangelog = changelogFile.readJson();
            snapshots.push({
                snapshotPath: folder.absolutePath(),
                modified: changelogFile.modifiedTime(),
                commits: snapshotChangelog.log,
            });
        });

        return snapshots;
    };

    public saveLocalChangelog(): boolean {
        if (!this.workingDirectoryPath) {
            return false;
        }

        if (!this.changelog) {
            return false;
        }

        const localChangelog: ILocalChangelog = {
            created: this.changelog.created,
            directory: this.changelog.directory,
            modified: new Date().getTime(),
            log: this.changelog.log
                .filter(bundle => bundle.snapshotPath === null)
                .map(bundle => bundle.commits)
                .flat(),
        };

        try {
            this.changelogFile.writeJson(localChangelog);
            return true;
        } catch (_) {
            return false;
        }
    }

    public appendCommit(commit: ICommit): boolean {
        if (!this.workingDirectoryPath) {
            return false;
        }

        this.createLocalChangelogFileIfNotExists();
        if (!this.changelog) {
            return false;
        }

        const localChangelog = this.changelog.log.find(bundle => bundle.snapshotPath === null);
        if (!localChangelog) {
            return false;
        }

        localChangelog.commits.push(commit);
        this.changelog.modified = new Date().getTime();
        return this.saveLocalChangelog();
    }

    public getChangesForFile(relativeFilePath: string): ISnapshotCommitBundle[] {
        if (!relativeFilePath || relativeFilePath === "") {
            return [];
        }
        if (!this.workingDirectoryPath) {
            return [];
        }

        this.createLocalChangelogFileIfNotExists();
        if (!this.changelog) {
            return [];
        }

        const bundles: ISnapshotCommitBundle[] = [];

        this.changelog.log.forEach(bundle => {
            const commits = bundle.commits.filter(commit => commit.files.some(el => el.path === relativeFilePath));
            if (commits.length > 0) {
                bundles.push({
                    snapshotPath: bundle.snapshotPath,
                    modified: bundle.modified,
                    commits: [...commits].reverse(),
                });
            }
        });

        return bundles.sort((a, b) => b.modified - a.modified);
    }

    public getAllChanges(): ISnapshotCommitBundle[] {
        if (!this.workingDirectoryPath) {
            return [];
        }

        this.createLocalChangelogFileIfNotExists();
        if (!this.changelog) {
            return [];
        }

        const bundles: ISnapshotCommitBundle[] = [];

        this.changelog.log.forEach(bundle => {
            const commits = bundle.commits;
            bundles.push({
                snapshotPath: bundle.snapshotPath,
                modified: bundle.modified,
                commits: [...commits].reverse(),
            });
        });

        return bundles.sort((a, b) => b.modified - a.modified);
    }
}
