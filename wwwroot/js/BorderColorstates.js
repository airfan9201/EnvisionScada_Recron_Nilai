function AddBorderColorContextDynamic(condition = "", color = "#BDBDBD") {

	const original = document.getElementById("BorderColorContextDynamic");

	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
	clone.style.display = "block"; // Ensure it's visible

	// Set textarea value
	const conditionElem = clone.querySelector("textarea.BorderColorContextDynamicConditionState");
	conditionElem.value = condition;
	conditionElem.addEventListener('input', saveBorderColorContext);

	// Set div title (color)
	const colorElem = clone.querySelector("div.BorderColorContextDynamicColorState");

	$(colorElem).colorPick({
		'initialColor': color,
		'paletteLabel': 'Choose Color',
		'palette': palettecolors,
		'init': function () {
			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
		},
		'onColorSelected': function () {

			this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

			saveBorderColorContext();
		}
	});

	// Append to container
	const container = document.getElementById("BorderColorContextDynamicContainer");

	container.appendChild(clone);

	saveBorderColorContext();

}
function DeleteBorderColorContextDynamic(element) {

	const parentToRemove = element.closest(".BorderColorContextDynamic");

	parentToRemove.parentNode.removeChild(parentToRemove);

	saveBorderColorContext();
}
function collectBorderColorContext() {

	const container = document.getElementById("BorderColorContextDynamicContainer");

	const data = [];

	const items = container.querySelectorAll(".BorderColorContextDynamic");

	items.forEach(item => {
		const conditionElem = item.querySelector("textarea.BorderColorContextDynamicConditionState");
		const colorElem = item.querySelector("div.BorderColorContextDynamicColorState");

		const condition = conditionElem ? conditionElem.value.trim() : "";
		const color = colorElem ? colorElem.title.trim() : "";

		data.push({
			condition,
			color
		});
	});

	return data;
}
function loadBorderColorContext(data) {

	//console.log(data);

	const container = document.getElementById("BorderColorContextDynamicContainer");

	container.innerHTML = "";

	data.forEach(entry => {
		const { condition = "", color = "" } = entry;
		AddBorderColorContextDynamic(condition, color);
	});
}
function saveBorderColorContext() {

	//console.log('saveBorderColorContext');

	const data = collectBorderColorContext();

	//console.log(data);

	for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

		ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

		if (ElementToBeDecorated) {
			ElementToBeDecorated.setAttribute('data-bordercolorstates', JSON.stringify(data));
			//console.log(ElementToBeDecorated);
		}
	}

}
function MoveBorderColorStateUp(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const previous = element.previousElementSibling;
	if (previous) {
		element.parentNode.insertBefore(element, previous);
	}

	saveBorderColorContext();
}
function MoveBorderColorStateDown(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const next = element.nextElementSibling;
	if (next) {
		element.parentNode.insertBefore(next, element);
	}

	saveBorderColorContext();
}