// Envision Persistence - Persistence: before-save hooks, clipboard, import/export, uploads, status icons.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

function ResetDimensionsSVG(svgDom) {

    element = svgDom.parentElement;
    let elementheight;
    let elementwidth;

    svgDom.setAttribute("preserveAspectRatio", "none");

    let compStyles = window.getComputedStyle(element);

    if (element.style.width.includes('%')) {
        elementwidth = compStyles.getPropertyValue('width').replace('px', '');
    }
    else {
        elementwidth = element.style.width.replace('px', '');
    }

    if (element.style.height.includes('%')) {
        elementheight = compStyles.getPropertyValue('height').replace('px', '');
    }
    else {
        elementheight = element.style.height.replace('px', '');
    }

    if (svgDom.style.transform) {
        let transform = svgDom.style.transform;

        if (transform.includes("90deg") || transform.includes("270deg")) {

            svgDom.setAttribute("width", elementheight);
            svgDom.setAttribute("height", elementwidth);

            svgDom.style.width = elementheight;
            svgDom.style.height = elementwidth;

            if (elementheight > elementwidth) {
               
                svgDom.style.marginTop = ((elementheight / 2) - (elementwidth / 2)) + 'px';
                svgDom.style.marginLeft = (-(elementheight / 2) + (elementwidth / 2)) + 'px';
            }
            else {
                svgDom.style.marginTop = (-(elementwidth / 2) + (elementheight / 2)) + 'px';
                svgDom.style.marginLeft = ((elementwidth / 2) - (elementheight / 2)) + 'px';
            }

        }
        else {
            svgDom.setAttribute("width", elementwidth);
            svgDom.setAttribute("height", elementheight);

            svgDom.style.width = elementwidth;
            svgDom.style.height = elementheight;

            svgDom.style.marginTop = '0px';
            svgDom.style.marginLeft = '0px';

        }
    }
    else {
        svgDom.setAttribute("width", elementwidth);
        svgDom.setAttribute("height", elementheight);

        svgDom.style.width = elementwidth;
        svgDom.style.height = elementheight;

        svgDom.style.marginTop = '0px';
        svgDom.style.marginLeft = '0px';
    }

}

async function UploadSVG() {

    var fileInput = document.getElementById("uploadInput");

    var files = fileInput.files;

    if (files && files.length > 0) {
        var file = files[0];
        const reader = new FileReader();
        reader.addEventListener("load", (event) => {
            // Route the uploaded markup into the SVG Editor instead of placing it
            // directly, so it can be prepped/edited before Add to My Library / Place on page.
            if (typeof OpenSvgEditor === "function") {
                OpenSvgEditor({ markup: event.target.result, mode: "import" });
            } else {
                placeSvgObject(event.target.result);
            }
        });
        reader.readAsText(file);
    }

    document.getElementById("uploadInput").value = null;

    // Close the small "Upload SVG" decorator popup if it is open.
    var uploadPopup = document.getElementById("UploadSVG");
    if (uploadPopup) { uploadPopup.style.display = "none"; }
}

// Places a (prepped) inline SVG markup string onto the page as a new SVGObject,
// centered on the CenterCross. Extracted from the old UploadSVG so the SVG Editor
// and the upload flow share one placement path.
function placeSvgObject(markup) {

    var dateString = GenerateUniqueID();

    var CenterCross = document.getElementById('CenterCross');
    let compStyles = window.getComputedStyle(CenterCross);
    var top = compStyles.getPropertyValue('top');
    var left = compStyles.getPropertyValue('left');

    var svg = markup;
    var stringviewbox = "viewBox=";
    let viewboxindex = svg.indexOf(stringviewbox);
    let viewboxindexend = svg.indexOf("\"", viewboxindex + stringviewbox.length + 1);
    let viewboxcontent = svg.substring(viewboxindex + stringviewbox.length + 1, viewboxindexend);
    let box = viewboxcontent.split(' ');

    var viewboxwidth = box[2];
    var viewboxheight = box[3];

    var width = 100;
    var height = 100;

    if (viewboxwidth > viewboxheight) {
        var percentage = (viewboxheight / viewboxwidth) * 100;
        width = 100;
        height = percentage;
    }
    else {
        var percentage = (viewboxwidth / viewboxheight) * 100;
        width = percentage;
        height = 100;
    }

    var newobject =
        "<div name='SVGObject' class='draggable' id='" + dateString + "' style='width:" + width + "px;height:" + height + "px;left:" + left + ";top:" + top + ";z-index:0;' onclick='ClickAction(this)'>" + markup + "</div>";

    let doc = new DOMParser().parseFromString(newobject, 'text/html');
    let div = doc.body.firstChild;

    document.getElementById("EnvisionPage").appendChild(div);

    var ii = document.getElementById(dateString);
    let svgDom = ii.getElementsByTagName("svg")[0];
    svgDom.style.fill = '#B3B3B3';
    svgDom.style.color = '#B3B3B3';
    svgDom.setAttribute("height", height + 'px');
    svgDom.setAttribute("width", width + 'px');

    DisableEditMode();
    EnableEditMode();

    if (typeof saveSnapshot === "function") { saveSnapshot(); }

    return dateString;
}

async function UploadImage() {

    var fileInput = document.getElementById("uploadInputImage");

    var files = fileInput.files;

    var file;

    //TODO: Check only 1 file, same for SVG

    // loop through files
    for (var i = 0; i < files.length; i++) {

        // get item
        file = files.item(i);
        //or
        file = files[i];

        //alert(file.name);

        const reader = new FileReader();
        reader.addEventListener("load", (event) => {

            //console.log(event.target.result);

            var dateString = GenerateUniqueID();

            //console.log(event.target.result);

            var i = new Image();
            var width;
            var height;

            i.onload = function () {
                //console.log(i.width + ", " + i.height);

                width = i.width;
                height = i.height;
            };

            i.src = event.target.result;



            var img = "<img src=\"" + event.target.result + "\">"


            var newobject =
                "<div name='ImageObject' class='draggable' id='" + dateString + "' style='width:" + width + "px;height:" + height + "px;' onclick='ClickAction(this)'>" + img + "</div>"

            document.getElementById("EnvisionPage").innerHTML = document.getElementById("EnvisionPage").innerHTML + newobject;
            ReloadActiveObjects();

            //var ii = document.getElementById(dateString);

            //let svgDom = ii.getElementsByTagName("svg")[0];
            //svgDom.style.fill = '#5A5A5A';
            //let newWidth = 100, newHeight = 100;
            //svgDom.style.width = newWidth + 'px';
            //svgDom.style.height = newHeight + 'px';

        });

        reader.readAsDataURL(file);


    }

    document.getElementById("uploadInputImage").value = null;

    //alert('yes')

    await sleep(100);
    DisableEditMode();
    EnableEditMode();
}


async function AddImageFromLibrary(el) {

    closemenu();

    if (EditMode === false) {
        EnableEditMode();
    }

    AddTypeId = el;

    document.getElementById("EnvisionPage").style.cursor = "crosshair";
    document.getElementById("EnvisionPage").addEventListener('mousedown', AddImageFromLibraryDrop, false);
    DisableDraggablesPointerEvents();

    return;
}

const AddImageFromLibraryDrop = async function (e) {

    EnableDraggablesPointerEvents();

    el = AddTypeId;

    //document.getElementById("EnvisionPage").style.cursor = "crosshair";

    document.getElementById("EnvisionPage").removeEventListener('mousedown', AddImageFromLibraryDrop, false);

    var name = el.getAttribute("data-imgpath");

    //console.log(el.innerHTML);

    if (name.includes('.svg')) {

        var MY_URL = decodeURI("/images/Library/" + name);

        //console.log(MY_URL);

        var request = new XMLHttpRequest();
        request.open('GET', MY_URL, true);
        request.responseType = 'blob';
        request.onload = function () {
            var reader = new FileReader();
            reader.readAsDataURL(request.response);
            reader.onload = async function (ev) {
                //console.log('DataURL:', e.target.result);

                var base64 = ev.target.result.split(',')[1];

                const decodedData = atob(base64);

                var dateString = GenerateUniqueID();

                //var CenterCross = document.getElementById('CenterCross')

                //let compStyles = window.getComputedStyle(CenterCross);

                //var top = compStyles.getPropertyValue('top');
                //var left = compStyles.getPropertyValue('left');

                //magic script to find the position when zoomed and moved :)
                var margintop = parseInt(viewportImage.style.marginTop.replace("px", ""));
                var marginleft = parseInt(viewportImage.style.marginLeft.replace("px", ""));

                if (!margintop) {
                    margintop = 0;
                }
                if (!marginleft) {
                    marginleft = 0;
                }

                //console.log(e);

                viewportPointer.x = e.pageX - marginleft;
                viewportPointer.y = e.pageY - margintop;

                viewportTarget.x = (viewportPointer.x - viewportPos.x) / viewportScale;
                viewportTarget.y = (viewportPointer.y - viewportPos.y) / viewportScale;
                // ----

                var svg = decodedData;
                //console.log(svg);
                var stringviewbox = "viewBox=";
                let viewboxindex = svg.indexOf(stringviewbox);
                let viewboxindexend = svg.indexOf("\"", viewboxindex + stringviewbox.length + 1);

                let viewboxcontent = svg.substring(viewboxindex + stringviewbox.length + 1, viewboxindexend);

                let box = viewboxcontent.split(' ');

                var viewboxwidth = parseFloat(box[2]);
                var viewboxheight = parseFloat(box[3]);

                var width = 100;
                var height = 100;

                //console.log('width ' + viewboxwidth + ' height ' + viewboxheight);

                //console.log(viewboxwidth > viewboxheight);

                if (viewboxwidth > viewboxheight) {
                    var percentage = (viewboxheight / viewboxwidth) * 100;

                    width = 100;
                    height = percentage;

                }
                else {
                    var percentage = (viewboxwidth / viewboxheight) * 100;
                    //console.log('percentage height ' + percentage)
                    width = percentage;
                    height = 100;

                }

                var top = (viewportTarget.y - (height / 2));
                var left = (viewportTarget.x - (width / 2));

                top = roundDownToNearestX(top) + "px";
                left = roundDownToNearestX(left) + "px";

                //console.log('top ' + top + ' left ' + left);

                var newobject =
                    "<div name='SVGObject' class='draggable' id='" + dateString + "' style='width:" + width + "px;height:" + height + "px;left:" + left + ";top:" + top + ";z-index:0;' onclick='ClickAction(this)'>" + decodedData + "</div>";
                
                let doc = new DOMParser().parseFromString(newobject, 'text/html');
                let div = doc.body.firstChild;

                //console.log(div);
                
                document.getElementById("EnvisionPage").appendChild(div);

                var ii = document.getElementById(dateString);

                let svgDom = ii.getElementsByTagName("svg")[0];
                svgDom.style.fill = '#B3B3B3';
                svgDom.style.color = '#B3B3B3';
                svgDom.setAttribute("height", height + 'px');
                svgDom.setAttribute("width", width + 'px');


                await sleep(100);
                DisableEditMode();
                EnableEditMode();

                if (true) {
                    saveSnapshot();
                }

            };
        };
        request.send();
    }
    else {
        //todo
    }


}


function OpenUploadSVG() {

    document.getElementById("UploadSVG").style.display = 'block';
    EnableEditMode();

}

function OpenUploadImage() {

    document.getElementById("UploadImage").style.display = 'block';
    EnableEditMode();

}

function test() {
    var myText = "This can be whatever text you like!";
    alert(myText);
}

function ChangeColor(id) {

    if (document.getElementById(id).style.color == "green") {
        document.getElementById(id).style.color = "magenta";
    }
    else {
        document.getElementById(id).style.color = "green";
    }

}

// ====================

function CleanTablesBeforeSave(data) {
    try {

        var datatables = data.querySelectorAll('[name="DataTableObject"]');

        if (datatables) {
            datatables.forEach(function (datatable) {

                var ObjDom = getObjDom(datatable);

                var table = ObjDom.getElementsByTagName("table")[0];

                var tbody = table.getElementsByTagName("tbody")[0];

                tbody.innerHTML = "";

                // don't delete the header to keep the columns widths
            });
        }


        var alarmbanners = data.querySelectorAll('[name="AlarmBannerObject"]');

        if (alarmbanners) {
            alarmbanners.forEach(function (alarmbanner) {

                var ObjDom = getObjDom(alarmbanner);

                var table = ObjDom.getElementsByTagName("table")[0];

                var tbody = table.getElementsByTagName("tbody")[0];

                tbody.innerHTML = "";

            });
        }


    } catch (error) {
        console.error(error);
    }
}

//function Deneutralize() { // obsolete

//    var draggables = document.getElementById("EnvisionPage").querySelectorAll('.draggable');

//    if (draggables) {
//        draggables.forEach(function (draggable) {
//            draggable.style.filter = "";
//            draggable.style.opacity = "1";
//        });
//    }

//}

function SetNeutralColorsBeforeSave(data) { 

    var neutral = "#BDBDBD";

    try {

        // obsolete
        //var draggables = data.querySelectorAll('.draggable');

        //if (draggables) {
        //    draggables.forEach(function (draggable) {
        //        draggable.style.filter = "brightness(35%) grayscale(1)";
        //        draggable.style.opacity = "0.2";
        //    });
        //}


    } catch (error) {
        console.error(error);
    }
}

function LockItemsBeforeSave(data) {

    // Lock all items before saving the page, so when the page loads, the objects are locked

    try {
        
        var itemstobelocked = data.querySelectorAll('[data-accesscontrolenable="true"]');

        if (itemstobelocked) {
            itemstobelocked.forEach(function (itemtobelocked) {

                var ObjDom = getObjDom(itemtobelocked);

                ObjDom.style.filter = ObjDom.getAttribute('data-accesscontrolfilter');
                ObjDom.setAttribute('data-accesscontrollocked', 'true');
            });
        }

    } catch (error) {
        console.error(error);
    }
}

function RemoveStatusIcons(data) {

    // Lock all items before saving the page, so when the page loads, the objects are locked

    try {

        var statusicons = data.querySelectorAll('.statusicon');
        
        if (statusicons) {
            statusicons.forEach(function (statusicon) {
                /*console.log(statusicons);*/
                statusicon.parentElement.removeChild(statusicon);
            });
        }

    } catch (error) {
        console.error(error);
    }

}

function HideInvisibleBeforeSave(data) {

    // hide all items with visibility animation before saving the page, so when the page loads, the objects are not shown

    try {

        var itemswithvisibilityconfigured = data.querySelectorAll('[data-visibility]:not([data-visibility=""])');

        if (itemswithvisibilityconfigured) {
            itemswithvisibilityconfigured.forEach(function (ObjDom) {

                SetInvisible(ObjDom)

            });
        }

    } catch (error) {
        console.error(error);
    }
}

async function AddClipboard(id) {

    closemenu();

    if (EditMode === false) {
        EnableEditMode();
    }

    AddTypeId = id;

    document.getElementById("EnvisionPage").style.cursor = "crosshair";
    document.getElementById("EnvisionPage").addEventListener('mousedown', AddClipboardDrop, false);
    await DisableDraggablesPointerEvents();

    return;
}

const AddClipboardDrop = async function (e) {

    await EnableDraggablesPointerEvents();

    var id = AddTypeId;

    document.getElementById("EnvisionPage").removeEventListener('mousedown', AddClipboardDrop, false);

    var margintop = parseInt(viewportImage.style.marginTop.replace("px", ""));
    var marginleft = parseInt(viewportImage.style.marginLeft.replace("px", ""));

    if (!margintop) {
        margintop = 0;
    }
    if (!marginleft) {
        marginleft = 0;
    }

    viewportPointer.x = e.pageX - marginleft;
    viewportPointer.y = e.pageY - margintop;

    viewportTarget.x = (viewportPointer.x - viewportPos.x) / viewportScale;
    viewportTarget.y = (viewportPointer.y - viewportPos.y) / viewportScale;

    AddClipboardDropOffsetY = viewportTarget.y;
    AddClipboardDropOffsetX = viewportTarget.x;

    await sleep(100);
    await GetClipboard();

    ClipboardDestination = null;
    AddClipboardDropOffsetY = null;
    AddClipboardDropOffsetX = null;
    
    if (true) {
        saveSnapshot();
    }

    return;

    //var clone = document.getElementById(id).cloneNode(true);

    //clone.id = GenerateUniqueID();

    //clone.style.display = 'block';

    ////console.log(offsetY + "  " + offsetX);
    //var width = parseFloat(clone.style.width.replace('px', ''));
    //var height = parseFloat(clone.style.height.replace('px', ''));
    //var offsetY = e.clientY;
    //var offsetX = e.clientX;
    //// NEW

    ////magic script to find the position when zoomed and moved :)
    //var margintop = parseInt(image.style.marginTop.replace("px", ""));
    //var marginleft = parseInt(image.style.marginLeft.replace("px", ""));

    //if (!margintop) {
    //    margintop = 0;
    //}
    //if (!marginleft) {
    //    marginleft = 0;
    //}

    //pointer.x = e.pageX - marginleft;
    //pointer.y = e.pageY - margintop;

    //target.x = (pointer.x - pos.x) / scale;
    //target.y = (pointer.y - pos.y) / scale;

    ////var temptop = (target.y - (height / 2));
    ////var templeft = (target.x - (width / 2));

    ////clone.style.top = roundDownToNearestX(temptop) + "px";
    ////clone.style.left = roundDownToNearestX(templeft) + "px";

    //document.getElementById("EnvisionPage").appendChild(clone);

    //await sleep(100);
    //DisableEditMode();
    //await sleep(300);
    //EnableEditMode();

    //return clone.id;
}


function SubmitForm(id) {
    document.getElementById(id).submit();
}

function SubmitFormProgress(id) {

    document.getElementById(id).submit();

    ProgressModal();

}

async function SetClipboard(text) {

    document.getElementById('EnvisionPage').focus();
    await navigator.clipboard.writeText(text);
}

async function GetClipboard() {

    // REMARK : SIMILAR CODE BEING USED AS AddSymbol
    
    document.getElementById('EnvisionPage').focus();

    //alert(await navigator.clipboard.readText());

    try {

        let el = await navigator.clipboard.readText();
        el = el.replace("data-noid=", "id=");
        el = el.replaceAll("data-nosrc=", "src=");

        const parser = new DOMParser();
        const pastedDoc = parser.parseFromString(el, "text/html");

        /*console.log(pastedDoc.body);*/

        //var childDivs = pastedDoc.getElementsByTagName('div');
        var childDivs = pastedDoc.querySelectorAll('body > div');

        var minTop = 999999;
        var minLeft = 999999;
        var maxTop = 0;
        var maxLeft = 0;

        for (var i = 0; i < childDivs.length; i++) {
            
            var childDiv = childDivs[i];
            
            var top = parseFloat(childDiv.style.top.replace('px', ''));
            var left = parseFloat(childDiv.style.left.replace('px', ''));
            var width = parseFloat(childDiv.style.width.replace('px', ''));
            var height = parseFloat(childDiv.style.height.replace('px', ''));

            if (left < minLeft) {
                minLeft = left;
            }

            if (top < minTop) {
                minTop = top;
            }

            if (left + width > maxLeft) {
                maxLeft = left + width;
            }

            if (top + height > maxTop) {
                maxTop = top + height;
            }
        }

        if (ClipboardDestination === null) {
            ClipboardDestinationLeft = minLeft + ((maxLeft - minLeft) / 2);
            ClipboardDestinationTop = minTop + ((maxTop - minTop) / 2);
        }
        else { // then grou
            ClipboardDestinationLeft = minLeft;
            ClipboardDestinationTop = minTop;
        }

        for (var i = 0; i < childDivs.length; i++) {
            var childDiv = childDivs[i];
            var objectname = childDiv.getAttribute('name');

            switch (objectname) {
                case "GroupObject":
                    CloneGroupFrom(childDiv, true);
                    break;
                default:
                    if (childDiv.classList.contains("draggable")) {
                        CloneObjectFrom(childDiv);
                    }
                    break;
            }


        }

        initknob();

        //DeselectAllObjects();

        await sleep(100);
        DisableEditMode();
        EnableEditMode();

    } catch (error) {
        //console.error(error);
    }

    //TODO 0 USE EXISTING DUPLICATE/CLONE TO GENERATE NEW ID's <-----------------
}


function ResetStatusIconFreeze() {
    //return new Promise(resolve => setTimeout(resolve, ms));
    StatusIconFreeze = false;
    

}

function ServerConfirm() {
    var ServerConfirm = document.getElementById("ServerConfirm");
    ServerConfirm.style.display = "Block";
    ServerConfirm.style.opacity = 1;
    ServerConfirm.style.animation = 'none';
    ServerConfirm.offsetHeight; /* trigger reflow */
    ServerConfirm.style.animation = null;
}

function SaveConfirm() {
    var SaveConfirm = document.getElementById("SaveConfirm");
    SaveConfirm.style.display = "Block";
    SaveConfirm.style.opacity = 1;
    SaveConfirm.style.animation = 'none';
    SaveConfirm.offsetHeight; /* trigger reflow */
    SaveConfirm.style.animation = null;
}


function SetStatusIcon(element, objDom, status) {

    if (StatusIconFreeze) {
        return;
    }

    var statusicon = element.getElementsByClassName("statusicon")[0];

    if (!statusicon) {
        statusicon = document.createElement("div");
        statusicon.className = "statusicon";
        element.appendChild(statusicon);
    }

    //var ObjDom = getObjDom(element);
    var ObjDom = objDom;

    if (ObjDom.getAttribute('data-objectvisible') === "false") {
        status = 'Hidden';
        
    }

    //console.log(ObjDom.getAttribute('data-objectvisible') + " STATUS " + status);

    switch (status) {
        case 'Good':
            statusicon.innerHTML =
                ``
                ;
            break;

        case 'Hidden':
            statusicon.innerHTML =
                ``
                ;
            break;

        case 'ConnectionLost':

            statusicon.innerHTML =
                `<div style="height:22px;width:22px;fill:indianred;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.71,16.29h0l-13-13A1,1,0,0,0,2.29,4.71L5.65,8.06a7,7,0,0,0-.59,2A4,4,0,0,0,6,18h9.59l2.7,2.71a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42ZM6,16a2,2,0,0,1,0-4,1,1,0,0,0,1-1,5,5,0,0,1,.2-1.39L13.59,16ZM18.42,8.22A7,7,0,0,0,12,4a6.74,6.74,0,0,0-2.32.4,1,1,0,0,0,.66,1.88A4.91,4.91,0,0,1,12,6a5,5,0,0,1,4.73,3.39,1,1,0,0,0,.78.67,3,3,0,0,1,1.85,4.79,1,1,0,0,0,.16,1.4,1,1,0,0,0,.62.22,1,1,0,0,0,.78-.38,5,5,0,0,0-2.5-7.87Z"/></svg></div>`
                ;
            break;
        case 'Disabled':
            
            statusicon.innerHTML =
                `<div style="height:17px;width:17px;fill:indianred;"><svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	                 viewBox="0 0 177.055 177.055" xml:space="preserve">
                <path d="M0.001,88.527c0,48.814,39.713,88.527,88.527,88.527c48.813,0,88.526-39.713,88.526-88.527S137.341,0,88.528,0
	                C39.714,0,0.001,39.713,0.001,88.527z M88.528,24.304c35.413,0,64.224,28.811,64.224,64.224c0,13.324-4.081,25.712-11.055,35.983
	                L52.544,35.359C62.816,28.385,75.204,24.304,88.528,24.304z M124.511,141.696c-10.272,6.974-22.659,11.055-35.983,11.055
	                c-35.413,0-64.223-28.811-64.223-64.224c0-13.324,4.081-25.711,11.054-35.983L124.511,141.696z"/>
                </svg></div>`
                ;
            break;
        case 'FormatError':
            statusicon.innerHTML =
                `<div style="height:20px;width:20px;fill:indianred;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/></svg></div>`
                ;
            break;
        case 'Warning':
            statusicon.innerHTML =
                `<div style="height:20px;width:20px;fill:orange;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/></svg></div>`
                ;
            break;
        case 'NotFound':
            statusicon.innerHTML =
                `<div style="height:20px;width:20px;fill:indianred;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3l58.3 0c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24l0-13.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1l-58.3 0c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg></div>`
                ;
            break;
        default:
            
            statusicon.innerHTML =
                `<div style="height:20px;width:20px;fill:indianred;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg></div>`
                ;
            break;
    }

}

function InfoMsg(msg) {

    var modalEl = document.getElementById('InfoMessageModal');
    var myModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    document.getElementById('InfoModalMessage').innerHTML = msg;
    myModal.show();

}
