// Recipe Manager: in-memory model (recipeManagerState), split renders, parameter table, modals, theme, and AJAX.
// Load after ~/js/Envision.js.

const RecipeManagerThemeDefaults = {
    bg: "#F0F1F3",
    text: "#545454",
    frameBg: "#F0F1F3",
    objectBorder: "#dbdbdb",
    tableBorder: "#dbdbdb",
    border: "#dbdbdb",
    checkboxBg: "#ffffff",
    checkboxBorder: "#8a8a8a",
    checkboxCheckedBg: "#00bfff",
    buttonBorder: "#8a8a8a",
    buttonBg: "#9c9c9c",
    buttonText: "#ffffff",
    buttonHoverBg: "#8a8a8a",
    buttonHoverText: "#000000",
    selectedBg: "#d0d0d0",
    selectedText: "#2b2b2b"
};

const RecipeManagerLeftPanelDefaultWidthPx = "280";
const RecipeManagerLeftPanelMinWidthPx = 240;
/* Minimum space reserved for splitter + flex gaps + right panel when clamping left width (px). */
const RecipeManagerLeftPanelRowReservePx = 100;

function RecipeManagerInitDefaultThemeAttributesOnRoot(obj) {
    if (!obj) return;
    getinitAttribute(obj, "data-system-theme-bg", RecipeManagerThemeDefaults.bg);
    getinitAttribute(obj, "data-system-theme-text", RecipeManagerThemeDefaults.text);
    getinitAttribute(obj, "data-system-theme-frame-bg", RecipeManagerThemeDefaults.frameBg);
    getinitAttribute(obj, "data-system-theme-object-border", RecipeManagerThemeDefaults.objectBorder);
    getinitAttribute(obj, "data-system-theme-border", RecipeManagerThemeDefaults.border);
    getinitAttribute(obj, "data-system-theme-table-border", RecipeManagerThemeDefaults.tableBorder);
    getinitAttribute(obj, "data-system-theme-checkbox-bg", RecipeManagerThemeDefaults.checkboxBg);
    getinitAttribute(obj, "data-system-theme-checkbox-border", RecipeManagerThemeDefaults.checkboxBorder);
    getinitAttribute(obj, "data-system-theme-checkbox-checked-bg", RecipeManagerThemeDefaults.checkboxCheckedBg);
    getinitAttribute(obj, "data-system-theme-button-border", RecipeManagerThemeDefaults.buttonBorder);
    getinitAttribute(obj, "data-system-theme-button-bg", RecipeManagerThemeDefaults.buttonBg);
    getinitAttribute(obj, "data-system-theme-button-text", RecipeManagerThemeDefaults.buttonText);
    getinitAttribute(obj, "data-system-theme-button-hover-bg", RecipeManagerThemeDefaults.buttonHoverBg);
    getinitAttribute(obj, "data-system-theme-button-hover-text", RecipeManagerThemeDefaults.buttonHoverText);
    getinitAttribute(obj, "data-system-theme-selected-bg", RecipeManagerThemeDefaults.selectedBg);
    getinitAttribute(obj, "data-system-theme-selected-text", RecipeManagerThemeDefaults.selectedText);
    getinitAttribute(obj, "data-system-numpaddecimalsymbol", "true");
    getinitAttribute(obj, "data-system-numpadminussymbol", "true");
}

function RecipeManagerGetLeftPanelRowElement(obj) {
    return obj ? obj.querySelector(".rm-container > .d-flex.flex-grow-1") : null;
}

function RecipeManagerClampLeftPanelWidth(obj, wPx) {
    const row = RecipeManagerGetLeftPanelRowElement(obj);
    if (!row || !row.clientWidth) {
        return Math.max(RecipeManagerLeftPanelMinWidthPx, wPx);
    }
    const maxW = Math.max(RecipeManagerLeftPanelMinWidthPx, row.clientWidth - RecipeManagerLeftPanelRowReservePx);
    return Math.max(RecipeManagerLeftPanelMinWidthPx, Math.min(wPx, maxW));
}

function RecipeManagerApplyLeftPanelLayout(obj) {
    if (!obj) return;
    getinitAttribute(obj, "data-system-left-width-px", RecipeManagerLeftPanelDefaultWidthPx);
    const raw = parseInt((obj.getAttribute("data-system-left-width-px") || RecipeManagerLeftPanelDefaultWidthPx), 10);
    const w = isNaN(raw) ? parseInt(RecipeManagerLeftPanelDefaultWidthPx, 10) : RecipeManagerClampLeftPanelWidth(obj, raw);
    if (w !== raw) {
        obj.setAttribute("data-system-left-width-px", String(w));
    }
    obj.style.setProperty("--RMLastLeftWidth", w + "px");
}

function RecipeManagerReadThemeAttribute(obj, attrName, key) {
    if (!obj) return RecipeManagerThemeDefaults[key];
    const v = (obj.getAttribute(attrName) || "").trim();
    const resolved = v !== "" ? v : RecipeManagerThemeDefaults[key];
    if (typeof GetObjectColor === "function") {
        return GetObjectColor(resolved);
    }
    return resolved;
}

function RecipeManagerContextInit() {
    const checkbox = document.getElementById("RecipeManagerContextNumpad");
    const decCb = document.getElementById("RecipeManagerContextNumpadDecimalSymbol");
    const minCb = document.getElementById("RecipeManagerContextNumpadMinusSymbol");
    if (!checkbox || !ElementToBeDecorated) {
        return;
    }

    function RecipeManagerToggleNumpadSubRowsVisibility(show) {
        const vis = show ? "flex" : "none";
        const dr = document.getElementById("RecipeManagerContextNumpadDecimalSymbolRow");
        const mr = document.getElementById("RecipeManagerContextNumpadMinusSymbolRow");
        if (dr) dr.style.display = vis;
        if (mr) mr.style.display = vis;
    }

    function RecipeManagerApplyAttributeToSelectedRoots(attrName, attrValue) {
        for (let i = ElementsToBeDecorated.length; i >= 1; i--) {
            const target = getObjDom(ElementsToBeDecorated[i - 1]);
            if (target) {
                target.setAttribute(attrName, attrValue);
                RecipeManagerApplyNumpadAttributes(target);
            }
        }
    }

    const numpad = getinitAttribute(ElementToBeDecorated, "data-system-numpad", "false");
    const dec = getinitAttribute(ElementToBeDecorated, "data-system-numpaddecimalsymbol", "true");
    const min = getinitAttribute(ElementToBeDecorated, "data-system-numpadminussymbol", "true");
    checkbox.checked = (numpad === "true");
    if (decCb) decCb.checked = (String(dec).toLowerCase() === "true");
    if (minCb) minCb.checked = (String(min).toLowerCase() === "true");
    RecipeManagerToggleNumpadSubRowsVisibility(checkbox.checked);

    checkbox.oninput = function (e) {
        const on = e.target.checked;
        RecipeManagerToggleNumpadSubRowsVisibility(on);
        RecipeManagerApplyAttributeToSelectedRoots("data-system-numpad", on ? "true" : "false");
    };

    if (decCb) {
        decCb.oninput = function (e) {
            const v = e.target.checked ? "true" : "false";
            RecipeManagerApplyAttributeToSelectedRoots("data-system-numpaddecimalsymbol", v);
        };
    }
    if (minCb) {
        minCb.oninput = function (e) {
            const v = e.target.checked ? "true" : "false";
            RecipeManagerApplyAttributeToSelectedRoots("data-system-numpadminussymbol", v);
        };
    }

    function RecipeManagerInitContextThemeColorPicker(className, dataAttr, defaultColor) {
        const el = document.querySelector("#RecipeManagerContext .picker." + className);
        if (!el || typeof $ === "undefined" || !$.fn.colorPick) {
            console.error("Recipe Manager theme color picker element or jQuery colorPick not found; selector '#RecipeManagerContext .picker." + className + "' or dependency missing.");
            return;
        }

        const initialColor = RecipeManagerReadThemeAttribute(ElementToBeDecorated, dataAttr, Object.keys(RecipeManagerThemeDefaults).find(function (x) {
            return RecipeManagerThemeDefaults[x] === defaultColor;
        }) || "bg");
        $(el).colorPick({
            "initialColor": initialColor,
            "paletteLabel": "Choose Color",
            "palette": palettecolors,
            "init": function () {
                this.element.css({ "backgroundColor": GetObjectColor(this.element.attr("title")), "color": GetObjectColor(this.element.attr("title")) });
            },
            "onColorSelected": function () {
                this.element.css({ "backgroundColor": GetObjectColor(this.element.attr("title")), "color": GetObjectColor(this.element.attr("title")) });
                const color = this.element.attr("title") || defaultColor;
                for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
                    const target = getObjDom(ElementsToBeDecorated[i - 1]);
                    if (!target) continue;
                    target.setAttribute(dataAttr, color);
                    if (typeof RecipeManagerApplyThemeVariables === "function") {
                        RecipeManagerApplyThemeVariables(target);
                    }
                }
            }
        });
    }

    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeBackgroundPicker", "data-system-theme-bg", RecipeManagerThemeDefaults.bg);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeTextPicker", "data-system-theme-text", RecipeManagerThemeDefaults.text);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeFrameBackgroundPicker", "data-system-theme-frame-bg", RecipeManagerThemeDefaults.frameBg);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeObjectBorderPicker", "data-system-theme-object-border", RecipeManagerThemeDefaults.objectBorder);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeBorderPicker", "data-system-theme-border", RecipeManagerThemeDefaults.border);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeTableBorderPicker", "data-system-theme-table-border", RecipeManagerThemeDefaults.tableBorder);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeCheckboxBackgroundPicker", "data-system-theme-checkbox-bg", RecipeManagerThemeDefaults.checkboxBg);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeCheckboxBorderPicker", "data-system-theme-checkbox-border", RecipeManagerThemeDefaults.checkboxBorder);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeCheckboxCheckedBackgroundPicker", "data-system-theme-checkbox-checked-bg", RecipeManagerThemeDefaults.checkboxCheckedBg);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeButtonBgPicker", "data-system-theme-button-bg", RecipeManagerThemeDefaults.buttonBg);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeButtonTextPicker", "data-system-theme-button-text", RecipeManagerThemeDefaults.buttonText);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeButtonBorderPicker", "data-system-theme-button-border", RecipeManagerThemeDefaults.buttonBorder);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeButtonHoverBgPicker", "data-system-theme-button-hover-bg", RecipeManagerThemeDefaults.buttonHoverBg);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeButtonHoverTextPicker", "data-system-theme-button-hover-text", RecipeManagerThemeDefaults.buttonHoverText);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeSelectedBgPicker", "data-system-theme-selected-bg", RecipeManagerThemeDefaults.selectedBg);
    RecipeManagerInitContextThemeColorPicker("RecipeManagerThemeSelectedTextPicker", "data-system-theme-selected-text", RecipeManagerThemeDefaults.selectedText);
}

let recipeManagerState = null;
let recipeManagerThemedRootRef = null;
let RecipeManagerLastStateSyncSignature = "";

function RecipeManagerGetSelection(obj) {
    if (!obj) {
        return null;
    }
    if (!obj.__rmSelection || typeof obj.__rmSelection !== "object") {
        obj.__rmSelection = {
            typeId: "",
            recipeId: "",
            recipeName: "",
            recipeDescription: "",
            target: ""
        };
    }
    return obj.__rmSelection;
}

function RecipeManagerSelectedTypeId(obj) {
    const s = RecipeManagerGetSelection(obj);
    return s ? String(s.typeId || "").trim() : "";
}

function RecipeManagerSelectedRecipeId(obj) {
    const s = RecipeManagerGetSelection(obj);
    return s ? String(s.recipeId || "").trim() : "";
}

function RecipeManagerSelectedRecipeName(obj) {
    const s = RecipeManagerGetSelection(obj);
    return s ? String(s.recipeName || "").trim() : "";
}

function RecipeManagerSelectedRecipeDescription(obj) {
    const s = RecipeManagerGetSelection(obj);
    return s ? String(s.recipeDescription || "").trim() : "";
}

function RecipeManagerSelectedTarget(obj) {
    const s = RecipeManagerGetSelection(obj);
    return s ? String(s.target || "").trim() : "";
}

function RecipeManagerSetSelectedTypeId(obj, typeId) {
    const s = RecipeManagerGetSelection(obj);
    if (!s) return;
    s.typeId = typeId != null ? String(typeId).trim() : "";
}

function RecipeManagerSetSelectedRecipe(obj, recipeId, name, description) {
    const s = RecipeManagerGetSelection(obj);
    if (!s) return;
    s.recipeId = recipeId != null ? String(recipeId) : "";
    s.recipeName = name != null ? String(name) : "";
    s.recipeDescription = description != null ? String(description).trim() : "";
}

function RecipeManagerSetSelectedTarget(obj, targetName) {
    const s = RecipeManagerGetSelection(obj);
    if (!s) return;
    s.target = targetName != null ? String(targetName).trim() : "";
}

function RecipeManagerClearSelectedRecipe(obj) {
    RecipeManagerSetSelectedRecipe(obj, "", "", "");
}

function RecipeManagerClearAllSelection(obj) {
    RecipeManagerSetSelectedTypeId(obj, "");
    RecipeManagerSetSelectedRecipe(obj, "", "", "");
    RecipeManagerSetSelectedTarget(obj, "");
}

function RecipeManagerImportTemplateContent(templateId) {
    const tpl = document.getElementById(templateId);
    if (!tpl || !tpl.content) {
        console.error("RecipeManager: missing template " + templateId);
        return null;
    }
    return document.importNode(tpl.content, true);
}

function RecipeManagerCloneTemplateElement(templateId, selector) {
    const content = RecipeManagerImportTemplateContent(templateId);
    if (!content) {
        return null;
    }
    const el = selector ? content.querySelector(selector) : content.firstElementChild;
    if (!el) {
        console.error("RecipeManager: template " + templateId + " missing element" + (selector ? (" " + selector) : ""));
        return null;
    }
    return el;
}

function RecipeManagerCreateOption(value, text) {
    const opt = RecipeManagerCloneTemplateElement("RecipeManagerTplSelectOption", "option");
    if (!opt) {
        return null;
    }
    opt.value = value != null ? String(value) : "";
    opt.textContent = text != null ? String(text) : "";
    return opt;
}

function RecipeManagerEscapeDelimitedValue(value, delimiter) {
    const text = value != null ? String(value) : "";
    if (text.indexOf('"') === -1 && text.indexOf("\r") === -1 && text.indexOf("\n") === -1 && (!delimiter || text.indexOf(delimiter) === -1)) {
        return text;
    }
    return '"' + text.replace(/"/g, '""') + '"';
}

function RecipeManagerParseDelimitedLine(line, delimiter) {
    const values = [];
    if (line == null) {
        return values;
    }
    if (!delimiter) {
        return [line];
    }

    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length;) {
        if (inQuotes) {
            if (line[i] === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                } else {
                    inQuotes = false;
                    i++;
                }
            } else {
                current += line[i];
                i++;
            }
            continue;
        }

        if (line[i] === '"') {
            inQuotes = true;
            i++;
            continue;
        }

        if (delimiter && line.substring(i, i + delimiter.length) === delimiter) {
            values.push(current);
            current = "";
            i += delimiter.length;
            continue;
        }

        current += line[i];
        i++;
    }

    values.push(current);
    return values;
}

function RecipeManagerDownloadTextFile(fileName, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

function RecipeManagerNormalizeParameterName(name) {
    return (name || "").trim();
}

function RecipeManagerBuildStateSyncSignature(state) {
    if (!state) return "";
    const typeParts = (state.recipeTypes || []).map(function (t) {
        const id = t && t.id != null ? String(t.id) : "";
        const name = t && t.name != null ? String(t.name) : "";
        const updatedUtc = t && t.updatedUtc != null ? String(t.updatedUtc) : "";
        return id + "|" + name + "|" + updatedUtc;
    }).sort();

    const targetParts = (state.targets || []).map(function (x) {
        const tn = x && x.targetName != null ? String(x.targetName) : "";
        const rtn = x && x.recipeTypeName != null ? String(x.recipeTypeName) : "";
        return tn + "|" + rtn;
    }).sort();

    const admin = state.isAdmin === true ? "1" : "0";
    return "a=" + admin + ";t=" + typeParts.join(",") + ";g=" + targetParts.join(",");
}

function RecipeManagerSetThemedRootRef(obj) {
    if (obj) {
        recipeManagerThemedRootRef = obj;
    }
}

function RecipeManagerSaveSuccessConfirm() {
    if (typeof ServerConfirm === "function") {
        ServerConfirm();
    }
}

function RecipeManagerAppendModalFromTemplateId(templateId) {
    const tpl = document.getElementById(templateId);
    if (!tpl || !tpl.content) {
        console.error("RecipeManager: missing modal template " + templateId);
        return false;
    }
    document.body.appendChild(document.importNode(tpl.content, true));
    return true;
}

function RecipeManagerAppendFontAwesomeIcon(parent, faClassName) {
    const i = document.createElement("i");
    i.className = "fa-solid " + faClassName;
    i.setAttribute("aria-hidden", "true");
    parent.appendChild(i);
}

function RecipeManagerGetOrCreateActionModal() {
    let modal = document.getElementById("RMActionModal");
    if (modal) return modal;
    RecipeManagerAppendModalFromTemplateId("RecipeManagerTplRMActionModal");
    return document.getElementById("RMActionModal");
}

function RecipeManagerApplyThemeToModalElement(modalElement, sourceObj) {
    if (!modalElement) return;
    const src = sourceObj || recipeManagerThemedRootRef;
    if (!src) return;

    const setOrClear = function (name, value) {
        if (value && value.trim() !== "") {
            modalElement.style.setProperty(name, value);
        } else {
            modalElement.style.removeProperty(name);
        }
    };

    setOrClear("--RMBackground", RecipeManagerReadThemeAttribute(src, "data-system-theme-bg", "bg"));
    setOrClear("--RMText", RecipeManagerReadThemeAttribute(src, "data-system-theme-text", "text"));
    setOrClear("--RMFrameBackground", RecipeManagerReadThemeAttribute(src, "data-system-theme-frame-bg", "frameBg"));
    setOrClear("--RMObjectBorder", RecipeManagerReadThemeAttribute(src, "data-system-theme-object-border", "objectBorder"));
    setOrClear("--RMDropdownBackground", RecipeManagerReadThemeAttribute(src, "data-system-theme-frame-bg", "frameBg"));
    setOrClear("--RMTableBackground", RecipeManagerReadThemeAttribute(src, "data-system-theme-frame-bg", "frameBg"));
    setOrClear("--RMBorder", RecipeManagerReadThemeAttribute(src, "data-system-theme-border", "border"));
    setOrClear("--RMTableBorder", RecipeManagerReadThemeAttribute(src, "data-system-theme-table-border", "tableBorder"));
    setOrClear("--RMCheckboxBackground", RecipeManagerReadThemeAttribute(src, "data-system-theme-checkbox-bg", "checkboxBg"));
    setOrClear("--RMCheckboxBorder", RecipeManagerReadThemeAttribute(src, "data-system-theme-checkbox-border", "checkboxBorder"));
    setOrClear("--RMCheckboxCheckedBackground", RecipeManagerReadThemeAttribute(src, "data-system-theme-checkbox-checked-bg", "checkboxCheckedBg"));
    setOrClear("--RMButtonBorder", RecipeManagerReadThemeAttribute(src, "data-system-theme-button-border", "buttonBorder"));
    setOrClear("--RMButtonBg", RecipeManagerReadThemeAttribute(src, "data-system-theme-button-bg", "buttonBg"));
    setOrClear("--RMButtonText", RecipeManagerReadThemeAttribute(src, "data-system-theme-button-text", "buttonText"));
    setOrClear("--RMButtonHoverBg", RecipeManagerReadThemeAttribute(src, "data-system-theme-button-hover-bg", "buttonHoverBg"));
    setOrClear("--RMButtonHoverText", RecipeManagerReadThemeAttribute(src, "data-system-theme-button-hover-text", "buttonHoverText"));
    setOrClear("--RMSelectedBg", RecipeManagerReadThemeAttribute(src, "data-system-theme-selected-bg", "selectedBg"));
    setOrClear("--RMSelectedText", RecipeManagerReadThemeAttribute(src, "data-system-theme-selected-text", "selectedText"));

    modalElement.style.setProperty("--bs-body-bg", "var(--RMBackground)");
    modalElement.style.setProperty("--bs-body-color", "var(--RMText)");
    modalElement.style.setProperty("--bs-border-color", "var(--RMBorder)");
    modalElement.style.setProperty("--bs-table-bg", "var(--RMBackground)");
    modalElement.style.setProperty("--bs-table-color", "var(--RMText)");
    modalElement.style.setProperty("--bs-table-border-color", "var(--RMTableBorder)");
}

function RecipeManagerOpenPromptDialog(title, label, initialValue, confirmText, onConfirm) {
    const modalElement = RecipeManagerGetOrCreateActionModal();
    RecipeManagerApplyThemeToModalElement(modalElement);
    modalElement.querySelector("#RMActionModalTitle").textContent = title || "";
    modalElement.querySelector("#RMActionModalLabel").textContent = label || "";
    modalElement.querySelector("#RMActionModalInput").value = initialValue || "";
    modalElement.querySelector("#RMActionModalMessage").textContent = "";
    const confirmBtn = modalElement.querySelector("#RMActionModalConfirm");
    confirmBtn.textContent = confirmText || "Save";
    confirmBtn.onclick = function () {
        const value = (modalElement.querySelector("#RMActionModalInput").value || "").trim();
        if (!value) {
            modalElement.querySelector("#RMActionModalMessage").textContent = "Value is required.";
            return;
        }
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.hide();
        onConfirm(value);
    };
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
    setTimeout(function () { modalElement.querySelector("#RMActionModalInput").focus(); }, 50);
}

function RecipeManagerOpenConfirmDialog(title, message, confirmText, onConfirm) {
    const modalElement = RecipeManagerGetOrCreateActionModal();
    RecipeManagerApplyThemeToModalElement(modalElement);
    modalElement.querySelector("#RMActionModalTitle").textContent = title || "";
    modalElement.querySelector("#RMActionModalLabel").textContent = message || "";
    modalElement.querySelector("#RMActionModalInput").value = "";
    modalElement.querySelector("#RMActionModalInput").classList.add("d-none");
    modalElement.querySelector("#RMActionModalMessage").textContent = "";
    const confirmBtn = modalElement.querySelector("#RMActionModalConfirm");
    confirmBtn.textContent = confirmText || "Confirm";
    confirmBtn.onclick = function () {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.hide();
        onConfirm();
    };
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
    modalElement.addEventListener("hidden.bs.modal", function resetInputVisibility() {
        modalElement.querySelector("#RMActionModalInput").classList.remove("d-none");
        modalElement.removeEventListener("hidden.bs.modal", resetInputVisibility);
    });
}

function RecipeManagerFindRecipe(state, recipeTypeId, recipeId) {
    if (!state || !recipeId) return null;
    const t = (state.recipeTypes || []).find(x => String(x.id) === String(recipeTypeId));
    if (!t || !t.data || !Array.isArray(t.data.recipes)) return null;
    return t.data.recipes.find(x => String(x.id) === String(recipeId)) || null;
}

function RecipeManagerGetOrCreateRecipeEditModal() {
    let modal = document.getElementById("RMRecipeEditModal");
    if (modal) return modal;
    RecipeManagerAppendModalFromTemplateId("RecipeManagerTplRMRecipeEditModal");
    return document.getElementById("RMRecipeEditModal");
}

function RecipeManagerOpenRecipeMetadataModal(obj, state, typeId, setId) {
    const recipe = RecipeManagerFindRecipe(state, typeId, setId);
    if (!recipe) return;
    const modal = RecipeManagerGetOrCreateRecipeEditModal();
    RecipeManagerApplyThemeToModalElement(modal);
    const nameInput = modal.querySelector("#RMRecipeEditName");
    const descInput = modal.querySelector("#RMRecipeEditDescription");
    const msg = modal.querySelector("#RMRecipeEditMessage");
    const saveBtn = modal.querySelector("#RMRecipeEditSave");
    nameInput.value = recipe.name || "";
    descInput.value = recipe.description || "";
    msg.textContent = "";

    saveBtn.onclick = async function () {
        const name = (nameInput.value || "").trim();
        const description = (descInput.value || "").trim();
        if (!name) {
            msg.textContent = "Name is required.";
            return;
        }
        const resolveRecipe = RecipeManagerFindRecipe(RecipeManagerGetStateModel() || state, typeId, setId) || recipe;
        const payloadParameters = (resolveRecipe.parameters || []).map(function (p) {
            return { name: (p.name || "").trim(), value: p.value != null ? String(p.value) : "" };
        }).filter(function (p) { return p.name !== ""; });
        try {
            const response = await RM_SaveRecipe({
                recipeTypeId: parseInt(String(typeId), 10),
                id: setId,
                name: name,
                description: description,
                parameters: payloadParameters
            });
            if (response && (response.success === false || response.Success === false)) {
                msg.textContent = (response && (response.message || response.Message)) || "Save failed.";
                return;
            }
            RecipeManagerSaveSuccessConfirm();
            bootstrap.Modal.getOrCreateInstance(modal).hide();
            RecipeManagerSetSelectedRecipe(obj, RecipeManagerSelectedRecipeId(obj), name, description);
            await RecipeManagerRefreshUiFromServer(obj);
        } catch (err) {
            msg.textContent = (err && err.message) ? err.message : "Save failed.";
        }
    };
    bootstrap.Modal.getOrCreateInstance(modal).show();
    setTimeout(function () { nameInput.focus(); }, 50);
}

function RecipeManagerGetOrCreateMoveRecipeTypeModal() {
    let modal = document.getElementById("RMSelectRecipeTypeModal");
    if (modal) return modal;
    RecipeManagerAppendModalFromTemplateId("RecipeManagerTplRMSelectRecipeTypeModal");
    return document.getElementById("RMSelectRecipeTypeModal");
}

function RecipeManagerOpenMoveRecipeTypeModal(obj, state, sourceTypeId, recipeId) {
    const modal = RecipeManagerGetOrCreateMoveRecipeTypeModal();
    RecipeManagerApplyThemeToModalElement(modal);
    const tbody = document.getElementById("RMSelectRecipeTypeRows");
    if (!tbody) return;
    tbody.innerHTML = "";
    (state.recipeTypes || []).forEach(function (t) {
        const tr = RecipeManagerCloneTemplateElement("RecipeManagerTplMoveTypeRow", "tr");
        if (!tr) {
            return;
        }
        const nameTd = tr.querySelector(".rm-movetype-name");
        const descTd = tr.querySelector(".rm-movetype-desc");
        const btn = tr.querySelector(".rm-movetype-select");
        if (nameTd) nameTd.textContent = t.name || "";
        if (descTd) descTd.textContent = t.description || "";
        if (btn) btn.onclick = async function (e) {
            e.stopPropagation();
            if (String(t.id) === String(sourceTypeId)) {
                bootstrap.Modal.getOrCreateInstance(modal).hide();
                return;
            }
            try {
                const response = await RM_MoveRecipe({
                    sourceRecipeTypeId: sourceTypeId,
                    recipeId: recipeId,
                    destinationRecipeTypeId: t.id
                });
                if (!response || response.success === false || response.Success === false) {
                    const m = (response && (response.message || response.Message)) || "Change type failed.";
                    document.getElementById("CustomModalText").textContent = m;
                    new bootstrap.Modal(document.getElementById("CustomModal")).show();
                    return;
                }
                RecipeManagerSaveSuccessConfirm();
                bootstrap.Modal.getOrCreateInstance(modal).hide();
                RecipeManagerSetSelectedTypeId(obj, String(t.id));
                await RecipeManagerRefreshUiFromServer(obj);
            } catch (e2) {
                document.getElementById("CustomModalText").textContent = "Change type failed.";
                new bootstrap.Modal(document.getElementById("CustomModal")).show();
            }
        };
        tbody.appendChild(tr);
    });
    bootstrap.Modal.getOrCreateInstance(modal).show();
}

function RecipeManagerGetOrCreateTypeEditorModal() {
    let modal = document.getElementById("RMTypeEditorModal");
    if (modal) return modal;
    RecipeManagerAppendModalFromTemplateId("RecipeManagerTplRMTypeEditorModal");
    return document.getElementById("RMTypeEditorModal");
}

function RecipeManagerGetOrCreateRecipeTypeFormModal() {
    let modal = document.getElementById("RMTypeFormModal");
    if (modal) return modal;
    RecipeManagerAppendModalFromTemplateId("RecipeManagerTplRMTypeFormModal");
    return document.getElementById("RMTypeFormModal");
}

function RecipeManagerOpenRecipeTypeFormModal(mode, initialData, onSave) {
    const modal = RecipeManagerGetOrCreateRecipeTypeFormModal();
    RecipeManagerApplyThemeToModalElement(modal);
    const title = modal.querySelector("#RMTypeFormTitle");
    const idInput = modal.querySelector("#RMTypeFormId");
    const nameInput = modal.querySelector("#RMTypeFormName");
    const descInput = modal.querySelector("#RMTypeFormDescription");
    const msg = modal.querySelector("#RMTypeFormMessage");
    const saveBtn = modal.querySelector("#RMTypeFormSave");

    title.textContent = mode === "edit" ? "Edit Recipe Type" : "Add Recipe Type";
    idInput.value = initialData && initialData.id ? String(initialData.id) : "";
    nameInput.value = (initialData && initialData.name) || "";
    descInput.value = (initialData && initialData.description) || "";
    msg.textContent = "";

    saveBtn.onclick = function () {
        const name = (nameInput.value || "").trim();
        const description = (descInput.value || "").trim();
        if (!name) {
            msg.textContent = "Name is required.";
            return;
        }
        const payload = {
            id: idInput.value ? parseInt(idInput.value) : null,
            name: name,
            description: description
        };
        onSave(payload, function (errorMessage) {
            if (errorMessage) {
                msg.textContent = errorMessage;
                return;
            }
            bootstrap.Modal.getOrCreateInstance(modal).hide();
        });
    };

    bootstrap.Modal.getOrCreateInstance(modal).show();
    setTimeout(function () { nameInput.focus(); }, 50);
}

function RecipeManagerGetOrCreateLinkTargetsModal() {
    let modal = document.getElementById("RMLinkTargetsModal");
    if (modal) return modal;
    RecipeManagerAppendModalFromTemplateId("RecipeManagerTplRMLinkTargetsModal");
    return document.getElementById("RMLinkTargetsModal");
}

function RecipeManagerOpenTargetLinksModal(obj, state) {
    RecipeManagerSetThemedRootRef(obj);
    const modal = RecipeManagerGetOrCreateLinkTargetsModal();
    if (!modal) return;
    RecipeManagerApplyThemeToModalElement(modal, obj);

    const rows = modal.querySelector("#RMLinkTargetsRows");
    const msg = modal.querySelector("#RMLinkTargetsMessage");
    const importFile = modal.querySelector("#RMLinkTargetsImportFile");
    const importBtn = modal.querySelector("#RMLinkTargetsImportCsv");
    const exportBtn = modal.querySelector("#RMLinkTargetsExportCsv");
    const delimiter = (state && state.csvDelimiter) ? String(state.csvDelimiter) : ";";
    const types = (state.recipeTypes || []);
    const targets = (state.targets || []);
    rows.innerHTML = "";
    targets.forEach(function (target) {
        const currentType = types.find(function (t) { return t.name === (target.recipeTypeName || ""); });
        const tr = RecipeManagerCloneTemplateElement("RecipeManagerTplLinkTargetRow", "tr");
        if (!tr) {
            return;
        }
        const nameTd = tr.querySelector(".rm-linktarget-name");
        const select = tr.querySelector("select.rm-linktarget-select");
        if (nameTd) {
            nameTd.textContent = target.targetName || "";
        }
        if (select) {
            select.innerHTML = "";
            const blank = RecipeManagerCreateOption("", "Not linked");
            if (blank) select.appendChild(blank);
            types.forEach(function (t) {
                const o = RecipeManagerCreateOption(String(t.id), t.name || "");
                if (o) select.appendChild(o);
            });
            select.value = currentType ? String(currentType.id) : "";
        }
        tr.setAttribute("data-target", target.targetName || "");
        rows.appendChild(tr);
    });

    if (importBtn && importFile) {
        importBtn.onclick = function () {
            msg.textContent = "";
            importFile.click();
        };

        importFile.onchange = function () {
            const file = this.files && this.files.length > 0 ? this.files[0] : null;
            if (!file) {
                this.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function () {
                try {
                    const text = String(reader.result || "");
                    const rowMap = new Map();
                    Array.from(rows.querySelectorAll("tr")).forEach(function (row) {
                        const targetName = (row.getAttribute("data-target") || "").trim();
                        if (targetName) {
                            rowMap.set(targetName, row);
                        }
                    });

                    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
                    let headerRead = false;
                    let applied = 0;

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (!line || !line.trim()) {
                            continue;
                        }
                        if (!headerRead && line.toLowerCase().startsWith("sep=")) {
                            continue;
                        }

                        const columns = RecipeManagerParseDelimitedLine(line, delimiter);
                        if (!headerRead) {
                            if (columns.length < 2 ||
                                String(columns[0] || "").trim().toLowerCase() !== "targetname" ||
                                String(columns[1] || "").trim().toLowerCase() !== "recipetypename") {
                                throw new Error("Invalid CSV header. Expected TargetName and RecipeTypeName.");
                            }
                            headerRead = true;
                            continue;
                        }

                        const targetName = String(columns[0] || "").trim();
                        const recipeTypeName = String(columns[1] || "").trim();
                        if (!targetName) {
                            continue;
                        }

                        const row = rowMap.get(targetName);
                        if (!row) {
                            throw new Error("Unknown target: " + targetName);
                        }

                        const select = row.querySelector("select.rm-linktarget-select");
                        if (!select) {
                            continue;
                        }

                        if (!recipeTypeName) {
                            select.value = "";
                            applied++;
                            continue;
                        }

                        const recipeType = types.find(function (t) { return (t.name || "") === recipeTypeName; });
                        if (!recipeType) {
                            throw new Error("Unknown recipe type: " + recipeTypeName);
                    }

                        select.value = String(recipeType.id);
                        applied++;
                    }

                    if (!headerRead) {
                        throw new Error("CSV header was not found.");
                    }

                    msg.textContent = applied > 0
                        ? "CSV imported. Click Save to apply the changes."
                        : "CSV imported, but no target links were changed.";
                } catch (err) {
                    msg.textContent = (err && err.message) ? err.message : "Failed to import target links.";
                }
            };
            reader.onerror = function () {
                msg.textContent = "Failed to read CSV file.";
            };
            reader.readAsText(file);
            this.value = "";
        };
    }

    if (exportBtn) {
        exportBtn.onclick = function () {
            msg.textContent = "";
            const lines = [];
            lines.push("sep=" + delimiter);
            lines.push(RecipeManagerEscapeDelimitedValue("TargetName", delimiter) + delimiter + RecipeManagerEscapeDelimitedValue("RecipeTypeName", delimiter));

            Array.from(rows.querySelectorAll("tr")).forEach(function (row) {
                const targetName = (row.getAttribute("data-target") || "").trim();
                if (!targetName) {
                    return;
                }
                const select = row.querySelector("select.rm-linktarget-select");
                const selectedOption = select ? select.options[select.selectedIndex] : null;
                const recipeTypeName = selectedOption && select.value ? (selectedOption.text || "") : "";
                lines.push(RecipeManagerEscapeDelimitedValue(targetName, delimiter) + delimiter + RecipeManagerEscapeDelimitedValue(recipeTypeName, delimiter));
            });

            RecipeManagerDownloadTextFile(
                "RecipeTargetLinks - " + new Date().toISOString().slice(0, 19).replace(/:/g, "-") + ".csv",
                lines.join("\r\n"),
                "text/csv;charset=utf-8"
            );
        };
    }

    modal.querySelector("#RMLinkTargetsSave").onclick = async function () {
        msg.textContent = "";
        const links = [];
        Array.from(rows.querySelectorAll("tr")).forEach(function (row) {
            const targetName = (row.getAttribute("data-target") || "").trim();
            if (!targetName) {
                return;
            }
            const selectedTypeId = parseInt((row.querySelector("select") || {}).value || "0", 10);
            links.push({ targetName: targetName, recipeTypeId: selectedTypeId });
        });
        try {
            const response = await RM_SaveTargetLinksBatch({ links: links });
            if (!response || response.Success === false || response.success === false) {
                msg.textContent = (response && (response.Message || response.message)) || "Failed to save target links.";
                return;
            }
            RecipeManagerSaveSuccessConfirm();
            await RecipeManagerRefreshUiFromServer(obj);
            bootstrap.Modal.getOrCreateInstance(modal).hide();
        } catch {
            msg.textContent = "Failed to save target links.";
        }
    };

    bootstrap.Modal.getOrCreateInstance(modal).show();
}

function RecipeManagerOpenRecipeTypesModal(obj) {
    RecipeManagerSetThemedRootRef(obj);
    (async function () {
        const state = await RecipeManagerGetState();
        if (!state) return;
        const modal = RecipeManagerGetOrCreateTypeEditorModal();
        RecipeManagerApplyThemeToModalElement(modal, obj);
        const rows = modal.querySelector("#RMTypeEditorRows");
        const msg = modal.querySelector("#RMTypeEditorMessage");
        const importFile = modal.querySelector("#RMTypeEditorImportFile");
        const importBtn = modal.querySelector("#RMTypeEditorImportCsv");
        const exportBtn = modal.querySelector("#RMTypeEditorExportCsv");
        const delimiter = (state && state.csvDelimiter) ? String(state.csvDelimiter) : ";";
        const renderRows = function (currentState) {
            rows.innerHTML = "";
            const types = currentState && Array.isArray(currentState.recipeTypes) ? currentState.recipeTypes : [];
            types.forEach(function (recipeType) {
                const tr = RecipeManagerCloneTemplateElement("RecipeManagerTplTypeEditorRow", "tr");
                if (!tr) {
                    return;
                }

                const nameTd = tr.querySelector(".rm-typeeditor-name");
                const descTd = tr.querySelector(".rm-typeeditor-desc");
                if (nameTd) nameTd.textContent = recipeType.name || "";
                if (descTd) descTd.textContent = recipeType.description || "";

                const editBtn = tr.querySelector(".rm-type-edit");
                if (editBtn) editBtn.onclick = function () {
                    RecipeManagerOpenRecipeTypeFormModal("edit", {
                        id: recipeType.id,
                        name: recipeType.name || "",
                        description: recipeType.description || ""
                    }, function (payload, done) {
                        (async function () {
                            try {
                                const response = await RM_SaveRecipeType(payload);
                                if (response && response.success === false) {
                                    done(response.message || "Save failed.");
                                    return;
                                }
                                RecipeManagerSaveSuccessConfirm();
                                const freshState = await RecipeManagerGetState();
                                if (!freshState) {
                                    done("Failed to refresh state.");
                                    return;
                                }
                                // Keep the currently selected type stable; editing a type shouldn’t auto-select it.
                                RecipeManagerRenderUiFromState(obj, freshState);
                                renderRows(freshState);
                                msg.textContent = "Saved.";
                                done("");
                            } catch {
                                done("Save failed.");
                            }
                        })();
                    });
                };

                const deleteBtn = tr.querySelector(".rm-type-delete");
                if (deleteBtn) deleteBtn.onclick = function () {
                    RecipeManagerOpenConfirmDialog("Delete Recipe Type", "Are you sure you want to delete this recipe type?", "Delete", function () {
                        (async function () {
                            try {
                                const response = await RM_DeleteRecipeType({ id: recipeType.id });
                                if (response && response.success === false) {
                                    msg.textContent = response.message || "Delete failed.";
                                    return;
                                }
                                RecipeManagerSaveSuccessConfirm();
                                const freshState = await RecipeManagerGetState();
                                if (!freshState) return;
                                if (String(RecipeManagerSelectedTypeId(obj) || "") === String(recipeType.id)) {
                                    RecipeManagerClearAllSelection(obj);
                                }
                                RecipeManagerRenderUiFromState(obj, freshState);
                                renderRows(freshState);
                                msg.textContent = "Deleted.";
                            } catch {
                                msg.textContent = "Delete failed.";
                            }
                        })();
                    });
                };
                rows.appendChild(tr);
            });
        };

        if (importBtn && importFile) {
            importBtn.onclick = function () {
                msg.textContent = "";
                importFile.click();
            };

            importFile.onchange = function () {
                const file = this.files && this.files.length > 0 ? this.files[0] : null;
                if (!file) {
                    this.value = "";
                    return;
                }

                const reader = new FileReader();
                reader.onload = function () {
                    try {
                        const text = String(reader.result || "");
                        const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
                        let headerRead = false;
                        const importedTypes = [];

                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            if (!line || !line.trim()) {
                                continue;
                            }
                            if (!headerRead && line.toLowerCase().startsWith("sep=")) {
                                continue;
                            }

                            const columns = RecipeManagerParseDelimitedLine(line, delimiter);
                            if (!headerRead) {
                                if (columns.length < 2 ||
                                    String(columns[0] || "").trim().toLowerCase() !== "name" ||
                                    String(columns[1] || "").trim().toLowerCase() !== "description") {
                                    throw new Error("Invalid CSV header. Expected Name and Description.");
                                }
                                headerRead = true;
                                continue;
                            }

                            const name = String(columns[0] || "").trim();
                            const description = String(columns[1] || "").trim();
                            if (!name) {
                                continue;
                            }

                            importedTypes.push({ name: name, description: description });
                        }

                        if (!headerRead) {
                            throw new Error("CSV header was not found.");
                        }
                        if (!importedTypes.length) {
                            throw new Error("CSV contains no recipe types.");
                        }

                        (async function () {
                            try {
                                const currentState = await RecipeManagerGetState();
                                if (!currentState) {
                                    msg.textContent = "Failed to refresh state.";
                                    return;
                                }

                                const existingByName = new Map();
                                (currentState.recipeTypes || []).forEach(function (recipeType) {
                                    const key = (recipeType.name || "").trim();
                                    if (key) {
                                        existingByName.set(key, recipeType);
                                    }
                                });

                                for (let i = 0; i < importedTypes.length; i++) {
                                    const importedType = importedTypes[i];
                                    const existing = existingByName.get(importedType.name);
                                    const payload = {
                                        id: existing ? parseInt(existing.id, 10) : null,
                                        name: importedType.name,
                                        description: importedType.description
                                    };

                                    const response = await RM_SaveRecipeType(payload);
                                    if (response && (response.success === false || response.Success === false)) {
                                        throw new Error((response && (response.message || response.Message)) || ("Failed to save recipe type: " + importedType.name));
                                    }
                                }

                                RecipeManagerSaveSuccessConfirm();
                                const freshState = await RecipeManagerGetState();
                                if (!freshState) {
                                    msg.textContent = "Failed to refresh state.";
                                    return;
                                }
                                RecipeManagerRenderUiFromState(obj, freshState);
                                renderRows(freshState);
                                msg.textContent = "CSV imported.";
                            } catch (err2) {
                                msg.textContent = (err2 && err2.message) ? err2.message : "Failed to import recipe types.";
                            }
                        })();
                    } catch (err) {
                        msg.textContent = (err && err.message) ? err.message : "Failed to import recipe types.";
                    }
                };
                reader.onerror = function () {
                    msg.textContent = "Failed to read CSV file.";
                };
                reader.readAsText(file);
                this.value = "";
            };
        }

        if (exportBtn) {
            exportBtn.onclick = function () {
                msg.textContent = "";
                const lines = [];
                lines.push("sep=" + delimiter);
                lines.push(RecipeManagerEscapeDelimitedValue("Name", delimiter) + delimiter + RecipeManagerEscapeDelimitedValue("Description", delimiter));

                Array.from(rows.querySelectorAll("tr")).forEach(function (row) {
                    const name = String((row.querySelector(".rm-typeeditor-name") || {}).textContent || "").trim();
                    const description = String((row.querySelector(".rm-typeeditor-desc") || {}).textContent || "").trim();
                    if (!name) {
                        return;
                    }
                    lines.push(RecipeManagerEscapeDelimitedValue(name, delimiter) + delimiter + RecipeManagerEscapeDelimitedValue(description, delimiter));
                });

                RecipeManagerDownloadTextFile(
                    "RecipeTypes - " + new Date().toISOString().slice(0, 19).replace(/:/g, "-") + ".csv",
                    lines.join("\r\n"),
                    "text/csv;charset=utf-8"
                );
            };
        }

        modal.querySelector("#RMTypeEditorNew").onclick = function () {
            RecipeManagerOpenRecipeTypeFormModal("add", { id: "", name: "", description: "" }, function (payload, done) {
                (async function () {
                    try {
                        const response = await RM_SaveRecipeType(payload);
                        if (response && response.success === false) {
                            done(response.message || "Save failed.");
                            return;
                        }
                        RecipeManagerSaveSuccessConfirm();
                        const freshState = await RecipeManagerGetState();
                        if (!freshState) {
                            done("Failed to refresh state.");
                            return;
                        }
                        RecipeManagerRenderUiFromState(obj, freshState);
                        renderRows(freshState);
                        msg.textContent = "Saved.";
                        done("");
                    } catch {
                        done("Save failed.");
                    }
                })();
            });
        };

        modal.querySelector("#RMTypeEditorLinkTargets").onclick = function () {
            (async function () {
                const freshState = await RecipeManagerGetState();
                if (!freshState) return;
                RecipeManagerOpenTargetLinksModal(obj, freshState);
            })();
        };

        renderRows(state);
        bootstrap.Modal.getOrCreateInstance(modal).show();
    })();
}

function RecipeManagerGetOrCreateAddRecipeModal() {
    let modal = document.getElementById("RMAddSetModal");
    if (modal) return modal;
    RecipeManagerAppendModalFromTemplateId("RecipeManagerTplRMAddSetModal");
    return document.getElementById("RMAddSetModal");
}

function RecipeManagerOpenAddRecipeModal(obj) {
    RecipeManagerSetThemedRootRef(obj);
    (async function () {
        const state = await RecipeManagerGetState();
        if (!state || !Array.isArray(state.recipeTypes) || state.recipeTypes.length === 0) {
            document.getElementById("CustomModalText").textContent = "Create a Recipe Type first.";
            new bootstrap.Modal(document.getElementById('CustomModal')).show();
            return;
        }
        const modal = RecipeManagerGetOrCreateAddRecipeModal();
        RecipeManagerApplyThemeToModalElement(modal, obj);
        const nameInput = modal.querySelector("#RMAddSetName");
        const descInput = modal.querySelector("#RMAddSetDescription");
        const typeSelect = modal.querySelector("#RMAddSetType");
        const msg = modal.querySelector("#RMAddSetMessage");
        msg.textContent = "";
        nameInput.value = "";
        descInput.value = "";
        typeSelect.innerHTML = "";
        state.recipeTypes.forEach(function (t) {
            const o = RecipeManagerCreateOption(String(t.id), t.name || "");
            if (o) {
                typeSelect.appendChild(o);
            }
        });
        const preferredType = RecipeManagerSelectedTypeId(obj) || "";
        if (preferredType && state.recipeTypes.some(function (t) { return String(t.id) === String(preferredType); })) {
            typeSelect.value = preferredType;
        } else {
            typeSelect.value = String(state.recipeTypes[0].id);
        }

        modal.querySelector("#RMAddSetSave").onclick = async function () {
            const recipeName = (nameInput.value || "").trim();
            const recipeDescription = (descInput.value || "").trim();
            const recipeTypeId = parseInt(typeSelect.value || "0");
            if (!recipeName) {
                msg.textContent = "Recipe name is required.";
                return;
            }
            if (!recipeTypeId) {
                msg.textContent = "Recipe type is required.";
                return;
            }
            try {
                const response = await RM_SaveRecipe({
                    recipeTypeId: recipeTypeId,
                    id: "",
                    name: recipeName,
                    description: recipeDescription,
                    parameters: []
                });
                if (response && response.success === false) {
                    msg.textContent = response.message || "Save failed.";
                    return;
                }
                RecipeManagerSaveSuccessConfirm();
                bootstrap.Modal.getOrCreateInstance(modal).hide();
                const freshState = await RecipeManagerGetState();
                if (!freshState) return;
                RecipeManagerSetSelectedTypeId(obj, String(recipeTypeId));
                RecipeManagerSetSelectedTarget(obj, "");
                if (response && response.recipeId) {
                    RecipeManagerSetSelectedRecipe(obj, response.recipeId, recipeName, recipeDescription);
                }
                RecipeManagerRenderUiFromState(obj, freshState);
            } catch {
                msg.textContent = "Save failed.";
            }
        };

        bootstrap.Modal.getOrCreateInstance(modal).show();
        setTimeout(function () { nameInput.focus(); }, 50);
    })();
}

/**
 * The client-side Recipe Manager data model (types, recipes, targets, etc.), or null if not loaded.
 */
function RecipeManagerGetStateModel() {
    return recipeManagerState;
}

function RecipeManagerUpdateStateParameterValue(typeId, recipeId, parameterName, value, typeUpdatedUtc) {
    if (!recipeManagerState || !Array.isArray(recipeManagerState.recipeTypes)) {
        return;
    }
    const t = (recipeManagerState.recipeTypes || []).find(x => String(x.id) === String(typeId));
    if (!t || !t.data || !Array.isArray(t.data.recipes)) {
        return;
    }
    const r = t.data.recipes.find(x => String(x.id) === String(recipeId));
    if (!r || !r.parameters) {
        return;
    }
    const nameKey = (parameterName || "").trim();
    const p = r.parameters.find(x => (x.name || "").trim() === nameKey);
    if (p) {
        p.value = value != null ? String(value) : "";
    }
    if (typeUpdatedUtc) {
        t.updatedUtc = typeUpdatedUtc;
    }
}

async function RecipeManagerSaveSingleParameterValue(obj, parameterName, value, onDone) {
    const typeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
    const setId = RecipeManagerSelectedRecipeId(obj) || "";
    if (!typeId || !setId) {
        if (onDone) onDone(false);
        return;
    }
    const n = (parameterName || "").trim();
    if (!n) {
        if (onDone) onDone(false);
        return;
    }
    try {
        const response = await RM_SaveRecipeParameter({
            recipeTypeId: typeId,
            recipeId: setId,
            parameterName: n,
            value: value != null ? String(value) : ""
        });
        if (!response || response.success === false) {
            const err = (response && response.message) || "Parameter save failed.";
            document.getElementById("CustomModalText").textContent = err;
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            if (onDone) onDone(false);
            return;
        }
        RecipeManagerSaveSuccessConfirm();
        RecipeManagerUpdateStateParameterValue(typeId, setId, n, value, response.updatedUtc);
        if (onDone) onDone(true);
    } catch {
        document.getElementById("CustomModalText").textContent = "Parameter save failed. Please try again.";
        new bootstrap.Modal(document.getElementById("CustomModal")).show();
        if (onDone) onDone(false);
    }
}

/**
 * Always fetches the latest Recipe Manager state from the server and updates the in-memory model.
 */
async function RecipeManagerGetState() {
    try {
        const response = await RM_GetState();
        if (!response || response.success === false || !Array.isArray(response.recipeTypes)) {
            recipeManagerState = null;
            const msg = response && response.message ? response.message : "Failed to load Recipe Manager state.";
            document.getElementById("CustomModalText").textContent = msg;
            new bootstrap.Modal(document.getElementById('CustomModal')).show();
            return null;
        }
        recipeManagerState = response;
        RecipeManagerLastStateSyncSignature = RecipeManagerBuildStateSyncSignature(response);
        return recipeManagerState;
    } catch {
        recipeManagerState = null;
        document.getElementById("CustomModalText").textContent = "Failed to load Recipe Manager state.";
        new bootstrap.Modal(document.getElementById('CustomModal')).show();
        return null;
    }
}

async function RecipeManagerGetStateForExecuteQuery() {
    try {
        const response = await RM_GetState();
        if (!response || response.success === false || !Array.isArray(response.recipeTypes)) {
            return null;
        }
        recipeManagerState = response;
        RecipeManagerLastStateSyncSignature = RecipeManagerBuildStateSyncSignature(response);
        return recipeManagerState;
    } catch {
        return null;
    }
}

async function RecipeManagerRefreshUiFromServer(obj) {
    const state = await RecipeManagerGetState();
    if (state) {
        RecipeManagerRenderUiFromState(obj, state);
    }
    return state;
}

/**
 * Background sync used by `executeQuery` after the Recipe Manager is initialized.
 * Keeps `recipeManagerState` fresh and updates only the minimal UI parts
 * without rebuilding the parameter table tbody or stealing focus from `.rm-recipe-value` inputs.
 */
async function RecipeManagerSyncFromExecuteQuery(obj) {
    if (!obj) return;

    // Out-of-order guard for async state loads.
    obj.__rmSyncGeneration = (obj.__rmSyncGeneration || 0) + 1;
    const gen = obj.__rmSyncGeneration;

    const normalizeName = RecipeManagerNormalizeParameterName;

    const clearSelectedRecipe = function () {
        RecipeManagerClearSelectedRecipe(obj);
    };

    const getSelectedRecipeFromState = function (state) {
        const selectedTypeId = RecipeManagerSelectedTypeId(obj) || "";
        const selectedSetId = RecipeManagerSelectedRecipeId(obj) || "";
        if (!selectedTypeId || !selectedSetId) return null;
        const type = (state.recipeTypes || []).find(x => String(x.id) === String(selectedTypeId));
        if (!type) return null;
        const set = type.data && Array.isArray(type.data.recipes)
            ? type.data.recipes.find(x => String(x.id) === String(selectedSetId))
            : null;
        if (!set) return null;
        return { type: type, recipe: set };
    };

    const isRecipeValueFocusedWithin = function () {
        const active = document.activeElement;
        return !!(active && active.classList && active.classList.contains("rm-recipe-value") && obj.contains(active));
    };

    const patchTypeFilter = function (state) {
        const selectedTypeId = RecipeManagerSelectedTypeId(obj) || "";
        const selectedTarget = RecipeManagerSelectedTarget(obj) || "";
        return RecipeManagerRenderTypeFilter(obj, state, selectedTypeId, selectedTarget) || "";
    };

    const patchRecipeList = function (state, resolvedTypeId) {
        const setTbody = obj.querySelector(".rm-recipe-tbody");
        if (!setTbody) return;
        const visibleSets = RecipeManagerListVisibleRecipes(state, resolvedTypeId || "");
        RecipeManagerRenderRecipeList(obj, state, setTbody, visibleSets);
    };

    const buildParameterRow = function (name, value) {
        const tpl = document.getElementById("RecipeManagerTplParameterRow");
        if (!tpl || !tpl.content) {
            return null;
        }
        const tr = document.importNode(tpl.content, true).querySelector("tr");
        if (!tr) return null;

        const nameCell = tr.querySelector(".rm-param-name-cell");
        if (nameCell) nameCell.textContent = name;

        const valueInput = tr.querySelector(".rm-recipe-value");
        if (valueInput) {
            valueInput.value = value || "";
            valueInput.addEventListener("blur", function () {
                RecipeManagerSaveSingleParameterValue(obj, name, (this.value || ""), function () { });
            });
        }

        const delBtn = tr.querySelector(".rm-delete-param");
        if (delBtn) {
            delBtn.addEventListener("click", function () {
                RecipeManagerDeleteRecipeParameter(obj, name);
            });
        }
        return tr;
    };

    const patchSelectedRecipeValuesOnly = function (state) {
        const tbody = obj.querySelector(".rm-parameter-table tbody");
        if (!tbody) return;

        const sel = getSelectedRecipeFromState(state);
        if (!sel) {
            clearSelectedRecipe();
            tbody.innerHTML = "";
            return;
        }

        const focusedInTable = isRecipeValueFocusedWithin();
        const serverParams = (sel.recipe.parameters || []).map(function (p) {
            return { name: normalizeName(p.name), value: p.value != null ? String(p.value) : "" };
        }).filter(function (p) { return p.name !== ""; });

        const desiredNameSet = new Set(serverParams.map(function (p) { return p.name; }));
        const existingRows = Array.from(tbody.querySelectorAll("tr"));
        const rowByName = new Map();
        existingRows.forEach(function (tr) {
            const nameCell = tr.querySelector(".rm-param-name-cell");
            const name = normalizeName(nameCell ? nameCell.textContent : "");
            if (name) rowByName.set(name, tr);
        });

        // Update values in-place (no tbody rebuild, no focus stealing).
        serverParams.forEach(function (p) {
            const tr = rowByName.get(p.name);
            if (!tr) return;
            const input = tr.querySelector(".rm-recipe-value");
            if (!input || input.hasAttribute("readonly")) return;
            if (document.activeElement === input) return;
            const nextVal = p.value != null ? String(p.value) : "";
            if ((input.value || "") !== nextVal) input.value = nextVal;
        });

        // If user is editing, do not insert/remove/reorder rows.
        if (focusedInTable) return;

        serverParams.forEach(function (p) {
            if (rowByName.has(p.name)) return;
            const tr = buildParameterRow(p.name, p.value);
            if (tr) {
                tbody.appendChild(tr);
            }
        });

        existingRows.forEach(function (tr) {
            const nameCell = tr.querySelector(".rm-param-name-cell");
            const name = normalizeName(nameCell ? nameCell.textContent : "");
            if (name && !desiredNameSet.has(name)) tr.remove();
        });

        const rowsNow = Array.from(tbody.querySelectorAll("tr"));
        rowsNow.sort(function (a, b) {
            const an = normalizeName((a.querySelector(".rm-param-name-cell") || {}).textContent);
            const bn = normalizeName((b.querySelector(".rm-param-name-cell") || {}).textContent);
            return an.localeCompare(bn);
        });
        rowsNow.forEach(function (tr) { tbody.appendChild(tr); });
    };

    const patchTargetSelectAndLayout = function (state, resolvedTypeId) {
        const topToolbar = obj.querySelector(".rm-top-toolbar");
        const targetSelect = obj.querySelector(".rm-target-select");
        const parameterTableWrap = obj.querySelector(".rm-parameter-table-wrap");
        const actionRow = obj.querySelector(".rm-action-row");
        const emptyState = obj.querySelector(".rm-empty-state");
        if (!topToolbar || !targetSelect || !parameterTableWrap || !actionRow || !emptyState) return;
        RecipeManagerRenderTargetAndLayout(obj, state, resolvedTypeId || "", topToolbar, targetSelect, parameterTableWrap, actionRow, emptyState);
    };

    const state = await RecipeManagerGetStateForExecuteQuery();
    if (!state) return;
    if (obj.__rmSyncGeneration !== gen) return;

    const nextSig = RecipeManagerLastStateSyncSignature || RecipeManagerBuildStateSyncSignature(state);
    if (obj.__rmLastAppliedSignature && obj.__rmLastAppliedSignature === nextSig) return;

    RecipeManagerRenderAdminOnlyControls(obj, state.isAdmin === true);
    const resolvedTypeId = patchTypeFilter(state);
    patchRecipeList(state, resolvedTypeId);
    patchSelectedRecipeValuesOnly(state);
    patchTargetSelectAndLayout(state, resolvedTypeId);

    obj.__rmLastAppliedSignature = nextSig;
}

function RecipeManagerApplyThemeVariables(obj) {
    if (!obj) return;

    const bg = RecipeManagerReadThemeAttribute(obj, "data-system-theme-bg", "bg");
    const text = RecipeManagerReadThemeAttribute(obj, "data-system-theme-text", "text");
    const frameBg = RecipeManagerReadThemeAttribute(obj, "data-system-theme-frame-bg", "frameBg");
    const objectBorder = RecipeManagerReadThemeAttribute(obj, "data-system-theme-object-border", "objectBorder");
    const border = RecipeManagerReadThemeAttribute(obj, "data-system-theme-border", "border");
    const tableBorder = RecipeManagerReadThemeAttribute(obj, "data-system-theme-table-border", "tableBorder");
    const checkboxBg = RecipeManagerReadThemeAttribute(obj, "data-system-theme-checkbox-bg", "checkboxBg");
    const checkboxBorder = RecipeManagerReadThemeAttribute(obj, "data-system-theme-checkbox-border", "checkboxBorder");
    const checkboxCheckedBg = RecipeManagerReadThemeAttribute(obj, "data-system-theme-checkbox-checked-bg", "checkboxCheckedBg");
    const buttonBorder = RecipeManagerReadThemeAttribute(obj, "data-system-theme-button-border", "buttonBorder");
    const btnBg = RecipeManagerReadThemeAttribute(obj, "data-system-theme-button-bg", "buttonBg");
    const btnText = RecipeManagerReadThemeAttribute(obj, "data-system-theme-button-text", "buttonText");
    const btnHoverBg = RecipeManagerReadThemeAttribute(obj, "data-system-theme-button-hover-bg", "buttonHoverBg");
    const btnHoverText = RecipeManagerReadThemeAttribute(obj, "data-system-theme-button-hover-text", "buttonHoverText");
    const selectedBg = RecipeManagerReadThemeAttribute(obj, "data-system-theme-selected-bg", "selectedBg");
    const selectedText = RecipeManagerReadThemeAttribute(obj, "data-system-theme-selected-text", "selectedText");

    const setOrClear = function (name, value) {
        if (value && value.trim() !== "") {
            obj.style.setProperty(name, value);
        } else {
            obj.style.removeProperty(name);
        }
    };

    setOrClear("--RMBackground", bg);
    setOrClear("--RMText", text);
    setOrClear("--RMFrameBackground", frameBg);
    setOrClear("--RMDropdownBackground", frameBg);
    setOrClear("--RMTableBackground", frameBg);
    setOrClear("--RMObjectBorder", objectBorder);
    setOrClear("--RMBorder", border);
    setOrClear("--RMTableBorder", tableBorder);
    setOrClear("--RMCheckboxBackground", checkboxBg);
    setOrClear("--RMCheckboxBorder", checkboxBorder);
    setOrClear("--RMCheckboxCheckedBackground", checkboxCheckedBg);
    setOrClear("--RMButtonBorder", buttonBorder);
    setOrClear("--RMButtonBg", btnBg);
    setOrClear("--RMButtonText", btnText);
    setOrClear("--RMButtonHoverBg", btnHoverBg);
    setOrClear("--RMButtonHoverText", btnHoverText);
    setOrClear("--RMSelectedBg", selectedBg);
    setOrClear("--RMSelectedText", selectedText);

    // Locally map Bootstrap variables so RM's Bootstrap controls follow RM theme.
    obj.style.setProperty("--bs-body-bg", "var(--RMBackground)");
    obj.style.setProperty("--bs-body-color", "var(--RMText)");
    obj.style.setProperty("--bs-border-color", "var(--RMBorder)");
    obj.style.setProperty("--bs-table-bg", "var(--RMTableBackground)");
    obj.style.setProperty("--bs-table-color", "var(--RMText)");
    obj.style.setProperty("--bs-table-border-color", "var(--RMTableBorder)");
}

function RenderRecipeManagerObject(obj) {
    if (!obj) return;

    const hasRequiredMarkup = !!(
        obj.querySelector(".rm-type-filter") &&
        obj.querySelector(".rm-recipe-tbody") &&
        obj.querySelector(".rm-top-toolbar") &&
        obj.querySelector(".rm-left-splitter") &&
        obj.querySelector(".rm-target-select") &&
        obj.querySelector(".rm-parameter-table-wrap") &&
        obj.querySelector(".rm-action-row") &&
        obj.querySelector(".rm-empty-state")
    );

    if (!obj.recipeManagerRootMarkupInitialized || !hasRequiredMarkup) {
        RecipeManagerBuildRootFromTemplate(obj);
        RecipeManagerBindRootEvents(obj);
        obj.recipeManagerRootMarkupInitialized = true;
    }

    RecipeManagerInitDefaultThemeAttributesOnRoot(obj);
    getinitAttribute(obj, "data-system-left-width-px", RecipeManagerLeftPanelDefaultWidthPx);
    RecipeManagerApplyThemeVariables(obj);
    RecipeManagerApplyLeftPanelLayout(obj);
    RecipeManagerApplyNumpadAttributes(obj);
    (async function () {
        await RecipeManagerRefreshUiFromServer(obj);
    })();
}

function RecipeManagerBuildRootFromTemplate(obj) {
    const tpl = document.getElementById("RecipeManagerStaticMarkup");
    if (!tpl || !tpl.content) {
        console.error("RecipeManager: #RecipeManagerStaticMarkup template not found. Include Pages/Shared/_RecipeManagerPartial on the page.");
        return;
    }
    obj.innerHTML = "";
    obj.appendChild(document.importNode(tpl.content, true));
}

function RecipeManagerApplyNumpadAttributes(obj) {
    const enabled = (obj.getAttribute("data-system-numpad") === "true");
    const decRaw = obj.getAttribute("data-system-numpaddecimalsymbol");
    const minusRaw = obj.getAttribute("data-system-numpadminussymbol");
    const dec = decRaw == null || decRaw === "" ? "true" : decRaw;
    const minus = minusRaw == null || minusRaw === "" ? "true" : minusRaw;
    const decStr = (String(dec).toLowerCase() === "true") ? "true" : "false";
    const minusStr = (String(minus).toLowerCase() === "true") ? "true" : "false";
    const inputs = obj.querySelectorAll(".rm-recipe-value");
    inputs.forEach(function (input) {
        const readOnly = input.hasAttribute("readonly") || input.readOnly === true || input.disabled === true;
        const useNumpad = enabled && !readOnly;
        input.setAttribute("data-numpad", useNumpad ? "true" : "false");
        input.setAttribute("data-numpaddecimalsymbol", decStr);
        input.setAttribute("data-numpadminussymbol", minusStr);
    });
}

function RecipeManagerBindRootEvents(obj) {
    obj.addEventListener("pointerdown", function () {
        RecipeManagerSetThemedRootRef(obj);
    });
    obj.addEventListener("focusin", function () {
        RecipeManagerSetThemedRootRef(obj);
    });

    obj.querySelector(".rm-type-filter").addEventListener("change", function () {
        RecipeManagerSetSelectedTypeId(obj, this.value || "");
        RecipeManagerClearSelectedRecipe(obj);
        RecipeManagerSetSelectedTarget(obj, "");
        void RecipeManagerRefreshUiFromServer(obj);
    });

    obj.querySelector(".rm-target-select").addEventListener("change", function () {
        RecipeManagerSetSelectedTarget(obj, this.value || "");
        void RecipeManagerRefreshUiFromServer(obj);
    });

    obj.querySelector(".rm-target-clear").addEventListener("click", function () {
        RecipeManagerSetSelectedTarget(obj, "");
        void RecipeManagerRefreshUiFromServer(obj);
    });

    obj.querySelector(".rm-type-clear").addEventListener("click", function () {
        RecipeManagerClearAllSelection(obj);
        void RecipeManagerRefreshUiFromServer(obj);
    });

    const changeTypeBtn = obj.querySelector(".rm-change-type");
    if (changeTypeBtn) {
        changeTypeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            RecipeManagerSetThemedRootRef(obj);
            const tid = RecipeManagerSelectedTypeId(obj);
            const sid = RecipeManagerSelectedRecipeId(obj);
            if (!tid || !sid) {
                return;
            }
            (async function () {
                const st = await RecipeManagerGetState();
                if (st) {
                    RecipeManagerOpenMoveRecipeTypeModal(obj, st, parseInt(tid, 10), sid);
                }
            })();
        });
    }

    obj.querySelector(".rm-edit-types").addEventListener("click", function () {
        RecipeManagerOpenRecipeTypesModal(obj);
    });

    obj.querySelector(".rm-snapshot").addEventListener("click", function () {
        RecipeManagerSetThemedRootRef(obj);
        const snapTypeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
        const snapRecipeId = (RecipeManagerSelectedRecipeId(obj) || "").trim();
        const snapTarget = (RecipeManagerSelectedTarget(obj) || "").trim();
        if (!snapTypeId || !snapRecipeId) {
            document.getElementById("CustomModalText").textContent = "Please select a recipe first.";
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            return;
        }
        if (!snapTarget) {
            document.getElementById("CustomModalText").textContent = "Please select a recipe target first. Snapshot copies the target's current parameter values into this recipe.";
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            return;
        }
        const req = RecipeManagerGetLoadSnapshotRequest(obj);
        if (!req) return;
        RecipeManagerOpenConfirmDialog("Snapshot", "Are you sure?", "Yes", function () {
            (async function () {
                try {
                    await RecipeManagerSaveRecipeFromParameterTable(obj, true, { suppressSuccessUi: true });
                    await RM_SnapshotTargetToRecipe(req);
                    RecipeManagerSaveSuccessConfirm();
                    await RecipeManagerRefreshUiFromServer(obj);
                } catch (e) {
                    if (e && e.rmUserNotified) return;
                    document.getElementById("CustomModalText").textContent = "Snapshot failed.";
                    new bootstrap.Modal(document.getElementById('CustomModal')).show();
                }
            })();
        });
    });

    obj.querySelector(".rm-load").addEventListener("click", function () {
        RecipeManagerSetThemedRootRef(obj);
        const loadTypeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
        const loadRecipeId = (RecipeManagerSelectedRecipeId(obj) || "").trim();
        const loadTarget = (RecipeManagerSelectedTarget(obj) || "").trim();
        if (!loadTypeId || !loadRecipeId) {
            document.getElementById("CustomModalText").textContent = "Please select a recipe first.";
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            return;
        }
        if (!loadTarget) {
            document.getElementById("CustomModalText").textContent = "Please select a recipe target first. Load writes this recipe's parameter values to the target.";
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            return;
        }
        if (RecipeManagerIsParameterTableLoadBlocked(obj)) {
            document.getElementById("CustomModalText").textContent = "Load is blocked. Fill all required recipe values (empty recipe value cells) first.";
            new bootstrap.Modal(document.getElementById('CustomModal')).show();
            return;
        }
        const req = RecipeManagerGetLoadSnapshotRequest(obj);
        if (!req) return;
        RecipeManagerOpenConfirmDialog("Load", "Are you sure?", "Yes", function () {
            (async function () {
                try {
                    await RecipeManagerSaveRecipeFromParameterTable(obj, true, { suppressSuccessUi: true });
                    const response = await RM_LoadRecipeToTarget(req);
                    if (!response || response.success !== true) {
                        document.getElementById("CustomModalText").textContent = response && response.message ? response.message : "Load failed.";
                        new bootstrap.Modal(document.getElementById('CustomModal')).show();
                        return;
                    }
                    RecipeManagerSaveSuccessConfirm();
                    await RecipeManagerRefreshUiFromServer(obj);
                } catch (e) {
                    if (e && e.rmUserNotified) return;
                    document.getElementById("CustomModalText").textContent = "Load failed.";
                    new bootstrap.Modal(document.getElementById('CustomModal')).show();
                }
            })();
        });
    });

    const requireSelectedTypeForImport = function () {
        const typeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
        if (!typeId) {
            document.getElementById("CustomModalText").textContent = "Select a recipe type to import into.";
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            return 0;
        }
        return typeId;
    };

    obj.querySelector(".rm-import").addEventListener("click", function () {
        if (!requireSelectedTypeForImport()) {
            return;
        }
        obj.querySelector(".rm-import-file").click();
    });

    obj.querySelector(".rm-add-set").addEventListener("click", function () {
        RecipeManagerSetThemedRootRef(obj);
        RecipeManagerOpenAddRecipeModal(obj);
    });

    obj.querySelector(".rm-import-set").addEventListener("click", function () {
        if (!requireSelectedTypeForImport()) {
            return;
        }
        obj.querySelector(".rm-import-set-file").click();
    });

    obj.querySelector(".rm-import-set-file").addEventListener("change", function () {
        const typeId = requireSelectedTypeForImport();
        if (!typeId) return;
        (async function (fileInput) {
            try {
                const response = await RM_ImportRecipeFromFileJson(fileInput, typeId);
                if (response && (response.Success === false || response.success === false)) {
                    const msg = (response && (response.Message || response.message)) || "Import failed.";
                    document.getElementById("CustomModalText").textContent = msg;
                    new bootstrap.Modal(document.getElementById("CustomModal")).show();
                    return;
                }
                const skipped = (response && (response.SkippedNames || response.skippedNames)) || [];
                const addedN = (response && (response.Added != null ? response.Added : response.added)) || 0;
                if (addedN > 0) {
                    RecipeManagerSaveSuccessConfirm();
                }
                if (Array.isArray(skipped) && skipped.length > 0) {
                    document.getElementById("CustomModalText").textContent = "Some recipes were skipped because they already exist: " + skipped.join(", ");
                    new bootstrap.Modal(document.getElementById("CustomModal")).show();
                }
                await RecipeManagerRefreshUiFromServer(obj);
            } catch (err) {
                document.getElementById("CustomModalText").textContent = (err && err.message) ? err.message : String(err || "Import failed.");
                new bootstrap.Modal(document.getElementById("CustomModal")).show();
            }
        })(this);
        this.value = "";
    });

    obj.querySelector(".rm-export-set").addEventListener("click", function () {
        const recipeTypeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
        if (!recipeTypeId) {
            document.getElementById("CustomModalText").textContent = "Select a recipe type first.";
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            return;
        }
        const ids = RecipeManagerGetCheckedRecipeIdsForExport(obj);
        if (!ids || ids.length === 0) {
            document.getElementById("CustomModalText").textContent = "Check one or more recipes to export.";
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            return;
        }
        RM_ExportRecipeToFileJson({
            recipeTypeId: recipeTypeId,
            recipeIds: ids
        });

        // After exporting, clear all checkboxes.
        obj.querySelectorAll(".rm-recipe-check").forEach(function (cb) { cb.checked = false; });
        const allCb = obj.querySelector(".rm-recipe-check-all");
        if (allCb) allCb.checked = false;
    });

    obj.querySelector(".rm-import-file").addEventListener("change", function () {
        const typeId = requireSelectedTypeForImport();
        if (!typeId) return;
        const setId = RecipeManagerSelectedRecipeId(obj) || "";
        (async function (fileInput) {
            try {
                const response = await RM_ImportRecipeFromFileLegacy(fileInput, typeId, setId);
                if (response && (response.success === false || response.Success === false)) {
                    const msg = (response && (response.message || response.Message)) || "Import failed.";
                    document.getElementById("CustomModalText").textContent = msg;
                    new bootstrap.Modal(document.getElementById("CustomModal")).show();
                    return;
                }
                if (response && (response.RecipeId || response.recipeId)) {
                    RecipeManagerSaveSuccessConfirm();
                }
                const infoMsg = response && (response.Message || response.message);
                if (infoMsg) {
                    document.getElementById("CustomModalText").textContent = infoMsg;
                    new bootstrap.Modal(document.getElementById("CustomModal")).show();
                }
                await RecipeManagerRefreshUiFromServer(obj);
            } catch (err) {
                document.getElementById("CustomModalText").textContent = (err && err.message) ? err.message : String(err || "Import failed.");
                new bootstrap.Modal(document.getElementById("CustomModal")).show();
            }
        })(this);
        this.value = "";
    });

    obj.querySelector(".rm-export").addEventListener("click", function () {
        RecipeManagerSetThemedRootRef(obj);
        const req = RecipeManagerGetSelectedRecipeForExport(obj);
        if (!req) {
            document.getElementById("CustomModalText").textContent = "Select Recipe first.";
            new bootstrap.Modal(document.getElementById('CustomModal')).show();
            return;
        }
        RM_ExportRecipeToFileLegacy({
            recipeTypeId: req.recipeTypeId,
            recipeId: req.recipeId
        });
    });

    obj.querySelector(".rm-add-param").addEventListener("click", function () {
        RecipeManagerSetThemedRootRef(obj);
        const typeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
        const setId = RecipeManagerSelectedRecipeId(obj) || "";
        const setName = RecipeManagerSelectedRecipeName(obj) || "";
        const setDescription = RecipeManagerSelectedRecipeDescription(obj) || "";
        if (!typeId || !setId) {
            document.getElementById("CustomModalText").textContent = "Select Recipe first.";
            new bootstrap.Modal(document.getElementById('CustomModal')).show();
            return;
        }
        RecipeManagerOpenPromptDialog("Add Parameter", "Parameter name", "", "Add", function (newName) {
            const existing = RecipeManagerReadParameterTableFromDom(obj);
            if (existing.some(function (p) { return p.name === newName; })) {
                document.getElementById("CustomModalText").textContent = "Parameter already exists.";
                new bootstrap.Modal(document.getElementById('CustomModal')).show();
                return;
            }
            existing.push({ name: newName, value: "" });

            (async function () {
                try {
                    const response = await RM_SaveRecipe({
                        recipeTypeId: typeId,
                        id: setId,
                        name: setName,
                        description: setDescription,
                        parameters: existing
                    });
                    if (response && response.success === false) {
                        document.getElementById("CustomModalText").textContent = response.message || "Save failed.";
                        new bootstrap.Modal(document.getElementById('CustomModal')).show();
                        return;
                    }
                    RecipeManagerSaveSuccessConfirm();
                    await RecipeManagerRefreshUiFromServer(obj);
                } catch {
                    document.getElementById("CustomModalText").textContent = "Save failed.";
                    new bootstrap.Modal(document.getElementById('CustomModal')).show();
                }
            })();
        });
    });

    const splitter = obj.querySelector(".rm-left-splitter");
    if (splitter) {
        splitter.addEventListener("pointerdown", function (e) {
            if (e.button !== 0) return;
            e.preventDefault();
            RecipeManagerSetThemedRootRef(obj);
            const leftEl = obj.querySelector(".rm-left");
            if (!leftEl) return;
            const startX = e.clientX;
            const startW = leftEl.getBoundingClientRect().width;
            try {
                splitter.setPointerCapture(e.pointerId);
            } catch (err) { }
            const moveHandler = function (ev) {
                const dx = ev.clientX - startX;
                const newW = RecipeManagerClampLeftPanelWidth(obj, Math.round(startW + dx));
                obj.setAttribute("data-system-left-width-px", String(newW));
                obj.style.setProperty("--RMLastLeftWidth", newW + "px");
            };
            const upHandler = function (ev) {
                try { splitter.releasePointerCapture(ev.pointerId); } catch (err) { }
                splitter.removeEventListener("pointermove", moveHandler);
                splitter.removeEventListener("pointerup", upHandler);
                splitter.removeEventListener("pointercancel", upHandler);
            };
            splitter.addEventListener("pointermove", moveHandler);
            splitter.addEventListener("pointerup", upHandler);
            splitter.addEventListener("pointercancel", upHandler);
        });
    }

    if (!obj.recipeManagerLeftPanelResizeHandler) {
        obj.recipeManagerLeftPanelResizeHandler = function () {
            RecipeManagerApplyLeftPanelLayout(obj);
        };
        window.addEventListener("resize", obj.recipeManagerLeftPanelResizeHandler);
    }

}

function RecipeManagerOnParameterInputFocus(target) {
    if (!target || EditMode) {
        return;
    }
    if (target.hasAttribute("readonly") || target.readOnly === true || target.disabled === true) {
        return;
    }
    var numpad = target.getAttribute("data-numpad");
    if (!numpad) {
        numpad = "false";
    }
    if (numpad == "true") {
        var numpaddecimalsymbol = target.getAttribute("data-numpaddecimalsymbol");
        if (!numpaddecimalsymbol) {
            numpaddecimalsymbol = "false";
        }
        var numpadminussymbol = target.getAttribute("data-numpadminussymbol");
        if (!numpadminussymbol) {
            numpadminussymbol = "false";
        }
        OpenNumpad(target, numpaddecimalsymbol, numpadminussymbol);
        target.setAttribute("inputmode", "none");
    }
    var keyboard = target.getAttribute("data-keyboard");
    if (!keyboard) {
        keyboard = "false";
    }
    if (keyboard == "true") {
        OpenKeyboard(target);
        target.setAttribute("inputmode", "none");
    }
}

function RecipeManagerGetLoadSnapshotRequest(obj) {
    const recipeTypeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
    const recipeId = RecipeManagerSelectedRecipeId(obj) || "";
    const targetName = RecipeManagerSelectedTarget(obj) || "";
    if (!recipeTypeId || !recipeId || !targetName) {
        return null;
    }
    return {
        recipeTypeId: recipeTypeId,
        recipeId: recipeId,
        targetName: targetName
    };
}

function RecipeManagerGetSelectedRecipeForExport(obj) {
    const recipeTypeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
    const recipeId = RecipeManagerSelectedRecipeId(obj) || "";
    if (!recipeTypeId || !recipeId) {
        return null;
    }
    return { recipeTypeId: recipeTypeId, recipeId: recipeId };
}

function RecipeManagerGetCheckedRecipeIdsForExport(obj) {
    if (!obj) return [];
    return Array.from(obj.querySelectorAll(".rm-recipe-check:checked"))
        .map(function (cb) { return cb.getAttribute("data-set-id") || ""; })
        .filter(function (x) { return x && x.trim() !== ""; });
}

function RecipeManagerSaveParameterTableThenRefreshState(obj) {
    return RecipeManagerSaveRecipeFromParameterTable(obj, true);
}

/**
 * Persists the parameter table for the current recipe (`RM_SaveRecipe` → Promise via `RM_PostJson`).
 * @param {object} options Optional: { suppressSuccessUi: boolean } — hide save confirm when chaining (e.g. Load/Snapshot).
 * @returns {Promise<void>} Resolves when save (and optional state refresh) completes; rejects on failure.
 */
async function RecipeManagerSaveRecipeFromParameterTable(obj, refreshState, options) {
    const opts = options || {};
    const suppressSuccessUi = opts.suppressSuccessUi === true;
    const typeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
    const setId = RecipeManagerSelectedRecipeId(obj) || "";
    const setName = RecipeManagerSelectedRecipeName(obj) || "";
    const setDescription = RecipeManagerSelectedRecipeDescription(obj) || "";

    if (!typeId || !setId) {
        return;
    }

    const parameters = RecipeManagerReadParameterTableFromDom(obj);

    try {
        const response = await RM_SaveRecipe({
            recipeTypeId: typeId,
            id: setId,
            name: setName,
            description: setDescription,
            parameters: parameters
        });
        if (response && (response.success === false || response.Success === false)) {
            const err = (response && (response.message || response.Message)) || "Save failed.";
            document.getElementById("CustomModalText").textContent = err;
            new bootstrap.Modal(document.getElementById("CustomModal")).show();
            const errSave = new Error(err);
            errSave.rmUserNotified = true;
            throw errSave;
        }
        if (!suppressSuccessUi) {
            RecipeManagerSaveSuccessConfirm();
        }
        if (refreshState) {
            const st = await RecipeManagerGetState();
            if (st == null) {
                const errState = new Error("Failed to refresh Recipe Manager state.");
                errState.rmUserNotified = true;
                throw errState;
            }
        }
    } catch (e) {
        if (e && e.rmUserNotified) {
            throw e;
        }
        document.getElementById("CustomModalText").textContent = "Recipe save failed. Please try again.";
        new bootstrap.Modal(document.getElementById("CustomModal")).show();
        console.error("Recipe Manager auto-save failed.");
        const errNet = new Error("Recipe save failed.");
        errNet.rmUserNotified = true;
        throw errNet;
    }
}

function RecipeManagerReadParameterTableFromDom(obj) {
    const rows = Array.from(obj.querySelectorAll(".rm-parameter-table tbody tr"));
    return rows.map(function (r) {
        const nameInput = r.querySelector(".rm-param-name");
        const nameCell = r.querySelector(".rm-param-name-cell");
        const valInput = r.querySelector(".rm-recipe-value");
        const name = nameInput ? nameInput.value : (nameCell ? nameCell.textContent : "");
        const value = valInput ? valInput.value : "";
        return { name: (name || "").trim(), value: value || "" };
    }).filter(function (x) { return x.name !== ""; });
}

function RecipeManagerRenderAdminOnlyControls(obj, isAdmin) {
    obj.querySelectorAll(".rm-admin-only").forEach(function (el) {
        if (isAdmin) {
            el.classList.remove("d-none");
        } else {
            el.classList.add("d-none");
        }
    });
}

function RecipeManagerRenderTypeFilter(obj, state, selectedTypeId, selectedTarget) {
    const typeSelect = obj.querySelector(".rm-type-filter");
    if (!typeSelect) {
        return "";
    }
    typeSelect.innerHTML = "";
    const allTypesOpt = RecipeManagerCreateOption("", "All Types");
    if (allTypesOpt) {
        typeSelect.appendChild(allTypesOpt);
    }
    state.recipeTypes.forEach(function (t) {
        const o = RecipeManagerCreateOption(String(t.id), t.name || "");
        if (o) {
            typeSelect.appendChild(o);
        }
    });
    let resolvedTypeId = selectedTypeId;
    if (!resolvedTypeId && selectedTarget) {
        const target = (state.targets || []).find(x => x.targetName === selectedTarget);
        if (target && target.recipeTypeName) {
            const byName = state.recipeTypes.find(x => x.name === target.recipeTypeName);
            if (byName) {
                resolvedTypeId = String(byName.id);
                RecipeManagerSetSelectedTypeId(obj, resolvedTypeId);
            }
        }
    }
    typeSelect.value = resolvedTypeId || "";
    return resolvedTypeId || "";
}

function RecipeManagerListVisibleRecipes(state, resolvedTypeId) {
    const visibleTypes = resolvedTypeId ? state.recipeTypes.filter(x => String(x.id) === String(resolvedTypeId)) : state.recipeTypes;
    const visibleSets = [];
    visibleTypes.forEach(function (t) {
        const sets = ((t.data && t.data.recipes) || []);
        sets.forEach(function (s) {
            visibleSets.push({ typeId: t.id, typeName: t.name, set: s });
        });
    });
    return visibleSets;
}

function RecipeManagerRenderRecipeList(obj, state, setTbody, visibleSets) {
    if (!setTbody) {
        return;
    }
    setTbody.innerHTML = "";
    const selectedSetId = RecipeManagerSelectedRecipeId(obj) || "";
    const updateCheckAll = function () {
        const headerCb = obj.querySelector(".rm-recipe-check-all");
        if (!headerCb) return;
        const allRows = Array.from(obj.querySelectorAll(".rm-recipe-check"));
        const allChecked = allRows.length > 0 && allRows.every(function (c) { return c.checked; });
        const anyChecked = allRows.some(function (c) { return c.checked; });
        headerCb.indeterminate = anyChecked && !allChecked;
        headerCb.checked = allChecked;
    };
    const selectRecipeRow = function (s) {
        RecipeManagerSetSelectedRecipe(obj, s.set.id, s.set.name || "", (s.set.description || "").trim());
        RecipeManagerSetSelectedTypeId(obj, String(s.typeId));
        RecipeManagerRenderUiFromState(obj, state);
    };
    visibleSets.forEach(function (s) {
        const tr = RecipeManagerCloneTemplateElement("RecipeManagerTplRecipeListRow", "tr");
        if (!tr) {
            return;
        }
        tr.className = "rm-recipe-row" + (String(selectedSetId) === String(s.set.id) ? " rm-recipe-row-selected" : "");

        const cb = tr.querySelector("input.rm-recipe-check");
        if (cb) {
            cb.setAttribute("data-set-id", s.set.id);
            cb.checked = false;
            cb.addEventListener("click", function (e) { e.stopPropagation(); });
            cb.addEventListener("change", function () { updateCheckAll(); });
        }

        const nameTd = tr.querySelector(".rm-recipe-name");
        const descTd = tr.querySelector(".rm-recipe-desc");
        if (nameTd) nameTd.textContent = s.set.name || "";
        if (descTd) descTd.textContent = (s.set.description || "").trim();

        const editBtn = tr.querySelector("button.rm-recipe-edit");
        if (editBtn) editBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            RecipeManagerSetThemedRootRef(obj);
            (async function () {
                const fresh = await RecipeManagerGetState();
                if (fresh) {
                    RecipeManagerOpenRecipeMetadataModal(obj, fresh, s.typeId, s.set.id);
                }
            })();
        });
        const delBtn = tr.querySelector("button.rm-recipe-delete");
        if (delBtn) delBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            RecipeManagerSetThemedRootRef(obj);
            const setName = (s.set.name || "").trim() || "this recipe";
            RecipeManagerOpenConfirmDialog("Delete recipe", "Are you sure you want to delete \"" + setName + "\"?", "Delete", function () {
                (async function () {
                    try {
                        const response = await RM_DeleteRecipe({
                            recipeTypeId: parseInt(String(s.typeId), 10),
                            recipeId: s.set.id
                        });
                        if (!response || response.success === false || response.Success === false) {
                            const m = (response && (response.message || response.Message)) || "Delete failed.";
                            document.getElementById("CustomModalText").textContent = m;
                            new bootstrap.Modal(document.getElementById("CustomModal")).show();
                            return;
                        }
                        RecipeManagerSaveSuccessConfirm();
                        if (String(RecipeManagerSelectedRecipeId(obj) || "") === String(s.set.id)) {
                            RecipeManagerClearSelectedRecipe(obj);
                        }
                        await RecipeManagerRefreshUiFromServer(obj);
                    } catch {
                        document.getElementById("CustomModalText").textContent = "Delete failed.";
                        new bootstrap.Modal(document.getElementById("CustomModal")).show();
                    }
                })();
            });
        });
        tr.addEventListener("click", function (e) {
            if (e.target.closest("button")) return;
            selectRecipeRow(s);
        });
        setTbody.appendChild(tr);
    });
    const headerCb = obj.querySelector(".rm-recipe-check-all");
    if (headerCb) {
        const allRows = Array.from(obj.querySelectorAll(".rm-recipe-check"));
        const allChecked = allRows.length > 0 && allRows.every(function (c) { return c.checked; });
        const anyChecked = allRows.some(function (c) { return c.checked; });
        headerCb.indeterminate = anyChecked && !allChecked;
        headerCb.checked = allChecked;
        headerCb.onchange = function () {
            const v = headerCb.checked;
            allRows.forEach(function (c) {
                c.checked = v;
            });
            updateCheckAll();
        };
        headerCb.onclick = function (e) { e.stopPropagation(); };
    }
    const stillSelected = RecipeManagerSelectedRecipeId(obj) || "";
    if (stillSelected && !visibleSets.some(function (x) { return String(x.set.id) === String(stillSelected); })) {
        RecipeManagerClearSelectedRecipe(obj);
    }
}

function RecipeManagerRenderTargetAndLayout(obj, state, resolvedTypeId, topToolbar, targetSelect, parameterTableWrap, actionRow, emptyState) {
    const selectedTarget = RecipeManagerSelectedTarget(obj) || "";
    const activeSetId = RecipeManagerSelectedRecipeId(obj) || "";
    const selectedTypeName = resolvedTypeId
        ? ((state.recipeTypes.find(x => String(x.id) === String(resolvedTypeId)) || {}).name || "")
        : "";
    const visibleTargets = (state.targets || []).filter(function (t) {
        return !selectedTypeName || t.recipeTypeName === selectedTypeName;
    });
    if (targetSelect) {
        targetSelect.innerHTML = "";
        const nlOpt = RecipeManagerCreateOption("", "Not linked");
        if (nlOpt) {
            targetSelect.appendChild(nlOpt);
        }
        visibleTargets.forEach(function (t) {
            const o = RecipeManagerCreateOption(t.targetName || "", t.targetName || "");
            if (o) {
                targetSelect.appendChild(o);
            }
        });
        const hasSelectedTarget = !!selectedTarget && visibleTargets.some(function (t) { return t.targetName === selectedTarget; });
        if (!hasSelectedTarget) {
            RecipeManagerSetSelectedTarget(obj, "");
            targetSelect.value = "";
        } else {
            targetSelect.value = selectedTarget;
        }
    }
    const hasActiveSet = !!activeSetId;
    if (topToolbar) {
        if (hasActiveSet && RecipeManagerSelectedTypeId(obj)) {
            const tid = RecipeManagerSelectedTypeId(obj);
            const tInfo = (state.recipeTypes || []).find(x => String(x.id) === String(tid));
            const nameEl = topToolbar.querySelector(".rm-type-info-name");
            if (nameEl) {
                nameEl.textContent = tInfo ? (tInfo.name || "") : "";
            }
            topToolbar.classList.remove("d-none");
        } else {
            topToolbar.classList.add("d-none");
        }
    }
    if (hasActiveSet) {
        if (parameterTableWrap) parameterTableWrap.classList.remove("d-none");
        if (actionRow) actionRow.classList.remove("d-none");
        if (emptyState) emptyState.classList.add("d-none");
    } else {
        RecipeManagerSetSelectedTarget(obj, "");
        if (topToolbar) {
            topToolbar.classList.add("d-none");
        }
        if (parameterTableWrap) parameterTableWrap.classList.add("d-none");
        if (actionRow) actionRow.classList.add("d-none");
        if (emptyState) emptyState.classList.remove("d-none");
        const tb = obj.querySelector(".rm-parameter-table tbody");
        if (tb) {
            tb.innerHTML = "";
        }
    }
    return hasActiveSet;
}

function RecipeManagerRenderUiFromState(obj, state) {
    if (!state || !state.recipeTypes) {
        return;
    }

    const typeSelect = obj.querySelector(".rm-type-filter");
    const setTbody = obj.querySelector(".rm-recipe-tbody");
    const topToolbar = obj.querySelector(".rm-top-toolbar");
    const targetSelect = obj.querySelector(".rm-target-select");
    const parameterTableWrap = obj.querySelector(".rm-parameter-table-wrap");
    const actionRow = obj.querySelector(".rm-action-row");
    const emptyState = obj.querySelector(".rm-empty-state");
    if (!typeSelect || !setTbody || !topToolbar || !targetSelect || !parameterTableWrap || !actionRow || !emptyState) {
        RecipeManagerBuildRootFromTemplate(obj);
        RecipeManagerBindRootEvents(obj);
        return;
    }

    const selectedTypeId = RecipeManagerSelectedTypeId(obj) || "";
    const selectedTarget = RecipeManagerSelectedTarget(obj) || "";
    const isAdmin = state.isAdmin === true;

    RecipeManagerRenderAdminOnlyControls(obj, isAdmin);
    const resolvedTypeId = RecipeManagerRenderTypeFilter(obj, state, selectedTypeId, selectedTarget) || "";
    const visibleSets = RecipeManagerListVisibleRecipes(state, resolvedTypeId);
    RecipeManagerRenderRecipeList(obj, state, setTbody, visibleSets);
    const hasActiveSet = RecipeManagerRenderTargetAndLayout(obj, state, resolvedTypeId, topToolbar, targetSelect, parameterTableWrap, actionRow, emptyState);
    if (hasActiveSet) {
        RecipeManagerRenderRecipeParameterSection(obj, state);
    }
}

function RecipeManagerRefFieldTextForCell(targetParam, fieldKey) {
    if (!targetParam) {
        return "";
    }
    switch (fieldKey) {
        case "currentValue":
            return targetParam.currentValue != null && String(targetParam.currentValue) !== "" ? String(targetParam.currentValue) : "";
        case "units":
            return targetParam.units != null && String(targetParam.units) !== "" ? String(targetParam.units) : "";
        case "min":
            return targetParam.min != null ? String(targetParam.min) : "";
        case "max":
            return targetParam.max != null ? String(targetParam.max) : "";
        case "description":
            return targetParam.description != null && String(targetParam.description) !== "" ? String(targetParam.description) : "";
        default:
            return "";
    }
}

/**
 * Returns CSS class for a parameter table td (and read-only for recipe value column).
 * column: "name" | "recipeValue" | "currentValue" | "units" | "min" | "max" | "description" | "actions"
 */
function RecipeManagerGetParameterCellColor(column, hasTarget, recipeParam, targetParam, effectiveRecipeValue) {
    const recipeValStr = effectiveRecipeValue != null ? String(effectiveRecipeValue) : "";
    const valueIsBlank = recipeValStr.trim() === "";
    if (column === "name" || column === "actions") {
        return { tdClass: "", inputReadOnly: false };
    }
    if (column === "recipeValue") {
        if (!hasTarget) {
            return { tdClass: "", inputReadOnly: false };
        }
        if (recipeParam && !targetParam) {
            return { tdClass: "rm-cell--rv-readonly", inputReadOnly: true };
        }
        if (recipeParam && targetParam) {
            if (valueIsBlank) {
                return { tdClass: "rm-cell--rv-missing", inputReadOnly: false };
            }
            return { tdClass: "", inputReadOnly: false };
        }
        return { tdClass: "", inputReadOnly: false };
    }
    if (column === "currentValue" || column === "units" || column === "min" || column === "max" || column === "description") {
        if (!hasTarget) {
            return { tdClass: "", inputReadOnly: false };
        }
        const t = RecipeManagerRefFieldTextForCell(targetParam, column);
        const isEmpty = t === "";
        return { tdClass: isEmpty ? "rm-cell--ref-missing" : "rm-cell--ref-value", inputReadOnly: false };
    }
    return { tdClass: "", inputReadOnly: false };
}

function RecipeManagerSetParameterValueTdClasses(td, recipeColor) {
    if (!td) {
        return;
    }
    td.className = "rm-param-value-cell" + (recipeColor && recipeColor.tdClass ? " " + recipeColor.tdClass : "");
}

function RecipeManagerFetchTargetDetailsForTable(obj, targetName, onComplete) {
    if (!targetName) {
        onComplete(null);
        return;
    }
    (async function () {
        try {
            const response = await RM_GetTargetDetails(targetName);
            if (!response || response.success !== true) {
                onComplete(null);
                return;
            }
            onComplete(response);
        } catch {
            onComplete(null);
        }
    })();
}

function RecipeManagerRenderParameterTable(obj, state, recipeParams, targetDetails, selectionKey) {
    const tbody = obj.querySelector(".rm-parameter-table tbody");
    if (!tbody) {
        return;
    }
    const selectedTarget = RecipeManagerSelectedTarget(obj) || "";

    const keyNow = (RecipeManagerSelectedTypeId(obj) || "") + "::" +
        (RecipeManagerSelectedRecipeId(obj) || "") + "::" +
        (RecipeManagerSelectedTarget(obj) || "");
    if (keyNow !== selectionKey) {
        return;
    }

    const hasTarget = !!(selectedTarget && String(selectedTarget).trim() !== "");
    const targetMap = {};
    (targetDetails && targetDetails.parameters ? targetDetails.parameters : []).forEach(function (p) {
        targetMap[p.name] = p;
    });

    const allNames = new Set();
    recipeParams.forEach(function (p) { allNames.add(p.name); });

    tbody.innerHTML = "";
    Array.from(allNames).sort().forEach(function (name) {
        const rp = recipeParams.find(x => x.name === name);
        const tp = targetMap[name];
        const tr = RecipeManagerCloneTemplateElement("RecipeManagerTplParameterRow", "tr");
        if (!tr) {
            return;
        }
        const renderValue = rp ? (rp.value || "") : "";
        const nameCol = RecipeManagerGetParameterCellColor("name", hasTarget, rp, tp, renderValue);
        const tdName = tr.querySelector(".rm-param-name-cell");
        if (tdName) {
            tdName.className = "rm-param-name-cell" + (nameCol.tdClass ? " " + nameCol.tdClass : "");
            tdName.textContent = name;
        }
        const recipeColor = RecipeManagerGetParameterCellColor("recipeValue", hasTarget, rp, tp, renderValue);
        const tdVal = tr.querySelector('td[data-system-col="recipeValue"]');
        const valueInput = tr.querySelector("input.rm-recipe-value");
        if (tdVal) {
            RecipeManagerSetParameterValueTdClasses(tdVal, recipeColor);
        }
        if (valueInput) {
            if (recipeColor.inputReadOnly) {
                valueInput.setAttribute("readonly", "readonly");
            } else {
                valueInput.removeAttribute("readonly");
            }
            valueInput.value = renderValue;
        }
        const mkRefTd = function (fieldKey) {
            const raw = RecipeManagerRefFieldTextForCell(tp, fieldKey);
            const c = RecipeManagerGetParameterCellColor(fieldKey, hasTarget, rp, tp, renderValue);
            const td = tr.querySelector('td[data-system-col="' + fieldKey + '"]');
            if (!td) {
                return;
            }
            td.className = (c.tdClass ? c.tdClass : "").trim();
            td.textContent = raw;
        };
        mkRefTd("currentValue");
        mkRefTd("units");
        mkRefTd("min");
        mkRefTd("max");
        mkRefTd("description");
        const actCol = RecipeManagerGetParameterCellColor("actions", hasTarget, rp, tp, renderValue);
        const tdAct = tr.querySelector("td.rm-actions-cell");
        if (tdAct) {
            tdAct.className = "text-nowrap rm-actions-cell" + (actCol.tdClass ? " " + actCol.tdClass : "");
        }
        const delBtn = tr.querySelector("button.rm-delete-param");
        if (valueInput && !valueInput.hasAttribute("readonly")) {
            valueInput.addEventListener("input", function () {
                RecipeManagerUpdateParameterCellHighlight(obj, tr, this.value || "", hasTarget, rp, tp);
            });
            valueInput.addEventListener("blur", function () {
                const v = this.value || "";
                RecipeManagerUpdateParameterCellHighlight(obj, tr, v, hasTarget, rp, tp);
                RecipeManagerSaveSingleParameterValue(obj, name, v, function () { });
            });
        }
        if (delBtn) {
            delBtn.addEventListener("click", function () {
                RecipeManagerDeleteRecipeParameter(obj, name);
            });
        }
        tbody.appendChild(tr);
    });

    RecipeManagerApplyNumpadAttributes(obj);
}

function RecipeManagerRenderRecipeParameterSection(obj, state) {
    const selectedTypeId = RecipeManagerSelectedTypeId(obj) || "";
    const selectedSetId = RecipeManagerSelectedRecipeId(obj) || "";
    const selectedTarget = RecipeManagerSelectedTarget(obj) || "";
    const selectionKey = selectedTypeId + "::" + selectedSetId + "::" + selectedTarget;

    const type = (state.recipeTypes || []).find(x => String(x.id) === String(selectedTypeId));
    const set = type ? ((type.data && type.data.recipes) || []).find(x => String(x.id) === String(selectedSetId)) : null;
    const recipeParams = set ? (set.parameters || []) : [];

    if (!selectedTarget) {
        RecipeManagerRenderParameterTable(obj, state, recipeParams, null, selectionKey);
        return;
    }

    RecipeManagerFetchTargetDetailsForTable(obj, selectedTarget, function (targetDetails) {
        RecipeManagerRenderParameterTable(obj, state, recipeParams, targetDetails, selectionKey);
    });
}

function RecipeManagerIsParameterTableLoadBlocked(obj) {
    if (!obj) {
        return true;
    }
    const inputs = Array.from(obj.querySelectorAll(".rm-parameter-table tbody .rm-recipe-value"));
    return inputs.some(function (input) {
        if (!input || input.hasAttribute("readonly")) {
            return false;
        }
        return (input.value || "").trim() === "";
    });
}

function RecipeManagerDeleteRecipeParameter(obj, parameterName) {
    const typeId = parseInt(RecipeManagerSelectedTypeId(obj) || "0", 10);
    const setId = RecipeManagerSelectedRecipeId(obj) || "";
    const setName = RecipeManagerSelectedRecipeName(obj) || "";
    const setDescription = RecipeManagerSelectedRecipeDescription(obj) || "";
    if (!typeId || !setId || !parameterName) {
        return;
    }
    RecipeManagerOpenConfirmDialog("Delete Parameter", "Delete parameter '" + parameterName + "'?", "Delete", function () {
        const parameters = RecipeManagerReadParameterTableFromDom(obj).filter(function (p) {
            return p.name !== parameterName;
        });
        (async function () {
            try {
                const response = await RM_SaveRecipe({
                    recipeTypeId: typeId,
                    id: setId,
                    name: setName,
                    description: setDescription,
                    parameters: parameters
                });
                if (response && response.success === false) {
                    document.getElementById("CustomModalText").textContent = response.message || "Delete failed.";
                    new bootstrap.Modal(document.getElementById('CustomModal')).show();
                    return;
                }
                RecipeManagerSaveSuccessConfirm();
                await RecipeManagerRefreshUiFromServer(obj);
            } catch {
                document.getElementById("CustomModalText").textContent = "Delete failed.";
                new bootstrap.Modal(document.getElementById('CustomModal')).show();
            }
        })();
    });
}

function RecipeManagerUpdateParameterCellHighlight(obj, tr, value, hasTarget, recipeParam, targetParam) {
    if (!tr) {
        return;
    }
    const td = tr.querySelector('td[data-system-col="recipeValue"]');
    if (!td) {
        return;
    }
    const v = value != null ? String(value) : "";
    const recipeColor = RecipeManagerGetParameterCellColor("recipeValue", hasTarget, recipeParam, targetParam, v);
    if (recipeColor.inputReadOnly) {
        return;
    }
    RecipeManagerSetParameterValueTdClasses(td, recipeColor);
}
