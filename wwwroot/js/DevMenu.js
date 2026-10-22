
dragElement(document.getElementById("DevMenu"));


function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "Drag")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "Drag").onmousedown = dragMouseDown;

        let DevMenuX = localStorage.getItem('DevMenuX');
        let DevMenuY = localStorage.getItem('DevMenuY');

        if (DevMenuX && DevMenuY) {
            elmnt.style.top = DevMenuX;
            elmnt.style.left = DevMenuY;
        }

        if (ProgrammerMode) {
            elmnt.style.display = "block";
        }

    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {

        if (e.target !== this) return;

        /*console.log('down');*/
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        //document.onmouseup = closeDragElement;
        document.addEventListener('mouseup', closeDragElement);
        // call a function whenever the cursor moves:
        //document.onmousemove = elementDrag;
        document.addEventListener('mousemove', elementDrag);

        
    }

    function elementDrag(e) {
        //console.log('drag');
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

    function closeDragElement() {
        // stop moving when mouse button is released:
        //console.log('up');

        localStorage.setItem('DevMenuX', elmnt.style.top);
        localStorage.setItem('DevMenuY', elmnt.style.left);

        //document.onmouseup = null;
        //document.onmousemove = null;

        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}

function DevMenuEditMode() {

    ToggleEditMode();
}

function DevMenuSHowInvisible() {
    ToggleInvisible();
}


function DevMenuReloadPage() {
    location.reload();
}

function DevMenuOpenMenu() {
    ToggleOpenMenu();
}

function DevMenuUpdatePage() {

    if (EditMode !== true) {
        EnableEditMode();
    }

    UpdatePage();
}

function MinimizeDevMenu() {

    document.getElementById("DevMenu").style.display = "none";
    alert('Press Ctrl+B to get the toolbar back.');
}

async function MaximizeDevMenu() {

    document.getElementById("DevMenu").style.display = "block";

    document.getElementById("DevMenu").style.top = "20px";
    document.getElementById("DevMenu").style.left = "20px";

    await sleep(100);
/*    alert("I'm back!");*/
}