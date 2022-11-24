/* eslint-disable max-classes-per-file */
import {ICommit, IGlobalChangelog, ILocalChangelog, ISnapshotCommitBundle} from "@shared-types/changelog";

import fs from "fs";
import path from "path";

class DirectoryNotSetError extends Error {
    constructor() {
        super("Changelog directory not set");
        this.name = "DirectoryNotSetError";
    }
}

export class Changelog {
    private directory: string | null;
    private changelog: IGlobalChangelog | null;

    constructor() {
        this.directory = null;
        this.changelog = null;
    }

    public isInitialized(): boolean {
        return this.directory !== null;
    }

    public modifiedTimestamp(): number {
        if (!this.directory) {
            return 0;
        }

        this.createLocalChangelogFileIfNotExists();
        if (!this.changelog) {
            return 0;
        }

        return this.changelog.modified.getTime();
    }

    public setDirectory(directory: string) {
        this.directory = directory;
        this.changelog = null;
        this.maybeRefresh();
    }

    private localChangelogPath(): string {
        if (!this.directory) {
            throw new DirectoryNotSetError();
        }
        return path.join(this.directory, ".changelog.json");
    }

    private getRelativeFilePath(filePath: string): string {
        if (!this.directory) {
            return filePath;
        }

        return path.relative(this.directory, filePath);
    }

    private snapshotsPath(): string {
        if (!this.directory) {
            throw new DirectoryNotSetError();
        }
        return path.join(this.directory, ".snapshots");
    }

    private createLocalChangelogFileIfNotExists(): boolean {
        if (!this.directory) {
            return false;
        }

        if (fs.existsSync(this.localChangelogPath())) {
            return false;
        }

        const currentChangelog: ILocalChangelog = {
            created: new Date(),
            directory: this.directory,
            modified: new Date(),
            log: [],
        };
        fs.writeFileSync(this.localChangelogPath(), JSON.stringify(currentChangelog));
        return true;
    }

    public maybeRefresh() {
        if (!this.directory) {
            return;
        }

        this.createLocalChangelogFileIfNotExists();

        const content = JSON.parse(fs.readFileSync(this.localChangelogPath()).toString());

        this.changelog = {
            created: new Date(content.created),
            directory: content.directory,
            modified: new Date(content.modified),
            log: [
                ...this.getSnapshotCommits(),
                {
                    snapshotPath: null,
                    modified: new Date(content.modified),
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
        if (!this.directory) {
            return [];
        }

        const snapshotFolders = fs.readdirSync(this.snapshotsPath()).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
        const snapshots: ISnapshotCommitBundle[] = [];
        snapshotFolders.forEach(folder => {
            const snapshotPath = path.join(this.snapshotsPath(), folder, ".changelog.json");
            if (!fs.existsSync(snapshotPath)) {
                return;
            }
            const snapshotChangelog = JSON.parse(
                fs.readFileSync(path.join(snapshotPath, ".changelog.json")).toString()
            );
            snapshots.push({
                snapshotPath: path.join(this.snapshotsPath(), folder),
                modified: fs.statSync(snapshotPath).mtime,
                commits: snapshotChangelog.log.map((commit: ICommit) => ({
                    ...commit,
                    datetime: new Date(commit.datetime),
                })),
            });
        });

        return snapshots;
    };

    public saveLocalChangelog(): boolean {
        if (!this.directory) {
            return false;
        }

        if (!this.changelog) {
            return false;
        }

        const localChangelog: ILocalChangelog = {
            created: this.changelog.created,
            directory: this.changelog.directory,
            modified: new Date(),
            log: this.changelog.log
                .filter(bundle => bundle.snapshotPath === null)
                .map(bundle => bundle.commits)
                .flat(),
        };

        try {
            fs.writeFileSync(this.localChangelogPath(), JSON.stringify(localChangelog));
            return true;
        } catch (_) {
            return false;
        }
    }

    public appendCommit(commit: ICommit): boolean {
        if (!this.directory) {
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
        this.changelog.modified = new Date();
        return this.saveLocalChangelog();
    }

    public getChangesForFile(filePath: string): ISnapshotCommitBundle[] {
        if (!filePath || filePath === "") {
            return [];
        }
        if (!this.directory) {
            return [];
        }

        this.createLocalChangelogFileIfNotExists();
        if (!this.changelog) {
            return [];
        }

        const bundles: ISnapshotCommitBundle[] = [];

        this.changelog.log.forEach(bundle => {
            const commits = bundle.commits.filter(commit => commit.files.includes(this.getRelativeFilePath(filePath)));
            if (commits.length > 0) {
                bundles.push({
                    snapshotPath: bundle.snapshotPath,
                    modified: bundle.modified,
                    commits: [
                        ...commits.map(commit => ({
                            ...commit,
                            datetime: new Date(commit.datetime),
                        })),
                    ],
                });
            }
        });

        return bundles;
    }
}
