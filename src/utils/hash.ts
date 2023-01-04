import crypto from "crypto";

export const generateHashCode = (value: string | Buffer): string => {
    const hash = crypto.createHash("sha256").update(value).digest("hex");
    return hash;
};
