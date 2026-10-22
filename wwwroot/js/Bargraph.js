// Resolves a Color Library name to its hex value; a literal color is returned unchanged.
// Guarded because GetObjectColor lives in Utils.js, which is only loaded on the Envision page.
function BarGraphResolveColor(color) {
	return (typeof GetObjectColor === "function") ? GetObjectColor(color) : color;
}

﻿function createBarGraph(element, data = null)
{
	try
	{
		var ObjDom = getObjDom(element);
		if (!ObjDom)
		{
			console.error("Bar graph container element not found; getObjDom(element) returned null.");
			return;
		}

		
		let animationSpeed = Number(getinitAttribute(ObjDom, "data-animationspeed", "1500"));
		let legendPosition = (getinitAttribute(ObjDom, "data-legendposition", "bottom") || "bottom").toString().toLowerCase().trim();
		let orientation = getinitAttribute(ObjDom, "data-orientation", "vertical");
		let legendFontFamily = getinitAttribute(ObjDom, "data-legendfontfamily", "Arial");
		let legendFontSize = getinitAttribute(ObjDom, "data-legendfontsize", "8px");
		let legendFontWeight = getinitAttribute(ObjDom, "data-legendfontweight", "bold");
		let categoryAxisFontFamily = getinitAttribute(ObjDom, "data-categoryaxisfontfamily", "Arial");
		let categoryAxisFontSize = getinitAttribute(ObjDom, "data-categoryaxisfontsize", "8px");
		let categoryAxisFontWeight = getinitAttribute(ObjDom, "data-categoryaxisfontweight", "bold");
		let valueAxisFontFamily = getinitAttribute(ObjDom, "data-valueaxisfontfamily", "Arial");
		let valueAxisFontSize = getinitAttribute(ObjDom, "data-valueaxisfontsize", "12px");
		let valueAxisFontWeight = getinitAttribute(ObjDom, "data-valueaxisfontweight", "normal");
		let categoryAxisLabelRotation = Number(getinitAttribute(ObjDom, "data-categoryaxislabelrotation", "0")) || 0;
		let valueAxisLabelRotation = Number(getinitAttribute(ObjDom, "data-valueaxislabelrotation", "0")) || 0;
		let valueUnit = getinitAttribute(ObjDom, "data-valueunit", "");
		let showGrid = getinitAttribute(ObjDom, "data-showgrid", "true");
		showGrid = showGrid !== "false" && showGrid !== "0";
		let backgroundColor = BarGraphResolveColor(getinitAttribute(ObjDom, "data-backgroundcolor", "#f5f5f5"));
		let gridColor = BarGraphResolveColor(getinitAttribute(ObjDom, "data-gridcolor", "#e0e0e0"));
		let gridOpacity = getinitAttribute(ObjDom, "data-gridopacity", "0.5");
		let zeroLineColor = BarGraphResolveColor(getinitAttribute(ObjDom, "data-zerolinecolor", "#333"));
		let zeroLineOpacity = getinitAttribute(ObjDom, "data-zerolineopacity", "0.7");
		let axisLineColor = BarGraphResolveColor(getinitAttribute(ObjDom, "data-axislinecolor", "#333"));
		let textColor = BarGraphResolveColor(getinitAttribute(ObjDom, "data-textcolor", "#333"));
		let tooltipBackground = BarGraphResolveColor(getinitAttribute(ObjDom, "data-tooltipbackground", "rgba(0,0,0,0.8)"));
		let tooltipTextColor = BarGraphResolveColor(getinitAttribute(ObjDom, "data-tooltiptextcolor", "#fff"));

		
		if (data == null)
		{
			data = BarGraphContextGetData(ObjDom);
		}
		if (!data || typeof data !== "object" || !data.categories || !data.series)
		{
			console.error("Bar graph data is missing or invalid; expected object with categories and series.");
			return;
		}

		const container = ObjDom;

		if (container._barGraphResizeObserver)
		{
			container._barGraphResizeObserver.disconnect();
			container._barGraphResizeObserver = null;
		}
		if (container._barGraphResizeTimeout)
		{
			clearTimeout(container._barGraphResizeTimeout);
			container._barGraphResizeTimeout = null;
		}
		container.innerHTML = "";

		const legendHeight = 28;
		const legendChartGap = 16;
		const margin = { top: 20, right: 20, bottom: 20, left: 50 };

		// Normalize to { categories, series }. Data must be an object { categories, series }.
		function normalizeChartData(data)
		{
			if (!data || typeof data !== "object" || !data.categories || !data.series)
			{
				return { categories: [], series: [] };
			}
			return { categories: data.categories, series: data.series };
		}

		// Align categories and series to same length: use "Cat 1", "Cat 2", ... for missing labels; pad/trim values so all data renders.
		function alignCategoriesAndValues(categories, series)
		{
			const maxValuesLen = series.length ? Math.max.apply(null, series.map(function (s) { return (s.values || []).length; })) : 0;
			const N = Math.max(1, categories.length || 0, maxValuesLen);
			const effectiveCategories = [];
			for (let i = 0; i < N; i++)
			{
				effectiveCategories.push((categories[i] !== undefined && categories[i] !== null && String(categories[i]).trim() !== "") ? String(categories[i]).trim() : "Cat " + (i + 1));
			}
			const effectiveSeries = series.map(function (s)
			{
				const vals = s.values || [];
				const values = [];
				for (let i = 0; i < N; i++)
				{
					const v = vals[i];
					values.push((v != null && !isNaN(v)) ? Number(v) : 0);
				}
				return { name: s.name || "Series", color: BarGraphResolveColor(s.color || "#999999"), values: values };
			});

			return { categories: effectiveCategories, series: effectiveSeries };
		}

		function renderChart(data)
		{
			try
			{
				const normalized = normalizeChartData(data);
				const { categories, series } = alignCategoriesAndValues(normalized.categories, normalized.series);
				const seriesList = series;
				const hasLegendTop = legendPosition === "top";
				const hasLegendBottom = legendPosition === "bottom";
				const hasLegend = hasLegendTop || hasLegendBottom;
				const legendSpace = hasLegend ? legendHeight : 0;
				const gapSpace = hasLegend ? legendChartGap : 0;

				const containerWidth = Math.max(200, container.clientWidth);
				const containerHeight = Math.max(200, container.clientHeight);
				const totalWidth = containerWidth - margin.left - margin.right;
				const totalHeight = containerHeight - margin.top - margin.bottom - legendSpace - gapSpace;
				const chartTop = hasLegendTop ? margin.top + legendHeight : margin.top;
				const chartLeft = margin.left;
				const width = Math.max(0, totalWidth);
				const height = Math.max(0, totalHeight);

				// Layout: one legend as first child; column = legend top, column-reverse = legend bottom
				const wrapper = d3.select(container).append("div").attr("class", "bargraph-inner");
				wrapper.style("position", "relative").style("width", "100%").style("height", "100%").style("min-height", "120px").style("display", "flex").style("flex-direction", hasLegendTop ? "column" : "column-reverse").style("gap", "16px").style("background", backgroundColor);

				function addLegend(parent, className)
				{
					const legendEl = parent.append("div").attr("class", "bargraph-legend " + className);
					legendEl.style("display", "flex").style("flex-wrap", "wrap").style("gap", "8px").style("align-items", "center").style("justify-content", "center").style("padding", "4px 0").style("min-height", legendHeight + "px").style("flex-shrink", "0");
					legendEl.selectAll(".bargraph-legend-item").data(seriesList).join("span").attr("class", "bargraph-legend-item").style("display", "inline-flex").style("align-items", "center").style("gap", "4px").style("font-family", legendFontFamily).style("font-size", legendFontSize).style("font-weight", legendFontWeight).style("color", textColor).each(function (d)
					{
						const item = d3.select(this);
						if (item.select(".bargraph-legend-swatch").empty())
						{
							item.append("span").attr("class", "bargraph-legend-swatch").style("width", "12px").style("height", "12px").style("background-color", d.color).style("border-radius", "2px").style("flex-shrink", "0");
							item.append("span").attr("class", "label").text(d.name);
						} else
						{
							item.select(".label").text(d.name);
							item.select(".bargraph-legend-swatch").style("background-color", d.color);
						}
					});
				}

				if (hasLegend)
				{
					addLegend(wrapper, hasLegendTop ? "bargraph-legend-top" : "bargraph-legend-bottom");
				}

				const svgWidth = containerWidth;
				const svgHeight = containerHeight - legendSpace - gapSpace;
				const svg = wrapper.append("svg").attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`).attr("preserveAspectRatio", "xMinYMin meet");
				svg.style("overflow", "visible").style("flex", "1 1 0").style("min-height", "0");

				const g = svg.append("g").attr("class", "chart-area").attr("transform", `translate(${chartLeft}, ${chartTop})`);

				const tooltipFontFamily = "Arial";
				const tooltipFontSize = "12px";
				const tooltipFontWeight = "normal";
				const tooltip = wrapper.append("div").attr("class", "bargraph-tooltip").style("position", "absolute").style("pointer-events", "none").style("z-index", "10").style("visibility", "hidden").style("background", tooltipBackground).style("color", tooltipTextColor).style("font-family", tooltipFontFamily).style("font-size", tooltipFontSize).style("font-weight", tooltipFontWeight);

				const allValues = seriesList.flatMap(s => s.values).filter(v => !isNaN(v));
				const minVal = allValues.length ? Math.min(...allValues) : 0;
				const maxVal = allValues.length ? Math.max(...allValues) : 100;
				const allNegative = allValues.length && maxVal <= 0;
				const valMin = minVal < 0 ? minVal : 0;
				const valMax = allNegative ? 0 : (maxVal > 0 ? maxVal : 100);
				const valueDomain = [valMin, valMax];
				const isHorizontal = orientation === "horizontal";

				let xScale, yScale, xAxisFn, yAxisFn, barData, bars, runBarTransition;

				const valueAxisTickCountMax = 20;
				// Vertical value axis (Y): use ~25px per tick. Horizontal value axis (X): use ~40px per tick so labels don't overlap when width is limited.
				const valueAxisTickPixelsVertical = 25;
				const valueAxisTickPixelsHorizontal = 40;
				function valueAxisTickFormat(v)
				{
					return (v % 1 === 0) ? String(v) : d3.format(".1f")(v);
				}
				function getValueAxisTicks(axisLength, scale, pixelsPerTick)
				{
					const requested = Math.min(Math.max(2, Math.floor(axisLength / pixelsPerTick)), valueAxisTickCountMax);
					const raw = scale.ticks(requested);
					const unique = raw.filter(function (v, i, a) { return a.indexOf(v) === i; });
					return unique.sort(function (a, b) { return a - b; });
				}

				if (isHorizontal)
				{
					xScale = d3.scaleLinear().domain(valueDomain).range([0, width]).nice();
					yScale = d3.scaleBand().domain(categories).range([0, height]).padding(0.2);
					const subScale = d3.scaleBand().domain(seriesList.map((_, i) => i)).range([0, yScale.bandwidth()]).padding(0.05);
					const xTicks = getValueAxisTicks(width, xScale, valueAxisTickPixelsHorizontal);

					xAxisFn = g => g
						.attr("class", "x-axis")
						.attr("transform", `translate(0,${height})`)
						.call(d3.axisBottom(xScale).tickValues(xTicks).tickFormat(valueAxisTickFormat))
						.call(s => { s.select(".domain").attr("stroke", axisLineColor); if (showGrid) s.selectAll(".tick line").clone().attr("y2", -height).attr("stroke", gridColor).attr("stroke-opacity", gridOpacity); });
					yAxisFn = g => g
						.attr("class", "y-axis")
						.call(d3.axisLeft(yScale).tickSizeOuter(0))
						.call(s => { s.select(".domain").attr("stroke", axisLineColor); if (showGrid) s.selectAll(".tick line").clone().attr("x2", width).attr("stroke", gridColor).attr("stroke-opacity", gridOpacity); });

					g.append("g").call(yAxisFn);
					g.append("g").call(xAxisFn);

					const zeroX = xScale(0);
					if (zeroX >= 0 && zeroX <= width)
					{
						g.append("line").attr("class", "zero-line").attr("x1", zeroX).attr("x2", zeroX).attr("y1", 0).attr("y2", height).attr("stroke", zeroLineColor).attr("stroke-width", "1.5").attr("stroke-opacity", zeroLineOpacity);
					}

					barData = [];
					categories.forEach((cat, i) =>
					{
						seriesList.forEach((s, si) =>
						{
							const v = s.values[i];
							if (v != null && !isNaN(v)) barData.push({ category: cat, categoryIndex: i, seriesIndex: si, seriesName: s.name, color: s.color, value: Number(v) });
						});
					});

					bars = g.append("g").attr("class", "bars").selectAll("rect.bar").data(barData).join("rect").attr("class", "bar").attr("fill", d => d.color).attr("x", d => (d.value >= 0 ? xScale(0) : xScale(d.value))).attr("width", 0).attr("y", d => yScale(d.category) + subScale(d.seriesIndex)).attr("height", subScale.bandwidth());

					runBarTransition = function ()
					{
						bars.transition().duration(animationSpeed).attr("x", d => (d.value >= 0 ? xScale(0) : xScale(d.value))).attr("width", d => Math.abs(xScale(d.value) - xScale(0)));
					};
				} else
				{
					yScale = d3.scaleLinear().domain(valueDomain).range([height, 0]).nice();
					const yTicks = getValueAxisTicks(height, yScale, valueAxisTickPixelsVertical);
					xScale = d3.scaleBand().domain(categories).range([0, width]).padding(0.2);
					const subScale = d3.scaleBand().domain(seriesList.map((_, i) => i)).range([0, xScale.bandwidth()]).padding(0.05);

					yAxisFn = g => g
						.attr("class", "y-axis")
						.call(d3.axisLeft(yScale).tickValues(yTicks).tickFormat(valueAxisTickFormat))
						.call(s => { s.select(".domain").attr("stroke", axisLineColor); if (showGrid) s.selectAll(".tick line").clone().attr("x2", width).attr("stroke", gridColor).attr("stroke-opacity", gridOpacity); });
					xAxisFn = g => g
						.attr("class", "x-axis")
						.attr("transform", `translate(0,${height})`)
						.call(d3.axisBottom(xScale).tickSizeOuter(0))
						.call(s => { s.select(".domain").attr("stroke", axisLineColor); if (showGrid) s.selectAll(".tick line").clone().attr("y2", -height).attr("stroke", gridColor).attr("stroke-opacity", gridOpacity); });

					g.append("g").call(yAxisFn);
					g.append("g").call(xAxisFn);

					const zeroY = yScale(0);
					if (zeroY >= 0 && zeroY <= height)
					{
						g.append("line").attr("class", "zero-line").attr("x1", 0).attr("x2", width).attr("y1", zeroY).attr("y2", zeroY).attr("stroke", zeroLineColor).attr("stroke-width", "1.5").attr("stroke-opacity", zeroLineOpacity);
					}

					barData = [];
					categories.forEach((cat, i) =>
					{
						seriesList.forEach((s, si) =>
						{
							const v = s.values[i];
							if (v != null && !isNaN(v)) barData.push({ category: cat, categoryIndex: i, seriesIndex: si, seriesName: s.name, color: s.color, value: Number(v) });
						});
					});

					const subScaleV = d3.scaleBand().domain(seriesList.map((_, i) => i)).range([0, xScale.bandwidth()]).padding(0.05);
					bars = g.append("g").attr("class", "bars").selectAll("rect.bar").data(barData).join("rect").attr("class", "bar").attr("fill", d => d.color).attr("x", d => xScale(d.category) + subScaleV(d.seriesIndex)).attr("width", subScaleV.bandwidth()).attr("y", d => yScale(0)).attr("height", 0);

					runBarTransition = function ()
					{
						bars.transition().duration(animationSpeed).attr("y", d => (d.value >= 0 ? yScale(d.value) : yScale(0))).attr("height", d => Math.abs(yScale(d.value) - yScale(0)));
					};
				}

				// Y-axis: pivot at right edge of last character (e.g. 'Y' in "January") so it stays fixed; no trailing space in rotation radius. Use getBBox right edge.
				function yAxisTickTextTransform(angle)
				{
					if (angle === 0) return null;
					return function ()
					{
						const bbox = this.getBBox ? this.getBBox() : null;
						if (!bbox) return "rotate(" + angle + " 0 0)";
						const cx = bbox.x + bbox.width;
						const cy = bbox.y + bbox.height / 2;
						return "rotate(" + angle + " " + cx + " " + cy + ")";
					};
				}
				// X-axis: anchor "end" when angle<0 (pivot at 0), "start" when angle>0 (pivot at 0). So pivot is always (0,cy).
				function xAxisTickTextAnchor(angle)
				{
					return angle === 0 ? "middle" : angle < 0 ? "end" : "start";
				}
				function xAxisTickTextTransform(angle)
				{
					if (angle === 0) return null;
					return function ()
					{
						const bbox = this.getBBox ? this.getBBox() : null;
						if (!bbox) return "rotate(" + angle + " 0 0)";
						const cy = bbox.y + bbox.height / 2;
						return "rotate(" + angle + " 0 " + cy + ")";
					};
				}
				const categoryAxisSelector = isHorizontal ? ".y-axis" : ".x-axis";
				const valueAxisSelector = isHorizontal ? ".x-axis" : ".y-axis";
				const categoryOnYAxis = categoryAxisSelector === ".y-axis";
				const valueOnYAxis = valueAxisSelector === ".y-axis";
				const categoryAnchor = categoryOnYAxis ? "end" : xAxisTickTextAnchor(categoryAxisLabelRotation);
				const valueAnchor = valueOnYAxis ? "end" : xAxisTickTextAnchor(valueAxisLabelRotation);
				const categoryTransform = categoryOnYAxis ? yAxisTickTextTransform(categoryAxisLabelRotation) : xAxisTickTextTransform(categoryAxisLabelRotation);
				const valueTransform = valueOnYAxis ? yAxisTickTextTransform(valueAxisLabelRotation) : xAxisTickTextTransform(valueAxisLabelRotation);
				g.selectAll(categoryAxisSelector + " .tick text").style("font-family", categoryAxisFontFamily).style("font-size", categoryAxisFontSize).style("font-weight", categoryAxisFontWeight).style("fill", textColor).attr("text-anchor", categoryAnchor).attr("transform", categoryTransform);
				g.selectAll(valueAxisSelector + " .tick text").style("font-family", valueAxisFontFamily).style("font-size", valueAxisFontSize).style("font-weight", valueAxisFontWeight).style("fill", textColor).attr("text-anchor", valueAnchor).attr("transform", valueTransform);

				function isVisible(elem)
				{
					const rect = elem.getBoundingClientRect();
					const windowHeight = window.innerHeight || document.documentElement.clientHeight;
					return rect.top <= windowHeight && rect.bottom >= 0;
				}
				if (isVisible(container)) runBarTransition(); else window.addEventListener("scroll", function onScroll() { if (isVisible(container)) { window.removeEventListener("scroll", onScroll); runBarTransition(); } });

				function escapeHtml(s)
				{
					if (s == null) return "";
					const str = String(s);
					return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
				}
				function formatTooltipValue(v)
				{
					return (v % 1 === 0) ? String(v) : d3.format(".3g")(v);
				}
				bars.on("mouseover", function (event, d)
				{
					const valueStr = formatTooltipValue(d.value) + (valueUnit ? " " + valueUnit : "");
					const html = "<div class=\"bargraph-tooltip-category\">" + escapeHtml(d.category) + "</div>" +
						"<div class=\"bargraph-tooltip-series\"><span class=\"bargraph-tooltip-swatch\" style=\"background-color:" + escapeHtml(d.color) + "\"></span>" + escapeHtml(d.seriesName) + ": " + escapeHtml(valueStr) + "</div>";
					tooltip.style("visibility", "visible").html(html);
					d3.select(this).attr("opacity", "0.85");
				}).on("mousemove", function (event)
				{
					const box = wrapper.node().getBoundingClientRect();
					const offset = 12;
					tooltip.style("left", (event.clientX - box.left + offset) + "px").style("top", (event.clientY - box.top - offset) + "px");
				}).on("mouseout", function ()
				{
					tooltip.style("visibility", "hidden");
					d3.select(this).attr("opacity", "1");
				});


			} catch (renderError)
			{
				console.error("[createBarGraph] FAIL POINT in renderChart:", renderError.message, renderError.stack);
				throw renderError;
			}
		}


		const resizeDebounceMs = 50;
		function onResizeComplete()
		{
			try
			{
				container.innerHTML = "";
				renderChart(data);
			} catch (e)
			{
				console.error("[createBarGraph] resize re-render error:", e);
			}
			container._barGraphResizeTimeout = null;
		}
		function scheduleResizeRender()
		{
			if (container._barGraphResizeTimeout) clearTimeout(container._barGraphResizeTimeout);
			container._barGraphResizeTimeout = setTimeout(onResizeComplete, resizeDebounceMs);
		}
		requestAnimationFrame(() =>
		{
			renderChart(data);
			if (typeof ResizeObserver !== "undefined")
			{
				container._barGraphResizeObserver = new ResizeObserver(scheduleResizeRender);
				container._barGraphResizeObserver.observe(container);
			}
		});
	} catch (error)
	{
		console.error("[createBarGraph] FAIL POINT (outer):", error.message, error.stack);
	}
}









function AddBarGraphContextCategoryDynamic(name = "")
{
	const original = document.getElementById("BarGraphContextCategoryDynamic");
	if (!original)
	{
		console.error("Template with id 'BarGraphContextCategoryDynamic' not found.");
		return;
	}
	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block";
	const input = clone.querySelector("textarea.BarGraphContextCategoryName");
	if (input)
	{
		input.value = name;
		input.addEventListener("input", saveBarGraphContextData);
	}
	const container = document.getElementById("BarGraphContextCategoriesContainer");
	if (!container)
	{
		console.error("Container with id 'BarGraphContextCategoriesContainer' not found.");
		return;
	}
	container.appendChild(clone);
	saveBarGraphContextData();
}

function DeleteBarGraphContextCategoryDynamic(element)
{
	const row = element.closest(".BarGraphContextCategoryDynamic");
	if (row && row.parentNode) row.parentNode.removeChild(row);
	saveBarGraphContextData();
}

function AddBarGraphContextValueDynamic(buttonOrElement)
{
	const seriesBlock = buttonOrElement.closest(".BarGraphContextDataDynamic");
	if (!seriesBlock)
	{
		console.error("No parent with class 'BarGraphContextDataDynamic' found for value.");
		return;
	}
	const valuesContainer = seriesBlock.querySelector(".BarGraphContextSeriesValuesContainer");
	if (!valuesContainer)
	{
		console.error("Values container (.BarGraphContextSeriesValuesContainer) not found within series block.");
		return;
	}
	const template = document.getElementById("BarGraphContextValueDynamic");
	if (!template)
	{
		console.error("Template with id 'BarGraphContextValueDynamic' not found.");
		return;
	}
	const clone = template.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block";
	const input = clone.querySelector("textarea.BarGraphContextValueInput");
	if (input) input.addEventListener("input", saveBarGraphContextData);
	valuesContainer.appendChild(clone);
	saveBarGraphContextData();
}

function DeleteBarGraphContextValueDynamic(element)
{
	const row = element.closest(".BarGraphContextValueDynamic");
	if (row && row.parentNode) row.parentNode.removeChild(row);
	saveBarGraphContextData();
}

function AddBarGraphContextDataDynamic(label = "", color = "", values = [])
{

	const original = document.getElementById("BarGraphContextDataDynamic");
	if (!original)
	{
		console.error("Template with id 'BarGraphContextDataDynamic' not found.");
		return;
	}

	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block";

	const colorElem = clone.querySelector("div.BarGraphContextDataColorPicker");

	$(colorElem).colorPick({
		"initialColor": color || "#999999",
		"paletteLabel": "Choose Color",
		"palette": palettecolors,
		"init": function ()
		{
			this.element.css({ "backgroundColor": GetObjectColor(this.element.attr("title")), "color": GetObjectColor(this.element.attr("title")) });
		},
		"onColorSelected": function ()
		{
			this.element.css({ "backgroundColor": GetObjectColor(this.element.attr("title")), "color": GetObjectColor(this.element.attr("title")) });
			saveBarGraphContextData();
		}
	});

	const labelElem = clone.querySelector("textarea.BarGraphContextDataLabel");
	if (labelElem)
	{
		labelElem.value = label;
		labelElem.addEventListener("input", saveBarGraphContextData);
	}

	const valuesContainer = clone.querySelector(".BarGraphContextSeriesValuesContainer");
	if (valuesContainer) valuesContainer.innerHTML = "";
	const valueTemplate = document.getElementById("BarGraphContextValueDynamic");
	if ((values || []).length > 0 && (!valueTemplate || !valuesContainer))
	{
		console.error("Template 'BarGraphContextValueDynamic' or series values container not found; cannot add initial values.");
	}
	(values || []).forEach(function (v)
	{
		if (!valueTemplate || !valuesContainer) return;
		const valueClone = valueTemplate.cloneNode(true);
		valueClone.removeAttribute("id");
		valueClone.style.display = "block";
		const valueInput = valueClone.querySelector("textarea.BarGraphContextValueInput");
		if (valueInput)
		{
			valueInput.value = typeof v === "number" ? String(v) : (v || "");
			valueInput.addEventListener("input", saveBarGraphContextData);
		}
		valuesContainer.appendChild(valueClone);
	});

	const container = document.getElementById("BarGraphContextDataDynamicContainer");
	if (!container)
	{
		console.error("Container with id 'BarGraphContextDataDynamicContainer' not found.");
		return;
	}
	container.appendChild(clone);
	saveBarGraphContextData();
}

function DeleteBarGraphContextDataDynamic(element)
{

	const parentToRemove = element.closest(".BarGraphContextDataDynamic");
	if (!parentToRemove)
	{
		console.error("No parent with class 'BarGraphContextDataDynamic' found.");
		return;
	}
	parentToRemove.parentNode.removeChild(parentToRemove);
	saveBarGraphContextData();
}

function collectBarGraphContextData()
{

	const categories = [];
	const categoriesContainer = document.getElementById("BarGraphContextCategoriesContainer");
	if (categoriesContainer)
	{
		categoriesContainer.querySelectorAll(".BarGraphContextCategoryDynamic").forEach(function (row)
		{
			const input = row.querySelector("textarea.BarGraphContextCategoryName");
			const name = input ? input.value.trim() : "";
			categories.push(name);
		});
	}

	const series = [];
	const seriesContainer = document.getElementById("BarGraphContextDataDynamicContainer");
	if (seriesContainer)
	{
		seriesContainer.querySelectorAll(".BarGraphContextDataDynamic").forEach(function (item)
		{
			const labelElem = item.querySelector("textarea.BarGraphContextDataLabel");
			const colorElem = item.querySelector("div.BarGraphContextDataColorPicker");
			const valuesContainer = item.querySelector(".BarGraphContextSeriesValuesContainer");
			const name = labelElem ? labelElem.value.trim() : "";
			const color = colorElem ? colorElem.title.trim() : "#999999";
			const values = [];
			if (valuesContainer)
			{
				valuesContainer.querySelectorAll(".BarGraphContextValueDynamic").forEach(function (valueRow)
				{
					const valueInput = valueRow.querySelector("textarea.BarGraphContextValueInput");
					if (valueInput) values.push(valueInput.value.trim());
				});
			}
			series.push({ name: name || "Series", color: color || "#999999", values: values });
		});
	}

	return { categories: categories.length ? categories : ["Category 1"], series: series.length ? series : [{ name: "Series 1", color: "#e9969b", values: [0] }] };
}

function loadBarGraphContextData(data)
{

	const categoriesContainer = document.getElementById("BarGraphContextCategoriesContainer");
	if (categoriesContainer)
	{
		categoriesContainer.innerHTML = "";
		const cats = data.categories || [];
		if (cats.length === 0) AddBarGraphContextCategoryDynamic("");
		else cats.forEach(function (name) { AddBarGraphContextCategoryDynamic(name); });
	}

	const seriesContainer = document.getElementById("BarGraphContextDataDynamicContainer");
	if (!seriesContainer)
	{
		console.error("Container with id 'BarGraphContextDataDynamicContainer' not found.");
		return;
	}
	seriesContainer.innerHTML = "";
	const seriesList = data.series || [];
	if (seriesList.length === 0) AddBarGraphContextDataDynamic("", "", []);
	else seriesList.forEach(function (s)
	{
		AddBarGraphContextDataDynamic(s.name || "", s.color || "", s.values || []);
	});
}

function saveBarGraphContextData()
{

	const data = collectBarGraphContextData();
	for (var i = ElementsToBeDecorated.length; i >= 1; i--)
	{
		ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
		if (ElementToBeDecorated)
		{
			ElementToBeDecorated.setAttribute("data-jsondynamicdata", JSON.stringify(data));
		}
	}
}
function BarGraphContextGetData(ObjDom)
{

	var data = null;
	var jsonVariable = ObjDom.getAttribute("data-jsonvariable");
	let jsonDynamicData = ObjDom.getAttribute("data-jsondynamicdata");

	if (jsonVariable && jsonVariable !== "")
	{

		jsonVariable = ResolveConditionstate(jsonVariable);

		try
		{

			if (jsonVariable.charAt(0) === "'")
			{
				jsonVariable = jsonVariable.slice(1, -1)
			}
			jsonVariable = jsonVariable.replace(/\u00A0/g, ' ');
			data = JSON.parse(jsonVariable);
		} catch (e)
		{
			console.log(e);
		}
	}
	else
	{
		if (jsonDynamicData && jsonDynamicData !== "")
		{
			jsonDynamicData = ResolveConditionstate(jsonDynamicData);
			try
			{
				if (jsonDynamicData.charAt(0) === "'")
				{
					jsonDynamicData = jsonDynamicData.slice(1, -1);
				}
				data = JSON.parse(jsonDynamicData);
			} catch (e)
			{
				console.log(e);
			}
		}
		else
		{
			// Default data: object { categories, series }. Only this format is accepted.
			// Example formats for data-jsonvariable / data-jsondynamicdata:
			//
			// 1. Clustered bar chart (multiple series per category):
			//    { "categories": ["Jan","Feb","Mar"], "series": [ { "name": "Series A", "color": "#e9969b", "values": [10, 20, 30] }, { "name": "Series B", "color": "#87ceeb", "values": [5, 15, 25] } ] }
			//
			// 2. Single series (one bar per category):
			//    { "categories": ["Apple","Banana","Cherry"], "series": [ { "name": "Sales", "color": "#D7AF00", "values": [40, 60, 50] } ] }
			//
			// 3. Clustered with negative values (bars above and below zero):
			//    { "categories": ["Q1","Q2","Q3","Q4"], "series": [ { "name": "Profit", "color": "#2ecc71", "values": [10, -5, 20, 15] }, { "name": "Loss", "color": "#e74c3c", "values": [-2, 8, -10, 5] } ] }
			data = {
				categories: ["January", "February", "March", "April", "May", "June", "July"],
				series: [
					{ name: "Dataset 1", color: "#e9969b", values: [62, 5, 20, 60, -100, 18, 12] },
					{ name: "Dataset 2", color: "#87ceeb", values: [-28, -55, -15, 82, 73, 45, -95] }
				]
			};
		}
	}

	return data;
}
