/* eslint-disable max-classes-per-file */
import beta from "@stdlib/math-base-special-beta";
import betainc from "@stdlib/math-base-special-betainc";
import erf from "@stdlib/math-base-special-erf";
import erfinv from "@stdlib/math-base-special-erfinv";

import {Distribution} from "@shared-types/distribution";

const DENSITY_FACTOR = 1 / Math.sqrt(2 * Math.PI);

export class Normal implements Distribution {
    protected readonly _median: number;
    protected readonly _mean: number;
    protected readonly _mode: number;
    protected readonly _std: number;
    protected readonly _stdDensity: number;
    protected readonly _variance: number;

    constructor(mean = 0, std = 1) {
        if (std <= 0) {
            throw new Error("Standard deviation must be above 0");
        }
        this._median = mean;
        this._mean = mean;
        this._mode = mean;
        this._std = std;
        this._stdDensity = DENSITY_FACTOR / std;
        this._variance = std * std;
    }

    get median(): number {
        return this._median;
    }

    get mean(): number {
        return this._mean;
    }

    get mode(): number {
        return this._mean;
    }

    get std(): number {
        return this._std;
    }

    get variance(): number {
        return this._variance;
    }

    pdf = (x: number): number => {
        const z = (-0.5 * (x - this._mean) ** 2) / this._variance;
        return this._stdDensity * Math.exp(z);
    };

    cdf = (x: number): number => {
        const z = (x - this._mean) / this._std;
        return 0.5 * (1 + erf(z * Math.SQRT1_2));
    };

    inv = (p: number): number => {
        if (p <= 0 || p >= 1) {
            return NaN;
        }
        return this._mean + this._std * Math.SQRT2 * erfinv(2 * p - 1);
    };
}

export class LogNormal extends Normal {
    constructor(mean = 0, std = 1) {
        super(mean, std);
    }

    get median(): number {
        return Math.exp(this._mean);
    }

    get mean(): number {
        return Math.exp(this._mean + 0.5 * this._variance);
    }

    get mode(): number {
        return Math.exp(this._mean - this._variance);
    }

    get std(): number {
        return Math.sqrt(this.variance);
    }

    get variance(): number {
        return (Math.exp(this._variance) - 1) * Math.exp(2 * this._mean + this._variance);
    }

    pdf = (x: number): number => {
        if (x <= 0) {
            return NaN;
        }
        const sltv = (-0.5 * (Math.log(x) - this._mean) ** 2) / this._variance;
        return (this._stdDensity / x) * Math.exp(sltv);
    };

    cdf = (x: number): number => {
        if (x <= 0) {
            return 0;
        }
        const sltv = (Math.log(x) - this._mean) / this._std;
        return 0.5 * (1 + erf(sltv * Math.SQRT1_2));
    };

    inv = (p: number): number => {
        if (p <= 0 || p >= 1) {
            return NaN;
        }
        return Math.exp(this._mean + this._std * Math.SQRT2 * erfinv(2 * p - 1));
    };
}

export class TruncatedNormal extends Normal {
    protected readonly alpha: number;
    protected readonly beta: number;
    protected readonly cdfA: number;
    protected readonly cdfB: number;
    protected readonly norm: Normal;
    protected readonly _min: number;
    protected readonly _max: number;
    protected readonly pdfA: number;
    protected readonly pdfB: number;
    protected readonly Z: number;

    constructor(mean: number, std: number, min: number, max: number) {
        super(mean, std);
        if (min >= max) {
            throw new Error("Maximum must be greater than minimum");
        }
        this._min = min;
        this._max = max;

        this.alpha = (min - mean) / std;
        this.beta = (max - mean) / std;
        this.norm = new Normal();
        this.cdfA = this.norm.cdf(this.alpha);
        this.cdfB = this.norm.cdf(this.beta);
        this.pdfA = this.norm.pdf(this.alpha);
        this.pdfB = this.norm.pdf(this.beta);
        this.Z = this.cdfB - this.cdfA; // Normalizer
    }

    get min(): number {
        return this._min;
    }

    get max(): number {
        return this._max;
    }

    get median(): number {
        return this._mean + this.norm.inv((this.cdfA + this.cdfB) * 0.5) * this._std;
    }

    get mean(): number {
        return this._mean - ((this.pdfA - this.pdfB) / this.Z) * this._std;
    }

    get mode(): number {
        if (this._mean < this._min) {
            return this._min;
        }
        if (this._mean > this._max) {
            return this._max;
        }
        return this._mean;
    }

    get std(): number {
        return Math.sqrt(this.variance);
    }

    get variance(): number {
        const tail = (this.pdfA - this.pdfB) / this.Z;
        return this._variance * (1 - (this.beta * this.pdfB - this.alpha * this.pdfA) / this.Z - tail * tail);
    }

    pdf = (x: number): number => {
        if (x < this._min || x > this._max) {
            return NaN;
        }
        return this.norm.pdf((x - this._mean) / this._std) / (this._std * this.Z);
    };

    cdf = (x: number): number => {
        if (x < this._min || x > this._max) {
            return NaN;
        }
        return (this.norm.cdf((x - this._mean) / this._std) - this.cdfA) / this.Z;
    };

    inv = (p: number): number => {
        if (p <= 0 || p >= 1) {
            return NaN;
        }
        return this.norm.inv(this.cdfA + p * (this.cdfB - this.cdfA) * this._std + this._mean);
    };
}

export class Uniform implements Distribution {
    protected readonly _min: number;
    protected readonly _max: number;
    protected readonly _median: number;
    protected readonly _mean: number;
    protected readonly _mode: number;
    protected readonly _std: number;
    protected readonly _variance: number;

    constructor(min: number, max: number) {
        if (min >= max) {
            throw new Error("Maximum must be greater than minimum");
        }
        this._min = min;
        this._max = max;
        this._median = 0.5 * (min + max);
        this._mean = this._median;
        this._mode = this._median;
        this._variance = 0.08333333333 * (max - min) ** 2; // 1/12
        this._std = Math.sqrt(this._variance);
    }

    get min(): number {
        return this._min;
    }

    get max(): number {
        return this._max;
    }

    get median(): number {
        return this._median;
    }

    get mean(): number {
        return this._mean;
    }

    get mode(): number {
        return this._mean;
    }

    get std(): number {
        return this._std;
    }

    get variance(): number {
        return this._variance;
    }

    pdf = (x: number): number => {
        if (x < this._min || x > this._max) {
            return 0;
        }
        return 1 / (this._max - this._min);
    };

    cdf = (x: number): number => {
        if (x < this._min) {
            return 0;
        }
        if (x > this._max) {
            return 1;
        }
        return (x - this._min) / (this._max - this._min);
    };

    inv = (p: number): number => {
        if (p <= 0 || p >= 1) {
            return NaN;
        }
        return this._min + p * (this._max - this._min);
    };
}

export class LogUniform extends Uniform {
    protected readonly lnFactor: number;

    constructor(min: number, max: number) {
        super(min, max);
        if (min <= 0) {
            throw new Error("LogUniform can't have a negative minimum");
        }
        this.lnFactor = Math.log(this._max / this._min);
    }

    get median(): number {
        return Math.sqrt(this._min * this._max);
    }

    get mean(): number {
        return (this._max - this._min) / this.lnFactor;
    }

    get mode(): number {
        return this._min;
    }

    get std(): number {
        return Math.sqrt(this.variance);
    }

    get variance(): number {
        const tail = (this._max - this._min) / this.lnFactor;
        return (this._max ** 2 - this._min ** 2) / (2 * this.lnFactor) - tail ** 2;
    }

    pdf = (x: number): number => {
        if (x < this._min || x > this._max) {
            return NaN;
        }
        return 1 / (x * this.lnFactor);
    };

    cdf = (x: number): number => {
        if (x < this._min) {
            return 0;
        }
        if (x > this._max) {
            return 1;
        }
        return Math.log(x / this._min) / this.lnFactor;
    };

    inv = (p: number): number => {
        if (p <= 0 || p >= 1) {
            return NaN;
        }
        return this._min * Math.exp(p * this.lnFactor);
    };
}

export class Dirac implements Distribution {
    protected readonly _median: number;
    protected readonly _mean: number;
    protected readonly _mode: number;
    protected readonly _std: number;
    protected readonly _variance: number;

    constructor(value = 0) {
        this._median = value;
        this._mean = value;
        this._mode = value;
        this._std = 0;
        this._variance = 0;
    }

    get median(): number {
        return this._median;
    }

    get mean(): number {
        return this._mean;
    }

    get mode(): number {
        return this._mean;
    }

    get std(): number {
        return this._std;
    }

    get variance(): number {
        return this._variance;
    }

    pdf = (x: number): number => {
        if (x === this._mean) {
            return 1;
        }
        return 0;
    };

    cdf = (x: number): number => {
        if (x < this._mean) {
            return 0;
        }
        return 1;
    };

    inv = (p: number): number => {
        if (p <= 0 || p > 1) {
            return NaN;
        }
        if (p === 1) {
            return this._mean;
        }
        return 0;
    };
}

export class DiscreteUniform extends Uniform {
    protected readonly _nbins: number;
    protected readonly _stepsize: number;
    protected readonly _xValues: number[];

    constructor(nbins: number, min: number, max: number) {
        super(min, max);
        if (nbins < 1) {
            throw new Error("nbins must be greater than 0");
        }
        this._nbins = nbins;
        this._stepsize = Math.abs(max - min) / (nbins - 1);
        // Floating point precision is a problem in the pdf function,
        // so populate the valid values of x first and hope JavaScript's
        // insane number type is sane enough to be consistent in step size
        // additions.
        this._xValues = [];
        for (let i = min; i <= max; i += this._stepsize) {
            this._xValues.push(i);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    get mode(): number {
        return NaN;
    }

    get nbins(): number {
        return this._nbins;
    }

    get std(): number {
        return Math.sqrt(this.variance);
    }

    get variance(): number {
        return 0.08333333333 * (this._nbins * this._nbins - 1); // 1/12
    }

    // This is technically the pmf...
    pdf = (x: number): number => {
        if (x < this._min) {
            return 0;
        }
        if (x === this._min || x === this._max || this._xValues.includes(x)) {
            return 1 / this._nbins;
        }
        return 0;
    };

    cdf = (x: number): number => {
        if (x < this._min) {
            return 0;
        }
        if (x > this._max) {
            return 1;
        }
        return (Math.floor(x) - this._min + 1) / this._nbins;
    };

    inv = (p: number): number => {
        if (p === 0) {
            return Infinity;
        }
        if ((p * this._nbins) % 1 !== 0) {
            return NaN;
        }
        return this._min * (1 - p) + (this._max + 1) * (p - 1);
    };
}

// The error skewed distributions seem a bit non-standard. Hence we just
// copy their transformation calculation as is done in ERT.
export class ErrorSkewedNormal extends Normal {
    protected readonly _max: number;
    protected readonly _min: number;
    protected readonly _skew: number;
    protected readonly _width: number;

    constructor(min: number, max: number, skew: number, width: number) {
        super();
        if (min >= max) {
            throw new Error("Maximum must be greater than minimum");
        }
        if (width === 0) {
            throw new Error("width cannot be 0");
        }
        this._min = min;
        this._max = max;
        this._skew = skew;
        this._width = width;
    }

    pdf = (x: number): number => {
        if (x < this._min || x > this._max) {
            return 0;
        }
        const y = 0.5 * (1 + erf((x + this._skew) / (this._width * Math.SQRT2)));
        return this._min + y * (this._max - this._min);
    };
}

export class DiscreteErrorSkewedNormal extends Normal {
    protected readonly _max: number;
    protected readonly _min: number;
    protected readonly _nbins: number;
    protected readonly _skew: number;
    protected readonly _width: number;

    constructor(nbins: number, min: number, max: number, skew: number, width: number) {
        super();
        if (min >= max) {
            throw new Error("Maximum must be greater than minimum");
        }
        if (nbins < 1) {
            throw new Error("nbins must be greater than 0");
        }
        if (width === 0) {
            throw new Error("width cannot be 0");
        }
        this._nbins = nbins;
        this._min = min;
        this._max = max;
        this._skew = skew;
        this._width = width;
    }

    pdf = (x: number): number => {
        if (x < this._min || x > this._max) {
            return 0;
        }
        const y = Math.floor(
            (this._nbins * 0.5 * (1 + erf((x + this._skew) / (this._width * Math.SQRT2)))) / (this._nbins - 1)
        );
        return this._min + y * (this._max - this._min);
    };
}

export class Triangular implements Distribution {
    protected readonly _max: number;
    protected readonly _median: number;
    protected readonly _mean: number;
    protected readonly _min: number;
    protected readonly _mode: number;
    protected readonly _std: number;
    protected readonly _variance: number;

    constructor(min: number, mode: number, max: number) {
        if (min >= max) {
            throw new Error("Maximum must be greater than minimum");
        }
        this._min = min;
        this._mode = mode;
        this._max = max;
        this._median = NaN;
        this._mean = (min + max + mode) * 0.33333333333;
        this._variance = 0.05555555555 * (min ** 2 + max ** 2 + mode ** 2 - min * max - min * mode - max * mode);
        this._std = Math.sqrt(this._variance);
    }

    get median(): number {
        return this._median;
    }

    get mean(): number {
        return this._mean;
    }

    get mode(): number {
        return this._mean;
    }

    get std(): number {
        return this._std;
    }

    get variance(): number {
        return this._variance;
    }

    pdf = (x: number): number => {
        if (x === this._mode) {
            return 2 / (this._max - this._min);
        }
        if (x >= this._min && x < this._mode) {
            return (2 * (x - this._min)) / ((this._max - this._min) * (this._mode - this._min));
        }
        if (x > this._mode && x <= this._max) {
            return (2 * (this._max - x)) / ((this._max - this._min) * (this._max - this._mode));
        }
        return 0;
    };

    cdf = (x: number): number => {
        if (x <= this._min) {
            return 0;
        }
        if (x > this._min && x <= this._mode) {
            return (x - this._min) ** 2 / ((this._max - this._min) * (this._mode - this._min));
        }
        if (x > this._mode && x < this._max) {
            return 1 - (this._max - x) ** 2 / ((this._max - this._min) * (this._max - this._mode));
        }
        return 1;
    };

    inv = (p: number): number => {
        if (p <= 0 || p >= 1) {
            return NaN;
        }
        const modeCdf = this.cdf(this._mode);
        if (p >= 0 && p <= modeCdf) {
            return this._min + Math.sqrt((this._max - this._min) * (this._mode - this._min) * p);
        }
        return this._max + Math.sqrt((this._max - this._min) * (this._max - this._mode) * (1 - p));
    };
}

export class PERT implements Distribution {
    protected readonly _max: number;
    protected readonly _median: number;
    protected readonly _mean: number;
    protected readonly _min: number;
    protected readonly _mode: number;
    protected readonly _std: number;
    protected readonly _variance: number;
    protected readonly _alpha: number;
    protected readonly _beta: number;

    constructor(min: number, mode: number, max: number) {
        if (min >= max) {
            throw new Error("Maximum must be greater than minimum");
        }
        this._min = min;
        this._mode = mode;
        this._max = max;
        this._median = (min + 6 * mode + max) * 0.125; // 1/8
        this._mean = (min + 4 * mode + max) * 0.1666666666;
        this._variance = 0.14285714285 * ((this._mean - min) * (max - this._mean));
        this._std = Math.sqrt(this._variance);
        this._alpha = 1 + 4 * ((mode - min) / (max - min));
        this._beta = 1 + 4 * ((max - mode) / (max - min));
    }

    get median(): number {
        return this._median;
    }

    get mean(): number {
        return this._mean;
    }

    get mode(): number {
        return this._mean;
    }

    get std(): number {
        return this._std;
    }

    get variance(): number {
        return this._variance;
    }

    pdf = (x: number): number => {
        return (
            ((x - this._min) ** (this._alpha - 1) * (this._max - x) ** (this._beta - 1)) /
            (beta(this._alpha, this._beta) * (this._max - this._min) ** (this._alpha + this._beta - 1))
        );
    };

    cdf = (x: number): number => {
        if (x <= this._min) {
            return 0;
        }
        if (x >= this._max) {
            return 1;
        }
        return betainc(this._alpha, this._beta, x);
    };

    inv = (p: number): number => {
        if (this._min && p) {
            throw new Error("Not implemented!");
        }
        return NaN;
    };
}
