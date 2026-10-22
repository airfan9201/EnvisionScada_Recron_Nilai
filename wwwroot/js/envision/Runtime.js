// Envision Runtime - Runtime execution loop: executeQuery heartbeat, chart/alarm/script periodic execution, license check.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

// Objects whose missing-runtime-element warning has already been logged (one warning per object).
var _warnedMissingRuntimeEls = new Set();

// Called from the per-type executeQuery handlers when an object's inner runtime element is absent
// (malformed/incomplete markup). Skips the object so the executeQuery heartbeat keeps running instead of
// throwing and stopping, and surfaces the offending object once in the console for diagnosis.
function warnMissingRuntimeElement(element) {
    var id = (element && element.id)
        || (element && element.getAttribute && element.getAttribute("data-system-objectname"))
        || "unknown";
    if (!_warnedMissingRuntimeEls.has(id)) {
        _warnedMissingRuntimeEls.add(id);
        var type = element && element.getAttribute && element.getAttribute("name");
        console.warn('executeQuery: object "' + id + '" (' + type + ') has no runtime element; skipping.', element);
    }
}

function executeQuery() {

    //TODO 0: Make something so that it doesn't run all config related options, only the runtime animations
    
    //console.log('Refreshing Page...')

    // FOR ALL PAGES WHERE VISIBILITY = TRUE.... 
    // LIST VARIABLES
    // LOAD VARIABLES AJAX
    // DISPLAY

    //console.clear();
    //for (const [key, value] of Object.entries(PageVars)) {
    //    console.log(key);
    //}

    PageVars = new Object();

    LicenseCheck();

    //for (var key in VarDict) {
    //    var value = VarDict[key];
    //    console.log(key + " -> " + value);
    //    // do something with "key" and "value" variables
    //}

    var EnvisionPage = document.getElementById("EnvisionPage");
    var Elements = EnvisionPage.getElementsByClassName("draggable");

    //let Variables = ['Valve1', 'Pump1']
    //let VariablesValue = ['1', '0']

    for (var i = 0; i < Elements.length; i++) {

        //console.trace(draggables.item(i).id)
        var element = Elements.item(i);

        // Map children are positioned by lat/lon, so they come in and out of view as
        // the map pans. The collected PageVars set IS the subscription (see GetData),
        // so visibility must not change it - otherwise every pin crossing the viewport
        // edge turns a cheap delta poll into a full resubscribe + snapshot.
        // Hidden pins skip the render work below; their variables are replayed into
        // PageVars by executeMapObject instead.
        var mapChild = element.closest && element.closest('[data-system-mapchild="true"]');
        var mapVarsOuter = null;
        if (mapChild) {
            if (mapChild.getAttribute("data-system-map-offscreen") === "true") {
                continue;
            }
            // Visible pin: capture what this element subscribes, so the identical set
            // can be replayed verbatim once the pin scrolls back out of view.
            mapVarsOuter = PageVars;
            PageVars = {};
        }

        try {

        switch (element.getAttribute("name")) {
            case "SVGObject":
                executeSVGObject(element);
                break;
            case "ImageObject":
                executeImageObject(element);
                break;
            case "ButtonObject":
                executeButtonObject(element);
                break;
            case "InputObject":
                executeInputObject(element);
                break;
            case "DateTimePickerObject":
                executeDateTimePickerObject(element);
                break;
            case "LabelObject":
                executeLabelObject(element);
                break;
            case "SquareObject":
                executeSquareObject(element);
                break;
            case "CircleObject":
                executeCircleObject(element);
                break;
            case "KnobObject":
                executeKnobObject(element);
                break;
            case "TrendObject":
                executeTrendObject(element);
                break;
            case "AlarmBannerObject":
                executeAlarmBannerObject(element);
                break;
            case "DataTableObject":
                executeDataTableObject(element);
                break;
            case "WebFrameObject":
                executeWebFrameObject(element);
                break;
            case "DocumentViewerObject":
                executeDocumentViewerObject(element);
                break;
            case "AlarmViewerObject":
            case "EventViewerObject":
            case "AuditTrailViewerObject":
            case "TrendAnalystViewerObject":
            case "UsersViewerObject":
                executeViewerObject(element);
                break;
            case "WidgetObject":
                executeWidgetObject(element);
                break;
            case "RecipeManagerObject":
                executeRecipeManagerObject(element);
                break;
            case "SliderObject":
                executeSliderObject(element);
                break;
            case "DonutObject":
                executeDonutObject(element);
                break;
            case "BarGraphObject":
                executeBarGraphObject(element);
                break;
            case "MapObject":
                executeMapObject(element);
                break;
            case "ListBoxObject":
                executeListBoxObject(element);
                break;
            case "DropDownObject":
                executeDropDownObject(element);
                break;
            case "PolygonObject":
                executePolygonObject(element);
                break;
            case "PolylineObject":
                executePolylineObject(element);
                break;
            case "RadioButtonObject":
                executeRadioButtonObject(element);
                break;
            case "CheckBoxObject":
                executeCheckBoxObject(element);
                break;
            case "ToggleObject":
                executeToggleObject(element);
                break;
            case "GroupObject":
                executeGroupObject(element);
                break;
            default:
                //console.log('unknown ' + element.getAttribute("name"));
                element.style.filter = "contrast(10%)";
            // code block
        }

        } finally {
            if (mapChild) {
                var mapContributed = Object.keys(PageVars);
                PageVars = mapVarsOuter;
                if (!mapChild._mapChildVars) mapChild._mapChildVars = {};
                for (var mv = 0; mv < mapContributed.length; mv++) {
                    PageVars[mapContributed[mv]] = 0;
                    mapChild._mapChildVars[mapContributed[mv]] = 0;
                }
            }
        }
    }

    // Polyline bridges are a relationship BETWEEN objects, so they are refreshed once per tick at
    // page level instead of inside executePolylineObject (which would make it O(objects^2) per
    // tick). Fingerprinted, so a page whose lines have not moved pays only for the fingerprint —
    // and a line moved by a position animation gets its crossings recomputed on the next tick.
    RedrawPolylineBridges();

    // calc ClientPerformance
    var date1 = new Date();
    const diffTime = Math.abs(date2 - date1);

    document.getElementById("PerfRenderTime").textContent = diffTime + " ms";

    document.getElementById("PerfScale").textContent = Math.trunc(viewportScale * 100) + "%";

    var perfLicenseItem = document.getElementById("PerfLicenseItem");

    if (typeof VarDict['SYSTEM.LicenseStatus'] !== 'undefined' && typeof VarDict['SYSTEM.DemoCounter'] !== 'undefined') {

        //console.log(VarDict['SYSTEM.LicenseStatus'][0]);
        if (VarDict['SYSTEM.LicenseStatus'][0] == "DEMO") {
            document.getElementById("PerfLicense").textContent = "DEMO " + VarDict['SYSTEM.DemoCounter'][0] + "s";
            perfLicenseItem.style.display = "";


            if (VarDict['SYSTEM.DemoCounter'][0] == 300) {

                if (!$('#MessageModal').hasClass('show')) {

                    var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
                    document.getElementById('ModalMessage').innerHTML = "Server will stop in 5 minutes (Demo Mode).";
                    myModal.show();

                }

            }
        }
        else {
            document.getElementById("PerfLicense").textContent = VarDict['SYSTEM.LicenseStatus'][0];
            perfLicenseItem.style.display = "";
        }
    }
    else {
        perfLicenseItem.style.display = "none";
    }

    date2 = date1;

    ApplyPageObjectColors();

    //do it at the end so all colors are already set
    if (firstdata || Object.keys(PageVars).length == 0) {
        if (!deneutralized) {
            document.getElementById("EnvisionPage").style.filter = "";
            document.getElementById("EnvisionPage").style.opacity = 1;
            document.getElementById("PageLoaderContainer").style.display = "none";
            document.getElementById("pageloaderrefresh").style.display = "none";
            
            deneutralized = true;
        }
    }

    SyncAnimations();

    GetData(); // put at the end

    // Hidden tabs back off to reduce server load; stays far inside the server's 60s
    // subscription eviction window so the tab never loses its subscription.
    executeQueryTimer = setTimeout(executeQuery, document.hidden ? Math.max(PageRefreshTime * 5, 2500) : PageRefreshTime);

}

// The page background and border are the one surface that could not follow the Color Library: the
// picker resolved the name to a hex at DESIGN time and only that hex was stored in Pages.Style, so
// nothing was left to re-resolve at runtime.
//
// The name is now kept alongside it in two CSS custom properties inside the same style string.
// Custom properties accept any token, so they survive the getAttribute('style') round trip into
// Pages.Style untouched - no new column, no DTO field and no export change. A page saved before this
// simply has no custom property, so nothing is applied and it renders exactly as it did.
function ApplyPageObjectColors() {

    var page = document.getElementById("EnvisionPage");
    if (!page) { return; }

    var background = page.style.getPropertyValue('--envision-bgcolor').trim();
    if (background) { page.style.backgroundColor = GetObjectColor(background); }

    var border = page.style.getPropertyValue('--envision-bordercolor').trim();
    if (border) { page.style.borderColor = GetObjectColor(border); }
}

var executeQueryTimer = null;

// Refresh immediately when the tab becomes visible again. Replaces the pending (slow) timer
// instead of calling executeQuery alongside it, so there is always exactly one reschedule chain.
document.addEventListener('visibilitychange', function () {
    if (!document.hidden && executeQueryTimer !== null) {
        clearTimeout(executeQueryTimer);
        executeQueryTimer = null;
        executeQuery();
    }
});

// --- executeQuery per-object-type handlers (extracted from the type switch) ---

function executeSVGObject(element) {
    {

        let ObjDom = element.getElementsByTagName("svg")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes
        let backgroundcolor;

        let strokecolor;

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#B3B3B3';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        ObjDom.style.fill = GetObjectColor(backgroundcolor);
        ObjDom.style.color = GetObjectColor(backgroundcolor);

        // strokecolor. Resolved here like the fill: the design write stores the value verbatim in
        // the inline style, so a Color Library NAME reached the browser as an invalid CSS color and
        // was dropped - the symbol rendered with no stroke at all, while its fill resolved fine.
        // No default: an SVG without this attribute keeps whatever stroke its own markup sets.
        if (ObjDom.getAttribute("data-strokecolor")) {
            strokecolor = ObjDom.getAttribute("data-strokecolor");
            ObjDom.style.stroke = GetObjectColor(strokecolor);
        }

        const color = getColorFromStates(ObjDom, "data-colorstates");

        if (color) {
            ObjDom.style.fill = GetObjectColor(color);
            ObjDom.style.color = GetObjectColor(color);
        }

        // TODO: SVGObject SET ZERO STATE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesRotation(ObjDom);

        PositionSizeAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
        RotationAnimation(ObjDom);
        ContinuousRotationAnimation(ObjDom);
    }
}

function executeImageObject(element) {
    {
        let ObjDom = element.getElementsByTagName("img")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Animate

        // Generic
        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesRotation(ObjDom);

        PositionSizeAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
        RotationAnimation(ObjDom);
        ContinuousRotationAnimation(ObjDom);
    }
}

function executeButtonObject(element) {
    {
        let ObjDom = element.getElementsByTagName("button")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        let ontext;
        let offtext;
        let oncolor;
        let offcolor;
        let onbackgroundcolor;
        let onbordercolor;
        let offbackgroundcolor;
        let offbordercolor;
        let variable;

        // oncolor
        if (ObjDom.getAttribute("data-oncolor")) {
            oncolor = ObjDom.getAttribute("data-oncolor");
        }
        else {
            oncolor = '#000';
            ObjDom.setAttribute("data-oncolor", oncolor);
        }

        // offcolor
        if (ObjDom.getAttribute("data-offcolor")) {
            offcolor = ObjDom.getAttribute("data-offcolor");
        }
        else {
            offcolor = '#fff';
            ObjDom.setAttribute("data-offcolor", offcolor);
        }

        // onbackgroundcolor
        if (ObjDom.getAttribute("data-onbackgroundcolor")) {
            onbackgroundcolor = ObjDom.getAttribute("data-onbackgroundcolor");
        }
        else {
            onbackgroundcolor = '#f8f9fa';
            ObjDom.setAttribute("data-onbackgroundcolor", onbackgroundcolor);
        }

        // onbordercolor
        if (ObjDom.getAttribute("data-onbordercolor")) {
            onbordercolor = ObjDom.getAttribute("data-onbordercolor");
        }
        else {
            onbordercolor = '#f8f9fa';
            ObjDom.setAttribute("data-onbordercolor", onbordercolor);
        }

        // offbackgroundcolor
        if (ObjDom.getAttribute("data-offbackgroundcolor")) {
            offbackgroundcolor = ObjDom.getAttribute("data-offbackgroundcolor");
        }
        else {
            offbackgroundcolor = '#9e9e9e';
            ObjDom.setAttribute("data-offbackgroundcolor", offbackgroundcolor);
        }

        // offbordercolor
        if (ObjDom.getAttribute("data-offbordercolor")) {
            offbordercolor = ObjDom.getAttribute("data-offbordercolor");
        }
        else {
            offbordercolor = '#9e9e9e';
            ObjDom.setAttribute("data-offbordercolor", offbordercolor);
        }

        //ontext
        if (ObjDom.getAttribute("data-ontext")) {
            ontext = ObjDom.getAttribute("data-ontext");
        }
        else {
            ontext = 'ON';
            ObjDom.setAttribute("data-ontext", ontext);
        }

        //offtext
        if (ObjDom.getAttribute("data-offtext")) {
            offtext = ObjDom.getAttribute("data-offtext");
        }
        else {
            offtext = 'OFF';
            ObjDom.setAttribute("data-offtext", offtext);
        }

        //variable
        if (ObjDom.getAttribute("data-variable")) {
            variable = ObjDom.getAttribute("data-variable");
        }
        else {
            variable = '';
            ObjDom.setAttribute("data-variable", variable);
        }

        // borderradius
        if (ObjDom.getAttribute("data-borderradius")) {
            let br = ObjDom.getAttribute("data-borderradius");
            ObjDom.style.borderRadius = (br !== '' && !isNaN(br)) ? br + 'px' : br;
        }

        // Animate button

        let compStyles = window.getComputedStyle(ObjDom);

        //let variableindex = Variables.indexOf(variable);
        //VarDict[variable]
        let variablevalue = '';

        let DevVar = variable;

        if (variable.includes(" ")) {
            variable = ResolveConditionstate(variable);
            if (firstdata) {
                try {
                    if (Function("return " + variable)()) {

                        var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

                        var translation =
                            LanguagesFileJson?.[ontext]?.[selectedLang] ?? ontext;

                        if (ObjDom.innerHTML !== translation) {
                            ObjDom.innerHTML = translation;
                        }

                        ObjDom.style.color = GetObjectColor(oncolor);
                        ObjDom.style.backgroundColor = GetObjectColor(onbackgroundcolor);
                        ObjDom.style.borderColor = GetObjectColor(onbordercolor);
                    }
                    else {
                        var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

                        var translation =
                            LanguagesFileJson?.[offtext]?.[selectedLang] ?? offtext;

                        if (ObjDom.innerHTML !== translation) {
                            ObjDom.innerHTML = translation;
                        }
                        //ObjDom.style.color = offcolor;
                        //ObjDom.style.backgroundColor = offbackgroundcolor;
                        //ObjDom.style.borderColor = offbordercolor;

                        ObjDom.style.color = GetObjectColor(offcolor);
                        ObjDom.style.backgroundColor = GetObjectColor(offbackgroundcolor);
                        ObjDom.style.borderColor = GetObjectColor(offbordercolor);
                    }

                } catch (error) {
                    //console.error(error);
                }
            }
        }
        else {

            // Free-form names: subscribe any plausible name; a dot-less token that stays
            // unknown after data arrives is static text (never NOT FOUND).
            if (isVariableName(DevVar)) {
                PageVars[DevVar] = 0;
            }

            if (!isVariableName(DevVar) || (!DevVar.includes(".") && typeof VarDict[DevVar] === 'undefined')) {

                var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

                var translation =
                    LanguagesFileJson?.[ontext]?.[selectedLang] ?? ontext;

                if (ObjDom.innerHTML !== translation) {
                    ObjDom.innerHTML = translation;
                }

                ObjDom.style.color = GetObjectColor(oncolor);
                ObjDom.style.backgroundColor = GetObjectColor(onbackgroundcolor);
                ObjDom.style.borderColor = GetObjectColor(onbordercolor);
            }
            else {
                PageVars[DevVar] = 0;

                /* if (variableindex === -1) {*/
                if (typeof VarDict[DevVar] === 'undefined') {
                    if (firstdata) {
                        ObjDom.innerHTML = 'NOT FOUND';
                        ObjDom.style.color = '#FFF';
                        ObjDom.style.backgroundColor = NotFoundColor;
                        variablevalue = null;
                        SetStatusIcon(element, ObjDom, 'NotFound');
                    }

                } // ERROR variable not found
                else {

                    variablevalue = VarDict[DevVar][0];
                    //console.log(variablevalue);
                    ObjDom.title = DevVar + " " + VarDict[DevVar][1];

                    SetStatusIcon(element, ObjDom, VarDict[DevVar][3]);

                    if (parseInt(variablevalue) > 0 || variablevalue === 'True') {

                        var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

                        var translation =
                            LanguagesFileJson?.[ontext]?.[selectedLang] ?? ontext;

                        if (ObjDom.innerHTML !== translation) {
                            ObjDom.innerHTML = translation;
                        }

                        ObjDom.style.color = GetObjectColor(oncolor);
                        ObjDom.style.backgroundColor = GetObjectColor(onbackgroundcolor);
                        ObjDom.style.borderColor = GetObjectColor(onbordercolor);

                    }
                    else {
                        var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

                        var translation =
                            LanguagesFileJson?.[offtext]?.[selectedLang] ?? offtext;

                        if (ObjDom.innerHTML !== translation) {
                            ObjDom.innerHTML = translation;
                        }

                        //ObjDom.style.color = offcolor;
                        //ObjDom.style.backgroundColor = offbackgroundcolor;
                        //ObjDom.style.borderColor = offbordercolor;

                        ObjDom.style.color = GetObjectColor(offcolor);
                        ObjDom.style.backgroundColor = GetObjectColor(offbackgroundcolor);
                        ObjDom.style.borderColor = GetObjectColor(offbordercolor);
                    }
                }
            }
        }




        // Generic
        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);

        AccessControlAnimation(ObjDom);
        PositionSizeAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeInputObject(element) {
    {
        let ObjDom = element.getElementsByTagName("input")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        //let ontext;
        //let offtext;
        let color;
        //let offcolor;
        let backgroundcolor;
        let bordercolor;
        //let offbackgroundcolor;
        let variable;
        let readonly;
        let units;
        let label;

        let floatingpoint;
        let decimals;

        // color
        if (ObjDom.getAttribute("data-color")) {
            color = ObjDom.getAttribute("data-color");
        }
        else {
            color = '#000';
            ObjDom.setAttribute("data-color", color);
        }

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#fff';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        // bordercolor
        if (ObjDom.getAttribute("data-bordercolor")) {
            bordercolor = GetObjectColor(ObjDom.getAttribute("data-bordercolor"));
        }
        else {
            bordercolor = '#c9c9c9';
            ObjDom.setAttribute("data-bordercolor", bordercolor);
        }

        //variable
        if (ObjDom.getAttribute("data-variable")) {
            variable = ObjDom.getAttribute("data-variable");
        }
        else {
            variable = '';
            ObjDom.setAttribute("data-variable", variable);
        }

        //label
        if (ObjDom.getAttribute("data-label")) {
            label = ObjDom.getAttribute("data-label");
        }
        else {
            label = '';
            ObjDom.setAttribute("data-label", label);
        }

        //readonly
        if (ObjDom.getAttribute("data-readonly")) {
            readonly = ObjDom.getAttribute("data-readonly");
        }
        else {
            readonly = 'false';
            ObjDom.setAttribute("data-readonly", readonly);
        }

        //units
        if (ObjDom.getAttribute("data-units")) {
            units = ObjDom.getAttribute("data-units");
        }
        else {
            units = 'false';
            ObjDom.setAttribute("data-units", units);
        }

        //floatingpoint
        if (ObjDom.getAttribute("data-floatingpoint")) {
            floatingpoint = ObjDom.getAttribute("data-floatingpoint");
        }
        else {
            floatingpoint = 'false';
            ObjDom.setAttribute("data-floatingpoint", floatingpoint);
        }

        //console.log(floatingpoint);

        //decimals
        if (ObjDom.getAttribute("data-decimals")) {
            decimals = ObjDom.getAttribute("data-decimals");
        }
        else {
            decimals = '0';
            ObjDom.setAttribute("data-decimals", decimals);
        }
                    
        if (label === '') {
            // Animate input 
                        
            if (variable.includes(' ') && readonly == 'true') {
                let resolved = ResolveConditionstate(variable);
                            
                try {
                                
                    variablevalue = EvaluateExpression(resolved);
                                
                    if (floatingpoint === 'true') {
                        variablevalue = parseFloat(variablevalue).toFixed(decimals);
                    }

                    /*console.log(DevVar + " " + units);*/
                    if (units.toLowerCase() == 'true' && VarDict[DevVar][2]) {
                        variablevalue = variablevalue + " " + VarDict[DevVar][2];
                    }

                    //console.log(GetObjectTranslation(variablevalue));
                    ObjDom.value = GetObjectTranslation(variablevalue);
                    ObjDom.title = resolved;

                } catch (error) {
                    //console.error(error);
                }
            }
            else {

                let variablevalue = variable;

                let DevVar = variable;

                if (isVariableName(DevVar)) {

                    PageVars[DevVar] = 0;

                    if (typeof VarDict[DevVar] === 'undefined' && ObjDom !== document.activeElement) { // ERROR variable not found
                        if (firstdata) {
                            ObjDom.value = 'Not Found';
                            ObjDom.style.color = '#FFF';
                            ObjDom.style.backgroundColor = NotFoundColor;
                            SetStatusIcon(element, ObjDom, 'NotFound');
                        }

                    }
                    else {
                        if (ObjDom !== document.activeElement) { // check element in focus 
                            variablevalue = VarDict[DevVar][0];
                            //console.log(variablevalue);
                            if (floatingpoint === 'true') {
                                variablevalue = parseFloat(variablevalue).toFixed(decimals);
                            }

                            /*console.log(DevVar + " " + units);*/
                            if (units.toLowerCase() == 'true' && VarDict[DevVar][2]) {
                                variablevalue = variablevalue + " " + VarDict[DevVar][2];
                            }

                            ObjDom.value = variablevalue;
                            ObjDom.title = DevVar + " " + VarDict[DevVar][1] + " " + VarDict[DevVar][3];
                            SetStatusIcon(element, ObjDom, VarDict[DevVar][3]);
                        }
                    }
                }
            }
        }
        else {
            //if (ObjDom.value != label) {
            //    ObjDom.value = label;


            //}
                        
            var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

            var translation =
                LanguagesFileJson?.[label]?.[selectedLang] ?? label;

            if (ObjDom.value !== translation) {
                ObjDom.value = translation;
            }
        }

        ObjDom.style.color = GetObjectColor(color);
        ObjDom.style.backgroundColor = GetObjectColor(ObjDom.getAttribute("data-backgroundcolor"))
        ObjDom.style.borderColor = GetObjectColor(bordercolor);

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesBorder(ObjDom);

        PositionSizeAnimation(ObjDom);
        BorderAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeDateTimePickerObject(element) {
    {
        let ObjDom = element.getElementsByTagName("input")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        let color = ObjDom.getAttribute("data-color") || "#000";
        let backgroundcolor = ObjDom.getAttribute("data-backgroundcolor") || "#fff";
        let bordercolor = ObjDom.getAttribute("data-bordercolor") || "#c9c9c9";
        let variable = ObjDom.getAttribute("data-variable") || "";
        let mode = ObjDom.getAttribute("data-datetimemode") || "DateTime";
        let displayformat = ObjDom.getAttribute("data-displayformat") || "yyyy-MM-dd HH:mm:ss";
        let isUtc = (ObjDom.getAttribute("data-isutc") || "false").toLowerCase() === "true";
        let pickerBackgroundColor = ObjDom.getAttribute("data-pickerbackgroundcolor") || "#ffffff";
        let pickerTextColor = ObjDom.getAttribute("data-pickertextcolor") || "#212529";
        let selectedBackgroundColor = ObjDom.getAttribute("data-selectedbackgroundcolor") || "#0d6efd";
        let selectedTextColor = ObjDom.getAttribute("data-selectedtextcolor") || "#ffffff";
        let todayBackgroundColor = ObjDom.getAttribute("data-todaybackgroundcolor") || selectedBackgroundColor;
        let todayTextColor = ObjDom.getAttribute("data-todaytextcolor") || selectedTextColor;
        let hoverBackgroundColor = ObjDom.getAttribute("data-hoverbackgroundcolor") || "#f3f3f3";
        let hoverTextColor = ObjDom.getAttribute("data-hovertextcolor") || "#6c757d";

        ObjDom.setAttribute("data-color", color);
        ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        ObjDom.setAttribute("data-bordercolor", bordercolor);
        ObjDom.setAttribute("data-variable", variable);
        ObjDom.setAttribute("data-datetimemode", mode);
        ObjDom.setAttribute("data-displayformat", displayformat);
        ObjDom.setAttribute("data-isutc", isUtc);
        ObjDom.setAttribute("data-pickerbackgroundcolor", pickerBackgroundColor);
        ObjDom.setAttribute("data-pickertextcolor", pickerTextColor);
        ObjDom.setAttribute("data-selectedbackgroundcolor", selectedBackgroundColor);
        ObjDom.setAttribute("data-selectedtextcolor", selectedTextColor);
        ObjDom.setAttribute("data-todaybackgroundcolor", todayBackgroundColor);
        ObjDom.setAttribute("data-todaytextcolor", todayTextColor);
        ObjDom.setAttribute("data-hoverbackgroundcolor", hoverBackgroundColor);
        ObjDom.setAttribute("data-hovertextcolor", hoverTextColor);

        DateTimePickerApplyThemeVariables(ObjDom);
        DateTimePickerSetGlobalThemeFromObject(ObjDom);

        if (EditMode === true) {
            ObjDom.style.pointerEvents = "none";
            ObjDom.setAttribute("type", "text");
        }
        else {
            ObjDom.style.pointerEvents = "auto";
            ObjDom.setAttribute("type", "text");
            DateTimePickerEnsureTempus(ObjDom);
        }

                    

        if (isVariableName(variable)) {
            ObjDom.title = variable;
            if ((ObjDom.dataset.systemIsopen !== "true")) {
                            
                DateTimePickerSyncFromVariable(ObjDom);
            }
        }
        else {
            ObjDom.title = "";
            if (ObjDom !== document.activeElement) {
                ObjDom.value = "";
            }
        }


        if (isVariableName(variable)) {
            PageVars[variable] = 0;
        }

        //let DevVar = variable;
        //if (isVariableName(DevVar)) {
        //    PageVars[DevVar] = 0;
        //}
        //
        //if (typeof VarDict[DevVar] === 'undefined' && ObjDom !== document.activeElement) { // ERROR variable not found
        //
        //    if (firstdata) {
        //        ObjDom.value = 'Not Found';
        //        ObjDom.style.color = '#FFF';
        //        ObjDom.style.backgroundColor = NotFoundColor;
        //        SetStatusIcon(element, ObjDom, 'NotFound');
        //    }
        //
        //}
        //else {
        //    if (ObjDom !== document.activeElement) { // check element in focus 
        //        //variablevalue = VarDict[DevVar][0];
        //        SetStatusIcon(element, ObjDom, VarDict[DevVar][3]);
        //    }
        //}

        ObjDom.style.color = GetObjectColor(color);
        ObjDom.style.backgroundColor = GetObjectColor(backgroundcolor);
        ObjDom.style.borderColor = GetObjectColor(bordercolor);

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesBorder(ObjDom);

        PositionSizeAnimation(ObjDom);
        BorderAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeLabelObject(element) {
    {
        let ObjDom = element.getElementsByTagName("textarea")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // A Read Only label without an action of its own lets the click through to the object
        // underneath. Applied here as well as on the edit-mode toggle, so it also covers a plain
        // page load (an operator never enters edit mode) and a label whose Read Only flag or
        // actions changed since the last toggle.
        ApplyLabelClickThrough(element, EditMode === false);

        // Set data attributes

        //let ontext;
        //let offtext;
        let color;
        //let offcolor;
        let backgroundcolor;
        let bordercolor;
        //let offbackgroundcolor;
        let variable;
        let readonly;
        let units;
        let label;

        let floatingpoint;
        let decimals;

        // color
        if (ObjDom.getAttribute("data-color")) {
            color = ObjDom.getAttribute("data-color");
        }
        else {
            color = '#000';
            ObjDom.setAttribute("data-color", color);
        }

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#fff';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        // bordercolor
        if (ObjDom.getAttribute("data-bordercolor")) {
            bordercolor = GetObjectColor(ObjDom.getAttribute("data-bordercolor"));
        }
        else {
            bordercolor = '#c9c9c9';
            ObjDom.setAttribute("data-bordercolor", bordercolor);
        }

        //variable
        if (ObjDom.getAttribute("data-variable")) {
            variable = ObjDom.getAttribute("data-variable");
        }
        else {
            variable = '';
            ObjDom.setAttribute("data-variable", variable);
        }

        //label
        if (ObjDom.getAttribute("data-label")) {
            label = ObjDom.getAttribute("data-label");
        }
        else {
            label = '';
            ObjDom.setAttribute("data-label", label);
        }

        //readonly
        if (ObjDom.getAttribute("data-readonly")) {
            readonly = ObjDom.getAttribute("data-readonly");
        }
        else {
            readonly = 'false';
            ObjDom.setAttribute("data-readonly", readonly);
        }

        //units
        if (ObjDom.getAttribute("data-units")) {
            units = ObjDom.getAttribute("data-units");
        }
        else {
            units = 'false';
            ObjDom.setAttribute("data-units", units);
        }

        //floatingpoint
        if (ObjDom.getAttribute("data-floatingpoint")) {
            floatingpoint = ObjDom.getAttribute("data-floatingpoint");
        }
        else {
            floatingpoint = 'false';
            ObjDom.setAttribute("data-floatingpoint", floatingpoint);
        }

        //console.log(floatingpoint);

        //decimals
        if (ObjDom.getAttribute("data-decimals")) {
            decimals = ObjDom.getAttribute("data-decimals");
        }
        else {
            decimals = '0';
            ObjDom.setAttribute("data-decimals", decimals);
        }

        if (variable !== '') {
            if (variable.includes(' ') && readonly == 'true') {

                let resolved = ResolveConditionstate(variable);

                //console.log(resolved);

                try {

                    //console.log(Function("return " + resolved));
                    //console.log(resolved);
                    variablevalue = EvaluateExpression(resolved);
                                
                    if (floatingpoint === 'true') {
                        variablevalue = parseFloat(variablevalue).toFixed(decimals);
                    }

                    /*console.log(DevVar + " " + units);*/
                    if (units.toLowerCase() == 'true' && VarDict[DevVar][2]) {
                        variablevalue = variablevalue + " " + VarDict[DevVar][2];
                    }

                    ObjDom.value = GetObjectTranslation(variablevalue);
                    ObjDom.title = resolved;

                } catch (error) {
                    console.error(error);
                }

            }
            else {
                // Animate input 
                let variablevalue = variable;

                let DevVar = variable;

                if (isVariableName(DevVar)) {
                    PageVars[DevVar] = 0;

                    if (typeof VarDict[DevVar] === 'undefined' && ObjDom !== document.activeElement) { // ERROR variable not found
                        if (firstdata) {
                            ObjDom.value = 'Not Found';
                            ObjDom.style.color = '#FFF';
                            ObjDom.style.backgroundColor = NotFoundColor;
                            SetStatusIcon(element, ObjDom, 'NotFound');
                        }
                                    
                    }
                    else {
                        if (ObjDom !== document.activeElement) { // check element in focus 
                            variablevalue = VarDict[DevVar][0];
                            /*console.log(DevVar + " " + units);*/

                            if (floatingpoint === 'true') {
                                variablevalue = parseFloat(variablevalue).toFixed(decimals);
                            }

                            if (units.toLowerCase() == 'true' && VarDict[DevVar][2]) {
                                variablevalue = variablevalue + " " + VarDict[DevVar][2];
                            }
                            //console.log(variablevalue);

                            ObjDom.value = variablevalue;
                            ObjDom.title = DevVar + " " + VarDict[DevVar][1] + " " + VarDict[DevVar][3];
                                        
                            SetStatusIcon(element, ObjDom, VarDict[DevVar][3]);
                        }
                    }
                }
            }
        }
        else {
                        
            if (ObjDom !== document.activeElement) {

                var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

                var translation =
                    LanguagesFileJson?.[label]?.[selectedLang] ?? label;

                //if (ObjDom.value !== translation) {
                //    ObjDom.value = translation;
                //    console.log(translation);
                //}

                //console.log(normalize(ObjDom.value));
                //console.log(normalize(translation));
                if (normalize(ObjDom.value) !== normalize(translation)) {
                    ObjDom.value = translation;
                }

            }

        }

        ObjDom.style.color = GetObjectColor(color);
        ObjDom.style.backgroundColor = GetObjectColor(ObjDom.getAttribute("data-backgroundcolor"))
        ObjDom.style.borderColor = GetObjectColor(bordercolor);

        // data-backgroundcolor stays the base color; a color state only overrides it while
        // its condition matches, so labels without color states keep their configured color.
        const labelstatecolor = getColorFromStates(ObjDom, "data-colorstates");
        if (labelstatecolor) {
            ObjDom.style.backgroundColor = GetObjectColor(labelstatecolor);
        }

        // Same contract for the text color: data-color stays the base.
        const labeltextstatecolor = getColorFromStates(ObjDom, "data-textcolorstates");
        if (labeltextstatecolor) {
            ObjDom.style.color = GetObjectColor(labeltextstatecolor);
        }

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesBorder(ObjDom);
        GetAttributesRotation(ObjDom);

        AccessControlAnimation(ObjDom);
        PositionSizeAnimation(ObjDom);
        BorderAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
        RotationAnimation(ObjDom);
        ContinuousRotationAnimation(ObjDom);
    }
}

function executeSquareObject(element) {
    {
        let ObjDom = element.getElementsByTagName("div")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        let backgroundcolor;

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#fff';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        ObjDom.style.backgroundColor = GetObjectColor(ObjDom.getAttribute("data-backgroundcolor"))
                    
        const color = getColorFromStates(ObjDom, "data-colorstates");
        if (color) {
            ObjDom.style.backgroundColor = GetObjectColor(color);
                        
        }

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesBorder(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesRotation(ObjDom);

        AccessControlAnimation(ObjDom);
        PositionSizeAnimation(ObjDom);
        BorderAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
        RotationAnimation(ObjDom);
        ContinuousRotationAnimation(ObjDom);
    }
}

function executeCircleObject(element) {
    {
        let ObjDom = element.getElementsByTagName("div")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        let backgroundcolor;

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#fff';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        ObjDom.style.backgroundColor = GetObjectColor(ObjDom.getAttribute("data-backgroundcolor"))

        const color = getColorFromStates(ObjDom, "data-colorstates");

        if (color) {
            ObjDom.style.backgroundColor = GetObjectColor(color);
        }

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesBorder(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesRotation(ObjDom);

        AccessControlAnimation(ObjDom);
        PositionSizeAnimation(ObjDom);
        BorderAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
        RotationAnimation(ObjDom);
        ContinuousRotationAnimation(ObjDom);
    }
}

function executeKnobObject(element) {
    {

        let ObjDom = element.getElementsByTagName("svg")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        let variable;
        let readonly;
        let units;

        let backgroundcolor;
        let nostatecolor;

        var paths = ObjDom.getElementsByTagName('path');
        var texts = ObjDom.getElementsByTagName('text');

        //variable
        if (ObjDom.getAttribute("data-variable")) {
            variable = ObjDom.getAttribute("data-variable");
        }
        else {
            variable = '';
            ObjDom.setAttribute("data-variable", variable);
        }


        //readonly
        if (ObjDom.getAttribute("data-readonly")) {
            readonly = ObjDom.getAttribute("data-readonly");
        }
        else {
            readonly = 'false';
            ObjDom.setAttribute("data-readonly", readonly);
        }

        //units
        if (ObjDom.getAttribute("data-units")) {
            units = ObjDom.getAttribute("data-units");
        }
        else {
            units = 'false';
            ObjDom.setAttribute("data-units", units);
        }

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#e2e2e2';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        paths[0].setAttribute('stroke', GetObjectColor(backgroundcolor));
        texts[0].setAttribute('stroke', GetObjectColor(backgroundcolor));

        // nostatecolor
        if (ObjDom.getAttribute("data-nostatecolor")) {
            nostatecolor = ObjDom.getAttribute("data-nostatecolor");
        }
        else {
            nostatecolor = '#34eb3a';
            ObjDom.setAttribute("data-nostatecolor", nostatecolor);
        }

        paths[1].setAttribute('stroke', GetObjectColor(nostatecolor));

        const color = getColorFromStates(ObjDom, "data-colorstates");

        if (color) {
            paths[1].setAttribute('stroke', GetObjectColor(color));
        }

        //timeout
        let writetimeout;

        if (ObjDom.getAttribute("data-writetimeout")) {
            writetimeout = ObjDom.getAttribute("data-writetimeout");
        }
        else {
            writetimeout = '0';
            ObjDom.setAttribute("data-writetimeout", writetimeout);
        }

        // Animate

        var DevVar = variable;

        if (isVariableName(DevVar)) {
            PageVars[DevVar] = 0;
        }

        if (typeof KnobsDict[ObjDom.id] === 'undefined') {
            //console.log('could not find knob in KnobsDict');
            return; // why was this return?
        }

        if (parseInt(writetimeout) > 0) {

            /*console.log('WRITE TIMEOUT ' + writetimeout);*/
            ObjDom.setAttribute("data-writetimeout", parseInt(writetimeout) - 1);
        }
        else {
            if (VarDict[DevVar]) {
                KnobsDict[ObjDom.id].value = VarDict[DevVar][0];
            }
        }

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);

        PositionSizeAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
    }
}

function executeTrendObject(element) {
    {
        try {
        let ObjDom = element.getElementsByTagName("canvas")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        let title;

        let timespan;
        let editable;
        let variable1;


        let displayxaxis;
        let displaytitle;
        let displaylegend;
        let linewidth;
        let pointwidth;
        let pointradius;

        let backgroundcolor;
        let textcolor;
        let linecolor;
        let dotcolor;
        let dotbackgroundcolor;
        let hidescale;
        let stepped;
        let filled;
        let hidepoint;
        let linecolor2;
        let dotcolor2;
        let dotbackgroundcolor2;
        let hidescale2;
        let stepped2;
        let filled2;
        let hidepoint2;
        let linecolor3;
        let dotcolor3;
        let dotbackgroundcolor3;
        let hidescale3;
        let stepped3;
        let filled3;
        let hidepoint3;
        let linecolor4;
        let dotcolor4;
        let dotbackgroundcolor4;
        let hidescale4;
        let stepped4;
        let filled4;
        let hidepoint4;

        let yaxiscolor;
        let xaxiscolor;
        let gridhorizontalcolor;
        let gridverticalcolor;
        let tooltipbackgroundcolor;
        let tooltiptextcolor;

        //timespan
        if (ObjDom.getAttribute("data-timespan")) {
            timespan = ObjDom.getAttribute("data-timespan");
        }
        else {
            timespan = '5';
            ObjDom.setAttribute("data-timespan", timespan);
        }

        //editable
        if (ObjDom.getAttribute("data-editable")) {
            editable = ObjDom.getAttribute("data-editable");
        }
        else {
            editable = 'false';
            ObjDom.setAttribute("data-editable", editable);
        }

        //variable1
        if (ObjDom.getAttribute("data-variable1")) {
            variable1 = ObjDom.getAttribute("data-variable1");
        }
        else {
            variable1 = '';
            ObjDom.setAttribute("data-variable1", variable1);
        }

        //variable2
        if (ObjDom.getAttribute("data-variable2")) {
            variable2 = ObjDom.getAttribute("data-variable2");
        }
        else {
            variable2 = '';
            ObjDom.setAttribute("data-variable2", variable2);
        }

        //variable3
        if (ObjDom.getAttribute("data-variable3")) {
            variable3 = ObjDom.getAttribute("data-variable3");
        }
        else {
            variable3 = '';
            ObjDom.setAttribute("data-variable3", variable3);
        }

        //variable4
        if (ObjDom.getAttribute("data-variable4")) {
            variable4 = ObjDom.getAttribute("data-variable4");
        }
        else {
            variable4 = '';
            ObjDom.setAttribute("data-variable4", variable4);
        }


        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#D3D3D3';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        // textcolor
        if (ObjDom.getAttribute("data-textcolor")) {
            textcolor = ObjDom.getAttribute("data-textcolor");
        }
        else {
            textcolor = '#000';
            ObjDom.setAttribute("data-textcolor", textcolor);
        }

        // linecolor
        if (ObjDom.getAttribute("data-linecolor")) {
            linecolor = ObjDom.getAttribute("data-linecolor");
        }
        else {
            linecolor = '#000';
            ObjDom.setAttribute("data-linecolor", linecolor);
        }

        // linecolor2
        if (ObjDom.getAttribute("data-linecolor2")) {
            linecolor2 = ObjDom.getAttribute("data-linecolor2");
        }
        else {
            linecolor2 = '#ADD8E6';
            ObjDom.setAttribute("data-linecolor2", linecolor2);
        }

        // linecolor3
        if (ObjDom.getAttribute("data-linecolor3")) {
            linecolor3 = ObjDom.getAttribute("data-linecolor3");
        }
        else {
            linecolor3 = '#FFB6C1';
            ObjDom.setAttribute("data-linecolor3", linecolor3);
        }

        // linecolor4
        if (ObjDom.getAttribute("data-linecolor4")) {
            linecolor4 = ObjDom.getAttribute("data-linecolor4");
        }
        else {
            linecolor4 = '#90EE90';
            ObjDom.setAttribute("data-linecolor4", linecolor4);
        }


        // dotcolor
        if (ObjDom.getAttribute("data-dotcolor")) {
            dotcolor = ObjDom.getAttribute("data-dotcolor");
        }
        else {
            dotcolor = '#FFA500';
            ObjDom.setAttribute("data-dotcolor", dotcolor);
        }

        // dotcolor2
        if (ObjDom.getAttribute("data-dotcolor2")) {
            dotcolor2 = ObjDom.getAttribute("data-dotcolor2");
        }
        else {
            dotcolor2 = '#FFA500';
            ObjDom.setAttribute("data-dotcolor2", dotcolor2);
        }

        // dotcolor3
        if (ObjDom.getAttribute("data-dotcolor3")) {
            dotcolor3 = ObjDom.getAttribute("data-dotcolor3");
        }
        else {
            dotcolor3 = '#FFA500';
            ObjDom.setAttribute("data-dotcolor3", dotcolor3);
        }

        // dotcolor4
        if (ObjDom.getAttribute("data-dotcolor4")) {
            dotcolor4 = ObjDom.getAttribute("data-dotcolor4");
        }
        else {
            dotcolor4 = '#FFA500';
            ObjDom.setAttribute("data-dotcolor4", dotcolor4);
        }

        // dotbackgroundcolor
        if (ObjDom.getAttribute("data-dotbackgroundcolor")) {
            dotbackgroundcolor = ObjDom.getAttribute("data-dotbackgroundcolor");
        }
        else {
            dotbackgroundcolor = '#fff';
            ObjDom.setAttribute("data-dotbackgroundcolor", dotbackgroundcolor);
        }

        // dotbackgroundcolor
        if (ObjDom.getAttribute("data-dotbackgroundcolor")) {
            dotbackgroundcolor = ObjDom.getAttribute("data-dotbackgroundcolor");
        }
        else {
            dotbackgroundcolor = '#fff';
            ObjDom.setAttribute("data-dotbackgroundcolor", dotbackgroundcolor);
        }

        // dotbackgroundcolor2
        if (ObjDom.getAttribute("data-dotbackgroundcolor2")) {
            dotbackgroundcolor2 = ObjDom.getAttribute("data-dotbackgroundcolor2");
        }
        else {
            dotbackgroundcolor2 = '#fff';
            ObjDom.setAttribute("data-dotbackgroundcolor2", dotbackgroundcolor2);
        }

        // dotbackgroundcolor3
        if (ObjDom.getAttribute("data-dotbackgroundcolor3")) {
            dotbackgroundcolor3 = ObjDom.getAttribute("data-dotbackgroundcolor3");
        }
        else {
            dotbackgroundcolor3 = '#fff';
            ObjDom.setAttribute("data-dotbackgroundcolor3", dotbackgroundcolor3);
        }

        // dotbackgroundcolor4
        if (ObjDom.getAttribute("data-dotbackgroundcolor4")) {
            dotbackgroundcolor4 = ObjDom.getAttribute("data-dotbackgroundcolor4");
        }
        else {
            dotbackgroundcolor4 = '#fff';
            ObjDom.setAttribute("data-dotbackgroundcolor4", dotbackgroundcolor4);
        }

        //scalemin
        if (ObjDom.getAttribute("data-scalemin")) {
            scalemin = ObjDom.getAttribute("data-scalemin");
        }
        else {
            scalemin = '0';
            ObjDom.setAttribute("data-scalemin", scalemin);
        }

        //scalemin2
        if (ObjDom.getAttribute("data-scalemin2")) {
            scalemin2 = ObjDom.getAttribute("data-scalemin2");
        }
        else {
            scalemin2 = '0';
            ObjDom.setAttribute("data-scalemin2", scalemin2);
        }

        //scalemin3
        if (ObjDom.getAttribute("data-scalemin3")) {
            scalemin3 = ObjDom.getAttribute("data-scalemin3");
        }
        else {
            scalemin3 = '0';
            ObjDom.setAttribute("data-scalemin3", scalemin3);
        }

        //scalemin4
        if (ObjDom.getAttribute("data-scalemin4")) {
            scalemin4 = ObjDom.getAttribute("data-scalemin4");
        }
        else {
            scalemin4 = '0';
            ObjDom.setAttribute("data-scalemin4", scalemin4);
        }

        //scalemax
        if (ObjDom.getAttribute("data-scalemax")) {
            scalemax = ObjDom.getAttribute("data-scalemax");
        }
        else {
            scalemax = '100';
            ObjDom.setAttribute("data-scalemax", scalemax);
        }

        //scalemax2
        if (ObjDom.getAttribute("data-scalemax2")) {
            scalemax2 = ObjDom.getAttribute("data-scalemax2");
        }
        else {
            scalemax2 = '100';
            ObjDom.setAttribute("data-scalemax2", scalemax2);
        }

        //scalemax3
        if (ObjDom.getAttribute("data-scalemax3")) {
            scalemax3 = ObjDom.getAttribute("data-scalemax3");
        }
        else {
            scalemax3 = '100';
            ObjDom.setAttribute("data-scalemax3", scalemax3);
        }

        //scalemax4
        if (ObjDom.getAttribute("data-scalemax4")) {
            scalemax4 = ObjDom.getAttribute("data-scalemax4");
        }
        else {
            scalemax4 = '100';
            ObjDom.setAttribute("data-scalemax4", scalemax4);
        }

        //scaleposition
        if (ObjDom.getAttribute("data-scaleposition")) {
            scaleposition = ObjDom.getAttribute("data-scaleposition");
        }
        else {
            scaleposition = 'left';
            ObjDom.setAttribute("data-scaleposition", scaleposition);
        }

        //scaleposition2
        if (ObjDom.getAttribute("data-scaleposition2")) {
            scaleposition2 = ObjDom.getAttribute("data-scaleposition2");
        }
        else {
            scaleposition2 = 'right';
            ObjDom.setAttribute("data-scaleposition2", scaleposition2);
        }

        //scaleposition3
        if (ObjDom.getAttribute("data-scaleposition3")) {
            scaleposition3 = ObjDom.getAttribute("data-scaleposition3");
        }
        else {
            scaleposition3 = 'right';
            ObjDom.setAttribute("data-scaleposition3", scaleposition3);
        }

        //scaleposition4
        if (ObjDom.getAttribute("data-scaleposition4")) {
            scaleposition4 = ObjDom.getAttribute("data-scaleposition4");
        }
        else {
            scaleposition4 = 'right';
            ObjDom.setAttribute("data-scaleposition4", scaleposition4);
        }

        //hidescale
        if (ObjDom.getAttribute("data-hidescale")) {
            hidescale = ObjDom.getAttribute("data-hidescale");
        }
        else {
            hidescale = 'false';
            ObjDom.setAttribute("data-hidescale", hidescale);
        }

        //hidescale2
        if (ObjDom.getAttribute("data-hidescale2")) {
            hidescale2 = ObjDom.getAttribute("data-hidescale2");
        }
        else {
            hidescale2 = 'false';
            ObjDom.setAttribute("data-hidescale2", hidescale2);
        }

        //hidescale3
        if (ObjDom.getAttribute("data-hidescale3")) {
            hidescale3 = ObjDom.getAttribute("data-hidescale3");
        }
        else {
            hidescale3 = 'false';
            ObjDom.setAttribute("data-hidescale3", hidescale3);
        }

        //hidescale4
        if (ObjDom.getAttribute("data-hidescale4")) {
            hidescale4 = ObjDom.getAttribute("data-hidescale4");
        }
        else {
            hidescale4 = 'false';
            ObjDom.setAttribute("data-hidescale4", hidescale4);
        }

        //stepped
        if (ObjDom.getAttribute("data-stepped")) {
            stepped = ObjDom.getAttribute("data-stepped");
        }
        else {
            stepped = 'false';
            ObjDom.setAttribute("data-stepped", stepped);
        }

        //stepped2
        if (ObjDom.getAttribute("data-stepped2")) {
            stepped2 = ObjDom.getAttribute("data-stepped2");
        }
        else {
            stepped2 = 'false';
            ObjDom.setAttribute("data-stepped2", stepped2);
        }

        //stepped3
        if (ObjDom.getAttribute("data-stepped3")) {
            stepped3 = ObjDom.getAttribute("data-stepped3");
        }
        else {
            stepped3 = 'false';
            ObjDom.setAttribute("data-stepped3", stepped3);
        }

        //stepped4
        if (ObjDom.getAttribute("data-stepped4")) {
            stepped4 = ObjDom.getAttribute("data-stepped4");
        }
        else {
            stepped4 = 'false';
            ObjDom.setAttribute("data-stepped4", stepped4);
        }

        //filled
        if (ObjDom.getAttribute("data-filled")) {
            filled = ObjDom.getAttribute("data-filled");
        }
        else {
            filled = 'false';
            ObjDom.setAttribute("data-filled", filled);
        }

        //filled2
        if (ObjDom.getAttribute("data-filled2")) {
            filled2 = ObjDom.getAttribute("data-filled2");
        }
        else {
            filled2 = 'false';
            ObjDom.setAttribute("data-filled2", filled2);
        }

        //filled3
        if (ObjDom.getAttribute("data-filled3")) {
            filled3 = ObjDom.getAttribute("data-filled3");
        }
        else {
            filled3 = 'false';
            ObjDom.setAttribute("data-filled3", filled3);
        }

        //filled4
        if (ObjDom.getAttribute("data-filled4")) {
            filled4 = ObjDom.getAttribute("data-filled4");
        }
        else {
            filled4 = 'false';
            ObjDom.setAttribute("data-filled4", filled4);
        }

        //hidepoint
        if (ObjDom.getAttribute("data-hidepoint")) {
            hidepoint = ObjDom.getAttribute("data-hidepoint");
        }
        else {
            hidepoint = 'false';
            ObjDom.setAttribute("data-hidepoint", hidepoint);
        }

        //hidepoint2
        if (ObjDom.getAttribute("data-hidepoint2")) {
            hidepoint2 = ObjDom.getAttribute("data-hidepoint2");
        }
        else {
            hidepoint2 = 'false';
            ObjDom.setAttribute("data-hidepoint2", hidepoint2);
        }

        //hidepoint3
        if (ObjDom.getAttribute("data-hidepoint3")) {
            hidepoint3 = ObjDom.getAttribute("data-hidepoint3");
        }
        else {
            hidepoint3 = 'false';
            ObjDom.setAttribute("data-hidepoint3", hidepoint3);
        }

        //hidepoint4
        if (ObjDom.getAttribute("data-hidepoint4")) {
            hidepoint4 = ObjDom.getAttribute("data-hidepoint4");
        }
        else {
            hidepoint4 = 'false';
            ObjDom.setAttribute("data-hidepoint4", hidepoint4);
        }

        // yaxiscolor
        if (ObjDom.getAttribute("data-yaxiscolor")) {
            yaxiscolor = ObjDom.getAttribute("data-yaxiscolor");
        }
        else {
            yaxiscolor = '#000';
            ObjDom.setAttribute("data-yaxiscolor", yaxiscolor);
        }

        // xaxiscolor
        if (ObjDom.getAttribute("data-xaxiscolor")) {
            xaxiscolor = ObjDom.getAttribute("data-xaxiscolor");
        }
        else {
            xaxiscolor = '#000';
            ObjDom.setAttribute("data-xaxiscolor", xaxiscolor);
        }

        // gridhorizontalcolor
        if (ObjDom.getAttribute("data-gridhorizontalcolor")) {
            gridhorizontalcolor = ObjDom.getAttribute("data-gridhorizontalcolor");
        }
        else {
            gridhorizontalcolor = '#fff';
            ObjDom.setAttribute("data-gridhorizontalcolor", gridhorizontalcolor);
        }

        // gridverticalcolor
        if (ObjDom.getAttribute("data-gridverticalcolor")) {
            gridverticalcolor = ObjDom.getAttribute("data-gridverticalcolor");
        }
        else {
            gridverticalcolor = '#fff';
            ObjDom.setAttribute("data-gridverticalcolor", gridverticalcolor);
        }

        // tooltipbackgroundcolor
        if (ObjDom.getAttribute("data-tooltipbackgroundcolor")) {
            tooltipbackgroundcolor = ObjDom.getAttribute("data-tooltipbackgroundcolor");
        }
        else {
            tooltipbackgroundcolor = '#000';
            ObjDom.setAttribute("data-tooltipbackgroundcolor", tooltipbackgroundcolor);
        }

        // tooltiptextcolor
        if (ObjDom.getAttribute("data-tooltiptextcolor")) {
            tooltiptextcolor = ObjDom.getAttribute("data-tooltiptextcolor");
        }
        else {
            tooltiptextcolor = '#fff';
            ObjDom.setAttribute("data-tooltiptextcolor", tooltiptextcolor);
        }

        //title
        if (ObjDom.getAttribute("data-title")) {
            title = ObjDom.getAttribute("data-title");
        }
        else {
            title = 'Trend Title';
            ObjDom.setAttribute("data-title", title);
        }

        //displayxaxis
        if (ObjDom.getAttribute("data-displayxaxis")) {
            displayxaxis = ObjDom.getAttribute("data-displayxaxis");
        }
        else {
            displayxaxis = 'True';
            ObjDom.setAttribute("data-displayxaxis", displayxaxis);
        }

        //linewidth
        if (ObjDom.getAttribute("data-linewidth")) {
            linewidth = ObjDom.getAttribute("data-linewidth");
        }
        else {
            linewidth = '1';
            ObjDom.setAttribute("data-linewidth", linewidth);
        }

        //pointwidth
        if (ObjDom.getAttribute("data-pointwidth")) {
            pointwidth = ObjDom.getAttribute("data-pointwidth");
        }
        else {
            pointwidth = '1';
            ObjDom.setAttribute("data-pointwidth", pointwidth);
        }

        //pointradius
        if (ObjDom.getAttribute("data-pointradius")) {
            pointradius = ObjDom.getAttribute("data-pointradius");
        }
        else {
            pointradius = '3';
            ObjDom.setAttribute("data-pointradius", pointradius);
        }

        //displaytitle
        if (ObjDom.getAttribute("data-displaytitle")) {
            displaytitle = ObjDom.getAttribute("data-displaytitle");
        }
        else {
            displaytitle = 'True';
            ObjDom.setAttribute("data-displaytitle", displaytitle);
        }

        //displaylegend
        if (ObjDom.getAttribute("data-displaylegend")) {
            displaylegend = ObjDom.getAttribute("data-displaylegend");
        }
        else {
            displaylegend = 'True';
            ObjDom.setAttribute("data-displaylegend", displaylegend);
        }

        // Animate

        if (isVariableName(variable1)) {
            PageVars[variable1] = 0;
        }

        if (isVariableName(variable2)) {
            PageVars[variable2] = 0;
        }

        if (isVariableName(variable3)) {
            PageVars[variable3] = 0;
        }

        if (isVariableName(variable4)) {
            PageVars[variable4] = 0;
        }

        let chart = null;

        if (typeof ChartsDict[element.id] === 'undefined') {

            ObjDom.id = element.id + "chart";

            var config = JSON.parse(JSON.stringify(trendChartConfig));

            chart = new Chart(
                document.getElementById(ObjDom.id),
                config);

            if (isVariableName(variable1)) {
                var datestart = new Date();
                var dateend = new Date();

                datestart.setMinutes(datestart.getMinutes() - timespan);

                let startDatetime = datestart.toISOString();
                let endDatetime = dateend.toISOString();

                if (typeof ChartsSettingsDict[element.id] !== 'undefined') {

                    //console.log('has settings' + ChartsSettingsDict);

                    var chartsSettingsDict = ChartsSettingsDict[element.id];

                    startDatetime = chartsSettingsDict.datetimefrom;
                    endDatetime = chartsSettingsDict.datetimeto;
                }
                else {
                    //console.log('has no settings');
                }

                GetHistoricDataTrend(chart, timespan, variable1, startDatetime, endDatetime, 0);
            }

            if (isVariableName(variable2)) {
                var datestart = new Date();
                var dateend = new Date();

                datestart.setMinutes(datestart.getMinutes() - timespan);

                let startDatetime = datestart.toISOString();
                let endDatetime = dateend.toISOString();

                GetHistoricDataTrend(chart, timespan, variable2, startDatetime, endDatetime, 1);
            }

            if (isVariableName(variable3)) {
                var datestart = new Date();
                var dateend = new Date();

                datestart.setMinutes(datestart.getMinutes() - timespan);

                let startDatetime = datestart.toISOString();
                let endDatetime = dateend.toISOString();

                GetHistoricDataTrend(chart, timespan, variable3, startDatetime, endDatetime, 2);
            }

            if (isVariableName(variable4)) {
                var datestart = new Date();
                var dateend = new Date();

                datestart.setMinutes(datestart.getMinutes() - timespan);

                let startDatetime = datestart.toISOString();
                let endDatetime = dateend.toISOString();

                GetHistoricDataTrend(chart, timespan, variable4, startDatetime, endDatetime, 3);
            }

            ChartsDict[element.id] = chart;
        }
        else {
            chart = ChartsDict[element.id];
        }

        ObjDom.style.backgroundColor = GetObjectColor(ObjDom.getAttribute("data-backgroundcolor"))

        chart.data.datasets[0].label = variable1;
        chart.data.datasets[1].label = variable2;
        chart.data.datasets[2].label = variable3;
        chart.data.datasets[3].label = variable4;
        chart.data.datasets[0].label.color = GetObjectColor(textcolor);
        chart.data.datasets[1].label.color = GetObjectColor(textcolor);
        chart.data.datasets[2].label.color = GetObjectColor(textcolor);
        chart.data.datasets[3].label.color = GetObjectColor(textcolor);
        chart.data.datasets[0].backgroundColor = GetObjectColor(dotbackgroundcolor);
        chart.data.datasets[1].backgroundColor = GetObjectColor(dotbackgroundcolor);
        chart.data.datasets[2].backgroundColor = GetObjectColor(dotbackgroundcolor);
        chart.data.datasets[3].backgroundColor = GetObjectColor(dotbackgroundcolor);
        chart.data.datasets[0].borderColor = GetObjectColor(linecolor);
        chart.data.datasets[1].borderColor = GetObjectColor(linecolor2);
        chart.data.datasets[2].borderColor = GetObjectColor(linecolor3);
        chart.data.datasets[3].borderColor = GetObjectColor(linecolor4);

        chart.data.datasets[0].borderWidth = parseFloat(linewidth);
        chart.data.datasets[1].borderWidth = parseFloat(linewidth);
        chart.data.datasets[2].borderWidth = parseFloat(linewidth);
        chart.data.datasets[3].borderWidth = parseFloat(linewidth);

        //1
        chart.data.datasets[0].pointBorderColor = GetObjectColor(dotcolor);
        //chart.data.datasets[0].pointBorderWidth = parseFloat(pointwidth);
        //chart.data.datasets[0].pointRadiusX = parseFloat(pointradius);
        chart.data.datasets[0].pointBorderWidth = hidepoint.toLowerCase() == "true" ? 0 : parseFloat(pointwidth);
        // One radius for the whole series. Chart.js resolves a per-point array separately for
        // every point on every update, which costs more than everything else in a redraw put
        // together; a single value is resolved once and shared.
        chart.data.datasets[0].pointRadius = hidepoint.toLowerCase() == "true" ? 0 : parseFloat(pointradius);
        chart.data.datasets[0].pointHoverRadius = chart.data.datasets[0].pointRadius;
        chart.data.datasets[0].pointStyle = "circle";
        chart.data.datasets[0].hitRadius = "2";
        chart.data.datasets[0].pointHoverBorderWidth = pointwidth;
        chart.data.datasets[0].stepped = stepped.toLowerCase() == "true" ? true : false;
        chart.data.datasets[0].fill = filled.toLowerCase() == "true" ? true : false;
        chart.data.datasets[0].backgroundColor = GetObjectColor(linecolor);

        //2
        chart.data.datasets[1].pointBorderColor = GetObjectColor(dotcolor2);
        chart.data.datasets[1].pointBorderWidth = hidepoint2.toLowerCase() == "true" ? 0 : parseFloat(pointwidth);
        chart.data.datasets[1].pointRadius = hidepoint2.toLowerCase() == "true" ? 0 : parseFloat(pointradius);
        chart.data.datasets[1].pointHoverRadius = chart.data.datasets[1].pointRadius;
        chart.data.datasets[1].pointStyle = "circle";
        chart.data.datasets[1].hitRadius = "2";
        chart.data.datasets[1].pointHoverBorderWidth = pointwidth;
        chart.data.datasets[1].stepped = stepped2.toLowerCase() == "true" ? true : false;
        chart.data.datasets[1].fill = filled2.toLowerCase() == "true" ? true : false;
        chart.data.datasets[1].backgroundColor = GetObjectColor(linecolor2);
        //chart.data.datasets[1].cubicInterpolationMode = "true";


        //3
        chart.data.datasets[2].pointBorderColor = GetObjectColor(dotcolor3);
        chart.data.datasets[2].pointBorderWidth = hidepoint3.toLowerCase() == "true" ? 0 : parseFloat(pointwidth);
        chart.data.datasets[2].pointRadius = hidepoint3.toLowerCase() == "true" ? 0 : parseFloat(pointradius);
        chart.data.datasets[2].pointHoverRadius = chart.data.datasets[2].pointRadius;
        chart.data.datasets[2].pointStyle = "circle";
        chart.data.datasets[2].hitRadius = "2";
        chart.data.datasets[2].pointHoverBorderWidth = pointwidth;
        chart.data.datasets[2].stepped = stepped3.toLowerCase() == "true" ? true : false;
        chart.data.datasets[2].fill = filled3.toLowerCase() == "true" ? true : false;
        chart.data.datasets[2].backgroundColor = GetObjectColor(linecolor3);

        //4
        chart.data.datasets[3].pointBorderColor = GetObjectColor(dotcolor4);
        chart.data.datasets[3].pointBorderWidth = hidepoint4.toLowerCase() == "true" ? 0 : parseFloat(pointwidth);
        chart.data.datasets[3].pointRadius = hidepoint4.toLowerCase() == "true" ? 0 : parseFloat(pointradius);
        chart.data.datasets[3].pointHoverRadius = chart.data.datasets[3].pointRadius;
        chart.data.datasets[3].pointStyle = "circle";
        chart.data.datasets[3].hitRadius = "2";
        chart.data.datasets[3].pointHoverBorderWidth = pointwidth;
        chart.data.datasets[3].stepped = stepped4.toLowerCase() == "true" ? true : false;
        chart.data.datasets[3].fill = filled4.toLowerCase() == "true" ? true : false;
        chart.data.datasets[3].backgroundColor = GetObjectColor(linecolor4);

        //chart.data.datasets[0].cubicInterpolationMode = "true";
        //chart.data.datasets[0].steppedLine = "true";

        //chart.data.datasets[0].hoverBackgroundColor = "purple";
        //chart.data.datasets[0].hoverBorderColor = "green";
        //chart.data.datasets[0].pointHoverBackgroundColor = "lightblue";
        //chart.data.datasets[0].pointHoverBorderColor = "lightorange";

        //chart.data.datasets[0].pointHoverBorderWidth = "4";

        chart.config.options.scales["x"].display = displayxaxis.toLowerCase() == "true" ? true : false;

        chart.config.options.scales["y"].ticks.color = GetObjectColor(yaxiscolor);
        chart.config.options.scales["x"].ticks.color = GetObjectColor(xaxiscolor);

        chart.config.options.scales["y"].grid.color = GetObjectColor(gridverticalcolor);
        chart.config.options.scales["x"].grid.color = GetObjectColor(gridhorizontalcolor);

        chart.config.options.scales["y"].display = hidescale == "true" ? false : true;
        chart.config.options.scales["y"].min = parseInt(scalemin);
        chart.config.options.scales["y"].max = parseInt(scalemax);
        chart.config.options.scales["y"].position = scaleposition;

        if (isVariableName(variable2)) {
            chart.config.options.scales["y1"].display = hidescale2 == "true" ? false : true;
            chart.config.options.scales["y1"].min = parseInt(scalemin2);
            chart.config.options.scales["y1"].max = parseInt(scalemax2);
            chart.config.options.scales["y1"].position = scaleposition2;
            chart.config.options.scales["y1"].ticks.color = GetObjectColor(yaxiscolor);
        }
        else {
            chart.config.options.scales["y1"].display = false;
        }

        if (isVariableName(variable3)) {
            chart.config.options.scales["y2"].display = hidescale3 == "true" ? false : true;
            chart.config.options.scales["y2"].min = parseInt(scalemin3);
            chart.config.options.scales["y2"].max = parseInt(scalemax3);
            chart.config.options.scales["y2"].position = scaleposition3;
            chart.config.options.scales["y2"].ticks.color = GetObjectColor(yaxiscolor);
        }
        else {
            chart.config.options.scales["y2"].display = false;
        }

        if (isVariableName(variable4)) {
            chart.config.options.scales["y3"].display = hidescale4 == "true" ? false : true;
            chart.config.options.scales["y3"].min = parseInt(scalemin4);
            chart.config.options.scales["y3"].max = parseInt(scalemax4);
            chart.config.options.scales["y3"].position = scaleposition4;
            chart.config.options.scales["y3"].ticks.color = GetObjectColor(yaxiscolor);
        }
        else {
            chart.config.options.scales["y3"].display = false;
        }

        chart.config.options.plugins.title.text = title;
        chart.config.options.plugins.title.color = GetObjectColor(textcolor);

        chart.config.options.plugins.legend.labels.filter = item => item.text != "";

        chart.config.options.plugins.legend.labels.color = GetObjectColor(textcolor);

        chart.config.options.plugins.tooltip.backgroundColor = GetObjectColor(tooltipbackgroundcolor);
        chart.config.options.plugins.tooltip.bodyColor = GetObjectColor(tooltiptextcolor);
        chart.config.options.plugins.tooltip.titleColor = GetObjectColor(tooltiptextcolor);

        chart.config.options.plugins.title.display = displaytitle.toLowerCase() == "true" ? true : false;
        chart.config.options.plugins.legend.display = displaylegend.toLowerCase() == "true" ? true : false;

        // Everything above only reassigns styling that hardly ever changes, yet this ran on
        // every page refresh and redrew all four charts each time. Redraw only when one of the
        // resolved values actually differs. The signature is built from the values that landed
        // on the chart, not from the data-* attributes, so a colour that changes meaning
        // (colour library, replacer) is caught even though its attribute is unchanged. New
        // data is drawn by executeCharts, which owns its own redraw.
        let styleSignature = JSON.stringify([
            chart.data.datasets.map(dataset => [
                dataset.label, dataset.borderColor, dataset.backgroundColor, dataset.borderWidth,
                dataset.pointBorderColor, dataset.pointBorderWidth, dataset.pointRadius,
                dataset.pointHoverRadius, dataset.pointHoverBorderWidth, dataset.pointStyle,
                dataset.stepped, dataset.fill
            ]),
            ["x", "y", "y1", "y2", "y3"].map(function (scale) {
                let s = chart.config.options.scales[scale];
                return [s.display, s.min, s.max, s.position, s.ticks && s.ticks.color, s.grid && s.grid.color];
            }),
            [
                chart.config.options.plugins.title.text, chart.config.options.plugins.title.color,
                chart.config.options.plugins.title.display, chart.config.options.plugins.legend.display,
                chart.config.options.plugins.legend.labels.color,
                chart.config.options.plugins.tooltip.backgroundColor,
                chart.config.options.plugins.tooltip.bodyColor,
                chart.config.options.plugins.tooltip.titleColor
            ],
            ObjDom.style.backgroundColor
        ]);

        if (chart.envisionStyleSignature !== styleSignature) {
            chart.envisionStyleSignature = styleSignature;
            chart.update();
        }

        // Generic

        GetAttributesVisibility(ObjDom);
            VisibilityAnimation(ObjDom);

        } catch (error) {
            console.error(error);
        }
    }
}

function executeAlarmBannerObject(element) {
    {
        //let ObjDom = element.getElementsByTagName("table")[0];

        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        let assets;
        let showreturned;
        let showactiveacknowledged;
        let showreturnedacknowledged;
        let alarmbannername;

        let hideseverity;
        let hideasset;
        let hideontime;
        let hideofftime;
        let hideacktime;
        let hideackuser;
        let hideackcomment;

        let severitycolumnname;
        let assetcolumnname;
        let messagecolumnname;
        let ontimecolumnname;
        let offtimecolumnname;

        let backgroundcolor;
        let headerbackgroundcolor;
        let textcolor;
        let headertextcolor;
        let gridlinecolor;
        let iconcolor


        //assets
        if (ObjDom.getAttribute("data-assets")) {
            assets = ObjDom.getAttribute("data-assets");
        }
        else {
            assets = '';
            ObjDom.setAttribute("data-assets", assets);
        }

        //alarmbannername
        if (ObjDom.getAttribute("data-alarmbannername")) {
            alarmbannername = ObjDom.getAttribute("data-alarmbannername");
        }
        else {
            alarmbannername = '';
            ObjDom.setAttribute("data-alarmbannername", alarmbannername);
        }

        //severitycolumnname
        if (ObjDom.getAttribute("data-severitycolumnname")) {
            severitycolumnname = ObjDom.getAttribute("data-severitycolumnname");
        }
        else {
            severitycolumnname = 'Severity';
            ObjDom.setAttribute("data-severitycolumnname", severitycolumnname);
        }

        //assetcolumnname
        if (ObjDom.getAttribute("data-assetcolumnname")) {
            assetcolumnname = ObjDom.getAttribute("data-assetcolumnname");
        }
        else {
            assetcolumnname = 'Asset';
            ObjDom.setAttribute("data-assetcolumnname", assetcolumnname);
        }

        //messagecolumnname
        if (ObjDom.getAttribute("data-messagecolumnname")) {
            messagecolumnname = ObjDom.getAttribute("data-messagecolumnname");
        }
        else {
            messagecolumnname = 'Message';
            ObjDom.setAttribute("data-messagecolumnname", messagecolumnname);
        }

        //ontimecolumnname
        if (ObjDom.getAttribute("data-ontimecolumnname")) {
            ontimecolumnname = ObjDom.getAttribute("data-ontimecolumnname");
        }
        else {
            ontimecolumnname = 'OnTime';
            ObjDom.setAttribute("data-ontimecolumnname", ontimecolumnname);
        }

        //offtimecolumnname
        if (ObjDom.getAttribute("data-offtimecolumnname")) {
            offtimecolumnname = ObjDom.getAttribute("data-offtimecolumnname");
        }
        else {
            offtimecolumnname = 'OffTime';
            ObjDom.setAttribute("data-offtimecolumnname", offtimecolumnname);
        }

        //acktimecolumnname
        if (ObjDom.getAttribute("data-acktimecolumnname")) {
            acktimecolumnname = ObjDom.getAttribute("data-acktimecolumnname");
        }
        else {
            acktimecolumnname = 'AckTime';
            ObjDom.setAttribute("data-acktimecolumnname", acktimecolumnname);
        }

        //ackusercolumnname
        if (ObjDom.getAttribute("data-ackusercolumnname")) {
            ackusercolumnname = ObjDom.getAttribute("data-ackusercolumnname");
        }
        else {
            ackusercolumnname = 'AckUser';
            ObjDom.setAttribute("data-ackusercolumnname", ackusercolumnname);
        }

        //ackcommentcolumnname
        if (ObjDom.getAttribute("data-ackcommentcolumnname")) {
            ackcommentcolumnname = ObjDom.getAttribute("data-ackcommentcolumnname");
        }
        else {
            ackcommentcolumnname = 'AckComment';
            ObjDom.setAttribute("data-ackcommentcolumnname", ackcommentcolumnname);
        }

        //showreturned
        if (ObjDom.getAttribute("data-showreturned")) {
            showreturned = ObjDom.getAttribute("data-showreturned");
        }
        else {
            showreturned = 'true';
            ObjDom.setAttribute("data-showreturned", showreturned);
        }

        //showactiveacknowledged
        if (ObjDom.getAttribute("data-showactiveacknowledged")) {
            showactiveacknowledged = ObjDom.getAttribute("data-showactiveacknowledged");
        }
        else {
            showactiveacknowledged = 'true';
            ObjDom.setAttribute("data-showactiveacknowledged", showactiveacknowledged);
        }

        //showreturnedacknowledged
        if (ObjDom.getAttribute("data-showreturnedacknowledged")) {
            showreturnedacknowledged = ObjDom.getAttribute("data-showreturnedacknowledged");
        }
        else {
            showreturnedacknowledged = 'true';
            ObjDom.setAttribute("data-showreturnedacknowledged", showreturnedacknowledged);
        }

        //hideseverity
        if (ObjDom.getAttribute("data-hideseverity")) {
            hideseverity = ObjDom.getAttribute("data-hideseverity");
        }
        else {
            hideseverity = 'false';
            ObjDom.setAttribute("data-hideseverity", hideseverity);
        }

        //hideasset
        if (ObjDom.getAttribute("data-hideasset")) {
            hideasset = ObjDom.getAttribute("data-hideasset");
        }
        else {
            hideasset = 'false';
            ObjDom.setAttribute("data-hideasset", hideasset);
        }

        //hideontime
        if (ObjDom.getAttribute("data-hideontime")) {
            hideontime = ObjDom.getAttribute("data-hideontime");
        }
        else {
            hideontime = 'false';
            ObjDom.setAttribute("data-hideontime", hideontime);
        }

        //hideofftime
        if (ObjDom.getAttribute("data-hideofftime")) {
            hideofftime = ObjDom.getAttribute("data-hideofftime");
        }
        else {
            hideofftime = 'false';
            ObjDom.setAttribute("data-hideofftime", hideofftime);
        }

        //hideacktime
        if (ObjDom.getAttribute("data-hideacktime")) {
            hideacktime = ObjDom.getAttribute("data-hideacktime");
        }
        else {
            hideacktime = 'false';
            ObjDom.setAttribute("data-hideacktime", hideacktime);
        }

        //hideackuser
        if (ObjDom.getAttribute("data-hideackuser")) {
            hideackuser = ObjDom.getAttribute("data-hideackuser");
        }
        else {
            hideackuser = 'false';
            ObjDom.setAttribute("data-hideackuser", hideackuser);
        }

        //hideackcomment
        if (ObjDom.getAttribute("data-hideackcomment")) {
            hideackcomment = ObjDom.getAttribute("data-hideackcomment");
        }
        else {
            hideackcomment = 'false';
            ObjDom.setAttribute("data-hideackcomment", hideackcomment);
        }

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#dcdcdc';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        // headerbackgroundcolor
        if (ObjDom.getAttribute("data-headerbackgroundcolor")) {
            headerbackgroundcolor = ObjDom.getAttribute("data-headerbackgroundcolor");
        }
        else {
            headerbackgroundcolor = '#EEEEEE';
            ObjDom.setAttribute("data-headerbackgroundcolor", headerbackgroundcolor);
        }

        // textcolor
        if (ObjDom.getAttribute("data-textcolor")) {
            textcolor = ObjDom.getAttribute("data-textcolor");
        }
        else {
            textcolor = '#000';
            ObjDom.setAttribute("data-textcolor", textcolor);
        }

        // headertextcolor
        if (ObjDom.getAttribute("data-headertextcolor")) {
            headertextcolor = ObjDom.getAttribute("data-headertextcolor");
        }
        else {
            headertextcolor = '#000';
            ObjDom.setAttribute("data-headertextcolor", headertextcolor);
        }

        // gridlinecolor
        if (ObjDom.getAttribute("data-gridlinecolor")) {
            gridlinecolor = ObjDom.getAttribute("data-gridlinecolor");
        }
        else {
            gridlinecolor = '#C0C0C0';
            ObjDom.setAttribute("data-gridlinecolor", gridlinecolor);
        }

        // iconcolor
        if (ObjDom.getAttribute("data-iconcolor")) {
            iconcolor = ObjDom.getAttribute("data-iconcolor");
        }
        else {
            iconcolor = '#C0C0C0';
            ObjDom.setAttribute("data-iconcolor", iconcolor);
        }

        ApplyTableObjectColors(ObjDom, 'AlarmBanner', {
            backgroundcolor: backgroundcolor,
            textcolor: textcolor,
            headerbackgroundcolor: headerbackgroundcolor,
            headertextcolor: headertextcolor,
            gridlinecolor: gridlinecolor,
            iconcolor: iconcolor
        });

        // Animate button

        let compStyles = window.getComputedStyle(ObjDom);

        var AlarmBannerSeverityHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerSeverityHeaderColumnName")[0];
        var AlarmBannerAssetHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerAssetHeaderColumnName")[0];
        var AlarmBannerMessageHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerMessageHeaderColumnName")[0];
        var AlarmBannerOnTimeHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerOnTimeHeaderColumnName")[0];
        var AlarmBannerOffTimeHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerOffTimeHeaderColumnName")[0];
        var AlarmBannerAckTimeHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerAckTimeHeaderColumnName")[0];
        var AlarmBannerAckUserHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerAckUserHeaderColumnName")[0];
        var AlarmBannerAckCommentHeaderColumnName = ObjDom.getElementsByClassName("AlarmBannerAckCommentHeaderColumnName")[0];

        var pairs = [
            [AlarmBannerSeverityHeaderColumnName, severitycolumnname],
            [AlarmBannerAssetHeaderColumnName, assetcolumnname],
            [AlarmBannerMessageHeaderColumnName, messagecolumnname],
            [AlarmBannerOnTimeHeaderColumnName, ontimecolumnname],
            [AlarmBannerOffTimeHeaderColumnName, offtimecolumnname],
            [AlarmBannerAckTimeHeaderColumnName, acktimecolumnname],
            [AlarmBannerAckUserHeaderColumnName, ackusercolumnname],
            [AlarmBannerAckCommentHeaderColumnName, ackcommentcolumnname],
        ];

        for (var pairsi = 0; pairsi < pairs.length; pairsi++) {

            var el = pairs[pairsi][0];
            var key = pairs[pairsi][1];

            var translation = TryTranslate(key) || key;

            //console.log('KEY:' + key);
            //console.log('Found: ' + translation);
            //console.log('Current: ' + el.innerHTML);
            //
            //console.log('---------');
            if (translation && (el.innerHTML !== translation)) {
                el.innerHTML = translation;
                            
            }

        }

        GetAttributesVisibility(ObjDom);
        VisibilityAnimation(ObjDom);

    }
}

function executeDataTableObject(element) {
    {
        {
            let ObjDom = getObjDom(element);

            if (!ObjDom) { return warnMissingRuntimeElement(element); }

            let database;
            let sqlquery;
            let connstring;
            let refreshtime;
            let name;
            let header;

            //database
            if (ObjDom.getAttribute("data-database")) {
                database = ObjDom.getAttribute("data-database");
            }
            else {
                database = 'SQL Server';
                ObjDom.setAttribute("data-database", database);
            }

            //sqlquery
            if (ObjDom.getAttribute("data-sqlquery")) {
                sqlquery = ObjDom.getAttribute("data-sqlquery");
            }
            else {
                sqlquery = '';
                ObjDom.setAttribute("data-sqlquery", sqlquery);
            }

            //connstring
            if (ObjDom.getAttribute("data-connstring")) {
                connstring = ObjDom.getAttribute("data-connstring");
            }
            else {
                connstring = '';
                ObjDom.setAttribute("data-connstring", connstring);
            }

            //header
            if (ObjDom.getAttribute("data-header")) {
                header = ObjDom.getAttribute("data-header");
            }
            else {
                header = '';
                ObjDom.setAttribute("data-header", header);
            }

            //refreshtime
            if (ObjDom.getAttribute("data-refreshtime")) {
                refreshtime = ObjDom.getAttribute("data-refreshtime");
            }
            else {
                refreshtime = '5';
                ObjDom.setAttribute("data-refreshtime", refreshtime);
            }

            //name
            if (ObjDom.getAttribute("data-datatablename")) {
                name = ObjDom.getAttribute("data-datatablename");
            }
            else {
                name = '';
                ObjDom.setAttribute("data-datatablename", name);
            }

            let backgroundcolor;
            let headerbackgroundcolor;
            let selectedbackgroundcolor;
            let textcolor;
            let headertextcolor;
            let selectedtextcolor;
            let gridlinecolor;
            let iconcolor

            // backgroundcolor
            if (ObjDom.getAttribute("data-backgroundcolor")) {
                backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
            }
            else {
                backgroundcolor = '#dcdcdc';
                ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
            }

            // headerbackgroundcolor
            if (ObjDom.getAttribute("data-headerbackgroundcolor")) {
                headerbackgroundcolor = ObjDom.getAttribute("data-headerbackgroundcolor");
            }
            else {
                headerbackgroundcolor = '#EEEEEE';
                ObjDom.setAttribute("data-headerbackgroundcolor", headerbackgroundcolor);
            }

            // selectedbackgroundcolor
            if (ObjDom.getAttribute("data-selectedbackgroundcolor")) {
                selectedbackgroundcolor = ObjDom.getAttribute("data-selectedbackgroundcolor");
            }
            else {
                selectedbackgroundcolor = '#fff';
                ObjDom.setAttribute("data-selectedbackgroundcolor", selectedbackgroundcolor);
            }

            // textcolor
            if (ObjDom.getAttribute("data-textcolor")) {
                textcolor = ObjDom.getAttribute("data-textcolor");
            }
            else {
                textcolor = '#000';
                ObjDom.setAttribute("data-textcolor", textcolor);
            }

            // headertextcolor
            if (ObjDom.getAttribute("data-headertextcolor")) {
                headertextcolor = ObjDom.getAttribute("data-headertextcolor");
            }
            else {
                headertextcolor = '#000';
                ObjDom.setAttribute("data-headertextcolor", headertextcolor);
            }

            // selectedtextcolor
            if (ObjDom.getAttribute("data-selectedtextcolor")) {
                selectedtextcolor = ObjDom.getAttribute("data-selectedtextcolor");
            }
            else {
                selectedtextcolor = '#5A5A5A';
                ObjDom.setAttribute("data-selectedtextcolor", selectedtextcolor);
            }

            // gridlinecolor
            if (ObjDom.getAttribute("data-gridlinecolor")) {
                gridlinecolor = ObjDom.getAttribute("data-gridlinecolor");
            }
            else {
                gridlinecolor = '#C0C0C0';
                ObjDom.setAttribute("data-gridlinecolor", gridlinecolor);
            }

            // iconcolor
            if (ObjDom.getAttribute("data-iconcolor")) {
                iconcolor = ObjDom.getAttribute("data-iconcolor");
            }
            else {
                iconcolor = '#C0C0C0';
                ObjDom.setAttribute("data-iconcolor", iconcolor);
            }

            ApplyTableObjectColors(ObjDom, 'DataTable', {
                backgroundcolor: backgroundcolor,
                textcolor: textcolor,
                headerbackgroundcolor: headerbackgroundcolor,
                headertextcolor: headertextcolor,
                gridlinecolor: gridlinecolor,
                iconcolor: iconcolor
            });

            // data-selectedbackgroundcolor and data-selectedtextcolor are intentionally not
            // applied: nothing paints a selected DataTable row, not even the properties panel,
            // so there is no established target to resolve them onto.

            // Animate button

            GetAttributesVisibility(ObjDom);
            VisibilityAnimation(ObjDom);

        }
    }
}

function executeWebFrameObject(element) {
    {
        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        let staticpage;
        let url;
        let refresh;
        let lastrefresh;

        if (ObjDom.getAttribute("data-staticpage")) {
            staticpage = ObjDom.getAttribute("data-staticpage");
        }
        else {
            staticpage = 'False';
            ObjDom.setAttribute("data-staticpage", staticpage);
        }

        if (ObjDom.getAttribute("data-url")) {
            url = ObjDom.getAttribute("data-url");
        }
        else {
            url = '';
            ObjDom.setAttribute("data-url", url);
                        
            lastrefresh = Date.now();
            ObjDom.setAttribute("data-lastrefresh", lastrefresh);
        }

        if (!ObjDom.getAttribute("data-postmessageenabled")) {
            ObjDom.setAttribute("data-postmessageenabled", 'false');
        }

        if (!ObjDom.getAttribute("data-postmessage")) {
            ObjDom.setAttribute("data-postmessage", '');
        }

        EnsureWebFramePostMessageHandler(ObjDom);
                    
        let resolvedUrl = '';

        if (typeof VarDict[url] !== 'undefined') {
            resolvedUrl = VarDict[url][0];
        }
        else if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            resolvedUrl = url;
        }

        if (resolvedUrl !== '') {
            var runtimeResolvedUrl = BuildWebFrameRuntimeUrl(resolvedUrl);
            var uri_dec = decodeURIComponent(ObjDom.src);
            var urltemp = decodeURIComponent(runtimeResolvedUrl);

            if (uri_dec !== urltemp) {
                ObjDom.__webFramePostMessageInitializedUrl = null;
                ObjDom.src = runtimeResolvedUrl;
                /*console.log('NEW URL');*/
            }
        }

        EnsureWebFramePostMessageInitialized(ObjDom, resolvedUrl);

        if (staticpage.toLowerCase() === 'false') {
            //console.log('not a static page');

        }
        else {

            if (ObjDom.getAttribute("data-refresh")) {
                refresh = ObjDom.getAttribute("data-refresh");

                if (ObjDom.getAttribute("data-lastrefresh")) {
                    lastrefresh = ObjDom.getAttribute("data-lastrefresh");
                }
                else {
                    lastrefresh = Date.now();
                    ObjDom.setAttribute("data-lastrefresh", lastrefresh);
                }

                if ((Date.now() - lastrefresh) > (refresh * 1000)) {
                    ObjDom.__webFramePostMessageInitializedUrl = null;

                    if (resolvedUrl !== '') {
                        ObjDom.src = BuildWebFrameRuntimeUrl(resolvedUrl, true);
                    }

                    lastrefresh = Date.now();
                    ObjDom.setAttribute("data-lastrefresh", lastrefresh);
                    //console.log('REFRESH');
                }
            }
        }

        //generic
        GetAttributesVisibility(ObjDom);

        GetAttributesBorder(ObjDom);

        BorderAnimation(ObjDom);
        VisibilityAnimation(ObjDom);

    }
}

// One function for all five viewer objects: they differ only in the page they frame, which comes
// from the route table. The frame is loaded once and then left alone - each viewer page refreshes
// its own content, so a frame-level reload would fight it and throw away the operator's filters,
// scroll position and pen selection.
function executeViewerObject(element) {
    {
        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        let url = BuildViewerUrl(element);

        if (url !== '' && ObjDom.__viewerUrl !== url) {
            ObjDom.src = url;
            ObjDom.__viewerUrl = url;
        }

        if (element.getAttribute("name") === "TrendAnalystViewerObject") {
            EnsureTrendAnalystViewerConfigHandler(ObjDom);

            // A bound variable can change at any time, so the resolved value is compared every
            // cycle - but the message is only posted when it actually changed, never per cycle.
            let config = ResolveValueOrVariable(ObjDom.getAttribute("data-config"));

            if (ObjDom.__viewerResolvedConfig !== config) {
                ObjDom.__viewerResolvedConfig = config;
                SendTrendAnalystViewerConfig(ObjDom);
            }
        }

        //generic
        GetAttributesVisibility(ObjDom);

        GetAttributesBorder(ObjDom);

        BorderAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeDocumentViewerObject(element) {
    {
        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        getinitAttribute(ObjDom, "data-documentpath", "");
        getinitAttribute(ObjDom, "data-toolbar", "true");

        let url = BuildDocumentViewerUrl(ObjDom);

        if (url === '') {
            // Nothing configured, or the bound variable has no value yet: leave the frame blank
            // rather than requesting a document the server would refuse anyway.
            if (ObjDom.getAttribute("src")) {
                ObjDom.removeAttribute("src");
            }
            ObjDom.__docViewerUrl = '';
            PublishDocumentStatus(ObjDom, DocumentStatusNoPath);
        }
        else if (ObjDom.__docViewerUrl !== url) {
            // This runs on every poll cycle, so the frame is only loaded when the resolved path
            // really changed - which is exactly what makes a bound variable swap the document.
            // Assigning src unconditionally would restart the document several times a second.
            ObjDom.__docViewerUrl = url;
            LoadDocumentIntoFrame(ObjDom, url);
        }

        //generic
        GetAttributesVisibility(ObjDom);

        GetAttributesBorder(ObjDom);

        BorderAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

// Asks first, then loads. A frame cannot tell its page whether it rendered a document or a refusal:
// onload fires either way and the status code is not readable from the iframe. So the document is
// probed once - only when the resolved path changed, never per cycle - and the frame is pointed at
// it only when the server is actually willing to serve it. Whoever configured a status variable now
// gets "there is no report for that day" instead of a blank rectangle.
async function LoadDocumentIntoFrame(objDom, url) {

    let status = DocumentStatusUnavailable;

    try {
        let response = await fetch(url, { method: 'HEAD', credentials: 'same-origin', cache: 'no-store' });

        if (response.ok) { status = DocumentStatusOk; }
        else if (response.status === 401) { status = DocumentStatusSignIn; }
    }
    catch {
        status = DocumentStatusUnavailable;
    }

    // The bound variable may have moved on to another document while the probe was in flight; that
    // newer request owns the frame.
    if (objDom.__docViewerUrl !== url) { return; }

    if (status === DocumentStatusOk) {
        objDom.src = url;
    }
    else if (objDom.getAttribute("src")) {
        objDom.removeAttribute("src");
    }

    PublishDocumentStatus(objDom, status);
}

function executeWidgetObject(element) {
    {
        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        GetAttributesVisibility(ObjDom);
        GetAttributesBorder(ObjDom);

        BorderAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeRecipeManagerObject(element) {
    {
        let ObjDom = getObjDom(element);
        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Full state fetch + table rebuild only once per page load (__rmExecuteQueryInited). Subsequent executeQuery ticks sync without a full rebuild.
        if (!ObjDom.__rmExecuteQueryInited) {
            RenderRecipeManagerObject(ObjDom);
            ObjDom.__rmExecuteQueryInited = true;
        } else {
            if (typeof RecipeManagerSyncFromExecuteQuery === "function") {
                RecipeManagerSyncFromExecuteQuery(ObjDom);
            }
        }
        GetAttributesVisibility(ObjDom);

        VisibilityAnimation(ObjDom);
    }
}

function executeSliderObject(element) {
    {
        //animation

        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        if (typeof VarDict[ObjDom.getAttribute('data-variable')] !== 'undefined') {


            if (parseInt(ObjDom.getAttribute("data-writetimeout")) > 0) {
                ObjDom.setAttribute("data-writetimeout", parseInt(ObjDom.getAttribute("data-writetimeout")) - 1);
            }
            else {

                if (typeof SlidersDict[ObjDom.id] !== 'undefined') {

                    var slider = SlidersDict[ObjDom.id];

                    if (slider.sliding == false) {

                        var DevVar = ObjDom.getAttribute('data-variable');

                        PageVars[DevVar] = 0;

                        if (VarDict[DevVar][0] !== ObjDom.getAttribute('se-min-value')) {

                            slider.setMinValue(VarDict[DevVar][0]);
                        }
                    }
                }
            }
        }
    }
}

function executeDonutObject(element) {
    {
        //animation
        let ObjDom = getObjDom(element);

        if (ObjDom === undefined) { return; }

        var data = [];
        var datastr;

        data = DonutContextGetData(ObjDom);

        datastr = JSON.stringify(data); // should certainly be a correct json

        var currentData = ObjDom.getAttribute('data-currentdata');

        if (currentData !== datastr) {
            //console.log('REDRAW');
            createDonutChart(element, data);
            ObjDom.setAttribute('data-currentdata', JSON.stringify(data));
        }
    }
}

function executeBarGraphObject(element) {
    {
        //animation
        let ObjDom = getObjDom(element);

        if (ObjDom === undefined) { return; }
                   
        var data = [];
        var datastr;

        data = BarGraphContextGetData(ObjDom);

        datastr = JSON.stringify(data); // should certainly be a correct json

        var currentData = ObjDom.getAttribute('data-currentdata');

        if (currentData !== datastr)
        {
            createBarGraph(element, data);
            ObjDom.setAttribute('data-currentdata', JSON.stringify(data));
        }
    }
}

function executeMapObject(element) {
    {
        let ObjDom = element; // for MapObject, ObjDom == the outer div with name=MapObject

        if (!ObjDom) { return; }

        // Keep the subscription set independent of which pins are on screen. This also registers
        // the position variable of every bound asset, which is how asset positions now arrive.
        if (typeof MapRegisterPageVars === "function") MapRegisterPageVars(ObjDom);

        if (!ObjDom.__mapExecuteQueryInited) {
            if (typeof RenderMapObject === "function") RenderMapObject(ObjDom);
            ObjDom.__mapExecuteQueryInited = true;
        } else {
            if (typeof MapSyncFromExecuteQuery === "function") MapSyncFromExecuteQuery(ObjDom);
        }

        GetAttributesVisibility(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeListBoxObject(element) {
    {
        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        ObjDom.style.pointerEvents = EditMode ? 'none' : '';

        try {

            // Applied before the no-items early return: the colours are independent of content,
            // and were read by the properties panel only, so a Color Library name never reached
            // the select - the design-time inline style held the literal name.
            ApplyResolvedColor(ObjDom, 'color', ObjDom.getAttribute('data-colorpicker'));
            ApplyResolvedColor(ObjDom, 'backgroundColor', ObjDom.getAttribute('data-backgroundcolorpicker'));
            ApplyResolvedColor(ObjDom, 'borderColor', ObjDom.getAttribute('data-bordercolorpicker'));

            var listdata = GetSelectionListData(ObjDom);

            if (!listdata) { return; }

            var listboxitems = listdata.items;
            var listboxvalues = listdata.values;

            var resolvedDataStr = listdata.key;
            var currentData = ObjDom.getAttribute('data-currentdata');

            if (currentData !== resolvedDataStr) {
                ObjDom.innerHTML = '';
                for (var oi = 0; oi < listboxitems.length; oi++) {
                    var opt = document.createElement('option');
                    opt.value = listboxvalues[oi];
                    opt.text = listboxitems[oi];
                    ObjDom.appendChild(opt);
                }
                ObjDom.setAttribute('data-currentdata', resolvedDataStr);
            }

            var isMulti = ObjDom.getAttribute('data-multiselect') === 'true';
            ObjDom.multiple = isMulti;

            if (!ObjDom._listboxMultiInit) {
                ObjDom._listboxMultiInit = true;
                ObjDom.addEventListener('mousedown', ListBoxMultiMouseDown);
            }

            var selBg = ObjDom.getAttribute('data-selectedbackgroundcolor');
            var selTxt = ObjDom.getAttribute('data-selectedtextcolor');
            var sbColor = ObjDom.getAttribute('data-scrollbarcolor');
            var sbTrack = ObjDom.getAttribute('data-scrollbartrackcolor');
            if (selBg) { ObjDom.style.setProperty('--listbox-selected-background-color', GetObjectColor(selBg)); }
            if (selTxt) { ObjDom.style.setProperty('--listbox-selected-text-color', GetObjectColor(selTxt)); }
            if (sbColor) { ObjDom.style.setProperty('--listbox-scrollbar-color', GetObjectColor(sbColor)); }
            if (sbTrack) { ObjDom.style.setProperty('--listbox-scrollbar-track-color', GetObjectColor(sbTrack)); }


            var variable = ObjDom.getAttribute('data-variable');
            if (variable) {
                PageVars[variable] = 0;
                if (typeof VarDict[variable] !== 'undefined') {
                    var currentValue = String(VarDict[variable][0]);
                    var lastAppliedValue = ObjDom.getAttribute('data-currentvalue');
                    if (currentValue !== lastAppliedValue) {
                        if (isMulti) {
                            var selectedValues = currentValue.split(';');
                            for (var si = 0; si < ObjDom.options.length; si++) {
                                ObjDom.options[si].selected = selectedValues.indexOf(ObjDom.options[si].value) >= 0;
                            }
                        } else {
                            ObjDom.value = currentValue;
                        }
                        ObjDom.setAttribute('data-currentvalue', currentValue);
                    }
                }
            }

        } catch (error) {
            console.error(error);
        }
    }
}

function executeDropDownObject(element) {
    {
        let ObjDom = getObjDom(element);

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        try {

            var button = ObjDom;

            // The box colours were read by the properties panel only, so a Color Library name
            // never reached the button - the design-time inline style held the literal name.
            // The list colours are applied on open, in DropDownClicked, where the ul is in scope.
            ApplyResolvedColor(button, 'color', ObjDom.getAttribute('data-colorboxpicker'));
            ApplyResolvedColor(button, 'backgroundColor', ObjDom.getAttribute('data-backgroundboxcolorpicker'));
            ApplyResolvedColor(button, 'borderColor', ObjDom.getAttribute('data-borderboxcolorpicker'));

            //button.innerHTML = "";

            let variable = ObjDom.getAttribute("data-variable");

            var DevVar = variable;

            PageVars[DevVar] = 0;

                        
            if (typeof VarDict[DevVar] !== 'undefined') {

                var listdata = GetSelectionListData(ObjDom);

                if (!listdata) {
                    return;
                }

                var dropdownitems = listdata.items;
                var dropdownvalues = listdata.values;

                var currentvalue = "Pending...";

                var itemcounter = 0;

                //console.log(dropdownvalues);

                dropdownvalues.forEach((dropdownvalue) => {
                                
                    if (dropdownvalue == VarDict[DevVar][0]) {
                                    
                        if (dropdownitems[itemcounter]) {
                            currentvalue = dropdownitems[itemcounter];

                                        
                        }

                    }

                    itemcounter = itemcounter + 1;
                });

                // check or if variable instead? 

                var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];
                var translation = LanguagesFileJson?.[currentvalue]?.[selectedLang];

                if (translation && button.innerHTML !== translation) {
                    button.innerHTML = translation;
                }
                else {
                    if (button.innerHTML !== currentvalue) {
                        button.innerHTML = currentvalue;
                    }
                }
                            
            }
            else {
                if (button.innerHTML !== "Loading...") {
                    button.innerHTML = "Loading...";
                }
            }

        } catch (error) {
            console.error(error);
        }
    }
}

function executePolygonObject(element) {
    {

        let ObjDom = element.getElementsByTagName("svg")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes
        let backgroundcolor;

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#5A5A5A';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        ObjDom.style.fill = GetObjectColor(backgroundcolor);

        const color = getColorFromStates(ObjDom, "data-colorstates");

        if (color) {
            ObjDom.style.fill = GetObjectColor(color);
        }

        // TODO: SVGObject SET ZERO STATE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesBorder(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);
        GetAttributesRotation(ObjDom);

        PositionSizeAnimation(ObjDom);
        BorderAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
        RotationAnimation(ObjDom);
        ContinuousRotationAnimation(ObjDom);
    }
}

function executePolylineObject(element) {
    {
        let ObjDom = element.getElementsByTagName("svg")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes
        let backgroundcolor;

        // backgroundcolor
        if (ObjDom.getAttribute("data-backgroundcolor")) {
            backgroundcolor = ObjDom.getAttribute("data-backgroundcolor");
        }
        else {
            backgroundcolor = '#000';
            ObjDom.setAttribute("data-backgroundcolor", backgroundcolor);
        }

        ObjDom.style.stroke = GetObjectColor(backgroundcolor);

        const color = getColorFromStates(ObjDom, "data-colorstates");

        if (color) {
            ObjDom.style.stroke = GetObjectColor(color);
        }

        // Arrowheads carry their own explicit fill, so they have to be repainted after the stroke
        // color above is resolved or a colorstates change would leave the heads on the old color.
        SyncPolylineArrows(ObjDom);

        // TODO: SVGObject SET ZERO STATE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesBorder(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);

        PositionSizeAnimation(ObjDom);
        BorderAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeRadioButtonObject(element) {
    {
        //TODO: RadioButtonObject
    }
}

function executeCheckBoxObject(element) {
    {
        let ObjDom = element.getElementsByTagName("div")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        let oncolor;
        let onbackgroundcolor;
        let onbordercolor;
        let offbackgroundcolor;
        let offbordercolor;
        let variable;

        // oncolor
        if (ObjDom.getAttribute("data-oncolor")) {
            oncolor = ObjDom.getAttribute("data-oncolor");
        }
        else {
            oncolor = '#000';
            ObjDom.setAttribute("data-oncolor", oncolor);
        }

        // onbackgroundcolor
        if (ObjDom.getAttribute("data-onbackgroundcolor")) {
            onbackgroundcolor = ObjDom.getAttribute("data-onbackgroundcolor");
        }
        else {
            onbackgroundcolor = '#fff';
            ObjDom.setAttribute("data-onbackgroundcolor", onbackgroundcolor);
        }

        // onbordercolor
        if (ObjDom.getAttribute("data-onbordercolor")) {
            onbordercolor = ObjDom.getAttribute("data-onbordercolor");
        }
        else {
            onbordercolor = '#000';
            ObjDom.setAttribute("data-onbordercolor", onbordercolor);
        }

        // offbackgroundcolor
        if (ObjDom.getAttribute("data-offbackgroundcolor")) {
            offbackgroundcolor = ObjDom.getAttribute("data-offbackgroundcolor");
        }
        else {
            offbackgroundcolor = '#fff';
            ObjDom.setAttribute("data-offbackgroundcolor", offbackgroundcolor);
        }

        // offbordercolor
        if (ObjDom.getAttribute("data-offbordercolor")) {
            offbordercolor = ObjDom.getAttribute("data-offbordercolor");
        }
        else {
            offbordercolor = '#000';
            ObjDom.setAttribute("data-offbordercolor", offbordercolor);
        }

        //variable
        if (ObjDom.getAttribute("data-variable")) {
            variable = ObjDom.getAttribute("data-variable");
        }
        else {
            variable = '';
            ObjDom.setAttribute("data-variable", variable);
        }

        // Animate button

        let compStyles = window.getComputedStyle(ObjDom);

        //let variableindex = Variables.indexOf(variable);
        //VarDict[variable]
        let variablevalue = '';

        let DevVar = variable;

        // Free-form names: subscribe any plausible name; a dot-less token that stays
        // unknown after data arrives keeps the static default (never NOT FOUND).
        if (isVariableName(DevVar)) {
            PageVars[DevVar] = 0;
        }

        if (!isVariableName(DevVar) || (!DevVar.includes(".") && typeof VarDict[DevVar] === 'undefined')) {
            ObjDom.classList.add("checkboxchecked");
            ObjDom.style.fill = GetObjectColor(oncolor);
            ObjDom.style.backgroundColor = GetObjectColor(onbackgroundcolor);
            ObjDom.style.borderColor = GetObjectColor(onbordercolor);
        }
        else {
            PageVars[DevVar] = 0;

            /* if (variableindex === -1) {*/
            if (typeof VarDict[DevVar] === 'undefined') {
                if (firstdata) {
                    ObjDom.classList.remove("checkboxchecked");
                    ObjDom.style.fill = '#FFF';
                    ObjDom.style.backgroundColor = NotFoundColor;
                    variablevalue = null;
                }
            } // ERROR variable not found
            else {

                variablevalue = VarDict[DevVar][0];
                //console.log(variablevalue);
                ObjDom.title = DevVar + " " + VarDict[DevVar][1];
                SetStatusIcon(element, ObjDom, VarDict[DevVar][3]);

                if (parseInt(variablevalue) > 0 || variablevalue === 'True') {
                    ObjDom.classList.add("checkboxchecked");
                    ObjDom.style.fill = GetObjectColor(oncolor);
                    ObjDom.style.backgroundColor = GetObjectColor(onbackgroundcolor);
                    ObjDom.style.borderColor = GetObjectColor(onbordercolor);
                }
                else {
                    ObjDom.classList.remove("checkboxchecked");
                    ObjDom.style.backgroundColor = GetObjectColor(offbackgroundcolor);
                    ObjDom.style.borderColor = GetObjectColor(offbordercolor);
                }
            }
        }

        // Generic
        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);

        AccessControlAnimation(ObjDom);
        PositionSizeAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeToggleObject(element) {
    {
        let ObjDom = element.getElementsByTagName("div")[0];

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Set data attributes

        let ontext;
        let offtext;
        let oncolor;
        let offcolor;
        let onbackgroundcolor;
        let onbordercolor;
        let offbackgroundcolor;
        let offbordercolor;
        let variable;

        // oncolor
        if (ObjDom.getAttribute("data-oncolor")) {
            oncolor = ObjDom.getAttribute("data-oncolor");
        }
        else {
            oncolor = '#F5F5F5';
            ObjDom.setAttribute("data-oncolor", oncolor);
        }

        // offcolor
        if (ObjDom.getAttribute("data-offcolor")) {
            offcolor = ObjDom.getAttribute("data-offcolor");
        }
        else {
            offcolor = '#BDBDBD';
            ObjDom.setAttribute("data-offcolor", offcolor);
        }

        // onbackgroundcolor
        if (ObjDom.getAttribute("data-onbackgroundcolor")) {
            onbackgroundcolor = ObjDom.getAttribute("data-onbackgroundcolor");
        }
        else {
            onbackgroundcolor = '#00C853';
            ObjDom.setAttribute("data-onbackgroundcolor", onbackgroundcolor);
        }

        // onbordercolor
        if (ObjDom.getAttribute("data-onbordercolor")) {
            onbordercolor = ObjDom.getAttribute("data-onbordercolor");
        }
        else {
            onbordercolor = '#BDBDBD';
            ObjDom.setAttribute("data-onbordercolor", onbordercolor);
        }

        // offbackgroundcolor
        if (ObjDom.getAttribute("data-offbackgroundcolor")) {
            offbackgroundcolor = ObjDom.getAttribute("data-offbackgroundcolor");
        }
        else {
            offbackgroundcolor = '#F5F5F5';
            ObjDom.setAttribute("data-offbackgroundcolor", offbackgroundcolor);
        }

        // offbordercolor
        if (ObjDom.getAttribute("data-offbordercolor")) {
            offbordercolor = ObjDom.getAttribute("data-offbordercolor");
        }
        else {
            offbordercolor = '#BDBDBD';
            ObjDom.setAttribute("data-offbordercolor", offbordercolor);
        }

        //ontext
        if (ObjDom.getAttribute("data-ontext")) {
            ontext = ObjDom.getAttribute("data-ontext");
        }
        else {
            ontext = 'ON';
            ObjDom.setAttribute("data-ontext", ontext);
        }

        //offtext
        if (ObjDom.getAttribute("data-offtext")) {
            offtext = ObjDom.getAttribute("data-offtext");
        }
        else {
            offtext = 'OFF';
            ObjDom.setAttribute("data-offtext", offtext);
        }

        //variable
        if (ObjDom.getAttribute("data-variable")) {
            variable = ObjDom.getAttribute("data-variable");
        }
        else {
            variable = '';
            ObjDom.setAttribute("data-variable", variable);
        }

        // Animate button

        let compStyles = window.getComputedStyle(ObjDom);

        //let variableindex = Variables.indexOf(variable);
        //VarDict[variable]
        let variablevalue = '';

        var ToggleTextLeft = ObjDom.getElementsByClassName("ToggleTextLeft")[0];
        var ToggleDot = ObjDom.getElementsByClassName("ToggleDot")[0];
        var ToggleTextRight = ObjDom.getElementsByClassName("ToggleTextRight")[0];

        let DevVar = variable;

        // Free-form names: subscribe any plausible name; a dot-less token that stays
        // unknown after data arrives keeps the static default (never NOT FOUND).
        if (isVariableName(DevVar)) {
            PageVars[DevVar] = 0;
        }

        if (!isVariableName(DevVar) || (!DevVar.includes(".") && typeof VarDict[DevVar] === 'undefined')) {

            ObjDom.classList.remove("toggletoggled");
            ObjDom.style.color = GetObjectColor(offcolor);
            ToggleTextRight.style.color = GetObjectColor(offcolor);
            ToggleDot.style.backgroundColor = GetObjectColor(offcolor);

            ObjDom.style.backgroundColor = GetObjectColor(offbackgroundcolor);
            ObjDom.style.borderColor = GetObjectColor(offbordercolor);
            ToggleDot.style.borderColor = GetObjectColor(offbordercolor);

        }
        else {
            PageVars[DevVar] = 0;

            /* if (variableindex === -1) {*/
            if (typeof VarDict[DevVar] === 'undefined') {
                if (firstdata) {
                    ObjDom.classList.remove("toggletoggled");
                    ToggleTextLeft.innerHTML = 'NOT FOUND';
                    ObjDom.style.color = '#FFF';
                    ObjDom.style.backgroundColor = NotFoundColor;
                    variablevalue = null;
                    SetStatusIcon(element, ObjDom, 'NotFound');
                }
            } // ERROR variable not found
            else {

                variablevalue = VarDict[DevVar][0];
                //console.log(variablevalue);
                ObjDom.title = DevVar + " " + VarDict[DevVar][1];
                SetStatusIcon(element, ObjDom, VarDict[DevVar][3]);

                if (parseInt(variablevalue) > 0 || variablevalue === 'True') {

                    var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];
                    var translation = LanguagesFileJson?.[ontext]?.[selectedLang];

                    if (translation && ToggleTextLeft.innerHTML !== translation) {
                        ToggleTextLeft.innerHTML = translation;
                    }

                    ObjDom.classList.add("toggletoggled");
                    ToggleTextLeft.style.color = GetObjectColor(oncolor);
                    ObjDom.style.color = GetObjectColor(oncolor);
                    ToggleDot.style.backgroundColor = GetObjectColor(oncolor);

                    ObjDom.style.backgroundColor = GetObjectColor(onbackgroundcolor);
                    ObjDom.style.borderColor = GetObjectColor(onbordercolor);
                    ToggleDot.style.borderColor = GetObjectColor(onbordercolor);
                }
                else {
                    var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];
                    var translation = LanguagesFileJson?.[offtext]?.[selectedLang];

                    if (translation && ToggleTextRight.innerHTML !== translation) {
                        ToggleTextRight.innerHTML = translation;
                    }

                    ObjDom.classList.remove("toggletoggled");
                    ObjDom.style.color = GetObjectColor(offcolor);
                    ToggleTextRight.style.color = GetObjectColor(offcolor);
                    ToggleDot.style.backgroundColor = GetObjectColor(offcolor);

                    ObjDom.style.backgroundColor = GetObjectColor(offbackgroundcolor);
                    ObjDom.style.borderColor = GetObjectColor(offbordercolor);
                    ToggleDot.style.borderColor = GetObjectColor(offbordercolor);
                }
            }
        }
                    

        // Generic
        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);
        GetAttributesAnimatePositionSize(ObjDom);

        AccessControlAnimation(ObjDom);
        PositionSizeAnimation(ObjDom);
        VisibilityAnimation(ObjDom);
    }
}

function executeGroupObject(element) {
    {


        let ObjDom = element;

        if (!ObjDom) { return warnMissingRuntimeElement(element); }

        // Animate

        // Generic

        GetAttributesAccessControl(ObjDom);
        GetAttributesVisibility(ObjDom);

        VisibilityAnimation(ObjDom);
        AccessControlAnimation(ObjDom);
    }
}


//function ResolveConditionstate(conditionstate) {

//    //console.log(conditionstate);

//    var conditionstatevars = conditionstate.match(/(\w+[.-a-zA-Z]*\w+)/g);

//    if (conditionstatevars) {
//        for (let i = 0; i < conditionstatevars.length; i++) {

//            if (conditionstatevars[i].includes('.')) {
//                PageVars[conditionstatevars[i]] = 0;
//            }

//            if (typeof VarDict[conditionstatevars[i]] !== 'undefined') // ERROR variable not found
//            {

//                if (VarDict[conditionstatevars[i]][0].match(/(\w+[.-a-zA-Z]*\w+)/g) && !VarDict[conditionstatevars[i]][0].includes("'")) {

//                    conditionstate = conditionstate.replace(conditionstatevars[i], "'" + VarDict[conditionstatevars[i]][0] + "'");

//                    //console.log(conditionstate);
//                }
//                else {
//                    conditionstate = conditionstate.replace(conditionstatevars[i], VarDict[conditionstatevars[i]][0]);
//                }

//                variablevalue = null;
//            }
//            else {
//                var strval = conditionstatevars[i].match(/(\w+[.-a-zA-Z]*\w+)/g);

//                if (strval && !strval.includes("'")) {

//                    strval = strval[0];

//                    //introduce space to avoid ''on'' 
//                    conditionstate = conditionstate.replace(" " + strval, " '" + strval + "'");

//                    //console.log(conditionstate)
//                }
//            }

//        }
//    }

//    //console.log('return ' + conditionstate);

//    return conditionstate;

//}

function LicenseCheck() {


    if (typeof VarDict['SYSTEM.LicenseStatus'] !== 'undefined') {

        //console.log(VarDict['SYSTEM.LicenseStatus']);

        if (VarDict['SYSTEM.LicenseStatus'][0] === 'UNLICENSED') {

            if (!$('#LicenseModal').hasClass('show')) {

                SilentUpdatePage();

                var myModal = new bootstrap.Modal(document.getElementById('LicenseModal'));

                myModal.show();


            }

            if (typeof VarDict['SYSTEM.DemoResetTime'] !== 'undefined') {

                if (VarDict['SYSTEM.DemoResetTime'][0] !== '0') {
                    document.getElementById('LicenseText').innerHTML = 'Restart possible in ' + VarDict['SYSTEM.DemoResetTime'][0] + 's';
                }
                else {
                    document.getElementById('LicenseText').innerHTML = 'You can now restart the server.';
                }

            }

        }
        else {
            if ($('#LicenseModal').hasClass('show')) {
                //console.log('hiding');
                $('#LicenseModal').modal('hide');
            }

        }

    }
}

function executeCharts() {


    for (const [key, value] of Object.entries(ChartsDict)) {

        let timespan;
        let variable1;
        let variable2;
        let variable3;
        let variable4;
        let variable5;
        let variable6;
        let variable7;
        let variable8;


        if (!document.getElementById(key)) {
            if (typeof ChartsDict[key] !== 'undefined') {
                delete ChartsDict[key];
            }
        }
        else {

            let ObjDom = document.getElementById(key).getElementsByTagName("canvas")[0];

            if (typeof ChartsSettingsDict[key] !== 'undefined') {
                // Has a fixed time range chosen in the trend window, so it is not a live
                // chart. Skip this one only: breaking here stopped the live updates of every
                // remaining trend on the page as well.
                continue;
            }

            //timespan
            if (ObjDom.getAttribute("data-timespan")) {
                timespan = ObjDom.getAttribute("data-timespan");
            }
            else {
                timespan = '5';
                ObjDom.setAttribute("data-timespan", timespan);
            }

            //variable1
            if (ObjDom.getAttribute("data-variable1")) {
                variable1 = ObjDom.getAttribute("data-variable1");
            }
            else {
                variable1 = '';
                ObjDom.setAttribute("data-variable1", variable1);
            }

            PageVars[variable1] = 0;

            //variable2
            if (ObjDom.getAttribute("data-variable2")) {
                variable2 = ObjDom.getAttribute("data-variable2");
            }
            else {
                variable2 = '';
                ObjDom.setAttribute("data-variable2", variable2);
            }

            PageVars[variable2] = 0;

            //variable3
            if (ObjDom.getAttribute("data-variable3")) {
                variable3 = ObjDom.getAttribute("data-variable3");
            }
            else {
                variable3 = '';
                ObjDom.setAttribute("data-variable3", variable3);
            }

            PageVars[variable3] = 0;

            //variable4
            if (ObjDom.getAttribute("data-variable4")) {
                variable4 = ObjDom.getAttribute("data-variable4");
            }
            else {
                variable4 = '';
                ObjDom.setAttribute("data-variable4", variable4);
            }

            PageVars[variable4] = 0;

            //variable5
            if (ObjDom.getAttribute("data-variable5")) {
                variable5 = ObjDom.getAttribute("data-variable5");
            }
            else {
                variable5 = '';
                ObjDom.setAttribute("data-variable5", variable5);
            }

            PageVars[variable5] = 0;

            //variable6
            if (ObjDom.getAttribute("data-variable6")) {
                variable6 = ObjDom.getAttribute("data-variable6");
            }
            else {
                variable6 = '';
                ObjDom.setAttribute("data-variable6", variable6);
            }

            PageVars[variable6] = 0;

            //variable7
            if (ObjDom.getAttribute("data-variable7")) {
                variable7 = ObjDom.getAttribute("data-variable7");
            }
            else {
                variable7 = '';
                ObjDom.setAttribute("data-variable7", variable7);
            }

            PageVars[variable7] = 0;

            //variable8
            if (ObjDom.getAttribute("data-variable8")) {
                variable8 = ObjDom.getAttribute("data-variable8");
            }
            else {
                variable8 = '';
                ObjDom.setAttribute("data-variable8", variable8);
            }


            PageVars[variable8] = 0;


            let pushed = false;

            if (typeof VarDict[variable1] !== 'undefined') {

                push(ChartsDict[key], VarDict[variable1][0], new Date(VarDict[variable1][1]), timespan, 0);
                pushed = true;
            }

            if (typeof VarDict[variable2] !== 'undefined') {

                push(ChartsDict[key], VarDict[variable2][0], new Date(VarDict[variable2][1]), timespan, 1);
                pushed = true;
            }

            if (typeof VarDict[variable3] !== 'undefined') {

                push(ChartsDict[key], VarDict[variable3][0], new Date(VarDict[variable3][1]), timespan, 2);
                pushed = true;
            }

            if (typeof VarDict[variable4] !== 'undefined') {

                push(ChartsDict[key], VarDict[variable4][0], new Date(VarDict[variable4][1]), timespan, 3);
                pushed = true;
            }

            // One redraw for the whole chart. push() used to redraw per series, so a four
            // series trend paid four full chart updates for a single tick of data.
            if (pushed) {
                ChartsDict[key].update();
            }

        }

    }

    setTimeout(executeCharts, 1000);

}

function executeAlarms() {

    GetAlarms();

    setTimeout(executeAlarms, 1500);
}

function executePageScriptPeriodic() {

    try {
        OnPagePeriodic();
        OnGlobalPeriodic();
    } catch (error) {
        console.error(error);
    }

    setTimeout(executePageScriptPeriodic, 1000);
}

function executeDataTablesPeriodic() {

    try {

        var datatables = document.getElementById("EnvisionPage").querySelectorAll('[name="DataTableObject"]');

        datatables.forEach(function (datatable) {

            var ObjDom = getObjDom(datatable);

            if (ObjDom.getAttribute("data-refreshtime") != '0') {
                var refreshtime = parseInt(ObjDom.getAttribute("data-refreshtime"));

                if (!ObjDom.hasAttribute("data-refreshtimelast")) {
                    ObjDom.setAttribute("data-refreshtimelast", Date.now() / 1000);
                }

                var refreshtimelast = parseInt(ObjDom.getAttribute("data-refreshtimelast"));

                if (refreshtime > 0) {

                    if (((Date.now() / 1000) - refreshtimelast) > refreshtime) {

                        //console.log('Refresh');

                        if (!draggingcolumn) {
                            GetDataTableData(datatable.id);
                        }

                        ObjDom.setAttribute("data-refreshtimelast", Date.now() / 1000);

                    }

                }
                else {
                    throw ('datatable refreshtime not a number');
                }
            }

        });

    } catch (error) {
        console.error(error);
    }

    setTimeout(executeDataTablesPeriodic, 1000);
}

function executeTimeOut() {

    SendUserNotice = true;

    setTimeout(executeTimeOut, 10000);
}

//function EvaluateExpression(obj) {

//    //console.log(Function('"use strict";return (' + obj + ')')());

//    return Function('"use strict";return (' + obj + ')')();
//}

function EvaluateExpression(resolved) {
    try {
        if (firstdata) {
            if (resolved.includes("return ")) {
                return Function(resolved)();
            }
            else {
                return Function("return " + resolved)();
            }
        }
    }
    catch (error) {
        //console.error(error);
    }

}

async function push(chart, value, timestamp, timespan, datasetno) {

    if (chart.id !== -1) {

        // The value as received. Kept for the change/no-change comparison below so that a
        // non-numeric value still compares equal to itself (Number("Running") is NaN, and
        // NaN !== NaN would mark every sample as a change).
        var rawValue = value;

        // OPC UA
        if (value.toLowerCase() == "true" || value.toLowerCase() == "false") {

            if (value.toLowerCase() == "true") {
                value = 1;
            }
            else {
                value = 0;
            }
        }

        // Store the value as a number. Both scales re-parse every point on every update, and
        // Number() is the same coercion Chart.js applied to the string internally, so what is
        // drawn does not change.
        value = typeof value === 'number' ? value : Number(value);

        //TODO: SET UTC to TIMEZONE
        timestamp.setHours(timestamp.getHours() + Math.abs(new Date().getTimezoneOffset() / 60));

        timestamp.setHours(timestamp.getHours());

        var lastminutes = timespan;

        var dataset = chart.data.datasets[datasetno];

        // While a value sits still the line still has to reach "now", which used to mean
        // appending one point per second and popping the whole run on the next change. A run
        // of points on one horizontal line draws exactly the same line as its two endpoints,
        // so a single trailing point is kept and moved forward instead. That also keeps every
        // point radius identical, which is what lets pointRadius stay a single value.
        if (dataset.data.length === 0) {

            dataset.data.push({ x: Date.now(), y: value });
            dataset.hasTrailingFiller = true;
        }
        else if (rawValue !== dataset.lastRawValue) {
            //TODO: Insert old data in trend, or retrieve new historic (DNP3 for example);

            // pull line dot to dot
            if (dataset.hasTrailingFiller) {
                dataset.data.pop();
                dataset.hasTrailingFiller = false;
            }

            dataset.data.push({ x: timestamp.getTime(), y: value });
        }
        else if (dataset.hasTrailingFiller) {

            // Same value again: advance the point that is already trailing the line.
            dataset.data[dataset.data.length - 1].x = Date.now();
        }
        else {

            dataset.data.push({ x: Date.now(), y: value });
            dataset.hasTrailingFiller = true;
        }

        dataset.lastRawValue = rawValue;

        // Count the leading points that have rolled out of the timespan window. Data is in
        // ascending time order, so this is the same set the old loop removed one by one, but
        // it is spliced and redrawn once instead of costing a full chart update per point.
        var dropped = 0;

        while (dropped < dataset.data.length) {

            var date = new Date(dataset.data[dropped]["x"]);

            var now_utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                date.getUTCDate(), date.getUTCHours(),
                date.getUTCMinutes(), date.getUTCSeconds()));

            if (moment().utc().diff(moment(now_utc), 'minutes') < lastminutes) {
                break;
            }

            dropped++;
        }

        if (dropped > 0) {

            dataset.data.splice(0, dropped);

            if (dataset.data.length === 0) {
                dataset.hasTrailingFiller = false;
            }
        }

        // No redraw here: executeCharts redraws the chart once after pushing all of its
        // series, instead of once per series.

    }
}

function OpenURL(url) {

    // Names are free-form (dots optional): membership decides whether the configured
    // value is a variable holding the URL or the URL itself.
    if (url && typeof VarDict[url] !== 'undefined') {
        url = VarDict[url][0];
    }

    newwindow = window.open(url, 'name', 'height=' + screen.height + ',width=' + screen.width + ',toolbar=no,menubar=no,status=no,resizable=yes,location=no,directories=no');
    if (window.focus) { newwindow.focus() }

    window.open(url);
}

function GarbageCollectUidVars() {

    try {
        // Garbage collecting for uid client variables
        const GC = [];
        for (const [key, value] of Object.entries(localStorage)) {
            if (key.includes("_GarbageCollect_")) {
                GC.push(key);
            }
        }

        GC.forEach((item) => {

            const words = item.split('_');

            var popupid = words[length + 1];

            //console.log(popupid);

            var popup = document.getElementById(popupid);

            if (!popup) {
                localStorage.removeItem(item);
            }

        });
    } catch (error) {
        console.error(error);
    }

}

// Applies the configured colors of the table-style and input-style objects. These objects read
// their color attributes but never applied them, so the only thing that ever painted them was
// the properties panel at design time: a color set through the Design API/MCP produced an
// inline style holding the literal library NAME, which is invalid CSS and was dropped, and a
// library color could never update an existing object. Resolving here puts them on the same
// footing as every other object type - the runtime owns the color and follows the library.
function ApplyResolvedColor(target, property, value) {
    if (!target || value === null || value === undefined || value === '') { return; }
    target.style[property] = GetObjectColor(value);
}

function ApplyResolvedColorAll(targets, property, value) {
    if (!targets || value === null || value === undefined || value === '') { return; }
    var resolved = GetObjectColor(value);
    for (var i = 0; i < targets.length; i++) {
        if (targets[i]) { targets[i].style[property] = resolved; }
    }
}

// Shared by AlarmBannerObject and DataTableObject: same table shape, different class prefix.
function ApplyTableObjectColors(ObjDom, prefix, colors) {
    if (!ObjDom) { return; }

    var table = ObjDom.getElementsByClassName(prefix + 'Table')[0];
    var thead = ObjDom.getElementsByClassName(prefix + 'Thead')[0];
    var tbody = ObjDom.getElementsByClassName(prefix + 'Tbody')[0];

    ApplyResolvedColor(table, 'backgroundColor', colors.backgroundcolor);
    ApplyResolvedColor(table, 'fill', colors.iconcolor);
    ApplyResolvedColor(tbody, 'color', colors.textcolor);
    ApplyResolvedColor(thead, 'color', colors.headertextcolor);

    if (thead) { ApplyResolvedColorAll(thead.getElementsByTagName('th'), 'backgroundColor', colors.headerbackgroundcolor); }

    ApplyResolvedColor(ObjDom, 'borderColor', colors.gridlinecolor);
    ApplyResolvedColor(thead, 'borderColor', colors.gridlinecolor);
    ApplyResolvedColor(tbody, 'borderColor', colors.gridlinecolor);
}

function loadpagealarms() {

    PageAlarms = [];

    var alarmbanners = document.getElementById("EnvisionPage").querySelectorAll('[name="AlarmBannerObject"]');

    if (alarmbanners) {
        alarmbanners.forEach(function (alarmbanner) {
            var ObjDom = getObjDom(alarmbanner);
            makecolumncolumnsmoveableAlarmbanner(ObjDom);
            ApplyAlarmBannerStyles(ObjDom);
            // A banner created through the Design API carries no data-assets (the designer
            // template has none either), and this runs from bootstrap BEFORE the first
            // executeAlarmBannerObject back-fills it. Reading null here threw, which aborted
            // the whole loop and left PageAlarms empty, so the page loaded no alarms at all.
            // Missing means the same as empty: the server reads a blank entry as "all alarms".
            var assets = ObjDom.getAttribute("data-assets") || "";
            assets = assets.replace(" ", "");
            assets = assets.replace(";", ",");

            if (assets.includes(',')) {

                var split = assets.split(',');

                if (split.length > 0) {
                    split.forEach(function (asset) {
                        PageAlarms.push(asset);
                    });
                }
            }
            else {
                PageAlarms.push(assets);
            }

        });
    }
}


function LoadWidgets() {

    var WidgetObjects = document.getElementById("EnvisionPage").querySelectorAll('[name="WidgetObject"]')

    for (var i = 0; i < WidgetObjects.length; i++) {

        var WidgetObject = WidgetObjects.item(i);

        var ObjDom = getObjDom(WidgetObject);

        if (ObjDom.getAttribute("data-html")) {
            ObjDom.innerHTML = ObjDom.getAttribute("data-html");
        }
    }

}

//document.querySelector("#slidertest").shadowRoot.querySelector("div").style.background = "red";

function ReloadActiveObjects() {
    ChartsDict = new Object();
    initknob();
}

// PageScript

function ExecutePageScriptFunction(functionName) {

    try {

        var tmpFunc = new Function(functionName);
        tmpFunc();

    } catch (error) {
        console.error(error);
    }

}
