// Envision PropertyHandlers - Property input handlers: shared style-format/position/border/visibility/access/page/generic handlers.
// Split from Envision.js. Global scope (no module system); load order defined in Envision.cshtml.

// GENERIC INPUT HANDLERS

function GenericInputHandler(e, attr, initFunction) {
    //console.log(e);
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-' + attr, e.target.value);

            if (typeof initFunction === "function") {
                initFunction(ElementToBeDecorated);
            }
        }
    }
}

function GenericInputCheckboxHandler(e, attr, initFunction) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-' + attr, e.target.checked);

            if (typeof initFunction === "function") {
                initFunction(ElementToBeDecorated);
            }
        }
    }
}

function ResetLineDashArray(element, linestyle) {
    
    var strokeWidth = parseFloat(element.style.strokeWidth.replace("px", ""));
    var dasharray;

    switch (linestyle) {
        case "Solid":
            dasharray = "";
            break;
        case "Dotted":
            dasharray = strokeWidth * 2;
            break;
        case "Dashed":
            dasharray = strokeWidth * 4;
            break;
        case "Long Dash":
            dasharray = strokeWidth * 6;
            break;
        default:
            // An unknown style leaves the line as it is. Assigning undefined here used to write
            // the string "undefined" into the declaration, which the browser drops.
            return;
    }

    element.style.strokeDasharray = dasharray;
       /* ObjDom.style.strokeDashoffset = abc;*/

}

// GENERIC INPUT HANDLERS

function GenericisbackgroundInputHandler(e) {

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

// StyleFormat INPUT HANDLERS

function StyleFormatContextFontSizeInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var ObjDom = ElementToBeDecorated;
            var fontsize = e.target.value;

            ObjDom.style.fontSize = fontsize;

        }

    }

}

function StyleFormatContextFontFamilyInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var ObjDom = ElementToBeDecorated;
            var fontfamily = e.target.value;

            ObjDom.style.fontFamily = fontfamily;

        }

    }

}

function StyleFormatContextpaddingInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var ObjDom = ElementToBeDecorated;
            var padding = e.target.value;

            ObjDom.style.padding = padding;

        }

    }

}

// ACTION INPUT HANDLERS

function StyleFormatContextActionVariableGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        //popup2 <===== why is this here, and why action2? 
        //if (ElementToBeDecorated.getAttribute("data-action2popupsymbolname")) {
        //    var PopupSymbolName = document.getElementById('StyleFormatContextAction2PopupSymbolName');
        //    PopupSymbolName.value = ElementToBeDecorated.getAttribute("data-action2popupsymbolname");
        //}

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'variable', e.target.value);
        }

    }
}

function StyleFormatContextActionValueGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'value', e.target.value);
        }

    }
}

function StyleFormatContextActionPythonScriptGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'pythonScript', e.target.value);
        }

    }
}

function StyleFormatContextActionRecipeGenericInputHandler(e) {
    
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
        
        if (ElementToBeDecorated) {

            var sequenceno = e.srcElement.getAttribute('data-sequenceno');
            
            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'recipe', e.target.value);

            //console.log(ElementToBeDecorated.getAttribute('data-action' + sequenceno + 'recipe'));

        }

    }
}

function StyleFormatContextActionPageGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'page', e.target.value);

        }

    }
}

function StyleFormatContextActionSelectLanguageGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'selectlanguage', e.target.value);

        }

    }
}

function StyleFormatContextActionTrendAnalystConfigGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'trendanalystconfig', e.target.value);

        }

    }
}

function StyleFormatContextActionColorProfileConfigGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'colorprofileconfig', e.target.value);

        }

    }
}



function StyleFormatContextActionURLGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'url', e.target.value);

        }

    }
}

function StyleFormatContextActionLoginUsernameGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'loginusername', e.target.value);

        }

    }
}

function StyleFormatContextActionLoginPasswordGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'loginpassword', e.target.value);

        }

    }
}

function StyleFormatContextActionExecutePageScriptFunctionGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');
            //console.log('sequenceno ' + sequenceno);
            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'executepagescriptfunction', e.target.value);

        }

    }
}

function StyleFormatContextActionExecuteColorProfileFunctionGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');
            //console.log('sequenceno ' + sequenceno);
            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'executecolorprofilefunction', e.target.value);

        }

    }
}



function StyleFormatContextActionTransferRecipeFromGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'transferrecipefrom', e.target.value);

        }

    }
}

function StyleFormatContextActionTransferRecipeToGenericInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-action' + sequenceno + 'transferrecipeto', e.target.value);

        }

    }
}

// PAGE INPUT HANDLERS

function PageContextHeightInputHandler(e) {

    ElementToBeDecorated = document.getElementById("EnvisionPage");

    var ObjDom = ElementToBeDecorated;
    var height = e.target.value;
    ObjDom.style.height = height;

}

function PageContextWidthInputHandler(e) {

    ElementToBeDecorated = document.getElementById("EnvisionPage");

    var ObjDom = ElementToBeDecorated;
    var width = e.target.value;
    ObjDom.style.width = width;
}

function PageContextTopInputHandler(e) {

    ElementToBeDecorated = document.getElementById("EnvisionPage");

    var ObjDom = ElementToBeDecorated;
    var top = e.target.value;
    ObjDom.style.top = top;
}

function PageContextLeftInputHandler(e) {

    ElementToBeDecorated = document.getElementById("EnvisionPage");

    var ObjDom = ElementToBeDecorated;
    var left = e.target.value;
    ObjDom.style.left = left;

    //console.log(ObjDom.style.left);

}

// MULTI INPUT HANDLERS

function StyleFormatContextWidthInputHandler(e) {

    if (!e.target.value.includes('%')) {
        ManualResizeWidth(e.target.value.replace('px', ''));
    }
    else {

        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

            ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

            if (ElementToBeDecorated) {

                var ObjDom;

                if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                    ObjDom = ElementToBeDecorated;
                }
                else {
                    ObjDom = ElementToBeDecorated.parentElement;
                }

                var width = e.target.value;

                ObjDom.style.width = width;

                SetResetTexts();
                SetBorders();

                if (ObjDom.getAttribute('name') === 'SVGObject') {
                    let svgDom = ObjDom.getElementsByTagName("svg")[0];
                    if (svgDom != null) {
                        
                        svgDom.style.width = '100%';
                    }
                }

            }
        }
    }

}

function StyleFormatContextHeightInputHandler(e) {
    
    if (!e.target.value.includes('%')) {
        ManualResizeHeight(e.target.value.replace('px', ''));
    }
    else {
        
        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
            
            ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
            
            if (ElementToBeDecorated) {

                var ObjDom;

                if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                    ObjDom = ElementToBeDecorated;
                }
                else {
                    ObjDom = ElementToBeDecorated.parentElement;
                }

                var height = e.target.value;

                ObjDom.style.height = height;

                //console.log(height);

                SetResetTexts();
                SetBorders();

                /*if (ElementToBeDecorated.getAttribute('name') !== 'GroupObject') {*/
                if (ObjDom.getAttribute('name') === 'SVGObject' || ObjDom.getAttribute('name') === 'PolygonObject') {
                    let svgDom = ObjDom.getElementsByTagName("svg")[0];
                    if (svgDom != null) {
                        svgDom.style.height = '100%';
                    }
                }

                
            }
        }
    }
}

function StyleFormatContextTopInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated.parentElement) {

            var ObjDom;

            if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                ObjDom = ElementToBeDecorated;
            }
            else {
                ObjDom = ElementToBeDecorated.parentElement;
            }

            if (IsPartOfScaledGroupObject(ObjDom)) {
                ResizingScaledError();

                closeconfigs();

                return;
            }

            var top = e.target.value;

            ObjDom.style.top = top;

            var positiontext = ObjDom.getElementsByClassName("positiontext")[0];
            if (positiontext) {
                positiontext.innerHTML = ObjDom.style.left + " " + ObjDom.style.top;
            }

            CheckResizeGroup2(ObjDom);
        }
    }

    RedrawBorders();
    SetResetTexts();

}

function StyleFormatContextLeftInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated.parentElement) {

            var ObjDom;

            if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                ObjDom = ElementToBeDecorated;
            }
            else {
                ObjDom = ElementToBeDecorated.parentElement;
            }

            if (IsPartOfScaledGroupObject(ObjDom)) {
                ResizingScaledError();

                closeconfigs();

                return;
            }

            var left = e.target.value;

            ObjDom.style.left = left;

            var positiontext = ObjDom.getElementsByClassName("positiontext")[0];
            if (positiontext) {
                positiontext.innerHTML = ObjDom.style.left + " " + ObjDom.style.top;
            }

            CheckResizeGroup2(ObjDom);
        }

        
    }

    RedrawBorders();
    SetResetTexts();

}

function StyleFormatContextzIndexInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated.parentElement) {

            var ObjDom;

            if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
                ObjDom = ElementToBeDecorated;
            }
            else {
                ObjDom = ElementToBeDecorated.parentElement;
            }

            var zindex = e.target.value;

            ObjDom.style.zIndex = zindex;

            var zindextext = ObjDom.getElementsByClassName("zindextext")[0];

            if (zindextext) {
                zindextext.innerHTML = ObjDom.style.zIndex;
            }
        }
    }

}

function StyleFormatContextVisibilityInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-visibility', e.target.value);
        }
    }

}

function StyleFormatContextBlinkInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-blink', e.target.value);
        }
    }

}

function StyleFormatContextBlinkOffsetInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-blinkoffset', e.target.checked);
        }
    }
}

// OBJECT NAME INPUT HANDLER

function StyleFormatContextObjectNameInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        if (ElementsToBeDecorated[i - 1]) {
            ElementsToBeDecorated[i - 1].setAttribute('data-system-objectname', e.target.value);
        }

        return; //only set first because they need to be unique
    }

}

// POSITION SIZE INPUT HANDLERS

function StyleFormatContextHeightVariableInputHandler(e) {


    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-heightvariable', e.target.value);
        }
        
        if (e.target.value == "") {

            var ObjType = ElementsToBeDecorated[i - 1].getAttribute('name');

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {

                ElementToBeDecorated.style.height = ElementsToBeDecorated[i - 1].style.height;

                var ObjDom = ElementToBeDecorated;

                ResetDimensionsSVG(ObjDom);
            }
            else {
                ElementToBeDecorated.style.height = '100%'; // for regular objects like buttons etc... 
            }

        }
    }

}

function StyleFormatContextHeightMinRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-heightminraw', e.target.value);
        }
    }

}

function StyleFormatContextHeightMaxRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-heightmaxraw', e.target.value);
        }
    }

}

function StyleFormatContextHeightMinPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-heightminpx', e.target.value);
        }
    }

}

function StyleFormatContextHeightMaxPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-heightmaxpx', e.target.value);
        }
    }

}

function StyleFormatContextheightreverseInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-heightreverse', e.target.checked);
        }
    }
}


function StyleFormatContextWidthVariableInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-widthvariable', e.target.value);
        }

        if (e.target.value == "") {

            var ObjType = ElementsToBeDecorated[i - 1].getAttribute('name');

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {

                ElementToBeDecorated.style.width = ElementsToBeDecorated[i - 1].style.width;

                var ObjDom = ElementToBeDecorated;

                ResetDimensionsSVG(ObjDom);
            }
            else {
                ElementToBeDecorated.style.width = '100%'; // for regular objects like buttons etc...
            }

        }
    }

}

function StyleFormatContextWidthMinRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-widthminraw', e.target.value);
        }
    }

}

function StyleFormatContextWidthMaxRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-widthmaxraw', e.target.value);
        }
    }

}

function StyleFormatContextWidthMinPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-widthminpx', e.target.value);
        }
    }

}

function StyleFormatContextWidthMaxPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-widthmaxpx', e.target.value);
        }
    }

}

function StyleFormatContextwidthreverseInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            ElementToBeDecorated.setAttribute('data-widthreverse', e.target.checked);
            
        }
    }
}



function StyleFormatContextTopVariableInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-topvariable', e.target.value);
        }

        if (e.target.value == "") {

            var ObjType = ElementsToBeDecorated[i - 1].getAttribute('name');

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {

                var ObjDom = ElementToBeDecorated;

                ResetDimensionsSVG(ObjDom);
            }
            else {
                ElementToBeDecorated.style.marginBottom = "0px";
            }

        }
    }

}

function StyleFormatContextTopMinRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-topminraw', e.target.value);
        }
    }

}

function StyleFormatContextTopMaxRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-topmaxraw', e.target.value);
        }
    }

}

function StyleFormatContextTopMinPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-topminpx', e.target.value);
        }
    }

}

function StyleFormatContextTopMaxPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-topmaxpx', e.target.value);
        }
    }

}


function StyleFormatContextLeftVariableInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-leftvariable', e.target.value);
        }

        if (e.target.value == "") {

            var ObjType = ElementsToBeDecorated[i - 1].getAttribute('name');

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {

                var ObjDom = ElementToBeDecorated;

                ResetDimensionsSVG(ObjDom);
            }
            else {
                ElementToBeDecorated.style.marginLeft = "0px";
            }
        }
    }

}

function StyleFormatContextLeftMinRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-leftminraw', e.target.value);
        }
    }

}

function StyleFormatContextLeftMaxRawInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-leftmaxraw', e.target.value);
        }
    }

}

function StyleFormatContextLeftMinPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-leftminpx', e.target.value);
        }
    }

}

function StyleFormatContextLeftMaxPxInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-leftmaxpx', e.target.value);
        }
    }

}

function StyleFormatContextReplaceGenericInputHandler(e) {

    //console.log(e.srcElement);

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var sequenceno = e.srcElement.getAttribute('data-sequenceno');
            ElementToBeDecorated.setAttribute('data-replace' + sequenceno, e.target.value);

        }
    }

}

// ACCESS CONTROL INPUT HANDLES

function StyleFormatContextaccesscontrolenableInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-accesscontrolenable', e.target.checked);
        }
    }
}
function StyleFormatContextaccesscontrolInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-accesscontrol', e.target.value);
        }
    }

}
function StyleFormatContextaccesscontrolfilterInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-accesscontrolfilter', e.target.value);
        }
    }

}


// ROTATION INPUT HANDLES

async function StyleFormatContexttransformrotateInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-transformrotate', e.target.value);
        }

        transformrotate = ElementToBeDecorated.getAttribute("data-transformrotate");

        if (ElementToBeDecorated.parentElement.getAttribute('name') === 'SVGObject') {

            RotationAnimation(ElementToBeDecorated);

            ResetDimensionsSVG(ElementToBeDecorated);

        }
    }

}
function StyleFormatContexttransformoriginInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-transformorigin', e.target.value);
        }
    }

}

// Continuous rotation. The attributes are REMOVED rather than written empty when a field is
// cleared, so an object that does not spin keeps the markup it had before this feature existed and
// nothing downstream has to special-case an empty value.
function StyleFormatContextrotateenableInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (!ElementToBeDecorated) {
            continue;
        }

        if (e.target.value === "") {
            ElementToBeDecorated.removeAttribute('data-rotateenable');
        }
        else {
            ElementToBeDecorated.setAttribute('data-rotateenable', e.target.value);
        }
    }
}

function StyleFormatContextrotatespeedInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (!ElementToBeDecorated) {
            continue;
        }

        if (e.target.value === "") {
            ElementToBeDecorated.removeAttribute('data-rotatespeed');
        }
        else {
            ElementToBeDecorated.setAttribute('data-rotatespeed', e.target.value);
        }
    }
}

function StyleFormatContextrotatedirectionInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (!ElementToBeDecorated) {
            continue;
        }

        if (e.target.value === "") {
            ElementToBeDecorated.removeAttribute('data-rotatedirection'); // empty means clockwise
        }
        else {
            ElementToBeDecorated.setAttribute('data-rotatedirection', e.target.value);
        }
    }
}


// BORDER INPUT HANDLERS

function StyleFormatContextGenericInputHandlerborderconditionstate(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            var sequenceno = e.srcElement.getAttribute('data-sequenceno');

            ElementToBeDecorated.setAttribute('data-borderconditionstate' + sequenceno, e.target.value);
        }
    }

}


function StyleFormatContextBorderRadiusInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var ObjDom = ElementToBeDecorated;
            var borderRadius = e.target.value;
            ObjDom.style.borderRadius = borderRadius;
        }

    }

}

function StyleFormatContextBorderWidthInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {

            var ObjDom = ElementToBeDecorated;
            var borderWidth = e.target.value;

            if (ElementToBeDecorated.parentElement.getAttribute('name') == "PolygonObject") {
                ObjDom.style.strokeWidth = borderWidth;
                ResetViewBoxPolygon(ObjDom);
            }
            else if (ElementToBeDecorated.parentElement.getAttribute('name') == "PolylineObject") {
                ObjDom.setAttribute("data-borderwidth", borderWidth);
                RedrawPolylineBorder(ObjDom);
                ResetViewBoxPolylineBorder(ObjDom);
            }
            else {
                ObjDom.style.borderWidth = borderWidth;
                
            }
        }

    }

}

function StyleFormatContextBorderVisibilityInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-bordervisibility', e.target.value);
        }
    }

}

function StyleFormatContextBorderBlinkInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-borderblink', e.target.value);
        }
    }

}

function StyleFormatContextBorderBlinkOffsetInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-borderblinkoffset', e.target.checked);
        }
    }
}

// GROUP

function StyleFormatContextGroupSymbolInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        /*console.log(ElementsToBeDecorated[i - 1]);*/

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-groupsymbol', e.target.value);
            ReplaceStyleFormatInit();

            //add _copy to templates to avoid duplicate masters
            if (ElementToBeDecorated.hasAttribute('data-groupsymbolmaster') && ElementToBeDecorated.getAttribute('data-groupsymbolmaster') === '') {

                var master;

                master = GetSymbolMaster(e.target.value);

                if (master) {
                    alert('There is already a Master Symbol with the name "' + e.target.value + '"');
                }
            }
        }
    }
}

function StyleFormatContextGroupSymbolMasterInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-groupsymbolmaster', e.target.value);
            ReplaceStyleFormatInit();
        }
    }
}

function StyleFormatContextGroupMarginsInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom;

        if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
            ObjDom = ElementToBeDecorated;
        }
        else {
            ObjDom = ElementToBeDecorated.parentElement;
        }

        var value = e.target.value;

        ObjDom.style.margin = value;

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-groupmargins', e.target.value);
        }
    }
}

function StyleFormatContextGroupFloatInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom;

        if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
            ObjDom = ElementToBeDecorated;
        }
        else {
            ObjDom = ElementToBeDecorated.parentElement;
        }

        var value = e.target.value;

        ObjDom.style.float = value;

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-groupfloat', e.target.value);
        }
    }
}

function StyleFormatContextGroupPositionInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);


        var ObjDom;

        if (ElementToBeDecorated.getAttribute('name') === 'GroupObject') {
            ObjDom = ElementToBeDecorated;
        }
        else {
            ObjDom = ElementToBeDecorated.parentElement;
        }

        //console.log(ObjDom);

        var value = e.target.value;

        ObjDom.style.position = value;

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-groupposition', e.target.value);
        }
    }
}

function StyleFormatContextGroupScaleInputHandler(e) {

    const input = e.target;
    const value = input.value.trim();
    const num = parseFloat(value);

    if (isNaN(num)) return;

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom = (ElementToBeDecorated.getAttribute('name') === 'GroupObject')
            ? ElementToBeDecorated
            : ElementToBeDecorated.parentElement;

        // Find parent group (if any)
        const parentGroup = ObjDom.parentElement?.closest('[name="GroupObject"]');

        if (parentGroup) {

            // --- RESTORE INPUT VALUE FROM EXISTING SCALE ---
            const currentScale = ObjDom.getAttribute('data-groupscale') || "1";
            input.value = currentScale;
            // ------------------------------------------------

            alert("You cannot scale a GroupObject that is inside another GroupObject.");
            return;
        }

        ObjDom.style.Scale = value;

        if (num === 0.0 || num === 1.0) {
            ObjDom.style.transform = "";
            ObjDom.style.transformOrigin = "";
        }
        else {
            ObjDom.style.transform = "scale(" + num + ")";
            ObjDom.style.transformOrigin = "top left";
        }

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-groupscale', value);
        }
    }

    SetResetTexts();
}



function StyleFormatContextGroupLibraryPathInputHandler(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-grouplibrarypath', e.target.value);
        }
    }
}

//function SetButtonType(el) {
//    var ObjDom = ElementToBeDecorated;
//    var buttontype = el.innerHTML;

//    ObjDom.setAttribute("data-buttontype", buttontype);

//    var ButtonContextButtonType = document.getElementById('ButtonContextButtonType');
//    ButtonContextButtonType.innerHTML = buttontype;
//}

function SetFontAlign(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom = ElementToBeDecorated;
        var fontalign = el.getAttribute('data-value');

        ObjDom.style.textAlign = fontalign;

        var StyleFormatContextFontAlign = document.getElementById('StyleFormatContextFontAlign');
        StyleFormatContextFontAlign.setAttribute('data-value', fontalign);
        StyleFormatContextFontAlign.innerHTML = (typeof FontAlignTranslations !== 'undefined' && FontAlignTranslations[fontalign]) || fontalign;
    }
}

function SetLineStyle(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom = ElementToBeDecorated;

        var dasharray = el.getAttribute("data-value");
        
        ObjDom.setAttribute('data-linestyle', el.dataset.value);

        ResetLineDashArray(ObjDom, el.dataset.value);

        var PolylineContextlinestyle = document.getElementById('PolylineContextlinestyle');
        PolylineContextlinestyle.innerHTML = el.dataset.value;

        RedrawPolylineBorder(ObjDom);
    }
}

function SetLineCap(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom = ElementToBeDecorated;

        var linecap = el.getAttribute("data-value");
        ObjDom.style.strokeLinecap = linecap;
        ObjDom.setAttribute('data-linecap', el.dataset.value);

        var PolylineContextlinecap = document.getElementById('PolylineContextlinecap');
        PolylineContextlinecap.innerHTML = el.innerHTML;

        RedrawPolylineBorder(ObjDom);
    }
}

function SetFontWeight(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom = ElementToBeDecorated;
        var fontweight = el.innerHTML;

        ObjDom.style.fontWeight = fontweight;

        var StyleFormatContextFontWeight = document.getElementById('StyleFormatContextFontWeight');
        StyleFormatContextFontWeight.innerHTML = fontweight;
    }
}

function SetDatabase(el) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        var ObjDom = ElementToBeDecorated;
        var database = el.dataset.value;

        ObjDom.setAttribute("data-database", database);

        var datatableContextDatabase = document.getElementById('datatableContextDatabase');
        datatableContextDatabase.innerHTML = el.innerHTML;
    }
}

function PageDisableZoomChanged() {
    DisableZoom = document.getElementById("PageContextDisableZoom").checked;
    //console.log(DisableZoom);
}

function PageDisablePanChanged() {
    DisablePan = document.getElementById("PageContextDisablePan").checked;
    //console.log(DisableZoom);
}
