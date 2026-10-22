//Master
//["1bc7f8cd-01ad-4663-aaa5-800e7bd4ff48": {label: "Pomp1", value: "abc", default: "abc"}, ...]

//Instance
//["1bc7f8cd-01ad-4663-aaa5-800e7bd4ff48": "Pomp2", ...]	-> Keep same as Master, in case of switching from instance to master

var editingsymbol = false;
var editingsymbolobject;

var selectedgroupsymbolmaster;

// EDIT MASTER 
function EditMasterSymbolModal(el) {

    var object = document.getElementById(RightClickedObjectId);

	const data = JSON.parse(object.getAttribute("data-replacers"));

    var EditMasterSymbolReplacersList = document.getElementById('EditMasterSymbolReplacersList');

    var EditMasterSymbolReplacer = document.getElementById('EditMasterSymbolReplacer');

	EditMasterSymbolReplacersList.innerHTML = "";

	if (data) {
		Object.entries(data).forEach(([uuid, obj]) => {

			var clone = EditMasterSymbolReplacer.cloneNode(true);
			clone.removeAttribute("id");

			var id = clone.getElementsByClassName("EditMasterSymbolReplacerId")[0];
			var label = clone.getElementsByClassName("EditMasterSymbolReplacerLabel")[0];
			var replacer = clone.getElementsByClassName("EditMasterSymbolReplacerValue")[0];
			var defaultreplacer = clone.getElementsByClassName("EditMasterSymbolReplacerDefault")[0];

			label.value = obj.label;
			replacer.value = obj.replacer;
			defaultreplacer.value = obj.default;
			id.value = uuid;

			clone.style.display = "flex";

			EditMasterSymbolReplacersList.appendChild(clone);
		});
	}

    var myModal = new bootstrap.Modal(document.getElementById('EditMasterSymbolReplacersModal'));
    myModal.show();
}
function AddReplacerToMaster() {

	var EditMasterSymbolReplacersList = document.getElementById('EditMasterSymbolReplacersList');

	var EditMasterSymbolReplacer = document.getElementById('EditMasterSymbolReplacer');

	var clone = EditMasterSymbolReplacer.cloneNode(true);
	clone.removeAttribute("id");

	var id = clone.getElementsByClassName("EditMasterSymbolReplacerId")[0];
	var label = clone.getElementsByClassName("EditMasterSymbolReplacerLabel")[0];
	var replacer = clone.getElementsByClassName("EditMasterSymbolReplacerValue")[0];
	var defaultreplacer = clone.getElementsByClassName("EditMasterSymbolReplacerDefault")[0];

	//id.value = crypto.randomUUID(); // generates a new UUID;
	id.value = generateUUID();
	label.value = '';
	replacer.value = '';
	defaultreplacer.value = '';

	clone.style.display = "flex";

	EditMasterSymbolReplacersList.appendChild(clone);

}

function generateUUID() {
	// Polyfill similar to crypto.randomUUID()
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);

	// RFC 4122 version 4 UUID
	bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

	return [...bytes].map((b, i) =>
		(i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') +
		b.toString(16).padStart(2, '0')
	).join('');
}

function SaveMasterSymbolReplacers() {

	const EditMasterSymbolReplacersList = document.getElementById('EditMasterSymbolReplacersList');
	const replacerElements = EditMasterSymbolReplacersList.getElementsByClassName('EditMasterSymbolReplacer');

	const data = {};

	for (let replacerElement of replacerElements) {

		const idInput = replacerElement.getElementsByClassName('EditMasterSymbolReplacerId')[0];
		const labelInput = replacerElement.getElementsByClassName('EditMasterSymbolReplacerLabel')[0];
		const replacerInput = replacerElement.getElementsByClassName('EditMasterSymbolReplacerValue')[0];
		const defaultInput = replacerElement.getElementsByClassName('EditMasterSymbolReplacerDefault')[0];

		const uuid = idInput.value.trim();
		const label = labelInput.value.trim();
		const replacer = replacerInput.value.trim();
		const defaultValue = defaultInput.value.trim(); // Rename variable

		data[uuid] = {
			label,
			replacer,
			default: defaultValue // Use "default" as key in object
		};
	}

	//console.log('-------------------');
	//console.log(data);

	var object = document.getElementById(RightClickedObjectId);

	if (object) {
		object.setAttribute('data-replacers', JSON.stringify(data));
	}

	// Optionally close the modal
	const modalElement = document.getElementById('EditMasterSymbolReplacersModal');
	const modalInstance = bootstrap.Modal.getInstance(modalElement);
	if (modalInstance) modalInstance.hide();

}

// EDIT INSTANCE
function AddInstanceSymbolModal(groupsymbolmaster) {

	editingsymbol = false;

	//SetClipboard(document.getElementById("GroupSymbolMaster " + groupsymbolmaster).innerHTML);
	//GetClipboard();
	//return;

	selectedgroupsymbolmaster = groupsymbolmaster;

	var master;

	master = GetSymbolMaster(groupsymbolmaster);

	if (!master) {
		alert('Symbol not found');
		return;
	}

	if (master.getAttribute("data-groupsymbol")) {
		document.getElementById('EditInstanceSymbolReplacersModalName').value = master.getAttribute("data-groupsymbol") + '_' + GenerateUniqueID().toString();
		document.getElementById('EditInstanceSymbolReplacersMasterName').value = master.getAttribute("data-groupsymbol");
	}
	else {
		alert('Error EditInstanceSymbolReplacersModalName. Contact us.');
		return;
	}

	const data = JSON.parse(master.getAttribute("data-replacers"));

	var EditInstanceSymbolReplacersList = document.getElementById('EditInstanceSymbolReplacersList');

	var EditInstanceSymbolReplacer = document.getElementById('EditInstanceSymbolReplacer');

	EditInstanceSymbolReplacersList.innerHTML = "";

	//console.log(data);

	if (data) {
		Object.entries(data).forEach(([uuid, obj]) => {

			var clone = EditInstanceSymbolReplacer.cloneNode(true);
			clone.removeAttribute("id");

			var id = clone.getElementsByClassName("EditInstanceSymbolReplacerId")[0];
			var label = clone.getElementsByClassName("EditInstanceSymbolReplacerLabel")[0];
			var replacermaster = clone.getElementsByClassName("EditInstanceSymbolReplacerMaster")[0];
			var replacerinstance = clone.getElementsByClassName("EditInstanceSymbolReplacerInstance")[0];
			var replacerdefault = clone.getElementsByClassName("EditInstanceSymbolReplacerDefault")[0];

			label.value = obj.label;
			replacermaster.value = obj.replacer;
			replacerinstance.value = obj.default;
			replacerdefault.value = obj.default;
			id.value = uuid;

			clone.style.display = "flex";

			EditInstanceSymbolReplacersList.appendChild(clone);
		});
	}

	var myModal = new bootstrap.Modal(document.getElementById('EditInstanceSymbolReplacersModal'));
	myModal.show();
}
function EditInstanceSymbolModal(el) {

	editingsymbol = true;

	var object = document.getElementById(RightClickedObjectId);

	var mastername = object.getAttribute("data-groupsymbolmaster");

	var master;

	master = GetSymbolMaster(mastername);

	if (!master) {
		var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
		document.getElementById('ModalMessage').innerHTML = "Master was not found the in the project. <br />Have you saved the page containing the master?";
		myModal.show();
		return;
	}

	editingsymbolobject = object;

	document.getElementById('EditInstanceSymbolReplacersModalName').value = object.getAttribute("data-groupsymbol");
	document.getElementById('EditInstanceSymbolReplacersMasterName').value = master.getAttribute("data-groupsymbol");

	//console.log(master);

	const data = JSON.parse(master.getAttribute("data-replacers"));
	const datainstance = JSON.parse(object.getAttribute("data-replacers"));

	var EditInstanceSymbolReplacersList = document.getElementById('EditInstanceSymbolReplacersList');
	var EditInstanceSymbolReplacer = document.getElementById('EditInstanceSymbolReplacer');

	EditInstanceSymbolReplacersList.innerHTML = "";

	//console.log(data);
	//console.log(datainstance);

	if (data) {
		Object.entries(data).forEach(([uuid, obj]) => {

			var objinstance;

			if (datainstance) {
				objinstance = datainstance[uuid];
			}

			var clone = EditInstanceSymbolReplacer.cloneNode(true);
			clone.removeAttribute("id");

			var id = clone.getElementsByClassName("EditInstanceSymbolReplacerId")[0];
			var label = clone.getElementsByClassName("EditInstanceSymbolReplacerLabel")[0];
			var replacermaster = clone.getElementsByClassName("EditInstanceSymbolReplacerMaster")[0];
			var replacerinstance = clone.getElementsByClassName("EditInstanceSymbolReplacerInstance")[0];
			var replacerdefault = clone.getElementsByClassName("EditInstanceSymbolReplacerDefault")[0];

			label.value = obj.label;
			replacermaster.value = obj.replacer;
			if (objinstance) {
				replacerinstance.value = objinstance.replacer;
			} else {
				//replacerinstance.value = '';
				replacerinstance.value = obj.default;
			}
			replacerdefault.value = obj.default;
			id.value = uuid;

			clone.style.display = "flex";

			EditInstanceSymbolReplacersList.appendChild(clone);
		});
	}

	if (typeof MarkUdtOwnedReplacers === "function") MarkUdtOwnedReplacers(object, mastername);

	var myModal = new bootstrap.Modal(document.getElementById('EditInstanceSymbolReplacersModal'));
	myModal.show();


}

// MarkUdtOwnedReplacers lives in _UdtReplacerOwnershipPartial.cshtml (it needs @T translations and
// the handler URL, neither available in a plain .js file). The call above is guarded so this file
// keeps working on any page where that partial is not registered.

// Writes the whole form back. A UDT-owned row's input is disabled rather than readonly, and a
// disabled input still exposes .value, so an untouched mapped row round-trips its current value
// unchanged instead of being blanked.
function SaveInstanceSymbolReplacers(object) {

	const EditInstanceSymbolReplacersList = document.getElementById('EditInstanceSymbolReplacersList');
	const replacerElements = EditInstanceSymbolReplacersList.getElementsByClassName('EditInstanceSymbolReplacer');

	const data = {};

	for (let replacerElement of replacerElements) {

		const idInput = replacerElement.getElementsByClassName('EditInstanceSymbolReplacerId')[0];
		const labelInput = replacerElement.getElementsByClassName('EditInstanceSymbolReplacerLabel')[0];
		const replacerInput = replacerElement.getElementsByClassName('EditInstanceSymbolReplacerInstance')[0];
		const defaultInput = replacerElement.getElementsByClassName('EditInstanceSymbolReplacerDefault')[0];

		const uuid = idInput.value.trim();
		const label = labelInput.value.trim();
		const replacer = replacerInput.value.trim();
		const defaultValue = defaultInput.value.trim(); // Rename variable

		data[uuid] = {
			label,
			replacer,
			default: defaultValue // Use "default" as key in object
		};
	}

	object.setAttribute('data-replacers', JSON.stringify(data));
}
function AddEditSymbol() {

	// A pending map Add routes the result into the MapObject's overlay pane instead of onto the
	// page. Guarded on both the flag and the function so this file still works on a page without
	// Map.js, and so an ordinary Add is untouched.
	if (typeof MapPendingAddOuter !== "undefined" && MapPendingAddOuter
		&& typeof MapFinishAddChildFromDialog === "function") {
		MapFinishAddChildFromDialog();
		return;
	}

	if (editingsymbol) {
		EditSymbol();
	}
	else {
		AddSymbol()
	}
}
async function AddSymbol() {

	var master;

	master = GetSymbolMaster(selectedgroupsymbolmaster);

	if (!master) {
		alert('Symbol not found');
		return;
	}

	var template = document.createElement('template');
	template.innerHTML = master.outerHTML;
	var element = template.content.childNodes[0];

	if (document.getElementById('EditInstanceSymbolReplacersModalName').value !== '') {
		element.setAttribute('data-groupsymbolmaster', element.getAttribute('data-groupsymbol'));
		element.setAttribute('data-groupsymbol', document.getElementById('EditInstanceSymbolReplacersModalName').value);
	}
	else {
		alert('You need to provide a name for the new Symbol.');
		return;
	}

	SaveInstanceSymbolReplacers(element);

	document.getElementById('EnvisionPage').focus();

	var symbolid;

	try {
		
		let el = element.outerHTML;
		el = el.replaceAll("data-noid=", "id=");
		el = el.replaceAll("data-nosrc=", "src=");

		const parser = new DOMParser();
		const pastedDoc = parser.parseFromString(el, "text/html");

		var childDivs = pastedDoc.querySelectorAll('body > div');

		for (i = 0; i < childDivs.length; i++) {
			var childDiv = childDivs[i];
			var objectname = childDiv.getAttribute('name');

			switch (objectname) {
				case "GroupObject":
					symbolid = CloneGroupFrom(childDiv);
					break;
				default:
					if (childDiv.classList.contains("draggable")) {

						CloneObjectFrom(childDiv);
					}
					break;
			}

			await sleep(100);
			DisableEditMode();
			EnableEditMode();

			ElementToBeDecorated = document.getElementById(symbolid);
			//console.log(ElementToBeDecorated);
			PullGroupInit();
		}

	} catch (error) {
		//console.error(error);
	}
}
async function EditSymbol() {

	var element = editingsymbolobject;

	if (document.getElementById('EditInstanceSymbolReplacersModalName').value !== '') {
		element.setAttribute('data-groupsymbol', document.getElementById('EditInstanceSymbolReplacersModalName').value);
	}
	else {
		alert('You need to provide a name for the new Symbol.');
		return;
	}

	SaveInstanceSymbolReplacers(element);

	//refresh decorator
	showmulticontextmenu(element)

}


// GENERALIZING ---------------------------------------------------------

function DeleteElement(element, containerClass) {

	// Find the closest parent with the class 'EditMasterSymbolReplacer'
	const parentToRemove = element.closest(`.${containerClass}`);

	// Remove it from its parent (presumably the container)
	parentToRemove.parentNode.removeChild(parentToRemove);
}

function MoveElementUp(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const previous = element.previousElementSibling;
	if (previous) {
		element.parentNode.insertBefore(element, previous);
	}
}

function MoveElementDown(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const next = element.nextElementSibling;
	if (next) {
		element.parentNode.insertBefore(next, element);
	}
}
