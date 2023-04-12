import electronStore from "@utils/electron-store";

import {Size} from "@shared-types/size";

import * as d3 from "d3";
import {Position, editor} from "monaco-editor";

import {Dist, IDistToken, languageId} from "./constants";

import {modePalette} from "../../themes/theme";

export const tokenizeLine = (model: editor.IReadOnlyModel, lineNumber: number): IDistToken[] => {
    const tokens = editor.tokenize(model.getLineContent(lineNumber), languageId);
    if (tokens.length === 0 || tokens[0].length === 0) {
        return [];
    }

    const fullTokens = tokens[0]
        .filter(t => t.type !== `white.${languageId}` && t.type !== `comment.${languageId}`)
        .map(t => {
            const position = new Position(lineNumber, t.offset + 1);
            const value = model.getWordAtPosition(position);
            const keyword = Dist.keywords.find(kw => kw.label === value?.word);

            return <IDistToken>{
                value,
                position,
                token: t.type.split(".")[0],
                keyword,
            };
        });
    return fullTokens;
};

export const validateLineTokens = (tokens: IDistToken[]): boolean => {
    if (tokens[0].token !== "identifier") {
        return false;
    }
    if (tokens[1].token !== "keyword" || !tokens[1].keyword) {
        return false;
    }
    const params = tokens.slice(2);
    if (params.length !== tokens[1].keyword.numParams) {
        return false;
    }
    const invalidParams = params.filter(num => num.token !== "number");
    return invalidParams.length === 0;
};

const PLOT_MARGINS = {top: 10, right: 10, bottom: 40, left: 40};

const appendScaleX = (xVals: number[], size: Size) => {
    return d3
        .scaleLinear()
        .domain(<[number, number]>d3.extent(xVals))
        .range([PLOT_MARGINS.left, size.width - PLOT_MARGINS.right])
        .nice();
};

const appendScaleY = (yVals: number[], size: Size) => {
    return d3
        .scaleLinear()
        .domain(<[number, number]>[0, d3.max(yVals)])
        .range([size.height - PLOT_MARGINS.bottom, PLOT_MARGINS.top])
        .nice();
};

const appendXAxis = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    xAxis: d3.Axis<d3.NumberValue>,
    scY: d3.ScaleLinear<number, number, never>
) => {
    const svgXAxis = svg
        .append("g")
        .attr("transform", `translate(0, ${scY(0)})`)
        .call(xAxis);

    svgXAxis.selectAll("line").style("stroke", "gray");
    svgXAxis.selectAll("path").style("stroke", "gray");
    svgXAxis
        .selectAll("text")
        .style("stroke", "gray")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");
};

const appendYAxis = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    yAxis: d3.Axis<d3.NumberValue>,
    scX: d3.ScaleLinear<number, number, never>,
    min: number
) => {
    const svgYAxis = svg
        .append("g")
        .attr("transform", `translate(${scX(min)}, 0)`)
        .call(yAxis);

    svgYAxis.selectAll("line").style("stroke", "gray");
    svgYAxis.selectAll("path").style("stroke", "gray");
    svgYAxis.selectAll("text").style("stroke", "gray");
};

const appendLine = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    points: [number, number][],
    stroke: string
) => {
    svg.append("g")
        .append("path")
        .attr("d", d3.line().curve(d3.curveLinear)(<[number, number][]>points))
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", 2);
};

export const plotContinuousPdf = (
    f: (x: number) => number,
    size: Size,
    min: number,
    max: number,
    isLogarithmic = false
) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svg = d3.select(el).attr("width", size.width).attr("height", size.height);

    const dx = Math.abs(max - min) / 100;
    if (isLogarithmic) {
        min = 0;
    } else {
        min -= 10 * dx;
        max += 10 * dx;
    }
    const xVals: number[] = d3.range(min, max, dx);
    const yVals = xVals.map(x => f(x));
    const scX = appendScaleX(xVals, size);
    const scY = appendScaleY(yVals, size);

    // Scale x and f(x) to the screen coordinates
    const points = <[number, number][]>xVals.map((d, i) => [scX(d), scY(yVals[i])]).filter(xy => xy[1]); // Filter undefined `y` values

    const xAxis = d3.axisBottom(scX);
    const yAxis = d3.axisLeft(scY);

    const theme = modePalette(electronStore.get("ui.settings.theme"));
    appendXAxis(svg, xAxis, scY);
    appendYAxis(svg, yAxis, scX, min);
    appendLine(svg, points, theme.primary);

    return el;
};

export const plotDiscretePdf = (f: (x: number) => number, size: Size, nbins: number, min: number, max: number) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svg = d3.select(el).attr("width", size.width).attr("height", size.height);

    const dx = nbins === 1 ? 0.1 : Math.abs(max - min) / (nbins - 1);
    const xVals: number[] = d3.range(min, max + dx - 1e-15, dx);
    const yVals = xVals.map(x => f(x));
    const scX = appendScaleX(xVals, size);
    const scY = appendScaleY(yVals, size);

    // Scale x and f(x) to the screen coordinates
    const data = xVals.map((d, i) => [scX(d), scY(yVals[i])]).filter(xy => xy[1]); // Filter undefined `y` values
    const zeroes = xVals.map(d => [scX(d), scY(0)]);

    // Create axes
    const xAxis = d3.axisBottom(scX);
    const yAxis = d3.axisLeft(scY);

    // Append x-axis and y-axis
    appendXAxis(svg, xAxis, scY);
    appendYAxis(svg, yAxis, scX, min);

    const theme = modePalette(electronStore.get("ui.settings.theme"));
    // Vertical lines from y = 0 to y = 1 / nbins for each bin
    for (let i = 0; i < data.length; i++) {
        const points = <[number, number][]>[zeroes[i], data[i]];
        appendLine(svg, points, theme.primary);
    }

    return el;
};

export const svgToDataURL = (svg: Element): Promise<string> => {
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], {type: "image/svg+xml"});
    // TODO: push this error somewhere useful?
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`svg to data url conversion error: ${reader.error}`));
        reader.onabort = () => reject(new Error("Aborted converting svg to data url"));
        reader.readAsDataURL(blob);
    });
};
