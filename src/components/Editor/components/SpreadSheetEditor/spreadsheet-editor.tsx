import {editor} from "@editors/editor";
import {EditorType, GlobalSettings} from "@global/global-settings";
import {useElementSize} from "@hooks/useElementSize";
import {CodeEditorViewState} from "@root/src/shared-types/files";
import {SpreadSheetSelection} from "@root/src/shared-types/spreadsheet-selection";
import {Point} from "@root/src/utils/geometry";
import {notificationsService} from "@services/notifications-service";

import {ipcRenderer} from "electron";

import React from "react";

import {File} from "@utils/file-system/file";

import {useAppSelector} from "@redux/hooks";

import {IpcMessages} from "@shared-types/ipc";
import {NotificationType} from "@shared-types/notifications";
import {Size} from "@shared-types/size";

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

enum ScrollDirection {
    Up,
    Down,
    Left,
    Right,
    None,
}

type ScrollDirections = {
    horizontal: ScrollDirection.Left | ScrollDirection.Right | ScrollDirection.None;
    vertical: ScrollDirection.Up | ScrollDirection.Down | ScrollDirection.None;
};

const defaultCellSizeWithBorder: Size = {
    width: defaultCellSize.width + 4,
    height: defaultCellSize.height + 4,
};

function getScrollDirections(oldScrollPosition: Point, newScrollPosition: Point): ScrollDirections {
    let scrollDirections: ScrollDirections = {
        horizontal: ScrollDirection.None,
        vertical: ScrollDirection.None,
    };
    if (oldScrollPosition.x < newScrollPosition.x) {
        scrollDirections.horizontal = ScrollDirection.Right;
    } else if (oldScrollPosition.x > newScrollPosition.x) {
        scrollDirections.horizontal = ScrollDirection.Left;
    }

    if (oldScrollPosition.y < newScrollPosition.y) {
        scrollDirections.vertical = ScrollDirection.Down;
    } else if (oldScrollPosition.y > newScrollPosition.y) {
        scrollDirections.vertical = ScrollDirection.Up;
    }

    return scrollDirections;
}

function makeColumnName(index: number): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const firstLetter = letters[Math.floor(index / letters.length) - 1];
    const secondLetter = letters[index % letters.length];
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
    const [scrollPosition, setScrollPosition] = React.useState<Point>({x: 0, y: 0});

    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const tableRef = React.useRef<HTMLTableElement | null>(null);
    const editorSize = useElementSize(editorRef);

    const scrollLayerRef = React.useRef<HTMLDivElement | null>(null);

    const tableWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const tableWrapperSize = useElementSize(tableWrapperRef);

    const verticalHeaderWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const horizontalHeaderWrapperRef = React.useRef<HTMLDivElement | null>(null);

    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    const getRowHeight = React.useCallback(
        (index: number, withPadding: boolean = false): number => {
            if (rowHeights[index]) {
                return rowHeights[index] + Number(withPadding) * 4;
            }

            return defaultCellSize.height + Number(withPadding) * 4;
        },
        [rowHeights]
    );

    const getColumnWidth = React.useCallback(
        (index: number, withPadding: boolean = false): number => {
            if (columnWidths[index]) {
                return columnWidths[index] + Number(withPadding) * 4;
            }

            return defaultCellSize.width + Number(withPadding) * 4;
        },
        [columnWidths]
    );

    const calcNumColumns = React.useCallback((): number => {
        let width = tableWrapperSize.width;
        let index = scrollCellLocation.column;
        let count = 0;
        while (width > 0) {
            width -= getColumnWidth(index++, true);
            count++;
        }
        return count - 1;
    }, [tableWrapperSize.width, scrollCellLocation.column, getColumnWidth]);

    const calcNumRows = React.useCallback((): number => {
        let height = tableWrapperSize.height;
        let index = startCell.row;
        let count = 0;
        while (height > 0) {
            height -= getRowHeight(index++, true);
            count++;
        }
        return count - 1;
    }, [tableWrapperSize.height, scrollCellLocation.row, getRowHeight]);

    React.useEffect(() => {
        if (!currentSheet) {
            return;
        }

        console.log("sheet changed");

        const range = utils.decode_range(currentSheet["!ref"]);
        setMaxCellRange(prev => ({
            column: Math.max(range.e.c, calcNumColumns(), prev.column),
            row: Math.max(range.e.r, calcNumRows(), prev.row),
        }));

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
        const tableWrapperRefCurrent = scrollLayerRef.current;
        const handleScrollPositionChange = () => {
            if (!tableWrapperRefCurrent) {
                return;
            }

            if (programaticScrolling) {
                setProgramaticScrolling(false);
                return;
            }

            setScrollCellLocation({
                column: Math.floor(scrollLayerRef.current.scrollLeft / defaultCellSizeWithBorder.width),
                row: Math.floor(scrollLayerRef.current.scrollTop / defaultCellSizeWithBorder.height),
            });

            const newScrollPosition = {
                x: scrollLayerRef.current.scrollLeft,
                y: scrollLayerRef.current.scrollTop,
            };

            const scrollDirections = getScrollDirections(scrollPosition, newScrollPosition);

            setScrollPosition(newScrollPosition);

            let newMaxColumn = maxCellRange.column;
            if (
                scrollLayerRef.current.scrollLeft /
                    (scrollLayerRef.current.scrollWidth - scrollLayerRef.current.clientWidth) >
                    0.95 &&
                scrollDirections.horizontal === ScrollDirection.Right
            ) {
                newMaxColumn = maxCellRange.column + 1;
            }

            let newMaxRow = maxCellRange.row;
            if (
                scrollLayerRef.current.scrollTop /
                    (scrollLayerRef.current.scrollHeight - scrollLayerRef.current.clientHeight) >
                    0.95 &&
                scrollDirections.vertical === ScrollDirection.Down
            ) {
                newMaxRow = maxCellRange.row + 1;
            }

            if (tableWrapperRef.current) {
                tableWrapperRef.current.scrollTop = scrollLayerRef.current.scrollTop;
                tableWrapperRef.current.scrollLeft = scrollLayerRef.current.scrollLeft;
            }
            if (horizontalHeaderWrapperRef.current) {
                horizontalHeaderWrapperRef.current.scrollLeft = scrollLayerRef.current.scrollLeft;
            }

            if (verticalHeaderWrapperRef.current) {
                verticalHeaderWrapperRef.current.scrollTop = scrollLayerRef.current.scrollTop;
            }

            setMaxCellRange(prev => ({
                column: Math.max(prev.column, newMaxColumn),
                row: Math.max(prev.row, newMaxRow),
            }));

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
    }, [maxCellRange]);

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

                tableRef.current.scrollTop = viewState.viewState.scrollTop;
                tableRef.current.scrollLeft = viewState.viewState.scrollLeft;
            }, 500);
        }
    }, [activeFilePath, workingDirectoryPath]);

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
            const cell = {t: "?", v: value};
            const address = utils.encode_cell({c: column, r: row});

            if (typeof value === "string") cell.t = "s";
            // string
            else if (typeof value === "number") cell.t = "n";
            // number
            else if (value === true || value === false) cell.t = "b";
            // boolean
            else if (value instanceof Date) cell.t = "d";
            else throw new Error("cannot store value");

            currentSheet[address] = cell;

            const range = utils.decode_range(currentSheet["!ref"]);
            const addr = utils.decode_cell(address);

            if (range.s.c > addr.c) range.s.c = addr.c;
            if (range.s.r > addr.r) range.s.r = addr.r;
            if (range.e.c < addr.c) range.e.c = addr.c;
            if (range.e.r < addr.r) range.e.r = addr.r;

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

    const calcStartCell = (): {row: number; column: number} => {
        let startColumn = 0;
        let startRow = 0;

        let remainingScrollX = scrollPosition.x;
        let remainingScrollY = scrollPosition.y;

        while (remainingScrollX > 0) {
            const width = getColumnWidth(startColumn, true) || defaultCellSizeWithBorder.width;
            remainingScrollX -= width;
            if (remainingScrollX < 0) {
                break;
            }
            startColumn++;
        }

        while (remainingScrollY > 0) {
            const height = getRowHeight(startRow, true) || defaultCellSizeWithBorder.height;
            remainingScrollY -= height;
            if (remainingScrollY < 0) {
                break;
            }
            startRow++;
        }

        return {row: startRow, column: startColumn};
    };

    const startCell = calcStartCell();

    const calcSpacerSizes = (): {left: number; top: number; bottom: number; right: number} => {
        let spacerLeft = 0;
        let spacerTop = 0;
        let spacerRight = 0;
        let spacerBottom = 0;
        let viewPortWidth = 0;
        let viewPortHeight = 0;
        let documentWidth = 0;
        let documentHeight = 0;

        let colIndex = 0;
        let rowIndex = 0;

        while (spacerLeft < scrollPosition.x) {
            const width = getColumnWidth(colIndex, true);
            if (spacerLeft + width > scrollPosition.x) {
                break;
            }
            spacerLeft += width;
            colIndex++;
        }

        while (spacerTop < scrollPosition.y) {
            const height = getRowHeight(rowIndex, true);
            if (spacerTop + height > scrollPosition.y) {
                break;
            }
            spacerTop += height;
            rowIndex++;
        }

        for (let i = 0; i < maxCellRange.column + 1; i++) {
            documentWidth += getColumnWidth(i, true);
        }

        for (let i = 0; i < maxCellRange.row + 1; i++) {
            documentHeight += getRowHeight(i, true);
        }

        while (viewPortWidth < tableWrapperSize.width) {
            viewPortWidth += getColumnWidth(colIndex++, true);
        }

        while (viewPortHeight < tableWrapperSize.height) {
            viewPortHeight += getRowHeight(rowIndex++, true);
        }

        for (let i = colIndex; i < maxCellRange.column; i++) {
            spacerRight += getColumnWidth(i, true);
        }

        for (let i = rowIndex; i < maxCellRange.row; i++) {
            spacerBottom += getRowHeight(i, true);
        }

        // spacerTop = Math.min(spacerTop, documentHeight - viewPortHeight);
        // spacerLeft = Math.min(spacerLeft, documentWidth - viewPortWidth);

        return {left: spacerLeft, top: spacerTop, right: spacerRight, bottom: spacerBottom};
    };

    const calcTotalSize = (): {width: number; height: number} => {
        let width = 0;
        let height = 0;

        for (let i = 0; i < maxCellRange.column; i++) {
            width += getColumnWidth(i, true);
        }

        for (let i = 0; i < maxCellRange.row; i++) {
            height += getRowHeight(i, true);
        }

        return {width, height};
    };

    const makeColumnHeaders = (): React.ReactNode[] => {
        const headers = [];
        const startIndex = startCell.column;

        for (let i = 0; i <= calcNumColumns() + 2; i++) {
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
                    width={getColumnWidth(absoluteIndex, false)}
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

        for (let i = 0; i <= calcNumRows() + 2; i++) {
            const absoluteIndex = startIndex + i;
            headers.push(
                <RowHeader
                    key={`row-header-${absoluteIndex}`}
                    absoluteIndex={absoluteIndex}
                    height={getRowHeight(absoluteIndex, false)}
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
        // updateViewState(row, column);
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

    const verticalHeaders = makeRowHeaders();
    const horizontalHeaders = makeColumnHeaders();

    const spacerSizes = calcSpacerSizes();
    const totalSize = calcTotalSize();

    return (
        <div
            ref={editorRef}
            className="SpreadSheetEditor"
            style={{display: props.visible && currentSheet && currentWorkbook ? "block" : "none"}}
        >
            <div className="SpreadSheetEditor__Wrapper">
                <div
                    className="SpreadSheetEditor__ColRowSpacer"
                    style={{
                        minWidth: defaultCellSizeWithBorder.height,
                        minHeight: defaultCellSizeWithBorder.height,
                    }}
                />
                <div className="SpreadSheetEditor__HorizontalHeaderWrapper" ref={horizontalHeaderWrapperRef}>
                    <div
                        className="SpreadSheetEditor__TableWrapper__Spacer"
                        style={{minWidth: spacerSizes.left, maxWidth: spacerSizes.left}}
                    />
                    <table
                        className="SpreadSheetTable"
                        style={{height: defaultCellSizeWithBorder.height, width: editorSize.width - 34}}
                    >
                        <thead>
                            <tr>{horizontalHeaders}</tr>
                        </thead>
                    </table>
                    <div
                        className="SpreadSheetEditor__TableWrapper__Spacer"
                        style={{
                            minWidth: spacerSizes.right,
                            maxWidth: spacerSizes.right,
                        }}
                    />
                </div>
            </div>
            <div className="SpreadSheetEditor__Wrapper">
                <div
                    className="SpreadSheetEditor__VerticalHeaderWrapper"
                    ref={verticalHeaderWrapperRef}
                    style={{width: defaultCellSizeWithBorder.height, height: tableWrapperSize.height}}
                >
                    <div
                        className="SpreadSheetEditor__TableWrapper__Spacer"
                        style={{minHeight: spacerSizes.top, maxHeight: spacerSizes.top}}
                    />
                    <table className="SpreadSheetTable">
                        <tbody>
                            {verticalHeaders.map((header, row) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <tr key={`row-${row}`}>{header}</tr>
                            ))}
                        </tbody>
                    </table>
                    <div
                        className="SpreadSheetEditor__TableWrapper__Spacer"
                        style={{
                            minHeight: spacerSizes.bottom,
                            maxHeight: spacerSizes.bottom,
                        }}
                    />
                </div>
                <div
                    className="SpreadSheetEditor__ScrollLayer"
                    ref={scrollLayerRef}
                    style={{width: editorSize.width - 34, height: editorSize.height - 34}}
                >
                    <div
                        className="SpreadSheetEditor__TableWrapper"
                        ref={tableWrapperRef}
                        style={{width: editorSize.width - 34, height: editorSize.height - 34}}
                    >
                        <div
                            className="SpreadSheetEditor__ColumnWrapper"
                            style={{width: totalSize.width, height: totalSize.height}}
                        >
                            <div
                                className="SpreadSheetEditor__TableWrapper__Spacer"
                                style={{minHeight: spacerSizes.top, maxHeight: spacerSizes.top}}
                            />
                            <div className="SpreadSheetEditor__Wrapper">
                                <div
                                    className="SpreadSheetEditor__TableWrapper__Spacer"
                                    style={{minWidth: spacerSizes.left, maxWidth: spacerSizes.left}}
                                />
                                <table className="SpreadSheetTable" ref={tableRef}>
                                    <tbody>
                                        {verticalHeaders.map((_, row) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <tr key={`row-${row}`}>
                                                {horizontalHeaders.map((__, column) => {
                                                    const absoluteRow = row + startCell.row;
                                                    const absoluteColumn = column + startCell.column;
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
                                                                    // eslint-disable-next-line jsx-a11y/no-autofocus
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
                                    style={{
                                        minWidth: spacerSizes.right,
                                        maxWidth: spacerSizes.right,
                                    }}
                                />
                            </div>
                            <div
                                className="SpreadSheetEditor__TableWrapper__Spacer"
                                style={{
                                    minHeight: spacerSizes.bottom,
                                    maxHeight: spacerSizes.bottom,
                                }}
                            />
                        </div>
                    </div>
                    <div
                        className="SpreadSheetEditor__ContentDummy"
                        style={{width: totalSize.width, height: totalSize.height}}
                    />
                </div>
            </div>
        </div>
    );
};
