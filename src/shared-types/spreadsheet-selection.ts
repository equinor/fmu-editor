export type SpreadSheetCell = {
    row: number;
    column: number;
};

export type SpreadSheetSelection = {
    start: SpreadSheetCell;
    end: SpreadSheetCell;
};
