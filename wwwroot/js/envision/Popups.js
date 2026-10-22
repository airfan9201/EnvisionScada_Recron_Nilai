// Envision Popups - Popups and modals: popup lifecycle, modal dialogs, choosers, expression editors.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.


// ---------------------------------------------------------------------------
// Stacked modal z-index
// Twin of the block at the end of site.js, which the Envision page does not load. Bootstrap gives
// every modal the same z-index, so a picker opened from a dialog (Edit Map Children, the UDT/Asset
// Manager editors) rendered BEHIND the dialog that asked for it - the list was there but
// unreachable. Lift each modal opened while another is already showing, and its backdrop with it.
// ---------------------------------------------------------------------------
(function () {
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) { return; }

    document.addEventListener('show.bs.modal', function (e) {
        var modal = e.target;
        if (modal.__inlineHosted) { return; }

        var open = document.querySelectorAll('.modal.show').length;
        if (!open) { return; }                       // first modal keeps Bootstrap's own z-index

        var z = 1055 + open * 20;
        modal.style.zIndex = z;

        // Which backdrops already exist, so the microtask below can tell a backdrop this modal
        // created from the one belonging to the dialog underneath.
        var existing = [].slice.call(document.querySelectorAll('.modal-backdrop'));

        // The backdrop is appended by Bootstrap after this event returns, so it is raised in a
        // MICROTASK: that still runs before the browser paints the first frame of the fade. A
        // setTimeout ran one frame too late, and for that frame the dialog underneath was
        // undimmed and looked like it was in front of the modal fading in.
        var raise = function () {
            var backdrops = document.querySelectorAll('.modal-backdrop');
            var last = backdrops[backdrops.length - 1];

            // Only raise a backdrop this modal actually appended. A modal shown with
            // backdrop:false - the auto-close "Copied to clipboard" toast - appends none, so the
            // last backdrop in the document is the one dimming the dialog UNDERNEATH. Raising
            // that put it ON TOP of the very dialog it belongs to (a grey, click-blocking sheet
            // over the Page Script Editor), and because the toast owns no backdrop nothing ever
            // lowered it again when the toast closed.
            if (last && existing.indexOf(last) === -1) { last.style.zIndex = z - 10; }
        };
        if (typeof queueMicrotask === 'function') { queueMicrotask(raise); } else { window.setTimeout(raise); }
    });

    document.addEventListener('hidden.bs.modal', function (e) {
        e.target.style.zIndex = '';
    });
})();

function UpdateURL(id) {

    var Description = document.getElementById('UpdateURLDescription ' + id).value;
    var LongURL = document.getElementById('UpdateURLLongURL ' + id).value;

    var URL = { "ShortURL": id, "Description": Description, "LongURL": LongURL };

}

function closeconfigs() {

    var elements = document.getElementsByClassName("Decorator");

    for (var i = 0; i < elements.length; i++) {

        //console.log(elements.item(i));

        var counteropen = 0;

        if (elements.item(i).style.display === "block") {
            elements.item(i).style.display = 'none';
            //console.log(' closing ');
            counteropen++;
        }

        if (counteropen > 0) {
            saveSnapshot();
        }

    }

    document.getElementById("TheGridSettings").style.display = "none";

    document.getElementById("MultiContextDragLine").style.display = 'none';
    document.getElementById("MultiContextDragLine").removeEventListener("mousedown", initDragDecorator, false);

    if (typeof MapClearMapChildDecoration === "function") MapClearMapChildDecoration();

    decoratoropen = false;

}

function CloseObjectViewer() {
    ObjectViewerOpen = false;
    closeconfigs();
}

function ChangeExpression() {

    var el;

    if (expressioneditorelementselectvariable.parentElement.getElementsByTagName("textarea")[0]) {
        el = expressioneditorelementselectvariable.parentElement.getElementsByTagName("textarea")[0];
    }
    else {
        el = expressioneditorelementselectvariable.parentElement.getElementsByTagName("input")[0];
    }

    el.value = expressioneditor.getValue();

    el.dispatchEvent(new Event('input'));
}

function ExpressionEditorModal(el) {

    expressioneditorelementselectvariable = el;

    initExpressionEditor();

    if (el.parentElement.getElementsByTagName("textarea")[0]) {
        expressioneditor.setValue(decodeHtml(el.parentElement.getElementsByTagName("textarea")[0].value));
    }
    else {
        expressioneditor.setValue(decodeHtml(el.parentElement.getElementsByTagName("input")[0].value));
    }

    //document.getElementById('ExpressionEditor').value = el.parentElement.getElementsByTagName("input")[0].value;

    var myModal = new bootstrap.Modal(document.getElementById('ExpressionEditorModal'));

    myModal.show();

}

function ChangeGeneric() {

    var el;

    if (genericeditorelementselectvariable.parentElement.getElementsByTagName("textarea")[0]) {
        el = genericeditorelementselectvariable.parentElement.getElementsByTagName("textarea")[0];
    }
    else {
        el = genericeditorelementselectvariable.parentElement.getElementsByTagName("input")[0];
    }

    el.value = genericeditor.getValue();

    el.dispatchEvent(new Event('input'));
}

function GenericEditorModal(el, title) {

    genericeditorelementselectvariable = el;

    document.getElementById('GenericEditorTitle').innerHTML = title;

    initGenericEditor();

    if (el.parentElement.getElementsByTagName("textarea")[0]) {
        genericeditor.setValue(decodeHtml(el.parentElement.getElementsByTagName("textarea")[0].value));
    }
    else {
        genericeditor.setValue(decodeHtml(el.parentElement.getElementsByTagName("input")[0].value));
    }

    //document.getElementById('GenericEditor').value = el.parentElement.getElementsByTagName("input")[0].value;

    var myModal = new bootstrap.Modal(document.getElementById('GenericEditorModal'));

    myModal.show();

}

function ChangeGenericSingle() {

    var el;

    if (genericeditorsingleelementselectvariable.parentElement.getElementsByTagName("textarea")[0]) {
        el = genericeditorsingleelementselectvariable.parentElement.getElementsByTagName("textarea")[0];
    }
    else {
        el = genericeditorsingleelementselectvariable.parentElement.getElementsByTagName("input")[0];
    }

    let genericeditorsingle = document.getElementById('GenericEditorSingle');

    el.value = genericeditorsingle.value;

    el.dispatchEvent(new Event('input'));
}

function GenericEditorSingleModal(el, title) {

    genericeditorsingleelementselectvariable = el;

    document.getElementById('GenericEditorSingleTitle').innerHTML = title;

    let genericeditorsingle = document.getElementById('GenericEditorSingle');

    if (el.parentElement.getElementsByTagName("textarea")[0]) {
        genericeditorsingle.value = el.parentElement.getElementsByTagName("textarea")[0].value;
    }
    else {
        genericeditorsingle.value = el.parentElement.getElementsByTagName("input")[0].value;
    }

    var myModal = new bootstrap.Modal(document.getElementById('GenericEditorSingleModal'));

    myModal.show();

}


function NewPageModal() {
    var myModal = new bootstrap.Modal(document.getElementById('NewPageModal'));
    myModal.show();
}

function PageScriptModal() {
    /*expressioneditorelementselectvariable = el;*/

    //document.getElementById('PageScriptModal').value = el.parentElement.getElementsByTagName("input")[0].value;

    var myModal = new bootstrap.Modal(document.getElementById('PageScriptModal'));
    myModal.show();
}

function GlobalScriptModal() {
    /*expressioneditorelementselectvariable = el;*/

    //document.getElementById('PageScriptModal').value = el.parentElement.getElementsByTagName("input")[0].value;

    var myModal = new bootstrap.Modal(document.getElementById('GlobalScriptModal'));
    myModal.show();
}


function MoveToGroupModal() {

    document.getElementById('MoveToGroupName').value = "";

    var myModal = new bootstrap.Modal(document.getElementById('MoveToGroupModal'));
    myModal.show();
}

function VariablesModal(el) {
    //console.log(el);

    elementselectvariable = el;

    elementselectvariableappend = false;

    GetVariablesList();

}

function VariablesModalExpressionEditor() {
    //console.log(el);

    elementselectvariable = document.getElementById('ExpressionEditor');

    elementselectvariableappend = true;

    GetVariablesList();

}

function VariablesModalClipboard() {
    //console.log(el);

    elementselectvariable = null;

    GetVariablesList();

}

function FilterEditorSystemFunctionList(searchInputId, listContainerId) {
    var search = document.getElementById(searchInputId);
    var list = document.getElementById(listContainerId);
    if (!search || !list) {
        return;
    }

    var query = search.value.toLowerCase();
    var items = list.getElementsByClassName('system-function-option');

    for (var i = 0; i < items.length; i++) {
        var text = items[i].textContent.toLowerCase();
        var li = items[i].closest('li');
        if (li) li.style.display = text.indexOf(query) !== -1 ? '' : 'none';
    }
}

function CopyEditorSystemFunctionText(button, dropdownId, searchInputId, listContainerId) {
    if (!button) {
        return;
    }

    var value = button.getAttribute('data-copy-text') || button.getAttribute('data-text') || button.textContent.trim();
    navigator.clipboard.writeText(value);

    var myModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('MessageAutoCloseModal'), { backdrop: false });
    var msg = document.getElementById("MessageAutoCloseModalMessage");
    msg.innerHTML = "Copied to clipboard <br /><br />" + value.replace(/\n/g, '<br />');
    myModal.show();
    setTimeout(function () { myModal.hide(); }, 650);

    var search = document.getElementById(searchInputId);
    if (search) {
        search.value = "";
        FilterEditorSystemFunctionList(searchInputId, listContainerId);
    }

    var dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        bootstrap.Dropdown.getOrCreateInstance(dropdown).hide();
    }
}

function FilterPageSystemFunctionList() {
    FilterEditorSystemFunctionList('PageSystemFunctionSearch', 'PageSystemFunctionList');
}

function FilterGlobalSystemFunctionList() {
    FilterEditorSystemFunctionList('GlobalSystemFunctionSearch', 'GlobalSystemFunctionList');
}

function CopyPageSystemFunctionText(button) {
    CopyEditorSystemFunctionText(button, 'PageSystemFunctionsDropdown', 'PageSystemFunctionSearch', 'PageSystemFunctionList');
}

function CopyGlobalSystemFunctionText(button) {
    CopyEditorSystemFunctionText(button, 'GlobalSystemFunctionsDropdown', 'GlobalSystemFunctionSearch', 'GlobalSystemFunctionList');
}


function ChooseVariable(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    //console.log(value);

    //console.log(elementselectvariable);
    if (elementselectvariable) {

        if (elementselectvariable.id == "ExpressionEditor") {
            VariableList2ExpressionEditor(value);

        }
        else {
            var el = elementselectvariable.parentElement.getElementsByTagName("input")[0];

            if (!el) {
                el = elementselectvariable.parentElement.getElementsByTagName("textarea")[0];
            }
            if (elementselectvariableappend) {
                el.value = el.value + value;
            }
            else {
                el.value = value
            }
        }


    }
    else {
        //document.getElementById('..').focus();
        navigator.clipboard.writeText(value);

        var myModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('MessageAutoCloseModal'), { backdrop: false });
        var msg = document.getElementById("MessageAutoCloseModalMessage");
        msg.innerHTML = "Copied to clipboard <br /><br />" + value;
        myModal.show();
        setTimeout(function () { myModal.hide(); }, 1000);
    }

    el.dispatchEvent(new Event('input'));

    $('#VariablesModal').modal('hide');

}

function VariableList2ExpressionEditor(value) {

    expressioneditor.setValue(expressioneditor.getValue() + value);

}

function RecipesModal(el) {
    //console.log(el);

    elementselectrecipe = el;

    GetRecipesList();

}

function ChooseRecipe(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var el = elementselectrecipe.parentElement.getElementsByTagName("input")[0];

    el.value = value;

    el.dispatchEvent(new Event('input'));

    $('#RecipesModal').modal('hide');

}

function DevicesModal(el) {
    //console.log(el);

    elementselectdevice = el;

    GetDevicesList();

}

function ChooseDevice(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    //console.log(value);

    //console.log(elementselectdevice);

    var el = elementselectdevice.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('input'));

    $('#DevicesModal').modal('hide');

}

// Report picker for the Execute Report action. site.js declares the same pair for the
// configuration pages, where the field is saved on focusout; the page editor saves on input,
// which is why the Envision copy exists (same reason as DevicesModal above).
var elementselectreport;

function ReportsModal(el) {

    elementselectreport = el;

    GetReportsList();

}

function ChooseReport(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var el = elementselectreport.parentElement.getElementsByTagName("input")[0];

    el.value = value;

    el.dispatchEvent(new Event('input'));

    $('#ReportsModal').modal('hide');

}

function PythonScriptsModal(el) {
    //console.log(el);

    elementselectPythonScript = el;

    GetPythonScriptsList();

}

function ChoosePythonScript(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;


    var el = elementselectPythonScript.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('input'));

    $('#PythonScriptsModal').modal('hide');

}

function PagesModal(el) {
    //console.log(el);

    elementselectPage = el;

    GetPagesList();

}

function ChoosePage(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;


    var el = elementselectPage.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('input'));

    $('#PagesModal').modal('hide');

}

function UserGroupsModal(el, admin = false, guest = true) {

    elementselectUserGroup = el;

    GetUserGroupsList(elementselectUserGroup.parentElement.getElementsByTagName("input")[0].value, admin, guest);

}

function ChooseUserGroup(assembly) {

    var value = assembly;

    var el = elementselectUserGroup.parentElement.getElementsByTagName("input")[0];

    el.value = value;

    el.dispatchEvent(new Event('input'));

    //$('#UserGroupsModal').modal('hide');

}

// Sample group / converter / trend group pickers for the Envision page. site.js carries the same
// three for the configuration pages, but it is not loaded here - UserGroupsModal above is
// duplicated for exactly that reason. Note these dispatch 'input', not the 'focusout' the site.js
// copies use: that is this page's convention, and it is what the UDT member editor syncs on.

var elementselectSampleGroup;

function SampleGroupsModal(el) {

    elementselectSampleGroup = el;

    GetSampleGroupsList(elementselectSampleGroup.parentElement.getElementsByTagName("input")[0].value);

}

function ChooseSampleGroup(assembly) {

    var el = elementselectSampleGroup.parentElement.getElementsByTagName("input")[0];

    el.value = assembly;

    el.dispatchEvent(new Event('input'));

}

var elementselectConverter;

function ConvertersModal(el) {

    elementselectConverter = el;

    GetConvertersList();

}

// Unlike the group pickers, the converter list calls ChooseConverter(this) with the clicked row's
// button, so the value is read from that row rather than passed in.
function ChooseConverter(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var target = elementselectConverter.parentElement.getElementsByTagName("input")[0];

    target.value = value;

    target.dispatchEvent(new Event('input'));

    $('#ConvertersModal').modal('hide');

}

var elementselectTrendGroup;

function TrendGroupsModal(el) {

    elementselectTrendGroup = el;

    GetTrendGroupsList(elementselectTrendGroup.parentElement.getElementsByTagName("input")[0].value);

}

function ChooseTrendGroup(assembly) {

    var el = elementselectTrendGroup.parentElement.getElementsByTagName("input")[0];

    el.value = assembly;

    el.dispatchEvent(new Event('input'));

}

function PageLibraryPathSelectorModal(el) {
    elementselectPath = el;
    RedrawMenuPages();
    GetPathsList(pagespathsdict);
}

function SymbolLibraryPathSelectorModal(el) {
    elementselectPath = el;
    RedrawMenuSymbols();
    GetPathsList(symbolspathsdict);
}

function ChoosePaths(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var el = elementselectPath.parentElement.getElementsByTagName("input")[0];

    el.value = value;

    el.dispatchEvent(new Event('input'));

    $('#PathsModal').modal('hide');

}

function SelectLanguageModal(el) {
    //console.log(el);

    elementselectLanguage = el;

    GetSelectLanguageList();
    //var myModal = new bootstrap.Modal(document.getElementById('SelectLanguageModal'));
    //myModal.show();

}

function ChooseLanguage(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;


    var el = elementselectLanguage.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('input'));

    $('#SelectLanguageModal').modal('hide');

}

function SelectThemeModal(el) {

    elementselectTheme = el;

    GetSelectThemeList();

}

function ChooseTheme(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var target = elementselectTheme.parentElement.getElementsByTagName("input")[0];

    target.value = value;

    target.dispatchEvent(new Event('input'));

    $('#SelectThemeModal').modal('hide');

}

function SymbolsModal(el) {
    //console.log(el);

    elementselectSymbol = el;

    GetSymbolsList();

}

function ChooseSymbol(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    if (typeof MapHandleSymbolSelected === "function" && MapHandleSymbolSelected(value)) {
        $('#SymbolsModal').modal('hide');
        return;
    }

    var el = elementselectSymbol.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('input'));

    $('#SymbolsModal').modal('hide');

}

function AssetsModal(el) {
    //console.log(el);

    elementselectAsset = el;

    GetAssetsList();

}

function ChooseAsset(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;


    var el = elementselectAsset.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('input'));

    $('#AssetsModal').modal('hide');

}

function AlarmFiltersModal(el) {
    //console.log(el);

    elementselectAlarmFilter = el;

    GetAlarmFiltersList();

}

function ChooseAlarmFilter(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var el = elementselectAlarmFilter.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('input'));

    $('#AlarmFiltersModal').modal('hide');

}


async function ProgressModal() {
    var myModal = new bootstrap.Modal(document.getElementById('ProgressModal'));
    myModal.show();

    await sleep(200);

    GetProgress();
}

function AreYouSure(id) {
    var result = confirm("Are you sure?");
    if (result) {
        document.getElementById(id).submit();
    }
}

function AreYouSureProgress(id) {
    var result = confirm("Are you sure?");
    if (result) {
        document.getElementById(id).submit();

        SubmitFormProgress(id);
    }
}

function AreYouSureDeleteSymbol(symbolname) {

    var result = confirm("Confirm deletion of master symbol " + symbolname + "?");

    if (result) {

        return true;
    }
    else {
        return false;
    }
}

function AreYouSureMsg(msg) {

    var result = confirm(msg);

    if (result) {

        return true;
    }
    else {
        return false;
    }
}

function OpenTrendModal(el) {

    if (EditMode == false) {

        var trendobject = el.getElementsByTagName("canvas")[0];

        //console.log(trendobject.getAttribute("data-variable1"))

        //console.log(trendobject.getAttribute("data-editable"))

        if (trendobject.getAttribute("data-editable") == 'true') {
            SelectedTrend = el;

            //console.log(el.id);

            document.getElementById("TrendPropertyWindowIconErrorDateTimeTo").style.display = "none";
            document.getElementById("TrendPropertyWindowIconErrorDateTimeFrom").style.display = "none";
            document.getElementById("TrendPropertyWindow").style.display = "block";
        }

    }

}

function ApplyTrendModal() {

    //2023-07-07T23:38

    if (typeof ChartsSettingsDict[SelectedTrend.id] !== 'undefined') {

        var chartsSettingsDict = ChartsSettingsDict[SelectedTrend.id];

        document.getElementById("TrendPropertyWindowDateTimeFromInput").value = chartsSettingsDict.datetimefrom;
        document.getElementById("TrendPropertyWindowDateTimeToInput").value = chartsSettingsDict.datetimeto;

    }

    document.getElementById("TrendPropertyWindowIconErrorDateTimeTo").style.display = "none";
    document.getElementById("TrendPropertyWindowIconErrorDateTimeFrom").style.display = "none";

    if (document.getElementById("TrendPropertyWindowDateTimeFromInput").value == '') {
        document.getElementById("TrendPropertyWindowIconErrorDateTimeFrom").style.display = "block";
    }
    if (document.getElementById("TrendPropertyWindowDateTimeToInput").value == '') {
        document.getElementById("TrendPropertyWindowIconErrorDateTimeTo").style.display = "block";
    }

    if (document.getElementById("TrendPropertyWindowDateTimeFromInput").value !== '' &&
        document.getElementById("TrendPropertyWindowDateTimeToInput").value !== '') {
        var datefrom = new Date(document.getElementById("TrendPropertyWindowDateTimeFromInput").value);
        var dateto = new Date(document.getElementById("TrendPropertyWindowDateTimeToInput").value);

        if (datefrom > dateto) {
            document.getElementById("TrendPropertyWindowIconErrorDateTimeTo").style.display = "block";
        } else {

            var startDatetime = document.getElementById("TrendPropertyWindowDateTimeFromInput").value;
            var endDatetime = document.getElementById("TrendPropertyWindowDateTimeToInput").value;

            //console.log(startDatetime);

            var startDatetimetemp = new Date(startDatetime);
            var endDatetimetemp = new Date(endDatetime);

            startDatetime = startDatetimetemp.toUTCString();
            endDatetime = endDatetimetemp.toUTCString();

            //console.log('start ' + startDatetime);
            //console.log('end ' + endDatetime);

            var settings = new TrendSettings(startDatetime, endDatetime);

            ChartsSettingsDict[SelectedTrend.id] = settings;

            var myChart = ChartsDict[SelectedTrend.id];

            myChart.destroy();

            delete ChartsDict[SelectedTrend.id]

            //GetHistoricDataTrend(chart, timespan, device, variable, startDatetime, endDatetime, 0);

            document.getElementById("TrendPropertyWindow").style.display = "none";
        }

    }

}

function ResetTrendModal() {

    if (typeof ChartsDict[SelectedTrend.id] !== 'undefined') {

        var myChart = ChartsDict[SelectedTrend.id];

        myChart.destroy();

        delete ChartsDict[SelectedTrend.id]
        delete ChartsSettingsDict[SelectedTrend.id];

    }

    document.getElementById("TrendPropertyWindow").style.display = "none";

}

function CloseTrendModal() {

    document.getElementById("TrendPropertyWindow").style.display = "none";

}

// StartDragObject and DoDragObject both refuse to move anything while a LabelObject or InputObject
// holds the focus (so dragging cannot run away with the object being typed in). A readonly label is
// still focusable, so a popup opened by clicking a label kept that focus and could not be dragged
// until some other click moved it away - the map pin case, where the pin group is data-noselect and
// the OpenPopup action sits on an inner label. ClickAction already does this for ButtonObject; do
// the same for every popup opener. preventScroll keeps a focus() on the page container from
// scrolling the viewer.
function ReleasePopupOpenerFocus() {

    var active = document.activeElement;

    if (!active || !active.parentElement) {
        return;
    }

    var openername = active.parentElement.getAttribute("name");

    if (openername !== "LabelObject" && openername !== "InputObject") {
        return;
    }

    // Only the object that opened the popup gives up its focus. A popup opened from a page script
    // (PageOpenPopup) must not pull the focus out of an input an operator is typing in.
    if (typeof ObjectCallingAction === "undefined" || !ObjectCallingAction || !ObjectCallingAction.contains(active)) {
        return;
    }

    var page = document.getElementById("EnvisionPage");

    if (page) {
        page.focus({ preventScroll: true });
    }
    else if (active.blur) {
        active.blur();
    }
}

function OpenPopup(callerid, top, left, fixed, symbolname, disabledrag, context, usepositioncontext, replacers) {

    //console.log(JSON.stringify(replacers));

    if (!top) {
        alert('Popup needs a Top parameter.');
        return;
    }

    if (!left) {
        alert('Popup needs a Left parameter.');
        return;
    }

    if (!fixed) {
        alert('Popup needs a fixed parameter.');
        return;
    }

    if (!symbolname) {
        alert('Popup needs a Symbol Name parameter.');
        return;
    }

    try {

        var master;

        master = GetSymbolMaster(symbolname);

        if (!master) {
            alert('Symbol not found');
            return;
        }
        
        if (fixed.toLowerCase() === 'true') {

            master.style.top = top;
            master.style.left = left;

        }
        else {
            var ObjectCallingActionCoords = getCoords(ObjectCallingAction);

            master.style.top = (ObjectCallingActionCoords.top + parseFloat(top.replace("px", ""))) + "px";
            master.style.left = (ObjectCallingActionCoords.left + parseFloat(left.replace("px", ""))) + "px";

            //master.style.top = parseInt(ObjectCallingAction.style.top.replace("px", "")) + parseInt(top) + "px";
            //master.style.left = parseInt(ObjectCallingAction.style.left.replace("px", "")) + parseInt(left) + "px";
        }

        master.classList.add("popup")

        if (disabledrag) {

            if (disabledrag.toLowerCase() === 'true') {
                master.classList.add("nodrag")

                //console.log('nodrag ' + disabledrag);
            }

        }

        //console.log("context " + context);
        if (context) {

            if (context !== '') {
                CloseContextPopups(context);
            }

            //console.log("usepositioncontext " + usepositioncontext);

            if (usepositioncontext == "true") {

                //console.log("popupcontextpositiontop " + popupcontextpositiontop);
                //console.log("popupcontextpositionleft " + popupcontextpositionleft);

                if (popupcontextpositiontop && popupcontextpositionleft) {

                    master.style.top = popupcontextpositiontop;
                    master.style.left = popupcontextpositionleft;
                }
            }

        }

        if (callerid && callerid !== '') {
            CloseSameCallerIdPopups(callerid);
        }

        //create dummy template
        var template = document.createElement('template');
        //fill template with master 
        template.innerHTML = master.outerHTML;
        //get master
        var content = template.content.childNodes[0];
        //top groupobject new id
        content.id = GenerateUniqueID();

        content.removeAttribute('data-noid');

        content.setAttribute("data-groupsymbol", symbolname + "_" + content.id);
        content.setAttribute("data-groupsymbolmaster", symbolname);

        let contenthtml = content.outerHTML;
        contenthtml = contenthtml.replaceAll("data-nosrc=", "src=");

        //top all below nested objects with noids changing with new ids
        var elements = content.getElementsByTagName('*');
        var element = null;
        
        if (elements.length > 0) {

            for (var i = elements.length; i >= 1; i--) { // reverse loop the livenodelist

                element = elements[i - 1];

                element.id = GenerateUniqueID();
                element.removeAttribute('data-noid');

                element.outerHTML = element.outerHTML.replaceAll("data-nosrc=", "src=");
            }
        }
        
        //replace devices

        var el = template.innerHTML

        let masterreplacers = [];
        
        masterreplacers = JSON.parse(master.getAttribute("data-replacers"));

        //console.log(masterreplacers);
        //console.log(replacers);

        if (masterreplacers) {

            Object.entries(masterreplacers).forEach(([uuid, obj]) => {

                var objinstance;

                if (replacers) {
                    objinstance = replacers[uuid];
                }

                if (objinstance) {
                    var masterreplacer = obj.replacer;
                    var instancereplacer = objinstance.replacer;

                    if (masterreplacer != "" && instancereplacer != "" && masterreplacer !== instancereplacer && instancereplacer.length > 0) {

                        var masterreplacement = escapeRegex(masterreplacer);

                        let regex = new RegExp(
                            `(data-[A-Za-z0-9]+=")([^"]*?` + masterreplacement + `[^"]*?)(")`,
                            'g'
                        );

                        while (match = regex.exec(el)) {

                            var matchreplace = "";
                            var replacer = "";

                            //replacer = instancereplacer.slice(0, 1) + "[-STOP-]" + instancereplacer.slice(1);

                            if (IsJsonAndKey(match[2], masterreplacer)) {
                                replacer = masterreplacer.slice(0, 1) + "[-STOP-]" + masterreplacer.slice(1);
                            }
                            else {
                                replacer = instancereplacer.slice(0, 1) + "[-STOP-]" + instancereplacer.slice(1);
                            }

                            matchreplace = match[1] + match[2].replaceAll(masterreplacer, replacer) + match[3];

                            if (match[0] != matchreplace) { // for performance, if it didn't change, don't update the object
                                el = el.replaceAll(match[0], matchreplace);
                            }
                        }
                    }
                }

                
            });
        }

        el = el.replaceAll("[-STOP-]", "");
        el = el.replace('{UID}', '_GarbageCollect_' + content.id);
        el = el.replace('{GroupSymbol}', symbolname);

        if (ObjectCallingAction) {
            el = el.replace('{CallerID}', ObjectCallingAction.id);
        }

        template.innerHTML = el;

        content = template.content.childNodes[0];

        // Stamp the popup identity AFTER the replacer pass. These are runtime bookkeeping values that
        // are already resolved for this instance, so letting the replacer see them would substitute
        // them a second time (master "Hatcher1" + instance "Hatcher13" turned "Hatcher13Context" into
        // "Hatcher133Context", and the next open then no longer matched its own context).
        StampPopupIdentity(content, context, callerid);

        StatusIconFreeze = true;
        setTimeout(ResetStatusIconFreeze, 3000);

        document.getElementById("EnvisionPage").appendChild(content);


        var getpopup = document.getElementById(content.id);
        getpopup.style.zIndex = "999";

    } catch (error) {
        alert(error);
    }

    ReleasePopupOpenerFocus();

    initDraggable();
    ResetOnEnters();

}

function OpenPopupOrdered(callerid, top, left, fixed, symbolname, disabledrag, context, usepositioncontext, replacers) {

    if (!top) {
        alert('Popup needs a Top parameter.');
        return;
    }

    if (!left) {
        alert('Popup needs a Left parameter.');
        return;
    }

    if (!fixed) {
        alert('Popup needs a fixed parameter.');
        return;
    }

    if (!symbolname) {
        alert('Popup needs a Symbol Name parameter.');
        return;
    }

    try {

        var master;

        master = GetSymbolMaster(symbolname);

        if (!master) {
            alert('Symbol not found');
            return;
        }

        if (fixed.toLowerCase() === 'true') {

            master.style.top = top;
            master.style.left = left;

        }
        else {
            var ObjectCallingActionCoords = getCoords(ObjectCallingAction);

            master.style.top = (ObjectCallingActionCoords.top + parseFloat(top.replace("px", ""))) + "px";
            master.style.left = (ObjectCallingActionCoords.left + parseFloat(left.replace("px", ""))) + "px";
        }

        master.classList.add("popup");

        if (disabledrag) {
            if (disabledrag.toLowerCase() === 'true') {
                master.classList.add("nodrag");
            }
        }

        if (context) {

            if (context !== '') {
                CloseContextPopups(context);
            }

            if (usepositioncontext == "true") {
                if (popupcontextpositiontop && popupcontextpositionleft) {
                    master.style.top = popupcontextpositiontop;
                    master.style.left = popupcontextpositionleft;
                }
            }
        }

        if (callerid && callerid !== '') {
            CloseSameCallerIdPopups(callerid);
        }

        // create dummy template
        var template = document.createElement('template');
        template.innerHTML = master.outerHTML;

        // get master
        var content = template.content.childNodes[0];

        // top groupobject new id
        content.id = GenerateUniqueID();

        content.removeAttribute('data-noid');
        content.setAttribute("data-groupsymbol", symbolname + "_" + content.id);
        content.setAttribute("data-groupsymbolmaster", symbolname);

        let contenthtml = content.outerHTML;
        contenthtml = contenthtml.replaceAll("data-nosrc=", "src=");

        // top all below nested objects with noids changing with new ids
        var elements = content.getElementsByTagName('*');
        var element = null;

        if (elements.length > 0) {
            for (var i = elements.length; i >= 1; i--) {
                element = elements[i - 1];

                element.id = GenerateUniqueID();
                element.removeAttribute('data-noid');

                element.outerHTML = element.outerHTML.replaceAll("data-nosrc=", "src=");
            }
        }

        // replace devices
        var el = template.innerHTML;

        let masterreplacers = [];
        masterreplacers = JSON.parse(master.getAttribute("data-replacers"));

        let normalizedPairs = BuildOrderedPopupReplacerPairs(masterreplacers, replacers);

        if (normalizedPairs && normalizedPairs.length > 0) {
            normalizedPairs.forEach(pair => {

                var masterreplacer = pair.masterreplacer;
                var instancereplacer = pair.instancereplacer;

                if (
                    masterreplacer != null &&
                    instancereplacer != null &&
                    masterreplacer !== "" &&
                    instancereplacer !== "" &&
                    masterreplacer !== instancereplacer &&
                    instancereplacer.length > 0
                ) {
                    var masterreplacement = escapeRegex(masterreplacer);

                    let regex = new RegExp(
                        `(data-[A-Za-z0-9]+=")([^"]*?` + masterreplacement + `[^"]*?)(")`,
                        'g'
                    );

                    let match;
                    while ((match = regex.exec(el)) !== null) {

                        var matchreplace = "";
                        var replacer = "";

                        if (IsJsonAndKey(match[2], masterreplacer)) {
                            replacer = masterreplacer.slice(0, 1) + "[-STOP-]" + masterreplacer.slice(1);
                        }
                        else {
                            replacer = instancereplacer.slice(0, 1) + "[-STOP-]" + instancereplacer.slice(1);
                        }

                        matchreplace = match[1] + match[2].replaceAll(masterreplacer, replacer) + match[3];

                        if (match[0] != matchreplace) {
                            el = el.replaceAll(match[0], matchreplace);
                        }
                    }
                }
            });
        }

        el = el.replaceAll("[-STOP-]", "");
        el = el.replace('{UID}', '_GarbageCollect_' + content.id);
        el = el.replace('{GroupSymbol}', symbolname);

        if (ObjectCallingAction) {
            el = el.replace('{CallerID}', ObjectCallingAction.id);
        }

        template.innerHTML = el;

        content = template.content.childNodes[0];

        // See OpenPopup: stamp the popup identity AFTER the replacer pass, never before it.
        StampPopupIdentity(content, context, callerid);

        StatusIconFreeze = true;
        setTimeout(ResetStatusIconFreeze, 3000);

        document.getElementById("EnvisionPage").appendChild(content);

        var getpopup = document.getElementById(content.id);
        getpopup.style.zIndex = "999";

    } catch (error) {
        alert(error);
    }

    ReleasePopupOpenerFocus();

    initDraggable();
    ResetOnEnters();
}

function BuildOrderedPopupReplacerPairs(masterreplacers, replacers) {
    let result = [];

    let masterList = ConvertReplacersToOrderedList(masterreplacers);
    let instanceList = ConvertReplacersToOrderedList(replacers);

    let max = Math.min(masterList.length, instanceList.length);

    for (let i = 0; i < max; i++) {
        result.push({
            masterreplacer: masterList[i],
            instancereplacer: instanceList[i]
        });
    }

    return result;
}

function ConvertReplacersToOrderedList(replacers) {
    let list = [];

    if (!replacers) {
        return list;
    }

    // If JSON string was passed accidentally
    if (typeof replacers === "string") {
        try {
            replacers = JSON.parse(replacers);
        } catch {
            return list;
        }
    }

    // Array mode
    if (Array.isArray(replacers)) {
        for (let i = 0; i < replacers.length; i++) {
            let item = replacers[i];

            if (typeof item === "string") {
                list.push(item);
            }
            else if (item && typeof item === "object" && item.replacer != null) {
                list.push(item.replacer);
            }
        }

        return list;
    }

    // Object mode
    if (typeof replacers === "object") {
        Object.entries(replacers).forEach(([key, value]) => {
            if (typeof value === "string") {
                list.push(value);
            }
            else if (value && typeof value === "object" && value.replacer != null) {
                list.push(value.replacer);
            }
        });
    }

    return list;
}

function GetPopupByCallerId(callerId) {
    return document.querySelector(`[data-popupcallerid="${callerId}"]`);
}

function ClosePopup() {

    if (EditMode === false) {

        var topmostparent = GetTopMostParentGroupObject(ObjectCallingAction);

        //console.log(topmostparent);
        // do not close when it has no master = it is the template itself
        if (!topmostparent.getAttribute("data-groupsymbolmaster") || topmostparent.getAttribute("data-groupsymbolmaster") === '') {
            return;
        }

        //console.log(ObjectCallingAction);
        topmostparent.parentElement.removeChild(topmostparent);

        GarbageCollectUidVars();
    }

}

function CloseAllPopups() {

    draggables = document.getElementById("EnvisionPage").getElementsByClassName("popup");

    for (var i = draggables.length; i >= 1; i--) { // reverse loop the livenodelist

        element = draggables[i - 1];

        element.parentElement.removeChild(element);

    }

    GarbageCollectUidVars();

}

function StampPopupIdentity(content, context, callerid) {

    if (!content) {
        return;
    }

    if (context && context !== '') {
        content.setAttribute("data-popupcontext", context);
    }
    else {
        content.removeAttribute("data-popupcontext");
    }

    if (callerid && callerid !== '') {
        content.setAttribute("data-popupcallerid", callerid);
    }
    else {
        content.removeAttribute("data-popupcallerid");
    }

}

function CloseContextPopups(context) {
    
    popupcontextpositiontop = undefined;
    popupcontextpositionleft = undefined;

    draggables = document.getElementById("EnvisionPage").getElementsByClassName("popup");
    
    for (var i = draggables.length; i >= 1; i--) { // reverse loop the livenodelist
        
        element = draggables[i - 1];
        
        if (element.hasAttribute("data-popupcontext")) {

            var popupcontext = element.getAttribute("data-popupcontext");

            if (popupcontext == context) {
                
                popupcontextpositiontop = element.style.top;
                popupcontextpositionleft = element.style.left;

                element.parentElement.removeChild(element);
            }

        }

    }

    GarbageCollectUidVars();

}
function CloseSameCallerIdPopups(callerid) {

    draggables = document.getElementById("EnvisionPage").getElementsByClassName("popup");

    for (var i = draggables.length; i >= 1; i--) { // reverse loop the livenodelist

        element = draggables[i - 1];

        if (element.hasAttribute("data-popupcallerid")) {

            var popupcallerid = element.getAttribute("data-popupcallerid");

            if (popupcallerid == callerid) {
                element.parentElement.removeChild(element);
            }

        }

    }

    GarbageCollectUidVars();

}
function MakeAllPopupsEditable() {

    draggables = document.getElementById("EnvisionPage").getElementsByClassName("popup");

    for (var i = draggables.length; i >= 1; i--) { // reverse loop the livenodelist

        element = draggables[i - 1];

        element.classList.remove("popup");
        element.setAttribute("data-ispopup", "");
    }
}

function MakeAllPopupsEditableRestore() {

    draggables = document.getElementById("EnvisionPage").querySelectorAll('[data-ispopup]');

    if (draggables.length > 0) {

        for (var i = draggables.length; i >= 1; i--) { // reverse loop the livenodelist

            element = draggables[i - 1];

            element.classList.add("popup");
/*            console.log(element);*/
        }

        initDraggable();
    }

}

function ToggleLegend() {

    if (document.getElementById("Legend").style.display === "none") {
        document.getElementById("Legend").style.display = "block";
    } else {
        document.getElementById("Legend").style.display = "none";
    }
}

function ShowConfirmModal(message) {
    return new Promise(function (resolve) {
        document.getElementById('ConfirmModalMessage').innerHTML = message;
        var modalEl = document.getElementById('ConfirmModal');
        var modal = new bootstrap.Modal(modalEl);
        var yesBtn = document.getElementById('ConfirmModalYes');

        function onYes() {
            yesBtn.removeEventListener('click', onYes);
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
            resolve(true);
        }
        function onHidden() {
            yesBtn.removeEventListener('click', onYes);
            modalEl.removeEventListener('hidden.bs.modal', onHidden);
            resolve(false);
        }

        yesBtn.addEventListener('click', onYes);
        modalEl.addEventListener('hidden.bs.modal', onHidden);
        modal.show();
    });
}
