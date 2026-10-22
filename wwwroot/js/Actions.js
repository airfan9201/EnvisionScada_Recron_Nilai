function AddActionStyleFormatContextDynamic(
    action = "None",
    value = "",
    variable = "",
    recipe = "",
    transferfrom = "",
    transferto = "",
    pythonscript = "",
    page = "",
    navigatereplacers = "",
    url = "",
    trendanalystconfig = "",
    selectlanguage = "",
    loginusername = "",
    loginpassword = "",
    executepagescriptfunction = "",
    popuptop = "",
    popupleft = "",
    popupfixed = "",
    popupsymbolname = "",
    popupcontext = "",
    popupusepositioncontext = "",
    popupdisabledrag = "",
    popupreplacers = "",
    device = "",
    report = "",
    selecttheme = "") {

	const original = document.getElementById("ActionStyleFormatContextDynamic");

	const clone = original.cloneNode(true);
	clone.removeAttribute("id");
    clone.style.display = "block"; // Ensure it's visible

    const actionElem = clone.querySelector("button.StyleFormatContextAction");
    actionElem.value = action;

    const valueElem = clone.querySelector("input.StyleFormatContextActionValue");
    valueElem.value = value;
    valueElem.addEventListener('input', saveActionContext);

    const variableElem = clone.querySelector("input.StyleFormatContextActionVariable");
    variableElem.value = variable;
    variableElem.addEventListener('input', saveActionContext);

    const recipeElem = clone.querySelector("input.StyleFormatContextActionRecipe");
    recipeElem.value = recipe;
    recipeElem.addEventListener('input', saveActionContext);

    const transferFromElem = clone.querySelector("input.StyleFormatContextActionTransferRecipeFrom");
    transferFromElem.value = transferfrom;
    transferFromElem.addEventListener('input', saveActionContext);

    const transferToElem = clone.querySelector("input.StyleFormatContextActionTransferRecipeTo");
    transferToElem.value = transferto;
    transferToElem.addEventListener('input', saveActionContext);

    const pythonScriptElem = clone.querySelector("input.StyleFormatContextActionPythonScript");
    pythonScriptElem.value = pythonscript;
    pythonScriptElem.addEventListener('input', saveActionContext);

    const deviceElem = clone.querySelector("input.StyleFormatContextActionDevice");
    deviceElem.value = device;
    deviceElem.addEventListener('input', saveActionContext);

    const reportElem = clone.querySelector("input.StyleFormatContextActionReport");
    reportElem.value = report;
    reportElem.addEventListener('input', saveActionContext);

    const pageElem = clone.querySelector("input.StyleFormatContextActionPage");
    pageElem.value = page;
    pageElem.addEventListener('input', saveActionContext);

    clone.setAttribute("data-actionnavigatereplacers", navigatereplacers);

    const urlElem = clone.querySelector("input.StyleFormatContextActionURL");
    urlElem.value = url;
    urlElem.addEventListener('input', saveActionContext);

    const trendAnalystConfigElem = clone.querySelector("input.StyleFormatContextActionTrendAnalystConfig");
    trendAnalystConfigElem.value = trendanalystconfig;
    trendAnalystConfigElem.addEventListener('input', saveActionContext);

    const selectLanguageElem = clone.querySelector("input.StyleFormatContextActionSelectLanguage");
    selectLanguageElem.value = selectlanguage;
    selectLanguageElem.addEventListener('input', saveActionContext);

    // Guarded like deviceElem and reportElem: a page saved before Select Theme existed has no such
    // input in its cloned template until the page markup is refreshed.
    const selectThemeElem = clone.querySelector("input.StyleFormatContextActionSelectTheme");
    if (selectThemeElem) {
        selectThemeElem.value = selecttheme;
        selectThemeElem.addEventListener('input', saveActionContext);
    }

    const loginUsernameElem = clone.querySelector("input.StyleFormatContextActionLoginUsername");
    loginUsernameElem.value = loginusername;
    loginUsernameElem.addEventListener('input', saveActionContext);

    const loginPasswordElem = clone.querySelector("input.StyleFormatContextActionLoginPassword");
    loginPasswordElem.value = loginpassword;
    loginPasswordElem.addEventListener('input', saveActionContext);

    const executePageScriptFunctionElem = clone.querySelector("textarea.StyleFormatContextActionExecutePageScriptFunction");
    executePageScriptFunctionElem.value = executepagescriptfunction;
    executePageScriptFunctionElem.addEventListener('input', saveActionContext);

    clone.setAttribute("data-actionpopuptop", popuptop);
    clone.setAttribute("data-actionpopupleft", popupleft);
    clone.setAttribute("data-actionpopupfixed", popupfixed);
    clone.setAttribute("data-actionpopupsymbolname", popupsymbolname);
    clone.setAttribute("data-actionpopupcontext", popupcontext);
    clone.setAttribute("data-actionpopupusepositioncontext", popupusepositioncontext);
    clone.setAttribute("data-actionpopupdisabledrag", popupdisabledrag);
    clone.setAttribute("data-actionpopupreplacers", popupreplacers);

    SetActionGenericDynamic(action, clone); // will also save? -> Will only save on change of properties = good
    //saveActionContext();

	// Append to container
	const container = document.getElementById("ActionStyleFormatContextDynamicContainer");

    container.appendChild(clone);

}
function DeleteActionContextDynamic(element) {

    const parentToRemove = element.closest(".ActionStyleFormatContextDynamic");

	parentToRemove.parentNode.removeChild(parentToRemove);

	saveActionContext();
}
function collectActionContext() {

    const container = document.getElementById("ActionStyleFormatContextDynamicContainer");

	const data = [];

    const items = container.querySelectorAll(".ActionStyleFormatContextDynamic");

    items.forEach(item => {

        const actionElem = item.querySelector("button.StyleFormatContextAction");

        const valueElem = item.querySelector("input.StyleFormatContextActionValue");
        const variableElem = item.querySelector("input.StyleFormatContextActionVariable");
        const recipeElem = item.querySelector("input.StyleFormatContextActionRecipe");
        const transferFromElem = item.querySelector("input.StyleFormatContextActionTransferRecipeFrom");
        const transferToElem = item.querySelector("input.StyleFormatContextActionTransferRecipeTo");
        const pythonScriptElem = item.querySelector("input.StyleFormatContextActionPythonScript");
        const deviceElem = item.querySelector("input.StyleFormatContextActionDevice");
        const reportElem = item.querySelector("input.StyleFormatContextActionReport");
        const pageElem = item.querySelector("input.StyleFormatContextActionPage");
        const urlElem = item.querySelector("input.StyleFormatContextActionURL");
        const trendAnalystConfigElem = item.querySelector("input.StyleFormatContextActionTrendAnalystConfig");
        const selectLanguageElem = item.querySelector("input.StyleFormatContextActionSelectLanguage");
        const selectThemeElem = item.querySelector("input.StyleFormatContextActionSelectTheme");
        const loginUsernameElem = item.querySelector("input.StyleFormatContextActionLoginUsername");
        const loginPasswordElem = item.querySelector("input.StyleFormatContextActionLoginPassword");
        const executePageScriptFunctionElem = item.querySelector("textarea.StyleFormatContextActionExecutePageScriptFunction");

        const action = actionElem ? (actionElem.getAttribute('data-value') || actionElem.innerHTML.trim()) : "None";
        const value = valueElem ? valueElem.value.trim() : "";
        const variable = variableElem ? variableElem.value.trim() : "";
        const recipe = recipeElem ? recipeElem.value.trim() : "";
        const transferfrom = transferFromElem ? transferFromElem.value.trim() : "";
        const transferto = transferToElem ? transferToElem.value.trim() : "";
        const pythonscript = pythonScriptElem ? pythonScriptElem.value.trim() : "";
        const device = deviceElem ? deviceElem.value.trim() : "";
        const report = reportElem ? reportElem.value.trim() : "";
        const page = pageElem ? pageElem.value.trim() : "";
        const navigatereplacers = item.getAttribute('data-actionnavigatereplacers') ?? "";
        const url = urlElem ? urlElem.value.trim() : "";
        const trendanalystconfig = trendAnalystConfigElem ? trendAnalystConfigElem.value.trim() : "";
        const selectlanguage = selectLanguageElem ? selectLanguageElem.value.trim() : "";
        const selecttheme = selectThemeElem ? selectThemeElem.value.trim() : "";
        const loginusername = loginUsernameElem ? loginUsernameElem.value.trim() : "";
        const loginpassword = loginPasswordElem ? loginPasswordElem.value.trim() : "";
        const executepagescriptfunction = executePageScriptFunctionElem ? executePageScriptFunctionElem.value.trim() : "";

        const popuptop = item.getAttribute('data-actionpopuptop') ?? "";
        const popupleft = item.getAttribute('data-actionpopupleft') ?? "";
        const popupfixed = item.getAttribute('data-actionpopupfixed') ?? "";
        const popupsymbolname = item.getAttribute('data-actionpopupsymbolname') ?? "";
        const popupcontext = item.getAttribute('data-actionpopupcontext') ?? "";
        const popupusepositioncontext = item.getAttribute('data-actionpopupusepositioncontext') ?? "";
        const popupdisabledrag = item.getAttribute('data-actionpopupdisabledrag') ?? "";
        const popupreplacers = item.getAttribute('data-actionpopupreplacers') ?? "";

        data.push({
            [action]: {
                value,
                variable,
                recipe,
                transferfrom,
                transferto,
                pythonscript,
                page,
                navigatereplacers,
                url,
                trendanalystconfig,
                selectlanguage,
                loginusername,
                loginpassword,
                executepagescriptfunction,
                popuptop,
                popupleft,
                popupfixed,
                popupsymbolname,
                popupcontext,
                popupusepositioncontext,
                popupdisabledrag,
                popupreplacers,
                device,
                report,
                selecttheme
            }
        });
	});

	return data;
}
function loadActionContext(data) {
    
    const container = document.getElementById("ActionStyleFormatContextDynamicContainer");

    container.innerHTML = "";

    data.forEach(entry => {

        const [action, params] = Object.entries(entry)[0];
        
        const {
            value = "",
            variable = "",
            recipe = "",
            transferfrom = "",
            transferto = "",
            pythonscript = "",
            page = "",
            navigatereplacers = "",
            url = "",
            trendanalystconfig = "",
            selectlanguage = "",
            loginusername = "",
            loginpassword = "",
            executepagescriptfunction = "",
            popuptop = "",
            popupleft = "",
            popupfixed = "",
            popupsymbolname = "",
            popupcontext = "",
            popupusepositioncontext = "",
            popupdisabledrag = "",
            popupreplacers = "",
            device = "",
            report = "",
            selecttheme = ""
        } = params || {};
        
        AddActionStyleFormatContextDynamic(
            action,
            value,
            variable,
            recipe,
            transferfrom,
            transferto,
            pythonscript,
            page,
            navigatereplacers,
            url,
            trendanalystconfig,
            selectlanguage,
            loginusername,
            loginpassword,
            executepagescriptfunction,
            popuptop,
            popupleft,
            popupfixed,
            popupsymbolname,
            popupcontext,
            popupusepositioncontext,
            popupdisabledrag,
            popupreplacers,
            device,
            report,
            selecttheme
        );
    });

}
function saveActionContext() {
    
    const data = collectActionContext();

    //console.log('saving');
    //console.log(data);

	for (var i = ElementsToBeDecorated.length; i >= 1; i--) {

		ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);

        //console.log(data)
        //console.log(JSON.stringify(data))

		if (ElementToBeDecorated) {
			ElementToBeDecorated.setAttribute('data-actions', JSON.stringify(data));
		}
	}

}
function MoveActionContextUp(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const previous = element.previousElementSibling;
	if (previous) {
		element.parentNode.insertBefore(element, previous);
	}

	saveActionContext();
}
function MoveActionContextDown(button, containerClass) {
	const element = button.closest(`.${containerClass}`);
	if (!element || !element.parentNode) return;

	const next = element.nextElementSibling;
	if (next) {
		element.parentNode.insertBefore(next, element);
	}

	saveActionContext();
}

// ACTIONS

function SetActionGeneric(el) {
    let action = el.getAttribute('data-value');
    SetActionGenericDynamic(action, el)
    saveActionContext();
}

function SetActionGenericDynamic(action, el) {

    var dynamic = el.closest(".ActionStyleFormatContextDynamic");

    var variableBox = dynamic.getElementsByClassName("StyleFormatContextActionVariableBox")[0];

    var valueBox = dynamic.getElementsByClassName("StyleFormatContextActionValueBox")[0];
    var pythonScriptBox = dynamic.getElementsByClassName("StyleFormatContextActionPythonScriptBox")[0];
    var deviceBox = dynamic.getElementsByClassName("StyleFormatContextActionDeviceBox")[0];
    var pageBox = dynamic.getElementsByClassName("StyleFormatContextActionPageBox")[0];
    var selectlanguageBox = dynamic.getElementsByClassName("StyleFormatContextActionSelectLanguageBox")[0];
    var popupBox = dynamic.getElementsByClassName("StyleFormatContextActionPopupBox")[0];
    var recipeBox = dynamic.getElementsByClassName("StyleFormatContextActionRecipeBox")[0];
    var transferRecipeBox = dynamic.getElementsByClassName("StyleFormatContextActionTransferRecipeBox")[0];
    var openURLBox = dynamic.getElementsByClassName("StyleFormatContextActionOpenURLBox")[0];
    var trendAnalystBox = dynamic.getElementsByClassName("StyleFormatContextActionTrendAnalystBox")[0];
    var loginBox = dynamic.getElementsByClassName("StyleFormatContextActionLoginBox")[0];
    var executePageScriptBox = dynamic.getElementsByClassName("StyleFormatContextActionExecutePageScriptBox")[0];
    var reportBox = dynamic.getElementsByClassName("StyleFormatContextActionReportBox")[0];
    var selectThemeBox = dynamic.getElementsByClassName("StyleFormatContextActionSelectThemeBox")[0];

    SetActionBoxes(action, variableBox, valueBox, pythonScriptBox, pageBox, popupBox, selectlanguageBox, recipeBox, transferRecipeBox, openURLBox, trendAnalystBox, loginBox, executePageScriptBox, deviceBox, reportBox, selectThemeBox);

    let StyleFormatContextAction = dynamic.getElementsByClassName('StyleFormatContextAction')[0];

    StyleFormatContextAction.setAttribute('data-value', action);
    StyleFormatContextAction.innerHTML = (typeof ActionTranslations !== 'undefined' && ActionTranslations[action]) || action;

}

// deviceBox, reportBox and selectThemeBox are appended last and guarded below so older callers that
// do not pass them still work.
function SetActionBoxes(action, variableBox, valueBox, pythonScriptBox, pageBox, popupBox, selectlanguageBox, recipeBox, transferRecipeBox, openURLBox, trendAnalystBox, loginBox, executePageScriptBox, deviceBox, reportBox, selectThemeBox) {

    variableBox.style.display = "none";
    valueBox.style.display = "none";
    pythonScriptBox.style.display = "none";
    pageBox.style.display = "none";
    selectlanguageBox.style.display = "none";
    popupBox.style.display = "none";
    recipeBox.style.display = "none";
    transferRecipeBox.style.display = "none";
    openURLBox.style.display = "none";
    trendAnalystBox.style.display = "none";
    loginBox.style.display = "none";
    executePageScriptBox.style.display = "none";

    if (deviceBox) {
        deviceBox.style.display = "none";
    }

    if (reportBox) {
        reportBox.style.display = "none";
    }

    if (selectThemeBox) {
        selectThemeBox.style.display = "none";
    }

    switch (action) {
        case "None":
            break;
        case "Set":
        case "Reset":
        case "Toggle":
        case "Momentary On":
            variableBox.style.display = "";
            break;
        case "Set Value":
            variableBox.style.display = "";
            valueBox.style.display = "";
            break;
        // Stage 1 of a two-stage command carries the value that will be executed, so it needs the
        // same two fields as a plain write. The other two stages act on the standing selection and
        // take the variable alone - the value is replayed from what was selected.
        case "Select Command":
            variableBox.style.display = "";
            valueBox.style.display = "";
            break;
        case "Execute Command":
        case "Cancel Selection":
            variableBox.style.display = "";
            break;
        case "Execute Script":
            pythonScriptBox.style.display = "";
            break;
        case "Navigate To":
            pageBox.style.display = "";
            break;
        case "Select Language":
            selectlanguageBox.style.display = "";
            break;
        case "OpenPopup":
            popupBox.style.display = "";
            break;
        case "Save Recipe":
            recipeBox.style.display = "";
            break;
        case "Load Recipe":
            recipeBox.style.display = "";
            break;
        case "Transfer Recipe":
            transferRecipeBox.style.display = "";
            break;
        case "Open URL":
            openURLBox.style.display = "";
            break;
        case "Trend Analyst":
            trendAnalystBox.style.display = "";
            break;
        case "Execute PageScript":
            executePageScriptBox.style.display = "";
            break;
        case "LogIn":
            loginBox.style.display = "";
            break;
        case "Restart Device":
            if (deviceBox) {
                deviceBox.style.display = "";
            }
            break;
        case "Execute Report":
            if (reportBox) {
                reportBox.style.display = "";
            }
            break;
        case "Select Theme":
            if (selectThemeBox) {
                selectThemeBox.style.display = "";
            }
            break;
        default:
            return;
    }
}
