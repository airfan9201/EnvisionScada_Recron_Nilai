// Envision PropertiesPanel.Builders - Properties panel per-object-type builders: the *ContextInit functions and their type-specific helpers.
// Split from Envision.js. Global scope (no module system); load order defined in Envision.cshtml.

function ColorContextInit() {

    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#colorpickerbackgroundcolor").colorPick({
        'initialColor': backgroundcolor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));
            }


        }
    });

    var data = [];

    var colorstates = ElementToBeDecorated.getAttribute('data-colorstates');

    //console.log(colorstates);

    if (colorstates && colorstates !== '') {
        try {
            data = JSON.parse(colorstates);
        } catch (e) {
            console.log(e);
        }
    }
    
    loadColorContext(data);

}

function ButtonContextInit() {
    
    let ontext;
    let offtext;
    let oncolor;
    let offcolor;
    let onbackgroundcolor;
    let onbordercolor;
    let offbackgroundcolor;
    let offbordercolor;
    let variable;

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    oncolor = ElementToBeDecorated.getAttribute("data-oncolor");

    $("#pickercoloron").colorPick({
        'initialColor': oncolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-oncolor', this.element.attr('title'));

            }

        }
    });

    offcolor = ElementToBeDecorated.getAttribute("data-offcolor");

    $("#pickercoloroff").colorPick({
        'initialColor': offcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offcolor', this.element.attr('title'));

            }
        }
    });

    onbackgroundcolor = ElementToBeDecorated.getAttribute("data-onbackgroundcolor");

    $("#pickerbackgroundcoloron").colorPick({
        'initialColor': onbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
           
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-onbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    onbordercolor = ElementToBeDecorated.getAttribute("data-onbordercolor");

    $("#pickerbordercoloron").colorPick({
        'initialColor': onbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-onbordercolor', this.element.attr('title'));
            }
        }
    });

    offbackgroundcolor = ElementToBeDecorated.getAttribute("data-offbackgroundcolor");

    $("#pickerbackgroundcoloroff").colorPick({
        'initialColor': offbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    offbordercolor = ElementToBeDecorated.getAttribute("data-offbordercolor");

    $("#pickerbordercoloroff").colorPick({
        'initialColor': offbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offbordercolor', this.element.attr('title'));
            }
        }
    });

    ontext = ElementToBeDecorated.getAttribute("data-ontext");

    var ButtonContextOnText = document.getElementById('ButtonContextOnText');
    ButtonContextOnText.value = ontext;
    ButtonContextOnText.addEventListener('input', ButtonContextInputHandlerontext);

    offtext = ElementToBeDecorated.getAttribute("data-offtext");

    var ButtonContextOffText = document.getElementById('ButtonContextOffText');
    ButtonContextOffText.value = offtext;
    ButtonContextOffText.addEventListener('input', ButtonContextInputHandlerofftext);
    
    variable = ElementToBeDecorated.getAttribute("data-variable");

    var ButtonContextVariable = document.getElementById('ButtonContextVariable');
    ButtonContextVariable.value = variable;
    ButtonContextVariable.addEventListener('input', ButtonContextInputHandlervariable);

    let borderradius = getinitAttribute(ElementToBeDecorated, 'data-borderradius', compStyles.getPropertyValue('border-radius'));
    ElementToBeDecorated.style.borderRadius = borderradius;

    var ButtonContextBorderRadius = document.getElementById('ButtonContextBorderRadius');
    ButtonContextBorderRadius.value = borderradius;
    ButtonContextBorderRadius.addEventListener('input', ButtonContextInputHandlerborderradius);

}

function SVGContextInit() {

    let strokecolor;
    let strokewidth;

    strokewidth = GetPropertySVG('stroke-width', ElementToBeDecorated);

    var SVGContextstrokewidth = document.getElementById('SVGContextstrokewidth');
    SVGContextstrokewidth.value = strokewidth;
    SVGContextstrokewidth.addEventListener('input', SVGContextInputHandlerstrokewidth);
    
    strokecolor = GetPropertySVG('stroke', ElementToBeDecorated);

    var SVGContextstrokecolor = document.getElementById('SVGContextstrokecolor');
    SVGContextstrokecolor.value = strokecolor;
    SVGContextstrokecolor.addEventListener('input', SVGContextInputHandlerstrokecolor);

    //background
    if (ElementToBeDecorated.parentElement.hasAttribute("data-isbackground")) {
        background = 'true';
    }
    else {
        background = 'false';
    }

    var InputContextbackground = document.getElementById('SVGContextisbackground');
    InputContextbackground.checked = (background.toLowerCase() === 'true');
    InputContextbackground.addEventListener('input', SVGContextisbackgroundInputHandler);
}

function ImageContextInit() {

    // Almost empty since there is no colorization.

    //background
    if (ElementToBeDecorated.parentElement.hasAttribute("data-isbackground")) {
        background = 'true';
    }
    else {
        background = 'false';
    }

    var InputContextbackground = document.getElementById('ImageContextisbackground');
    InputContextbackground.checked = (background.toLowerCase() === 'true');
    InputContextbackground.addEventListener('input', ImageContextisbackgroundInputHandler);
}


function SquareContextInit() {

    //background
    if (ElementToBeDecorated.parentElement.hasAttribute("data-isbackground")) {
        background = 'true';
    }
    else {
        background = 'false';
    }


    var InputContextbackground = document.getElementById('SquareContextisbackground');
    InputContextbackground.checked = (background.toLowerCase() === 'true');
    InputContextbackground.addEventListener('input', GenericisbackgroundInputHandler);

}

function CircleContextInit() {

    //background
    if (ElementToBeDecorated.parentElement.hasAttribute("data-isbackground")) {
        background = 'true';
    }
    else {
        background = 'false';
    }

    var InputContextbackground = document.getElementById('CircleContextisbackground');
    InputContextbackground.checked = (background.toLowerCase() === 'true');
    InputContextbackground.addEventListener('input', GenericisbackgroundInputHandler);

}

function KnobContextInit() {

    let variable;

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

    let backgroundcolor;

    let ReadOnly;
    let Units;


    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    variable = ElementToBeDecorated.getAttribute("data-variable");

    var KnobContextVariable = document.getElementById('KnobContextVariable');
    KnobContextVariable.value = variable;
    KnobContextVariable.addEventListener('input', KnobContextInputHandlervariable);


    MinValue = ElementToBeDecorated.getAttribute("data-MinValue");

    var KnobContextMinValue = document.getElementById('KnobContextMinValue');
    KnobContextMinValue.value = MinValue;
    KnobContextMinValue.addEventListener('input', KnobContextInputHandlerMinValue);

    MaxValue = ElementToBeDecorated.getAttribute("data-MaxValue");

    var KnobContextMaxValue = document.getElementById('KnobContextMaxValue');
    KnobContextMaxValue.value = MaxValue;
    KnobContextMaxValue.addEventListener('input', KnobContextInputHandlerMaxValue);

    ValueResolution = ElementToBeDecorated.getAttribute("data-ValueResolution");

    var KnobContextValueResolution = document.getElementById('KnobContextValueResolution');
    KnobContextValueResolution.value = ValueResolution;
    KnobContextValueResolution.addEventListener('input', KnobContextInputHandlerValueResolution);

    FontFamily = ElementToBeDecorated.getAttribute("data-fontfamily");

    var KnobContextFontFamily = document.getElementById('KnobContextFontFamily');
    KnobContextFontFamily.value = FontFamily;
    KnobContextFontFamily.addEventListener('input', KnobContextInputHandlerFontFamily);

    FontSize = ElementToBeDecorated.getAttribute("data-fontsize");

    var KnobContextFontSize = document.getElementById('KnobContextFontSize');
    KnobContextFontSize.value = FontSize;
    KnobContextFontSize.addEventListener('input', KnobContextInputHandlerFontSize);

    FontWeight = ElementToBeDecorated.getAttribute("data-fontweight");

    var KnobContextFontWeight = document.getElementById('KnobContextFontWeight');
    KnobContextFontWeight.value = FontWeight;
    KnobContextFontWeight.addEventListener('input', KnobContextInputHandlerFontWeight);

    ZeroAt = ElementToBeDecorated.getAttribute("data-ZeroAt");

    var KnobContextZeroAt = document.getElementById('KnobContextZeroAt');
    KnobContextZeroAt.value = ZeroAt;
    KnobContextZeroAt.addEventListener('input', KnobContextInputHandlerZeroAt);

    AngleMin = ElementToBeDecorated.getAttribute("data-AngleMin");

    var KnobContextAngleMin = document.getElementById('KnobContextAngleMin');
    KnobContextAngleMin.value = AngleMin;
    KnobContextAngleMin.addEventListener('input', KnobContextInputHandlerAngleMin);

    AngleMax = ElementToBeDecorated.getAttribute("data-AngleMax");

    var KnobContextAngleMax = document.getElementById('KnobContextAngleMax');
    KnobContextAngleMax.value = AngleMax;
    KnobContextAngleMax.addEventListener('input', KnobContextInputHandlerAngleMax);

    BackgroundTrackRadius = ElementToBeDecorated.getAttribute("data-BackgroundTrackRadius");

    var KnobContextBackgroundTrackRadius = document.getElementById('KnobContextBackgroundTrackRadius');
    KnobContextBackgroundTrackRadius.value = BackgroundTrackRadius;
    KnobContextBackgroundTrackRadius.addEventListener('input', KnobContextInputHandlerBackgroundTrackRadius);

    BackgroundTrackWidth = ElementToBeDecorated.getAttribute("data-BackgroundTrackWidth");

    var KnobContextBackgroundTrackWidth = document.getElementById('KnobContextBackgroundTrackWidth');
    KnobContextBackgroundTrackWidth.value = BackgroundTrackWidth;
    KnobContextBackgroundTrackWidth.addEventListener('input', KnobContextInputHandlerBackgroundTrackWidth);

    TrackRadius = ElementToBeDecorated.getAttribute("data-TrackRadius");

    var KnobContextTrackRadius = document.getElementById('KnobContextTrackRadius');
    KnobContextTrackRadius.value = TrackRadius;
    KnobContextTrackRadius.addEventListener('input', KnobContextInputHandlerTrackRadius);

    TrackWidth = ElementToBeDecorated.getAttribute("data-TrackWidth");

    var KnobContextTrackWidth = document.getElementById('KnobContextTrackWidth');
    KnobContextTrackWidth.value = TrackWidth;
    KnobContextTrackWidth.addEventListener('input', KnobContextInputHandlerTrackWidth);

    WriteTimeoutTime = ElementToBeDecorated.getAttribute("data-writetimeouttime");

    var KnobContextWriteTimeoutTime = document.getElementById('KnobContextWriteTimeoutTime');
    KnobContextWriteTimeoutTime.value = WriteTimeoutTime;
    KnobContextWriteTimeoutTime.addEventListener('input', KnobContextInputHandlerWriteTimeoutTime);

    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#knobpickerbackgroundcolor").colorPick({
        'initialColor': backgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));
            }
        }
    });

    ReadOnly = ElementToBeDecorated.getAttribute("data-readonly");
    var KnobContextReadOnly = document.getElementById('KnobContextReadOnly');
    KnobContextReadOnly.checked = (ReadOnly.toLowerCase() === 'true');

    KnobContextReadOnly.addEventListener('input', KnobContextInputHandlerReadOnly);

    Units = ElementToBeDecorated.getAttribute("data-units");
    var KnobContextUnits = document.getElementById('KnobContextUnits');
    KnobContextUnits.checked = (Units.toLowerCase() === 'true');

    KnobContextUnits.addEventListener('input', KnobContextInputHandlerUnits);
}
function TrendContextInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    let title;
    let timespan;
    let editable;
    let variable1;
    let variable2;
    let variable3;
    let variable4;
    let variable5;
    let variable6;
    let variable7;
    let variable8;

    let displayxaxis;
    let linewidth;
    let pointwidth;
    let pointradius;
    let displaytitle;
    let displaylegend;

    let backgroundcolor;
    let textcolor;
    let linecolor;
    let dotcolor;
    let dotbackgroundcolor;
    let scalemin;
    let scalemax;
    let scaleposition;
    let hidescale;
    let stepped;
    let filled;
    let hidepoint;
    let linecolor2;
    let dotcolor2;
    let dotbackgroundcolor2;
    let scalemin2;
    let scalemax2;
    let scaleposition2;
    let hidescale2;
    let stepped2;
    let filled2;
    let hidepoint2;
    let linecolor3;
    let dotcolor3;
    let dotbackgroundcolor3;
    let scalemin3;
    let scalemax3;
    let scaleposition3;
    let hidescale3;
    let stepped3;
    let filled3;
    let hidepoint3;
    let linecolor4;
    let dotcolor4;
    let dotbackgroundcolor4;
    let scalemin4;
    let scalemax4;
    let scaleposition4;
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

    title = ElementToBeDecorated.getAttribute("data-title");

    var TrendContexttitle = document.getElementById('TrendContextTitle');

    TrendContexttitle.value = title;
    TrendContexttitle.addEventListener('input', TrendContextInputHandlertitle);

    timespan = ElementToBeDecorated.getAttribute("data-timespan");

    var TrendContextTimespan = document.getElementById('TrendContextTimespan');

    TrendContextTimespan.value = timespan;
    TrendContextTimespan.addEventListener('input', TrendContextInputHandlerTimespan);

    if (ElementToBeDecorated.getAttribute("data-editable")) {
        editable = ElementToBeDecorated.getAttribute("data-editable");
    }
    else {
        editable = 'false';
        ElementToBeDecorated.setAttribute("data-editable", editable);
    }

    editable = ElementToBeDecorated.getAttribute("data-editable");
    var InputContexteditable = document.getElementById('TrendContextEditable');
    InputContexteditable.checked = (editable.toLowerCase() === 'true');
    InputContexteditable.addEventListener('input', TrendContextEditableInputHandler);


    variable1 = ElementToBeDecorated.getAttribute("data-variable1");

    var TrendContextVariable1 = document.getElementById('TrendContextVariable1');

    TrendContextVariable1.value = variable1;
    TrendContextVariable1.addEventListener('input', TrendContextInputHandlerVariable1);


    variable2 = ElementToBeDecorated.getAttribute("data-variable2");

    var TrendContextVariable2 = document.getElementById('TrendContextVariable2');

    TrendContextVariable2.value = variable2;
    TrendContextVariable2.addEventListener('input', TrendContextInputHandlerVariable2);


    variable3 = ElementToBeDecorated.getAttribute("data-variable3");

    var TrendContextVariable3 = document.getElementById('TrendContextVariable3');

    TrendContextVariable3.value = variable3;
    TrendContextVariable3.addEventListener('input', TrendContextInputHandlerVariable3);


    variable4 = ElementToBeDecorated.getAttribute("data-variable4");

    var TrendContextVariable4 = document.getElementById('TrendContextVariable4');

    TrendContextVariable4.value = variable4;
    TrendContextVariable4.addEventListener('input', TrendContextInputHandlerVariable4);


    variable5 = ElementToBeDecorated.getAttribute("data-variable5");

    var TrendContextVariable5 = document.getElementById('TrendContextVariable5');

    TrendContextVariable5.value = variable5;
    TrendContextVariable5.addEventListener('input', TrendContextInputHandlerVariable5);


    variable6 = ElementToBeDecorated.getAttribute("data-variable6");

    var TrendContextVariable6 = document.getElementById('TrendContextVariable6');

    TrendContextVariable6.value = variable6;
    TrendContextVariable6.addEventListener('input', TrendContextInputHandlerVariable6);


    variable7 = ElementToBeDecorated.getAttribute("data-variable7");

    var TrendContextVariable7 = document.getElementById('TrendContextVariable7');

    TrendContextVariable7.value = variable7;
    TrendContextVariable7.addEventListener('input', TrendContextInputHandlerVariable7);


    variable8 = ElementToBeDecorated.getAttribute("data-variable8");

    var TrendContextVariable8 = document.getElementById('TrendContextVariable8');

    TrendContextVariable8.value = variable8;
    TrendContextVariable8.addEventListener('input', TrendContextInputHandlerVariable8);


    displayxaxis = ElementToBeDecorated.getAttribute("data-displayxaxis");

    var TrendContextDisplayXaxis = document.getElementById('TrendContextDisplayXaxis');

    TrendContextDisplayXaxis.value = displayxaxis;
    TrendContextDisplayXaxis.addEventListener('input', TrendContextInputHandlerDisplayXaxis);


    linewidth = ElementToBeDecorated.getAttribute("data-linewidth");

    var TrendContextLineWidth = document.getElementById('TrendContextLineWidth');

    TrendContextLineWidth.value = linewidth;
    TrendContextLineWidth.addEventListener('input', TrendContextInputHandlerLineWidth);


    pointwidth = ElementToBeDecorated.getAttribute("data-pointwidth");

    var TrendContextPointWidth = document.getElementById('TrendContextPointWidth');

    TrendContextPointWidth.value = pointwidth;
    TrendContextPointWidth.addEventListener('input', TrendContextInputHandlerPointWidth);


    pointradius = ElementToBeDecorated.getAttribute("data-pointradius");

    var TrendContextPointRadius = document.getElementById('TrendContextPointRadius');

    TrendContextPointRadius.value = pointradius;
    TrendContextPointRadius.addEventListener('input', TrendContextInputHandlerPointRadius);

    displaytitle = ElementToBeDecorated.getAttribute("data-displaytitle");

    var TrendContextDisplayTitle = document.getElementById('TrendContextDisplayTitle');

    TrendContextDisplayTitle.value = displaytitle;
    TrendContextDisplayTitle.addEventListener('input', TrendContextInputHandlerDisplayTitle);

    displaylegend = ElementToBeDecorated.getAttribute("data-displaylegend");

    var TrendContextDisplayLegend = document.getElementById('TrendContextDisplayLegend');

    TrendContextDisplayLegend.value = displaylegend;
    TrendContextDisplayLegend.addEventListener('input', TrendContextInputHandlerDisplayLegend);


    scalemin = ElementToBeDecorated.getAttribute("data-scalemin");

    var TrendContextScaleMin = document.getElementById('TrendContextScaleMin');

    TrendContextScaleMin.value = scalemin;
    TrendContextScaleMin.addEventListener('input', TrendContextInputHandlerScaleMin);

    scalemin2 = ElementToBeDecorated.getAttribute("data-scalemin2");

    var TrendContextScaleMin2 = document.getElementById('TrendContextScaleMin2');

    TrendContextScaleMin2.value = scalemin2;
    TrendContextScaleMin2.addEventListener('input', TrendContextInputHandlerScaleMin2);

    scalemin3 = ElementToBeDecorated.getAttribute("data-scalemin3");

    var TrendContextScaleMin3 = document.getElementById('TrendContextScaleMin3');

    TrendContextScaleMin3.value = scalemin3;
    TrendContextScaleMin3.addEventListener('input', TrendContextInputHandlerScaleMin3);

    scalemin4 = ElementToBeDecorated.getAttribute("data-scalemin4");

    var TrendContextScaleMin4 = document.getElementById('TrendContextScaleMin4');

    TrendContextScaleMin4.value = scalemin4;
    TrendContextScaleMin4.addEventListener('input', TrendContextInputHandlerScaleMin4);

    scalemax = ElementToBeDecorated.getAttribute("data-scalemax");

    var TrendContextScaleMax = document.getElementById('TrendContextScaleMax');

    TrendContextScaleMax.value = scalemax;
    TrendContextScaleMax.addEventListener('input', TrendContextInputHandlerScaleMax);

    scalemax2 = ElementToBeDecorated.getAttribute("data-scalemax2");

    var TrendContextScaleMax2 = document.getElementById('TrendContextScaleMax2');

    TrendContextScaleMax2.value = scalemax2;
    TrendContextScaleMax2.addEventListener('input', TrendContextInputHandlerScaleMax2);

    scalemax3 = ElementToBeDecorated.getAttribute("data-scalemax3");

    var TrendContextScaleMax3 = document.getElementById('TrendContextScaleMax3');

    TrendContextScaleMax3.value = scalemax3;
    TrendContextScaleMax3.addEventListener('input', TrendContextInputHandlerScaleMax3);

    scalemax4 = ElementToBeDecorated.getAttribute("data-scalemax4");

    var TrendContextScaleMax4 = document.getElementById('TrendContextScaleMax4');

    TrendContextScaleMax4.value = scalemax4;
    TrendContextScaleMax4.addEventListener('input', TrendContextInputHandlerScaleMax4);

    scaleposition = ElementToBeDecorated.getAttribute("data-scaleposition");

    var TrendContextScalePosition = document.getElementById('TrendContextScalePosition');

    TrendContextScalePosition.value = scaleposition;
    TrendContextScalePosition.addEventListener('input', TrendContextInputHandlerScalePosition);

    scaleposition2 = ElementToBeDecorated.getAttribute("data-scaleposition2");

    var TrendContextScalePosition2 = document.getElementById('TrendContextScalePosition2');

    TrendContextScalePosition2.value = scaleposition2;
    TrendContextScalePosition2.addEventListener('input', TrendContextInputHandlerScalePosition2);

    scaleposition3 = ElementToBeDecorated.getAttribute("data-scaleposition3");

    var TrendContextScalePosition3 = document.getElementById('TrendContextScalePosition3');

    TrendContextScalePosition3.value = scaleposition3;
    TrendContextScalePosition3.addEventListener('input', TrendContextInputHandlerScalePosition3);

    scaleposition4 = ElementToBeDecorated.getAttribute("data-scaleposition4");

    var TrendContextScalePosition4 = document.getElementById('TrendContextScalePosition4');

    TrendContextScalePosition4.value = scaleposition4;
    TrendContextScalePosition4.addEventListener('input', TrendContextInputHandlerScalePosition4);

    hidescale = ElementToBeDecorated.getAttribute("data-hidescale");

    var InputContexthidescale = document.getElementById('TrendContexthidescale');
    InputContexthidescale.checked = (hidescale.toLowerCase() === 'true');
    InputContexthidescale.addEventListener('input', TrendContexthidescaleInputHandler);

    hidescale2 = ElementToBeDecorated.getAttribute("data-hidescale2");

    var InputContexthidescale2 = document.getElementById('TrendContexthidescale2');
    InputContexthidescale2.checked = (hidescale2.toLowerCase() === 'true');
    InputContexthidescale2.addEventListener('input', TrendContexthidescale2InputHandler);

    hidescale3 = ElementToBeDecorated.getAttribute("data-hidescale3");

    var InputContexthidescale3 = document.getElementById('TrendContexthidescale3');
    InputContexthidescale3.checked = (hidescale3.toLowerCase() === 'true');
    InputContexthidescale3.addEventListener('input', TrendContexthidescale3InputHandler);

    hidescale4 = ElementToBeDecorated.getAttribute("data-hidescale4");

    var InputContexthidescale4 = document.getElementById('TrendContexthidescale4');
    InputContexthidescale4.checked = (hidescale4.toLowerCase() === 'true');
    InputContexthidescale4.addEventListener('input', TrendContexthidescale4InputHandler);

    stepped = ElementToBeDecorated.getAttribute("data-stepped");

    var InputContextstepped = document.getElementById('TrendContextstepped');
    InputContextstepped.checked = (stepped.toLowerCase() === 'true');
    InputContextstepped.addEventListener('input', TrendContextsteppedInputHandler);

    stepped2 = ElementToBeDecorated.getAttribute("data-stepped2");

    var InputContextstepped2 = document.getElementById('TrendContextstepped2');
    InputContextstepped2.checked = (stepped2.toLowerCase() === 'true');
    InputContextstepped2.addEventListener('input', TrendContextstepped2InputHandler);

    stepped3 = ElementToBeDecorated.getAttribute("data-stepped3");

    var InputContextstepped3 = document.getElementById('TrendContextstepped3');
    InputContextstepped3.checked = (stepped3.toLowerCase() === 'true');
    InputContextstepped3.addEventListener('input', TrendContextstepped3InputHandler);

    stepped4 = ElementToBeDecorated.getAttribute("data-stepped4");

    var InputContextstepped4 = document.getElementById('TrendContextstepped4');
    InputContextstepped4.checked = (stepped4.toLowerCase() === 'true');
    InputContextstepped4.addEventListener('input', TrendContextstepped4InputHandler);

    filled = ElementToBeDecorated.getAttribute("data-filled");

    var InputContextfilled = document.getElementById('TrendContextfilled');
    InputContextfilled.checked = (filled.toLowerCase() === 'true');
    InputContextfilled.addEventListener('input', TrendContextfilledInputHandler);

    filled2 = ElementToBeDecorated.getAttribute("data-filled2");

    var InputContextfilled2 = document.getElementById('TrendContextfilled2');
    InputContextfilled2.checked = (filled2.toLowerCase() === 'true');
    InputContextfilled2.addEventListener('input', TrendContextfilled2InputHandler);

    filled3 = ElementToBeDecorated.getAttribute("data-filled3");

    var InputContextfilled3 = document.getElementById('TrendContextfilled3');
    InputContextfilled3.checked = (filled3.toLowerCase() === 'true');
    InputContextfilled3.addEventListener('input', TrendContextfilled3InputHandler);

    filled4 = ElementToBeDecorated.getAttribute("data-filled4");

    var InputContextfilled4 = document.getElementById('TrendContextfilled4');
    InputContextfilled4.checked = (filled4.toLowerCase() === 'true');
    InputContextfilled4.addEventListener('input', TrendContextfilled4InputHandler);

    hidepoint = ElementToBeDecorated.getAttribute("data-hidepoint");

    var InputContexthidepoint = document.getElementById('TrendContexthidepoint');
    InputContexthidepoint.checked = (hidepoint.toLowerCase() === 'true');
    InputContexthidepoint.addEventListener('input', TrendContexthidepointInputHandler);

    hidepoint2 = ElementToBeDecorated.getAttribute("data-hidepoint2");

    var InputContexthidepoint2 = document.getElementById('TrendContexthidepoint2');
    InputContexthidepoint2.checked = (hidepoint2.toLowerCase() === 'true');
    InputContexthidepoint2.addEventListener('input', TrendContexthidepoint2InputHandler);

    hidepoint3 = ElementToBeDecorated.getAttribute("data-hidepoint3");

    var InputContexthidepoint3 = document.getElementById('TrendContexthidepoint3');
    InputContexthidepoint3.checked = (hidepoint3.toLowerCase() === 'true');
    InputContexthidepoint3.addEventListener('input', TrendContexthidepoint3InputHandler);

    hidepoint4 = ElementToBeDecorated.getAttribute("data-hidepoint4");

    var InputContexthidepoint4 = document.getElementById('TrendContexthidepoint4');
    InputContexthidepoint4.checked = (hidepoint4.toLowerCase() === 'true');
    InputContexthidepoint4.addEventListener('input', TrendContexthidepoint4InputHandler);

    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#trendpickerbackgroundcolor").colorPick({
        'initialColor': backgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));
            }
        }
    });

    textcolor = ElementToBeDecorated.getAttribute("data-textcolor");

    $("#trendpickertextcolor").colorPick({
        'initialColor': textcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-textcolor', this.element.attr('title'));
            }
        }
    });

    linecolor = ElementToBeDecorated.getAttribute("data-linecolor");

    $("#trendpickerlinecolor").colorPick({
        'initialColor': linecolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-linecolor', this.element.attr('title'));
            }
        }
    });

    dotcolor = ElementToBeDecorated.getAttribute("data-dotcolor");

    $("#trendpickerdotcolor").colorPick({
        'initialColor': dotcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotcolor', this.element.attr('title'));
            }
        }
    });

    dotbackgroundcolor = ElementToBeDecorated.getAttribute("data-dotbackgroundcolor");

    $("#trendpickerdotbackgroundcolor").colorPick({
        'initialColor': dotbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    linecolor2 = ElementToBeDecorated.getAttribute("data-linecolor2");

    $("#trendpickerlinecolor2").colorPick({
        'initialColor': linecolor2,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-linecolor2', this.element.attr('title'));
            }
        }
    });

    dotcolor2 = ElementToBeDecorated.getAttribute("data-dotcolor2");

    $("#trendpickerdotcolor2").colorPick({
        'initialColor': dotcolor2,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotcolor2', this.element.attr('title'));
            }
        }
    });

    dotbackgroundcolor2 = ElementToBeDecorated.getAttribute("data-dotbackgroundcolor2");

    $("#trendpickerdotbackgroundcolor2").colorPick({
        'initialColor': dotbackgroundcolor2,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotbackgroundcolor2', this.element.attr('title'));
            }
        }
    });

    linecolor3 = ElementToBeDecorated.getAttribute("data-linecolor3");

    $("#trendpickerlinecolor3").colorPick({
        'initialColor': linecolor3,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-linecolor3', this.element.attr('title'));
            }
        }
    });

    dotcolor3 = ElementToBeDecorated.getAttribute("data-dotcolor3");

    $("#trendpickerdotcolor3").colorPick({
        'initialColor': dotcolor3,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotcolor3', this.element.attr('title'));
            }
        }
    });

    dotbackgroundcolor3 = ElementToBeDecorated.getAttribute("data-dotbackgroundcolor3");

    $("#trendpickerdotbackgroundcolor3").colorPick({
        'initialColor': dotbackgroundcolor3,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotbackgroundcolor3', this.element.attr('title'));
            }
        }
    });

    linecolor4 = ElementToBeDecorated.getAttribute("data-linecolor4");

    $("#trendpickerlinecolor4").colorPick({
        'initialColor': linecolor4,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-linecolor4', this.element.attr('title'));
            }
        }
    });

    dotcolor4 = ElementToBeDecorated.getAttribute("data-dotcolor4");

    $("#trendpickerdotcolor4").colorPick({
        'initialColor': dotcolor4,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotcolor4', this.element.attr('title'));
            }
        }
    });

    dotbackgroundcolor4 = ElementToBeDecorated.getAttribute("data-dotbackgroundcolor4");

    $("#trendpickerdotbackgroundcolor4").colorPick({
        'initialColor': dotbackgroundcolor4,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-dotbackgroundcolor4', this.element.attr('title'));
            }
        }
    });

    yaxiscolor = ElementToBeDecorated.getAttribute("data-yaxiscolor");

    $("#trendpickeryaxiscolor").colorPick({
        'initialColor': yaxiscolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-yaxiscolor', this.element.attr('title'));
            }
        }
    });

    xaxiscolor = ElementToBeDecorated.getAttribute("data-xaxiscolor");

    $("#trendpickerxaxiscolor").colorPick({
        'initialColor': xaxiscolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-xaxiscolor', this.element.attr('title'));
            }
        }
    });

    gridhorizontalcolor = ElementToBeDecorated.getAttribute("data-gridhorizontalcolor");

    $("#trendpickergridhorizontalcolor").colorPick({
        'initialColor': gridhorizontalcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-gridhorizontalcolor', this.element.attr('title'));
            }
        }
    });

    gridverticalcolor = ElementToBeDecorated.getAttribute("data-gridverticalcolor");

    $("#trendpickergridverticalcolor").colorPick({
        'initialColor': gridverticalcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-gridverticalcolor', this.element.attr('title'));
            }
        }
    });

    tooltipbackgroundcolor = ElementToBeDecorated.getAttribute("data-tooltipbackgroundcolor");

    $("#trendpickertooltipbackgroundcolor").colorPick({
        'initialColor': tooltipbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-tooltipbackgroundcolor', this.element.attr('title'));
            }
        }
    });


    tooltiptextcolor = ElementToBeDecorated.getAttribute("data-tooltiptextcolor");

    $("#trendpickertooltiptextcolor").colorPick({
        'initialColor': tooltiptextcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-tooltiptextcolor', this.element.attr('title'));
            }
        }
    });

}


function AlarmBannerContextInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

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
    let acktimecolumnname;
    let ackusercolumnname;
    let ackcommentcolumnname;

    let backgroundcolor;
    let headerbackgroundcolor;
    let textcolor;
    let headertextcolor;
    let gridlinecolor;
    let iconcolor

    //
    assets = ElementToBeDecorated.getAttribute("data-assets");

    var AlarmBannerContextassets = document.getElementById('AlarmBannerContextassets');

    AlarmBannerContextassets.value = assets;
    AlarmBannerContextassets.addEventListener('input', AlarmBannerContextInputHandlerassets);

    //
    alarmbannername = ElementToBeDecorated.getAttribute("data-alarmbannername");

    var AlarmBannerContextalarmbannername = document.getElementById('AlarmBannerContextalarmbannername');

    AlarmBannerContextalarmbannername.value = alarmbannername;
    AlarmBannerContextalarmbannername.addEventListener('input', AlarmBannerContextInputHandleralarmbannername);

    //
    if (ElementToBeDecorated.getAttribute("data-showreturned")) {
        showreturned = ElementToBeDecorated.getAttribute("data-showreturned");
    }
    else {
        showreturned = 'false';
        ElementToBeDecorated.setAttribute("data-showreturned", showreturned);
    }

    showreturned = ElementToBeDecorated.getAttribute("data-showreturned");
    var InputContextshowreturned = document.getElementById('AlarmBannerContextshowreturned');
    InputContextshowreturned.checked = (showreturned.toLowerCase() === 'true');
    InputContextshowreturned.addEventListener('input', AlarmBannerContextshowreturnedInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-showactiveacknowledged")) {
        showactiveacknowledged = ElementToBeDecorated.getAttribute("data-showactiveacknowledged");
    }
    else {
        showactiveacknowledged = 'false';
        ElementToBeDecorated.setAttribute("data-showactiveacknowledged", showactiveacknowledged);
    }

    showactiveacknowledged = ElementToBeDecorated.getAttribute("data-showactiveacknowledged");
    var InputContextshowactiveacknowledged = document.getElementById('AlarmBannerContextshowactiveacknowledged');
    InputContextshowactiveacknowledged.checked = (showactiveacknowledged.toLowerCase() === 'true');
    InputContextshowactiveacknowledged.addEventListener('input', AlarmBannerContextshowactiveacknowledgedInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-showreturnedacknowledged")) {
        showreturnedacknowledged = ElementToBeDecorated.getAttribute("data-showreturnedacknowledged");
    }
    else {
        showreturnedacknowledged = 'false';
        ElementToBeDecorated.setAttribute("data-showreturnedacknowledged", showreturnedacknowledged);
    }

    showreturnedacknowledged = ElementToBeDecorated.getAttribute("data-showreturnedacknowledged");
    var InputContextshowreturnedacknowledged = document.getElementById('AlarmBannerContextshowreturnedacknowledged');
    InputContextshowreturnedacknowledged.checked = (showreturnedacknowledged.toLowerCase() === 'true');
    InputContextshowreturnedacknowledged.addEventListener('input', AlarmBannerContextshowreturnedacknowledgedInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideicon")) {
        hideicon = ElementToBeDecorated.getAttribute("data-hideicon");
    }
    else {
        hideicon = 'false';
        ElementToBeDecorated.setAttribute("data-hideicon", hideicon);
    }

    hideicon = ElementToBeDecorated.getAttribute("data-hideicon");
    var InputContexthideicon = document.getElementById('AlarmBannerContexthideicon');
    InputContexthideicon.checked = (hideicon.toLowerCase() === 'true');
    InputContexthideicon.addEventListener('input', AlarmBannerContexthideiconInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideseverity")) {
        hideseverity = ElementToBeDecorated.getAttribute("data-hideseverity");
    }
    else {
        hideseverity = 'false';
        ElementToBeDecorated.setAttribute("data-hideseverity", hideseverity);
    }

    hideseverity = ElementToBeDecorated.getAttribute("data-hideseverity");
    var InputContexthideseverity = document.getElementById('AlarmBannerContexthideseverity');
    InputContexthideseverity.checked = (hideseverity.toLowerCase() === 'true');
    InputContexthideseverity.addEventListener('input', AlarmBannerContexthideseverityInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideasset")) {
        hideasset = ElementToBeDecorated.getAttribute("data-hideasset");
    }
    else {
        hideasset = 'false';
        ElementToBeDecorated.setAttribute("data-hideasset", hideasset);
    }

    hideasset = ElementToBeDecorated.getAttribute("data-hideasset");
    var InputContexthideasset = document.getElementById('AlarmBannerContexthideasset');
    InputContexthideasset.checked = (hideasset.toLowerCase() === 'true');
    InputContexthideasset.addEventListener('input', AlarmBannerContexthideassetInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideontime")) {
        hideontime = ElementToBeDecorated.getAttribute("data-hideontime");
    }
    else {
        hideontime = 'false';
        ElementToBeDecorated.setAttribute("data-hideontime", hideontime);
    }

    hideontime = ElementToBeDecorated.getAttribute("data-hideontime");
    var InputContexthideontime = document.getElementById('AlarmBannerContexthideontime');
    InputContexthideontime.checked = (hideontime.toLowerCase() === 'true');
    InputContexthideontime.addEventListener('input', AlarmBannerContexthideontimeInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideofftime")) {
        hideofftime = ElementToBeDecorated.getAttribute("data-hideofftime");
    }
    else {
        hideofftime = 'false';
        ElementToBeDecorated.setAttribute("data-hideofftime", hideofftime);
    }

    hideofftime = ElementToBeDecorated.getAttribute("data-hideofftime");
    var InputContexthideofftime = document.getElementById('AlarmBannerContexthideofftime');
    InputContexthideofftime.checked = (hideofftime.toLowerCase() === 'true');
    InputContexthideofftime.addEventListener('input', AlarmBannerContexthideofftimeInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideacktime")) {
        hideacktime = ElementToBeDecorated.getAttribute("data-hideacktime");
    }
    else {
        hideacktime = 'false';
        ElementToBeDecorated.setAttribute("data-hideacktime", hideacktime);
    }

    hideacktime = ElementToBeDecorated.getAttribute("data-hideacktime");
    var InputContexthideacktime = document.getElementById('AlarmBannerContexthideacktime');
    InputContexthideacktime.checked = (hideacktime.toLowerCase() === 'true');
    InputContexthideacktime.addEventListener('input', AlarmBannerContexthideacktimeInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideackuser")) {
        hideackuser = ElementToBeDecorated.getAttribute("data-hideackuser");
    }
    else {
        hideackuser = 'false';
        ElementToBeDecorated.setAttribute("data-hideackuser", hideackuser);
    }

    hideackuser = ElementToBeDecorated.getAttribute("data-hideackuser");
    var InputContexthideackuser = document.getElementById('AlarmBannerContexthideackuser');
    InputContexthideackuser.checked = (hideackuser.toLowerCase() === 'true');
    InputContexthideackuser.addEventListener('input', AlarmBannerContexthideackuserInputHandler);

    //
    if (ElementToBeDecorated.getAttribute("data-hideackcomment")) {
        hideackcomment = ElementToBeDecorated.getAttribute("data-hideackcomment");
    }
    else {
        hideackcomment = 'false';
        ElementToBeDecorated.setAttribute("data-hideackcomment", hideackcomment);
    }

    hideackcomment = ElementToBeDecorated.getAttribute("data-hideackcomment");
    var InputContexthideackcomment = document.getElementById('AlarmBannerContexthideackcomment');
    InputContexthideackcomment.checked = (hideackcomment.toLowerCase() === 'true');
    InputContexthideackcomment.addEventListener('input', AlarmBannerContexthideackcommentInputHandler);

    //
    severitycolumnname = ElementToBeDecorated.getAttribute("data-severitycolumnname");

    var AlarmBannerContextseveritycolumnname = document.getElementById('AlarmBannerContextseveritycolumnname');

    AlarmBannerContextseveritycolumnname.value = severitycolumnname;
    AlarmBannerContextseveritycolumnname.addEventListener('input', AlarmBannerContextInputHandlerseveritycolumnname);

    //
    assetcolumnname = ElementToBeDecorated.getAttribute("data-assetcolumnname");

    var AlarmBannerContextassetcolumnname = document.getElementById('AlarmBannerContextassetcolumnname');

    AlarmBannerContextassetcolumnname.value = assetcolumnname;
    AlarmBannerContextassetcolumnname.addEventListener('input', AlarmBannerContextInputHandlerassetcolumnname);


    //
    messagecolumnname = ElementToBeDecorated.getAttribute("data-messagecolumnname");

    var AlarmBannerContextmessagecolumnname = document.getElementById('AlarmBannerContextmessagecolumnname');

    AlarmBannerContextmessagecolumnname.value = messagecolumnname;
    AlarmBannerContextmessagecolumnname.addEventListener('input', AlarmBannerContextInputHandlermessagecolumnname);

    //
    ontimecolumnname = ElementToBeDecorated.getAttribute("data-ontimecolumnname");

    var AlarmBannerContextontimecolumnname = document.getElementById('AlarmBannerContextontimecolumnname');

    AlarmBannerContextontimecolumnname.value = ontimecolumnname;
    AlarmBannerContextontimecolumnname.addEventListener('input', AlarmBannerContextInputHandlerontimecolumnname);

    //
    offtimecolumnname = ElementToBeDecorated.getAttribute("data-offtimecolumnname");

    var AlarmBannerContextofftimecolumnname = document.getElementById('AlarmBannerContextofftimecolumnname');

    AlarmBannerContextofftimecolumnname.value = offtimecolumnname;
    AlarmBannerContextofftimecolumnname.addEventListener('input', AlarmBannerContextInputHandlerofftimecolumnname);

    //
    acktimecolumnname = ElementToBeDecorated.getAttribute("data-acktimecolumnname");

    var AlarmBannerContextacktimecolumnname = document.getElementById('AlarmBannerContextacktimecolumnname');

    AlarmBannerContextacktimecolumnname.value = acktimecolumnname;
    AlarmBannerContextacktimecolumnname.addEventListener('input', AlarmBannerContextInputHandleracktimecolumnname);

    //
    ackusercolumnname = ElementToBeDecorated.getAttribute("data-ackusercolumnname");

    var AlarmBannerContextackusercolumnname = document.getElementById('AlarmBannerContextackusercolumnname');

    AlarmBannerContextackusercolumnname.value = ackusercolumnname;
    AlarmBannerContextackusercolumnname.addEventListener('input', AlarmBannerContextInputHandlerackusercolumnname);

    //
    ackcommentcolumnname = ElementToBeDecorated.getAttribute("data-ackcommentcolumnname");

    var AlarmBannerContextackcommentcolumnname = document.getElementById('AlarmBannerContextackcommentcolumnname');

    AlarmBannerContextackcommentcolumnname.value = ackcommentcolumnname;
    AlarmBannerContextackcommentcolumnname.addEventListener('input', AlarmBannerContextInputHandlerackcommentcolumnname);

    //
    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#alarmbannerpickerbackgroundcolor").colorPick({
        'initialColor': backgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));

                var AlarmBannerTable = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerTable")[0];
                AlarmBannerTable.style.backgroundColor = GetObjectColor(this.element.attr('title'));

            }
        }
    });

    //
    headerbackgroundcolor = ElementToBeDecorated.getAttribute("data-headerbackgroundcolor");

    $("#alarmbannerpickerheaderbackgroundcolor").colorPick({
        'initialColor': headerbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-headerbackgroundcolor', this.element.attr('title'));

                var AlarmBannerIconHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerIconHeaderColumn")[0];
                var AlarmBannerSeverityHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerSeverityHeaderColumn")[0];
                var AlarmBannerAssetHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerAssetHeaderColumn")[0];
                var AlarmBannerMessageHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerMessageHeaderColumn")[0];
                var AlarmBannerOnTimeHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerOnTimeHeaderColumn")[0];
                var AlarmBannerOffTimeHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerOffTimeHeaderColumn")[0];
                var AlarmBannerAckTimeHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerAckTimeHeaderColumn")[0];
                var AlarmBannerAckUserHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerAckUserHeaderColumn")[0];
                var AlarmBannerAckCommentHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerAckCommentHeaderColumn")[0];

                var AlarmBannerAckHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerAckHeaderColumn")[0];
                var AlarmBannerRemoveHeaderColumn = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerRemoveHeaderColumn")[0];

                AlarmBannerIconHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerSeverityHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerAssetHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerMessageHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerOnTimeHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerOffTimeHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerAckTimeHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerAckUserHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerAckCommentHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));

                AlarmBannerAckHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
                AlarmBannerRemoveHeaderColumn.style.backgroundColor = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    //
    textcolor = ElementToBeDecorated.getAttribute("data-textcolor");

    $("#alarmbannerpickertextcolor").colorPick({
        'initialColor': textcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-textcolor', this.element.attr('title'));

                var AlarmBannerTbody = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerTbody")[0];
                AlarmBannerTbody.style.color = GetObjectColor(this.element.attr('title'));

            }
        }
    });

    //
    headertextcolor = ElementToBeDecorated.getAttribute("data-headertextcolor");

    $("#alarmbannerpickerheadertextcolor").colorPick({
        'initialColor': headertextcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-headertextcolor', this.element.attr('title'));

                var AlarmBannerThead = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerThead")[0];
                AlarmBannerThead.style.color = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    //
    gridlinecolor = ElementToBeDecorated.getAttribute("data-gridlinecolor");

    $("#alarmbannerpickergridlinecolor").colorPick({
        'initialColor': gridlinecolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-gridlinecolor', this.element.attr('title'));

                /*var AlarmBannerTable = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerTable")[0];*/
                ElementToBeDecoratedX.style.borderColor = GetObjectColor(this.element.attr('title'));

                var AlarmBannerThead = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerThead")[0];
                AlarmBannerThead.style.borderColor = GetObjectColor(this.element.attr('title'));

                var AlarmBannerTbody = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerTbody")[0];
                AlarmBannerTbody.style.borderColor = GetObjectColor(this.element.attr('title'));

            }
        }
    });

    //
    iconcolor = ElementToBeDecorated.getAttribute("data-iconcolor");

    $("#alarmbannerpickericoncolor").colorPick({
        'initialColor': iconcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-iconcolor', this.element.attr('title'));

                var AlarmBannerTable = ElementToBeDecoratedX.getElementsByClassName("AlarmBannerTable")[0];
                AlarmBannerTable.style.fill = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    // Header text
    var theadEl = ElementToBeDecorated.getElementsByClassName("AlarmBannerThead")[0];
    var theadRowEl = theadEl ? theadEl.getElementsByTagName('tr')[0] : null;
    var theadStyles = theadEl ? window.getComputedStyle(theadEl) : null;
    var theadRowStyles = theadRowEl ? window.getComputedStyle(theadRowEl) : null;

    let headerfontfamily = getinitAttribute(ElementToBeDecorated, 'data-headerfontfamily', theadStyles ? theadStyles.fontFamily : '');
    let headerfontsize = getinitAttribute(ElementToBeDecorated, 'data-headerfontsize', theadStyles ? theadStyles.fontSize : '');
    let headerfontweight = getinitAttribute(ElementToBeDecorated, 'data-headerfontweight', theadStyles ? theadStyles.fontWeight : '');
    let headerheight = getinitAttribute(ElementToBeDecorated, 'data-headerheight', theadRowStyles ? theadRowStyles.height : '');

    var AlarmBannerContextHeaderFontFamily = document.getElementById('AlarmBannerContextHeaderFontFamily');
    AlarmBannerContextHeaderFontFamily.value = headerfontfamily;
    AlarmBannerContextHeaderFontFamily.addEventListener('input', AlarmBannerContextInputHandlerHeaderFontFamily);

    var AlarmBannerContextHeaderFontSize = document.getElementById('AlarmBannerContextHeaderFontSize');
    AlarmBannerContextHeaderFontSize.value = headerfontsize;
    AlarmBannerContextHeaderFontSize.addEventListener('input', AlarmBannerContextInputHandlerHeaderFontSize);

    var AlarmBannerContextHeaderFontWeight = document.getElementById('AlarmBannerContextHeaderFontWeight');
    AlarmBannerContextHeaderFontWeight.value = headerfontweight;
    AlarmBannerContextHeaderFontWeight.addEventListener('input', AlarmBannerContextInputHandlerHeaderFontWeight);

    var AlarmBannerContextHeaderHeight = document.getElementById('AlarmBannerContextHeaderHeight');
    AlarmBannerContextHeaderHeight.value = headerheight;
    AlarmBannerContextHeaderHeight.addEventListener('input', AlarmBannerContextInputHandlerHeaderHeight);

    // Row text
    var tbodyEl = ElementToBeDecorated.getElementsByClassName("AlarmBannerTbody")[0];
    var tbodyRowEl = tbodyEl ? tbodyEl.getElementsByTagName('tr')[0] : null;
    var tbodyStyles = tbodyEl ? window.getComputedStyle(tbodyEl) : null;
    var tbodyRowStyles = tbodyRowEl ? window.getComputedStyle(tbodyRowEl) : null;

    let rowfontfamily = getinitAttribute(ElementToBeDecorated, 'data-rowfontfamily', tbodyStyles ? tbodyStyles.fontFamily : '');
    let rowfontsize = getinitAttribute(ElementToBeDecorated, 'data-rowfontsize', tbodyStyles ? tbodyStyles.fontSize : '');
    let rowfontweight = getinitAttribute(ElementToBeDecorated, 'data-rowfontweight', tbodyStyles ? tbodyStyles.fontWeight : '');
    let rowheight = getinitAttribute(ElementToBeDecorated, 'data-rowheight', tbodyRowStyles ? tbodyRowStyles.height : '');

    var AlarmBannerContextRowFontFamily = document.getElementById('AlarmBannerContextRowFontFamily');
    AlarmBannerContextRowFontFamily.value = rowfontfamily;
    AlarmBannerContextRowFontFamily.addEventListener('input', AlarmBannerContextInputHandlerRowFontFamily);

    var AlarmBannerContextRowFontSize = document.getElementById('AlarmBannerContextRowFontSize');
    AlarmBannerContextRowFontSize.value = rowfontsize;
    AlarmBannerContextRowFontSize.addEventListener('input', AlarmBannerContextInputHandlerRowFontSize);

    var AlarmBannerContextRowFontWeight = document.getElementById('AlarmBannerContextRowFontWeight');
    AlarmBannerContextRowFontWeight.value = rowfontweight;
    AlarmBannerContextRowFontWeight.addEventListener('input', AlarmBannerContextInputHandlerRowFontWeight);

    var AlarmBannerContextRowHeight = document.getElementById('AlarmBannerContextRowHeight');
    AlarmBannerContextRowHeight.value = rowheight;
    AlarmBannerContextRowHeight.addEventListener('input', AlarmBannerContextInputHandlerRowHeight);
}

function ApplyAlarmBannerHeaderStyle(ObjDom) {
    if (!ObjDom) return;
    var thead = ObjDom.getElementsByClassName("AlarmBannerThead")[0];
    if (!thead) return;

    var fontfamily = ObjDom.getAttribute("data-headerfontfamily");
    var fontsize = ObjDom.getAttribute("data-headerfontsize");
    var fontweight = ObjDom.getAttribute("data-headerfontweight");
    var height = ObjDom.getAttribute("data-headerheight");

    var fontsizeCss = (fontsize === null || fontsize === '') ? '' : (isNaN(fontsize) ? fontsize : (fontsize + 'px'));
    var heightCss = (height === null || height === '') ? '' : (isNaN(height) ? height : (height + 'px'));

    thead.style.fontFamily = fontfamily || '';
    thead.style.fontSize = fontsizeCss;
    thead.style.fontWeight = fontweight || '';

    var headerRows = thead.getElementsByTagName('tr');
    for (var i = 0; i < headerRows.length; i++) {
        headerRows[i].style.height = heightCss;
        var cells = headerRows[i].children;
        for (var j = 0; j < cells.length; j++) {
            cells[j].style.fontFamily = fontfamily || '';
            cells[j].style.fontSize = fontsizeCss;
            cells[j].style.fontWeight = fontweight || '';
            cells[j].style.height = heightCss;
        }
    }
}

function ApplyAlarmBannerRowStyle(ObjDom) {
    if (!ObjDom) return;
    var tbody = ObjDom.getElementsByClassName("AlarmBannerTbody")[0];
    if (!tbody) return;

    var fontfamily = ObjDom.getAttribute("data-rowfontfamily");
    var fontsize = ObjDom.getAttribute("data-rowfontsize");
    var fontweight = ObjDom.getAttribute("data-rowfontweight");
    var height = ObjDom.getAttribute("data-rowheight");

    var fontsizeCss = (fontsize === null || fontsize === '') ? '' : (isNaN(fontsize) ? fontsize : (fontsize + 'px'));
    var heightCss = (height === null || height === '') ? '' : (isNaN(height) ? height : (height + 'px'));

    tbody.style.fontFamily = fontfamily || '';
    tbody.style.fontSize = fontsizeCss;
    tbody.style.fontWeight = fontweight || '';

    var rows = tbody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        rows[i].style.height = heightCss;
        var cells = rows[i].children;
        for (var j = 0; j < cells.length; j++) {
            cells[j].style.fontFamily = fontfamily || '';
            cells[j].style.fontSize = fontsizeCss;
            cells[j].style.fontWeight = fontweight || '';
            cells[j].style.height = heightCss;
        }
    }
}

function ApplyAlarmBannerStyles(ObjDom) {
    ApplyAlarmBannerHeaderStyle(ObjDom);
    ApplyAlarmBannerRowStyle(ObjDom);
}


function InputContextInit() {
    let color;
    let backgroundcolor;
    //let bordercolor;
    let variable;
    let ReadOnly;
    let Units;
    let FloatingPoint;
    let decimals;
    let label;

    let numpad;
    let numpaddecimalsymbol;

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    color = ElementToBeDecorated.getAttribute("data-color");

    $("#inputpickercolor").colorPick({
        'initialColor': color,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);

                ElementToBeDecoratedX.setAttribute('data-color', this.element.attr('title'));
            }
        }
    });

    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#inputpickerbackgroundcolor").colorPick({
        'initialColor': backgroundcolor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));
            }


        }
    });

    //bordercolor = ElementToBeDecorated.getAttribute("data-bordercolor");

    //$("#inputpickerbordercolor").colorPick({
    //    'initialColor': bordercolor,
    //    'palette': palettecolors,
    //    'init': function () {
    //        this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
    //    },
    //    'onColorSelected': function () {

    //        this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

    //        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
    //            ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
    //            ElementToBeDecoratedX.setAttribute('data-bordercolor', this.element.attr('title'));
    //        }
    //    }
    //});

    variable = ElementToBeDecorated.getAttribute("data-variable");

    var InputContextVariable = document.getElementById('InputContextVariable');
    InputContextVariable.value = variable;
    InputContextVariable.addEventListener('input', InputContextInputHandlervariable);

    label = ElementToBeDecorated.getAttribute("data-label");

    var InputContextLabel = document.getElementById('InputContextLabel');
    InputContextLabel.value = label;
    InputContextLabel.addEventListener('input', InputContextInputHandlerlabel);

    ReadOnly = ElementToBeDecorated.getAttribute("data-readonly");
    var InputContextReadOnly = document.getElementById('InputContextReadOnly');
    InputContextReadOnly.checked = (ReadOnly.toLowerCase() === 'true');

    InputContextReadOnly.addEventListener('input', InputContextInputHandlerReadOnly);

    Units = ElementToBeDecorated.getAttribute("data-units");
    var InputContextUnits = document.getElementById('InputContextUnits');
    InputContextUnits.checked = (Units.toLowerCase() === 'true');

    InputContextUnits.addEventListener('input', InputContextInputHandlerUnits);

    FloatingPoint = ElementToBeDecorated.getAttribute("data-floatingpoint");
    if (!FloatingPoint) {
        FloatingPoint = 'false';
    }

    var InputContextFloatingPoint = document.getElementById('InputContextFloatingPoint');
    InputContextFloatingPoint.checked = (FloatingPoint.toLowerCase() === 'true');
    InputContextFloatingPoint.addEventListener('input', InputContextInputHandlerFloatingPoint);

    if (FloatingPoint.toLowerCase() === 'true') {
        document.getElementById('InputContextDecimalsRow').style.display = "flex";
    }
    else {
        document.getElementById('InputContextDecimalsRow').style.display = "none";
    }

    decimals = ElementToBeDecorated.getAttribute("data-decimals");
    if (decimals) {
        var InputContextDecimals = document.getElementById('InputContextDecimals');
        InputContextDecimals.innerHTML = decimals;
    }

    PasswordField = ElementToBeDecorated.getAttribute("data-passwordfield");
    if (!PasswordField) {
        PasswordField = 'false';
    }

    var InputContextPasswordField = document.getElementById('InputContextPasswordField');
    InputContextPasswordField.checked = (PasswordField.toLowerCase() === 'true');
    InputContextPasswordField.addEventListener('input', InputContextInputHandlerPasswordField);

    // numpad

    numpad = ElementToBeDecorated.getAttribute("data-numpad");
    if (!numpad) {
        numpad = 'false';
    }

    var InputContextNumpad = document.getElementById('InputContextNumpad');
    InputContextNumpad.checked = (numpad.toLowerCase() === 'true');
    InputContextNumpad.addEventListener('input', InputContextInputHandlerNumpad);

    if (numpad.toLowerCase() === 'true') {
        document.getElementById('InputContextNumpadDecimalSymbolRow').style.display = "flex";
        document.getElementById('InputContextNumpadMinusSymbolRow').style.display = "flex";
    }
    else {
        document.getElementById('InputContextNumpadDecimalSymbolRow').style.display = "none";
        document.getElementById('InputContextNumpadMinusSymbolRow').style.display = "none";
    }

    numpaddecimalsymbol = ElementToBeDecorated.getAttribute("data-numpaddecimalsymbol");
    if (!numpaddecimalsymbol) {
        numpaddecimalsymbol = 'false';
    }

    var InputContextNumpadDecimalSymbol = document.getElementById('InputContextNumpadDecimalSymbol');
    InputContextNumpadDecimalSymbol.checked = (numpaddecimalsymbol.toLowerCase() === 'true');
    InputContextNumpadDecimalSymbol.addEventListener('input', InputContextInputHandlerNumpadDecimalSymbol);

    numpadminussymbol = ElementToBeDecorated.getAttribute("data-numpadminussymbol");
    if (!numpadminussymbol) {
        numpadminussymbol = 'false';
    }

    var InputContextNumpadMinusSymbol = document.getElementById('InputContextNumpadMinusSymbol');
    InputContextNumpadMinusSymbol.checked = (numpadminussymbol.toLowerCase() === 'true');
    InputContextNumpadMinusSymbol.addEventListener('input', InputContextInputHandlerNumpadMinusSymbol);

    // keyboard

    var keyboard = ElementToBeDecorated.getAttribute("data-keyboard");
    if (!keyboard) {
        keyboard = 'false';
    }

    var InputContextKeyboard = document.getElementById('InputContextKeyboard');
    InputContextKeyboard.checked = (keyboard.toLowerCase() === 'true');
    InputContextKeyboard.addEventListener('input', InputContextInputHandlerKeyboard);

}

function DateTimePickerContextInit() {
    let variable = ElementToBeDecorated.getAttribute("data-variable") || "";
    let mode = ElementToBeDecorated.getAttribute("data-datetimemode") || "DateTime";
    let displayformat = ElementToBeDecorated.getAttribute("data-displayformat") || "yyyy-MM-dd HH:mm:ss";
    let isUtc = (ElementToBeDecorated.getAttribute("data-isutc") || "false").toLowerCase() === "true";
    let displayTextColor = ElementToBeDecorated.getAttribute("data-color") || "#000000";
    let displayBackgroundColor = ElementToBeDecorated.getAttribute("data-backgroundcolor") || "#ffffff";
    let pickerBackgroundColor = ElementToBeDecorated.getAttribute("data-pickerbackgroundcolor") || "#ffffff";
    let pickerTextColor = ElementToBeDecorated.getAttribute("data-pickertextcolor") || "#212529";
    let selectedBackgroundColor = ElementToBeDecorated.getAttribute("data-selectedbackgroundcolor") || "#0d6efd";
    let selectedTextColor = ElementToBeDecorated.getAttribute("data-selectedtextcolor") || "#ffffff";
    let todayBackgroundColor = ElementToBeDecorated.getAttribute("data-todaybackgroundcolor") || selectedBackgroundColor;
    let todayTextColor = ElementToBeDecorated.getAttribute("data-todaytextcolor") || selectedTextColor;
    let hoverBackgroundColor = ElementToBeDecorated.getAttribute("data-hoverbackgroundcolor") || "#f3f3f3";
    let hoverTextColor = ElementToBeDecorated.getAttribute("data-hovertextcolor") || "#6c757d";

    var variableInput = document.getElementById('DateTimePickerContextVariable');
    variableInput.value = variable;
    variableInput.addEventListener('input', DateTimePickerContextInputHandlervariable);

    var modeInput = document.getElementById('DateTimePickerContextMode');
    modeInput.value = mode;
    modeInput.addEventListener('input', DateTimePickerContextInputHandlerMode);

    var displayFormatInput = document.getElementById('DateTimePickerContextDisplayFormat');
    displayFormatInput.value = displayformat;
    displayFormatInput.addEventListener('input', DateTimePickerContextInputHandlerDisplayFormat);
    
    var isUtcInput = document.getElementById('DateTimePickerContextIsUtc');
    isUtcInput.checked = isUtc;
    isUtcInput.addEventListener('input', DateTimePickerContextInputHandlerIsUtc);
    isUtcInput.addEventListener('change', DateTimePickerContextInputHandlerIsUtc);

    $("#datetimepickerdisplaytextcolor").colorPick({
        'initialColor': displayTextColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerDisplayTextColor(this.element.attr('title'));
        }
    });

    $("#datetimepickerdisplaybackgroundcolor").colorPick({
        'initialColor': displayBackgroundColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerDisplayBackgroundColor(this.element.attr('title'));
        }
    });

    $("#datetimepickerpickerbackgroundcolor").colorPick({
        'initialColor': pickerBackgroundColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerPickerBackgroundColor(this.element.attr('title'));
        }
    });

    $("#datetimepickerpickertextcolor").colorPick({
        'initialColor': pickerTextColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerPickerTextColor(this.element.attr('title'));
        }
    });

    $("#datetimepickerselectedbackgroundcolor").colorPick({
        'initialColor': selectedBackgroundColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerSelectedBackgroundColor(this.element.attr('title'));
        }
    });

    $("#datetimepickerselectedtextcolor").colorPick({
        'initialColor': selectedTextColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerSelectedTextColor(this.element.attr('title'));
        }
    });

    $("#datetimepickertodaybackgroundcolor").colorPick({
        'initialColor': todayBackgroundColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerTodayBackgroundColor(this.element.attr('title'));
        }
    });

    $("#datetimepickertodaytextcolor").colorPick({
        'initialColor': todayTextColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerTodayTextColor(this.element.attr('title'));
        }
    });

    $("#datetimepickerhoverbackgroundcolor").colorPick({
        'initialColor': hoverBackgroundColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerHoverBackgroundColor(this.element.attr('title'));
        }
    });

    $("#datetimepickerhovertextcolor").colorPick({
        'initialColor': hoverTextColor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            DateTimePickerContextInputHandlerHoverTextColor(this.element.attr('title'));
        }
    });

}

function LabelContextInit() {

    let color;
    let backgroundcolor;
    //let bordercolor;
    let variable;
    let ReadOnly;
    let Units;
    let label;

    let numpad;
    let numpaddecimalsymbol;

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    color = ElementToBeDecorated.getAttribute("data-color");

    $("#labelpickercolor").colorPick({
        'initialColor': color,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);

                ElementToBeDecoratedX.setAttribute('data-color', this.element.attr('title'));
            }
        }
    });

    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#labelpickerbackgroundcolor").colorPick({
        'initialColor': backgroundcolor,
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));
            }


        }
    });

    // Conditional background color states: data-backgroundcolor stays the base, a state only
    // overrides it while its condition matches. Own editor instance (LabelColorstates.js)
    // because the Label panel does not use the shared ColorContext group.
    var labelcolorstatesdata = [];

    var labelcolorstates = ElementToBeDecorated.getAttribute('data-colorstates');

    if (labelcolorstates && labelcolorstates !== '') {
        try {
            labelcolorstatesdata = JSON.parse(labelcolorstates);
        } catch (e) {
            console.log(e);
        }
    }

    loadLabelColorContext(labelcolorstatesdata);

    // Conditional text color states: data-color stays the base text color, a state only
    // overrides it while its condition matches.
    var textcolorstatesdata = [];

    var textcolorstates = ElementToBeDecorated.getAttribute('data-textcolorstates');

    if (textcolorstates && textcolorstates !== '') {
        try {
            textcolorstatesdata = JSON.parse(textcolorstates);
        } catch (e) {
            console.log(e);
        }
    }

    loadTextColorContext(textcolorstatesdata);

    //bordercolor = ElementToBeDecorated.getAttribute("data-bordercolor");

    //$("#labelpickerbordercolor").colorPick({
    //    'initialColor': bordercolor,
    //    'palette': palettecolors,
    //    'init': function () {
    //        this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
    //    },
    //    'onColorSelected': function () {

    //        this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

    //        for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
    //            ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
    //            ElementToBeDecoratedX.setAttribute('data-bordercolor', this.element.attr('title'));
    //        }
    //    }
    //});

    variable = ElementToBeDecorated.getAttribute("data-variable");

    var LabelContextVariable = document.getElementById('LabelContextVariable');
    LabelContextVariable.value = variable;
    LabelContextVariable.addEventListener('input', LabelContextInputHandlervariable);

    label = ElementToBeDecorated.getAttribute("data-label");

    var LabelContextLabel = document.getElementById('LabelContextLabel');
    LabelContextLabel.value = label;
    LabelContextLabel.addEventListener('input', LabelContextInputHandlerlabel);
    
    ReadOnly = ElementToBeDecorated.getAttribute("data-readonly");
    var LabelContextReadOnly = document.getElementById('LabelContextReadOnly');
    LabelContextReadOnly.checked = (ReadOnly.toLowerCase() === 'true');

    LabelContextReadOnly.addEventListener('input', LabelContextInputHandlerReadOnly);

    Units = ElementToBeDecorated.getAttribute("data-units");
    var LabelContextUnits = document.getElementById('LabelContextUnits');
    LabelContextUnits.checked = (Units.toLowerCase() === 'true');

    LabelContextUnits.addEventListener('input', LabelContextInputHandlerUnits);

    FloatingPoint = ElementToBeDecorated.getAttribute("data-floatingpoint");
    if (!FloatingPoint) {
        FloatingPoint = 'false';
    }
    var LabelContextFloatingPoint = document.getElementById('LabelContextFloatingPoint');
    LabelContextFloatingPoint.checked = (FloatingPoint.toLowerCase() === 'true');

    LabelContextFloatingPoint.addEventListener('input', LabelContextInputHandlerFloatingPoint);

    if (FloatingPoint.toLowerCase() === 'true') {
        document.getElementById('LabelContextDecimalsRow').style.display = "flex";
    }
    else {
        document.getElementById('LabelContextDecimalsRow').style.display = "none";
    }

    decimals = ElementToBeDecorated.getAttribute("data-decimals");
    if (decimals) {
        var LabelContextDecimals = document.getElementById('LabelContextDecimals');
        LabelContextDecimals.innerHTML = decimals;
    }

    // numpad

    numpad = ElementToBeDecorated.getAttribute("data-numpad");
    if (!numpad) {
        numpad = 'false';
    }

    var LabelContextNumpad = document.getElementById('LabelContextNumpad');
    LabelContextNumpad.checked = (numpad.toLowerCase() === 'true');
    LabelContextNumpad.addEventListener('input', LabelContextInputHandlerNumpad);

    if (numpad.toLowerCase() === 'true') {
        document.getElementById('LabelContextNumpadDecimalSymbolRow').style.display = "flex";
        document.getElementById('LabelContextNumpadMinusSymbolRow').style.display = "flex";
    }
    else {
        document.getElementById('LabelContextNumpadDecimalSymbolRow').style.display = "none";
        document.getElementById('LabelContextNumpadMinusSymbolRow').style.display = "none";
    }

    numpaddecimalsymbol = ElementToBeDecorated.getAttribute("data-numpaddecimalsymbol");
    if (!numpaddecimalsymbol) {
        numpaddecimalsymbol = 'false';
    }

    var LabelContextNumpadDecimalSymbol = document.getElementById('LabelContextNumpadDecimalSymbol');
    LabelContextNumpadDecimalSymbol.checked = (numpaddecimalsymbol.toLowerCase() === 'true');
    LabelContextNumpadDecimalSymbol.addEventListener('input', LabelContextInputHandlerNumpadDecimalSymbol);

    numpadminussymbol = ElementToBeDecorated.getAttribute("data-numpadminussymbol");
    if (!numpadminussymbol) {
        numpadminussymbol = 'false';
    }

    var LabelContextNumpadMinusSymbol = document.getElementById('LabelContextNumpadMinusSymbol');
    LabelContextNumpadMinusSymbol.checked = (numpadminussymbol.toLowerCase() === 'true');
    LabelContextNumpadMinusSymbol.addEventListener('input', LabelContextInputHandlerNumpadMinusSymbol);
}


function WebFrameContextInit() {

    URL = ElementToBeDecorated.getAttribute("data-url");

    var WebFrameContextURL = document.getElementById('WebFrameContextURL');
    WebFrameContextURL.value = URL;
    WebFrameContextURL.addEventListener('input', WebFrameContextInputHandlerURL);

    StaticPage = ElementToBeDecorated.getAttribute("data-staticpage");
    if (!StaticPage) {
        StaticPage = 'false';
    }

    var WebFrameContextStaticPage = document.getElementById('WebFrameContextStaticPage');
    WebFrameContextStaticPage.checked = (StaticPage.toLowerCase() === 'true');
    WebFrameContextStaticPage.addEventListener('input', WebFrameContextInputHandlerStaticPage);

    if (StaticPage.toLowerCase() === 'true') {
        document.getElementById('WebFrameContextStaticPageRow').style.display = "flex";
    }

    Refresh = ElementToBeDecorated.getAttribute("data-refresh");

    var WebFrameContextRefresh = document.getElementById('WebFrameContextRefresh');
    WebFrameContextRefresh.value = Refresh;
    WebFrameContextRefresh.addEventListener('input', WebFrameContextInputHandlerRefresh);

    PostMessageEnabled = ElementToBeDecorated.getAttribute("data-postmessageenabled");
    if (!PostMessageEnabled) {
        PostMessageEnabled = 'false';
    }

    var WebFrameContextPostMessageEnabled = document.getElementById('WebFrameContextPostMessageEnabled');
    WebFrameContextPostMessageEnabled.checked = (PostMessageEnabled.toLowerCase() === 'true');
    WebFrameContextPostMessageEnabled.addEventListener('input', WebFrameContextInputHandlerPostMessageEnabled);

    ToggleWebFramePostMessageSettings(PostMessageEnabled.toLowerCase() === 'true');

    PostMessage = ElementToBeDecorated.getAttribute("data-postmessage");
    if (!PostMessage) {
        PostMessage = '';
    }

    var WebFrameContextPostMessage = document.getElementById('WebFrameContextPostMessage');
    WebFrameContextPostMessage.value = PostMessage;
    WebFrameContextPostMessage.addEventListener('input', WebFrameContextInputHandlerPostMessage);
}

function TrendAnalystViewerContextInit() {

    var TrendAnalystViewerContextConfig = document.getElementById('TrendAnalystViewerContextConfig');
    TrendAnalystViewerContextConfig.value = ElementToBeDecorated.getAttribute("data-config") ?? '';
    TrendAnalystViewerContextConfig.addEventListener('input', TrendAnalystViewerContextInputHandlerConfig);
}

function DocumentViewerContextInit() {

    // One field. It takes a full path, or the name of a variable holding one; the picker writes the
    // chosen name straight into the box and fires 'focusout' (see ChooseVariable), never 'input', so
    // both events are wired or a picked variable would never reach the object.
    var DocumentViewerContextDocumentPath = document.getElementById('DocumentViewerContextDocumentPath');
    DocumentViewerContextDocumentPath.value = ElementToBeDecorated.getAttribute("data-documentpath") ?? '';
    DocumentViewerContextDocumentPath.addEventListener('input', DocumentViewerContextInputHandlerDocumentPath);
    DocumentViewerContextDocumentPath.addEventListener('focusout', DocumentViewerContextInputHandlerDocumentPath);

    var Toolbar = ElementToBeDecorated.getAttribute("data-toolbar");
    if (!Toolbar) {
        Toolbar = 'true';
    }

    // Optional. Publishes ok / nopath / unavailable / signin to a client variable, so the page can
    // say why the frame is empty in its own words instead of showing a blank rectangle.
    var DocumentViewerContextStatusVariable = document.getElementById('DocumentViewerContextStatusVariable');
    DocumentViewerContextStatusVariable.value = ElementToBeDecorated.getAttribute("data-statusvariable") ?? '';
    DocumentViewerContextStatusVariable.addEventListener('input', DocumentViewerContextInputHandlerStatusVariable);
    DocumentViewerContextStatusVariable.addEventListener('focusout', DocumentViewerContextInputHandlerStatusVariable);

    var DocumentViewerContextToolbar = document.getElementById('DocumentViewerContextToolbar');
    DocumentViewerContextToolbar.checked = (Toolbar.toLowerCase() === 'true');
    DocumentViewerContextToolbar.addEventListener('input', DocumentViewerContextInputHandlerToolbar);
}

// Shows the fields belonging to one item source and hides the other's. The choice is NOT stored on
// the object: the item source IS whether a folder is set, so there is only ever one source of truth
// and an object saved before this existed needs no new attribute to say "Items and Values".
function SelectionItemSourceShow(prefix, source) {
    let itemsRows = document.getElementById(prefix + 'ContextItemsRows');
    let documentRows = document.getElementById(prefix + 'ContextDocumentRows');

    if (itemsRows) { itemsRows.style.display = source === 'folder' ? 'none' : 'block'; }
    if (documentRows) { documentRows.style.display = source === 'folder' ? 'block' : 'none'; }
}

// The folder item source, shared by the DropDown and the ListBox panels. Every field is read with a
// plain getAttribute and an empty fallback and is NEVER written back here: an object saved before
// this item source existed must come out of the designer byte for byte as it went in.
function SelectionDocumentFieldsInit(prefix, applyHandlerFolder, applyHandlerPattern, applyHandlerLabel, applyHandlerStatus,
                                    applyHandlerFrom, applyHandlerTo) {

    let source = (ElementToBeDecorated.getAttribute("data-documentfolder") || "").trim() !== '' ? 'folder' : 'items';

    let sourceSelect = document.getElementById(prefix + 'ContextItemSource');
    sourceSelect.value = source;
    sourceSelect.addEventListener('change', prefix === 'ListBox'
        ? ListBoxContextInputHandlerItemSource
        : DropDownContextInputHandlerItemSource);

    SelectionItemSourceShow(prefix, source);

    var folderInput = document.getElementById(prefix + 'ContextDocumentFolder');
    folderInput.value = ElementToBeDecorated.getAttribute("data-documentfolder") ?? '';
    folderInput.addEventListener('input', applyHandlerFolder);
    folderInput.addEventListener('focusout', applyHandlerFolder);

    var patternInput = document.getElementById(prefix + 'ContextDocumentPattern');
    patternInput.value = ElementToBeDecorated.getAttribute("data-documentpattern") ?? '';
    patternInput.addEventListener('input', applyHandlerPattern);

    var fromInput = document.getElementById(prefix + 'ContextDocumentFrom');
    fromInput.value = ElementToBeDecorated.getAttribute("data-documentfrom") ?? '';
    fromInput.addEventListener('input', applyHandlerFrom);
    fromInput.addEventListener('focusout', applyHandlerFrom);

    var toInput = document.getElementById(prefix + 'ContextDocumentTo');
    toInput.value = ElementToBeDecorated.getAttribute("data-documentto") ?? '';
    toInput.addEventListener('input', applyHandlerTo);
    toInput.addEventListener('focusout', applyHandlerTo);

    var labelSelect = document.getElementById(prefix + 'ContextDocumentLabel');
    labelSelect.value = ElementToBeDecorated.getAttribute("data-documentlabel") || 'name';
    labelSelect.addEventListener('change', applyHandlerLabel);

    var statusInput = document.getElementById(prefix + 'ContextStatusVariable');
    statusInput.value = ElementToBeDecorated.getAttribute("data-statusvariable") ?? '';
    statusInput.addEventListener('input', applyHandlerStatus);
    statusInput.addEventListener('focusout', applyHandlerStatus);
}

function WidgetContextInit() {

    HTML = ElementToBeDecorated.getAttribute("data-html");

    var WidgetContextHTML = document.getElementById('WidgetContextHTML');
    WidgetContextHTML.value = HTML;
    WidgetContextHTML.addEventListener('input', WidgetContextInputHandlerHTML);

    if (!ElementToBeDecorated.getAttribute("data-clickable")) {
        ElementToBeDecorated.setAttribute("data-clickable", 'false');
    }

    var Clickable = ElementToBeDecorated.getAttribute("data-clickable");
    var WidgetContextClickable = document.getElementById('WidgetContextClickable');
    WidgetContextClickable.checked = (Clickable.toLowerCase() === 'true');

    WidgetContextClickable.addEventListener('input', WidgetContextInputHandlerClickable);

}

function DataTableContextInit() {

    let database;
    let sqlquery;
    let connstring;
    let refreshtime;
    let name;
    let header;

    let backgroundcolor;
    let headerbackgroundcolor;
    let textcolor;
    let headertextcolor;
    let gridlinecolor;
    let iconcolor

    //database
    if (ElementToBeDecorated.getAttribute("data-database")) {
        database = ElementToBeDecorated.getAttribute("data-database");
    }
    else {
        database = 'SQL Server';
        ElementToBeDecorated.setAttribute("data-database", database);
    }

    var datatableContextDatabase = document.getElementById('datatableContextDatabase');
    datatableContextDatabase.innerHTML = database;

    //sqlquery
    if (ElementToBeDecorated.getAttribute("data-sqlquery")) {
        sqlquery = ElementToBeDecorated.getAttribute("data-sqlquery");
    }
    else {
        sqlquery = '';
        ElementToBeDecorated.setAttribute("data-sqlquery", sqlquery);
    }

    sqlquery = ElementToBeDecorated.getAttribute("data-sqlquery");

    var datatableContextsqlquery = document.getElementById('datatableContextsqlquery');
    datatableContextsqlquery.value = sqlquery;
    datatableContextsqlquery.addEventListener('input', datatableContextsqlqueryInputHandler);

    //connstring
    if (ElementToBeDecorated.getAttribute("data-connstring")) {
        connstring = ElementToBeDecorated.getAttribute("data-connstring");
    }
    else {
        connstring = '';
        ElementToBeDecorated.setAttribute("data-connstring", connstring);
    }

    connstring = ElementToBeDecorated.getAttribute("data-connstring");

    var datatableContextconnstring = document.getElementById('datatableContextconnstring');
    datatableContextconnstring.value = connstring;
    datatableContextconnstring.addEventListener('input', datatableContextconnstringInputHandler);

    //header
    if (ElementToBeDecorated.getAttribute("data-header")) {
        header = ElementToBeDecorated.getAttribute("data-header");
    }
    else {
        header = '';
        ElementToBeDecorated.setAttribute("data-header", header);
    }

    header = ElementToBeDecorated.getAttribute("data-header");

    var datatableContextheader = document.getElementById('datatableContextheader');
    datatableContextheader.value = header;
    datatableContextheader.addEventListener('input', datatableContextheaderInputHandler);

    //refreshtime
    if (ElementToBeDecorated.getAttribute("data-refreshtime")) {
        refreshtime = ElementToBeDecorated.getAttribute("data-refreshtime");
    }
    else {
        refreshtime = '';
        ElementToBeDecorated.setAttribute("data-refreshtime", refreshtime);
    }

    refreshtime = ElementToBeDecorated.getAttribute("data-refreshtime");

    var datatableContextrefreshtime = document.getElementById('datatableContextrefreshtime');
    datatableContextrefreshtime.value = refreshtime;
    datatableContextrefreshtime.addEventListener('input', datatableContextrefreshtimeInputHandler);

    //name
    if (ElementToBeDecorated.getAttribute("data-datatablename")) {
        name = ElementToBeDecorated.getAttribute("data-datatablename");
    }
    else {
        name = '';
        ElementToBeDecorated.setAttribute("data-datatablename", name);
    }

    name = ElementToBeDecorated.getAttribute("data-datatablename");

    var datatableContextname = document.getElementById('datatableContextname');
    datatableContextname.value = name;
    datatableContextname.addEventListener('input', datatableContextnameInputHandler);

    //
    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#datatablepickerbackgroundcolor").colorPick({
        'initialColor': backgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));

                //var datatableTable = ElementToBeDecoratedX.getElementsByClassName("DataTableTbody")[0];
                //datatableTable.style.backgroundColor = this.color;

            }
        }
    });

    //
    headerbackgroundcolor = ElementToBeDecorated.getAttribute("data-headerbackgroundcolor");

    $("#datatablepickerheaderbackgroundcolor").colorPick({
        'initialColor': headerbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-headerbackgroundcolor', this.element.attr('title'));

                //var dataTableThead = ElementToBeDecoratedX.getElementsByClassName("DataTableThead")[0];

                ////console.log(dataTableThead);

                //dataTableThead.style.backgroundColor = this.color;
            }
        }
    });

    //
    selectedbackgroundcolor = ElementToBeDecorated.getAttribute("data-selectedbackgroundcolor");

    $("#datatablepickerselectedbackgroundcolor").colorPick({
        'initialColor': selectedbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-selectedbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    //
    textcolor = ElementToBeDecorated.getAttribute("data-textcolor");

    $("#datatablepickertextcolor").colorPick({
        'initialColor': textcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-textcolor', this.element.attr('title'));

                //var datatableTbody = ElementToBeDecoratedX.getElementsByClassName("DataTableTbody")[0];
                //datatableTbody.style.color = this.color;

            }
        }
    });

    //
    headertextcolor = ElementToBeDecorated.getAttribute("data-headertextcolor");

    $("#datatablepickerheadertextcolor").colorPick({
        'initialColor': headertextcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-headertextcolor', this.element.attr('title'));

                //var datatableThead = ElementToBeDecoratedX.getElementsByClassName("DataTableThead")[0];
                //datatableThead.style.color = this.color;
            }
        }
    });

    //
    selectedtextcolor = ElementToBeDecorated.getAttribute("data-selectedtextcolor");

    $("#datatablepickerselectedtextcolor").colorPick({
        'initialColor': selectedtextcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-selectedtextcolor', this.element.attr('title'));
            }
        }
    });

    //
    gridlinecolor = ElementToBeDecorated.getAttribute("data-gridlinecolor");

    $("#datatablepickergridlinecolor").colorPick({
        'initialColor': gridlinecolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-gridlinecolor', this.element.attr('title'));

                /*var datatableTable = ElementToBeDecoratedX.getElementsByClassName("datatableTable")[0];*/
                ElementToBeDecoratedX.style.borderColor = GetObjectColor(this.element.attr('title'));

                var datatableThead = ElementToBeDecoratedX.getElementsByClassName("DataTableThead")[0];
                datatableThead.style.borderColor = GetObjectColor(this.element.attr('title'));

                var datatableTbody = ElementToBeDecoratedX.getElementsByClassName("DataTableTbody")[0];
                datatableTbody.style.borderColor = GetObjectColor(this.element.attr('title'));

            }
        }
    });

    //
    iconcolor = ElementToBeDecorated.getAttribute("data-iconcolor");

    $("#datatablepickericoncolor").colorPick({
        'initialColor': iconcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-iconcolor', this.element.attr('title'));

                var datatableTable = ElementToBeDecoratedX.getElementsByClassName("datatableTable")[0];
                datatableTable.style.fill = GetObjectColor(this.element.attr('title'));
            }
        }
    });
}

function SliderContextInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    Variable = ElementToBeDecorated.getAttribute("data-variable");

    var SliderContextVariable = document.getElementById('SliderContextVariable');
    SliderContextVariable.value = Variable;
    SliderContextVariable.addEventListener('input', SliderContextInputHandlerVariable);

    MinValue = ElementToBeDecorated.getAttribute("data-minvalue");

    var SliderContextMinValue = document.getElementById('SliderContextMinValue');
    SliderContextMinValue.value = MinValue;
    SliderContextMinValue.addEventListener('input', SliderContextInputHandlerMinValue);

    MaxValue = ElementToBeDecorated.getAttribute("data-maxvalue");

    var SliderContextMaxValue = document.getElementById('SliderContextMaxValue');
    SliderContextMaxValue.value = MaxValue;
    SliderContextMaxValue.addEventListener('input', SliderContextInputHandlerMaxValue);

    ValueResolution = ElementToBeDecorated.getAttribute("data-valueresolution");

    var SliderContextValueResolution = document.getElementById('SliderContextValueResolution');
    SliderContextValueResolution.value = ValueResolution;
    SliderContextValueResolution.addEventListener('input', SliderContextInputHandlerValueResolution);

    backgroundcolor = ElementToBeDecorated.getAttribute("data-backgroundcolor");

    $("#sliderbackgroundcolorpicker").colorPick({
        'initialColor': backgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundcolor', this.element.attr('title'));

                slidertoinit(ElementToBeDecoratedX);
            }
        }
    });

    trackcolor = ElementToBeDecorated.getAttribute("data-trackcolor");

    $("#slidertrackcolorpicker").colorPick({
        'initialColor': trackcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-trackcolor', this.element.attr('title'));

                slidertoinit(ElementToBeDecoratedX);
            }
        }
    });

    TrackBorderWidth = ElementToBeDecorated.getAttribute("data-trackborderwidth");

    var SliderContextTrackBorderWidth = document.getElementById('SliderContextTrackBorderWidth');
    SliderContextTrackBorderWidth.value = TrackBorderWidth;
    SliderContextTrackBorderWidth.addEventListener('input', SliderContextTrackBorderWidthInputHandler);

    TrackBorderRadius = ElementToBeDecorated.getAttribute("data-trackborderradius");

    var SliderContextTrackBorderRadius = document.getElementById('SliderContextTrackBorderRadius');
    SliderContextTrackBorderRadius.value = TrackBorderRadius;
    SliderContextTrackBorderRadius.addEventListener('input', SliderContextTrackBorderRadiusInputHandler);

    trackbordercolor = ElementToBeDecorated.getAttribute("data-trackbordercolor");

    $("#slidertrackbordercolorpicker").colorPick({
        'initialColor': trackbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-trackbordercolor', this.element.attr('title'));

                slidertoinit(ElementToBeDecoratedX);
            }
        }
    });

    ThumbWidth = ElementToBeDecorated.getAttribute("data-thumbwidth");

    var SliderContextThumbWidth = document.getElementById('SliderContextThumbWidth');
    SliderContextThumbWidth.value = ThumbWidth;
    SliderContextThumbWidth.addEventListener('input', SliderContextInputHandlerThumbWidth);

    ThumbHeight = ElementToBeDecorated.getAttribute("data-thumbheight");

    var SliderContextThumbHeight = document.getElementById('SliderContextThumbHeight');
    SliderContextThumbHeight.value = ThumbHeight;
    SliderContextThumbHeight.addEventListener('input', SliderContextInputHandlerThumbHeight);

    thumbcolor = ElementToBeDecorated.getAttribute("data-thumbcolor");

    $("#sliderthumbcolorpicker").colorPick({
        'initialColor': thumbcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-thumbcolor', this.element.attr('title'));

                slidertoinit(ElementToBeDecoratedX);
            }
        }
    });

    ThumbBorderWidth = ElementToBeDecorated.getAttribute("data-thumbborderwidth");

    var SliderContextThumbBorderWidth = document.getElementById('SliderContextThumbBorderWidth');
    SliderContextThumbBorderWidth.value = ThumbBorderWidth;
    SliderContextThumbBorderWidth.addEventListener('input', SliderContextThumbBorderWidthInputHandler);

    ThumbBorderRadius = ElementToBeDecorated.getAttribute("data-thumbborderradius");

    var SliderContextThumbBorderRadius = document.getElementById('SliderContextThumbBorderRadius');
    SliderContextThumbBorderRadius.value = ThumbBorderRadius;
    SliderContextThumbBorderRadius.addEventListener('input', SliderContextThumbBorderRadiusInputHandler);

    thumbbordercolor = ElementToBeDecorated.getAttribute("data-thumbbordercolor");

    $("#sliderthumbbordercolorpicker").colorPick({
        'initialColor': thumbbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-thumbbordercolor', this.element.attr('title'));
                slidertoinit(ElementToBeDecoratedX);
            }
        }
    });

    textcolor = ElementToBeDecorated.getAttribute("data-textcolor");

    $("#slidertextcolorpicker").colorPick({
        'initialColor': textcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-textcolor', this.element.attr('title'));
                slidertoinit(ElementToBeDecoratedX);
            }
        }
    });

    FontFamily = ElementToBeDecorated.getAttribute("data-fontfamily");

    var SliderContextFontFamily = document.getElementById('SliderContextFontFamily');
    SliderContextFontFamily.value = FontFamily;
    SliderContextFontFamily.addEventListener('input', SliderContextInputHandlerFontFamily);

    FontSize = ElementToBeDecorated.getAttribute("data-fontsize");

    var SliderContextFontSize = document.getElementById('SliderContextFontSize');
    SliderContextFontSize.value = FontSize;
    SliderContextFontSize.addEventListener('input', SliderContextInputHandlerFontSize);

    FontWeight = ElementToBeDecorated.getAttribute("data-fontweight");

    var SliderContextFontWeight = document.getElementById('SliderContextFontWeight');
    SliderContextFontWeight.value = FontWeight;
    SliderContextFontWeight.addEventListener('input', SliderContextInputHandlerFontWeight);

    FeedbackMarginTop = ElementToBeDecorated.getAttribute("data-feedbackmargintop");

    var SliderContextFeedbackMarginTop = document.getElementById('SliderContextFeedbackMarginTop');
    SliderContextFeedbackMarginTop.value = FeedbackMarginTop;
    SliderContextFeedbackMarginTop.addEventListener('input', SliderContextInputHandlerFeedbackMarginTop);

    WriteTimeoutTime = ElementToBeDecorated.getAttribute("data-writetimeouttime");

    var SliderContextWriteTimeoutTime = document.getElementById('SliderContextWriteTimeoutTime');
    SliderContextWriteTimeoutTime.value = WriteTimeoutTime;
    SliderContextWriteTimeoutTime.addEventListener('input', SliderContextInputHandlerWriteTimeoutTime);

    TextHidden = ElementToBeDecorated.getAttribute("data-texthidden");
    var SliderContextTextHidden = document.getElementById('SliderContextTextHidden');
    SliderContextTextHidden.checked = (TextHidden.toLowerCase() === 'true');
    SliderContextTextHidden.addEventListener('input', SliderContextInputHandlerTextHidden);
}

function DonutContextInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    setupContext("DonutContext", "RadiusWidth", GenericInputHandler, initDonut);
    setupContext("DonutContext", "AnimationSpeed", GenericInputHandler, initDonut);
    setupContext("DonutContext", "JsonVariable", GenericInputHandler, initDonut);
    setupContext("DonutContext", "LabelFontFamily", GenericInputHandler, initDonut);
    setupContext("DonutContext", "LabelFontSize", GenericInputHandler, initDonut);
    setupContext("DonutContext", "LabelFontWeight", GenericInputHandler, initDonut);
    setupContext("DonutContext", "LabelTextMargin", GenericInputHandler, initDonut);
    setupContextCheckbox("DonutContext", "LabelTextHidden", GenericInputCheckboxHandler, initDonut);
    setupContext("DonutContext", "ValueFontFamily", GenericInputHandler, initDonut);
    setupContext("DonutContext", "ValueFontSize", GenericInputHandler, initDonut);
    setupContext("DonutContext", "ValueFontWeight", GenericInputHandler, initDonut);
    setupContext("DonutContext", "ValueTextMargin", GenericInputHandler, initDonut);
    setupContext("DonutContext", "ValueUnit", GenericInputHandler, initDonut);
    setupContextCheckbox("DonutContext", "ValueTextHidden", GenericInputCheckboxHandler, initDonut);
 
    let jsonDynamicData = getinitAttribute(ElementToBeDecorated, "data-jsondynamicdata", "");

    if (jsonDynamicData && jsonDynamicData !== "") {
        loadDonutContextData(JSON.parse(jsonDynamicData));
    }
}
function BarGraphContextInit()
{

    setupContext("BarGraphContext", "AnimationSpeed", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "LegendPosition", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "Orientation", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "ValueUnit", GenericInputHandler, initBarGraph);
    setupContextCheckbox("BarGraphContext", "ShowGrid", GenericInputCheckboxHandler, initBarGraph);
    setupContext("BarGraphContext", "JsonVariable", GenericInputHandler, initBarGraph);

    function initBarGraphColorPicker(className, dataAttr, defaultColor)
    {
        const el = document.querySelector("#BarGraphContext .picker." + className);
        if (!el || typeof $ === "undefined" || !$.fn.colorPick)
        {
            console.error("Bar graph color picker element or jQuery colorPick not found; selector '#BarGraphContext .picker." + className + "' or dependency missing.");
            return;
        }
        const initialColor = getinitAttribute(ElementToBeDecorated, dataAttr, defaultColor);
        $(el).colorPick({
            "initialColor": initialColor,
            "paletteLabel": "Choose Color",
            "palette": palettecolors,
            "init": function ()
            {
                this.element.css({ "backgroundColor": GetObjectColor(this.element.attr("title")), "color": GetObjectColor(this.element.attr("title")) });
            },
            "onColorSelected": function ()
            {
                this.element.css({ "backgroundColor": GetObjectColor(this.element.attr("title")), "color": GetObjectColor(this.element.attr("title")) });
                const color = this.element.attr("title") || defaultColor;
                for (var i = ElementsToBeDecorated.length; i >= 1; i--)
                {
                    const target = getObjDom(ElementsToBeDecorated[i - 1]);
                    if (target) target.setAttribute(dataAttr, color);
                }
                initBarGraph(ElementToBeDecorated);
            }
        });
    }
    initBarGraphColorPicker("BarGraphContextBackgroundColorPicker", "data-backgroundcolor", "#f5f5f5");
    initBarGraphColorPicker("BarGraphContextGridColorPicker", "data-gridcolor", "#e0e0e0");
    initBarGraphColorPicker("BarGraphContextZeroLineColorPicker", "data-zerolinecolor", "#666666");
    initBarGraphColorPicker("BarGraphContextAxisLineColorPicker", "data-axislinecolor", "#333333");
    initBarGraphColorPicker("BarGraphContextTextColorPicker", "data-textcolor", "#333333");
    initBarGraphColorPicker("BarGraphContextTooltipBackgroundPicker", "data-tooltipbackground", "rgba(0,0,0,0.8)");
    initBarGraphColorPicker("BarGraphContextTooltipTextColorPicker", "data-tooltiptextcolor", "#ffffff");
    setupContext("BarGraphContext", "LegendFontFamily", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "LegendFontSize", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "LegendFontWeight", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "CategoryAxisFontFamily", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "CategoryAxisFontSize", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "CategoryAxisFontWeight", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "ValueAxisFontFamily", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "ValueAxisFontSize", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "ValueAxisFontWeight", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "CategoryAxisLabelRotation", GenericInputHandler, initBarGraph);
    setupContext("BarGraphContext", "ValueAxisLabelRotation", GenericInputHandler, initBarGraph);

    let jsonDynamicData = getinitAttribute(ElementToBeDecorated, "data-jsondynamicdata", "");

    if (jsonDynamicData && jsonDynamicData !== "")
    {
        loadBarGraphContextData(JSON.parse(jsonDynamicData));
    }
}

function CheckBoxContextInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    let oncolor;
    let onbackgroundcolor;
    let onbordercolor;
    let offbackgroundcolor;
    let offbordercolor;
    let variable;
    let borderradius;
    let borderwidth;

    oncolor = ElementToBeDecorated.getAttribute("data-oncolor");

    $("#pickercheckboxcoloron").colorPick({
        'initialColor': oncolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-oncolor', this.element.attr('title'));

            }

        }
    });

    onbackgroundcolor = ElementToBeDecorated.getAttribute("data-onbackgroundcolor");

    $("#pickercheckboxbackgroundcoloron").colorPick({
        'initialColor': onbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-onbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    onbordercolor = ElementToBeDecorated.getAttribute("data-onbordercolor");

    $("#pickercheckboxbordercoloron").colorPick({
        'initialColor': onbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-onbordercolor', this.element.attr('title'));
            }
        }
    });

    offbackgroundcolor = ElementToBeDecorated.getAttribute("data-offbackgroundcolor");

    $("#pickercheckboxbackgroundcoloroff").colorPick({
        'initialColor': offbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    offbordercolor = ElementToBeDecorated.getAttribute("data-offbordercolor");

    $("#pickercheckboxbordercoloroff").colorPick({
        'initialColor': offbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offbordercolor', this.element.attr('title'));
            }
        }
    });

    variable = ElementToBeDecorated.getAttribute("data-variable");

    var CheckBoxContextVariable = document.getElementById('CheckBoxContextVariable');
    CheckBoxContextVariable.value = variable;
    CheckBoxContextVariable.addEventListener('input', CheckBoxContextInputHandlervariable);

    //CheckBoxContextborderradius
    if (ElementToBeDecorated.getAttribute("data-borderradius")) {
        borderradius = ElementToBeDecorated.style.borderRadius;
    }
    else {
        borderradius = compStyles.getPropertyValue("border-radius");
    }

    var CheckBoxContextborderradius = document.getElementById('CheckBoxContextborderradius');
    CheckBoxContextborderradius.value = borderradius;
    CheckBoxContextborderradius.addEventListener('input', CheckBoxContextborderradiusInputHandler);

    //CheckBoxContextborderwidth
    if (ElementToBeDecorated.getAttribute("data-borderwidth")) {
        borderwidth = ElementToBeDecorated.style.borderWidth;
    }
    else {
        borderwidth = compStyles.getPropertyValue("border-width");
    }

    var CheckBoxContextborderwidth = document.getElementById('CheckBoxContextborderwidth');
    CheckBoxContextborderwidth.value = borderwidth;
    CheckBoxContextborderwidth.addEventListener('input', CheckBoxContextborderwidthInputHandler);
}

function ToggleContextInit() {

    let ontext;
    let offtext;
    let oncolor;
    let offcolor;
    let onbackgroundcolor;
    let onbordercolor;
    let offbackgroundcolor;
    let offbordercolor;
    let variable;

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    oncolor = ElementToBeDecorated.getAttribute("data-oncolor");

    $("#pickertogglecoloron").colorPick({
        'initialColor': oncolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-oncolor', this.element.attr('title'));

            }

        }
    });



    offcolor = ElementToBeDecorated.getAttribute("data-offcolor");

    $("#pickertogglecoloroff").colorPick({
        'initialColor': offcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offcolor', this.element.attr('title'));

            }
        }
    });

    onbackgroundcolor = ElementToBeDecorated.getAttribute("data-onbackgroundcolor");

    $("#pickertogglebackgroundcoloron").colorPick({
        'initialColor': onbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-onbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    onbordercolor = ElementToBeDecorated.getAttribute("data-onbordercolor");

    $("#pickertogglebordercoloron").colorPick({
        'initialColor': onbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-onbordercolor', this.element.attr('title'));
            }
        }
    });

    offbackgroundcolor = ElementToBeDecorated.getAttribute("data-offbackgroundcolor");

    $("#pickertogglebackgroundcoloroff").colorPick({
        'initialColor': offbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offbackgroundcolor', this.element.attr('title'));
            }
        }
    });

    offbordercolor = ElementToBeDecorated.getAttribute("data-offbordercolor");

    $("#pickertogglebordercoloroff").colorPick({
        'initialColor': offbordercolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-offbordercolor', this.element.attr('title'));
            }
        }
    });

    ontext = ElementToBeDecorated.getAttribute("data-ontext");

    var ToggleContextOnText = document.getElementById('ToggleContextOnText');
    ToggleContextOnText.value = ontext;
    ToggleContextOnText.addEventListener('input', ToggleContextInputHandlerontext);

    offtext = ElementToBeDecorated.getAttribute("data-offtext");

    var ToggleContextOffText = document.getElementById('ToggleContextOffText');
    ToggleContextOffText.value = offtext;
    ToggleContextOffText.addEventListener('input', ToggleContextInputHandlerofftext);

    variable = ElementToBeDecorated.getAttribute("data-variable");

    var ToggleContextVariable = document.getElementById('ToggleContextVariable');
    ToggleContextVariable.value = variable;
    ToggleContextVariable.addEventListener('input', ToggleContextInputHandlervariable);

    //FontFamily
    if (element.getAttribute("data-fontfamily")) {
        FontFamily = element.getAttribute("data-fontfamily");
    }
    else {
        FontFamily = compStyles.getPropertyValue("font-family");
        element.setAttribute("data-fontfamily", FontFamily);
    }

    var ToggleContextFontFamily = document.getElementById('ToggleContextFontFamily');
    ToggleContextFontFamily.value = FontFamily;
    ToggleContextFontFamily.addEventListener('input', ToggleContextInputHandlerFontFamily);

    //FontSize
    if (element.getAttribute("data-fontsize")) {
        FontSize = element.getAttribute("data-fontsize");
    }
    else {
        FontSize = compStyles.getPropertyValue("font-size");
        element.setAttribute("data-fontsize", FontSize);
    }

    var ToggleContextFontSize = document.getElementById('ToggleContextFontSize');
    ToggleContextFontSize.value = FontSize;
    ToggleContextFontSize.addEventListener('input', ToggleContextInputHandlerFontSize);

    //FontWeight
    if (element.getAttribute("data-fontweight")) {
        FontWeight = element.getAttribute("data-fontweight");
    }
    else {
        FontWeight = compStyles.getPropertyValue("font-weight");
        element.setAttribute("data-fontweight", FontWeight);
    }

    var ToggleContextFontWeight = document.getElementById('ToggleContextFontWeight');
    ToggleContextFontWeight.value = FontWeight;
    ToggleContextFontWeight.addEventListener('input', ToggleContextInputHandlerFontWeight);

    //FontWeight
    if (element.getAttribute("data-fontweight")) {
        FontWeight = element.getAttribute("data-fontweight");
    }
    else {
        FontWeight = compStyles.getPropertyValue("font-weight");
        element.setAttribute("data-fontweight", FontWeight);
    }

    var ToggleContextFontWeight = document.getElementById('ToggleContextFontWeight');
    ToggleContextFontWeight.value = FontWeight;
    ToggleContextFontWeight.addEventListener('input', ToggleContextInputHandlerFontWeight);

    var ToggleTextLeft = ElementToBeDecorated.getElementsByClassName("ToggleTextLeft")[0];
    var ToggleTextRight = ElementToBeDecorated.getElementsByClassName("ToggleTextRight")[0];

    //PaddingLeftText
    if (ElementToBeDecorated.getAttribute("data-paddinglefttext")) {
        PaddingLeftText = ElementToBeDecorated.getAttribute("data-paddinglefttext");
    }
    else {
        let compStyles = window.getComputedStyle(ToggleTextLeft);

        PaddingLeftText = compStyles.getPropertyValue("padding-right");
        ElementToBeDecorated.setAttribute("data-paddinglefttext", PaddingLeftText);
    }

    var ToggleContextPaddingLeftText = document.getElementById('ToggleContextPaddingLeftText');
    ToggleContextPaddingLeftText.value = PaddingLeftText;
    ToggleContextPaddingLeftText.addEventListener('input', ToggleContextInputHandlerPaddingLeftText);

    //PaddingRightText
    if (ElementToBeDecorated.getAttribute("data-paddingrighttext")) {
        PaddingRightText = ElementToBeDecorated.getAttribute("data-paddingrighttext");
    }
    else {
        let compStyles = window.getComputedStyle(ToggleTextRight);

        PaddingRightText = compStyles.getPropertyValue("padding-left");
        ElementToBeDecorated.setAttribute("data-paddingrighttext", PaddingRightText);
    }

    var ToggleContextPaddingRightText = document.getElementById('ToggleContextPaddingRightText');
    ToggleContextPaddingRightText.value = PaddingRightText;
    ToggleContextPaddingRightText.addEventListener('input', ToggleContextInputHandlerPaddingRightText);


}

function RadioButtonContextInit() {

}

function DropDownContextInit() {

    initparametersdropdown(ElementToBeDecorated);

    Variable = ElementToBeDecorated.getAttribute("data-variable");

    var DropDownContextVariable = document.getElementById('DropDownContextVariable');
    DropDownContextVariable.value = Variable;
    DropDownContextVariable.addEventListener('input', DropDownContextInputHandlerVariable);

    Values = ElementToBeDecorated.getAttribute("data-values");

    var DropDownContextValues = document.getElementById('DropDownContextValues');
    DropDownContextValues.value = Values;
    DropDownContextValues.addEventListener('input', DropDownContextInputHandlerValues);

    items = ElementToBeDecorated.getAttribute("data-items");

    var DropDownContextitems = document.getElementById('DropDownContextitems');
    DropDownContextitems.value = items;
    DropDownContextitems.addEventListener('input', DropDownContextInputHandleritems);

    listheight = ElementToBeDecorated.getAttribute("data-listheight");

    SelectionDocumentFieldsInit('DropDown',
        DropDownContextInputHandlerDocumentFolder,
        DropDownContextInputHandlerDocumentPattern,
        DropDownContextInputHandlerDocumentLabel,
        DropDownContextInputHandlerStatusVariable,
        DropDownContextInputHandlerDocumentFrom,
        DropDownContextInputHandlerDocumentTo);

    var DropDownContextListHeight = document.getElementById('DropDownContextListHeight');
    DropDownContextListHeight.value = listheight;
    DropDownContextListHeight.addEventListener('input', DropDownContextInputHandlerListHeight);

    colorboxpicker = ElementToBeDecorated.getAttribute("data-colorboxpicker");

    $("#dropdowncolorboxpicker").colorPick({
        'initialColor': colorboxpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-colorboxpicker', this.element.attr('title'));

                ElementToBeDecoratedX.style.color = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    colorlistpicker = ElementToBeDecorated.getAttribute("data-colorlistpicker");

    $("#dropdowncolorlistpicker").colorPick({
        'initialColor': colorlistpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-colorlistpicker', this.element.attr('title'));

                //color set dynamically on drop down
            }
        }
    });

    backgroundboxcolorpicker = ElementToBeDecorated.getAttribute("data-backgroundboxcolorpicker");

    $("#dropdownbackgroundboxcolorpicker").colorPick({
        'initialColor': backgroundboxcolorpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundboxcolorpicker', this.element.attr('title'));

                ElementToBeDecoratedX.style.backgroundColor = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    backgroundlistcolorpicker = ElementToBeDecorated.getAttribute("data-backgroundlistcolorpicker");

    $("#dropdownbackgroundlistcolorpicker").colorPick({
        'initialColor': backgroundlistcolorpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-backgroundlistcolorpicker', this.element.attr('title'));

                var ul = ElementToBeDecoratedX.parentElement.getElementsByTagName("ul")[0];
                ul.style.backgroundColor = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    borderboxcolorpicker = ElementToBeDecorated.getAttribute("data-borderboxcolorpicker");

    $("#dropdownborderboxcolorpicker").colorPick({
        'initialColor': borderboxcolorpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-borderboxcolorpicker', this.element.attr('title'));

                ElementToBeDecoratedX.style.borderColor = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    borderlistcolorpicker = ElementToBeDecorated.getAttribute("data-borderlistcolorpicker");

    $("#dropdownborderlistcolorpicker").colorPick({
        'initialColor': borderlistcolorpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-borderlistcolorpicker', this.element.attr('title'));

                var ul = ElementToBeDecoratedX.parentElement.getElementsByTagName("ul")[0];
                ul.style.borderColor = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    scrollbarcolor = ElementToBeDecorated.getAttribute("data-scrollbarcolor");

    $("#dropdownscrollbarcolorpicker").colorPick({
        'initialColor': scrollbarcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-scrollbarcolor', this.element.attr('title'));

                var ul = ElementToBeDecoratedX.parentElement.getElementsByTagName("ul")[0];
                ul.style.setProperty('--dropdown-scrollbar-color', GetObjectColor(this.element.attr('title')));
            }
        }
    });

    scrollbartrackcolor = ElementToBeDecorated.getAttribute("data-scrollbartrackcolor");

    $("#dropdownscrollbartrackcolorpicker").colorPick({
        'initialColor': scrollbartrackcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });

            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                ElementToBeDecoratedX = getObjDom(ElementsToBeDecorated[i - 1]);
                ElementToBeDecoratedX.setAttribute('data-scrollbartrackcolor', this.element.attr('title'));

                var ul = ElementToBeDecoratedX.parentElement.getElementsByTagName("ul")[0];
                ul.style.setProperty('--dropdown-scrollbar-track-color', GetObjectColor(this.element.attr('title')));
            }
        }
    });

}

function ListBoxContextInit() {

    initparameterslistbox(ElementToBeDecorated);

    var Variable = ElementToBeDecorated.getAttribute("data-variable");
    var ListBoxContextVariable = document.getElementById('ListBoxContextVariable');
    ListBoxContextVariable.value = Variable;
    ListBoxContextVariable.addEventListener('input', ListBoxContextInputHandlerVariable);

    var Values = ElementToBeDecorated.getAttribute("data-values");
    var ListBoxContextValues = document.getElementById('ListBoxContextValues');
    ListBoxContextValues.value = Values;
    ListBoxContextValues.addEventListener('input', ListBoxContextInputHandlerValues);

    var items = ElementToBeDecorated.getAttribute("data-items");
    var ListBoxContextitems = document.getElementById('ListBoxContextitems');
    ListBoxContextitems.value = items;
    ListBoxContextitems.addEventListener('input', ListBoxContextInputHandleritems);

    SelectionDocumentFieldsInit('ListBox',
        ListBoxContextInputHandlerDocumentFolder,
        ListBoxContextInputHandlerDocumentPattern,
        ListBoxContextInputHandlerDocumentLabel,
        ListBoxContextInputHandlerStatusVariable,
        ListBoxContextInputHandlerDocumentFrom,
        ListBoxContextInputHandlerDocumentTo);

    var colorpicker = ElementToBeDecorated.getAttribute("data-colorpicker");
    $("#listboxcolorpicker").colorPick({
        'initialColor': colorpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                var el = getObjDom(ElementsToBeDecorated[i - 1]);
                el.setAttribute('data-colorpicker', this.element.attr('title'));
                el.style.color = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    var backgroundcolorpicker = ElementToBeDecorated.getAttribute("data-backgroundcolorpicker");
    $("#listboxbackgroundcolorpicker").colorPick({
        'initialColor': backgroundcolorpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                var el = getObjDom(ElementsToBeDecorated[i - 1]);
                el.setAttribute('data-backgroundcolorpicker', this.element.attr('title'));
                el.style.backgroundColor = GetObjectColor(this.element.attr('title'));
            }
        }
    });

    var bordercolorpicker = ElementToBeDecorated.getAttribute("data-bordercolorpicker");
    $("#listboxbordercolorpicker").colorPick({
        'initialColor': bordercolorpicker,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                var el = getObjDom(ElementsToBeDecorated[i - 1]);
                el.setAttribute('data-bordercolorpicker', this.element.attr('title'));
                el.style.border = '1px solid ' + GetObjectColor(this.element.attr('title'));
            }
        }
    });

    var scrollbarcolor = ElementToBeDecorated.getAttribute("data-scrollbarcolor");
    $("#listboxscrollbarcolorpicker").colorPick({
        'initialColor': scrollbarcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                var el = getObjDom(ElementsToBeDecorated[i - 1]);
                el.setAttribute('data-scrollbarcolor', this.element.attr('title'));
                el.style.setProperty('--listbox-scrollbar-color', GetObjectColor(this.element.attr('title')));
            }
        }
    });

    var scrollbartrackcolor = ElementToBeDecorated.getAttribute("data-scrollbartrackcolor");
    $("#listboxscrollbartrackcolorpicker").colorPick({
        'initialColor': scrollbartrackcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                var el = getObjDom(ElementsToBeDecorated[i - 1]);
                el.setAttribute('data-scrollbartrackcolor', this.element.attr('title'));
                el.style.setProperty('--listbox-scrollbar-track-color', GetObjectColor(this.element.attr('title')));
            }
        }
    });

    var selectedbackgroundcolor = ElementToBeDecorated.getAttribute("data-selectedbackgroundcolor");
    $("#listboxselectedbackgroundcolorpicker").colorPick({
        'initialColor': selectedbackgroundcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                var el = getObjDom(ElementsToBeDecorated[i - 1]);
                el.setAttribute('data-selectedbackgroundcolor', this.element.attr('title'));
                el.style.setProperty('--listbox-selected-background-color', GetObjectColor(this.element.attr('title')));
            }
        }
    });

    var selectedtextcolor = ElementToBeDecorated.getAttribute("data-selectedtextcolor");
    $("#listboxselectedtextcolorpicker").colorPick({
        'initialColor': selectedtextcolor,
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                var el = getObjDom(ElementsToBeDecorated[i - 1]);
                el.setAttribute('data-selectedtextcolor', this.element.attr('title'));
                el.style.setProperty('--listbox-selected-text-color', GetObjectColor(this.element.attr('title')));
            }
        }
    });

    var multiselect = ElementToBeDecorated.getAttribute("data-multiselect") === "true";
    var ListBoxContextMultiSelect = document.getElementById('ListBoxContextMultiSelect');
    ListBoxContextMultiSelect.checked = multiselect;
    ListBoxContextMultiSelect.addEventListener('input', ListBoxContextMultiSelectInputHandler);

}

function PolygonContextInit() {

    //background
    if (ElementToBeDecorated.parentElement.hasAttribute("data-isbackground")) {
        background = 'true';
    }
    else {
        background = 'false';
    }

    var PolygonContextisbackground = document.getElementById('PolygonContextisbackground');
    PolygonContextisbackground.checked = (background.toLowerCase() === 'true');
    PolygonContextisbackground.addEventListener('input', PolygonContextisbackgroundInputHandler);
}

function PolylineContextInit() {

    //PolylineContextstrokewidth
    //console.log(ElementToBeDecorated);
    
    let strokewidth = ElementToBeDecorated.style.strokeWidth;
    var PolylineContextstrokewidth = document.getElementById('PolylineContextstrokewidth');
    //console.log(PolylineContextstrokewidth);
    PolylineContextstrokewidth.value = strokewidth;
    PolylineContextstrokewidth.addEventListener('input', PolylineContextstrokewidthInputHandler);

    //PolylineContextlinestyle
    let linestyle;

    if (ElementToBeDecorated.getAttribute("data-linestyle")) {
        linestyle = ElementToBeDecorated.getAttribute("data-linestyle");
    }
    else {
        linestyle = "Solid";
    }

    var PolylineContextlinestyle = document.getElementById('PolylineContextlinestyle');
    PolylineContextlinestyle.innerHTML = linestyle;

    //PolylineContextlinecap
    let linecap;

    if (ElementToBeDecorated.getAttribute("data-linecap")) {
        linecap = ElementToBeDecorated.getAttribute("data-linecap");
    }
    else {
        linecap = "Butt";
    }

    var PolylineContextlinecap = document.getElementById('PolylineContextlinecap');
    PolylineContextlinecap.innerHTML = linecap;

    //PolylineContextarrowstart / PolylineContextarrowend
    var PolylineContextarrowstart = document.getElementById('PolylineContextarrowstart');
    PolylineContextarrowstart.innerHTML = PolylineArrowLabel(ElementToBeDecorated.getAttribute("data-arrowstart"));

    var PolylineContextarrowend = document.getElementById('PolylineContextarrowend');
    PolylineContextarrowend.innerHTML = PolylineArrowLabel(ElementToBeDecorated.getAttribute("data-arrowend"));

    //PolylineContextarrowsize
    var PolylineContextarrowsize = document.getElementById('PolylineContextarrowsize');
    PolylineContextarrowsize.value = ElementToBeDecorated.getAttribute("data-arrowsize") || "";
    PolylineContextarrowsize.addEventListener('input', PolylineContextarrowsizeInputHandler);

    //PolylineContextbridge
    var PolylineContextbridge = document.getElementById('PolylineContextbridge');
    PolylineContextbridge.checked = (ElementToBeDecorated.getAttribute("data-bridge") === "true");
    PolylineContextbridge.addEventListener('input', PolylineContextbridgeInputHandler);

    //background
    if (ElementToBeDecorated.parentElement.hasAttribute("data-isbackground")) {
        background = 'true';
    }
    else {
        background = 'false';
    }

/*    console.log(background);*/
    var PolylineContextisbackground = document.getElementById('PolylineContextisbackground');
    PolylineContextisbackground.checked = (background.toLowerCase() === 'true');
    PolylineContextisbackground.addEventListener('input', PolylineContextisbackgroundInputHandler);
}


// The picked value is stored TWICE on the page: the resolved color in the ordinary style property,
// so the designer keeps seeing what it will look like, and the raw value - which is a Color Library
// NAME when one was picked from the library - in a CSS custom property beside it.
//
// The custom property is what makes the page follow a theme. It rides inside the same style string
// that is already persisted into Pages.Style, so no column, DTO field or export change is involved,
// and ApplyPageObjectColors re-resolves it on every runtime cycle. Pages saved before this simply
// have no custom property and keep their stored hex.
function SetPageObjectColor(property, customProperty, rawValue) {

    if (!ElementToBeDecorated) { return; }

    ElementToBeDecorated.style[property] = GetObjectColor(rawValue);

    if (rawValue) {
        ElementToBeDecorated.style.setProperty(customProperty, rawValue);
    } else {
        ElementToBeDecorated.style.removeProperty(customProperty);
    }
}

// Reads back what was stored, preferring the raw value so the picker reopens on the library entry
// the page actually uses rather than on the hex it happens to resolve to today.
function GetPageObjectColor(element, customProperty, computedFallback) {

    var stored = element && element.style ? element.style.getPropertyValue(customProperty).trim() : '';
    return stored || computedFallback;
}

function PageContextInit() {

    let compStyles = window.getComputedStyle(ElementToBeDecorated);

    $("#pickerpagebackgroundcolor").colorPick({
        'initialColor': GetPageObjectColor(ElementToBeDecorated, '--envision-bgcolor', compStyles.backgroundColor),
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            SetPageObjectColor('backgroundColor', '--envision-bgcolor', this.element.attr('title'));
        }
    });

    $("#pickerpagebordercolor").colorPick({
        'initialColor': GetPageObjectColor(ElementToBeDecorated, '--envision-bordercolor', compStyles.borderColor),
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'init': function () {
            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
        },
        'onColorSelected': function () {

            this.element.css({ 'backgroundColor': GetObjectColor(this.element.attr('title')), 'color': GetObjectColor(this.element.attr('title')) });
            SetPageObjectColor('borderColor', '--envision-bordercolor', this.element.attr('title'));
        }
    });

    //StyleHeight

    let height;

    if (ElementToBeDecorated.style.height) {
        height = ElementToBeDecorated.style.height;
    }
    else {
        height = compStyles.getPropertyValue("height");
    }

    var PageContextHeight = document.getElementById('PageContextHeight');
    PageContextHeight.value = height;
    PageContextHeight.addEventListener('input', PageContextHeightInputHandler);

    let width;

    if (ElementToBeDecorated.style.width) {
        width = ElementToBeDecorated.style.width;
    }
    else {
        width = compStyles.getPropertyValue("width");
    }

    var PageContextWidth = document.getElementById('PageContextWidth');
    PageContextWidth.value = width;
    PageContextWidth.addEventListener('input', PageContextWidthInputHandler);

    let top;

    if (ElementToBeDecorated.style.top) {
        top = ElementToBeDecorated.style.top;
    }
    else {
        top = compStyles.getPropertyValue("top");
    }

    var PageContextTop = document.getElementById('PageContextTop');
    PageContextTop.value = top;
    PageContextTop.addEventListener('input', PageContextTopInputHandler);

    let left;

    if (ElementToBeDecorated.style.left) {
        left = ElementToBeDecorated.style.left;
    }
    else {
        left = compStyles.getPropertyValue("left");
    }

    var PageContextLeft = document.getElementById('PageContextLeft');
    PageContextLeft.value = left;
    PageContextLeft.addEventListener('input', PageContextLeftInputHandler);
}

function ObjectNameStyleFormatContextInit() {

    var objectname;
    var objectElement = ElementsToBeDecorated && ElementsToBeDecorated.length > 0 ? ElementsToBeDecorated[0] : ElementToBeDecorated;

    //objectname
    if (objectElement.getAttribute("data-system-objectname")) {
        objectname = objectElement.getAttribute("data-system-objectname");
    }
    else {
        objectname = '';
        objectElement.setAttribute("data-system-objectname", objectname);
    }

    objectname = objectElement.getAttribute("data-system-objectname");

    var StyleFormatContextObjectName = document.getElementById('StyleFormatContextObjectName');
    StyleFormatContextObjectName.value = objectname;
    StyleFormatContextObjectName.addEventListener('input', StyleFormatContextObjectNameInputHandler);

}
