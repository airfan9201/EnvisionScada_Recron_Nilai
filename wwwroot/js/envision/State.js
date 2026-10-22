// Envision State - Global state: palette, registries (Charts/Knobs/Sliders dicts), edit/drag flags, shared variables.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.
var visibility;
var blink;
var blinkspeed;
var blinkoffset;

var accesscontrolenable;
var accesscontrol;
var accesscontrolfilter;

var heightvariable;
var heightminraw;
var heightmaxraw;
var heightminpx;
var heightmaxpx;
var widthvariable;
var widthminraw;
var widthmaxraw;
var widthminpx;
var widthmaxpx;
var topvariable;
var topminraw;
var topmaxraw;
var topminpx;
var topmaxpx;
var leftvariable;
var leftminraw;
var leftmaxraw;
var leftminpx;
var leftmaxpx;
var transformrotate;
var transformorigin;

var bordercolor;
let borderconditionstate;
let bordercolorstate;

var borderradius;
var borderwidth;
var bordervisibility;
var borderblink;
var borderblinkspeed;
var borderblinkoffset;

// INIT FUNCTION

var palettecolors = [
    "#FF80AB", "#F06292", "#EC407A", "#E91E63", "#D81B60", "#C2185B", "#FF4081", "#F50057", "#C51162",
    "#B388FF", "#9575CD", "#7E57C2", "#673AB7", "#5E35B1", "#512DA8", "#7C4DFF", "#651FFF", "#6200EA",
    "#80D8FF", "#4FC3F7", "#29B6F6", "#03A9F4", "#039BE5", "#0288D1", "#40C4FF", "#00B0FF", "#0091EA",
    "#84FFFF", "#4DD0E1", "#26C6DA", "#00BCD4", "#00ACC1", "#0097A7", "#18FFFF", "#00E5FF", "#00B8D4",
    "#B9F6CA", "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C", "#69F0AE", "#00E676", "#00C853",
    "#CCFF90", "#AED581", "#9CCC65", "#8BC34A", "#7CB342", "#689F38", "#B2FF59", "#76FF03", "#64DD17",
    "#FFFF8D", "#FFF176", "#FFEE58", "#FFEB3B", "#FDD835", "#FBC02D", "#FFFF00", "#FFEA00", "#FFD600",
    "#FFD180", "#FFB74D", "#FFA726", "#FF9800", "#FB8C00", "#F57C00", "#FFAB40", "#FF9100", "#FF6D00",
    "#FF9E80", "#FF8A65", "#FF7043", "#FF5722", "#F4511E", "#E64A19", "#FF6E40", "#FF3D00", "#DD2C00",
    "#D7CCC8", "#BCAAA4", "#A1887F", "#8D6E63", "#795548", "#6D4C41", "#5D4037", "#4E342E", "#3E2723",
    "#CFD8DC", "#B0BEC5", "#90A4AE", "#78909C", "#607D8B", "#546E7A", "#455A64", "#37474F", "#263238",
    "#F5F5F5", "#EEEEEE", "#E0E0E0", "#BDBDBD", "#9E9E9E", "#757575", "#616161", "#424242", "#212121",
    "#000000", "#FFFFFF", "#ffffff00"

 ];


var transcolor = 'linear-gradient(45deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 45%, rgba(255,0,0,1) 50%, rgba(255,255,255,1) 55%, rgba(255,255,255,1) 100%)'

var NotFoundColor = '#FF10F0';

var rightMouseClicked = false;

var RightClickedObjectId;

var Attribute = false;

var callobjectcontext = false;

var selected = null, // Object of the element to be moved
    x_pos = 0, y_pos = 0, // Stores x & y coordinates of the mouse pointer
    x_elem = 0, y_elem = 0; // Stores top, left values (edge) of the element

var x_elemselected = [];
var y_elemselected = [];

var Charts = [];

var ChartsDict = new Object();
var ChartsSettingsDict = new Object();

var KnobsDict = new Object();

var SlidersDict = new Object();

var DraggingPopup = false;

var DraggingElement = false; // for linedot?

var DraggingObject = false; // for poly's

var DraggingCounter = 0;

var ObjectViewerOpen = false;

var DrawingLine = false;

var StatusIconFreeze = true; // when opening popup, wait a sec before updating status so it can dynamically load the data

var LastSelectedActive;

var linewidth = 1;

var GridSizeRoundDown = 10;


var EditMode = false;
var ShowHidden = false;


var polygonobjectid;
var polygondotno;
var polygondotx;
var polygondoty;
var polygondotgrabx;
var polygondotgraby;
var polygonobject;
var polygon;
var polygondot;

var polylineobjectid;
var polylinedotno;
var polylinedotx;
var polylinedoty;
var polylinedotgrabx;
var polylinedotgraby;
var polylineobject;
var polyline;
var polylinedot;
var PolylineNew = false;


// -------------------

var DrawConnectToHelperX = 0;
var DrawConnectToHelperY = 0;
var DrawConnectOriginalX = 0;
var DrawConnectOriginalY = 0;
var DrawConnectParentX = 0;
var DrawConnectParentY = 0;
var DrawConnectParent = null;

var DrawLineHelperX = 0;
var DrawLineHelperY = 0;
var DrawLineOriginalX = 0;
var DrawLineOriginalY = 0;
var DrawLineParentX = 0;
var DrawLineParentY = 0;
var DrawLineParent = null;

var WebFrameCacheBustSeed = Date.now().toString();
var WebFrameCacheBustCounter = 0;

var ClickedObject = false;

var decoratoropen = false;

var ElementToBeDecorated;

var ElementsToBeDecorated;

var SelectedGroups;

// AUTO SCROLL ISSUE ON INPUT FOCUS DEBUG CODE:
//document.getElementById('EnvisionPage').focus({ preventScroll: true });
//$(window).scroll(function () { return false; });
//$(EnvisionPage).scroll(function () { return false; });
//document.getElementById('EnvisionPage').scrolling = 'no';

//var element = document.getElementById('EnvisionPage');
//var topPos = element.getBoundingClientRect().top + window.scrollY;
//var leftPos = element.getBoundingClientRect().left + window.scrollX;

//console.log('top ' + topPos);
//console.log('left ' + leftPos);
//console.log('scrollY ' + window.scrollY);
//console.log('scrollX ' + window.scrollX);

//window.scrollY = 0;
//window.scrollX = 0;

var deneutralized = false;


var SendUserNotice = false;


// for ClientPerformance
var date2 = new Date();

var uniqueidcounter = 0;


var showingmenu = "Home";

var AddTypeId;

var AddClipboardDropOffsetY = null;
var AddClipboardDropOffsetX = null;

var expressioneditorelementselectvariable;

var genericeditorelementselectvariable;

var genericeditorsingleelementselectvariable;

var elementselectvariable;

var elementselectvariableappend;

var elementselectrecipe;


var elementselectdevice;


var elementselectPythonScript;

var elementselectPage;

var elementselectUserGroup;

var elementselectPath;

var elementselectLanguage;
var elementselectTheme;



var elementselectSymbol;

var elementselectAsset;

var elementselectAlarmFilter;

var CtrlKeyPressed = false;
var AltKeyPressed = false;
var ShiftKeyPressed = false;
var SpaceBarPressed = false;

var ClipboardDestination = null;
var ClipboardDestinationTop;
var ClipboardDestinationLeft;

var lastPageX;
var lastPageY;


// TRENDING 

const trendChartData = {
    labels: [],
    datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [],
    }]
};

var trendChartConfig = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'My First dataset',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [],
        },
        {
            label: 'My Second dataset',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [],
            yAxisID: 'y1',
        },
        {
            label: 'My Third dataset',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [],
            yAxisID: 'y2',
        },
        {
            label: 'My Fourth dataset',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [],
            yAxisID: 'y3',
        }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        spanGaps: true,
        // A live trend redraws several times per second, so the easing never completes before
        // the next redraw starts it over: it reads as smearing rather than animation, and it
        // is the single most expensive part of a chart update. Lines snap to their new
        // position instead.
        animation: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                }
            },
            title: {
                display: true,
                text: 'Hello World'
            },
            tooltip: {
                bodyColor: '#fff',
                backgroundColor: '#000'
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    /*unit: 'second',  // <-- that does the trick here*/
                    displayFormats: {
                        second: 'HH:mm:ss'
                    },
                    tooltipFormat: 'YYYY-MM-DD HH:mm:ss'  // <-- same format for tooltip
                },
                ticks: {
                    autoSkip: true,
                    maxRotation: 15,
                    minRotation: 15
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                min: 0,
                max: 100
            },
            y1: {
                type: 'linear',
                display: false,
                position: 'left',

                // grid line settings
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },

                min: 0,
                max: 100
            },
            y2: {
                type: 'linear',
                display: false,
                position: 'left',

                // grid line settings
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },

                min: 0,
                max: 100
            },
            y3: {
                type: 'linear',
                display: false,
                position: 'left',

                // grid line settings
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },

                min: 0,
                max: 100
            },
        },
    },
};

var SelectedTrend;

var popupcontextpositiontop;
var popupcontextpositionleft;

var CallingMoveToGroupElement;

var scaling;
var scalingstart;
var pinchstartevent;
var pinchendevent;
var pincholdscale = 1.0;
var pinchbrake = 0;
var pincholdx = 0;
var pincholdy = 0;

var sliderobjectactive = false;

//TABLE

var draggingcolumn = false;

// Menu navigation

var MenuPagesDirectory = "";
var MenuSymbolsDirectory = "";
var MenuImagesDirectory = "";

var pagespathsdict = new Object();
var symbolspathsdict = new Object();

// ResizeableDecorator

var StartWidthDecorator;
var StartMarginRightDecoratorDragLine;

var StartWidthLeftMenuBox;
var StartMarginLeftLeftMenuBoxDragLine;
