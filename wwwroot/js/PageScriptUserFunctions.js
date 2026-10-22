
function PageNavigate(pagename) {

    DoActionNavigate(pagename);

}

function PageReadVariable(variable) {

    if (typeof VarDict[variable] !== 'undefined') {

        return VarDict[variable][0];
    }

}

function PageReadIntVariable(variable) {
    return parseInt(PageReadVariable(variable));
}

function PageReadFloatVariable(variable) {
    return parseFloat(PageReadVariable(variable));
}

function PageReadBoolVariable(variable) {
    return parseBoolean(PageReadVariable(variable));
}

function PageWriteVariable(variable, value, silent = true) {

    var value = value.toString();

    if (value !== 'NaN') {
        DoAction('Set Value', variable, value, silent);
    }

}

function PageGetSelectedDataTable(name) {

    var Data = [];

    var DataTable = document.getElementById("EnvisionPage").querySelectorAll('[data-datatablename="' + name + '"]')[0];

    if (DataTable) {

        var SelectedRow = DataTable.getElementsByClassName("selected")[0];

        if (SelectedRow) {

            var Columns = SelectedRow.getElementsByTagName("td");

            if (Columns) {

                for (var i = 0; i < Columns.length; i++) {

                    var column = Columns[i];

                    Data.push(column.innerHTML);

                }
            }
        } 
    }

    return Data;

}

function PageDeselectDataTable(name) {

    var Data = [];

    var DataTable = document.getElementById("EnvisionPage").querySelectorAll('[data-datatablename="' + name + '"]')[0];

    if (DataTable) {

        var SelectedRow = DataTable.getElementsByClassName("selected")[0];

        if (SelectedRow) {

            SelectedRow.classList.remove('selected');
            SelectedRow.style.backgroundColor = "";
            SelectedRow.style.color = "";
        }
    }

    return Data;

}

function PageRefreshDataTable(name) {

    var Data = [];

    var DataTable = document.getElementById("EnvisionPage").querySelectorAll('[data-datatablename="' + name + '"]')[0];

    if (DataTable) {

        GetDataTableData(DataTable.parentElement.id);
    }

    return Data;

}

function PageFillDataTableDynamic(name, database, connstring, sqlquery, header) {

    var Data = [];

    var DataTable = document.getElementById("EnvisionPage").querySelectorAll('[data-datatablename="' + name + '"]')[0];

    if (DataTable) {

        GetDataTableDataDynamic(DataTable.parentElement.id, database, connstring, sqlquery, header);
    }

    return Data;

}

function PageLogin(username, password) {

    Login(username, password);

}

async function PageDatabaseQuery(database, connstring, sqlquery) {

    return await DatabaseQuery(database, connstring, sqlquery);

}

// Lists the documents in one folder, newest first, so a page script can build its own picker
// (previous/next, a date, "the latest one") from what actually exists instead of constructing a
// path from a naming convention. Returns only what this operator could also open: the folder must
// be listed in the DocumentViewerAccess parameter for one of their user groups.
//
// Each entry: { name, path, date, modifiedUtc, size }. 'date' is the day the document is FOR and is
// EMPTY unless the pattern spelled the date out with strftime tokens ("Daily_%Y-%m-%d.pdf") - nothing
// is ever inferred from a file name. 'modifiedUtc' is when the file was written, as a marked UTC
// instant. Returns an empty array when the folder is not listed, cannot be reached, or holds nothing
// matching - use PageDocumentFilesTruncated() after the call to find out whether the answer was
// capped.
//
// from/to are optional and narrow by that declared date, inclusive, at the precision the pattern
// declared - so a pattern carrying %H%M%S supports a window of hours. Without date tokens there is
// nothing to compare against and they are ignored. They accept anything a DateTimePicker writes
// ("2026-07-28", "2026-07-28T14:30:00", an ISO instant); an empty or unreadable bound is no bound,
// and an upper bound with no time covers the whole day.
async function PageListDocuments(folder, pattern, take, from, to) {

    var answer = await FetchDocumentFiles(folder, pattern, take, from, to);

    PageDocumentFilesLastAnswer = answer;

    return answer.files || [];
}

var PageDocumentFilesLastAnswer = null;

// True when the last PageListDocuments call hit the cap and there are older documents it did not
// return. Say so on the page: a capped list is indistinguishable from a missing document to an
// operator looking for one.
function PageDocumentFilesTruncated() {
    return PageDocumentFilesLastAnswer !== null && PageDocumentFilesLastAnswer.truncated === true;
}

function PageAddVariable(variable) {

    ScriptVars[variable] = 0;

}

function PageAlarmBannerAcknowledgeAll(name) {

    var AlarmBanner = document.getElementById("EnvisionPage").querySelectorAll('[data-alarmbannername="' + name + '"]')[0];

    if (AlarmBanner) {

        Columns = AlarmBanner.getElementsByClassName("AlarmBannerIdColumn");
        AckTimeColumns = AlarmBanner.getElementsByClassName("AlarmBannerAckTimeColumn");

        idtoack = [];

        for (var i = 0; i < Columns.length; i++) {

            if (AckTimeColumns[i]) {

                if (AckTimeColumns[i].innerHTML == "") {

                    if (Columns[i]) {
                        idtoack.push(Columns[i].innerHTML);
                    }
                }
            }

        }

        if (idtoack.length == 0) {
            var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
            document.getElementById('ModalMessage').innerHTML = "No alarms to acknowledge.";
            myModal.show();
        }
        else {
            historic = false;
            var ackModal = new bootstrap.Modal(document.getElementById('AcknowledgeModal'));
            ackModal.show();
        }
    }

}

function PageAlarmBannerRemoveAll(name) {

    
    var AlarmBanner = document.getElementById("EnvisionPage").querySelectorAll('[data-alarmbannername="' + name + '"]')[0];

    if (AlarmBanner) {

        Columns = AlarmBanner.getElementsByClassName("AlarmBannerIdColumn");

        idtoremove = [];

        for (var i = 0; i < Columns.length; i++) {

            if (Columns[i]) {
                idtoremove.push(Columns[i].innerHTML);
            }

        }

        if (idtoremove.length > 0) {
            RemoveActiveAlarm(idtoremove);
        }
        else {
            var myModal = new bootstrap.Modal(document.getElementById('MessageModal'));
            document.getElementById('ModalMessage').innerHTML = "No alarms to remove.";
            myModal.show();
        }

    }

}

function PagePublishDeviceVariables(deviceName) {

    PublishDeviceVariables(deviceName);

}

function PageSetLayerVisibility(layer, hide) {
    SetLayerVisibility(layer, hide);
}

function PageSetLayerVisibilityByName(layerName, hide) {
    SetLayerVisibilityByName(layerName, hide);
}

function PageOpenPopup(callerId, popupJson) {
    try {
        if (!popupJson) {
            console.warn("PageOpenPopup: missing popupJson");
            return;
        }

        let popup = popupJson.OpenPopup ? popupJson.OpenPopup : popupJson;

        if (!popup) {
            console.warn("PageOpenPopup: invalid popupJson");
            return;
        }

        // 🔥 Check if popup already exists
        let existingPopup = GetPopupByCallerId(callerId);

        if (existingPopup) {
            // Optional: bring to front instead of doing nothing
            existingPopup.style.zIndex = "999";
            return;
        }

        let top = popup.popuptop ?? "0px";
        let left = popup.popupleft ?? "0px";
        let fixed = "true"; // forced

        let symbolName = popup.popupsymbolname || "";
        let context = popup.popupcontext || "";
        let usePositionContext = popup.popupusepositioncontext || "";
        let disableDrag = popup.popupdisabledrag || "";

        let replacers = [];

        if (popup.popupreplacers) {
            if (typeof popup.popupreplacers === "string") {
                replacers = JSON.parse(popup.popupreplacers);
            } else {
                replacers = popup.popupreplacers;
            }
        }

        OpenPopupOrdered(
            callerId,
            top,
            left,
            fixed,
            symbolName,
            disableDrag,
            context,
            usePositionContext,
            replacers
        );

    } catch (error) {
        console.error("PageOpenPopup error:", error, popupJson);
        alert(error);
    }
}