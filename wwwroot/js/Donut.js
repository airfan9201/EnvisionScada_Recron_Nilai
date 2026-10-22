// Resolves a Color Library name to its hex value; a literal color is returned unchanged.
// Guarded because GetObjectColor lives in Utils.js, which is only loaded on the Envision page.
function DonutResolveColor(color) {
	return (typeof GetObjectColor === "function") ? GetObjectColor(color) : color;
}

﻿function createDonutChart(element, data = null) {
	try {
		var ObjDom = getObjDom(element);

		let radiusWidth = getinitAttribute(ObjDom, "data-radiuswidth", "0.5");
		let animationSpeed = Number(getinitAttribute(ObjDom, "data-animationspeed", "1500"));
		   
		let labelFontFamily = getinitAttribute(ObjDom, "data-labelfontfamily", "Arial");
		let labelFontSize = getinitAttribute(ObjDom, "data-labelfontsize", "8px");
		let labelFontWeight = getinitAttribute(ObjDom, "data-labelfontweight", "bold");
		let labelTextMargin = getinitAttribute(ObjDom, "data-labeltextmargin", "25");
		let labelTextHidden = getinitAttribute(ObjDom, "data-labeltexthidden", "false");
		let valueFontFamily = getinitAttribute(ObjDom, "data-valuefontfamily", "Arial");
		let valueFontSize = getinitAttribute(ObjDom, "data-valuefontsize", "12px");
		let valueFontWeight = getinitAttribute(ObjDom, "data-valuefontweight", "normal");
		let valueTextMargin = getinitAttribute(ObjDom, "data-valuetextmargin", "0");
		let valueTextHidden = getinitAttribute(ObjDom, "data-valuetexthidden", "false");
		let valueUnit = getinitAttribute(ObjDom, "data-valueunit", "");

		if (data == null) {
			data = DonutContextGetData(ObjDom);
			//data = [
			//	{ value: 30, color: '#D7AF00', label: 'Label 1' },
			//	{ value: 90, color: '#C3E100', label: 'Label 2' },
			//	{ value: 50, color: '#A14F40', label: 'Label 3' }
			//];
		}

		//let data = [];

		//if (jsonVariable != '') {
		//	//console.log(jsonVariable)
		//	//console.log(VarDict[jsonVariable])
		//	jsonVariable = ResolveConditionstate(jsonVariable);
		//	//console.log(jsonVariable)
		//	//console.log('----------');
		//	data = JSON.parse(jsonVariable.slice(1, -1));
		//}
		//else {
		//	// construct JSON dynamically from variable list

		//	data = [
		//		{ value: 30, color: '#D7AF00', label: 'Label 1' },
		//		{ value: 90, color: '#C3E100', label: 'Label 2' },
		//		{ value: 50, color: '#A14F40', label: 'Label 3' }
		//	];

		//}

		const container = ObjDom;

		container.innerHTML = "";

		const margin = 0;
		const select = d3.select;

		let pieData;
		let animationComplete = false;

		function renderChart(data) {
			// Define the aspect ratio (width / height) of the chart
			const aspectRatio = 16 / 9;

			// Calculate the size of the chart based on the size of the container
			const containerWidth = container.clientWidth;
			const containerHeight = container.clientHeight;
			const width = containerWidth - margin * 2;
			const height = containerHeight - margin * 2;
			const radius = Math.min(width, height) / 2;

			const svg = d3.select(container)
				.append("svg")
				// Set the width and height to 100% so that the SVG scales to fit its container
				.attr("width", '100%')
				.attr("height", '100%')
				// Set the viewBox attribute to specify the aspect ratio of the SVG
				.attr("viewBox", `0 0 ${width} ${height}`)
				// Set the preserveAspectRatio attribute to make the SVG scale uniformly
				.attr("preserveAspectRatio", "xMinYMin meet")

				.style("overflow", 'visible');

			let g = svg.append('g')
				.attr('transform', `translate(${width / 2}, ${height / 2})`);

			const arc = d3.arc()
				.innerRadius(radius * radiusWidth) // default 0.5
				.outerRadius(radius);

			const pie = d3.pie()
				.sort(null)
				.value(d => d.value);

			pieData = pie(data);

			const path = g.selectAll("path")
				.data(pie(data))
				.join("path")
				.attr("fill", (d, i) => DonutResolveColor(d.data.color))
				.attr("d", arc)
				.each(function () { this._current = { startAngle: 0, endAngle: 0 }; });

			function animate(onComplete) {

				path.transition()
					.duration(animationSpeed)
					.attrTween("d", function (d) {
						const interpolate = d3.interpolate(this._current, d);
						this._current = interpolate(0);
						return function (t) {
							return arc(interpolate(t));
						};
					})
					.on("end", function () {
						animationComplete = true;
						onComplete();
						allowHover();
					});


				if (labelTextHidden == 'false' && text) {
					text.transition()
						.duration(animationSpeed + 500)
						.attrTween("transform", function (d) {
							const interpolate = d3.interpolate(this._current, d);
							this._current = interpolate(0);
							return function (t) {
								const [x, y] = getLabelPosition(arc, interpolate(t), Number(labelTextMargin));
								return `translate(${x}, ${y})`;
							};
						});
				}

				if (valueTextHidden == 'false' && value) {
					value.transition()
						.duration(animationSpeed + 500)
						.tween("text", function (d) {
							const i = d3.interpolate(+this.textContent || 0, d.data.value);
							return function (t) {
								this.textContent = Math.round(i(t));
							};
						})
						.attrTween("transform", function (d) {
							const interpolate = d3.interpolate(this._current, d);
							this._current = interpolate(0);
							return function (t) {
								const [x, y] = getLabelPosition(arc, interpolate(t), Number(valueTextMargin));
								return `translate(${x}, ${y})`;
							};
						});
				}
			}

			let text;
			let value;

			function addLabels() {

				if (labelTextHidden == 'false') {

					text = g.selectAll("text")
						.data(pie(data))
						.join("text")
						.attr("transform", d => {
							const [x, y] = getLabelPosition(arc, d, Number(labelTextMargin));
							return `translate(${x}, ${y})`;
						})
						.attr("dy", "0.35em")
						.attr("text-anchor", "middle")
						.text(d => d.data.label)
						.attr("fill", "black")
						.classed("label", true)
						.style("font-family", labelFontFamily)
						.style("font-weight", labelFontWeight)
						.style("font-size", labelFontSize); // default 8px;
				}

				if (valueTextHidden == 'false') {
					value = g.selectAll("text.value")
						.data(pie(data))
						.join("text")
						.attr("transform", d => {
							const [x, y] = getLabelPosition(arc, d, Number(valueTextMargin));
							return `translate(${x}, ${y})`;
						})
						.attr("dy", "0.5em")
						.attr("text-anchor", "middle")
						.style("font-family", valueFontFamily)
						.style("font-weight", valueFontWeight)
						.style("font-size", valueFontSize)
				}
			}

			function addDataValues() {

				if (valueTextHidden == 'false') {
					value.each(function (d) {
						d3.select(this).text(d.data.value + ' ' + valueUnit);
					});
				}

			}


			function allowHover() {
				const path = container.querySelectorAll("path");
				const g = container.querySelectorAll("g");
				let currentHover = null;

				path.forEach(function (p) {
					p.addEventListener("mouseover", function (event) {
						if (currentHover !== this) {
							const scaleFactor = 1.05;

							// Set the fill of all other paths to grey
							path.forEach(function (p2) {
								if (p2 !== p) {
									d3.select(p2)
										.transition()
										.duration(500)
										.attr("transform", `scale(1)`);
								}
							});

							// Scale up the hovered path and set its fill color to its original color
							d3.select(this)
								.transition()
								.duration(500)
								.attr("transform", `scale(${scaleFactor})`)

							currentHover = this;
						}
					});

					p.addEventListener("mouseout", function (event) {
						if (currentHover === this) {
							const scaleFactor = 1;

							// Set the fill of all paths back to their original color
							path.forEach(function (p2) {
								d3.select(p2)
									.transition()
									.duration(500)
									.attr("transform", `scale(1)`);
							});

							// Scale down the path to its original size and set its fill color back to its original color
							d3.select(this)
								.transition()
								.duration(500)
								.attr("transform", `scale(${scaleFactor})`)

							currentHover = null;
						}
					});
				});
			}

			addLabels(); // Call `addLabels` before `animate`

			function animateChart() {

				animate(() => {

					addLabels();
					addDataValues();
					allowHover();
				});
			}

			function isVisible(elem) {
				const rect = elem.getBoundingClientRect();
				const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
				return rect.top <= windowHeight && rect.bottom >= 0;
			}

			function onScroll() {
				if (isVisible(container)) {
					window.removeEventListener('scroll', onScroll);
					animate();
					//allowHover();
				}
			}

			if (isVisible(container)) {
				animateChart(); // Call animateChart directly if the chart is visible
			} else {
				window.addEventListener('scroll', function onScroll() {
					if (isVisible(container)) {
						animateChart(); // Call animateChart when the chart becomes visible
						window.removeEventListener('scroll', onScroll);
					}
				});
			}
		}

		// Wait for the container element to be fully rendered
		requestAnimationFrame(() => {
			renderChart(data);
		});
	} catch (error) {
		console.log(error);
	}

}

function getLabelPosition(arc, d, offset) {
	const [x, y] = arc.centroid(d);
	const length = Math.sqrt(x * x + y * y);
	const newX = (x / length) * (length + offset);
	const newY = (y / length) * (length + offset);
	return [newX, newY];
}

function AddDonutContextDataDynamic(value = "", color = "", label = "") {

	//console.log('AddDonutContextDataDynamic');

	const original = document.getElementById("DonutContextDataDynamic");

	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block"; // Ensure it's visible

	// Set textarea value
	const valueElem = clone.querySelector("textarea.DonutContextDataVariable");
	valueElem.value = value;
	valueElem.addEventListener('input', saveDonutContextData);

	// Set div title (color)
	const colorElem = clone.querySelector("div.DonutContextDataColorPicker");

	$(colorElem).colorPick({
		'initialColor': color,
		'paletteLabel': 'Choose Color',
		'palette': palettecolors,
		'init': function () {
			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
		},
		'onColorSelected': function () {

			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

			saveDonutContextData();
		}
	});

	// Set input value (label)
	const labelElem = clone.querySelector("input.DonutContextDataLabel");
	labelElem.value = label;
	labelElem.addEventListener('input', saveDonutContextData);

	// Append to container
	const container = document.getElementById("DonutContextDataDynamicContainer");

	if (!container) {
		console.error("Container with id 'DonutContextDataDynamicContainer' not found.");
		return;
	}

	container.appendChild(clone);

	saveDonutContextData();

	
	
}

function DeleteDonutContextDataDynamic(element) {

	//console.log('DeleteDonutContextDataDynamic');

	// Find the closest parent with the class 'DonutContextDataDynamic'
	const parentToRemove = element.closest(".DonutContextDataDynamic");

	// Check if such a parent exists
	if (!parentToRemove) {
		console.error("No parent with class 'DonutContextDataDynamic' found.");
		return;
	}

	// Remove it from its parent (presumably the container)
	parentToRemove.parentNode.removeChild(parentToRemove);

	saveDonutContextData();
}

function collectDonutContextData() {

	//console.log('collectDonutContextData');

	const container = document.getElementById("DonutContextDataDynamicContainer");

	if (!container) {
		console.error("Container with id 'DonutContextDataDynamicContainer' not found.");
		return [];
	}

	const data = [];

	const items = container.querySelectorAll(".DonutContextDataDynamic");

	items.forEach(item => {
		const valueElem = item.querySelector("textarea.DonutContextDataVariable");
		const colorElem = item.querySelector("div.DonutContextDataColorPicker");
		const labelElem = item.querySelector("input.DonutContextDataLabel");

		const value = valueElem ? valueElem.value.trim() : "";
		const color = colorElem ? colorElem.title.trim() : "";
		const label = labelElem ? labelElem.value.trim() : "";


		data.push({
			value,
			color,
			label
		});
	});

	return data;
}

function loadDonutContextData(data) {

	//console.log('loadDonutContextData');

	const container = document.getElementById("DonutContextDataDynamicContainer");

	if (!container) {
		console.error("Container with id 'DonutContextDataDynamicContainer' not found.");
		return;
	}

	// Clear existing content
	container.innerHTML = "";

	// Populate with data
	data.forEach(entry => {
		const { value = "", color = "", label = "" } = entry;
		AddDonutContextDataDynamic(value, color, label);
	});
}

function saveDonutContextData() {

	//console.log('saveDonutContextData');

	const data = collectDonutContextData();

	for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

		ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

		if (ElementToBeDecorated) {
			ElementToBeDecorated.setAttribute('data-jsondynamicdata', JSON.stringify(data));
		}
	}

}

function DonutContextGetData(ObjDom) {

	var data = [];

	var jsonVariable = ObjDom.getAttribute('data-jsonvariable');
	let jsonDynamicData = ObjDom.getAttribute('data-jsondynamicdata');

	//console.log(jsonVariable)

	if (jsonVariable && jsonVariable !== '') {
		//
		//console.log(VarDict[jsonVariable])
		//console.log("Raw");
		//console.log(jsonVariable);
		jsonVariable = ResolveConditionstate(jsonVariable);
		//console.log("Resolved");
		//console.log(jsonVariable);
		//console.log('----------');
		try {

			if (jsonVariable.charAt(0) === "'") {
				jsonVariable = jsonVariable.slice(1, -1)
			}
			jsonVariable = jsonVariable.replace(/\u00A0/g, ' ');
			data = JSON.parse(jsonVariable);
		} catch (e) {
			console.log(e);
		}
	}
	else {
		if (jsonDynamicData && jsonDynamicData !== '') {

			jsonDynamicData = ResolveConditionstate(jsonDynamicData);

			//console.log('----------');
			try {
				if (jsonDynamicData.charAt(0) === "'") {
					jsonDynamicData = jsonDynamicData.slice(1, -1)
				}
				data = JSON.parse(jsonDynamicData);
			} catch (e) {
				console.log(e);
			}
		}
		else {
			data = [
				{ value: 50, color: '#D7AF00', label: 'No Data' },
				{ value: 50, color: '#C3E100', label: 'No Data' },
				{ value: 50, color: '#A14F40', label: 'No Data' }
			];
		}

	}

	return data;
}