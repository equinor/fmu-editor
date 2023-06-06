import {sanitizeFileName} from "@utils/sanitize";

test("invalid filenames are sanitized", () => {
    const filenames = [
        ['&invalid.csv', 'invalid.csv'],
        ["d!i\"#$%&/()=?`", "di"],
        ["*abcåå123.bak.tmp.swp.docx.zip@@\n\t", "abc123.bak.tmp.swp.docx.zip"],
    ];
    for (let i = 0; i < filenames.length; i++) {
        const invalid = sanitizeFileName(filenames[i][0]);
        expect(invalid).toEqual(filenames[i][1]);
    }
});
