var pagesIconFolder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path class="menuicon" d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z"/></svg>';
var pagesIconFile = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path class="menuicon" d="M320 464c8.8 0 16-7.2 16-16V160H256c-17.7 0-32-14.3-32-32V48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320zM0 64C0 28.7 28.7 0 64 0H229.5c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64z"/></svg>';
var pagesIconSetParent = '<svg style="width:14px;height:14px;pointer-events:none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path class="menuicon" d="M0 96c0-35.3 28.7-64 64-64h128c20.1 0 39.1 9.5 51.2 25.6L262.4 83.2c6 8.1 15.5 12.8 25.6 12.8H512c35.3 0 64 28.7 64 64v32H0V96zm0 128H576V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V224zm344.6 57.4c12.5-12.5 32.8-12.5 45.3 0l80 80c12.5 12.5 12.5 32.8 0 45.3l-80 80c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L369.4 416H208c-17.7 0-32-14.3-32-32s14.3-32 32-32H369.4l-24.8-24.6c-12.5-12.5-12.5-32.8 0-45.3z"/></svg>';

var PagesCurrentPath = "";

function getPagesMenuText(attributeName, fallback) {
    var menu = document.getElementById("MenuPages");
    if (!menu) return fallback;
    return menu.getAttribute(attributeName) || fallback;
}

function normPagePath(p) {
    if (!p) return "";
    p = p.trim();
    if (p.charAt(0) === '/') p = p.substring(1);
    if (p.endsWith('/')) p = p.slice(0, -1);
    return p;
}

function PagesGoIntoFolder(fp) {
    PagesCurrentPath = fp;
    RedrawMenuPages();
}

function PromptPageLibraryPath(pageName, currentLibraryPath) {
    var currentPath = normPagePath(currentLibraryPath);
    var promptText = getPagesMenuText("data-setparentprompt", "Enter parent path (example: Engineering/Pumps). Leave empty for Home.");
    var newLibraryPath = window.prompt(promptText + "\n\n" + pageName, currentPath);
    if (newLibraryPath === null) return;
    newLibraryPath = normPagePath(newLibraryPath);
    if (newLibraryPath === currentPath) return;
    UpdatePageLibraryPath(pageName, newLibraryPath);
}

function AttachMenuPageDrag(el, pageName) {
    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", function (e) {
        window.__MenuPageDragName = pageName;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            try { e.dataTransfer.setData("text/plain", pageName); } catch (ex) { }
        }
        el.classList.add("dragging");
    });
    el.addEventListener("dragend", function () {
        el.classList.remove("dragging");
        window.__MenuPageDragName = null;
        if (typeof ClearProjectDropTargetHighlights === "function") ClearProjectDropTargetHighlights();
    });
}

function AttachMenuPageFolderDrop(el, folderPath) {
    el.addEventListener("dragover", function (e) {
        if (!window.__MenuPageDragName) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        el.classList.add("ProjectFileDropTarget");
    });
    el.addEventListener("dragleave", function () {
        el.classList.remove("ProjectFileDropTarget");
    });
    el.addEventListener("drop", function (e) {
        el.classList.remove("ProjectFileDropTarget");
        if (!window.__MenuPageDragName) return;
        e.preventDefault();
        e.stopPropagation();
        var pageName = window.__MenuPageDragName;
        window.__MenuPageDragName = null;
        UpdatePageLibraryPath(pageName, folderPath);
    });
}

function PagesGoUp() {
    if (!PagesCurrentPath) return;
    var parts = PagesCurrentPath.split("/");
    parts.pop();
    PagesCurrentPath = parts.join("/");
    RedrawMenuPages();
}

function UpdatePagesBreadcrumb() {
    var bc = document.getElementById("PagesBreadcrumb");
    if (!bc) return;
    bc.innerHTML = "";

    var rootSpan = document.createElement("span");
    rootSpan.className = "bc-link";
    rootSpan.onclick = function () { PagesGoIntoFolder(""); };
    rootSpan.textContent = "Home";
    AttachMenuPageFolderDrop(rootSpan, "");
    bc.appendChild(rootSpan);

    if (PagesCurrentPath) {
        var parts = PagesCurrentPath.split("/");
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
                (function (cap) { seg.onclick = function () { PagesGoIntoFolder(cap); }; })(accumulated);
                seg.textContent = part;
                AttachMenuPageFolderDrop(seg, accumulated);
                bc.appendChild(seg);
            } else {
                var cur = document.createElement("span");
                cur.className = "bc-cur";
                cur.textContent = part;
                AttachMenuPageFolderDrop(cur, accumulated);
                bc.appendChild(cur);
            }
        });
    }
}

function checkpagefolder(checkbox, folderPath) {
    var fp = normPagePath(folderPath);
    menupages.forEach(function (page) {
        var lp = normPagePath(page.libraryPath);
        if (lp === fp || lp.startsWith(fp + "/")) {
            if (checkbox.checked) {
                checkpage(page.name);
            } else {
                uncheckpage(page.name);
            }
        }
    });
}

function RedrawMenuPages() {
    var MenuPages = document.getElementById("MenuPages");

    pagespathsdict = new Object();

    menupages.forEach(function (page) {
        var lp = normPagePath(page.libraryPath);
        if (lp) pagespathsdict[lp] = "";
    });

    MenuPages.innerHTML = "";

    var UL = document.createElement("ul");
    var prefix = PagesCurrentPath ? (PagesCurrentPath + "/") : "";

    // Render unique folder entries for the next level down
    var foldersAdded = {};
    menupages.forEach(function (page) {
        var lp = normPagePath(page.libraryPath);
        if (lp !== PagesCurrentPath && lp.startsWith(prefix)) {
            var rest = lp.substring(prefix.length);
            var nextSegment = rest.split("/")[0];
            var folderPath = prefix + nextSegment;
            if (nextSegment && !foldersAdded[folderPath]) {
                foldersAdded[folderPath] = true;

                var LI = document.createElement("li");

                var foldercheckbox = document.createElement("input");
                foldercheckbox.className = "form-check-input MenuItemCheckbox";
                foldercheckbox.type = "checkbox";
                (function (fp) { foldercheckbox.onclick = function () { checkpagefolder(this, fp); }; })(folderPath);

                var icondiv = document.createElement("div");
                icondiv.className = "ProjectFileIcon";
                icondiv.innerHTML = pagesIconFolder;

                var namediv = document.createElement("div");
                namediv.className = "MenuItemName MenuItemGroup";
                (function (fp) { namediv.onclick = function () { PagesGoIntoFolder(fp); }; })(folderPath);
                namediv.innerHTML = nextSegment;

                var caretdiv = document.createElement("div");
                caretdiv.className = "MenuItemCaret";
                caretdiv.innerHTML = '<svg style="width:8px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path class="menuicon" d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z"/></svg>';

                LI.appendChild(foldercheckbox);
                LI.appendChild(icondiv);
                LI.appendChild(namediv);
                LI.appendChild(caretdiv);
                AttachMenuPageFolderDrop(LI, folderPath);
                UL.appendChild(LI);
            }
        }
    });

    // Render pages directly at the current level
    menupages.forEach(function (page) {
        var lp = normPagePath(page.libraryPath);
        if (lp === PagesCurrentPath) {
            var LI = document.createElement("li");
            LI.className = "MenuItemCollapse";

            var icondiv = document.createElement("div");
            icondiv.className = "ProjectFileIcon";
            icondiv.innerHTML = pagesIconFile;

            var namediv = document.createElement("div");
            namediv.className = "MenuItemName";
            (function (pname) { namediv.onclick = function () { GoPage(pname); }; })(page.name);
            namediv.innerHTML = page.name;

            var checkboxdiv = document.createElement("input");
            checkboxdiv.className = "form-check-input MenuItemCheckbox";
            checkboxdiv.type = "checkbox";
            checkboxdiv.setAttribute("data-page", page.name);
            (function (pname) { checkboxdiv.onclick = function () { togglecheckpage(this, pname); }; })(page.name);

            var renamebtn = document.createElement("div");
            renamebtn.className = "PageRenameBtn";
            renamebtn.title = document.getElementById("MenuPages").getAttribute("data-rename") || "Rename";
            renamebtn.innerHTML = '<svg style="width:16px;pointer-events:none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path class="menuicon" d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V416c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>';

            var movebtn = document.createElement("div");
            movebtn.className = "PageRenameBtn PageMoveBtn";
            movebtn.title = getPagesMenuText("data-setparent", "Set parent path");
            movebtn.innerHTML = pagesIconSetParent + '<span class="PageMoveBtnText">' + getPagesMenuText("data-path", "Path") + '</span>';
            (function (pname, plibraryPath) {
                movebtn.onclick = function (e) {
                    e.stopPropagation();
                    PromptPageLibraryPath(pname, plibraryPath);
                };
            })(page.name, page.libraryPath);

            var renameForm = document.createElement("div");
            renameForm.className = "ProjectFileRenameForm";
            renameForm.style.display = "none";

            var renameInput = document.createElement("input");
            renameInput.className = "ProjectFileRenameInput";
            renameInput.type = "text";
            renameInput.onclick = function (e) { e.stopPropagation(); };

            var renameSave = document.createElement("span");
            renameSave.className = "ProjectFileConfirmYes";
            renameSave.textContent = "Save";

            var renameCancel = document.createElement("span");
            renameCancel.className = "ProjectFileConfirmNo";
            renameCancel.textContent = "No";

            renameForm.appendChild(renameInput);
            renameForm.appendChild(renameSave);
            renameForm.appendChild(renameCancel);

            (function (pname, nameEl, renameBtnEl, renameFormEl, renameInputEl, saveEl, cancelEl) {
                renameBtnEl.onclick = function (e) {
                    e.stopPropagation();
                    nameEl.style.display = "none";
                    renameBtnEl.style.display = "none";
                    renameFormEl.style.display = "flex";
                    renameInputEl.value = pname;
                    renameInputEl.focus();
                    renameInputEl.select();
                };
                saveEl.onclick = function (e) {
                    e.stopPropagation();
                    var n = renameInputEl.value.trim();
                    if (!n) return;
                    nameEl.style.display = "";
                    renameBtnEl.style.display = "";
                    renameFormEl.style.display = "none";
                    RenamePageItem(pname, n);
                };
                cancelEl.onclick = function (e) {
                    e.stopPropagation();
                    nameEl.style.display = "";
                    renameBtnEl.style.display = "";
                    renameFormEl.style.display = "none";
                };
                renameInputEl.onkeydown = function (e) {
                    if (e.key === "Enter") { e.preventDefault(); saveEl.click(); }
                    if (e.key === "Escape") { e.preventDefault(); cancelEl.click(); }
                };
            })(page.name, namediv, renamebtn, renameForm, renameInput, renameSave, renameCancel);

            LI.appendChild(checkboxdiv);
            LI.appendChild(icondiv);
            LI.appendChild(namediv);
            LI.appendChild(movebtn);
            LI.appendChild(renamebtn);
            LI.appendChild(renameForm);
            AttachMenuPageDrag(LI, page.name);
            UL.appendChild(LI);
        }
    });

    MenuPages.appendChild(UL);

    UpdatePagesBreadcrumb();
}

function MenuItemCollapseItem(caret) {
    var li = caret.parentElement;

    li.classList.toggle("MenuItemCollapse");

    //console.log(li);
}

function MenuItemExpandItem(caret) {

    var li = caret.parentElement;

    if (li.classList.contains("MenuItemCollapse")) {
        li.classList.toggle("MenuItemCollapse");
    }

}

function SearchMenuPages(term) {
    var MenuPages = document.getElementById("MenuPages");
    if (!term) {
        RedrawMenuPages();
        return;
    }

    var lower = term.toLowerCase();
    var matches = menupages.filter(function (page) {
        return page.name.toLowerCase().includes(lower);
    });

    MenuPages.innerHTML = "";
    var UL = document.createElement("ul");

    matches.forEach(function (page) {
        var LI = document.createElement("li");
        LI.className = "MenuItemCollapse";

        var icondiv = document.createElement("div");
        icondiv.className = "ProjectFileIcon";
        icondiv.innerHTML = pagesIconFile;

        var namediv = document.createElement("div");
        namediv.className = "MenuItemName";
        (function (pname) { namediv.onclick = function () { GoPage(pname); }; })(page.name);
        namediv.innerHTML = page.name;

        var checkboxdiv = document.createElement("input");
        checkboxdiv.className = "form-check-input MenuItemCheckbox";
        checkboxdiv.type = "checkbox";
        checkboxdiv.setAttribute("data-page", page.name);
        (function (pname) { checkboxdiv.onclick = function () { togglecheckpage(this, pname); }; })(page.name);

        LI.appendChild(checkboxdiv);
        LI.appendChild(icondiv);
        LI.appendChild(namediv);

        var renamebtn = document.createElement("div");
        renamebtn.className = "PageRenameBtn";
        renamebtn.title = document.getElementById("MenuPages").getAttribute("data-rename") || "Rename";
        renamebtn.innerHTML = '<svg style="width:16px;pointer-events:none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path class="menuicon" d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V416c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>';

        var movebtn = document.createElement("div");
        movebtn.className = "PageRenameBtn PageMoveBtn";
        movebtn.title = getPagesMenuText("data-setparent", "Set parent path");
        movebtn.innerHTML = pagesIconSetParent + '<span class="PageMoveBtnText">' + getPagesMenuText("data-path", "Path") + '</span>';
        (function (pname, plibraryPath) {
            movebtn.onclick = function (e) {
                e.stopPropagation();
                PromptPageLibraryPath(pname, plibraryPath);
            };
        })(page.name, page.libraryPath);

        var renameForm = document.createElement("div");
        renameForm.className = "ProjectFileRenameForm";
        renameForm.style.display = "none";

        var renameInput = document.createElement("input");
        renameInput.className = "ProjectFileRenameInput";
        renameInput.type = "text";
        renameInput.onclick = function (e) { e.stopPropagation(); };

        var renameSave = document.createElement("span");
        renameSave.className = "ProjectFileConfirmYes";
        renameSave.textContent = "Save";

        var renameCancel = document.createElement("span");
        renameCancel.className = "ProjectFileConfirmNo";
        renameCancel.textContent = "No";

        renameForm.appendChild(renameInput);
        renameForm.appendChild(renameSave);
        renameForm.appendChild(renameCancel);

        (function (pname, nameEl, renameBtnEl, renameFormEl, renameInputEl, saveEl, cancelEl) {
            renameBtnEl.onclick = function (e) {
                e.stopPropagation();
                nameEl.style.display = "none";
                renameBtnEl.style.display = "none";
                renameFormEl.style.display = "flex";
                renameInputEl.value = pname;
                renameInputEl.focus();
                renameInputEl.select();
            };
            saveEl.onclick = function (e) {
                e.stopPropagation();
                var n = renameInputEl.value.trim();
                if (!n) return;
                nameEl.style.display = "";
                renameBtnEl.style.display = "";
                renameFormEl.style.display = "none";
                RenamePageItem(pname, n);
            };
            cancelEl.onclick = function (e) {
                e.stopPropagation();
                nameEl.style.display = "";
                renameBtnEl.style.display = "";
                renameFormEl.style.display = "none";
            };
            renameInputEl.onkeydown = function (e) {
                if (e.key === "Enter") { e.preventDefault(); saveEl.click(); }
                if (e.key === "Escape") { e.preventDefault(); cancelEl.click(); }
            };
        })(page.name, namediv, renamebtn, renameForm, renameInput, renameSave, renameCancel);

        LI.appendChild(checkboxdiv);
        LI.appendChild(icondiv);
        LI.appendChild(namediv);
        LI.appendChild(movebtn);
        LI.appendChild(renamebtn);
        LI.appendChild(renameForm);

        if (page.libraryPath) {
            var pathdiv = document.createElement("div");
            pathdiv.className = "MenuItemSearchPath";
            pathdiv.textContent = normPagePath(page.libraryPath);
            LI.appendChild(pathdiv);
        }

        UL.appendChild(LI);
    });

    MenuPages.appendChild(UL);
}

function togglecheckpage(checkbox, page) {
    
    if (checkbox.checked) {
        checkpage(page);
    }
    else {
        uncheckpage(page);
    }

    //console.log(document.getElementById('exportpagesbtn').value);
}

function checkpage(page) {
    var exportBtn = document.getElementById('exportpagesbtn');
    var deleteBtn = document.getElementById('deletepagesbtn');
    var selectedRename = document.getElementById('SelectedPageRename');

    if (exportBtn && !exportBtn.value.includes(page + "|")) {
        exportBtn.value = exportBtn.value + page + "|";
        if (deleteBtn) deleteBtn.value = deleteBtn.value + page + "|";
        if (selectedRename) selectedRename.value = selectedRename.value + page + "|";
    }
}

function uncheckpage(page) {
    var exportBtn = document.getElementById('exportpagesbtn');
    var deleteBtn = document.getElementById('deletepagesbtn');
    var selectedRename = document.getElementById('SelectedPageRename');

    if (exportBtn) exportBtn.value = exportBtn.value.replace(page + "|", '');
    if (deleteBtn) deleteBtn.value = deleteBtn.value.replace(page + "|", '');
    if (selectedRename) selectedRename.value = selectedRename.value.replace(page + "|", '');
}

function checkpagegroup(checkbox, element) {

    //console.log(checkbox.checked);

    var UL = document.getElementById(element);

    var checkboxes = UL.getElementsByClassName("MenuItemCheckbox");

    for (var i = 0; i < checkboxes.length; i++) {

        var checkboxinside = checkboxes[i];
        checkboxinside.checked = checkbox.checked;

        if (checkboxinside.getAttribute("data-page")) {
            togglecheckpage(checkboxinside, checkboxinside.getAttribute("data-page"));
        }
    }
}

function SelectDeselectAllPages() {

    checkbox = document.getElementById("SelectDeselectAllPagesCheckbox");

    var checkboxes = document.getElementsByClassName("MenuItemCheckbox");

    for (var i = 0; i < checkboxes.length; i++) {

        var checkboxinside = checkboxes[i];
        checkboxinside.checked = checkbox.checked;

        if (checkboxinside.getAttribute("data-page")) {
            togglecheckpage(checkboxinside, checkboxinside.getAttribute("data-page"));
        }
    }


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