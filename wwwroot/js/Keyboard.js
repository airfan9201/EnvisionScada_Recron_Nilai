

var ObjDom4Numpad;
var OldValue4Numpad = null;
function OpenNumpad(ObjDom, numpaddecimalsymbol, numpadminussymbol) {

    ObjDom4Numpad = ObjDom;
    OldValue4Numpad = ObjDom.value;   // store original value

    var el = document.getElementById("NumpadKeyboard");
    el.style.zoom = parseFloat(NumpadScale) || 1.0;
    el.style.color = NumpadColor;
    el.style.fill = NumpadColor;
    el.style.backgroundColor = NumpadBackgroundColor;

    var showDecimal = (numpaddecimalsymbol !== 'false');
    var showMinus   = (numpadminussymbol !== 'false');

    var elDecimal = document.getElementById("NumpadKeyDecimal");
    var el0       = document.getElementById("NumpadKey0");
    var elMinus   = document.getElementById("NumpadKeyMinus");
    var elEnter   = document.getElementById("NumpadKeyEnter");

    if (showDecimal) {
        elDecimal.innerHTML = whatDecimalSeparator();
        elDecimal.style.display = "flex";
    } else {
        elDecimal.style.display = "none";
    }
    elMinus.style.display = showMinus ? "flex" : "none";

    // Reset order on all bottom keys (case 3 may have set them)
    elDecimal.style.order = "";
    el0.style.order       = "";
    elMinus.style.order   = "";
    elEnter.style.order   = "";

    if (!showDecimal && !showMinus) {
        // [0 (1/3)]  [ENTER (2/3)]
        el0.style.flexBasis    = "";
        elEnter.style.flexBasis = "calc(66.666% - 1px)";
    } else if (showDecimal && !showMinus) {
        // [. (1/3)]  [0 (2/3)]
        // [ENTER (100%)]
        el0.style.flexBasis    = "calc(66.666% - 1px)";
        elEnter.style.flexBasis = "100%";
    } else if (!showDecimal && showMinus) {
        // [- (1/3)]  [0 (2/3)]   ← reorder: minus before 0
        // [ENTER (100%)]
        elMinus.style.order    = "1";
        el0.style.order        = "2";
        elEnter.style.order    = "3";
        el0.style.flexBasis    = "calc(66.666% - 1px)";
        elEnter.style.flexBasis = "100%";
    } else {
        // [. (1/3)]  [0 (1/3)]  [- (1/3)]
        // [ENTER (100%)]
        el0.style.flexBasis    = "";
        elEnter.style.flexBasis = "100%";
    }

    el.style.display = "flex";

    requestAnimationFrame(function () {
        var numpadheight = el.offsetHeight;
        var numpadwidth = el.offsetWidth;

        var pagewidth = window.innerWidth;

        var parentRect = ObjDom.parentElement ? ObjDom.parentElement.getBoundingClientRect() : null;
        var inputRect = ObjDom.getBoundingClientRect();

        var objectleft = parentRect && isFinite(parentRect.left) ? parentRect.left : inputRect.left;
        var objecttop = parentRect && isFinite(parentRect.top) ? parentRect.top : inputRect.top;

        var objectwidth = NaN;
        var objectheight = NaN;

        if (ObjDom.parentElement && ObjDom.parentElement.style) {
            objectwidth = parseFloat((ObjDom.parentElement.style.width || "").replace('px', ''));
            objectheight = parseFloat((ObjDom.parentElement.style.height || "").replace('px', ''));
        }

        if (!isFinite(objectwidth) || objectwidth <= 0) {
            objectwidth = parentRect && isFinite(parentRect.width) && parentRect.width > 0 ? parentRect.width : inputRect.width;
        }
        if (!isFinite(objectheight) || objectheight <= 0) {
            objectheight = parentRect && isFinite(parentRect.height) && parentRect.height > 0 ? parentRect.height : inputRect.height;
        }

        if (!isFinite(objectwidth) || objectwidth <= 0) {
            objectwidth = 1;
        }
        if (!isFinite(objectheight) || objectheight <= 0) {
            objectheight = 1;
        }

        el.style.position = "fixed";


        var marginleft = 25.0;

        if ((objectleft + objectwidth + marginleft + numpadwidth) < pagewidth) {
            el.style.left = (objectleft + objectwidth + marginleft) + "px";
        } else {
            el.style.left = (objectleft - numpadwidth - marginleft) + "px";
        }

        if ((objecttop - numpadheight + objectheight) < 0) {
            el.style.top = (objecttop) + "px";
        } else {
            el.style.top = (objecttop - numpadheight + objectheight) + "px";
        }
    });
}

function whatDecimalSeparator() {
    var n = 1.1;
    n = n.toLocaleString().substring(1, 2);
    return n;
}

function animatenumbtn(el) {
    el.style.transition = "0.1s";
    el.style.transform = "scale(1.05)";
    el.style.zIndex = "99999";

    setTimeout(() => {
        el.style.transform = "scale(1)";
        el.style.zIndex = "99998";
    }, 100)
}

function NumpadInput(e, el) {
    e.preventDefault();
    //ObjDom4Numpad.value += el.innerHTML;

    ProcessInput(el.innerHTML);

    animatenumbtn(el);
}

function NumpadInputBackspace(e, el) {
    e.preventDefault();
    //ObjDom4Numpad.value = ObjDom4Numpad.value.slice(0, -1);

    var cursorPos = ObjDom4Numpad.selectionStart;
    var v = ObjDom4Numpad.value;
    var textBefore = v.substring(0, cursorPos).slice(0, -1);
    var textAfter = v.substring(cursorPos, v.length);

    ObjDom4Numpad.value = textBefore + textAfter;
    ObjDom4Numpad.setSelectionRange(cursorPos -1, cursorPos -1);

    animatenumbtn(el);
}

function NumpadInputCursorLeft(e, el) {
    e.preventDefault();
    //ObjDom4Numpad.value = ObjDom4Numpad.value.slice(0, -1);

    var cursorPos = ObjDom4Numpad.selectionStart;
    ObjDom4Numpad.setSelectionRange(cursorPos - 1, cursorPos - 1);

    animatenumbtn(el);
}

function NumpadInputCursorRight(e, el) {
    e.preventDefault();
    //ObjDom4Numpad.value = ObjDom4Numpad.value.slice(0, -1);

    var cursorPos = ObjDom4Numpad.selectionStart;
    ObjDom4Numpad.setSelectionRange(cursorPos + 1, cursorPos + 1);

    animatenumbtn(el);
}

function NumpadInputDecimal(e, el) {
    e.preventDefault();
    //ObjDom4Numpad.value += '.';

    ProcessInput('.');
    
    animatenumbtn(el);
}

function NumpadInputMinus(e, el) {
    e.preventDefault();
    //ObjDom4Numpad.value += '.';

    ProcessInput('-');


    animatenumbtn(el);
}

function ProcessInput(text) {

    var cursorPos = ObjDom4Numpad.selectionStart;
    var v = ObjDom4Numpad.value;
    var textBefore = v.substring(0, cursorPos);
    var textAfter = v.substring(cursorPos, v.length);

    ObjDom4Numpad.value = textBefore + text + textAfter;
    ObjDom4Numpad.setSelectionRange(cursorPos + 1, cursorPos + 1);

}

function NumpadInputGo(e, el) {
    e.preventDefault();
    animatenumbtn(el);
    document.getElementById("NumpadKeyboard").style.display = "none";
    document.getElementById('EnvisionPage').focus();
}

function CloseNumpad() {
    if (document.getElementById("NumpadKeyboard").style.display == "flex") {
        ObjDom4Numpad.removeAttribute("inputmode"); // for OSK
        document.getElementById("NumpadKeyboard").style.display = "none";
        document.getElementById('EnvisionPage').focus();
    }
}
function EscapeNumpad() {
    if (document.getElementById("NumpadKeyboard").style.display === "flex" && ObjDom4Numpad) {

        // Cancel path: restore old value first
        if (OldValue4Numpad !== null && OldValue4Numpad !== undefined) {
            ObjDom4Numpad.value = OldValue4Numpad;
        }

        ObjDom4Numpad.removeAttribute("inputmode"); // for OSK
        document.getElementById("NumpadKeyboard").style.display = "none";

        // Cleanup
        ObjDom4Numpad = null;
        OldValue4Numpad = null;

        document.getElementById('EnvisionPage').focus(); // focusout -> writes restored value
    }
}

var _numpadEl = document.getElementById("NumpadKeyboard");
if (_numpadEl) dragElement(_numpadEl);
function dragElement(elmnt) {

    //block input to envisionpage
    elmnt.onmousedown = function blockinput(e) {
        e.preventDefault();
        
    }

    //block input to envisionpage

    elmnt.addEventListener("touchstart", function () {
        DraggingPopup = true;
    });

    //block input to envisionpage
    elmnt.addEventListener("touchend", function () {
        DraggingPopup = false;
    });

    //dragging algo

    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    document.getElementById(elmnt.id + "header").addEventListener("touchstart", dragTouchStart);

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function dragTouchStart(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener("touchend", closeDragElementTouch, false);
        // call a function whenever the cursor moves:
        document.addEventListener("touchmove", elementDragTouch, false);


    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function elementDragTouch(e) {
        e = e || window.event;
        //e.preventDefault();
        // calculate the new cursor position:
        DraggingPopup = true;

        pos1 = pos3 - e.touches[0].clientX;
        pos2 = pos4 - e.touches[0].clientY;
        pos3 = e.touches[0].clientX;
        pos4 = e.touches[0].clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }

    function closeDragElementTouch() {

        DraggingPopup = false;

        // stop moving when mouse button is released:
        document.removeEventListener("touchend", closeDragElementTouch, false);
        document.removeEventListener("touchmove", elementDragTouch, false);
    }
}

/* ===== ON-SCREEN KEYBOARD ===== */

var ObjDom4Keyboard = null;
var OldValue4Keyboard = null;
var OskShifted = false;
var OskCurrentLayout = null;
var _oskSuppressNextOpen = false;

const KeyboardLayouts = {
    en: {
        normal: [
            ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
            ['q','w','e','r','t','y','u','i','o','p','[',']'],
            ['a','s','d','f','g','h','j','k','l',';',"'",'ENTER'],
            ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
            ['SPACE','ARROWLEFT','ARROWRIGHT']
        ],
        shift: [
            ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
            ['Q','W','E','R','T','Y','U','I','O','P','{','}'],
            ['A','S','D','F','G','H','J','K','L',':','"','ENTER'],
            ['SHIFT','Z','X','C','V','B','N','M','<','>','?','SHIFT'],
            ['SPACE','ARROWLEFT','ARROWRIGHT']
        ]
    },
    fr: {
        normal: [
            ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
            ['a','z','e','r','t','y','u','i','o','p','^','$'],
            ['q','s','d','f','g','h','j','k','l','m','\u00f9','ENTER'],
            ['SHIFT','w','x','c','v','b','n',',',';',':','!','SHIFT'],
            ['\u00e9','\u00e8','\u00e0','\u00e7','SPACE','ARROWLEFT','ARROWRIGHT']
        ],
        shift: [
            ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
            ['A','Z','E','R','T','Y','U','I','O','P','\u00a8','\u00a3'],
            ['Q','S','D','F','G','H','J','K','L','M','\u00d9','ENTER'],
            ['SHIFT','W','X','C','V','B','N','?','.','/','\u00a7','SHIFT'],
            ['\u00c9','\u00c8','\u00c0','\u00c7','SPACE','ARROWLEFT','ARROWRIGHT']
        ]
    },
    de: {
        normal: [
            ['^','1','2','3','4','5','6','7','8','9','0','\u00df','\u00b4','BACKSPACE'],
            ['q','w','e','r','t','z','u','i','o','p','\u00fc','+'],
            ['a','s','d','f','g','h','j','k','l','\u00f6','\u00e4','ENTER'],
            ['SHIFT','y','x','c','v','b','n','m',',','.','-','SHIFT'],
            ['@','\u20ac','SPACE','ARROWLEFT','ARROWRIGHT']
        ],
        shift: [
            ['\u00b0','!','"','\u00a7','$','%','&','/','(',')','=','?','`','BACKSPACE'],
            ['Q','W','E','R','T','Z','U','I','O','P','\u00dc','*'],
            ['A','S','D','F','G','H','J','K','L','\u00d6','\u00c4','ENTER'],
            ['SHIFT','Y','X','C','V','B','N','M',';',':','_','SHIFT'],
            ['@','\u20ac','SPACE','ARROWLEFT','ARROWRIGHT']
        ]
    },
    es: {
        normal: [
            ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
            ['q','w','e','r','t','y','u','i','o','p','[',']'],
            ['a','s','d','f','g','h','j','k','l','\u00f1',';','ENTER'],
            ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
            ['\u00e1','\u00e9','\u00ed','\u00f3','\u00fa','SPACE','ARROWLEFT','ARROWRIGHT']
        ],
        shift: [
            ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
            ['Q','W','E','R','T','Y','U','I','O','P','{','}'],
            ['A','S','D','F','G','H','J','K','L','\u00d1',':','ENTER'],
            ['SHIFT','Z','X','C','V','B','N','M','<','>','?','SHIFT'],
            ['\u00c1','\u00c9','\u00cd','\u00d3','\u00da','SPACE','ARROWLEFT','ARROWRIGHT']
        ]
    },
    pt: {
        normal: [
            ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
            ['q','w','e','r','t','y','u','i','o','p','[',']'],
            ['a','s','d','f','g','h','j','k','l','\u00e7',';','ENTER'],
            ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
            ['\u00e3','\u00ea','\u00e1','\u00f3','\u00fa','SPACE','ARROWLEFT','ARROWRIGHT']
        ],
        shift: [
            ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
            ['Q','W','E','R','T','Y','U','I','O','P','{','}'],
            ['A','S','D','F','G','H','J','K','L','\u00c7',':','ENTER'],
            ['SHIFT','Z','X','C','V','B','N','M','<','>','?','SHIFT'],
            ['\u00c3','\u00ca','\u00c1','\u00d3','\u00da','SPACE','ARROWLEFT','ARROWRIGHT']
        ]
    }
};

KeyboardLayouts.nl = KeyboardLayouts.en;
KeyboardLayouts.ja = KeyboardLayouts.en;
KeyboardLayouts.zh = KeyboardLayouts.en;
KeyboardLayouts.ko = KeyboardLayouts.en;

KeyboardLayouts.ru = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['\u0439','\u0446','\u0443','\u043a','\u0435','\u043d','\u0433','\u0448','\u0449','\u0437','\u0445','\u044a'],
        ['\u0444','\u044b','\u0432','\u0430','\u043f','\u0440','\u043e','\u043b','\u0434','\u0436','\u044d','ENTER'],
        ['SHIFT','\u044f','\u0447','\u0441','\u043c','\u0438','\u0442','\u044c','\u0431','\u044e','.','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','"','\u2116',';','%',':','?','*','(',')','_','+','BACKSPACE'],
        ['\u0419','\u0426','\u0423','\u041a','\u0415','\u041d','\u0413','\u0428','\u0429','\u0417','\u0425','\u042a'],
        ['\u0424','\u042b','\u0412','\u0410','\u041f','\u0420','\u041e','\u041b','\u0414','\u0416','\u042d','ENTER'],
        ['SHIFT','\u042f','\u0427','\u0421','\u041c','\u0418','\u0422','\u042c','\u0411','\u042e',',','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.tr = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','\u0131','o','p','\u011f','\u00fc'],
        ['a','s','d','f','g','h','j','k','l','\u015f','i','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m','\u00f6','\u00e7','.','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','\u0130','O','P','\u011e','\u00dc'],
        ['A','S','D','F','G','H','J','K','L','\u015e','\u0130','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M','\u00d6','\u00c7',':','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.it = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','\u00e8','+'],
        ['a','s','d','f','g','h','j','k','l','\u00f2','\u00e0','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
        ['\u00e9','\u00ec','\u00f9','SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','"','\u00a3','$','%','&','/','(',')','=','?','^','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','\u00c8','*'],
        ['A','S','D','F','G','H','J','K','L','\u00d2','\u00c0','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M',';',':','_','SHIFT'],
        ['\u00c9','\u00cc','\u00d9','SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.sv = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','\u00e5','\u00e4'],
        ['a','s','d','f','g','h','j','k','l','\u00f6',';','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','\u00c5','\u00c4'],
        ['A','S','D','F','G','H','J','K','L','\u00d6',':','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M','<','>','?','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.da = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','\u00e5','\u00f8'],
        ['a','s','d','f','g','h','j','k','l','\u00e6',';','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','"','#','$','%','&','/','(',')','=','?','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','\u00c5','\u00d8'],
        ['A','S','D','F','G','H','J','K','L','\u00c6',':','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M',';',':','_','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.pl = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','[',']'],
        ['a','s','d','f','g','h','j','k','l',';',"'",'ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
        ['\u0105','\u0119','\u00f3','\u015b','\u017c','\u0107','\u0144','\u0142','SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','{','}'],
        ['A','S','D','F','G','H','J','K','L',':','"','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M','<','>','?','SHIFT'],
        ['\u0104','\u0118','\u00d3','\u015a','\u017b','\u0106','\u0143','\u0141','SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.cs = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','\u0161','\u017e'],
        ['a','s','d','f','g','h','j','k','l','\u010d','\u011b','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','\u0159','SHIFT'],
        ['\u00e1','\u00e9','\u00ed','\u00fa','\u016f','\u00fd','SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','\u0160','\u017d'],
        ['A','S','D','F','G','H','J','K','L','\u010c','\u011a','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M','<','>','\u0158','SHIFT'],
        ['\u00c1','\u00c9','\u00cd','\u00da','\u016e','\u00dd','SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.hu = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','\u0151','\u00fc'],
        ['a','s','d','f','g','h','j','k','l','\u00e9','\u00e1','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','\u00f3','SHIFT'],
        ['\u00ed','\u00f6','\u00fa','\u0171','SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','\u0150','\u00dc'],
        ['A','S','D','F','G','H','J','K','L','\u00c9','\u00c1','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M','<','>','\u00d3','SHIFT'],
        ['\u00cd','\u00d6','\u00da','\u0170','SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.ro = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','\u0103','\u00e2'],
        ['a','s','d','f','g','h','j','k','l','\u0219','\u021b','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','\u00ee','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','\u0102','\u00c2'],
        ['A','S','D','F','G','H','J','K','L','\u0218','\u021a','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M','<','>','\u00ce','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts.sl = {
    normal: [
        ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
        ['q','w','e','r','t','y','u','i','o','p','\u010d','\u0161'],
        ['a','s','d','f','g','h','j','k','l','\u017e',';','ENTER'],
        ['SHIFT','z','x','c','v','b','n','m',',','.','/','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ],
    shift: [
        ['~','!','@','#','$','%','^','&','*','(',')','_','+','BACKSPACE'],
        ['Q','W','E','R','T','Y','U','I','O','P','\u010c','\u0160'],
        ['A','S','D','F','G','H','J','K','L','\u017d',':','ENTER'],
        ['SHIFT','Z','X','C','V','B','N','M','<','>','?','SHIFT'],
        ['SPACE','ARROWLEFT','ARROWRIGHT']
    ]
};

KeyboardLayouts['pt-BR'] = KeyboardLayouts.pt;
KeyboardLayouts.no = KeyboardLayouts.da;
KeyboardLayouts.fi = KeyboardLayouts.sv;
KeyboardLayouts.el = KeyboardLayouts.en;
KeyboardLayouts['zh-CN'] = KeyboardLayouts.en;
KeyboardLayouts['zh-TW'] = KeyboardLayouts.en;
KeyboardLayouts.hi = KeyboardLayouts.en;
KeyboardLayouts.ms = KeyboardLayouts.en;
KeyboardLayouts.vi = KeyboardLayouts.en;
KeyboardLayouts.id = KeyboardLayouts.en;
KeyboardLayouts.tl = KeyboardLayouts.en;
KeyboardLayouts.ar = KeyboardLayouts.en;
KeyboardLayouts.he = KeyboardLayouts.en;
KeyboardLayouts.bn = KeyboardLayouts.en;
KeyboardLayouts.ur = KeyboardLayouts.en;
KeyboardLayouts.th = KeyboardLayouts.en;

function OpenKeyboard(ObjDom, centered) {
    if (_oskSuppressNextOpen) return;
    var el = document.getElementById("OskKeyboard");
    var alreadyOpen = el.style.display === "flex";

    ObjDom4Keyboard = ObjDom;
    OldValue4Keyboard = ObjDom.value;
    OskShifted = false;

    var langCode = 'en';
    try { langCode = VarDict["client.SelectedLanguageCode"][0] || 'en'; } catch (e) {}
    OskCurrentLayout = KeyboardLayouts[langCode] || KeyboardLayouts['en'];

    RenderKeyboard(OskCurrentLayout, false);

    el.style.color = KeyboardColor;
    el.style.backgroundColor = KeyboardBackgroundColor;
    el.style.zoom = parseFloat(KeyboardScale) || 1.0;
    el.style.display = "flex";

    if (!alreadyOpen) {
        requestAnimationFrame(function () {
            var kbWidth = el.offsetWidth;
            var kbHeight = el.offsetHeight;

            var pageWidth = window.innerWidth;
            var pageHeight = window.innerHeight;
            var margin = 15;

            if (centered) {
                el.style.left = Math.max(margin, (pageWidth - kbWidth) / 2) + "px";
                el.style.top = Math.max(margin, Math.min(pageHeight * 0.75 - kbHeight / 2, pageHeight - kbHeight - margin)) + "px";
            } else {
                var rect = ObjDom.parentElement.getBoundingClientRect();
                var objLeft = rect.left;
                var objTop = rect.top;
                var objWidth = rect.width;
                var objHeight = rect.height;

                // Horizontal: align left of keyboard with left of object, shift left if off-screen
                var left = objLeft;
                if (left + kbWidth > pageWidth - margin) {
                    left = pageWidth - kbWidth - margin;
                }
                left = Math.max(margin, left);

                // Vertical: prefer below the object, fall back to above
                var top;
                if (objTop + objHeight + margin + kbHeight <= pageHeight) {
                    top = objTop + objHeight + margin;
                } else {
                    top = objTop - kbHeight - margin;
                }
                top = Math.max(margin, Math.min(top, pageHeight - kbHeight - margin));

                el.style.left = left + "px";
                el.style.top = top + "px";
            }
        });
    }
}

function RenderKeyboard(layout, shifted) {
    var container = document.getElementById("OskKeysContainer");
    container.innerHTML = '';
    var layer = shifted ? layout.shift : layout.normal;

    layer.forEach(function (row) {
        var rowDiv = document.createElement('div');
        rowDiv.className = 'OskRow';

        row.forEach(function (key) {
            var keyDiv = document.createElement('div');
            keyDiv.className = 'OskKey';

            if (key === 'BACKSPACE') {
                keyDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" style="width:16px;height:16px;fill:currentColor;"><path d="M576 128c0-35.3-28.7-64-64-64L205.3 64c-17 0-33.3 6.7-45.3 18.7L9.4 233.4c-6 6-9.4 14.1-9.4 22.6s3.4 16.6 9.4 22.6L160 429.3c12 12 28.3 18.7 45.3 18.7L512 448c35.3 0 64-28.7 64-64l0-256zM271 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>';
                keyDiv.classList.add('OskKeyWide');
                keyDiv.classList.add('OskKeySpecial');
                keyDiv.addEventListener('click', function () { OskBackspace(); animatenumbtn(keyDiv); });
            } else if (key === 'SHIFT') {
                keyDiv.innerHTML = '&#x21E7;';
                keyDiv.classList.add('OskKeyWide');
                keyDiv.classList.add('OskKeySpecial');
                if (shifted) keyDiv.classList.add('OskKeyActive');
                keyDiv.addEventListener('click', function () {
                    OskShifted = !OskShifted;
                    RenderKeyboard(OskCurrentLayout, OskShifted);
                });
            } else if (key === 'SPACE') {
                keyDiv.innerHTML = '&nbsp;';
                keyDiv.classList.add('OskKeySpace');
                keyDiv.addEventListener('click', function () { OskInsert(' '); animatenumbtn(keyDiv); });
            } else if (key === 'ENTER') {
                keyDiv.innerHTML = '&#x21B5;';
                keyDiv.classList.add('OskKeyWide');
                keyDiv.classList.add('OskKeySpecial');
                keyDiv.addEventListener('click', function () { KeyboardInputGo(); });
            } else if (key === 'ARROWLEFT') {
                keyDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:14px;height:14px;fill:currentColor;"><path d="M177.5 414c-8.8 3.8-19 2-26-4.6l-144-136C2.7 268.9 0 262.6 0 256s2.7-12.9 7.5-17.4l144-136c7-6.6 17.2-8.4 26-4.6s14.5 12.5 14.5 22l0 72 288 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l-288 0 0 72c0 9.6-5.7 18.2-14.5 22z"/></svg>';
                keyDiv.classList.add('OskKeySpecial');
                keyDiv.addEventListener('click', (function (kd) {
                    return function () {
                        var pos = ObjDom4Keyboard.selectionStart;
                        ObjDom4Keyboard.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
                        animatenumbtn(kd);
                    };
                })(keyDiv));
            } else if (key === 'ARROWRIGHT') {
                keyDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:14px;height:14px;fill:currentColor;"><path d="M334.5 414c8.8 3.8 19 2 26-4.6l144-136c4.8-4.5 7.5-10.8 7.5-17.4s-2.7-12.9-7.5-17.4l-144-136c-7-6.6-17.2-8.4-26-4.6s-14.5 12.5-14.5 22l0 72L32 192c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32l288 0 0 72c0 9.6 5.7 18.2 14.5 22z"/></svg>';
                keyDiv.classList.add('OskKeySpecial');
                keyDiv.addEventListener('click', (function (kd) {
                    return function () {
                        var pos = ObjDom4Keyboard.selectionStart;
                        var len = ObjDom4Keyboard.value.length;
                        ObjDom4Keyboard.setSelectionRange(Math.min(len, pos + 1), Math.min(len, pos + 1));
                        animatenumbtn(kd);
                    };
                })(keyDiv));
            } else {
                keyDiv.textContent = key;
                keyDiv.addEventListener('click', (function (k, kd) {
                    return function () {
                        OskInsert(k);
                        animatenumbtn(kd);
                        if (OskShifted) {
                            OskShifted = false;
                            RenderKeyboard(OskCurrentLayout, false);
                        }
                    };
                })(key, keyDiv));
            }

            rowDiv.appendChild(keyDiv);
        });

        container.appendChild(rowDiv);
    });
}

function OskInsert(text) {
    var cursorPos = ObjDom4Keyboard.selectionStart;
    var v = ObjDom4Keyboard.value;
    ObjDom4Keyboard.value = v.substring(0, cursorPos) + text + v.substring(cursorPos);
    ObjDom4Keyboard.setSelectionRange(cursorPos + 1, cursorPos + 1);
}

function OskBackspace() {
    var cursorPos = ObjDom4Keyboard.selectionStart;
    if (cursorPos === 0) return;
    var v = ObjDom4Keyboard.value;
    ObjDom4Keyboard.value = v.substring(0, cursorPos - 1) + v.substring(cursorPos);
    ObjDom4Keyboard.setSelectionRange(cursorPos - 1, cursorPos - 1);
}

function KeyboardInputGo() {
    document.getElementById("OskKeyboard").style.display = "none";
    if (ObjDom4Keyboard) ObjDom4Keyboard.removeAttribute("inputmode");
    var _ep = document.getElementById('EnvisionPage');
    if (_ep) _ep.focus();
}

function CloseKeyboard() {
    if (document.getElementById("OskKeyboard").style.display === "flex") {
        if (ObjDom4Keyboard) ObjDom4Keyboard.removeAttribute("inputmode");
        document.getElementById("OskKeyboard").style.display = "none";
    }
}

function EscapeKeyboard() {
    if (document.getElementById("OskKeyboard").style.display === "flex" && ObjDom4Keyboard) {
        if (OldValue4Keyboard !== null) ObjDom4Keyboard.value = OldValue4Keyboard;
        document.getElementById("OskKeyboard").style.display = "none";
        ObjDom4Keyboard = null;
        OldValue4Keyboard = null;
        _oskSuppressNextOpen = true;
        setTimeout(function () { _oskSuppressNextOpen = false; }, 300);
        var _ep = document.getElementById('EnvisionPage');
        if (_ep) _ep.focus();
    }
}

var _oskEl = document.getElementById("OskKeyboard");
if (_oskEl) dragElement(_oskEl);
