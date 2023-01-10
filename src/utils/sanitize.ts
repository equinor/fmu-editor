export const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9-_\.]/g, "");
};
