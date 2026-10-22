var symbolsIconFolder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path class="menuicon" d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z"/></svg>';
var symbolsIconFile = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path class="menuicon" d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm161.5-86.1c-12.2-5.2-26.3 .4-31.5 12.6s.4 26.3 12.6 31.5l11.9 5.1c17.3 7.4 28.5 24.4 28.5 43.2l0 9.7c0 13.3 10.7 24 24 24s24-10.7 24-24l0-9.7c0-35.8-20.9-68.3-53.5-83l0 0-16-6.8zm196 0l-16 6.8c-32.6 14.7-53.5 47.2-53.5 83l0 9.7c0 13.3 10.7 24 24 24s24-10.7 24-24l0-9.7c0-18.8 11.2-35.8 28.5-43.2l11.9-5.1c12.2-5.2 17.8-19.3 12.6-31.5s-19.3-17.8-31.5-12.6zM256 160a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-32 224a32 32 0 1 0 64 0 32 32 0 1 0 -64 0z"/></svg>';
var symbolsIconSetParent = '<svg style="width:14px;height:14px;pointer-events:none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path class="menuicon" d="M0 96c0-35.3 28.7-64 64-64h128c20.1 0 39.1 9.5 51.2 25.6L262.4 83.2c6 8.1 15.5 12.8 25.6 12.8H512c35.3 0 64 28.7 64 64v32H0V96zm0 128H576V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V224zm344.6 57.4c12.5-12.5 32.8-12.5 45.3 0l80 80c12.5 12.5 12.5 32.8 0 45.3l-80 80c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L369.4 416H208c-17.7 0-32-14.3-32-32s14.3-32 32-32H369.4l-24.8-24.6c-12.5-12.5-12.5-32.8 0-45.3z"/></svg>';

var findicon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path d=\"M288 82.74L297.4 73.37C309.9 60.88 330.1 60.88 342.6 73.37C355.1 85.87 355.1 106.1 342.6 118.6L278.6 182.6C266.1 195.1 245.9 195.1 233.4 182.6L169.4 118.6C156.9 106.1 156.9 85.87 169.4 73.37C181.9 60.88 202.1 60.88 214.6 73.37L223.1 82.75V32C223.1 14.33 238.3 0 255.1 0C273.7 0 288 14.33 288 32L288 82.74zM438.6 342.6C426.1 355.1 405.9 355.1 393.4 342.6L329.4 278.6C316.9 266.1 316.9 245.9 329.4 233.4L393.4 169.4C405.9 156.9 426.1 156.9 438.6 169.4C451.1 181.9 451.1 202.1 438.6 214.6L429.3 223.1H480C497.7 223.1 512 238.3 512 255.1C512 273.7 497.7 287.1 480 287.1H429.3L438.6 297.4C451.1 309.9 451.1 330.1 438.6 342.6V342.6zM288 256C288 273.7 273.7 288 256 288C238.3 288 224 273.7 224 256C224 238.3 238.3 224 256 224C273.7 224 288 238.3 288 256zM182.6 233.4C195.1 245.9 195.1 266.1 182.6 278.6L118.6 342.6C106.1 355.1 85.87 355.1 73.37 342.6C60.88 330.1 60.88 309.9 73.37 297.4L82.75 288H32C14.33 288 0 273.7 0 256C0 238.3 14.33 224 32 224H82.74L73.37 214.6C60.88 202.1 60.88 181.9 73.37 169.4C85.87 156.9 106.1 156.9 118.6 169.4L182.6 233.4zM169.4 438.6C156.9 426.1 156.9 405.9 169.4 393.4L233.4 329.4C245.9 316.9 266.1 316.9 278.6 329.4L342.6 393.4C355.1 405.9 355.1 426.1 342.6 438.6C330.1 451.1 309.9 451.1 297.4 438.6L288 429.3V480C288 497.7 273.7 512 256 512C238.3 512 224 497.7 224 480V429.3L214.6 438.6C202.1 451.1 181.9 451.1 169.4 438.6H169.4z\" /></svg>";

var SymbolsCurrentPath = "";

function getSymbolsMenuText(attributeName, fallback) {
    var menu = document.getElementById("MenuSymbols");
    if (!menu) return fallback;
    return menu.getAttribute(attributeName) || fallback;
}

function normSymbolPath(p) {
    if (!p) return "";
    p = p.trim();
    if (p.charAt(0) === '/') p = p.substring(1);
    if (p.endsWith('/')) p = p.slice(0, -1);
    return p;
}

function SymbolsGoIntoFolder(fp) {
    SymbolsCurrentPath = fp;
    RedrawMenuSymbols();
}

function PromptSymbolLibraryPath(symbolName, currentLibraryPath) {
    var currentPath = normSymbolPath(currentLibraryPath);
    var promptText = getSymbolsMenuText("data-setparentprompt", "Enter parent path (example: Engineering/Pumps). Leave empty for Home.");
    var newLibraryPath = window.prompt(promptText + "\n\n" + symbolName, currentPath);
    if (newLibraryPath === null) return;
    newLibraryPath = normSymbolPath(newLibraryPath);
    if (newLibraryPath === currentPath) return;
    UpdateSymbolLibraryPath(symbolName, newLibraryPath);
}

function AttachMenuSymbolDrag(el, symbolName) {
    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", function (e) {
        window.__MenuSymbolDragName = symbolName;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            try { e.dataTransfer.setData("text/plain", symbolName); } catch (ex) { }
        }
        el.classList.add("dragging");
    });
    el.addEventListener("dragend", function () {
        el.classList.remove("dragging");
        window.__MenuSymbolDragName = null;
        if (typeof ClearProjectDropTargetHighlights === "function") ClearProjectDropTargetHighlights();
    });
}

function AttachMenuSymbolFolderDrop(el, folderPath) {
    el.addEventListener("dragover", function (e) {
        if (!window.__MenuSymbolDragName) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        el.classList.add("ProjectFileDropTarget");
    });
    el.addEventListener("dragleave", function () {
        el.classList.remove("ProjectFileDropTarget");
    });
    el.addEventListener("drop", function (e) {
        el.classList.remove("ProjectFileDropTarget");
        if (!window.__MenuSymbolDragName) return;
        e.preventDefault();
        e.stopPropagation();
        var symbolName = window.__MenuSymbolDragName;
        window.__MenuSymbolDragName = null;
        UpdateSymbolLibraryPath(symbolName, folderPath);
    });
}

function SymbolsGoUp() {
    if (!SymbolsCurrentPath) return;
    var parts = SymbolsCurrentPath.split("/");
    parts.pop();
    SymbolsCurrentPath = parts.join("/");
    RedrawMenuSymbols();
}

function UpdateSymbolsBreadcrumb() {
    var bc = document.getElementById("SymbolsBreadcrumb");
    if (!bc) return;
    bc.innerHTML = "";

    var rootSpan = document.createElement("span");
    rootSpan.className = "bc-link";
    rootSpan.onclick = function () { SymbolsGoIntoFolder(""); };
    rootSpan.textContent = "Home";
    AttachMenuSymbolFolderDrop(rootSpan, "");
    bc.appendChild(rootSpan);

    if (SymbolsCurrentPath) {
        var parts = SymbolsCurrentPath.split("/");
        var accumulated = "";
        parts.forEach(function (part, i) {
            accumulated = accumulated ? (accumulated + "/" + part) : part;
            var sep = document.createElement("span");
            sep.className = "bc-sep";
            sep.textContent = "\u203a";
            bc.appendChild(sep);
            if (i < parts.length - 1) {
                var seg = document.createElement("span");
                seg.className = "bc-link";
                (function (cap) { seg.onclick = function () { SymbolsGoIntoFolder(cap); }; })(accumulated);
                seg.textContent = part;
                AttachMenuSymbolFolderDrop(seg, accumulated);
                bc.appendChild(seg);
            } else {
                var cur = document.createElement("span");
                cur.className = "bc-cur";
                cur.textContent = part;
                AttachMenuSymbolFolderDrop(cur, accumulated);
                bc.appendChild(cur);
            }
        });
    }
}

function RedrawMenuSymbols() {

    var MenuSymbols = document.getElementById("MenuSymbols");

    MenuSymbols.innerHTML = "";

    symbolspathsdict = new Object();

    menusymbols.forEach(function (symbol) {
        var lp = normSymbolPath(symbol.libraryPath);
        if (lp) symbolspathsdict[lp] = "";
    });

    var UL = document.createElement("ul");
    var prefix = SymbolsCurrentPath ? (SymbolsCurrentPath + "/") : "";

    // Render unique folder entries
    var foldersAdded = {};
    menusymbols.forEach(function (symbol) {
        var lp = normSymbolPath(symbol.libraryPath);
        if (lp !== SymbolsCurrentPath && lp.startsWith(prefix)) {
            var rest = lp.substring(prefix.length);
            var nextSegment = rest.split("/")[0];
            var folderPath = prefix + nextSegment;
            if (nextSegment && !foldersAdded[folderPath]) {
                foldersAdded[folderPath] = true;

                var LI = document.createElement("li");

                var icondiv = document.createElement("div");
                icondiv.className = "ProjectFileIcon";
                icondiv.innerHTML = symbolsIconFolder;

                var namediv = document.createElement("div");
                namediv.className = "MenuSymbolItemName MenuSymbolItemGroup";
                (function (fp) { namediv.onclick = function () { SymbolsGoIntoFolder(fp); }; })(folderPath);
                namediv.innerHTML = nextSegment;

                var caretdiv = document.createElement("div");
                caretdiv.className = "MenuSymbolItemCaret";
                caretdiv.innerHTML = '<svg style="width:8px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path class="menuicon" d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z"/></svg>';

                LI.appendChild(icondiv);
                LI.appendChild(namediv);
                LI.appendChild(caretdiv);
                AttachMenuSymbolFolderDrop(LI, folderPath);
                UL.appendChild(LI);
            }
        }
    });

    // Render symbols directly at the current level
    menusymbols.forEach(function (symbol) {
        var lp = normSymbolPath(symbol.libraryPath);
        if (lp === SymbolsCurrentPath) {
            var LI = document.createElement("li");
            LI.className = "MenuSymbolItemCollapse";

            var icondiv = document.createElement("div");
            icondiv.className = "ProjectFileIcon";
            icondiv.innerHTML = symbolsIconFile;

            var namediv = document.createElement("div");
            namediv.className = "MenuSymbolItemName";
            (function (sname) { namediv.onclick = function () { AddInstanceSymbolModal(sname); }; })(symbol.name);
            namediv.innerHTML = symbol.name;

            var findicondiv = document.createElement("div");
            findicondiv.className = "MenuSymbolItemFind";
            (function (sname) { findicondiv.onclick = function () { FindMasterSymbol(sname); }; })(symbol.name);
            findicondiv.innerHTML = findicon;

            var moveicondiv = document.createElement("div");
            moveicondiv.className = "MenuSymbolMoveBtn";
            moveicondiv.title = getSymbolsMenuText("data-setparent", "Set parent path");
            moveicondiv.innerHTML = symbolsIconSetParent + '<span class="MenuSymbolMoveBtnText">' + getSymbolsMenuText("data-path", "Path") + '</span>';
            (function (sname, slibraryPath) {
                moveicondiv.onclick = function (e) {
                    e.stopPropagation();
                    PromptSymbolLibraryPath(sname, slibraryPath);
                };
            })(symbol.name, symbol.libraryPath);

            LI.appendChild(icondiv);
            LI.appendChild(namediv);
            LI.appendChild(moveicondiv);
            LI.appendChild(findicondiv);
            AttachMenuSymbolDrag(LI, symbol.name);
            UL.appendChild(LI);
        }
    });

    MenuSymbols.appendChild(UL);

    UpdateSymbolsBreadcrumb();
}

function MenuSymbolItemCollapseItem(caret) {
    var li = caret.parentElement;

    li.classList.toggle("MenuSymbolItemCollapse");

    //console.log(li);
}


function MenuSymbolItemExpandItem(caret) {

    var li = caret.parentElement;

    if (li.classList.contains("MenuSymbolItemCollapse")) {
        li.classList.toggle("MenuSymbolItemCollapse");
    }

}

function SearchMenuSymbols(term) {
    var MenuSymbols = document.getElementById("MenuSymbols");
    if (!term) {
        RedrawMenuSymbols();
        return;
    }

    var lower = term.toLowerCase();
    var matches = menusymbols.filter(function (symbol) {
        return symbol.name.toLowerCase().includes(lower);
    });

    MenuSymbols.innerHTML = "";
    var UL = document.createElement("ul");

    matches.forEach(function (symbol) {
        var LI = document.createElement("li");
        LI.className = "MenuSymbolItemCollapse";

        var icondiv = document.createElement("div");
        icondiv.className = "ProjectFileIcon";
        icondiv.innerHTML = symbolsIconFile;

        var namediv = document.createElement("div");
        namediv.className = "MenuSymbolItemName";
        (function (sname) { namediv.onclick = function () { AddInstanceSymbolModal(sname); }; })(symbol.name);
        namediv.innerHTML = symbol.name;

        var findicondiv = document.createElement("div");
        findicondiv.className = "MenuSymbolItemFind";
        (function (sname) { findicondiv.onclick = function () { FindMasterSymbol(sname); }; })(symbol.name);
        findicondiv.innerHTML = findicon;

        var moveicondiv = document.createElement("div");
        moveicondiv.className = "MenuSymbolMoveBtn";
        moveicondiv.title = getSymbolsMenuText("data-setparent", "Set parent path");
        moveicondiv.innerHTML = symbolsIconSetParent + '<span class="MenuSymbolMoveBtnText">' + getSymbolsMenuText("data-path", "Path") + '</span>';
        (function (sname, slibraryPath) {
            moveicondiv.onclick = function (e) {
                e.stopPropagation();
                PromptSymbolLibraryPath(sname, slibraryPath);
            };
        })(symbol.name, symbol.libraryPath);

        LI.appendChild(icondiv);
        LI.appendChild(namediv);
        LI.appendChild(moveicondiv);

        if (symbol.libraryPath) {
            var pathdiv = document.createElement("div");
            pathdiv.className = "MenuItemSearchPath";
            pathdiv.textContent = normSymbolPath(symbol.libraryPath);
            LI.appendChild(pathdiv);
        }

        LI.appendChild(findicondiv);

        UL.appendChild(LI);
    });

    MenuSymbols.appendChild(UL);
}


function checksymbol(symbol) {

    if (!document.getElementById('exportsymbolsbtn').value.includes(symbol + "|")) {

        document.getElementById('exportsymbolsbtn').value = document.getElementById('exportsymbolsbtn').value + symbol + "|";
        document.getElementById('deletesymbolsbtn').value = document.getElementById('deletesymbolsbtn').value + symbol + "|";
    }

}

function unchecksymbol(symbol) {

    document.getElementById('exportsymbolsbtn').value = document.getElementById('exportsymbolsbtn').value.replace(symbol + "|", '');
    document.getElementById('deletesymbolsbtn').value = document.getElementById('exportsymbolsbtn').value.replace(symbol + "|", '');
}

//var dot = document.createElement("div");
//dot.className = "polygondot";
//dot.style.left = (xy[0] - 5) + "px";
//dot.style.top = (xy[1] - 5) + "px";
//dot.setAttribute("data-polygonobjectid", polygonobject.parentElement.id);
//dot.setAttribute("data-polygondotno", j);
//dot.setAttribute("data-polygondotx", xy[0]);
//dot.setAttribute("data-polygondoty", xy[1]);
//dot.style.zIndex = polygonobject.style.zIndex + 1;