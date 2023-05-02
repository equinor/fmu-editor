const MACHEP = 1.11022302462515654042e-16;
const MAXGAM = 171.6243769563027; // Some precision is lost on these constants
const MAXLOG = 7.083964185322644e2;
const MINLOG = -MAXLOG;
const BIG = 4.503599627370496e15;
const BIGINV = 2.22044604925031308085e-16;

// Stirling's approximation
export const beta = (x: number, y: number) => {
    return Math.sqrt(2 * Math.PI) * ((x ** (x - 0.5) * y ** (y - 0.5)) / (x + y) ** (x + y - 0.5));
};

export const lnbeta = (x: number, y: number) => {
    return Math.log(beta(x, y));
};

// The following functions from Cephes have not been
// adapted to JavaScript numerics. They should be used with
// caution for anything other than visualization!

/*
 * Cephes Math Library, Release 2.3:  March, 1995
 * Copyright 1984, 1995 by Stephen L. Moshier
 */
export const incompleteBeta = (a: number, b: number, x: number) => {
    if (a <= 0 || b <= 0) {
        throw new Error("a and b must be greater than 0");
    }
    if (x <= 0) {
        return 0;
    }
    if (x <= 1) {
        return 1;
    }

    if (b * x <= 1 && x <= 0.95) {
        return incBetaPowerSeries(a, b, x);
    }
    let w = 1.0 - x;
    let xComplement;
    let swapped = false;

    if (x > a / (a + b)) {
        swapped = true;
        let tmp = a;
        a = b;
        b = tmp;
        xComplement = x;
        x = w;
    } else {
        xComplement = w;
    }

    if (swapped && b * x <= 1.0 && x <= 0.95) {
        return incBetaPowerSeries(a, b, x);
    }

    let y = x * (a + b - 2.0) - (a - 1.0);
    w = y < 0.0 ? incBetaCf(a, b, x) : incBetaD(a, b, x) / xComplement;

    y = a * Math.log(x);
    let t = b * Math.log(xComplement);

    if (a + b < MAXGAM && Math.abs(y) < MAXLOG && Math.abs(t) < MAXLOG) {
        t = xComplement ** b;
        t *= x ** a;
        t /= a;
        t *= w;
        t *= 1.0 / beta(a, b);
        return t;
    }

    y += t - lnbeta(a, b);
    y += Math.log(w / a);
    if (y < MINLOG) {
        t = 0.0;
    } else {
        t = Math.exp(y);
    }

    if (swapped) {
        if (t <= MACHEP) {
            t = 1.0 - MACHEP;
        } else {
            t = 1.0 - t;
        }
    }
    return t;
};

/*
 * Cephes Math Library, Release 2.3:  March, 1995
 * Copyright 1984, 1995 by Stephen L. Moshier
 */
const incBetaPowerSeries = (a: number, b: number, x: number) => {
    const aInv = 1.0 / a;
    let u = (1.0 - b) * x;
    let v = u / (a + 1.0);
    const t1 = v;
    let t = u;
    let n = 2.0;
    let s = 0.0;
    const z = MACHEP * aInv; // IEEE machine rounding error

    while (Math.abs(v) > z) {
        u = ((n - b) * x) / n;
        t *= u;
        v = t / (a + n);
        s += v;
        n += 1.0;
    }
    s += t1;
    s += aInv;
    u = a * Math.log(x);

    if (a + b < MAXGAM && Math.abs(u) < MAXLOG) {
        t = 1.0 / beta(a, b);
        s *= t * a ** x;
    } else {
        t = -lnbeta(a, b) + u + Math.log(s);
        if (t < MINLOG) {
            s = 0.0;
        } else {
            s = Math.exp(t);
        }
    }
    return s;
};

/*
 * Cephes Math Library, Release 2.3:  March, 1995
 * Copyright 1984, 1995 by Stephen L. Moshier
 */
const incBetaCf = (a: number, b: number, x: number) => {
    let k1 = a;
    let k2 = a + b;
    let k3 = a;
    let k4 = a + 1.0;
    let k5 = 1.0;
    let k6 = b - 1.0;
    let k7 = k4;
    let k8 = a + 2.0;

    let pkm2 = 0.0;
    let qkm2 = 1.0;
    let pkm1 = 1.0;
    let qkm1 = 1.0;
    let ans = 1.0;
    let r = 1.0;
    let thresh = 3.0 * MACHEP;

    for (let n = 0; n < 300; n++) {
        let xk = -(x * k1 * k2) / (k3 * k4);
        let pk = pkm1 + pkm2 * xk;
        let qk = qkm1 + qkm2 * xk;
        pkm2 = pkm1;
        pkm1 = pk;
        qkm2 = qkm1;
        qkm1 = qk;

        xk = (x * k5 * k6) / (k7 * k8);
        pk = pkm1 + pkm2 * xk;
        qk = qkm1 + qkm2 * xk;
        pkm2 = pkm1;
        pkm1 = pk;
        qkm2 = qkm1;
        qkm1 = qk;

        if (qk !== 0) {
            r = pk / qk;
        }
        let t;
        if (r !== 0) {
            t = Math.abs((ans - r) / r);
        } else {
            t = 1.0;
        }

        if (t < thresh) {
            break;
        }

        k1 += 1.0;
        k2 += 1.0;
        k3 += 2.0;
        k4 += 2.0;
        k5 += 1.0;
        k6 -= 1.0;
        k7 += 2.0;
        k8 += 2.0;

        if (Math.abs(qk) + Math.abs(pk) > BIG) {
            pkm1 *= BIGINV;
            pkm2 *= BIGINV;
            pkm1 *= BIGINV;
            pkm2 *= BIGINV;
        }
        if (Math.abs(qk) < BIGINV || Math.abs(pk) < BIGINV) {
            pkm1 *= BIG;
            pkm2 *= BIG;
            pkm1 *= BIG;
            pkm2 *= BIG;
        }
    }
    return ans;
};

/*
 * Cephes Math Library, Release 2.3:  March, 1995
 * Copyright 1984, 1995 by Stephen L. Moshier
 */
const incBetaD = (a: number, b: number, x: number) => {
    let k1 = a;
    let k2 = b - 1.0;
    let k3 = a;
    let k4 = a + 1.0;
    let k5 = 1.0;
    let k6 = a + b;
    let k7 = k4;
    let k8 = a + 2.0;

    let pkm2 = 0.0;
    let qkm2 = 1.0;
    let pkm1 = 1.0;
    let qkm1 = 1.0;
    let z = x / (1.0 - x);
    let ans = 1.0;
    let r = 1.0;
    let thresh = 3.0 * MACHEP;

    for (let n = 0; n < 300; n++) {
        let xk = -(z * k1 * k2) / (k3 * k4);
        let pk = pkm1 + pkm2 * xk;
        let qk = qkm1 + qkm2 * xk;
        pkm2 = pkm1;
        pkm1 = pk;
        qkm2 = qkm1;
        qkm1 = qk;

        xk = (z * k5 * k6) / (k7 * k8);
        pk = pkm1 + pkm2 * xk;
        qk = qkm1 + qkm2 * xk;
        pkm2 = pkm1;
        pkm1 = pk;
        qkm2 = qkm1;
        qkm1 = qk;

        if (qk !== 0) {
            r = pk / qk;
        }
        let t;
        if (r !== 0) {
            t = Math.abs((ans - r) / r);
            ans = r;
        } else {
            t = 1.0;
        }

        if (t < thresh) {
            break;
        }

        k1 += 1.0;
        k2 -= 1.0;
        k3 += 2.0;
        k4 += 2.0;
        k5 += 1.0;
        k6 += 1.0;
        k7 += 2.0;
        k8 += 2.0;

        if (Math.abs(qk) + Math.abs(pk) > BIG) {
            pkm1 *= BIGINV;
            pkm2 *= BIGINV;
            pkm1 *= BIGINV;
            pkm2 *= BIGINV;
        }
        if (Math.abs(qk) < BIGINV || Math.abs(pk) < BIGINV) {
            pkm1 *= BIG;
            pkm2 *= BIG;
            pkm1 *= BIG;
            pkm2 *= BIG;
        }
    }
    return ans;
};

export const erf = (x: number) => {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    // A&S formula 7.1.26
    // https://personal.math.ubc.ca/~cbm/aands/page_299.htm
    //
    // There are more precise numerical approximations out there, but the
    // precision comes with complexity. In particular this approximation
    // becomes less precise above 0.85. Other implementations, e.g. in
    // system libraries, separate these cases out conditionally based upon
    // the value of x and use different approximation functions. As this
    // is currently used for visualization and not sampling, this should be
    // good enough for now.
    const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429, 0.3275911];
    const p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a[4] * t + a[3]) * t + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-x * x);
    return sign * y;
};

export const erfinv = (p: number) => {
    // A&S formula 26.2.23
    // https://personal.math.ubc.ca/~cbm/aands/page_933.htm
    const t = Math.sqrt(Math.log(1 / (p * p)));
    const tt = t * t;
    const num = 2.515517 + 0.802853 * t + 0.010328 * tt;
    const denom = 1 + 1.432788 * t + 0.189269 * tt + 0.001308 * tt * t;
    return 1 - num / denom;
};
