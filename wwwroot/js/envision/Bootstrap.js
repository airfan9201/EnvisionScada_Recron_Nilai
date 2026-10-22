// Envision Bootstrap - Bootstrap: ALL load-time executable statements in original order. Must be loaded LAST of the envision/ files.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

setTimeout(ResetStatusIconFreeze, 3000);

if (ProgrammerMode !== true) {
    document.getElementById("LeftMenuBox").style.display = "none";
}

document.onmousemove = DoDragObject;
document.onmouseup = StopDragElement;

document.addEventListener('touchmove', DoDragObject);
document.addEventListener('touchend', StopDragElement);


// Disable right click default context menu browser
window.addEventListener("contextmenu", e => e.preventDefault());

// Close open config windows when clicking inside EnvisionPage
document.getElementById("EnvisionPage").addEventListener('mousedown', async function (ev) {

    document.getElementById('EnvisionPage').focus();

    CloseNumpad();

    if (!ev.target || ev.target.getAttribute("data-keyboard") !== "true") {
        CloseKeyboard();
    }

    if (ProgrammerMode) {

        if (DrawingLine) {
            PolylineDotDrawLine();
            return;
        }

        if (ev.which == 3) {
            closeconfigs();
        }
        else {

            if (!ObjectViewerOpen) {
                closeconfigs();
            }
        }

    }

    if (EditMode === true) {
        if (selected == null) {
            
            if (ev.which == 3) {
                // don't deselect
            }
            else {
                //console.log("called");
                if (CtrlKeyPressed == false) {
                    DeselectAllObjects();
                }
                EnableSelectables();
            }
        }
    }
    else {
        DeselectAllObjects(); // FOR POPUP
    }


});

// Observer MENULIB ～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～

var observer = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting === true) {
        entries.forEach(entry => {
            //console.log(entry.target.id);
            observer.unobserve(entry.target);
            LazyLoadMenuLib(document.getElementById(entry.target.id));
        });
    }
}, { threshold: [0] });


var menulibs = document.getElementsByClassName("menulib");

for (var i = 0; i < menulibs.length; i++) {

    //console.log(menulibs.item(i).id);

    observer.observe(document.querySelector("#menulib" + i));

}

document.getElementById("uploadInput").addEventListener("change", UploadSVG, false);
document.getElementById("uploadInputImage").addEventListener("change", UploadImage, false);


// PERIODICALLY ANIMATIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

setTimeout(executeQuery, 50);

if (EditMode === false) {
    ApplyRuntimeCursors();
}

setTimeout(executeCharts, 1000);

setTimeout(executeAlarms, 1000);

setTimeout(executePageScriptPeriodic, 1000);

setTimeout(executeDataTablesPeriodic, 1000);

setTimeout(executeTimeOut, 10000);


InitGrid(); // call upon load page

document.addEventListener('keydown', async (e) => {

    // Edit & Program mode
    if (e.ctrlKey) {
        CtrlKeyPressed = true;
    }

    if (e.key.toLowerCase() === 'm' && e.ctrlKey) {
        e.preventDefault();

        ResetViewer();

        return false;
    }

    // Program mode
    if (!ProgrammerMode) {
        //console.log('not permitted');
        return;
    }

    if (e.which === 32) {
        SpaceBarPressed = true;
    }

    if (e.altKey) {
        AltKeyPressed = true;
    }

    if (e.shiftKey) {
        ShiftKeyPressed = true;
    }

    if (e.key.toLowerCase() === 'e' && e.ctrlKey) {
        e.preventDefault();
        ToggleEditMode();
    }

    const isFocusOnZIndexInput = document.activeElement?.classList.contains("ObjectLayerNo");

    //else if (e.key.toLowerCase() === 'a' && e.ctrlKey)
    //{
    //    e.preventDefault();

    //    if (EditMode === true) {
    //        SelectAllObjects();
    //    }

    //    return false;
    //}
    if (e.key.toLowerCase() === 'i' && e.ctrlKey) {
        e.preventDefault();
        ToggleInvisible();
    }
    else if (e.key.toLowerCase() === 'm' && e.ctrlKey) {
        e.preventDefault();

        ResetViewer();

        return false;
    }
    else if (e.key.toLowerCase() === 'h' && e.ctrlKey) {
        e.preventDefault();
        if (EditMode === true) {
            HideObjects();
        }
    }
    else if (e.key.toLowerCase() === 's' && e.ctrlKey) {
        e.preventDefault();
        if (EditMode === true) {
            UpdatePage();
            CtrlKeyPressed = false;
        }
    }
    else if (e.key.toLowerCase() === 'd' && e.ctrlKey) { // duplicate
        e.preventDefault();
        
        if (EditMode === true) {
            CloneObject();
        }

        return false;
    }
    else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
        e.preventDefault();

        if (EditMode === true) {
            ToggleLock();
        }

        return false;
    }
    else if ((e.key.toLowerCase() === 'f') && e.ctrlKey) {
        e.preventDefault();

        // Check if PageScript modal is already open
        var modal = document.getElementById('PageScriptModal');
        if (modal && modal.classList.contains('show')) {
            return;
        }

        // Check if PageScript modal is already open
        var modal = document.getElementById('EditWidgetHTMLModal');
        if (modal && modal.classList.contains('show')) {
            return;
        }

        // Check if the modal is already open. The modal is only rendered for
        // Administrators, so it may legitimately be absent.
        modal = document.getElementById('CrossReferenceModal');
        if (!modal || modal.classList.contains('show')) {
            return;
        }

        // Open the modal using Bootstrap's modal API
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        return false;
    }
    else if ((e.key.toLowerCase() === 'r' && e.ctrlKey) || e.keyCode == 46) { // remove
        e.preventDefault();
        if (EditMode === true) {

            if (document.getElementById("MultiContext").style.display == "block") { // avoid removing object when properties is open

                const focusedElement = $(':focus');
                if (focusedElement) {
                    if (focusedElement.is("input") || focusedElement.is("textarea")) {
                        var len = focusedElement.val().length;
                        var newval = focusedElement.val().substring(0, parseInt(len) - 1);
                        focusedElement.val(newval);
                    }
                }

                return;
            }

            CtrlKeyPressed = false;

            DeleteObject();

            return false;
        }
    }
    else if (e.key.toLowerCase() === 'g' && e.ctrlKey) { // group
        e.preventDefault();
        if (EditMode === true) {
            ResetViewer(); //TODO implement group without reset view (offset viewer)
            GroupObjects();
            return false;
        }
    }
    else if (e.key.toLowerCase() === 'u' && e.ctrlKey) { // ungroup
        e.preventDefault();
        if (EditMode === true) {
            UnGroupObjects();
            return false;
        }
    }
    else if (e.key.toLowerCase() === 'q' && e.ctrlKey) { // open menu / close Asset Manager
        e.preventDefault();

        var uamModal = document.getElementById('UdtAssetModal');
        if (uamModal && uamModal.classList.contains('show')) {
            var uamInstance = bootstrap.Modal.getInstance(uamModal);
            if (uamInstance) uamInstance.hide();
            return false;
        }

        ToggleOpenMenu();
        return false;
    }
    else if (e.key.toLowerCase() === 'b' && e.ctrlKey) { // reserved
        e.preventDefault();
        MaximizeDevMenu();
    }
    else if (e.key.toLowerCase() === 'k' && e.ctrlKey) { // toggle active users box
        e.preventDefault();
        if (typeof ToggleActiveUsersBox === 'function') {
            ToggleActiveUsersBox();
        }
    }
    else if ((e.key.toLowerCase() === 'j') && e.ctrlKey) {
        e.preventDefault();

        const sidebarEl = document.getElementById("ZIndexLayersSidebar");
        if (!sidebarEl) return;

        let instance = bootstrap.Offcanvas.getInstance(sidebarEl);
        if (!instance) {
            instance = new bootstrap.Offcanvas(sidebarEl);
        }

        // Toggle behavior
        if (sidebarEl.classList.contains("show")) {
            instance.hide();
        } else {
            instance.show();
        }

        return false;
    }
    else if (e.key.toLowerCase() === 'o' && e.ctrlKey) { // reserved
        e.preventDefault();

        var elements = document.getElementsByClassName("ActiveSelected");

        var ElementsToBeDecorated = elements;

        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

            var ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

            var ObjDom;

            if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                ObjDom = ElementToBeDecorated;
            }
            else {
                ObjDom = ElementToBeDecorated.parentElement;
            }

            
            RightClickedObjectId = ObjDom.id;

            OpenObjectViewer();

            return;
        }

    }
    else if (e.key.toLowerCase() === 'arrowleft' && EditMode && !decoratoropen && !isFocusOnZIndexInput) { // reserved

        let activeElement = document.activeElement.parentElement.getAttribute('name');
        if (activeElement == "LabelObject") { // || activeElement == "InputObject"
            return;
        }

        e.preventDefault();
        
        var elements = document.getElementsByClassName("ActiveSelected");

        var ElementsToBeDecorated = elements;

        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

            var ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

            if (ElementToBeDecorated.parentElement) {

                var ObjDom;

                if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                    ObjDom = ElementToBeDecorated;
                }
                else {
                    ObjDom = ElementToBeDecorated.parentElement;
                }

                if (CheckLocked(ObjDom) === true) {
                    continue;
                }

                var temp = parseFloat(ObjDom.style.left.replace("px", "")) - 1;

                var left = temp + "px";

                ObjDom.style.left = left;

                var positiontext = ObjDom.getElementsByClassName("positiontext")[0];
                if (positiontext) {
                    positiontext.innerHTML = ObjDom.style.left + " " + ObjDom.style.top;
                }
            }

        }
        SetResetTexts();
        SetBorders();
    }
    else if (e.key.toLowerCase() === 'arrowright' && EditMode && !decoratoropen && !isFocusOnZIndexInput) { // reserved

        let activeElement = document.activeElement.parentElement.getAttribute('name');
        if (activeElement == "LabelObject") {  //|| activeElement == "InputObject"
            return;
        }

        e.preventDefault();

        var elements = document.getElementsByClassName("ActiveSelected");

        var ElementsToBeDecorated = elements;

        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

            var ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

            if (ElementToBeDecorated.parentElement) {

                var ObjDom;

                if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                    ObjDom = ElementToBeDecorated;
                }
                else {
                    ObjDom = ElementToBeDecorated.parentElement;
                }

                if (CheckLocked(ObjDom) === true) {
                    continue;
                }

                var temp = parseFloat(ObjDom.style.left.replace("px", "")) + 1;

                var left = temp + "px";

                ObjDom.style.left = left;

                var positiontext = ObjDom.getElementsByClassName("positiontext")[0];
                if (positiontext) {
                    positiontext.innerHTML = ObjDom.style.left + " " + ObjDom.style.top;
                }
            }

        }
        SetResetTexts();
        SetBorders();
    }
    else if (e.key.toLowerCase() === 'arrowup' && EditMode && !decoratoropen) { // reserved

        let activeElement = document.activeElement.parentElement.getAttribute('name');
        if (activeElement == "LabelObject") {
            return;
        }

        e.preventDefault();

        var elements = document.getElementsByClassName("ActiveSelected");

        var ElementsToBeDecorated = elements;

        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

            var ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

            if (ElementToBeDecorated.parentElement) {

                var ObjDom;

                if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                    ObjDom = ElementToBeDecorated;
                }
                else {
                    ObjDom = ElementToBeDecorated.parentElement;
                }

                if (CheckLocked(ObjDom) === true) {
                    continue;
                }

                var temp = parseFloat(ObjDom.style.top.replace("px", "")) - 1;

                var top = temp + "px";

                ObjDom.style.top = top;

                var positiontext = ObjDom.getElementsByClassName("positiontext")[0];
                if (positiontext) {
                    positiontext.innerHTML = ObjDom.style.left + " " + ObjDom.style.top;
                }
            }

        }

        SetResetTexts();
        SetBorders();
    }
    else if (e.key.toLowerCase() === 'arrowdown' && EditMode && !decoratoropen) { // reserved

        let activeElement = document.activeElement.parentElement.getAttribute('name');
        if (activeElement == "LabelObject") {
            return;
        }

        e.preventDefault();

        var elements = document.getElementsByClassName("ActiveSelected");

        var ElementsToBeDecorated = elements;

        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

            var ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

            if (ElementToBeDecorated.parentElement) {

                var ObjDom;

                if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                    ObjDom = ElementToBeDecorated;
                }
                else {
                    ObjDom = ElementToBeDecorated.parentElement;
                }

                if (CheckLocked(ObjDom) === true) {
                    continue;
                }


                var temp = parseFloat(ObjDom.style.top.replace("px", "")) + 1;

                var top = temp + "px";

                ObjDom.style.top = top;

                var positiontext = ObjDom.getElementsByClassName("positiontext")[0];
                if (positiontext) {
                    positiontext.innerHTML = ObjDom.style.left + " " + ObjDom.style.top;
                }
            }

        }
        SetResetTexts();
        SetBorders();
    }
    else if (document.activeElement.id === "EnvisionPage" || document.activeElement.parentElement.classList.contains('draggable')) {
        if (e.key.toLowerCase() === 'v' && e.ctrlKey) { // Paste

            //allow copy past in element
            let activeElement = document.activeElement.parentElement.getAttribute('name');
            if (activeElement == "LabelObject" || activeElement == "InputObject") {
                return;
            }

            e.preventDefault();
            if (EditMode === true) {

                var element = document.getElementById("EnvisionPage").querySelectorAll('div.ActiveSelected[name="GroupObject"]')[0];

                //console.log(element);

                if (element) {
                    ClipboardDestination = element;
                    GetClipboard();
                }
                else {
                    ClipboardDestination = null;
                    AddClipboard();
                    return;
                }

                return false;
            }
        }
        else if (e.key.toLowerCase() === 'c' && e.ctrlKey) { // Copy

            if (EditMode === true) {
                e.preventDefault();
                //console.log('ENVISION PAGE COPY');
                CopyObject();
                return false;
            }

        }
        else if (e.key.toLowerCase() === 'z' && e.ctrlKey) { // Copy
            e.preventDefault();
            undo();
            await sleep(100);
            DisableEditMode();
            EnableEditMode();
            ReloadActiveObjects();
        }
        else if (e.key.toLowerCase() === 'y' && e.ctrlKey) { // Copy
            e.preventDefault();
            redo();
            await sleep(100);
            DisableEditMode();
            EnableEditMode();
            ReloadActiveObjects();
        }
    }
});

document.addEventListener('keyup', (e) => {

    if (!e.ctrlKey) {
        CtrlKeyPressed = false;
    }

    if (e.which === 32) {
        SpaceBarPressed = false;
    }

    if (!e.altKey) {
        AltKeyPressed = false;
    }

    if (!e.shiftKey) {
        ShiftKeyPressed = false;
    }

});

//$(window).bind('mousewheel DOMMouseScroll', function (event) {
//    if (event.ctrlKey == true) {
//        event.preventDefault();
//        if (event.originalEvent.detail > 0) {
//            console.log('Down');
//        } else {
//            console.log('Up');
//        }
//    }
//}, { capture: true, passive: false });


window.addEventListener("wheel", event => MouseScrolling(event), { passive: false });

const viewportContainer = document.querySelector('body');

const viewportImage = document.querySelector('#EnvisionPage');
const viewportSpeed = 0.1;
let viewportSize = {
    w: viewportImage.offsetWidth,
    h: viewportImage.offsetHeight
};
let viewportPos = { x: 0, y: 0 };
let viewportTarget = { x: 0, y: 0 };
let viewportPointer = { x: 0, y: 0 };
/*let scale = 1;*/
let viewportScale = parseFloat(PageBaseScale);
VarDict["client.PageScale"][0] = Math.trunc(viewportScale * 100);
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mouseup', onMouseUp);

document.addEventListener('touchstart', function (event) {

    if (EditMode == true || sliderobjectactive == true) {
        return;
    }

    if (DisableZoom == false) {
        // SCALING

        if (event.touches.length === 2) {
            scaling = true;
            pinchstartevent = event;
            scalingstart = viewportScale;
            //alert('started inch');
            pinchbrake = 0;
            pincholdx = 0;
            pincholdy = 0;
        }

    }

    if (DisablePan == false) {

        if (event.touches.length === 1) {

            //disable all so we can drag -> v20241105 doesn't seem to be necessary, also collides when pushing buttons
            //draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
            //for (var i = 0; i < draggables.length; i++) {
            //    draggables.item(i).style.pointerEvents = "none";
            //}

            document.getElementById("EnvisionPage").style.cursor = "grab";


            //console.log("onMouseDown");
            document.addEventListener('mousemove', onMouseMove);
            
            lastPageX = event.pageX;
            lastPageY = event.pageY;
        }
    }

}, false);



document.addEventListener('touchmove', function (e) {
    
    if (DraggingPopup) {
        return;
    }

    if (e.touches.length === 1) { // PANNING

        if ((DisablePan == true && EditMode == false) || (sliderobjectactive == true)) {

        }
        else {
            ResetViewerBtn();
            var pageX;
            var pageY;
            var deltaY;

            for (let i = 0; i < e.touches.length; i++) {
                //console.log(`touchpoint[${i}].screenX = ${e.touches[i].screenX}`);
                //console.log(`touchpoint[${i}].screenY = ${e.touches[i].screenY}`);

                pageX = e.touches[i].screenX;
                pageY = e.touches[i].screenY;
                deltaY = e.touches[i].deltaY;
            }

            //console.log("onMouseMove " + event.pageX + " " + event.pageY);
            var MovingTop = lastPageY - pageY;
            var MovingLeft = lastPageX - pageX;
            //console.log("MovingTop: " + MovingTop + "  " + "MovingLeft: " + MovingLeft)

            var viewer = document.getElementById("EnvisionPage");

            var marginTop = viewer.style.marginTop;
            var marginLeft = viewer.style.marginLeft;

            if (marginTop == "") {
                marginTop = "0";
            }
            else {
                marginTop = marginTop.replace("px", "");
            }

            if (marginLeft == "") {
                marginLeft = "0";
            }
            else {
                marginLeft = marginLeft.replace("px", "");
            }

            if (MovingTop > 0) {
                //console.log("moving up " + (parseInt(marginTop) - sensibility));
                viewer.style.marginTop = (parseInt(marginTop) - Math.abs(MovingTop)) + "px";
            }
            else {
                //console.log("moving down " + (parseInt(marginTop) - sensibility));
                viewer.style.marginTop = (parseInt(marginTop) + Math.abs(MovingTop)) + "px";
            }

            if (MovingLeft > 0) {
                viewer.style.marginLeft = (parseInt(marginLeft) - Math.abs(MovingLeft)) + "px";
            }
            else {
                viewer.style.marginLeft = (parseInt(marginLeft) + Math.abs(MovingLeft)) + "px";
            }

            lastPageX = pageX;
            lastPageY = pageY;
        }

        return;
    }
    
    // SCALING

    if ((DisableZoom == true && EditMode == false) || (sliderobjectactive == true)) {
        return;
    }

    ResetViewerBtn();

    pinchbrake = pinchbrake + 1;

    if (scaling && pinchbrake > 10) {

        pinchendevent = e;

        var pageX;
        var pageY;

        if (pincholdx !== 0) {
            pageX = pincholdx;
        }

        if (pincholdy !== 0) {
            pageY = pincholdy;
        }

        if (pinchstartevent.touches[1].pageX > pinchstartevent.touches[0].pageX) {
            diststart = pinchstartevent.touches[1].pageX - pinchstartevent.touches[0].pageX;

            pageX = pinchstartevent.touches[0].screenX + ((pinchstartevent.touches[1].screenX - pinchstartevent.touches[0].screenX) / 2);
        }
        else {
            diststart = pinchstartevent.touches[0].pageX - pinchstartevent.touches[1].pageX;

            pageX = pinchstartevent.touches[1].screenX + ((pinchstartevent.touches[0].screenX - pinchstartevent.touches[1].screenX) / 2);
        }

        if (pinchstartevent.touches[1].pageY > pinchstartevent.touches[0].pageY) {
            pageY = pinchstartevent.touches[0].screenY + ((pinchstartevent.touches[1].screenY - pinchstartevent.touches[0].screenY) / 2);
        }
        else {
            pageY = pinchstartevent.touches[1].screenY + ((pinchstartevent.touches[0].screenY - pinchstartevent.touches[1].screenY) / 2);
        }

        pincholdx = pageX;
        pincholdy = pageY;

        if (pinchendevent.touches[1].pageX > pinchendevent.touches[0].pageX) {
            distend = pinchendevent.touches[1].pageX - pinchendevent.touches[0].pageX;
        }
        else {
            distend = pinchendevent.touches[0].pageX - pinchendevent.touches[1].pageX;
        }

        //dist = Math.hypot(
        //    pinchstartevent.touches[1].pageX - pinchstartevent.touches[0].pageX,
        //    pinchendevent.touches[1].pageY - pinchendevent.touches[0].pageY);

        if (diststart < distend) {
            //alert('zoom in ' + dist);

            dist = distend - diststart;

            viewportScale = scalingstart + (scalingstart * (dist / 40));

            if (viewportScale >= 5) {
                viewportScale = 5;
            }

        }
        else {
            //alert('zoom out ' + dist);

            dist = diststart - distend;

            viewportScale = scalingstart - (scalingstart * (dist / 100));

            if (viewportScale <= 0.3) {
                viewportScale = 0.3;
            }

        }

        VarDict["client.PageScale"][0] = Math.trunc(viewportScale * 100);

        // NEW 
        var margintop = parseInt(viewportImage.style.marginTop.replace("px", ""));
        var marginleft = parseInt(viewportImage.style.marginLeft.replace("px", ""));

        if (!margintop) {
            margintop = 0;
        }
        if (!marginleft) {
            marginleft = 0;
        }

        viewportPointer.x = pageX - marginleft;
        viewportPointer.y = pageY - margintop;

        viewportTarget.x = (viewportPointer.x - viewportPos.x) / pincholdscale;
        viewportTarget.y = (viewportPointer.y - viewportPos.y) / pincholdscale;

        //alert(scale);

        viewportPos.x = -viewportTarget.x * viewportScale + viewportPointer.x;
        viewportPos.y = -viewportTarget.y * viewportScale + viewportPointer.y;

        viewportImage.style.transform = `translate(${viewportPos.x}px,${viewportPos.y}px) scale(${viewportScale},${viewportScale})`;

        pincholdscale = viewportScale;
    }

}, false);

document.addEventListener('touchend', function (e) {

    //console.log("onMouseUp");
    document.removeEventListener('mousemove', onMouseMove);
    document.getElementById("EnvisionPage").style.cursor = "default";
    /*    document.getElementById("EnvisionPage").style.pointerEvents = "auto";*/

    //enable all after drag -> v20241105 doesn't seem to be necessary, also collides when pushing buttons
    //draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
    //for (var i = 0; i < draggables.length; i++) {
    //    if (!draggables.item(i).hasAttribute('data-isbackground')) {
    //        if (!draggables.item(i).getAttribute('data-objectvisible') === "false") {
    //            draggables.item(i).style.pointerEvents = "auto";
    //        } 
    //    }
    //}

    // SCALING

    if (scaling) {
        //alert('pinch ended');
        scaling = false;
    }



}, false);


document.getElementById("EnvisionPage").addEventListener("mousedown", closemenu);
//TABLE END

// Developer diagnostic: in ProgrammerMode, log a stack trace for every alert() call so the source of an
// unexpected alert can be traced. The native alert dialog still shows either way; end users see no change.
if (ProgrammerMode === true) {
    var old = alert;

    alert = function () {
        console.log(new Error().stack);
        old.apply(window, arguments);
    };
}


// INITS

document.getElementById("LeftMenuBox").style.display = "none";

initknob();
initsliders();
ResetViewer();
loadpagealarms();
LoadWidgets();
ResetOnEnters();
SetMenuSizes();
initBarGraphs()
initdonuts()

if (ProgrammerMode == true) {
    
    document.getElementById("SearchMenu").addEventListener('keyup', SearchEnter);

    function SearchEnter(e) {
        if (e.which == 13) {
            SearchMenu();
        }
    }

}


// CLASSES

class TrendSettings {

    constructor(datetimefrom, datetimeto) {
        this.datetimefrom = datetimefrom;
        this.datetimeto = datetimeto;
    }

}

class pagereplacer {
    constructor(label, value) {
        this.label = label;
        this.value = value;
    }
}
