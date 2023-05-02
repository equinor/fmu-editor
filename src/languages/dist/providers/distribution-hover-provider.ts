import {DistOptions} from "@languages/dist";

import * as dist from "@utils/distributions";

import {IMarkdownString, Position, Range, editor, languages} from "monaco-editor";

import {plotContinuousPdf, plotDiscretePdf, svgToDataURL, tokenizeLine, validateLineTokens} from "../utils";

export const createDistributionHoverProvider = (options: DistOptions): languages.HoverProvider => {
    return {
        async provideHover(model: editor.IReadOnlyModel, position: Position) {
            if (!options.hover) {
                return;
            }
            const wordAt = model.getWordAtPosition(position);
            if (!wordAt) {
                return;
            }
            const lineTokens = tokenizeLine(model, position.lineNumber);
            const valid = validateLineTokens(lineTokens);
            if (!valid) {
                return;
            }
            const kind = lineTokens[1].keyword?.label;
            // Skip variable name [0] and distribution type [1]
            const params = lineTokens.slice(2).map(p => Number(p.value.word));

            let distribution;
            let nbins = 1;
            let max = 0;
            let min = 0;
            let isLog = false;
            let isDiscrete = false;
            try {
                switch (kind) {
                    case "LOGNORMAL":
                        isLog = true;
                        min = params[0];
                        max = params[1];
                        distribution = new dist.LogNormal(params[0], params[1]);
                        break;
                    case "TRUNCATED_NORMAL":
                        min = params[2];
                        max = params[3];
                        distribution = new dist.TruncatedNormal(params[0], params[1], min, max);
                        break;
                    case "UNIFORM":
                        min = params[0];
                        max = params[1];
                        distribution = new dist.Uniform(min, max);
                        break;
                    case "LOGUNIF":
                        isLog = true;
                        min = params[0];
                        max = params[1];
                        distribution = new dist.LogUniform(min, max);
                        break;
                    case "CONST":
                        min = params[0] === 0 ? -0.001 : params[0] - params[0] / 100;
                        max = params[0] === 0 ? 0.001 : params[0] + params[0] / 100;
                        distribution = new dist.Dirac(params[0]);
                        break;
                    case "DUNIF":
                        nbins = params[0];
                        min = params[1];
                        max = params[2];
                        // One bin doesn't really make sense in the discrete context,
                        // while providing a min/max
                        if (nbins === 1) {
                            distribution = new dist.Uniform(min, max);
                        } else {
                            isDiscrete = true;
                            distribution = new dist.DiscreteUniform(nbins, min, max);
                        }
                        break;
                    case "ERRF":
                        min = params[0];
                        max = params[1];
                        distribution = new dist.ErrorSkewedNormal(min, max, params[2], params[3]);
                        break;
                    case "DERRF":
                        isDiscrete = true;
                        nbins = params[0];
                        min = params[1];
                        max = params[2];
                        distribution = new dist.DiscreteErrorSkewedNormal(nbins, min, max, params[3], params[4]);
                        break;
                    case "TRIANGULAR":
                        min = params[0];
                        max = params[2];
                        distribution = new dist.Triangular(min, params[1], max);
                        break;
                    case "NORMAL":
                    default: {
                        min = params[0] - 6 * params[1]; // 6 sigma tails
                        max = params[0] + 6 * params[1];
                        distribution = new dist.Normal(params[0], params[1]);
                    }
                }
            } catch (e) {
                return;
            }

            const svg = isDiscrete
                ? plotDiscretePdf(distribution.pdf, options.plotSize, nbins, min, max)
                : plotContinuousPdf(distribution.pdf, options.plotSize, min, max, isLog);
            const dataUrl = await svgToDataURL(svg);

            return {
                range: new Range(position.lineNumber, wordAt.startColumn, position.lineNumber, wordAt.endColumn),
                contents: <IMarkdownString[]>[
                    {
                        value: `<img src="${dataUrl}" alt="Probability density function plot" />`,
                        supportHtml: true,
                    },
                ],
            };
        },
    };
};
