import * as dst from "@utils/distributions";

import {Distribution} from "@shared-types/distribution";

function checkExpected(f: (x: number) => number, expected: number[]): void {
    for (let i = 0; i < 10; i++) {
        if (Number.isNaN(expected[i])) {
            expect(f(i)).toBe(NaN);
        } else {
            expect(f(i)).toBeCloseTo(expected[i]);
        }
    }
}

function checkInverseCdf(d: Distribution, expected: number[]): void {
    // Avoid floating point precision errors if these were loop accumulated
    const input = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    for (let i = 0; i < 10; i++) {
        if (Number.isNaN(expected[i])) {
            expect(d.inv(input[i])).toBe(NaN);
        } else {
            expect(d.inv(input[i])).toBeCloseTo(expected[i]);
        }
    }
}

/* Expected outputs are generated from scipy/stats in Python */
describe("normal distribution", () => {
    const mean = 0;
    const stddev = 1;
    const d = new dst.Normal(mean, stddev);

    it("gives correct median", () => expect(d.median).toBe(mean));
    it("gives correct mode", () => expect(d.mode).toBe(mean));
    it("gives correct mean", () => expect(d.mean).toBe(mean));
    it("gives correct stddev", () => expect(d.std).toBe(stddev));
    it("gives correct variance", () => expect(d.variance).toBe(1.0));

    it("correctly approximates pdf", () => {
        const expected = [
            0.3989422804014327, 0.24197072451914337, 0.05399096651318806, 0.0044318484119380075, 0.00013383022576488537,
            1.4867195147342979e-6, 6.075882849823286e-9, 5.052271083536893e-15, 1.0279773571668917e-18,
            7.69459862670642e-23,
        ];
        checkExpected(d.pdf, expected);
    });

    it("correctly approximates cdf", () => {
        const expected = [
            0.5, 0.8413447460685429, 0.9772498680518208, 0.9986501019683699, 0.9999683287581669, 0.9999997133484281,
            0.9999999990134123, 0.9999999999987201, 0.9999999999999993, 1.0,
        ];
        checkExpected(d.cdf, expected);
    });

    it("correctly approximates inv cdf", () => {
        const expected = [
            NaN,
            -1.2815515655446004,
            -0.8416212335729142,
            -0.5244005127080407,
            -0.2533471031357997,
            0.0,
            0.2533471031357997,
            0.5244005127080407,
            0.841621233572914,
            1.2815515655446,
        ];
        checkInverseCdf(d, expected);
    });
});

describe("lognormal distribution", () => {
    const mean = 0;
    const stddev = 1;
    const d = new dst.LogNormal(mean, stddev);

    it("gives correct median", () => expect(d.median).toBeCloseTo(1.0));
    it("gives correct mode", () => expect(d.mode).toBe(0.36787944117144233));
    it("gives correct mean", () => expect(d.mean).toBe(1.6487212707001282));
    it("gives correct stddev", () => expect(d.std).toBe(2.1611974158950877));
    it("gives correct variance", () => expect(d.variance).toBe(4.670774270471604));

    it("correctly approximates pdf", () => {
        const expected = [
            0.3989422804014327, 0.15687401927898112, 0.07272825613999473, 0.03815345651188645, 0.021850714830327203,
            0.013354538355053932, 0.008581626313996369, 0.005739296497825192, 0.003965747043572759,
            0.0028159018901526803,
        ];
        for (let i = 1; i < 11; i++) {
            expect(d.pdf(i)).toBeCloseTo(expected[i - 1]);
        }
    });

    it("correctly approximates cdf", () => {
        const expected = [
            0.0, 0.5, 0.7558914042144173, 0.8640313923585756, 0.9171714809983016, 0.9462396895483368,
            0.9634142480829571, 0.9741672331954079, 0.9812116071859449, 0.985997794426055,
        ];
        checkExpected(d.cdf, expected);
    });

    it("correctly approximates inv cdf", () => {
        const expected = [
            NaN,
            0.2776062418520098,
            0.4310111868818386,
            0.5919101006095542,
            0.7761984141563507,
            1.0,
            1.2883303827500074,
            1.6894457434840042,
            2.320125394504317,
            3.6022244792791556,
        ];
        checkInverseCdf(d, expected);
    });
});

describe("truncated normal distribution", () => {
    const mean = 0;
    const stddev = 1;
    const min = 3;
    const max = 8.5;
    const d = new dst.TruncatedNormal(mean, stddev, min, max);

    it("gives correct median", () => expect(d.median).toBeCloseTo(3.2051549205989316));
    it("gives correct mode", () => expect(d.mode).toBe(min));
    it("gives correct mean", () => expect(d.mean).toBeCloseTo(3.2830986549304026));
    it("gives correct stddev", () => expect(d.std).toBeCloseTo(0.26562979272863224));
    it("gives correct variance", () => expect(d.variance).toBeCloseTo(0.07055918678505613));

    it("correctly approximates pdf", () => {
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
        checkExpected(d.pdf, expected);
    });

    it("correctly approximates cdf", () => {
        const expected = [
            NaN,
            NaN,
            NaN,
            0.0,
            0.9765380487333066,
            0.9997876494630312,
            0.9999992691391406,
            0.9999999990519262,
            0.9999999999995461,
            NaN,
        ];
        checkExpected(d.cdf, expected);
    });

    it("correctly approximates inv cdf", () => {
        const expected = [
            NaN,
            3.03194726987901,
            3.067325278638268,
            3.107016696637142,
            3.152303579611603,
            3.2051549205989316,
            3.268833463461547,
            3.3493757211574113,
            3.4601077821509767,
            3.6425222758316065,
        ];
        checkInverseCdf(d, expected);
    });
});

describe("uniform distribution", () => {
    const min = 0;
    const max = 1;
    const d = new dst.Uniform(min, max);

    it("gives correct median", () => expect(d.median).toBe(0.5));
    it("gives correct mode", () => expect(d.mode).toBe(0.5));
    it("gives correct mean", () => expect(d.mean).toBe(0.5));
    it("gives correct stddev", () => expect(d.std).toBeCloseTo(0.2886751345948128));
    it("gives correct variance", () => expect(d.variance).toBeCloseTo(0.08333333333333333));

    it("correctly approximates pdf", () => {
        expect(d.pdf(0)).toBe(1.0);
        for (let i = 1; i < 11; i++) {
            expect(d.pdf(1 / i)).toBe(1.0);
        }
        expect(d.pdf(1.1)).toBe(0);
    });

    it("correctly approximates cdf", () => {
        const expected = [0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        checkExpected(d.cdf, expected);
    });

    it("correctly approximates inv cdf", () => {
        const expected = [
            NaN,
            0.1,
            0.2,
            0.30000000000000004,
            0.4,
            0.5,
            0.6,
            0.7,
            0.7999999999999999,
            0.8999999999999999,
        ];
        checkInverseCdf(d, expected);
    });
});

describe("loguniform distribution", () => {
    const min = 1;
    const max = 11;
    const d = new dst.LogUniform(min, max);

    it("gives correct median", () => expect(d.median).toBe(3.3166247903554));
    it("gives correct mode", () => expect(d.mode).toBe(min));
    it("gives correct mean", () => expect(d.mean).toBe(4.170323914242463));
    it("gives correct stddev", () => expect(d.std).toBe(2.762307357220083));
    it("gives correct variance", () => expect(d.variance).toBe(7.630341935752199));

    it("correctly approximates pdf", () => {
        const expected = [
            0.4170323914242463, 0.20851619571212315, 0.13901079714141543, 0.10425809785606158, 0.08340647828484926,
            0.06950539857070771, 0.059576055917749476, 0.05212904892803079, 0.04633693238047181, 0.04170323914242463,
        ];
        expect(d.pdf(0)).toBe(NaN);
        for (let i = 1; i < 11; i++) {
            expect(d.pdf(i)).toBeCloseTo(expected[i - 1]);
        }
    });

    it("correctly approximates cdf", () => {
        const expected = [
            0.0, 0.0, 0.2890648263178878, 0.45815690999132624, 0.5781296526357756, 0.6711877414712396,
            0.7472217363092141, 0.8115075629572489, 0.8671944789536634, 0.9163138199826525,
        ];
        checkExpected(d.cdf, expected);
    });

    it("correctly approximates inv cdf", () => {
        const expected = [
            NaN,
            1.2709816152101407,
            1.615394266202178,
            2.0531364136588444,
            2.6094986352788734,
            3.3166247903554,
            4.2153691330919,
            5.357656669484113,
            6.8094831275223004,
            8.654727864164492,
        ];
        checkInverseCdf(d, expected);
    });
});

describe("dirac distribution", () => {
    const value = 1;
    const d = new dst.Dirac(value);

    it("gives correct median", () => expect(d.median).toBe(value));
    it("gives correct mode", () => expect(d.mode).toBe(value));
    it("gives correct mean", () => expect(d.mean).toBe(value));
    it("gives correct stddev", () => expect(d.std).toBe(0));
    it("gives correct variance", () => expect(d.variance).toBe(0));

    it("correctly approximates pdf", () => {
        expect(d.pdf(0)).toBe(0.0);
        expect(d.pdf(value)).toBe(1.0);
        expect(d.pdf(2)).toBe(0.0);
    });

    it("correctly approximates cdf", () => {
        expect(d.cdf(0)).toBe(0.0);
        expect(d.cdf(value)).toBe(1.0);
        expect(d.cdf(2)).toBe(1.0);
    });

    it("correctly approximates inv cdf", () => {
        expect(d.inv(0)).toBe(NaN);
        expect(d.cdf(0.5)).toBe(0);
        expect(d.cdf(value)).toBe(value);
    });
});

describe("discrete uniform distribution", () => {
    const nbins = 3;
    const min = 1;
    const max = 3;
    const d = new dst.DiscreteUniform(nbins, min, max);

    it("gives correct median", () => expect(d.median).toBe(2.0));
    it("gives correct mode", () => expect(d.mode).toBe(NaN));
    it("gives correct mean", () => expect(d.mean).toBe(2.0));
    it("gives correct stddev", () => expect(d.std).toBe(0.816496580927726));
    it("gives correct variance", () => expect(d.variance).toBe(0.6666666666666666));

    it("correctly approximates pdf", () => {
        expect(d.pdf(0)).toBe(0.0);
        expect(d.pdf(1)).toBeCloseTo(0.33333333333333);
        expect(d.pdf(1.1)).toBe(0.0);
        expect(d.pdf(2)).toBeCloseTo(0.33333333333333);
        expect(d.pdf(3)).toBeCloseTo(0.33333333333333);
        expect(d.pdf(4)).toBe(0.0);
    });

    it("correctly approximates cdf", () => {
        const expected = [0.0, 0.33333333333333, 0.6666666666666666, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        checkExpected(d.cdf, expected);
    });

    it("correctly approximates inv cdf", () => {
        const expected = [Infinity, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];
        checkInverseCdf(d, expected);
        expect(d.inv(0.3333333333333333)).toBe(1.0);
        expect(d.inv(0.6666666666666666)).toBe(2.0);
        // Floating point precision disallows this from being true
        // expect(d.inv(0.9999999999999999)).toBe(3.0);
    });
});

describe("triangular distribution", () => {
    const min = 0;
    const mode = 0.5;
    const max = 1;
    const d = new dst.Triangular(min, mode, max);

    it("gives correct median", () => expect(d.median).toBe(mode));
    it("gives correct mode", () => expect(d.mode).toBeCloseTo(mode));
    it("gives correct mean", () => expect(d.mean).toBeCloseTo(mode));
    it("gives correct stddev", () => expect(d.std).toBeCloseTo(0.2041241452319315));
    it("gives correct variance", () => expect(d.variance).toBeCloseTo(0.041666666666666664));

    it("correctly approximates pdf", () => {
        const expected = [
            0.0, 0.4, 0.8, 1.2, 1.6, 2.0, 1.6, 1.2000000000000002, 0.7999999999999998, 0.3999999999999999,
        ];
        for (let i = 0; i < 10; i++) {
            expect(d.pdf(i / 10)).toBe(expected[i]);
        }
    });

    it("correctly approximates cdf", () => {
        const expected = [
            0.0, 0.020000000000000004, 0.08000000000000002, 0.18, 0.32000000000000006, 0.5, 0.6799999999999999,
            0.8199999999999998, 0.9199999999999999, 0.98,
        ];
        for (let i = 0; i < 10; i++) {
            expect(d.cdf(i / 10)).toBeCloseTo(expected[i]);
        }
    });

    it("correctly approximates inv cdf", () => {
        const expected = [
            NaN,
            0.22360679774997896,
            0.31622776601683794,
            0.3872983346207417,
            0.4472135954999579,
            0.5,
            0.5527864045000421,
            0.6127016653792583,
            0.683772233983162,
            0.776393202250021,
        ];
        checkInverseCdf(d, expected);
    });
});

describe("pert distribution", () => {
    const min = 0;
    const mode = 5;
    const max = 10;
    const d = new dst.PERT(min, mode, max);

    it("gives correct median", () => expect(d.median).toBe(5.0));
    it("gives correct mode", () => expect(d.mode).toBeCloseTo(mode));
    it("gives correct mean", () => expect(d.mean).toBeCloseTo(5.0));
    it("gives correct stddev", () => expect(d.std).toBeCloseTo(1.889822365046136));
    it("gives correct variance", () => expect(d.variance).toBeCloseTo(3.5714285714285716));

    it("correctly approximates pdf", () => {
        const expected = [
            0.0, 0.02430000000000001, 0.07679999999999997, 0.1323000000000001, 0.17280000000000012, 0.18750000000000008,
            0.17280000000000012, 0.1323000000000001, 0.0768, 0.0243,
        ];
        checkExpected(d.pdf, expected);
    });

    it("correctly approximates cdf", () => {
        const expected = [
            0.0, 0.008560000000000002, 0.05792000000000001, 0.16308, 0.31744000000000006, 0.5, 0.68256,
            0.8369199999999999, 0.94208, 0.99144,
        ];
        checkExpected(d.cdf, expected);
    });

    it("correctly approximates inv cdf", () => {
        const expected = [
            0.0, 2.4663645328846657, 3.2659793784141105, 3.898183505309584, 4.46254097486473, 5.0, 5.53745902513527,
            6.101816494690416, 6.7340206215858895, 7.533635467115333,
        ];
        checkInverseCdf(d, expected);
    });
});
