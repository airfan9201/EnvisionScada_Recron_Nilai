function AddTextColorContextDynamic(condition = "", color = "#BDBDBD") {

	const original = document.getElementById("TextColorContextDynamic");

	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block"; // Ensure it's visible

	// Set textarea value
	const conditionElem = clone.querySelector("textarea.TextColorContextDynamicConditionState");
	conditionElem.value = condition;
	conditionElem.addEventListener('input', saveTextColorContext);

	// Set div title (color)
	const colorElem = clone.querySelector("div.TextColorContextDynamicColorState");

	$(colorElem).colorPick({
		'initialColor': color,
		'paletteLabel': 'Choose Color',
		'palette': palettecolors,
		'init': function () {
			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
		},
		'onColorSelected': function () {

			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

			saveTextColorContext();
		}
	});

	// Append to container
	const container = document.getElementById("TextColorContextDynamicContainer");

	container.appendChild(clone);
}
function DeleteTextColorContextDynamic(element) {

	const parentToRemove = element.closest(".TextColorContextDynamic");

	parentToRemove.parentNode.removeChild(parentToRemove);

	saveTextColorContext();
}
function collectTextColorContext() {

	const container = document.getElementById("TextColorContextDynamicContainer");

	const data = [];

	const items = container.querySelectorAll(".TextColorContextDynamic");

	items.forEach(item => {
		const conditionElem = item.querySelector("textarea.TextColorContextDynamicConditionState");
		const colorElem = item.querySelector("div.TextColorContextDynamicColorState");

		const condition = conditionElem ? conditionElem.value.trim() : "";
		const color = colorElem ? colorElem.title.trim() : "";

		data.push({
			condition,
			color
		});
	});

	return data;
}
function loadTextColorContext(data) {

	const container = document.getElementById("TextColorContextDynamicContainer");

	container.innerHTML = "";

	data.forEach(entry => {
		const { condition = "", color = "" } = entry;
		AddTextColorContextDynamic(condition, color);
	});
}
function saveTextColorContext() {

	const data = collectTextColorContext();

	for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

		ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

		if (ElementToBeDecorated) {
			ElementToBeDecorated.setAttribute('data-textcolorstates', JSON.stringify(data));
		}
	}

}
function MoveTextColorStateUp(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const previous = element.previousElementSibling;
	if (previous) {
		element.parentNode.insertBefore(element, previous);
	}

	saveTextColorContext();
}
function MoveTextColorStateDown(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const next = element.nextElementSibling;
	if (next) {
		element.parentNode.insertBefore(next, element);
	}

	saveTextColorContext();
}
