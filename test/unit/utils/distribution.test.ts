import * as dst from "@utils/distributions";

test("normal distribution pdf approximates well enough", () => {
    const expected = [
        0.3989422804014327, 0.24197072451914337, 0.05399096651318806, 0.0044318484119380075, 0.00013383022576488537,
        1.4867195147342979e-6, 6.075882849823286e-9, 5.052271083536893e-15, 1.0279773571668917e-18,
        7.69459862670642e-23,
    ];
    const d = new dst.Normal(0, 1);
    for (let i = 0; i < 10; i++) {
        expect(d.pdf(i)).toBeCloseTo(expected[i]);
    }
});

test("lognormal distribution pdf approximates well enough", () => {
    const expected = [
        0.3989422804014327, 0.15687401927898112, 0.07272825613999473, 0.03815345651188645, 0.021850714830327203,
        0.013354538355053932, 0.008581626313996369, 0.005739296497825192, 0.003965747043572759, 0.0028159018901526803,
    ];
    const d = new dst.LogNormal(0, 1);
    for (let i = 1; i < 11; i++) {
        expect(d.pdf(i)).toBeCloseTo(expected[i - 1]);
    }
});

test("truncated normal distribution pdf approximates well enough", () => {
    const expected = [
        NaN,
        NaN,
        NaN,
        3.283098654930463,
        0.09914098889623334,
        0.001101356902446175,
        4.50099393247228e-6,
        6.766970685433075e-9,
        3.742705719361606e-12,
        NaN,
        NaN,
    ];
    const d = new dst.TruncatedNormal(0, 1, 3, 8.5);
    for (let i = 0; i < 10; i++) {
        if (Number.isNaN(expected[i])) {
            expect(d.pdf(i)).toBe(NaN);
        } else {
            expect(d.pdf(i)).toBeCloseTo(expected[i]);
        }
    }
});

test("uniform distribution pdf approximates well enough", () => {
    const d = new dst.Uniform(0, 1);
    expect(d.pdf(0)).toBe(1.0);
    for (let i = 1; i < 11; i++) {
        expect(d.pdf(1 / i)).toBe(1.0);
    }
    expect(d.pdf(1.1)).toBe(0);
});

test("loguniform distribution pdf approximates well enough", () => {
    const expected = [
        0.4170323914242463, 0.20851619571212315, 0.13901079714141543, 0.10425809785606158, 0.08340647828484926,
        0.06950539857070771, 0.059576055917749476, 0.05212904892803079, 0.04633693238047181, 0.04170323914242463,
    ];
    const d = new dst.LogUniform(1, 11);
    expect(d.pdf(0)).toBe(NaN);
    for (let i = 1; i < 11; i++) {
        expect(d.pdf(i)).toBeCloseTo(expected[i - 1]);
    }
});

test("dirac distribution pdf approximates well enough", () => {
    const d = new dst.Dirac(1);
    expect(d.pdf(0)).toBe(0.0);
    expect(d.pdf(1)).toBe(1.0);
    expect(d.pdf(2)).toBe(0.0);
});

test("discreteuniform distribution pdf approximates well enough", () => {
    const d = new dst.DiscreteUniform(3, 1, 3);
    expect(d.pdf(0)).toBe(0.0);
    expect(d.pdf(1)).toBeCloseTo(0.33333333333333);
    expect(d.pdf(1.1)).toBe(0.0);
    expect(d.pdf(2)).toBeCloseTo(0.33333333333333);
    expect(d.pdf(3)).toBeCloseTo(0.33333333333333);
    expect(d.pdf(4)).toBe(0.0);
});

test("triangular distribution pdf approximates well enough", () => {
    const expected = [0.0, 0.4, 0.8, 1.2, 1.6, 2.0, 1.6, 1.2000000000000002, 0.7999999999999998, 0.3999999999999999];
    const d = new dst.Triangular(0, 0.5, 1);
    for (let i = 0; i < 10; i++) {
        expect(d.pdf(i / 10)).toBeCloseTo(expected[i]);
    }
});

test("pert distribution pdf approximates well enough", () => {
    const expected = [
        0.0, 0.02430000000000001, 0.07679999999999997, 0.1323000000000001, 0.17280000000000012, 0.18750000000000008,
        0.17280000000000012, 0.1323000000000001, 0.0768, 0.0243,
    ];
    const d = new dst.PERT(0, 5, 10);
    for (let i = 0; i < 10; i++) {
        expect(d.pdf(i)).toBeCloseTo(expected[i]);
    }
});
