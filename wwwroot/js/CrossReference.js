// Cross Reference JavaScript functionality
let crossReferenceTable = null;
let currentSearchResults = [];

$(document).ready(function ()
{
    initializeCrossReferenceTable();
    bindEventHandlers();
});

function escapeRegex(str)
{
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(originalText, textToHighlight)
{
    const safeText = escapeRegex(textToHighlight);
    const regex = new RegExp(safeText, "gi");

    return originalText.replace(regex, match =>
        `<span class="crossrefmarker">${match}</span>`
    );
}


function initializeCrossReferenceTable()
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
    if (crossReferenceTable)
    {
        crossReferenceTable.bootstrapTable('destroy');
    }

    crossReferenceTable = $('#crossReferenceTable').bootstrapTable({
        columns: [
            {
                field: 'isSelected',
                title: '',
                checkbox: true,
                width: 50,
                align: 'center'
            },
            {
                field: 'location',
                sortable: true,
                width: 300
            },
            {
                field: 'context',
                sortable: true,
                formatter: function (value, row, index)
                {
                    const searchTerm = $('#CrossReferenceSearchInput').val().trim();
                    const bracketIndex = value.indexOf("] ");
                    const fieldName = value.slice(0, bracketIndex+2);
                    const restOfTheValue = value.slice(bracketIndex+2);
                    const content = highlightText(restOfTheValue, searchTerm)
                    return '<div style="white-space: normal; word-break: break-word;">'
                        + fieldName + content +
                        '</div>';
                    //return '<pre >' + fieldName+ content+'</div>';
                },
            },
            {
                field: 'entityType',
                sortable: true,
                width: 100,
                formatter: function (value)
                {
                    const badges = {
                        Device: '<span class="badge" style="background-color:#0D47A1; color:#FFFFFF;">Device</span>',           // deep blue
                        Variable: '<span class="badge" style="background-color:#1B5E20; color:#FFFFFF;">Variable</span>',       // deep green
                        Page: '<span class="badge" style="background-color:#E65100; color:#FFFFFF;">Page</span>',               // deep orange
                        Alarm: '<span class="badge" style="background-color:#B71C1C; color:#FFFFFF;">Alarm</span>',           // deep red
                        Event: '<span class="badge" style="background-color:#4A148C; color:#FFFFFF;">Event</span>',           // deep purple
                        Converter: '<span class="badge" style="background-color:#006064; color:#FFFFFF;">Converter</span>',   // deep cyan/teal
                        PythonScript: '<span class="badge" style="background-color:#3E2723; color:#FFFFFF;">PythonScript</span>', // deep brown
                        Schedule: '<span class="badge" style="background-color:#827717; color:#FFFFFF;">Schedule</span>',      // deep olive/yellow
                        Parameter: '<span class="badge" style="background-color:#8277cc; color:#FFFFFF;">Parameter</span>',      // deep olive/yellow
                        UdtMember: '<span class="badge" style="background-color:#00695C; color:#FFFFFF;">UDT Member</span>',   // deep teal
                        UdtInstanceParameter: '<span class="badge" style="background-color:#37474F; color:#FFFFFF;">UDT Instance</span>' // blue grey
                    };


                    return badges[value] || value;
                }
            },
            {
                field: 'operate',
                title: '<i class="fas fa-search "></i>',
                width: 50,
                align: 'center',
                formatter: function (value, row, index)
                {
                    return '<i class="fas fa-search text-primary" style="cursor: pointer;" title="' + (window.CrossRefTranslations?.navigateToLocation || 'Navigate to location') + '"></i>';
                },
                events: {
                    'click .fa-search': function (e, value, row, index)
                    {
 
                        const entityType = row.EntityType

                        if (entityType == "Page")
                        {
                            window.location.href = `/Envision?pagename=${row.pageName}`;
                        }
                        else if (entityType == "Device")
                        {
                            window.location.href = `/${row.deviceType}Devices`;
                        }
                        else if (entityType == "Variable")
                        {
                            if (row.deviceName)
                            {
                                window.location.href = `/${row.variableType}Variables?Device=${row.deviceName}`;
                            }
                            else
                            {
                                window.location.href = `/${row.variableType}Variables`;
                            }
                           
                        }
                        else if (entityType == "UdtMember")
                        {
                            window.location.href = `/UdtManager`;
                        }
                        else if (entityType == "UdtInstanceParameter")
                        {
                            window.location.href = `/AssetManager`;
                        }
                        else if (entityType == "Report")
                        {
                            // The match is inside the template, so the Report Designer is where
                            // it can be seen and edited, not the Reports list.
                            window.location.href = `/ReportDesigner?report=${encodeURIComponent(row.reportName)}`;
                        }
                        else
                        {
                            window.location.href = `/${entityType}s`;
                        }
                    }
                }
            }
        ],
        pagination: true,
        pageSize: 10,
        pageList: [10, 25, 50, 100],
        search: true,
        searchButton:true,
        showRefresh: true,
        //showToggle: true,
        showColumns: true,
        showFullscreen: true,
        sortable: true,
        maxHeight: 800,
        data: [],
        formatShowingRows: function (from, to, total) {
            return (window.CrossRefTranslations?.showingRows || 'Showing {0} to {1} of {2} rows').replace('{0}', from).replace('{1}', to).replace('{2}', total);
        },
        formatRecordsPerPage: function (pageNumber) {
            return (window.CrossRefTranslations?.rowsPerPage || '{0} rows per page').replace('{0}', pageNumber);
        },
        formatNoMatches: function () {
            return window.CrossRefTranslations?.noMatchingRecords || 'No matching records found';
        }
    });
}

function bindEventHandlers()
{
    // Unbind existing handlers first to prevent duplicates
    $('#CrossReferenceSearchInput').off('keypress');
    $('#searchButton').off('click');
    $('#replaceButton').off('click');
    $('#CrossReferenceReplaceInput').off('keypress');
    $('#crossRefPurgeButton').off('click');

    // Search input keypress
    $('#CrossReferenceSearchInput').on('keypress', function (e)
    {
        if (e.which === 13)
        { // Enter key
            performSearch();
        }
    });

    // Search button click
    $('#searchButton').on('click', function ()
    {
        performSearch();
    });

    // Replace button click
    $('#replaceButton').on('click', function ()
    {
        performReplace();
    });

    // Replace input keypress
    $('#CrossReferenceReplaceInput').on('keypress', function (e)
    {
        if (e.which === 13)
        { // Enter key
            performReplace();
        }
    });

    // Purge button click - close Cross Reference and open Purge modal
    $('#crossRefPurgeButton').on('click', function ()
    {
        var crossRefModal = bootstrap.Modal.getInstance(document.getElementById('CrossReferenceModal'));
        if (crossRefModal)
        {
            crossRefModal.hide();
        }

        var purgeModal = document.getElementById('UnusedVariablesPurgeModal');
        var bootstrapPurgeModal = new bootstrap.Modal(purgeModal);
        bootstrapPurgeModal.show();
    });
}

// Set for the ONE search that openForRename triggers, then cleared. A rename asks for
// whole-reference matching so reviewing a rename of "Flow1" does not list "Flow10"; a search the
// user types themselves stays a plain substring search, which is what a free-text find needs.
let renameSearch = false;

function performSearch()
{
    const searchTerm = $('#CrossReferenceSearchInput').val().trim();

    if (!searchTerm)
    {
        showMessage(window.CrossRefTranslations?.pleaseEnterSearchTerm || 'Please enter a search term', 'warning');
        return;
    }

    showLoading(true);

    const searchModel = {
        SearchTerm: searchTerm,
        IncludeDevices: true,
        IncludeVariables: true,
        IncludePages: true,
        WholeReference: renameSearch
    };
    renameSearch = false;

   

    // Get the verification token with fallback
    const verificationToken = window.RequestVerificationToken || $('input[name="__RequestVerificationToken"]').val();


    $.ajax({
        type: 'POST',
        url: '/Envision?handler=SearchCrossReference',
        contentType: 'application/json',
        data: JSON.stringify(searchModel),
        headers: {
            'RequestVerificationToken': verificationToken
        },
        success: function (response)
        {
           
            showLoading(false);

            if (response.success || response.Success)
            {
                currentSearchResults = response.results || response.Results || [];

              
                updateTableData(currentSearchResults);
                showMessage(response.message || response.Message || window.CrossRefTranslations?.searchCompleted || 'Search completed successfully', 'success');
            } else
            {
                showMessage(response.message || response.Message || window.CrossRefTranslations?.searchFailed || 'Search failed', 'error');
            }
        },
        error: function (xhr, status, error)
        {
            console.error('Search error:', { xhr, status, error });
            console.error('Response text:', xhr.responseText);
            showLoading(false);

            let errorMessage = window.CrossRefTranslations?.searchFailed || 'Search failed';
            if (xhr.responseJSON && xhr.responseJSON.Message)
            {
                errorMessage = xhr.responseJSON.Message;
            }
            else if (xhr.responseText)
            {
                errorMessage = (window.CrossRefTranslations?.searchFailed || 'Search failed') + ': ' + xhr.responseText;
            }
            else
            {
                errorMessage = (window.CrossRefTranslations?.searchFailed || 'Search failed') + ': ' + error;
            }

            showMessage(errorMessage, 'error');
        }
    });
}

function GetCrossRefProgress() {

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

                    const elem = document.getElementById('crossrefprogress');
                    elem.innerHTML = response[1];

                    setTimeout(GetCrossRefProgress, 150); //TImout function to call the respective function at that time
                }
            }

        },
        failure: function (response) {

        }
    });

}

var CheckCrossRefProgress = false;
function performReplace()
{
    const replaceTerm = $('#CrossReferenceReplaceInput').val().trim();

    const selectedItems = crossReferenceTable.bootstrapTable('getSelections');

    if (selectedItems.length === 0)
    {
        showMessage(window.CrossRefTranslations?.selectToReplace || 'Please select items to replace', 'warning');
        return;
    }

    showLoading(true);

    const replaceModel = {
        SelectedItems: selectedItems,
        ReplaceTerm: replaceTerm,
        UpdatePageData: true,
        UpdateReplacers: true
    };

    $.ajax({
        type: 'POST',
        url: '/Envision?handler=ReplaceCrossReference',
        contentType: 'application/json',
        data: JSON.stringify(replaceModel),
        headers: {
            'RequestVerificationToken': window.RequestVerificationToken
        },
        success: function (response)
        {
            showLoading(false);

            if (response.success || response.Success)
            {
                const errorResults = response.errorResults;
                const msgtype = errorResults.length > 0 ? "warning" : "success";
                showMessage(response.message || window.CrossRefTranslations?.replaceCompleted || 'Replace completed successfully', msgtype);

                if (errorResults.length > 0) {
                    const errors = errorResults.map((e) => e.errorMessage || e.ErrorMessage || e.replaceError || String(e));

                    showMessage(errors, "error");
                }

               
                // Update the current page content silently
                updatePageContent(replaceTerm);


                refreshDecorators();
                RefreshVariablesList();
                performSearch();
            }
            else
            {
                showMessage(response.message || response.Message || window.CrossRefTranslations?.replaceFailed || 'Replace failed', 'error');
            }
        },
        error: function (xhr, status, error)
        {
            showLoading(false);
            showMessage((window.CrossRefTranslations?.replaceFailed || 'Replace failed') + ': ' + error, 'error');
        }
    });
}

function updateTableData(data)
{
    crossReferenceTable.bootstrapTable('load', data);
}

function showLoading(show)
{
    if (show)
    {
        CheckCrossRefProgress = true;
        GetCrossRefProgress();

        $(" .modal-body .table-responsive").hide();

        // Add loading indicator
        /*$('#CrossReferenceModal .modal-bodyaappend('<div id="loadingOverlay" class=" w-100 d-flex justify-content-center align-items-center" style="background: rgba(255,255,255,0); height:50vh; z-index: 1000; border:1px solid red;"><div class="spinner-border text-primary" role="status"></div><div style="float:none;border:1px solid blue;"><span id="crossrefprogress">Loading...</span></div></div>');*/

        $('#CrossReferenceModal .modal-body').append(
            '<div id="loadingOverlay" ' +
            'class="w-100 d-flex flex-column justify-content-center align-items-center" ' +
            'style="background: rgba(255,255,255,0); height:50vh; z-index:1000;">' +

            '<div class="spinner-border text-primary mb-3" role="status"></div>' +

            '<div><span id="crossrefprogress">' + (window.CrossRefTranslations?.loading || 'Loading...') + '</span></div>' +
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
    const msgClass = type == "error" ? "cross-reference-error-" + randomStr : "cross-reference-message";
    const alertClass = type === 'success' ? 'alert-success' :
        type === 'warning' ? 'alert-warning' :
            type === 'error' ? 'alert-danger' : 'alert-info';

    $(`.cross-reference-message`).remove();

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

    $('#CrossReferenceModal .modal-body').prepend(messageHtml);

    // Auto-dismiss after 5 seconds
    if (type !== "error") {
        setTimeout(function () {
           
            $(`.${msgClass}`).fadeOut();
        }, 5000);
    }
}

// Opens Cross Reference on a rename that has just been saved: the old name in Search, the new one
// in Replace, and the results already listed, so the operator can rewire the references one by one
// instead of all at once. Called from the rename prompt on the variable pages (EntityModal.js).
function openForRename(oldName, newName, wholeReference)
{
    const modalElement = document.getElementById('CrossReferenceModal');
    if (!modalElement) return;

    $('#CrossReferenceSearchInput').val(oldName);
    $('#CrossReferenceReplaceInput').val(newName);

    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modal.show();

    // A variable name is a whole reference. A device name is only ever part of one
    // ("PLC1" inside "PLC1.Flow"), so that review has to stay a substring search.
    renameSearch = wholeReference !== false;
    performSearch();
}

// Export functions for global access
window.CrossReference = {
    performSearch: performSearch,
    performReplace: performReplace,
    showMessage: showMessage,
    updatePageContent: updatePageContent,
    openForRename: openForRename
};


function updatePageContent(replaceTerm)
{
    try
    {
        // Get the search term from the current search results
        const searchTerm = currentSearchResults[0]?.searchTerm || $('#CrossReferenceSearchInput').val().trim();

        if (!searchTerm)
        {
            console.log('No search term found for page content update');
            return;
        }

        // Get selected items from the table
        const selectedItems = crossReferenceTable.bootstrapTable('getSelections');
        
        // Filter to only include Page-type results that have htmlParentElementId
        const pageItems = selectedItems.filter(item => 
            item.entityType === 'Page' && 
            item.htmlParentElementId && 
            item.htmlParentElementId.trim() !== ''
        );

        if (pageItems.length === 0)
        {
         
            showMessage(window.CrossRefTranslations?.dbUpdatedNoPageElements || 'Database updated successfully. No page elements found for DOM update.', 'success');
            return;
        }

        let totalUpdatedCount = 0;

        // Process each page item that has a parent element ID
        pageItems.forEach(item => {
            const parentElementId = item.htmlParentElementId;
            const dataAttribute = item.dataAttribute;
            const originalDataValue = item.dataValue;

            // Find the parent element by ID
            const parentElement = document.getElementById(parentElementId);
            
            if (!parentElement)
            {
                //console.log(`Parent element with ID "${parentElementId}" not found in DOM`);
                return; // Skip this item if parent not found
            }

            // Find all child elements within this parent that have data attributes using XPath
            const xpath = ".//*[@*[starts-with(name(), 'data-')]]";
            const result = document.evaluate(xpath, parentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
           

            let itemUpdatedCount = 0;

            // Process each child element
            for (let i = 0; i < result.snapshotLength; i++) {
                const childElement = result.snapshotItem(i);
                const attributes = childElement.attributes;

                for (let j = 0; j < attributes.length; j++)
                {
                    const attribute = attributes[j];

                    // Check if it's a data-* attribute with the same name
                    if (attribute.name===dataAttribute)
                    {
                        const originalValue = attribute.value;

                        // Perform case-insensitive word replacement
                        const regex = new RegExp('\\b' + searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
                        const newValue = originalValue.replace(regex, replaceTerm);

                        // Update the attribute if it changed
                        if (newValue !== originalValue)
                        {
                            attribute.value = newValue;
                            itemUpdatedCount++;
                            totalUpdatedCount++;
                         
                        }
                    }
                }
            }

       
        });

  

        if (totalUpdatedCount > 0)
        {
            showMessage((window.CrossRefTranslations?.updatedAttributes || 'Successfully updated {0} data attributes on the current page.').replace('{0}', totalUpdatedCount), 'success');
        }
        else
        {
            showMessage(window.CrossRefTranslations?.dbUpdatedNoMatchingAttributes || 'Database updated successfully. No matching data attributes found.', 'success');
        }

    } catch (error)
    {
        console.error('Error updating page content:', error);
        showMessage((window.CrossRefTranslations?.dbUpdatedPageFailed || 'Database updated. Page content update failed: ') + error.message, 'warning');
    }
}

