function AddColorContextDynamic(condition = "", color = "#BDBDBD") {
	
	const original = document.getElementById("ColorContextDynamic");

	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block"; // Ensure it's visible

	// Set textarea value
	const conditionElem = clone.querySelector("textarea.ColorContextDynamicConditionState");
	conditionElem.value = condition;
	conditionElem.addEventListener('input', saveColorContext);

	// Set div title (color)
	const colorElem = clone.querySelector("div.ColorContextDynamicColorState");

	$(colorElem).colorPick({
		'initialColor': color,
		'paletteLabel': 'Choose Color',
		'palette': palettecolors,
		'init': function () {
			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
		},
		'onColorSelected': function () {

			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

			saveColorContext();
		}
	});

	// Append to container
	const container = document.getElementById("ColorContextDynamicContainer");

	container.appendChild(clone);
}
function DeleteColorContextDynamic(element) {

	const parentToRemove = element.closest(".ColorContextDynamic");

	parentToRemove.parentNode.removeChild(parentToRemove);

	saveColorContext();
}
function collectColorContext() {
	
	const container = document.getElementById("ColorContextDynamicContainer");

	const data = [];

	const items = container.querySelectorAll(".ColorContextDynamic");

	items.forEach(item => {
		const conditionElem = item.querySelector("textarea.ColorContextDynamicConditionState");
		const colorElem = item.querySelector("div.ColorContextDynamicColorState");

		const condition = conditionElem ? conditionElem.value.trim() : "";
		const color = colorElem ? colorElem.title.trim() : "";

		data.push({
			condition,
			color
		});
	});

	return data;
}
function loadColorContext(data) {
	
	const container = document.getElementById("ColorContextDynamicContainer");

	container.innerHTML = "";

	data.forEach(entry => {
		const { condition = "", color = "" } = entry;
		AddColorContextDynamic(condition, color);
	});
}
function saveColorContext() {
	
	//console.log('saveColorContext');

	const data = collectColorContext();

	//console.log(data);

	for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

		ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

		if (ElementToBeDecorated) {
			ElementToBeDecorated.setAttribute('data-colorstates', JSON.stringify(data));
			//console.log(ElementToBeDecorated);
		}
	}

}
function MoveColorStateUp(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const previous = element.previousElementSibling;
	if (previous) {
		element.parentNode.insertBefore(element, previous);
	}

	saveColorContext();
}
function MoveColorStateDown(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const next = element.nextElementSibling;
	if (next) {
		element.parentNode.insertBefore(next, element);
	}

	saveColorContext();
}