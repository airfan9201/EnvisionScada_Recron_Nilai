// Envision Utils - Shared utilities: DOM/object lookup, group hierarchy, color conversion, math/rounding, misc helpers.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

function ComingSoon() {
    alert('Hey! This functionality is coming very soon ;)');
}

// A single-token string can be a variable name (names are free-form since v68; dots are
// optional). Strings with spaces are condition expressions or static sentences, ';' lists
// are static item lists. Whether the token IS a variable is decided by VarDict membership
// after it has been subscribed.
function isVariableName(value) {
    return typeof value === 'string' && value.length > 0 && !value.includes(' ') && !value.includes(';');
}

// For text that comes from outside the project: a file name is chosen by whoever writes into the
// folder, so it is never pasted into markup as it stands.
function EscapeHtmlText(value) {
    return (value ?? '').toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getinitAttribute(obj, attr, defaultValue) {
    let value = obj.getAttribute(attr) ?? defaultValue;
    if (!obj.hasAttribute(attr)) {
        obj.setAttribute(attr, value);
    }
    return value;
}

function IsPartOfScaledGroupObject(el) {
    let node = el;

    if (node.getAttribute("name") === "GroupObject") {
        node = node.parentElement;
    }

    //console.log(node);

    while (node) {

        if (node.getAttribute("name") === "GroupObject") {

            const t = node.style.transform || "";

            if (t.includes("scale(")) {
                
                return true;
            }

        }

        node = node.parentElement;
    }

    return false;
}

function IsPartOfScaledGroupObjectOrSelfScaled(elem) {

    // If this element itself is a scaled GroupObject
    if (elem.getAttribute('name') === "GroupObject" && hasInlineScale(elem)) {
        return true;
    }

    // Otherwise check parent GroupObjects
    if (IsPartOfScaledGroupObject(elem)) {
        return true;
    }

    return false;
}

function hasInlineScale(node) {
    if (!node || !node.getAttribute) return false;

    // Only care about GroupObjects
    if (node.getAttribute("name") !== "GroupObject") return false;

    const t = node.style.transform || "";
    return t.includes("scale(");  
}

function hasScaledChildGroupObject(elem) {
    if (!elem || !elem.querySelectorAll) return false;

    // Find all descendant GroupObjects
    const groups = elem.querySelectorAll('[name="GroupObject"]');

    for (const g of groups) {
        // If you truly only want *inside*, skip the element itself
        if (g === elem) continue;

        if (hasInlineScale(g)) {
            return true;
        }
    }

    return false;
}

function IsSelfScaledOrUpOrDownwards(elem) {
    // Self or ancestors
    if (IsPartOfScaledGroupObjectOrSelfScaled(elem)) {
        return true;
    }

    // Descendant group objects
    if (hasScaledChildGroupObject(elem)) {
        return true;
    }

    return false;
}


function GetTopMostParentGroupObject(elem) {

    // GET TOP MOST PARENT GROUPOBJECT

    if (elem.parentElement.getAttribute('name') == "GroupObject") {
        while (elem.parentElement.getAttribute('name') == "GroupObject") {
            elem = elem.parentElement;
        }
    }
    else {
        return null;
    }

    return elem;
}

function extractScale(str) {
    const open = str.indexOf("(");
    const close = str.indexOf(")");

    if (open === -1 || close === -1) return 1;

    const inner = str.substring(open + 1, close); // "1.1" OR "1.1, 1.1"
    const first = inner.split(",")[0].trim();     // "1.1"

    const num = Number(first);
    return isNaN(num) ? 1 : num;
}

function roundDownToNearestX(num) {
    /*console.log(num + " - - - " + GridSizeRoundDown + " - - - " + Math.floor(num / GridSizeRoundDown) * GridSizeRoundDown);*/

    if (EditMode === false) { // FOR POPUP
        return num;
    }

    return Math.floor(num / GridSizeRoundDown) * GridSizeRoundDown;
}

function roundToNearest(number) {
    if (GridSizeRoundDown === 0) {
        throw new Error("Round value cannot be zero.");
    }
    return Math.round(number / GridSizeRoundDown) * GridSizeRoundDown;
}

function roundToNearestx(number) {
    if (GridSizeRoundDown === 0) {
        throw new Error("Round value cannot be zero.");
    }

    return (Math.round(number / GridSizeRoundDown) * GridSizeRoundDown);
}

// GET RIGHT TYPE INSIDE DIV BOX ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 

function getObjDom(obj) {

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
        case "GroupObject": { ObjDom = obj; }
            break;
        default:
            //console.log('yas');
            //alert('unknown context object');
    }

    return ObjDom;

}

function normalize(str) {
    return str
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
}

function GetObject(obj) {

    while (!obj.classList.contains("draggable")) {
        obj = obj.parentElement;
    }

    return obj;

}

function containsOnlyNumbers(str) {
    return /^\d+$/.test(str);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function GenerateUniqueID() {
    var m = new Date();
    var dateString = m.getUTCFullYear().toString() + m.getUTCMonth().toString() + m.getUTCDate().toString() + m.getUTCHours().toString() + m.getUTCMinutes().toString() + m.getUTCSeconds().toString() + m.getUTCMilliseconds().toString() + uniqueidcounter.toString();

    uniqueidcounter = uniqueidcounter + 1;

    return dateString;
}

function GenerateRandomID() {

    return Math.floor(Math.random() * 10001);

}

function hexToRgba(hex, alpha = 0.1) {
    // Remove the '#' if present
    hex = hex.replace(/^#/, '');

    // Handle shorthand hex (e.g. #f03)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Parse r, g, b values
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbaToHex(rgba) {
    const [r, g, b] = rgba
        .replace(/\s/g, '')                // Remove spaces
        .match(/rgba?\(([^)]+)\)/)[1]      // Get inside of rgba(...)
        .split(',')
        .map(Number);

    const toHex = (n) => n.toString(16).padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getCoords(elem) { // crossbrowser version

    // SCALING -------

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

    //ax = roundDownToNearestX(ax);
    //ay = roundDownToNearestX(ay);

    // --------


    var box = elem.getBoundingClientRect();

    var body = document.body;
    //var docEl = document.documentElement;

    //var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    //var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    //var clientTop = docEl.clientTop || body.clientTop || 0;
    //var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    //var top = box.top + scrollTop - clientTop;
    //var left = box.left + scrollLeft - clientLeft;

    //var top = box.top;
    //var left = box.left;

    var top = (box.top - rect.top) * (1 / transform);
    var left = (box.left - rect.left) * (1 / transform);

    return { top: Math.round(top), left: Math.round(left) };
}

//function getPosition(element) {
//    var clientRect = element.getBoundingClientRect();
//    return {
//        left: clientRect.left + document.body.scrollLeft,
//        top: clientRect.top + document.body.scrollTop
//    };
//}

//function ResetSelectedGroups() {

//    SelectedGroups = [];

//    var elements = document.getElementById("EnvisionPage").getElementsByClassName("GroupLine");
//    var element = null;
//    var ctn = 0;

//    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

//        element = elements[i - 1];

//        var idofgroup = element.id.replace("GroupLine", "");
//        var group = document.getElementById(idofgroup);

//        SelectedGroups[ctn] = group;

//        ctn++;

//    }

//}

function GetActiveGroup(elem) {

    if (elem.parentElement.getAttribute('name') == "GroupObject") {
        while (elem.parentElement.getAttribute('name') == "GroupObject") {

            elem = elem.parentElement;

            if (elem.classList.contains("ActiveSelected")) {
                return elem;
            }

        }

        return null;
    }
    else {
        return null;
    }
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function IsJsonAndKey(jsonText, foundValue) {
    try {
        // Decode HTML entities like &quot;
        const textArea = document.createElement('textarea');
        textArea.innerHTML = jsonText;
        const decodedJson = textArea.value;

        const root = JSON.parse(decodedJson);
        const lowerSearch = foundValue.toLowerCase();
        let foundInKey = false;

        function traverse(node) {
            if (foundInKey) return;

            if (Array.isArray(node)) {
                for (const item of node) {
                    traverse(item);
                }
            } else if (node !== null && typeof node === 'object') {
                for (const key in node) {
                    if (key.toLowerCase().includes(lowerSearch)) {
                        foundInKey = true;
                        return;
                    }
                    traverse(node[key]);
                }
            }
        }

        traverse(root);
        return foundInKey;

    } catch (error) {
        return false;
    }
}


function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

// GetObjectColor
function GetObjectColor(color) {

    //console.log('GetObjectColor' + color);

    if (!color) { // in case of NULL
        return color;
    }

    // The Color Library is consulted first, so a library entry may carry any name - including one
    // starting with "r" or "#". Resolving the literal forms first used to make names like "Red"
    // impossible: they were handed straight to CSS as the text "Red" and the object lost its color.
    if (ColorProfile && typeof ColorProfile === "object") {
        // Must be a string: a plain object lookup also reaches inherited Object.prototype members,
        // so a color of "toString" or "constructor" would otherwise return a FUNCTION and get
        // assigned as a CSS color. This also ignores a non-string value from a malformed profile.
        const foundColor = ColorProfile[color];
        if (typeof foundColor === "string" && foundColor) {
            return foundColor;
        }
    }

    // Not a library name: a hex value, an rgb()/rgba() value or a CSS keyword, used as-is.
    return color;

}

// GetObjectTranslation
function GetObjectTranslation(text) {

    var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];

    var translation = LanguagesFileJson?.[text]?.[selectedLang];

    // If translation exists → return it
    // Otherwise → return original text
    return translation ?? text;
}

function BeautifyJSON(editor) {

    if (document.getElementById(editor).value) {
        var ugly = document.getElementById(editor).value;

        try {
            var obj = JSON.parse(ugly);
            var pretty = JSON.stringify(obj, undefined, 4);
            document.getElementById(editor).value = pretty;

        } catch (error) {
            document.getElementById(editor).value = ugly;
        }
    }

}

function SortDictByKeys(dict) { // not used? 

    var keys = Object.keys(dict);
    keys.sort();

    var temp = new Object();

    for (var i = 0; i < keys.length; i++) { // now lets iterate in sort order
        var key = keys[i];
        var value = dict[key];
        temp[key] = value;
    }

    dict = temp;

    return dict;
}

function TryTranslate(text) {
    var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];
    return LanguagesFileJson?.[text]?.[selectedLang];
}
