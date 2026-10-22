// Envision Animations - Object animation engine: GetAttributes* readers and *Animation appliers (visibility, position/size, rotation, border, access control).
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

function SyncAnimations() {

    var anims = document.getAnimations();

    let animsstarttime;

    if (anims.length > 0) {

        if (anims[0].animationName == "blinker" || anims[0].animationName == "borderblinker") {

            animsstarttime = anims[0].currentTime;

            for (let i = 1; i < anims.length; i++) {
                if (anims[i].animationName == "blinker" || anims[i].animationName == "borderblinker") {
                    anims[i].currentTime = animsstarttime;
                }
            }

        }
    }
}

function getColorFromStates(ObjDom, attributeName) {
    let colorStatesAttr = ObjDom.getAttribute(attributeName);
    let colorStates = [];

    try {
        colorStates = JSON.parse(colorStatesAttr.replace(/&quot;/g, '"'));
    } catch (e) {

        if (!colorStatesAttr) {
            ObjDom.setAttribute(attributeName, JSON.stringify(colorStates));
        }
        else {
            console.error(`Failed to parse ${attributeName}:`, e);
        }
        return null;
    }

    let matchedColor = null;

    for (let state of colorStates) {
        if (state.condition) {
            let condition = ResolveConditionstate(state.condition);

            variablevalue = EvaluateExpression(condition);

            //console.log(variablevalue);

            try {
                if (variablevalue.toString().includes('#') || variablevalue.toString().includes('rgb')) {
                    matchedColor = variablevalue;
                }
                else {
                    if (variablevalue) {
                        
                        matchedColor = state.color; // Last match wins
                    }
                }
            } catch (error) {
                // Invalid expression — skip
            }

            //try {
            //    if (Function("return " + condition)()) {
            //        matchedColor = state.color; // Last match wins
            //    }
            //} catch (error) {
            //    // Invalid expression — skip
            //}
        }
    }

    

    return matchedColor;
}

function ResolveConditionstate(conditionstate) {

    //console.log(conditionstate);

    //  /(\w+[.-a-zA-Z]*\w+)/g                      v20230711
    //  /([^\d\W]+[.-_-a-zA-Z]*[^\d\W]+)/g          v20230727
    // /([^\d\W]+[.-_-\{\}a-zA-Z]+)/g               v20240224
    // /[A-Za-z0-9_#\[\]-]+(?:\.[A-Za-z0-9_#\[\]-]+)+/g   v20260707  aligned with server ExpressionHelper.VariableTokenRegex; operators delimit tokens (no more operator-absorption)

    try {
        conditionstateclean = conditionstate.replaceAll('.includes', ' .includes');
        conditionstateclean = conditionstateclean.replaceAll('!', '! ');
        conditionstateclean = conditionstateclean.replaceAll(',', ', ');

        // Names are free-form since v68: dotted tokens are always variable references; a
        // dot-less token is only treated as a variable when it exactly matches a known name
        // (membership-based), since a bare word is otherwise a keyword, function or number.
        var conditionstatevars = conditionstateclean.match(/[A-Za-z0-9_#\[\]-]+(?:\.[A-Za-z0-9_#\[\]-]+)*/g);

        //console.log(conditionstatevars);

        var expressionwords = ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'and', 'or', 'not', 'if', 'in', 'Math', 'includes',
            'parseInt', 'parseFloat', 'Number', 'String', 'Boolean', 'Date', 'typeof', 'return', 'function'];

        if (conditionstatevars) {
            for (let i = 0; i < conditionstatevars.length; i++) {

                var isdotted = conditionstatevars[i].includes('.');
                var isbareword = !isdotted
                    && !/^[0-9]/.test(conditionstatevars[i])
                    && expressionwords.indexOf(conditionstatevars[i]) === -1;

                if (isdotted || isbareword) {
                    PageVars[conditionstatevars[i]] = 0;

                    if (typeof VarDict[conditionstatevars[i]] !== 'undefined') // ERROR variable not found
                    {
                        var conditionstatevarvalue = VarDict[conditionstatevars[i]][0].toString();

                        var conditionstatereplacement;
                        if (conditionstatevarvalue.match(/([^\d\W]+[.-_-a-zA-Z]+)/g) && !conditionstatevarvalue.includes("'")) {
                            conditionstatereplacement = "'" + conditionstatevarvalue + "'";
                        }
                        else {
                            conditionstatereplacement = conditionstatevarvalue;
                        }

                        // Replace only whole Device.Variable tokens (boundary-aware, all occurrences) so a shorter
                        // name is never substituted inside a longer prefix-sharing name (e.g. PLC1.Temp in PLC1.Temperature).
                        // A function replacement is used so characters like $ in the value are inserted literally.
                        var conditionstatetokenescaped = conditionstatevars[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        var conditionstatetokenregex = new RegExp('(?<![A-Za-z0-9_.#\\[\\]-])' + conditionstatetokenescaped + '(?![A-Za-z0-9_.#\\[\\]-])', 'g');
                        conditionstate = conditionstate.replace(conditionstatetokenregex, function () { return conditionstatereplacement; });

                        //console.log(conditionstate);

                        variablevalue = null;
                    }
                }
                
                
                //else {
                //    var strval = conditionstatevars[i].match(/([^\d\W]+[.-_-a-zA-Z]+)/g);

                //    if (strval && !strval.includes("'")) {

                //        strval = strval[0];

                //        //introduce space to avoid ''on'' 
                //        conditionstate = conditionstate.replace(" " + strval, " '" + strval + "'");

                //        //console.log(conditionstate)
                //    }
                //}

            }
        }

        //console.log(conditionstate);
        return conditionstate;
    } 
    catch (error) {
        console.error(error);
        return false;
    }

    

    

}


// GET ATTRIBUTES FOR ANIMATION

function GetAttributesVisibility(ObjDom) {
    //visibility
    if (ObjDom.getAttribute("data-visibility")) {
        visibility = ObjDom.getAttribute("data-visibility");
    }
    else {
        visibility = '';
        ObjDom.setAttribute("data-visibility", visibility);
    }

    //blink
    if (ObjDom.getAttribute("data-blink")) {
        blink = ObjDom.getAttribute("data-blink");
    }
    else {
        blink = '';
        ObjDom.setAttribute("data-blink", blink);
    }

    //blinkspeed
    if (ObjDom.getAttribute("data-blinkspeed")) {
        blinkspeed = ObjDom.getAttribute("data-blinkspeed");
    }
    else {
        blinkspeed = '1s';
        ObjDom.setAttribute("data-blinkspeed", blinkspeed);
    }

    //blinkoffset
    if (ObjDom.getAttribute("data-blinkoffset")) {
        blinkoffset = ObjDom.getAttribute("data-blinkoffset");
    }
    else {
        blinkoffset = 'false';
        ObjDom.setAttribute("data-blinkoffset", blinkoffset);
    }
}

function GetAttributesAccessControl(ObjDom) {
    
    //accesscontrolenable
    if (ObjDom.getAttribute("data-accesscontrolenable")) {
        accesscontrolenable = ObjDom.getAttribute("data-accesscontrolenable");
    }
    else {
        accesscontrolenable = 'false';
        ObjDom.setAttribute("data-accesscontrolenable", accesscontrolenable);
    }

    //accesscontrol
    if (ObjDom.getAttribute("data-accesscontrol")) {
        accesscontrol = ObjDom.getAttribute("data-accesscontrol");
    }
    else {
        accesscontrol = '';
        ObjDom.setAttribute("data-accesscontrol", accesscontrol);
    }

    //accesscontrolfilter
    if (ObjDom.getAttribute("data-accesscontrolfilter")) {
        accesscontrolfilter = ObjDom.getAttribute("data-accesscontrolfilter");
    }
    else {
        accesscontrolfilter = 'blur(0px) contrast(30%)';
        ObjDom.setAttribute("data-accesscontrolfilter", accesscontrolfilter);
    }

}

function GetAttributesRotation(ObjDom) {

    //transformrotate
    if (ObjDom.getAttribute("data-transformrotate")) {
        transformrotate = ObjDom.getAttribute("data-transformrotate");
    }
    else {
        transformrotate = '';
        ObjDom.setAttribute("data-transformrotate", transformrotate);
    }

    //transformorigin
    if (ObjDom.getAttribute("data-transformorigin")) {
        transformorigin = ObjDom.getAttribute("data-transformorigin");
    }
    else {
        transformorigin = '';
        ObjDom.setAttribute("data-transformorigin", transformorigin);
    }

    // The continuous-rotation attributes are deliberately NOT mirrored into globals here.
    // ContinuousRotationAnimation() reads them straight off the element instead, so an execute*
    // handler that calls it without calling this function first cannot silently animate one object
    // with the previous object's speed and direction.

}

function GetAttributesBorder(ObjDom) {

    ObjType = ObjDom.parentElement.getAttribute('name');

    if (ObjType == "PolylineObject") {
        // bordercolor
        if (ObjDom.getAttribute("data-bordercolor")) {
            bordercolor = GetObjectColor(ObjDom.getAttribute("data-bordercolor"));
        }
        else {
            bordercolor = '#78909C';
            ObjDom.setAttribute("data-bordercolor", bordercolor);
        }
    }
    else {
        // bordercolor
        if (ObjDom.getAttribute("data-bordercolor")) {
            bordercolor = GetObjectColor(ObjDom.getAttribute("data-bordercolor"));
        }
        else {
            bordercolor = '#000';
            ObjDom.setAttribute("data-bordercolor", bordercolor);
        }
    }

    if (ObjType == "PolylineObject") {
        //borderwidth
        if (ObjDom.getAttribute("data-borderwidth")) {
            borderwidth = ObjDom.getAttribute("data-borderwidth");
        }
        else {
            borderwidth = '0px';
            ObjDom.setAttribute("data-borderwidth", borderwidth);
        }
    }
    else {
        //borderwidth
        if (ObjDom.getAttribute("data-borderwidth")) {
            borderwidth = ObjDom.getAttribute("data-borderwidth");
        }
        else {
            borderwidth = '1px';
            ObjDom.setAttribute("data-borderwidth", borderwidth);
        }
    }

    //borderradius
    if (ObjDom.getAttribute("data-borderradius")) {
        borderradius = ObjDom.getAttribute("data-borderradius");
    }
    else {
        borderradius = '0px';
        ObjDom.setAttribute("data-borderradius", borderradius);
    }

    //bordervisibility
    if (ObjDom.getAttribute("data-bordervisibility")) {
        bordervisibility = ObjDom.getAttribute("data-bordervisibility");
    }
    else {
        bordervisibility = '';
        ObjDom.setAttribute("data-bordervisibility", bordervisibility);
    }

    //borderblink
    if (ObjDom.getAttribute("data-borderblink")) {
        borderblink = ObjDom.getAttribute("data-borderblink");
    }
    else {
        borderblink = '';
        ObjDom.setAttribute("data-borderblink", borderblink);
    }

    //borderblinkspeed
    if (ObjDom.getAttribute("data-borderblinkspeed")) {
        borderblinkspeed = ObjDom.getAttribute("data-borderblinkspeed");
    }
    else {
        borderblinkspeed = '1s';
        ObjDom.setAttribute("data-borderblinkspeed", borderblinkspeed);
    }

    //borderblinkoffset
    if (ObjDom.getAttribute("data-borderblinkoffset")) {
        borderblinkoffset = ObjDom.getAttribute("data-borderblinkoffset");
    }
    else {
        borderblinkoffset = 'false';
        ObjDom.setAttribute("data-borderblinkoffset", borderblinkoffset);
    }

}

function GetAttributesAnimatePositionSize(ObjDom) {
    //heightvariable
    if (ObjDom.getAttribute("data-heightvariable")) {
        heightvariable = ObjDom.getAttribute("data-heightvariable");
    }
    else {
        heightvariable = '';
        ObjDom.setAttribute("data-heightvariable", heightvariable);
    }

    //heightminraw
    if (ObjDom.getAttribute("data-heightminraw")) {
        heightminraw = ObjDom.getAttribute("data-heightminraw");
    }
    else {
        heightminraw = '';
        ObjDom.setAttribute("data-heightminraw", heightminraw);
    }

    //heightmaxraw
    if (ObjDom.getAttribute("data-heightmaxraw")) {
        heightmaxraw = ObjDom.getAttribute("data-heightmaxraw");
    }
    else {
        heightmaxraw = '';
        ObjDom.setAttribute("data-heightmaxraw", heightmaxraw);
    }

    //heightminpx
    if (ObjDom.getAttribute("data-heightminpx")) {
        heightminpx = ObjDom.getAttribute("data-heightminpx");
    }
    else {
        heightminpx = '';
        ObjDom.setAttribute("data-heightminpx", heightminpx);
    }

    //heightmaxpx
    if (ObjDom.getAttribute("data-heightmaxpx")) {
        heightmaxpx = ObjDom.getAttribute("data-heightmaxpx");
    }
    else {
        heightmaxpx = '';
        ObjDom.setAttribute("data-heightmaxpx", heightmaxpx);
    }

    //heightreverse
    if (ObjDom.getAttribute("data-heightreverse")) {
        heightreverse = ObjDom.getAttribute("data-heightreverse");
    }
    else {
        heightreverse = 'false';
        ObjDom.setAttribute("data-heightreverse", heightreverse);
    }

    //widthvariable
    if (ObjDom.getAttribute("data-widthvariable")) {
        widthvariable = ObjDom.getAttribute("data-widthvariable");
    }
    else {
        widthvariable = '';
        ObjDom.setAttribute("data-widthvariable", widthvariable);
    }

    //widthminraw
    if (ObjDom.getAttribute("data-widthminraw")) {
        widthminraw = ObjDom.getAttribute("data-widthminraw");
    }
    else {
        widthminraw = '';
        ObjDom.setAttribute("data-widthminraw", widthminraw);
    }

    //widthmaxraw
    if (ObjDom.getAttribute("data-widthmaxraw")) {
        widthmaxraw = ObjDom.getAttribute("data-widthmaxraw");
    }
    else {
        widthmaxraw = '';
        ObjDom.setAttribute("data-widthmaxraw", widthmaxraw);
    }

    //widthminpx
    if (ObjDom.getAttribute("data-widthminpx")) {
        widthminpx = ObjDom.getAttribute("data-widthminpx");
    }
    else {
        widthminpx = '';
        ObjDom.setAttribute("data-widthminpx", widthminpx);
    }

    //widthmaxpx
    if (ObjDom.getAttribute("data-widthmaxpx")) {
        widthmaxpx = ObjDom.getAttribute("data-widthmaxpx");
    }
    else {
        widthmaxpx = '';
        ObjDom.setAttribute("data-widthmaxpx", widthmaxpx);
    }

    //widthreverse
    if (ObjDom.getAttribute("data-widthreverse")) {
        widthreverse = ObjDom.getAttribute("data-widthreverse");
    }
    else {
        widthreverse = 'false';
        ObjDom.setAttribute("data-widthreverse", widthreverse);
    }

    //topvariable
    if (ObjDom.getAttribute("data-topvariable")) {
        topvariable = ObjDom.getAttribute("data-topvariable");
    }
    else {
        topvariable = '';
        ObjDom.setAttribute("data-topvariable", topvariable);
    }

    //topminraw
    if (ObjDom.getAttribute("data-topminraw")) {
        topminraw = ObjDom.getAttribute("data-topminraw");
    }
    else {
        topminraw = '';
        ObjDom.setAttribute("data-topminraw", topminraw);
    }

    //topmaxraw
    if (ObjDom.getAttribute("data-topmaxraw")) {
        topmaxraw = ObjDom.getAttribute("data-topmaxraw");
    }
    else {
        topmaxraw = '';
        ObjDom.setAttribute("data-topmaxraw", topmaxraw);
    }

    //topminpx
    if (ObjDom.getAttribute("data-topminpx")) {
        topminpx = ObjDom.getAttribute("data-topminpx");
    }
    else {
        topminpx = '';
        ObjDom.setAttribute("data-topminpx", topminpx);
    }

    //topmaxpx
    if (ObjDom.getAttribute("data-topmaxpx")) {
        topmaxpx = ObjDom.getAttribute("data-topmaxpx");
    }
    else {
        topmaxpx = '';
        ObjDom.setAttribute("data-topmaxpx", topmaxpx);
    }

    //leftvariable
    if (ObjDom.getAttribute("data-leftvariable")) {
        leftvariable = ObjDom.getAttribute("data-leftvariable");
    }
    else {
        leftvariable = '';
        ObjDom.setAttribute("data-leftvariable", leftvariable);
    }

    //leftminraw
    if (ObjDom.getAttribute("data-leftminraw")) {
        leftminraw = ObjDom.getAttribute("data-leftminraw");
    }
    else {
        leftminraw = '';
        ObjDom.setAttribute("data-leftminraw", leftminraw);
    }

    //leftmaxraw
    if (ObjDom.getAttribute("data-leftmaxraw")) {
        leftmaxraw = ObjDom.getAttribute("data-leftmaxraw");
    }
    else {
        leftmaxraw = '';
        ObjDom.setAttribute("data-leftmaxraw", leftmaxraw);
    }

    //leftminpx
    if (ObjDom.getAttribute("data-leftminpx")) {
        leftminpx = ObjDom.getAttribute("data-leftminpx");
    }
    else {
        leftminpx = '';
        ObjDom.setAttribute("data-leftminpx", leftminpx);
    }

    //leftmaxpx
    if (ObjDom.getAttribute("data-leftmaxpx")) {
        leftmaxpx = ObjDom.getAttribute("data-leftmaxpx");
    }
    else {
        leftmaxpx = '';
        ObjDom.setAttribute("data-leftmaxpx", leftmaxpx);
    }
}

// ANIMATIONS 

function PositionSizeAnimation(ObjDom) {

    if (DraggingObject == true) {
        return;
    }

    var ObjType = ObjDom.parentElement.getAttribute('name');

    var stackingmargintop;
    var calculatedheight;

    // HEIGHT ANIMATION
    DevVar = heightvariable;

    //console.log(DevVar);

    if (DevVar) {

        var variablevalue;

        if (DevVar.includes(" ")) {

            variablevalue = ResolveConditionstate(DevVar);
            try {
                variablevalue = Function("return " + variablevalue)();
            } catch (error) {
                //console.error(error);
            }

        }
        else if (isVariableName(DevVar)) {

            PageVars[DevVar] = 0;

            if (typeof VarDict[DevVar] !== 'undefined') {
                variablevalue = VarDict[DevVar][0];
            }
        }
        else {
            try {
                variablevalue = Function("return " + DevVar)();
            } catch (error) {
                //console.error(error);
            }
        }

        if (variablevalue) {

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {

                var calculated = CalculatePercentage(variablevalue, heightminraw, heightmaxraw, heightminpx, heightmaxpx);

                if (ObjDom.style.transform) {
                    let transform = ObjDom.style.transform;

                    if (transform.includes("90deg") || transform.includes("270deg")) {

                        if (ObjDom.getAttribute("width") !== calculated + "px") {

                            //console.log('recalc height');

                            ObjDom.setAttribute("width", calculated + "px");
                            ObjDom.style.width = calculated + "px";

                            element = ObjDom.parentElement;
                            elementheight = parseFloat(element.style.height.replace('px', ''));
                            elementwidth = parseFloat(element.style.width.replace('px', ''));
                            ObjDomheight = parseFloat(ObjDom.getAttribute('height').replace('px', ''));
                            ObjDomwidth = parseFloat(ObjDom.getAttribute('width').replace('px', ''));

                            if (elementheight > elementwidth) {
                                //console.log('height is longer');
                                ObjDom.style.marginLeft = ((ObjDomheight / 2) - (ObjDomwidth / 2)) + 'px';
                                ObjDom.style.marginTop = (-(ObjDomheight / 2) + (ObjDomwidth / 2)) + (heightmaxpx - calculated) + 'px';
                            }
                            else {
                                //console.log('width is longer');
                                ObjDom.style.marginLeft = (-(ObjDomwidth / 2) + (ObjDomheight / 2)) + 'px';
                                ObjDom.style.marginTop = ((ObjDomwidth / 2) - (ObjDomheight / 2)) + (heightmaxpx - calculated) + 'px';
                            }

                            stackingmargintop = parseFloat(ObjDom.style.marginTop.replace('px', ''));

                            ObjDom.setAttribute("preserveAspectRatio", "none");

                            if (ObjDom.getAttribute('data-heightreverse')) {
                                if (ObjDom.getAttribute('data-heightreverse') == 'true') {
                                    ObjDom.style.marginBottom = ObjDom.style.marginTop;
                                    ObjDom.style.marginTop = "";
                                    ObjDom.style.bottom = "0px";
                                    ObjDom.style.top = "";
                                }
                                else {
                                    ObjDom.style.bottom = "";
                                    ObjDom.style.marginBottom = "";
                                }
                            }
                            else {
                                ObjDom.style.bottom = "";
                                ObjDom.style.marginBottom = "";
                            }
                        }

                        calculatedheight = calculated;

                    }
                    else {
                        ObjDom.setAttribute("preserveAspectRatio", "none");
                        ObjDom.setAttribute("height", calculated + "px");
                        ObjDom.style.height = calculated;
                        ObjDom.style.marginTop = heightmaxpx - calculated + "px";
                        stackingmargintop = heightmaxpx - calculated;

                        if (ObjDom.getAttribute('data-heightreverse')) {
                            if (ObjDom.getAttribute('data-heightreverse') == 'true') {
                                ObjDom.style.top = "-" + ObjDom.style.marginTop;
                                ObjDom.style.marginBottom = "";
                            }
                            else {
                                ObjDom.style.top = "";
                                ObjDom.style.marginBottom = "";
                            }
                        }
                        else {
                            ObjDom.style.top = "";
                            ObjDom.style.marginBottom = "";
                        }
                    }
                }
                else {
                    ObjDom.setAttribute("preserveAspectRatio", "none");
                    ObjDom.setAttribute("height", calculated + "px");

                    ObjDom.style.height = calculated;
                    ObjDom.style.marginTop = heightmaxpx - calculated + "px";
                    stackingmargintop = heightmaxpx - calculated;

                    if (ObjDom.getAttribute('data-heightreverse')) {
                        if (ObjDom.getAttribute('data-heightreverse') == 'true') {
                            ObjDom.style.top = "-" + ObjDom.style.marginTop;
                            ObjDom.style.marginBottom = "";
                        }
                        else {
                            ObjDom.style.top = "";
                            ObjDom.style.marginBottom = "";
                        }
                    }
                    else {
                        ObjDom.style.top = "";
                        ObjDom.style.marginBottom = "";
                    }
                }

            }
            else {
                var calculated = CalculatePercentage(variablevalue, heightminraw, heightmaxraw, heightminpx, heightmaxpx)

                ObjDom.style.height = calculated + "px";

                if (ObjDom.getAttribute('data-heightreverse')) {
                    if (ObjDom.getAttribute('data-heightreverse') == 'true') {
                        ObjDom.style.top = "0px";
                        ObjDom.style.marginBottom = "";
                    }
                    else {
                        ObjDom.style.top = "";
                        ObjDom.style.marginBottom = "";
                    }
                }
                else {
                    ObjDom.style.top = "";
                    ObjDom.style.marginBottom = "";
                }
            }


            //console.log(calculated);
        }
    }

    // WIDTH ANIMATION
    DevVar = widthvariable;

    if (DevVar) {

        var variablevalue;

        if (DevVar.includes(" ")) {
            variablevalue = ResolveConditionstate(DevVar);
            try {
                variablevalue = Function("return " + variablevalue)();
            } catch (error) {
                //console.error(error);
            }

        }
        else if (isVariableName(DevVar)) {
            PageVars[DevVar] = 0;

            if (typeof VarDict[DevVar] !== 'undefined') {
                variablevalue = VarDict[DevVar][0];
            }
        }
        else {
            try {
                variablevalue = Function("return " + DevVar)();
            } catch (error) {
                //console.error(error);
            }
        }

        if (variablevalue)
        {

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {
                
                var calculated = CalculatePercentage(variablevalue, widthminraw, widthmaxraw, widthminpx, widthmaxpx);

                if (ObjDom.style.transform) {
                    
                    let transform = ObjDom.style.transform;

                    if (transform.includes("90deg") || transform.includes("270deg")) {

                        if (ObjDom.getAttribute("height") !== calculated + "px") {

                            //console.log('recalc width');

                            ObjDom.setAttribute("height", calculated + "px");
                            ObjDom.style.height = calculated + "px";

                            element = ObjDom.parentElement;
                            elementheight = parseFloat(element.style.height.replace('px', ''));
                            elementwidth = parseFloat(element.style.width.replace('px', ''));
                            ObjDomheight = parseFloat(ObjDom.getAttribute('height').replace('px', ''));
                            ObjDomwidth = parseFloat(ObjDom.getAttribute('width').replace('px', ''));

                            if (elementheight > elementwidth) {
                                /*console.log('height is longer');*/
                                ObjDom.style.marginLeft = ((ObjDomheight / 2) - (ObjDomwidth / 2)) + 'px';

                                if (calculatedheight) {
                                    ObjDom.style.marginTop = (-(ObjDomheight / 2) + (ObjDomwidth / 2)) + (heightmaxpx - calculatedheight) + 'px';

                                } else {
                                    ObjDom.style.marginTop = (-(ObjDomheight / 2) + (ObjDomwidth / 2)) + 'px';
                                }


                            }
                            else {
                                //console.log('width is longer');

                                ObjDom.style.marginLeft = (-(ObjDomwidth / 2) + (ObjDomheight / 2)) + 'px';

                                if (calculatedheight) {
                                    ObjDom.style.marginTop = ((ObjDomwidth / 2) - (ObjDomheight / 2)) + (heightmaxpx - calculatedheight) + 'px';
                                } else {
                                    ObjDom.style.marginTop = ((ObjDomwidth / 2) - (ObjDomheight / 2)) + 'px';
                                }

                            }

                            ObjDom.setAttribute("preserveAspectRatio", "none");

                            if (ObjDom.getAttribute('data-widthreverse')) {
                                if (ObjDom.getAttribute('data-widthreverse') == 'true') {
                                    ObjDom.style.marginRight = ObjDom.style.marginLeft;
                                    ObjDom.style.marginLeft = "";
                                    ObjDom.style.right = "0px";
                                }
                                else {
                                    ObjDom.style.right = "";
                                    ObjDom.style.marginRight = "";
                                }
                            }
                            else {
                                ObjDom.style.right = "";
                                ObjDom.style.marginRight = "";
                            }
                        }

                    }
                    else {
                        ObjDom.setAttribute("preserveAspectRatio", "none");
                        ObjDom.setAttribute("width", calculated + "px");
                        ObjDom.style.width = calculated + "px";

                        if (ObjDom.getAttribute('data-widthreverse')) {
                            if (ObjDom.getAttribute('data-widthreverse') == 'true') {
                                ObjDom.style.right = "0px";
                                ObjDom.style.marginRight = "";
                            }
                            else {
                                ObjDom.style.right = "";
                                ObjDom.style.marginRight = "";
                            }
                        }
                        else {
                            ObjDom.style.right = "";
                            ObjDom.style.marginRight = "";
                        }
                    }
                }
                else {
                    ObjDom.setAttribute("preserveAspectRatio", "none");
                    ObjDom.setAttribute("width", calculated + "px");
                    ObjDom.style.width = calculated + "px";

                    if (ObjDom.getAttribute('data-widthreverse')) {
                        if (ObjDom.getAttribute('data-widthreverse') == 'true') {
                            ObjDom.style.right = "0px";
                            ObjDom.style.marginRight = "";
                        }
                        else {
                            ObjDom.style.right = "";
                            ObjDom.style.marginRight = "";
                        }
                    }
                    else {
                        ObjDom.style.right = "";
                        ObjDom.style.marginRight = "";
                    }
                }
            }
            else {
                var calculated = CalculatePercentage(variablevalue, widthminraw, widthmaxraw, widthminpx, widthmaxpx)

                ObjDom.style.width = calculated + "px";

                if (ObjDom.getAttribute('data-widthreverse')) {
                    if (ObjDom.getAttribute('data-widthreverse') == 'true') {
                        ObjDom.style.right = "0px";
                        ObjDom.style.marginRight = "";
                    }
                    else {
                        ObjDom.style.right = "";
                        ObjDom.style.marginRight = "";
                    }
                }
                else {
                    ObjDom.style.right = "";
                    ObjDom.style.marginRight = "";
                }
            }
        }
    }

    // TOP ANIMATION
    DevVar = topvariable;

    if (DevVar) {

        var variablevalue;

        if (DevVar.includes(" ")) {
            variablevalue = ResolveConditionstate(DevVar);
            try {
                variablevalue = Function("return " + variablevalue)();
            } catch (error) {
                //console.error(error);
            }

        }
        else if (isVariableName(DevVar)) {
            PageVars[DevVar] = 0;

            if (typeof VarDict[DevVar] !== 'undefined') {
                variablevalue = VarDict[DevVar][0];
            }
        }
        else {
            try {
                variablevalue = Function("return " + DevVar)();
            } catch (error) {
                //console.error(error);
            }
        }

        if (variablevalue)
        {

            var calculated = CalculatePercentage(variablevalue, topminraw, topmaxraw, topminpx, topmaxpx)

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {

                if (ObjDom.style.transform) {

                    let transform = ObjDom.style.transform;

                    if (transform.includes("90deg") || transform.includes("270deg")) {

                        if (ObjDom.getAttribute("data-calculatedtop") !== calculated.toString()) {
                            ObjDom.setAttribute("data-calculatedtop", calculated);

                            //console.log('recalc top');

                            element = ObjDom.parentElement;
                            elementheight = parseFloat(element.style.height.replace('px', ''));
                            elementwidth = parseFloat(element.style.width.replace('px', ''));
                            ObjDomheight = parseFloat(ObjDom.getAttribute('height').replace('px', ''));
                            ObjDomwidth = parseFloat(ObjDom.getAttribute('width').replace('px', ''));


                            if (elementheight > elementwidth) {
                                /*console.log('height is longer');*/
                                ObjDom.style.marginLeft = ((ObjDomheight / 2) - (ObjDomwidth / 2)) + 'px';

                                if (calculatedheight) {
                                    ObjDom.style.marginTop = (-(ObjDomheight / 2) + (ObjDomwidth / 2)) + (heightmaxpx - calculatedheight) - calculated + 'px';

                                } else {
                                    ObjDom.style.marginTop = (-(ObjDomheight / 2) + (ObjDomwidth / 2)) - calculated + 'px';
                                }


                            }
                            else {
                                //console.log('width is longer');

                                ObjDom.style.marginLeft = (-(ObjDomwidth / 2) + (ObjDomheight / 2)) + 'px';

                                if (calculatedheight) {
                                    ObjDom.style.marginTop = ((ObjDomwidth / 2) - (ObjDomheight / 2)) + (heightmaxpx - calculatedheight) - calculated + 'px';
                                } else {
                                    ObjDom.style.marginTop = ((ObjDomwidth / 2) - (ObjDomheight / 2)) - calculated + 'px';
                                }

                            }
                        }

                    }
                    else {
                        ObjDom.style.marginTop = -calculated + "px";
                    }


                }
                else {
                    ObjDom.style.marginTop = -calculated + "px";
                }

                if (stackingmargintop) {

                    ObjDom.style.marginTop = (parseFloat(ObjDom.style.marginTop.replace('px', '')) + stackingmargintop) + "px";
                }

            }
            else if (ObjType === 'ImageObject') {
                // The img is a static inline element with no bottom anchor, so the
                // margin-bottom lift below cannot move it; shift it up directly.
                ObjDom.style.marginTop = -calculated + "px";
            }
            else {
                ObjDom.style.marginBottom = calculated + "px";
            }
        }
    }

    // LEFT ANIMATION
    DevVar = leftvariable;

    if (DevVar) {

        var variablevalue;

        if (DevVar.includes(" ")) {
            variablevalue = ResolveConditionstate(DevVar);
            try {
                variablevalue = Function("return " + variablevalue)();
            } catch (error) {
                //console.error(error);
            }

        }
        else if (isVariableName(DevVar)) {
            PageVars[DevVar] = 0;

            if (typeof VarDict[DevVar] !== 'undefined') {
                variablevalue = VarDict[DevVar][0];
            }
        }
        else {
            try {
                variablevalue = Function("return " + DevVar)();
            } catch (error) {
                //console.error(error);
            }
        }

        if (variablevalue)
        {
            var calculated = CalculatePercentage(variablevalue, leftminraw, leftmaxraw, leftminpx, leftmaxpx)

            if (ObjType === 'SVGObject' ||
                ObjType === 'PolygonObject' ||
                ObjType === 'PolylineObject') {

                if (ObjDom.style.transform) {
                    let transform = ObjDom.style.transform;

                    if (transform.includes("90deg") || transform.includes("270deg")) {

                        if (ObjDom.getAttribute("data-calculatedleft") !== calculated.toString()) {
                            ObjDom.setAttribute("data-calculatedleft", calculated);

                            //console.log('recalc left inside');

                            element = ObjDom.parentElement;
                            elementheight = parseFloat(element.style.height.replace('px', ''));
                            elementwidth = parseFloat(element.style.width.replace('px', ''));
                            ObjDomheight = parseFloat(ObjDom.getAttribute('height').replace('px', ''));
                            ObjDomwidth = parseFloat(ObjDom.getAttribute('width').replace('px', ''));


                            if (elementheight > elementwidth) {
                                /*console.log('height is longer');*/
                                ObjDom.style.marginLeft = ((ObjDomheight / 2) - (ObjDomwidth / 2)) + calculated + 'px';
                            }
                            else {
                                //console.log('width is longer');

                                ObjDom.style.marginLeft = (-(ObjDomwidth / 2) + (ObjDomheight / 2)) + calculated + 'px';

                            }
                        }

                    }
                    else {
                        ObjDom.style.marginLeft = calculated + "px";
                    }
                }
                else {
                    ObjDom.style.marginLeft = calculated + "px";
                }

            }
            else {
                ObjDom.style.marginLeft = calculated + "px";
            }
        }
    }
}

function VisibilityAnimation(ObjDom) {

    /*ObjDom.style.opacity = "1";*/

    var visible = true;
    var showobject = false; // force show
    var hidden = false; // force hide or inside group
    var masked = false; // force hide or inside group

    //edit
    if (EditMode) {

        if (ObjDom.getAttribute('name') === "GroupObject") {
            
            if (ObjDom.hasAttribute("data-hideobject")) {
                hidden = true;
            }

            if (ObjDom.hasAttribute("data-showobject")) {
                showobject = true;
            }
        }
        else {

            if (ObjDom.parentElement.hasAttribute("data-hideobject")) {
                hidden = true;
            }

            if (ObjDom.parentElement.hasAttribute("data-showobject")) {
                showobject = true;
            }
        }
    }
    
    //runtime
    if (ObjDom.getAttribute('name') === "GroupObject") {
        if (ObjDom.hasAttribute("data-maskedobject")) {
            masked = true;
        }
    }
    else {
        if (ObjDom.parentElement.hasAttribute("data-maskedobject")) {
            masked = true;
        }
    }

    if (deneutralized) { // instead of firstdata v20240702

        try {

            // if group parent is invisible, then child should be invisible too regardless of its condition state.
            // if group parent is visible, then the child should follow its own visibility condition state.


            // masked = hide
            // hidden = hide
            // visibility false state = hide

            // no visibility = show
            // visibility true state = show
            // showhidden = show
            // showobject = show

            if ((masked == true || hidden == true) && (showobject == false)) {
                visible = false;
            }
            else {
                
                var result = false;
                
                if (ShowHidden == true || showobject == true) {
                    visible = true;
                }
                else {

                    if (visibility) {
                        variablevalue = ResolveConditionstate(visibility);
                        
                        try {
                            result = Function("return " + variablevalue)();
                            
                        } catch (error) {
                            //console.error(error);
                        }

                        if (typeof (result) == 'string') { // catch OPC UA etc...

                            if (result.toLowerCase() == 'true') {
                                result = true;
                            }
                            else {
                                result = false;
                            }

                        }

                        if (result == true) {
                            visible = true;
                            
                        } else {
                            visible = false;

                        }

                    }
                    else {
                        visible = true;
                    }


                    //zindex layers client.LayerX
                    var root = (ObjDom.getAttribute('name') === "GroupObject") ? ObjDom : ObjDom.parentElement;
                    var z = parseInt(root.style.zIndex);
                    
                    if (z) {
                        var k = "client.PageLayer" + z;
                        //console.log(VarDict[k][0]);
                        if (VarDict[k] && (
                            VarDict[k][0] === false ||
                            VarDict[k][0] === 0 ||
                            VarDict[k][0] === "0" ||
                            String(VarDict[k][0]).toLowerCase() === "false"
                        )) {
                            visible = false;
                        }
                    }

                    //console.log(visible);
                }

            }
            
            if (visible == true) {
                
                    if (ObjDom.getAttribute('name') === "GroupObject") {

                        //ObjDom.style.opacity = "1"; //don't do this for object viewer
                        //console.log('Group Visible');
                        if (ObjDom.style.pointerEvents !== "auto") {
                            ObjDom.style.pointerEvents = "auto";
                            
                            UnmaskObjectsInsideGroup(ObjDom);
                            RedrawPolylineBordersInsideGroup(ObjDom);

                            if (ObjDom.hasAttribute('data-isbackground')) {
                                //console.log('SetPointerEventNoneToObjectsInsideGroup');
                                ObjDom.style.pointerEvents = "none";
                                
                                SetPointerEventNoneToObjectsInsideGroup(ObjDom);
                            }
                        }
                    }
                    else {
                        
                        //console.log('Element Visible');
                        if (ObjDom.style.opacity !== "1") {

                            if (!ObjDom.parentElement.hasAttribute('data-isbackground')) {
                                ObjDom.parentElement.style.pointerEvents = "auto";
                                
                            }

                            ObjDom.style.opacity = "1";


                            if (ObjDom.parentElement.getAttribute('name') == "PolylineObject") {

                                RedrawPolylineBorder(ObjDom);
                            }
                        }
                    }

                }
                else {
                    SetInvisible(ObjDom);
                }

            ObjDom.setAttribute("data-objectvisible", visible);

        } catch (error) {
            //console.error(error);
        }

    }
    
    if (ObjectViewerOpen) { // for objectviewer
        
        var ObjectId;

        if (ObjDom.getAttribute('name') === "GroupObject") {
            ObjectId = ObjDom.id;
        }
        else {
            ObjectId = ObjDom.parentElement.id;
        }  

        var objectviewervisible = document.getElementById("ObjectViewerVisible_" + ObjectId);
        var objectviewerhide = document.getElementById("ObjectViewerHide_" + ObjectId);
        
        if (objectviewervisible) {
            
            objectviewervisible.classList.remove("ObjectViewerObjectInvisible");
            objectviewervisible.classList.remove("ObjectViewerObjectVisibleForced");
            objectviewerhide.classList.remove("ObjectViewerObjectHidden");

            if (showobject) {
                objectviewervisible.classList.add("ObjectViewerObjectVisibleForced");
            }
            else if (hidden) {
                objectviewerhide.classList.add("ObjectViewerObjectHidden");
                objectviewervisible.classList.add("ObjectViewerObjectInvisible");
            }
            else {
                //console.log(objectviewervisible);
                if (!visible) {
                    
                    objectviewervisible.classList.add("ObjectViewerObjectInvisible");
                }
            } 
        }
    }

    if (firstdata) { // could this move to savepage hide animations? 
        if (ObjDom.classList.contains('blink05s')) {
            ObjDom.classList.remove("blink05s");
        }
        if (ObjDom.classList.contains('blink1s')) {
            ObjDom.classList.remove("blink1s");
        }
        if (ObjDom.classList.contains('blink2s')) {
            ObjDom.classList.remove("blink2s");
        }
        if (ObjDom.classList.contains('blink05soffset')) {
            ObjDom.classList.remove("blink05soffset");
        }
        if (ObjDom.classList.contains('blink1soffset')) {
            ObjDom.classList.remove("blink1soffset");
        }
        if (ObjDom.classList.contains('blink2soffset')) {
            ObjDom.classList.remove("blink2soffset");
        }
    }

    if (EditMode === true && ShowHidden === true) {
        return; // Avoid blinking
    }

    if (blink && visible === true) {

        variablevalue = ResolveConditionstate(blink);
        if (firstdata) {
            try {
                if (Function("return " + variablevalue)()) {

                    //console.log(blinkspeed);
                    //console.log(blinkoffset);

                    switch (blinkspeed) {
                        case "0.5s":
                            if (blinkoffset === 'false') {
                                ObjDom.classList.add("blink05s");
                            } else {
                                ObjDom.classList.add("blink05soffset");
                            }
                            break;
                        case "1s":
                            if (blinkoffset === 'false') {
                                ObjDom.classList.add("blink1s");
                            } else {
                                ObjDom.classList.add("blink1soffset");
                            }
                            break;
                        case "2s":
                            if (blinkoffset === 'false') {
                                ObjDom.classList.add("blink2s");
                            } else {
                                ObjDom.classList.add("blink2soffset");
                            }
                            break
                        default:
                            break;
                    }
                    //if (!ObjDom.classList.contains('blink1s')) {
                    //    ObjDom.classList.add("blink1s");
                    //}
                }
                else {

                }
            } catch (error) {
                //console.error(error);
            }
        }
    }

}

function SetInvisible(ObjDom) {

    if (ObjDom.getAttribute('name') === "GroupObject") {

        if (ObjDom.style.pointerEvents !== "none") {
        }
        ObjDom.style.pointerEvents = "none"; //ObjDom.style.opacity = "0"; //don't do this for object viewer
        MaskObjectsInsideGroup(ObjDom);
        RemovePolylineBordersInsideGroup(ObjDom.parentElement);

    }
    else {

        if (ObjDom.style.opacity !== "0") {
            ObjDom.parentElement.style.pointerEvents = "none";
            ObjDom.style.opacity = "0";

            if (ObjDom.parentElement.getAttribute('name') == "PolylineObject") {

                RemovePolylineBorder(ObjDom.parentElement);
            }
        }
    }
}

function AccessControlAnimation(ObjDom) {

    if (EditMode === false) {
        if (firstdata) {
            if (accesscontrolenable == 'true') {

                try {
                    var variablevalue = ResolveConditionstate(accesscontrol);

                    //console.log(variablevalue);

                    if (!Function("return " + variablevalue)()) {
                        //console.log(ObjDom.style.filter);
                        ObjDom.style.filter = accesscontrolfilter;
                        ObjDom.setAttribute('data-accesscontrollocked', 'true');
                    }
                    else {
                        ObjDom.style.filter = null;
                        ObjDom.removeAttribute('data-accesscontrollocked');
                    }
                } catch (error) {
                    console.error(error); // lock when error
                    ObjDom.style.filter = accesscontrolfilter;
                    ObjDom.setAttribute('data-accesscontrollocked', 'true');
                }
            }
            else {
                ObjDom.style.filter = null;
                ObjDom.removeAttribute('data-accesscontrollocked');
            }
        }
    }
    else {
        ObjDom.style.filter = null;
        ObjDom.removeAttribute('data-accesscontrollocked');
    }
}


function RotationAnimation(ObjDom) {

    try {
        if (!transformrotate || transformrotate === "") {
            return;
        }

        // A plain angle is settled as a literal first. isVariableName() only asks "is this a single
        // token", so it answers true for "45" and "45deg" as well as for a real variable name, and
        // the lookup below then finds no such variable and returns without rotating anything - a
        // fixed angle typed into the Rotation field, or written by the 45-degree Rotate button,
        // used to apply in the designer but never at runtime.
        if (/^[-+]?(\d+\.?\d*|\.\d+)\s*(deg|rad|turn|grad)?$/i.test(String(transformrotate).trim())) {
            transformrotate = parseFloat(transformrotate);
        }
        else if (isVariableName(transformrotate)) { // then its a var or expression

            if (transformrotate.includes(' ')) { // then its an expression
                transformrotate = ResolveConditionstate(transformrotate);
                transformrotate = Function("return " + transformrotate)();
            }
            else {
                var DevVar = transformrotate;
                PageVars[DevVar] = 0;

                if (typeof VarDict[DevVar] !== 'undefined') {
                    transformrotate = VarDict[DevVar][0];
                }
                else {
                    return; // no var
                }
            }

        }
        else {

            if (transformrotate.includes(' ')) { // then its an expression
                transformrotate = Function("return " + transformrotate)();
            }

            // it is a constant
        }


        //rotate(0deg)

        var floattrans = parseFloat(transformrotate);

        if (ObjDom.hasAttribute('data-objectrotation')) {
            var objectrotation = parseFloat(ObjDom.getAttribute('data-objectrotation'));

            floattrans = floattrans + objectrotation;
        }

        var rotation = 'rotate(' + floattrans + 'deg)';

        if (transformorigin && transformorigin !== "") {
            if (ObjDom.style.transformOrigin !== transformorigin) {
                ObjDom.style.transformOrigin = transformorigin;
            }
        }

        if (ObjDom.style.transform !== rotation) {
            ObjDom.style.transform = rotation;
            ObjDom.style.marginLeft = "0px";
            ObjDom.style.marginTop = "0px";
        }

    } catch (error) {
        console.error(error);
    }

    

}

// ── Continuous rotation ────────────────────────────────────────────────────────────────────────
// data-rotateenable turns a free-running spin on and off; data-rotatespeed sets how fast and
// data-rotatedirection which way. All three accept a constant, a variable or an expression, so a
// fan can spin at the speed the PLC actually reports and stop when its run feedback drops.
//
// Two deliberate choices keep this from disturbing anything that already works:
//
//   * it animates the INDEPENDENT CSS "rotate" property, not "transform". RotationAnimation()
//     writes the whole transform string (and FlipHorizontally/FlipVertically append scale() to it),
//     so animating transform would fight both. The browser composes rotate/scale/translate with
//     transform on its own, which means the static angle, the flips and the spin all survive.
//   * it uses the Web Animations API rather than a CSS class. The blink classes own the CSS
//     "animation" property, and a second animation declared there would replace them; element
//     .animate() runs alongside without touching that property at all.

// Resolves a constant / variable / expression the same way the other animation attributes do.
function ResolveRotationInput(raw) {

    if (!raw || raw === "") {
        return null;
    }

    try {

        // Literals FIRST. isVariableName() only asks "is this a single token", so it answers true
        // for "true" and for "120" as well as for a real variable name - resolving those through
        // VarDict finds nothing and the field silently does nothing at all. These fields are
        // usually typed as plain constants, so a bare true/false or number is settled here and
        // only what is left over is looked up as a variable.
        var literal = String(raw).trim();
        var lowered = literal.toLowerCase();

        if (lowered === "true") {
            return true;
        }

        if (lowered === "false") {
            return false;
        }

        if (literal !== "" && isFinite(literal)) {
            return parseFloat(literal);
        }

        if (isVariableName(raw)) {

            if (raw.includes(' ')) { // expression
                return Function("return " + ResolveConditionstate(raw))();
            }

            if (typeof VarDict[raw] !== 'undefined') {
                PageVars[raw] = 0;
                return VarDict[raw][0];
            }

            PageVars[raw] = 0;
            return null; // variable not delivered yet
        }

        if (raw.includes(' ')) { // expression without a variable in it
            return Function("return " + raw)();
        }

        return raw; // plain constant

    } catch (error) {
        return null;
    }
}

// Rotation direction. Returns 1 for clockwise, -1 for counter-clockwise.
//
// The canonical value is a SIGNED NUMBER - 1 clockwise, -1 counter-clockwise - because that is how
// a drive reports which way it is turning, so the field can be pointed straight at that variable.
// The words are accepted for a value typed by hand, and a plain boolean is read as a "reverse" bit
// (true = counter-clockwise), which is the other shape a PLC usually offers.
function ResolveRotationDirection(raw) {

    if (!raw || raw === "") {
        return 1; // empty means clockwise
    }

    var literal = String(raw).trim().toLowerCase();

    if (literal === "clockwise" || literal === "cw") {
        return 1;
    }

    if (literal === "counterclockwise" || literal === "counter clockwise" ||
        literal === "anticlockwise" || literal === "ccw") {
        return -1;
    }

    var value = ResolveRotationInput(raw);

    if (value === null || typeof value === 'undefined') {
        return 1; // variable not delivered yet
    }

    if (typeof value === 'boolean') {
        return value ? -1 : 1;
    }

    var number = parseFloat(value);

    if (!isNaN(number)) {
        return number < 0 ? -1 : 1;
    }

    var text = String(value).trim().toLowerCase();

    if (text.indexOf("counter") === 0 || text === "ccw" || text === "anticlockwise" || text === "true") {
        return -1;
    }

    return 1;
}

function ContinuousRotationAnimation(ObjDom) {

    try {

        var rotateEnableRaw = ObjDom.getAttribute("data-rotateenable");
        var rotateSpeedRaw = ObjDom.getAttribute("data-rotatespeed");
        var rotateDirectionRaw = ObjDom.getAttribute("data-rotatedirection");

        var enabled = false;

        if (rotateEnableRaw && rotateEnableRaw !== "") {

            var resolved = ResolveRotationInput(rotateEnableRaw);

            if (typeof resolved === 'string') { // catch OPC UA and similar string booleans
                enabled = (resolved.toLowerCase() === 'true' || resolved === '1');
            }
            else if (resolved !== null) {
                enabled = (resolved === true || resolved === 1);
            }
        }

        // In the designer a spinning object cannot be selected or dragged sensibly, so the spin is
        // a runtime behaviour only - the same reason the dots and hit lines are edit-mode only.
        if (typeof EditMode !== 'undefined' && EditMode === true) {
            enabled = false;
        }

        if (!enabled) {

            if (ObjDom._envSpin) {
                ObjDom._envSpin.cancel();
                ObjDom._envSpin = null;
                ObjDom._envSpinParams = null;
                ObjDom.style.rotate = "";
            }

            return;
        }

        // Degrees per second, so a larger number means faster - and it maps directly onto a real
        // measured speed if the field is bound to a variable.
        var speed = parseFloat(ResolveRotationInput(rotateSpeedRaw));

        if (isNaN(speed) || speed === 0) {
            speed = 90; // default: one revolution every 4 seconds
        }

        var reverse = false;

        // A negative speed reverses too, which is what a bidirectional drive reports.
        if (speed < 0) {
            reverse = true;
            speed = -speed;
        }

        if (ResolveRotationDirection(rotateDirectionRaw) < 0) {
            reverse = !reverse;
        }

        var duration = (360 / speed) * 1000;

        if (duration < 50) {
            duration = 50; // anything faster is a blur and just burns frames
        }

        var params = duration + "|" + reverse;

        // Already spinning with these settings: leave it alone, or every tick would restart the
        // rotation from zero and the object would visibly stutter.
        if (ObjDom._envSpin && ObjDom._envSpinParams === params) {
            return;
        }

        if (ObjDom._envSpin) {
            ObjDom._envSpin.cancel();
            ObjDom._envSpin = null;
        }

        if (typeof ObjDom.animate !== 'function') {
            return;
        }

        // The spin pivots on transform-origin like every other rotation. RotationAnimation() only
        // applies it when a static angle is set, so an object that just spins needs it here too;
        // left unset the browser default (the object's centre) is already what a fan or an
        // agitator wants.
        var origin = ObjDom.getAttribute("data-transformorigin");

        if (origin && origin !== "" && ObjDom.style.transformOrigin !== origin) {
            ObjDom.style.transformOrigin = origin;
        }

        ObjDom._envSpin = ObjDom.animate(
            [{ rotate: "0deg" }, { rotate: reverse ? "-360deg" : "360deg" }],
            { duration: duration, iterations: Infinity, easing: "linear" }
        );

        ObjDom._envSpinParams = params;

    } catch (error) {
        console.error(error);
    }
}

function BorderAnimation(ObjDom) {

    var PolylineBorder
    var ObjDomBorder

    ObjType = ObjDom.parentElement.getAttribute('name');

    if (ObjType == "PolygonObject") {
        ObjDom.style.stroke = GetObjectColor(bordercolor);
    }
    else if (ObjType == "PolylineObject") {
        
        PolylineBorder = document.getElementById(ObjDom.parentElement.id + "_border");

        if (!PolylineBorder)
        {
            // no line drawn yet
            return;
        }

        ObjDomBorder = PolylineBorder.getElementsByTagName('svg')[0];
        ObjDomBorder.style.stroke = GetObjectColor(bordercolor);
    }
    else {
        ObjDom.style.borderColor = GetObjectColor(bordercolor);
    }

    bordercolor = getColorFromStates(ObjDom, "data-bordercolorstates");
    
    if (bordercolor) {
        if (ObjType == "PolygonObject") {
            ObjDom.style.stroke = GetObjectColor(bordercolor);
        }
        else if (ObjType == "PolylineObject") {
            ObjDomBorder.style.stroke = GetObjectColor(bordercolor);
            
        }
        else {
            ObjDom.style.borderColor = GetObjectColor(bordercolor);
        }
    }
    
    // VISIBILITY
    if (bordervisibility) {

        variablevalue = ResolveConditionstate(bordervisibility);
        if (firstdata) {
            try {
                if (Function("return " + variablevalue)()) {
                    if (ObjType == "PolygonObject") {
                        ObjDom.style.strokeOpacity = "1";
                    }
                    else if (ObjType == "PolylineObject") {
                        ObjDomBorder.style.strokeOpacity = "1";
                    }
                    else {
                        ObjDom.style.borderStyle = "solid";
                    }
                }
                else {
                    if (ObjType == "PolygonObject") {
                        ObjDom.style.strokeOpacity = "0";
                    }
                    else if (ObjType == "PolylineObject") {
                        ObjDomBorder.style.strokeOpacity = "0";
                    }
                    else {
                        ObjDom.style.borderStyle = "none";
                    }
                }
            } catch (error) {
                //console.error(error);
            }
        }
    }
    else {

        if (ObjType == "PolygonObject") {
            ObjDom.style.strokeOpacity = "1";
        }
        else if (ObjType == "PolylineObject") {
            ObjDomBorder.style.strokeOpacity = "1";
        }
        else {
            ObjDom.style.borderStyle = "solid";
        }
        
    }
    
    if (ObjType == "PolygonObject") {
        
        if (ObjDom.classList.contains('strokeblink05s')) {
            ObjDom.classList.remove("strokeblink05s");
        }
        if (ObjDom.classList.contains('strokeblink1s')) {
            ObjDom.classList.remove("strokeblink1s");
        }
        if (ObjDom.classList.contains('strokeblink2s')) {
            ObjDom.classList.remove("strokeblink2s");
        }
        if (ObjDom.classList.contains('strokeblink05soffset')) {
            ObjDom.classList.remove("strokeblink05soffset");
        }
        if (ObjDom.classList.contains('strokeblink1soffset')) {
            ObjDom.classList.remove("strokeblink1soffset");
        }
        if (ObjDom.classList.contains('strokeblink2soffset')) {
            ObjDom.classList.remove("strokeblink2soffset");
        }
        
        if (ObjDom.style.strokeOpacity == "1") {
           
            if (borderblink) {
                variablevalue = ResolveConditionstate(borderblink);
                if (firstdata) {
                    try {
                        if (Function("return " + variablevalue)()) {
                            //console.log(borderblinkspeed);
                            
                            switch (borderblinkspeed) {
                                case "0.5s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDom.classList.add("strokeblink05s");
                                    } else {
                                        ObjDom.classList.add("strokeblink05soffset");
                                    }
                                    break;
                                case "1s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDom.classList.add("strokeblink1s");
                                    } else {
                                        ObjDom.classList.add("strokeblink1soffset");
                                    }
                                    break;
                                case "2s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDom.classList.add("strokeblink2s");
                                    } else {
                                        ObjDom.classList.add("strokeblink2soffset");
                                    }
                                    break
                                default:
                                    break;
                            }
                            //if (!ObjDom.classList.contains('blink1s')) {
                            //    ObjDom.classList.add("blink1s");
                            //}
                        }
                        else {

                        }
                    } catch (error) {
                        //console.error(error);
                    }
                }
            }
        }
    }
    else if (ObjType == "PolylineObject") {
        if (ObjDomBorder.classList.contains('strokeblink05s')) {
            ObjDomBorder.classList.remove("strokeblink05s");
        }
        if (ObjDomBorder.classList.contains('strokeblink1s')) {
            ObjDomBorder.classList.remove("strokeblink1s");
        }
        if (ObjDomBorder.classList.contains('strokeblink2s')) {
            ObjDomBorder.classList.remove("strokeblink2s");
        }
        if (ObjDomBorder.classList.contains('strokeblink05soffset')) {
            ObjDomBorder.classList.remove("strokeblink05soffset");
        }
        if (ObjDomBorder.classList.contains('strokeblink1soffset')) {
            ObjDomBorder.classList.remove("strokeblink1soffset");
        }
        if (ObjDomBorder.classList.contains('strokeblink2soffset')) {
            ObjDomBorder.classList.remove("strokeblink2soffset");
        }

        if (ObjDomBorder.style.strokeOpacity == "1") {

            if (borderblink) {
                variablevalue = ResolveConditionstate(borderblink);
                if (firstdata) {
                    try {
                        if (Function("return " + variablevalue)()) {
                            //console.log(borderblinkspeed);

                            switch (borderblinkspeed) {
                                case "0.5s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDomBorder.classList.add("strokeblink05s");
                                    } else {
                                        ObjDomBorder.classList.add("strokeblink05soffset");
                                    }
                                    break;
                                case "1s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDomBorder.classList.add("strokeblink1s");
                                    } else {
                                        ObjDomBorder.classList.add("strokeblink1soffset");
                                    }
                                    break;
                                case "2s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDomBorder.classList.add("strokeblink2s");
                                    } else {
                                        ObjDomBorder.classList.add("strokeblink2soffset");
                                    }
                                    break
                                default:
                                    break;
                            }
                            //if (!ObjDom.classList.contains('blink1s')) {
                            //    ObjDom.classList.add("blink1s");
                            //}
                        }
                        else {

                        }
                    } catch (error) {
                        //console.error(error);
                    }
                }
            }
        }
    }
    else {

        if (ObjDom.classList.contains('borderblink05s')) {
            ObjDom.classList.remove("borderblink05s");
        }
        if (ObjDom.classList.contains('borderblink1s')) {
            ObjDom.classList.remove("borderblink1s");
        }
        if (ObjDom.classList.contains('borderblink2s')) {
            ObjDom.classList.remove("borderblink2s");
        }
        if (ObjDom.classList.contains('borderblink05soffset')) {
            ObjDom.classList.remove("borderblink05soffset");
        }
        if (ObjDom.classList.contains('borderblink1soffset')) {
            ObjDom.classList.remove("borderblink1soffset");
        }
        if (ObjDom.classList.contains('borderblink2soffset')) {
            ObjDom.classList.remove("borderblink2soffset");
        }

        if (ObjDom.style.borderStyle == "solid") {
            
            if (borderblink) {
                variablevalue = ResolveConditionstate(borderblink);
                
                if (firstdata) {
                    try {
                        if (Function("return " + variablevalue)()) {
                            //console.log(borderblinkspeed);
                            
                            switch (borderblinkspeed) {
                                case "0.5s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDom.classList.add("borderblink05s");
                                    } else {
                                        ObjDom.classList.add("borderblink05soffset");
                                    }
                                    break;
                                case "1s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDom.classList.add("borderblink1s");
                                    } else {
                                        ObjDom.classList.add("borderblink1soffset");
                                    }
                                    break;
                                case "2s":
                                    if (borderblinkoffset === 'false') {
                                        ObjDom.classList.add("borderblink2s");
                                    } else {
                                        ObjDom.classList.add("borderblink2soffset");
                                    }
                                    break
                                default:
                                    break;
                            }
                            //if (!ObjDom.classList.contains('blink1s')) {
                            //    ObjDom.classList.add("blink1s");
                            //}
                        }
                        else {

                        }
                    } catch (error) {
                        //console.error(error);
                    }
                }
            }
        }
    }
    

}
