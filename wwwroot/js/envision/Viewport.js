// Envision Viewport - Viewport: zoom, pan, grid, editor display settings.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

function SetBlinkSpeed(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            // data-value carries the canonical CSS duration; innerHTML is the translated label
            var blinkspeed = el.dataset.value || el.innerHTML;

            ElementToBeDecorated.setAttribute('data-blinkspeed', blinkspeed);
        }

        var StyleFormatContextBlinkSpeed = document.getElementById('StyleFormatContextBlinkSpeed');
        StyleFormatContextBlinkSpeed.innerHTML = el.innerHTML;
    }

}

function SetBorderBlinkSpeed(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            // data-value carries the canonical CSS duration; innerHTML is the translated label
            var borderblinkspeed = el.dataset.value || el.innerHTML;

            ElementToBeDecorated.setAttribute('data-borderblinkspeed', borderblinkspeed);
        }

        var StyleFormatContextBorderBlinkSpeed = document.getElementById('StyleFormatContextBorderBlinkSpeed');
        StyleFormatContextBorderBlinkSpeed.innerHTML = el.innerHTML;
    }

}


function SetDecimals(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom = ElementToBeDecorated;
        var decimals = el.innerHTML;

        ObjDom.setAttribute("data-decimals", decimals);

        el.parentElement.parentElement.parentElement.getElementsByTagName("button")[0].innerHTML = decimals;
    }
}

// GRID 


function SetGridSize(el) {

    var ObjDom = document.getElementById('TheGrid');
    var gridsize = el.innerHTML;

    switch (gridsize) {
        case "1":
            ObjDom.style.backgroundSize = "1px 1px";
            break;
        case "2":
            ObjDom.style.backgroundSize = "2px 2px";
            break;
        case "5":
            ObjDom.style.backgroundSize = "5px 5px";
            break;
        case "10":
            ObjDom.style.backgroundSize = "10px 10px";
            break;
        case "20":
            ObjDom.style.backgroundSize = "20px 20px";
            break;
        case "30":
            ObjDom.style.backgroundSize = "30px 30px";
            break;
        case "40":
            ObjDom.style.backgroundSize = "40px 40px";
            break;
        case "50":
            ObjDom.style.backgroundSize = "50px 50px";
            break;
        default:
            ObjDom.style.backgroundSize = "20px 20px";
            break;
    }

    SetGridSizeRoundDown(ObjDom.style.backgroundSize);

    localStorage.setItem('GridSize', ObjDom.style.backgroundSize);

    localStorage.setItem('GridSizeDropDown', gridsize);

    var GridSizeDropDown = document.getElementById('GridSizeDropDown');
    GridSizeDropDown.innerHTML = gridsize;

    // dialog stays open so the user can also adjust the grid color

    ResizeGrid();

}

function InitGrid() {

    let GridColor = localStorage.getItem('GridColor');
    let GridSize = localStorage.getItem('GridSize');
    let GridSizeDropDown = localStorage.getItem('GridSizeDropDown');

    if (!GridSize) {
        GridSize = "5px 5px";
        localStorage.setItem('GridSize', GridSize);

        GridSizeDropDown = 5;
        localStorage.setItem('GridSizeDropDown', GridSizeDropDown);
    }

    if (!GridColor) {
        /*GridColor = "#696969";*/
        GridColor = "#757575";
        SetBackgroundImageStroke(GridColor);
    }

    SetBackgroundImageStroke(GridColor);

    let ObjDom = document.getElementById('TheGrid');
    ObjDom.style.backgroundSize = GridSize;

    document.getElementById('GridSizeDropDown').innerHTML = GridSizeDropDown;

    SetGridSizeRoundDown(GridSize);

}

function SetGridSizeRoundDown(GridSize) {
    switch (GridSize) {
        case "1px 1px":
            GridSizeRoundDown = 1;
            break;
        case "2px 2px":
            GridSizeRoundDown = 2;
            break;
        case "5px 5px":
            GridSizeRoundDown = 5;
            break;
        case "10px 10px":
            GridSizeRoundDown = 10;
            break;
        case "20px 20px":
            GridSizeRoundDown = 20;
            break;
        case "30px 30px":
            GridSizeRoundDown = 30;
            break;
        case "40px 40px":
            GridSizeRoundDown = 40;
            break;
        case "50px 50px":
            GridSizeRoundDown = 50;
            break;
        default:
            GridSizeRoundDown = 10;
            break;
    }
}

function OpenTheGridSettings() {

    var TheGridSettings = document.getElementById("TheGridSettings");

    // toggle: if the dialog is already open, clicking the grid icon just closes it
    if (TheGridSettings.style.display === "flex") {
        TheGridSettings.style.display = "none";
        return;
    }

    // opening: close the left menu and any open decorator panels first (reuse existing helpers)
    closemenu();
    var menuIcon = document.getElementById("DevMenuMenuIcon");
    if (menuIcon) menuIcon.style.fill = "darkgray";
    closeconfigs();

    var TheGrid = document.getElementById("TheGrid");
    let compStyles = window.getComputedStyle(TheGrid);
    let backgroundimage = compStyles.getPropertyValue('Background-Image');
    let positionstart = backgroundimage.indexOf("stroke:");
    let positionend = backgroundimage.indexOf(";", positionstart);
    //alert(positionstart + " - " + positionend);

    const start = backgroundimage.indexOf("rgba(");
    const end = backgroundimage.indexOf(")", start);
    const rgbaColor = backgroundimage.substring(start, end + 1);
    var currentcolor = rgbaToHex(rgbaColor);


    $("#thegridcolorpicker").colorPick({
        'initialColor': currentcolor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'paletteLabel': 'Grid Color',
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': this.color, 'color': this.color })
            SetBackgroundImageStroke(this.color);
            localStorage.setItem('GridColor', this.color);
            /*alert(this.color);*/
        }
    });

    /*    SetBackgroundImageStroke("green");*/

    TheGridSettings.style.display = "flex";

}

function CloseTheGridSettings(event) {

    // when triggered from the backdrop, ignore clicks that bubbled up from the dialog
    if (event && event.currentTarget !== event.target) {
        return;
    }

    document.getElementById("TheGridSettings").style.display = "none";
}

function SetBackgroundImageStroke(color) {

    var TheGrid = document.getElementById("TheGrid");

    rgacolor = hexToRgba(color);

    TheGrid.style.backgroundImage = "linear-gradient(to right, " + rgacolor + " 0.6px, transparent 0.1px), linear-gradient(to bottom, " + rgacolor + " 0.6px, transparent 0.1px)";
}

function MouseScrolling(event) {

    if (event.ctrlKey == true) {
        event.preventDefault();
        //console.log("disable");
    }

    /*if (true) {*/
    if (CtrlKeyPressed) {

        PageScriptModalDisplay = document.getElementById("PageScriptModal").style.display;

        if (DisableZoom == true && EditMode == false || PageScriptModalDisplay == "block") {
            return;
        }

        /*if (SpaceBarPressed) {*/

        //if (EditMode === true) {
        //    DeselectAllObjects();
        //    DisableEditMode();
        //} 

        // NEW 
        var margintop = parseInt(viewportImage.style.marginTop.replace("px", ""));
        var marginleft = parseInt(viewportImage.style.marginLeft.replace("px", ""));

        if (!margintop) {
            margintop = 0;
        }
        if (!marginleft) {
            marginleft = 0;
        }

        //pointer.x = event.pageX - container.offsetLeft; ORIGINAL
        //pointer.y = event.pageY - container.offsetTop; ORIGINAL
        viewportPointer.x = event.pageX - marginleft;
        viewportPointer.y = event.pageY - margintop;

        viewportTarget.x = (viewportPointer.x - viewportPos.x) / viewportScale;
        viewportTarget.y = (viewportPointer.y - viewportPos.y) / viewportScale;

        viewportScale += -1 * Math.max(-1, Math.min(1, event.deltaY)) * viewportSpeed * viewportScale;

        VarDict["client.PageScale"][0] = Math.trunc(viewportScale * 100);

        // Uncomment to constrain scale
        // const max_scale = 4;
        // const min_scale = 1;
        // scale = Math.max(min_scale, Math.min(max_scale, scale));

        viewportPos.x = -viewportTarget.x * viewportScale + viewportPointer.x;
        viewportPos.y = -viewportTarget.y * viewportScale + viewportPointer.y;

        //console.log(target.x);
        viewportImage.style.transform = `translate(${viewportPos.x}px,${viewportPos.y}px) scale(${viewportScale},${viewportScale})`;

        SetResetTexts();
        SetBorders();
        ResizeGrid();
    }

}

function BodyBackClick() {

    //console.log('body back clicked');

    if (EditMode) {
        DeselectAllObjects();
        document.getElementById('EnvisionPage').focus();
    }
    
}
/*document.addEventListener("mousedown", function (e) { if (e.button == 1) { e.preventDefault(); } })*/
//$('body').mousedown(function (e) { if (e.button == 1) return false });

function onMouseUp(event) {
    //console.log("onMouseUp");
    document.removeEventListener('mousemove', onMouseMove);
    document.getElementById("EnvisionPage").style.cursor = "default";
    /*    document.getElementById("EnvisionPage").style.pointerEvents = "auto";*/


    // v2024 06 30 WHY does this still need to be here?? conflicts with selectables.js
    //draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
    //for (var i = 0; i < draggables.length; i++) {

    //    if (!draggables.item(i).hasAttribute('data-isbackground') && !draggables.item(i).hasAttribute('data-hideobject')) { 
    //        //console.log(draggables.item(i));
    //        draggables.item(i).style.pointerEvents = "auto"; 
    //    }
        
    //}

}

function onMouseDown(event) {
    
    if (event.button == 1) {
        event.preventDefault();
    }

    if (event.which == 2) {

        if (DisablePan == true && EditMode == false) {
            return;
        }

        /*if (CtrlKeyPressed && event.which == 2) {*/
        /*document.getElementById("EnvisionPage").style.pointerEvents = "none";*/

        //draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");
        //for (var i = 0; i < draggables.length; i++) {
        //    draggables.item(i).style.pointerEvents = "none";

        //}

        document.getElementById("EnvisionPage").style.cursor = "grab";

        //console.log("onMouseDown");

        document.addEventListener('mousemove', onMouseMove);
        lastPageX = event.pageX;
        lastPageY = event.pageY;



        //if (EditMode === true) {
        //    DeselectAllObjects();
        //    DisableEditMode();
        //}

    }
    if (event.which == 3) {
        //console.log("right click heere");
    }
}

function onMouseMove(event) {
    //console.log("onMouseMove " + event.pageX + " " + event.pageY);

    var MovingTop = lastPageY - event.pageY;
    var MovingLeft = lastPageX - event.pageX;
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

    lastPageX = event.pageX;
    lastPageY = event.pageY;

    ResizeGrid();
}

function ResetViewer() {

    
    var viewer = document.getElementById("EnvisionPage");

    viewer.style.marginTop = "0px";
    viewer.style.marginLeft = "0px";
/*    viewer.style.transform = "scale(1)";*/
    viewer.style.transform = "scale(" + PageBaseScale +")";

    viewportPos = { x: 0, y: 0 };
    viewportTarget = { x: 0, y: 0 };
    viewportPointer = { x: 0, y: 0 };
/*    scale = 1;*/
    viewportScale = parseFloat(PageBaseScale);
    VarDict["client.PageScale"][0] = Math.trunc(viewportScale * 100);
    /*    image.style.transform = `translate(${pos.x}px,${pos.y}px) scale(${scale},${scale})`;*/

    ResizeGrid();
}

function CalculatePercentage(input, minraw, maxraw, minpx, maxpx) {

    //console.log('-------------------------');
    //console.log('input ' + input);
    //console.log('minraw ' + minraw);
    //console.log('maxraw ' + maxraw);
    //console.log('minpx ' + minpx);
    //console.log('maxpx ' + maxpx);

    var percentage = (input / (maxraw - minraw)) * 100;

    //console.log('percentage ' + percentage);

    if (percentage > 100) { percentage = 100; }
    if (percentage < -100) { percentage = -100; } 

    var calculated = (maxpx - minpx) / 100 * percentage;

    //console.log('calculated ' + calculated);

    return calculated;
}

function ResetViewerBtn() {
    
    if (document.getElementById("ResetViewerBtn").style.display !== "block") {
        var ResetViewerBtn = document.getElementById("ResetViewerBtn");
        ResetViewerBtn.style.display = "Block";
        ResetViewerBtn.style.opacity = 0;
        ResetViewerBtn.style.animation = 'none';
        ResetViewerBtn.offsetHeight; /* trigger reflow */
        ResetViewerBtn.style.animation = null;
    }

}

function ResetViewerBtnPush() {

    ResetViewer();

    var ResetViewerBtn = document.getElementById("ResetViewerBtn");
    ResetViewerBtn.style.display = "none";
    ResetViewerBtn.style.animation = 'none';
    ResetViewerBtn.offsetHeight; /* trigger reflow */
    ResetViewerBtn.style.animation = null;

}


function ResizeGrid() {
    document.getElementById("TheGrid").style.transform = document.getElementById("EnvisionPage").style.transform;
    document.getElementById("TheGrid").style.marginTop = document.getElementById("EnvisionPage").style.marginTop;
    document.getElementById("TheGrid").style.marginLeft = document.getElementById("EnvisionPage").style.marginLeft;
    document.getElementById("TheGrid").style.height = document.getElementById("EnvisionPage").style.height;
    document.getElementById("TheGrid").style.width = document.getElementById("EnvisionPage").style.width;
}
