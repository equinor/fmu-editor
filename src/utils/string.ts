export const adjustToPlural = (str: string, amount: number) => {
    if (amount === 1) {
        return str;
    }
    return `${str}s`;
};

export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const dedent = (strings: TemplateStringsArray): string => {
    return strings
        .join()
        .replace(/^[ \t]+/gm, "")
        .replaceAll('"""', "```");
};

export const trimPx = (valueWithUnit: string): number => {
    const value = valueWithUnit.replace("px", "");
    return Number(value);
};

export const uncapitalize = (str: string) => {
    return str.charAt(0).toLowerCase() + str.slice(1);
};
