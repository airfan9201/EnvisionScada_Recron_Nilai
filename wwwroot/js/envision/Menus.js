// Envision Menus - Menus and navigation: header/left menus, page navigation, page CRUD, menu sizing.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.
// Observer END ～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～

async function LazyLoadMenuLib(el) {

    var name = el.getAttribute("data-imgpath");

    if (name.includes('.svg')) {

        var MY_URL = decodeURI("/images/Library/" + name);

        var request = new XMLHttpRequest();
        request.open('GET', MY_URL, true);
        request.responseType = 'blob';
        request.onload = function () {
            var reader = new FileReader();
            reader.readAsDataURL(request.response);
            reader.onload = async function (e) {
                //console.log('DataURL:', e.target.result);

                var base64 = e.target.result.split(',')[1];

                const decodedData = atob(base64);

                var newid = "symbol" + el.id;


                if (el.innerHTML.includes('svg')) {
                    return; // Rare occurence it dares to trigger twice on the same menulib, this avoids adding a second symbol.
                }

                var newobject =
                    "<div id='" + newid + "' style='width:50px;height:50px;margin-left:auto;margin-right:auto;'>" + decodedData + "</div>";

                el.innerHTML = el.innerHTML + newobject;

                var ii = document.getElementById(newid);
                //console.log(ii);
                let svgDom = ii.getElementsByTagName("svg")[0];
                svgDom.style.fill = '#B3B3B3';
                svgDom.style.color = '#B3B3B3';
                let newWidth = 50, newHeight = 50;
                svgDom.style.width = newWidth + 'px';
                svgDom.style.height = newHeight + 'px';

            };
        };
        request.send();
    }
    else {
        //todo
    }


}

function SetNavActive(id) {
    document.querySelectorAll('.EnvisionLeftMenuBottomBlock').forEach(function(el) { el.classList.remove('active'); });
    var btn = document.getElementById(id);
    if (btn) btn.classList.add('active');
}

function ShowPages() {

    document.getElementById("MenuCenterHome").style.display = "none";
    document.getElementById("MenuCenterPages").style.display = "block";
    document.getElementById("MenuCenterLibrary").style.display = "none";
    document.getElementById("MenuCenterGroupSymbols").style.display = "none";
    document.getElementById("MenuCenterProject").style.display = "none";

    document.getElementById("LeftMenu").style.background = "var(--ThemeBackground)";

    showingmenu = "Pages"; SetNavActive('NavBtn_pages');
    document.getElementById("SearchMenu").value = "";
    //SearchMenu(); // removed and integrated in RedrawMenuPages();
}

function ShowHome() {
    document.getElementById("MenuCenterHome").style.display = "block";
    document.getElementById("MenuCenterPages").style.display = "none";
    document.getElementById("MenuCenterLibrary").style.display = "none";
    document.getElementById("MenuCenterGroupSymbols").style.display = "none";
    document.getElementById("MenuCenterProject").style.display = "none";

    document.getElementById("LeftMenu").style.background = "var(--ThemeBackground)";

    showingmenu = "Home"; SetNavActive('NavBtn_home');
    document.getElementById("SearchMenu").value = "";
    SearchMenu();
}

function ShowLibrary() {
    document.getElementById("MenuCenterHome").style.display = "none";
    document.getElementById("MenuCenterPages").style.display = "none";
    document.getElementById("MenuCenterLibrary").style.display = "block";
    document.getElementById("MenuCenterGroupSymbols").style.display = "none";
    document.getElementById("MenuCenterProject").style.display = "none";

    document.getElementById("LeftMenu").style.background = "var(--ThemeBackground)";

    showingmenu = "Library"; SetNavActive('NavBtn_library');
    document.getElementById("SearchMenu").value = "";
    /*SearchMenu();*/
}

function ShowGroupSymbols() {

    document.getElementById("MenuCenterHome").style.display = "none";
    document.getElementById("MenuCenterPages").style.display = "none";
    document.getElementById("MenuCenterLibrary").style.display = "none";
    document.getElementById("MenuCenterGroupSymbols").style.display = "block";
    document.getElementById("MenuCenterProject").style.display = "none";

    document.getElementById("LeftMenu").style.background = "var(--ThemeBackground)";

    showingmenu = "Symbols"; SetNavActive('NavBtn_symbols');
    document.getElementById("SearchMenu").value = "";
    /*SearchMenu();*/
}

function ShowProject() {

    document.getElementById("MenuCenterHome").style.display = "none";
    document.getElementById("MenuCenterPages").style.display = "none";
    document.getElementById("MenuCenterLibrary").style.display = "none";
    document.getElementById("MenuCenterGroupSymbols").style.display = "none";
    document.getElementById("MenuCenterProject").style.display = "block";

    document.getElementById("LeftMenu").style.background = "var(--ThemeBackground)";

    showingmenu = "Project"; SetNavActive('NavBtn_project');
    document.getElementById("SearchMenu").value = "";
    LoadProjectFiles("");
}


function CreateNewPage() {

    SilentUpdatePage();

    var Name = document.getElementById('NewPageNameModal').value;

    document.getElementById('PageNameNew').value = Name;

    document.getElementById('FormPageNew').submit();
}

function DeletePage(id) {

    if (document.getElementById('deletepagesbtn').value == "") {
        alert('You need to check the pages that you wish to delete.')
    }
    else {
        AreYouSure(id);
    }

}

function ExportPage(id) {

    if (document.getElementById('exportpagesbtn').value == "") {
        alert('You need to check the pages that you wish to export.')
    }
    else {
        SilentUpdatePage();
        SubmitFormProgress('ExportPage');
    }

}

async function ToggleOpenMenu() {

    if (EditMode === false) {
        EnableEditMode();
        await sleep(100);
    }

    if (document.getElementById("LeftMenu").style.left == "0px") {

        closemenu();
        document.getElementById("DevMenuMenuIcon").style.fill = "darkgray";
        //document.getElementById("LeftMenu").style.left = "-100%";
        //await sleep(1000);
        //document.getElementById("LeftMenu").style.left = "";
        ////console.log('close');

        document.getElementById("LeftMenuBoxDragLine").style.display = 'none';
        document.getElementById("LeftMenuBoxDragLine").removeEventListener("mousedown", initDragLeftMenuBox, false);

    }
    else {
        openmenu();
        document.getElementById("DevMenuMenuIcon").style.fill = "#50C878";
        document.getElementById("DevMenuEditModeIcon").style.fill = "#50C878";
        //document.getElementById("LeftMenu").style.transition = "0.5s";
        //document.getElementById("LeftMenu").style.left = "0px";
        //console.log('open');

        document.getElementById("LeftMenuBoxDragLine").style.display = 'block';
        document.getElementById("LeftMenuBoxDragLine").addEventListener("mousedown", initDragLeftMenuBox, false);
    }
}


async function ToggleHeaderMenu(id) {

    const elem = document.getElementById(id);
    var visible;

    //Visibility
    if (elem.getAttribute("data-visible")) {
        visible = elem.getAttribute("data-visible");
    }
    else {
        visible = 'false';
    }

    if (visible === 'true') {
        // make invisible

        document.getElementById(id + "IconUp").style.display = "none";
        document.getElementById(id + "IconDown").style.display = "block";

        var elements = document.getElementsByClassName(id);

        for (var i = 0; i < elements.length; i++) {

            if (elements[i].classList.contains('active')) {
                elements[i].classList.toggle('active');
            }

            elements[i].style.display = "none";
        }

        visible = 'false';
        elem.setAttribute("data-visible", visible);
    }
    else {
        // make visible

        document.getElementById(id + "IconUp").style.display = "block";
        document.getElementById(id + "IconDown").style.display = "none";

        var elements = document.getElementsByClassName(id);

        for (var i = 0; i < elements.length; i++) {
            //
            elements[i].style.display = "block";

            await sleep(20);

            if (!elements[i].classList.contains('active')) {
                elements[i].classList.toggle('active');
            }
        }

        visible = 'true';
        elem.setAttribute("data-visible", visible);
    }

}

async function ExpandHeaderMenu(id) {

    const elem = document.getElementById(id);
    var visible;

    document.getElementById(id + "IconUp").style.display = "block";
    document.getElementById(id + "IconDown").style.display = "none";

    var elements = document.getElementsByClassName(id);

    for (var i = 0; i < elements.length; i++) {
        //
        elements[i].style.display = "block";

        await sleep(20);

        if (!elements[i].classList.contains('active')) {
            elements[i].classList.toggle('active');
        }

    }

    visible = 'true';
    elem.setAttribute("data-visible", visible);

}

async function ExpandAllHeaderMenu() {
    ExpandHeaderMenu('ProjectHeader');
    ExpandHeaderMenu('ConfigurationHeader');
    ExpandHeaderMenu('ServerHeader');
}

function SearchMenu() {

    var SearchTerm = document.getElementById("SearchMenu").value.toLowerCase();

    switch (showingmenu) {
        case "Home":
            {

                ExpandAllHeaderMenu();

                var selectedelements = document.getElementsByClassName("MenuHome");

                for (var i = 0; i < selectedelements.length; i++) {

                    var selectedelement = selectedelements[i];

                    //console.log(selectedelement.innerHTML.toLowerCase().includes(SearchTerm));

                    if (selectedelement.innerHTML.toLowerCase().includes(SearchTerm)) {
                        selectedelement.parentElement.style.display = "block";
                    }
                    else {
                        selectedelement.parentElement.style.display = "none";
                    }

                }
            }
            break;
        case "Library":
            {
                document.getElementById('MenuImagesDirectories').innerHTML = "";
                document.getElementById('MenuImagesReturn').style.display = "none";

                var selectedelements = document.getElementsByClassName("MenuLibrary");

                for (var i = 0; i < selectedelements.length; i++) {

                    var selectedelement = selectedelements[i];

                    if (selectedelement.innerHTML.toLowerCase().includes(SearchTerm)) {
                        selectedelement.style.display = "block";
                    }
                    else {
                        selectedelement.style.display = "none";
                    }

                }

                // The group separators only make sense next to the full, ordered list; while a
                // search is filtering the tiles they would be left hanging between results.
                var separators = document.getElementsByClassName("MenuLibrarySeparator");

                for (var s = 0; s < separators.length; s++) {
                    separators[s].style.display = SearchTerm === "" ? "block" : "none";
                }
            }
            break;
        case "Pages":
            {
                SearchMenuPages(SearchTerm);
            }
            break;
        case "Symbols":
            {
                SearchMenuSymbols(SearchTerm);
            }
            break;
        case "Project":
            {
                SearchProjectFiles(SearchTerm);
            }
            break;
        default:
            break;
    }

}

function SearchInstancesList() {

    // The Push dialog rebuilds its rows from state rather than hiding them, so the filter is applied
    // during the render. Selection and edited replacer values survive filtering.
    RenderPushInstances();
}

function GetSymbolMaster(symbolname) {

    var master;

    menusymbols.forEach((symbol) => {

        if (symbol.name == symbolname) {

            const parser = new DOMParser();
            master = parser.parseFromString(symbol.groupSymbol, "text/html");
            master = master.body.firstChild;
        }

    });

    return master;
}

function PageReplacedWarning() {
    var ServerConfirm = document.getElementById("PageReplacedWarning");
    ServerConfirm.style.display = "Block";
    ServerConfirm.style.opacity = 1;
    ServerConfirm.style.animation = 'none';
    ServerConfirm.offsetHeight; /* trigger reflow */
    ServerConfirm.style.animation = null;
}

function LoadOriginalPage() {

    DoActionNavigate(CurrentPage);

}

function openmenu() {

    document.getElementById("LeftMenu").style.left = "0px";
    document.getElementById("LeftMenu").style.transition = "0.4s";

    ClampLeftMenuDragLine();

    MenuImagesDirectory = "";

    RedrawMenuPages();
    RedrawMenuSymbols();
    RedrawMenuImages();
}

async function closemenu() {
    if (EditMode) {
        if (document.getElementById("LeftMenu").style.left == "0px") {
            document.getElementById("LeftMenu").style.left = "-100%";
            document.getElementById("LeftMenuBoxDragLine").style.display = "none";
            await sleep(100);
        }
    }
}

function SetMenuSizes() {
    if (localStorage.getItem('MultiContextWidth')) { 
        document.getElementById("MultiContext").style.width = localStorage.getItem('MultiContextWidth');
        document.getElementById("MultiContextDragLine").style.marginRight = localStorage.getItem('MultiContextDragLineMarginRight');
    } 

    if (localStorage.getItem('LeftMenuBoxWidth')) {
        document.getElementById("LeftMenu").style.width = localStorage.getItem('LeftMenuBoxWidth');
        document.getElementById("LeftMenuBoxDragLine").style.marginLeft = localStorage.getItem('LeftMenuBoxDragLineMarginLeft');
    }

    ClampLeftMenuDragLine();
}

//#LeftMenu is capped at the viewport width, so keep the resize handle on the visible edge of the menu.
function ClampLeftMenuDragLine() {

    var menu = document.getElementById("LeftMenu");
    var dragline = document.getElementById("LeftMenuBoxDragLine");

    if (!menu || !dragline) {
        return;
    }

    var width = parseFloat(menu.style.width.replace("px", ""));

    if (isNaN(width)) {
        return;
    }

    dragline.style.marginLeft = Math.min(width, document.documentElement.clientWidth - 5) + "px";
}

function RedrawMenuImages() {

    var SearchTerm = document.getElementById("SearchMenu").value.toLowerCase();

    if (SearchTerm !== "") {
        SearchMenu();
        return;
    }

    document.getElementById('MenuImagesDirectories').innerHTML = "";
    document.getElementById('MenuImagesReturn').style.display = "none";

    var MenuImages = document.getElementsByClassName("MenuImage");

    for (var i = 0; i < MenuImages.length; i++) {
        /* console.log(MenuImages[i].getAttribute("data-librarypath"))*/
        if (MenuImages[i].getAttribute("data-librarypath") == MenuImagesDirectory) {
            MenuImages[i].style.display = "block";
        }
        else {
            MenuImages[i].style.display = "none";

            if (MenuImages[i].getAttribute("data-librarypath").includes(MenuImagesDirectory) === true) {

                var upperpath = MenuImages[i].getAttribute("data-librarypath").replace(MenuImagesDirectory, '');

                if (upperpath.charAt(0) == '/') {
                    upperpath = upperpath.substring(1);
                }

                if (upperpath.includes('/')) {
                    upperpath = upperpath.substring(0, upperpath.lastIndexOf('/'));
                }

                var pathname = upperpath;
                if (MenuImagesDirectory != "") {
                    upperpath = MenuImagesDirectory + "/" + upperpath
                }

                if (document.getElementById(upperpath) == null) {
                    var clone = document.getElementById('MenuImageDirectory').cloneNode(true);

                    clone.id = upperpath;

                    clone.style.display = "block";

                    clone.getElementsByClassName("EnvisionLeftMenuCenterHomeBlockNameText")[0].innerHTML = pathname;

                    document.getElementById("MenuImagesDirectories").appendChild(clone);

                }

            }
        }

    }

    if (MenuImagesDirectory != "") {
        document.getElementById('MenuImagesReturn').style.display = "block";
    }

    document.getElementById("MenuImagesDirectory").innerHTML = MenuImagesDirectory;

}

function GoUpImagesDirectory(el) {

    MenuImagesDirectory = el.id;

    RedrawMenuImages();
}

function GoDownImagesDirectory() {

    var curdir = MenuImagesDirectory;

    if (curdir.includes('/')) {

        //console.log(curdir);
        // mylib/test
        var curdir = curdir.substring(curdir.lastIndexOf('/'), curdir.length);
        // /test
        curdir = MenuImagesDirectory.replace(curdir, "");
        // mylib
    }
    else {
        curdir = "";
    }

    MenuImagesDirectory = curdir;

    RedrawMenuImages();

}

function initDragLeftMenuBox(e) {

    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();

    startX = e.clientX;
    startY = e.clientY;

    StartWidthLeftMenuBox = parseFloat(document.getElementById("LeftMenu").style.width.replace("px", ""));
    StartMarginLeftLeftMenuBoxDragLine = parseFloat(document.getElementById("LeftMenuBoxDragLine").style.marginLeft.replace("px", ""));

    document.getElementById("LeftMenu").style.transition = "0s";

    document.documentElement.addEventListener("mousemove", doDragLeftMenuBox, false);
    document.documentElement.addEventListener("mouseup", stopDragLeftMenuBox, false);
}

function doDragLeftMenuBox(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();

    var changeX = roundDownToNearestX(e.clientX - startX);

    if (viewportScale !== 1) {
        changeX = roundDownToNearestX(changeX / viewportScale);
    }

    if ((StartWidthLeftMenuBox + changeX) <= 540) {

        document.getElementById("LeftMenu").style.width = "540px";
        document.getElementById("LeftMenuBoxDragLine").style.marginLeft = "540px";
    }
    else {
        document.getElementById("LeftMenu").style.width = (StartWidthLeftMenuBox + changeX) + "px";
        document.getElementById("LeftMenuBoxDragLine").style.marginLeft = (StartMarginLeftLeftMenuBoxDragLine + changeX) + "px";
    }

    //console.log('changeX ' + changeX);

    localStorage.setItem('LeftMenuBoxWidth', document.getElementById("LeftMenu").style.width);
    localStorage.setItem('LeftMenuBoxDragLineMarginLeft', document.getElementById("LeftMenuBoxDragLine").style.marginLeft);

    ClampLeftMenuDragLine();
}

function stopDragLeftMenuBox(e) {
    document.documentElement.removeEventListener("mousemove", doDragLeftMenuBox, false);
    document.documentElement.removeEventListener("mouseup", stopDragLeftMenuBox, false);

}
