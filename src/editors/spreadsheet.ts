import {GlobalSettings} from "@global/global-settings";

import {File} from "@utils/file-system/file";
import {generateHashCode} from "@utils/hash";

import {WorkBook, read, utils, write} from "xlsx";

import {IEditor, IEditorBasic} from "./editor-basic";

export class SpreadSheetEditor implements Omit<IEditor<WorkBook>, keyof IEditorBasic> {
    private workBooks: Record<string, WorkBook>;

    constructor() {
        this.workBooks = {};
    }

    public getHashCode(absoluteFilePath: string): string {
        let workBook = this.workBooks[absoluteFilePath];
        let value = "";
        if (!workBook) {
            const file = new File(absoluteFilePath, "");
            if (file.exists()) {
                workBook = read(file.readBuffer());
            }
        }

        if (workBook) {
            workBook.SheetNames.forEach(sheetName => {
                value += utils.sheet_to_txt(workBook.Sheets[sheetName]);
            });
        }

        return generateHashCode(value);
    }

    public openFile(absoluteFilePath: string): void {
        const currentFile = new File(absoluteFilePath, "");
        if (!currentFile.exists()) {
            return;
        }

        const workbook = read(currentFile.readBuffer());
        this.workBooks[absoluteFilePath] = workbook;
    }

    public getModel<T>(absoluteFilePath: string): T | null {
        return (this.workBooks[absoluteFilePath] as T) || null;
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
        const buffer = write(workBook, {bookType, bookSST: true, type: "buffer"});
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
        const buffer = write(workBook, {bookType, bookSST: true, type: "buffer"});
        return file.writeBuffer(buffer);
    }
}
