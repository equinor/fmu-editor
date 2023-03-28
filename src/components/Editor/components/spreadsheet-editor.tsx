import {editor} from "@editors/editor";
import {EditorType, GlobalSettings} from "@global/global-settings";
import {useElementSize} from "@hooks/useElementSize";

import React from "react";

import {File} from "@utils/file-system/file";
import {Size} from "@utils/geometry";

import {useAppSelector} from "@redux/hooks";

import {CodeEditorViewState} from "@shared-types/files";

import path from "path";
import {WorkBook, WorkSheet, utils} from "xlsx";

import "./spreadsheet-editor.css";

export type SpreadSheetEditorProps = {
    visible: boolean;
};

const defaultCellSize: Size = {
    width: 100,
    height: 30,
};

const defaultCellSizeWithBorder: Size = {
    width: defaultCellSize.width + 4,
    height: defaultCellSize.height + 4,
};

const makeColumnName = (index: number): string => {
    const letters = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numLetters = letters.length;
    const firstLetter = letters[Math.floor(index / numLetters)];
    const secondLetter = letters[index % numLetters];
    return `${firstLetter}${secondLetter}`;
};

const makeCellKey = (column: number, row: number): string => {
    return `${makeColumnName(column)}-${row}`;
};

const makeHeaderCellClassName = (
    column: number,
    row: number,
    focusedCell: {column: number; row: number} | null,
    hoveredCell: {column: number; row: number} | null
): string => {
    if (focusedCell && (focusedCell.column === column || column === -1) && (focusedCell.row === row || row === -1)) {
        return "focused-header";
    }

    if (hoveredCell && (hoveredCell.column === column || column === -1) && (hoveredCell.row === row || row === -1)) {
        return "hovered-header";
    }

    return "";
};

export const SpreadSheetEditor: React.VFC<SpreadSheetEditorProps> = props => {
    const [currentWorkbook, setCurrentWorkbook] = React.useState<WorkBook | null>(null);
    const [currentSheet, setCurrentSheet] = React.useState<WorkSheet | null>(null);
    const [focusedCell, setFocusedCell] = React.useState<{column: number; row: number} | null>(null);
    const [hoveredCell, setHoveredCell] = React.useState<{column: number; row: number} | null>(null);
    const [scrollCellLocation, setScrollCellLocation] = React.useState<{column: number; row: number}>({
        column: 0,
        row: 0,
    });
    const [maxCellRange, setMaxCellRange] = React.useState<{column: number; row: number}>({column: 0, row: 0});
    const [scrollCellRange, setScrollCellRange] = React.useState<{column: number; row: number}>({column: 0, row: 0});

    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const editorSize = useElementSize(editorRef);

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
        const editorRefCurrent = editorRef.current;
        const handleScrollPositionChange = () => {
            if (!editorRefCurrent) {
                return;
            }
            setScrollCellLocation({
                column: Math.floor(editorRef.current.scrollLeft / defaultCellSizeWithBorder.width),
                row: Math.floor(editorRef.current.scrollTop / defaultCellSizeWithBorder.height),
            });
            setScrollCellRange({
                column: Math.max(
                    maxCellRange.column,
                    (editorRef.current.scrollLeft + editorRef.current.clientWidth) / defaultCellSizeWithBorder.width
                ),
                row: Math.max(
                    maxCellRange.row,
                    (editorRef.current.scrollTop + editorRef.current.clientHeight) / defaultCellSizeWithBorder.height
                ),
            });

            updateViewState();
        };

        if (editorRefCurrent) {
            editorRefCurrent.addEventListener("scroll", handleScrollPositionChange);
        }

        return () => {
            if (editorRefCurrent) {
                editorRefCurrent.removeEventListener("scroll", handleScrollPositionChange);
            }
        };
    }, [maxCellRange, updateViewState]);

    React.useEffect(() => {
        const currentFile = new File(path.relative(workingDirectoryPath, activeFilePath), workingDirectoryPath);
        if (!currentFile.exists()) {
            return;
        }

        if (GlobalSettings.editorTypeForFileExtension(currentFile.extension()) !== EditorType.SpreadSheet) {
            return;
        }

        const workbook = editor.getModel<WorkBook>(currentFile.absolutePath());
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
                setScrollCellRange({
                    column:
                        (viewState.viewState.scrollLeft + editorRef.current.clientWidth) /
                        defaultCellSizeWithBorder.width,
                    row:
                        (viewState.viewState.scrollTop + editorRef.current.clientHeight) /
                        defaultCellSizeWithBorder.height,
                });
                editorRef.current.scrollTop = viewState.viewState.scrollTop;
                editorRef.current.scrollLeft = viewState.viewState.scrollLeft;
            }, 500);
        }
    }, [activeFilePath, workingDirectoryPath]);

    const calcNumColumns = (): number => {
        return Math.ceil(editorSize.width / defaultCellSizeWithBorder.width);
    };

    const calcNumRows = (): number => {
        return Math.ceil(editorSize.height / defaultCellSizeWithBorder.height) - 1;
    };

    const makeHorizontalHeaders = (): React.ReactNode[] => {
        const headers = [];
        const startIndex = scrollCellLocation ? scrollCellLocation.column : 0;
        for (let i = 0; i < calcNumColumns(); i++) {
            const absoluteIndex = startIndex + i;
            headers.push(
                <th
                    key={`horizontal-header-${absoluteIndex}`}
                    style={{
                        width: i === 0 ? defaultCellSize.height : defaultCellSize.width,
                        height: defaultCellSize.height,
                    }}
                    className={makeHeaderCellClassName(i === 0 ? -2 : absoluteIndex - 1, -1, focusedCell, hoveredCell)}
                >
                    {i === 0 ? "" : makeColumnName(absoluteIndex)}
                </th>
            );
        }
        return headers;
    };

    const makeVerticalHeaders = (): React.ReactNode[] => {
        const headers = [];
        const startIndex = scrollCellLocation ? scrollCellLocation.row : 0;
        for (let i = 0; i < calcNumRows(); i++) {
            const absoluteIndex = startIndex + i;
            headers.push(
                <td
                    key={`vertical-header-${absoluteIndex}`}
                    style={{
                        width: defaultCellSize.height,
                        height: defaultCellSize.height,
                    }}
                    className={makeHeaderCellClassName(-1, absoluteIndex, focusedCell, hoveredCell)}
                >
                    {absoluteIndex + 1}
                </td>
            );
        }
        return headers;
    };

    const getValue = (row: number, column: number): string => {
        if (!currentSheet) {
            return "";
        }

        const cell = currentSheet[utils.encode_cell({c: column, r: row})];
        return cell ? cell.v : "";
    };

    const handleFocusedCellChange = (row: number, column: number) => {
        setFocusedCell({row, column});
        updateViewState(row, column);
    };

    const handleHoveredCellChange = (row: number, column: number) => {
        setHoveredCell({row, column});
    };

    const handleCellChange = (row: number, column: number, value: any) => {
        if (!currentSheet) {
            return;
        }

        /* cell object */
        let cell = {t: "?", v: value};
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
    };

    const verticalHeaders = makeVerticalHeaders();
    const horizontalHeaders = makeHorizontalHeaders();

    const tableWidth = calcNumColumns() * defaultCellSizeWithBorder.width;
    const tableHeight = calcNumRows() * defaultCellSizeWithBorder.height;

    return (
        <div ref={editorRef} className="SpreadSheetEditor" style={{display: props.visible ? "block" : "none"}}>
            {currentSheet && currentWorkbook && (
                <>
                    <div
                        className="SpreadSheetEditor__ScrollOverlay"
                        style={{
                            width:
                                Math.max(tableWidth, scrollCellRange.column * defaultCellSizeWithBorder.width) +
                                defaultCellSizeWithBorder.width,
                            height:
                                Math.max(tableHeight, scrollCellRange.row * defaultCellSizeWithBorder.height) +
                                defaultCellSizeWithBorder.height,
                        }}
                    />
                    <div
                        className="SpreadSheetEditor__TableWrapper"
                        style={{
                            width: editorSize.width,
                            height: editorSize.height,
                        }}
                    >
                        <table className="SpreadSheetTable" style={{width: tableWidth, height: tableHeight}}>
                            <thead>
                                <tr>{horizontalHeaders}</tr>
                            </thead>
                            <tbody>
                                {verticalHeaders.map((header, row) => (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <tr key={`row-${row}`}>
                                        {horizontalHeaders.map((_, column) => {
                                            if (column === 0) {
                                                return header;
                                            }
                                            const absoluteRow = row + (scrollCellLocation ? scrollCellLocation.row : 0);
                                            const absoluteColumn =
                                                column + (scrollCellLocation ? scrollCellLocation.column : 0) - 1;
                                            return (
                                                <td
                                                    key={makeCellKey(absoluteColumn, absoluteRow)}
                                                    className={
                                                        focusedCell &&
                                                        focusedCell.row === absoluteRow &&
                                                        focusedCell.column === absoluteColumn
                                                            ? "focused-cell"
                                                            : undefined
                                                    }
                                                    onPointerOver={() =>
                                                        handleHoveredCellChange(absoluteRow, absoluteColumn)
                                                    }
                                                    onPointerOut={() => handleHoveredCellChange(-1, -1)}
                                                >
                                                    <input
                                                        type="text"
                                                        defaultValue={getValue(absoluteRow, absoluteColumn)}
                                                        onFocus={() =>
                                                            handleFocusedCellChange(absoluteRow, absoluteColumn)
                                                        }
                                                        onChange={e =>
                                                            handleCellChange(
                                                                absoluteRow,
                                                                absoluteColumn,
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
