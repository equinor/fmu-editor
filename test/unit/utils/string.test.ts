import * as str from "@utils/string";

test("adjust strings to plural", () => {
    expect(str.adjustToPlural("apple", 1)).toBe("apple");
    expect(str.adjustToPlural("apple", 0)).toBe("apples");
    expect(str.adjustToPlural("apple", 100)).toBe("apples");
});

test("capitalize letters and words", () => {
    expect(str.capitalize("")).toBe("");
    expect(str.capitalize("a")).toBe("A");
    expect(str.capitalize("zebra")).toBe("Zebra");
});

test("dedent template strings", () => {
    expect(str.dedent`Hello
                World`).toBe("Hello\nWorld");
    expect(str.dedent`
        """
            codeblock
        """
    `).toBe("\n```\ncodeblock\n```\n");
});

test("trim and convert px values to number", () => {
    expect(str.trimPx("1")).toBe(1);
    expect(str.trimPx("5px")).toBe(5);
    expect(str.trimPx("px")).toBe(0);
});

test("uncapitalize letters and words", () => {
    expect(str.uncapitalize("")).toBe("");
    expect(str.uncapitalize("A")).toBe("a");
    expect(str.uncapitalize("Zebra")).toBe("zebra");
});
