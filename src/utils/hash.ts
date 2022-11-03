export const generateHashCode = (value: string) => {
    let hash = 0;
    let chr = 0;
    if (value.length === 0) return hash;
    for (let i = 0; i < value.length; i++) {
        chr = value.charCodeAt(i);
        /* eslint-disable no-bitwise */
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
