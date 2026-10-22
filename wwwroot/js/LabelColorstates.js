// Label-panel editor for the BACKGROUND color states (data-colorstates). The shared
// Colorstates.js editor lives in the ColorContext group used by the shape objects; the Label
// panel keeps its background color inside the Individual group instead, so it carries its own
// editor instance with distinct DOM ids writing the same data-colorstates attribute.
function AddLabelColorContextDynamic(condition = "", color = "#BDBDBD") {

	const original = document.getElementById("LabelColorContextDynamic");

	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block"; // Ensure it's visible

	// Set textarea value
	const conditionElem = clone.querySelector("textarea.LabelColorContextDynamicConditionState");
	conditionElem.value = condition;
	conditionElem.addEventListener('input', saveLabelColorContext);

	// Set div title (color)
	const colorElem = clone.querySelector("div.LabelColorContextDynamicColorState");

	$(colorElem).colorPick({
		'initialColor': color,
		'paletteLabel': 'Choose Color',
		'palette': palettecolors,
		'init': function () {
			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
		},
		'onColorSelected': function () {

			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

			saveLabelColorContext();
		}
	});

	// Append to container
	const container = document.getElementById("LabelColorContextDynamicContainer");

	container.appendChild(clone);
}
function DeleteLabelColorContextDynamic(element) {

	const parentToRemove = element.closest(".LabelColorContextDynamic");

	parentToRemove.parentNode.removeChild(parentToRemove);

	saveLabelColorContext();
}
function collectLabelColorContext() {

	const container = document.getElementById("LabelColorContextDynamicContainer");

	const data = [];

	const items = container.querySelectorAll(".LabelColorContextDynamic");

	items.forEach(item => {
		const conditionElem = item.querySelector("textarea.LabelColorContextDynamicConditionState");
		const colorElem = item.querySelector("div.LabelColorContextDynamicColorState");

		const condition = conditionElem ? conditionElem.value.trim() : "";
		const color = colorElem ? colorElem.title.trim() : "";

		data.push({
			condition,
			color
		});
	});

	return data;
}
function loadLabelColorContext(data) {

	const container = document.getElementById("LabelColorContextDynamicContainer");

	container.innerHTML = "";

	data.forEach(entry => {
		const { condition = "", color = "" } = entry;
		AddLabelColorContextDynamic(condition, color);
	});
}
function saveLabelColorContext() {

	const data = collectLabelColorContext();

	for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

		ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

		if (ElementToBeDecorated) {
			ElementToBeDecorated.setAttribute('data-colorstates', JSON.stringify(data));
		}
	}

}
function MoveLabelColorStateUp(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const previous = element.previousElementSibling;
	if (previous) {
		element.parentNode.insertBefore(element, previous);
	}

	saveLabelColorContext();
}
function MoveLabelColorStateDown(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const next = element.nextElementSibling;
	if (next) {
		element.parentNode.insertBefore(next, element);
	}

	saveLabelColorContext();
}
