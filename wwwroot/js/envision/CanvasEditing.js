// Envision CanvasEditing - Canvas editing: drag/drop, selection, resize, edit mode, selection info texts.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

// Will be called when user starts dragging an element
function StartDragObject(elem) {

    //console.log(document.activeElement.parentElement.getAttribute('name'));

    if (!EditMode) { //avoid dragging when editing the label
        let activeElement = document.activeElement.parentElement.getAttribute('name');
        if (activeElement == "LabelObject" || activeElement == "InputObject") {
            return;
        }
    }

    //console.log('drag init');

    DraggingCounter = 0;

    DisableSelectables();

    // Store the object of the element which needs to be moved
    selected = elem;

    // avoid dragging inner elements together with group when both are selected

    // find higest selected group
    var topactiveparent = selected.parentElement;
    var temptopactiveparent = topactiveparent;
    var activeparenttop;

    while (temptopactiveparent.getAttribute('name') === "GroupObject") {

        if (temptopactiveparent.classList.contains("ActiveSelected")) {
            activeparenttop = temptopactiveparent;
        }

        temptopactiveparent = temptopactiveparent.parentElement;
    }

    if (activeparenttop) {
        topactiveparent = activeparenttop;
    }

    if (topactiveparent.getAttribute('name') === "GroupObject" && topactiveparent.classList.contains("ActiveSelected")) {

        var innerelements = topactiveparent.getElementsByClassName("draggable");

        for (var i = 0; i < innerelements.length; i++) {

            var innerelement = innerelements[i];

            ClassListRemoveSelectedActive(innerelement);

        }

        selected = topactiveparent;
    }

    if (selected.getAttribute('name') === "GroupObject") {

        var innerelements = selected.getElementsByClassName("draggable");

        for (var i = 0; i < innerelements.length; i++) {

            var innerelement = innerelements[i];

            ClassListRemoveSelectedActive(innerelement);

        }
    }

    // CODE TO MAKE DoDragObject WORK WHEN ZOOMED - - - - - 
    var viewer = document.getElementById("EnvisionPage");

    var transform = viewer.style.transform;

    if (transform !== 'scale(1)' || transform !== 'scale(1.0)') {
        var positionopenscale = transform.indexOf("scale") + 6;
        var positionclosescale = transform.indexOf(", ", positionopenscale);

        if (positionclosescale == -1) {
            positionclosescale = transform.indexOf(")", positionopenscale);
        }

        transform = transform.substr(positionopenscale, positionclosescale - positionopenscale);
    }
    else {
        if (transform == "") {
            transform = "1.0";
        }
        else {
            transform = transform.replace("scale(", "");
            transform = transform.replace(")", "");
        }
    }

    var rect = viewer.getBoundingClientRect();

    x_pos = (x_pos - rect.left) * (1 / transform);
    y_pos = (y_pos - rect.top) * (1 / transform);

    x_elem = x_pos - selected.offsetLeft;
    y_elem = y_pos - selected.offsetTop;

    
    // - - - - - - - - - - - - - - - - - - - - 

    //TODO: set to envision page
    var selectedelements = document.getElementsByClassName("ActiveSelected");
    
    for (var i = 0; i < selectedelements.length; i++) {

        var selectedelement = selectedelements[i];

        x_elemselected[i] = x_pos - selectedelement.offsetLeft;
        y_elemselected[i] = y_pos - selectedelement.offsetTop;

    }

    LastSelectedActive = selected;


    SetResetTexts();
    ResetBorders();
}

async function SelectObject(elem) {

    if (CtrlKeyPressed === false) { // if CtrlKey is not pressed, remove all selections

        let selectedelements = document.getElementsByClassName("ActiveSelected");

        if (selectedelements != null) {

            if (CtrlKeyPressed == false) {
                DeselectAllObjects();
            }
        }

    }

    //select item

    if (elem.parentElement.getAttribute('name') == "GroupObject" && !AltKeyPressed) {

        if (ShiftKeyPressed === true) {
            // GET FIRST GROUP
            elem = elem.parentElement;
        }
        else {
            // GET TOP MOST PARENT GROUPOBJECT
            while (elem.parentElement.getAttribute('name') == "GroupObject") {
                elem = elem.parentElement;
            }
        }
    }

    //console.log(elem); // selected item
    ClassListAddSelectedActive(elem);

    if (ObjectViewerOpen) {

        var ObjectViewerName = document.getElementById("ObjectViewerName_" + elem.id);

        if (ObjectViewerName) {
            ObjectViewerSetSelectObject(elem.id);
        }
        
    }

    SetResetTexts();
}

function GetTopMostParentGroupObjectSelectables(elem) {

    // GET TOP MOST PARENT GROUPOBJECT

    if (elem.parentElement.getAttribute('name') == "GroupObject") {
        while (elem.parentElement.getAttribute('name') == "GroupObject") {
            elem = elem.parentElement;
        }
    }
    else {
        return elem;
    }

    return elem;
}


function SelectGroupAll(group) {

    //console.log('selecting all');
    // Select all objects within the same group

    if (!AltKeyPressed) {

        var elements = group.getElementsByClassName("draggable");
        var element = null;

        ClassListAddSelectedActive(group);

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            ClassListRemoveSelectedActive(element);
            
            //if (!element.className.includes('ActiveSelected')) {
            //    /*ClassListAddSelectedActive(element);*/
            //    ClassListAddSelectedActiveNoLines(element);
            //}
            //else {
            //    ClassListRemoveSelectedActive(element);
            //    ClassListAddSelectedActiveNoLines(element);
            //}
        }

        //DrawGroupLine(group);

        SetResetTexts();
    }

}

function SelectAllObjects() {

    if (EditMode === true) {

        var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
        var element = null;

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];

            ClassListAddSelectedActive(element);

        }

        SetResetTexts();
    }
}

function ClassListAddSelectedActive(element) { //careful, gets executed alot
    element.classList.add("ActiveSelected");
    LastSelectedActive = element;
}

function ClassListAddSelectedActiveNoLines(element) { // no longer used?
    element.classList.add("ActiveSelected");
}

function ClassListRemoveSelectedActive(element) { //careful, gets executed alot
    element.classList.remove("ActiveSelected");
}

//function SetResetTexts(element) {

//    if (EditMode === true) { // FOR POPUP

//        var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

//        for (var i = 0; i < draggables.length; i++) {

//            var element = draggables.item(i);

//            if (element.className.includes('ActiveSelected')) {

//                var coords = getCoords(element);

//                if (element.id == LastSelectedActive.id) {

//                    let compStyles = window.getComputedStyle(element);
//                    var positiontext = document.getElementById(element.id + "_positiontext");
//                    if (!positiontext) {
//                        positiontext = document.createElement("div");
//                        positiontext.className = "positiontext";
//                        positiontext.id = element.id + "_positiontext";
//                        document.getElementById("EnvisionPage").appendChild(positiontext);
//                    }

//                    positiontext.style.top = (coords.top - 24) + "px";
//                    positiontext.style.left = (coords.left - 125) + "px";

//                    positiontext.innerHTML = "T" + compStyles.getPropertyValue('top') + " ∼ L" + compStyles.getPropertyValue('left');

//                    SetScreenPositionText(element, coords);

//                    var resizertext = document.getElementById(element.id + "_resizertext");
//                    if (!resizertext) {
//                        resizertext = document.createElement("div");
//                        resizertext.className = "resizertext";
//                        resizertext.id = element.id + "_resizertext";
//                        document.getElementById("EnvisionPage").appendChild(resizertext);
//                    }

//                    resizertext.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) + 5) + "px";
//                    resizertext.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 10) + "px";


//                    resizertext.innerHTML = "H" + compStyles.getPropertyValue('height') + " ∼ W" + compStyles.getPropertyValue('width');

//                    var zindextext = document.getElementById(element.id + "_zindextext");
//                    if (!zindextext) {
//                        zindextext = document.createElement("div");
//                        zindextext.className = "zindextext";
//                        zindextext.id = element.id + "_zindextext";
//                        document.getElementById("EnvisionPage").appendChild(zindextext);
//                    }


//                    if (compStyles.getPropertyValue('z-index') !== 'auto') {
//                        zindextext.innerHTML = "Layer " + compStyles.getPropertyValue('z-index');
//                    }
//                    else {
//                        zindextext.innerHTML = compStyles.getPropertyValue('z-index');
//                    }

//                    zindextext.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) + 25) + "px";
//                    zindextext.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 10) + "px";

//                }
//                else {
//                    RemoveInfoTexts(element, false);
//                    RemoveBorders(element);
//                }

//                // Lock info
//                var lockinfo = document.getElementById(element.id + "_lockinfo");

//                if (!lockinfo) {
//                    lockinfo = changelockicon(element);
//                }

//                lockinfo.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) - 22) + "px";
//                lockinfo.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 10) + "px";

//                // Scale info
//                var scaleinfo = document.getElementById(element.id + "_scaleinfo");

//                if (!scaleinfo) {
//                    scaleinfo = changescaleicon(element);
//                }

//                scaleinfo.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) - 21) + "px";
//                scaleinfo.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 25) + "px";

//            }
//            else {
//                RemoveInfoTexts(element, true);
//                RemoveBorders(element);
//            }
//        }
//    }

//}

function SetResetTexts(element) {

    if (!EditMode) return; // FOR POPUP 

    const viewer = document.getElementById("EnvisionPage");
    const viewerRect = viewer.getBoundingClientRect();

    function parseScale(transform) {
        if (!transform) return 1;
        const idx = transform.indexOf("scale(");
        if (idx === -1) return 1;
        const start = idx + 6;
        const end = transform.indexOf(")", start);
        if (end === -1) return 1;
        const inside = transform.substring(start, end).trim();
        const parts = inside.split(",");
        const s = parseFloat(parts[0]);
        return (!isNaN(s) && s > 0) ? s : 1;
    }

    const pageScale = parseScale(viewer.style.transform);

    var draggables = viewer.getElementsByClassName("draggable");

    for (var i = 0; i < draggables.length; i++) {

        var element = draggables.item(i);

        if (element.closest && element.closest('[data-system-mapchild="true"]')) {
            continue;
        }

        if (element.className.includes('ActiveSelected')) {

            // logical coords via your original helper (for screen text / snapping etc.)
            var coords = getCoords(element);

            // visual box in screen space
            const rect = element.getBoundingClientRect();

            // raw design-space coords inside EnvisionPage
            const rawTop = (rect.top - viewerRect.top) / pageScale;
            const rawLeft = (rect.left - viewerRect.left) / pageScale;
            const rawWidth = rect.width / pageScale;
            const rawHeight = rect.height / pageScale;

            // rounded
            const top = Math.round(rawTop);
            const left = Math.round(rawLeft);
            const width = Math.round(rawWidth);
            const height = Math.round(rawHeight);

            if (element.id == LastSelectedActive.id) {

                let compStyles = window.getComputedStyle(element);

                // POSITION TEXT
                var positiontext = document.getElementById(element.id + "_positiontext");
                if (!positiontext) {
                    positiontext = document.createElement("div");
                    positiontext.className = "positiontext";
                    positiontext.id = element.id + "_positiontext";
                    viewer.appendChild(positiontext);
                }

                positiontext.style.top = (top - 24) + "px";
                positiontext.style.left = (left - 125) + "px";
                // match SetTexts style (using the positioned value)
                positiontext.innerHTML = "T" + compStyles.getPropertyValue('top') + " ∼ L" + compStyles.getPropertyValue('left');

                // still use your logical coords here
                SetScreenPositionText(element, coords);

                // RESIZER TEXT
                var resizertext = document.getElementById(element.id + "_resizertext");
                if (!resizertext) {
                    resizertext = document.createElement("div");
                    resizertext.className = "resizertext";
                    resizertext.id = element.id + "_resizertext";
                    viewer.appendChild(resizertext);
                }

                resizertext.style.top = (top + height + 5) + "px";
                resizertext.style.left = (left + width + 10) + "px";

                resizertext.innerHTML = "H" + compStyles.getPropertyValue('height') + " ∼ W" + compStyles.getPropertyValue('width');

                // Z-INDEX TEXT
                var zindextext = document.getElementById(element.id + "_zindextext");
                if (!zindextext) {
                    zindextext = document.createElement("div");
                    zindextext.className = "zindextext";
                    zindextext.id = element.id + "_zindextext";
                    viewer.appendChild(zindextext);
                }

                if (compStyles.getPropertyValue('z-index') !== 'auto') {
                    zindextext.innerHTML = "Layer " + compStyles.getPropertyValue('z-index');
                } else {
                    zindextext.innerHTML = compStyles.getPropertyValue('z-index');
                }

                zindextext.style.top = (top + height + 25) + "px";
                zindextext.style.left = (left + width + 10) + "px";

                // Scale info
                var scaleinfo = document.getElementById(element.id + "_scaleinfo");
                scaleinfo = changescaleicon(element);

                scaleinfo.style.top = (top + height - 21) + "px";
                scaleinfo.style.left = (left + width + 25) + "px";

            } else {
                RemoveInfoTexts(element, false);
                RemoveBorders(element);
            }

            // Lock info
            var lockinfo = document.getElementById(element.id + "_lockinfo");
            if (!lockinfo) {
                lockinfo = changelockicon(element);
            }
            lockinfo.style.top = (top + height - 22) + "px";
            lockinfo.style.left = (left + width + 10) + "px";

        } else {
            RemoveInfoTexts(element, true);
            RemoveBorders(element);
        }
    }
}


//function SetTexts(element) {

//    if (EditMode) {
//        var coords = getCoords(element);

//        var positiontext = document.getElementById(element.id + "_positiontext");
//        positiontext.style.top = (coords.top - 24) + "px";
//        positiontext.style.left = (coords.left - 125) + "px";
//        positiontext.innerHTML = "T" + element.style.top + " ∼ L" + element.style.left;

//        var resizertext = document.getElementById(element.id + "_resizertext");
//        resizertext.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) + 5) + "px";
//        resizertext.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 10) + "px";

//        var zindextext = document.getElementById(element.id + "_zindextext");
//        zindextext.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) + 25) + "px";
//        zindextext.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 10) + "px";

//        var lockinfo = document.getElementById(element.id + "_lockinfo");
//        lockinfo.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) - 22) + "px";
//        lockinfo.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 10) + "px";

//        var scaleinfo = document.getElementById(element.id + "_scaleinfo");
//        scaleinfo.style.top = (coords.top + parseFloat(element.style.height.replace('px', '')) - 21) + "px";
//        scaleinfo.style.left = (coords.left + parseFloat(element.style.width.replace('px', '')) + 25) + "px";

//        SetScreenPositionText(element, coords)
//    }
//}

function SetTexts(element) {

    if (!EditMode) return;

    var coords = getCoords(element);

    const viewer = document.getElementById("EnvisionPage");
    const viewerRect = viewer.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    function parseScale(transform) {
        if (!transform) return 1;
        const idx = transform.indexOf("scale(");
        if (idx === -1) return 1;
        const start = idx + 6;
        const end = transform.indexOf(")", start);
        if (end === -1) return 1;
        const inside = transform.substring(start, end).trim();
        const parts = inside.split(",");
        const s = parseFloat(parts[0]);
        return (!isNaN(s) && s > 0) ? s : 1;
    }

    const pageScale = parseScale(viewer.style.transform);

    // raw design-space coords
    const rawTop = (rect.top - viewerRect.top) / pageScale;
    const rawLeft = (rect.left - viewerRect.left) / pageScale;
    const rawWidth = rect.width / pageScale;
    const rawHeight = rect.height / pageScale;

    // rounded for use in styles / texts
    const top = Math.round(rawTop);
    const left = Math.round(rawLeft);
    const width = Math.round(rawWidth);
    const height = Math.round(rawHeight);

    let compStyles = window.getComputedStyle(element);

    // POSITION TEXT
    var positiontext = document.getElementById(element.id + "_positiontext");
    positiontext.style.top = (top - 24) + "px";
    positiontext.style.left = (left - 125) + "px";
    positiontext.innerHTML = "T" + compStyles.getPropertyValue('top') + " ∼ L" + compStyles.getPropertyValue('left');

    // RESIZER TEXT
    var resizertext = document.getElementById(element.id + "_resizertext");
    resizertext.style.top = (top + height + 5) + "px";
    resizertext.style.left = (left + width + 10) + "px";

    // Z-INDEX TEXT
    var zindextext = document.getElementById(element.id + "_zindextext");
    zindextext.style.top = (top + height + 25) + "px";
    zindextext.style.left = (left + width + 10) + "px";

    // LOCK INFO
    var lockinfo = document.getElementById(element.id + "_lockinfo");
    lockinfo.style.top = (top + height - 22) + "px";
    lockinfo.style.left = (left + width + 10) + "px";

    // SCALE INFO
    var scaleinfo = document.getElementById(element.id + "_scaleinfo");
    scaleinfo.style.top = (top + height - 21) + "px";
    scaleinfo.style.left = (left + width + 25) + "px";

    SetScreenPositionText(element, coords);
}


function SetScreenPositionText(element, coords) {
    if (element.parentElement.getAttribute('name') !== "PageObject") { // then it is inside a group

        if (element.getAttribute('name') === "GroupObject") {
            //necessary because groups have a 1px margin
            coords.top = coords.top + linewidth;
            coords.left = coords.left + linewidth;
        }
        else {
            var topmost = GetTopMostParentGroupObject(element);

            if (topmost) {
                coords.top = coords.top + linewidth;
                coords.left = coords.left + linewidth;
            }
        }

        var screenpositiontext = document.getElementById(element.id + "_screenpositiontext");
        if (!screenpositiontext) {
            screenpositiontext = document.createElement("div");
            screenpositiontext.className = "screenpositiontext";
            screenpositiontext.id = element.id + "_screenpositiontext";
            document.getElementById("EnvisionPage").appendChild(screenpositiontext);
        }

        screenpositiontext.style.top = (coords.top - 45) + "px";
        screenpositiontext.style.left = (coords.left - 125 - linewidth) + "px";
        screenpositiontext.innerHTML = "T" + coords.top + "px ∼ L" + coords.left + "px";
    }
}

function RemoveInfoTexts(element, removelock) { 

    var zindextext = document.getElementById(element.id + "_zindextext");
    if (zindextext) {
        zindextext.remove();
    }

    var elementidtext = document.getElementById(element.id + "_elementidtext");
    if (elementidtext) {
        elementidtext.remove();
    }

    var positiontext = document.getElementById(element.id + "_positiontext");
    if (positiontext) {
        positiontext.remove();
    }

    var screenpositiontext = document.getElementById(element.id + "_screenpositiontext");
    if (screenpositiontext) {
        screenpositiontext.remove();
    }

    var resizertext = document.getElementById(element.id + "_resizertext");
    if (resizertext) {
        resizertext.remove();
    }

    if (removelock) {
        var lockinfo = document.getElementById(element.id + "_lockinfo");
        if (lockinfo) {
            lockinfo.remove();
        }
    }

    var scaleinfo = document.getElementById(element.id + "_scaleinfo");
    if (scaleinfo) {
        scaleinfo.remove();
    }


}

function RemoveLockInfo(element) {
    var lockinfo = document.getElementById(element.id + "_lockinfo");
    if (lockinfo) {
        lockinfo.remove();
    }
}

function changelockicon(element) {

    var lockinfo = document.getElementById(element.id + "_lockinfo");

    if (!lockinfo) {

        lockinfo = document.createElement("div");
        lockinfo.className = "lockinfo";
        lockinfo.id = element.id + "_lockinfo";
        
        document.getElementById("EnvisionPage").appendChild(lockinfo);
        
        //lockinfo.style.scale = 1 / scale;
    }
    
    var ObjDom = getObjDom(element);

    var locked = false;

    if (ObjDom.getAttribute("data-locked")) {

        locked = ObjDom.getAttribute("data-locked") == "true" ? true : false;
    }

    if (locked === true) {
        lockinfo.innerHTML =
            `<div style="height:12.5px;width:12.5px;fill:indianred;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"/></svg></div>`
            ;
    }
    else {
        lockinfo.innerHTML =
            `<div style="height:12.5px;width:12.5px;fill:mediumseagreen;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M144 144c0-44.2 35.8-80 80-80c31.9 0 59.4 18.6 72.3 45.7c7.6 16 26.7 22.8 42.6 15.2s22.8-26.7 15.2-42.6C331 33.7 281.5 0 224 0C144.5 0 80 64.5 80 144v48H64c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64H144V144z"/></svg></div>`
            ;
    }

    return lockinfo;
}

function changescaleicon(element) {

    var scaleinfo = document.getElementById(element.id + "_scaleinfo");

    if (!scaleinfo) {

        scaleinfo = document.createElement("div");
        scaleinfo.className = "scaleinfo";
        scaleinfo.id = element.id + "_scaleinfo";

        document.getElementById("EnvisionPage").appendChild(scaleinfo);

        //scaleinfo.style.scale = 1 / scale;
    }

    var ObjDom = getObjDom(element);

    var scaled = false;

    if (hasInlineScale(ObjDom)) {

        scaled = true;
    }

    if (scaled === true) {

        var factor = extractScale(element.style.transform);

        scaleinfo.innerHTML =
            "SCALED " + factor
            ;
    }
    else {
        scaleinfo.innerHTML =
            ``
            ;
    }

    return scaleinfo;
}

function ResetTexts() {

    if (EditMode === true) { // FOR POPUP 

        var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

        for (var i = 0; i < draggables.length; i++) {

            var element = draggables.item(i);

            var zindextext = document.getElementById(element.id + "_zindextext");
            if (zindextext) {
                zindextext.remove();
            }

            var elementidtext = document.getElementById(element.id + "_elementidtext");
            if (elementidtext) {
                elementidtext.remove();
            }

            var positiontext = document.getElementById(element.id + "_positiontext");
            if (positiontext) {
                positiontext.remove();
            }

            var screenpositiontext = document.getElementById(element.id + "_screenpositiontext");
            if (screenpositiontext) {
                screenpositiontext.remove();
            }

            var resizertext = document.getElementById(element.id + "_resizertext");
            if (resizertext) {
                resizertext.remove();
            }

            var lockinfo = document.getElementById(element.id + "_lockinfo");
            if (lockinfo) {
                lockinfo.remove();
            }

            var scaleinfo = document.getElementById(element.id + "_scaleinfo");
            if (scaleinfo) {
                scaleinfo.remove();
            }

        }
    }

}

function DeselectAllObjects() {

    if (typeof MapClearMapChildDecoration === "function") MapClearMapChildDecoration();

    /* if (EditMode === true) {*/
    if (true) { // FOR POPUP

        //console.log(CtrlKeyPressed);
        var elements = document.getElementsByClassName("ActiveSelected");
        var element = null;

        for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

            element = elements[i - 1];
            ClassListRemoveSelectedActive(element);

            if (ObjectViewerOpen) {

                var ObjectViewerName = document.getElementById("ObjectViewerName_" + element.id);

                if (ObjectViewerName) {
                    ObjectViewerResetSelectObject(element.id);
                }

            }

        }


        //TODO : REMOVE?
        //var elements = document.getElementById("EnvisionPage").getElementsByClassName("GroupLine");

        //for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        //    element = elements[i - 1];

        //    element.remove();

        //}

    }

    //close all context menu's here
    ClosePolygonDotContextMenu();
    ClosePolylineDotContextMenu();

    SetResetTexts();

}

// Will be called when user dragging an element
function DoDragObject(e) {
    
    //console.log("onMouseMove " + e.pageX + " " + e.pageY);

    //console.log(document.activeElement.parentElement.getAttribute('name'));
    if (!EditMode) { //avoid dragging when editing the label
        let activeElement = document.activeElement.parentElement.getAttribute('name');
        if (activeElement == "LabelObject" || activeElement == "InputObject") {
            return;
        }
    }

    if (SendUserNotice === true) {

        //console.log('Send User Notice')
        UserActiveNotice();

        SendUserNotice = false;
    }

    if (e.type == "touchmove") {
        x_pos = e.touches[0].clientX;
        y_pos = e.touches[0].clientY;
    }
    else {
        x_pos = document.all ? window.event.clientX : e.pageX;
        y_pos = document.all ? window.event.clientY : e.pageY;
    }

    if (DrawingLine) {
        DrawLineHelper(x_pos, y_pos);
    }

    if (draggingcolumn) {
        return;
    }

    
    if (selected !== null) {
        LastSelectedActive = selected;

        if (IsPartOfScaledGroupObject(selected)) {
            //console.log('drag blocked');
            MoveInternalScaledError();
            selected = null;
            return;
        }

        /*console.log("selected " + selected);*/
        DraggingCounter++;

        if (DraggingCounter < 5) { // introduce delay to avoid accidental drags
            return;
        }

        DraggingElement = true;

        // SCALING

        var viewer = document.getElementById("EnvisionPage");

        var transform = viewer.style.transform;

        if (transform !== 'scale(1)' || transform !== 'scale(1.0)') {
            var positionopenscale = transform.indexOf("scale") + 6;
            var positionclosescale = transform.indexOf(", ", positionopenscale);

            if (positionclosescale == -1) {
                positionclosescale = transform.indexOf(")", positionopenscale);
            }

            //console.log('open ' + positionopenscale);
            //console.log('close ' + positionclosescale);
            transform = transform.substr(positionopenscale, positionclosescale - positionopenscale);
        }
        else {
            if (transform == "") {
                transform = "1.0";
            }
            else {
                transform = transform.replace("scale(", "");
                transform = transform.replace(")", "");
            }
        }
        
        var rect = viewer.getBoundingClientRect();

        if (selected.style.position !== "relative") {
            
            // CODE TO MAKE DoDragObject WORK WHEN ZOOMED - - - - - 
            x_pos = (x_pos - rect.left) * (1 / transform);
            y_pos = (y_pos - rect.top) * (1 / transform);
            
            if (CheckLocked(selected) === false) {
                selected.style.left = roundDownToNearestX(x_pos - x_elem) + 'px';
                selected.style.top = roundDownToNearestX(y_pos - y_elem) + 'px';
            }
            else {
                StopDragElement();
            }

        }

        //ALL ACTIVE SELECTED ELEMENTS : 

        var selectedelements = document.getElementsByClassName("ActiveSelected");

        var roundDownToNearestXdecided = null;
        var roundDownToNearestXdecided = null;

        for (var i = 0; i < selectedelements.length; i++) {

            var selectedelement = selectedelements[i];

            if (selectedelement.getAttribute('name') == "PolylineObject") {
                var ObjDom = getObjDom(selectedelement);
                RedrawPolylineBorder(ObjDom);
                //ResetPolylineBorders(ObjDom.parentElement);
            }

            if (selectedelement.getAttribute('name') == "GroupObject") {
                ResetPolylineBorders(selectedelement);
            }

            if (selected.id != selectedelement.id) {

                if (selectedelement.style.position !== "relative") {

                    if (CheckLocked(selectedelement) === false) {
                        selectedelement.style.left = roundDownToNearestX(x_pos - x_elemselected[i]) + 'px';
                        selectedelement.style.top = roundDownToNearestX(y_pos - y_elemselected[i]) + 'px';
                        RemoveLockInfo(selectedelement);
                    }

                }
            }
        }

        SetTexts(LastSelectedActive);
    }


}

function ApplyRuntimeCursors() {
    var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var ObjDom = getObjDom(element);
        var ObjName = element.getAttribute("name");
        if (ObjectHasAction(ObjDom)) {
            if (ObjName == "PolylineObject") {
                const poly = element.querySelector('.poly-visible');
                if (poly) poly.style.cursor = 'pointer';
            } else {
                element.style.cursor = "pointer";
            }
        } else {
            if (ObjName == "PolylineObject") {
                const poly = element.querySelector('.poly-visible');
                if (poly) poly.style.cursor = 'default';
            } else {
                element.style.cursor = "default";
            }
        }
    }
}

function DisableEditModeBtn() {
    DeselectAllObjects();
    DisableEditMode();
}


async function DisableEditMode() {

    document.getElementById('EnvisionPage').focus();

    try {
        var a = document.getElementById('s-rectBox');
        a.parentNode.removeChild(a);

    } catch (error) {
        //console.error(error);
    }

    DisableIsBackground();
    RemovePolygonDots();
    RemovePolylineDots();
    RemovePolylineHits();
    UnhideObjects();
    UnshowObjects();

    ResetOnEnters();

    closemenu();
    closeconfigs();

    if (ShowHidden) {
        ToggleInvisible();
    }

    document.getElementById("TheGrid").style.display = "none";
    document.getElementById("TheGridDetails").style.display = "none";
    document.getElementById("ClientPerformance").style.display = "none";
    document.getElementById("CenterCross").style.display = "none";
    document.getElementById("PageInfo").style.display = "none";

    if (EditMode === true) {

        var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
        var element = null;

        for (var i = 0; i < elements.length; i++) {

            var element = elements[i];

            element.removeEventListener("mousedown", SetDragConditions, false);
            element.removeEventListener("mousedown", SetDragConditionsNoDrag, false);

            document.getElementById("EnvisionPage").removeEventListener("mousedown", OpenContextPage, false);

            RemoveInfoTexts(element, true); // true: the lock icon is edit-mode decoration too, never leave it behind in runtime
            RemoveBorders(element);

            //var resizerright = element.getElementsByClassName("resizer-right")[0];
            //if (resizerright) {
            //    resizerright.remove();
            //}

            //var resizerbottom = element.getElementsByClassName("resizer-bottom")[0];
            //if (resizerbottom) {
            //    resizerbottom.remove();
            //}

            //var resizerboth = element.getElementsByClassName("resizer-both")[0];
            //if (resizerboth) {
            //    resizerboth.remove();
            //}

        }

        var elements = document.getElementById("EnvisionPage").getElementsByClassName("linebox");
        var element = null;

        for (var i = 0; i < elements.length; i++) {

            var element = elements[i];

            element.removeEventListener("mousedown", initdragline, false);
        }


        DisableSelectables();

        ResetAllLabelsReadable();

        RemovePolygonDots();

        RemovePolylineDots();

        RemovePolylineHits();

        ApplyRuntimeCursors();

        EditMode = false;

        // Hand the Leaflet handlers back: a map is only inert while editing (or when its own
        // Lock View is set), otherwise the operator could not pan or zoom it.
        if (typeof MapApplyInteractionAll === "function") MapApplyInteractionAll();

        $('iframe').css("pointer-events", "auto");
    }

    //console.log('close menu');
    document.getElementById("LeftMenuBox").style.display = "none";
    closemenu();

    MakeAllPopupsEditableRestore(); // does initdraggable to make popups draggable again
}

function EnableEditMode() {

    if (!ProgrammerMode) {
        //console.log('not permitted');
        return;
    }

    if (PageObjectsReplaced == "True"){
        PageReplacedWarning();
    }

    document.getElementById("LeftMenuBox").style.display = "block";
    
    //CloseAllPopups();

    EnableIsBackground();
    MakeAllPopupsEditable();

    CloseNumpad();
    CloseKeyboard();

    if (EditMode === false) {

        EditMode = true;

        // Make every map inert, otherwise its Leaflet handlers swallow the drag used to move the
        // MapObject itself and the map pans underneath instead of the object moving.
        if (typeof MapApplyInteractionAll === "function") MapApplyInteractionAll();

        initDraggable(); 
        initResizeElement();

        SetAllLabelsReadable();

        document.getElementById("TheGrid").style.display = "block";
        document.getElementById("TheGridDetails").style.display = "block";
        document.getElementById("ClientPerformance").style.display = "flex";
        document.getElementById("CenterCross").style.display = "block";
        document.getElementById("PageInfo").style.display = "block";

        document.getElementById("EnvisionPage").addEventListener("mousedown", OpenContextPage, false);

        EnableSelectables();
    }

    $('iframe').css("pointer-events", "none");

    RedrawPolygonDots();
    RedrawPolylineDots();
    RedrawPolylineHits();
    ResizeGrid();

    if (ObjectViewerOpen) {
        OpenObjectViewer()
    }
}


// ------------------
// A Read Only label is a display element, so in runtime it must not swallow a click meant for
// whatever sits underneath it - a button or a shape carrying the action. The whole object is made
// transparent to the mouse (the draggable wrapper, not just the textarea: the wrapper has no
// onclick of its own and would otherwise still catch the click and drop it), so the click reaches
// the object behind.
//
// Two deliberate limits. A label that has an action of its own is still a control and keeps
// receiving its clicks. And this is runtime-only: in edit mode the designer has to be able to
// select, drag and resize the label, so `runtime` is passed in by the caller rather than read from
// EditMode - DisableEditMode() calls ResetAllLabelsReadable() BEFORE it clears the flag, so reading
// EditMode here would get the stale value.
function ApplyLabelClickThrough(LabelObject, runtime) {

    var dom = getObjDom(LabelObject);

    if (!dom) {
        return;
    }

    // Is Background objects (EnableIsBackground) and objects masked inside a group
    // (MaskObjectsInsideGroup) already drive pointer-events for their own reasons and set it back
    // to "auto", not "". Those owners win: only hand back a label this function itself took.
    var owned = LabelObject.hasAttribute('data-isbackground') || LabelObject.hasAttribute('data-maskedobject');

    var clickthrough = !owned
        && runtime
        && dom.getAttribute('data-readonly') == 'true'
        && !ObjectHasAction(dom);

    // The flag is a JS property, not a data-* attribute: it is runtime-only state that must never be
    // saved into the page markup or picked up as a group symbol replacer target. It records only
    // that THIS function took the label, so the release below never clears a value someone else owns.
    //
    // "none" is re-asserted rather than written once, because the visibility animation writes
    // pointerEvents = "auto" onto the same wrapper the first time an object becomes visible. A
    // write-once guard lost that race and the label stayed clickable. Both sides compare before
    // writing, so this settles after one tick instead of fighting every tick.
    if (clickthrough) {
        LabelObject.__labelClickThrough = true;

        if (LabelObject.style.pointerEvents !== 'none') {
            LabelObject.style.pointerEvents = 'none';
        }
    }
    else if (LabelObject.__labelClickThrough) {
        LabelObject.__labelClickThrough = false;
        LabelObject.style.pointerEvents = '';
    }
}

function SetAllLabelsReadable() {

    var LabelObjects = document.querySelectorAll('[name="LabelObject"]')

    for (var i = 0; i < LabelObjects.length; i++) {

        var LabelObject = LabelObjects.item(i);
        var dom = getObjDom(LabelObject);
        dom.removeAttribute('readonly');
        dom.removeAttribute('onmousedown');
        dom.style.cursor = "text";

        // Editing: always clickable. This also keeps pointer-events out of the markup the designer
        // saves, since a save can only happen from edit mode.
        ApplyLabelClickThrough(LabelObject, false);
    }
}


function ResetAllLabelsReadable() {

    var LabelObjects = document.querySelectorAll('[name="LabelObject"]')

    for (var i = 0; i < LabelObjects.length; i++) {

        var LabelObject = LabelObjects.item(i);
        var dom = getObjDom(LabelObject);

        if (dom.getAttribute('data-readonly') == 'true') {
            dom.setAttribute('readonly', true);
            dom.setAttribute('onmousedown', "return false;");
            dom.style.cursor = "default";
        }
        else {
            dom.removeAttribute('readonly');
            dom.removeAttribute('onmousedown');
            dom.style.cursor = "text";
        }

        if (ObjectHasAction(dom)) {
            dom.style.cursor = "pointer";
        }

        ApplyLabelClickThrough(LabelObject, true);

    }
}


// Destroy the object when we are done
function StopDragElement() {

    selected = null; // popup uses this

    DraggingPopup = false;

    if (EditMode) { // added editmode 2024 06 20
        var selectedelements = document.getElementsByClassName("ActiveSelected");

        for (var i = 0; i < selectedelements.length; i++) {

            var selectedelement = selectedelements[i];

            // GET TOP MOST PARENT GROUPOBJECT ? 

            var countparents = 1;

            while (selectedelement.parentElement.getAttribute('name') == "GroupObject") {

                countparents = countparents + 1;
                selectedelement = selectedelement.parentElement;

                ResizeGroup2(selectedelement);
            }

        }

        if (selectedelements.length > 0 & DraggingElement) {

            // Dropping a group symbol instance onto a MapObject offers to make it a child of that
            // map. Runs before saveSnapshot so the snapshot captures the converted state and undo
            // steps back past the conversion. Edit mode only - we are already inside that guard.
            // Snapshot the list first: converting moves nodes, and ActiveSelected is live.
            if (typeof MapTryAdoptOnDrop === "function") {
                var dropped = Array.prototype.slice.call(selectedelements);
                for (var d = 0; d < dropped.length; d++) {
                    try { MapTryAdoptOnDrop(dropped[d]); } catch (e) { }
                }
            }

            saveSnapshot();
        }
        
        DraggingElement = false;
        SetBorders();
    }
    
}

function initDraggable() {
    
    var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

    //console.log('EditMode ' + EditMode);

    if (EditMode === false) {// FOR POPUP
        draggables = document.getElementById("EnvisionPage").getElementsByClassName("popup");
    }

    for (var i = 0; i < draggables.length; i++) {

        //console.trace(draggables.item(i).id)
        var element = draggables.item(i);

        if (!element.classList.contains('nodrag')) {
            element.addEventListener("mousedown", SetDragConditions, false);
            element.addEventListener("touchstart", SetDragConditions, false);

            element.style.cursor = "move";
        }
        else {
            element.addEventListener("mousedown", SetDragConditionsNoDrag, false);
        }

        
    }

}

//var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

//for (var i = 0; i < draggables.length; i++) {

//    //console.trace(draggables.item(i).id)
//    var element = draggables.item(i);

//    let compStyles = window.getComputedStyle(element);

//    element.addEventListener("mousedown", SetDragConditions, false);

//    element.style.cursor = "move";

//    var positiontext = document.createElement("div");
//    positiontext.innerHTML = compStyles.getPropertyValue('left') + " " + compStyles.getPropertyValue('top');
//    positiontext.className = "positiontext";
//    element.appendChild(positiontext);

//    var resizertext = document.createElement("div");
//    resizertext.innerHTML = compStyles.getPropertyValue('width') + " " + compStyles.getPropertyValue('height');
//    resizertext.className = "resizertext";
//    element.appendChild(resizertext);

//    var zindextext = document.createElement("div");
//    zindextext.innerHTML = compStyles.getPropertyValue('z-index');
//    zindextext.className = "zindextext";
//    element.appendChild(zindextext);
//}

function SetDragConditions(ev) {

    // Opt-out: any element (or descendant of an element) tagged
    // data-noselect="true" is excluded from the widget drag/select machinery.
    // Used by MapObject map-owned GroupSymbol children whose position
    // is owned by lat/lon, not by user drag. Returning without stopPropagation
    // lets the click bubble up to the master's own click handler (e.g. OpenPopup).
    if ((this.hasAttribute && this.hasAttribute("data-noselect")) ||
        (this.closest && this.closest('[data-noselect="true"]'))) {
        return;
    }

    //console.log(this.id);

    if (ev.which == 3) {
        
        //console.log('right click');

        //RightClickedObjectId = this.id;

        //todo: document. -> replace envisionpage
        //var elements = document.getElementsByClassName("ActiveSelected");

        //console.log(this);

        if (document.getElementById(this.id).classList.contains("ActiveSelected")) {
            
            if (!document.getElementById(this.id).classList.contains('popup')) {
                RightClickedObjectId = this.id;

                if (!CtrlKeyPressed) {
                    showmulticontextmenu(ev);
                }
                else {
                    ev.stopPropagation();
                    OpenObjectViewer();
                    return;
                }

            }

        }
        else {
            /*console.log('right clicked');*/
        }

        callobjectcontext = true;

    }
    else if (ev.which == 1) {

        //console.log("click on " + this.id);
        //console.log(this.getAttribute('name'));

        if (this.className.includes('ActiveSelected')) {
            //CAUSES ERROR SETRESET -> ClassListRemoveSelectedActive(this); // NEW 20221116 to allow deselect

            StartDragObject(this);
            ev.stopPropagation();
            if (ShiftKeyPressed === true) { //NEW V2023 03 20
                ClassListRemoveSelectedActive(this);

                if (ObjectViewerOpen) {

                    var ObjectViewerName = document.getElementById("ObjectViewerName_" + this.id);

                    if (ObjectViewerName) {
                        ObjectViewerResetSelectObject(this.id);
                    }

                }
            }
            return;
        }

        //avoid unselected parent when clicking inside object
        if (this.parentElement.className.includes('ActiveSelected')) {
            StartDragObject(this.parentElement);
            ev.stopPropagation();
            return;
        }

        SelectObject(this);
        StartDragObject(this);
        ev.stopPropagation();
    }
    else if (ev.type == "touchstart") {

        DraggingPopup = true;

        x_pos = ev.touches[0].clientX;
        y_pos = ev.touches[0].clientY;

        SelectObject(this);
        StartDragObject(this);
        ev.stopPropagation();
    }
    //SetResetTexts();
};

function SetDragConditionsNoDrag(ev) {

    // Opt-out (mirrors SetDragConditions): skip drag/select for elements
    // tagged data-noselect="true" or living inside such an element.
    if ((this.hasAttribute && this.hasAttribute("data-noselect")) ||
        (this.closest && this.closest('[data-noselect="true"]'))) {
        return;
    }

    if (ev.which == 3) {

        if (document.getElementById(this.id).classList.contains("ActiveSelected")) {

            if (!document.getElementById(this.id).classList.contains('popup')) {
                RightClickedObjectId = this.id;

                if (!CtrlKeyPressed) {
                    showmulticontextmenu(ev);
                }
                else {
                    ev.stopPropagation();
                    OpenObjectViewer();
                    return;
                }

            }
            else {

            }
        }

        callobjectcontext = true;

    } 
};

function OpenContextPage(ev) {
    
    if (ev.which == 3) {

        // avoid calling the page context
        if (callobjectcontext == true) {
            callobjectcontext = false;
        }
        else {
            //alert(this.id);

            DeselectAllObjects();

            RightClickedObjectId = this.id;
            
            ClassListAddSelectedActive(this);

            showmulticontextmenu(ev);

            SetResetTexts();
        }

    }
};

function initResizeElement() {

    var elements = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

    var element = null;
    var startX, startY, startWidth, startHeight;

    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];

        if (!element.className.includes('Decorator')
            &&
            element.getAttribute("name") != "GroupObject"
        ) { // not for decorators

        //    var resizerright = element.getElementsByClassName("resizer-right")[0];
        //    if (!resizerright) {
        //        var right = document.createElement("div");
        //        right.className = "resizer-right";
        //        element.appendChild(right);
        //        right.addEventListener("mousedown", initDrag, false);
        //        right.parentPopup = element;
        //    }

        //    var resizerbottom = element.getElementsByClassName("resizer-bottom")[0];
        //    if (!resizerbottom) {
        //        var bottom = document.createElement("div");
        //        bottom.className = "resizer-bottom";
        //        element.appendChild(bottom);
        //        bottom.addEventListener("mousedown", initDrag, false);
        //        bottom.parentPopup = element;
        //    }

        //    var resizerboth = element.getElementsByClassName("resizer-both")[0];
        //    if (!resizerboth) {
        //        var both = document.createElement("div");
        //        both.className = "resizer-both";
        //        element.appendChild(both);
        //        both.addEventListener("mousedown", initDrag, false);
        //        both.parentPopup = element;
        //    }
        }

    }

    
}
async function AddType(id) {

    closemenu();

    if (EditMode === false) {
        EnableEditMode();
    }

    AddTypeId = id;

    document.getElementById("EnvisionPage").style.cursor = "crosshair";
    document.getElementById("EnvisionPage").addEventListener('mousedown', AddTypeDrop, false);
    DisableDraggablesPointerEvents();

    return;
}

const AddTypeDrop = async function (e) {

    //document.getElementById("EnvisionPage").style.cursor = "crosshair"; -> wrong here? 

    EnableDraggablesPointerEvents();

    var id = AddTypeId;

    //enable to allow multidrop
    //if (e.which == 3) { // right click
    //    console.log('right clicked');
    //    document.getElementById("EnvisionPage").removeEventListener('mousedown', AddTypeDrop);
    //    document.getElementById("EnvisionPage").style.cursor = "default";
    //    return;
    //}

    document.getElementById("EnvisionPage").removeEventListener('mousedown', AddTypeDrop, false);


    var clone = document.getElementById(id).cloneNode(true);

    clone.id = GenerateUniqueID();

    clone.style.display = 'block';

    //console.log(offsetY + "  " + offsetX);
    var width = parseFloat(clone.style.width.replace('px', ''));
    var height = parseFloat(clone.style.height.replace('px', ''));
    var offsetY = e.clientY;
    var offsetX = e.clientX;
    // NEW


    //magic script to find the position when zoomed and moved :)
    var margintop = parseInt(viewportImage.style.marginTop.replace("px", ""));
    var marginleft = parseInt(viewportImage.style.marginLeft.replace("px", ""));

    if (!margintop) {
        margintop = 0;
    }
    if (!marginleft) {
        marginleft = 0;
    }

    viewportPointer.x = e.pageX - marginleft;
    viewportPointer.y = e.pageY - margintop;

    viewportTarget.x = (viewportPointer.x - viewportPos.x) / viewportScale;
    viewportTarget.y = (viewportPointer.y - viewportPos.y) / viewportScale;

    var temptop = (viewportTarget.y - (height / 2));
    var templeft = (viewportTarget.x - (width / 2));

    clone.style.top = roundDownToNearestX(temptop) + "px";
    clone.style.left = roundDownToNearestX(templeft) + "px";

    if (id == "TypeKnob") {
        clone.getElementsByClassName("knob")[0].id = GenerateUniqueID();
    }

    document.getElementById("EnvisionPage").appendChild(clone);

    if (id == "TypeKnob") {
        initknob();
    }

    if (id == "TypeSlider") {
        var slider = getObjDom(clone);

        slidertoinit(slider);
    }

    if (id == "TypeDonut") {
        var donut = getObjDom(clone);

        donuttoinit(donut);
    }
    if (id == "TypeBarGraph")
    {
        var bargraph = getObjDom(clone);

        initBarGraph(bargraph);
    }

    if (id == "TypeMap") {
        if (typeof initMap === "function") {
            initMap(clone);
        }
    }

    if (id == "TypeAlarmBanner") {
        var ObjDomTable = getObjDom(clone);
        makecolumncolumnsmoveableAlarmbanner(ObjDomTable);
    }

    if (id == "TypeDataTable") {
        var ObjDomTable = getObjDom(clone);
        makecolumncolumnsmoveable(ObjDomTable);
    }

    if (id == "TypePolygon") {
        var ObjDom = getObjDom(clone);
        ResetViewBoxPolygon(ObjDom);
    }

    if (id == "TypePolyline") {
        var ObjDom = getObjDom(clone);
        ResetViewBoxPolyline(ObjDom);
        RedrawPolylineBorder(ObjDom);
       
    }

    await sleep(100);
    DisableEditMode();
    await sleep(300);
    EnableEditMode();

    if (true) {
        saveSnapshot();
    }

    return clone.id;
}

function ToggleInvisible() {

    draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

    if (ShowHidden === true) {
        ShowHidden = false;
        document.getElementById("DevMenuInvisibleEyeIcon").style.fill = "darkgray";

        for (var i = 0; i < draggables.length; i++) {
            if (draggables.item(i).hasAttribute('data-isbackground')) {
                draggables.item(i).style.pointerEvents = "none";

                var ObjName = draggables.item(i).getAttribute("name");

                if (ObjName == "PolylineObject") {

                    const poly = draggables.item(i).querySelector('.poly-visible');
                    if (poly) {
                        poly.style.pointerEvents = 'none';
                    }
                }
            }
        }

    }
    else {

        ShowHidden = true;
        document.getElementById("DevMenuInvisibleEyeIcon").style.fill = "#50C878";

        for (var i = 0; i < draggables.length; i++) {
            if (draggables.item(i).hasAttribute('data-isbackground')) {
                draggables.item(i).style.pointerEvents = "auto";

                var ObjName = draggables.item(i).getAttribute("name");

                if (ObjName == "PolylineObject") {

                    const poly = draggables.item(i).querySelector('.poly-visible');
                    if (poly) {
                        poly.style.pointerEvents = 'stroke';
                    }
                }

            }
        }
    }
    
    RedrawPolylineDots();
    RedrawPolylineHits();
    RedrawPolygonDots();
}

function DisableDraggablesPointerEvents() {

    draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

    for (var i = 0; i < draggables.length; i++) {
        
        draggables.item(i).style.pointerEvents = "none";
    }
}

function EnableDraggablesPointerEvents() {

    draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

    for (var i = 0; i < draggables.length; i++) {

        if (!draggables.item(i).hasAttribute('data-isbackground')) {
            draggables.item(i).style.pointerEvents = "auto";
        }
    }
}

function ToggleEditMode() {

    if (EditMode === true) {
        CloseObjectViewer();
        document.getElementById("DevMenuEditModeIcon").style.fill = "darkgray";
        DisableEditModeBtn();
        
    }
    else {
        EnableEditMode();
        document.getElementById("DevMenuEditModeIcon").style.fill = "#50C878";
    }
}

function SelectLanguage(language) {

    var foundCode = Object.keys(LanguageNames)
        .find(key => LanguageNames[key] === language);

    var code = foundCode || LanguageDefaultCode;

    // If not found, use default full name
    var fullName = foundCode ? language : LanguageNames[LanguageDefaultCode];

    // Store ISO code
    localStorage.setItem(UserName + 'LanguageCode', code);
    localStorage.setItem('client.SelectedLanguageCode', code);

    // Update runtime variables
    VarDict["client.SelectedLanguageCode"][0] = code;
    //VarDict["client.SelectedLanguage"][0] = fullName;
}

// Switches this client to another Color Library theme.
//
// Unlike SelectLanguage, which repaints live because every object re-reads the language each tick,
// the theme is stored in a COOKIE and the page is reloaded. The cookie is what lets the server side
// resolve named colors while it renders: the viewer and Login pages write their colors into the
// markup before any script runs, and the embedded viewers are iframes with their own document, so a
// value kept only in this page's memory could never reach them. The reload is also what repaints the
// page background and the charts, which are painted once rather than every tick.
//
// A reload is the runtime's normal mode of screen change - Navigate To, LogIn and LogOut all end in
// one - and the session keeps the current page, so the operator lands back where they were. Open
// popups and half-typed input values are lost, the same as on a navigation.
function SelectTheme(theme) {

    if (!theme) { return; }

    // Encoded because a theme name may contain spaces. The name is validated on the way in, so it
    // holds no ';' or ',' that could end the cookie value early.
    // One year, matching how long a station is expected to keep its choice without being re-set.
    document.cookie = 'EnvisionTheme=' + encodeURIComponent(theme) + ';path=/;max-age=31536000;samesite=lax';

    // Mirrored so the theme is readable as a client variable in conditions and expressions, the same
    // way the selected language is.
    localStorage.setItem('client.SelectedTheme', theme);

    // Mirror the navigate path: projects with cleanup in a page or global script expect these to run
    // before the document goes away.
    try { OnPageExit(); OnGlobalExit(); } catch (error) { console.error(error); }

    location.reload();
}
function initDragDecorator(e) {
    
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    
    startX = e.clientX;
    startY = e.clientY;

    StartWidthDecorator = parseFloat(document.getElementById("MultiContext").style.width.replace("px", "")); 
    StartMarginRightDecoratorDragLine = parseFloat(document.getElementById("MultiContextDragLine").style.marginRight.replace("px", "")); 

    document.documentElement.addEventListener("mousemove", doDragDecorator, false);
    document.documentElement.addEventListener("mouseup", stopDragDecorator, false);
}

function doDragDecorator(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();

    var changeX = roundDownToNearestX(e.clientX - startX);

    if (viewportScale !== 1) {
        changeX = roundDownToNearestX(changeX / viewportScale);
    }

    if ((StartWidthDecorator - changeX) <= 420) {
        document.getElementById("MultiContext").style.width = "420px";
        document.getElementById("MultiContextDragLine").style.marginRight = "415px";
    }
    else {
        document.getElementById("MultiContext").style.width = (StartWidthDecorator - changeX) + "px";
        document.getElementById("MultiContextDragLine").style.marginRight = (StartMarginRightDecoratorDragLine - changeX) + "px";
    }
    

    //console.log('changeX ' + changeX);
    
    localStorage.setItem('MultiContextWidth', document.getElementById("MultiContext").style.width);
    localStorage.setItem('MultiContextDragLineMarginRight', document.getElementById("MultiContextDragLine").style.marginRight);
}

function stopDragDecorator(e) {
    document.documentElement.removeEventListener("mousemove", doDragDecorator, false);
    document.documentElement.removeEventListener("mouseup", stopDragDecorator, false);

}

function ResizingScaledError() {

    const modalEl = document.getElementById('MessageModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // ❗ already open? then do nothing
    if (modalEl.classList.contains('show')) return;

    document.getElementById("ModalMessage").innerHTML =
        "⚠ Resizing of scaled objects is not permitted.";

    modal.show();
}

function MoveInternalScaledError() {

    const modalEl = document.getElementById('MessageModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // ❗ already open? then do nothing
    if (modalEl.classList.contains('show')) return;

    document.getElementById("ModalMessage").innerHTML =
        "⚠ Moving internal objects of a scaled object is not permitted.";

    modal.show();
}
