// Cross Reference JavaScript functionality
let table = null;
let currentUnusedVariables = []
const ignoreVariableNamesList = ["SYSTEM.", ".ChannelState",".ExecutionTime",".Status"];

let timer


$(document).ready(function ()
{

    initializeTable();
    bindEventHandlers();

});


function initializeTable()
{

    $.fn.bootstrapTable.defaults.icons = {
        paginationSwitchDown: 'fas fa-caret-square-down',
        paginationSwitchUp: 'fas fa-caret-square-up',
        refresh: 'fas fa-sync',
        toggleOff: 'fas fa-toggle-off',
        toggleOn: 'fas fa-toggle-on',
        columns: 'fas fa-th-list',
        fullscreen: 'fas fa-arrows-alt',
        detailOpen: 'fas fa-plus',
        detailClose: 'fas fa-minus'
    };

    // Destroy existing table if it exists
    if (table)
    {
        table.bootstrapTable('destroy');
    }

    table = $('#unusedVariablesPurgeTable').bootstrapTable({
        columns: [
            {
                field: 'isSelected',
                title: '',
                checkbox: true,
                width: 50,
                align: 'center'
            },
            {
                field: 'name',
                sortable: true,
            },
            ],
        pagination: true,
        pageSize: 10,
        pageList: [10, 25, 50, 100],
        sortable: true,
        maxHeight: 800,
        data: [],
        formatShowingRows: function (from, to, total) {
            return (window.PurgeTranslations?.showingRows || 'Showing {0} to {1} of {2} rows').replace('{0}', from).replace('{1}', to).replace('{2}', total);
        },
        formatRecordsPerPage: function (pageNumber) {
            return (window.PurgeTranslations?.rowsPerPage || '{0} rows per page').replace('{0}', pageNumber);
        },
        formatNoMatches: function () {
            return window.PurgeTranslations?.noMatchingRecords || 'No matching records found';
        }
    });
}

function bindEventHandlers()
{
    // Unbind existing handlers first to prevent duplicates
    $('#UnusedVariablesPurgeSearchInput').off('keypress');
    $('#unusedVariablesFindUnusedButton').off('click');
    $('#unusedVariablesPurgeButton').off('click');



    // Search input keypress
    $('#UnusedVariablesPurgeSearchInput').on('keypress', function (e)
    {
        if (e.which === 13)
        { // Enter key
            performSearch();
        }
    });

    $('#UnusedVariablesPurgeSearchInput').on('input', function (e)
    {
        clearTimeout(timer);
        timer = setTimeout(performSearch, 300);

    });

    // Find Unused button click
    $('#unusedVariablesFindUnusedButton').on('click', function ()
    {
        findAllUnusedVariables();
    });

    // Purge button click
    $('#unusedVariablesPurgeButton').on('click', function (e)
    {
        purgeUnusedVariables()
    });
}

function performSearch()
{
    const text = $('#UnusedVariablesPurgeSearchInput').val()
    let data = currentUnusedVariables.filter(v => v.name.toLowerCase().includes(text.toLowerCase())).map(v =>
    {
        return { name: v.name }
    });

    table.bootstrapTable("load", data)
}

function findAllUnusedVariables()
{
    showLoading(true);
    $('#unusedVariablesResultControls').hide();
    $('#UnusedVariablesPurgeSearchInput').val("")

    // Get the verification token with fallback
    const verificationToken = window.RequestVerificationToken || $('input[name="__RequestVerificationToken"]').val();

    $.ajax({
        type: 'POST',
        url: '/Envision?handler=FindAllUnusedVariables',
        contentType: 'application/json',
        headers: {
            'RequestVerificationToken': verificationToken
        },
        success: function (response)
        {
            console.log({response})
            showLoading(false);

            const newData = response.filter(i => i.isUnused == true).map(i =>
            {
                return {
                    name:i.variable
                }
            })
            currentUnusedVariables = newData;
            updateTableData(newData);
            showMessage(PurgeTranslations.foundUnused.replace('{0}', newData.length), 'success');

            if (newData.length > 0)
            {
                $('#unusedVariablesResultControls').show();
            }
            else
            {
                $('#unusedVariablesResultControls').hide();
            }

        },
        error: function (xhr, status, error)
        {
            console.error('Search error:', { xhr, status, error });
            console.error('Response text:', xhr.responseText);
            showLoading(false);
            currentUnusedVariables = [];
            $('#unusedVariablesFindUnusedButton').show()

            let errorMessage = PurgeTranslations.searchFailed;
            if (xhr.responseJSON && xhr.responseJSON.Message)
            {
                errorMessage = xhr.responseJSON.Message;
            }
            else if (xhr.responseText)
            {
                errorMessage = PurgeTranslations.searchFailed + ': ' + xhr.responseText;
            }
            else
            {
                errorMessage = PurgeTranslations.searchFailed + ': ' + error;
            }

            showMessage(errorMessage, 'error');
        }
    });
}

function GetProgressPurge() {

    $.ajax({
        type: "POST",
        url: '/Envision?handler=GetProgress',
        contentType: "application/json",
        //data: JSON.stringify(Data),
        dataType: "json",
        headers: {
            'RequestVerificationToken': window.RequestVerificationToken
        },
        success: function (response) {

            if (response != null) {

                if (CheckCrossRefProgress == true) {

                    //console.log(response[0] + ' ' + response[1]);

                    const elem = document.getElementById('unusedVariablesPurgeprogress');
                    elem.innerHTML = response[1];

                    setTimeout(GetProgressPurge, 150); //TImout function to call the respective function at that time
                }
            }

        },
        failure: function (response) {

        }
    });

}

var CheckCrossRefProgress = false;
function purgeUnusedVariables()
{
 

    const selectedItems = table.bootstrapTable('getSelections');

    if (selectedItems.length === 0)
    {
        showMessage(PurgeTranslations.selectToPurge, 'warning');
        return;
    }

    showLoading(true);



    const purgeOptions = {
        UnusedVariableList: selectedItems.map(v=>v.name),
 
    };

    $.ajax({
        type: 'POST',
        url: '/Envision?handler=PurgeUnusedVariables',
        contentType: 'application/json',
        data: JSON.stringify(purgeOptions),
        headers: {
            'RequestVerificationToken': window.RequestVerificationToken
        },
        success: function (response)
        {
            showLoading(false);

            console.log({aaaa:response})

            if (response.success || response.Success)
            {
                // Collect successfully purged variable names
                const purgedNames = response.result
                    .filter(v => v.success == true)
                    .map(v => v.variable);

                // Remove purged entries from the current list
                currentUnusedVariables = currentUnusedVariables
                    .filter(v => !purgedNames.some(p => v.name.endsWith('.' + p) || v.name === p));

                // Re-apply filter and update table
                performSearch();

                if (response.totalCount == response.purgedCount)
                {
                    showMessage(PurgeTranslations.purgedAll, 'success');
                } else
                {
                    showMessage(PurgeTranslations.purgedPartial.replace('{0}', response.purgedCount).replace('{1}', response.totalCount), 'success');
                    const errorMsg = response.result.filter(v => v.success == false).map(v => v.message);
                    if (errorMsg.length > 0) showMessage(errorMsg, 'error');
                }

                // If no more unused variables, hide result controls
                if (currentUnusedVariables.length === 0)
                {
                    $('#unusedVariablesResultControls').hide();
                    $('#unusedVariablesFindUnusedButton').show();
                }
            }
            else
            {
                const errorMsg = response.result.filter(v => v.success == false).map(v => v.message);
                showMessage(errorMsg, 'error');
            }
        },
        error: function (xhr, status, error)
        {
            showLoading(false);
            showMessage(PurgeTranslations.purgeFailed + ': ' + error, 'error');
        }
    });
}

function updateTableData(data)
{
    table.bootstrapTable('load', data);
    console.log("updateTableData")
}

function updateColumnTitle(columnField, newTitle)
{
    table.bootstrapTable('updateColumnTitle', { field: columnField, title: newTitle })
}

function showLoading(show)
{
    if (show)
    {
        CheckCrossRefProgress = true;
        GetProgressPurge();

        $(" .modal-body .table-responsive").hide();

        // Add loading indicator
        /*$('#UnusedVariablesPurgeModal .modal-bodyaappend('<div id="loadingOverlay" class=" w-100 d-flex justify-content-center align-items-center" style="background: rgba(255,255,255,0); height:50vh; z-index: 1000; border:1px solid red;"><div class="spinner-border text-primary" role="status"></div><div style="float:none;border:1px solid blue;"><span id="unusedVariablesPurgeprogress">Loading...</span></div></div>');*/

        $('#UnusedVariablesPurgeModal .modal-body').append(
            '<div id="loadingOverlay" ' +
            'class="w-100 d-flex flex-column justify-content-center align-items-center" ' +
            'style="background: rgba(255,255,255,0); height:50vh; z-index:1000;">' +

            '<div class="spinner-border text-primary mb-3" role="status"></div>' +

            '<div><span id="unusedVariablesPurgeprogress">' + PurgeTranslations.loading + '</span></div>' +
            '</div>'
        );

    }
    else
    {
        CheckCrossRefProgress = false;
        // Remove loading indicator
        $('#loadingOverlay').remove();
        $(" .modal-body .table-responsive").show();
    }
}

function showMessage(message, type)
{
    let messageContent = message;
    const randomStr = Math.random().toString().replace(".","")+ Date.now();
    const msgClass = type == "error" ? "unused-variables-purge-error-" + randomStr : "unused-variables-purge-message";
    const alertClass = type === 'success' ? 'alert-success' :
        type === 'warning' ? 'alert-warning' :
            type === 'error' ? 'alert-danger' : 'alert-info';

    $(`.unused-variables-purge-message`).remove();

    if (type === "error" && Array.isArray(message)) {
        messageContent = message.map(m => {
            return `<p>${m}</p>`;
        });

       messageContent= messageContent.join("");
    }

    const messageHtml = `
        <div class="${msgClass} alert ${alertClass} alert-dismissible fade show" role="alert">
            ${messageContent}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    $('#UnusedVariablesPurgeModal .modal-body').prepend(messageHtml);

    // Auto-dismiss after 5 seconds
    if (type !== "error") {
        setTimeout(function () {
           
            $(`.${msgClass}`).fadeOut();
        }, 5000);
    }
}

// Export functions for global access
window.CrossReference = {
    performSearch: performSearch,
    showMessage: showMessage,
};





