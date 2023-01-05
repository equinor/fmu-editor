import {diff_match_patch} from "diff-match-patch";

export const lineDiff = (a: string, b: string) => {
    var dmp = new diff_match_patch();
    var d = dmp.diff_linesToChars_(a, b);
    var diffs = dmp.diff_main(d.chars1, d.chars2, false);
    dmp.diff_charsToLines_(diffs, d.lineArray);
    return diffs;
};
