import {editor} from "@editors/editor";
import {SpreadSheetEditor as SpreadSheetEditorType} from "@editors/spreadsheet";
import {EditorType, GlobalSettings} from "@global/global-settings";
import {useElementSize} from "@hooks/useElementSize";
import {SpreadSheetEditorViewState} from "@root/src/shared-types/files";
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
        classList.push("RowHeaderCell");
    }

    if (row === -1) {
        classList.push("ColumnHeaderCell");
    }

    if (selection) {
        const startRow = Math.min(selection.start.row, selection.end.row);
        const endRow = Math.max(selection.start.row, selection.end.row);
        const startColumn = Math.min(selection.start.column, selection.end.column);
        const endColumn = Math.max(selection.start.column, selection.end.column);
        if ((row >= startRow && row <= endRow) || (column >= startColumn && column <= endColumn)) {
            classList.push("SelectedHeader");
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
            return " FirstSelectedCell";
        }
        return " SelectedCell";
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

    const classList: string[] = ["SelectionFrame"];
    const startRow = Math.min(selection.start.row, selection.end.row);
    const endRow = Math.max(selection.start.row, selection.end.row);
    const startColumn = Math.min(selection.start.column, selection.end.column);
    const endColumn = Math.max(selection.start.column, selection.end.column);

    if (startRow === absoluteRow) {
        classList.push("SelectionFrameTop");
    }

    if (endRow === absoluteRow) {
        classList.push("SelectionFrameBottom");
    }

    if (startColumn === absoluteColumn) {
        classList.push("SelectionFrameLeft");
    }

    if (endColumn === absoluteColumn) {
        classList.push("SelectionFrameRight");
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

    const classList: string[] = ["CopyingFrame"];
    const startRow = Math.min(selection.start.row, selection.end.row);
    const endRow = Math.max(selection.start.row, selection.end.row);
    const startColumn = Math.min(selection.start.column, selection.end.column);
    const endColumn = Math.max(selection.start.column, selection.end.column);

    if (startRow === absoluteRow) {
        classList.push("Top");
    }

    if (endRow === absoluteRow) {
        classList.push("Bottom");
    }

    if (startColumn === absoluteColumn) {
        classList.push("Left");
    }

    if (endColumn === absoluteColumn) {
        classList.push("Right");
    }

    return `CopyingFrame ${classList.join("")}`;
}

const SpreadSheetEditorComponent: React.VFC<SpreadSheetEditorProps> = props => {
    const [currentWorkbook, setCurrentWorkbook] = React.useState<WorkBook | null>(null);
    const [currentSheet, setCurrentSheet] = React.useState<{sheet: WorkSheet; name: string} | null>(null);
    const [editingCell, setEditingCell] = React.useState<{column: number; row: number} | null>(null);
    const [scrollCellLocation, setScrollCellLocation] = React.useState<{column: number; row: number}>({
        column: 0,
        row: 0,
    });
    const [ignored, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [programaticScrolling, setProgramaticScrolling] = React.useState<boolean>(false);
    const [maxCellRange, setMaxCellRange] = React.useState<{column: number; row: number}>({column: 0, row: 0});
    const [columnWidths, setColumnWidths] = React.useState<{[key: number]: number}>({});
    const [rowHeights, setRowHeights] = React.useState<{[key: number]: number}>({});
    const [selection, setSelection] = React.useState<SpreadSheetSelection | null>(null);
    const [copyingSelection, setCopyingSelection] = React.useState<SpreadSheetSelection | null>(null);
    const [scrollPosition, setScrollPosition] = React.useState<Point>({x: 0, y: 0});

    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const tableRef = React.useRef<HTMLTableElement | null>(null);
    const scrollLayerRef = React.useRef<HTMLDivElement | null>(null);
    const tableWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const verticalHeaderWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const horizontalHeaderWrapperRef = React.useRef<HTMLDivElement | null>(null);

    const tableWrapperSize = useElementSize(tableWrapperRef);
    const editorSize = useElementSize(editorRef);

    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    /* ----------------- Row/column sizes ----------------- */

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

    /* ----------------- Calculation functions ----------------- */

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

        spacerTop = Math.min(spacerTop, documentHeight - viewPortHeight);
        spacerLeft = Math.min(spacerLeft, documentWidth - viewPortWidth);

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

    /* ----------------- Getters/setters for cell values ----------------- */

    const getCellValue = React.useCallback(
        (row: number, column: number): string => {
            if (!currentSheet) {
                return "";
            }

            const cell = currentSheet.sheet[utils.encode_cell({c: column, r: row})];
            return cell ? cell.v : "";
        },
        [currentSheet]
    );

    const changeCellValue = React.useCallback(
        (row: number, column: number, value: any) => {
            const cell = {t: "?", v: value};
            const address = utils.encode_cell({c: column, r: row});

            const oldValue = currentSheet.sheet[address]?.v || "";

            if (typeof value === "string") cell.t = "s";
            // string
            else if (typeof value === "number") cell.t = "n";
            // number
            else if (value === true || value === false) cell.t = "b";
            // boolean
            else if (value instanceof Date) cell.t = "d";
            else throw new Error("cannot store value");

            currentSheet.sheet[address] = cell;

            const range = utils.decode_range(currentSheet.sheet["!ref"]);
            const addr = utils.decode_cell(address);

            if (range.s.c > addr.c) range.s.c = addr.c;
            if (range.s.r > addr.r) range.s.r = addr.r;
            if (range.e.c < addr.c) range.e.c = addr.c;
            if (range.e.r < addr.r) range.e.r = addr.r;

            currentSheet.sheet["!ref"] = utils.encode_range(range);

            setMaxCellRange({
                column: Math.max(column, maxCellRange.column),
                row: Math.max(row, maxCellRange.row),
            });

            editor.getOriginalEditor<SpreadSheetEditorType>(activeFilePath).addAction(
                activeFilePath,
                currentSheet.name,
                {
                    r: row,
                    c: column,
                },
                oldValue,
                value
            );
        },
        [currentSheet, maxCellRange]
    );

    /* ----------------- Updates to view state ----------------- */

    const updateViewStateSelection = React.useCallback(
        (newSelection?: SpreadSheetSelection) => {
            if (!newSelection || !activeFilePath || !currentSheet) {
                return;
            }
            const prev = editor.getViewState<SpreadSheetEditorViewState>(activeFilePath);
            if (prev) {
                const viewState = prev.viewStates.find(el => el.workSheetName === currentSheet.name);
                if (viewState) {
                    viewState.selection = newSelection;
                    editor.setViewState(activeFilePath, prev);
                }
            }
        },
        [activeFilePath, currentSheet]
    );

    const updateViewStateColumnWidths = React.useCallback(
        (newColumnWidths: {[key: number]: number}) => {
            console.log("updating view state column widths");
            if (!activeFilePath || !currentSheet) {
                return;
            }

            const range = utils.decode_range(currentSheet.sheet["!ref"]);

            const colInfos: ColInfo[] = [];
            for (let i = range.s.c; i <= range.e.c; i++) {
                if (newColumnWidths[i]) {
                    colInfos[i] = {wpx: newColumnWidths[i]};
                } else {
                    colInfos[i] = {wpx: defaultCellSize.width};
                }
            }
            currentSheet.sheet["!cols"] = colInfos;

            const prev = editor.getViewState<SpreadSheetEditorViewState>(activeFilePath);
            if (prev) {
                const viewState = prev.viewStates.find(el => el.workSheetName === currentSheet.name);
                if (viewState) {
                    viewState.columnWidths = newColumnWidths;
                    editor.setViewState(activeFilePath, prev);
                }
            }
        },
        [activeFilePath, currentSheet]
    );

    const updateViewStateRowHeights = React.useCallback(
        (newRowHeights: {[key: number]: number}) => {
            console.log("updating view state row heights");
            if (!activeFilePath || !currentSheet) {
                return;
            }

            const range = utils.decode_range(currentSheet.sheet["!ref"]);

            const rowInfos: RowInfo[] = [];
            for (let i = range.s.r; i <= range.e.r; i++) {
                if (newRowHeights[i]) {
                    rowInfos[i] = {hpx: newRowHeights[i]};
                } else {
                    rowInfos[i] = {hpx: defaultCellSize.height};
                }
            }
            currentSheet.sheet["!rows"] = rowInfos;

            const prev = editor.getViewState<SpreadSheetEditorViewState>(activeFilePath);
            if (prev) {
                const viewState = prev.viewStates.find(el => el.workSheetName === currentSheet.name);
                if (viewState) {
                    viewState.rowHeights = newRowHeights;
                    editor.setViewState(activeFilePath, prev);
                }
            }
        },
        [activeFilePath, currentSheet]
    );

    const updateViewStateScroll = React.useCallback(() => {
        if (!scrollLayerRef.current || !currentSheet) {
            return;
        }
        const prev = editor.getViewState<SpreadSheetEditorViewState>(activeFilePath);
        if (prev) {
            const viewState = prev.viewStates.find(el => el.workSheetName === currentSheet.name);
            if (viewState) {
                viewState.scrollLeft = scrollLayerRef.current.scrollLeft;
                viewState.scrollTop = scrollLayerRef.current.scrollTop;
                editor.setViewState(activeFilePath, prev);
            }
        }
    }, [activeFilePath, currentSheet]);

    const updateViewStateSheetName = React.useCallback(
        (newSheetName: string) => {
            const prev = editor.getViewState<SpreadSheetEditorViewState>(activeFilePath);
            const newViewStates = prev ? [...prev.viewStates] : [];
            if (!newViewStates.some(viewState => viewState.workSheetName === newSheetName)) {
                newViewStates.push({
                    workSheetName: newSheetName,
                    selection: null,
                    scrollLeft: 0,
                    scrollTop: 0,
                    columnWidths: {},
                    rowHeights: {},
                });
            }
            const viewState: SpreadSheetEditorViewState = {
                visibleWorkSheetName: newSheetName,
                viewStates: newViewStates,
            };

            editor.setViewState(activeFilePath, viewState);
        },
        [activeFilePath]
    );

    /* ----------------- Changes to active file and work sheet ----------------- */

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

        const viewStates = editor.getViewState<SpreadSheetEditorViewState>(activeFilePath);
        if (viewStates) {
            const visibleWorkSheetName = viewStates.visibleWorkSheetName;
            if (visibleWorkSheetName && workbook.SheetNames.includes(visibleWorkSheetName)) {
                setCurrentSheet({sheet: workbook.Sheets[visibleWorkSheetName], name: visibleWorkSheetName});
                return;
            }
        }

        const sheetName = workbook.SheetNames[0];
        setCurrentSheet({sheet: workbook.Sheets[sheetName], name: sheetName});
        updateViewStateSheetName(sheetName);
    }, [activeFilePath, workingDirectoryPath, updateViewStateSheetName]);

    React.useEffect(() => {
        if (!currentSheet) {
            return;
        }

        let newColumnWidths: {[key: number]: number} | null = null;
        let newRowHeights: {[key: number]: number} | null = null;

        const range = utils.decode_range(currentSheet.sheet["!ref"]);
        setMaxCellRange({
            column: Math.max(range.e.c, calcNumColumns()),
            row: Math.max(range.e.r, calcNumRows()),
        });

        if (currentSheet.sheet["!cols"]) {
            newColumnWidths = {};
            currentSheet.sheet["!cols"].forEach((col: ColInfo, index: number) => {
                if (col && col.wpx) {
                    newColumnWidths[index] = col.wpx;
                }
            });
            setColumnWidths(newColumnWidths);
        }

        if (currentSheet.sheet["!rows"]) {
            newRowHeights = {};
            currentSheet.sheet["!rows"].forEach((row: RowInfo, index: number) => {
                if (row && row.hpx) {
                    newRowHeights[index] = row.hpx;
                }
            });
            setRowHeights(newRowHeights);
        }

        setCopyingSelection(null);
        setEditingCell(null);

        const viewStates = editor.getViewState<SpreadSheetEditorViewState>(activeFilePath);
        if (viewStates) {
            const visibleWorkSheetName = viewStates.visibleWorkSheetName;

            const viewState = viewStates.viewStates.find(el => el.workSheetName === visibleWorkSheetName);
            if (viewState) {
                setSelection(viewState.selection);

                setScrollCellLocation({
                    column: Math.floor(viewState.scrollLeft / defaultCellSizeWithBorder.width),
                    row: Math.floor(viewState.scrollTop / defaultCellSizeWithBorder.height),
                });

                if (viewState.columnWidths && !newColumnWidths) {
                    setColumnWidths(viewState.columnWidths);
                }

                if (viewState.rowHeights && !newRowHeights) {
                    setRowHeights(viewState.rowHeights);
                }

                if (!scrollLayerRef.current) {
                    return;
                }

                window.setTimeout(() => {
                    scrollLayerRef.current.scrollTop = viewState.scrollTop;
                    scrollLayerRef.current.scrollLeft = viewState.scrollLeft;
                }, 50);
            }
        } else {
            setSelection(null);
            setScrollCellLocation({column: 0, row: 0});
            setScrollPosition({x: 0, y: 0});
            if (scrollLayerRef.current) {
                scrollLayerRef.current.scrollTop = 0;
                scrollLayerRef.current.scrollLeft = 0;
            }
        }
    }, [currentSheet]);

    /* ----------------- Event handlers for mouse and keyboard events ----------------- */

    React.useEffect(() => {
        const scrollLayerRefCurrent = scrollLayerRef.current;
        const handleScrollPositionChange = () => {
            if (!scrollLayerRefCurrent) {
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

            updateViewStateScroll();
        };

        if (scrollLayerRefCurrent) {
            scrollLayerRefCurrent.addEventListener("scroll", handleScrollPositionChange);
        }

        return () => {
            if (scrollLayerRefCurrent) {
                scrollLayerRefCurrent.removeEventListener("scroll", handleScrollPositionChange);
            }
        };
    }, [maxCellRange, activeFilePath, updateViewStateScroll]);

    React.useEffect(() => {
        let mouseDown = false;
        let newSelection: SpreadSheetSelection | null = null;
        const handlePointerDown = (e: PointerEvent) => {
            if (!(e.target instanceof HTMLElement)) {
                return;
            }

            let cell = e.target;

            if (cell.classList.contains("RowHeaderCell")) {
                const rowIndex = parseInt(cell.dataset.rowIndex ?? "0", 10);
                setSelection({start: {row: rowIndex, column: 0}, end: {row: rowIndex, column: Infinity}});
                setEditingCell({row: rowIndex, column: 0});
                return;
            }

            if (cell.classList.contains("ColumnHeaderCell")) {
                const colIndex = parseInt(cell.dataset.columnIndex ?? "0", 10);
                setSelection({start: {row: 0, column: colIndex}, end: {row: Infinity, column: colIndex}});
                setEditingCell({row: 0, column: colIndex});
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

            newSelection = {
                start: {row: rowIndex, column: colIndex},
                end: {row: rowIndex, column: colIndex},
            };
            setSelection(newSelection);
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

            setSelection(prev => {
                newSelection = {
                    start: prev.start,
                    end: {row: rowIndex, column: colIndex},
                };
                return newSelection;
            });
        };

        const handlePointerUp = () => {
            if (newSelection) {
                updateViewStateSelection(newSelection);
                newSelection = null;
            }
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
    }, [updateViewStateSelection]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setEditingCell(null);
                setSelection(prev => {
                    if (prev.end.row === 0) {
                        return prev;
                    }

                    const newSelection = {
                        start: {row: prev.start.row - 1, column: prev.start.column},
                        end: {row: prev.start.row - 1, column: prev.start.column},
                    };
                    updateViewStateSelection(newSelection);
                    return newSelection;
                });
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setEditingCell(null);
                setSelection(prev => {
                    const newSelection = {
                        start: {row: prev.start.row + 1, column: prev.start.column},
                        end: {row: prev.start.row + 1, column: prev.start.column},
                    };
                    updateViewStateSelection(newSelection);
                    return newSelection;
                });
                return;
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                setEditingCell(null);
                setSelection(prev => {
                    if (prev.end.column === 0) {
                        return prev;
                    }

                    const newSelection = {
                        start: {row: prev.start.row, column: prev.start.column - 1},
                        end: {row: prev.start.row, column: prev.start.column - 1},
                    };
                    updateViewStateSelection(newSelection);
                    return newSelection;
                });
                return;
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                setEditingCell(null);
                setSelection(prev => {
                    const newSelection = {
                        start: {row: prev.start.row, column: prev.start.column + 1},
                        end: {row: prev.start.row, column: prev.start.column + 1},
                    };
                    updateViewStateSelection(newSelection);
                    return newSelection;
                });
                return;
            }

            if (e.key === "Enter") {
                setEditingCell(null);
                e.preventDefault();
                setSelection(prev => {
                    const newSelection = {
                        start: {row: prev.start.row + 1, column: prev.start.column},
                        end: {row: prev.start.row + 1, column: prev.start.column},
                    };
                    updateViewStateSelection(newSelection);
                    return newSelection;
                });
                return;
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
                return;
            }

            if (e.key === "z" && e.ctrlKey) {
                e.preventDefault();
                editor.getOriginalEditor<SpreadSheetEditorType>(activeFilePath).undoAction(activeFilePath);
                forceUpdate();
                return;
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
                        columns.push(getCellValue(r, c));
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
                return;
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
                        const newSelection = {
                            start: prev.start,
                            end: {
                                row: prev.start.row + lines.length - 1,
                                column: prev.start.column + maxColumn - 1,
                            },
                        };
                        updateViewStateSelection(newSelection);
                        return newSelection;
                    });
                });
                return;
            }

            if (e.key === "a" && e.ctrlKey) {
                e.preventDefault();
                const newSelection = {
                    start: {row: 0, column: 0},
                    end: {row: maxCellRange.row, column: maxCellRange.column},
                };
                updateViewStateSelection(newSelection);
                setSelection(newSelection);
                return;
            }

            if (e.key === "Control" || e.key === "Shift" || e.key === "Alt" || e.key === "Meta") {
                e.preventDefault();
                return;
            }

            if (e.ctrlKey) {
                e.preventDefault();
                return;
            }

            if (editingCell === null && selection) {
                setEditingCell(selection.start);
                changeCellValue(selection.start.row, selection.start.column, "");
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        selection,
        editingCell,
        changeCellValue,
        getCellValue,
        maxCellRange,
        calcNumColumns,
        calcNumRows,
        updateViewStateSelection,
    ]);

    /* ----------------- Event Handlers ----------------- */

    const handleInsertColumn = (index: number) => {
        if (!currentSheet) {
            return;
        }

        for (let r = 0; r <= maxCellRange.row; r++) {
            for (let c = maxCellRange.column + 1; c >= index; c--) {
                if (c > index) {
                    const prevValue = getCellValue(r, c - 1);
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
                const nextValue = getCellValue(r, c + 1);
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
                    const prevValue = getCellValue(r - 1, c);
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
                const nextValue = getCellValue(r + 1, c);
                changeCellValue(r, c, nextValue);
            }
        }
        setMaxCellRange(prev => {
            return {row: prev.row - 1, column: prev.column};
        });
    };

    const handleColumnResize = React.useCallback(
        (index: number, size: number) => {
            setColumnWidths(prev => {
                const newColumnWidths = {...prev};
                newColumnWidths[index] = size;
                updateViewStateColumnWidths(newColumnWidths);
                return newColumnWidths;
            });
        },
        [updateViewStateColumnWidths]
    );

    const handleRowResize = React.useCallback(
        (index: number, size: number) => {
            setRowHeights(prev => {
                const newRowHeights = {...prev};
                newRowHeights[index] = size;
                updateViewStateRowHeights(newRowHeights);
                return newRowHeights;
            });
        },
        [updateViewStateRowHeights]
    );

    const handleEditingCellChange = (row: number, column: number) => {
        setEditingCell({row, column});
        setCopyingSelection(null);
    };

    const handleCellChange = (row: number, column: number, value: any) => {
        if (!currentSheet) {
            return;
        }

        if (editingCell.row !== row || editingCell.column !== column) {
            return;
        }

        changeCellValue(row, column, value);
    };

    /* ----------------- Column and row headers ----------------- */

    const startCell = calcStartCell();

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

    /* ----------------- Render ----------------- */

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
                    style={{width: editorSize.width - 34, height: editorSize.height - 64}}
                >
                    <div
                        className="SpreadSheetEditor__TableWrapper"
                        ref={tableWrapperRef}
                        style={{width: editorSize.width - 34, height: editorSize.height - 64}}
                    >
                        {currentSheet && currentSheet.sheet && currentSheet.sheet["!type"] === "chart" ? (
                            <div className="SpreadSheetEditor__Warning">Charts cannot be edited yet.</div>
                        ) : (
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
                                                                    getCellValue(absoluteRow, absoluteColumn)
                                                                )}
                                                                className={`SpreadSheetTable__cell${makeCellClassesBasedOnSelection(
                                                                    selection,
                                                                    absoluteRow,
                                                                    absoluteColumn
                                                                )}${
                                                                    editingCell &&
                                                                    editingCell.row === absoluteRow &&
                                                                    editingCell.column === absoluteColumn
                                                                        ? " FocusedCell"
                                                                        : ""
                                                                }`}
                                                                data-row-index={absoluteRow}
                                                                data-column-index={absoluteColumn}
                                                                onDoubleClick={() =>
                                                                    handleEditingCellChange(absoluteRow, absoluteColumn)
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        editingCell &&
                                                                        editingCell.row === absoluteRow &&
                                                                        editingCell.column === absoluteColumn
                                                                    ) {
                                                                        return;
                                                                    }
                                                                    setEditingCell(null);
                                                                }}
                                                                style={{
                                                                    width: getColumnWidth(absoluteColumn),
                                                                    height: getRowHeight(absoluteRow),
                                                                }}
                                                            >
                                                                {editingCell &&
                                                                editingCell.row === absoluteRow &&
                                                                editingCell.column === absoluteColumn ? (
                                                                    <input
                                                                        type="text"
                                                                        // eslint-disable-next-line jsx-a11y/no-autofocus
                                                                        autoFocus
                                                                        defaultValue={getCellValue(
                                                                            absoluteRow,
                                                                            absoluteColumn
                                                                        )}
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
                                                                                setEditingCell(null);
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="Content">
                                                                        {getCellValue(absoluteRow, absoluteColumn)}
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
                        )}
                    </div>
                    <div
                        className="SpreadSheetEditor__ContentDummy"
                        style={{width: totalSize.width, height: totalSize.height}}
                    />
                </div>
            </div>
            <div className="SpreadSheetEditor__Tabs">
                {currentWorkbook &&
                    currentSheet &&
                    currentWorkbook.SheetNames.map(sheetName => (
                        <div
                            key={sheetName}
                            className={`SpreadSheetEditor__Tab${
                                sheetName === currentSheet.name ? " SpreadSheetEditor__TabActive" : ""
                            }`}
                            onClick={() => {
                                setCurrentSheet({
                                    name: sheetName,
                                    sheet: currentWorkbook.Sheets[sheetName],
                                });
                                setEditingCell(null);
                                updateViewStateSheetName(sheetName);
                            }}
                        >
                            <span>{sheetName}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
};

interface Props {
    children?: React.ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
    // eslint-disable-next-line react/state-in-constructor
    state: State = {hasError: false};

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return {hasError: true};
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="SpreadSheetEditor__Error">
                    Something went wrong in the spreadsheet editor. By reporting this issue you can help us improve the
                    editor and prevent such errors from happening in the future.
                </div>
            );
        }

        return this.props.children;
    }
}

export const SpreadSheetEditor: React.FC<SpreadSheetEditorProps> = props => (
    <ErrorBoundary>
        <SpreadSheetEditorComponent {...props} />
    </ErrorBoundary>
);
