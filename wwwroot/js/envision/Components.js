// Envision Components - Live components: knob/slider/donut/bargraph/dropdown/listbox/webframe init and behavior.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

function GetWebFramePostMessageTargetOrigin(iframe) {
    try {
        return new URL(iframe.src, window.location.href).origin;
    }
    catch {
        return "*";
    }
}

function ParseWebFramePostMessage(message) {
    if (!message || message.trim() === "") {
        return null;
    }

    try {
        return JSON.parse(message);
    }
    catch {
        return message;
    }
}

// The five viewer objects each frame one fixed in-product page. The route is ROOT-RELATIVE on
// purpose: it resolves against whatever host, IP or port the client used to reach the server, so a
// remote client needs no configuration and no address is ever baked into the page. That is exactly
// what a hand-built Web Frame URL gets wrong.
//
// The pages already carry the embed handler, which renders them without their own navigation, and
// each one keeps enforcing its own user-group rights inside the frame.
const ViewerObjectRoutes = {
    AlarmViewerObject:        "/AlarmViewer?handler=Embedded",
    EventViewerObject:        "/EventViewer?handler=Embedded",
    AuditTrailViewerObject:   "/AuditTrail?handler=Embedded",
    TrendAnalystViewerObject: "/TrendAnalyst?handler=Embedded",
    UsersViewerObject:        "/Users?handler=Embedded",
};

function BuildViewerUrl(element) {
    if (!element) { return ''; }

    return ViewerObjectRoutes[element.getAttribute("name")] ?? '';
}

// Trend Analyst accepts a configuration over postMessage and applies it live, through the same code
// path as a configuration loaded with the page (see the listener in trendanalyst.js). So the
// configuration is pushed rather than put in the URL: a change to a bound variable re-configures the
// running trend instead of reloading the frame and restarting every pen.
function SendTrendAnalystViewerConfig(ObjDom) {
    if (!ObjDom || !ObjDom.contentWindow) { return; }

    let raw = ObjDom.__viewerResolvedConfig ?? '';
    if (raw === '') { return; }

    let config;
    try {
        config = JSON.parse(raw);
    }
    catch {
        return; // not a configuration yet; never post a half-typed value
    }

    // Same-origin by construction (the route is relative), and the receiver refuses anything else.
    ObjDom.contentWindow.postMessage({ type: "trendanalyst-config", config: config }, window.location.origin);
}

function EnsureTrendAnalystViewerConfigHandler(ObjDom) {
    if (!ObjDom || ObjDom.__viewerConfigHandlerAttached) { return; }

    // The frame can only take a configuration once it has loaded, and it loses it on every reload.
    ObjDom.addEventListener('load', function () {
        setTimeout(function () { SendTrendAnalystViewerConfig(ObjDom); }, 250);
    });

    ObjDom.__viewerConfigHandlerAttached = true;
}

// A value may be written literally or bound to a variable (typically a client variable, so an
// operator can pick what an object shows). Same rule as the Web Frame URL: a single token that is a
// known variable resolves to its value, anything else is used verbatim - so a literal path with
// spaces such as "D:/Manuals/Pump 1.pdf" is never mistaken for a variable.
// Used by the Document Viewer path and by the Trend Analyst viewer configuration.
function ResolveValueOrVariable(value) {
    if (!value) { return ''; }

    // Spaces or ';' mean it can never be a variable name, so it is a literal (a report named
    // "Daily Batch Report" is used verbatim).
    if (!isVariableName(value)) { return value; }

    // Neither can a path separator or a drive colon (StoredVariableNameRegex allows none of them),
    // so "C:/Reports/Daily.pdf" is a literal too. Without this it was subscribed as a variable that
    // can never exist, and that junk key was sent to the server on every subscribe.
    if (/[\\/:]/.test(value)) { return value; }

    // Collecting it in PageVars IS the subscription, so a server variable actually arrives.
    // Client variables live only in the browser and are already in VarDict.
    PageVars[value] = 0;

    if (typeof VarDict[value] !== 'undefined') {
        return (VarDict[value][0] ?? '').toString();
    }

    // Unresolved. Two cases where asking the server would be pointless and would only make the
    // frame flash an error: data has not arrived yet (the value may still be on its way), and the
    // reserved client.* namespace, which can never be a literal path.
    if (typeof firstdata !== 'undefined' && !firstdata) { return ''; }
    if (value.toLowerCase().startsWith('client.')) { return ''; }

    // A single token still unknown after data arrived is static text, matching how the rest of the
    // runtime treats free-form names since schema v68.
    return value;
}

// Builds the authenticated runtime URL for a Document Viewer object. The object names a full path;
// the DocumentViewerAccess matrix on the server decides whether that folder may be served at all, so
// a path nobody listed simply resolves to nothing.
function BuildDocumentViewerUrl(objDom) {
    if (!objDom) { return ''; }

    let configured = objDom.getAttribute("data-documentpath");
    let path = ResolveValueOrVariable(configured);
    if (path === '') { return ''; }

    // A bare token that resolved to itself is a variable whose value has not arrived yet, not a
    // document: a real path always carries a separator or a drive letter, and a bare file name
    // could not be served anyway because the matrix lists folders. Treating it as a path made the
    // frame ask for a file called "System.ReportFile_Daily" and publish "unavailable" for a moment
    // before the variable landed. Waiting is the honest answer.
    if (path === configured && !/[\\/:]/.test(path)) { return ''; }

    let url = BuildWebFrameRuntimeUrl('/Envision?handler=Document&path=' + encodeURIComponent(path));

    // Presentation only: the browser's own viewer chrome. Hiding it is not enforcement.
    if (url !== '' && (objDom.getAttribute("data-toolbar") || 'true').toLowerCase() === 'false') {
        url += '#toolbar=0';
    }

    return url;
}

// ---- Document status and document lists -------------------------------------------------------
//
// An object that shows or lists documents can end up with nothing on screen for four different
// reasons - nothing configured, the server refused, the session expired, the folder is empty - and
// they all look identical to an operator. So an object may name a status variable and publish which
// one it is; the page then words its own message and drives its own visibility from that value.
//
// Client variables only. The status is page-local browser state, not a process value: writing it to
// a server variable would mean write rights, an audit entry and a standby replication for something
// that describes one open browser tab.

const DocumentStatusOk = 'ok';                     // a document loaded / the list has entries
const DocumentStatusNoPath = 'nopath';             // nothing configured, or the bound value is empty
const DocumentStatusEmpty = 'empty';               // the folder holds no matching document
const DocumentStatusUnavailable = 'unavailable';   // the server refused, or it could not be reached
const DocumentStatusSignIn = 'signin';             // the session is gone

function PublishDocumentStatus(objDom, status) {
    if (!objDom) { return; }

    let name = (objDom.getAttribute("data-statusvariable") || "").trim();
    if (name === '' || !name.toLowerCase().startsWith('client.')) { return; }

    // Only on change: this runs from the poll loop, and rewriting localStorage several times a
    // second for a value that did not move is pure churn.
    if (objDom.__documentStatus === status) { return; }
    objDom.__documentStatus = status;

    if (typeof ClientVariableAction === 'function') {
        ClientVariableAction("setvalue", name, status);
    }
}

// Asks the server which documents exist in one folder. Returns null when the request was refused or
// could not be made - the caller turns that into a status, never into an empty list, because "no
// documents" and "not allowed to look" must not read the same on a page.
async function FetchDocumentFiles(folder, pattern, take, from, to) {
    try {
        let url = '/Envision?handler=DocumentFiles&folder=' + encodeURIComponent(folder);

        if (pattern) { url += '&pattern=' + encodeURIComponent(pattern); }
        if (from) { url += '&from=' + encodeURIComponent(from); }
        if (to) { url += '&to=' + encodeURIComponent(to); }
        if (take) { url += '&take=' + encodeURIComponent(take); }

        let response = await fetch(new URL(url, window.location.href).toString(),
            { credentials: 'same-origin', cache: 'no-store' });

        if (!response.ok) {
            return { files: null, status: response.status === 401 ? DocumentStatusSignIn : DocumentStatusUnavailable };
        }

        let data = await response.json();

        return {
            files: data.files || [],
            total: data.total || 0,
            truncated: data.truncated === true,
            status: DocumentStatusOk
        };
    }
    catch {
        return { files: null, status: DocumentStatusUnavailable };
    }
}

// True when this object takes its list from a folder instead of the Items/Values attributes.
function DocumentFileModeEnabled(objDom) {
    return !!objDom && (objDom.getAttribute("data-documentfolder") || "").trim() !== '';
}

function DocumentFileRequest(objDom) {
    if (!DocumentFileModeEnabled(objDom)) { return null; }

    let folder = ResolveValueOrVariable(objDom.getAttribute("data-documentfolder"));
    if (folder === '') { return null; }

    return {
        folder: folder,
        pattern: ResolveValueOrVariable(objDom.getAttribute("data-documentpattern")),
        label: (objDom.getAttribute("data-documentlabel") || 'name').toLowerCase(),
        // Typically bound to client variables written by two ordinary DateTimePickers. Both may name
        // the SAME variable, which is how one picker means one day without a special case.
        from: ResolveValueOrVariable(objDom.getAttribute("data-documentfrom")),
        to: ResolveValueOrVariable(objDom.getAttribute("data-documentto"))
    };
}

// Two different questions, deliberately answered by two different clocks:
//   date     - the day the document is FOR. It exists only where the Pattern spelled the date out, so
//              a document whose format nobody declared shows its file name rather than a date the
//              system made up from the file's own timestamp.
//   datetime - when the file was written, rendered in the operator's own time zone. A fact about the
//              file, always available; the server sends a marked UTC instant so it cannot silently
//              read as local time.
function FormatDocumentFileLabel(file, mode) {
    if (mode === 'date') { return file.date || file.name || ''; }

    if (mode === 'datetime') {
        let written = new Date(file.modifiedUtc);
        return isNaN(written.getTime()) ? (file.name || '') : DocumentFileLocalStamp(written);
    }

    return file.name || '';
}

function DocumentFileLocalStamp(date) {
    let pad = n => (n < 10 ? '0' : '') + n;

    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
        + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

// Turns one answer into the two parallel arrays every selection object already thinks in: what the
// operator reads, and the value that is written to the bound variable. Arrays, never ';' joined
// strings - a file name is allowed to contain a semicolon and that would silently shift every
// label onto the wrong path.
function BuildDocumentFileList(request, answer) {
    let items = [];
    let values = [];

    for (let i = 0; i < answer.files.length; i++) {
        items.push(FormatDocumentFileLabel(answer.files[i], request.label));
        values.push(answer.files[i].path || '');
    }

    return {
        items: items,
        values: values,
        folder: true,
        key: DocumentFileCacheKey(request) + '|' + values.join('')
    };
}

// What the cached listing on an element was fetched FOR. Stamped by whoever stores a listing, so a
// refresh started from a click and one started from the poll loop agree on whether the cache still
// answers the question being asked; without that, an answer fetched on open was thrown away by the
// very next read and the list rendered empty until the second open.
//
// The date bounds are part of it, which is what makes the list follow the date pickers live: the
// operator changes From, the key no longer matches, and the next cycle re-asks the server.
function DocumentFileCacheKey(request) {
    return request.folder + '|' + request.pattern + '|' + request.label
        + '|' + request.from + '|' + request.to;
}

// Fetches the folder listing and caches it ON THE ELEMENT. It is never written back into
// data-items/data-values: those are saved with the page, and one snapshot of a folder taken while
// a designer happened to have the page open is not a design.
async function RefreshDocumentFileItems(objDom) {
    let request = DocumentFileRequest(objDom);
    if (request === null) { return; }

    objDom.__documentFilesPending = true;

    try {
        let answer = await FetchDocumentFiles(request.folder, request.pattern, 0, request.from, request.to);

        objDom.__documentFilesRequest = DocumentFileCacheKey(request);

        if (answer.files === null) {
            objDom.__documentFiles = { items: [], values: [], folder: true, key: 'unavailable' };
            PublishDocumentStatus(objDom, answer.status);
            return;
        }

        objDom.__documentFiles = BuildDocumentFileList(request, answer);

        PublishDocumentStatus(objDom, answer.files.length === 0 ? DocumentStatusEmpty : DocumentStatusOk);
    }
    finally {
        objDom.__documentFilesPending = false;
    }
}

// undefined = this object does not use a folder, null = the first answer has not arrived yet.
function EnsureDocumentFileItems(objDom) {
    let request = DocumentFileRequest(objDom);

    if (request === null) {
        return DocumentFileModeEnabled(objDom) ? null : undefined;
    }

    let cacheKey = DocumentFileCacheKey(request);

    if (objDom.__documentFilesRequest !== cacheKey) {
        objDom.__documentFilesRequest = cacheKey;
        objDom.__documentFiles = null;
        objDom.__documentFilesPending = false;
    }

    if (!objDom.__documentFiles && !objDom.__documentFilesPending) {
        RefreshDocumentFileItems(objDom);
    }

    return objDom.__documentFiles || null;
}

// The one place a DropDown or a ListBox resolves what it shows, in either item source. The
// Items/Values branch is the behaviour those objects have always had, so an object that names no
// folder takes exactly the same path it did before this item source existed.
function GetSelectionListData(objDom) {
    let files = EnsureDocumentFileItems(objDom);
    if (files !== undefined) { return files; }

    let Items = objDom.getAttribute('data-items');
    if (!Items) { return null; }

    if (isVariableName(Items)) {
        PageVars[Items] = 0;
        if (typeof VarDict[Items] !== 'undefined') {
            Items = VarDict[Items][0];
        }
    }

    let items = Items.split(';');

    let Values = objDom.getAttribute('data-values');
    let values;

    if (Values) {
        if (isVariableName(Values)) {
            PageVars[Values] = 0;
            if (typeof VarDict[Values] !== 'undefined') {
                Values = VarDict[Values][0];
            }
        }

        values = Values.split(';');

        if (values.length != items.length) {
            values = items; // values = items
        }
    }
    else {
        values = items;  // values = items
    }

    return { items: items, values: values, key: Items + '|' + (Values || '') };
}

function BuildWebFrameRuntimeUrl(url, forceRefresh = false) {
    if (!url || url.trim() === "") {
        return '';
    }

    var cacheBustValue = WebFrameCacheBustSeed;

    if (forceRefresh) {
        WebFrameCacheBustCounter++;
        cacheBustValue = WebFrameCacheBustSeed + "-" + WebFrameCacheBustCounter;
    }

    try {
        var runtimeUrl = new URL(url, window.location.href);
        runtimeUrl.searchParams.set("_wfcb", cacheBustValue);
        return runtimeUrl.toString();
    }
    catch {
        var cleanedUrl = url.replace(/([?&])_wfcb=[^&]*(&|$)/, function (match, separator, suffix) {
            return suffix === '&' ? separator : '';
        }).replace(/[?&]$/, '');

        return cleanedUrl + (cleanedUrl.includes('?') ? '&' : '?') + "_wfcb=" + encodeURIComponent(cacheBustValue);
    }
}

function SendWebFramePostMessage(iframe) {
    if (!iframe || iframe.getAttribute("data-postmessageenabled")?.toLowerCase() !== 'true') {
        return;
    }

    var message = ParseWebFramePostMessage(iframe.getAttribute("data-postmessage"));
    if (message === null || !iframe.contentWindow) {
        return;
    }

    iframe.contentWindow.postMessage(message, GetWebFramePostMessageTargetOrigin(iframe));
}

function SendWebFramePostMessageDelayed(iframe, delay = 250) {
    if (!iframe || iframe.getAttribute("data-postmessageenabled")?.toLowerCase() !== 'true') {
        return;
    }

    setTimeout(function () {
        SendWebFramePostMessage(iframe);
    }, delay);
}

function EnsureWebFramePostMessageInitialized(iframe, resolvedUrl = '') {
    if (!iframe || iframe.getAttribute("data-postmessageenabled")?.toLowerCase() !== 'true') {
        return;
    }

    var effectiveUrl = resolvedUrl || iframe.src || '';
    if (effectiveUrl === '') {
        return;
    }

    var lastInitializedUrl = iframe.__webFramePostMessageInitializedUrl || '';
    if (lastInitializedUrl === effectiveUrl) {
        return;
    }

    iframe.__webFramePostMessageInitializedUrl = effectiveUrl;

    SendWebFramePostMessageDelayed(iframe);
}

function EnsureWebFramePostMessageHandler(iframe) {
    if (!iframe || iframe.__webFramePostMessageHandlerAttached) {
        return;
    }

    iframe.addEventListener('load', function () {
        SendWebFramePostMessageDelayed(iframe);
    });

    iframe.__webFramePostMessageHandlerAttached = true;
}

function initBarGraph(element)
{
    createBarGraph(element);
}
function initBarGraphs()
{

    var elements = document.getElementById("EnvisionPage").querySelectorAll('.draggable[name="BarGraphObject"]')
    var element = null;
    //console.log({elements})
    for (var i = elements.length; i >= 1; i--)
    { // reverse loop the livenodelist

        element = elements[i - 1];

        initBarGraph(element);
    }

}


function checkids() {
    var nodes = document.querySelectorAll('[id]');
    var ids = {};
    var totalNodes = nodes.length;

    for (var i = 0; i < totalNodes; i++) {
        var currentId = nodes[i].id ? nodes[i].id : "undefined";
        if (isNaN(ids[currentId])) {
            ids[currentId] = 0;
        }
        ids[currentId]++;
    }

    //console.log(ids);
}

function checkgroups() { //necessary for redrawing instances v2023 07 31

    //console.log("CHECKING GROUPS ");

    //var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

    var draggables = document.getElementById("EnvisionPage").querySelectorAll('[name="GroupObject"]');


    var counter = 0;

    for (var i = 0; i < draggables.length; i++) {

        var element = draggables.item(i);

        if (!element.innerHTML.includes('GroupObject')) {
            ResizeGroup2(element)
            //console.log("RESIZING " + element);
            while (element.parentElement.getAttribute('name') == "GroupObject") {

                counter = counter + 1;

                //console.log("RESIZING " + element.parentElement);
                ResizeGroup2(element.parentElement)

                element = element.parentElement;
            }
        }

        //ResizeGroup2(element)
        //console.log("RESIZING " + element);
        //while (element.parentElement.getAttribute('name') == "GroupObject") {

        //    counter = counter + 1;

        //    console.log("RESIZING " + element.parentElement);
        //    ResizeGroup2(element.parentElement)

        //    element = element.parentElement;
        //}

    }

}

function initknob() {

    var elements = document.getElementById("EnvisionPage").getElementsByClassName("knob");
    var element = null;

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        knobtoinit(element);
    }

}

function initsliders() {

    var elements = document.getElementById("EnvisionPage").getElementsByClassName("slider");
    var element = null;

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        slidertoinit(element);
    }

}

function initDonut(element) {

    createDonutChart(element);

    //console.log('initDonut called on ' + el);
}
function initdonuts() {

    var elements = document.getElementById("EnvisionPage").querySelectorAll('.draggable[name="DonutObject"]');
    var element = null;

    for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

        element = elements[i - 1];

        donuttoinit(element);
    }

}

function knobtoinit(element) {

    let variable;
    let readonly;
    let units;

    let MinValue;
    let MaxValue;
    let ValueResolution;
    let FontFamily;
    let FontSize;
    let FontWeight;
    let ZeroAt;
    let AngleMin;
    let AngleMax;
    let BackgroundTrackRadius;
    let BackgroundTrackWidth;
    let TrackRadius;
    let TrackWidth;

    let WriteTimeoutTime;

    let backgroundcolor = "#e6e6e6";
    let nostatecolor = "#34eb3a"


    //MinValue
    if (element.getAttribute("data-MinValue")) {
        MinValue = element.getAttribute("data-MinValue");
    }
    else {
        MinValue = '0';
        element.setAttribute("data-MinValue", MinValue);
    }

    //MaxValue
    if (element.getAttribute("data-MaxValue")) {
        MaxValue = element.getAttribute("data-MaxValue");
    }
    else {
        MaxValue = '100';
        element.setAttribute("data-MaxValue", MaxValue);
    }

    //ValueResolution
    if (element.getAttribute("data-ValueResolution")) {
        ValueResolution = element.getAttribute("data-ValueResolution");
    }
    else {
        ValueResolution = '1';
        element.setAttribute("data-ValueResolution", ValueResolution);
    }

    //FontFamily
    if (element.getAttribute("data-fontfamily")) {
        FontFamily = element.getAttribute("data-fontfamily");
    }
    else {
        FontFamily = 'sans-serif';
        element.setAttribute("data-fontfamily", FontFamily);
    }

    //FontSize
    if (element.getAttribute("data-fontsize")) {
        FontSize = element.getAttribute("data-fontsize");
    }
    else {
        FontSize = '25';
        element.setAttribute("data-fontsize", FontSize);
    }

    //FontWeight
    if (element.getAttribute("data-fontweight")) {
        FontWeight = element.getAttribute("data-fontweight");
    }
    else {
        FontWeight = 'bold';
        element.setAttribute("data-fontweight", FontWeight);
    }

    //ZeroAt
    if (element.getAttribute("data-ZeroAt")) {
        ZeroAt = element.getAttribute("data-ZeroAt");
    }
    else {
        ZeroAt = '260.0';
        element.setAttribute("data-ZeroAt", ZeroAt);
    }

    //AngleMin
    if (element.getAttribute("data-AngleMin")) {
        AngleMin = element.getAttribute("data-AngleMin");
    }
    else {
        AngleMin = '50.0';
        element.setAttribute("data-AngleMin", AngleMin);
    }

    //AngleMax
    if (element.getAttribute("data-AngleMax")) {
        AngleMax = element.getAttribute("data-AngleMax");
    }
    else {
        AngleMax = '290.0';
        element.setAttribute("data-AngleMax", AngleMax);
    }

    //BackgroundTrackRadius
    if (element.getAttribute("data-BackgroundTrackRadius")) {
        BackgroundTrackRadius = element.getAttribute("data-BackgroundTrackRadius");
    }
    else {
        BackgroundTrackRadius = '40';
        element.setAttribute("data-BackgroundTrackRadius", BackgroundTrackRadius);
    }

    //BackgroundTrackWidth
    if (element.getAttribute("data-BackgroundTrackWidth")) {
        BackgroundTrackWidth = element.getAttribute("data-BackgroundTrackWidth");
    }
    else {
        BackgroundTrackWidth = '15';
        element.setAttribute("data-BackgroundTrackWidth", BackgroundTrackWidth);
    }

    //TrackRadius
    if (element.getAttribute("data-TrackRadius")) {
        TrackRadius = element.getAttribute("data-TrackRadius");
    }
    else {
        TrackRadius = '40';
        element.setAttribute("data-TrackRadius", TrackRadius);
    }

    //TrackWidth
    if (element.getAttribute("data-TrackWidth")) {
        TrackWidth = element.getAttribute("data-TrackWidth");
    }
    else {
        TrackWidth = '15';
        element.setAttribute("data-TrackWidth", TrackWidth);
    }

    //WriteTimeoutTime
    if (element.getAttribute("data-writetimeouttime")) {
        WriteTimeoutTime = element.getAttribute("data-writetimeouttime");
    }
    else {
        WriteTimeoutTime = '10';
        element.setAttribute("data-writetimeouttime", WriteTimeoutTime);
    }


    if (element.getAttribute("data-backgroundcolor")) {
        backgroundcolor = element.getAttribute("data-backgroundcolor");
    }

    if (element.getAttribute("data-nostatecolor")) {
        nostatecolor = element.getAttribute("data-nostatecolor");
    }

    //console.log(element);


    document.getElementById([element.id]).removeEventListener("onchange", KnobValueChanged);

    var Knob = svgKnob.default;
    var k = new Knob(element.id, {
        /*rotation: "CW",*/
        initial_value: 0,
        value_min: parseFloat(MinValue),
        value_max: parseFloat(MaxValue),
        //center_zero: false,
        //center_value: null,   
        //center_gap: 4,

        zero_at: parseFloat(ZeroAt),             // [deg] (polar) the 0 degree will be at 270 polar degrees (6 o'clock).
        angle_min: parseFloat(AngleMin),         // [deg] Angle in knob coordinates (0 at 6 0'clock)
        angle_max: parseFloat(AngleMax),         // [deg] Angle in knob coordinates (0 at 6 0'clock)

        //zero_at: 270.0,             // [deg] (polar) the 0 degree will be at 270 polar degrees (6 o'clock).
        //angle_min: 5.0,            // [deg] Angle in knob coordinates (0 at 6 0'clock)
        //angle_max: 355.0,           // [deg] Angle in knob coordinates (0 at 6 0'clock)

        //bg_radius: 40,
        //bg_border_width: 1,

        track_bg_radius: BackgroundTrackRadius,
        track_bg_width: BackgroundTrackWidth,

        // track:
        track_radius: TrackRadius,
        track_width: TrackWidth,

        /*rotation: "CW",*/

        // cursor
        //cursor_radius: 18,          // same unit as radius
        //cursor_length: 10,
        //cursor_width: 4,


        //bg_color: '#B1DAEE',
        /*            bg_border_color: nostatecolor,*/
        track_bg_color: backgroundcolor,
        /* track_color_init: '#569DC0',*/
        track_color: nostatecolor,
        //cursor_color_init: '#569DC0',
        //cursor_color: '#1D6D93',
        //markers_color: '#3680A4',
        font_color: backgroundcolor,
        font_family: FontFamily,
        font_size: FontSize,
        font_weight: FontWeight,
        onchange: function () { KnobValueChanged(element); }
    });

    KnobsDict[element.id] = k;
}

function slidertoinit(element) {

    let Variable;

    let MinValue;
    let MaxValue;
    let ValueResolution;

    let backgroundcolor;
    let trackcolor;
    let TrackBorderWidth;
    let TrackBorderRadius;
    let trackbordercolor;

    let ThumbWidth;
    let ThumbHeight;
    let thumbcolor;
    let ThumbBorderWidth;
    let ThumbBorderRadius;
    let thumbbordercolor;

    //Variable
    if (element.getAttribute("data-variable")) {
        Variable = element.getAttribute("data-variable");
    }
    else {
        Variable = '';
        element.setAttribute("data-variable", Variable);
    }

    //MinValue
    if (element.getAttribute("data-minvalue")) {
        MinValue = element.getAttribute("data-minvalue");
    }
    else {
        MinValue = '0';
        element.setAttribute("data-minvalue", MinValue);
    }

    //MaxValue
    if (element.getAttribute("data-maxvalue")) {
        MaxValue = element.getAttribute("data-maxvalue");
    }
    else {
        MaxValue = '100';
        element.setAttribute("data-maxvalue", MaxValue);
    }

    //ValueResolution
    if (element.getAttribute("data-valueresolution")) {
        ValueResolution = element.getAttribute("data-valueresolution");
    }
    else {
        ValueResolution = '1';
        element.setAttribute("data-valueresolution", ValueResolution);
    }

    //backgroundcolor
    if (element.getAttribute("data-backgroundcolor")) {
        backgroundcolor = element.getAttribute("data-backgroundcolor");
    }
    else {
        backgroundcolor = "#fff";
        element.setAttribute("data-backgroundcolor", backgroundcolor);
    }

    //trackcolor
    if (element.getAttribute("data-trackcolor")) {
        trackcolor = element.getAttribute("data-trackcolor");
    }
    else {
        trackcolor = "#EEE";
        element.setAttribute("data-trackcolor", trackcolor);
    }

    //TrackBorderWidth
    if (element.getAttribute("data-trackborderwidth")) {
        TrackBorderWidth = element.getAttribute("data-trackborderwidth");
    }
    else {
        TrackBorderWidth = '1px';
        element.setAttribute("data-trackborderwidth", TrackBorderWidth);
    }

    //TrackBorderRadius
    if (element.getAttribute("data-trackborderradius")) {
        TrackBorderRadius = element.getAttribute("data-trackborderradius");
    }
    else {
        TrackBorderRadius = '5px';
        element.setAttribute("data-trackborderradius", TrackBorderRadius);
    }

    //trackbordercolor
    if (element.getAttribute("data-trackbordercolor")) {
        trackbordercolor = element.getAttribute("data-trackbordercolor");
    }
    else {
        trackbordercolor = "#000";
        element.setAttribute("data-trackbordercolor", trackbordercolor);
    }

    //ThumbWidth
    if (element.getAttribute("data-thumbwidth")) {
        ThumbWidth = element.getAttribute("data-thumbwidth");
    }
    else {
        ThumbWidth = '30px';
        element.setAttribute("data-thumbwidth", ThumbWidth);
    }

    //ThumbHeight
    if (element.getAttribute("data-thumbheight")) {
        ThumbHeight = element.getAttribute("data-thumbheight");
    }
    else {
        ThumbHeight = '30px';
        element.setAttribute("data-thumbheight", ThumbHeight);
    }

    //thumbcolor
    if (element.getAttribute("data-thumbcolor")) {
        thumbcolor = element.getAttribute("data-thumbcolor");
    }
    else {
        thumbcolor = "#EEE";
        element.setAttribute("data-thumbcolor", thumbcolor);
    }

    //ThumbBorderWidth
    if (element.getAttribute("data-thumbborderwidth")) {
        ThumbBorderWidth = element.getAttribute("data-thumbborderwidth");
    }
    else {
        ThumbBorderWidth = '1px';
        element.setAttribute("data-thumbborderwidth", ThumbBorderWidth);
    }

    //ThumbBorderRadius
    if (element.getAttribute("data-thumbborderradius")) {
        ThumbBorderRadius = element.getAttribute("data-thumbborderradius");
    }
    else {
        ThumbBorderRadius = '20%';
        element.setAttribute("data-thumbborderradius", ThumbBorderRadius);
    }

    //thumbbordercolor
    if (element.getAttribute("data-thumbbordercolor")) {
        thumbbordercolor = element.getAttribute("data-thumbbordercolor");
    }
    else {
        thumbbordercolor = "#000";
        element.setAttribute("data-thumbbordercolor", thumbbordercolor);
    }

    //FontFamily
    if (element.getAttribute("data-fontfamily")) {
        FontFamily = element.getAttribute("data-fontfamily");
    }
    else {
        FontFamily = 'sans-serif';
        element.setAttribute("data-fontfamily", FontFamily);
    }

    //FontSize
    if (element.getAttribute("data-fontsize")) {
        FontSize = element.getAttribute("data-fontsize");
    }
    else {
        FontSize = '18px';
        element.setAttribute("data-fontsize", FontSize);
    }

    //FontWeight
    if (element.getAttribute("data-fontweight")) {
        FontWeight = element.getAttribute("data-fontweight");
    }
    else {
        FontWeight = 'normal';
        element.setAttribute("data-fontweight", FontWeight);
    }

    //textcolor
    if (element.getAttribute("data-textcolor")) {
        textcolor = element.getAttribute("data-textcolor");
    }
    else {
        textcolor = "#000";
        element.setAttribute("data-textcolor", textcolor);
    }

    //FeedbackMarginTop
    if (element.getAttribute("data-feedbackmargintop")) {
        FeedbackMarginTop = element.getAttribute("data-feedbackmargintop");
    }
    else {
        FeedbackMarginTop = '-30px';
        element.setAttribute("data-feedbackmargintop", FeedbackMarginTop);
    }

    //writetimeouttime
    if (element.getAttribute("data-writetimeouttime")) {
        writetimeouttime = element.getAttribute("data-writetimeouttime");
    }
    else {
        writetimeouttime = '10';
        element.setAttribute("data-writetimeouttime", writetimeouttime);
        element.setAttribute("data-writetimeout", 0);
    }

    //texthidden
    if (element.getAttribute("data-texthidden")) {
        texthidden = element.getAttribute("data-texthidden");
    }
    else {
        texthidden = 'false';
        element.setAttribute("data-texthidden", texthidden);
    }

    element.setAttribute("se-step", ValueResolution);
    element.setAttribute("se-min", MinValue);
    element.setAttribute("se-max", MaxValue);

    var slider = element;
    var touchLeftThumb = slider.querySelector('.slider-touch-left span');
    var lineSpan = slider.querySelector('.slider-line');
    var lineSpanTrack = slider.querySelector('.slider-line span');
    var sliderfeedback = slider.querySelector('.slider-feedback');

    //console.log(element);

    lineSpan.style.backgroundColor = GetObjectColor(trackcolor);
    lineSpanTrack.style.backgroundColor = GetObjectColor(backgroundcolor);

    lineSpan.style.borderWidth = TrackBorderWidth;
    lineSpan.style.borderColor = GetObjectColor(trackbordercolor);
    lineSpan.style.borderRadius = TrackBorderRadius;

    setthumbwidth(element, ThumbWidth);
    setthumbheight(element, ThumbHeight);

    touchLeftThumb.style.backgroundColor = GetObjectColor(thumbcolor);
    touchLeftThumb.style.borderColor = GetObjectColor(thumbbordercolor);
    //console.log(thumbbordercolor);
    touchLeftThumb.style.borderWidth = ThumbBorderWidth;
    touchLeftThumb.style.borderRadius = ThumbBorderRadius;

    sliderfeedback.style.fontFamily = FontFamily;
    sliderfeedback.style.fontSize = FontSize;
    sliderfeedback.style.fontWeight = FontWeight;
    sliderfeedback.style.marginTop = FeedbackMarginTop;
    sliderfeedback.style.color = GetObjectColor(textcolor);

    if (texthidden === 'true') {

        if (!sliderfeedback.classList.contains('is-invisible')) {
            sliderfeedback.classList.add('is-invisible');
            sliderfeedback.classList.remove('is-visible');
        }

    }
    else {

        if (!sliderfeedback.classList.contains('is-visible')) {
            sliderfeedback.classList.add('is-visible');
            sliderfeedback.classList.remove('is-invisible');
        }

    }

    element = RemoveAllEventListeners(element);

    var newRangeSlider = new ZBRangeSlider(element);

    newRangeSlider.onChange = function (min, max) {
        //console.log(min, max, this);
        //document.getElementById('result').innerHTML = 'Min: ' + min + ' Max: ' + max;
    }

    newRangeSlider.didChanged = function (min, max) {
        //console.log(min, max, this);
        //document.getElementById('result').innerHTML = 'Min: ' + min + ' Max: ' + max;
    }

    //call reset if needed
    newRangeSlider.reset();

    if (VarDict[Variable]) {
        newRangeSlider.setMinValue(VarDict[Variable][0]);
    }

    SlidersDict[element.id] = newRangeSlider;
}

function donuttoinit(element) {

    initDonut(element);

    return;

    //const data = [
    //    { value: 30, color: '#D7AF00', label: 'Label 1' },
    //    { value: 90, color: '#C3E100', label: 'Label 2' },
    //    { value: 50, color: '#A14F40', label: 'Label 3' }
    //];
    
    //createDonutChart(element, data);

    return; 

    let Variable;

    let MinValue;
    let MaxValue;
    let ValueResolution;

    let backgroundcolor;
    let trackcolor;
    let TrackBorderWidth;
    let TrackBorderRadius;
    let trackbordercolor;

    let ThumbWidth;
    let ThumbHeight;
    let thumbcolor;
    let ThumbBorderWidth;
    let ThumbBorderRadius;
    let thumbbordercolor;

    //Variable
    if (element.getAttribute("data-variable")) {
        Variable = element.getAttribute("data-variable");
    }
    else {
        Variable = '';
        element.setAttribute("data-variable", Variable);
    }

    //MinValue
    if (element.getAttribute("data-minvalue")) {
        MinValue = element.getAttribute("data-minvalue");
    }
    else {
        MinValue = '0';
        element.setAttribute("data-minvalue", MinValue);
    }

    //MaxValue
    if (element.getAttribute("data-maxvalue")) {
        MaxValue = element.getAttribute("data-maxvalue");
    }
    else {
        MaxValue = '100';
        element.setAttribute("data-maxvalue", MaxValue);
    }

    //ValueResolution
    if (element.getAttribute("data-valueresolution")) {
        ValueResolution = element.getAttribute("data-valueresolution");
    }
    else {
        ValueResolution = '1';
        element.setAttribute("data-valueresolution", ValueResolution);
    }

    //backgroundcolor
    if (element.getAttribute("data-backgroundcolor")) {
        backgroundcolor = element.getAttribute("data-backgroundcolor");
    }
    else {
        backgroundcolor = "#fff";
        element.setAttribute("data-backgroundcolor", backgroundcolor);
    }

    //trackcolor
    if (element.getAttribute("data-trackcolor")) {
        trackcolor = element.getAttribute("data-trackcolor");
    }
    else {
        trackcolor = "#EEE";
        element.setAttribute("data-trackcolor", trackcolor);
    }

    //TrackBorderWidth
    if (element.getAttribute("data-trackborderwidth")) {
        TrackBorderWidth = element.getAttribute("data-trackborderwidth");
    }
    else {
        TrackBorderWidth = '1px';
        element.setAttribute("data-trackborderwidth", TrackBorderWidth);
    }

    //TrackBorderRadius
    if (element.getAttribute("data-trackborderradius")) {
        TrackBorderRadius = element.getAttribute("data-trackborderradius");
    }
    else {
        TrackBorderRadius = '5px';
        element.setAttribute("data-trackborderradius", TrackBorderRadius);
    }

    //trackbordercolor
    if (element.getAttribute("data-trackbordercolor")) {
        trackbordercolor = element.getAttribute("data-trackbordercolor");
    }
    else {
        trackbordercolor = "#000";
        element.setAttribute("data-trackbordercolor", trackbordercolor);
    }

    //ThumbWidth
    if (element.getAttribute("data-thumbwidth")) {
        ThumbWidth = element.getAttribute("data-thumbwidth");
    }
    else {
        ThumbWidth = '30px';
        element.setAttribute("data-thumbwidth", ThumbWidth);
    }

    //ThumbHeight
    if (element.getAttribute("data-thumbheight")) {
        ThumbHeight = element.getAttribute("data-thumbheight");
    }
    else {
        ThumbHeight = '30px';
        element.setAttribute("data-thumbheight", ThumbHeight);
    }

    //thumbcolor
    if (element.getAttribute("data-thumbcolor")) {
        thumbcolor = element.getAttribute("data-thumbcolor");
    }
    else {
        thumbcolor = "#EEE";
        element.setAttribute("data-thumbcolor", thumbcolor);
    }

    //ThumbBorderWidth
    if (element.getAttribute("data-thumbborderwidth")) {
        ThumbBorderWidth = element.getAttribute("data-thumbborderwidth");
    }
    else {
        ThumbBorderWidth = '1px';
        element.setAttribute("data-thumbborderwidth", ThumbBorderWidth);
    }

    //ThumbBorderRadius
    if (element.getAttribute("data-thumbborderradius")) {
        ThumbBorderRadius = element.getAttribute("data-thumbborderradius");
    }
    else {
        ThumbBorderRadius = '20%';
        element.setAttribute("data-thumbborderradius", ThumbBorderRadius);
    }

    //thumbbordercolor
    if (element.getAttribute("data-thumbbordercolor")) {
        thumbbordercolor = element.getAttribute("data-thumbbordercolor");
    }
    else {
        thumbbordercolor = "#000";
        element.setAttribute("data-thumbbordercolor", thumbbordercolor);
    }

    //FontFamily
    if (element.getAttribute("data-fontfamily")) {
        FontFamily = element.getAttribute("data-fontfamily");
    }
    else {
        FontFamily = 'sans-serif';
        element.setAttribute("data-fontfamily", FontFamily);
    }

    //FontSize
    if (element.getAttribute("data-fontsize")) {
        FontSize = element.getAttribute("data-fontsize");
    }
    else {
        FontSize = '18px';
        element.setAttribute("data-fontsize", FontSize);
    }

    //FontWeight
    if (element.getAttribute("data-fontweight")) {
        FontWeight = element.getAttribute("data-fontweight");
    }
    else {
        FontWeight = 'normal';
        element.setAttribute("data-fontweight", FontWeight);
    }

    //textcolor
    if (element.getAttribute("data-textcolor")) {
        textcolor = element.getAttribute("data-textcolor");
    }
    else {
        textcolor = "#000";
        element.setAttribute("data-textcolor", textcolor);
    }

    //FeedbackMarginTop
    if (element.getAttribute("data-feedbackmargintop")) {
        FeedbackMarginTop = element.getAttribute("data-feedbackmargintop");
    }
    else {
        FeedbackMarginTop = '-30px';
        element.setAttribute("data-feedbackmargintop", FeedbackMarginTop);
    }

    //writetimeouttime
    if (element.getAttribute("data-writetimeouttime")) {
        writetimeouttime = element.getAttribute("data-writetimeouttime");
    }
    else {
        writetimeouttime = '10';
        element.setAttribute("data-writetimeouttime", writetimeouttime);
        element.setAttribute("data-writetimeout", 0);
    }

    //texthidden
    if (element.getAttribute("data-texthidden")) {
        texthidden = element.getAttribute("data-texthidden");
    }
    else {
        texthidden = 'false';
        element.setAttribute("data-texthidden", texthidden);
    }

    element.setAttribute("se-step", ValueResolution);
    element.setAttribute("se-min", MinValue);
    element.setAttribute("se-max", MaxValue);

    var donut = element;
    var touchLeftThumb = donut.querySelector('.donut-touch-left span');
    var lineSpan = donut.querySelector('.donut-line');
    var lineSpanTrack = donut.querySelector('.donut-line span');
    var donutfeedback = donut.querySelector('.donut-feedback');

    //console.log(element);

    lineSpan.style.backgroundColor = GetObjectColor(trackcolor);
    lineSpanTrack.style.backgroundColor = GetObjectColor(backgroundcolor);

    lineSpan.style.borderWidth = TrackBorderWidth;
    lineSpan.style.borderColor = GetObjectColor(trackbordercolor);
    lineSpan.style.borderRadius = TrackBorderRadius;

    setthumbwidth(element, ThumbWidth);
    setthumbheight(element, ThumbHeight);

    touchLeftThumb.style.backgroundColor = GetObjectColor(thumbcolor);
    touchLeftThumb.style.borderColor = GetObjectColor(thumbbordercolor);
    //console.log(thumbbordercolor);
    touchLeftThumb.style.borderWidth = ThumbBorderWidth;
    touchLeftThumb.style.borderRadius = ThumbBorderRadius;

    donutfeedback.style.fontFamily = FontFamily;
    donutfeedback.style.fontSize = FontSize;
    donutfeedback.style.fontWeight = FontWeight;
    donutfeedback.style.marginTop = FeedbackMarginTop;
    donutfeedback.style.color = GetObjectColor(textcolor);

    if (texthidden === 'true') {

        if (!donutfeedback.classList.contains('is-invisible')) {
            donutfeedback.classList.add('is-invisible');
            donutfeedback.classList.remove('is-visible');
        }

    }
    else {

        if (!donutfeedback.classList.contains('is-visible')) {
            donutfeedback.classList.add('is-visible');
            donutfeedback.classList.remove('is-invisible');
        }

    }

    element = RemoveAllEventListeners(element);

    var newRangeSlider = new ZBRangeSlider(element);

    newRangeSlider.onChange = function (min, max) {
        //console.log(min, max, this);
        //document.getElementById('result').innerHTML = 'Min: ' + min + ' Max: ' + max;
    }

    newRangeSlider.didChanged = function (min, max) {
        //console.log(min, max, this);
        //document.getElementById('result').innerHTML = 'Min: ' + min + ' Max: ' + max;
    }

    //call reset if needed
    newRangeSlider.reset();

    if (VarDict[Variable]) {
        newRangeSlider.setMinValue(VarDict[Variable][0]);
    }

    SlidersDict[element.id] = newRangeSlider;
}

function initparametersdropdown(element) {

    var button = element;
    var ul = element.parentElement.getElementsByTagName("ul")[0];

    let compStylesButton = window.getComputedStyle(button);
    let compStylesUL = window.getComputedStyle(ul);

    //Variable
    if (element.getAttribute("data-variable")) {
        Variable = element.getAttribute("data-variable");
    }
    else {
        Variable = '';
        element.setAttribute("data-variable", Variable);
    }

    //Values
    if (element.getAttribute("data-values")) {
        Values = element.getAttribute("data-values");
    }
    else {
        Values = '1;2;3';
        element.setAttribute("data-values", Values);
    }

    //items
    if (element.getAttribute("data-items")) {
        items = element.getAttribute("data-items");
    }
    else {
        items = 'Item1;Item2;Item3';
        element.setAttribute("data-items", items);
    }

    //colorboxpicker
    if (element.getAttribute("data-colorboxpicker")) {
        colorboxpicker = element.getAttribute("data-colorboxpicker");
    }
    else {
        colorboxpicker = compStylesButton.getPropertyValue('color');
        element.setAttribute("data-colorboxpicker", colorboxpicker);
    }

    //colorlistpicker
    if (element.getAttribute("data-colorlistpicker")) {
        colorlistpicker = element.getAttribute("data-colorlistpicker");
    }
    else {
        colorlistpicker = compStylesUL.getPropertyValue('color');
        element.setAttribute("data-colorlistpicker", colorlistpicker);
    }

    //backgroundboxcolorpicker
    if (element.getAttribute("data-backgroundboxcolorpicker")) {
        backgroundboxcolorpicker = element.getAttribute("data-backgroundboxcolorpicker");
    }
    else {
        backgroundboxcolorpicker = compStylesButton.getPropertyValue('background-color');
        element.setAttribute("data-backgroundboxcolorpicker", backgroundboxcolorpicker);
    }

    //backgroundlistcolorpicker
    if (element.getAttribute("data-backgroundlistcolorpicker")) {
        backgroundlistcolorpicker = element.getAttribute("data-backgroundlistcolorpicker");
    }
    else {
        backgroundlistcolorpicker = compStylesUL.getPropertyValue('background-color');
        element.setAttribute("data-backgroundlistcolorpicker", backgroundlistcolorpicker);
    }

    //borderboxcolorpicker
    if (element.getAttribute("data-borderboxcolorpicker")) {
        borderboxcolorpicker = element.getAttribute("data-borderboxcolorpicker");
    }
    else {
        borderboxcolorpicker = compStylesButton.getPropertyValue('border-color');
        element.setAttribute("data-borderboxcolorpicker", borderboxcolorpicker);
    }

    //borderlistcolorpicker
    if (element.getAttribute("data-borderlistcolorpicker")) {
        borderlistcolorpicker = element.getAttribute("data-borderlistcolorpicker");
    }
    else {
        borderlistcolorpicker = compStylesUL.getPropertyValue('border-color');
        element.setAttribute("data-borderlistcolorpicker", borderlistcolorpicker);
    }


    
    if (element.getAttribute("data-listheight")) {
        listheight = element.getAttribute("data-listheight");
    }
    else {
        let maxheight = compStylesUL.getPropertyValue('max-height');
        listheight = parseInt(maxheight);
        if (isNaN(listheight) || listheight <= 0) {
            listheight = 250;
        }
        element.setAttribute("data-listheight", listheight);
    }

   
    if (element.getAttribute("data-scrollbarcolor")) {
        scrollbarcolor = element.getAttribute("data-scrollbarcolor");
    }
    else {
        scrollbarcolor = "deepskyblue";
        element.setAttribute("data-scrollbarcolor", scrollbarcolor);
    }

    if (element.getAttribute("data-scrollbartrackcolor")) {
        scrollbartrackcolor = element.getAttribute("data-scrollbartrackcolor");
    }
    else {
        scrollbartrackcolor = "#e8e8e8";
        element.setAttribute("data-scrollbartrackcolor", scrollbartrackcolor);
    }
}


function initparameterslistbox(element) {

    //Variable
    if (element.getAttribute("data-variable")) {
        Variable = element.getAttribute("data-variable");
    }
    else {
        Variable = '';
        element.setAttribute("data-variable", Variable);
    }

    //Values
    if (element.getAttribute("data-values")) {
        Values = element.getAttribute("data-values");
    }
    else {
        Values = '1;2;3';
        element.setAttribute("data-values", Values);
    }

    //items
    if (element.getAttribute("data-items")) {
        items = element.getAttribute("data-items");
    }
    else {
        items = 'Item1;Item2;Item3';
        element.setAttribute("data-items", items);
    }

    //colorpicker
    if (element.getAttribute("data-colorpicker")) {
        colorpicker = element.getAttribute("data-colorpicker");
    }
    else {
        colorpicker = "#000000";
        element.setAttribute("data-colorpicker", colorpicker);
    }

    //backgroundcolorpicker
    if (element.getAttribute("data-backgroundcolorpicker")) {
        backgroundcolorpicker = element.getAttribute("data-backgroundcolorpicker");
    }
    else {
        backgroundcolorpicker = "#ffffff";
        element.setAttribute("data-backgroundcolorpicker", backgroundcolorpicker);
    }

    //bordercolorpicker
    if (element.getAttribute("data-bordercolorpicker")) {
        bordercolorpicker = element.getAttribute("data-bordercolorpicker");
    }
    else {
        bordercolorpicker = "#cccccc";
        element.setAttribute("data-bordercolorpicker", bordercolorpicker);
    }


    //scrollbarcolor
    if (element.getAttribute("data-scrollbarcolor")) {
        scrollbarcolor = element.getAttribute("data-scrollbarcolor");
    }
    else {
        scrollbarcolor = "deepskyblue";
        element.setAttribute("data-scrollbarcolor", scrollbarcolor);
    }

    //scrollbartrackcolor
    if (element.getAttribute("data-scrollbartrackcolor")) {
        scrollbartrackcolor = element.getAttribute("data-scrollbartrackcolor");
    }
    else {
        scrollbartrackcolor = "#e8e8e8";
        element.setAttribute("data-scrollbartrackcolor", scrollbartrackcolor);
    }

    //selectedbackgroundcolor
    if (element.getAttribute("data-selectedbackgroundcolor")) {
        selectedbackgroundcolor = element.getAttribute("data-selectedbackgroundcolor");
    }
    else {
        selectedbackgroundcolor = "#0d6efd";
        element.setAttribute("data-selectedbackgroundcolor", selectedbackgroundcolor);
    }

    //selectedtextcolor
    if (element.getAttribute("data-selectedtextcolor")) {
        selectedtextcolor = element.getAttribute("data-selectedtextcolor");
    }
    else {
        selectedtextcolor = "#ffffff";
        element.setAttribute("data-selectedtextcolor", selectedtextcolor);
    }

    //multiselect
    if (!element.getAttribute("data-multiselect")) {
        element.setAttribute("data-multiselect", "false");
    }

}

function RemoveAllEventListeners(element) {
    var old_element = element;
    var new_element = old_element.cloneNode(true);
    old_element.parentNode.replaceChild(new_element, old_element);
    return new_element;
}

function KnobValueChanged(el) {

    if (EditMode === true) { return; } // not accidently trigger action during editing

    if (el.getAttribute("data-readonly") === 'true') { return; }

    var value = el.getAttribute('data-valueposition');

    if (value !== el.getAttribute("data-lastvalue")) {

        var action = "setvalue";
        var variable = el.getAttribute("data-variable");

        //console.log(value);

        el.setAttribute("data-lastvalue", value);
        DoAction(action, variable, value);
    }

    el.setAttribute('data-writetimeout', el.getAttribute("data-writetimeouttime"));

}

// Query the table


// Query all headers

function makecolumncolumnsmoveableAlarmbanner(table) {

    var cols = table.querySelectorAll('th');

    var counter = 0;
    // Loop over them
    [].forEach.call(cols, function (col) {
        // Create a resizer element

        //console.log(col.className);

        if (col.className.includes("AlarmBannerIconHeaderColumn") || col.className.includes("AlarmBannerAckHeaderColumn") || col.className.includes("AlarmBannerRemoveHeaderColumn") || col.className.includes("AlarmBannerAckCommentHeaderColumn")) { // icon column
            //do not add resizer
        }
        else {
            var resizers = col.getElementsByClassName("resizer");

            if (resizers) {
                while (resizers.length > 1) {
                    resizers[0].parentNode.removeChild(resizers[0]);
                }
            }

            var resizer;

            if (resizers[0]) {
                resizer = resizers[0];
            }
            else {
                resizer = document.createElement('div');
                resizer.classList.add('resizer');
                resizer.style.height = `${table.offsetHeight}px`;
                col.appendChild(resizer);
            }

            // Will be implemented in the next section
            createResizableColumn(col, resizer);
        }

        counter = counter + 1;
        
    });
}

function makecolumncolumnsmoveable(table) {

    var cols = table.querySelectorAll('th');

    // Loop over them
    [].forEach.call(cols, function (col) {
        // Create a resizer element

        var resizers = col.getElementsByClassName("resizer");

        if (resizers) {
            while (resizers.length > 1) {
                resizers[0].parentNode.removeChild(resizers[0]);
            }
        }

        var resizer;

        if (resizers[0]) {
            resizer = resizers[0];
        }
        else {
            resizer = document.createElement('div');
            resizer.classList.add('resizer');
            resizer.style.height = `${table.offsetHeight}px`;
            col.appendChild(resizer);
        }

        // Will be implemented in the next section
        createResizableColumn(col, resizer);
    });
}

const createResizableColumn = function (col, resizer) {

    // Track the current position of mouse
    let x = 0;
    let w = 0;

    const mouseDownHandler = function (e) {
        // Get the current mouse position
        x = e.clientX;

        // Calculate the current width of column
        const styles = window.getComputedStyle(col);
        w = parseInt(styles.width, 10);

        // Attach listeners for document's events
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function (e) {
        draggingcolumn = true;
        // Determine how far the mouse has been moved
        const dx = e.clientX - x;

        // Update the width of column
        col.style.width = `${w + dx}px`;
    };

    // When user releases the mouse, remove the existing event listeners
    const mouseUpHandler = function () {
        draggingcolumn = false;

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    resizer.addEventListener('mousedown', mouseDownHandler);
};

const mouseDownHandler = function (e) {
    resizer.classList.add('resizing');
};

const mouseUpHandler = function () {
    resizer.classList.remove('resizing');
};

function EnvisionPageBindRecipeValueNumpad() {
    var ep = document.getElementById("EnvisionPage");
    if (!ep) {
        return;
    }
    if (ep._envisionPageNumpadFocusIn) {
        ep.removeEventListener("focusin", ep._envisionPageNumpadFocusIn, true);
        ep._envisionPageNumpadFocusIn = null;
    }
    if (ep._envisionPageEnterKeydown) {
        ep.removeEventListener("keydown", ep._envisionPageEnterKeydown, true);
        ep._envisionPageEnterKeydown = null;
    }
    if (ep._recipeValueNumpadFocusIn) {
        ep.removeEventListener("focusin", ep._recipeValueNumpadFocusIn, true);
    }
    ep._recipeValueNumpadFocusIn = function (e) {
        var t = e.target;
        if (t && t.classList && t.classList.contains("rm-recipe-value")) {
            RecipeManagerOnParameterInputFocus(t);
        }
    };
    ep.addEventListener("focusin", ep._recipeValueNumpadFocusIn, true);

    if (ep._recipeValueNumpadKeydown) {
        ep.removeEventListener("keydown", ep._recipeValueNumpadKeydown, true);
    }
    ep._recipeValueNumpadKeydown = function (e) {
        if (e.keyCode === 13 && !e.shiftKey && e.target && e.target.classList && e.target.classList.contains("rm-recipe-value")) {
            e.preventDefault();
            ep.focus();
        }
    };
    ep.addEventListener("keydown", ep._recipeValueNumpadKeydown, true);
}

// ON ENTER INPUT LABEL
function ResetOnEnters() {

    $(".inputobject").keydown(function (e) {
        // Enter was pressed without shift key
        if (e.keyCode == 13 && !e.shiftKey) {
            // prevent default behavior
            e.preventDefault();

            document.getElementById('EnvisionPage').focus();
        }
    });

    $(".labelobject").keydown(function (e) {
        // Enter was pressed without shift key
        if (e.keyCode == 13 && !e.shiftKey) {
            // prevent default behavior
            e.preventDefault();

            document.getElementById('EnvisionPage').focus();
        }
    });

    $(".inputobject").focus(function (e) {
        RecipeManagerOnParameterInputFocus(e.target);
        return false;
    });

    EnvisionPageBindRecipeValueNumpad();

}

//function SetAddEventListenerEnterInput(dom) {

//    document.removeEventListener('keyup', InputEnter);
//    document.removeEventListener('mousedown', InputReject);

//    dom.addEventListener('keyup', InputEnter);

//    dom.addEventListener('mousedown', InputReject);
//}

//function InputEnter(e) {
//    if (e.which == 13) {
//        document.getElementById('EnvisionPage').focus();
//    }
//}

//function LabelEnter(e) {
//    if (e.which == 13) {
//        document.getElementById('EnvisionPage').focus();
//    }
//}

function InputReject(e) {
    if (e.which == 1 && this === document.activeElement) {
        e.stopPropagation();
        //console.log('reject');
    }
}

// drop down
async function DropDownClicked(element) {

    if (EditMode) {
        let dropdownEl = new bootstrap.Dropdown(element);
        dropdownEl.toggle();
        return;
    }

    // Folder item source only: re-read the folder every time the operator opens the list, so a
    // report rendered while the page was open is there. Nothing is polled - the moment the list is
    // looked at is the only moment it has to be right. An object without a folder never reaches
    // this await, so it stays as synchronous as it has always been.
    if (DocumentFileModeEnabled(element)) {
        await RefreshDocumentFileItems(element);
    }

    var ul = element.parentElement.getElementsByTagName("ul")[0];
    var listheight = parseInt(element.getAttribute('data-listheight'));
    if (isNaN(listheight) || listheight <= 0) {
        listheight = 250;
    }
    ul.style.maxHeight = listheight + "px";
    ul.style.overflowY = "auto";

    var scrollbarcolor = element.getAttribute('data-scrollbarcolor');
    if (!scrollbarcolor) {
        scrollbarcolor = "deepskyblue";
    }
    ul.style.setProperty('--dropdown-scrollbar-color', GetObjectColor(scrollbarcolor));

    var scrollbartrackcolor = element.getAttribute('data-scrollbartrackcolor');
    if (!scrollbartrackcolor) {
        scrollbartrackcolor = "#e8e8e8";
    }
    ul.style.setProperty('--dropdown-scrollbar-track-color', GetObjectColor(scrollbartrackcolor));

    ul.innerHTML = "";

    var listdata = GetSelectionListData(element);

    if (!listdata) {
        return;
    }

    var lis = "";

    var dropdownitems = listdata.items;
    var dropdownvalues = listdata.values;

    //console.log('dropdownvalues ' + dropdownvalues);
    //console.log('dropdownitems ' + dropdownitems);

    // Resolved: the value may be a Color Library name, which is not valid CSS on its own.
    var colorlistpicker = GetObjectColor(element.getAttribute('data-colorlistpicker'));
    var backgroundlistcolorpicker = GetObjectColor(element.getAttribute('data-backgroundlistcolorpicker'));

    for (var i = 0; i < dropdownitems.length; i++) {

        if (dropdownitems[i] != "") {

            var item = dropdownitems[i];

            var selectedLang = VarDict["client.SelectedLanguageCode"]?.[0];
            var translation = LanguagesFileJson?.[item]?.[selectedLang];

            if (translation) {
                item = translation;
            }

            //console.log(item);

            // The label of a configured item is still markup, which projects rely on. A label that
            // came from a folder is a file name chosen by whoever writes there, so it is escaped -
            // as is every item value, which now routinely holds a path.
            if (listdata.folder) { item = EscapeHtmlText(item); }

            lis = lis + "<li><a class='dropdown-item' onclick='DropDownItemClicked(this)' data-itemvalue='" + EscapeHtmlText(dropdownvalues[i]) + "' style='color:" + colorlistpicker + ";background:" + backgroundlistcolorpicker + ";'>" + item + "</a></li>";
            /*lis = lis + "<li><a class='dropdown-item' onclick='DropDownItemClicked(this)' style='color:" + colorlistpicker + "; background-color:" + backgroundlistcolorpicker + ";'>" + dropdownvalues[i] + "</a></li>";*/
        }

    }

    // The list container itself: resolved here for the same reason as the items above.
    ul.style.color = GetObjectColor(colorlistpicker);
    ul.style.backgroundColor = GetObjectColor(backgroundlistcolorpicker);
    ul.style.borderColor = GetObjectColor(element.getAttribute('data-borderlistcolorpicker'));

    ul.innerHTML = lis;

}

function ListBoxMultiMouseDown(e) {

    if (e.target.tagName !== 'OPTION') { return; }

    if (EditMode) { e.preventDefault(); return; }

    var select = e.currentTarget;

    if (!select.multiple) { return; }

    e.preventDefault();

    e.target.selected = !e.target.selected;

    select.dispatchEvent(new Event('change', { bubbles: true }));

}

function ListBoxItemChanged(selectEl) {

    if (EditMode) { return; }

    var variable = selectEl.getAttribute('data-variable');
    if (!variable) { return; }

    var value;
    if (selectEl.multiple) {
        var selected = [];
        for (var i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].selected) { selected.push(selectEl.options[i].value); }
        }
        value = selected.join(';');
    } else {
        value = selectEl.value;
    }

    DoAction("setvalue", variable, value);

}

function DropDownItemClicked(lia) {

    var ObjDom = getObjDom(lia.parentElement.parentElement.parentElement); // A -> LI -> UL -> Draggable

    var value = lia.getAttribute('data-itemvalue');

    //console.log(value);
    var action = "setvalue";
    var variable = ObjDom.getAttribute('data-variable');
    DoAction(action, variable, value);

}
