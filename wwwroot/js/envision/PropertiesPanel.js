// Envision PropertiesPanel - Properties panel core: refreshDecorators/showmulticontextmenu orchestration, context dispatch/visibility, shared style-format sections, collapsibles.
// Split from Envision.js. Global scope (no module system); load order defined in Envision.cshtml.
// Envision PropertiesPanel - Properties panel: refreshDecorators dispatcher, per-type *ContextInit builders, style format sections.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

function setupContext(prefix, key, customHandler = null, initFunction = null) {
    const attrName = key.toLowerCase();
    const dataAttr = "data-" + attrName;
    const elementId = prefix + key;

    let value = ElementToBeDecorated.getAttribute(dataAttr);

    const element = document.getElementById(elementId);
    element.value = value;
    
    if (typeof customHandler === "function") {
        element.addEventListener('input', function (e) {
            customHandler(e, attrName, initFunction);
        });
        
    }
    else {
        const handlerName = prefix + "InputHandler" + key; //e.g.: DonutContextInputHandlerRadiusWidth 
        element.addEventListener('input', function (e) {
            window[handlerName](e, attrName, initFunction);
        });
    }  
}

function setupContextCheckbox(prefix, key, customHandler = null, initFunction = null) {
    const attrName = key.toLowerCase();
    const dataAttr = "data-" + attrName;
    const elementId = prefix + key;

    let value = ElementToBeDecorated.getAttribute(dataAttr);

    const element = document.getElementById(elementId);

    element.checked = (value.toLowerCase() === "true");

    if (typeof customHandler === "function") {
        element.addEventListener('input', function (e) {
            customHandler(e, attrName, initFunction);
        });

    }
    else {
        const handlerName = prefix + "InputHandler" + key; //e.g.: DonutContextInputHandlerRadiusWidth 
        element.addEventListener('input', function (e) {
            window[handlerName](e, attrName, initFunction);
        });
    }
}

function refreshDecorators() {
    const element = document.getElementById(RightClickedObjectId);

    if (element && decoratoropen) {
        showmulticontextmenu(element);
    }
}


async function showmulticontextmenu(e) {
    if (CtrlKeyPressed) {
        return;
    }

    if (typeof CloseEnvisionChatSidebar === 'function') {
        CloseEnvisionChatSidebar();
    }

    ObjectViewerOpen = false;

    // Sleep is necessary or it will close immediately.
    await sleep(100);

    ResetContextPanel();

    // TODO: should all be EnvisionPage.geteleme...
    var elements = document.getElementsByClassName("ActiveSelected");

    const selectedContexts = DetermineSelectedContexts(elements);

    //var Object = ElementsToBeDecorated[0];
    var obj = document.getElementById(RightClickedObjectId); // v2023 03 20 to show the properties of the selected object
    // if different = show limited, else, show all

    LastSelectedActive = obj;
    SetResetTexts();
    SetBorders();

    ApplyContextVisibility(obj, selectedContexts);
}

// Hides all property sub-contexts and closes side panels/menus before the panel is rebuilt.
function ResetContextPanel() {
    // Inside the Multi Context Menu
    // Hide all sub context elements before enabling the right one for the selected class.
    var childSubContext = document.getElementsByClassName('SubContext')
    for (var i = 0; i < childSubContext.length; i++) {
        childSubContext[i].style.display = 'None';
    }

    //re enable configurable properties
    document.getElementById('StyleFormatContextBorderRadius').parentElement.parentElement.style.display = "flex";
    document.getElementById('StyleFormatContextHeight').parentElement.parentElement.style.display = "flex";
    document.getElementById('StyleFormatContextWidth').parentElement.parentElement.style.display = "flex";

    // for arrow keys
    decoratoropen = true;

    // close z-index layers editor
    closeZIndexLayersSidebar();

    // close context menu's
    ClosePolygonDotContextMenu();
    ClosePolylineDotContextMenu();
}

// Determines which object types are selected and how many different types there are.
function DetermineSelectedContexts(elements) {
    let svgcontextselected = false;
    let imagecontextselected = false;
    let buttoncontextselected = false;
    let inputcontextselected = false;
    let datetimepickercontextselected = false;
    let labelcontextselected = false;
    let squarecontextselected = false;
    let knobcontextselected = false;
    let circlecontextselected = false;
    let trendcontextselected = false;
    let alarmbannercontextselected = false;
    let datatablecontextselected = false;
    let webframecontextselected = false;
    let documentviewercontextselected = false;
    let alarmviewercontextselected = false;
    let eventviewercontextselected = false;
    let audittrailviewercontextselected = false;
    let trendanalystviewercontextselected = false;
    let usersviewercontextselected = false;
    let widgetcontextselected = false;
    let slidercontextselected = false;
    let donutcontextselected = false;
    let bargraphcontextselected = false;
    let mapcontextselected = false;
    let checkboxcontextselected = false;
    let togglecontextselected = false;
    let radiobuttoncontextselected = false;
    let dropdowncontextselected = false;
    let listboxcontextselected = false;
    let polygoncontextselected = false;
    let polylinecontextselected = false;
    let recipemanagercontextselected = false;
    let groupcontextselected = false;

    this.ElementsToBeDecorated = elements;


    // check how many different elements are selected.
    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];
        //console.log(element.getAttribute("name"));
        switch (element.getAttribute("name")) {
            case "SVGObject":
                svgcontextselected = true;
                break;
            case "ImageObject":
                imagecontextselected = true;
                break;
            case "ButtonObject":
                buttoncontextselected = true;
                break;
            case "InputObject":
                inputcontextselected = true;
                break;
            case "DateTimePickerObject":
                datetimepickercontextselected = true;
                break;
            case "LabelObject":
                labelcontextselected = true;
                break;
            case "SquareObject":
                squarecontextselected = true;
                break;
            case "CircleObject":
                circlecontextselected = true;
                break;
            case "KnobObject":
                knobcontextselected = true;
                break;
            case "TrendObject":
                trendcontextselected = true;
                break;
            case "AlarmBannerObject":
                alarmbannercontextselected = true;
                break;
            case "DataTableObject":
                datatablecontextselected = true;
                break;
            case "WebFrameObject":
                webframecontextselected = true;
                break;
            case "DocumentViewerObject":
                documentviewercontextselected = true;
                break;
            case "AlarmViewerObject":
                alarmviewercontextselected = true;
                break;
            case "EventViewerObject":
                eventviewercontextselected = true;
                break;
            case "AuditTrailViewerObject":
                audittrailviewercontextselected = true;
                break;
            case "TrendAnalystViewerObject":
                trendanalystviewercontextselected = true;
                break;
            case "UsersViewerObject":
                usersviewercontextselected = true;
                break;
            case "WidgetObject":
                widgetcontextselected = true;
                break;
            case "SliderObject":
                slidercontextselected = true;
                break;
            case "DonutObject":
                donutcontextselected = true;
                break;
            case "BarGraphObject":
                bargraphcontextselected = true;
                break;
            case "MapObject":
                mapcontextselected = true;
                break;
            case "CheckBoxObject":
                checkboxcontextselected = true;
                break;
            case "ToggleObject":
                togglecontextselected = true;
                break;
            case "RadioButtonObject":
                radiobuttoncontextselected = true;
                break;
            case "DropDownObject":
                dropdowncontextselected = true;
                break;
            case "ListBoxObject":
                listboxcontextselected = true;
                break;
            case "PolygonObject":
                polygoncontextselected = true;
                break;
            case "PolylineObject":
                polylinecontextselected = true;
                break;
            case "RecipeManagerObject":
                recipemanagercontextselected = true;
                break;
            case "GroupObject":
                groupcontextselected = true;
                break;
            default:
                break
        }
    }

    var differentselectedcounter = 0;

    if (svgcontextselected) {
        differentselectedcounter++;
    }

    if (imagecontextselected) {
        differentselectedcounter++;
    }

    if (buttoncontextselected) {
        differentselectedcounter++;
    }

    if (inputcontextselected) {
        differentselectedcounter++;
    }

    if (datetimepickercontextselected) {
        differentselectedcounter++;
    }

    if (labelcontextselected) {
        differentselectedcounter++;
    }

    if (squarecontextselected) {
        differentselectedcounter++;
    }

    if (circlecontextselected) {
        differentselectedcounter++;
    }

    if (knobcontextselected) {
        differentselectedcounter++;
    }

    if (trendcontextselected) {
        differentselectedcounter++;
    }

    if (alarmbannercontextselected) {
        differentselectedcounter++;
    }

    if (datatablecontextselected) {
        differentselectedcounter++;
    }

    if (webframecontextselected) {
        differentselectedcounter++;
    }

    if (documentviewercontextselected) {
        differentselectedcounter++;
    }

    if (alarmviewercontextselected) {
        differentselectedcounter++;
    }

    if (eventviewercontextselected) {
        differentselectedcounter++;
    }

    if (audittrailviewercontextselected) {
        differentselectedcounter++;
    }

    if (trendanalystviewercontextselected) {
        differentselectedcounter++;
    }

    if (usersviewercontextselected) {
        differentselectedcounter++;
    }

    if (widgetcontextselected) {
        differentselectedcounter++;
    }

    if (slidercontextselected) {
        differentselectedcounter++;
    }

    if (donutcontextselected) {
        differentselectedcounter++;
    }
    if (bargraphcontextselected)
    {
        differentselectedcounter++;
    }

    if (mapcontextselected) {
        differentselectedcounter++;
    }

    if (dropdowncontextselected) {
        differentselectedcounter++;
    }

    if (listboxcontextselected) {
        differentselectedcounter++;
    }

    if (polygoncontextselected) {
        differentselectedcounter++;
    }

    if (polylinecontextselected) {
        differentselectedcounter++;
    }

    if (recipemanagercontextselected) {
        differentselectedcounter++;
    }

    if (checkboxcontextselected) {
        differentselectedcounter++;
    }

    if (togglecontextselected) {
        differentselectedcounter++;
    }

    if (radiobuttoncontextselected) {
        differentselectedcounter++;
    }

    if (groupcontextselected) {
        differentselectedcounter++;
    }

    return {
        svgcontextselected,
        imagecontextselected,
        buttoncontextselected,
        inputcontextselected,
        datetimepickercontextselected,
        labelcontextselected,
        squarecontextselected,
        knobcontextselected,
        circlecontextselected,
        trendcontextselected,
        alarmbannercontextselected,
        datatablecontextselected,
        webframecontextselected,
        documentviewercontextselected,
        alarmviewercontextselected,
        eventviewercontextselected,
        audittrailviewercontextselected,
        trendanalystviewercontextselected,
        usersviewercontextselected,
        widgetcontextselected,
        slidercontextselected,
        donutcontextselected,
        bargraphcontextselected,
        mapcontextselected,
        checkboxcontextselected,
        togglecontextselected,
        radiobuttoncontextselected,
        dropdowncontextselected,
        listboxcontextselected,
        polygoncontextselected,
        polylinecontextselected,
        recipemanagercontextselected,
        groupcontextselected,
        differentselectedcounter
    };
}

// Shows the property panel sections for the current selection: limited common sections when
// multiple different object types are selected, the full per-type panel otherwise.
function ApplyContextVisibility(obj, selectedContexts) {
    const {
        svgcontextselected,
        imagecontextselected,
        buttoncontextselected,
        inputcontextselected,
        datetimepickercontextselected,
        labelcontextselected,
        squarecontextselected,
        knobcontextselected,
        circlecontextselected,
        trendcontextselected,
        alarmbannercontextselected,
        datatablecontextselected,
        webframecontextselected,
        documentviewercontextselected,
        alarmviewercontextselected,
        eventviewercontextselected,
        audittrailviewercontextselected,
        trendanalystviewercontextselected,
        usersviewercontextselected,
        widgetcontextselected,
        slidercontextselected,
        donutcontextselected,
        bargraphcontextselected,
        mapcontextselected,
        checkboxcontextselected,
        togglecontextselected,
        radiobuttoncontextselected,
        dropdowncontextselected,
        listboxcontextselected,
        polygoncontextselected,
        polylinecontextselected,
        recipemanagercontextselected,
        groupcontextselected,
        differentselectedcounter
    } = selectedContexts;

    if (differentselectedcounter > 1) { // SHOW LIMITED

        //ADD ObjectActionsContext
        StyleFormatContext = document.getElementById("ObjectActionsContext");
        StyleFormatContext.style.display = "block";
        StyleFormatContext.remove();
        document.getElementById("MultiContext").append(StyleFormatContext);

        //ADD GenericContext (just for header) 
        StyleFormatContext = document.getElementById("GenericContext");
        StyleFormatContext.style.display = "block";
        StyleFormatContext.remove();
        document.getElementById("MultiContext").append(StyleFormatContext);

        //ADD PositionSizeStyleFormatContext
        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
        StyleFormatContext.style.display = "block";
        StyleFormatContext.remove();
        document.getElementById("MultiContext").append(StyleFormatContext);

        //ADD AnimatePositionSizeStyleFormatContext
        StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
        StyleFormatContext.style.display = "block";
        StyleFormatContext.remove();
        document.getElementById("MultiContext").append(StyleFormatContext);

        //ADD VisibilityStyleFormatContext
        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
        StyleFormatContext.style.display = "block";
        StyleFormatContext.remove();
        document.getElementById("MultiContext").append(StyleFormatContext);

        document.getElementById("MultiContext").style.display = 'block';
        document.getElementById("MultiContextDragLine").style.display = 'block';
        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
        //document.getElementById("SVGContext").style.left = left + 'px';
        //document.getElementById("SVGContext").style.top = top + 'px';

        let ObjDom;

        switch (obj.getAttribute("name")) {
            case "SVGObject": { ObjDom = obj.getElementsByTagName("svg")[0]; }
                break;
            case "ImageObject": { ObjDom = obj.getElementsByTagName("img")[0]; }
                break;
            case "ButtonObject": { ObjDom = obj.getElementsByTagName("button")[0]; }
                break;
            case "InputObject": { ObjDom = obj.getElementsByTagName("input")[0]; }
                break;
            case "DateTimePickerObject": { ObjDom = obj.getElementsByTagName("input")[0]; }
                break;
            case "LabelObject": { ObjDom = obj.getElementsByTagName("textarea")[0]; }
                break;
            case "SquareObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "CircleObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "KnobObject": { ObjDom = obj.getElementsByTagName("svg")[0]; }
                break;
            case "TrendObject": { ObjDom = obj.getElementsByTagName("canvas")[0]; }
                break;
            case "AlarmBannerObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "DataTableObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "WebFrameObject": { ObjDom = obj.getElementsByTagName("iframe")[0]; }
                break;
            case "DocumentViewerObject": { ObjDom = obj.getElementsByTagName("iframe")[0]; }
                break;
            case "AlarmViewerObject": { ObjDom = obj.getElementsByTagName("iframe")[0]; }
                break;
            case "EventViewerObject": { ObjDom = obj.getElementsByTagName("iframe")[0]; }
                break;
            case "AuditTrailViewerObject": { ObjDom = obj.getElementsByTagName("iframe")[0]; }
                break;
            case "TrendAnalystViewerObject": { ObjDom = obj.getElementsByTagName("iframe")[0]; }
                break;
            case "UsersViewerObject": { ObjDom = obj.getElementsByTagName("iframe")[0]; }
                break;
            case "WidgetObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "SliderObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "DonutObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "BarGraphObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "MapObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "RecipeManagerObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "CheckBoxObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "ToggleObject": { ObjDom = obj.getElementsByTagName("div")[0]; }
                break;
            case "RadioButtonObject": { ObjDom = obj.getElementsByTagName("input")[0]; }
                break;
            case "DropDownObject": { ObjDom = obj.getElementsByTagName("button")[0]; }
                break;
            case "ListBoxObject": { ObjDom = obj.getElementsByTagName("select")[0]; }
                break;
            case "PolygonObject": { ObjDom = obj.getElementsByTagName("svg")[0]; }
                break;
            case "PolylineObject": { ObjDom = obj.getElementsByTagName("svg")[0]; }
                break;
            case "GroupObject": { }
                break;
            default:

                //alert('unknown context object');
        }

        if (ObjDom != null) {

            ElementToBeDecorated = ObjDom;

            PositionSizeStyleFormatInit();
            AnimatePositionSizeStyleFormatInit();
            VisibilityStyleFormatInit();
        }

    }
    else { // SHOW ALL

        InitCollapsibles();

        switch (obj.getAttribute("name")) {
            case "SVGObject":
                {

                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD SVGContextIcons
                    StyleFormatContext = document.getElementById("SVGContextIcons");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD SVGContextHeader
                    StyleFormatContext = document.getElementById("SVGContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD SVGContext
                    StyleFormatContext = document.getElementById("SVGContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ColorContext
                    StyleFormatContext = document.getElementById("ColorContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ActionStyleFormatContext
                    StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD RotationStyleFormatContext
                    StyleFormatContext = document.getElementById("RotationStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("SVGContext").style.left = left + 'px';
                    //document.getElementById("SVGContext").style.top = top + 'px';

                    let ObjDom = obj.getElementsByTagName("svg")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        SVGContextInit();
                        ColorContextInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        RotationStyleFormatInit()
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                        ActionStyleFormatInit();
                    }
                }
                break;
            case "ImageObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ImageContextHeader
                    StyleFormatContext = document.getElementById("ImageContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ImageContext
                    StyleFormatContext = document.getElementById("ImageContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ActionStyleFormatContext
                    StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD RotationStyleFormatContext
                    StyleFormatContext = document.getElementById("RotationStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                    let ObjDom = obj.getElementsByTagName("img")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ImageContextInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        RotationStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                        ActionStyleFormatInit();
                    }
                }
                break;
            case "ButtonObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ButtonContextHeader
                    StyleFormatContext = document.getElementById("ButtonContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ButtonContext
                    StyleFormatContext = document.getElementById("ButtonContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD TextStyleFormatContext
                    StyleFormatContext = document.getElementById("TextStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ActionStyleFormatContext
                    StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("ButtonContext").style.left = left + 'px';
                    //document.getElementById("ButtonContext").style.top = top + 'px';

                    let ObjDom = obj.getElementsByTagName("button")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        ButtonContextInit();
                        TextStyleFormatInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        ActionStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                    }
                }
                break;
            case "InputObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD InputContextHeader
                    StyleFormatContext = document.getElementById("InputContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD InputContext
                    StyleFormatContext = document.getElementById("InputContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD TextStyleFormatContext
                    StyleFormatContext = document.getElementById("TextStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD BorderStyleFormatContext
                    StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("InputContext").style.left = left + 'px';
                    //document.getElementById("InputContext").style.top = top + 'px';

                    let ObjDom = obj.getElementsByTagName("input")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        InputContextInit();
                        TextStyleFormatInit();
                        PositionSizeStyleFormatInit();
                        BorderStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                    }


                }
                break;
            case "DateTimePickerObject":
                {
                   
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    
                    StyleFormatContext = document.getElementById("DateTimePickerContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    
                    StyleFormatContext = document.getElementById("DateTimePickerContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                  
                    StyleFormatContext = document.getElementById("TextStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    
                    StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                  
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                    let ObjDom = obj.getElementsByTagName("input")[0];

                    if (ObjDom != null) {
                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        DateTimePickerContextInit();
                        TextStyleFormatInit();
                        PositionSizeStyleFormatInit();
                        BorderStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                    }
                }
                break;
            case "LabelObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD LabelContextHeader
                    StyleFormatContext = document.getElementById("LabelContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD LabelContext
                    StyleFormatContext = document.getElementById("LabelContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD TextStyleFormatContext
                    StyleFormatContext = document.getElementById("TextStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD BorderStyleFormatContext
                    StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ActionStyleFormatContext
                    StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD RotationStyleFormatContext
                    StyleFormatContext = document.getElementById("RotationStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("InputContext").style.left = left + 'px';
                    //document.getElementById("InputContext").style.top = top + 'px';

                    let ObjDom = obj.getElementsByTagName("textarea")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        LabelContextInit();
                        TextStyleFormatInit();
                        PositionSizeStyleFormatInit();
                        BorderStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        RotationStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                        ActionStyleFormatInit();
                        
                    }


                }
                break;
            case "SquareObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD SquareContextHeader
                    StyleFormatContext = document.getElementById("SquareContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD SquareContext
                    StyleFormatContext = document.getElementById("SquareContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ColorContext
                    StyleFormatContext = document.getElementById("ColorContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD BorderStyleFormatContext
                    StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ActionStyleFormatContext
                    StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD RotationStyleFormatContext
                    StyleFormatContext = document.getElementById("RotationStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("SquareContext").style.left = left + 'px';
                    //document.getElementById("SquareContext").style.top = top + 'px';

                    let ObjDom = obj.getElementsByTagName("div")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        SquareContextInit();
                        ColorContextInit();
                        BorderStyleFormatInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        RotationStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                        ActionStyleFormatInit();
                    }

                }
                break;
            case "CircleObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD CircleContextHeader
                    StyleFormatContext = document.getElementById("CircleContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD CircleContext
                    StyleFormatContext = document.getElementById("CircleContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ColorContext
                    StyleFormatContext = document.getElementById("ColorContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD BorderStyleFormatContext
                    StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ActionStyleFormatContext
                    StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD RotationStyleFormatContext
                    StyleFormatContext = document.getElementById("RotationStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("CircleContext").style.left = left + 'px';
                    //document.getElementById("CircleContext").style.top = top + 'px';

                    let ObjDom = obj.getElementsByTagName("div")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        CircleContextInit();
                        ColorContextInit();
                        BorderStyleFormatInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        RotationStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                        ActionStyleFormatInit();
                    }

                }
                break;
            case "KnobObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD KnobContextHeader
                    StyleFormatContext = document.getElementById("KnobContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD KnobContext
                    StyleFormatContext = document.getElementById("KnobContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ColorContext
                    StyleFormatContext = document.getElementById("ColorContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ActionStyleFormatContext
                    StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AnimatePositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("CircleContext").style.left = left + 'px';
                    //document.getElementById("CircleContext").style.top = top + 'px';

                    let ObjDom = obj.getElementsByTagName("svg")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        KnobContextInit();
                        ColorContextInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                        ActionStyleFormatInit();
                    }

                }
                break;
            case "TrendObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD TrendContextHeader
                    StyleFormatContext = document.getElementById("TrendContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD TrendContext
                    StyleFormatContext = document.getElementById("TrendContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                    let ObjDom = obj.getElementsByTagName("canvas")[0];

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        TrendContextInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        VisibilityStyleFormatInit();

                    }

                }
                break;
            case "AlarmBannerObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AlarmBannerContextHeader
                    StyleFormatContext = document.getElementById("AlarmBannerContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AlarmBannerContext
                    StyleFormatContext = document.getElementById("AlarmBannerContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                    /*let ObjDom = Object.getElementsByTagName("canvas")[0];*/

                    let ObjDom = getObjDom(obj);

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        AlarmBannerContextInit();
                        PositionSizeStyleFormatInit();
                        AnimatePositionSizeStyleFormatInit();
                        VisibilityStyleFormatInit();

                    }

                }
                break;
            case "DataTableObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DataTableContextHeader
                        StyleFormatContext = document.getElementById("DataTableContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DataTableContext
                        StyleFormatContext = document.getElementById("DataTableContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        //StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        //StyleFormatContext.style.display = "block";
                        //StyleFormatContext.remove();
                        //document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            DataTableContextInit();
                            PositionSizeStyleFormatInit();
                            /*BorderStyleFormatInit();*/
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "WebFrameObject":
                {
                    {

                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD WebFrameContextHeader
                        StyleFormatContext = document.getElementById("WebFrameContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD WebFrameContext
                        StyleFormatContext = document.getElementById("WebFrameContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            WebFrameContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "DocumentViewerObject":
                {
                    {

                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DocumentViewerContextHeader
                        StyleFormatContext = document.getElementById("DocumentViewerContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DocumentViewerContext
                        StyleFormatContext = document.getElementById("DocumentViewerContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            DocumentViewerContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            AccessControlStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "AlarmViewerObject":
                {
                    {

                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AlarmViewerContextHeader
                        StyleFormatContext = document.getElementById("AlarmViewerContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            AccessControlStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "EventViewerObject":
                {
                    {

                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD EventViewerContextHeader
                        StyleFormatContext = document.getElementById("EventViewerContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            AccessControlStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "AuditTrailViewerObject":
                {
                    {

                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AuditTrailViewerContextHeader
                        StyleFormatContext = document.getElementById("AuditTrailViewerContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            AccessControlStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "TrendAnalystViewerObject":
                {
                    {

                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD TrendAnalystViewerContextHeader
                        StyleFormatContext = document.getElementById("TrendAnalystViewerContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD TrendAnalystViewerContext
                        StyleFormatContext = document.getElementById("TrendAnalystViewerContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            TrendAnalystViewerContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            AccessControlStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "UsersViewerObject":
                {
                    {

                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD UsersViewerContextHeader
                        StyleFormatContext = document.getElementById("UsersViewerContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            AccessControlStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "WidgetObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD WidgetContextHeader
                        StyleFormatContext = document.getElementById("WidgetContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD WidgetContext
                        StyleFormatContext = document.getElementById("WidgetContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            WidgetContextInit();
                            PositionSizeStyleFormatInit();
                            BorderStyleFormatInit();
                            VisibilityStyleFormatInit();
                        }
                    }

                }
                break;
            case "SliderObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD SliderContextHeader
                        StyleFormatContext = document.getElementById("SliderContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD SliderContext
                        StyleFormatContext = document.getElementById("SliderContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            SliderContextInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;
            case "DonutObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DonutContextHeader
                        StyleFormatContext = document.getElementById("DonutContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DonutContext
                        StyleFormatContext = document.getElementById("DonutContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            DonutContextInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;

            case "BarGraphObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BargraphContextHeader
                        StyleFormatContext = document.getElementById("BarGraphContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BargraphContext
                        StyleFormatContext = document.getElementById("BarGraphContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null)
                        {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            BarGraphContextInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;

            case "MapObject":
                {
                    //ADD ObjectActionsContext
                    StyleFormatContext = document.getElementById("ObjectActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD MapContextHeader
                    StyleFormatContext = document.getElementById("MapContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD MapContext
                    StyleFormatContext = document.getElementById("MapContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                    let ObjDom = getObjDom(obj);

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        if (typeof MapContextInit === "function") MapContextInit();
                        PositionSizeStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                    }
                }
                break;

            case "CheckBoxObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD CheckBoxContextHeader
                        StyleFormatContext = document.getElementById("CheckBoxContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD CheckBoxContext
                        StyleFormatContext = document.getElementById("CheckBoxContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            CheckBoxContextInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;
            case "RecipeManagerObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        StyleFormatContext = document.getElementById("RecipeManagerContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        StyleFormatContext = document.getElementById("RecipeManagerContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);
                        if (ObjDom != null) {
                            ElementToBeDecorated = ObjDom;
                            ObjectNameStyleFormatContextInit();
                            RecipeManagerContextInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }
                }
                break;
            case "ToggleObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ToggleContextHeader
                        StyleFormatContext = document.getElementById("ToggleContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ToggleContext
                        StyleFormatContext = document.getElementById("ToggleContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            ToggleContextInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;
            case "RadioButtonObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD RadioButtonContextHeader
                        StyleFormatContext = document.getElementById("RadioButtonContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD RadioButtonContext
                        StyleFormatContext = document.getElementById("RadioButtonContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            RadioButtonContextInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;
            case "DropDownObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DropDownContextHeader
                        StyleFormatContext = document.getElementById("DropDownContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD DropDownContext
                        StyleFormatContext = document.getElementById("DropDownContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD TextStyleFormatContext
                        StyleFormatContext = document.getElementById("TextStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            DropDownContextInit();
                            TextStyleFormatInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;
            case "ListBoxObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ListBoxContextHeader
                        StyleFormatContext = document.getElementById("ListBoxContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ListBoxContext
                        StyleFormatContext = document.getElementById("ListBoxContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD TextStyleFormatContext
                        StyleFormatContext = document.getElementById("TextStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            ListBoxContextInit();
                            TextStyleFormatInit();
                            PositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                        }
                    }

                }
                break;
            case "PolygonObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PolygonContextHeader
                        StyleFormatContext = document.getElementById("PolygonContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PolygonContext
                        StyleFormatContext = document.getElementById("PolygonContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ColorContext
                        StyleFormatContext = document.getElementById("ColorContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        document.getElementById('StyleFormatContextBorderRadius').parentElement.parentElement.style.display = "none";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ActionStyleFormatContext
                        StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AnimatePositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD RotationStyleFormatContext
                    StyleFormatContext = document.getElementById("RotationStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            PolygonContextInit();
                            ColorContextInit();
                            BorderStyleFormatInit();
                            PositionSizeStyleFormatInit();
                            AnimatePositionSizeStyleFormatInit();
                            RotationStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                            ActionStyleFormatInit();
                        }
                    }

                }
                break;

            case "PolylineObject":
                {
                    {
                        //ADD ObjectActionsContext
                        StyleFormatContext = document.getElementById("ObjectActionsContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PolylineContextHeader
                        StyleFormatContext = document.getElementById("PolylineContextHeader");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ObjectNameStyleFormatContext
                        StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PolylineContext
                        StyleFormatContext = document.getElementById("PolylineContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ColorContext
                        StyleFormatContext = document.getElementById("ColorContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD PositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD BorderStyleFormatContext
                        StyleFormatContext = document.getElementById("BorderStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        document.getElementById('StyleFormatContextBorderRadius').parentElement.parentElement.style.display = "none";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD ActionStyleFormatContext
                        StyleFormatContext = document.getElementById("ActionStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AnimatePositionSizeStyleFormatContext
                        StyleFormatContext = document.getElementById("AnimatePositionSizeStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD AccessControlStyleFormatContext
                        StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        //ADD VisibilityStyleFormatContext
                        StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                        StyleFormatContext.style.display = "block";
                        StyleFormatContext.remove();
                        document.getElementById("MultiContext").append(StyleFormatContext);

                        document.getElementById("MultiContext").style.display = 'block';
                        document.getElementById("MultiContextDragLine").style.display = 'block';
                        document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                        let ObjDom = getObjDom(obj);

                        if (ObjDom != null) {

                            ElementToBeDecorated = ObjDom;

                            ObjectNameStyleFormatContextInit();
                            PolylineContextInit();
                            ColorContextInit();
                            BorderStyleFormatInit();
                            PositionSizeStyleFormatInit();
                            AnimatePositionSizeStyleFormatInit();
                            VisibilityStyleFormatInit();
                            AccessControlStyleFormatInit();
                            ActionStyleFormatInit();
                        }
                    }

                }
                break;
            case "PageObject":
                {

                    DeselectAllObjects();

                    //ADD PageContext
                    StyleFormatContext = document.getElementById("PageContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);

                    let ObjDom = obj;

                    if (ObjDom != null) {

                        ElementToBeDecorated = ObjDom;

                        PageContextInit();
                    }

                }
                break;
            case "GroupObject":
                {
                    //ObjectViewerLoad(Object);

                    //ADD GroupActionsContext
                    StyleFormatContext = document.getElementById("GroupActionsContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD GroupContextHeader
                    StyleFormatContext = document.getElementById("GroupContextHeader");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD ObjectNameStyleFormatContext
                    StyleFormatContext = document.getElementById("ObjectNameStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD GroupContext
                    StyleFormatContext = document.getElementById("GroupContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD PositionSizeStyleFormatContext
                    StyleFormatContext = document.getElementById("PositionSizeStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD AccessControlStyleFormatContext
                    StyleFormatContext = document.getElementById("AccessControlStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    //ADD VisibilityStyleFormatContext
                    StyleFormatContext = document.getElementById("VisibilityStyleFormatContext");
                    StyleFormatContext.style.display = "block";
                    StyleFormatContext.remove();
                    document.getElementById("MultiContext").append(StyleFormatContext);

                    document.getElementById("MultiContext").style.display = 'block';
                    document.getElementById("MultiContextDragLine").style.display = 'block';
                    document.getElementById("MultiContextDragLine").addEventListener("mousedown", initDragDecorator, false);
                    //document.getElementById("CircleContext").style.left = left + 'px';
                    //document.getElementById("CircleContext").style.top = top + 'px';

                    //let ObjDom = SelectedGroups;
                    //let ObjDom = Object.getElementsByTagName("div")[0];
                    let ObjDom = obj;
                    //this.ElementsToBeDecorated = SelectedGroups;

                    if (ObjDom != null) {

                        //ElementToBeDecorated = SelectedGroups[0];
                        ElementToBeDecorated = ObjDom;

                        ObjectNameStyleFormatContextInit();
                        GroupStyleFormatInit();
                        PositionSizeStyleFormatInit();
                        VisibilityStyleFormatInit();
                        AccessControlStyleFormatInit();
                        ReplaceStyleFormatInit();
                    }

                }
                break;
            default:
               alert('Object is obsolete, please delete/replace it');
               return;
        }

    }

}

function InitCollapsibles() {

    const contextGroups = document.querySelectorAll('[id$="Collapsible"]');
    //const contextGroups = new Set();

    //elements.forEach(el => contextGroups.add(el.id)); // distinct list of IDs

    //console.log([...contextGroups]); 

    contextGroups.forEach(contextGroup => {
        
        if (localStorage.getItem(contextGroup.id)) {
            
            if (localStorage.getItem(contextGroup.id) == "none") {
                contextGroup = contextGroup.id.replace("Collapsible", "");
                document.getElementById(contextGroup + 'Collapsible').style.display = "none";
                document.getElementById(contextGroup + 'Expand').style.display = "block";
                document.getElementById(contextGroup + 'Collapse').style.display = "none";
            }
            else {
                contextGroup = contextGroup.id.replace("Collapsible", "");
                document.getElementById(contextGroup + 'Collapsible').style.display = "block";
                document.getElementById(contextGroup + 'Expand').style.display = "none";
                document.getElementById(contextGroup + 'Collapse').style.display = "block";
            }
        }
    });

}

function ContextCollapseAll() {

    const contextGroups = document.querySelectorAll('[id$="Collapsible"]');

    contextGroups.forEach(contextGroup => {
        contextGroup = contextGroup.id.replace("Collapsible", "");
        document.getElementById(contextGroup + 'Collapsible').style.display = "none";
        document.getElementById(contextGroup + 'Expand').style.display = "block";
        document.getElementById(contextGroup + 'Collapse').style.display = "none";
        document.getElementById('ContextExpandSymbol').style.display = "block";
        document.getElementById('ContextCollapseSymbol').style.display = "none";
        localStorage.setItem(contextGroup + 'Collapsible', "none");
    });

}

function ContextExpandAll() {

    const contextGroups = document.querySelectorAll('[id$="Collapsible"]');

    contextGroups.forEach(contextGroup => {
        contextGroup = contextGroup.id.replace("Collapsible", "");
        document.getElementById(contextGroup + 'Collapsible').style.display = "block";
        document.getElementById(contextGroup + 'Expand').style.display = "none";
        document.getElementById(contextGroup + 'Collapse').style.display = "block";
        document.getElementById('ContextExpandSymbol').style.display = "none";
        document.getElementById('ContextCollapseSymbol').style.display = "block";
        
        localStorage.setItem(contextGroup + 'Collapsible', "block");
    });

}



// STYLE FORMAT SUB INIT ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 

function TextStyleFormatInit() {
    // StyleFormat

    //StyleFormatContextFontAlign

    compStyles = window.getComputedStyle(ElementToBeDecorated);

    let fontalign;

    if (ElementToBeDecorated.style.textAlign) {
        fontalign = ElementToBeDecorated.style.textAlign;
    }
    else {
        fontalign = compStyles.getPropertyValue("text-align");
    }
    if (fontalign === 'start') {
        fontalign = 'Left';
    }

    var StyleFormatContextFontAlign = document.getElementById('StyleFormatContextFontAlign');
    var alignKey = fontalign.charAt(0).toUpperCase() + fontalign.slice(1).toLowerCase();
    StyleFormatContextFontAlign.setAttribute('data-value', alignKey);
    StyleFormatContextFontAlign.innerHTML = (typeof FontAlignTranslations !== 'undefined' && FontAlignTranslations[alignKey]) || fontalign;

    //StyleFormatFontWeight
    let fontweight;

    if (ElementToBeDecorated.style.fontWeight) {
        fontweight = ElementToBeDecorated.style.fontWeight;
    }
    else {
        fontweight = compStyles.getPropertyValue("font-weight");
    }

    var StyleFormatContextFontWeight = document.getElementById('StyleFormatContextFontWeight');
    StyleFormatContextFontWeight.innerHTML = fontweight;

    //StyleFormatContextFontSize

    let fontsize;

    if (ElementToBeDecorated.style.fontsize) {
        fontsize = ElementToBeDecorated.style.fontSize;
    }
    else {
        fontsize = compStyles.getPropertyValue("font-size");
    }

    var StyleFormatContextFontSize = document.getElementById('StyleFormatContextFontSize');
    StyleFormatContextFontSize.value = fontsize;
    StyleFormatContextFontSize.addEventListener('input', StyleFormatContextFontSizeInputHandler);

    //StyleFormatContextFontSize

    let fontfamily;

    if (ElementToBeDecorated.style.fontfamily) {
        fontfamily = ElementToBeDecorated.style.fontFamily;
    }
    else {
        fontfamily = compStyles.getPropertyValue("font-family");
    }

    var StyleFormatContextFontFamily = document.getElementById('StyleFormatContextFontFamily');
    StyleFormatContextFontFamily.value = fontfamily;
    StyleFormatContextFontFamily.addEventListener('input', StyleFormatContextFontFamilyInputHandler);


    let padding;

    if (ElementToBeDecorated.style.padding) {
        padding = ElementToBeDecorated.style.padding;
    }
    else {
        padding = compStyles.getPropertyValue("padding");
    }

    var StyleFormatContextpadding = document.getElementById('StyleFormatContextpadding');
    StyleFormatContextpadding.value = padding;
    StyleFormatContextpadding.addEventListener('input', StyleFormatContextpaddingInputHandler);

}

function RotationStyleFormatInit() {

    //transformrotate

    if (ElementToBeDecorated.getAttribute("data-transformrotate")) {
        transformrotate = ElementToBeDecorated.getAttribute("data-transformrotate");
    }
    else {
        transformrotate = '';
        ElementToBeDecorated.setAttribute("data-transformrotate", transformrotate);
    }

    transformrotate = ElementToBeDecorated.getAttribute("data-transformrotate");

    var StyleFormatContexttransformrotate = document.getElementById('StyleFormatContextTransformRotate');

    StyleFormatContexttransformrotate.value = transformrotate;
    StyleFormatContexttransformrotate.addEventListener('input', StyleFormatContexttransformrotateInputHandler);

    //transformorigin
    if (ElementToBeDecorated.getAttribute("data-transformorigin")) {
        transformorigin = ElementToBeDecorated.getAttribute("data-transformorigin");
    }
    else {
        transformorigin = 'center';
        ElementToBeDecorated.setAttribute("data-transformorigin", transformorigin);
    }

    transformorigin = ElementToBeDecorated.getAttribute("data-transformorigin");

    var StyleFormatContexttransformorigin = document.getElementById('StyleFormatContextTransformOrigin');
    StyleFormatContexttransformorigin.value = transformorigin;
    StyleFormatContexttransformorigin.addEventListener('input', StyleFormatContexttransformoriginInputHandler);

    //rotateenable - deliberately NOT defaulted onto the element: an object that never asked to spin
    //must keep exactly the markup it had before this feature existed.
    var StyleFormatContextrotateenable = document.getElementById('StyleFormatContextRotateEnable');
    StyleFormatContextrotateenable.value = ElementToBeDecorated.getAttribute("data-rotateenable") || '';
    StyleFormatContextrotateenable.addEventListener('input', StyleFormatContextrotateenableInputHandler);

    //rotatespeed
    var StyleFormatContextrotatespeed = document.getElementById('StyleFormatContextRotateSpeed');
    StyleFormatContextrotatespeed.value = ElementToBeDecorated.getAttribute("data-rotatespeed") || '';
    StyleFormatContextrotatespeed.addEventListener('input', StyleFormatContextrotatespeedInputHandler);

    //rotatedirection
    var StyleFormatContextrotatedirection = document.getElementById('StyleFormatContextRotateDirection');
    StyleFormatContextrotatedirection.value = ElementToBeDecorated.getAttribute("data-rotatedirection") || '';
    StyleFormatContextrotatedirection.addEventListener('input', StyleFormatContextrotatedirectionInputHandler);
}

function VisibilityStyleFormatInit() {

    //Visibility
    if (ElementToBeDecorated.getAttribute("data-visibility")) {
        visibility = ElementToBeDecorated.getAttribute("data-visibility");
    }
    else {
        visibility = '';
        ElementToBeDecorated.setAttribute("data-visibility", visibility);
    }

    visibility = ElementToBeDecorated.getAttribute("data-visibility");

    var StyleFormatContextVisibility = document.getElementById('StyleFormatContextVisibility');
    StyleFormatContextVisibility.value = visibility;
    StyleFormatContextVisibility.addEventListener('input', StyleFormatContextVisibilityInputHandler);


    //Blink
    if (ElementToBeDecorated.getAttribute("data-blink")) {
        blink = ElementToBeDecorated.getAttribute("data-blink");
    }
    else {
        blink = '';
        ElementToBeDecorated.setAttribute("data-blink", blink);
    }

    blink = ElementToBeDecorated.getAttribute("data-blink");

    var StyleFormatContextBlink = document.getElementById('StyleFormatContextBlink');
    StyleFormatContextBlink.value = blink;
    StyleFormatContextBlink.addEventListener('input', StyleFormatContextBlinkInputHandler);


    //blinkspeed
    if (ElementToBeDecorated.getAttribute("data-blinkspeed")) {
        blinkspeed = ElementToBeDecorated.getAttribute("data-blinkspeed");
    }
    else {
        blinkspeed = '1s';
        ElementToBeDecorated.setAttribute("data-blinkspeed", blinkspeed);
    }

    var StyleFormatContextBlinkSpeed = document.getElementById('StyleFormatContextBlinkSpeed');
    StyleFormatContextBlinkSpeed.innerHTML = blinkspeed;

    //blinkoffset
    if (ElementToBeDecorated.getAttribute("data-blinkoffset")) {
        blinkoffset = ElementToBeDecorated.getAttribute("data-blinkoffset");
    }
    else {
        blinkoffset = 'false';
        ElementToBeDecorated.setAttribute("data-blinkoffset", blinkoffset);
    }

    blinkoffset = ElementToBeDecorated.getAttribute("data-blinkoffset");
    var InputContextblinkoffset = document.getElementById('StyleFormatContextBlinkOffset');
    InputContextblinkoffset.checked = (blinkoffset.toLowerCase() === 'true');
    InputContextblinkoffset.addEventListener('input', StyleFormatContextBlinkOffsetInputHandler);

}

function AccessControlStyleFormatInit() {

    //accesscontrolenable
    if (ElementToBeDecorated.getAttribute("data-accesscontrolenable")) {
        accesscontrolenable = ElementToBeDecorated.getAttribute("data-accesscontrolenable");
    }
    else {
        accesscontrolenable = 'false';
        ElementToBeDecorated.setAttribute("data-accesscontrolenable", accesscontrolenable);
    }

    accesscontrolenable = ElementToBeDecorated.getAttribute("data-accesscontrolenable");

    var InputContextaccesscontrolenable = document.getElementById('StyleFormatContextaccesscontrolenable');
    InputContextaccesscontrolenable.checked = (accesscontrolenable.toLowerCase() === 'true');
    InputContextaccesscontrolenable.addEventListener('input', StyleFormatContextaccesscontrolenableInputHandler);

    //accesscontrol
    if (ElementToBeDecorated.getAttribute("data-accesscontrol")) {
        accesscontrol = ElementToBeDecorated.getAttribute("data-accesscontrol");
    }
    else {
        accesscontrol = '';
        ElementToBeDecorated.setAttribute("data-accesscontrol", accesscontrol);
    }

    accesscontrol = ElementToBeDecorated.getAttribute("data-accesscontrol");

    var StyleFormatContextaccesscontrol = document.getElementById('StyleFormatContextaccesscontrol');
    StyleFormatContextaccesscontrol.value = accesscontrol;
    StyleFormatContextaccesscontrol.addEventListener('input', StyleFormatContextaccesscontrolInputHandler);

    //accesscontrolfilter
    if (ElementToBeDecorated.getAttribute("data-accesscontrolfilter")) {
        accesscontrolfilter = ElementToBeDecorated.getAttribute("data-accesscontrolfilter");
    }
    else {
        accesscontrolfilter = '';
        ElementToBeDecorated.setAttribute("data-accesscontrolfilter", accesscontrolfilter);
    }

    accesscontrolfilter = ElementToBeDecorated.getAttribute("data-accesscontrolfilter");

    var StyleFormatContextaccesscontrolfilter = document.getElementById('StyleFormatContextaccesscontrolfilter');
    StyleFormatContextaccesscontrolfilter.value = accesscontrolfilter;
    StyleFormatContextaccesscontrolfilter.addEventListener('input', StyleFormatContextaccesscontrolfilterInputHandler);

}

function BorderStyleFormatInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    bordercolor = ElementToBeDecorated.getAttribute("data-bordercolor");

    $("#bordercolorpickerbordercolor").colorPick({
        'initialColor': bordercolor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-bordercolor', this.element.attr('title'));
            }
        }
    });

    var data = [];

    var bordercolorstates = ElementToBeDecorated.getAttribute('data-bordercolorstates');

    if (bordercolorstates && bordercolorstates !== '') {
        try {
            data = JSON.parse(bordercolorstates);
        } catch (e) {
            console.log(e);
        }
    }

    loadBorderColorContext(data);

    //StyleFormatContextBorderRadius
    if (ElementToBeDecorated.style.borderradius) {
        borderradius = ElementToBeDecorated.style.borderRadius;
    }
    else {
        borderradius = compStyles.getPropertyValue("border-radius");
    }

    var StyleFormatContextBorderRadius = document.getElementById('StyleFormatContextBorderRadius');
    StyleFormatContextBorderRadius.value = borderradius;
    StyleFormatContextBorderRadius.addEventListener('input', StyleFormatContextBorderRadiusInputHandler);
    
    //StyleFormatContextBorderWidth
    if (ElementToBeDecorated.parentElement.getAttribute("name") == "PolygonObject") {
        if (ElementToBeDecorated.style.strokeWidth) {
            borderwidth = ElementToBeDecorated.style.strokeWidth;
        }
        else {
            borderwidth = compStyles.getPropertyValue("stroke-width");
        }
        
    }
    else if (ElementToBeDecorated.parentElement.getAttribute("name") == "PolylineObject") {
        borderwidth = ElementToBeDecorated.getAttribute("data-borderwidth");
    }
    else {
        if (ElementToBeDecorated.style.borderwidth) {
            borderwidth = ElementToBeDecorated.style.borderWidth;
        }
        else {
            borderwidth = compStyles.getPropertyValue("border-width");
        }
    }

    var StyleFormatContextBorderWidth = document.getElementById('StyleFormatContextBorderWidth');
    StyleFormatContextBorderWidth.value = borderwidth;
    StyleFormatContextBorderWidth.addEventListener('input', StyleFormatContextBorderWidthInputHandler);


    //BorderVisibility
    if (ElementToBeDecorated.getAttribute("data-bordervisibility")) {
        bordervisibility = ElementToBeDecorated.getAttribute("data-bordervisibility");
    }
    else {
        bordervisibility = '';
        ElementToBeDecorated.setAttribute("data-bordervisibility", bordervisibility);
    }

    bordervisibility = ElementToBeDecorated.getAttribute("data-bordervisibility");

    var StyleFormatContextBorderVisibility = document.getElementById('StyleFormatContextBorderVisibility');
    StyleFormatContextBorderVisibility.value = bordervisibility;
    StyleFormatContextBorderVisibility.addEventListener('input', StyleFormatContextBorderVisibilityInputHandler);


    //BorderBlink
    if (ElementToBeDecorated.getAttribute("data-borderblink")) {
        borderblink = ElementToBeDecorated.getAttribute("data-borderblink");
    }
    else {
        borderblink = '';
        ElementToBeDecorated.setAttribute("data-borderblink", borderblink);
    }

    borderblink = ElementToBeDecorated.getAttribute("data-borderblink");

    var StyleFormatContextBorderBlink = document.getElementById('StyleFormatContextBorderBlink');
    StyleFormatContextBorderBlink.value = borderblink;
    StyleFormatContextBorderBlink.addEventListener('input', StyleFormatContextBorderBlinkInputHandler);


    //borderblinkspeed
    if (ElementToBeDecorated.getAttribute("data-borderblinkspeed")) {
        borderblinkspeed = ElementToBeDecorated.getAttribute("data-borderblinkspeed");
    }
    else {
        borderblinkspeed = '1s';
        ElementToBeDecorated.setAttribute("data-borderblinkspeed", borderblinkspeed);
    }

    var StyleFormatContextBorderBlinkSpeed = document.getElementById('StyleFormatContextBorderBlinkSpeed');
    StyleFormatContextBorderBlinkSpeed.innerHTML = borderblinkspeed;

    //borderblinkoffset
    if (ElementToBeDecorated.getAttribute("data-borderblinkoffset")) {
        borderblinkoffset = ElementToBeDecorated.getAttribute("data-borderblinkoffset");
    }
    else {
        borderblinkoffset = 'false';
        ElementToBeDecorated.setAttribute("data-borderblinkoffset", borderblinkoffset);
    }

    borderblinkoffset = ElementToBeDecorated.getAttribute("data-borderblinkoffset");
    var InputContextborderblinkoffset = document.getElementById('StyleFormatContextBorderBlinkOffset');
    InputContextborderblinkoffset.checked = (borderblinkoffset.toLowerCase() === 'true');
    InputContextborderblinkoffset.addEventListener('input', StyleFormatContextBorderBlinkOffsetInputHandler);

}

function ReplaceStyleFormatInit() {

    //console.log(ElementToBeDecorated.getAttribute("data-groupsymbolmaster"));

    var isMaster = false;
    var isInstance = false;

    if (ElementToBeDecorated.getAttribute("data-groupsymbolmaster")) {
        if (ElementToBeDecorated.getAttribute("data-groupsymbolmaster") === '') {

            if (ElementToBeDecorated.getAttribute("data-groupsymbol")) {
                document.getElementById('GroupSymbolType').innerHTML = "Template";
                document.getElementById("GroupSymbolTypeBtnTemplate").style.display = "block";
                document.getElementById("GroupSymbolTypeBtnInstance").style.display = "none";
                document.getElementById("GroupSymbolTypeBtnInstanceFindMasterBtn").style.display = "none";
                isMaster = true;

            } else {
                document.getElementById('GroupSymbolType').innerHTML = "";
                document.getElementById("GroupSymbolTypeBtnTemplate").style.display = "none";
                document.getElementById("GroupSymbolTypeBtnInstance").style.display = "none";
                document.getElementById("GroupSymbolTypeBtnInstanceFindMasterBtn").style.display = "none";
            }
        }
        else {

            document.getElementById('GroupSymbolType').innerHTML = "Instance";
            document.getElementById("GroupSymbolTypeBtnTemplate").style.display = "none";
            document.getElementById("GroupSymbolTypeBtnInstance").style.display = "block";
            // Clear the inline display instead of setting "block": .ctxbtn centres its icon with
            // inline-flex, and an inline "block" wins over the stylesheet, leaving the svg sitting
            // on the text baseline in the corner instead of centred in its 32x32 box.
            document.getElementById("GroupSymbolTypeBtnInstanceFindMasterBtn").style.display = "";
            isInstance = true;
        }
    }
    else {

        if (ElementToBeDecorated.getAttribute("data-groupsymbol")) {
            document.getElementById('GroupSymbolType').innerHTML = "Template";
            document.getElementById("GroupSymbolTypeBtnTemplate").style.display = "block";
            document.getElementById("GroupSymbolTypeBtnInstance").style.display = "none";
            document.getElementById("GroupSymbolTypeBtnInstanceFindMasterBtn").style.display = "none";
            isMaster = true;
        } else {
            document.getElementById('GroupSymbolType').innerHTML = "";
            document.getElementById("GroupSymbolTypeBtnTemplate").style.display = "none";
            document.getElementById("GroupSymbolTypeBtnInstance").style.display = "none";
            document.getElementById("GroupSymbolTypeBtnInstanceFindMasterBtn").style.display = "none";
        }
    }

    // Version info display
    var versionInfoDiv = document.getElementById('GroupVersionInfo');
    if (versionInfoDiv) {
        if (isMaster) {
            versionInfoDiv.style.display = "block";
            document.getElementById('GroupVersionInfoVersion').value = ElementToBeDecorated.getAttribute("data-version") || UdtBindingT("notVersioned");
            document.getElementById('GroupVersionInfoHashRow').style.display = "none";
            var vdt = ElementToBeDecorated.getAttribute("data-versiondatetime");
            document.getElementById('GroupVersionInfoDatetime').value = vdt ? new Date(vdt).toLocaleString() : "";
        } else if (isInstance) {
            versionInfoDiv.style.display = "block";
            document.getElementById('GroupVersionInfoVersion').value = ElementToBeDecorated.getAttribute("data-syncedversion") || UdtBindingT("notSynced");
            document.getElementById('GroupVersionInfoHashRow').style.display = "none";
            var sdt = ElementToBeDecorated.getAttribute("data-synceddatetime");
            document.getElementById('GroupVersionInfoDatetime').value = sdt ? new Date(sdt).toLocaleString() : "";
        } else {
            versionInfoDiv.style.display = "none";
        }
    }

    // UDT binding. Resolved centrally off isInstance rather than per branch above: this lives
    // inside GroupContext, and ResetContextPanel only hides whole .SubContext divs, so a row left
    // visible here would linger onto the next selected object.
    var udtBindingDiv = document.getElementById('GroupSymbolUdtBinding');
    if (udtBindingDiv) {
        if (isInstance) {
            var boundInstance = ElementToBeDecorated.getAttribute("data-system-udtinstance") || "";
            udtBindingDiv.style.display = "block";
            document.getElementById('GroupSymbolUdtBindingInstance').value = boundInstance;
            // "" restores the stylesheet's display, NOT "block": the unlink row is a Bootstrap
            // .row (display:flex), and an inline display:block turns its columns into stacked
            // block boxes - the 140px label spacer lands on its own line and the button below it
            // spans the full panel, instead of lining up with Instance Replacers / Update.
            document.getElementById('GroupSymbolUdtBindingUnlinkRow').style.display = boundInstance ? "" : "none";
            // Same condition as the unlink row: with nothing bound there is no instance to open.
            // "" restores the stylesheet display (.ctxbtn is inline-flex), not "block".
            var udtOpenBtn = document.getElementById('GroupSymbolUdtBindingOpenBtn');
            if (udtOpenBtn) udtOpenBtn.style.display = boundInstance ? "" : "none";
        } else {
            udtBindingDiv.style.display = "none";
        }
    }


    // find master to fill labels OBSOLETE SINCE UPDATE MAY 2025? 
    //var master = ElementToBeDecorated;

    //var masterunknown = true;
    //var ismaster = false;

    //var mastername = ElementToBeDecorated.getAttribute("data-groupsymbolmaster");

    //if (mastername && !mastername == "") {

    //    var master;

    //    master = GetSymbolMaster(mastername);

    //    if (master) {
    //        masterunknown = false;
    //    }

    //}
    //else {
    //    ismaster = true;
    //}

}

// Translations for the UDT binding block and the version-info fallbacks. This file is static JS
// with no Razor, so the strings are injected by _SubDecorators.cshtml as window.UdtBindingTranslations.
// Falls back to the English text rather than the key, because these are read out in alerts and in a
// read-only field where a raw camelCase key would be worse than an untranslated sentence.
var UdtBindingFallbacks = {
    linkedToInstance: "Linked to UDT instance",
    linkedInfo: "The mapped replacers are applied by the next push of this UDT instance; nothing changes on the page until then.",
    missingReplacers: "mapped replacer(s) are not on this symbol yet. The push adds them from the master",
    unlinkConfirm: "Unlink this symbol from UDT instance",
    unlinkInfo: "It keeps its current replacer values and stays a normal symbol instance, but UDT pushes will no longer update it.",
    notVersioned: "not versioned",
    notSynced: "not synced"
};

function UdtBindingT(key) {
    var map = window.UdtBindingTranslations || {};
    return map[key] || UdtBindingFallbacks[key] || key;
}

// The symbol whose UDT binding the picker is editing. Captured on open because the picker is a
// modal: the decorated element must survive the round trip.
var elementselectUdtInstance = null;

function UdtInstanceModal() {

    if (!ElementToBeDecorated) return;

    var master = ElementToBeDecorated.getAttribute("data-groupsymbolmaster") || "";
    if (master === "") return;

    elementselectUdtInstance = ElementToBeDecorated;

    GetBindableUdtInstances(master);
}

// Linking is only setting data-system-udtinstance. It deliberately does NOT stamp values now:
// the reference is a subscription, and UdtGraphicsBinding.StampInstanceSymbols applies the
// mapped replacers on the next UDT push, like every other UDT propagation.
function ChooseUdtInstance(el) {

    var row = el.parentElement;
    var instanceName = row.getElementsByTagName("input")[0].value;
    var definitionName = row.getAttribute("data-definition") || "";

    $('#UdtInstancesModal').modal('hide');

    if (!elementselectUdtInstance || instanceName === "") return;

    elementselectUdtInstance.setAttribute("data-system-udtinstance", instanceName);

    // A hand-built instance can carry a replacer set older than its master, so a mapped UUID may
    // be absent. The push self-heals it (SyncInstanceFromTemplate re-adds it from the master),
    // but say so rather than letting the first push change more than expected.
    var mapped = UdtInstancesModalDefinitions[definitionName] || [];
    var missing = [];

    if (mapped.length > 0) {
        var own = {};
        try {
            own = JSON.parse(elementselectUdtInstance.getAttribute("data-replacers") || "{}") || {};
        } catch (e) {
            own = {};
        }

        for (var i = 0; i < mapped.length; i++) {
            if (!Object.prototype.hasOwnProperty.call(own, mapped[i])) missing.push(mapped[i]);
        }
    }

    if (typeof SilentUpdatePage === "function") SilentUpdatePage();

    refreshDecorators();

    var message = UdtBindingT("linkedToInstance") + " '" + instanceName + "'.\n\n"
        + UdtBindingT("linkedInfo");

    if (missing.length > 0) {
        message += "\n\n" + missing.length + " " + UdtBindingT("missingReplacers") + " '"
            + (elementselectUdtInstance.getAttribute("data-groupsymbolmaster") || "") + "'.";
    }

    alert(message);
}

// Unlinking only removes the reference. The symbol keeps its markup, its position and its current
// replacer values, and stays an ordinary group symbol instance: its master push still syncs it.
function UnlinkUdtInstance() {

    if (!ElementToBeDecorated) return;

    var boundInstance = ElementToBeDecorated.getAttribute("data-system-udtinstance") || "";
    if (boundInstance === "") return;

    if (!confirm(UdtBindingT("unlinkConfirm") + " '" + boundInstance + "'?\n\n"
        + UdtBindingT("unlinkInfo"))) return;

    ElementToBeDecorated.removeAttribute("data-system-udtinstance");

    if (typeof SilentUpdatePage === "function") SilentUpdatePage();

    refreshDecorators();
}

// Opens the Asset Manager on the UDT instance this symbol is bound to, so the instance behind the
// symbol is reachable from the panel instead of only through the Edit Instance dialog. Reads the
// binding off the element, not the read-only field, because the attribute is the binding. No dialog
// teardown to wait for here (unlike OpenBoundUdtInstance), and nothing is edited, so no confirm.
function OpenUdtInstanceInAssetManager() {

    if (!ElementToBeDecorated) return;

    var boundInstance = ElementToBeDecorated.getAttribute("data-system-udtinstance") || "";
    if (boundInstance === "") return;

    // The Asset Manager modal is part of the editor shell; a page without it simply has no jump.
    if (typeof UamOpenInstanceByName === "function") UamOpenInstanceByName(boundInstance);
}

function ToggleWebFramePostMessageSettings(show) {
    document.getElementById('WebFrameContextPostMessageSettings').style.display = show ? "block" : "none";
}


function PositionSizeStyleFormatInit() {

    if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
        compStyles = window.getComputedStyle(ElementToBeDecorated);
    }
    else {
        compStyles = window.getComputedStyle(ElementToBeDecorated.parentElement);
    }

    //StyleFormatContextHeight

    let height;

    if (ElementToBeDecorated.style.height) {
        height = ElementToBeDecorated.style.height;
    }
    else {
        height = compStyles.getPropertyValue("height");
    }

    var StyleFormatContextHeight = document.getElementById('StyleFormatContextHeight');
    StyleFormatContextHeight.value = height;
    StyleFormatContextHeight.addEventListener('input', StyleFormatContextHeightInputHandler);

    //StyleFormatContextWidth

    let width;

    if (ElementToBeDecorated.style.width) {
        width = ElementToBeDecorated.style.width;
    }
    else {
        width = compStyles.getPropertyValue("width");
    }

    var StyleFormatContextWidth = document.getElementById('StyleFormatContextWidth');
    StyleFormatContextWidth.value = width;
    StyleFormatContextWidth.addEventListener('input', StyleFormatContextWidthInputHandler);

    //StyleFormatContextTop

    compStyles = window.getComputedStyle(ElementToBeDecorated.parentElement);

    let top;

    if (ElementToBeDecorated.style.top) {
        top = ElementToBeDecorated.style.top;
    }
    else {
        top = compStyles.getPropertyValue("top");
    }

    var StyleFormatContextTop = document.getElementById('StyleFormatContextTop');
    StyleFormatContextTop.value = top;
    StyleFormatContextTop.addEventListener('input', StyleFormatContextTopInputHandler);

    //StyleFormatContextLeft

    let left;

    if (ElementToBeDecorated.style.left) {
        left = ElementToBeDecorated.style.left;
    }
    else {
        left = compStyles.getPropertyValue("left");
    }

    var StyleFormatContextLeft = document.getElementById('StyleFormatContextLeft');
    StyleFormatContextLeft.value = left;
    StyleFormatContextLeft.addEventListener('input', StyleFormatContextLeftInputHandler);

    //StyleFormatContextzIndex

    let zindex;

    if (ElementToBeDecorated.style.zIndex) {
        zindex = ElementToBeDecorated.style.zIndex;
    }
    else {
        zindex = compStyles.getPropertyValue("z-index");
    }

    var StyleFormatContextzIndex = document.getElementById('StyleFormatContextzIndex');
    var StyleFormatContextzIndexInfo = document.getElementById('StyleFormatContextzIndexInfo');
    var StyleFormatContextzIndexInfoColor = document.getElementById('StyleFormatContextzIndexInfoColor');
    StyleFormatContextzIndex.value = zindex;
    StyleFormatContextzIndexInfo.innerText = getLayerNameFromZIndex(zindex);
    StyleFormatContextzIndexInfoColor.style.backgroundColor = getLayerColorFromZIndex(zindex);
    StyleFormatContextzIndex.addEventListener('input', StyleFormatContextzIndexInputHandler);
}
function PositionSizeStyleFormatInitNewBugGroup() {

    if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
        compStyles = window.getComputedStyle(ElementToBeDecorated);
    }
    else {
        compStyles = window.getComputedStyle(ElementToBeDecorated.parentElement);
    }

    compStyles = window.getComputedStyle(ElementToBeDecorated.parentElement);

    //StyleFormatContextHeight

    let height;

    let ElementToGetSize

    if (ElementToBeDecorated.parentElement.style.height) {
        height = ElementToBeDecorated.parentElement.style.height;
    }
    else {
        height = compStyles.getPropertyValue("height");
    }

    var StyleFormatContextHeight = document.getElementById('StyleFormatContextHeight');
    StyleFormatContextHeight.value = height;
    StyleFormatContextHeight.addEventListener('input', StyleFormatContextHeightInputHandler);

    //StyleFormatContextWidth

    let width;

    if (ElementToBeDecorated.parentElement.style.width) {
        width = ElementToBeDecorated.parentElement.style.width;
    }
    else {
        width = compStyles.getPropertyValue("width");
    }

    var StyleFormatContextWidth = document.getElementById('StyleFormatContextWidth');
    StyleFormatContextWidth.value = width;
    StyleFormatContextWidth.addEventListener('input', StyleFormatContextWidthInputHandler);

    //StyleFormatContextTop

    let top;

    if (ElementToBeDecorated.parentElement.style.top) {
        top = ElementToBeDecorated.parentElement.style.top;
    }
    else {
        top = compStyles.getPropertyValue("top");
    }

    var StyleFormatContextTop = document.getElementById('StyleFormatContextTop');
    StyleFormatContextTop.value = top;
    StyleFormatContextTop.addEventListener('input', StyleFormatContextTopInputHandler);

    //StyleFormatContextLeft

    let left;

    if (ElementToBeDecorated.parentElement.style.left) {
        left = ElementToBeDecorated.parentElement.style.left;
    }
    else {
        left = compStyles.getPropertyValue("left");
    }

    var StyleFormatContextLeft = document.getElementById('StyleFormatContextLeft');
    StyleFormatContextLeft.value = left;
    StyleFormatContextLeft.addEventListener('input', StyleFormatContextLeftInputHandler);

    //StyleFormatContextzIndex

    let zindex;

    if (ElementToBeDecorated.parentElement.style.zIndex) {
        zindex = ElementToBeDecorated.parentElement.style.zIndex;
    }
    else {
        zindex = compStyles.getPropertyValue("z-index");
    }

    var StyleFormatContextzIndex = document.getElementById('StyleFormatContextzIndex');
    StyleFormatContextzIndex.value = zindex;
    StyleFormatContextzIndex.addEventListener('input', StyleFormatContextzIndexInputHandler);
}

function AnimatePositionSizeStyleFormatInit() {
    
    //HeightVariable
    if (ElementToBeDecorated.getAttribute("data-heightvariable")) {
        heightvariable = ElementToBeDecorated.getAttribute("data-heightvariable");
    }
    else {
        heightvariable = '';
        ElementToBeDecorated.setAttribute("data-heightvariable", heightvariable);
    }

    heightvariable = ElementToBeDecorated.getAttribute("data-heightvariable");

    var StyleFormatContextHeightVariable = document.getElementById('StyleFormatContextHeightVariable');
    StyleFormatContextHeightVariable.value = heightvariable;
    StyleFormatContextHeightVariable.addEventListener('input', StyleFormatContextHeightVariableInputHandler);

    //HeightMinRaw
    if (ElementToBeDecorated.getAttribute("data-heightminraw")) {
        heightminraw = ElementToBeDecorated.getAttribute("data-heightminraw");
    }
    else {
        heightminraw = '0';
        ElementToBeDecorated.setAttribute("data-heightminraw", heightminraw);
    }

    heightminraw = ElementToBeDecorated.getAttribute("data-heightminraw");

    var StyleFormatContextHeightMinRaw = document.getElementById('StyleFormatContextHeightMinRaw');
    StyleFormatContextHeightMinRaw.value = heightminraw;
    StyleFormatContextHeightMinRaw.addEventListener('input', StyleFormatContextHeightMinRawInputHandler);

    //HeightMaxRaw
    if (ElementToBeDecorated.getAttribute("data-heightmaxraw")) {
        heightmaxraw = ElementToBeDecorated.getAttribute("data-heightmaxraw");
    }
    else {
        heightmaxraw = '100';
        ElementToBeDecorated.setAttribute("data-heightmaxraw", heightmaxraw);
    }

    heightmaxraw = ElementToBeDecorated.getAttribute("data-heightmaxraw");

    var StyleFormatContextHeightMaxRaw = document.getElementById('StyleFormatContextHeightMaxRaw');
    StyleFormatContextHeightMaxRaw.value = heightmaxraw;
    StyleFormatContextHeightMaxRaw.addEventListener('input', StyleFormatContextHeightMaxRawInputHandler);

    //HeightMinPx
    if (ElementToBeDecorated.getAttribute("data-heightminpx")) {
        heightminpx = ElementToBeDecorated.getAttribute("data-heightminpx");
    }
    else {
        heightminpx = '0';
        ElementToBeDecorated.setAttribute("data-heightminpx", heightminpx);
    }

    heightminpx = ElementToBeDecorated.getAttribute("data-heightminpx");

    var StyleFormatContextHeightMinPx = document.getElementById('StyleFormatContextHeightMinPx');
    StyleFormatContextHeightMinPx.value = heightminpx;
    StyleFormatContextHeightMinPx.addEventListener('input', StyleFormatContextHeightMinPxInputHandler);

    //HeightMaxPx
    if (ElementToBeDecorated.getAttribute("data-heightmaxpx")) {
        heightmaxpx = ElementToBeDecorated.getAttribute("data-heightmaxpx");
    }
    else {
        heightmaxpx = '100';
        ElementToBeDecorated.setAttribute("data-heightmaxpx", heightmaxpx);
    }

    heightmaxpx = ElementToBeDecorated.getAttribute("data-heightmaxpx");

    var StyleFormatContextHeightMaxPx = document.getElementById('StyleFormatContextHeightMaxPx');
    StyleFormatContextHeightMaxPx.value = heightmaxpx;
    StyleFormatContextHeightMaxPx.addEventListener('input', StyleFormatContextHeightMaxPxInputHandler);

    //HeightReverse
    if (ElementToBeDecorated.getAttribute("data-heightreverse")) {
        heightreverse = ElementToBeDecorated.getAttribute("data-heightreverse");
    }
    else {
        heightreverse = 'false';
        ElementToBeDecorated.setAttribute("data-heightreverse", heightreverse);
    }

    heightreverse = ElementToBeDecorated.getAttribute("data-heightreverse");

    var InputContextheightreverse = document.getElementById('StyleFormatContextHeightReverse');
    InputContextheightreverse.checked = (heightreverse.toLowerCase() === 'true');
    InputContextheightreverse.addEventListener('input', StyleFormatContextheightreverseInputHandler);

    //WidthVariable
    if (ElementToBeDecorated.getAttribute("data-widthvariable")) {
        widthvariable = ElementToBeDecorated.getAttribute("data-widthvariable");
    }
    else {
        widthvariable = '';
        ElementToBeDecorated.setAttribute("data-widthvariable", widthvariable);
    }

    widthvariable = ElementToBeDecorated.getAttribute("data-widthvariable");

    var StyleFormatContextWidthVariable = document.getElementById('StyleFormatContextWidthVariable');
    StyleFormatContextWidthVariable.value = widthvariable;
    StyleFormatContextWidthVariable.addEventListener('input', StyleFormatContextWidthVariableInputHandler);

    //WidthMinRaw
    if (ElementToBeDecorated.getAttribute("data-widthminraw")) {
        widthminraw = ElementToBeDecorated.getAttribute("data-widthminraw");
    }
    else {
        widthminraw = '0';
        ElementToBeDecorated.setAttribute("data-widthminraw", widthminraw);
    }

    widthminraw = ElementToBeDecorated.getAttribute("data-widthminraw");

    var StyleFormatContextWidthMinRaw = document.getElementById('StyleFormatContextWidthMinRaw');
    StyleFormatContextWidthMinRaw.value = widthminraw;
    StyleFormatContextWidthMinRaw.addEventListener('input', StyleFormatContextWidthMinRawInputHandler);

    //WidthMaxRaw
    if (ElementToBeDecorated.getAttribute("data-widthmaxraw")) {
        widthmaxraw = ElementToBeDecorated.getAttribute("data-widthmaxraw");
    }
    else {
        widthmaxraw = '100';
        ElementToBeDecorated.setAttribute("data-widthmaxraw", widthmaxraw);
    }

    widthmaxraw = ElementToBeDecorated.getAttribute("data-widthmaxraw");

    var StyleFormatContextWidthMaxRaw = document.getElementById('StyleFormatContextWidthMaxRaw');
    StyleFormatContextWidthMaxRaw.value = widthmaxraw;
    StyleFormatContextWidthMaxRaw.addEventListener('input', StyleFormatContextWidthMaxRawInputHandler);

    //WidthMinPx
    if (ElementToBeDecorated.getAttribute("data-widthminpx")) {
        widthminpx = ElementToBeDecorated.getAttribute("data-widthminpx");
    }
    else {
        widthminpx = '0';
        ElementToBeDecorated.setAttribute("data-widthminpx", widthminpx);
    }

    widthminpx = ElementToBeDecorated.getAttribute("data-widthminpx");

    var StyleFormatContextWidthMinPx = document.getElementById('StyleFormatContextWidthMinPx');
    StyleFormatContextWidthMinPx.value = widthminpx;
    StyleFormatContextWidthMinPx.addEventListener('input', StyleFormatContextWidthMinPxInputHandler);

    //WidthMaxPx
    if (ElementToBeDecorated.getAttribute("data-widthmaxpx")) {
        widthmaxpx = ElementToBeDecorated.getAttribute("data-widthmaxpx");
    }
    else {
        widthmaxpx = '100';
        ElementToBeDecorated.setAttribute("data-widthmaxpx", widthmaxpx);
    }

    widthmaxpx = ElementToBeDecorated.getAttribute("data-widthmaxpx");

    var StyleFormatContextWidthMaxPx = document.getElementById('StyleFormatContextWidthMaxPx');
    StyleFormatContextWidthMaxPx.value = widthmaxpx;
    StyleFormatContextWidthMaxPx.addEventListener('input', StyleFormatContextWidthMaxPxInputHandler);

    //WidthReverse
    if (ElementToBeDecorated.getAttribute("data-widthreverse")) {
        widthreverse = ElementToBeDecorated.getAttribute("data-widthreverse");
    }
    else {
        widthreverse = 'false';
        ElementToBeDecorated.setAttribute("data-widthreverse", widthreverse);
    }

    widthreverse = ElementToBeDecorated.getAttribute("data-widthreverse");

    var InputContextwidthreverse = document.getElementById('StyleFormatContextWidthReverse');
    InputContextwidthreverse.checked = (widthreverse.toLowerCase() === 'true');
    InputContextwidthreverse.addEventListener('input', StyleFormatContextwidthreverseInputHandler);

    //TopVariable
    if (ElementToBeDecorated.getAttribute("data-topvariable")) {
        topvariable = ElementToBeDecorated.getAttribute("data-topvariable");
    }
    else {
        topvariable = '';
        ElementToBeDecorated.setAttribute("data-topvariable", topvariable);
    }

    topvariable = ElementToBeDecorated.getAttribute("data-topvariable");

    var StyleFormatContextTopVariable = document.getElementById('StyleFormatContextTopVariable');
    StyleFormatContextTopVariable.value = topvariable;
    StyleFormatContextTopVariable.addEventListener('input', StyleFormatContextTopVariableInputHandler);

    //TopMinRaw
    if (ElementToBeDecorated.getAttribute("data-topminraw")) {
        topminraw = ElementToBeDecorated.getAttribute("data-topminraw");
    }
    else {
        topminraw = '0';
        ElementToBeDecorated.setAttribute("data-topminraw", topminraw);
    }

    topminraw = ElementToBeDecorated.getAttribute("data-topminraw");

    var StyleFormatContextTopMinRaw = document.getElementById('StyleFormatContextTopMinRaw');
    StyleFormatContextTopMinRaw.value = topminraw;
    StyleFormatContextTopMinRaw.addEventListener('input', StyleFormatContextTopMinRawInputHandler);

    //TopMaxRaw
    if (ElementToBeDecorated.getAttribute("data-topmaxraw")) {
        topmaxraw = ElementToBeDecorated.getAttribute("data-topmaxraw");
    }
    else {
        topmaxraw = '100';
        ElementToBeDecorated.setAttribute("data-topmaxraw", topmaxraw);
    }

    topmaxraw = ElementToBeDecorated.getAttribute("data-topmaxraw");

    var StyleFormatContextTopMaxRaw = document.getElementById('StyleFormatContextTopMaxRaw');
    StyleFormatContextTopMaxRaw.value = topmaxraw;
    StyleFormatContextTopMaxRaw.addEventListener('input', StyleFormatContextTopMaxRawInputHandler);

    //TopMinPx
    if (ElementToBeDecorated.getAttribute("data-topminpx")) {
        topminpx = ElementToBeDecorated.getAttribute("data-topminpx");
    }
    else {
        topminpx = '0';
        ElementToBeDecorated.setAttribute("data-topminpx", topminpx);
    }

    topminpx = ElementToBeDecorated.getAttribute("data-topminpx");

    var StyleFormatContextTopMinPx = document.getElementById('StyleFormatContextTopMinPx');
    StyleFormatContextTopMinPx.value = topminpx;
    StyleFormatContextTopMinPx.addEventListener('input', StyleFormatContextTopMinPxInputHandler);

    //TopMaxPx
    if (ElementToBeDecorated.getAttribute("data-topmaxpx")) {
        topmaxpx = ElementToBeDecorated.getAttribute("data-topmaxpx");
    }
    else {
        topmaxpx = '100';
        ElementToBeDecorated.setAttribute("data-topmaxpx", topmaxpx);
    }

    topmaxpx = ElementToBeDecorated.getAttribute("data-topmaxpx");

    var StyleFormatContextTopMaxPx = document.getElementById('StyleFormatContextTopMaxPx');
    StyleFormatContextTopMaxPx.value = topmaxpx;
    StyleFormatContextTopMaxPx.addEventListener('input', StyleFormatContextTopMaxPxInputHandler);

    //TopVariable
    if (ElementToBeDecorated.getAttribute("data-topvariable")) {
        topvariable = ElementToBeDecorated.getAttribute("data-topvariable");
    }
    else {
        topvariable = '';
        ElementToBeDecorated.setAttribute("data-topvariable", topvariable);
    }

    topvariable = ElementToBeDecorated.getAttribute("data-topvariable");

    var StyleFormatContextTopVariable = document.getElementById('StyleFormatContextTopVariable');
    StyleFormatContextTopVariable.value = topvariable;
    StyleFormatContextTopVariable.addEventListener('input', StyleFormatContextTopVariableInputHandler);

    //TopMinRaw
    if (ElementToBeDecorated.getAttribute("data-topminraw")) {
        topminraw = ElementToBeDecorated.getAttribute("data-topminraw");
    }
    else {
        topminraw = '0';
        ElementToBeDecorated.setAttribute("data-topminraw", topminraw);
    }

    topminraw = ElementToBeDecorated.getAttribute("data-topminraw");

    var StyleFormatContextTopMinRaw = document.getElementById('StyleFormatContextTopMinRaw');
    StyleFormatContextTopMinRaw.value = topminraw;
    StyleFormatContextTopMinRaw.addEventListener('input', StyleFormatContextTopMinRawInputHandler);

    //TopMaxRaw
    if (ElementToBeDecorated.getAttribute("data-topmaxraw")) {
        topmaxraw = ElementToBeDecorated.getAttribute("data-topmaxraw");
    }
    else {
        topmaxraw = '100';
        ElementToBeDecorated.setAttribute("data-topmaxraw", topmaxraw);
    }

    topmaxraw = ElementToBeDecorated.getAttribute("data-topmaxraw");

    var StyleFormatContextTopMaxRaw = document.getElementById('StyleFormatContextTopMaxRaw');
    StyleFormatContextTopMaxRaw.value = topmaxraw;
    StyleFormatContextTopMaxRaw.addEventListener('input', StyleFormatContextTopMaxRawInputHandler);

    //TopMinPx
    if (ElementToBeDecorated.getAttribute("data-topminpx")) {
        topminpx = ElementToBeDecorated.getAttribute("data-topminpx");
    }
    else {
        topminpx = '0';
        ElementToBeDecorated.setAttribute("data-topminpx", topminpx);
    }

    topminpx = ElementToBeDecorated.getAttribute("data-topminpx");

    var StyleFormatContextTopMinPx = document.getElementById('StyleFormatContextTopMinPx');
    StyleFormatContextTopMinPx.value = topminpx;
    StyleFormatContextTopMinPx.addEventListener('input', StyleFormatContextTopMinPxInputHandler);

    //TopMaxPx
    if (ElementToBeDecorated.getAttribute("data-topmaxpx")) {
        topmaxpx = ElementToBeDecorated.getAttribute("data-topmaxpx");
    }
    else {
        topmaxpx = '100';
        ElementToBeDecorated.setAttribute("data-topmaxpx", topmaxpx);
    }

    topmaxpx = ElementToBeDecorated.getAttribute("data-topmaxpx");

    var StyleFormatContextTopMaxPx = document.getElementById('StyleFormatContextTopMaxPx');
    StyleFormatContextTopMaxPx.value = topmaxpx;
    StyleFormatContextTopMaxPx.addEventListener('input', StyleFormatContextTopMaxPxInputHandler);

    //LeftVariable
    if (ElementToBeDecorated.getAttribute("data-leftvariable")) {
        leftvariable = ElementToBeDecorated.getAttribute("data-leftvariable");
    }
    else {
        leftvariable = '';
        ElementToBeDecorated.setAttribute("data-leftvariable", leftvariable);
    }

    leftvariable = ElementToBeDecorated.getAttribute("data-leftvariable");

    var StyleFormatContextLeftVariable = document.getElementById('StyleFormatContextLeftVariable');
    StyleFormatContextLeftVariable.value = leftvariable;
    StyleFormatContextLeftVariable.addEventListener('input', StyleFormatContextLeftVariableInputHandler);

    //LeftMinRaw
    if (ElementToBeDecorated.getAttribute("data-leftminraw")) {
        leftminraw = ElementToBeDecorated.getAttribute("data-leftminraw");
    }
    else {
        leftminraw = '0';
        ElementToBeDecorated.setAttribute("data-leftminraw", leftminraw);
    }

    leftminraw = ElementToBeDecorated.getAttribute("data-leftminraw");

    var StyleFormatContextLeftMinRaw = document.getElementById('StyleFormatContextLeftMinRaw');
    StyleFormatContextLeftMinRaw.value = leftminraw;
    StyleFormatContextLeftMinRaw.addEventListener('input', StyleFormatContextLeftMinRawInputHandler);

    //LeftMaxRaw
    if (ElementToBeDecorated.getAttribute("data-leftmaxraw")) {
        leftmaxraw = ElementToBeDecorated.getAttribute("data-leftmaxraw");
    }
    else {
        leftmaxraw = '100';
        ElementToBeDecorated.setAttribute("data-leftmaxraw", leftmaxraw);
    }

    leftmaxraw = ElementToBeDecorated.getAttribute("data-leftmaxraw");

    var StyleFormatContextLeftMaxRaw = document.getElementById('StyleFormatContextLeftMaxRaw');
    StyleFormatContextLeftMaxRaw.value = leftmaxraw;
    StyleFormatContextLeftMaxRaw.addEventListener('input', StyleFormatContextLeftMaxRawInputHandler);

    //LeftMinPx
    if (ElementToBeDecorated.getAttribute("data-leftminpx")) {
        leftminpx = ElementToBeDecorated.getAttribute("data-leftminpx");
    }
    else {
        leftminpx = '0';
        ElementToBeDecorated.setAttribute("data-leftminpx", leftminpx);
    }

    leftminpx = ElementToBeDecorated.getAttribute("data-leftminpx");

    var StyleFormatContextLeftMinPx = document.getElementById('StyleFormatContextLeftMinPx');
    StyleFormatContextLeftMinPx.value = leftminpx;
    StyleFormatContextLeftMinPx.addEventListener('input', StyleFormatContextLeftMinPxInputHandler);

    //LeftMaxPx
    if (ElementToBeDecorated.getAttribute("data-leftmaxpx")) {
        leftmaxpx = ElementToBeDecorated.getAttribute("data-leftmaxpx");
    }
    else {
        leftmaxpx = '100';
        ElementToBeDecorated.setAttribute("data-leftmaxpx", leftmaxpx);
    }

    leftmaxpx = ElementToBeDecorated.getAttribute("data-leftmaxpx");

    var StyleFormatContextLeftMaxPx = document.getElementById('StyleFormatContextLeftMaxPx');
    StyleFormatContextLeftMaxPx.value = leftmaxpx;
    StyleFormatContextLeftMaxPx.addEventListener('input', StyleFormatContextLeftMaxPxInputHandler);

}

function ActionStyleFormatInit() {

    var data = [];

    //console.log(ElementToBeDecorated);

    //var actions = ObjDom.getAttribute('data-actions'); this was wrong during testing migration
    var actions = ElementToBeDecorated.getAttribute('data-actions');
    
    //console.log(actions);

    if (actions && actions !== '') {
        try {
            data = JSON.parse(actions);
        } catch (e) {
            console.log(e);
        }
    }

    loadActionContext(data);
    
}

function GroupStyleFormatInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    $("#pickergroupbackgroundcolor").colorPick({
        'initialColor': compStyles.backgroundColor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.style.backgroundColor = GetObjectColor(this.element.attr('title'));

            }
        }
    });

    //GroupSymbol
    if (ElementToBeDecorated.getAttribute("data-groupsymbol")) {
        groupsymbol = ElementToBeDecorated.getAttribute("data-groupsymbol");
    }
    else {
        groupsymbol = '';
        ElementToBeDecorated.setAttribute("data-groupsymbol", groupsymbol);
    }
    groupsymbol = ElementToBeDecorated.getAttribute("data-groupsymbol");

    var StyleFormatContextGroupSymbol = document.getElementById('StyleFormatContextGroupSymbol');
    StyleFormatContextGroupSymbol.value = groupsymbol;
    StyleFormatContextGroupSymbol.addEventListener('input', StyleFormatContextGroupSymbolInputHandler);

    //GroupSymbolMaster
    if (ElementToBeDecorated.getAttribute("data-groupsymbolmaster")) {
        groupsymbolmaster = ElementToBeDecorated.getAttribute("data-groupsymbolmaster");
    }
    else {
        groupsymbolmaster = '';
        ElementToBeDecorated.setAttribute("data-groupsymbolmaster", groupsymbolmaster);
    }
    groupsymbolmaster = ElementToBeDecorated.getAttribute("data-groupsymbolmaster");

    var StyleFormatContextGroupSymbolMaster = document.getElementById('StyleFormatContextGroupSymbolMaster');
    StyleFormatContextGroupSymbolMaster.value = groupsymbolmaster;
    StyleFormatContextGroupSymbolMaster.addEventListener('input', StyleFormatContextGroupSymbolMasterInputHandler);

    //GroupMargins
    if (ElementToBeDecorated.getAttribute("data-groupmargins")) {
        groupmargins = ElementToBeDecorated.getAttribute("data-groupmargins");
    }
    else {
        groupmargins = compStyles.margin;
        ElementToBeDecorated.setAttribute("data-groupmargins", groupmargins);
    }
    groupmargins = ElementToBeDecorated.getAttribute("data-groupmargins");

    var StyleFormatContextGroupMargins = document.getElementById('StyleFormatContextGroupMargins');
    StyleFormatContextGroupMargins.value = groupmargins;
    StyleFormatContextGroupMargins.addEventListener('input', StyleFormatContextGroupMarginsInputHandler);

    //GroupFloat
    if (ElementToBeDecorated.getAttribute("data-groupfloat")) {
        groupfloat = ElementToBeDecorated.getAttribute("data-groupfloat");
    }
    else {
        groupfloat = compStyles.float;
        ElementToBeDecorated.setAttribute("data-groupfloat", groupfloat);
    }
    groupfloat = ElementToBeDecorated.getAttribute("data-groupfloat");

    var StyleFormatContextGroupFloat = document.getElementById('StyleFormatContextGroupFloat');
    StyleFormatContextGroupFloat.value = groupfloat;
    StyleFormatContextGroupFloat.addEventListener('input', StyleFormatContextGroupFloatInputHandler);

    //GroupPosition
    if (ElementToBeDecorated.getAttribute("data-groupposition")) {
        groupposition = ElementToBeDecorated.getAttribute("data-groupposition");
    }
    else {
        //groupposition = '';
        groupposition = compStyles.position;
        ElementToBeDecorated.setAttribute("data-groupposition", groupposition);
    }
    groupposition = ElementToBeDecorated.getAttribute("data-groupposition");

    var StyleFormatContextGroupPosition = document.getElementById('StyleFormatContextGroupPosition');
    StyleFormatContextGroupPosition.value = groupposition;
    StyleFormatContextGroupPosition.addEventListener('input', StyleFormatContextGroupPositionInputHandler);

    //GroupScale
    if (ElementToBeDecorated.getAttribute("data-groupscale")) {
        groupscale = ElementToBeDecorated.getAttribute("data-groupscale");
    }
    else {
        //groupscale = '';
        groupscale = '1';
        ElementToBeDecorated.setAttribute("data-groupscale", groupscale);
    }
    groupscale = ElementToBeDecorated.getAttribute("data-groupscale");

    var StyleFormatContextGroupScale = document.getElementById('StyleFormatContextGroupScale');
    StyleFormatContextGroupScale.value = groupscale;
    StyleFormatContextGroupScale.addEventListener('input', StyleFormatContextGroupScaleInputHandler);

    //GroupLibraryPath
    if (ElementToBeDecorated.getAttribute("data-grouplibrarypath")) {
        grouplibrarypath = ElementToBeDecorated.getAttribute("data-grouplibrarypath");
    }
    else {
        grouplibrarypath = '';
        ElementToBeDecorated.setAttribute("data-grouplibrarypath", grouplibrarypath);
    }
    grouplibrarypath = ElementToBeDecorated.getAttribute("data-grouplibrarypath");

    var StyleFormatContextGroupLibraryPath = document.getElementById('StyleFormatContextGroupLibraryPath');
    StyleFormatContextGroupLibraryPath.value = grouplibrarypath;
    StyleFormatContextGroupLibraryPath.addEventListener('input', StyleFormatContextGroupLibraryPathInputHandler);

}

// Collapsibles

function ToggleContextGroup(contextGroup) {
    if (document.getElementById(contextGroup + 'Collapsible').style.display === "block") {
        document.getElementById(contextGroup + 'Collapsible').style.display = "none";
        document.getElementById(contextGroup + 'Expand').style.display = "block";
        document.getElementById(contextGroup + 'Collapse').style.display = "none";
        localStorage.setItem(contextGroup + 'Collapsible', "none");
    }
    else {
        document.getElementById(contextGroup + 'Collapsible').style.display = "block";
        document.getElementById(contextGroup + 'Expand').style.display = "none";
        document.getElementById(contextGroup + 'Collapse').style.display = "block";
        localStorage.setItem(contextGroup + 'Collapsible', "block");
    }
}

function MoveColorExpressionUp() {

    const sequenceNo = event.target.closest('.rowcontext').querySelector('.configinput').dataset.sequenceno;
    //console.log(parseInt(sequenceNo));

    const value = event.target.closest('.rowcontext').querySelector('.configinput').value;
    //console.log(value);

    const color = event.target.closest('.rowcontext').querySelector('.picker').title;
    //console.log(color);

    const nextSequenceNo = event.target.closest('.rowcontext').previousElementSibling?.querySelector('.configinput').dataset.sequenceno;
    //console.log(nextSequenceNo);

    const previousValue = event.target.closest('.rowcontext').previousElementSibling?.querySelector('.configinput').value;
    //console.log(previousValue);

    const previousColor = event.target.closest('.rowcontext').previousElementSibling?.querySelector('.picker').title;
    //console.log(previousColor);


    event.target.closest('.rowcontext').querySelector('.configinput').value = previousValue;
    event.target.closest('.rowcontext').querySelector('.configinput').dispatchEvent(new Event('input'));
    event.target.closest('.rowcontext').querySelector('.picker').style.backgroundColor = GetObjectColor(previousColor);
    event.target.closest('.rowcontext').querySelector('.picker').style.color = GetObjectColor(previousColor);
    event.target.closest('.rowcontext').querySelector('.picker').title = previousColor;

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
        ElementToBeDecoratedX.setAttribute('data-colorstate' + sequenceNo, previousColor);
    }

    event.target.closest('.rowcontext').previousElementSibling.querySelector('.configinput').value = value;
    event.target.closest('.rowcontext').previousElementSibling.querySelector('.configinput').dispatchEvent(new Event('input'));
    event.target.closest('.rowcontext').previousElementSibling.querySelector('.picker').style.backgroundColor = GetObjectColor(color);
    event.target.closest('.rowcontext').previousElementSibling.querySelector('.picker').style.color = GetObjectColor(color);
    event.target.closest('.rowcontext').previousElementSibling.querySelector('.picker').title = color;

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
        ElementToBeDecoratedX.setAttribute('data-colorstate' + nextSequenceNo, color);
    }
}

function MoveColorExpressionDown() {

    const sequenceNo = event.target.closest('.rowcontext').querySelector('.configinput').dataset.sequenceno;
    //console.log(parseInt(sequenceNo));

    const value = event.target.closest('.rowcontext').querySelector('.configinput').value;
    //console.log(value);

    const color = event.target.closest('.rowcontext').querySelector('.picker').title;
    //console.log(color);

    const nextSequenceNo = event.target.closest('.rowcontext').nextElementSibling?.querySelector('.configinput').dataset.sequenceno;
    //console.log(nextSequenceNo);

    const previousValue = event.target.closest('.rowcontext').nextElementSibling?.querySelector('.configinput').value;
    //console.log(previousValue);

    const previousColor = event.target.closest('.rowcontext').nextElementSibling?.querySelector('.picker').title;
    //console.log(previousColor);

    event.target.closest('.rowcontext').querySelector('.configinput').value = previousValue;
    event.target.closest('.rowcontext').querySelector('.configinput').dispatchEvent(new Event('input'));
    event.target.closest('.rowcontext').querySelector('.picker').style.backgroundColor = GetObjectColor(previousColor);
    event.target.closest('.rowcontext').querySelector('.picker').style.color = GetObjectColor(previousColor);
    event.target.closest('.rowcontext').querySelector('.picker').title = previousColor;

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
        ElementToBeDecoratedX.setAttribute('data-colorstate' + sequenceNo, previousColor);
    }

    event.target.closest('.rowcontext').nextElementSibling.querySelector('.configinput').value = value;
    event.target.closest('.rowcontext').nextElementSibling.querySelector('.configinput').dispatchEvent(new Event('input'));
    event.target.closest('.rowcontext').nextElementSibling.querySelector('.picker').style.backgroundColor = GetObjectColor(color);
    event.target.closest('.rowcontext').nextElementSibling.querySelector('.picker').style.color = GetObjectColor(color);
    event.target.closest('.rowcontext').nextElementSibling.querySelector('.picker').title = color;

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
        ElementToBeDecoratedX.setAttribute('data-colorstate' + nextSequenceNo, color);
    }
    
}
