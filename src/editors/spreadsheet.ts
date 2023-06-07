import {GlobalSettings} from "@global/global-settings";

import {File} from "@utils/file-system/file";
import {generateHashCode} from "@utils/hash";

import {WorkBook, read, utils, write} from "xlsx";

import {IEditor, IEditorBasic} from "./editor-basic";

type UndoStack = {
    sheetName: string;
    cellAddress: {
        c: number;
        r: number;
    };
    oldValue: string;
    newValue: string;
}[];

export type WorkBooks = {
    [key: string]: {
        workBook: WorkBook;
        buffer: Buffer;
        undoStack: UndoStack;
    };
};

export class SpreadSheetEditor implements Omit<IEditor<WorkBook>, keyof IEditorBasic> {
    private workBooks: WorkBooks;

    constructor() {
        this.workBooks = {};
    }

    public getHashCode(absoluteFilePath: string): string | false {
        let workBook = this.workBooks[absoluteFilePath];
        let value = "";
        if (!workBook) {
            const file = new File(absoluteFilePath, "");
            if (file.exists()) {
                try {
                    const buffer = file.readBuffer();
                    workBook = {
                        workBook: read(buffer),
                        buffer,
                        undoStack: [],
                    };
                } catch (e) {
                    console.error(e);
                    return false;
                }
            }
        }

        if (workBook) {
            value = workBook.buffer.toString("utf-8") + JSON.stringify(workBook.undoStack);
        }

        return generateHashCode(value);
    }

    public openFile(absoluteFilePath: string): void {
        if (this.workBooks[absoluteFilePath]) {
            return;
        }

        const currentFile = new File(absoluteFilePath, "");
        if (!currentFile.exists()) {
            return;
        }

        const buffer = currentFile.readBuffer();

        const workBook = read(buffer);
        this.workBooks[absoluteFilePath] = {workBook, buffer, undoStack: []};
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

        workBook.undoStack = [];

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

        workBook.undoStack = [];

        return file.writeBuffer(buffer);
    }

    public addAction(
        absoluteFilePath: string,
        sheetName: string,
        cellAddress: {c: number; r: number},
        oldValue: string,
        newValue: string
    ): void {
        const workBook = this.workBooks[absoluteFilePath];
        if (!workBook) {
            return;
        }

        workBook.undoStack.push({sheetName, cellAddress, oldValue, newValue});
    }

    public undoAction(absoluteFilePath: string): void {
        const workBook = this.workBooks[absoluteFilePath];
        if (!workBook) {
            return;
        }

        const undoAction = workBook.undoStack.pop();
        if (!undoAction) {
            return;
        }

        const {sheetName, cellAddress, oldValue} = undoAction;
        const workSheet = workBook.workBook.Sheets[sheetName];
        if (!workSheet) {
            return;
        }

        const cell = {t: "?", v: oldValue};
        const address = utils.encode_cell(cellAddress);

        workSheet[address] = cell;
    }
}
