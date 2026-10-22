
function SetBorders(element) {

    if (EditMode === true) { // FOR POPUP 

        var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

        for (var i = 0; i < draggables.length; i++) {

            var element = draggables.item(i);

            if (element.className.includes('ActiveSelected') && element.getAttribute('name') !== "GroupObject") {

                if (DraggingObject) {
                    return;
                }

                if (CheckLocked(element) === true) { 
                    continue;
                }

                if (element.getAttribute('name') == "PolylineObject") {
                    continue;
                }

                if (IsPartOfScaledGroupObject(element)) {
                    continue;
                }

                SetBorder(element);

                //if (element.parentElement.getAttribute('name') !== "PageObject") {

                //    if (element.getAttribute('name') === "GroupObject") {
                //        //necessary because groups have a 1px margin
                //        coords.top = coords.top + linewidth;
                //        coords.left = coords.left + linewidth;
                //    }
                //    else {
                //        var topmost = GetTopMostParentGroupObject(element);

                //        if (topmost) {
                //            coords.top = coords.top + linewidth;
                //            coords.left = coords.left + linewidth;
                //        }
                //    }

                //    var screenborderbuttontopleft = document.getElementById(element.id + "_screenborderbuttontopleft");
                //    if (!screenborderbuttontopleft) {
                //        screenborderbuttontopleft = document.createElement("div");
                //        screenborderbuttontopleft.className = "screenborderbuttontopleft";
                //        screenborderbuttontopleft.id = element.id + "_screenborderbuttontopleft";
                //        document.getElementById("EnvisionPage").appendChild(screenborderbuttontopleft);
                //    }
                //    screenborderbuttontopleft.style.top = (coords.top - dotsize) + "px";
                //    screenborderbuttontopleft.style.left = (coords.left - 5 - linewidth) + "px";

                //}

            }
            else {
                RemoveBorders(element);
            }
        }
    }

}

function SetBorder(element) {

    //console.log('setting border');

    var linewidth = 1;
    var dotsize = 4;

    if (element.getAttribute('name') == "PolygonObject") {
        RemovePolygonDot(getObjDom(element));
    }

    if (element.getAttribute('name') == "PolylineObject") {
        RemovePolylineDot(getObjDom(element));
    }

    var coords = getCoords(element);
    let compStyles = window.getComputedStyle(element);

    if (!element.style.top) {
        element.style.top = compStyles.getPropertyValue('top');
    }
    if (!element.style.left) {
        element.style.left = compStyles.getPropertyValue('left');
    }
    if (!element.style.height) {
        element.style.height = compStyles.getPropertyValue('height');
    }
    if (!element.style.width) {
        element.style.width = compStyles.getPropertyValue('width');
    }

    //console.log('height ' + element.style.height);
    //console.log('width ' + element.style.width);

    let elementwidth; 
    let elementheight;

    if (element.style.width.includes('%')) {
        elementwidth = compStyles.getPropertyValue('width').replace('px', '');
    }
    else {
        elementwidth = element.style.width.replace('px', '');
    }

    if (element.style.height.includes('%')) {
        elementheight = compStyles.getPropertyValue('height').replace('px', '');
    }
    else {
        elementheight = element.style.height.replace('px', '');
    }

    var borderbuttontopleft = document.getElementById(element.id + "_borderbuttontopleft");
    if (!borderbuttontopleft) {
        borderbuttontopleft = document.createElement("div");
        borderbuttontopleft.className = "borderbuttontopleft";
        borderbuttontopleft.id = element.id + "_borderbuttontopleft";
        borderbuttontopleft.setAttribute("data-system-elementid", element.id);
        borderbuttontopleft.addEventListener("mousedown", initDrag, false);
        borderbuttontopleft.setAttribute("data-system-bordertype", "topleft");
        document.getElementById("EnvisionPage").appendChild(borderbuttontopleft);
    }

    borderbuttontopleft.style.top = (coords.top - dotsize) + "px";
    borderbuttontopleft.style.left = (coords.left - dotsize) + "px";

    var borderbuttontop = document.getElementById(element.id + "_borderbuttontop");
    if (!borderbuttontop) {
        borderbuttontop = document.createElement("div");
        borderbuttontop.className = "borderbuttontop";
        borderbuttontop.id = element.id + "_borderbuttontop";
        borderbuttontop.setAttribute("data-system-elementid", element.id);
        borderbuttontop.addEventListener("mousedown", initDrag, false);
        borderbuttontop.setAttribute("data-system-bordertype", "top");
        document.getElementById("EnvisionPage").appendChild(borderbuttontop);
    }
    borderbuttontop.style.top = (coords.top - dotsize) + "px";
    borderbuttontop.style.left = (coords.left + parseFloat(elementwidth.replace('px', '') / 2) - dotsize + linewidth) + "px";

    var borderbuttontopright = document.getElementById(element.id + "_borderbuttontopright");
    if (!borderbuttontopright) {
        borderbuttontopright = document.createElement("div");
        borderbuttontopright.className = "borderbuttontopright";
        borderbuttontopright.id = element.id + "_borderbuttontopright";
        borderbuttontopright.setAttribute("data-system-elementid", element.id);
        borderbuttontopright.addEventListener("mousedown", initDrag, false);
        borderbuttontopright.setAttribute("data-system-bordertype", "topright");
        document.getElementById("EnvisionPage").appendChild(borderbuttontopright);
    }
    borderbuttontopright.style.top = (coords.top - dotsize) + "px";
    borderbuttontopright.style.left = (coords.left + parseFloat(elementwidth.replace('px', '')) - dotsize + (linewidth * 2)) + "px";

    var borderbuttonright = document.getElementById(element.id + "_borderbuttonright");
    if (!borderbuttonright) {
        borderbuttonright = document.createElement("div");
        borderbuttonright.className = "borderbuttonright";
        borderbuttonright.id = element.id + "_borderbuttonright";
        borderbuttonright.setAttribute("data-system-elementid", element.id);
        borderbuttonright.addEventListener("mousedown", initDrag, false);
        borderbuttonright.setAttribute("data-system-bordertype", "right");
        document.getElementById("EnvisionPage").appendChild(borderbuttonright);
    }
    borderbuttonright.style.top = (coords.top + parseFloat(elementheight.replace('px', '') / 2) - dotsize) + "px";
    borderbuttonright.style.left = (coords.left + parseFloat(elementwidth.replace('px', '')) - dotsize + + (linewidth * 2)) + "px";

    var borderbuttonbottomleft = document.getElementById(element.id + "_borderbuttonbottomleft");
    if (!borderbuttonbottomleft) {
        borderbuttonbottomleft = document.createElement("div");
        borderbuttonbottomleft.className = "borderbuttonbottomleft";
        borderbuttonbottomleft.id = element.id + "_borderbuttonbottomleft";
        borderbuttonbottomleft.setAttribute("data-system-elementid", element.id);
        borderbuttonbottomleft.addEventListener("mousedown", initDrag, false);
        borderbuttonbottomleft.setAttribute("data-system-bordertype", "bottomleft");
        document.getElementById("EnvisionPage").appendChild(borderbuttonbottomleft);
    }
    borderbuttonbottomleft.style.top = (coords.top + parseFloat(elementheight.replace('px', '')) - dotsize + + (linewidth * 2)) + "px";
    borderbuttonbottomleft.style.left = (coords.left - dotsize) + "px";

    var borderbuttonleft = document.getElementById(element.id + "_borderbuttonleft");
    if (!borderbuttonleft) {
        borderbuttonleft = document.createElement("div");
        borderbuttonleft.className = "borderbuttonleft";
        borderbuttonleft.id = element.id + "_borderbuttonleft";
        borderbuttonleft.setAttribute("data-system-elementid", element.id);
        borderbuttonleft.addEventListener("mousedown", initDrag, false);
        borderbuttonleft.setAttribute("data-system-bordertype", "left");
        document.getElementById("EnvisionPage").appendChild(borderbuttonleft);
    }
    borderbuttonleft.style.top = (coords.top + parseFloat(elementheight.replace('px', '') / 2) - dotsize) + "px";
    borderbuttonleft.style.left = (coords.left - dotsize) + "px";

    var borderbuttonbottomright = document.getElementById(element.id + "_borderbuttonbottomright");
    if (!borderbuttonbottomright) {
        borderbuttonbottomright = document.createElement("div");
        borderbuttonbottomright.className = "borderbuttonbottomright";
        borderbuttonbottomright.id = element.id + "_borderbuttonbottomright";
        borderbuttonbottomright.setAttribute("data-system-elementid", element.id);
        borderbuttonbottomright.addEventListener("mousedown", initDrag, false);
        borderbuttonbottomright.setAttribute("data-system-bordertype", "bottomright");
        document.getElementById("EnvisionPage").appendChild(borderbuttonbottomright);
    }
    borderbuttonbottomright.style.top = (coords.top + parseFloat(elementheight.replace('px', '')) - dotsize + + (linewidth * 2)) + "px";
    borderbuttonbottomright.style.left = (coords.left + parseFloat(elementwidth.replace('px', '')) - dotsize + + (linewidth * 2)) + "px";

    var borderbuttonbottom = document.getElementById(element.id + "_borderbuttonbottom");
    if (!borderbuttonbottom) {
        borderbuttonbottom = document.createElement("div");
        borderbuttonbottom.className = "borderbuttonbottom";
        borderbuttonbottom.id = element.id + "_borderbuttonbottom";
        borderbuttonbottom.setAttribute("data-system-elementid", element.id);
        borderbuttonbottom.addEventListener("mousedown", initDrag, false);
        borderbuttonbottom.setAttribute("data-system-bordertype", "bottom");
        document.getElementById("EnvisionPage").appendChild(borderbuttonbottom);
    }
    borderbuttonbottom.style.top = (coords.top + parseFloat(elementheight.replace('px', '')) - dotsize + + (linewidth * 2)) + "px";
    borderbuttonbottom.style.left = (coords.left + parseFloat(elementwidth.replace('px', '') / 2) - dotsize + linewidth) + "px";


}

function RemoveBorders(element) {

    //var screenborderbuttontopleft = document.getElementById(element.id + "_screenborderbuttontopleft");
    //if (screenborderbuttontopleft) {
    //    screenborderbuttontopleft.remove();
    //}

    var borderbuttontopleft = document.getElementById(element.id + "_borderbuttontopleft");
    if (borderbuttontopleft) {
        borderbuttontopleft.remove();
    }

    var borderbuttontop = document.getElementById(element.id + "_borderbuttontop");
    if (borderbuttontop) {
        borderbuttontop.remove();
    }

    var borderbuttontopright = document.getElementById(element.id + "_borderbuttontopright");
    if (borderbuttontopright) {
        borderbuttontopright.remove();
    }

    var borderbuttonright = document.getElementById(element.id + "_borderbuttonright");
    if (borderbuttonright) {
        borderbuttonright.remove();
    }

    var borderbuttonbottomright = document.getElementById(element.id + "_borderbuttonbottomright");
    if (borderbuttonbottomright) {
        borderbuttonbottomright.remove();
    }

    var borderbuttonbottom = document.getElementById(element.id + "_borderbuttonbottom");
    if (borderbuttonbottom) {
        borderbuttonbottom.remove();
    }

    var borderbuttonbottomleft = document.getElementById(element.id + "_borderbuttonbottomleft");
    if (borderbuttonbottomleft) {
        borderbuttonbottomleft.remove();
    }

    var borderbuttonleft = document.getElementById(element.id + "_borderbuttonleft");
    if (borderbuttonleft) {
        borderbuttonleft.remove();
    }

    if (!DraggingObject && element.getAttribute('name') == "PolygonObject") {
        RedrawPolygonDot(getObjDom(element));
    }

    if (!DraggingObject && element.getAttribute('name') == "PolylineObject") {
        RedrawPolylineDot(getObjDom(element));
    }

}

function ResetBorders() {

    if (EditMode === true) { // FOR POPUP 

        var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

        for (var i = 0; i < draggables.length; i++) {

            var element = draggables.item(i);

            RemoveBorders(element);

        }
    }

}

function RedrawBorders() {
    ResetBorders();
    SetBorders();
}

var draggingElement;
var ActiveElements;
var StartWidths = [];
var StartHeights = [];
var StartTops = [];
var StartLefts = [];

function initDrag(e) {
    
    e.stopPropagation(); // avoid clicking back page and deselecting everything

    if (e.button !== 0) {
        return;
    }

    draggingElement = document.getElementById(this.getAttribute("data-system-elementid"));

    LastSelectedActive = draggingElement;

    bordertype = this.getAttribute("data-system-bordertype");

    //draggingElement.removeEventListener("mousedown", SetDragConditions, false);

    //draggingElement.addEventListener("touchstart", SetDragConditions, false);

    startX = e.clientX;
    startY = e.clientY;

    InitResizeElements();

    document.documentElement.addEventListener("mousemove", doDrag, false);
    document.documentElement.addEventListener("mouseup", stopDrag, false);
}

function doDrag(e) {

    //TODO: show text helper showing size when resizing

    //console.log('resizing');

    //DraggingObject = true;

    var changeX = roundDownToNearestX(e.clientX - startX);
    var changeY = roundDownToNearestX(e.clientY - startY);

    if (viewportScale !== 1) {
        changeX = roundDownToNearestX(changeX / viewportScale);
        changeY = roundDownToNearestX(changeY / viewportScale);
    }

    ResizeElements(changeX, changeY);
    
}

function stopDrag(e) {


    document.documentElement.removeEventListener("mousemove", doDrag, false);
    document.documentElement.removeEventListener("mouseup", stopDrag, false);

    //draggingElement.addEventListener("mousedown", SetDragConditions, false);

    EndResizeElements();
    
    DraggingObject = false;

    saveSnapshot();
}

function InitResizeElements() {

    StartWidths = [];
    StartHeights = [];
    StartTops = [];
    StartLefts = [];

    ActiveElements = document.getElementById("EnvisionPage").getElementsByClassName("ActiveSelected");

    for (var i = 0; i < ActiveElements.length; i++) {

        var element = ActiveElements.item(i);

        var startWidth = parseFloat(
            document.defaultView.getComputedStyle(element).width,
            10
        );
        var startHeight = parseFloat(
            document.defaultView.getComputedStyle(element).height,
            10
        );
        var startTop = parseFloat(
            document.defaultView.getComputedStyle(element).top,
            10
        );
        var startLeft = parseFloat(
            document.defaultView.getComputedStyle(element).left,
            10
        );

        StartWidths.push(startWidth);
        StartHeights.push(startHeight);
        StartTops.push(startTop);
        StartLefts.push(startLeft);


        if (element.id !== draggingElement.id) {
            RemoveBorders(element);
        }
    }

}

function ManualResizeWidth(value) {

    draggingElement = document.getElementById(RightClickedObjectId);

    LastSelectedActive = draggingElement;

    bordertype = "right";

    InitResizeElementsManual();
    ResizeElements(value, 0, false);
    EndResizeElements();
}

function ManualResizeHeight(value) {

    draggingElement = document.getElementById(RightClickedObjectId);

    LastSelectedActive = draggingElement;

    bordertype = "bottom";

    InitResizeElementsManual();
    ResizeElements(0, value, false);
    EndResizeElements();
}

function InitResizeElementsManual() {

    StartWidths = [];
    StartHeights = [];
    StartTops = [];
    StartLefts = [];

    ActiveElements = document.getElementById("EnvisionPage").getElementsByClassName("ActiveSelected");

    for (var i = 0; i < ActiveElements.length; i++) {

        var element = ActiveElements.item(i);

        var startWidth = parseFloat(
            document.defaultView.getComputedStyle(element).width,
            10
        );
        var startHeight = parseFloat(
            document.defaultView.getComputedStyle(element).height,
            10
        );
        var startTop = parseFloat(
            document.defaultView.getComputedStyle(element).top,
            10
        );
        var startLeft = parseFloat(
            document.defaultView.getComputedStyle(element).left,
            10
        );

        StartWidths.push(0);
        StartHeights.push(0);
        StartTops.push(startTop);
        StartLefts.push(startLeft);


        if (element.id !== draggingElement.id) {
            RemoveBorders(element);
        }
    }

}


function ResizeElements(changeX, changeY, roundnearest = true) {

    for (var elno = 0; elno < ActiveElements.length; elno++) {

        var element = ActiveElements.item(elno);
        
        if (CheckLocked(element) === true) {
            return;
        }

        if (IsPartOfScaledGroupObject(element)) {
            ResizingScaledError();

            closeconfigs();

            return;
        }

        switch (element.getAttribute("name")) {
            case "InputObject":
            case "DateTimePickerObject":
            case "LabelObject":
            case "ButtonObject":
            case "SquareObject":
            case "CircleObject":
            case "TrendObject":
            case "WebFrameObject":
            case "DocumentViewerObject":
            case "AlarmViewerObject":
            case "EventViewerObject":
            case "AuditTrailViewerObject":
            case "TrendAnalystViewerObject":
            case "UsersViewerObject":
            case "WidgetObject":
            case "CheckBoxObject":
            case "RadioButtonObject":
            case "DropDownObject":
            case "ListBoxObject":
            case "AlarmBannerObject":
            case "DataTableObject":
            case "RecipeManagerObject":
            case "ImageObject":
            case "ToggleObject":
                AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], false, roundnearest);
                break;
            case "SliderObject":
                AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], false, roundnearest);
                resetthumbheight(element);
                break;
            case "DonutObject":
                AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], true, roundnearest);
                //resetthumbheight(element);
                break;
            case "BarGraphObject":
                AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], true, roundnearest);
                //resetthumbheight(element);
                break;
            case "MapObject":
                // forceratio false, like SquareObject and every other rectangular object: a map is
                // a viewport, not a circular widget, so a corner drag must size width and height
                // independently. It was grouped with Donut/BarGraph/Knob, which are genuinely
                // aspect-locked, and that also cost it the free-resize path's own >= 0 guards.
                // Holding Shift still constrains the ratio, exactly as it does elsewhere.
                AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], false, roundnearest);
                if (element._leafletmap) {
                    try { element._leafletmap.invalidateSize(); } catch (e) {}
                    if (typeof MapProjectChildren === "function") MapProjectChildren(element);
                }
                break;
            case "KnobObject":
                AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], true, roundnearest);
                break;
            case "SVGObject":
                {
                    let svgDom = element.getElementsByTagName("svg")[0];

                    AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], false, roundnearest);

                    svgDom.setAttribute("preserveAspectRatio", "none");

                    if (svgDom != null) {
                        ResetDimensionsSVG(svgDom);
                    }
                }
                break;

            case "PolygonObject":
                //complex
                {
                    var oldwidth = parseFloat(element.style.width.replace('px', ''));
                    var oldheight = parseFloat(element.style.height.replace('px', ''));

                    AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], false, roundnearest);

                    ResetViewBoxPolygon(getObjDom(element));

                    var newwidth = parseFloat(element.style.width.replace('px', ''));
                    var newheight = parseFloat(element.style.height.replace('px', ''));

                    var diffxper = 100 * Math.abs((oldwidth - newwidth) / ((oldwidth + newwidth) / 2));
                    var diffyper = 100 * Math.abs((oldheight - newheight) / ((oldheight + newheight) / 2));

                    var widthgrowing = newwidth > oldwidth;
                    var heightgrowing = newheight > oldheight;

                    //console.log('diffxper ' + diffxper);

                    let polygon = element.getElementsByTagName("polygon")[0];

                    polygonpoints = polygon.getAttribute('points');

                    var points = [];
                    var pointsX = [];
                    var pointsY = [];

                    points = polygonpoints.split(',');

                    for (var i = 0; i < points.length; i++) {
                        var xy = points[i].split(' ');
                        pointsX[i] = xy[0];
                        pointsY[i] = xy[1];
                    }

                    var newpoints = "";

                    for (var i = 0; i < points.length; i++) {

                        var newx = 0;
                        var newy = 0;

                        //console.log('parseFloat(pointsX[i] ', parseFloat(pointsX[i]));
                        //console.log('oldwidth ', oldwidth);

                        if (parseFloat(pointsX[i]) == oldwidth) {

                            newx = newwidth;
                            //console.log('same width');
                        }
                        else {
                            if (diffxper > 0.0) {
                                if (widthgrowing) {
                                    newx = parseFloat(pointsX[i]) + (parseFloat(pointsX[i]) / 100 * diffxper);
                                }
                                else {
                                    newx = parseFloat(pointsX[i]) - (parseFloat(pointsX[i]) / 100 * diffxper);
                                }
                            }
                            else {
                                newx = parseFloat(pointsX[i]);
                            }
                        }

                        if (parseFloat(pointsY[i]) == oldheight) {
                            newy = newheight;
                            //console.log('same height');
                        }
                        else {
                            if (diffyper > 0.0) {
                                if (heightgrowing) {
                                    newy = parseFloat(pointsY[i]) + (parseFloat(pointsY[i]) / 100 * diffyper);
                                }
                                else {
                                    newy = parseFloat(pointsY[i]) - (parseFloat(pointsY[i]) / 100 * diffyper);
                                }
                            }
                            else {
                                newy = parseFloat(pointsY[i]);
                            }
                        }


                        //console.log(newy);
                        //console.log(newx);

                        //console.log(parseFloat(pointsX[i]));
                        //console.log(parseFloat(diffy));

                        newpoints = newpoints + newx + " " + newy + ",";
                    }

                    newpoints = newpoints.slice(0, -1); // remove last ,

                    //console.log(newpoints);

                    polygon.setAttribute('points', newpoints);

                    //RedrawPolygonDots(); // TODO only redraw this one
                }
                break;

            case "PolylineObject":
                //complex
                {
                    let polyline = element.getElementsByTagName("polyline")[0];

                    polylinepoints = polyline.getAttribute('points');

                    var points = [];
                    var pointsX = [];
                    var pointsY = [];

                    var maxtop = 0;
                    var maxleft = 0;

                    points = polylinepoints.split(' ');

                    for (var i = 0; i < points.length; i++) {
                        var xy = points[i].split(',');
                        pointsX[i] = xy[0];
                        pointsY[i] = xy[1];

                        if (pointsY[i] > maxtop) {
                            maxtop = pointsY[i];
                        }

                        if (pointsX[i] > maxleft) {
                            maxleft = pointsX[i];
                        }
                    }


                    //

                    var oldwidth = parseFloat(element.style.width.replace('px', ''));
                    var oldheight = parseFloat(element.style.height.replace('px', ''));
                    AdjustElement(element, changeX, changeY, StartWidths[elno], StartHeights[elno], StartTops[elno], StartLefts[elno], false, roundnearest);

                    //console.log(oldwidth);
                    //console.log('---------');
                    //

                    //var oldwidth = parseFloat(element.style.width.replace('px', ''));
                    //var oldheight = parseFloat(element.style.height.replace('px', ''));

                    //var calcnewwidth = roundDownToNearestX(StartWidths[i] + e.clientX - startX);
                    //var calcnewheight = roundDownToNearestX(StartHeights[i] + e.clientY - startY);

                    //if (calcnewwidth <= 5) {
                    //    calcnewwidth = 5;
                    //}

                    //if (calcnewheight <= 5) {
                    //    calcnewheight = 5;
                    //}

                    //if (maxtop == 0) {
                    //    calcnewheight = 0;
                    //}

                    //if (maxleft == 0) {
                    //    calcnewwidth = 0;
                    //}

                    //element.style.width = calcnewwidth + "px";
                    //element.style.height = calcnewheight + "px";

                    ResetViewBoxPolyline(getObjDom(element));

                    var newwidth = parseFloat(element.style.width.replace('px', ''));
                    var newheight = parseFloat(element.style.height.replace('px', ''));

                    var diffxper = 100 * Math.abs((oldwidth - newwidth) / ((oldwidth + newwidth) / 2));
                    var diffyper = 100 * Math.abs((oldheight - newheight) / ((oldheight + newheight) / 2));

                    var widthgrowing = newwidth > oldwidth;
                    var heightgrowing = newheight > oldheight;

                    var newpoints = "";

                    for (var i = 0; i < points.length; i++) {

                        var newx = 0;
                        var newy = 0;

                        //console.log('parseFloat(pointsX[i] ', parseFloat(pointsX[i]));
                        //console.log('oldwidth ', oldwidth);

                        if (parseFloat(pointsX[i]) == oldwidth) {

                            newx = newwidth;
                            //console.log('same width');
                        }
                        else {
                            if (diffxper > 0.0) {
                                if (widthgrowing) {
                                    newx = parseFloat(pointsX[i]) + (parseFloat(pointsX[i]) / 100 * diffxper);
                                }
                                else {
                                    newx = parseFloat(pointsX[i]) - (parseFloat(pointsX[i]) / 100 * diffxper);
                                }

                            }
                            else {
                                newx = parseFloat(pointsX[i]);
                            }
                        }


                        if (parseFloat(pointsY[i]) == oldheight) {
                            newy = newheight;
                            //console.log('same height');
                        }
                        else {
                            if (diffyper > 0.0) {
                                if (heightgrowing) {
                                    newy = parseFloat(pointsY[i]) + (parseFloat(pointsY[i]) / 100 * diffyper);
                                }
                                else {
                                    newy = parseFloat(pointsY[i]) - (parseFloat(pointsY[i]) / 100 * diffyper);
                                }
                            }
                            else {
                                newy = parseFloat(pointsY[i]);
                            }
                        }


                        //console.log(newy);
                        //console.log(newx);

                        //console.log(parseFloat(pointsX[i]));
                        //console.log(parseFloat(diffy));

                        newpoints = newpoints + newx + "," + newy + " ";
                    }

                    newpoints = newpoints.slice(0, -1); // remove last space

                    //console.log(newpoints);

                    polyline.setAttribute('points', newpoints);

                    RedrawPolylineDots(); // TODO only redraw this one

                }
                break;

            case "GroupObject":
                // DO NOTHING / DISABLE
                break;

            default:
            // DO NOTHING
            //element.style.width = startWidth + e.clientX - startX + "px";
            //element.style.height = startHeight + e.clientX - startX + "px";
            //element.style.height = startHeight + e.clientY - startY + "px";
        }
        
        if (draggingElement.id == element.id) {
            
            SetBorder(element);
        }

        //CheckResizeGroup2(element); V20260303 - Moved to EndResizeElements

    }


    // V20230310 WHY IS THIS HERE? MOVED TO ABOVE SVGOBJECT
    //let svgDom = element.getElementsByTagName("svg")[0];
    //if (svgDom != null) {

    //    svgDom.style.width = element.style.width;
    //    svgDom.style.height = element.style.height;
    //}

    //console.log(element.style.width + " " + element.style.height);

    SetResetTexts();
}

function EndResizeElements() {

    for (var i = 0; i < ActiveElements.length; i++) {

        var element = ActiveElements.item(i);

        CheckResizeGroup2(element);

        if (element.getAttribute("name") == "SliderObject") {
            ObjDom = getObjDom(element);

            slidertoinit(ObjDom);
        }


    }

}

function AdjustElement(element, changeX, changeY, startWidth, startHeight, startTop, startLeft, forceratio, roundnearest) {
    
    const maybeRound = (v) => roundnearest ? roundToNearestx(v) : v;
    const diffFromRounded = (v) => roundnearest ? (v - roundToNearestx(v)) : 0;

    switch (bordertype) {
        case "topleft":

            if (!ShiftKeyPressed && !forceratio) {

                if ((startWidth + -changeX) >= 0) {
                    const newLeft = startLeft + changeX;
                    const leftToApply = maybeRound(newLeft);
                    element.style.left = leftToApply + "px";
                    element.style.width = (startWidth + -changeX + (newLeft - leftToApply)) + "px";
                }

                if ((startHeight + -changeY) >= 0) {
                    const newTop = startTop + changeY;
                    const topToApply = maybeRound(newTop);
                    element.style.top = topToApply + "px";
                    element.style.height = (startHeight + -changeY + (newTop - topToApply)) + "px";
                }
            }
            else {

                if (startHeight > startWidth) {
                    ratio = (startHeight + -changeY) / startHeight;

                    if ((startWidth * ratio) >= 0) {
                        element.style.width = (startWidth * ratio) + "px";
                        element.style.left = (startLeft + (startWidth - (startWidth * ratio))) + "px";
                    }

                    if ((startHeight + -changeY) >= 0) {
                        element.style.height = (startHeight + -changeY) + "px";
                        element.style.top = (startTop + changeY) + "px";
                    }
                }
                else {
                    ratio = (startWidth + -changeX) / startWidth;

                    if ((startWidth + -changeX) >= 0) {
                        element.style.width = (startWidth + -changeX) + "px";
                        element.style.left = (startLeft + changeX) + "px";
                    }

                    if ((startHeight * ratio) >= 0) {
                        element.style.height = (startHeight * ratio) + "px";
                        element.style.top = (startTop + (startHeight - (startHeight * ratio))) + "px";
                    }

                }
            }

            break;
        case "top":

            if ((startHeight + -changeY) >= 0) {
                const newTop = startTop + changeY;
                const topToApply = maybeRound(newTop);
                element.style.top = topToApply + "px";
                element.style.height = (startHeight + -changeY + (newTop - topToApply)) + "px";
            }

            break;
        case "topright":

            if (!ShiftKeyPressed && !forceratio) {

                if ((startHeight + -changeY) >= 0) {

                    const newTop = startTop + changeY;
                    const topToApply = maybeRound(newTop);
                    element.style.top = topToApply + "px";
                    element.style.height = (startHeight + -changeY + (newTop - topToApply)) + "px";

                    let diffleft = diffFromRounded(startLeft);
                    element.style.width = (maybeRound(startWidth + changeX) - diffleft) + "px";

                }
            }
            else {

                if (startHeight > startWidth) {

                    if ((startHeight + -changeY) >= 0) {
                        ratio = (startHeight + -changeY) / startHeight;

                        element.style.width = (startWidth * ratio) + "px";
                        element.style.height = (startHeight + -changeY) + "px";
                        element.style.top = (startTop + changeY) + "px";
                    }
                }
                else {

                    ratio = (startWidth + changeX) / startWidth;

                    if ((startHeight * ratio) >= 0) {
                        element.style.width = (startWidth + changeX) + "px";
                        element.style.height = (startHeight * ratio) + "px";

                        element.style.top = (startTop + (startHeight - (startHeight * ratio))) + "px";
                    }
                }
            }

            break;
        case "right":
            {
                let diffleft = diffFromRounded(startLeft);
                element.style.width = (maybeRound(startWidth + changeX) - diffleft) + "px";
            }
            break;
        case "bottomright":

            if (!ShiftKeyPressed && !forceratio) {
                let difftop = diffFromRounded(startTop);
                element.style.height = (maybeRound(startHeight + changeY) - difftop) + "px";

                let diffleft = diffFromRounded(startLeft);
                element.style.width = (maybeRound(startWidth + changeX) - diffleft) + "px";
            }
            else {

                if (startHeight > startWidth) {
                    ratio = (startHeight + changeY) / startHeight;

                    element.style.width = (startWidth * ratio) + "px";
                    element.style.height = (startHeight + changeY) + "px";
                }
                else {
                    ratio = (startWidth + changeX) / startWidth;

                    element.style.width = (startWidth + changeX) + "px";
                    element.style.height = (startHeight * ratio) + "px";
                }
            }

            break;
        case "bottom":
            {
                let difftop = diffFromRounded(startTop);
                element.style.height = (maybeRound(startHeight + changeY) - difftop) + "px";
            }
            break;
        case "bottomleft":

            if (!ShiftKeyPressed && !forceratio) {

                if ((startWidth + -changeX) >= 0) {

                    let difftop = diffFromRounded(startTop);
                    element.style.height = (maybeRound(startHeight + changeY) - difftop) + "px";

                    const newLeft = startLeft + changeX;
                    const leftToApply = maybeRound(newLeft);
                    element.style.left = leftToApply + "px";
                    element.style.width = (startWidth + -changeX + (newLeft - leftToApply)) + "px";
                }
            }
            else {

                if (startHeight > startWidth) {
                    ratio = (startHeight + changeY) / startHeight;

                    if ((startWidth * ratio) >= 0) {
                        element.style.width = (startWidth * ratio) + "px";
                        element.style.height = (startHeight + changeY) + "px";

                        element.style.left = (startLeft + (startWidth - (startWidth * ratio))) + "px";
                    }


                }
                else {
                    if ((startWidth + -changeX) >= 0) {
                        ratio = (startWidth + -changeX) / startWidth;

                        element.style.width = (startWidth + -changeX) + "px";
                        element.style.height = (startHeight * ratio) + "px";

                        element.style.left = (startLeft + changeX) + "px";
                    }
                }
            }

            break
        case "left":
            
            if ((startWidth + -changeX) >= 0) {
                var newLeft = startLeft + changeX;
                var leftToApply = maybeRound(newLeft);

                element.style.left = leftToApply + "px";
                element.style.width = (startWidth + -changeX + (newLeft - leftToApply)) + "px";
            }

            startLeft = 0;
            break;
    }
}


function AdjustElementOld(element, changeX, changeY, startWidth, startHeight, startTop, startLeft, forceratio, roundnearest) {

    switch (bordertype) {
        case "topleft":

            if (!ShiftKeyPressed && !forceratio) {

                if ((startWidth + -changeX) >= 0) {
                    element.style.left = roundToNearestx(startLeft + changeX) + "px";
                    element.style.width = (startWidth + -changeX + ((startLeft + changeX) - roundToNearestx(startLeft + changeX))) + "px";
                }

                if ((startHeight + -changeY) >= 0) {
                    element.style.top = roundToNearestx(startTop + changeY) + "px";
                    element.style.height = (startHeight + -changeY + ((startTop + changeY) - roundToNearestx(startTop + changeY))) + "px";
                }             
            }
            else {

                if (startHeight > startWidth) {
                    ratio = (startHeight + -changeY) / startHeight;

                    if ((startWidth * ratio) >= 0) {
                        element.style.width = (startWidth * ratio) + "px";
                        element.style.left = (startLeft + (startWidth - (startWidth * ratio))) + "px";
                    }

                    if ((startHeight + -changeY) >= 0) {
                        element.style.height = (startHeight + -changeY) + "px";
                        element.style.top = (startTop + changeY) + "px";
                    } 
                }
                else {
                    ratio = (startWidth + -changeX) / startWidth;

                    if ((startWidth + -changeX) >= 0) {
                        element.style.width = (startWidth + -changeX) + "px";
                        element.style.left = (startLeft + changeX) + "px";
                    }

                    if ((startHeight * ratio) >= 0) {
                        element.style.height = (startHeight * ratio) + "px";
                        element.style.top = (startTop + (startHeight - (startHeight * ratio))) + "px";
                    } 
 
                }
            }

            break;
        case "top":

            if ((startHeight + -changeY) >= 0) {
                element.style.top = roundToNearestx(startTop + changeY) + "px";
                element.style.height = (startHeight + -changeY + ((startTop + changeY) - roundToNearestx(startTop + changeY))) + "px";
            }

            break;
        case "topright":

            if (!ShiftKeyPressed && !forceratio) {

                if ((startHeight + -changeY) >= 0) {

                    element.style.top = roundToNearestx(startTop + changeY) + "px";
                    element.style.height = (startHeight + -changeY + ((startTop + changeY) - roundToNearestx(startTop + changeY))) + "px";

                    let diffleft = (startLeft) - roundToNearestx(startLeft);
                    element.style.width = (roundToNearestx(startWidth + changeX) - diffleft) + "px";

                }
            }
            else {
                
                if (startHeight > startWidth) {

                    if ((startHeight + -changeY) >= 0) {
                        ratio = (startHeight + -changeY) / startHeight;

                        element.style.width = (startWidth * ratio) + "px";
                        element.style.height = (startHeight + -changeY) + "px";
                        element.style.top = (startTop + changeY) + "px";
                    }
                }
                else {

                    ratio = (startWidth + changeX) / startWidth;

                    if ((startHeight * ratio) >= 0) {
                        element.style.width = (startWidth + changeX) + "px";
                        element.style.height = (startHeight * ratio) + "px";

                        element.style.top = (startTop + (startHeight - (startHeight * ratio))) + "px";
                    } 
                }
            }

            break;
        case "right":
            { 
                let diffleft = (startLeft) - roundToNearestx(startLeft);
                element.style.width = (roundToNearestx(startWidth + changeX) - diffleft) + "px";
            }
            break;
        case "bottomright":

            if (!ShiftKeyPressed && !forceratio) {
                let difftop = (startTop) - roundToNearestx(startTop);
                element.style.height = (roundToNearestx(startHeight + changeY) - difftop) + "px";

                let diffleft = (startLeft) - roundToNearestx(startLeft);
                element.style.width = (roundToNearestx(startWidth + changeX) - diffleft) + "px";
            }
            else {

                if (startHeight > startWidth) {
                    ratio = (startHeight + changeY) / startHeight;

                    element.style.width = (startWidth * ratio) + "px";
                    element.style.height = (startHeight + changeY) + "px";
                }
                else {
                    ratio = (startWidth + changeX) / startWidth;

                    element.style.width = (startWidth + changeX) + "px";
                    element.style.height = (startHeight * ratio) + "px";
                }
            }

            break;
        case "bottom":
            {
                let difftop = (startTop) - roundToNearestx(startTop);

                element.style.height = (roundToNearestx(startHeight + changeY) - difftop) + "px";
            }
            break;
        case "bottomleft":

            if (!ShiftKeyPressed && !forceratio) {

                if ((startWidth + -changeX) >= 0) {

                    let difftop = (startTop) - roundToNearestx(startTop);
                    element.style.height = (roundToNearestx(startHeight + changeY) - difftop) + "px";

                    element.style.left = roundToNearestx(startLeft + changeX) + "px";
                    element.style.width = (startWidth + -changeX + ((startLeft + changeX) - roundToNearestx(startLeft + changeX))) + "px";
                }  
            }
            else {

                if (startHeight > startWidth) {
                    ratio = (startHeight + changeY) / startHeight;

                    if ((startWidth * ratio) >= 0) {
                        element.style.width = (startWidth * ratio) + "px";
                        element.style.height = (startHeight + changeY) + "px";

                        element.style.left = (startLeft + (startWidth - (startWidth * ratio))) + "px";
                    }

                    
                }
                else {
                    if ((startWidth + -changeX) >= 0) {
                        ratio = (startWidth + -changeX) / startWidth;

                        element.style.width = (startWidth + -changeX) + "px";
                        element.style.height = (startHeight * ratio) + "px";

                        element.style.left = (startLeft + changeX) + "px";
                    }
                }
            }

            break
        case "left":

            if ((startWidth + -changeX) >= 0) {
                element.style.left = roundToNearestx(startLeft + changeX) + "px";
                element.style.width = (startWidth + -changeX + ((startLeft + changeX) - roundToNearestx(startLeft + changeX))) + "px";
            }
            
            break;
    }
}