import {GlobalSettings} from "@global/global-settings";

import {File} from "@utils/file-system/file";
import {generateHashCode} from "@utils/hash";

import {WorkBook, read, write} from "xlsx";

import {IEditor, IEditorBasic} from "./editor-basic";

export type WorkBooks = {
    [key: string]: {
        workBook: WorkBook;
        buffer: Buffer;
    };
};

export class SpreadSheetEditor implements Omit<IEditor<WorkBook>, keyof IEditorBasic> {
    private workBooks: WorkBooks;

    constructor() {
        this.workBooks = {};
    }

    public getHashCode(absoluteFilePath: string): string {
        let workBook = this.workBooks[absoluteFilePath];
        let value = "";
        if (!workBook) {
            const file = new File(absoluteFilePath, "");
            if (file.exists()) {
                const buffer = file.readBuffer();
                workBook = {
                    workBook: read(buffer),
                    buffer,
                };
            }
        }

        if (workBook) {
            value = workBook.buffer.toString("utf-8");
        }

        return generateHashCode(value);
    }

    public openFile(absoluteFilePath: string): void {
        const currentFile = new File(absoluteFilePath, "");
        if (!currentFile.exists()) {
            return;
        }

        const buffer = currentFile.readBuffer();

        const workBook = read(buffer);
        this.workBooks[absoluteFilePath] = {workBook, buffer};
    }

    public getModel<T>(absoluteFilePath: string): T | null {
        return (this.workBooks[absoluteFilePath]?.workBook as T) ?? null;
    }

    public closeFile(absoluteFilePath: string): void {
        delete this.workBooks[absoluteFilePath];
    }

    public saveFile(absoluteFilePath: string): boolean {
        const workBook = this.workBooks[absoluteFilePath];
        if (!workBook) {
            return false;
        }

        const file = new File(absoluteFilePath, "");
        const bookType = GlobalSettings.bookTypeForFileExtension(file.extension());
        if (!bookType) {
            return false;
        }
        const buffer = write(workBook.workBook, {bookType, bookSST: true, type: "buffer"});
        return file.writeBuffer(buffer);
    }

    public saveFileAs(absoluteFilePath: string, newAbsoluteFilePath: string): boolean {
        const workBook = this.workBooks[absoluteFilePath];
        if (!workBook) {
            return false;
        }

        const file = new File(newAbsoluteFilePath, "");
        const bookType = GlobalSettings.bookTypeForFileExtension(file.extension());
        if (!bookType) {
            return false;
        }
        const buffer = write(workBook.workBook, {bookType, bookSST: true, type: "buffer"});
        return file.writeBuffer(buffer);
    }
}
