var NavigateReplacers = [];
var NavigatePageReplacers = [];
var NavigateActionDynamic

async function EditNavigateReplacersModal(el) {

    NavigateActionDynamic = el.closest(".ActionStyleFormatContextDynamic");

    //console.log(NavigateActionDynamic);

    const pageElem = NavigateActionDynamic.querySelector("input.StyleFormatContextActionPage");
    var PageName = pageElem ? pageElem.value.trim() : "";

    // get it from StyleFormatContextActionPage ?? 


    // get the replacers of the page from the server
    NavigatePageReplacers = await GetPageReplacers(PageName);

    //console.log(NavigatePageReplacers);

    //return;

    NavigateReplacers = NavigateActionDynamic.getAttribute("data-actionnavigatereplacers");

    console.log(NavigatePageReplacers);

    InitRedrawEditNavigateReplacers();


    document.getElementById('EditNavigateReplacerPageInfoOK').innerHTML = "";
    document.getElementById('EditNavigateReplacerPageInfoNOK').innerHTML = "";

    if (NavigatePageReplacers !== null) {

        if (NavigatePageReplacers == '') {
            document.getElementById('EditNavigateReplacerPageInfoNOK').innerHTML = PageName + " page has no replacers configured.";
        }
        else {
            var pagereplacers = JSON.parse(NavigatePageReplacers);

            if (pagereplacers) {
                document.getElementById('EditNavigateReplacerPageInfoOK').innerHTML = PageName + " has " + pagereplacers.length + " replacers.";
            }
        }


    }
    else {
        if (PageName == '') {
            document.getElementById('EditNavigateReplacerPageInfoNOK').innerHTML = "No Page Provided";
        }
        else {
            document.getElementById('EditNavigateReplacerPageInfoNOK').innerHTML = "Page '" + PageName + "' not found";
        }

    }



    var myModal = new bootstrap.Modal(document.getElementById('EditNavigateReplacersModal'));
    myModal.show();

}
function InitRedrawEditNavigateReplacers() {

    var pagereplacers;

    if (NavigatePageReplacers) {
        pagereplacers = JSON.parse(NavigatePageReplacers);

    }

    var EditNavigateReplacersList = document.getElementById('EditNavigateReplacersList');

    var EditNavigateReplacer = document.getElementById('EditNavigateReplacer');

    EditNavigateReplacersList.innerHTML = "";

    var count = 0;

    if (NavigateReplacers) {

        var navigatereplacers = JSON.parse(NavigateReplacers);

        //console.log(navigatereplacers);
        navigatereplacers.forEach(function (replacer) {

            //console.log(replacer.label + ' - ' + replacer.value);

            var clone = EditNavigateReplacer.cloneNode(true);
            clone.removeAttribute("id");

            var label = clone.getElementsByClassName("EditNavigateReplacerLabel")[0];
            var placeholder = clone.getElementsByClassName("EditNavigateReplacerPlaceholder")[0];
            var value = clone.getElementsByClassName("EditNavigateReplacerValue")[0];
            var del = clone.getElementsByClassName("EditNavigateReplacerDelete")[0];

            label.value = "Replacer " + (count + 1);
            placeholder.value = "Placeholder " + (count + 1);

            if (pagereplacers) {
                if (pagereplacers[count]) {
                    label.value = pagereplacers[count].label;
                    placeholder.value = pagereplacers[count].value;
                }
            }

            label.removeAttribute("id");
            value.removeAttribute("id");
            placeholder.removeAttribute("id");

            //console.log(replacer);
            value.value = replacer;
            del.setAttribute("data-itemno", count);

            clone.style.display = "flex";

            EditNavigateReplacersList.appendChild(clone);

            count = count + 1;
        });
    }

    if (pagereplacers) {
        while (pagereplacers.length > count) {

            AddNavigateReplacers();
            count = count + 1;
        }
    }
}
function RedrawEditNavigateReplacers() {

    var pagereplacers;

    if (NavigatePageReplacers) {
        pagereplacers = JSON.parse(NavigatePageReplacers);
    }

    var EditNavigateReplacersList = document.getElementById('EditNavigateReplacersList');

    var EditNavigateReplacer = document.getElementById('EditNavigateReplacer');

    EditNavigateReplacersList.innerHTML = "";

    if (NavigateReplacers) {

        var count = 0;

        var navigatereplacers = JSON.parse(NavigateReplacers);

        //console.log(navigatereplacers);
        navigatereplacers.forEach(function (replacer) {

            //console.log(replacer.label + ' - ' + replacer.value);

            var clone = EditNavigateReplacer.cloneNode(true);
            clone.removeAttribute("id");

            var label = clone.getElementsByClassName("EditNavigateReplacerLabel")[0];
            var placeholder = clone.getElementsByClassName("EditNavigateReplacerPlaceholder")[0];
            var value = clone.getElementsByClassName("EditNavigateReplacerValue")[0];
            var del = clone.getElementsByClassName("EditNavigateReplacerDelete")[0];

            label.value = "Replacer " + (count + 1);
            placeholder.value = "Placeholder " + (count + 1);

            if (pagereplacers) {
                if (pagereplacers[count]) {
                    label.value = pagereplacers[count].label;
                    placeholder.value = pagereplacers[count].value;
                }
            }

            label.removeAttribute("id");
            value.removeAttribute("id");
            placeholder.removeAttribute("id");

            //console.log(replacer);
            value.value = replacer;
            del.setAttribute("data-itemno", count);

            clone.style.display = "flex";

            EditNavigateReplacersList.appendChild(clone);

            count = count + 1;
        });

    }
}
function AddNavigateReplacers() {

    SaveNavigateReplacers();

    var navigatereplacers = [];

    if (NavigateReplacers) {
        navigatereplacers = JSON.parse(NavigateReplacers);
    }

    navigatereplacers.push("");

    NavigateReplacers = JSON.stringify(navigatereplacers);

    //console.log(NavigateReplacers);

    RedrawEditNavigateReplacers();

}
function DeleteNavigateReplacer(el) {

    SaveNavigateReplacers();

    var itemno = el.getAttribute("data-itemno");

    var navigatereplacers = [];

    if (NavigateReplacers) {
        navigatereplacers = JSON.parse(NavigateReplacers);
    }

    //console.log("itemno " + itemno);

    navigatereplacers.splice(itemno, 1);

    NavigateReplacers = JSON.stringify(navigatereplacers);

    RedrawEditNavigateReplacers();

}
function EditNavigateReplacers(el) {

    SaveNavigateReplacers();

    NavigateActionDynamic.setAttribute("data-actionnavigatereplacers", NavigateReplacers);

    saveActionContext();

}
function SaveNavigateReplacers() {

    var navigatereplacers = [];

    var EditNavigateReplacersList = document.getElementById('EditNavigateReplacersList');

    var EditNavigateReplacers = EditNavigateReplacersList.querySelectorAll(":scope > div");

    for (const replaceinfo of EditNavigateReplacers) {

        var value = replaceinfo.getElementsByClassName("EditNavigateReplacerValue")[0].value;

        navigatereplacers.push(value);

        //console.log(replacer);
    }


    NavigateReplacers = JSON.stringify(navigatereplacers);
}

// PAGE "MASTER""
function EditPageReplacersModal(el) {

    RedrawEditPageReplacers();

    var myModal = new bootstrap.Modal(document.getElementById('EditPageReplacersModal'));
    myModal.show();

}
function RedrawEditPageReplacers() {

    var EditPageReplacersList = document.getElementById('EditPageReplacersList');

    var EditPageReplacer = document.getElementById('EditPageReplacer');

    EditPageReplacersList.innerHTML = "";

    //console.log(PageReplacers);

    if (PageReplacers) {

        var count = 0;

        var pagereplacers = JSON.parse(PageReplacers);

        pagereplacers.forEach(function (replacer) {

            //console.log(replacer.label + ' - ' + replacer.value);

            var clone = EditPageReplacer.cloneNode(true);
            clone.removeAttribute("id");

            var label = clone.getElementsByClassName("EditPageReplacerLabel")[0];
            var value = clone.getElementsByClassName("EditPageReplacerValue")[0];
            var del = clone.getElementsByClassName("EditPageReplacerDelete")[0];

            label.removeAttribute("id");
            label.value = replacer.label;
            value.removeAttribute("id");
            value.value = replacer.value;
            del.setAttribute("data-itemno", count);

            clone.style.display = "flex";

            EditPageReplacersList.appendChild(clone);

            count = count + 1;
        });

    }
}
function AddPageReplacers() {

    SavePageReplacers();

    var pagereplacers = [];

    if (PageReplacers) {
        pagereplacers = JSON.parse(PageReplacers);
    }

    const replacer = new pagereplacer("", "");

    pagereplacers.push(replacer);

    PageReplacers = JSON.stringify(pagereplacers);

    RedrawEditPageReplacers();

}
function DeletePageReplacer(el) {

    SavePageReplacers();

    var itemno = el.getAttribute("data-itemno");

    var pagereplacers = [];

    if (PageReplacers) {
        pagereplacers = JSON.parse(PageReplacers);
    }

    //console.log("itemno " + itemno);

    pagereplacers.splice(itemno, 1);

    PageReplacers = JSON.stringify(pagereplacers);

    RedrawEditPageReplacers();

}
function EditPageReplacers() {

    SavePageReplacers();

}
function SavePageReplacers() {

    var pagereplacers = [];

    var EditPageReplacersList = document.getElementById('EditPageReplacersList');

    var EditPageReplacers = EditPageReplacersList.querySelectorAll(":scope > div");

    for (const replaceinfo of EditPageReplacers) {

        var label = replaceinfo.getElementsByClassName("EditPageReplacerLabel")[0];
        var value = replaceinfo.getElementsByClassName("EditPageReplacerValue")[0];


        var replacer = new pagereplacer(label.value, value.value);

        pagereplacers.push(replacer);

        //console.log(replacer);
    }


    PageReplacers = JSON.stringify(pagereplacers);

}