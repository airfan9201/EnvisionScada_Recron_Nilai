// Envision ObjectOps - Object operations: lock, rotate, flip, align, group/ungroup, clone, z-order, move-to-group.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

function CheckObjectIsLocked(elem) {

    if (elem.getAttribute('data-accesscontrollocked')) {
        return true;
    }

    if (elem.parentElement.parentElement.getAttribute('name') == "GroupObject") {

        var group = elem.parentElement.parentElement

        if (group.getAttribute('data-accesscontrollocked')) {
            return true;
        }

        while (group.parentElement.getAttribute('name') == "GroupObject") {

            group = group.parentElement;

            if (group.getAttribute('data-accesscontrollocked')) {
                return true;
            }
        }

    }

    return false;
}

function CheckLocked(element) {

    var ObjDom = getObjDom(element);

    var locked = false;

    if (ObjDom.getAttribute("data-locked")) {
        locked = ObjDom.getAttribute("data-locked") == "true" ? true : false;
    }

    return locked;
}


function ResetGroupScale() {

    const input = document.getElementById('StyleFormatContextGroupScale');
    if (!input) return;

    // Set scale factor back to 1
    input.value = "1";

    // Trigger focus out so your handler runs
    input.dispatchEvent(new Event('input'));
}


function RedimensionRotatedSVG(ObjDom) {

    //console.log('Redimensioning');

    element = ObjDom.parentElement;
    elementheight = parseFloat(element.style.height.replace('px', ''));
    elementwidth = parseFloat(element.style.width.replace('px', ''));

    if (elementheight > elementwidth) {
        ObjDom.style.marginTop = ((elementheight / 2) - (elementwidth / 2)) + 'px';
        ObjDom.style.marginLeft = (-(elementheight / 2) + (elementwidth / 2)) + 'px';
    }
    else {
        ObjDom.style.marginTop = (-(elementwidth / 2) + (elementheight / 2)) + 'px';
        ObjDom.style.marginLeft = ((elementwidth / 2) - (elementheight / 2)) + 'px';
    }

}

async function CopyObject() {

    if (EditMode === true) {

        //var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
        var elements = document.getElementById("EnvisionPage").querySelectorAll('.draggable');

        var element = null;

        var Objects2Copy = "";

        for (var i = 0; i < elements.length; i++) {

            element = elements[i];

            if (element.className.includes('ActiveSelected')) {

                //console.log(element);

                var group = GetActiveGroup(element);

                if (group !== null) { // clone entire group

                    CloneGroupFrom(group, true);

                    Objects2Copy = Objects2Copy + group.outerHTML;

                    var elements2 = group.querySelectorAll('.draggable');
                    var element2 = null;

                    for (var j = 0; j < elements2.length; j++) {

                        element2 = elements2[j];

                        ClassListRemoveSelectedActive(element2);
                    }
                }
                else { // clone element
                    //CloneObjectFrom(element);
                    
                    Objects2Copy = Objects2Copy + element.outerHTML;

                    ClassListRemoveSelectedActive(element);
                }

            }

        }

        /*console.log(Objects2Copy);*/
        SetClipboard(Objects2Copy);

        SetResetTexts();

        await sleep(100);
        DisableEditMode();
        EnableEditMode();
    }
}

function HideObjects() {
    
    elements = document.getElementById("EnvisionPage").querySelectorAll('.ActiveSelected');

    if (elements.length > 0) {

        for (var i = 0; i < elements.length; i++) { // reverse loop the livenodelist

            element = elements[i];

            element.setAttribute("data-hideobject", "true");
        }
    }

    DeselectAllObjects();

}

function UnhideObjects() {

    if (EditMode === true) {

        elements = document.getElementById("EnvisionPage").querySelectorAll('[data-hideobject="true"]');

        for (var i = 0; i < elements.length; i++) {

            element = elements[i];

            element.removeAttribute("data-hideobject");

        }

    }
}

function DisableIsBackground() {

    elements = document.getElementById("EnvisionPage").querySelectorAll('[data-isbackground]');

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        element.style.pointerEvents = "auto";
    }

}

function EnableIsBackground() {

    elements = document.getElementById("EnvisionPage").querySelectorAll('[data-isbackground]');

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        element.style.pointerEvents = "none";
    }

}

function UnshowObjects() {

    elements = document.getElementById("EnvisionPage").querySelectorAll('[data-showobject="true"]');

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        element.removeAttribute('data-showobject');
    }
}



function MaskObjectsInsideGroup(group) {

    var elements = group.querySelectorAll('.draggable');

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        element.setAttribute("data-maskedobject", "true");

        element.style.pointerEvents = "none";
        
        if (element.getAttribute('name') === "GroupObject") {
            //element.style.opacity = "0"; don't do this for object viewer
            MaskObjectsInsideGroup(element);
        }
        else {
            ObjDom = getObjDom(element);
            ObjDom.style.opacity = "0";
        }

    }

}

function UnmaskObjectsInsideGroup(group) {

    var elements = group.querySelectorAll('.draggable');

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        element.removeAttribute("data-maskedobject");

        if (!element.hasAttribute('data-isbackground')) {
            element.style.pointerEvents = "auto";
        }

        if (element.getAttribute('name') === "GroupObject") {
            //element.style.opacity = "1"; don't do this for object viewer
            UnmaskObjectsInsideGroup(element);
        }
        else {
            ObjDom = getObjDom(element);
            ObjDom.style.opacity = "1";
        }

    }

}

async function CloneObject() {

    //console.log('clone object');

    if (EditMode === true) {

        var elements = document.getElementById("EnvisionPage").querySelectorAll('.draggable');

        for (var i = 0; i < elements.length; i++) {

            element = elements[i];

            if (element.className.includes('ActiveSelected')) {

                if (element.getAttribute('name') === "GroupObject") {
                    //console.log('group clone');

                    // A group nested inside another group must be duplicated into that same
                    // parent group, exactly like a plain object is, otherwise the copy lands
                    // loose on the page and is no longer part of its group.
                    if (element.parentElement.getAttribute('name') === "GroupObject") {
                        CloneGroupFrom(element, true, element.parentElement.id);
                    }
                    else {
                        CloneGroupFrom(element, true);
                    }

                    ClassListRemoveSelectedActive(element);
                }
                else {

                    if (element.parentElement.getAttribute('name') === "GroupObject") {
                        CloneObjectFrom(element, element.parentElement.id);
                    }
                    else
                    {
                        CloneObjectFrom(element)
                    }

                    //console.log('simple clone');
                    
                    ClassListRemoveSelectedActive(element);
                }

            }

        }
        
        ResetPolylineBorders(); // can be optimized with RedrawPolylineBorder individually

        SetResetTexts();
        await sleep(100);
        DisableEditMode();
        EnableEditMode();

        if (elements.length > 0) {
            saveSnapshot();
        }

    }
}

async function CloneGroups() { // IS THIS STILL BEING USED???!! V2023 07 31

    if (EditMode === true) {


        if (SelectedGroups == null) {
            return;
        }

        //console.log('ok');

        var elements = SelectedGroups;
        var element = null;

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            CloneGroupFrom(element, true);

        }

        var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
        var element = null;

        await sleep(100);
        DisableEditMode();
        EnableEditMode();

    }

}

function CloneObjectFrom(parent2clone, parentid) {

    var clone = parent2clone.cloneNode(true);
    var oldid = clone.id;
    clone.id = GenerateUniqueID();

    if (clone.getAttribute("name") === "KnobObject") {
        clone.getElementsByClassName("knob")[0].id = GenerateUniqueID();
        //console.log(clone.getElementsByClassName("knob")[0].id);
        initknob();
    }

    //console.log(clone.style.top);

    //console.log(ClipboardDestination);
    
    if (ClipboardDestination === null) {

        if (AddClipboardDropOffsetY !== null) {
            var width = parseFloat(clone.style.width.replace('px', ''));
            var height = parseFloat(clone.style.height.replace('px', ''));

            var top = parseFloat(clone.style.top.replace('px', ''));
            var left = parseFloat(clone.style.left.replace('px', ''));

            top = top - ClipboardDestinationTop;
            left = left - ClipboardDestinationLeft;

            var temptop = (AddClipboardDropOffsetY + top);
            var templeft = (AddClipboardDropOffsetX + left);

            clone.style.top = roundDownToNearestX(temptop) + "px";
            clone.style.left = roundDownToNearestX(templeft) + "px";
            
            //AddClipboardDropOffsetY = null;
            //AddClipboardDropOffsetX = null;
        }
        else { // duplicate

            if (parentid) {
                clone.style.top = '0px';
                clone.style.left = '0px';
            }
            else {
                if (parseFloat(clone.style.top) - 50 > 0) {
                    clone.style.top = parseFloat(clone.style.top) - 50 + 'px';
                    clone.style.left = parseFloat(clone.style.left) + 50 + 'px';
                }
                else {
                    clone.style.top = parseFloat(clone.style.top) - 0 + 'px';
                    clone.style.left = parseFloat(clone.style.left) + 0 + 'px';
                }
            }
        }
  
        if (!parentid) {
            document.getElementById("EnvisionPage").appendChild(clone);
        }
        else {
            document.getElementById(parentid).appendChild(clone);
        }

    }
    else {

        var width = parseFloat(clone.style.width.replace('px', ''));
        var height = parseFloat(clone.style.height.replace('px', ''));

        var top = parseFloat(clone.style.top.replace('px', ''));
        var left = parseFloat(clone.style.left.replace('px', ''));

        top = top - ClipboardDestinationTop;
        left = left - ClipboardDestinationLeft;

        var temptop = (0 + top);
        var templeft = (0 + left);

        clone.style.top = roundDownToNearestX(temptop) + "px";
        clone.style.left = roundDownToNearestX(templeft) + "px";

        //clone.style.top = '0px';
        //clone.style.left = '0px';

        ClipboardDestination.appendChild(clone);
    }

    return clone.id;
}

// A copy token is 6 lowercase hex characters and always contains at least one letter a-f, so a
// symbol name ending in plain digits (Valve_240501) is never mistaken for one and truncated.
var SymbolCopyTokenPattern = /_(?=[0-9a-f]{6}$)[0-9a-f]*[a-f][0-9a-f]*$/;

function GenerateSymbolCopyToken() {

    var hex = '0123456789abcdef';
    var values = new Uint8Array(6);
    var token = '';

    if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(values);
    }
    else {
        for (var i = 0; i < values.length; i++) {
            values[i] = Math.floor(Math.random() * 256);
        }
    }

    for (var j = 0; j < values.length; j++) {
        token = token + hex[values[j] % 16];
    }

    if (!/[a-f]/.test(token)) {
        token = 'a' + token.substring(1);
    }

    return token;
}

// Removes the suffix of an earlier copy so repeated copies stay Pump_a3f9c2 / Pump_7d14b0 instead
// of stacking into Pump_Copy_Copy_Copy. The legacy _Copy suffix is stripped too, so symbols named
// by an older version get a clean base name on their next copy.
function StripSymbolCopyToken(name) {

    var stripped = name;
    var previous;

    do {
        previous = stripped;
        stripped = stripped.replace(/_copy$/i, '');
        stripped = stripped.replace(SymbolCopyTokenPattern, '');
    } while (stripped !== previous && stripped !== '');

    return stripped === '' ? name : stripped;
}

// A copied group symbol must not reuse its source name. Master names are global: the symbol
// library is rebuilt from every page, so a duplicate master name shadows the original. Instance
// names must be unique per page or the symbol can no longer be addressed by name.
function UniqueSymbolName(name) {

    var base = StripSymbolCopyToken(name);
    var taken = new Set();

    if (typeof menusymbols !== 'undefined' && menusymbols) {

        menusymbols.forEach(function (symbol) {

            if (symbol && symbol.name) {
                taken.add(symbol.name);
            }
        });
    }

    var page = document.getElementById("EnvisionPage");

    if (page) {

        page.querySelectorAll('[data-groupsymbol]').forEach(function (node) {

            var existing = node.getAttribute('data-groupsymbol');

            if (existing) {
                taken.add(existing);
            }
        });
    }

    var candidate = base + '_' + GenerateSymbolCopyToken();

    while (taken.has(candidate)) {
        candidate = base + '_' + GenerateSymbolCopyToken();
    }

    return candidate;
}

function CloneGroupFrom(group, uniquifySymbolName, parentid) {

    //console.log('CloneGroupFrom');

    var clone = group.cloneNode(true);

    clone.id = GenerateUniqueID();

    // Give the copy its own symbol name, for masters and instances alike. Only the cloned group
    // itself is renamed: nested symbols keep their names because a master push already writes the
    // same nested names into every instance. Callers that supply the name themselves, such as
    // creating an instance from the symbol library, leave the flag off.
    if (uniquifySymbolName === true && clone.hasAttribute('data-groupsymbol') && clone.getAttribute('data-groupsymbol') !== '') {

        clone.setAttribute('data-groupsymbol', UniqueSymbolName(clone.getAttribute('data-groupsymbol')));
    }

    var elements = clone.querySelectorAll('.draggable');
    var element = null;

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        element.id = GenerateUniqueID();
        //console.log('new id ' + element.id);
    }
    
    if (ClipboardDestination === null) {
        
        if (AddClipboardDropOffsetY !== null) {
            
            var width = parseFloat(clone.style.width.replace('px', ''));
            var height = parseFloat(clone.style.height.replace('px', ''));

            var top = parseFloat(clone.style.top.replace('px', ''));
            var left = parseFloat(clone.style.left.replace('px', ''));

            top = top - ClipboardDestinationTop;
            left = left - ClipboardDestinationLeft;

            var temptop = (AddClipboardDropOffsetY + top);
            var templeft = (AddClipboardDropOffsetX + left);

            clone.style.top = roundDownToNearestX(temptop) + "px";
            clone.style.left = roundDownToNearestX(templeft) + "px";

        }
        else { // duplicate

            if (parentid) {
                clone.style.top = '0px';
                clone.style.left = '0px';
            }
            else if (parseFloat(clone.style.top) - 50 > 0) {
                clone.style.top = parseFloat(clone.style.top) - 50 + 'px';
                clone.style.left = parseFloat(clone.style.left) + 50 + 'px';
            }
            else {
                clone.style.top = parseFloat(clone.style.top) - 0 + 'px';
                clone.style.left = parseFloat(clone.style.left) + 0 + 'px';
            }

        }

        if (!parentid) {
            document.getElementById("EnvisionPage").appendChild(clone);
        }
        else {
            var parentgroup = document.getElementById(parentid);
            parentgroup.appendChild(clone);
            ResizeGroup2(parentgroup);
        }
    }
    else {



        if (group.getAttribute('data-groupposition') === 'relative') {
            clone.style.top = 0 + 'px';
            clone.style.left = 0 + 'px';
        }
        else {
            var width = parseFloat(clone.style.width.replace('px', ''));
            var height = parseFloat(clone.style.height.replace('px', ''));

            var top = parseFloat(clone.style.top.replace('px', ''));
            var left = parseFloat(clone.style.left.replace('px', ''));

            top = top - ClipboardDestinationTop;
            left = left - ClipboardDestinationLeft;

            var temptop = (0 + top);
            var templeft = (0 + left);

            clone.style.top = roundDownToNearestX(temptop) + "px";
            clone.style.left = roundDownToNearestX(templeft) + "px";
        }

        ClipboardDestination.appendChild(clone);

        ResizeGroup2(ClipboardDestination);

    }

    return clone.id;
}

async function DeleteObject() {

    if (EditMode === true) {

        ResetTexts();
        ResetBorders();

        var elements = document.getElementById("EnvisionPage").querySelectorAll('.draggable');
        var element = null;

        for (var i = 0; i < elements.length; i++) {

            element = elements[i];

            ObjDom = getObjDom(element);

            if (element) {
                if (element.className.includes('ActiveSelected')) {

                    var group = GetActiveGroup(element);

                    if (group !== null) { // remove entire group

                        // A group can contain a map, and this branch has no per-type cleanup at
                        // all: confirm and tear down any maps inside before the subtree goes.
                        if (typeof MapConfirmDeleteWithin === "function" && !MapConfirmDeleteWithin(group)) {
                            continue;
                        }
                        if (typeof MapDestroyWithin === "function") {
                            try { MapDestroyWithin(group); } catch (e) {}
                        }

                        group.parentElement.removeChild(group);

                        //TODO remove dictionaries?
                    }
                    else { // remove element

                        //console.log("REMOVING " + group);
                        var removeok = true;

                        if (element.getAttribute("name") === "GroupObject") {

                            if (element.getAttribute("data-groupsymbol") && element.getAttribute("data-groupsymbol") !== "") {

                                if (!element.getAttribute("data-groupsymbolmaster") || element.getAttribute("data-groupsymbolmaster" === "")) {

                                    if (!AreYouSureDeleteSymbol(element.getAttribute("data-groupsymbol"))) {
                                        removeok = false;
                                    }
                                }
                            }
                        }

                        if (element.getAttribute("name") === "TrendObject") {
                            if (typeof ChartsDict[element.id] !== 'undefined') {
                                delete ChartsDict[element.id];
                            }
                        }

                        if (element.getAttribute("name") === "KnobObject") {
                            if (typeof KnobsDict[element.id] !== 'undefined') {
                                delete KnobsDict[element.id];
                            }
                        }

                        if (element.getAttribute("name") === "PolylineObject") {
                            RemovePolylineBorder(element);
                        }

                        if (element.getAttribute("name") === "MapObject") {
                            // Ask before deleting: the symbols on the map are nested inside it and
                            // go with it, which is not apparent from the canvas.
                            if (typeof MapConfirmDelete === "function" && !MapConfirmDelete(element)) {
                                removeok = false;
                            }
                            else if (typeof MapDestroy === "function") {
                                try { MapDestroy(element); } catch (e) {}
                            }
                        }

                        if (removeok) {
                            var parentgroup;

                            if (element.parentElement.getAttribute("Name") == "GroupObject") {
                                parentgroup = element.parentElement;
                            }

                            element.parentElement.removeChild(element);

                            if (parentgroup) {
                                ResizeGroup2(parentgroup);
                            }
                        }
                    }
                }
            }
        }

        DeselectAllObjects(); // to deselect remaining linedots
        CtrlKeyPressed = false;

        await sleep(100);
        DisableEditMode();
        EnableEditMode();

        
    }
}


async function DeleteGroups() {

    if (EditMode === true) {

        if (SelectedGroups == null) {
            return;
        }

        /*console.log('ok');*/

        var elements = SelectedGroups;
        var element = null;

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            //console.log(element);

            element.parentElement.removeChild(element);

        }

        await sleep(100);
        DisableEditMode();
        EnableEditMode();

    }
}
async function MoveObjectUp() {

    if (EditMode === true) {

        var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
        var element = null;

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            if (element.className.includes('ActiveSelected')) {

                var child2move = element;

                if (child2move.style.zIndex) {
                    if (child2move.style.zIndex == "auto") {
                        child2move.style.zIndex = 1;
                    }
                    else {
                        child2move.style.zIndex = (parseFloat(child2move.style.zIndex) + 1);
                    }

                }
                else {
                    child2move.style.zIndex = "1";
                }

                if (element.id == LastSelectedActive.id) {
                    var zindextext = document.getElementById(element.id + "_zindextext");

                    if (zindextext) {
                        zindextext.innerHTML = "Layer " + child2move.style.zIndex;
                    }

                    var decoratorZIndex = document.getElementById('StyleFormatContextzIndex');
                    if (decoratorZIndex) {
                        decoratorZIndex.value = child2move.style.zIndex;
                        var decoratorZIndexInfo = document.getElementById('StyleFormatContextzIndexInfo');
                        var decoratorZIndexInfoColor = document.getElementById('StyleFormatContextzIndexInfoColor');
                        if (decoratorZIndexInfo) decoratorZIndexInfo.innerText = getLayerNameFromZIndex(child2move.style.zIndex);
                        if (decoratorZIndexInfoColor) decoratorZIndexInfoColor.style.backgroundColor = getLayerColorFromZIndex(child2move.style.zIndex);
                    }
                }

                if (element.getAttribute('name') == "PolylineObject") {
                    var ObjDom = getObjDom(element);
                    RedrawPolylineBorder(ObjDom);
                }
            }

        }
    }

}

async function MoveObjectDown() {

    if (EditMode === true) {

        var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
        var element = null;

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            if (element.className.includes('ActiveSelected')) {

                var child2move = element;

                if (child2move.style.zIndex) {
                    if (child2move.style.zIndex == "auto") {
                        child2move.style.zIndex = 1;
                    }
                    else {
                        child2move.style.zIndex = (parseFloat(child2move.style.zIndex) - 1);
                    }
                }
                else {
                    child2move.style.zIndex = "1";
                }

                if (element.id == LastSelectedActive.id) {
                    var zindextext = document.getElementById(element.id + "_zindextext");

                    if (zindextext) {
                        zindextext.innerHTML = "Layer " + child2move.style.zIndex;
                    }

                    var decoratorZIndex = document.getElementById('StyleFormatContextzIndex');
                    if (decoratorZIndex) {
                        decoratorZIndex.value = child2move.style.zIndex;
                        var decoratorZIndexInfo = document.getElementById('StyleFormatContextzIndexInfo');
                        var decoratorZIndexInfoColor = document.getElementById('StyleFormatContextzIndexInfoColor');
                        if (decoratorZIndexInfo) decoratorZIndexInfo.innerText = getLayerNameFromZIndex(child2move.style.zIndex);
                        if (decoratorZIndexInfoColor) decoratorZIndexInfoColor.style.backgroundColor = getLayerColorFromZIndex(child2move.style.zIndex);
                    }
                }

                //console.log(element.getAttribute('name'));
                if (element.getAttribute('name') == "PolylineObject") {
                    var ObjDom = getObjDom(element);
                    RedrawPolylineBorder(ObjDom);
                }

            }

        }

    }

}

async function GroupObjects() {

    var elements = document.querySelectorAll('.ActiveSelected');
    var element = null;

    var NewGroup = document.getElementById("TypeGroup").cloneNode(true);
    NewGroup.id = GenerateUniqueID();
    NewGroup.style.zIndex = "1";
    NewGroup.style.display = "block";

    // Only group objects with the same parent (objects or groups)

    // FIRST LOOP THE GROUP ELEMENTS
    var parentid;

    if (elements.length > 0) {

        parentid = elements[0].parentElement.id;

        for (var i = 0; i < elements.length; i++) { // reverse loop the livenodelist

            if (parentid != elements[i].parentElement.id) {

                var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
                document.getElementById('ModalMessage').innerHTML = "Selected objects need to have the same parent to be able to be grouped.";
                myModal.show();

                return;
            }

            if (IsPartOfScaledGroupObjectOrSelfScaled(elements[i])) {
                var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
                document.getElementById('ModalMessage').innerHTML = "⚠ Creating a group with a scaled group is not possible.";
                myModal.show();

                return;
            }
        }

    }
    else {
        return; // do nothing
    }

    // LOOP REGULAR ELEMENTS
    var counter = 0;
    elements = document.querySelectorAll('.ActiveSelected');
    if (elements.length > 0) {

        for (var i = 0; i < elements.length; i++) { // reverse loop the livenodelist

            element = elements[i];

            counter++;

            ClassListRemoveSelectedActive(element);

            //if (element.style.zIndex === 'auto' || element.style.zIndex < 1) {
            //    element.style.zIndex = "1";
            //} v2023 07 29 Removed, seems not necessary? 

            NewGroup.appendChild(element.cloneNode(true));

            if (element.getAttribute("name") === "TrendObject") {
                if (typeof ChartsDict[element.id] !== 'undefined') {
                    delete ChartsDict[element.id];
                }
            }

            element.remove();

        }

    }

    if (counter > 0) {
        //document.getElementById("EnvisionPage").appendChild(NewGroup);
        //console.log('parentid: ' + parentid);
        //console.log(NewGroup)
        document.getElementById(parentid).appendChild(NewGroup);
    }

    DeselectAllObjects();

    ResizeGroup2(NewGroup);
    RepositionElementsInGroup(NewGroup);

    //SelectGroup(NewGroup)

    SetResetTexts();

    await sleep(100);
    DisableEditMode();
    EnableEditMode();

}


async function UnGroupObjects() {

    var elements = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected[name="GroupObject"]');

    if (elements.length > 0) {

        for (var i = 0; i < elements.length; i++) {

            // Check if this group is a master template
            var gsm = elements[i].getAttribute('data-groupsymbolmaster');
            var gs = elements[i].getAttribute('data-groupsymbol');
            if (gs && gsm !== null && gsm === '') {
                var confirmed = await ShowConfirmModal(ConfirmMessages['UngroupTemplate'] || 'Are you sure you wish to ungroup this Template?');
                if (!confirmed) {
                    return;
                }
                break;
            }
        }

        ResetTexts();
        ResetBorders();

        // Re-query after reset
        elements = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected[name="GroupObject"]');

        for (var i = 0; i < elements.length; i++) { // reverse loop the livenodelist

            //console.log(elements[i]);

            if (IsSelfScaledOrUpOrDownwards(elements[i])) {
                var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
                document.getElementById('ModalMessage').innerHTML = "⚠ Ungrouping a scaled object is not possible.";
                myModal.show();

                return;
            }
        }

    }

    var element = null;

    if (elements.length > 0) {

        for (var i = 0; i < elements.length; i++) { // reverse loop the livenodelist

            if (hasInlineScale(elements[i])) {
                var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
                document.getElementById('ModalMessage').innerHTML = "Creating a group with a scaled object is not possible.";
                myModal.show();

                return;
            }

            element = elements[i];

            var group2delete = element;

            var parentgroup;

            if (group2delete.parentElement.getAttribute("Name") == "GroupObject") {
                parentgroup = group2delete.parentElement;
            }

            //TODO: check what if group? 
            var objectsingroup = document.getElementById(group2delete.id).querySelectorAll(':scope > div');

            //console.log(objectsingroup);

            var object = null;

            for (var j = 0; j < objectsingroup.length; j++) { // reverse loop the livenodelist

                object = objectsingroup[j];

                var coords = getCoords(object);

                if (parentgroup) {
                    var top = parseFloat(parentgroup.style.top.replace("px", ""));
                    var left = parseFloat(parentgroup.style.left.replace("px", ""));

                    object.style.top = (coords.top - 1 - top) + "px";
                    object.style.left = (coords.left - 1 - left) + "px";
                }
                else {
                    object.style.top = (coords.top - 1) + "px";
                    object.style.left = (coords.left - 1) + "px";
                }
                
                if (object.getAttribute('name' == "GroupObject")) {

                }
                else {
                    /*object.style.zIndex = "auto";*/ //v2023 07 31 don't do that

                }

                if (object.getAttribute("name") === "TrendObject") {
                    if (typeof ChartsDict[object.id] !== 'undefined') {
                        delete ChartsDict[object.id];
                    }
                }

                if (parentgroup) {
                    parentgroup.appendChild(object.cloneNode(true));
                }
                else {
                    document.getElementById("EnvisionPage").appendChild(object.cloneNode(true));
                }
                

                object.remove();
            }

            if (parentgroup) {
                group2delete.remove();
                ResizeGroup2(parentgroup);
            }
            else {
                group2delete.remove();
            }

        }

    }

    DeselectAllObjects();

    await sleep(100);
    DisableEditMode();
    EnableEditMode();
}

function DrawGroupLine(group) {

    return; // todo : remove? 

    var grouptop = 9999999;
    var groupleft = 9999999;
    var groupright = 0;
    var groupbottom = 0;

    var elements = group.getElementsByClassName("draggable");
    var element = null;

    var NewGroup;

    if (elements.length > 0) {

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];


            let compStyles = window.getComputedStyle(element);

            var coords = getCoords(element);


            //top
            if (coords.top < grouptop) {
                grouptop = coords.top;
            }
            //left
            if (coords.left < groupleft) {
                groupleft = coords.left;
            }
            //bottom
            if ((coords.top + parseFloat(compStyles.getPropertyValue('height').replace("px", ""))) > groupbottom) {
                groupbottom = coords.top + parseFloat(compStyles.getPropertyValue('height').replace("px", ""));
            }
            //right
            if ((coords.left + parseFloat(compStyles.getPropertyValue('width').replace("px", ""))) > groupright) {
                groupright = coords.left + parseFloat(compStyles.getPropertyValue('width').replace("px", ""));
            }

            //let compStyles = window.getComputedStyle(element);

            ////top
            //if (parseFloat(compStyles.getPropertyValue('top').replace("px", "")) < grouptop) {
            //    grouptop = parseInt(compStyles.getPropertyValue('top').replace("px", ""));
            //}
            ////left
            //if (parseInt(compStyles.getPropertyValue('left').replace("px", "")) < groupleft) {
            //    groupleft = parseInt(compStyles.getPropertyValue('left').replace("px", ""));
            //}
            ////bottom
            //if ((parseInt(compStyles.getPropertyValue('top').replace("px", "")) + parseInt(compStyles.getPropertyValue('height').replace("px", ""))) > groupbottom) {
            //    groupbottom = parseInt(compStyles.getPropertyValue('top').replace("px", "")) + parseInt(compStyles.getPropertyValue('height').replace("px", ""));
            //}
            ////right
            //if ((parseInt(compStyles.getPropertyValue('left').replace("px", "")) + parseInt(compStyles.getPropertyValue('width').replace("px", ""))) > groupright) {
            //    groupright = parseInt(compStyles.getPropertyValue('left').replace("px", "")) + parseInt(compStyles.getPropertyValue('width').replace("px", ""));
            //}

        }
    }

    GroupLine.style.top = (grouptop - 4) + "px";
    GroupLine.style.left = (groupleft - 4) + "px";
    GroupLine.style.height = (groupbottom - grouptop + 12) + "px";
    GroupLine.style.width = (groupright - groupleft + 12) + "px";
    GroupLine.style.zIndex = "999";
    GroupLine.style.pointerEvents = "none";


}

async function MoveElementInGroupUp() {

    var elements = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected[name="GroupObject"]');

    var element = null;

    if (elements.length > 0) {

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            //console.log(element.previousElementSibling);

            if (element.previousElementSibling) {

                var clone = element.cloneNode(true);

                element.parentElement.insertBefore(clone, element.previousElementSibling);

                element.parentElement.removeChild(element);

            }

        }
    }

    await sleep(100);
    DisableEditMode();
    EnableEditMode();
}

async function MoveElementInGroupDown() {

    var elements = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected[name="GroupObject"]');

    var element = null;

    if (elements.length > 0) {

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            //console.log(element.nextElementSibling);

            if (element.nextElementSibling) {

                var clone = element.cloneNode(true);

                //insert after not supported yet so wrote own function
                insertAfter(clone, element.nextElementSibling);

                element.parentElement.removeChild(element);

            }

        }
    }

    await sleep(100);
    DisableEditMode();
    EnableEditMode();
}

async function MoveElementToUpperGroup() {

    //var elements = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected[name="GroupObject"]');
    var elements = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected');

    var element = null;

    if (elements.length > 0) {

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            //console.log(element.parentElement.parentElement.getAttribute('name'));

            if (element.parentElement.parentElement.getAttribute('name') === "GroupObject" || element.parentElement.parentElement.getAttribute('name') === "PageObject") {

                //console.log('moving to upper group');

                var clone = element.cloneNode(true);

                element.parentElement.parentElement.appendChild(clone);

                element.parentElement.removeChild(element);

            }

        }
    }

    await sleep(100);
    DisableEditMode();
    EnableEditMode();
}

async function MoveElementToGroup() {

    MoveToGroupModal()

    //var elements = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected[name="GroupObject"]');

    //var element = null;

    //if (elements.length > 0) {

    //    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

    //        element = elements[i - 1];

    //        console.log(element.nextElementSibling);

    //        if (element.nextElementSibling) {

    //            var clone = element.cloneNode(true);

    //            //insert after not supported yet so wrote own function
    //            insertAfter(clone, element.nextElementSibling);

    //            element.parentElement.removeChild(element);

    //        }

    //    }
    //}
}

async function MoveToGroup() {

    var mastername = document.getElementById('MoveToGroupName').value;

    if (mastername && mastername !== "") {

        //console.log(mastername);

        var nodes = document.getElementById('EnvisionPage').querySelectorAll('[data-groupsymbol="' + mastername + '"]');

        if (!nodes || nodes.length == 0) {
            if (!$('#MessageModal').hasClass('show')) {

                var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
                document.getElementById('ModalMessage').innerHTML = "Group was not found on this page.";
                myModal.show();

            }
        }
        else {
            if (nodes && nodes.length > 1) {
                if (!$('#MessageModal').hasClass('show')) {

                    var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
                    document.getElementById('ModalMessage').innerHTML = "Multiple groups with this name were found on this page. Group names should be unique, and unique over all pages.";
                    myModal.show();

                }
            }
            else {
                if (nodes[0]) {
                    //console.log(nodes[0]);

                    elements = document.getElementById("EnvisionPage").querySelectorAll('.ActiveSelected');

                    if (elements.length > 0) {

                        for (var i = 0; i < elements.length; i++) { // reverse loop the livenodelist

                            element = elements[i];

                            var clone = element.cloneNode(true);

                            clone.style.top = '0px';
                            clone.style.left = '0px';

                            nodes[0].appendChild(clone);

                            element.parentElement.removeChild(element);


                        }
                    }
                }

                await sleep(100);
                DeselectAllObjects();
                DisableEditMode();
                EnableEditMode();
            }

        }

    }

}

function ResizeGroup(group) {
    
    var grouptop = 9999999;
    var groupleft = 9999999;
    var groupright = -9999999;
    var groupbottom = -9999999;

    var linewidth = 1;

    var elements = group.getElementsByClassName("draggable");
    var element = null;

    var NewGroup;

    if (elements.length > 0) {

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            let compStyles = window.getComputedStyle(element);

            var coords = getCoords(element);
            coords.top = coords.top - linewidth;
            coords.left = coords.left - linewidth;
            //console.log(coords);

            //top
            if (coords.top < grouptop) {
                grouptop = coords.top;
            }
            //left
            if (coords.left < groupleft) {
                groupleft = coords.left;
            }
            //bottom
            if ((coords.top + parseFloat(compStyles.getPropertyValue('height').replace("px", ""))) > groupbottom) {
                groupbottom = coords.top + parseFloat(compStyles.getPropertyValue('height').replace("px", ""));
            }
            //right
            if ((coords.left + parseFloat(compStyles.getPropertyValue('width').replace("px", ""))) > groupright) {
                groupright = coords.left + parseFloat(compStyles.getPropertyValue('width').replace("px", ""));
            }

        }
    }

    var padding = 0;

    //groupbottom = groupbottom - linewidth;
    //grouptop = grouptop - linewidth;
    //groupright = groupright - linewidth;
    //groupleft = groupleft - linewidth;
    //console.log('resizing group');

    //console.log('groupbottom ' + groupbottom);
    //console.log('grouptop ' + grouptop);
    //console.log('groupright ' + groupright);
    //console.log('groupleft ' + groupleft);

    group.style.height = (groupbottom - grouptop + (padding)) + "px";
    group.style.width = (groupright - groupleft + (padding)) + "px";

    group.style.top = (grouptop - (padding / 2)) + "px";
    group.style.left = (groupleft - (padding / 2)) + "px";

    /*group.style.zIndex = "999";*/
    /*group.style.pointerEvents = "none";*/

    //for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

    //    element = elements[i - 1];

    //    element.style.top = (parseFloat(element.style.top.replace("px", "")) - parseFloat(group.style.top.replace("px", ""))) + "px";
    //    element.style.left = (parseFloat(element.style.left.replace("px", "")) - parseFloat(group.style.left.replace("px", ""))) + "px";

    //}
}

function ResizeGroup2(group) {

    //console.log('resizing group');

    if (IsPartOfScaledGroupObjectOrSelfScaled(group)) {
        //console.log('resize blocked');
        return;
    }

    var relativeobjectingroup = false;

    var objectsingroup = group.querySelectorAll(':scope > div.draggable');

    //console.log(objectsingroup);

    var object = null;

    let temp = [];

    // filter display nones
    for (var j = objectsingroup.length; j >= 1; j--) { // reverse loop the livenodelist

        object = objectsingroup[j - 1];

        if (object.style.display !== "none") {
            temp.push(object);
        }
    }

    objectsingroup = temp;


    for (var j = objectsingroup.length; j >= 1; j--) { // reverse loop the livenodelist

        object = objectsingroup[j - 1];

        if (object.style.position === "relative") {
            relativeobjectingroup = true;
            break;
        }
    }

    //console.log(relativeobjectingroup);

    if (relativeobjectingroup) {
        return;
    }

    //if (group.style.position === "relative") {
    //    return;
    //}

    var relativegroup = false;
    var relativemargin;
    if (group.style.position === "relative") {
        relativegroup = true;
        group.style.position = "absolute";
        relativemargin = group.style.margin;
        group.style.margin = "0px";
    }

    var grouptop = 9999999;
    var groupleft = 9999999;
    var groupright = -9999999;
    var groupbottom = -9999999;

    //var elements = group.querySelectorAll(':scope > div.draggable'); // v2023 10 06 can be reused
    var elements = objectsingroup;
    var element = null;

    if (elements.length > 0) {

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            let compStyles = window.getComputedStyle(element);

            var coords = getCoords(element);

            //console.log(coords);

            var linewidth = 1;

            if (element.classList.contains("ActiveSelected")) {
                coords.top = coords.top + linewidth;
                coords.left = coords.left + linewidth;
            }
            else {
                coords.top = coords.top - linewidth;
                coords.left = coords.left - linewidth;
            }

            //console.log(coords);

            //top
            if (coords.top < grouptop) {
                grouptop = coords.top;
            }
            //left
            if (coords.left < groupleft) {
                groupleft = coords.left;
            }

            //bottom
            if ((coords.top + parseFloat(compStyles.getPropertyValue('height').replace("px", ""))) > groupbottom) {
                groupbottom = coords.top + parseFloat(compStyles.getPropertyValue('height').replace("px", ""));
            }
            //right
            if ((coords.left + parseFloat(compStyles.getPropertyValue('width').replace("px", ""))) > groupright) {
                groupright = coords.left + parseFloat(compStyles.getPropertyValue('width').replace("px", ""));
            }

        }
    }

    var padding = 0;

    //console.log('resizing group 2');
    //console.log('groupbottom ' + groupbottom);
    //console.log('grouptop ' + grouptop);
    //console.log('groupright ' + groupright);
    //console.log('groupleft ' + groupleft);

    var oldtop = parseFloat(group.style.top.replace("px", ""));
    var oldleft = parseFloat(group.style.left.replace("px", ""));

    group.style.height = (groupbottom - grouptop + (padding)) + "px";
    group.style.width = (groupright - groupleft + (padding)) + "px";

    group.style.top = (grouptop - (padding / 2)) + "px";
    group.style.left = (groupleft - (padding / 2)) + "px";

    //console.log("grouptop " + grouptop);
    //console.log("groupleft " + groupleft);

    var parentgroup = group.parentElement;
    var child = group;

    // adjust parent if its a group
    while (parentgroup.getAttribute('name') === "GroupObject") { // group in group
        //console.log("group inside group" + parentgroup.getAttribute('name'));

        //console.log("group top " + group.style.top);
        //console.log("parentgroup top " + parentgroup.style.top);

        //console.log("group left " + group.style.left);
        //console.log("parentgroup left " + parentgroup.style.left);

        var grouptop = parseFloat(child.style.top.replace("px", ""));
        var parenttop = parseFloat(parentgroup.style.top.replace("px", ""));
        var groupleft = parseFloat(child.style.left.replace("px", ""));
        var parentleft = parseFloat(parentgroup.style.left.replace("px", ""));

        //console.log('grouptop ' + grouptop);
        //console.log('parenttop ' + parenttop);
        //console.log('groupleft ' + groupleft);
        //console.log('parentleft ' + parentleft);

        if (parentgroup.style.position == "relative") {
            var coords = getCoords(parentgroup);

            parenttop = coords.top;
            parentleft = coords.left;
        }

        child.style.top = (grouptop - parenttop) + "px";
        child.style.left = (groupleft - parentleft) + "px";

        if (parentgroup.style.position == "relative") {
            child = parentgroup;
        }

        parentgroup = parentgroup.parentElement;
    }

    /*group.style.zIndex = "999";*/
    /*group.style.pointerEvents = "none";*/

    var diffoldtop = oldtop - parseFloat(group.style.top.replace("px", ""));
    var diffoldleft = oldleft - parseFloat(group.style.left.replace("px", ""));

    //console.log('grouptop ' + grouptop);
    //console.log('parenttop ' + parenttop);
    //console.log('groupleft ' + groupleft);
    //console.log('parentleft ' + parentleft);

    //console.log(diffoldtop);
    //console.log(diffoldleft);

    //reposition the elements within the changed group 
    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        element.style.top = (parseFloat(element.style.top.replace("px", "")) + diffoldtop) + "px";

    }

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        element.style.left = (parseFloat(element.style.left.replace("px", "")) + diffoldleft) + "px";

    }

    // if the parent is also in a group, repeat
    //if (parentgroup.getAttribute('name') === "GroupObject") { // group in group
    //    console.log('resize parent');
    //    ResizeGroup2(parentgroup);
    //}

    if (relativegroup) {
        group.style.position = "relative";
        group.style.margin = relativemargin;
        group.style.top = "0px";
        group.style.left = "0px";
    }

    ResetPolylineBorders(group); // v20240826

}

function CheckResizeGroup2(selectedelement) {

    while (selectedelement.parentElement.getAttribute('name') == "GroupObject") {

        selectedelement = selectedelement.parentElement;

        ResizeGroup2(selectedelement);
    }
}
function RepositionElementsInGroup(group) {

    var elements = group.querySelectorAll(':scope > div.draggable');

    var element = null;

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        //console.log(element);

        if (parseFloat(element.style.top.replace("px", "")) > 0) {
            element.style.top = (parseFloat(element.style.top.replace("px", "")) - parseFloat(group.style.top.replace("px", ""))) + "px";

        }
        else {

        }

        if (parseFloat(element.style.left.replace("px", "")) > 0) {
            element.style.left = (parseFloat(element.style.left.replace("px", "")) - parseFloat(group.style.left.replace("px", ""))) + "px";
        }
        else {

        }



    }

}

function AlignObjects(el) {

    switch (el.dataset.value) {
        
        case "Top":
            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                var outer = 9999999999;

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    try {

                        var value = element.style.top.replace(" ", "").replace("px", "");
                        var valueint = parseFloat(value);

                        if (valueint < outer) {
                            outer = valueint;
                        }

                    } catch (error) {
                        console.error(error);
                    }
                }

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    if (CheckLocked(element) === true) {
                        continue;
                    }

                    element.style.top = parseInt(outer) + "px";
                }
            }
            break;
        case "Bottom":
            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                var outer = 0;

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    try {

                        var value = element.style.top.replace(" ", "").replace("px", "");
                        var valueint = parseFloat(value);

                        if (valueint > outer) {
                            outer = valueint;
                        }

                    } catch (error) {
                        console.error(error);
                    }
                }

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    if (CheckLocked(element) === true) {
                        continue;
                    }

                    element.style.top = parseInt(outer) + "px";
                }
            }
            break;

        case "Left":

            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                var outer = 9999999999;

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    try {

                        var value = element.style.left.replace(" ", "").replace("px", "");
                        var valueint = parseFloat(value);

                        if (valueint < outer) {
                            outer = valueint;
                        }

                    } catch (error) {
                        console.error(error);
                    }
                }

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    if (CheckLocked(element) === true) {
                        continue;
                    }

                    element.style.left = parseInt(outer) + "px";
                }
            }

            break;

        case "Right":
            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                var outer = 0;

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    try {

                        var value = element.style.left.replace(" ", "").replace("px", "");
                        var valueint = parseFloat(value);

                        if (valueint > outer) {
                            outer = valueint;
                        }

                    } catch (error) {
                        console.error(error);
                    }
                }

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    if (CheckLocked(element) === true) {
                        continue;
                    }

                    element.style.left = parseInt(outer) + "px";
                }

            }
            break;

        case "Equal Vertical":
            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                const objectstoalign = [];
                var objectstoaligncounter = 0;

                var outertop = 9999999999;

                var outerbottom = 0;

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    try {

                        var value = element.style.top.replace(" ", "").replace("px", "");
                        var valueint = parseFloat(value);

                        objectstoalign[objectstoaligncounter] = [valueint, element]
                        objectstoaligncounter++;

                        if (valueint < outertop) {
                            outertop = valueint;
                        }

                        value = element.style.top.replace(" ", "").replace("px", "");
                        valueint = parseFloat(value);

                        if (valueint > outerbottom) {
                            outerbottom = valueint;
                        }

                    } catch (error) {
                        console.error(error);
                    }
                }

                objectstoalign.sort(function (a, b) {
                    return a[0] - b[0]
                });

                var distributedvalue = (outerbottom - outertop) / (objectstoaligncounter - 1);

                for (var i = 0; i < objectstoaligncounter - 1; i++) {

                    element = objectstoalign[i][1];

                    if (CheckLocked(element) === true) {
                        continue;
                    }

                    element.style.top = parseInt((outertop + distributedvalue * i)) + "px";
                }


            }
            break;

        case "Equal Horizontal":
            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                const objectstoalign = [];
                var objectstoaligncounter = 0;

                var outerleft = 9999999999;

                var outerright = 0;

                for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                    element = elements[i - 1];

                    try {

                        var value = element.style.left.replace(" ", "").replace("px", "");
                        var valueint = parseFloat(value);

                        objectstoalign[objectstoaligncounter] = [valueint, element]
                        objectstoaligncounter++;

                        if (valueint < outerleft) {
                            outerleft = valueint;
                        }

                        value = element.style.left.replace(" ", "").replace("px", "");
                        valueint = parseFloat(value);

                        if (valueint > outerright) {
                            outerright = valueint;
                        }

                    } catch (error) {
                        console.error(error);
                    }
                }

                objectstoalign.sort(function (a, b) {
                    return a[0] - b[0]
                });

                var distributedvalue = (outerright - outerleft) / (objectstoaligncounter - 1);

                //console.log(distributedvalue);
                for (var i = 0; i < objectstoaligncounter - 1; i++) {

                    element = objectstoalign[i][1];

                    if (CheckLocked(element) === true) {
                        continue;
                    }

                    element.style.left = parseInt((outerleft + distributedvalue * i)) + "px";
                }


            }
            break;
        case "Center Horizontal":
            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                var sumCenters = 0;
                var count = 0;

                // Calculate average vertical center
                for (var i = elements.length; i >= 1; i--)
                {
                    element = elements[i - 1];

                    try
                    {
                        var top = parseFloat(element.style.top.replace("px", ""));
                        var height = element.offsetHeight;

                        sumCenters += top + (height / 2);
                        count++;
                    } catch (error)
                    {
                        console.error(error);
                    }
                }

                var centerY = sumCenters / count;

                // Align all to that center
                for (var i = elements.length; i >= 1; i--)
                {
                    element = elements[i - 1];

                    if (CheckLocked(element) === true)
                    {
                        continue;
                    }

                    var height = element.offsetHeight;
                    element.style.top = parseInt(centerY - (height / 2)) + "px";
                }
            }
            break;
        case "Center Vertical":
            {
                var elements = document.getElementsByClassName("ActiveSelected");
                var element = null;

                var sumCenters = 0;
                var count = 0;

                // Calculate average horizontal center
                for (var i = elements.length; i >= 1; i--)
                {
                    element = elements[i - 1];

                    try
                    {
                        var left = parseFloat(element.style.left.replace("px", ""));
                        var width = element.offsetWidth;

                        sumCenters += left + (width / 2);
                        count++;
                    } catch (error)
                    {
                        console.error(error);
                    }
                }

                var centerX = sumCenters / count;

                // Align all to that center
                for (var i = elements.length; i >= 1; i--)
                {
                    element = elements[i - 1];

                    if (CheckLocked(element) === true)
                    {
                        continue;
                    }

                    var width = element.offsetWidth;
                    element.style.left = parseInt(centerX - (width / 2)) + "px";
                }
            }
            break;

        default:

    }

    SetResetTexts();
    RedrawBorders();
}

function LockObject() {

    var elements = document.getElementsByClassName("ActiveSelected");
    var element = null;

    var outer = 9999999999;

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        var obj = getObjDom(element);

        obj.setAttribute('data-locked', true);

        changelockicon(element);
    }

    RedrawPolygonDots();
    RedrawPolylineDots();
}

function UnlockObject() {

    var elements = document.getElementsByClassName("ActiveSelected");
    var element = null;

    var outer = 9999999999;

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        var obj = getObjDom(element);

        obj.setAttribute('data-locked', false);

        changelockicon(element);
    }

    RedrawPolygonDots();
    RedrawPolylineDots();
}

function ToggleLock() {

    var elements = document.getElementsByClassName("ActiveSelected");
    var element = null;

    var outer = 9999999999;

    var locked = false;

    if (elements.length > 0) {
        element = elements[0];

        var obj = getObjDom(element);

        if (obj.getAttribute("data-locked")) {

            locked = obj.getAttribute("data-locked") == "true" ? true : false;

        }

    }

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        var obj = getObjDom(element);

        if (locked) {
            obj.setAttribute('data-locked', false);
        }
        else {
            obj.setAttribute('data-locked', true);
        }

        changelockicon(element);
    }

    RedrawPolygonDots();
    RedrawPolylineDots();
    RedrawBorders();

}

function RotateObjectOld() {

    var elements = document.querySelectorAll('.ActiveSelected');
    var element = null;

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        var obj = getObjDom(element);

        if (element.getAttribute('name') === 'SVGObject') {

            var currentrotation = 0;

            if (obj.style.transform) {

                if (obj.style.transform.includes("rotate")) {
                    var rotatestartindex = obj.style.transform.indexOf("rotate");
                    var rotateendindex = obj.style.transform.indexOf("deg");

                    var rotate = obj.style.transform.substring(rotatestartindex + 7, rotateendindex);

                    obj.style.transform = obj.style.transform.slice(rotatestartindex - 1, rotateendindex + 3);

                    obj.style.transformOrigin = "50 50";
                    /*obj.style.transformBox = "fill-box";*/

                    currentrotation = parseInt(rotate)

                }

            }

            var oldrotation = currentrotation;

            currentrotation = currentrotation + 45;

            if (currentrotation >= 360) {
                currentrotation = 0;
            }

            if (currentrotation == 90 || currentrotation == 270) {
                /*obj.style.transformOrigin = "0% 100%";*/

                var width = element.style.width;
                var height = element.style.height;

                element.style.width = height;
                element.style.height = width;

                obj.setAttribute("height", height);
                obj.setAttribute("width", width);

                RedimensionRotatedSVG(obj);

            }

            if (currentrotation == 0 || currentrotation == 180) {
                /*obj.style.transformOrigin = "0% 100%";*/

                var width = element.style.width;
                var height = element.style.height;

                element.style.width = height;
                element.style.height = width;

                obj.setAttribute("height", width);
                obj.setAttribute("width", height);

                obj.style.marginTop = "0px";
                obj.style.marginLeft = "0px";
            }

            obj.style.transform = obj.style.transform + " rotate(" + currentrotation + "deg)";

            obj.setAttribute('data-objectrotation', currentrotation);
        }
    }

}
function RotateObject() {

    var elements = document.querySelectorAll('.ActiveSelected');
    var element = null;

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        var obj = getObjDom(element);

        var oldrotation = 0;

        if (obj.getAttribute("data-transformrotate")) {
            oldrotation = parseFloat(obj.getAttribute("data-transformrotate"));
        }

        currentrotation = oldrotation + 45;

        if (currentrotation >= 360) {
            currentrotation = 0;
        }

        //console.log(currentrotation);

        obj.setAttribute('data-transformrotate', currentrotation);

        transformrotate = obj.getAttribute("data-transformrotate");

        if (obj.parentElement.getAttribute('name') === 'SVGObject') {

            RotationAnimation(obj);

            ResetDimensionsSVG(obj);

        }
    }

}

function FlipHorizontally() {

    var elements = document.querySelectorAll('.ActiveSelected');
    var element = null;

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        var obj = getObjDom(element);

        if (element.getAttribute('name') === 'SVGObject') {

            if (obj.style.transform) {
                if (obj.style.transform.includes(" scale(-1, 1)")) {
                    obj.style.transform = obj.style.transform.replace(" scale(-1, 1)", "");
                }
                else {
                    obj.style.transform = obj.style.transform + " scale(-1, 1)";
                }
            }
            else {
                obj.style.transform = " scale(-1, 1)";
            }

        }
    }

}

function FlipVertically() {

    var elements = document.querySelectorAll('.ActiveSelected');
    var element = null;

    for (var i = 0; i < elements.length; i++) {

        element = elements[i];

        var obj = getObjDom(element);

        if (element.getAttribute('name') === 'SVGObject') {

            if (obj.style.transform) {
                if (obj.style.transform.includes(" scale(1, -1)")) {
                    obj.style.transform = obj.style.transform.replace(" scale(1, -1)", "");
                }
                else {
                    obj.style.transform = obj.style.transform + " scale(1, -1)";
                }
            }
            else {
                obj.style.transform = " scale(1, -1)";
            }

        }
    }

}

function ToggleDisplay(el) {

    if (el.style.display === "none") {
        el.style.display = "block";
    }
    else {
        el.style.display = "none";
    }
}

function ObjectHasAction(ObjDom) {

    const dataAttr = ObjDom.getAttribute("data-actions");

    // Check if the attribute exists and is not null or empty
    if (!dataAttr) {
        return false;
    }

    let actions;

    try {
        actions = JSON.parse(dataAttr);
    } catch (e) {
        // Invalid JSON
        return false;
    }

    if (Array.isArray(actions)) {
        for (const item of actions) {
            const action = Object.keys(item)[0];
            if (action && action !== "None") {
                return true;
            }
        }
    }

    return false;
}
