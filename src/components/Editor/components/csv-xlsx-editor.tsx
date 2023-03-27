import {useElementSize} from "@hooks/useElementSize";

import React from "react";

import {File} from "@utils/file-system/file";
import {Size} from "@utils/geometry";

import {useAppSelector} from "@redux/hooks";

import path from "path";
import {WorkBook, WorkSheet, read, utils} from "xlsx";

import "./csv-xlsx-editor.css";

export type CsvXlsxEditorProps = {
    visible: boolean;
};

const defaultCellSize: Size = {
    width: 100,
    height: 30,
};

const makeColumnName = (index: number): string => {
    const letters = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numLetters = letters.length;
    const firstLetter = letters[Math.floor(index / numLetters)];
    const secondLetter = letters[index % numLetters];
    return `${firstLetter}${secondLetter}`;
};

export const CsvXlsxEditor: React.VFC<CsvXlsxEditorProps> = props => {
    const [currentWorkbook, setCurrentWorkbook] = React.useState<WorkBook | null>(null);
    const [currentSheet, setCurrentSheet] = React.useState<WorkSheet | null>(null);
    const [scrollPosition, setScrollPosition] = React.useState<Size>({width: 0, height: 0});

    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const editorSize = useElementSize(editorRef);

    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    React.useEffect(() => {
        const handleScrollPositionChange = () => {
            if (!editorRef.current) {
                return;
            }
            setScrollPosition({width: editorRef.current.scrollLeft, height: editorRef.current.scrollTop});
        };

        if (editorRef.current) {
            editorRef.current.addEventListener("scroll", handleScrollPositionChange);
        }

        return () => {
            if (editorRef.current) {
                editorRef.current.removeEventListener("scroll", handleScrollPositionChange);
            }
        };
    }, []);

    React.useEffect(() => {
        const currentFile = new File(path.relative(workingDirectoryPath, activeFilePath), workingDirectoryPath);
        if (!currentFile.exists()) {
            return;
        }

        const workbook = read(currentFile.readBuffer());
        setCurrentWorkbook(workbook);
        setCurrentSheet(workbook.Sheets[workbook.SheetNames[0]]);
    }, [activeFilePath, workingDirectoryPath]);

    const calcNumColumns = (): number => {
        return Math.ceil(editorSize.width / defaultCellSize.width);
    };

    const calcNumRows = (): number => {
        return Math.ceil(editorSize.height / defaultCellSize.height);
    };

    const makeHorizontalHeaders = (): React.ReactNode[] => {
        const headers = [];
        for (let i = 0; i < calcNumColumns(); i++) {
            headers.push(
                <th
                    style={{
                        width: i === 0 ? defaultCellSize.height : defaultCellSize.width,
                        height: defaultCellSize.height,
                    }}
                >
                    {makeColumnName(i)}
                </th>
            );
        }
        return headers;
    };

    const makeVerticalHeaders = (): React.ReactNode[] => {
        const headers = [];
        for (let i = 0; i < calcNumRows(); i++) {
            headers.push(
                <td
                    style={{
                        width: defaultCellSize.height,
                        height: defaultCellSize.height,
                    }}
                >
                    {i + 1}
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

    const verticalHeaders = makeVerticalHeaders();

    return (
        <div ref={editorRef} className="CsvXlsxEditor" style={{display: props.visible ? "block" : "none"}}>
            {currentSheet && currentWorkbook && (
                <table className="CsvXlsxTable">
                    <thead>{makeHorizontalHeaders()}</thead>
                    <tbody>
                        {verticalHeaders.map((header, row) => (
                            <tr>
                                {header}
                                {makeHorizontalHeaders().map((_, col) => (
                                    <td>
                                        <input type="text" value={getValue(row, col)} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
