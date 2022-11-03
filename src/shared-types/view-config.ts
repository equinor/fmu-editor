export type Config = {
    id: string;
    config: number[] | Theme | boolean;
};

export type Theme = "light" | "dark";
