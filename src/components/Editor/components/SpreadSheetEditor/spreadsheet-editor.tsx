import {editor} from "@editors/editor";
import {EditorType, GlobalSettings} from "@global/global-settings";
import {useElementSize} from "@hooks/useElementSize";
import {SpreadSheetSelection} from "@root/src/shared-types/spreadsheet-selection";
import {notificationsService} from "@services/notifications-service";

import {ipcRenderer} from "electron";

import React from "react";

import {File} from "@utils/file-system/file";
import {Size} from "@utils/geometry";

import {useAppSelector} from "@redux/hooks";

import {CodeEditorViewState} from "@shared-types/files";
import {IpcMessages} from "@shared-types/ipc";
import {NotificationType} from "@shared-types/notifications";

import {cloneDeep} from "lodash";
import path from "path";
import {ColInfo, RowInfo, WorkBook, WorkSheet, utils} from "xlsx";

import {ColumnHeader} from "./components/column-header";
import {RowHeader} from "./components/row-header";
import "./spreadsheet-editor.css";

export type SpreadSheetEditorProps = {
    visible: boolean;
};

const defaultCellSize: Size = {
    width: 100,
    height: 30,
};

const endlessScrollAdditionalSize: Size = {
    width: 300,
    height: 300,
};

const defaultCellSizeWithBorder: Size = {
    width: defaultCellSize.width + 4,
    height: defaultCellSize.height + 4,
};

function makeColumnName(index: number): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numLetters = letters.length;
    const firstLetter = letters[Math.floor(index / numLetters) - 1];
    const secondLetter = letters[index % numLetters];
    return `${firstLetter ?? ""}${secondLetter}`;
}

function makeCellKey(column: number, row: number, value: string): string {
    return `${makeColumnName(column)}-${row}-${value}`;
}

function isCellContainedInSelection(selection: SpreadSheetSelection, column: number, row: number): boolean {
    const startRow = Math.min(selection.start.row, selection.end.row);
    const endRow = Math.max(selection.start.row, selection.end.row);
    const startColumn = Math.min(selection.start.column, selection.end.column);
    const endColumn = Math.max(selection.start.column, selection.end.column);

    return row >= startRow && row <= endRow && column >= startColumn && column <= endColumn;
}

function makeHeaderCellClassName(selection: SpreadSheetSelection | null, column: number, row: number): string {
    const classList: string[] = [];

    if (column === -1) {
        classList.push("row-header-cell");
    }

    if (row === -1) {
        classList.push("column-header-cell");
    }

    if (selection) {
        const startRow = Math.min(selection.start.row, selection.end.row);
        const endRow = Math.max(selection.start.row, selection.end.row);
        const startColumn = Math.min(selection.start.column, selection.end.column);
        const endColumn = Math.max(selection.start.column, selection.end.column);
        if ((row >= startRow && row <= endRow) || (column >= startColumn && column <= endColumn)) {
            classList.push("selected-header");
        }
    }

    return classList.join(" ");
}

function makeCellClassesBasedOnSelection(selection: SpreadSheetSelection | null, row: number, column: number): string {
    if (!selection) {
        return "";
    }

    if (isCellContainedInSelection(selection, column, row)) {
        if (selection.start.row === row && selection.start.column === column) {
            return " first-selected-cell";
        }
        return " selected-cell";
    }
    return "";
}

function makeSelectionFrameClassNames(
    absoluteRow: number,
    absoluteColumn: number,
    selection: SpreadSheetSelection | null
): string {
    if (!selection) {
        return "";
    }

    if (!isCellContainedInSelection(selection, absoluteColumn, absoluteRow)) {
        return "";
    }

    const classList: string[] = ["selection-frame"];
    const startRow = Math.min(selection.start.row, selection.end.row);
    const endRow = Math.max(selection.start.row, selection.end.row);
    const startColumn = Math.min(selection.start.column, selection.end.column);
    const endColumn = Math.max(selection.start.column, selection.end.column);

    if (startRow === absoluteRow) {
        classList.push("selection-frame-top");
    }

    if (endRow === absoluteRow) {
        classList.push("selection-frame-bottom");
    }

    if (startColumn === absoluteColumn) {
        classList.push("selection-frame-left");
    }

    if (endColumn === absoluteColumn) {
        classList.push("selection-frame-right");
    }

    return classList.join(" ");
}

function makeCopyingFrameClassNames(
    absoluteRow: number,
    absoluteColumn: number,
    selection: SpreadSheetSelection | null
): string {
    if (!selection) {
        return "";
    }

    if (!isCellContainedInSelection(selection, absoluteColumn, absoluteRow)) {
        return "";
    }

    const classList: string[] = ["copying-frame"];
    const startRow = Math.min(selection.start.row, selection.end.row);
    const endRow = Math.max(selection.start.row, selection.end.row);
    const startColumn = Math.min(selection.start.column, selection.end.column);
    const endColumn = Math.max(selection.start.column, selection.end.column);

    if (startRow === absoluteRow) {
        classList.push("top");
    }

    if (endRow === absoluteRow) {
        classList.push("bottom");
    }

    if (startColumn === absoluteColumn) {
        classList.push("left");
    }

    if (endColumn === absoluteColumn) {
        classList.push("right");
    }

    return `copying-frame ${classList.join("-")}`;
}

export const SpreadSheetEditor: React.VFC<SpreadSheetEditorProps> = props => {
    const [currentWorkbook, setCurrentWorkbook] = React.useState<WorkBook | null>(null);
    const [currentSheet, setCurrentSheet] = React.useState<WorkSheet | null>(null);
    const [focusedCell, setFocusedCell] = React.useState<{column: number; row: number} | null>(null);
    const [scrollCellLocation, setScrollCellLocation] = React.useState<{column: number; row: number}>({
        column: 0,
        row: 0,
    });
    const [programaticScrolling, setProgramaticScrolling] = React.useState<boolean>(false);
    const [maxCellRange, setMaxCellRange] = React.useState<{column: number; row: number}>({column: 0, row: 0});
    const [columnWidths, setColumnWidths] = React.useState<{[key: number]: number}>({});
    const [rowHeights, setRowHeights] = React.useState<{[key: number]: number}>({});
    const [selection, setSelection] = React.useState<SpreadSheetSelection | null>(null);
    const [copyingSelection, setCopyingSelection] = React.useState<SpreadSheetSelection | null>(null);
    const [scrollPosition, setScrollPosition] = React.useState<{x: number; y: number}>({x: 0, y: 0});

    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const tableRef = React.useRef<HTMLTableElement | null>(null);
    const editorSize = useElementSize(editorRef);

    const verticalHeaderWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const horizontalHeaderWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const tableWrapperRef = React.useRef<HTMLDivElement | null>(null);

    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    React.useEffect(() => {
        if (!currentSheet) {
            return;
        }

        const range = utils.decode_range(currentSheet["!ref"]);
        setMaxCellRange({
            column: range.e.c,
            row: range.e.r,
        });

        if (currentSheet["!cols"]) {
            const newColumnWidths: {[key: number]: number} = {};
            currentSheet["!cols"].forEach((col: ColInfo, index: number) => {
                if (col && col.wpx) {
                    newColumnWidths[index] = col.wpx;
                }
            });
            setColumnWidths(newColumnWidths);
        }

        if (currentSheet["!rows"]) {
            const newRowHeights: {[key: number]: number} = {};
            currentSheet["!rows"].forEach((row: RowInfo, index: number) => {
                if (row && row.hpx) {
                    newRowHeights[index] = row.hpx;
                }
            });
            setRowHeights(newRowHeights);
        }
    }, [currentSheet]);

    const updateViewState = React.useCallback(
        (r?: number, c?: number) => {
            const row = r ?? focusedCell?.row ?? 0;
            const column = c ?? focusedCell?.column ?? 0;
            const viewState: CodeEditorViewState = {
                cursorState: [
                    {
                        inSelectionMode: false,
                        position: {
                            lineNumber: row,
                            column,
                        },
                        selectionStart: {
                            lineNumber: row,
                            column,
                        },
                    },
                ],
                viewState: {
                    scrollTop: editorRef.current.scrollTop,
                    scrollLeft: editorRef.current.scrollLeft,
                    firstPosition: {
                        lineNumber: row,
                        column,
                    },
                    firstPositionDeltaTop: 0,
                },
                contributionsState: {},
            };

            editor.setViewState(activeFilePath, viewState);
        },
        [focusedCell, activeFilePath]
    );

    React.useEffect(() => {
        const tableWrapperRefCurrent = tableWrapperRef.current;
        const handleScrollPositionChange = () => {
            if (!tableWrapperRefCurrent) {
                return;
            }

            if (programaticScrolling) {
                setProgramaticScrolling(false);
                return;
            }

            setScrollCellLocation({
                column: Math.floor(tableWrapperRef.current.scrollLeft / defaultCellSizeWithBorder.width),
                row: Math.floor(tableWrapperRef.current.scrollTop / defaultCellSizeWithBorder.height),
            });

            setScrollPosition({
                x: tableWrapperRef.current.scrollLeft,
                y: tableWrapperRef.current.scrollTop,
            });

            if (horizontalHeaderWrapperRef.current) {
                horizontalHeaderWrapperRef.current.scrollLeft = tableWrapperRef.current.scrollLeft;
            }

            if (verticalHeaderWrapperRef.current) {
                verticalHeaderWrapperRef.current.scrollTop = tableWrapperRef.current.scrollTop;
            }

            updateViewState();
        };

        if (tableWrapperRefCurrent) {
            tableWrapperRefCurrent.addEventListener("scroll", handleScrollPositionChange);
        }

        return () => {
            if (tableWrapperRefCurrent) {
                tableWrapperRefCurrent.removeEventListener("scroll", handleScrollPositionChange);
            }
        };
    }, [maxCellRange, updateViewState, programaticScrolling]);

    React.useEffect(() => {
        const currentFile = new File(path.relative(workingDirectoryPath, activeFilePath), workingDirectoryPath);
        if (!currentFile.exists()) {
            return;
        }

        if (GlobalSettings.editorTypeForFileExtension(currentFile.extension()) !== EditorType.SpreadSheet) {
            return;
        }

        const workbook = editor.getModel<WorkBook>(currentFile.absolutePath());
        if (!workbook) {
            return;
        }
        setCurrentWorkbook(workbook);
        setCurrentSheet(workbook.Sheets[workbook.SheetNames[0]]);

        const viewState = editor.getViewState(activeFilePath);
        if (viewState) {
            setTimeout(() => {
                setFocusedCell({
                    column: viewState.cursorState[0].position.column,
                    row: viewState.cursorState[0].position.lineNumber,
                });

                if (!editorRef.current) {
                    return;
                }

                setScrollCellLocation({
                    column: Math.floor(viewState.viewState.scrollLeft / defaultCellSizeWithBorder.width),
                    row: Math.floor(viewState.viewState.scrollTop / defaultCellSizeWithBorder.height),
                });

                editorRef.current.scrollTop = viewState.viewState.scrollTop;
                editorRef.current.scrollLeft = viewState.viewState.scrollLeft;
            }, 500);
        }
    }, [activeFilePath, workingDirectoryPath]);

    React.useEffect(() => {
        if (editorRef.current && programaticScrolling) {
            editorRef.current.scrollTop = scrollCellLocation.row * defaultCellSizeWithBorder.height;
            editorRef.current.scrollLeft = scrollCellLocation.column * defaultCellSizeWithBorder.width;
        }
    }, [scrollCellLocation, programaticScrolling]);

    React.useEffect(() => {
        let mouseDown = false;
        const handlePointerDown = (e: PointerEvent) => {
            if (!(e.target instanceof HTMLElement)) {
                return;
            }

            let cell = e.target;

            if (cell.classList.contains("row-header-cell")) {
                const rowIndex = parseInt(cell.dataset.rowIndex ?? "0", 10);
                setSelection({start: {row: rowIndex, column: 0}, end: {row: rowIndex, column: Infinity}});
                setFocusedCell({row: rowIndex, column: 0});
                return;
            }

            if (cell.classList.contains("column-header-cell")) {
                const colIndex = parseInt(cell.dataset.columnIndex ?? "0", 10);
                setSelection({start: {row: 0, column: colIndex}, end: {row: Infinity, column: colIndex}});
                setFocusedCell({row: 0, column: colIndex});
                return;
            }

            if (!cell.classList.contains("SpreadSheetTable__cell")) {
                cell = cell.parentElement;
                if (!cell.classList.contains("SpreadSheetTable__cell")) {
                    return;
                }
            }

            const rowIndex = parseInt(cell.dataset.rowIndex ?? "0", 10);
            const colIndex = parseInt(cell.dataset.columnIndex ?? "0", 10);
            mouseDown = true;

            setSelection({start: {row: rowIndex, column: colIndex}, end: {row: rowIndex, column: colIndex}});
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!mouseDown) {
                return;
            }

            if (!(e.target instanceof HTMLElement)) {
                return;
            }

            let cell = e.target;

            if (!cell.classList.contains("SpreadSheetTable__cell")) {
                cell = cell.parentElement;
                if (!cell.classList.contains("SpreadSheetTable__cell")) {
                    return;
                }
            }

            const rowIndex = parseInt(cell.dataset.rowIndex ?? "0", 10);
            const colIndex = parseInt(cell.dataset.columnIndex ?? "0", 10);

            setSelection(prev => ({
                start: prev.start,
                end: {row: rowIndex, column: colIndex},
            }));
        };

        const handlePointerUp = () => {
            mouseDown = false;
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);
        };
    }, []);

    const changeCellValue = React.useCallback(
        (row: number, column: number, value: any) => {
            /* cell object */
            const cell = {t: "?", v: value};
            const address = utils.encode_cell({c: column, r: row});

            /* assign type */
            if (typeof value === "string") cell.t = "s";
            // string
            else if (typeof value === "number") cell.t = "n";
            // number
            else if (value === true || value === false) cell.t = "b";
            // boolean
            else if (value instanceof Date) cell.t = "d";
            else throw new Error("cannot store value");

            /* add to worksheet, overwriting a cell if it exists */
            currentSheet[address] = cell;

            /* find the cell range */
            const range = utils.decode_range(currentSheet["!ref"]);
            const addr = utils.decode_cell(address);

            /* extend the range to include the new cell */
            if (range.s.c > addr.c) range.s.c = addr.c;
            if (range.s.r > addr.r) range.s.r = addr.r;
            if (range.e.c < addr.c) range.e.c = addr.c;
            if (range.e.r < addr.r) range.e.r = addr.r;

            /* update range */
            currentSheet["!ref"] = utils.encode_range(range);

            setMaxCellRange({
                column: Math.max(column, maxCellRange.column),
                row: Math.max(row, maxCellRange.row),
            });
        },
        [currentSheet, maxCellRange]
    );

    const getValue = React.useCallback(
        (row: number, column: number): string => {
            if (!currentSheet) {
                return "";
            }

            const cell = currentSheet[utils.encode_cell({c: column, r: row})];
            return cell ? cell.v : "";
        },
        [currentSheet]
    );

    const getRowHeight = React.useCallback(
        (index: number): number => {
            if (rowHeights[index]) {
                return rowHeights[index];
            }

            return defaultCellSize.height;
        },
        [rowHeights]
    );

    const getColumnWidth = React.useCallback(
        (index: number): number => {
            if (columnWidths[index]) {
                return columnWidths[index];
            }

            return defaultCellSize.width;
        },
        [columnWidths]
    );

    const calcNumColumns = React.useCallback((): number => {
        let width = editorSize.width;
        let index = scrollCellLocation.column;
        let count = 0;
        while (width > 0) {
            width -= getColumnWidth(index++);
            count++;
        }
        return count - 1;
    }, [editorSize.width, scrollCellLocation.column, getColumnWidth]);

    const calcNumRows = React.useCallback((): number => {
        let height = editorSize.height;
        let index = scrollCellLocation.row;
        let count = 0;
        while (height > 0) {
            height -= getRowHeight(index++);
            count++;
        }
        return count - 2;
    }, [editorSize.height, scrollCellLocation.row, getRowHeight]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selection) {
                setProgramaticScrolling(true);

                setScrollCellLocation(prev => ({
                    ...prev,
                    column: Math.max(
                        Math.min(prev.column, selection.start.column),
                        selection.start.column - calcNumColumns() + 5
                    ),
                    row: Math.max(Math.min(prev.row, selection.start.row), selection.start.row - calcNumRows() + 5),
                }));

                const startRow = selection.start.row;
                const startColumn = selection.start.column;
                setFocusedCell({row: startRow, column: startColumn});
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelection(prev => {
                    if (prev.end.row === 0) {
                        return prev;
                    }

                    return {
                        start: {row: prev.start.row - 1, column: prev.start.column},
                        end: {row: prev.start.row - 1, column: prev.start.column},
                    };
                });
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelection(prev => {
                    return {
                        start: {row: prev.start.row + 1, column: prev.start.column},
                        end: {row: prev.start.row + 1, column: prev.start.column},
                    };
                });
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                setSelection(prev => {
                    if (prev.end.column === 0) {
                        return prev;
                    }

                    return {
                        start: {row: prev.start.row, column: prev.start.column - 1},
                        end: {row: prev.start.row, column: prev.start.column - 1},
                    };
                });
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                setSelection(prev => {
                    return {
                        start: {row: prev.start.row, column: prev.start.column + 1},
                        end: {row: prev.start.row, column: prev.start.column + 1},
                    };
                });
            }

            if (e.key === "Enter") {
                setFocusedCell(null);
                e.preventDefault();
                setSelection(prev => {
                    return {
                        start: {row: prev.start.row + 1, column: prev.start.column},
                        end: {row: prev.start.row + 1, column: prev.start.column},
                    };
                });
            }

            if (e.key === "Delete") {
                e.preventDefault();
                const startRow = selection.start.row;
                const startColumn = selection.start.column;
                const endRow = selection.end.row;
                const endColumn = selection.end.column;

                for (let r = startRow; r <= endRow; r++) {
                    for (let c = startColumn; c <= endColumn; c++) {
                        changeCellValue(r, c, "");
                    }
                }
            }

            if (e.key === "c" && e.ctrlKey) {
                e.preventDefault();

                const startRow = selection.start.row;
                const startColumn = selection.start.column;
                const endRow = Math.min(selection.end.row, maxCellRange.row);
                const endColumn = Math.min(selection.end.column, maxCellRange.column);

                const rows: string[] = [];
                for (let r = startRow; r <= endRow; r++) {
                    const columns: string[] = [];
                    for (let c = startColumn; c <= endColumn; c++) {
                        columns.push(getValue(r, c));
                    }
                    rows.push(columns.join("\t"));
                }
                ipcRenderer
                    .invoke(IpcMessages.WRITE_TO_CLIPBOARD, rows.join("\n"))
                    .then((result: boolean) => {
                        if (result) {
                            setCopyingSelection(cloneDeep(selection));
                            return;
                        }

                        setCopyingSelection(null);
                        notificationsService.publishNotification({
                            type: NotificationType.ERROR,
                            message: "Failed to copy selection to clipboard",
                        });
                    })
                    .catch(() => {
                        setCopyingSelection(null);
                        notificationsService.publishNotification({
                            type: NotificationType.ERROR,
                            message: "Failed to copy selection to clipboard",
                        });
                    });
            }

            if (e.key === "v" && e.ctrlKey) {
                e.preventDefault();

                const startRow = selection.start.row;
                const startColumn = selection.start.column;

                ipcRenderer.invoke(IpcMessages.READ_FROM_CLIPBOARD).then(text => {
                    const lines = text.split("\n");
                    let maxColumn = 0;
                    for (let r = 0; r < lines.length; r++) {
                        const cells = lines[r].split("\t");
                        maxColumn = Math.max(maxColumn, cells.length);
                        for (let c = 0; c < cells.length; c++) {
                            changeCellValue(startRow + r, startColumn + c, cells[c]);
                        }
                    }

                    setSelection(prev => {
                        return {
                            start: prev.start,
                            end: {
                                row: prev.start.row + lines.length - 1,
                                column: prev.start.column + maxColumn - 1,
                            },
                        };
                    });
                });
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [selection, changeCellValue, getValue, maxCellRange, calcNumColumns, calcNumRows]);

    const handleInsertColumn = (index: number) => {
        if (!currentSheet) {
            return;
        }

        for (let r = 0; r <= maxCellRange.row; r++) {
            for (let c = maxCellRange.column + 1; c >= index; c--) {
                if (c > index) {
                    const prevValue = getValue(r, c - 1);
                    changeCellValue(r, c, prevValue);
                } else {
                    changeCellValue(r, c, "");
                }
            }
        }
        setMaxCellRange(prev => {
            return {row: prev.row, column: prev.column + 1};
        });
    };

    const handleDeleteColumn = (index: number) => {
        if (!currentSheet) {
            return;
        }

        for (let r = 0; r <= maxCellRange.row; r++) {
            for (let c = index; c <= maxCellRange.column; c++) {
                const nextValue = getValue(r, c + 1);
                changeCellValue(r, c, nextValue);
            }
        }
        setMaxCellRange(prev => {
            return {row: prev.row, column: prev.column - 1};
        });
    };

    const handleInsertRow = (index: number) => {
        if (!currentSheet) {
            return;
        }

        for (let r = maxCellRange.row; r >= index; r--) {
            for (let c = 0; c <= maxCellRange.column; c++) {
                if (r > index) {
                    const prevValue = getValue(r - 1, c);
                    changeCellValue(r, c, prevValue);
                } else {
                    changeCellValue(r, c, "");
                }
            }
        }
        setMaxCellRange(prev => {
            return {row: prev.row + 1, column: prev.column};
        });
    };

    const handleDeleteRow = (index: number) => {
        if (!currentSheet) {
            return;
        }

        for (let r = index; r <= maxCellRange.row; r++) {
            for (let c = 0; c <= maxCellRange.column; c++) {
                const nextValue = getValue(r + 1, c);
                changeCellValue(r, c, nextValue);
            }
        }
        setMaxCellRange(prev => {
            return {row: prev.row - 1, column: prev.column};
        });
    };

    const handleColumnResize = React.useCallback((index: number, size: number) => {
        setColumnWidths(prev => {
            const newColumnWidths = {...prev};
            newColumnWidths[index] = size;
            return newColumnWidths;
        });
    }, []);

    const handleRowResize = React.useCallback((index: number, size: number) => {
        setRowHeights(prev => {
            const newRowHeights = {...prev};
            newRowHeights[index] = size;
            return newRowHeights;
        });
    }, []);

    const startCell = React.useMemo((): {row: number; column: number} => {
        let startColumn = 0;
        let startRow = 0;

        let remainingScrollX = scrollPosition.x;
        let remainingScrollY = scrollPosition.y;

        while (remainingScrollX > 0) {
            const width = columnWidths[startColumn] || defaultCellSize.width;
            remainingScrollX -= width;
            if (remainingScrollX < width) {
                break;
            }
            startColumn++;
        }

        while (remainingScrollY > 0) {
            const height = rowHeights[startRow] || defaultCellSize.height;
            remainingScrollY -= height;
            if (remainingScrollY < height) {
                break;
            }
            startRow++;
        }

        return {row: startRow, column: startColumn};
    }, [columnWidths, rowHeights, scrollPosition]);

    const spacerSize = React.useMemo((): {left: number; top: number} => {
        let spacerLeft = 0;
        let spacerTop = 0;

        for (let i = 0; i < startCell.column; i++) {
            spacerLeft += columnWidths[i] || defaultCellSize.width;
        }

        for (let i = 0; i < startCell.row; i++) {
            spacerTop += rowHeights[i] || defaultCellSize.height;
        }

        return {left: spacerLeft, top: spacerTop};
    }, [startCell, columnWidths, rowHeights]);

    const makeColumnHeaders = (): React.ReactNode[] => {
        const headers = [];
        const startIndex = startCell.column;
        for (let i = 0; i < calcNumColumns(); i++) {
            const absoluteIndex = startIndex + i;
            headers.push(
                <ColumnHeader
                    key={`column-header-${absoluteIndex}`}
                    absoluteIndex={absoluteIndex}
                    className={makeHeaderCellClassName(selection, absoluteIndex, -1)}
                    height={defaultCellSize.height}
                    onInsert={index => handleInsertColumn(index)}
                    onDelete={index => handleDeleteColumn(index)}
                    onResize={handleColumnResize}
                    width={defaultCellSize.width}
                >
                    {makeColumnName(absoluteIndex)}
                </ColumnHeader>
            );
        }
        return headers;
    };

    const makeRowHeaders = (): React.ReactNode[] => {
        const headers = [];

        const startIndex = startCell.row;
        for (let i = 0; i < calcNumRows(); i++) {
            const absoluteIndex = startIndex + i;
            headers.push(
                <RowHeader
                    key={`row-header-${absoluteIndex}`}
                    absoluteIndex={absoluteIndex}
                    height={defaultCellSize.height}
                    width={defaultCellSize.height}
                    className={makeHeaderCellClassName(selection, -1, absoluteIndex)}
                    onDelete={index => handleDeleteRow(index)}
                    onInsert={index => handleInsertRow(index)}
                    onResize={handleRowResize}
                >
                    {absoluteIndex + 1}
                </RowHeader>
            );
        }
        return headers;
    };

    const handleFocusedCellChange = (row: number, column: number) => {
        setFocusedCell({row, column});
        updateViewState(row, column);
        setCopyingSelection(null);
    };

    const handleCellChange = (row: number, column: number, value: any) => {
        if (!currentSheet) {
            return;
        }

        if (focusedCell.row !== row || focusedCell.column !== column) {
            return;
        }

        changeCellValue(row, column, value);
    };

    const calcTableWidth = () => {
        let width = 0;
        for (let i = 0; i <= calcNumColumns(); i++) {
            width += getColumnWidth(i);
        }
        return width;
    };

    const calcTableHeight = () => {
        let height = 0;
        for (let i = 0; i <= calcNumRows(); i++) {
            height += getRowHeight(i);
        }
        return height;
    };

    const verticalHeaders = makeRowHeaders();
    const horizontalHeaders = makeColumnHeaders();

    const totalWidth = editorSize.width + scrollPosition.x + endlessScrollAdditionalSize.width;
    const totalHeight = editorSize.height + scrollPosition.y + endlessScrollAdditionalSize.height;

    return (
        <div ref={editorRef} className="SpreadSheetEditor" style={{display: props.visible ? "block" : "none"}}>
            {currentSheet && currentWorkbook && (
                <>
                    <div className="SpreadSheetEditor__Wrapper">
                        <div
                            className="SpreadSheetEditor__ColRowSpacer"
                            style={{
                                minWidth: defaultCellSizeWithBorder.height,
                                minHeight: defaultCellSizeWithBorder.height,
                            }}
                        />
                        <div className="SpreadSheetEditor__HorizontalHeaderWrapper" ref={horizontalHeaderWrapperRef}>
                            <table
                                className="SpreadSheetTable"
                                style={{height: defaultCellSizeWithBorder.height, width: editorSize.width - 34}}
                            >
                                <thead>
                                    <tr>{horizontalHeaders}</tr>
                                </thead>
                            </table>
                        </div>
                    </div>
                    <div className="SpreadSheetEditor__Wrapper">
                        <div
                            className="SpreadSheetEditor__VerticalHeaderWrapper"
                            ref={verticalHeaderWrapperRef}
                            style={{height: editorSize.height - 36}}
                        >
                            <table className="SpreadSheetTable" style={{width: defaultCellSizeWithBorder.height}}>
                                {verticalHeaders.map((header, row) => (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <tr key={`row-${row}`}>{header}</tr>
                                ))}
                            </table>
                        </div>

                        <div
                            className="SpreadSheetEditor__TableWrapper"
                            style={{width: editorSize.width - 34, height: editorSize.height - 36}}
                            ref={tableWrapperRef}
                        >
                            <div className="SpreadSheetEditor__Wrapper">
                                <div
                                    className="SpreadSheetEditor__TableWrapper__Spacer"
                                    style={{width: spacerSize.left}}
                                />
                                <table className="SpreadSheetTable" ref={tableRef}>
                                    <tbody>
                                        {verticalHeaders.map((_, row) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <tr key={`row-${row}`}>
                                                {horizontalHeaders.map((_, column) => {
                                                    const absoluteRow =
                                                        row + (scrollCellLocation ? scrollCellLocation.row : 0);
                                                    const absoluteColumn =
                                                        column +
                                                        (scrollCellLocation ? scrollCellLocation.column : 0) -
                                                        1;
                                                    return (
                                                        <td
                                                            key={makeCellKey(
                                                                absoluteColumn,
                                                                absoluteRow,
                                                                getValue(absoluteRow, absoluteColumn)
                                                            )}
                                                            className={`SpreadSheetTable__cell${makeCellClassesBasedOnSelection(
                                                                selection,
                                                                absoluteRow,
                                                                absoluteColumn
                                                            )}${
                                                                focusedCell &&
                                                                focusedCell.row === absoluteRow &&
                                                                focusedCell.column === absoluteColumn
                                                                    ? " focused-cell"
                                                                    : ""
                                                            }`}
                                                            data-row-index={absoluteRow}
                                                            data-column-index={absoluteColumn}
                                                            onDoubleClick={() =>
                                                                handleFocusedCellChange(absoluteRow, absoluteColumn)
                                                            }
                                                            onClick={() => {
                                                                if (
                                                                    focusedCell &&
                                                                    focusedCell.row === absoluteRow &&
                                                                    focusedCell.column === absoluteColumn
                                                                ) {
                                                                    return;
                                                                }
                                                                setFocusedCell(null);
                                                            }}
                                                            style={{
                                                                width: getColumnWidth(absoluteColumn),
                                                                height: getRowHeight(absoluteRow),
                                                            }}
                                                        >
                                                            {focusedCell &&
                                                            focusedCell.row === absoluteRow &&
                                                            focusedCell.column === absoluteColumn ? (
                                                                <input
                                                                    type="text"
                                                                    /* eslint-disable-next-line jsx-a11y/no-autofocus */
                                                                    autoFocus
                                                                    defaultValue={getValue(absoluteRow, absoluteColumn)}
                                                                    onChange={e =>
                                                                        handleCellChange(
                                                                            absoluteRow,
                                                                            absoluteColumn,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    onKeyDown={e => {
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setFocusedCell(null);
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="content">
                                                                    {getValue(absoluteRow, absoluteColumn)}
                                                                </div>
                                                            )}
                                                            <div
                                                                className={makeSelectionFrameClassNames(
                                                                    absoluteRow,
                                                                    absoluteColumn,
                                                                    selection
                                                                )}
                                                            />
                                                            <div
                                                                className={makeCopyingFrameClassNames(
                                                                    absoluteRow,
                                                                    absoluteColumn,
                                                                    copyingSelection
                                                                )}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div
                                    className="SpreadSheetEditor__TableWrapper__Spacer"
                                    style={{minWidth: endlessScrollAdditionalSize.width}}
                                />
                            </div>
                            <div
                                className="SpreadSheetEditor__TableWrapper__Spacer"
                                style={{minHeight: endlessScrollAdditionalSize.height}}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
