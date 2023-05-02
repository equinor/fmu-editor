export interface Distribution {
    median: number;
    mean: number;
    mode: number;
    std: number;
    variance: number;

    pdf: (x: number) => number;
    cdf: (x: number) => number;
    inv: (p: number) => number;
}
