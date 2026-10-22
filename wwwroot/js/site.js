
function StoreCellId(id) {

    document.getElementById(id).setAttribute("data-oldvalue", document.getElementById(id).value);

}

function StoreCell(element) {

    element.setAttribute("data-oldvalue", element.value)

}

function RestoreCell(element) {

    element.value = element.getAttribute("data-oldvalue")

}

var elementselectvariable;

var elementselectvariableappend;

function VariablesModal(el) {
    //console.log(el);

    elementselectvariable = el;

    elementselectvariableappend = false;

    GetVariablesList();

}

function ChooseVariable(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    if (elementselectvariable) {
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

        el.dispatchEvent(new Event('focusout'));
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

    $('#VariablesModal').modal('hide');

    elementselectvariable = null;

}

var elementselectUserGroup;

function UserGroupsModal(el, admin = false, guest = true) {

    elementselectUserGroup = el;

    GetUserGroupsList(elementselectUserGroup.parentElement.getElementsByTagName("input")[0].value, admin, guest);

}
function ChooseUserGroup(assembly) {

    var value = assembly;

    var el = elementselectUserGroup.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;


    el.dispatchEvent(new Event('focusout'));

    /*    $('#UserGroupsModal').modal('hide');*/

}

var elementselectTrendGroup;

// Same contract as the sample/user group pickers: the button is passed in, the value is written
// back into the input sharing its parent, and 'focusout' is what tells the host form to sync.
function TrendGroupsModal(el) {

    elementselectTrendGroup = el;

    GetTrendGroupsList(elementselectTrendGroup.parentElement.getElementsByTagName("input")[0].value);

}

function ChooseTrendGroup(assembly) {

    var el = elementselectTrendGroup.parentElement.getElementsByTagName("input")[0];

    el.value = assembly;

    el.dispatchEvent(new Event('focusout'));

}

var elementselectSampleGroup;

function SampleGroupsModal(el) {
    //console.log(el);

    elementselectSampleGroup = el;

    GetSampleGroupsList(elementselectSampleGroup.parentElement.getElementsByTagName("input")[0].value);

}

function ChooseSampleGroup(assembly) {

    var value = assembly;

    var el = elementselectSampleGroup.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;


    el.dispatchEvent(new Event('focusout'));

    /*    $('#SampleGroupsModal').modal('hide');*/

}


var elementselectConverter;

function ConvertersModal(el) {
    //console.log(el);

    elementselectConverter = el;

    GetConvertersList();

}

function ChooseConverter(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;


    var el = elementselectConverter.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('focusout'));

    $('#ConvertersModal').modal('hide');

}


var elementselectPythonScript;

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

    el.dispatchEvent(new Event('focusout'));

    $('#PythonScriptsModal').modal('hide');

}

var elementselectReport;

function ReportsModal(el) {

    elementselectReport = el;

    GetReportsList();

}

function ChooseReport(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var el = elementselectReport.parentElement.getElementsByTagName("input")[0];

    el.value = value;

    el.dispatchEvent(new Event('focusout'));

    $('#ReportsModal').modal('hide');

}

var elementselectRecipe;

function RecipesModal(el) {
    //console.log(el);

    elementselectRecipe = el;

    GetRecipesList();

}

function ChooseRecipe(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var el = elementselectRecipe.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('focusout'));

    $('#RecipesModal').modal('hide');

}

var elementselectPage;

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

    el.dispatchEvent(new Event('focusout'));

    $('#PagesModal').modal('hide');

}

var elementselectLanguage;

function SelectLanguageModal(el) {
    //console.log(el);

    elementselectLanguage = el;

    GetSelectLanguageList();
    //var myModal = new bootstrap.Modal(document.getElementById('SelectLanguageModal'));
    //myModal.show();

}

function InfoMsg(msg) {

    var myModal = new bootstrap.Modal(document.getElementById('InfoMessageModal'));
    
    document.getElementById('InfoModalMessage').innerHTML = msg;
    myModal.show();

}

function ChooseLanguage(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;


    var el = elementselectLanguage.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('focusout'));

    $('#SelectLanguageModal').modal('hide');

}

// Device picker for the Edit Actions dialog on the Alarms, Events and Schedules pages. Mirrors the
// Envision designer version in envision/Popups.js; those two files are never loaded together for
// this dialog, the same way PythonScriptsModal is defined in both.
var elementselectdevice;

function DevicesModal(el) {

    elementselectdevice = el;

    GetDevicesList();

}

function ChooseDevice(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;

    var el = elementselectdevice.parentElement.getElementsByTagName("input")[0];

    el.value = value;

    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('focusout'));

    $('#DevicesModal').modal('hide');

}

var elementselectKafkaDevice;

function KafkaDevicesModal(el) {
    //console.log(el);

    elementselectKafkaDevice = el;

    GetKafkaDevicesList();

}

function ChooseKafkaDevice(el) {

    var value = el.parentElement.getElementsByTagName("input")[0].value;


    var el = elementselectKafkaDevice.parentElement.getElementsByTagName("input")[0];

    el.value = value; // removes expression
    // el.value = el.value + value;

    el.dispatchEvent(new Event('focusout'));

    $('#KafkaDevicesModal').modal('hide');

}

// Condition Editor

var conditioneditorelementselectvariable;

function ConditionEditorModal(el) {

    console.log(el);

    conditioneditorelementselectvariable = document.getElementById(el);

    elementselectvariable = document.getElementById('ConditionEditor');

    document.getElementById('ConditionEditor').value = conditioneditorelementselectvariable.value;

    var myModal = new bootstrap.Modal(document.getElementById('ConditionEditorModal'));
    myModal.show();
}

function ChangeCondition() {

    var el = conditioneditorelementselectvariable;

    el.value = document.getElementById('ConditionEditor').value;

    el.dispatchEvent(new Event('focusout'));
}

function VariablesModalConditionEditor() {

    elementselectvariable = document.getElementById('ConditionEditor');

    elementselectvariableappend = true;

    GetVariablesList();

}

// -----------------------

function RestripeRows() {
    var rows = document.querySelectorAll(
        '#PartialContainerDefault .rowcolbox, #PartialContainerDefault .rowcolboxinput'
    );
    rows.forEach(function(row, index) {
        row.classList.toggle('stripe-even', index % 2 === 1);
        row.classList.toggle('stripe-reset', index % 2 === 0);
    });
}

document.addEventListener('DOMContentLoaded', RestripeRows);
document.body.addEventListener('htmx:afterSettle', RestripeRows);


function ChangeObjectType(element) {

    var id = element.parentElement.parentElement.getAttribute('data-id');
    var inputtoset = element.parentElement.parentElement.parentElement.getElementsByTagName("input")[0];
    // data-value is the canonical stored value where the item defines one; innerHTML is the label,
    // which is translated and must never be what gets persisted.
    inputtoset.value = element.dataset.value || element.innerHTML;

    //console.log(id);
    if (id !== "-1") {
        UpdateElement(inputtoset, id);
    }
    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ServerConfirm() {
    var ServerConfirm = document.getElementById("ServerConfirm");
    ServerConfirm.style.display = "Block";
    ServerConfirm.style.opacity = 1;
    ServerConfirm.style.animation = 'none';
    ServerConfirm.offsetHeight; /* trigger reflow */
    ServerConfirm.style.animation = null;
}

//function ChangeObjectType(element) {

//    var id = element.parentElement.parentElement.getAttribute('data-id');
//    var dropdown = document.getElementById('UpdateLocalVariableType ' + id);
//    dropdown.value = element.innerHTML;

//    UpdateLocalVariable(dropdown, id);
//}


function ToggleMenuItems() {
    var MenuItems = document.getElementById('MenuItems');

    if (MenuItems.style.display === "block") {
        MenuItems.style.display = "none";
        document.body.style.overflowY = 'scroll';
    }
    else {
        MenuItems.style.display = "block";
        document.body.style.overflowY = 'hidden';
    }
}

function VariablesModalClipboard() {
    //console.log(el);

    elementselectvariable = null;

    GetVariablesList();

}

function FilterPythonSystemFunctionList() {
    var search = document.getElementById('PythonSystemFunctionSearch');
    var list = document.getElementById('PythonSystemFunctionList');
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

function CopyPythonSystemFunctionText(button) {
    if (!button) {
        return;
    }

    // data-text is the canonical snippet; textContent also carries the label's translated hint
    // (e.g. "import ModuleName  (reuse a Module script)"), which must not reach the clipboard.
    var value = (button.dataset.text || button.textContent).trim();
    navigator.clipboard.writeText(value);

    var myModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('MessageAutoCloseModal'), { backdrop: false });
    var msg = document.getElementById("MessageAutoCloseModalMessage");
    msg.innerHTML = "Copied to clipboard <br /><br />" + value;
    myModal.show();
    setTimeout(function () { myModal.hide(); }, 1000);

    var search = document.getElementById('PythonSystemFunctionSearch');
    if (search) {
        search.value = "";
        FilterPythonSystemFunctionList();
    }

    var dropdown = document.getElementById('PythonSystemFunctionsDropdown');
    if (dropdown) {
        bootstrap.Dropdown.getOrCreateInstance(dropdown).hide();
    }
}

// DYNAMIC COLUMS

var startX, startY, startWidth, startHeight;

var p;

var commoncolumns;

var currentdragline;

function DragResizeColumns(e, id) {

    //console.log(e.srcElement);

    p = document.getElementById(id).parentElement;

    if (p.classList.contains('dropdown')) {
        p = p.parentElement;
    }

    var rowname = p.getAttribute("name");
    commoncolumns = document.querySelectorAll('[name="' + rowname + '"]');

    /*console.log(p);*/
    startWidth = parseInt(document.defaultView.getComputedStyle(p).width, 10);
    
    if (e.type == "touchstart") {

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        document.documentElement.addEventListener('touchmove', doDrag, false);
        document.documentElement.addEventListener('touchend', stopDrag, false);
    }
    else {
        startX = e.clientX;
        startY = e.clientY;

        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
    }

    
}

function doDrag(e) {

    DraggingColumns = true;

    //var newwidth = (startWidth + e.clientX - startX) + 'px';

    //for (var i = 0; i < commoncolumns.length; i++) {
    //    commoncolumns[i].style.width = newwidth;
    //}

    if (e.type == "touchmove") {
        /*console.log(e.touches[0].clientX);*/
        p.style.width = (startWidth + e.touches[0].clientX - startX) + 'px';
    }
    else {
        p.style.width = (startWidth + e.clientX - startX) + 'px';
    }

    //console.log(p.style.width);
}

function stopDrag(e) {

    if (commoncolumns) {

        for (var i = 0; i < commoncolumns.length; i++) {
            commoncolumns[i].style.width = p.style.width;
            console.log(p.style.width)
        }

        if (commoncolumns[0]) {
            var columnsname = commoncolumns[0].getAttribute("name");
            var fileName = location.href.split("/").slice(-1);

            localStorage.setItem(fileName + '_' + columnsname, p.style.width);

            /*console.log('setting ' + fileName + '_' + columnsname + " : " + p.style.width)*/
        }
        
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
        document.documentElement.removeEventListener('touchmove', doDrag, false);
        document.documentElement.removeEventListener('touchend', stopDrag, false);

    }

    DraggingColumns = false;
    
}

function toggleVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const eyeOpen = button.querySelector('.eye-open');
    const eyeClosed = button.querySelector('.eye-closed');

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    eyeOpen.style.display = isPassword ? 'none' : 'inline';
    eyeClosed.style.display = isPassword ? 'inline' : 'none';
}

// ---------------------------------------------------------------------------
// InlineModalHost
// When a field-picker modal (Condition editor, variable/user-group/converter/... pickers, the
// actions editor) is opened while an add/edit modal (id "EntityModal_*") is open, host it INSIDE
// that modal as a stacked in-place panel instead of stacking a second Bootstrap modal on top.
// Outside-click / Esc on the add/edit modal pops one panel (goes back) rather than closing it.
// Nesting works (e.g. a variable picker opened from the Condition editor stacks a second panel).
// Grid/standalone use - no add/edit modal open - is untouched: the picker opens as a normal modal.
// ---------------------------------------------------------------------------
(function () {
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) { return; }

    // Only these field pickers are hosted inline; system dialogs (errors, toasts, confirms) are not.
    var HOSTABLE = {
        ConditionEditorModal: 1, VariablesModal: 1, UserGroupsModal: 1, ConvertersModal: 1,
        PagesModal: 1, SampleGroupsModal: 1, SelectLanguageModal: 1, RecipesModal: 1,
        PythonScriptsModal: 1, KafkaDevicesModal: 1, SettingsModal: 1
    };

    var layers = []; // stack of { childModal, content, placeholder }, top of stack = innermost panel

    function currentHost() { return document.querySelector('.modal.show[id^="EntityModal_"]'); }

    function hideBase(hostContent) {
        Array.prototype.forEach.call(hostContent.children, function (c) {
            if (!c.classList.contains('inline-hosted-panel')) { c.classList.add('inline-hidden'); }
        });
    }

    function showBase(hostContent) {
        Array.prototype.forEach.call(hostContent.children, function (c) {
            if (!c.classList.contains('inline-hosted-panel')) { c.classList.remove('inline-hidden'); }
        });
    }

    // The element currently showing in the host: the topmost visible hosted panel, or (no panel) the
    // add/edit modal's own fields form. Fading THIS - not the whole .modal-content - is what reads as a
    // fade: the panel/form sits on the stable dark modal box, whereas fading the dark box itself over the
    // dark backdrop is imperceptible.
    function visibleContent(hostContent) {
        var children = hostContent.children;
        for (var i = children.length - 1; i >= 0; i--) {
            var c = children[i];
            if (c.classList.contains('inline-hosted-panel') && !c.classList.contains('inline-hidden')) { return c; }
        }
        return hostContent.querySelector(':scope > form') || null;
    }

    // Cross-fade via the Web Animations API: the current content fades OUT, then (once hidden) the new
    // content fades IN - a fade on both closing and opening. State/flags are already set by the caller;
    // only the pixels are sequenced here. A setTimeout backstop runs the swap even if the fade's finish
    // event is missed (e.g. the animation is interrupted), so nesting/close-routing never gets stuck.
    var INLINE_FADE_MS = 200; // per half (out, then in); tune this single number for speed
    function swapVisual(hostContent, apply) {
        if (!hostContent) { apply(); return; }
        var outgoing = visibleContent(hostContent);
        var swapped = false;
        function doSwap() {
            if (swapped) { return; }
            swapped = true;
            apply();
            var incoming = visibleContent(hostContent);
            if (incoming && incoming.animate) {
                incoming.animate([{ opacity: 0 }, { opacity: 1 }], { duration: INLINE_FADE_MS, easing: 'ease' });
            }
        }
        if (outgoing && outgoing.animate) {
            var a = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: INLINE_FADE_MS, easing: 'ease' });
            a.onfinish = doSwap;
            a.oncancel = doSwap;
            window.setTimeout(doSwap, INLINE_FADE_MS + 40);
        } else {
            doSwap();
        }
    }

    function hostChild(host, child) {
        var content = child.querySelector('.modal-content');
        if (!content) { return false; }
        var hostContent = host.querySelector('.modal-content');
        var prevTop = layers.length ? layers[layers.length - 1].content : null;
        var placeholder = document.createComment('inline-host');
        content.parentNode.insertBefore(placeholder, content);
        content.classList.add('inline-hosted-panel');
        layers.push({ childModal: child, content: content, placeholder: placeholder });
        child.__inlineHosted = true;
        host.classList.add('has-inline-panel');
        swapVisual(hostContent, function () {
            if (prevTop) { prevTop.classList.add('inline-hidden'); }
            else { hideBase(hostContent); }
            content.classList.remove('inline-hidden');
            hostContent.appendChild(content);
        });
        return true;
    }

    function popLayer() {
        if (layers.length === 0) { return; }
        var top = layers.pop();
        var host = currentHost();
        var hostContent = host ? host.querySelector('.modal-content') : null;
        top.childModal.__inlineHosted = false;
        var newTop = layers.length ? layers[layers.length - 1].content : null;
        if (!newTop && host) { host.classList.remove('has-inline-panel'); }
        swapVisual(hostContent, function () {
            top.content.classList.remove('inline-hosted-panel', 'inline-hidden');
            if (top.placeholder && top.placeholder.parentNode) {
                top.placeholder.parentNode.insertBefore(top.content, top.placeholder);
                top.placeholder.remove();
            }
            if (newTop) { newTop.classList.remove('inline-hidden'); }
            else { showBase(hostContent); }
        });
    }

    // Intercept a picker's show: host it inline when an add/edit modal is open (or nest on top of a
    // panel already hosted). preventDefault stops Bootstrap from displaying it as its own modal, so
    // there is no second backdrop and focus stays trapped inside the one open add/edit modal.
    document.addEventListener('show.bs.modal', function (e) {
        var child = e.target;
        if (!child.id || HOSTABLE[child.id] !== 1) { return; }
        if (!currentHost()) { return; }
        e.preventDefault();
        hostChild(currentHost(), child);
    });

    // A hosted picker closes via Modal.hide() - reached from a Choose/Select handler, a Close button,
    // or data-bs-dismiss. Pop the panel (back one level) instead of running Bootstrap's real hide.
    var _hide = bootstrap.Modal.prototype.hide;
    bootstrap.Modal.prototype.hide = function () {
        if (this._element && this._element.__inlineHosted) { popLayer(); return; }
        return _hide.apply(this, arguments);
    };

    // Outside-click / Esc on the add/edit modal: while a panel is hosted, go back one level instead of
    // closing the whole modal (hide.bs.modal is cancelable).
    document.addEventListener('hide.bs.modal', function (e) {
        var modal = e.target;
        if (modal.id && modal.id.indexOf('EntityModal_') === 0 && layers.length > 0) {
            e.preventDefault();
            popLayer();
        }
    });
})();

// ---------------------------------------------------------------------------
// Stacked modal z-index
// Bootstrap gives every modal the same z-index, so a picker opened from a dialog that is NOT an
// add/edit modal (the UDT/Asset Manager editors, Edit Map Children) rendered BEHIND the dialog
// that asked for it - the list was there but unreachable. Lift each modal opened while another
// is already showing, and its backdrop with it. Modals hosted inline by InlineModalHost above
// never reach this: their show is prevented.
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