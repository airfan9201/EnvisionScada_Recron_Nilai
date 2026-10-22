/// <reference path="../lib/file-saver/js/file-saver.js" />
/// <reference path="../../lib/working/file-saver/js/file-saver.js" />
/// <reference path="../../lib/working/file-saver/js/file-saver.js" />
/// <reference path="../../lib/working/file-saver/js/file-saver.js" />
import {
    addSeconds,
    eachDayOfInterval,
    eachHourOfInterval,
    eachMinuteOfInterval,
    eachWeekOfInterval,
    format,
    subDays,
    subHours,
    subMinutes,
    subSeconds
} from "./../lib/date-fns/js/date-fns.js"
import axios from "./../lib/axios/js/axios.js";
import "./../lib/deepmerge/js/deepmerge.js";
import "./../lib/file-saver/js/file-saver.js";
import * as immer from "./../lib/immer/js/immer.js";
import * as echarts from "./../lib/echarts/js/echarts.js";


/*
* ====================================================================
*                       Helper functions - START
* ====================================================================
*/
const axiosWrapper = axios.create({
    baseURL: BaseURL,
    headers: {RequestVerificationToken: AntiForgeryToken},
});


// Tempus Dominus defaults to Font Awesome classes for its picker chrome. Its
// "sprites" icon type emits <svg><use href="..."/></svg> instead, so the pickers
// draw from the same #taIconSprite symbols as the rest of the page.
const TA_PICKER_ICONS = {
    type: "sprites",
    time: "#ta-icon-clock",
    date: "#ta-icon-calendar",
    up: "#ta-icon-arrow-up",
    down: "#ta-icon-arrow-down",
    previous: "#ta-icon-chevron-left",
    next: "#ta-icon-chevron-right",
    today: "#ta-icon-calendar-check",
    clear: "#ta-icon-trash",
    close: "#ta-icon-close",
};

// Points the inline SVG inside `root` at a different symbol in #taIconSprite.
const setIcon = (root, iconName) => {
    const use = root?.querySelector("svg use");
    if (!use) return;
    use.setAttribute("href", "#ta-icon-" + iconName);
    use.setAttribute("xlink:href", "#ta-icon-" + iconName);
};

// Writes an English UI label and records it as the translation key. These labels
// are injected after _SystemTranslationsPartial has run its initial sweep, so the
// caller re-runs applyTranslations() once the labels are in place. An explicit
// data-i18n value outranks any key the translator cached earlier, which is what
// lets a label still resolve after the selection changes.
const setTranslatableLabel = (el, label) => {
    if (!el) return;
    el.innerText = label;
    el.setAttribute("data-i18n", label);
};

const applyTranslations = () => window.EnvisionTranslate?.();

// Colour swatches reuse the Parameters page's colorPick. Each swatch drives a hidden
// input that still holds the raw hex, so the rest of this file reads and writes .value
// exactly as it did when these were <input type="color">. The change event is dispatched
// manually because a hidden input never fires one on its own.
const colorSwatchPickers = new WeakMap();

const paintColorSwatch = (swatch, hex) => {
    swatch.style.background = hex;
    swatch.setAttribute("title", hex);
};

const setupColorSwatch = (swatch) => {
    const input = document.getElementById(swatch.dataset.cpFor);
    if (!input || !window.jQuery || !window.jQuery.colorPick) return;

    const current = input.value || "#000000";
    const existing = colorSwatchPickers.get(swatch);

    // Settings get loaded into the hidden inputs after the pickers are built, and colorPick
    // reads its colour from the instance when opening. Retarget the existing instance rather
    // than constructing a new one: only close() removes a popover from the DOM, so replacing
    // a live instance would strand its popover there - invisible, but still fixed-position
    // and click-blocking.
    if (existing) {
        // resolveThemeColor first: the input may hold a Color Library NAME, and assigning that
        // straight to .color bypasses the constructor, which normally resolves rawValue. Without it
        // reopening the dialog paints a black swatch for a perfectly valid named color.
        existing.color = (resolveThemeColor(current) || current).toUpperCase();
        existing.rawValue = current;
        paintColorSwatch(swatch, resolveThemeColor(current));
        return;
    }

    paintColorSwatch(swatch, resolveThemeColor(current));

    colorSwatchPickers.set(
        swatch,
        new window.jQuery.colorPick(swatch, {
            initialColor: current,
            paletteLabel: "Choose Color",
            // The library is offered so a pen or chart color can follow the active theme.
            showLibrary: true,
            init: function () {
                paintColorSwatch(swatch, resolveThemeColor(this.element.attr("title")));
            },
            onColorSelected: function () {
                // The TITLE, not this.color: picking a library entry puts the NAME in the title and
                // the resolved hex in this.color. Storing this.color would freeze the value at
                // whatever the library holds right now, and the setting would stop following it.
                const value = this.element.attr("title");
                paintColorSwatch(swatch, resolveThemeColor(value));
                input.value = value;
                input.dispatchEvent(new Event("change", {bubbles: true}));
            },
        })
    );
};

const refreshColorSwatches = (root = document) => {
    root.querySelectorAll(".cp-param-swatch[data-cp-for]").forEach(setupColorSwatch);
};

const checkIfAllofThePenDataIsFetched = ({
                                             pen,
                                             data,
                                             startDateTime,
                                             endDateTime,
                                         }) => {
    const startDate = Math.ceil(startDateTime.getTime() / 1000);
    const endDate = Math.ceil(endDateTime.getTime() / 1000);

    console.log({startDateTime, endDateTime, startDate, endDate});

    if (data.length == 0)
        return {
            pen: pen,
            missingData: true,
            noData: true,
            missingDataFromStartInSeconds: endDate - startDate,
            missingDataFromEndInSeconds: endDate - startDate,
            isDataMissingFromStartDate: true,
            isDataMissingFromEndDate: true,
            startDateTime: null,
            endDateTime: null,
        };

    const fetchedStartDate = Math.ceil(data[0].date / 1000);
    const fetchedEndDate = Math.ceil(data[data.length - 1].date / 1000);

    return {
        pen: pen,
        noData: false,
        missingData: fetchedStartDate > startDate || fetchedEndDate < endDate,
        isDataMissingFromStartDate: fetchedStartDate > startDate,
        isDataMissingFromEndDate: fetchedEndDate < endDate,
        missingDataFromStartInSeconds: fetchedStartDate - startDate,
        missingDataFromEndInSeconds: endDate - fetchedEndDate,
        startDateTime: data[0],
        endDateTime: data[data.length - 1],
    };
};

// --- Color Library resolution ---
//
// A Trend Analyst color setting may hold a Color Library NAME instead of a literal color, so pens
// and the chart follow the active theme like every graphical object does. The stored configuration
// keeps the NAME: that is what makes it a reference rather than a copy, and it is what the settings
// dialog and the three export paths must keep showing.
//
// Resolution therefore happens on the way to the PAINT, not in the stored value. The two painters
// (saveChartGlobalSettings and saveAppThemeSettings) resolve their whole settings object once at the
// top, which covers every color read inside them in one place - and, importantly, means convertHex,
// LightenDarkenColor and hex_is_light always receive a real hex. Those three parseInt the string and
// would produce NaN colors from a name.
function resolveThemeColor(value) {
    if (typeof value !== "string" || !value) { return value; }
    if (window.jQuery && $.colorPick && $.colorPick.resolveHex) {
        return $.colorPick.resolveHex(value);
    }
    return value;
}

// A shallow copy with every string value resolved. Non color keys (sliderHandleIcon, numbers) are
// left alone: an icon name is never a library entry, and resolveThemeColor returns anything it does
// not recognise unchanged anyway.
function resolveThemeColors(settings) {
    if (!settings || typeof settings !== "object") { return settings; }

    const resolved = Array.isArray(settings) ? [] : {};

    Object.keys(settings).forEach((key) => {
        const value = settings[key];
        resolved[key] = typeof value === "string" ? resolveThemeColor(value) : value;
    });

    return resolved;
}

function convertHex(hexCode, opacity = 1) {
    var hex = hexCode.replace("#", "");

    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    var r = parseInt(hex.substring(0, 2), 16),
        g = parseInt(hex.substring(2, 4), 16),
        b = parseInt(hex.substring(4, 6), 16);

    /* Backward compatibility for whole number based opacity values. */
    if (opacity > 1 && opacity <= 100) {
        opacity = opacity / 100;
    }

    if (opacity === null) {
        return r + "," + g + "," + b;
    } else {
        return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
    }
}

function LightenDarkenColor(colorCode, percentage = 20) {
    const amount = hex_is_light(colorCode) ? -percentage : percentage;

    var usePound = false;

    if (colorCode[0] == "#") {
        colorCode = colorCode.slice(1);
        usePound = true;
    }

    var num = parseInt(colorCode, 16);

    var r = (num >> 16) + amount;

    if (r > 255) {
        r = 255;
    } else if (r < 0) {
        r = 0;
    }

    var b = ((num >> 8) & 0x00ff) + amount;

    if (b > 255) {
        b = 255;
    } else if (b < 0) {
        b = 0;
    }

    var g = (num & 0x0000ff) + amount;

    if (g > 255) {
        g = 255;
    } else if (g < 0) {
        g = 0;
    }

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}


function hex_is_light(color) {
    const hex = color.replace("#", "");
    const c_r = parseInt(hex.substring(0, 0 + 2), 16);
    const c_g = parseInt(hex.substring(2, 2 + 2), 16);
    const c_b = parseInt(hex.substring(4, 4 + 2), 16);
    const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000;
    return brightness > 155;
}


const combineMerge = (target, source, options) => {
    const destination = target.slice();

    source.forEach((item, index) => {
        if (typeof destination[index] === "undefined") {
            destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
        } else if (options.isMergeableObject(item)) {
            destination[index] = deepmerge(target[index], item, options);
        } else if (target.indexOf(item) === -1) {
            destination.push(item);
        }
    });
    return destination;
};


const getChartOptions = (opts = {createEmptyRightSpace: false}) => {

    const data = chartData.value;
    const penSettings = chartPenSettings.value;
    const createEmptyRightSpace = opts.createEmptyRightSpace;

    let xAxis, yAxis, series, dataZoom, grid;

    const seriesKeys = Object.keys(data);
    const legendNames = seriesKeys.map((key) => penSettings[key].name);

    const hasXAxis1 = seriesKeys.some((key) => penSettings[key].xAxisIndex == 1);
    const hasXAxis2 = seriesKeys.some((key) => penSettings[key].xAxisIndex == 2);
    const hasTwoXAxis = hasXAxis1 && hasXAxis2;

    let penGroups = {};
    const yAxisIndices = {};
    let index = 0;
    seriesKeys.forEach((key) => {
        const groupKey = getSeriesGroupKey(penSettings, key);

        if (!penGroups[groupKey]) {
            penGroups[groupKey] = JSON.parse(JSON.stringify(penSettings[key]));
            yAxisIndices[groupKey] = index;
            index++;
        } else {
            penGroups[groupKey].lineColor = "#000000";
        }
    });

    let penGroupEnteries = Object.entries(penGroups);

    const yAxisOffset = [0, 0];
    penGroupEnteries.forEach(([, settings]) => {
        const gridIndex =
            isSplitView.value && settings.xAxisIndex === 2 && hasTwoXAxis ? 1 : 0;

        yAxisOffset[gridIndex] += 1;
    });

    grid = [
        {
            show: true,
            top: 20,
            left: 50,
            right: 60 + yAxisOffset[0] * 30,
            bottom: ["zoom-x-y", "zoom-x"].includes(zoomMode.value.value) ? 80 : 20,
        },
    ];

    if (seriesKeys.length > 0) {
        xAxis = [
            {
                type: "time",
                scale: true,
                boundaryGap: ["50%", "50%"],
                gridIndex: 0,

                splitLine: {
                    show: true,
                },
                min: (val) => {
                    // const misssingDataFromEndInMilliseconds =
                    //   pensMissingDataXAxis1.value.missingDataFromEndInSeconds * 1000;

                    // const offset =
                    //   misssingDataFromEndInMilliseconds < 120_000 ? 10_000 : 0;

                    // const newMin = val.min - misssingDataFromEndInMilliseconds - offset;

                    // return newMin - Math.abs(newMin - val.max) * 0.1;

                    return val.min - Math.abs(val.min - val.max) * 0.1;
                },
                max: (val) => {
                    if (createEmptyRightSpace) {
                        // const misssingDataFromStartInMilliseconds =
                        //   pensMissingDataXAxis1.value.missingDataFromStartInSeconds * 1000;

                        // const offset =
                        //   misssingDataFromStartInMilliseconds < 120_000 ? 10_000 : 0;

                        // const newMax =
                        //   val.max - misssingDataFromStartInMilliseconds + offset;

                        // return newMax + Math.abs(val.min - newMax) * 0.1;

                        return val.max + Math.abs(val.min - val.max) * 0.1;
                    }
                    return val.max;
                },
            },
        ];

        dataZoom = [
            {
                id: "verticalSlider",
                brushSelect: true,
                orient: "vertical",
                type: "slider",
                right: 20,
                filterMode: "none",
                yAxisIndex: 0,
            },
            {
                id: "horizontalSliderXAxis1",
                brushSelect: true,
                orient: "horizontal",
                type: "slider",
                filterMode: "none",
                xAxisIndex: 0,
                bottom: 10,
                top: null,
            },
            {
                id: "horizontalInsideXAxis1",
                type: "inside",
                orient: "horizontal",
                filterMode: "none",
                xAxisIndex: 0,
            },
            {
                id: "verticalInside",
                type: "inside",
                orient: "vertical",
                filterMode: "none",
            },
        ];

        if (isSplitView.value && hasXAxis2) {
            dataZoom.push({
                id: "verticalSliderForGrid2",
                brushSelect: true,
                orient: "vertical",
                type: "slider",
                right: 20,
                filterMode: "none",
                yAxisIndex: 1,
            });
        }

        const yAxisOffset = [0, 0];
        yAxis = penGroupEnteries.map(([, settings], index) => {
            function autoRangeMin(value) {
                return (
                    value.min -
                    (Math.abs(settings.min - settings.max) * settings.rangeMargin) / 100
                );
            }

            function autoRangeMax(value) {
                return (
                    value.max +
                    (Math.abs(settings.min - settings.max) * settings.rangeMargin) / 100
                );
            }

            const gridIndex =
                isSplitView.value && settings.xAxisIndex === 2 && hasTwoXAxis ? 1 : 0;

            const offset = yAxisOffset[gridIndex] * 30;
            yAxisOffset[gridIndex] += 1;

            return {
                type: "value",
                name: "",
                min: settings.autoRange ? autoRangeMin : settings.min,
                max: settings.autoRange ? autoRangeMax : settings.max,
                position: "right",
                // alignTicks: true,
                gridIndex: gridIndex,
                offset: offset,
                axisLabel: {
                    rotate: 70,
                    formatter: (value) => `${value.toFixed(0)} ` + settings.unit,
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: resolveThemeColor(settings.lineColor),
                    },
                },
            };
        });

        //TODO: check if it causes any bugs
        // if (penGroupEnteries.length === 1) {
        //   yAxis = yAxis[0];
        // }

        series = seriesKeys.map((key) => {
            const groupKey = getSeriesGroupKey(penSettings, key);

            const newData =
                data[key].map((e, i) => {
                    const nextItem = data[key][i + 1];
                    const prevItem = data[key][i - 1];

                    return {
                        value: [e.date, e.value],
                        symbol:
                            nextItem &&
                            prevItem &&
                            nextItem.value === e.value &&
                            prevItem.value === e.value
                                ? "none"
                                : "circle",
                    };
                }) ?? [];

            let xAxisIndex = +penSettings[key].xAxisIndex - 1;
            if (hasXAxis2 && !hasXAxis1) {
                xAxisIndex = 0;
            }
            //console.log({ xAxisIndex });

            return {
                id: key,
                name: penSettings[key].name,
                type: chartType.value,
                // bar options
                barCategoryGap: "10%",
                barWidth: "150%",
                // large: false,
                barGap: "5%",
                data: newData,
                // clip: true,
                // smooth: true,
                // showSymbol: false,
                sampling: "lttb",
                yAxisIndex: yAxisIndices[groupKey],
                xAxisIndex,

                step: penSettings[key].style === "step",
                connectNulls: true,
                lineStyle: {
                    width: penSettings[key].lineWidth,
                },
                itemStyle: {
                    color: resolveThemeColor(penSettings[key].lineColor),
                },
            };
        });

        if (hasTwoXAxis) {
            grid[0].top = ["zoom-x-y", "zoom-x"].includes(zoomMode.value.value)
                ? 80
                : 20;
            if (isSplitView.value) {
                grid[0].bottom = "50.5%";
                grid.push({
                    show: true,
                    top: "50.5%",
                    left: 50,
                    right: 60 + yAxisOffset[1] * 30,
                    bottom: ["zoom-x-y", "zoom-x"].includes(zoomMode.value.value)
                        ? 80
                        : 20,
                });
            }

            xAxis[0].position = "top";
            xAxis.push({
                type: "time",
                scale: true,
                boundaryGap: ["50%", "50%"],
                position: "bottom",
                splitLine: {
                    show: true,
                },
                min: (val) => {
                    return val.min - Math.abs(val.min - val.max) * 0.1;
                },
                max: (val) => {
                    if (createEmptyRightSpace) {
                        return val.max + Math.abs(val.min - val.max) * 0.1;
                    }
                    return val.max;
                },

                gridIndex: isSplitView.value ? 1 : 0,
            });

            // for  id= "horizontalSliderXAxis1"
            dataZoom[1].top = 10;
            delete dataZoom[1].bottom;

            dataZoom = [
                ...dataZoom,
                {
                    id: "horizontalSliderXAxis2",
                    brushSelect: true,
                    orient: "horizontal",
                    type: "slider",
                    filterMode: "none",
                    xAxisIndex: 1,
                    bottom: 10,
                },
                {
                    id: "horizontalInsideXAxis2",
                    type: "inside",
                    orient: "horizontal",
                    filterMode: "none",
                    xAxisIndex: 1,
                },
            ];
        } else if (hasXAxis2) {
            dataZoom[1].id = "horizontalSliderXAxis2";
            dataZoom[2].id = "horizontalInsideXAxis2";

            // xAxis[0].position = "top";
            // xAxis.push({
            //   type: "time",
            //   position: "bottom",
            //   splitLine: {
            //     show: true,
            //   },
            //   min: (val) => {
            //     return val.min - Math.abs(val.min - val.max) * 0.1;
            //   },
            //   max: (val) => {
            //     if (createEmptyRightSpace) {
            //       return val.max + Math.abs(val.min - val.max) * 0.1;
            //     }
            //     return val.max;
            //   },
            // });
        }
    } else {
        xAxis = [];
        yAxis = [];
        series = [];
        dataZoom = [];
    }

    return {
        grid: grid,
        legend: {
            show: false,
            data: legendNames,
        },
        tooltip: {
            trigger: "axis",
            // hiding null values which are added in getHistoricDataForPenService
            formatter: (tooltipData) => {
                const map = {};
                tooltipData.forEach((item) => {
                    if (item.data.value[1] !== null) {
                        map[item.seriesName] = {
                            data: item.data.value,
                            marker: item.marker,
                            seriesName: item.seriesName,
                        };
                    }
                });

                if (Object.values(map).length === 0) return null;

                const html = Object.values(map).map((item) => {
                    return `${item.marker}${item.seriesName}<span style="float: right; margin-left: 20px"><b>${item.data[1]}</b> </span>`;
                });

                const date = tooltipData[0].data.value[0];
                return (
                    format(new Date(date), "yyyy-MM-dd HH:mm:ss") +
                    "<br/>" +
                    html.join("<br/>")
                );
            },
            axisPointer: {
                animation: false,
                type: "cross",
                lineStyle: {
                    color: "#376df4",
                    width: 2,
                    opacity: 1,
                },
            },
        },
        xAxis: xAxis,
        yAxis: yAxis,

        dataZoom: dataZoom,
        series: series,
    };
};


const chartIntervalToSeconds = {
    "1m": 60,
    "5m": 300,
    "10m": 600,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "2h": 7200,
    "6h": 21600,
    "12h": 43200,
    "1d": 86400,
};


function getSeriesGroupKey(penSettings, key) {
    return `${penSettings[key].min} ${penSettings[key].max} ${penSettings[key].unit
    } ${penSettings[key].autoRange} ${penSettings[key].rangeMargin}  ${isSplitView.value ? penSettings[key].xAxisIndex : ""
    } `;
}


function getEachGroupIntervals(intervalName) {
    let interval;
    if (intervalName === "group-minute") {
        interval = eachMinuteOfInterval;
    } else if (intervalName === "group-hour") {
        interval = eachHourOfInterval;
    } else if (intervalName === "group-day") {
        interval = eachDayOfInterval;
    } else if (intervalName === "group-week") {
        interval = eachWeekOfInterval;
    }

    return interval;
}


const getXAxisIdsForIndex = (index) => {
    return Object.entries(chartPenSettings.value)
        .filter(([key, value]) => {
            return value.xAxisIndex == index;
        })
        .map(([key, value]) => {
            return key;
        });
};


//import saveChartHistoricDataForPen from "./saveChartHistoricDataForPen.js?version=20241102";
function calculateGroupedData({
                                  xAxisIndex,
                                  pensIds,
                                  data,
                                  groupBy,
                                  endDate,
                                  startDate,
                                  groupedDataRemainingTimeLeft,
                                  groupedDataRemainingTimeRight,
                                  direction,
                                  addingNewPens,
                              }) {
    const xAxisIndexIds = pensIds ? pensIds : getXAxisIdsForIndex(xAxisIndex);
    if (xAxisIndexIds.length === 0) return [];

    // TODO:
    if (groupBy === "group-none") {
        return;
    }

    const groupedPensList = {};

    xAxisIndexIds.forEach((penId) => {
        groupedPensList[penId] = [];
    });

    const dateRangeInSeconds = Math.abs(
        (endDate.getTime() - startDate.getTime()) / 1000
    );

    const remainingTimeLeftTemp = addingNewPens
        ? 0
        : groupedDataRemainingTimeLeft.value;

    const remainingTimeRightTemp = addingNewPens
        ? 0
        : groupedDataRemainingTimeRight.value * -1;

    const groupIntervals = getEachGroupIntervals(groupBy)({
        start: new Date(
            startDate.getTime() - (direction === "right" ? remainingTimeRightTemp : 0)
        ),
        end: new Date(
            endDate.getTime() + (direction === "left" ? remainingTimeLeftTemp : 0)
        ),
    });

    groupIntervals.pop();

    console.log({
        groupIntervals,
        remainingTimeRightTemp,
        remainingTimeLeftTemp,
        opt: {
            start: new Date(
                startDate.getTime() -
                (direction === "right" ? remainingTimeRightTemp : 0)
            ),
            end: new Date(
                endDate.getTime() + (direction === "left" ? remainingTimeLeftTemp : 0)
            ),
        },
    });

    const intervalInSeconds = groupByInSeconds[groupBy];

    const left = groupIntervals[0].getTime() - startDate.getTime();
    const right =
        endDate.getTime() -
        groupIntervals[groupIntervals.length - 1].getTime() -
        intervalInSeconds * 1000;
    console.log({
        left,
        right,
        last: groupIntervals[groupIntervals.length - 1].getTime(),
        endDate: endDate.getTime(),
        diff:
            endDate.getTime() - groupIntervals[groupIntervals.length - 1].getTime(),
        intervalInSeconds,
    });

    const numberOfGroups = Math.floor(dateRangeInSeconds / intervalInSeconds);

    const start =
        (direction === "left" ? endDate : startDate).getTime() +
        (direction === "left" ? remainingTimeLeftTemp : remainingTimeRightTemp);

    if (!addingNewPens) {
        if (direction === "left") groupedDataRemainingTimeLeft.value = left;
        if (direction === "right") groupedDataRemainingTimeRight.value = right;
    }

    // console.log({ date12121: new Date(endDate.getTime() + remainingTimeTemp) });

    const {func: groupDataByCallback, intervals} = getGroupDataByCallback({
        numberOfGroups,
        groupIntervals,
        interval: intervalInSeconds * 1000,
        intervalName: groupBy,
        startDate: start,
        direction: direction,
    });

    let groupIntervalsFromGroupBy = intervals.map((i) => +i);

    console.log({
        data,
        intervalInSeconds,
        numberOfGroups,
        dateRangeInSeconds,
        // groupedDataRemainingTimeInSeconds: groupedDataRemainingTime.value / 1000,
        remainingTimeLeftTemp,
        remainingTimeRightTemp,
        startDate: new Date(start),
        direction: direction,
    });

    const groupedData = xAxisIndexIds.map((penId) => {
        console.log({penId, data: data, penData: data[penId]});

        const groupedPenData = groupDataBy(data[penId], groupDataByCallback);
        console.log({groupedPenData});

        const groupedPenDataArray = Object.entries(groupedPenData)
            .filter(([key]) => key !== "undefined")
            .map(([key, value]) => {
                const sum = value.reduce((acc, curr) => {
                    if (curr.value !== null) {
                        acc += curr.value;
                    }
                    return acc;
                }, 0);

                groupIntervalsFromGroupBy = groupIntervalsFromGroupBy.filter(
                    (i) => i !== +key
                );

                return {value: sum / value.length, date: +key};
            });

        groupedPenDataArray.push(
            ...groupIntervalsFromGroupBy.map((i) => {
                return {value: null, date: i};
            })
        );

        return {pen: {id: penId}, data: groupedPenDataArray};
    });

    return groupedData;
}


function handleGroupData({
                             xAxisIndex,
                             pensIds,
                             data,
                             mergeData,
                             insertDataAtTheStart,
                             chartStartDate,
                             chartEndDate,
                             stopFetchingNewData,
                             groupedDataRemainingTimeLeft,
                             groupedDataRemainingTimeRight,
                             direction = "left",
                             addingNewPens,
                             createEmptySpaceOnTheRight = false,
                         }) {
    stopFetchingNewData.value = true;

    const groupedData = calculateGroupedData({
        xAxisIndex: xAxisIndex,
        pensIds,
        data: data,
        groupBy: groupBy.value.value,
        startDate: chartStartDate,
        endDate: chartEndDate,
        stopFetchingNewData,
        groupedDataRemainingTimeLeft,
        groupedDataRemainingTimeRight,
        direction,
        addingNewPens,
    });

    groupedData.forEach(({pen, data}) => {
        saveChartHistoricDataForPen(pen, data, mergeData, insertDataAtTheStart);
    });

    console.log({groupedData, chartData: chartData.value});

    chartInstance.value.setOption(
        getChartOptions({
            createEmptyRightSpace: createEmptySpaceOnTheRight,
        }),
        {
            replaceMerge: ["series", "xAxis", "yAxis"],
        }
    );

    console.log({chart2233: chartInstance.value.getOption()});
}


function handleSaveGlobalSettings(settings) {

    const {
        chartGlobalSettings: _chartGlobalSettings,
        appTheme: _appTheme,
        chartGetDataFetchingInterval: interval,
    } = settings;

    chartGlobalSettings.value = _chartGlobalSettings;
    appTheme.value = _appTheme;

    chartGetDataFetchingInterval.value = interval;

    saveChartGlobalSettings(_chartGlobalSettings);
    saveAppThemeSettings(_appTheme);
}


function loadSettings() {
    const settings = getUpdatedSettings();
    if (settings == null) return;

    handleSaveGlobalSettings(settings);
}

function getUpdatedSettings() {

    const globalSettings = document.getElementById("globalSettings");

    const settings = {chartGlobalSettings: {}, appTheme: {}};

    // Update chartGlobalSettings values

    const interval = document.getElementById(
        "chartGetDataFetchingInterval"
    ).value;

    if (interval < 0) {
        alert("Fetching new data interval must be equal or greater than 0");
        $("#chartGetDataFetchingInterval")
            .get(0)
            .scrollIntoView({behavior: "smooth"});
        return null;
    }
    settings.chartGetDataFetchingInterval =
        interval === 0 ? undefined : interval * 1000;

    settings.chartGlobalSettings.gridHorizontalColor =
        globalSettings.querySelector("#gridHorizontalColor").value;

    settings.chartGlobalSettings.gridVerticalColor =
        globalSettings.querySelector("#gridVerticalColor").value;

    //settings.chartGlobalSettings.gridHorizontalColor = "#ff0000";

    //settings.chartGlobalSettings.gridVerticalColor = "#ff0000";

    //console.log("gridHorizontalColor " + globalSettings.querySelector("#gridHorizontalColor").value);
    //console.log("gridVerticalColor " + globalSettings.querySelector("#gridVerticalColor").value);

    //   settings.chartGlobalSettings.subGridHorizontalColor = globalSettings.querySelector(
    //     "#subGridHorizontalColor"
    //   ).value;
    //   settings.chartGlobalSettings.subGridVerticalColor = globalSettings.querySelector(
    //     "#subGridVerticalColor"
    //   ).value;

    settings.chartGlobalSettings.gridBackgroundColor =
        globalSettings.querySelector("#gridBackgroundColor").value;

    settings.chartGlobalSettings.textColor =
        globalSettings.querySelector("#gridTextColor").value;
    settings.chartGlobalSettings.xAxisColor =
        globalSettings.querySelector("#XAxisColor").value;
    settings.chartGlobalSettings.tooltipBackgroundColor =
        globalSettings.querySelector("#tooltipBackgroundColor").value;
    settings.chartGlobalSettings.tooltipBorderColor =
        globalSettings.querySelector("#tooltipBorderColor").value;
    settings.chartGlobalSettings.tooltipTextColor =
        globalSettings.querySelector("#tooltipTextColor").value;
    settings.chartGlobalSettings.sliderBackgroundColor =
        globalSettings.querySelector("#chartSliderBackgroundColor").value;
    settings.chartGlobalSettings.sliderTextColor = globalSettings.querySelector(
        "#chartSliderTextColor"
    ).value;
    settings.chartGlobalSettings.sliderAreaColor = globalSettings.querySelector(
        "#chartSliderAreaColor"
    ).value;
    settings.chartGlobalSettings.sliderSelectedAreaColor =
        globalSettings.querySelector("#chartSliderSelectedAreaColor").value;
    settings.chartGlobalSettings.sliderHandleColor = globalSettings.querySelector(
        "#chartSliderHandleColor"
    ).value;
    settings.chartGlobalSettings.sliderHandleIcon = globalSettings.querySelector(
        "#chartSliderHandleIcon"
    ).value;
    settings.chartGlobalSettings.appBackgroundColor =
        globalSettings.querySelector("#appBackgroundColor").value;
    settings.chartGlobalSettings.appTextColor =
        globalSettings.querySelector("#appTextColor").value;
    settings.chartGlobalSettings.accordianBackgroundColor =
        globalSettings.querySelector("#accordianBackgroundColor").value;
    settings.chartGlobalSettings.buttonBackgroundColor =
        globalSettings.querySelector("#buttonBackgroundColor").value;
    settings.chartGlobalSettings.buttonTextColor =
        globalSettings.querySelector("#buttonTextColor").value;

    // Update appTheme values
    settings.appTheme.backgroundColor = globalSettings.querySelector(
        "#appBackgroundColor"
    ).value;

    settings.appTheme.textColor =
        globalSettings.querySelector("#appTextColor").value;
    settings.appTheme.buttonBackgroundColor = globalSettings.querySelector(
        "#buttonBackgroundColor"
    ).value;
    settings.appTheme.buttonTextColor =
        globalSettings.querySelector("#buttonTextColor").value;
    settings.appTheme.accordionActiveBackgroundColor =
        globalSettings.querySelector("#accordianBackgroundColor").value;

    return settings;
}


function saveAppThemeSettings(_appTheme) {

    // Resolved once here rather than at each of the ~15 reads below, which also guarantees the
    // derived-color helpers never see a library name.
    _appTheme = resolveThemeColors(_appTheme);
    // .btn-secondary covers the modal footer buttons, so they follow the configured
    // button colours instead of sitting at Bootstrap's own grey.
    document.querySelectorAll(".btn-dark, .btn-secondary").forEach((buttonElement) => {
        buttonElement.style.setProperty(
            `--bs-btn-bg`,
            _appTheme.buttonBackgroundColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-color`,
            _appTheme.buttonTextColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-border-color`,
            _appTheme.buttonBackgroundColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-hover-color`,
            _appTheme.buttonTextColor
        );
        buttonElement.style.setProperty(
            `--bs-btn-active-color`,
            _appTheme.buttonTextColor
        );
        buttonElement.style.setProperty(
            `--bs-btn-disabled-color`,
            _appTheme.buttonTextColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-hover-bg`,
            convertHex(_appTheme.buttonBackgroundColor, 0.9)
        );

        buttonElement.style.setProperty(
            `--bs-btn-hover-border-color`,
            convertHex(_appTheme.buttonBackgroundColor, 0.85)
        );

        buttonElement.style.setProperty(
            `--bs-btn-active-bg`,
            convertHex(_appTheme.buttonBackgroundColor, 0.8)
        );

        buttonElement.style.setProperty(
            `--bs-btn-active-border-color`,
            convertHex(_appTheme.buttonBackgroundColor, 0.75)
        );
    });

    document.querySelectorAll(".btn-icon").forEach((buttonElement) => {
        buttonElement.style.setProperty(`--bs-btn-bg`, _appTheme.buttonTextColor);

        buttonElement.style.setProperty(
            `--bs-btn-color`,
            _appTheme.buttonBackgroundColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-border-color`,
            _appTheme.buttonTextColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-hover-color`,
            convertHex(_appTheme.buttonBackgroundColor, 0.9)
        );
        buttonElement.style.setProperty(
            `--bs-btn-active-color`,
            convertHex(_appTheme.buttonBackgroundColor, 0.8)
        );
        buttonElement.style.setProperty(
            `--bs-btn-disabled-color`,
            _appTheme.buttonBackgroundColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-hover-bg`,
            _appTheme.buttonTextColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-hover-border-color`,
            _appTheme.buttonTextColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-active-bg`,
            _appTheme.buttonTextColor
        );

        buttonElement.style.setProperty(
            `--bs-btn-active-border-color`,
            _appTheme.buttonTextColor
        );
    });

    document.querySelectorAll(".dropdown-menu").forEach((el) => {
        el.style.setProperty(`--bs-dropdown-link-color`, _appTheme.buttonTextColor);

        el.style.setProperty(`--bs-dropdown-bg`, _appTheme.buttonBackgroundColor);

        el.style.setProperty(
            `--bs-dropdown-border-color`,
            convertHex(_appTheme.buttonTextColor, 20)
        );

        el.style.setProperty(
            `--bs-dropdown-link-hover-bg`,
            LightenDarkenColor(_appTheme.buttonBackgroundColor, 20)
        );

        el.style.setProperty(
            `--bs-dropdown-link-hover-color`,
            LightenDarkenColor(_appTheme.buttonTextColor)
        );
    });

    document.querySelectorAll(".modal").forEach((modalElement) => {
        modalElement.style.setProperty(`--bs-modal-bg`, _appTheme.backgroundColor);

        modalElement.style.setProperty(`--bs-modal-color`, _appTheme.textColor);
        modalElement.style.setProperty(
            `--bs-modal-header-border-color`,
            convertHex(_appTheme.textColor, 0.2)
        );
    });

    document.querySelectorAll(".btn-close").forEach((closeBtn) => {
        if (hex_is_light(_appTheme.backgroundColor)) {
            closeBtn.classList.remove("btn-close-white");
        } else {
            closeBtn.classList.add("btn-close-white");
        }
    });

    document.querySelectorAll(".accordion-button").forEach((el) => {
        el.style.setProperty(
            `--bs-accordion-active-bg`,
            _appTheme.accordionActiveBackgroundColor
        );
    });

    document.querySelectorAll(".table").forEach((tableElement) => {
        tableElement.style.setProperty(`--bs-table-bg`, _appTheme.backgroundColor);

        tableElement.style.setProperty(`--bs-table-color`, _appTheme.textColor);
        tableElement.style.setProperty(
            `--bs-table-border-color`,
            convertHex(_appTheme.textColor, 0.2)
        );
    });

    document.querySelectorAll(".navbar-toggler").forEach((el) => {
        el.style.setProperty(
            `--bs-navbar-toggler-icon-bg`,

            `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28${convertHex(
                _appTheme.textColor,
                null
            )}, 0.75%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e")`
        );

        el.style.setProperty(
            "--bs-navbar-toggler-border-color",
            convertHex(_appTheme.textColor, 0.75)
        );
    });

    document.querySelectorAll(".accordion").forEach((el) => {
        el.style.setProperty(
            `--bs-accordion-btn-icon`,

            `url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg viewBox='0 0 16 16' width='16' height='16'  xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z' style='fill: ${convertHex(
                _appTheme.accordionActiveBackgroundColor
            )}; fill-rule: evenodd;'/%3E%3C/svg%3E")`
        );

        el.style.setProperty(
            `--bs-accordion-btn-active-icon`,

            `url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg viewBox='0 0 16 16' width='16' height='16'  xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z' style='fill: ${convertHex(
                LightenDarkenColor(_appTheme.accordionActiveBackgroundColor, 200)
            )}; fill-rule: evenodd;'/%3E%3C/svg%3E")`
        );
    });

    document
        .querySelectorAll(".modal-backdrop")
        .forEach((modalBackdropElement) => {
            modalBackdropElement.style.setProperty(
                `--bs-backdrop-bg`,
                convertHex(_appTheme.textColor, 0.5)
            );

            modalBackdropElement.style.setProperty(`--bs-backdrop-opacity`, 1);
        });

    document.querySelectorAll(".nav-tabs").forEach((navTabElement) => {
        navTabElement.style.setProperty(
            `--bs-nav-tabs-border-color`,
            convertHex(_appTheme.textColor, 0.2)
        );

        navTabElement.style.setProperty(
            `--bs-nav-tabs-link-hover-border-color`,
            convertHex(_appTheme.textColor, 0.2)
        );

        navTabElement.style.setProperty(
            `--bs-nav-tabs-link-active-color`,
            _appTheme.textColor
        );
        navTabElement.style.setProperty(
            `--bs-nav-tabs-link-active-bg`,
            _appTheme.backgroundColor
        );

        navTabElement.style.setProperty(
            `--bs-nav-tabs-link-active-border-color`,
            convertHex(_appTheme.textColor, 0.2)
        );
    });

    document.documentElement.style.setProperty(
        `--bs-tertiary-bg`,
        LightenDarkenColor(_appTheme.backgroundColor)
    );

    document.documentElement.style.setProperty(
        `--bs-tertiary-bg-rgb`,
        convertHex(LightenDarkenColor(_appTheme.backgroundColor), null)
    );

    document.documentElement.style.setProperty(
        `--bs-emphasis-color`,
        _appTheme.textColor
    );

    document.documentElement.style.setProperty(
        `--bs-emphasis-color-rgb`,
        convertHex(_appTheme.textColor, null)
    );

    document.documentElement.style.setProperty(
        `--bs-body-bg`,
        _appTheme.backgroundColor
    );

    document.documentElement.style.setProperty(
        `--bs-body-color`,
        _appTheme.textColor
    );

    document.documentElement.style.setProperty(
        `--bs-border-color`,
        convertHex(_appTheme.textColor, 0.2)
    );

    document.documentElement.style.setProperty(
        `--bs-secondary-color`,
        convertHex(_appTheme.textColor, 0.5)
    );

    document.documentElement.style.setProperty(
        `--bs-secondary-color-rgb`,
        convertHex(_appTheme.textColor, null)
    );

    document.documentElement.style.setProperty(
        `--bs-secondary-bg`,
        LightenDarkenColor(_appTheme.backgroundColor, 20)
    );

    // Accent pair for the modal skin (trendanalyst-modern.css): the configured
    // button colours double as the accent so tabs, focus rings and selection
    // tints follow the TrendAnalyst config instead of a hard-coded palette.
    document.documentElement.style.setProperty(
        `--ta-accent`,
        _appTheme.buttonBackgroundColor
    );

    document.documentElement.style.setProperty(
        `--ta-accent-text`,
        _appTheme.buttonTextColor
    );
}

function saveChartGlobalSettings(_chartGlobalSettings) {

    // Same as saveAppThemeSettings: one resolve covers every axis, grid, tooltip and slider color
    // read below, including the ones that go through convertHex.
    _chartGlobalSettings = resolveThemeColors(_chartGlobalSettings);

    const chartOpts = getChartOptions();

    let yAxis;
    let xAxis;

    if (Array.isArray(chartOpts.yAxis)) {
        yAxis = chartOpts.yAxis.map(() => {
            return {
                splitLine: {
                    lineStyle: {color: _chartGlobalSettings.gridHorizontalColor},
                },
            };
        });
    } else {
        yAxis = {
            splitLine: {
                lineStyle: {color: _chartGlobalSettings.gridHorizontalColor},
            },
        };
    }

    if (Array.isArray(chartOpts.xAxis)) {
        xAxis = chartOpts.xAxis.map(() => {
            return {
                axisLine: {lineStyle: {color: _chartGlobalSettings.xAxisColor}},
                splitLine: {
                    lineStyle: {color: _chartGlobalSettings.gridVerticalColor},
                },
            };
        });
    } else {
        xAxis = {
            axisLine: {lineStyle: {color: _chartGlobalSettings.xAxisColor}},
            splitLine: {
                lineStyle: {color: _chartGlobalSettings.gridVerticalColor},
            },
        };
    }
    const dataZoomObject = {
        textStyle: {color: _chartGlobalSettings.sliderTextColor},
        backgroundColor: _chartGlobalSettings.sliderBackgroundColor,
        fillerColor: convertHex(_chartGlobalSettings.sliderAreaColor, 0.2),
        handleIcon:
            _chartGlobalSettings.sliderHandleIcon === "default"
                ? "path://M-9.35,34.56V42m0-40V9.5m-2,0h4a2,2,0,0,1,2,2v21a2,2,0,0,1-2,2h-4a2,2,0,0,1-2-2v-21A2,2,0,0,1-11.35,9.5Z"
                : _chartGlobalSettings.sliderHandleIcon,
        handleStyle: {
            color: _chartGlobalSettings.sliderHandleColor,
            borderColor: convertHex(_chartGlobalSettings.sliderAreaColor, 0.9),
        },
        moveHandleStyle: {
            color: convertHex(_chartGlobalSettings.sliderAreaColor, 0.9),
        },
        emphasis: {
            moveHandleStyle: {
                color: convertHex(_chartGlobalSettings.sliderAreaColor, 0.9),
            },
        },
        borderColor: convertHex(_chartGlobalSettings.sliderAreaColor, 0.4),

        dataBackground: {
            areaStyle: {
                color: convertHex(_chartGlobalSettings.sliderAreaColor, 0.9),
            },
            lineStyle: {
                color: convertHex(_chartGlobalSettings.sliderAreaColor, 0.9),
            },
        },
        selectedDataBackground: {
            areaStyle: {
                color: convertHex(_chartGlobalSettings.sliderSelectedAreaColor, 0.7),
            },
            lineStyle: {
                color: convertHex(_chartGlobalSettings.sliderSelectedAreaColor, 0.7),
            },
        },
    };


    //console.log(dataZoomObject);
    //chartInstance.value.setOption({
    //  tooltip: {
    //    backgroundColor: _chartGlobalSettings.tooltipBackgroundColor,
    //    borderColor: _chartGlobalSettings.tooltipBorderColor,
    //    textStyle: { color: _chartGlobalSettings.tooltipTextColor },
    //  },
    //  grid: { backgroundColor: _chartGlobalSettings.gridBackgroundColor },
    //  textStyle: { color: _chartGlobalSettings.textColor },
    //  legend: { textStyle: { color: _chartGlobalSettings.textColor } },
    //  dataZoom: [
    //    { ...dataZoomObject, id: "horizontalSliderXAxis1" },
    //    { ...dataZoomObject, id: "horizontalSliderXAxis2" },
    //    { ...dataZoomObject, id: "verticalSlider" },
    //  ],

    //  yAxis: yAxis,
    //  xAxis: xAxis,
    //});

    chartInstance.value.setOption({
        tooltip: {
            backgroundColor: _chartGlobalSettings.tooltipBackgroundColor,
            borderColor: _chartGlobalSettings.tooltipBorderColor,
            textStyle: {color: _chartGlobalSettings.tooltipTextColor},
        },
        grid: {backgroundColor: _chartGlobalSettings.gridBackgroundColor},
        textStyle: {color: _chartGlobalSettings.textColor},
        legend: {textStyle: {color: _chartGlobalSettings.textColor}},
        dataZoom: [
            {...dataZoomObject, id: "verticalSlider"},
        ],

        yAxis: yAxis,
        xAxis: xAxis,
    });

    const hasXAxis1 = Object.values(chartPenSettings.value).some(
        (s) => s.xAxisIndex == 1
    );
    const hasXAxis2 = Object.values(chartPenSettings.value).some(
        (s) => s.xAxisIndex == 2
    );

    if (hasXAxis1) {
        chartInstance.value.setOption({
            dataZoom: [
                {...dataZoomObject, id: "horizontalSliderXAxis1"},
            ]
        });
    }

    if (hasXAxis2) {
        chartInstance.value.setOption({
            dataZoom: [
                {...dataZoomObject, id: "horizontalSliderXAxis2"},
            ]
        });
    }

    if (pensList.value.length === 0) {
        chartInstance.value.setOption(chartOpts, {
            lazyUpdate: true,
            replaceMerge: ["dataZoom", "yAxis", "xAxis"],
        });
    }

}


function swapElements(obj1, obj2) {
    // create marker element and insert it where obj1 is
    var temp = document.createElement("div");
    obj1.parentNode.insertBefore(temp, obj1);

    // move obj1 to right before obj2
    obj2.parentNode.insertBefore(obj1, obj2);

    // move obj2 to right before where obj1 used to be
    temp.parentNode.insertBefore(obj2, temp);

    // remove temporary marker node
    temp.parentNode.removeChild(temp);
}


function swapXAxis2DatePickersTo(direction) {
    const chartStartTimePickerXAxis1 = document.getElementById(
        "chartStartTimeXAxis1"
    );
    const chartStartTimePickerXAxis2 = document.getElementById(
        "chartStartTimeXAxis2"
    );

    const chartEndTimePickerXAxis1 =
        document.getElementById("chartEndTimeXAxis1");
    const chartEndTimePickerXAxis2 =
        document.getElementById("chartEndTimeXAxis2");

    const chartIntervalTimePickerXAxis1 = document.getElementById(
        "chartIntervalTimeXAxis1"
    );
    const chartIntervalTimePickerXAxis2 = document.getElementById(
        "chartIntervalTimeXAxis2"
    );

    const resetButtonXAxis1 = document.getElementById("resetButtonXAxis1");
    const resetButtonXAxis2 = document.getElementById("resetButtonXAxis2");

    const saveCancelButtonsContainerXAxis1 = document.getElementById(
        "saveCancelButtonsContainerXAxis1"
    );
    const saveCancelButtonsContainerXAxis2 = document.getElementById(
        "saveCancelButtonsContainerXAxis2"
    );

    if (
        (chartStartTimePickerXAxis2.parentNode.id !==
            "timePickersContainerXAxis2" &&
            direction === "bottom") ||
        (chartStartTimePickerXAxis2.parentNode.id ===
            "timePickersContainerXAxis2" &&
            direction === "top")
    ) {
        swapElements(chartStartTimePickerXAxis1, chartStartTimePickerXAxis2);
        swapElements(chartEndTimePickerXAxis1, chartEndTimePickerXAxis2);
        swapElements(chartIntervalTimePickerXAxis1, chartIntervalTimePickerXAxis2);
        swapElements(resetButtonXAxis1, resetButtonXAxis2);
        swapElements(
            saveCancelButtonsContainerXAxis1,
            saveCancelButtonsContainerXAxis2
        );
    }
}

function handleXAxisChange() {

    const hasXAxis1 = Object.values(chartPenSettings.value).some(
        (s) => s.xAxisIndex == 1
    );
    const hasXAxis2 = Object.values(chartPenSettings.value).some(
        (s) => s.xAxisIndex == 2
    );
    const hasTwoXAxis = hasXAxis1 && hasXAxis2;

    const opt = getChartOptions();

    chartInstance.value.setOption(opt, true);

    if (hasTwoXAxis) {
        document.getElementById("navbarXAxis2").style.display = "flex";
        document.getElementById("syncButtonXAxis1").style.display = "flex";
        document.getElementById("panningLockButtonXAxis1").style.display = "flex";
    } else {
        document.getElementById("navbarXAxis2").style.display = "none";
        document.getElementById("syncButtonXAxis1").style.display = "none";
        document.getElementById("panningLockButtonXAxis1").style.display = "none";
    }

    if (!hasXAxis1 && hasXAxis2) {
        swapXAxis2DatePickersTo("top");
    } else {
        swapXAxis2DatePickersTo("bottom");
    }

    loadSettings(); // if not, the chart will reset its colors to default when changing the axis's
}


async function loadChartData({
                                 chartStartDate,
                                 chartEndDate,
                                 mode = "loadChartInitialData", // or loadChartDataUsingStartAndEndDates
                                 stopFetchingNewData,
                                 groupedDataRemainingTimeLeft,
                                 groupedDataRemainingTimeRight,
                                 pensList,
                                 dataZoomId,
                                 createEmptySpaceOnTheRight,
                                 isLoadingHistoriclData,
                             }) {
    isLoadingInitialData.value = true;
    isLoadingHistoriclData.value = true;

    let startDate, endDate;
    if (mode === "loadChartDataUsingStartAndEndDates") {
        startDate = chartStartDate.value;
        endDate = chartEndDate.value;
        createEmptySpaceOnTheRight.value = true;
    } else {
        startDate = getStartDate(dataLoadingInterval.value);
        endDate = new Date();
    }

    function getStartDate(interval) {
        const now = new Date();

        return {
            "1m": subMinutes.bind(null, now, 1),
            "5m": subMinutes.bind(null, now, 5),
            "10m": subMinutes.bind(null, now, 10),
            "15m": subMinutes.bind(null, now, 15),
            "30m": subMinutes.bind(null, now, 30),
            "1h": subHours.bind(null, now, 1),
            "2h": subHours.bind(null, now, 2),
            "6h": subHours.bind(null, now, 6),
            "12h": subHours.bind(null, now, 12),
            "1d": subDays.bind(null, now, 1),
        }[interval]();
    }

    chartInstance.value.showLoading();
    chartInstance.value.setOption(
        {},
        {
            replaceMerge: ["series"],
        }
    );

    const historicDataPromises = pensList.map((pen) => {
        return getHistoricDataForPenService({
            pen,
            startDatetime: startDate,
            endDatetime: endDate,
        });
    });

    Promise.all(historicDataPromises)
        .then((res) => {
            // res.forEach(({ pen, data }) => {
            //   saveChartHistoricDataForPen(pen, data, false);
            // });
            if (groupBy.value.value === "group-none") {
                res.forEach(({pen, data}) => {
                    saveChartHistoricDataForPen(pen, data, false);
                });
            } else {
                const data = {};
                const pensIds = [];
                res.forEach(({pen, data: d}) => {
                    data[pen.id] = d;
                    pensIds.push(pen.id);
                });

                handleGroupData({
                    pensIds: pensIds,
                    groupedDataRemainingTimeLeft,
                    groupedDataRemainingTimeRight,
                    stopFetchingNewData,
                    data: data,
                    chartStartDate: startDate,
                    chartEndDate: endDate,
                    mergeData: false,
                    insertDataAtTheStart: false,
                });
            }

            //console.log({ startDate1122: startDate });

            chartStartDate.value = startDate;
            const opt = getChartOptions({
                createEmptyRightSpace: mode === "loadChartDataUsingStartAndEndDates",
            });

            opt.dataZoom = [{id: dataZoomId, start: 0, end: 100}];

            chartInstance.value.setOption(opt, {
                replaceMerge: ["series", "xAxis"],
            });
        })
        .finally(() => {
            if (
                groupBy.value.value === "group-none" &&
                mode === "loadChartInitialData"
            ) {
                stopFetchingNewData.value = false;
            }
            isLoadingHistoriclData.value = false;
            chartInstance.value.hideLoading();

            isLoadingInitialData.value = false;
            if (mode === "loadChartDataUsingStartAndEndDates") {
                setSelectedAreaTo({
                    mode: "chartEndTime",
                    interval: {startValue: startDate, endValue: endDate},
                    dataZoomId,
                });
            } else {
                setSelectedAreaTo({mode: "dataLoadingInterval", dataZoomId});
            }
        });
}


const loadChartDataForXAxis = ({
                                   XAxisIndex,
                                   stopFetchingNewData,
                                   mode = "loadChartInitialData", // or loadChartDataUsingStartAndEndDates
                                   chartStartDate,
                                   chartEndDate,
                               }) => {
    const xAxisIndexIds = getXAxisIdsForIndex(XAxisIndex);

    const pensListForXAxis = pensList.value.filter((p) =>
        xAxisIndexIds.includes(p.id.toString())
    );

    const groupedDataRemainingTimeLeft =
        XAxisIndex === 1
            ? groupedDataRemainingTimeLeftXAxis1
            : groupedDataRemainingTimeLeftXAxis2;

    const groupedDataRemainingTimeRight =
        XAxisIndex === 1
            ? groupedDataRemainingTimeRightXAxis1
            : groupedDataRemainingTimeRightXAxis2;

    const createEmptySpaceOnTheRight =
        XAxisIndex === 1
            ? createEmptySpaceOnTheRightXAxis1
            : createEmptySpaceOnTheRightXAxis2;

    const isLoadingHistoriclData =
        XAxisIndex === 1
            ? isLoadingHistoriclDataXAxis1
            : isLoadingHistoriclDataXAxis2;

    if (pensListForXAxis.length > 0) {
        loadChartData({
            stopFetchingNewData: stopFetchingNewData,
            groupedDataRemainingTimeLeft,
            groupedDataRemainingTimeRight,
            pensList: pensListForXAxis,
            chartStartDate: chartStartDate,
            chartEndDate: chartEndDate,
            mode: mode,
            dataZoomId: "horizontalSliderXAxis" + XAxisIndex,
            createEmptySpaceOnTheRight: createEmptySpaceOnTheRight,
            isLoadingHistoriclData: isLoadingHistoriclData,
        });
    }
};


async function loadChartInitialData({
                                        chartStartDate,
                                        stopFetchingNewData,
                                        pensList,
                                        pensMissingData,
                                        dataZoomId,
                                    }) {
    isLoadingInitialData.value = true;
    isLoadingHistoriclData.value = true;

    const getStartDate = (interval) => {
        const now = new Date();

        return {
            "1m": subMinutes.bind(null, now, 1),
            "5m": subMinutes.bind(null, now, 5),
            "10m": subMinutes.bind(null, now, 10),
            "15m": subMinutes.bind(null, now, 15),
            "30m": subMinutes.bind(null, now, 30),
            "1h": subHours.bind(null, now, 1),
            "2h": subHours.bind(null, now, 2),
            "6h": subHours.bind(null, now, 6),
            "12h": subHours.bind(null, now, 12),
            "1d": subDays.bind(null, now, 1),
        }[interval]();
    };

    const startDate = getStartDate(dataLoadingInterval.value);

    chartInstance.value.showLoading();
    chartInstance.value.setOption(
        {},
        {
            replaceMerge: ["series"],
        }
    );
    const now = new Date();
    const historicDataPromises = pensList.map((pen) => {
        return getHistoricDataForPenService({
            pen,
            startDatetime: startDate,
            endDatetime: now,
            merge: false,
        });
    });

    // let isMissingDatainTheEnd = false;
    // let missingDataLength = 0;
    Promise.all(historicDataPromises)
        .then((res) => {
            res.forEach(({pen, data}) => {
                saveChartHistoricDataForPen(pen, data, false);

                // const { isDataMissingFromEndDate, missingDataFromEndInSeconds } =
                //   checkIfAllofThePenDataIsFetched({
                //     pen,
                //     data,
                //     startDateTime: startDate,
                //     endDateTime: now,
                //   });

                // if (isDataMissingFromEndDate) {
                //   isMissingDatainTheEnd = true;
                //   missingDataLength = Math.max(
                //     missingDataLength,
                //     missingDataFromEndInSeconds
                //   );
                // }
            });

            // if (isMissingDatainTheEnd) {
            //   pensMissingData.value = immer.produce(
            //     pensMissingData.value,
            //     (draft) => {
            //       if (draft.isDataMissingFromEndDate) {
            //         draft.missingDataFromEndInSeconds += missingDataLength;
            //       } else {
            //         draft.isDataMissingFromEndDate = isMissingDatainTheEnd;
            //         draft.missingDataFromEndInSeconds = missingDataLength;
            //       }
            //     }
            //   );
            // }

            console.log({startDate1122: startDate});

            // savePensMissingdata({
            //   pensData: res,
            //   startDate: startDate,
            //   endDate: now,
            //   pensMissingData: pensMissingData,
            // });

            chartStartDate.value = startDate;
            const opt = getChartOptions();

            opt.dataZoom = [{id: dataZoomId, start: 0, end: 100}];

            chartInstance.value.setOption(opt, {
                replaceMerge: ["series", "xAxis"],
            });
        })
        .finally(() => {
            stopFetchingNewData.value = false;
            isLoadingHistoriclData.value = false;
            chartInstance.value.hideLoading();

            isLoadingInitialData.value = false;
            setSelectedAreaTo({mode: "dataLoadingInterval", dataZoomId});
        });
}


const loadChartInitialDataForXAxis = ({
                                          XAxisIndex,
                                          stopFetchingNewData,
                                          chartStartDate,
                                      }) => {
    const xAxisIndexIds = getXAxisIdsForIndex(XAxisIndex);

    const pensListForXAxis = pensList.value.filter((p) =>
        xAxisIndexIds.includes(p.id.toString())
    );

    const pensMissingData =
        XAxisIndex === 1 ? pensMissingDataXAxis1 : pensMissingDataXAxis2;

    pensMissingData.value = {
        missingDataFromStartInSeconds: 0,
        missingDataFromEndInSeconds: 0,
    };

    if (pensListForXAxis.length > 0) {
        loadChartInitialData({
            stopFetchingNewData: stopFetchingNewData,
            pensList: pensListForXAxis,
            chartStartDate: chartStartDate,
            dataZoomId: "horizontalSliderXAxis" + XAxisIndex,
            pensMissingData: pensMissingData,
        });
    }
};


class ReactiveState {
    constructor(initialState) {
        this._state = initialState;
        this._allListeners = [];
    }

    // Getter for the state
    get value() {
        return this._state;
    }

    // Setter for the state with event notification
    set value(newState) {
        const oldState = this._state;
        this._state = newState;

        // Trigger all subscribed listeners
        this._notifyAllListeners(newState, oldState);
    }

    // Subscribe to all state changes
    subscribe(listener) {
        if (typeof listener !== "function") {
            throw new TypeError("Invalid listener type provided.");
        }
        this._allListeners.push(listener);
    }

    // Unsubscribe from all state changes
    unsubscribe(listener) {
        this._allListeners = this._allListeners.filter((l) => l !== listener);
    }

    // Notify all subscribed listeners
    _notifyAllListeners(newState, oldState) {
        this._allListeners.forEach((listener) => listener(newState, oldState));
    }
}


const saveChartHistoricDataForPen = (
    pen,
    newData,
    merge = true,
    insertAtTheStart = false
) => {
    chartData.value = immer.produce(chartData.value, (oldData) => {
        const penID = pen.id;

        if (merge) {
            if (!oldData[penID]) {
                oldData[penID] = [];
            }
            if (insertAtTheStart) {
                oldData[penID].push(...newData);
            } else {
                oldData[penID].unshift(...newData);
            }
        } else {
            oldData[penID] = newData;
        }
    });
};


const saveChartNewData = ({pensList, newData}) => {
    chartData.value = immer.produce(chartData.value, (draft) => {
        pensList.map(({id}) => {
            if (!newData[id]) return;
            if (!draft[id]) {
                draft[id] = [newData[id]];
            } else {
                draft[id].push(newData[id]);
            }
        });
    });
};


const savePensMissingdata = ({
                                 pensData,
                                 pensMissingData,
                                 startDate,
                                 endDate,
                                 mode = "end",
                             }) => {
    let isMissingData = false;
    let missingDataLength = Number.MAX_SAFE_INTEGER;
    let hasNoData = false;

    pensData.forEach(({pen, data}) => {
        const {
            missingDataFromEndInSeconds,
            missingDataFromStartInSeconds,
            noData,
        } = checkIfAllofThePenDataIsFetched({
            pen,
            data,
            startDateTime: startDate,
            endDateTime: endDate,
        });

        const missingData =
            mode == "end"
                ? missingDataFromEndInSeconds
                : missingDataFromStartInSeconds;

        if (missingData > 0) {
            isMissingData = true;
            if (missingData < missingDataLength) {
                missingDataLength = missingData;
                hasNoData = noData;
            }
        }

        console.log({missingDataLength});
    });

    const key =
        mode == "end"
            ? "missingDataFromEndInSeconds"
            : "missingDataFromStartInSeconds";
    if (isMissingData) {
        pensMissingData.value = immer.produce(pensMissingData.value, (draft) => {
            console.log({
                draft: draft[key],
                missingDataLength,
            });
            if (hasNoData) {
                draft[key] += missingDataLength;
            } else {
                draft[key] = missingDataLength;
            }

            console.log({
                draft: draft[key],
                missingDataLength,
            });
        });
    } else {
        pensMissingData.value = immer.produce(pensMissingData.value, (draft) => {
            draft[key] = 0;
        });
    }
};


function setSelectedAreaTo({mode, interval, dataZoomId}) {
    //console.log("setSelectedAreaToDataLoadingInterval");
    const intervalToMilliseconds = {
        "1m": 60_000,
        "5m": 300_000,
        "10m": 600_000,
        "15m": 900_000,
        "30m": 1_800_000,

        "1h": 3_600_000,
        "2h": 7_200_000,
        "6h": 21_600_000,
        "12h": 43_200_000,

        "1d": 86_400_000,
    };

    let totalMilliSeconds;
    if (mode === "dataLoadingInterval") {
        totalMilliSeconds = intervalToMilliseconds[dataLoadingInterval.value];
        chartInstance.value.setOption({
            dataZoom: [{id: dataZoomId, start: 100, end: 100}],
        });

        const opt = chartInstance.value.getOption();
        chartInstance.value.setOption({
            dataZoom: [
                {
                    id: dataZoomId,
                    startValue:
                        opt.dataZoom.filter((dz) => dz.id == dataZoomId)[0]?.endValue -
                        totalMilliSeconds,
                },
            ],
        });
    } else if (mode === "chartEndTime") {
        const {startValue, endValue} = interval;
        chartInstance.value.setOption({
            dataZoom: [{id: dataZoomId, startValue, endValue}],
        });
    }
}


/*
* ====================================================================
*                       Helper functions - END
* ====================================================================
*/


/*
* ====================================================================
*                       Services - START
* ====================================================================
*/

const getDataService = async ({pensList, chartStartDate}) => {
    const now = new Date();
    const res = await axiosWrapper.post(
        GetData,
        // The runtime key is only "device.variable" when there is a namespace; dot-less
        // names (free naming, e.g. Local "Test") ARE the key and must not gain a dot.
        pensList.map((p) => (p.device ? `${p.device}.${p.variable}` : p.variable))
    );


    const newData = {};
    res?.data.forEach((item, index) => {

        const resData = item.split("|");
        const penID = pensList[index]?.id;
        const penStatus = resData[4];
        const penValue = parseFloat(resData[1]);
        const date = new Date(new Date(resData[2]).toUTCString());

        //console.log("GetData " + resData[0] + " : " + date.toLocaleString() + " " + penValue);

        if (!pensList.map((p) => p.id).includes(penID)) return;

        if (!chartStartDate.value) {
            chartStartDate.value = date;
        }

        newData[penID] = {
            value: penValue,
            date: now.getTime(),
            status: penStatus,
        };
    });

    return newData;
};

const getHistoricDataForPenService = async ({pen, startDatetime, endDatetime}) => {


    // The pen's device/variable are the namespace split used only for the pen tree; the historian
    // matches on the full canonical name (free-form since v68). Dot-less names ARE the key and must
    // not gain a dot, so only rejoin when the pen actually has a namespace.
    const fullName = pen.device ? `${pen.device}.${pen.variable}` : pen.variable;

    console.log("GetHistoricData REQUEST " + fullName);

    const res = await axiosWrapper.post(GetHistoricData, {
        Variable: fullName,
        StartDatetime: startDatetime,
        EndDatetime: endDatetime,
    });

    const data = __parseHistoricData(res.data);

    console.log("GetHistoricData RESPONSE " + fullName + " : " + res.data.length + " rows");

    // add null values for start and end dates to make sure the chart is drawn correctly even if there is no data returned
    // xAxis which is time based will be drawn from start to end date and user will be able to pan/zoom to load more data
    data.push(
        ...[
            {
                value: null,
                date: new Date(startDatetime).getTime(),
                status: "---",
            },
            {
                value: null,
                date: new Date(endDatetime).getTime(),
                status: "---",
            },
        ]
    );
    return {pen, data};
};

function __parseHistoricData(data) {
    return data.map((e) => {
        let [value, date] = e.split("|");

        value = parseFloat(value);
        date = new Date(new Date(date).toUTCString()).getTime();

        return {
            value,
            date,
            status: "---",
        };
    });
}

const getHistoricDataService = ({
                                    chartStartDate,
                                    chartEndDate,
                                    pensList,
                                    fetchDataForStartOfTheChart = false,
                                }) => {
    const totalFetchedDataTime =
        Math.abs(chartStartDate.value.getTime() - chartEndDate.value.getTime()) /
        1000;

    let secondsInHistory = Math.round(totalFetchedDataTime * 0.1);
    if (secondsInHistory < 10) {
        secondsInHistory = 10;
    }

    let startDatetime;
    let endDatetime;

    if (fetchDataForStartOfTheChart) {
        startDatetime = chartEndDate.value;
        endDatetime = addSeconds(chartEndDate.value, secondsInHistory);
    } else {
        startDatetime = subSeconds(chartStartDate.value, secondsInHistory);
        endDatetime = chartStartDate.value;
    }

    //console.log({
    //  startDatetime,
    //  endDatetime,
    //  chartStartDate: chartStartDate.value,
    //  chartEndDate: chartEndDate.value,
    //});

    const historicData = pensList.map(async (pen) => {
        const data = getHistoricDataForPenService({
            pen,
            startDatetime: startDatetime.toUTCString(),
            endDatetime: endDatetime.toUTCString(),
        });

        return data;

    });


    if (!fetchDataForStartOfTheChart) {
        chartStartDate.value = startDatetime;

        //console.log({
        //  chartStartDate: chartStartDate.value,
        //  startDatetime,
        //  endDatetime,
        //  secondsInHistory,
        //  totalFetchedDataTime,
        //});
    } else {
        chartEndDate.value = endDatetime;
    }

    return {historicData, startDate: startDatetime, endDate: endDatetime};
};


const getVariableListService = async () => {
    const res = await axiosWrapper.get(GetVariableList);

    return res.data.map((v) => {
        const data = v.split("|");
        // Namespace split on the FIRST dot only, keeping the full remainder (names are
        // free-form: multi-dot names must not lose segments, dot-less names have no
        // namespace). Must mirror the historian's Device/Variable column split.
        const dotIndex = data[0].indexOf(".");
        return {
            device: dotIndex > 0 ? data[0].substring(0, dotIndex) : "",
            variable: dotIndex > 0 ? data[0].substring(dotIndex + 1) : data[0],
            min: data[1],
            max: data[2],
            unit: data[3],
            trendGroups: data[4],
            // description is last and may contain "|", so keep it greedy
            description: data.slice(5).join("|")
        };
    });
};


/*
* ====================================================================
*                       Services - END
* ====================================================================
*/

/*
* ====================================================================
*                       Reactive State - START
* ====================================================================
*/

const appTheme = new ReactiveState({
    backgroundColor: "#ffffff",
    textColor: "#000000",

    buttonBackgroundColor: "#999999",
    buttonTextColor: "#ffffff",
    accordionActiveBackgroundColor: "#cfe2ff",

    chartHeightVH: 100,
});

const chartStartDateXAxis1 = new ReactiveState(null);
const chartEndDateXAxis1 = new ReactiveState(null);

const chartStartTimeXAxis1 = new ReactiveState(null);
const chartEndTimeXAxis1 = new ReactiveState(null);
const chartIntervalTimeXAxis1 = new ReactiveState(null);

const chartStartDateXAxis2 = new ReactiveState(null);
const chartEndDateXAxis2 = new ReactiveState(null);

const chartStartTimeXAxis2 = new ReactiveState(null);
const chartEndTimeXAxis2 = new ReactiveState(null);
const chartIntervalTimeXAxis2 = new ReactiveState(null);

const chartData = new ReactiveState({
    // 1: [],
    // 2: [],
});

const chartGlobalSettings = new ReactiveState({
    gridHorizontalColor: "#cccccc",
    gridVerticalColor: "#cccccc",

    subGridHorizontalColor: "#cccccc",
    subGridVerticalColor: "#cccccc",

    gridBackgroundColor: "#ffffff",
    textColor: "#000000",

    xAxisColor: "#000000",

    tooltipBackgroundColor: "#ffffff",
    tooltipBorderColor: "#ffffff",
    tooltipTextColor: "#000000",

    sliderBackgroundColor: "#ffffff",
    sliderTextColor: "#333333",
    sliderAreaColor: "#d2dbee",
    sliderSelectedAreaColor: "#8fb0f7",
    sliderHandleIcon: "default",
    sliderHandleColor: "#ffffff",
});

const chartPenSettings = new ReactiveState({
    // 1: {
    //   name: "Local.CIP_TemperatureSensor1",
    //   xAxisIndex: 1,
    //   lineColor: "#91cc75",
    //   lineWidth: 1,
    //   style: "line",
    //   unit: "C",
    //   min: 0,
    //   max: 100,
    //   autoRange: false,
    //   rangeMargin: 0,
    // },
    // 2: {
    //   name: "Local.CIP_TemperatureSensor2",
    //   xAxisIndex: 2,
    //   lineColor: "#5470c6",
    //   lineWidth: 1,
    //   style: "line",
    //   unit: "C",
    //   min: 0,
    //   max: 100,
    //   autoRange: false,
    //   rangeMargin: 0,
    // },
});

const chartSummaryData = new ReactiveState({
    1: {
        name: "Local.CIP_TemperatureSensor1",
        unit: "C",
        min: 0,
        max: 100,
        avg: 0,
        value: 0,
        description: "",
        color: "#91cc75",
    },
    2: {
        name: "Local.CIP_TemperatureSensor2",
        unit: "C",
        min: 0,
        max: 100,
        avg: 0,
        value: 0,
        description: "",
        color: "#5470c6",
    },
});

const legendsState = new ReactiveState({
    // 1: true,
    // 2: true,
});

const isLoadingInitialData = new ReactiveState(false);

const isLoadingHistoriclDataXAxis1 = new ReactiveState(false);
const isLoadingHistoriclDataXAxis2 = new ReactiveState(false);

const isLoadingNewlDataXAxis1 = new ReactiveState(false);
const isLoadingNewlDataXAxis2 = new ReactiveState(false);

const chartOptions = new ReactiveState({});
const chartType = new ReactiveState("line");
const isSplitView = new ReactiveState(false);

const chartInstance = new ReactiveState(null);

// example
// {
//   missingDataFromStartInSeconds: 0,
//   missingDataFromEndInSeconds: 20,
// }
const pensMissingDataXAxis1 = new ReactiveState({
    missingDataFromStartInSeconds: 0,
    missingDataFromEndInSeconds: 0,
});
const pensMissingDataXAxis2 = new ReactiveState({
    missingDataFromStartInSeconds: 0,
    missingDataFromEndInSeconds: 0,
});

const chartGetDataFetchingInterval = new ReactiveState(1000);

const dataLoadingInterval = new ReactiveState("1m");


const isStartTimePickerOpenedXAxis1 = new ReactiveState(false);
const isEndTimePickerOpenedXAxis1 = new ReactiveState(false);
const isIntervalTimePickerOpenedXAxis1 = new ReactiveState(false);
const stopFetchingNewDataXAxis1 = new ReactiveState(false);
const createEmptySpaceOnTheRightXAxis1 = new ReactiveState(false);

const isStartTimePickerOpenedXAxis2 = new ReactiveState(false);
const isEndTimePickerOpenedXAxis2 = new ReactiveState(false);
const isIntervalTimePickerOpenedXAxis2 = new ReactiveState(false);
const stopFetchingNewDataXAxis2 = new ReactiveState(false);
const createEmptySpaceOnTheRightXAxis2 = new ReactiveState(false);


const groupBy = new ReactiveState({
    value: "group-none",
    label: "Group None",
});

const groupedDataRemainingTimeLeftXAxis1 = new ReactiveState(0);
const groupedDataRemainingTimeRightXAxis1 = new ReactiveState(0);

const groupedDataRemainingTimeLeftXAxis2 = new ReactiveState(0);
const groupedDataRemainingTimeRightXAxis2 = new ReactiveState(0);

const pensList = new ReactiveState([
    // {
    //   name: "Local.CIP_TemperatureSensor1",
    //   id: 1,
    //   device: "Local",
    //   variable: "CIP_TemperatureSensor1",
    //   min: 0,
    //   max: 100,
    //   unit: "",
    //   color: "#91cc75",
    // },
    // {
    //   name: "Local.CIP_TemperatureSensor2",
    //   id: 2,
    //   device: "Local",
    //   variable: "CIP_TemperatureSensor2",
    //   min: 0,
    //   max: 100,
    //   unit: "",
    //   color: "#5470c6",
    // },
]);

const isSummaryCollapsed = new ReactiveState(false);


const zoomMode = new ReactiveState({
    value: "zoom-x",
    label: "Zoom X-Axis",
});


/*
* ====================================================================
*                       Reactive State - END
* ====================================================================
*/


/*
* ====================================================================
*                       UI - START
* ====================================================================
*/

class DraggableHorizontalLine {

    m_pos = null

    __resize(e) {
        var dy = this.m_pos - e.y;
        this.m_pos = e.y;
        const bodyHeight = parseInt(getComputedStyle(document.body, "").height);
        const chartHeight = parseInt(
            getComputedStyle(document.getElementById("echart_container"), "").height
        );

        const newChartHeight = chartHeight - dy;
        const marginOffset = 88;
        const newSummaryHeight = bodyHeight - newChartHeight - marginOffset;

        document.getElementById("echart_container").style.height =
            newChartHeight + "px";
        document.getElementById("summaryContainer").style.maxHeight =
            newSummaryHeight + "px";
        document.getElementById("summaryCollapse").style.maxHeight =
            newSummaryHeight + "px";

        chartInstance.value.resize({
            animation: {
                duration: 100,
            },
        });
    }

    setupDraggableHorizontalLineFeature() {
        var resize_el = document.getElementById("dragableHorizontalLine");
        resize_el.addEventListener(
            "mousedown",
            (e) => {
                this.m_pos = e.y;
                document.addEventListener("mousemove", this.__resize, false);
            },
            false
        );
        document.addEventListener(
            "mouseup",
            () => {
                document.removeEventListener("mousemove", this.__resize, false);
            },
            false
        );
    }

}

class Chart {
    prevStartValue = [0, 0];
    prevEndValue = [0, 0];

    initialize() {

        let chartGetDataFetchingIntervalId;

        chartInstance.value = echarts.init(document.getElementById("echart_container"));

        chartInstance.value.on("datazoom", this.__handleDataZoom.bind(this));

        window.addEventListener("resize", chartInstance.value.resize);

        chartGetDataFetchingIntervalId = setInterval(
            this.__handleGetData.bind(this),
            chartGetDataFetchingInterval.value
        );

        //console.log({ chartGetDataFetchingInterval });

        chartGetDataFetchingInterval.subscribe((newInterval, oldInterval) => {
            if (newInterval === oldInterval) return;

            //console.log({ newInterval, oldInterval });
            clearInterval(chartGetDataFetchingIntervalId);
            chartGetDataFetchingIntervalId = setInterval(() => this.__handleGetData(), newInterval);
        });

        chartOptions.value = getChartOptions();
        chartInstance.value.setOption(chartOptions.value);

        // loadChartInitialDataForXAxis({
        //   XAxisIndex: 1,
        //   stopFetchingNewData: stopFetchingNewDataXAxis1,
        //   chartStartDate: chartStartDateXAxis1,
        // });
        // loadChartInitialDataForXAxis({
        //   XAxisIndex: 2,
        //   stopFetchingNewData: stopFetchingNewDataXAxis2,
        //   chartStartDate: chartStartDateXAxis2,
        // });


    }


    async __getData({
                        pensList,
                        chartStartDate,
                        chartEndDate,
                        chartEndTime,
                        chartStartTime,
                        chartIntervalTime,

                        isEndTimePickerOpened,
                        isIntervalTimePickerOpened,
                        isStartTimePickerOpened,
                        stopFetchingNewData,
                        dataZoomId,
                        isLoadingNewlData,
                    }) {
        if (
            !isLoadingNewlData.value &&
            !stopFetchingNewData.value &&
            !isLoadingInitialData.value &&
            pensList &&
            pensList.length > 0
        ) {
            isLoadingNewlData.value = true;
            const newData = await getDataService({pensList, chartStartDate});

            //console.log({ newData });

            const newDataKeys = Object.keys(newData);
            if (newDataKeys.length > 0) {
                //console.log({ newDataKeys });
                chartEndDate.value = new Date(newData[newDataKeys[0]].date);
            }
            saveChartNewData({newData, pensList});
            const opt = getChartOptions();

            //console.log({ opt1122: chartInstance.value.getOption() });
            const dataZoom = chartInstance.value
                .getOption()
                .dataZoom.filter((dt) => dt.id === dataZoomId)?.[0];

            if (dataZoom) {
                const {
                    end: prevEnd,
                    endValue: prevEndValue,
                    startValue: prevStartValue,
                } = dataZoom;

                const diff = prevEndValue - prevStartValue;

                chartInstance.value.setOption(opt);

                if (prevEnd == 100) {
                    const opt = {
                        dataZoom: [
                            {
                                id: dataZoomId,
                                startValue:
                                    chartInstance.value
                                        .getOption()
                                        .dataZoom.filter((dt) => dt.id === dataZoomId)[0].endValue +
                                    diff,
                            },
                        ],
                    };
                    chartInstance.value.setOption(opt);
                }
            }

            isLoadingNewlData.value = false;
        }

        if (!isStartTimePickerOpened.value) {
            const date = new Date(
                chartInstance.value
                    .getOption()
                    .dataZoom.filter((dt) => dt.id === dataZoomId)[0]?.startValue
            );

            if (!isNaN(date.getTime())) {
                chartStartTime.value = date;
            }
        }

        if (!isIntervalTimePickerOpened.value) {
            let interval =
                Math.abs(
                    chartInstance.value
                        .getOption()
                        .dataZoom.filter((dt) => dt.id === dataZoomId)[0]?.startValue -
                    chartInstance.value
                        .getOption()
                        .dataZoom.filter((dt) => dt.id === dataZoomId)[0]?.endValue
                ) / 1000;

            const hours = Math.floor(interval / 3600);
            interval -= hours * 3600;
            const minutes = Math.floor(interval / 60);
            interval -= minutes * 60;
            const seconds = Math.floor(interval);

            const date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes);
            date.setSeconds(seconds);

            if (!isNaN(date.getTime())) {
                chartIntervalTime.value = date;
            }
        }

        if (!isEndTimePickerOpened.value) {
            const date = new Date(
                chartInstance.value
                    .getOption()
                    .dataZoom.filter((dt) => dt.id === dataZoomId)[0]?.endValue
            );

            if (!isNaN(date.getTime())) {
                chartEndTime.value = date;
            }
        }
    }


    __handleGetData() {
        // getData({
        //   pensList: pensList.value,
        //   chartStartDate: chartStartDateXAxis1,
        //   chartEndTime: chartEndTimeXAxis1,
        //   chartStartTime: chartStartTimeXAxis1,
        //   chartIntervalTime: chartIntervalTimeXAxis1,
        // }),

        const xAxisIndex1Ids = getXAxisIdsForIndex(1);

        const xAxisIndex2Ids = getXAxisIdsForIndex(2);

        if (xAxisIndex1Ids.length > 0) {

            this.__getData({
                dataZoomId: "horizontalSliderXAxis1",
                pensList: pensList.value.filter((p) =>
                    xAxisIndex1Ids.includes(p.id.toString())
                ),
                chartStartDate: chartStartDateXAxis1,
                chartEndDate: chartEndDateXAxis1,
                chartEndTime: chartEndTimeXAxis1,
                chartStartTime: chartStartTimeXAxis1,
                chartIntervalTime: chartIntervalTimeXAxis1,

                isEndTimePickerOpened: isEndTimePickerOpenedXAxis1,
                isIntervalTimePickerOpened: isIntervalTimePickerOpenedXAxis1,
                isStartTimePickerOpened: isStartTimePickerOpenedXAxis1,
                stopFetchingNewData: stopFetchingNewDataXAxis1,
                isLoadingNewlData: isLoadingNewlDataXAxis1,
            });
        }

        if (xAxisIndex2Ids.length > 0) {
            this.__getData({
                dataZoomId: "horizontalSliderXAxis2",
                pensList: pensList.value.filter((p) =>
                    xAxisIndex2Ids.includes(p.id.toString())
                ),
                chartStartDate: chartStartDateXAxis2,
                chartEndDate: chartEndDateXAxis2,
                chartEndTime: chartEndTimeXAxis2,
                chartStartTime: chartStartTimeXAxis2,
                chartIntervalTime: chartIntervalTimeXAxis2,

                isEndTimePickerOpened: isEndTimePickerOpenedXAxis2,
                isIntervalTimePickerOpened: isIntervalTimePickerOpenedXAxis2,
                isStartTimePickerOpened: isStartTimePickerOpenedXAxis2,
                stopFetchingNewData: stopFetchingNewDataXAxis2,
                isLoadingNewlData: isLoadingNewlDataXAxis2,
            });
        }
    }


    async __handleDataZoom(params) {
        params = params?.batch !== undefined ? params.batch : [params];
        console.log({ params });

        const zoomData = params.map((p) => {
            return {
                startValue: p.start,
                endValue: p.end,
                dataZoomId: p.dataZoomId,
            };
        });

        //console.log({
        //  dataZoomId: JSON.stringify(zoomData.map((d) => d.dataZoomId)),
        //});

        zoomData.forEach(async (zoom) => {
            const {startValue, endValue, dataZoomId} = zoom;
            this.__handleDataZoomForXAxis(dataZoomId, startValue, endValue, params);
        });
    }

    async __handleDataZoomForXAxis(
        dataZoomId,
        startValue,
        endValue,
        params
    ) {
        let variables;
        let pensListForXAxis;
        let xAxisIndex;
        if (
            ["horizontalSliderXAxis1", "horizontalInsideXAxis1"].includes(dataZoomId)
        ) {
            xAxisIndex = 1;

            variables = this.__getVariablesAccordingToXAxisIndex(xAxisIndex);

            const xAxisIndexIds = getXAxisIdsForIndex(xAxisIndex);
            pensListForXAxis = pensList.value.filter((p) =>
                xAxisIndexIds.includes(p.id.toString())
            );
        } else {
            xAxisIndex = 2;

            variables = this.__getVariablesAccordingToXAxisIndex(xAxisIndex);

            const xAxisIndexIds = getXAxisIdsForIndex(xAxisIndex);
            pensListForXAxis = pensList.value.filter((p) =>
                xAxisIndexIds.includes(p.id.toString())
            );
        }

        const isHorizontal = [
            "horizontalSliderXAxis1",
            "horizontalInsideXAxis1",
            "horizontalSliderXAxis2",
            "horizontalInsideXAxis2",
        ].includes(dataZoomId);

        const {
            chartEndDate,
            chartEndTime,
            chartIntervalTime,
            chartStartDate,
            chartStartTime,
            stopFetchingNewData,
            groupedDataRemainingTimeLeft,
            groupedDataRemainingTimeRight,
            createEmptySpaceOnTheRight,
            isLoadingHistoriclData,
        } = variables;

        this.__updateDatePickers({
            chartStartTime,
            chartEndTime,
            chartIntervalTime,
            dataZoomId,
        });

        //console.log({
        //  con1: isHorizontal,
        //  con2: !isLoadingHistoriclData.value,
        //  con3:
        //    chartInstance.value
        //      .getOption()
        //      .dataZoom.filter((dt) => dt.id === dataZoomId)[0].startValue <
        //    chartStartDate.value.getTime(),
        //  con4: startValue < this.prevStartValue[xAxisIndex - 1],
        //  xAxisIndex,
        //  all:
        //    !isLoadingHistoriclData.value &&
        //    isHorizontal &&
        //    chartInstance.value
        //      .getOption()
        //      .dataZoom.filter((dt) => dt.id === dataZoomId)[0].startValue <
        //      chartStartDate.value.getTime() &&
        //    startValue < this.prevStartValue[xAxisIndex - 1],
        //});

        // if user pans to the left most side of the chart, we want to fetch new data
        if (
            !isLoadingHistoriclData.value &&
            isHorizontal &&
            chartInstance.value
                .getOption()
                .dataZoom.filter((dt) => dt.id === dataZoomId)[0].startValue <
            chartStartDate.value.getTime() &&
            startValue < this.prevStartValue[xAxisIndex - 1]
        ) {
            isLoadingHistoriclData.value = true;
            chartInstance.value.showLoading();

            const {
                historicData: historicDataPromises,
                startDate,
                endDate,
            } = getHistoricDataService({
                chartStartDate: chartStartDate,
                chartEndDate: chartEndDate,
                pensList: pensListForXAxis,
            });

            const historicData = await Promise.all(historicDataPromises);
            const dataZoomValue = chartInstance.value
                .getOption()
                .dataZoom.filter((dt) => dt.id === dataZoomId)[0];

            if (groupBy.value.value === "group-none") {
                historicData.forEach(({pen, data}) => {
                    saveChartHistoricDataForPen(pen, data);
                });
            } else {
                const data = {};
                historicData.forEach(({pen, data: d}) => {
                    data[pen.id] = d;
                });

                handleGroupData({
                    xAxisIndex,
                    groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeft,
                    groupedDataRemainingTimeRight: groupedDataRemainingTimeRight,
                    stopFetchingNewData,
                    data: data,
                    mergeData: true,
                    insertDataAtTheStart: false,
                    chartStartDate: startDate,
                    chartEndDate: endDate,
                    direction: "left",
                });
            }

            const opt = getChartOptions({
                createEmptyRightSpace: createEmptySpaceOnTheRight.value,
            });
            chartInstance.value.setOption(opt);

            if (dataZoomValue) {
                const {endValue: end, startValue: start} = dataZoomValue;
                const id = "horizontalSliderXAxis" + xAxisIndex;

                //console.log({
                //  mode: "chartEndTime",
                //  interval: { startValue: new Date(start), endValue: new Date(end) },
                //  dataZoomId: id,
                //});

                setSelectedAreaTo({
                    mode: "chartEndTime",
                    interval: {startValue: start, endValue: end},
                    dataZoomId: id,
                });
            }

            isLoadingHistoriclData.value = false;
            chartInstance.value.hideLoading();
        }

        // if user pans to the right most side of the chart, we want to fetch new data
        else if (
            createEmptySpaceOnTheRight.value &&
            !isLoadingHistoriclData.value &&
            isHorizontal &&
            chartInstance.value
                .getOption()
                .dataZoom.filter((dt) => dt.id === dataZoomId)[0].endValue >
            chartEndDate.value.getTime() &&
            endValue > this.prevEndValue[xAxisIndex - 1]
        ) {
            isLoadingHistoriclData.value = true;
            chartInstance.value.showLoading();
            const {
                historicData: historicDataPromises,
                endDate,
                startDate,
            } = getHistoricDataService({
                chartStartDate: chartStartDate,
                chartEndDate: chartEndDate,
                pensList: pensListForXAxis,
                fetchDataForStartOfTheChart: true,
            });

            const historicData = await Promise.all(historicDataPromises);

            // historicData.forEach(({ pen, data }) => {
            //   saveChartHistoricDataForPen(pen, data, true, stopFetchingNewData.value);
            // });
            const dataZoomValue = chartInstance.value
                .getOption()
                .dataZoom.filter((dt) => dt.id === dataZoomId)[0];

            if (groupBy.value.value === "group-none") {
                historicData.forEach(({pen, data}) => {
                    saveChartHistoricDataForPen(pen, data, true, true);
                });
            } else {
                const data = {};
                historicData.forEach(({pen, data: d}) => {
                    data[pen.id] = d;
                });

                handleGroupData({
                    xAxisIndex,
                    groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeft,
                    groupedDataRemainingTimeRight: groupedDataRemainingTimeRight,
                    stopFetchingNewData,
                    data: data,
                    mergeData: true,
                    insertDataAtTheStart: true,
                    chartStartDate: startDate,
                    chartEndDate: endDate,
                    direction: "right",
                    createEmptySpaceOnTheRight: createEmptySpaceOnTheRight.value,
                });
            }

            const opt = getChartOptions({
                createEmptyRightSpace: createEmptySpaceOnTheRight.value,
            });
            chartInstance.value.setOption(opt);

            if (dataZoomValue) {
                const {endValue: end, startValue: start} = dataZoomValue;
                const id = "horizontalSliderXAxis" + xAxisIndex;

                setSelectedAreaTo({
                    mode: "chartEndTime",
                    interval: {startValue: start, endValue: end},
                    dataZoomId: id,
                });
            }

            isLoadingHistoriclData.value = false;
            chartInstance.value.hideLoading();
        }

        this.prevStartValue[xAxisIndex - 1] = startValue;

        this.prevEndValue[xAxisIndex - 1] = endValue;
    }

    __updateDatePickers({
                            chartStartTime,
                            chartEndTime,
                            chartIntervalTime,
                            dataZoomId,
                        }) {
        chartStartTime.value = new Date(
            chartInstance.value
                .getOption()
                .dataZoom.filter((dt) => dt.id === dataZoomId)[0].startValue
        );

        chartEndTime.value = new Date(
            chartInstance.value
                .getOption()
                .dataZoom.filter((dt) => dt.id === dataZoomId)[0].endValue
        );

        let interval =
            Math.abs(
                chartInstance.value
                    .getOption()
                    .dataZoom.filter((dt) => dt.id === dataZoomId)[0].startValue -
                chartInstance.value
                    .getOption()
                    .dataZoom.filter((dt) => dt.id === dataZoomId)[0].endValue
            ) / 1000;

        const hours = Math.floor(interval / 3600);
        interval -= hours * 3600;
        const minutes = Math.floor(interval / 60);
        interval -= minutes * 60;
        const seconds = Math.floor(interval);

        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(seconds);

        chartIntervalTime.value = date;
    }

    __getVariablesAccordingToXAxisIndex = (xAxisIndex) => {
        if (xAxisIndex === 1) {
            return {
                chartStartDate: chartStartDateXAxis1,
                chartEndDate: chartEndDateXAxis1,
                chartStartTime: chartStartTimeXAxis1,
                chartEndTime: chartEndTimeXAxis1,
                chartIntervalTime: chartIntervalTimeXAxis1,
                stopFetchingNewData: stopFetchingNewDataXAxis1,
                pensMissingData: pensMissingDataXAxis1,
                groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeftXAxis1,
                groupedDataRemainingTimeRight: groupedDataRemainingTimeRightXAxis1,

                createEmptySpaceOnTheRight: createEmptySpaceOnTheRightXAxis1,
                isLoadingHistoriclData: isLoadingHistoriclDataXAxis1,
            };
        } else {
            return {
                chartStartDate: chartStartDateXAxis2,
                chartEndDate: chartEndDateXAxis2,
                chartStartTime: chartStartTimeXAxis2,
                chartEndTime: chartEndTimeXAxis2,
                chartIntervalTime: chartIntervalTimeXAxis2,
                stopFetchingNewData: stopFetchingNewDataXAxis2,
                pensMissingData: pensMissingDataXAxis2,
                groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeftXAxis2,
                groupedDataRemainingTimeRight: groupedDataRemainingTimeRightXAxis2,
                createEmptySpaceOnTheRight: createEmptySpaceOnTheRightXAxis2,
                isLoadingHistoriclData: isLoadingHistoriclDataXAxis2,
            };
        }
    };


}

class Navbar {

    setupToggleChartTypeFeature() {

        document
            .getElementById("chartTypeToggleButton")
            .addEventListener("click", function () {
                chartType.value = chartType.value == "line" ? "bar" : "line";

                setIcon(
                    document.getElementById("chartTypeToggleButton"),
                    chartType.value == "line" ? "chart-line" : "chart-column"
                );
            });

    }

    setupExportChartDataAsCSVFeature() {


        document.getElementById("csvExportButton").addEventListener("click", exportCSV);

        function exportCSV() {
            const {dataZoom, series: seriesData} = chartInstance.value.getOption();

            const horizontalSliderXAxis1 = dataZoom.filter(
                (dt) => dt.id === "horizontalSliderXAxis1"
            )?.[0];
            const horizontalSliderXAxis2 = dataZoom.filter(
                (dt) => dt.id === "horizontalSliderXAxis2"
            )?.[0];

            const {startValue: startValueXAxis1, endValue: endValueXAxis1} =
                horizontalSliderXAxis1
                    ? horizontalSliderXAxis1
                    : {startValue: 0, endValue: 0};
            const {startValue: startValueXAxis2, endValue: endValueXAxis2} =
                horizontalSliderXAxis2
                    ? horizontalSliderXAxis2
                    : {startValue: 0, endValue: 0};

            let csvData = {};
            let maxLength = 0;
            const seriesNamestoIds = {};
            seriesData.forEach((s) => {
                seriesNamestoIds[s.name] = s.id;
                maxLength = Math.max(maxLength, s.data.length);
                const startValue = s.xAxisIndex === 0 ? startValueXAxis1 : startValueXAxis2;
                const endValue = s.xAxisIndex === 0 ? endValueXAxis1 : endValueXAxis2;
                csvData[s.name] = s.data
                    .filter((d) => {
                        const [date, value] = d.value;

                        return value && date >= startValue && date <= endValue;
                    })
                    .map((d) => {
                        const [date, value] = d.value;

                        return {
                            date,
                            value,
                        };
                    });
            });

            const headers = Object.keys(csvData);
            const csv = [];

            for (let i = 0; i < maxLength; i++) {
                let obj = {};
                headers.forEach((h) => {
                    obj[h] = csvData[h]?.[i];
                });
                csv.push(obj);
            }

            console.log({
                dataZoom,
                seriesData,
                ConvertToCSV: ConvertToCSV(csv, headers, seriesNamestoIds),
            });

            download_csv(ConvertToCSV(csv, headers, seriesNamestoIds), "data.csv");
        }

        function ConvertToCSV(data, headers, seriesNamestoIds) {
            console.log({chartPenSettings: chartPenSettings.value});
            const csv = [
                "SEP=, ",
                "DateTime, Name, Value, Unit", // header row first
                ...data.map((row) =>
                    headers
                        .map((h) => {
                            if (!row[h]?.value) {
                                return "------";
                            }
                            return (
                                new Date(row[h]?.date).toISOString().split(",").join(" ") +
                                "," +
                                h +
                                "," +
                                row[h]?.value +
                                "," +
                                chartPenSettings.value[seriesNamestoIds[h]].unit
                            );
                        })
                        .filter((r) => r !== "------")
                        .join("\r\n")
                ),
            ].join("\r\n");

            return csv;
        }

        function download_csv(csv, filename) {
            var csvFile;
            var downloadLink;

            // CSV FILE
            csvFile = new Blob([csv], {type: "text/csv"});

            // Download link
            downloadLink = document.createElement("a");

            // File name
            downloadLink.download = filename;

            // We have to create a link to the file
            downloadLink.href = window.URL.createObjectURL(csvFile);

            // Make sure that the link is not displayed
            downloadLink.style.display = "none";

            // Add the link to your DOM
            document.body.appendChild(downloadLink);

            // Lanzamos
            downloadLink.click();
        }

    }

    setupExportChartAsImageFeature() {


        document
            .getElementById("imageExportButton")
            .addEventListener("click", exportImage);

        function exportImage() {
            var a = document.createElement("a"); //Create <a>
            a.href = chartInstance.value.getDataURL({
                pixelRatio: 2,
                backgroundColor: chartGlobalSettings.value.gridBackgroundColor,
            }); //Image Base64 Goes here

            a.download = "Image.png"; //File name Here
            a.click(); //Downloaded file
        }

    }

    setupGroupByFeature() {

        const items = [
            {value: "group-none", label: "Group None"},
            {value: "group-minute", label: "Group 1m"},
            {value: "group-hour", label: "Group 1H"},
            {value: "group-day", label: "Group 1D"},
            {value: "group-week", label: "Group 1WK"},
        ];

        const groupByDropdownList = document.getElementById("groupByDropdownList");
        const groupByDropdownButton = document.getElementById("groupByDropdownButton");
        groupByDropdownList.innerHTML = "";

        items.forEach((item, index) => {
            var clone = document
                .getElementsByClassName("groupByDropdownListItem")[0]
                .cloneNode(true);

            setTranslatableLabel(clone.getElementsByTagName("button")[0], item.label);
            clone.getElementsByTagName("button")[0].dataset.itemIndex = index;

            clone.style.display = "block";
            groupByDropdownList.appendChild(clone);
        });

        applyTranslations();

        groupByDropdownList.addEventListener("click", onClick);

        function onClick(e) {
            if (e.target.matches("button")) {
                const prevGroupBy = groupBy.value.value;
                groupBy.value = items[+e.target.dataset.itemIndex];
                setTranslatableLabel(groupByDropdownButton, groupBy.value.label);
                applyTranslations();

                console.log({prevGroupBy});

                if (prevGroupBy === "group-none") {
                    handleGroupData({
                        xAxisIndex: 1,
                        stopFetchingNewData: stopFetchingNewDataXAxis1,
                        groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeftXAxis1,
                        groupedDataRemainingTimeRight: groupedDataRemainingTimeRightXAxis1,
                        data: chartData.value,
                        mergeData: false,
                        insertDataAtTheStart: false,
                        chartStartDate: chartStartDateXAxis1.value,
                        chartEndDate: chartEndDateXAxis1.value,
                        createEmptySpaceOnTheRight: createEmptySpaceOnTheRightXAxis1.value,
                    });

                    handleGroupData({
                        xAxisIndex: 2,
                        stopFetchingNewData: stopFetchingNewDataXAxis2,
                        groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeftXAxis2,
                        groupedDataRemainingTimeRight: groupedDataRemainingTimeRightXAxis2,
                        data: chartData.value,
                        mergeData: false,
                        insertDataAtTheStart: false,
                        chartStartDate: chartStartDateXAxis2.value,
                        chartEndDate: chartEndDateXAxis2.value,
                        createEmptySpaceOnTheRight: createEmptySpaceOnTheRightXAxis2.value,
                    });
                } else {
                    loadChartDataForXAxis({
                        XAxisIndex: 1,
                        stopFetchingNewData: stopFetchingNewDataXAxis1,
                        chartStartDate: chartStartDateXAxis1,
                        chartEndDate: chartEndDateXAxis1,
                        mode: createEmptySpaceOnTheRightXAxis1.value
                            ? "loadChartDataUsingStartAndEndDates"
                            : "loadChartInitialData",
                    });

                    loadChartDataForXAxis({
                        XAxisIndex: 2,
                        stopFetchingNewData: stopFetchingNewDataXAxis2,
                        chartStartDate: chartStartDateXAxis2,
                        chartEndDate: chartEndDateXAxis2,
                        useStartAndEndDates: createEmptySpaceOnTheRightXAxis2.value,
                        mode: createEmptySpaceOnTheRightXAxis2.value
                            ? "loadChartDataUsingStartAndEndDates"
                            : "loadChartInitialData",
                    });
                }

                // const groupedData = this.calculateGroupedData({
                //   xAxisIndex: 1,
                //   data: chartData.value,
                //   groupBy: groupBy.value.value,
                //   startDate: chartStartDateXAxis1.value,
                //   endDate: chartEndDateXAxis1.value,
                //   stopFetchingNewData: stopFetchingNewDataXAxis1,
                //   groupedDataRemainingTime: groupedDataRemainingTimeXAxis1,
                // });

                // groupedData.forEach(({ pen, data }) => {
                //   saveChartHistoricDataForPen(pen, data, false);
                // });

                // chartInstance.value.setOption(getChartOptions(), {
                //   replaceMerge: ["series"],
                // });
            }
        }


        const groupByInSeconds = {
            "group-minute": 60,
            "group-hour": 3600,
            "group-day": 86400,
            "group-week": 604800,
        };

        const groupDataBy = (values, keyFinder) => {
            // using reduce to aggregate values
            return values.reduce((a, b) => {
                // depending upon the type of keyFinder
                // if it is function, pass the value to it
                // if it is a property, access the property
                const key = typeof keyFinder === "function" ? keyFinder(b) : b[keyFinder];

                // aggregate values based on the keys
                if (!a[key]) {
                    a[key] = [b];
                } else {
                    a[key] = [...a[key], b];
                }

                return a;
            }, {});
        };

        function getGroupDataByCallback({
                                            numberOfGroups,
                                            interval,
                                            groupIntervals,
                                            intervalName,
                                            startDate,
                                            direction,
                                        }) {
            let groupIndex = 0;
            let obj = {};
            // let getInterval = getEachGroupIntervals(intervalName);

            // for (let i = 0; i < numberOfGroups; i++) {
            //   let groupStartDate;
            //   let groupEndDate;
            //   let groupingCondition;

            //   if (direction === "left") {
            //     groupEndDate = startDate - i * interval;
            //     groupStartDate = groupEndDate - interval;

            //     groupingCondition = (date) =>
            //       date <= groupEndDate && date > groupStartDate;
            //   } else {
            //     groupStartDate = startDate + i * interval;
            //     groupEndDate = groupStartDate + interval;

            //     groupingCondition = (date) =>
            //       date <= groupEndDate && date > groupStartDate;
            //   }

            //   console.log({
            //     groupStartDate: new Date(groupStartDate),
            //     groupEndDate: new Date(groupEndDate),
            //   });

            //   groupIndex = getInterval({
            //     start: new Date(groupStartDate),
            //     end: new Date(groupEndDate),
            //   })[0].getTime();

            //   obj[groupIndex] = ({ date, value }) => {
            //     return value !== null && groupingCondition(date);
            //   };
            // }

            groupIntervals.forEach((group, index) => {
                const groupStartDate = group.getTime();
                const groupEndDate = groupStartDate + interval;

                obj[groupStartDate] = ({date, value}) => {
                    return value !== null && date >= groupStartDate && date < groupEndDate;
                };
            });

            return {
                func: ({date, value}) =>
                    Object.entries(obj).filter(([_, fn]) => fn({date, value}))?.[0]?.[0],
                intervals: Object.keys(obj),
            };
        }


    }

    setupLastIntervalTimeFeature() {


        const items = [
            {value: "1m", label: "Last 1m"},
            {value: "5m", label: "Last 5m"},
            {value: "10m", label: "Last 10m"},
            {value: "15m", label: "Last 15m"},
            {value: "30m", label: "Last 30m"},

            {value: "1h", label: "Last 1H"},
            {value: "2h", label: "Last 2H"},
            {value: "6h", label: "Last 6H"},
            {value: "12h", label: "Last 12H"},

            {value: "1d", label: "Last 1D"},
        ];

        const intervalTimeDropdownList = document.getElementById(
            "intervalTimeDropdownList"
        ); // the UL element
        const intervalTimeDropdownButton = document.getElementById(
            "intervalTimeDropdownButton"
        );

        intervalTimeDropdownList.innerHTML = "";

        items.forEach((item, index) => {
            var clone = document
                .getElementsByClassName("intervalTimeDropdownListItem")[0]
                .cloneNode(true); // the LI element

            setTranslatableLabel(clone.getElementsByTagName("button")[0], item.label);
            clone.getElementsByTagName("button")[0].dataset.itemIndex = index;

            clone.style.display = "block";
            intervalTimeDropdownList.appendChild(clone);
        });

        applyTranslations();

        intervalTimeDropdownList.addEventListener("click", onClick);

        async function onClick(e) {
            if (e.target.matches("button")) {
                const {label, value} = items[+e.target.dataset.itemIndex];

                setTranslatableLabel(intervalTimeDropdownButton, label);
                applyTranslations();
                dataLoadingInterval.value = value;

                intervalTimeDropdownList.classList.remove("show");

                loadChartDataForXAxis({
                    XAxisIndex: 1,
                    stopFetchingNewData: stopFetchingNewDataXAxis1,
                    chartStartDate: chartStartDateXAxis1,
                });
                loadChartDataForXAxis({
                    XAxisIndex: 2,
                    stopFetchingNewData: stopFetchingNewDataXAxis2,
                    chartStartDate: chartStartDateXAxis2,
                });

                await new Promise(r => setTimeout(r, 100)); // a small delay is necessary before introducing the change
                loadSettings();
            }
        }

        isLoadingInitialData.subscribe(() => {
            if (
                isLoadingInitialData.value ||
                isLoadingHistoriclDataXAxis1.value ||
                isLoadingHistoriclDataXAxis2.value
            ) {
                intervalTimeDropdownButton.setAttribute("disabled", true);
            } else if (
                !(
                    isLoadingInitialData.value ||
                    isLoadingHistoriclDataXAxis1.value ||
                    isLoadingHistoriclDataXAxis2.value
                )
            ) {
                intervalTimeDropdownButton.removeAttribute("disabled");
            }
        });

        isLoadingHistoriclDataXAxis1.subscribe(() => {
            if (isLoadingInitialData.value || isLoadingHistoriclDataXAxis1.value) {
                intervalTimeDropdownButton.setAttribute("disabled", true);
            } else if (
                !(isLoadingInitialData.value || isLoadingHistoriclDataXAxis1.value)
            ) {
                intervalTimeDropdownButton.removeAttribute("disabled");
            }
        });

        isLoadingHistoriclDataXAxis2.subscribe(() => {
            if (isLoadingInitialData.value || isLoadingHistoriclDataXAxis2.value) {
                intervalTimeDropdownButton.setAttribute("disabled", true);
            } else if (
                !(isLoadingInitialData.value || isLoadingHistoriclDataXAxis2.value)
            ) {
                intervalTimeDropdownButton.removeAttribute("disabled");
            }
        });

    }

    setupToggleSplitViewFeature() {


        document
            .getElementById("splitViewToggleButton")
            .addEventListener("click", function () {
                isSplitView.value = !isSplitView.value;

                setIcon(
                    document.getElementById("splitViewToggleButton"),
                    isSplitView.value ? "single-view" : "split-view"
                );

                chartInstance.value.setOption(getChartOptions(), {
                    replaceMerge: ["dataZoom", "grid", "xAxis", "yAxis", "series"],
                });

                loadSettings();
            });

    }

    setupTimePickersFeature() {

        const saveButtonXAxis1 = document.getElementById("saveButtonXAxis1");
        const cancelButtonXAxis1 = document.getElementById("cancelButtonXAxis1");
        const resetButtonXAxis1 = document.getElementById("resetButtonXAxis1");
        const panningLockButtonXAxis1 = document.getElementById(
            "panningLockButtonXAxis1"
        );
        const syncButtonXAxis1 = document.getElementById("syncButtonXAxis1");
        const saveCancelButtonsContainerXAxis1 = document.getElementById(
            "saveCancelButtonsContainerXAxis1"
        );

        const saveButtonXAxis2 = document.getElementById("saveButtonXAxis2");
        const cancelButtonXAxis2 = document.getElementById("cancelButtonXAxis2");
        const resetButtonXAxis2 = document.getElementById("resetButtonXAxis2");
        const panningLockButtonXAxis2 = document.getElementById(
            "panningLockButtonXAxis2"
        );
        const syncButtonXAxis2 = document.getElementById("syncButtonXAxis2");
        const saveCancelButtonsContainerXAxis2 = document.getElementById(
            "saveCancelButtonsContainerXAxis2"
        );

        const chartStartTimePickerXAxis1 = getChartStartTimePicker(
            "chartStartTimeXAxis1"
        );
        const chartIntervalTimePickerXAxis1 = getChartIntervalTimePicker(
            "chartIntervalTimeXAxis1"
        );
        const chartEndTimePickerXAxis1 = getChartEndDatePicker("chartEndTimeXAxis1");

        const chartStartTimePickerXAxis2 = getChartStartTimePicker(
            "chartStartTimeXAxis2"
        );
        const chartIntervalTimePickerXAxis2 = getChartIntervalTimePicker(
            "chartIntervalTimeXAxis2"
        );
        const chartEndTimePickerXAxis2 = getChartEndDatePicker("chartEndTimeXAxis2");

        handleTimePickersForXAxis({
            chartEndTime: chartEndTimeXAxis1,
            chartStartTime: chartStartTimeXAxis1,
            chartIntervalTime: chartIntervalTimeXAxis1,
            chartStartDate: chartStartDateXAxis1,
            chartEndDate: chartEndDateXAxis1,
            isEndTimePickerOpened: isEndTimePickerOpenedXAxis1,
            isIntervalTimePickerOpened: isIntervalTimePickerOpenedXAxis1,
            isStartTimePickerOpened: isStartTimePickerOpenedXAxis1,
            stopFetchingNewData: stopFetchingNewDataXAxis1,
            saveButton: saveButtonXAxis1,
            cancelButton: cancelButtonXAxis1,
            resetButton: resetButtonXAxis1,
            saveCancelButtonsContainer: saveCancelButtonsContainerXAxis1,
            chartStartTimePicker: chartStartTimePickerXAxis1,
            chartEndTimePicker: chartEndTimePickerXAxis1,
            chartIntervalTimePicker: chartIntervalTimePickerXAxis1,
            panningLockButtonXAxis: panningLockButtonXAxis1,
            syncButtonXAxis: syncButtonXAxis1,
            pensMissingData: pensMissingDataXAxis1,
            xAxisIndex: 1,
            stopFetchingNewDataOtherXAxis: stopFetchingNewDataXAxis2,
            groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeftXAxis1,
            groupedDataRemainingTimeRight: groupedDataRemainingTimeRightXAxis1,
            createEmptySpaceOnTheRight: createEmptySpaceOnTheRightXAxis1,
            otherXAxisIndex: 2,
            isLoadingHistoriclData: isLoadingHistoriclDataXAxis1,
        });

        handleTimePickersForXAxis({
            chartEndTime: chartEndTimeXAxis2,
            chartStartTime: chartStartTimeXAxis2,
            chartIntervalTime: chartIntervalTimeXAxis2,
            chartStartDate: chartStartDateXAxis2,
            chartEndDate: chartEndDateXAxis2,
            isEndTimePickerOpened: isEndTimePickerOpenedXAxis2,
            isIntervalTimePickerOpened: isIntervalTimePickerOpenedXAxis2,
            isStartTimePickerOpened: isStartTimePickerOpenedXAxis2,
            stopFetchingNewData: stopFetchingNewDataXAxis2,
            saveButton: saveButtonXAxis2,
            cancelButton: cancelButtonXAxis2,
            resetButton: resetButtonXAxis2,
            saveCancelButtonsContainer: saveCancelButtonsContainerXAxis2,
            chartStartTimePicker: chartStartTimePickerXAxis2,
            chartEndTimePicker: chartEndTimePickerXAxis2,
            chartIntervalTimePicker: chartIntervalTimePickerXAxis2,
            panningLockButtonXAxis: panningLockButtonXAxis2,
            syncButtonXAxis: syncButtonXAxis2,
            pensMissingData: pensMissingDataXAxis2,
            xAxisIndex: 2,
            stopFetchingNewDataOtherXAxis: stopFetchingNewDataXAxis1,
            groupedDataRemainingTimeLeft: groupedDataRemainingTimeLeftXAxis2,
            groupedDataRemainingTimeRight: groupedDataRemainingTimeRightXAxis2,
            createEmptySpaceOnTheRight: createEmptySpaceOnTheRightXAxis2,
            otherXAxisIndex: 1,
            isLoadingHistoriclData: isLoadingHistoriclDataXAxis2,
        });

        function handleTimePickersForXAxis({
                                               chartEndTime,
                                               chartStartTime,
                                               chartIntervalTime,
                                               chartStartDate,
                                               chartEndDate,
                                               isEndTimePickerOpened,
                                               isIntervalTimePickerOpened,
                                               isStartTimePickerOpened,
                                               stopFetchingNewData,
                                               saveButton,
                                               cancelButton,
                                               resetButton,
                                               saveCancelButtonsContainer,
                                               chartStartTimePicker,
                                               chartEndTimePicker,
                                               chartIntervalTimePicker,
                                               xAxisIndex,
                                               panningLockButtonXAxis,
                                               syncButtonXAxis,
                                               stopFetchingNewDataOtherXAxis,
                                               groupedDataRemainingTimeLeft,
                                               groupedDataRemainingTimeRight,
                                               createEmptySpaceOnTheRight,
                                               otherXAxisIndex,
                                               isLoadingHistoriclData,
                                           }) {
            let chartStartTimeChanged = false;
            let chartEndTimeChanged = false;
            let chartIntervalTimeChanged = false;

            panningLockButtonXAxis.addEventListener("click", (e) => {
                const isLocked = e.currentTarget.dataset.locked === "true" ? true : false;

                console.log({isLocked});

                const opt = {
                    dataZoom: [
                        {
                            id: "horizontalInsideXAxis" + xAxisIndex,
                            disabled: !isLocked,
                        },
                    ],
                };

                chartInstance.value.setOption(opt);
                e.currentTarget.dataset.locked = !isLocked;
                setIcon(e.currentTarget, !isLocked ? "lock" : "unlock");
            });
            syncButtonXAxis.addEventListener("click", (e) => {
                const otherAxis = xAxisIndex === 1 ? 2 : 1;
                const dataZoomValue = chartInstance.value
                    .getOption()
                    .dataZoom.filter(
                        (dataZoom) => dataZoom.id === "horizontalInsideXAxis" + otherAxis
                    )[0];

                if (!dataZoomValue) return;

                const {startValue, endValue} = dataZoomValue;

                const diff = Math.abs(endValue - startValue);

                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff - hours * 3600000) / 60000);
                const seconds = Math.floor(
                    (diff - hours * 3600000 - minutes * 60000) / 1000
                );

                console.log({startValue, endValue});

                setDataZoomToIntervalTimePicker({hours, minutes, seconds});
            });

            handleTimePickersHideShowEvents();
            handeTimePickersChangeEvents();

            chartEndTime.subscribe((newValue) => {
                if (
                    chartStartTimeChanged ||
                    chartEndTimeChanged ||
                    chartIntervalTimeChanged
                )
                    return;

                chartEndTimePicker.dates.setValue(new tempusDominus.DateTime(newValue));
            });

            chartIntervalTime.subscribe((newValue) => {
                if (
                    chartStartTimeChanged ||
                    chartEndTimeChanged ||
                    chartIntervalTimeChanged
                )
                    return;

                chartIntervalTimePicker.dates.setValue(
                    new tempusDominus.DateTime(newValue)
                );
            });

            chartStartTime.subscribe((newValue) => {
                if (
                    chartStartTimeChanged ||
                    chartEndTimeChanged ||
                    chartIntervalTimeChanged
                )
                    return;

                chartStartTimePicker.dates.setValue(new tempusDominus.DateTime(newValue));
            });

            isLoadingHistoriclData.subscribe((newValue) => {
                if (newValue) {
                    chartStartTimePicker.disable();
                    chartEndTimePicker.disable();
                    chartIntervalTimePicker.disable();
                } else {
                    chartStartTimePicker.enable();
                    chartEndTimePicker.enable();
                    chartIntervalTimePicker.enable();
                }
            });


            chartStartTimePicker.optionsStore.input.addEventListener("focus", () => {
                chartStartTimeChanged = true;
                saveCancelButtonsContainer.style.display = "block";
            });

            chartEndTimePicker.optionsStore.input.addEventListener("focus", () => {
                chartEndTimeChanged = true;
                saveCancelButtonsContainer.style.display = "block";
            });

            chartIntervalTimePicker.optionsStore.input.addEventListener("focus", () => {
                chartIntervalTimeChanged = true;
                saveCancelButtonsContainer.style.display = "block";
            });


            cancelButton.addEventListener("click", () => {
                chartStartTimeChanged = false;
                chartEndTimeChanged = false;
                chartIntervalTimeChanged = false;
                saveCancelButtonsContainer.style.display = "none";
            });

            saveButton.addEventListener("click", async () => {
                //console.log("save button clicked");
                saveCancelButtonsContainer.style.display = "none";

                if (chartEndTimeChanged) {
                    handleEndTimePickerChanged();
                } else if (chartStartTimeChanged) {
                    handleStartTimePickerChanged();
                } else if (chartIntervalTimeChanged) {
                    handleIntervalTimePickerChanged();
                }

                chartStartTimeChanged = false;
                chartEndTimeChanged = false;
                chartIntervalTimeChanged = false;

                await new Promise(r => setTimeout(r, 100)); // a small delay is necessary before introducing the change
                loadSettings();
            });

            resetButton.addEventListener("click", async () => {
                resetButton.style.display = "none";
                saveCancelButtonsContainer.style.display = "none";

                chartStartTimeChanged = false;
                chartEndTimeChanged = false;
                chartIntervalTimeChanged = false;
                stopFetchingNewData.value = false;
                createEmptySpaceOnTheRight.value = false;

                const otherXAxisIndexIds = getXAxisIdsForIndex(otherXAxisIndex);
                if (otherXAxisIndexIds.length === 0) {
                    stopFetchingNewDataOtherXAxis.value = false;
                }

                loadChartDataForXAxis({
                    XAxisIndex: xAxisIndex,
                    stopFetchingNewData: stopFetchingNewData,
                    chartStartDate: chartStartDate,
                });

                await new Promise(r => setTimeout(r, 100)); // a small delay is necessary before introducing the change
                loadSettings();
            });

            function handleEndTimePickerChanged() {
                saveCancelButtonsContainer.style.display = "none";
                const xAxisIndexIds = getXAxisIdsForIndex(xAxisIndex);
                const otherXAxisIndexIds = getXAxisIdsForIndex(otherXAxisIndex);

                const selectedStartTime = chartStartTimePicker.dates.lastPicked;
                const selectedEndTime = new Date(
                    chartEndTimePicker.dates.lastPicked.getTime() + 1000
                );

                stopFetchingNewData.value = true;
                createEmptySpaceOnTheRight.value = true;

                console.log({otherXAxisIndexIds, otherXAxisIndex});
                if (otherXAxisIndexIds.length === 0) {
                    stopFetchingNewDataOtherXAxis.value = true;
                }

                chartInstance.value.showLoading();
                isLoadingHistoriclData.value = true;

                const promises = pensList.value
                    .filter((p) => xAxisIndexIds.includes(p.id.toString()))
                    .map((pen) => {
                        return getHistoricDataForPenService({
                            pen,
                            startDatetime: selectedStartTime,
                            endDatetime: selectedEndTime,
                        });
                    });

                Promise.all(promises)
                    .then((res) => {
                        // res.forEach(({ pen, data }) => {
                        //   saveChartHistoricDataForPen(pen, data, false);
                        // });

                        if (groupBy.value.value === "group-none") {
                            res.forEach(({pen, data}) => {
                                saveChartHistoricDataForPen(pen, data, false);
                            });
                        } else {
                            const data = {};
                            res.forEach(({pen, data: d}) => {
                                data[pen.id] = d;
                            });

                            handleGroupData({
                                xAxisIndex,
                                groupedDataRemainingTimeLeft,
                                groupedDataRemainingTimeRight,
                                stopFetchingNewData,
                                data: data,
                                chartStartDate: selectedStartTime,
                                chartEndDate: selectedEndTime,
                                mergeData: false,
                                insertDataAtTheStart: false,
                                createEmptySpaceOnTheRight: createEmptySpaceOnTheRight.value,
                            });
                        }

                        const opt = getChartOptions({
                            createEmptyRightSpace: true,
                        });

                        chartInstance.value.setOption(opt, {
                            replaceMerge: ["series", "xAxis"],
                        });

                        chartStartDate.value = selectedStartTime;
                        chartInstance.value.hideLoading();
                        isLoadingHistoriclData.value = false;
                        chartEndDate.value = selectedEndTime;
                        resetButton.style.display = "block";
                    })
                    .finally(() => {
                        setSelectedAreaTo({
                            mode: "chartEndTime",
                            dataZoomId: "horizontalSliderXAxis" + xAxisIndex,
                            interval: {
                                startValue: selectedEndTime.getTime(),
                                endValue: selectedStartTime.getTime(),
                            },
                        });
                    });
            }

            function handleStartTimePickerChanged() {
                const selectedStartTime = chartStartTimePicker.dates.lastPicked;
                //   console.log({
                //     selectedStartTime,
                //     chartStartDate: $chartStartDate,
                //     diff: (selectedStartTime.getTime() - $chartStartDate.getTime()) / 60_000,
                //     bool: selectedStartTime.getTime() > $chartStartDate.getTime(),
                //   });

                if (selectedStartTime.getTime() > chartStartDate.value.getTime()) {
                    chartInstance.value.setOption({
                        dataZoom: [
                            {
                                id: "horizontalSliderXAxis" + xAxisIndex,
                                startValue: selectedStartTime.getTime(),
                            },
                        ],
                    });
                } else {
                    chartInstance.value.showLoading();
                    isLoadingHistoriclData.value = true;

                    const xAxisIndexIds = getXAxisIdsForIndex(xAxisIndex);

                    const promises = pensList.value
                        .filter((p) => xAxisIndexIds.includes(p.id.toString()))
                        .map((pen) => {
                            return getHistoricDataForPenService({
                                pen,
                                startDatetime: selectedStartTime,
                                endDatetime: chartStartDate.value,
                            });
                        });

                    Promise.all(promises).then((res) => {
                        // res.forEach(({ pen, data }) => {
                        //   saveChartHistoricDataForPen(pen, data);
                        // });

                        if (groupBy.value.value === "group-none") {
                            res.forEach(({pen, data}) => {
                                saveChartHistoricDataForPen(pen, data);
                            });
                        } else {
                            const data = {};
                            res.forEach(({pen, data: d}) => {
                                data[pen.id] = d;
                            });

                            handleGroupData({
                                xAxisIndex,
                                groupedDataRemainingTimeLeft,
                                groupedDataRemainingTimeRight,
                                stopFetchingNewData,
                                data: data,
                                chartStartDate: selectedStartTime,
                                chartEndDate: chartStartDate.value,
                                mergeData: true,
                                insertDataAtTheStart: true,
                            });
                        }

                        const opt = getChartOptions();
                        opt.dataZoom[1].startValue = selectedStartTime.getTime();

                        chartInstance.value.setOption(opt, {
                            replaceMerge: ["series", "xAxis"],
                        });

                        chartStartDate.value = selectedStartTime;
                        chartInstance.value.hideLoading();
                        isLoadingHistoriclData.value = false;
                    });
                }
            }

            function handleIntervalTimePickerChanged() {
                const selectedInterval = chartIntervalTimePicker.dates.lastPicked;

                const hours = selectedInterval.getHours();
                const minutes = selectedInterval.getMinutes();
                const seconds = selectedInterval.getSeconds();

                setDataZoomToIntervalTimePicker({hours, minutes, seconds});
            }

            function setDataZoomToIntervalTimePicker({hours, minutes, seconds}) {
                const totalSeconds = seconds + 60 * minutes + 3600 * hours;
                const opt = chartInstance.value.getOption();

                const endTime =
                    opt.dataZoom.filter(
                        (dz) => dz.id === "horizontalSliderXAxis" + xAxisIndex
                    )[0].endValue / 1000;

                const startTime = chartStartDate.value.getTime() / 1000;

                const loadedDatainterval = endTime - startTime;
                console.log({chartStartDate: chartStartDate.value, loadedDatainterval});

                if (totalSeconds <= loadedDatainterval) {
                    chartInstance.value.setOption({
                        dataZoom: [
                            {
                                id: "horizontalSliderXAxis" + xAxisIndex,
                                startValue:
                                    opt.dataZoom.filter(
                                        (dz) => dz.id === "horizontalSliderXAxis" + xAxisIndex
                                    )[0].endValue -
                                    totalSeconds * 1000,
                            },
                        ],
                    });
                } else {
                    isLoadingHistoriclData.value = true;
                    chartInstance.value.showLoading();
                    const secondsToLoad = totalSeconds - loadedDatainterval;
                    const xAxisIndexIds = getXAxisIdsForIndex(xAxisIndex);

                    const startDatetime = subSeconds(chartStartDate.value, secondsToLoad);
                    const endDatetime = chartStartDate.value;

                    const promises = pensList.value
                        .filter((p) => xAxisIndexIds.includes(p.id.toString()))
                        .map((pen) => {
                            return getHistoricDataForPenService({
                                pen,
                                startDatetime,
                                endDatetime,
                            });
                        });

                    Promise.all(promises)
                        .then((res) => {
                            // res.forEach(({ pen, data }) => {
                            //   saveChartHistoricDataForPen(pen, data);
                            // });

                            if (groupBy.value.value === "group-none") {
                                res.forEach(({pen, data}) => {
                                    saveChartHistoricDataForPen(pen, data);
                                });
                            } else {
                                const data = {};
                                res.forEach(({pen, data: d}) => {
                                    data[pen.id] = d;
                                });

                                handleGroupData({
                                    xAxisIndex,
                                    groupedDataRemainingTimeLeft,
                                    groupedDataRemainingTimeRight,
                                    stopFetchingNewData,
                                    data: data,
                                    chartStartDate: startDatetime,
                                    chartEndDate: endDatetime,
                                    mergeData: true,
                                    insertDataAtTheStart: true,
                                });
                            }

                            const opt = getChartOptions();
                            chartInstance.value.setOption(opt, {
                                replaceMerge: ["series", "xAxis"],
                            });
                        })

                        .finally(() => {
                            chartStartDate.value = startDatetime;
                            chartInstance.value.setOption({
                                dataZoom: [
                                    {
                                        id: "horizontalSliderXAxis" + xAxisIndex,
                                        startValue: startDatetime.getTime(),
                                        endValue: opt.dataZoom.filter(
                                            (dz) => dz.id === "horizontalSliderXAxis" + xAxisIndex
                                        )[0].endValue,
                                    },
                                ],
                            });
                            isLoadingHistoriclData.value = false;
                            chartInstance.value.hideLoading();
                        });
                }
            }

            function handleTimePickersHideShowEvents() {
                chartEndTimePicker.subscribe(tempusDominus.Namespace.events.show, (e) => {
                    isEndTimePickerOpened.value = true;

                    chartEndTimeChanged = true;
                    saveCancelButtonsContainer.style.display = "block";
                });

                chartEndTimePicker.subscribe(tempusDominus.Namespace.events.hide, (e) => {
                    isEndTimePickerOpened.value = false;
                });

                chartIntervalTimePicker.subscribe(
                    tempusDominus.Namespace.events.show,
                    (e) => {
                        isIntervalTimePickerOpened.value = true;

                        chartIntervalTimeChanged = true;
                        saveCancelButtonsContainer.style.display = "block";
                    }
                );

                chartIntervalTimePicker.subscribe(
                    tempusDominus.Namespace.events.hide,
                    (e) => {
                        isIntervalTimePickerOpened.value = false;
                    }
                );

                chartStartTimePicker.subscribe(tempusDominus.Namespace.events.show, (e) => {
                    isStartTimePickerOpened.value = true;

                    chartStartTimeChanged = true;
                    saveCancelButtonsContainer.style.display = "block";

                });

                chartStartTimePicker.subscribe(tempusDominus.Namespace.events.hide, (e) => {
                    isStartTimePickerOpened.value = false;
                });
            }

            function handeTimePickersChangeEvents() {

                chartEndTimePicker.subscribe(
                    tempusDominus.Namespace.events.change,
                    (e) => {
                        if (isEndTimePickerOpened.value) {
                            console.log('triggeredEnd');
                            chartEndTimeChanged = true;
                            chartEndTime.value = e.date;
                            saveCancelButtonsContainer.style.display = "block";
                        }
                    }
                );

                chartStartTimePicker.subscribe(
                    tempusDominus.Namespace.events.change,
                    (e) => {
                        if (isStartTimePickerOpened.value) {
                            console.log('triggeredStart');
                            chartStartTimeChanged = true;
                            chartStartTime.value = e.date;
                            saveCancelButtonsContainer.style.display = "block";
                        }
                    }
                );

                chartIntervalTimePicker.subscribe(
                    tempusDominus.Namespace.events.change,
                    (e) => {
                        if (isIntervalTimePickerOpened.value) {
                            chartIntervalTimeChanged = true;
                            saveCancelButtonsContainer.style.display = "block";
                        }
                    }
                );
            }
        }

        function getChartStartTimePicker(chartStartTimePickerId) {
            return new tempusDominus.TempusDominus(
                document.getElementById(chartStartTimePickerId),
                {
                    display: {
                        icons: TA_PICKER_ICONS,
                        toolbarPlacement: "bottom",
                        buttons: {
                            today: false,
                            clear: false,
                            close: true,
                        },
                        components: {
                            calendar: true,
                            date: true,
                            month: true,
                            year: true,
                            decades: true,
                            clock: true,
                            hours: true,
                            minutes: true,
                            seconds: true,
                            //deprecated use localization.hourCycle = 'h24' instead
                            useTwentyfourHour: undefined,
                        },
                        inline: false,
                        theme: "auto",
                    },
                    localization: {
                        format: "yyyy-MM-dd HH:mm:ss",
                        hourCycle: "h23", // why not h24?
                    },
                }
            );
        }

        function getChartIntervalTimePicker(chartIntervalTimePickerId) {
            return new tempusDominus.TempusDominus(
                document.getElementById(chartIntervalTimePickerId),
                {
                    display: {
                        icons: TA_PICKER_ICONS,
                        sideBySide: false,
                        calendarWeeks: false,
                        viewMode: "calendar",
                        toolbarPlacement: "bottom",
                        keepOpen: false,
                        buttons: {
                            today: true,
                            clear: true,
                            close: true,
                        },
                        components: {
                            calendar: false,
                            date: false,
                            clock: true,
                            hours: true,
                            minutes: true,
                            seconds: true,
                            //deprecated use localization.hourCycle = 'h24' instead
                            useTwentyfourHour: undefined,
                        },
                        inline: false,
                        theme: "auto",
                    },
                    localization: {
                        format: "HH:mm:ss",
                        hourCycle: "h23", // why not h24?
                    },
                }
            );
        }

        function getChartEndDatePicker(chartEndDatePickerId) {
            return new tempusDominus.TempusDominus(
                document.getElementById(chartEndDatePickerId),
                {
                    display: {
                        icons: TA_PICKER_ICONS,
                        toolbarPlacement: "bottom",
                        buttons: {
                            today: false,
                            clear: false,
                            close: true,
                        },
                        components: {
                            calendar: true,
                            date: true,
                            month: true,
                            year: true,
                            decades: true,
                            clock: true,
                            hours: true,
                            minutes: true,
                            seconds: true,
                            //deprecated use localization.hourCycle = 'h24' instead
                            useTwentyfourHour: undefined,
                        },
                        inline: false,
                        theme: "auto",
                    },
                    localization: {
                        format: "yyyy-MM-dd HH:mm:ss",
                        hourCycle: "h23", // why not h24?
                    },
                }
            );
        }


    }

    setupZoomMoodFeature() {


        const items = [
            {value: "zoom-x", label: "X-Axis (Default)"},
            {value: "zoom-y", label: "Y-Axis"},
            {value: "zoom-x-y", label: "X-Y-Axis"},
            {value: "zoom-disabled", label: "Disabled"},
        ];

        const zoomModeDropdownList = document.getElementById("zoomModeDropdownList");
        zoomModeDropdownList.innerHTML = "";

        items.forEach((item, index) => {
            var clone = document
                .getElementsByClassName("zoomModeDropdownListItem")[0]
                .cloneNode(true);

            //console.log(clone);

            setTranslatableLabel(clone.getElementsByTagName("button")[0], item.label);
            clone.getElementsByTagName("button")[0].dataset.itemIndex = index;

            clone.style.display = "block";
            zoomModeDropdownList.appendChild(clone);
        });

        applyTranslations();

        zoomModeDropdownList.addEventListener("click", onClick);

        function onClick(e) {
            if (e.target.matches("button")) {
                zoomMode.value = items[+e.target.dataset.itemIndex];

                // hack to update the chart dataZoom correctly
                // dont remove this
                chartInstance.value.setOption(changeZoomMood({}, "zoom-y"), {
                    replaceMerge: ["dataZoom"],
                });

                const opt = changeZoomMood({}, zoomMode.value.value);
                chartInstance.value.setOption(opt, {replaceMerge: ["dataZoom"]});

                // update the sliders correctly
                chartInstance.value.setOption(getChartOptions(), {
                    replaceMerge: ["grid", "dataZoom"],
                });
            }
        }

        function changeZoomMood(opt, zoomMode) {
            const hasXAxis1 = Object.values(chartPenSettings.value).some(
                (s) => s.xAxisIndex == 1
            );
            const hasXAxis2 = Object.values(chartPenSettings.value).some(
                (s) => s.xAxisIndex == 2
            );

            if (zoomMode === "zoom-x") {
                opt.dataZoom = [
                    {
                        id: "verticalSlider",
                        show: false,
                    },
                    {
                        id: "verticalSliderForGrid2",
                        show: false,
                    },
                    {
                        id: "horizontalSliderXAxis1",
                        show: hasXAxis1,
                    },
                    {
                        id: "horizontalInsideXAxis1",
                        disabled: !hasXAxis1,
                    },
                    {
                        id: "verticalInside",
                        disabled: true,
                    },
                    {
                        id: "horizontalSliderXAxis2",
                        show: hasXAxis2,
                    },
                    {
                        id: "horizontalInsideXAxis2",
                        disabled: !hasXAxis2,
                    },
                ];
            } else if (zoomMode === "zoom-y") {
                opt.dataZoom = [
                    {
                        id: "verticalSlider",
                        show: true,
                    },
                    {
                        id: "verticalSliderForGrid2",
                        show: true,
                    },
                    {
                        id: "horizontalSliderXAxis1",
                        show: false,
                    },
                    {
                        id: "horizontalInsideXAxis1",
                        show: false,
                    },
                    {
                        id: "verticalInside",
                        disabled: false,
                    },
                    {
                        id: "horizontalSliderXAxis2",
                        show: false,
                    },
                    {
                        id: "horizontalInsideXAxis2",
                        show: false,
                    },
                ];
            }
            else if (zoomMode === "zoom-x-y") {
                opt.dataZoom = [
                    {
                        id: "verticalSlider",
                        show: true,
                    },
                    {
                        id: "verticalSliderForGrid2",
                        show: true,
                    },
                    {
                        id: "horizontalSliderXAxis1",
                        show: hasXAxis1,
                    },
                    {
                        id: "horizontalInsideXAxis1",
                        disabled: !hasXAxis1,
                    },
                    {
                        id: "verticalInside",
                        disabled: false,
                    },
                    {
                        id: "horizontalSliderXAxis2",
                        show: hasXAxis2,
                    },
                    {
                        id: "horizontalInsideXAxis2",
                        disabled: !hasXAxis2,
                    },
                ];
            }
            else if (zoomMode === "zoom-disabled") {
                opt.dataZoom = [
                    {
                        id: "verticalSlider",
                        show: false,
                    },
                    {
                        id: "verticalSliderForGrid2",
                        show: false,
                    },
                    {
                        id: "horizontalSliderXAxis1",
                        show: false,
                    },
                    {
                        id: "horizontalInsideXAxis1",
                        disabled: true,
                    },
                    {
                        id: "verticalInside",
                        disabled: true,
                    },
                    {
                        id: "horizontalSliderXAxis2",
                        show: false,
                    },
                    {
                        id: "horizontalInsideXAxis2",
                        disabled: true,
                    },
                ];
            }

            return opt;
        }

    }
}

class Settings {

    constructor() {
        // When page is loaded, and globalconfig has a config, load this config.
        if (globalconfig && globalconfig !== "" && globalconfig !== "@Model.Config") {
            globalconfig = globalconfig.replace(/&quot;/g, '"'); // clean json
            const result = JSON.parse(globalconfig);
            this.__handleSaveConfig(result);
        }

        document
            .getElementById("settingsButton")
            .addEventListener("click", onOpenSettings);

        function onOpenSettings() {
            var addNewPensModal = new bootstrap.Modal(
                document.getElementById("settingsModal")
            );
            addNewPensModal.show();

            // TODO: for later...

            // document
            //   .querySelectorAll(".modal-backdrop")
            //   .forEach((modalBackdropElement) => {
            //     modalBackdropElement.style.setProperty(
            //       `--bs-backdrop-bg`,
            //       convertHex($appTheme.textColor, 0.5)
            //     );

            //     modalBackdropElement.style.setProperty(`--bs-backdrop-opacity`, 1);
            //   });
        }


    }

    async setupAddNewPensFeature() {

        let count = 4;
        var uniqueidcounter = 0;

        function generateUniqueID() {
            var m = new Date();
            var dateString =
                m.getUTCFullYear().toString() +
                m.getUTCMonth().toString() +
                m.getUTCDate().toString() +
                m.getUTCHours().toString() +
                m.getUTCMinutes().toString() +
                m.getUTCSeconds().toString() +
                m.getUTCMilliseconds().toString() +
                uniqueidcounter.toString();

            uniqueidcounter = uniqueidcounter + 1;

            return dateString;
        }

        const colors = [
            "#5470c6",
            "#ea7ccc",
            "#ee6666",
            "#91cc75",
            "#73c0de",
            "#3ba272",
            "#fc8452",
            "#fac858",
            "#9a60b4",
        ];

        const newPensList = (await getVariableListService()).map((pen) => {
            // Dot-less names have no namespace: the variable IS the full runtime key.
            pen.name = pen.device ? `${pen.device}.${pen.variable}` : pen.variable;
            pen.state = false;
            return pen;
        });

        // Each variable renders as one list row instead of six grid cells: name and
        // description stacked, range and unit as trailing metadata. Min/Max/Unit stay
        // as columns - hidden, but still searchable and sortable - so the search box
        // and the sort control below keep working on them.
        const escapeHtml = (value) =>
            String(value ?? "").replace(
                /[&<>"']/g,
                (c) =>
                    ({
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#39;",
                    }[c])
            );

        // Every value the old grid showed still shows here: Description under the name,
        // Min/Max/Unit as labelled metadata. The label sits in its own data-i18n span so
        // the translation sweep rewrites only the label and leaves the value alone.
        const metaItem = (label, value) =>
            `<span class="ta-meta"><span class="ta-meta-label" data-i18n>${label}</span>${escapeHtml(
                value
            )}</span>`;

        const penRowFormatter = (value, row) => {
            const description = String(row.description ?? "").trim();
            const min = String(row.min ?? "").trim();
            const max = String(row.max ?? "").trim();
            const unit = String(row.unit ?? "").trim();

            const meta = [];
            if (min !== "") meta.push(metaItem("Min", min));
            if (max !== "") meta.push(metaItem("Max", max));
            if (unit !== "") meta.push(metaItem("Unit", unit));

            return `<div class="ta-pen-row">
                <span class="ta-pen-row-main">
                    <span class="ta-pen-row-name">${escapeHtml(row.name)}</span>
                    ${
                        description
                            ? `<span class="ta-pen-row-desc">${escapeHtml(description)}</span>`
                            : ""
                    }
                </span>
                ${meta.length ? `<span class="ta-pen-row-meta">${meta.join("")}</span>` : ""}
            </div>`;
        };

        const table = $("#addNewPensTable");
        table.bootstrapTable({
            pagination: true,
            search: true,
            toggle: "table",
            clickToSelect: true,
            maintainMetaData: true,
            // Default is "table table-bordered table-hover". table-bordered draws a
            // vertical rule on every header cell and an outer border on thead/tbody,
            // which doubles against the container border at the corners. The row and
            // header rules in trendanalyst-modern.css supply the only lines needed.
            classes: "table table-hover",
            columns: [
                {
                    field: "state",
                    title: "",
                    checkbox: true,
                    // events: onSelect,
                    // formatter: inputFormatter,
                },
                {
                    field: "name",
                    title: "Name",
                    sortable: true,
                    formatter: penRowFormatter,
                },
                {
                    field: "description",
                    title: "Description",
                    sortable: false,
                    visible: false,
                },
                {
                    field: "min",
                    title: "Min",
                    sortable: true,
                    visible: false,
                },
                {
                    field: "max",
                    title: "Max",
                    sortable: true,
                    visible: false,
                },
                {
                    field: "unit",
                    title: "Unit",
                    sortable: true,
                    visible: false,
                },
            ],
            data: newPensList,
        });

        // The row labels are emitted by the formatter, so they are new DOM after every
        // sort, search or page change and miss the translator's initial sweep.
        table.on("post-body.bs.table", () => applyTranslations());

        // Move the filter/sort toolbar into the table toolbar, to the left of the search
        // box. The layout itself lives in trendanalyst-modern.css (.ta-pens-toolbar-bar).
        const trendGroupToolbar = document.getElementById("addNewPensToolbar");
        const $toolbarBar = table.closest(".bootstrap-table").find(".fixed-table-toolbar").first();
        if (trendGroupToolbar && $toolbarBar.length) {
            $toolbarBar.addClass("ta-pens-toolbar-bar");
            const $searchBox = $toolbarBar.find(".search").first();
            if ($searchBox.length) {
                $searchBox.before(trendGroupToolbar);
            } else {
                $toolbarBar.append(trendGroupToolbar);
            }
        }

        // Build the distinct TrendGroup list (a variable may belong to several, comma-separated)
        // and render it as filter chips, so the available groups are readable at a glance
        // instead of hidden behind a dropdown.
        const trendGroupSet = new Set();
        newPensList.forEach((pen) => {
            (pen.trendGroups || "").split(",").forEach((g) => {
                const t = g.trim();
                if (t) trendGroupSet.add(t);
            });
        });

        const applyTrendGroupFilter = (selected) => {
            if (selected === "") {
                table.bootstrapTable("filterBy", {}, { filterAlgorithm: "and" });
            } else {
                table.bootstrapTable(
                    "filterBy",
                    { trendGroups: selected },
                    {
                        filterAlgorithm: (row, filters) =>
                            (row.trendGroups || "")
                                .split(",")
                                .map((s) => s.trim())
                                .includes(filters.trendGroups),
                    }
                );
            }
        };

        const trendGroupChips = document.getElementById("addNewPensTrendGroupChips");
        if (trendGroupChips) {
            // "All" carries a translatable label; the group names are data and stay verbatim.
            const allChip = document.createElement("button");
            allChip.type = "button";
            allChip.className = "ta-chip ta-chip-active";
            allChip.dataset.group = "";
            setTranslatableLabel(allChip, "All");
            trendGroupChips.appendChild(allChip);

            Array.from(trendGroupSet)
                .sort()
                .forEach((group) => {
                    const chip = document.createElement("button");
                    chip.type = "button";
                    chip.className = "ta-chip";
                    chip.dataset.group = group;
                    chip.innerText = group;
                    trendGroupChips.appendChild(chip);
                });

            trendGroupChips.addEventListener("click", (e) => {
                const chip = e.target.closest(".ta-chip");
                if (!chip) return;

                trendGroupChips
                    .querySelectorAll(".ta-chip")
                    .forEach((c) => c.classList.toggle("ta-chip-active", c === chip));

                applyTrendGroupFilter(chip.dataset.group);
            });

            applyTranslations();
        }

        // Sort control. The list header still sorts by name; Min/Max/Unit have no header
        // of their own now, so this drives sortBy for every sortable field.
        const sortField = document.getElementById("addNewPensSortField");
        const sortDir = document.getElementById("addNewPensSortDir");
        if (sortField && sortDir) {
            const applySort = () => {
                table.bootstrapTable("sortBy", {
                    field: sortField.value,
                    sortOrder: sortDir.dataset.order,
                });
            };

            sortField.addEventListener("change", applySort);
            sortDir.addEventListener("click", () => {
                const next = sortDir.dataset.order === "asc" ? "desc" : "asc";
                sortDir.dataset.order = next;
                sortDir.querySelector("use").setAttribute(
                    "href",
                    next === "asc" ? "#ta-icon-arrow-up" : "#ta-icon-arrow-down"
                );
                applySort();
            });
        }

        // Selection tray: keeps the picked pens visible while searching, filtering and
        // paging, and lets them be removed without hunting the row down again.
        const trayChips = document.getElementById("addNewPensTrayChips");
        const trayCount = document.getElementById("addNewPensSelectedCount");
        const saveCount = document.getElementById("addNewPensSaveCount");
        const tray = document.getElementById("addNewPensTray");

        const renderTray = () => {
            const selections = table.bootstrapTable("getSelections");

            if (trayCount) trayCount.innerText = selections.length;
            if (saveCount) saveCount.innerText = selections.length ? selections.length : "";
            if (tray) tray.classList.toggle("ta-tray-empty", selections.length === 0);

            if (!trayChips) return;

            trayChips.innerHTML = selections
                .map(
                    (pen) =>
                        `<button type="button" class="ta-chip ta-chip-removable" data-pen-name="${escapeHtml(
                            pen.name
                        )}">${escapeHtml(pen.name)}<svg class="ta-icon ta-chip-x" aria-hidden="true"><use href="#ta-icon-close"></use></svg></button>`
                )
                .join("");
        };

        if (trayChips) {
            trayChips.addEventListener("click", (e) => {
                const chip = e.target.closest(".ta-chip-removable");
                if (!chip) return;

                table.bootstrapTable("uncheckBy", {
                    field: "name",
                    values: [chip.dataset.penName],
                });
            });
        }

        // check/uncheck fire on row clicks, check-all/uncheck-all on the header box, and
        // check-some/uncheck-some on checkBy/uncheckBy - which is what the tray's own
        // remove chips and the post-save reset go through.
        table.on(
            "check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table " +
                "check-some.bs.table uncheck-some.bs.table",
            renderTray
        );
        renderTray();

        table.on("shown.bs.modal", function () {
            table.bootstrapTable("resetView");
        });

        document
            .getElementById("AddNewPensModalCloseButton")
            .addEventListener("click", save);

        function save() {
            const newPens = table.bootstrapTable("getSelections").map((pen) => {
                console.log({newPen: pen});
                return {...pen, id: generateUniqueID()};
            });

            newPens.forEach((p, index) => {
                legendsState.value = immer.produce(legendsState.value, (ls) => {
                    ls[p.id] = true;
                });

                chartPenSettings.value = immer.produce(
                    chartPenSettings.value,
                    (oldValue) => {
                        oldValue[p.id] = {
                            name: p.name,
                            xAxisIndex: 1,
                            autoRange: p.min == "0" && p.max == "0",
                            rangeMargin: 0,
                            lineWidth: 1,
                            style: "line",
                            unit: p.unit,
                            description:p.description,
                            min: parseFloat(p.min),
                            max: parseFloat(p.max),
                        };
                        oldValue[p.id].lineColor =
                            colors[
                            (((count + index) % colors.length) + colors.length) % colors.length
                                ]; //   (i % n + n) % n
                    }
                );

                count++;
            });

            const pensPrevLength = pensList.value.length;
            pensList.value = [...pensList.value, ...newPens];


            if (pensPrevLength === 0) {
                loadChartDataForXAxis({
                    XAxisIndex: 1,
                    stopFetchingNewData: stopFetchingNewDataXAxis1,
                    chartStartDate: chartStartDateXAxis1,
                });
            } else {
                const now = new Date(Date.now());
                const promises = newPens.map((pen) => {
                    return getHistoricDataForPenService({
                        pen,
                        startDatetime: chartStartDateXAxis1.value,
                        endDatetime: chartEndDateXAxis1.value,
                    });
                });

                Promise.all(promises).then((res) => {
                    // res.forEach(({ pen, data }) => {
                    //   saveChartHistoricDataForPen(pen, data);
                    // });

                    if (groupBy.value.value === "group-none") {
                        res.forEach(({pen, data}) => {
                            saveChartHistoricDataForPen(pen, data, false);
                        });
                    } else {
                        const data = {};
                        const pensIds = [];
                        res.forEach(({pen, data: d}) => {
                            data[pen.id] = d;
                            pensIds.push(pen.id);
                        });

                        handleGroupData({
                            pensIds: pensIds,
                            groupedDataRemainingTime: groupedDataRemainingTimeLeftXAxis1,
                            stopFetchingNewData: stopFetchingNewDataXAxis1,
                            data: data,
                            chartStartDate: chartStartDateXAxis1.value,
                            chartEndDate: chartEndDateXAxis1.value,
                            mergeData: false,
                            insertDataAtTheStart: false,
                            addingNewPens: true,
                        });
                    }

                    chartInstance.value.setOption(getChartOptions(), {
                        replaceMerge: ["series"],
                    });
                });
            }

            table.bootstrapTable("selectPage", 1);
            table.bootstrapTable("resetSearch");
            table.bootstrapTable("uncheckBy", {
                field: "name",
                values: newPens.map((s) => s.name),
            });
        }

    }

    setupGlobalSettingsFeature() {

        const settingsModal = new bootstrap.Modal(
            document.getElementById("settingsModal")
        );

        this.loadGlobalSettings();

        document
            .getElementById("globalSettingsSaveButton")
            .addEventListener("click", saveSettings);

        function saveSettings() {
            const settings = getUpdatedSettings();
            if (settings == null) return;

            handleSaveGlobalSettings(settings);

            $("#settingsModal").modal("hide");

        }


    }

    loadGlobalSettings() {

        const globalSettings = document.getElementById("globalSettings");

        // Update chartGlobalSettings values to inputs
        globalSettings.querySelector("#chartGetDataFetchingInterval").value =
            chartGetDataFetchingInterval.value === undefined
                ? 0
                : chartGetDataFetchingInterval.value / 1000; // convert milliseconds to seconds

        globalSettings.querySelector("#gridHorizontalColor").value =
            chartGlobalSettings.value.gridHorizontalColor;

        globalSettings.querySelector("#gridVerticalColor").value =
            chartGlobalSettings.value.gridVerticalColor;

        //globalSettings.querySelector("#gridVerticalColor").value =
        //    "#ff0000";

        //   globalSettings.querySelector("#subGridHorizontalColor").value =
        //     chartGlobalSettings.value.subGridHorizontalColor;
        //   globalSettings.querySelector("#subGridVerticalColor").value =
        //     chartGlobalSettings.value.subGridVerticalColor;

        globalSettings.querySelector("#gridBackgroundColor").value =
            chartGlobalSettings.value.gridBackgroundColor;
        globalSettings.querySelector("#gridTextColor").value =
            chartGlobalSettings.value.textColor;
        globalSettings.querySelector("#XAxisColor").value =
            chartGlobalSettings.value.xAxisColor;
        globalSettings.querySelector("#tooltipBackgroundColor").value =
            chartGlobalSettings.value.tooltipBackgroundColor;
        globalSettings.querySelector("#tooltipBorderColor").value =
            chartGlobalSettings.value.tooltipBorderColor;
        globalSettings.querySelector("#tooltipTextColor").value =
            chartGlobalSettings.value.tooltipTextColor;
        globalSettings.querySelector("#chartSliderBackgroundColor").value =
            chartGlobalSettings.value.sliderBackgroundColor;
        globalSettings.querySelector("#chartSliderTextColor").value =
            chartGlobalSettings.value.sliderTextColor;
        globalSettings.querySelector("#chartSliderAreaColor").value =
            chartGlobalSettings.value.sliderAreaColor;
        globalSettings.querySelector("#chartSliderSelectedAreaColor").value =
            chartGlobalSettings.value.sliderSelectedAreaColor;
        globalSettings.querySelector("#chartSliderHandleColor").value =
            chartGlobalSettings.value.sliderHandleColor;
        globalSettings.querySelector("#chartSliderHandleIcon").value =
            chartGlobalSettings.value.sliderHandleIcon;
        globalSettings.querySelector("#appBackgroundColor").value =
            chartGlobalSettings.value.appBackgroundColor;
        globalSettings.querySelector("#appTextColor").value =
            chartGlobalSettings.value.appTextColor;
        globalSettings.querySelector("#accordianBackgroundColor").value =
            chartGlobalSettings.value.accordianBackgroundColor;
        globalSettings.querySelector("#buttonBackgroundColor").value =
            chartGlobalSettings.value.buttonBackgroundColor;
        globalSettings.querySelector("#buttonTextColor").value =
            chartGlobalSettings.value.buttonTextColor;

        // Update appTheme values to inputs
        globalSettings.querySelector("#appBackgroundColor").value =
            appTheme.value.backgroundColor;
        globalSettings.querySelector("#appTextColor").value =
            appTheme.value.textColor;
        globalSettings.querySelector("#buttonBackgroundColor").value =
            appTheme.value.buttonBackgroundColor;
        globalSettings.querySelector("#buttonTextColor").value =
            appTheme.value.buttonTextColor;
        globalSettings.querySelector("#accordianBackgroundColor").value =
            appTheme.value.accordionActiveBackgroundColor;

        refreshColorSwatches(globalSettings);

        // The theme was previously only pushed to the DOM when Global settings were
        // saved, so the configured button colours did not show until the user pressed
        // Save. Apply on load too, which also covers the config-driven path above.
        saveAppThemeSettings(appTheme.value);
    }


    setupExportConfigToFileFeature() {
        document
            .getElementById("exportSettingsButton")
            .addEventListener("click", this.__exportConfigToFile);


    }

    __exportConfigToFile() {
        const config = {
            penList: pensList.value,
            appTheme: appTheme.value,
            chartGlobalSettings: chartGlobalSettings.value,
            chartPenSettings: chartPenSettings.value,
            dataLoadingInterval: dataLoadingInterval.value,
            legendsState: legendsState.value,
            chartGetDataFetchingInterval: chartGetDataFetchingInterval.value,
            HideMenu: false,
            HideSummary: false,
            HideSliders: false,
        };

        //console.log({config});

        var blob = new Blob([JSON.stringify(config)], {
            type: "data:text/json;charset=utf-8",
        });
        saveAs(blob, "config.json");
    }


    setupExportConfigToClipboardFeature() {

        document
            .getElementById("exportSettingsButtonClipboard")
            .addEventListener("click", this.__exportConfigToClipBoard);


    }

    //setupImportConfigFromFileFeature() {
    //    document
    //        .getElementById("importSettingsButton")
    //        .addEventListener("change", this.__importConfigFromFile); BUG DOESN't WORK
    //}

    setupImportConfigFromFileFeature() {
        const input = document.getElementById("importSettingsButton");
        input.addEventListener("change", (e) => {
            const label = document.getElementById("importSettingsFileName");
            if (label) {
                label.removeAttribute("data-i18n");
                label.textContent = input.files && input.files.length
                    ? input.files[0].name
                    : label.textContent;
            }
            this.__importConfigFromFile(e);
        });
    }

    __exportConfigToClipBoard() {
        const config = {
            penList: pensList.value,
            appTheme: appTheme.value,
            chartGlobalSettings: chartGlobalSettings.value,
            chartPenSettings: chartPenSettings.value,
            dataLoadingInterval: dataLoadingInterval.value,
            legendsState: legendsState.value,
            chartGetDataFetchingInterval: chartGetDataFetchingInterval.value,
            HideMenu: false,
            HideSummary: false,
            HideSliders: false,
        };

        navigator.clipboard.writeText(JSON.stringify(config));

        alert('Settings copied to clipboard.')
    }

    __importConfigFromFile(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const result = JSON.parse(e.target.result);
            console.log("calling");
            this.__handleSaveConfig(result);
        };

        reader.readAsText(file);
    }

    async __handleSaveConfig(result) {
        //console.log('called');
        
        if (result.penList) {
            chartData.value = {};
            legendsState.value = {};

            pensList.value = result.penList;
        }

        if (result.chartPenSettings) {
            chartPenSettings.value = result.chartPenSettings;
        }
        if (result.appTheme) {
            appTheme.value = deepmerge.all([appTheme.value, result.appTheme], {
                arrayMerge: combineMerge,
            });
        }

        if (result.chartGlobalSettings) {
            chartGlobalSettings.value = deepmerge.all(
                [chartGlobalSettings.value, result.chartGlobalSettings],
                {
                    arrayMerge: combineMerge,
                }
            );
        }

        if (result.legendsState) {
            legendsState.value = result.legendsState;
        }
        if (result.dataLoadingInterval) {
            dataLoadingInterval.value = result.dataLoadingInterval;
        }

        if (result.chartGetDataFetchingInterval !== undefined) {
            chartGetDataFetchingInterval.value =
                result.chartGetDataFetchingInterval === 0
                    ? undefined
                    : result.chartGetDataFetchingInterval;
        }

        if (result.HideMenu) {
            const navbar = document.getElementById("navbarXAxis1");
            navbar.querySelector("#settingsButton").style.display = "none";
            navbar
                .querySelectorAll(".dropdown")
                .forEach((el) => (el.style.display = "none"));
        }
        if (result.HideSummary) {
            document.getElementById("summaryContainer").style.display = "none";
            document.getElementById("echart_container").style.height = "95vh";
            chartInstance.value.resize({
                animation: {
                    duration: 100,
                },
            });
        }

        const settings = {
            appTheme: appTheme.value,
            chartGlobalSettings: chartGlobalSettings.value,
            chartGetDataFetchingInterval: chartGetDataFetchingInterval.value,
        };

        handleSaveGlobalSettings(settings);
        this.loadGlobalSettings();
        //handleXAxisChange(); // moved down

        if (result.HideSliders) {
            const opt = {
                dataZoom: [
                    {
                        id: "verticalSlider",
                        show: false,
                    },
                    {
                        id: "horizontalSliderXAxis1",
                        show: false,
                    },
                    {
                        id: "horizontalSliderXAxis2",
                        show: false,
                    },
                ],
            };

            chartInstance.value.setOption(opt, {replaceMerge: ["dataZoom"]});
        }

        loadChartDataForXAxis({
            XAxisIndex: 1,
            stopFetchingNewData: stopFetchingNewDataXAxis1,
            chartStartDate: chartStartDateXAxis1,
        });
        loadChartDataForXAxis({
            XAxisIndex: 2,
            stopFetchingNewData: stopFetchingNewDataXAxis2,
            chartStartDate: chartStartDateXAxis2,
        });

        await new Promise(r => setTimeout(r, 100)); // a small delay is necessary before introducing the change
        handleXAxisChange();
    }

    setupPenSettingsFeature() {

        let selectedPen = null;
        let selectedRow = null;
        let cachedChartPenSettings = null;

        initSortable();
        const selectedPensTable = document
            .getElementById("selectedPensTable")
            .getElementsByTagName("tbody")[0];

        selectedPensTable.innerHTML = "";
        pensList.value.forEach(addTableRow);

        pensList.subscribe((newValue, oldValue) => {
            //console.log({ newValue, oldValue });
            if (newValue.length > oldValue.length) {
                for (let index = oldValue.length; index < newValue.length; index++) {
                    addTableRow(newValue[index]);
                }
            } else {
                selectedPensTable.innerHTML = "";

                hideDetails();
                newValue.forEach(addTableRow);
            }
        });

        // chartPenSettings.subscribe((newValue) => {
        //   cachedChartPenSettings = JSON.parse(
        //     JSON.stringify({
        //       ...newValue,
        //       ...cachedChartPenSettings,
        //     })
        //   );
        // });

        cachedChartPenSettings = JSON.parse(JSON.stringify(chartPenSettings.value));
        selectedPensTable.addEventListener("click", selectTableRow);

        document
            .getElementById("penDetailsView_saveButton")
            .addEventListener("click", onSave);

        document.getElementById("DeletePenButton").addEventListener("click", onDelete);

        chartPenSettings.subscribe((newState) => {
            //console.log({ newState });
            cachedChartPenSettings = JSON.parse(
                JSON.stringify({
                    ...newState,
                    ...cachedChartPenSettings,
                })
            );

            updateTableRows(newState);
        });

        document
            .getElementById("settingsModal")
            .addEventListener("hidden.bs.modal", (e) => {
                if (e.target === e.currentTarget) {
                    reset();
                }
            });

        document
            .getElementById("AddNewPensButton")
            .addEventListener("click", onAddNewPens);

        function addTableRow(pen) {
            //console.log({ chartPenSettings: chartPenSettings.value, pen });
            const clone = document
                .getElementsByClassName("selectedPensTableRow hidden")[0]
                .cloneNode(true);
            clone.style.display = "table-row";
            clone.classList.remove("hidden");
            clone.dataset.penId = pen.id;

            const color = clone.querySelector(":nth-child(1)");
            const name = clone.querySelector(":nth-child(2)");
            const description = clone.querySelector(":nth-child(3)");
            const min = clone.querySelector(":nth-child(4)");
            const max = clone.querySelector(":nth-child(5)");
            const unit = clone.querySelector(":nth-child(6)");

            console.log({ pen });
            if (chartPenSettings.value[pen.id]) {
                color.style.backgroundColor = resolveThemeColor(chartPenSettings.value[pen.id].lineColor);
            }
            name.innerText = pen.name;
            description.innerText =pen.description
            min.innerText = pen.min;
            max.innerText = pen.max;
            unit.innerText = pen.unit;

            selectedPensTable.appendChild(clone);
        }

        function selectTableRow(e) {
            if (e.target.tagName !== "TR") {
                if (selectedPen == e.target.parentNode.dataset.penId) {
                    toggleRowClass(e.target.parentNode, false);

                    hideDetails();
                    selectedPen = null;
                    selectedRow = null;
                } else {
                    toggleRowClass(e.target.parentNode, true);
                    selectedPen = e.target.parentNode.dataset.penId;

                    if (selectedRow) {
                        toggleRowClass(selectedRow, false);
                    }
                    selectedRow = e.target.parentNode;

                    //   remove old event listners
                    var old_element = document.getElementById("penDetailsView");
                    var new_element = old_element.cloneNode(true);
                    old_element.parentNode.replaceChild(new_element, old_element);

                    updateDetails(selectedPen);
                    showDetails();
                    observeFormChanges(new_element, selectedPen);
                }
            }
        }

        function toggleRowClass(e, force) {
            [...e.querySelectorAll(":not(:first-child)")].forEach((el) => {
                el.classList.toggle("selected-item", force);
            });
        }

        function showDetails() {
            document.getElementById("penDetailsView").style.display = "block";
        }

        function hideDetails() {
            document.getElementById("penDetailsView").style.display = "none";
        }

        function updateDetails(selectedPen) {
            const range = document.getElementById("penDetailsView_range");
            const margin = document.getElementById("penDetailsView_margin");
            const min = document.getElementById("penDetailsView_min");
            const max = document.getElementById("penDetailsView_max");
            const unit = document.getElementById("penDetailsView_unit");
            const description = document.getElementById("penDetailsView_description");
            const lineWidth = document.getElementById("penDetailsView_lineWidth");
            const lineColor = document.getElementById("penDetailsView_lineColor");
            const lineStyle = document.getElementById("penDetailsView_lineStyle");

            range.checked = cachedChartPenSettings[selectedPen].autoRange;
            margin.value = cachedChartPenSettings[selectedPen].rangeMargin;
            min.value = cachedChartPenSettings[selectedPen].min;
            max.value = cachedChartPenSettings[selectedPen].max;
            unit.value = cachedChartPenSettings[selectedPen].unit;
            description.value = cachedChartPenSettings[selectedPen].description;
            lineColor.value = cachedChartPenSettings[selectedPen].lineColor;
            lineWidth.value = cachedChartPenSettings[selectedPen].lineWidth;
            lineStyle.value = cachedChartPenSettings[selectedPen].style;

            refreshColorSwatches(document.getElementById("penDetailsView"));
        }

        function observeFormChanges(form, selectedPen) {
            const autoRangeInput = form.querySelector("#penDetailsView_range");
            autoRangeInput.addEventListener("change", handleAutoRangeChange);

            const lineStyleSelect = form.querySelector("#penDetailsView_lineStyle");
            lineStyleSelect.addEventListener("change", handleChangeLineStyle);

            // Observe inputs for individual values. The colour input is type="hidden"
            // since colorPick drives it, and it gets its change event dispatched by hand.
            const inputElements = form.querySelectorAll(
                'input[type="number"], input[type="text"],input[type="hidden"]'
            );
            inputElements.forEach((input) => {
                input.addEventListener("change", handleChangeInput);
            });

            function handleAutoRangeChange() {
                cachedChartPenSettings[selectedPen].autoRange = autoRangeInput.checked;
            }

            function handleChangeLineStyle(event) {
                const style = event.target.value;
                cachedChartPenSettings[selectedPen].style = style;
            }

            function handleChangeInput(event) {
                const value = event.target.value;

                const id = event.target.id;

                // Handle change based on id (e.g., min, max, unit)
                switch (id) {
                    case "penDetailsView_min":
                        cachedChartPenSettings[selectedPen].min = +value;
                        break;
                    case "penDetailsView_max":
                        cachedChartPenSettings[selectedPen].max = +value;
                        break;
                    case "penDetailsView_unit":
                        cachedChartPenSettings[selectedPen].unit = value;
                        break;
                    case "penDetailsView_description":
                        cachedChartPenSettings[selectedPen].description = value;
                        break;
                    case "penDetailsView_lineColor":
                        cachedChartPenSettings[selectedPen].lineColor = value;
                        break;
                    case "penDetailsView_lineWidth":
                        cachedChartPenSettings[selectedPen].lineWidth = +value;
                        break;
                    case "penDetailsView_margin":
                        cachedChartPenSettings[selectedPen].rangeMargin = +value;
                        break;
                }

                updateTableRows(cachedChartPenSettings);

                if (
                    cachedChartPenSettings[selectedPen].min === 0 &&
                    cachedChartPenSettings[selectedPen].max === 0
                ) {
                    autoRangeInput.checked = true;
                }
            }
        }

        function onSave() {
            chartPenSettings.value = cachedChartPenSettings;

            reset();
        }

        function onDelete() {
            if (selectedPen !== null) {
                hideDetails();
                selectedRow.remove();

                legendsState.value = immer.produce(legendsState.value, (ls) => {
                    delete ls[selectedPen];
                });

                const newPenList = pensList.value.filter((pen) => {
                    return pen.id != selectedPen;
                });

                const xAxisIndex1Ids = getXAxisIdsForIndex(1);

                const xAxisIndex2Ids = getXAxisIdsForIndex(2);

                if (newPenList.filter((p) => xAxisIndex1Ids.includes(p.id)).length === 0) {
                    chartStartDateXAxis1.value = null;

                    chartStartTimeXAxis1.value = null;
                    chartEndTimeXAxis1.value = null;
                    chartIntervalTimeXAxis1.value = null;
                }

                if (newPenList.filter((p) => xAxisIndex2Ids.includes(p.id)).length === 0) {
                    chartStartDateXAxis2.value = null;

                    chartStartTimeXAxis2.value = null;
                    chartEndTimeXAxis2.value = null;
                    chartIntervalTimeXAxis2.value = null;
                }

                if (newPenList.length === 0) {
                    chartData.value = {};
                }

                pensList.value = newPenList;

                chartData.value = immer.produce(chartData.value, (draft) => {
                    delete draft[selectedPen];
                    return draft;
                });
                //console.log({ selectedPen, chartData: chartData.value });

                chartPenSettings.value = immer.produce(chartPenSettings.value, (draft) => {
                    delete draft[selectedPen];
                    return draft;
                });

                //console.log({ cd: chartData.value, cps: chartPenSettings.value });

                chartInstance.value.setOption(getChartOptions(), {
                    replaceMerge: ["yAxis", "xAxis", "series"],
                });

                //temporarily disabled
                // if (newPenList.length !== 0) {
                //   let minStartDate = Number.MAX_SAFE_INTEGER;
                //   Object.values(chartData.value).forEach((penData) => {
                //     if (penData[0].date < minStartDate) {
                //       minStartDate = penData[0].date;
                //     }
                //   });

                //   chartStartDate.value = new Date(minStartDate);
                // }

                delete cachedChartPenSettings[selectedPen];
                selectedPen = null;
                selectedRow = null;
            }
        }

        function reset() {
            cachedChartPenSettings = JSON.parse(JSON.stringify(chartPenSettings.value));
            updateTableRows(chartPenSettings.value);
            hideDetails();

            if (selectedRow) toggleRowClass(selectedRow, false);
            selectedRow = null;
            selectedPen = null;
        }

        function onAddNewPens() {
            var addNewPensModal = new bootstrap.Modal(
                document.getElementById("AddNewPensModal")
            );
            addNewPensModal.show();

            // for later...

            // document
            //   .querySelectorAll(".modal-backdrop")
            //   .forEach((modalBackdropElement) => {
            //     modalBackdropElement.style.setProperty(
            //       `--bs-backdrop-bg`,
            //       convertHex($appTheme.textColor, 0.5)
            //     );

            //     modalBackdropElement.style.setProperty(`--bs-backdrop-opacity`, 1);
            //   });
        }

        function updateTableRows(newState) {
            if (!selectedPensTable) return;

            [...selectedPensTable.children].forEach((el) => {
                const {
                    lineColor: newColor,
                    min: newMin,
                    max: newMax,
                    unit: newUnit,
                    description:newDescription
                } = newState[el.dataset.penId];
                el.children[0].style.backgroundColor = newColor;
                el.children[2].innerHTML = newDescription;

                el.children[3].innerText = newMin;
                el.children[4].innerText = newMax;
                el.children[5].innerText = newUnit;
            });
        }

        function initSortable() {
            Sortable.create(document.querySelector("#selectedPensTable  tbody"), {
                handle: ".drag-hande",
                onEnd: ({oldIndex, newIndex}) => {
                    if (oldIndex !== newIndex) {
                        pensList.value = immer.produce(pensList.value, (draft) => {
                            const item = draft[oldIndex];
                            draft.splice(oldIndex, 1);
                            draft.splice(newIndex, 0, item);
                        });
                    }
                },
            });
        }

    }

}

class Summary {


    setupSummaryFeature() {
        setInterval(() => {
            const summary = this.__calculateSummary();
            if (summary) this.__renderSummary(summary);
        }, 1000);

        document.getElementById("summaryTableBody").addEventListener("change", (e) => {
            const penId = e.target.dataset.penId;
            const checked = e.target.checked;
            legendsState.value = immer.produce(legendsState.value, (draftState) => {
                draftState[penId] = checked;
                this.__toggeLegendState(chartPenSettings.value[penId].name, checked);
            });
        });

        document.getElementById("summaryTableBody").addEventListener("click", (e) => {
            if (e.target.matches("button")) {
                const penId = e.target.dataset.penId;
                let xAxisIndex = +e.target.dataset.xAxisIndex;

                if (xAxisIndex == 1) {
                    const hasXAxis2 = Object.values(chartPenSettings.value).some(
                        (s) => s.xAxisIndex == 2
                    );

                    if (!hasXAxis2) {
                        chartStartDateXAxis2.value = chartStartDateXAxis1.value;
                        chartEndDateXAxis2.value = chartEndDateXAxis1.value;
                    }
                    chartPenSettings.value = immer.produce(chartPenSettings.value, (draftState) => {
                        draftState[penId].xAxisIndex = 2;
                    });

                    setTranslatableLabel(e.target, "X-Axis 2");
                    applyTranslations();
                } else if (xAxisIndex == 2) {
                    const hasXAxis1 = Object.values(chartPenSettings.value).some(
                        (s) => s.xAxisIndex == 1
                    );

                    if (!hasXAxis1) {
                        chartStartDateXAxis1.value = chartStartDateXAxis2.value;
                        chartEndDateXAxis1.value = chartEndDateXAxis2.value;
                    }

                    chartPenSettings.value = immer.produce(chartPenSettings.value, (draftState) => {
                        draftState[penId].xAxisIndex = 1;
                    });

                    setTranslatableLabel(e.target, "X-Axis 1");
                    applyTranslations();
                }
                handleXAxisChange();
            }
        });

        document
            .getElementById("summaryAccordianButton")
            .addEventListener("click", () => {
                isSummaryCollapsed.value = !isSummaryCollapsed.value;

                const chartHeight = parseInt(
                    getComputedStyle(document.getElementById("echart_container"), "").height
                );

                const summartMaxHeight = parseInt(
                    getComputedStyle(document.getElementById("summaryContainer"), "")
                        .maxHeight
                );
                const summaryCollapseButtonHeight = 10;

                document.getElementById("echart_container").style.height =
                    isSummaryCollapsed.value
                        ? chartHeight + summartMaxHeight - summaryCollapseButtonHeight + "px"
                        : chartHeight - summartMaxHeight + summaryCollapseButtonHeight + "px";

                chartInstance.value.resize({
                    animation: {
                        duration: 100,
                    },
                });
            });

    }

    __toggeLegendState(penName, checked) {
        if (checked) {
            chartInstance.value.dispatchAction({
                type: "legendSelect",
                // legend name
                name: penName,
            });
        } else {
            chartInstance.value.dispatchAction({
                type: "legendUnSelect",
                // legend name
                name: penName,
            });
        }
    }

    __calculateSummary() {
        const newSummaryData = {};

        pensList.value.forEach(({name, id}) => {
            const penData = chartPenSettings.value[id];

            const summary = {
                name,
                id,
                unit: penData.unit,
                description: penData.description,
                color: resolveThemeColor(penData.lineColor),
            };

            const dataZoom = chartInstance.value.getOption().dataZoom.filter((dz) => {
                return dz.id == "horizontalInsideXAxis" + penData.xAxisIndex;
            })[0];

            if (!dataZoom) return null;

            const {startValue, endValue} = dataZoom;
            const visibleItems =
                chartData.value?.[id]
                    ?.filter(
                        (data) =>
                            data.value !== null &&
                            data.date >= startValue &&
                            data.date <= endValue
                    )
                    .map((data) => data.value) ?? [];

            const maxValue = Math.max(...visibleItems);
            const minValue = Math.min(...visibleItems);
            const lastValue = visibleItems.at(-1);
            const avg =
                visibleItems.reduce((a, b) => a + b, 0) / visibleItems.length || 0;

            summary.min = isFinite(minValue) ? minValue : 0;
            summary.max = isFinite(maxValue) ? maxValue : 0;
            summary.value = lastValue ?? "-";
            summary.avg = avg.toFixed(2);

            newSummaryData[id] = summary;
        });

        return newSummaryData;
    }

    __renderSummary(summary) {
        const summaryTableBody = document.getElementById("summaryTableBody");

        summaryTableBody.innerHTML = "";

        Object.entries(summary).forEach(([penId, penData]) => {
            const summaryTableRow = document
                .querySelector(".penSummaryTableRow.hidden")
                .cloneNode(true);

            summaryTableRow.classList.remove("hidden");
            summaryTableRow.id = penId;
            summaryTableRow.style.display = "table-row";

            summaryTableRow.querySelector(".penLegendToggle").dataset.penId = penId;
            summaryTableRow.querySelector(".penLegendToggle").checked =
                legendsState.value[penId];
            summaryTableRow.querySelector(
                ".penLegendToggle"
            ).parentNode.parentNode.style.width = "0px";
            summaryTableRow.querySelector(
                ".penLegendToggle"
            ).parentNode.parentNode.style.paddingRight = "0px";

            summaryTableRow.querySelector(".penName").innerText = penData.name;
            summaryTableRow.querySelector(".penDescription").innerText = penData.description;

            summaryTableRow.querySelector(".penUnit").innerText = penData.unit;
            summaryTableRow.querySelector(".penColor").style.backgroundColor =
                penData.color;
            summaryTableRow.querySelector(".penMin").innerText = penData.min;
            summaryTableRow.querySelector(".penMax").innerText = penData.max;
            summaryTableRow.querySelector(".penValue").innerText = penData.value;
            summaryTableRow.querySelector(".penAvg").innerText = penData.avg;
            summaryTableRow.querySelector(".penXAxisIndexToggle").dataset.xAxisIndex =
                chartPenSettings.value[penId].xAxisIndex;
            summaryTableRow.querySelector(".penXAxisIndexToggle").dataset.penId = penId;
            setTranslatableLabel(
                summaryTableRow.querySelector(".penXAxisIndexToggle"),
                "X-Axis " + chartPenSettings.value[penId].xAxisIndex
            );

            summaryTableBody.appendChild(summaryTableRow);
        });

        applyTranslations();
    }

}

/*
* ====================================================================
*                       UI - END
* ====================================================================
*/


/*
* ====================================================================
*                       Main - START
* ====================================================================
*/

const chart = new Chart()
chart.initialize()

const navbar = new Navbar();
navbar.setupExportChartAsImageFeature()
navbar.setupGroupByFeature()
navbar.setupExportChartDataAsCSVFeature()
navbar.setupLastIntervalTimeFeature()
navbar.setupZoomMoodFeature()
navbar.setupTimePickersFeature()
navbar.setupToggleChartTypeFeature()
navbar.setupToggleChartTypeFeature()
navbar.setupToggleSplitViewFeature()


const settings = new Settings();
settings.setupGlobalSettingsFeature()
settings.setupPenSettingsFeature()
settings.setupAddNewPensFeature()
settings.setupImportConfigFromFileFeature()
settings.setupExportConfigToFileFeature()
settings.setupExportConfigToClipboardFeature()


window.addEventListener("message", async (event) => {
    if (event.origin !== window.location.origin) {
        return;
    }

    const message = event.data;
    if (!message) {
        return;
    }

    let config = null;

    if (message.type === "trendanalyst-config") {
        config = message.config ?? message.payload ?? null;
    } else if (message.penList || message.chartPenSettings || message.appTheme) {
        config = message;
    }

    if (!config) {
        return;
    }

    await settings.__handleSaveConfig(config);
});


const summary = new Summary();
summary.setupSummaryFeature()

const draggableHorizontalLine = new DraggableHorizontalLine();
draggableHorizontalLine.setupDraggableHorizontalLineFeature()


/*
* ====================================================================
*                       Main - END
* ====================================================================
*/
