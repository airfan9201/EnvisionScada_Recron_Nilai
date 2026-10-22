// Envision PropertyHandlers.Widgets - Property input handlers for interactive widgets: Knob, Slider, Donut, BarGraph, Toggle, CheckBox, DropDown, ListBox, Input, Label, WebFrame, Widget, SVG, Button, Square, Circle, Image, Polygon, Polyline.
// Split from Envision.js. Global scope (no module system); load order defined in Envision.cshtml.
// Envision PropertyHandlers - Property input handlers: apply edits from the properties panel to object data-* attributes.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

// INPUT HANDLERS ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 

// BUTTON INPUT HANDLERS

function ButtonContextInputHandlerontext(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-ontext', e.target.value);
        }
    }

}

function ButtonContextInputHandlerofftext(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-offtext', e.target.value);
        }
    }

}

function ButtonContextInputHandlervariable(e) {

    //if (ElementToBeDecorated) {
    //    ElementToBeDecorated.setAttribute('data-variable', e.target.value);
    //}

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
        }
    }
}

function ButtonContextInputHandlerborderradius(e) {

    let value = e.target.value;
    let styleValue = (value !== '' && !isNaN(value)) ? value + 'px' : value;

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-borderradius', value);
            ElementToBeDecorated.style.borderRadius = styleValue;
        }
    }
}

// INPUT INPUT HANDLERS

function InputContextInputHandlervariable(e) {

    //console.log(e.target.value);

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
        }
    }

}

function InputContextInputHandlerlabel(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-label', e.target.value);
        }
    }

}


function InputContextInputHandlerReadOnly(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-readonly', e.target.checked);

            if (e.target.checked) {
                ElementToBeDecorated.setAttribute('readonly', e.target.checked);
            } else {
                ElementToBeDecorated.removeAttribute('readonly')
            }
        }
    }
}

function InputContextInputHandlerUnits(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-units', e.target.checked);
            ElementToBeDecorated.setAttribute('Units', e.target.checked);
        }
    }
}

function InputContextInputHandlerFloatingPoint(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-floatingpoint', e.target.checked);

            if (e.target.checked) {
                document.getElementById('InputContextDecimalsRow').style.display = "flex";

            }
            else {
                document.getElementById('InputContextDecimalsRow').style.display = "none";
            }

        }
    }
}

function InputContextInputHandlerPasswordField(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-passwordfield', e.target.checked);

            if (e.target.checked) {
                ElementToBeDecorated.setAttribute('type', "password");
            }
            else {
                ElementToBeDecorated.setAttribute('type', "text");
            }
            
        }
    }
}

function InputContextInputHandlerNumpad(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-numpad', e.target.checked);

            if (e.target.checked) {
                document.getElementById('InputContextNumpadDecimalSymbolRow').style.display = "flex";
                document.getElementById('InputContextNumpadMinusSymbolRow').style.display = "flex";
                ElementToBeDecorated.setAttribute('data-keyboard', false);
                document.getElementById('InputContextKeyboard').checked = false;
            }
            else {
                document.getElementById('InputContextNumpadDecimalSymbolRow').style.display = "none";
                document.getElementById('InputContextNumpadMinusSymbolRow').style.display = "none";
            }

        }
    }
}

function InputContextInputHandlerNumpadDecimalSymbol(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-numpaddecimalsymbol', e.target.checked);

        }
    }
}

function InputContextInputHandlerNumpadMinusSymbol(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-numpadminussymbol', e.target.checked);

        }
    }
}

function InputContextInputHandlerKeyboard(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-keyboard', e.target.checked);

            if (e.target.checked) {
                ElementToBeDecorated.setAttribute('data-numpad', false);
                document.getElementById('InputContextNumpad').checked = false;
                document.getElementById('InputContextNumpadDecimalSymbolRow').style.display = "none";
                document.getElementById('InputContextNumpadMinusSymbolRow').style.display = "none";
            }
        }
    }
}

// WEBFRAME INPUT HANDLERS

function WebFrameContextInputHandlerURL(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-url', e.target.value);

            EnsureWebFramePostMessageHandler(ElementToBeDecorated);
            ElementToBeDecorated.__webFramePostMessageInitializedUrl = null;
            ElementToBeDecorated.src = BuildWebFrameRuntimeUrl(e.target.value, true);
        }
    }

}

function WebFrameContextInputHandlerPostMessageEnabled(e) {

    ToggleWebFramePostMessageSettings(e.target.checked);

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-postmessageenabled', e.target.checked);

            if (e.target.checked) {
                EnsureWebFramePostMessageHandler(ElementToBeDecorated);
                ElementToBeDecorated.__webFramePostMessageInitializedUrl = null;
                SendWebFramePostMessage(ElementToBeDecorated);
            }
        }
    }
}

function WebFrameContextInputHandlerPostMessage(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-postmessage', e.target.value);
            ElementToBeDecorated.__webFramePostMessageInitializedUrl = null;

            if (ElementToBeDecorated.getAttribute('data-postmessageenabled')?.toLowerCase() === 'true') {
                SendWebFramePostMessage(ElementToBeDecorated);
            }
        }
    }
}

function WebFrameContextInputHandlerStaticPage(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-staticpage', e.target.checked);

            if (e.target.checked) {
                document.getElementById('WebFrameContextStaticPageRow').style.display = "flex";

            }
            else {
                document.getElementById('WebFrameContextStaticPageRow').style.display = "none";
            }

        }
    }
}

function WebFrameContextInputHandlerRefresh(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            if (!containsOnlyNumbers(e.target.value)) {
                e.target.value = ElementToBeDecorated.getAttribute('data-refresh');
                return;
            }
            else {
                ElementToBeDecorated.setAttribute('data-refresh', e.target.value);
            }

        }
    }

}

// TREND ANALYST VIEWER INPUT HANDLERS

function TrendAnalystViewerContextInputHandlerConfig(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-config', e.target.value);

            // Clearing the last posted value makes the next runtime cycle push the configuration
            // into the frame; the frame itself is never reloaded for a configuration change.
            ElementToBeDecorated.__viewerResolvedConfig = null;
        }
    }
}

// DOCUMENT VIEWER INPUT HANDLERS
//
// Every field only writes a data-* attribute; the frame is reloaded by clearing the runtime's own
// bookkeeping so the next cycle rebuilds the URL. The page never holds a filesystem path, so there
// is nothing here that could widen what the server is willing to serve.

function DocumentViewerContextApply(attribute, value) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute(attribute, value);

            ElementToBeDecorated.__docViewerUrl = null;
            ElementToBeDecorated.__docViewerLastRefresh = null;
            ElementToBeDecorated.src = BuildDocumentViewerUrl(ElementToBeDecorated, true);
        }
    }
}

function DocumentViewerContextInputHandlerDocumentPath(e) {

    DocumentViewerContextApply('data-documentpath', e.target.value);
}

function DocumentViewerContextInputHandlerStatusVariable(e) {

    DocumentViewerContextApply('data-statusvariable', e.target.value);
}

function DocumentViewerContextInputHandlerToolbar(e) {

    DocumentViewerContextApply('data-toolbar', e.target.checked);
}

// SELECTION DOCUMENT ITEM SOURCE HANDLERS
//
// Only ever writes the attribute and drops the cached listing, so the next execute cycle asks the
// server again. The listing itself is never written into data-items/data-values - saving the page
// must not bake one snapshot of a folder into the project.

function SelectionDocumentApply(attribute, value) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        var element = getObjDom(ElementsToBeDecorated[i - 1]);

        if (element) {
            element.setAttribute(attribute, value);

            element.__documentFilesRequest = null;
            element.__documentFiles = null;
            element.__documentStatus = null;
        }
    }
}

// Switching back to Items and Values CLEARS the folder, because the folder is what selects the item
// source at runtime. Leaving it behind would mean the panel says one thing and the object does
// another. Pattern, label and status variable are left alone: they are inert without a folder, so
// switching back and forth does not lose them.
function SelectionItemSourceApply(prefix, source) {

    if (source !== 'folder') {
        SelectionDocumentApply('data-documentfolder', '');
        document.getElementById(prefix + 'ContextDocumentFolder').value = '';
    }

    SelectionItemSourceShow(prefix, source);
}

function DropDownContextInputHandlerItemSource(e) { SelectionItemSourceApply('DropDown', e.target.value); }
function ListBoxContextInputHandlerItemSource(e) { SelectionItemSourceApply('ListBox', e.target.value); }

function DropDownContextInputHandlerDocumentFolder(e) { SelectionDocumentApply('data-documentfolder', e.target.value); }
function DropDownContextInputHandlerDocumentPattern(e) { SelectionDocumentApply('data-documentpattern', e.target.value); }
function DropDownContextInputHandlerDocumentFrom(e) { SelectionDocumentApply('data-documentfrom', e.target.value); }
function DropDownContextInputHandlerDocumentTo(e) { SelectionDocumentApply('data-documentto', e.target.value); }
function DropDownContextInputHandlerDocumentLabel(e) { SelectionDocumentApply('data-documentlabel', e.target.value); }
function DropDownContextInputHandlerStatusVariable(e) { SelectionDocumentApply('data-statusvariable', e.target.value); }

function ListBoxContextInputHandlerDocumentFolder(e) { SelectionDocumentApply('data-documentfolder', e.target.value); }
function ListBoxContextInputHandlerDocumentPattern(e) { SelectionDocumentApply('data-documentpattern', e.target.value); }
function ListBoxContextInputHandlerDocumentFrom(e) { SelectionDocumentApply('data-documentfrom', e.target.value); }
function ListBoxContextInputHandlerDocumentTo(e) { SelectionDocumentApply('data-documentto', e.target.value); }
function ListBoxContextInputHandlerDocumentLabel(e) { SelectionDocumentApply('data-documentlabel', e.target.value); }
function ListBoxContextInputHandlerStatusVariable(e) { SelectionDocumentApply('data-statusvariable', e.target.value); }

// WIDGET INPUT HANDLERS

function WidgetContextInputHandlerHTML(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-html', e.target.value);

            ElementToBeDecorated.innerHTML = e.target.value;
        }
    }

}

function WidgetContextInputHandlerClickable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-clickable', e.target.checked);

            if (ElementToBeDecorated.getAttribute("data-clickable") === 'true') {
                ElementToBeDecorated.style.pointerEvents = "auto";
            }
            else {
                ElementToBeDecorated.style.pointerEvents = "none";
            }
        }
    }
}

// LABEL INPUT HANDLERS

function LabelContextInputHandlervariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
        }
    }

}
function LabelContextInputHandlerlabel(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            
            ElementToBeDecorated.setAttribute('data-label', e.target.value);
        }
    }

}

function LabelContextInputHandlerReadOnly(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
        if (ElementToBeDecorated) {

            ElementToBeDecorated.setAttribute('data-readonly', e.target.checked);

            if (e.target.checked) {
                ElementToBeDecorated.setAttribute('readonly', e.target.checked);
            } else {
                ElementToBeDecorated.removeAttribute('readonly')
            }

        }
    }
}

function LabelContextInputHandlerUnits(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-units', e.target.checked);
            ElementToBeDecorated.setAttribute('Units', e.target.checked);
        }
    }
}

function LabelContextInputHandlerFloatingPoint(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-floatingpoint', e.target.checked);

            if (e.target.checked) {
                document.getElementById('LabelContextDecimalsRow').style.display = "flex";
            }
            else {
                document.getElementById('LabelContextDecimalsRow').style.display = "none";
            }

        }
    }
}

function LabelContextInputHandlerNumpad(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-numpad', e.target.checked);

            if (e.target.checked) {
                document.getElementById('LabelContextNumpadDecimalSymbolRow').style.display = "flex";
                document.getElementById('LabelContextNumpadMinusSymbolRow').style.display = "flex";
            }
            else {
                document.getElementById('LabelContextNumpadDecimalSymbolRow').style.display = "none";
                document.getElementById('LabelContextNumpadMinusSymbolRow').style.display = "none";
            }

        }
    }
}

function LabelContextInputHandlerNumpadDecimalSymbol(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-numpaddecimalsymbol', e.target.checked);
        }
    }
}

function LabelContextInputHandlerNumpadMinusSymbol(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-numpadminussymbol', e.target.checked);
        }
    }
}

// SVG INPUT HANDLERS

function SVGContextGenericInputHandlerconditionstate(e) {

    //console.log(e);
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-conditionstate' + sequenceno, e.target.value);
        }
    }

}

function SVGContextInputHandlerstrokewidth(e) {
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            /*console.log('THIS '+ e.target.value);*/
            ElementToBeDecorated.setAttribute('data-strokewidth', e.target.value);

            SetPropertySVG('stroke-width', ElementToBeDecorated, e.target.value);
        }
    }

}

function SVGContextInputHandlerstrokecolor(e) {
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            /*console.log('THIS '+ e.target.value);*/
            ElementToBeDecorated.setAttribute('data-strokecolor', e.target.value);

            SetPropertySVG('stroke', ElementToBeDecorated, e.target.value);
        }
    }

}

function GetPropertySVG(property, svg) {

    var values = '';
    var isequal = false;
    var counter = 0;

    try {

        var svgouter = svg.outerHTML;
    
        var startindex = svgouter.indexOf(property + ':', 0);

        if (startindex == -1) {
            startindex = svgouter.indexOf(property + '=', 0);
            isequal = true;
        }

        while (startindex > 0) {

            if (isequal) {
                startindex = startindex + property.length + 2;
                endindex = svgouter.indexOf('"', startindex);
            }
            else {
                startindex = startindex + property.length + 1;
                endindex = svgouter.indexOf(';', startindex);
            }

            var value = svgouter.substring(startindex, endindex);

            isequal = false;

            values = values + value + ';'; // TODO ERROR HERE
        
            startindex = svgouter.indexOf(property + ':', endindex);

            if (startindex == -1) {
                startindex = svgouter.indexOf(property + '=', endindex);
                isequal = true;
            }

            counter++;

            if (counter > 1000) {
                return ''; //endless loop security
            }

            
        }

        values = values.slice(0, -1);

        //console.log(values);

    } catch (error) {

        //console.log(error);

    }

    return values;
}

function SetPropertySVG(property, svg, value) {

    try {

        var strokewidths = value.split(';');

        var counter = 0;

        var svgouter = svg.outerHTML;

        var startindex = svgouter.indexOf(property + ':', 0);

        var isequal = false;

        if (startindex == -1) {
            startindex = svgouter.indexOf(property + '=', 0);
            isequal = true;
        }

        while (startindex > 0) {

            if (isequal) {
                startindex = startindex + property.length + 2;
                endindex = svgouter.indexOf('"', startindex);
            }
            else {
                startindex = startindex + property.length + 1;
                endindex = svgouter.indexOf(';', startindex);
            }

            var value = svgouter.substring(startindex, endindex);

            if (isequal) {
                svgouter = svgouter.replaceAll(property + "=\"" + value + "\"", property + "=\"" + strokewidths[counter] + "\"");
            }
            else {
                svgouter = svgouter.replaceAll(property + ":" + value + ";", property + ":" + strokewidths[counter] + ";");
            }
            
            counter++;

            isequal = false;
             
            startindex = svgouter.indexOf(property + ':', endindex);

            if (startindex == -1) {
                startindex = svgouter.indexOf(property + '=', endindex);
                isequal = true;
            }

            if (counter > 1000) {
                return; //endless loop security
            }

        }

        svg.outerHTML = svgouter;

    } catch (error) {

        //console.log(error);

    }
}

function SVGContextisbackgroundInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (e.target.checked) {
            ElementsToBeDecorated[i - 1].setAttribute('data-isbackground', "");

            if (ShowHidden === false) {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "none";
            }
            else {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";
            }

            document.getElementById("CustomModalText").innerHTML = 'Use the Eye icon (Ctrl+I) to make the background selectable again.';
            var myModal = new bootstrap.Modal(document.getElementById('CustomModal'));
            myModal.show();
            
        }
        else {
            ElementsToBeDecorated[i - 1].removeAttribute('data-isbackground');
            ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";
        }
    }
}

// Image INPUT HANDLERS

function ImageContextisbackgroundInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (e.target.checked) {
            ElementsToBeDecorated[i - 1].setAttribute('data-isbackground', "");

            if (ShowHidden === false) {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "none";
            }
            else {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";
            }

            document.getElementById("CustomModalText").innerHTML = 'Use the Eye icon (Ctrl+I) to make the background selectable again.';
            var myModal = new bootstrap.Modal(document.getElementById('CustomModal'));
            myModal.show();

        }
        else {
            ElementsToBeDecorated[i - 1].removeAttribute('data-isbackground');
            ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";
        }
    }
} 

// POLYGON INPUT HANDLERS

function PolygonContextGenericInputHandlerconditionstate(e) {

    //console.log(e);
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-conditionstate' + sequenceno, e.target.value);
        }
    }

}

function PolygonContextisbackgroundInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (e.target.checked) {
            ElementsToBeDecorated[i - 1].setAttribute('data-isbackground', "");

            if (ShowHidden === false) {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "none";
            }
            else {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";
            }

            document.getElementById("CustomModalText").innerHTML = 'Use the Eye icon (Ctrl+I) to make the background selectable again.';
            var myModal = new bootstrap.Modal(document.getElementById('CustomModal'));
            myModal.show();

        }
        else {
            ElementsToBeDecorated[i - 1].removeAttribute('data-isbackground');
            ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";
        }
    }

    RedrawPolygonDots();
}


// POLYLINE INPUT HANDLERS

function PolylineContextGenericInputHandlerconditionstate(e) {

    //console.log(e);
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-conditionstate' + sequenceno, e.target.value);
        }
    }

}

function PolylineContextstrokewidthInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var polyVisible = ElementToBeDecorated.querySelector('polyline.poly-visible');
            var polyHit = ElementToBeDecorated.querySelector('polyline.poly-hit');
            
            polyVisible.style.strokeWidth = e.target.value;
            //polyHit.style.strokeWidth = getPolylineHitStrokeWidth(e.target.value) + 'px';

            ElementToBeDecorated.setAttribute('data-strokewidth', e.target.value);
            ElementToBeDecorated.style.strokeWidth = e.target.value;

            ResetViewBoxPolyline(ObjDom);
            RedrawPolylineBorder(ObjDom);

            var linestyle = ElementToBeDecorated.getAttribute('data-linestyle');

            if (linestyle) {
                ResetLineDashArray(ElementToBeDecorated, linestyle)
            }

        }
    }

}

// ── Polyline arrowheads and bridges ────────────────────────────────────────────────────────────

// Dropdown caption for a stored arrow value. Kept beside the handlers so the label and the stored
// value cannot drift apart.
function PolylineArrowLabel(value) {

    var key = (value === "Arrow" || value === "OpenArrow") ? value : "None";

    return (typeof PolylineArrowTranslations !== 'undefined' && PolylineArrowTranslations[key]) || key;
}

function SetPolylineArrow(el, attribute, buttonId) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (!ElementToBeDecorated) {
            continue;
        }

        var value = el.getAttribute("data-value");

        if (value === "None") {
            ElementToBeDecorated.removeAttribute(attribute);
        }
        else {
            ElementToBeDecorated.setAttribute(attribute, value);
        }

        // Rebuilds the markers AND re-pads the viewBox, so a head is never clipped.
        ResetViewBoxPolyline(ElementToBeDecorated);

        document.getElementById(buttonId).innerHTML = PolylineArrowLabel(value);
    }
}

function SetArrowStart(el) {
    SetPolylineArrow(el, 'data-arrowstart', 'PolylineContextarrowstart');
}

function SetArrowEnd(el) {
    SetPolylineArrow(el, 'data-arrowend', 'PolylineContextarrowend');
}

function PolylineContextarrowsizeInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (!ElementToBeDecorated) {
            continue;
        }

        if (e.target.value === "") {
            ElementToBeDecorated.removeAttribute('data-arrowsize');
        }
        else {
            ElementToBeDecorated.setAttribute('data-arrowsize', e.target.value);
        }

        ResetViewBoxPolyline(ElementToBeDecorated);
    }
}

function PolylineContextbridgeInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (!ElementToBeDecorated) {
            continue;
        }

        if (e.target.checked) {
            ElementToBeDecorated.setAttribute('data-bridge', "true");
        }
        else {
            ElementToBeDecorated.removeAttribute('data-bridge');
        }
    }

    // Crossings are a page-wide relationship, so one line opting in or out changes what every
    // other line has to draw.
    RedrawPolylineBridges();
}

function PolylineContextisbackgroundInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (e.target.checked) {
            ElementsToBeDecorated[i - 1].setAttribute('data-isbackground', "");

            if (ShowHidden === false) {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "none";

                const poly = ObjDom.querySelector('.poly-visible');
                if (poly) poly.style.pointerEvents = 'none';

            }
            else {
                ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";

                const poly = ObjDom.querySelector('.poly-visible');
                if (poly) poly.style.pointerEvents = 'stroke';
            }

            document.getElementById("CustomModalText").innerHTML = 'Use the Eye icon (Ctrl+I) to make the background selectable again.';
            var myModal = new bootstrap.Modal(document.getElementById('CustomModal'));
            myModal.show();

        }
        else {
            ElementsToBeDecorated[i - 1].removeAttribute('data-isbackground');
            ElementsToBeDecorated[i - 1].style.pointerEvents = "auto";
        }

        RedrawPolygonDots();
    }
}

// SQUARE INPUT HANDLERS

function SquareContextGenericInputHandlerconditionstate(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-conditionstate' + sequenceno, e.target.value);
        }
    }

}

// CIRCLE INPUT HANDLERS

function CircleContextGenericInputHandlerconditionstate(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-conditionstate' + sequenceno, e.target.value);
        }
    }

}

// KNOB INPUT HANDLERS

function KnobContextInputHandlervariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerMinValue(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-MinValue', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerMaxValue(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-MaxValue', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerValueResolution(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-ValueResolution', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerFontFamily(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontfamily', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerFontSize(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontsize', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerFontWeight(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontweight', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerZeroAt(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-ZeroAt', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerAngleMin(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-AngleMin', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerAngleMax(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-AngleMax', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerBackgroundTrackRadius(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-BackgroundTrackRadius', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerBackgroundTrackWidth(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-BackgroundTrackWidth', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerTrackRadius(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-TrackRadius', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerTrackWidth(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-TrackWidth', e.target.value);
            knobtoinit(ElementToBeDecorated);
        }
    }

}

function KnobContextInputHandlerWriteTimeoutTime(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-writetimeouttime', e.target.value);
        }
    }

}

function KnobContextInputHandlerReadOnly(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-readonly', e.target.checked);

            if (e.target.checked) {
                ElementToBeDecorated.setAttribute('readonly', e.target.checked);
            } else {
                ElementToBeDecorated.removeAttribute('readonly')
            }
        }
    }
}

function KnobContextInputHandlerUnits(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-units', e.target.checked);
            ElementToBeDecorated.setAttribute('Units', e.target.checked);
        }
    }
}

function KnobContextGenericInputHandlerconditionstate(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-conditionstate' + sequenceno, e.target.value);
        }
    }

}

// Slider INPUT HANDLERS
function SliderContextInputHandlerVariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerMinValue(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-minvalue', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerMaxValue(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-maxvalue', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerValueResolution(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-valueresolution', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextTrackBorderWidthInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-trackborderwidth', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextTrackBorderRadiusInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-trackborderradius', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerThumbWidth(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbwidth', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerThumbHeight(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbheight', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextThumbBorderWidthInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbborderwidth', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextThumbBorderRadiusInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbborderradius', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerFontFamily(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontfamily', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerFontSize(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontsize', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerFontWeight(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontweight', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerFeedbackMarginTop(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-feedbackmargintop', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerWriteTimeoutTime(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-writetimeouttime', e.target.value);
            slidertoinit(ElementToBeDecorated);
        }
    }

}

function SliderContextInputHandlerTextHidden(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-texthidden', e.target.checked);
            slidertoinit(ElementToBeDecorated);
        }
    }
}

// Donut INPUT HANDLERS
function DonutContextInputHandlerVariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerMinValue(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-minvalue', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerMaxValue(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-maxvalue', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerValueResolution(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-valueresolution', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextTrackBorderWidthInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-trackborderwidth', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextTrackBorderRadiusInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-trackborderradius', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerThumbWidth(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbwidth', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerThumbHeight(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbheight', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextThumbBorderWidthInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbborderwidth', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextThumbBorderRadiusInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-thumbborderradius', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerFontFamily(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontfamily', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerFontSize(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontsize', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerFontWeight(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontweight', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerFeedbackMarginTop(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-feedbackmargintop', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerWriteTimeoutTime(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-writetimeouttime', e.target.value);
            donuttoinit(ElementToBeDecorated);
        }
    }

}

function DonutContextInputHandlerTextHidden(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-texthidden', e.target.checked);
            donuttoinit(ElementToBeDecorated);
        }
    }
}



// CheckBox INPUT HANDLERS TO DO

function CheckBoxContextInputHandlervariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
        }
    }
}

function CheckBoxContextborderradiusInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var ObjDom = ElementToBeDecorated;
            var borderRadius = e.target.value;
            ObjDom.style.borderRadius = borderRadius;

            ObjDom.setAttribute("data-borderradius", borderRadius);
        }

    }

}

function CheckBoxContextborderwidthInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var ObjDom = ElementToBeDecorated;
            var borderWidth = e.target.value;
            ObjDom.style.borderWidth = borderWidth;

            ObjDom.setAttribute("data-borderwidth", borderWidth);
        }
    }

}


// Toggle INPUT HANDLERS TO DO

function ToggleContextInputHandlervariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
        }
    }
}

function ToggleContextInputHandlerontext(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-ontext', e.target.value);
        }
    }

}

function ToggleContextInputHandlerofftext(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-offtext', e.target.value);
        }
    }

}

function ToggleContextInputHandlerFontFamily(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontfamily', e.target.value);

            ElementToBeDecorated.style.fontFamily = ElementToBeDecorated.getAttribute('data-fontfamily');
        }
    }

}

function ToggleContextInputHandlerFontSize(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontsize', e.target.value);

            ElementToBeDecorated.style.fontSize = ElementToBeDecorated.getAttribute('data-fontsize');
        }
    }

}

function ToggleContextInputHandlerFontWeight(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-fontweight', e.target.value);

            ElementToBeDecorated.style.fontWeight = ElementToBeDecorated.getAttribute('data-fontweight');
        }
    }
}

function ToggleContextInputHandlerPaddingLeftText(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-paddinglefttext', e.target.value);

            var ToggleTextLeft = ElementToBeDecorated.getElementsByClassName("ToggleTextLeft")[0];
            ToggleTextLeft.style.paddingRight = ElementToBeDecorated.getAttribute('data-paddinglefttext');
        }
    }
}

function ToggleContextInputHandlerPaddingRightText(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-paddingrighttext', e.target.value);

            var ToggleTextRight = ElementToBeDecorated.getElementsByClassName("ToggleTextRight")[0];
            ToggleTextRight.style.paddingLeft = ElementToBeDecorated.getAttribute('data-paddingrighttext');
        }
    }
}

// RadioButton INPUT HANDLERS TO DO

// DropDown INPUT HANDLERS TO DO

function DropDownContextInputHandlerVariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
        }
    }

}

function DropDownContextInputHandlerValues(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-values', e.target.value);
        }
    }

}

function DropDownContextInputHandleritems(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-items', e.target.value);
        }
    }

}

function DropDownContextInputHandlerListHeight(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            let listheight = parseInt(e.target.value);
            if (isNaN(listheight) || listheight <= 0) {
                listheight = 250;
            }

            ElementToBeDecorated.setAttribute('data-listheight', listheight);

            var ul = ElementToBeDecorated.parentElement.getElementsByTagName("ul")[0];
            ul.style.maxHeight = listheight + "px";
            ul.style.overflowY = "auto";
        }
    }

}

// LISTBOX INPUT HANDLERS

function ListBoxContextInputHandlerVariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
        }
    }

}

function ListBoxContextInputHandlerValues(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-values', e.target.value);
        }
    }

}

function ListBoxContextInputHandleritems(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-items', e.target.value);
        }
    }

}

function ListBoxContextMultiSelectInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        var el = getObjDom(ElementsToBeDecorated[i - 1]);

        if (el) {
            el.setAttribute('data-multiselect', e.target.checked ? 'true' : 'false');
            el.multiple = e.target.checked;
        }
    }

}
