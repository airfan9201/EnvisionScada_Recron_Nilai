let EnvisionChatMessages = [];
let EnvisionChatSending = false;
let EnvisionChatToolActivities = [];
let EnvisionChatPendingConfirmation = null;
let EnvisionChatDocuments = [];
let EnvisionChatDocumentsExpanded = false;
let EnvisionChatToolActivityExpanded = false;
let EnvisionChatIsResizing = false;
let EnvisionChatResizeStartX = 0;
let EnvisionChatResizeStartWidth = 0;
let EnvisionChatIsToolActivityResizing = false;
let EnvisionChatToolActivityResizeStartX = 0;
let EnvisionChatToolActivityResizeStartWidth = 0;

const EnvisionChatMessagePreviewLength = 560;

const EnvisionChatSidebarMinWidth = 320;
const EnvisionChatSidebarDefaultWidth = 420;
const EnvisionChatSidebarToolActivityExpandedMinWidth = 720;
const EnvisionChatToolActivityMinWidth = 240;
const EnvisionChatToolActivityDefaultWidth = 320;
const EnvisionChatToolActivityMainPanelMinWidth = 280;
const EnvisionChatSidebarStorageKey = 'EnvisionChatSidebarWidth';
const EnvisionChatToolActivityWidthStorageKey = 'EnvisionChatToolActivityWidth';
const EnvisionChatSidebarPreToolActivityWidthStorageKey = 'EnvisionChatSidebarPreToolActivityWidth';
const EnvisionChatSessionStorageKey = 'EnvisionChatSessionState';
const EnvisionChatReopenAfterReloadStorageKey = 'EnvisionChatReopenAfterReload';

function IsEnvisionChatEnabled() {
    return !!(window.EnvisionChatConfig && window.EnvisionChatConfig.enabled);
}

function GetEnvisionChatTimestampText() {
    const now = new Date();
    const pad = function (value) {
        return value.toString().padStart(2, '0');
    };

    return now.getFullYear().toString()
        + pad(now.getMonth() + 1)
        + pad(now.getDate())
        + '-'
        + pad(now.getHours())
        + pad(now.getMinutes())
        + pad(now.getSeconds());
}

function DownloadEnvisionChatJsonFile(fileName, data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
    }, 0);
}

function CreateEnvisionChatToolActivityExportModel(activity, index) {
    return {
        index: index,
        toolName: activity && activity.toolName ? activity.toolName : '',
        status: activity && activity.status ? activity.status : '',
        argumentsJson: activity && activity.argumentsJson ? activity.argumentsJson : '',
        resultText: activity && activity.resultText ? activity.resultText : ''
    };
}

function ExportEnvisionChatToolActivities() {
    if (!Array.isArray(EnvisionChatToolActivities) || EnvisionChatToolActivities.length === 0) {
        SetEnvisionChatStatus('No tool activity available to export.');
        return;
    }

    const exportPayload = {
        exportedAt: new Date().toISOString(),
        totalActivities: EnvisionChatToolActivities.length,
        activities: EnvisionChatToolActivities.map(function (activity, index) {
            return CreateEnvisionChatToolActivityExportModel(activity, index + 1);
        })
    };

    DownloadEnvisionChatJsonFile('envision-chat-tool-activity-' + GetEnvisionChatTimestampText() + '.json', exportPayload);
    SetEnvisionChatStatus('Exported full tool activity.');
}

function ExportEnvisionChatToolActivity(activityIndex) {
    if (!Array.isArray(EnvisionChatToolActivities) || activityIndex < 0 || activityIndex >= EnvisionChatToolActivities.length) {
        SetEnvisionChatStatus('The selected tool activity could not be exported.');
        return;
    }

    const activity = EnvisionChatToolActivities[activityIndex];
    const safeToolName = (activity.toolName || 'tool').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'tool';
    const exportPayload = {
        exportedAt: new Date().toISOString(),
        activity: CreateEnvisionChatToolActivityExportModel(activity, activityIndex + 1)
    };

    DownloadEnvisionChatJsonFile('envision-chat-tool-activity-' + (activityIndex + 1).toString() + '-' + safeToolName + '-' + GetEnvisionChatTimestampText() + '.json', exportPayload);
    SetEnvisionChatStatus('Exported tool activity for ' + (activity.toolName || 'tool') + '.');
}
const EnvisionChatDefaultReloadToolNames = new Set([
    'CreateDesignObjects',
    'UpdateDesignObjects',
    'UpdateDesignPage',
    'DeleteDesignObjects',
    'CreateGroupSymbolInstance',
    'UpdateGroupSymbolInstanceReplacers',
    'PushGroupSymbolMaster',
    'UpdatePythonScripts'
]);

// The AI changes every configuration entity through these three generic tools, so which page
// is affected is decided by their entityType argument, not by the tool name.
const EnvisionChatConfigCudToolNames = new Set([
    'InsertConfigEntities',
    'UpdateConfigEntities',
    'DeleteConfigEntities'
]);

function SaveEnvisionChatState() {
    try {
        window.sessionStorage.setItem(EnvisionChatSessionStorageKey, JSON.stringify({
            messages: EnvisionChatMessages,
            toolActivities: EnvisionChatToolActivities,
            pendingConfirmation: EnvisionChatPendingConfirmation,
            documents: EnvisionChatDocuments,
            documentsExpanded: EnvisionChatDocumentsExpanded,
            toolActivityExpanded: EnvisionChatToolActivityExpanded,
            statusText: GetEnvisionChatStatus(),
            inputText: GetEnvisionChatInputText()
        }));
    }
    catch (error) {
    }
}

function RestoreEnvisionChatState() {
    try {
        const serializedState = window.sessionStorage.getItem(EnvisionChatSessionStorageKey);
        if (!serializedState) {
            return false;
        }

        const state = JSON.parse(serializedState);
        EnvisionChatMessages = Array.isArray(state.messages) ? state.messages : [];
        EnvisionChatToolActivities = Array.isArray(state.toolActivities) ? state.toolActivities : [];
        EnvisionChatPendingConfirmation = state.pendingConfirmation || null;
        EnvisionChatDocuments = Array.isArray(state.documents) ? state.documents : [];
        EnvisionChatDocumentsExpanded = !!state.documentsExpanded;
        EnvisionChatToolActivityExpanded = !!state.toolActivityExpanded;
        SetEnvisionChatInputText(state.inputText || '');
        RenderEnvisionChatMessages();
        RenderEnvisionChatDocuments();
        RenderEnvisionChatToolActivities();
        UpdateEnvisionChatToolActivityPanel();
        RenderEnvisionChatConfirmation();
        SetEnvisionChatStatus(state.statusText || '');
        return EnvisionChatMessages.length > 0
            || EnvisionChatDocuments.length > 0
            || EnvisionChatToolActivities.length > 0
            || !!EnvisionChatPendingConfirmation
            || !!state.inputText;
    }
    catch (error) {
        return false;
    }
}

function GetEnvisionChatStatus() {
    const status = document.getElementById('EnvisionChatStatusText');
    return status ? (status.textContent || '') : '';
}

function GetEnvisionChatInputText() {
    const input = document.getElementById('EnvisionChatInput');
    return input ? (input.value || '') : '';
}

function SetEnvisionChatInputText(text) {
    const input = document.getElementById('EnvisionChatInput');
    if (input) {
        input.value = text || '';
    }
}

function GetEnvisionChatSidebar() {
    const sidebarElement = document.getElementById('EnvisionChatSidebar');
    if (!sidebarElement) {
        return null;
    }

    return bootstrap.Offcanvas.getInstance(sidebarElement) || new bootstrap.Offcanvas(sidebarElement);
}

function ToggleEnvisionChatSidebar() {
    if (!IsEnvisionChatEnabled()) {
        return;
    }

    const sidebar = GetEnvisionChatSidebar();
    if (!sidebar) {
        return;
    }

    const sidebarElement = document.getElementById('EnvisionChatSidebar');
    if (sidebarElement.classList.contains('show')) {
        sidebar.hide();
        return;
    }

    if (typeof closeconfigs === 'function') {
        closeconfigs();
    }

    sidebar.show();
}

function CloseEnvisionChatSidebar() {
    const sidebar = GetEnvisionChatSidebar();
    const sidebarElement = document.getElementById('EnvisionChatSidebar');
    if (!sidebar || !sidebarElement || !sidebarElement.classList.contains('show')) {
        return;
    }

    sidebar.hide();
}

function IsEnvisionChatOnEnvisionPage() {
    if (window.EnvisionChatConfig && typeof window.EnvisionChatConfig.reloadAfterSuccessfulDesignCud === 'boolean') {
        return window.EnvisionChatConfig.reloadAfterSuccessfulDesignCud;
    }

    const pathName = window.location.pathname || '';
    return /\/Envision\/?$/i.test(pathName);
}

function GetEnvisionChatReloadToolNames() {
    const configuredToolNames = window.EnvisionChatConfig && Array.isArray(window.EnvisionChatConfig.reloadAfterSuccessfulToolNames)
        ? window.EnvisionChatConfig.reloadAfterSuccessfulToolNames.filter(function (toolName) {
            return typeof toolName === 'string' && toolName.trim() !== '';
        })
        : [];

    if (configuredToolNames.length > 0) {
        return new Set(configuredToolNames);
    }

    if (IsEnvisionChatOnEnvisionPage()) {
        return EnvisionChatDefaultReloadToolNames;
    }

    return new Set();
}

function MarkEnvisionChatForReloadReopen() {
    try {
        window.sessionStorage.setItem(EnvisionChatReopenAfterReloadStorageKey, 'true');
    }
    catch (error) {
    }
}

function ShouldReopenEnvisionChatAfterReload() {
    try {
        return window.sessionStorage.getItem(EnvisionChatReopenAfterReloadStorageKey) === 'true';
    }
    catch (error) {
        return false;
    }
}

function ClearEnvisionChatReloadReopenMarker() {
    try {
        window.sessionStorage.removeItem(EnvisionChatReopenAfterReloadStorageKey);
    }
    catch (error) {
    }
}

function RestoreEnvisionChatSidebarAfterReload() {
    if (!ShouldReopenEnvisionChatAfterReload()) {
        return;
    }

    ClearEnvisionChatReloadReopenMarker();

    const sidebar = GetEnvisionChatSidebar();
    const sidebarElement = document.getElementById('EnvisionChatSidebar');
    if (!sidebar || !sidebarElement) {
        return;
    }

    if (typeof closeconfigs === 'function') {
        closeconfigs();
    }

    window.setTimeout(function () {
        if (!sidebarElement.classList.contains('show')) {
            sidebar.show();
        }
        SetEnvisionChatStatus('Reloaded');
    }, 0);
}

function IsSuccessfulEnvisionChatReloadActivity(activity) {
    const reloadToolNames = GetEnvisionChatReloadToolNames();
    if (!activity || !reloadToolNames.has(activity.toolName || '')) {
        return false;
    }

    const status = (activity.status || '').toLowerCase();
    return status === 'success' || status === 'confirmed';
}

function ReloadEnvisionChatHostPage() {
    const reloadToolNames = GetEnvisionChatReloadToolNames();
    if (reloadToolNames.size === 0) {
        return;
    }

    SaveEnvisionChatState();
    MarkEnvisionChatForReloadReopen();
    window.setTimeout(function () {
        window.location.reload();
    }, 50);
}

function IsSuccessfulEnvisionChatActivity(activity) {
    if (!activity) return false;
    const status = (activity.status || '').toLowerCase();
    return status === 'success' || status === 'confirmed';
}

function NotifyEnvisionChatAfterSuccessfulToolExecution(activities) {
    if (!Array.isArray(activities)
        || !window.EnvisionChatConfig
        || typeof window.EnvisionChatConfig.onAfterSuccessfulTool !== 'function') {
        return false;
    }

    let handled = false;

    activities.filter(IsSuccessfulEnvisionChatActivity).forEach(function (activity) {
        try {
            if (window.EnvisionChatConfig.onAfterSuccessfulTool(activity) === true) {
                handled = true;
            }
        }
        catch (error) {
        }
    });

    return handled;
}

function GetEnvisionChatCurrentEntityType() {
    const entityType = window.EnvisionChatConfig && typeof window.EnvisionChatConfig.currentEntityType === 'string'
        ? window.EnvisionChatConfig.currentEntityType.trim()
        : '';

    return entityType;
}

function IsEnvisionChatCurrentPageConfigActivity(activity) {
    const currentEntityType = GetEnvisionChatCurrentEntityType();
    if (currentEntityType === '' || !activity || !EnvisionChatConfigCudToolNames.has(activity.toolName || '')) {
        return false;
    }

    try {
        const toolArguments = JSON.parse(activity.argumentsJson || '{}');
        const changedEntityType = toolArguments && toolArguments.entityType ? String(toolArguments.entityType).trim() : '';
        return changedEntityType.toLowerCase() === currentEntityType.toLowerCase();
    }
    catch (error) {
        return false;
    }
}

// Re-fetches the rows of the configuration page the user is looking at when the chat just
// created, changed or removed records of that same type, so the change is on screen without
// the user reloading. Filters, sorting, scroll position and the chat panel stay as they are.
function MaybeRefreshEnvisionChatConfigGrids(activities) {
    if (!Array.isArray(activities)) {
        return false;
    }

    const matchingActivities = activities
        .filter(IsSuccessfulEnvisionChatActivity)
        .filter(IsEnvisionChatCurrentPageConfigActivity);

    if (matchingActivities.length === 0) {
        return false;
    }

    let refreshed = false;

    document.querySelectorAll('[data-grid]').forEach(function (gridElement) {
        if (gridElement.dataGrid && typeof gridElement.dataGrid.reload === 'function') {
            gridElement.dataGrid.reload();
            refreshed = true;
        }
    });

    if (refreshed) {
        SetEnvisionChatStatus('Refreshed ' + GetEnvisionChatCurrentEntityType() + ' after the completed update.');
    }

    return refreshed;
}

function MaybeReloadEnvisionChatHostPageAfterSuccessfulToolExecution(activities) {
    if (!Array.isArray(activities)) {
        return;
    }

    const successfulActivities = activities.filter(IsSuccessfulEnvisionChatReloadActivity);
    if (successfulActivities.length === 0) {
        return;
    }

    SetEnvisionChatStatus('Reloading page to apply the completed update...');
    ReloadEnvisionChatHostPage();
}

function InitializeEnvisionChat() {
    if (!IsEnvisionChatEnabled()) {
        return;
    }

    InitializeEnvisionChatResize();

    const input = document.getElementById('EnvisionChatInput');
    if (!input) {
        return;
    }

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            SendEnvisionChatMessage();
        }
    });

    input.addEventListener('input', function () {
        SaveEnvisionChatState();
    });

    if (!RestoreEnvisionChatState()) {
        ResetEnvisionChatConversation();
    }

    RestoreEnvisionChatSidebarAfterReload();
}

function InitializeEnvisionChatResize() {
    const sidebar = document.getElementById('EnvisionChatSidebar');
    const handle = document.getElementById('EnvisionChatResizeHandle');
    const body = document.getElementById('EnvisionChatBody');
    const toolActivityHandle = document.getElementById('EnvisionChatToolActivityResizeHandle');
    if (!sidebar || !handle || !body || !toolActivityHandle) {
        return;
    }

    ApplyStoredEnvisionChatSidebarWidth(sidebar);
    ApplyStoredEnvisionChatToolActivityWidth(body);

    handle.addEventListener('mousedown', StartEnvisionChatResize);
    handle.addEventListener('touchstart', StartEnvisionChatResize, { passive: false });
    toolActivityHandle.addEventListener('mousedown', StartEnvisionChatToolActivityResize);
    toolActivityHandle.addEventListener('touchstart', StartEnvisionChatToolActivityResize, { passive: false });
}

function ApplyStoredEnvisionChatSidebarWidth(sidebar) {
    const storedWidth = parseInt(window.localStorage.getItem(EnvisionChatSidebarStorageKey), 10);
    const width = Number.isFinite(storedWidth) ? storedWidth : EnvisionChatSidebarDefaultWidth;
    SetEnvisionChatSidebarWidth(sidebar, width);
}

function SetEnvisionChatSidebarWidth(sidebar, width) {
    const maxWidth = Math.max(EnvisionChatSidebarMinWidth, Math.floor(window.innerWidth * 0.95));
    const clampedWidth = Math.min(Math.max(width, EnvisionChatSidebarMinWidth), maxWidth);
    sidebar.style.setProperty('--envision-chat-sidebar-width', clampedWidth + 'px');
}

function ApplyStoredEnvisionChatToolActivityWidth(body) {
    const storedWidth = parseInt(window.localStorage.getItem(EnvisionChatToolActivityWidthStorageKey), 10);
    const width = Number.isFinite(storedWidth) ? storedWidth : EnvisionChatToolActivityDefaultWidth;
    SetEnvisionChatToolActivityWidth(body, width);
}

function GetEnvisionChatToolActivityMaxWidth(body) {
    const availableWidth = Math.floor(body.getBoundingClientRect().width) - EnvisionChatToolActivityMainPanelMinWidth - 12;
    return Math.max(EnvisionChatToolActivityMinWidth, availableWidth);
}

function SetEnvisionChatToolActivityWidth(body, width) {
    const maxWidth = GetEnvisionChatToolActivityMaxWidth(body);
    const clampedWidth = Math.min(Math.max(width, EnvisionChatToolActivityMinWidth), maxWidth);
    body.style.setProperty('--envision-chat-tool-activity-width', clampedWidth + 'px');
    return clampedWidth;
}

function NotifyEnvisionChatResizeStart() {
    if (!window.EnvisionChatConfig || typeof window.EnvisionChatConfig.onResizeStart !== 'function') {
        return;
    }

    try {
        window.EnvisionChatConfig.onResizeStart();
    }
    catch (error) {
    }
}

function NotifyEnvisionChatResizeStop() {
    if (!window.EnvisionChatConfig || typeof window.EnvisionChatConfig.onResizeStop !== 'function') {
        return;
    }

    try {
        window.EnvisionChatConfig.onResizeStop();
    }
    catch (error) {
    }
}

function StartEnvisionChatResize(event) {
    const sidebar = document.getElementById('EnvisionChatSidebar');
    if (!sidebar) {
        return;
    }

    event.preventDefault();
    EnvisionChatIsResizing = true;
    EnvisionChatResizeStartX = GetEnvisionChatPointerClientX(event);
    EnvisionChatResizeStartWidth = sidebar.getBoundingClientRect().width;
    sidebar.classList.add('EnvisionChatSidebarResizing');
    NotifyEnvisionChatResizeStart();

    document.addEventListener('mousemove', ResizeEnvisionChatSidebar);
    document.addEventListener('mouseup', StopEnvisionChatResize);
    document.addEventListener('touchmove', ResizeEnvisionChatSidebar, { passive: false });
    document.addEventListener('touchend', StopEnvisionChatResize);
}

function ResizeEnvisionChatSidebar(event) {
    if (!EnvisionChatIsResizing) {
        return;
    }

    const sidebar = document.getElementById('EnvisionChatSidebar');
    if (!sidebar) {
        StopEnvisionChatResize();
        return;
    }

    event.preventDefault();
    const currentX = GetEnvisionChatPointerClientX(event);
    const deltaX = EnvisionChatResizeStartX - currentX;
    const nextWidth = EnvisionChatResizeStartWidth + deltaX;

    SetEnvisionChatSidebarWidth(sidebar, nextWidth);
}

function StopEnvisionChatResize() {
    if (!EnvisionChatIsResizing) {
        return;
    }

    const sidebar = document.getElementById('EnvisionChatSidebar');
    if (sidebar) {
        sidebar.classList.remove('EnvisionChatSidebarResizing');
        const width = Math.round(sidebar.getBoundingClientRect().width);
        window.localStorage.setItem(EnvisionChatSidebarStorageKey, width.toString());
    }

    EnvisionChatIsResizing = false;
    NotifyEnvisionChatResizeStop();

    document.removeEventListener('mousemove', ResizeEnvisionChatSidebar);
    document.removeEventListener('mouseup', StopEnvisionChatResize);
    document.removeEventListener('touchmove', ResizeEnvisionChatSidebar);
    document.removeEventListener('touchend', StopEnvisionChatResize);
}

function StartEnvisionChatToolActivityResize(event) {
    const body = document.getElementById('EnvisionChatBody');
    if (!body || !EnvisionChatToolActivityExpanded) {
        return;
    }

    event.preventDefault();
    EnvisionChatIsToolActivityResizing = true;
    EnvisionChatToolActivityResizeStartX = GetEnvisionChatPointerClientX(event);
    EnvisionChatToolActivityResizeStartWidth = parseInt(window.getComputedStyle(body).getPropertyValue('--envision-chat-tool-activity-width'), 10)
        || EnvisionChatToolActivityDefaultWidth;
    body.classList.add('EnvisionChatBodyToolActivityResizing');
    NotifyEnvisionChatResizeStart();

    document.addEventListener('mousemove', ResizeEnvisionChatToolActivity);
    document.addEventListener('mouseup', StopEnvisionChatToolActivityResize);
    document.addEventListener('touchmove', ResizeEnvisionChatToolActivity, { passive: false });
    document.addEventListener('touchend', StopEnvisionChatToolActivityResize);
}

function ResizeEnvisionChatToolActivity(event) {
    if (!EnvisionChatIsToolActivityResizing) {
        return;
    }

    const body = document.getElementById('EnvisionChatBody');
    if (!body) {
        StopEnvisionChatToolActivityResize();
        return;
    }

    event.preventDefault();
    const currentX = GetEnvisionChatPointerClientX(event);
    const deltaX = currentX - EnvisionChatToolActivityResizeStartX;
    const nextWidth = EnvisionChatToolActivityResizeStartWidth + deltaX;
    SetEnvisionChatToolActivityWidth(body, nextWidth);
}

function StopEnvisionChatToolActivityResize() {
    if (!EnvisionChatIsToolActivityResizing) {
        return;
    }

    const body = document.getElementById('EnvisionChatBody');
    if (body) {
        body.classList.remove('EnvisionChatBodyToolActivityResizing');
        const width = parseInt(window.getComputedStyle(body).getPropertyValue('--envision-chat-tool-activity-width'), 10)
            || EnvisionChatToolActivityDefaultWidth;
        window.localStorage.setItem(EnvisionChatToolActivityWidthStorageKey, width.toString());
    }

    EnvisionChatIsToolActivityResizing = false;
    NotifyEnvisionChatResizeStop();
    document.removeEventListener('mousemove', ResizeEnvisionChatToolActivity);
    document.removeEventListener('mouseup', StopEnvisionChatToolActivityResize);
    document.removeEventListener('touchmove', ResizeEnvisionChatToolActivity);
    document.removeEventListener('touchend', StopEnvisionChatToolActivityResize);
}

function GetEnvisionChatPointerClientX(event) {
    if (event.touches && event.touches.length > 0) {
        return event.touches[0].clientX;
    }

    return event.clientX;
}

function ResetEnvisionChatConversation() {
    EnvisionChatMessages = [];
    EnvisionChatToolActivities = [];
    EnvisionChatPendingConfirmation = null;
    EnvisionChatDocumentsExpanded = false;
    EnvisionChatToolActivityExpanded = false;
    RenderEnvisionChatMessages();
    RenderEnvisionChatDocuments();
    RenderEnvisionChatToolActivities();
    UpdateEnvisionChatToolActivityPanel();
    RenderEnvisionChatConfirmation();

    if (window.EnvisionChatConfig && window.EnvisionChatConfig.enabled) {
        SetEnvisionChatStatus('Connected via ' + window.EnvisionChatConfig.provider + ' (' + window.EnvisionChatConfig.model + ').');
        const meta = document.getElementById('EnvisionChatHeaderMeta');
        const providerLabel = document.getElementById('EnvisionChatProviderLabel');
        const modelLabel = document.getElementById('EnvisionChatModelLabel');
        if (meta && providerLabel && modelLabel) {
            providerLabel.textContent = window.EnvisionChatConfig.provider;
            modelLabel.textContent = window.EnvisionChatConfig.model;
            meta.style.display = '';
        }
    }
    else {
        SetEnvisionChatStatus('AI chat is not configured yet. Add provider settings on the server before sending messages.');
    }

    SaveEnvisionChatState();
}

function ClearEnvisionChatConversation() {
    const input = document.getElementById('EnvisionChatInput');
    if (input) {
        input.value = '';
    }

    ResetEnvisionChatConversation();
}

function AddEnvisionChatMessage(role, content) {
    if (!content) {
        return;
    }

    EnvisionChatMessages.push({
        role: role,
        content: content
    });

    RenderEnvisionChatMessages();
    SaveEnvisionChatState();
}

function ChooseEnvisionChatDocuments() {
    const input = document.getElementById('EnvisionChatDocumentInput');
    if (!input || EnvisionChatSending) {
        return;
    }

    input.click();
}

function RenderEnvisionChatDocuments() {
    const container = document.getElementById('EnvisionChatDocumentList');
    const title = document.getElementById('EnvisionChatDocumentsTitle');
    const toggle = document.getElementById('EnvisionChatDocumentsToggle');
    const content = document.getElementById('EnvisionChatDocumentsContent');
    const chevron = document.getElementById('EnvisionChatDocumentsChevron');

    UpdateEnvisionChatDocumentsPanel();

    if (title) {
        const count = EnvisionChatDocuments.length;
        title.textContent = count > 0 ? 'Reference documents (' + count.toString() + ')' : 'Reference documents';
    }

    if (toggle) {
        toggle.setAttribute('aria-expanded', EnvisionChatDocumentsExpanded ? 'true' : 'false');
    }

    if (content) {
        content.style.display = EnvisionChatDocumentsExpanded ? 'block' : 'none';
    }

    if (chevron) {
        chevron.textContent = EnvisionChatDocumentsExpanded ? '▾' : '▸';
    }

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (EnvisionChatDocuments.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'EnvisionChatDocumentEmpty';
        emptyState.textContent = 'No documents attached.';
        container.appendChild(emptyState);
        return;
    }

    EnvisionChatDocuments.forEach(function (documentItem, index) {
        const item = document.createElement('div');
        item.className = 'EnvisionChatDocumentItem';

        const meta = document.createElement('div');
        meta.className = 'EnvisionChatDocumentMeta';

        const name = document.createElement('div');
        name.className = 'EnvisionChatDocumentName';
        name.textContent = documentItem.fileName || 'Document';

        const details = document.createElement('div');
        details.className = 'EnvisionChatDocumentDetails';
        details.textContent = (documentItem.content || '').length.toString() + ' characters ready for the assistant';

        meta.appendChild(name);
        meta.appendChild(details);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'btn btn-sm btn-secondary';
        removeButton.textContent = 'Remove';
        removeButton.disabled = EnvisionChatSending;
        removeButton.addEventListener('click', function () {
            RemoveEnvisionChatDocument(index);
        });

        item.appendChild(meta);
        item.appendChild(removeButton);
        container.appendChild(item);
    });
}

function RemoveEnvisionChatDocument(index) {
    if (index < 0 || index >= EnvisionChatDocuments.length) {
        return;
    }

    EnvisionChatDocuments.splice(index, 1);
    RenderEnvisionChatDocuments();
    SaveEnvisionChatState();
}

function ToggleEnvisionChatDocumentsPanel() {
    EnvisionChatDocumentsExpanded = !EnvisionChatDocumentsExpanded;
    UpdateEnvisionChatDocumentsPanel();
    SaveEnvisionChatState();
}

function ToggleEnvisionChatToolActivityPanel() {
    EnvisionChatToolActivityExpanded = !EnvisionChatToolActivityExpanded;

    if (EnvisionChatToolActivityExpanded) {
        EnsureEnvisionChatSidebarWidthForToolActivity();
    }
    else {
        RestoreEnvisionChatSidebarWidthAfterToolActivity();
    }

    UpdateEnvisionChatToolActivityPanel();
    SaveEnvisionChatState();
}

function GetEnvisionChatSidebarPreToolActivityWidth() {
    const storedWidth = parseInt(window.sessionStorage.getItem(EnvisionChatSidebarPreToolActivityWidthStorageKey), 10);
    return Number.isFinite(storedWidth) ? storedWidth : 0;
}

function SetEnvisionChatSidebarPreToolActivityWidth(width) {
    if (width > 0) {
        window.sessionStorage.setItem(EnvisionChatSidebarPreToolActivityWidthStorageKey, width.toString());
        return;
    }

    window.sessionStorage.removeItem(EnvisionChatSidebarPreToolActivityWidthStorageKey);
}

function RestoreEnvisionChatSidebarWidthAfterToolActivity() {
    const sidebar = document.getElementById('EnvisionChatSidebar');
    if (!sidebar) {
        return;
    }

    const currentWidth = Math.round(sidebar.getBoundingClientRect().width) || EnvisionChatSidebarDefaultWidth;
    const panel = document.getElementById('EnvisionChatToolActivityPanel');
    const body = document.getElementById('EnvisionChatBody');
    const currentToolActivityWidth = body
        ? (parseInt(window.getComputedStyle(body).getPropertyValue('--envision-chat-tool-activity-width'), 10) || EnvisionChatToolActivityDefaultWidth)
        : EnvisionChatToolActivityDefaultWidth;
    const measuredToolActivityWidth = panel ? Math.round(panel.getBoundingClientRect().width) : currentToolActivityWidth;
    const restoredWidth = Math.max(EnvisionChatSidebarMinWidth, currentWidth - measuredToolActivityWidth);
    SetEnvisionChatSidebarWidth(sidebar, restoredWidth);
    window.localStorage.setItem(EnvisionChatSidebarStorageKey, restoredWidth.toString());
    SetEnvisionChatSidebarPreToolActivityWidth(0);
}

function EnsureEnvisionChatSidebarWidthForToolActivity() {
    const sidebar = document.getElementById('EnvisionChatSidebar');
    if (!sidebar) {
        return;
    }

    const storedToolActivityWidth = parseInt(window.localStorage.getItem(EnvisionChatToolActivityWidthStorageKey), 10);
    const desiredToolActivityWidth = Number.isFinite(storedToolActivityWidth) ? storedToolActivityWidth : EnvisionChatToolActivityDefaultWidth;
    const minimumSidebarWidth = Math.max(
        EnvisionChatSidebarToolActivityExpandedMinWidth,
        desiredToolActivityWidth + EnvisionChatToolActivityMainPanelMinWidth + 12);
    const currentWidth = Math.round(sidebar.getBoundingClientRect().width) || EnvisionChatSidebarDefaultWidth;
    if (currentWidth >= minimumSidebarWidth) {
        SetEnvisionChatSidebarPreToolActivityWidth(0);
        return;
    }

    SetEnvisionChatSidebarPreToolActivityWidth(currentWidth);
    SetEnvisionChatSidebarWidth(sidebar, minimumSidebarWidth);
    const storedWidth = Math.round(sidebar.getBoundingClientRect().width);
    window.localStorage.setItem(EnvisionChatSidebarStorageKey, storedWidth.toString());
}

function UpdateEnvisionChatToolActivityPanel() {
    const toggle = document.getElementById('EnvisionChatToolActivityToggle');
    const content = document.getElementById('EnvisionChatToolActivityContent');
    const chevron = document.getElementById('EnvisionChatToolActivityChevron');
    const chevronButton = chevron ? chevron.closest('button') : null;
    const panel = document.getElementById('EnvisionChatToolActivityPanel');
    const body = document.getElementById('EnvisionChatBody');
    const mainPanel = body ? body.querySelector('.EnvisionChatMainPanel') : null;
    const documentsPanel = mainPanel ? mainPanel.querySelector('.EnvisionChatDocumentsPanel') : null;

    if (panel && body && mainPanel) {
        if (EnvisionChatToolActivityExpanded) {
            if (panel.parentElement !== body) {
                body.appendChild(panel);
            }
        }
        else if (panel.parentElement !== mainPanel) {
            if (documentsPanel) {
                mainPanel.insertBefore(panel, documentsPanel);
            }
            else {
                mainPanel.appendChild(panel);
            }
        }
    }

    if (toggle) {
        toggle.setAttribute('aria-expanded', EnvisionChatToolActivityExpanded ? 'true' : 'false');
        toggle.classList.toggle('EnvisionChatSectionToggleExpanded', EnvisionChatToolActivityExpanded);
    }

    if (chevronButton) {
        chevronButton.setAttribute('aria-expanded', EnvisionChatToolActivityExpanded ? 'true' : 'false');
    }

    if (content) {
        content.style.display = EnvisionChatToolActivityExpanded ? '' : 'none';
    }

    if (panel) {
        panel.classList.toggle('EnvisionChatToolActivityPanelExpanded', EnvisionChatToolActivityExpanded);
    }

    if (body) {
        body.classList.toggle('EnvisionChatBodyToolActivityExpanded', EnvisionChatToolActivityExpanded);

        if (EnvisionChatToolActivityExpanded) {
            SetEnvisionChatToolActivityWidth(body, parseInt(window.getComputedStyle(body).getPropertyValue('--envision-chat-tool-activity-width'), 10)
                || EnvisionChatToolActivityDefaultWidth);
        }
    }

    if (chevron) {
        chevron.textContent = EnvisionChatToolActivityExpanded ? '▾' : '▸';
    }
}

function ExpandEnvisionChatDocumentsPanel() {
    if (!EnvisionChatDocumentsExpanded) {
        EnvisionChatDocumentsExpanded = true;
    }

    UpdateEnvisionChatDocumentsPanel();
    SaveEnvisionChatState();
}

function UpdateEnvisionChatDocumentsPanel() {
    const toggle = document.getElementById('EnvisionChatDocumentsToggle');
    const content = document.getElementById('EnvisionChatDocumentsContent');
    const chevron = document.getElementById('EnvisionChatDocumentsChevron');

    if (toggle) {
        toggle.setAttribute('aria-expanded', EnvisionChatDocumentsExpanded ? 'true' : 'false');
        toggle.classList.toggle('EnvisionChatSectionToggleExpanded', EnvisionChatDocumentsExpanded);
    }

    if (content) {
        content.style.display = EnvisionChatDocumentsExpanded ? 'block' : 'none';
    }

    if (chevron) {
        chevron.textContent = EnvisionChatDocumentsExpanded ? '▾' : '▸';
    }
}

function ClearEnvisionChatDocuments() {
    if (EnvisionChatSending) {
        return;
    }

    EnvisionChatDocuments = [];

    const input = document.getElementById('EnvisionChatDocumentInput');
    if (input) {
        input.value = '';
    }

    RenderEnvisionChatDocuments();
    SetEnvisionChatStatus('Attached documents cleared.');
    SaveEnvisionChatState();
}

function MergeEnvisionChatDocuments(documents) {
    if (!documents || !documents.length) {
        return;
    }

    for (const documentItem of documents) {
        const existingIndex = EnvisionChatDocuments.findIndex(function (existingDocument) {
            return existingDocument.fileName === documentItem.fileName;
        });

        if (existingIndex >= 0) {
            EnvisionChatDocuments[existingIndex] = documentItem;
        }
        else {
            EnvisionChatDocuments.push(documentItem);
        }
    }

    RenderEnvisionChatDocuments();
    SaveEnvisionChatState();
}

async function UploadEnvisionChatDocuments(fileList) {
    const input = document.getElementById('EnvisionChatDocumentInput');
    if (!fileList || !fileList.length || EnvisionChatSending) {
        if (input) {
            input.value = '';
        }

        return;
    }

    const formData = new FormData();
    for (const file of fileList) {
        formData.append('files', file);
    }

    SetEnvisionChatStatus('Uploading documents...');
    SetEnvisionChatSending(true);

    try {
        const response = await fetch(window.EnvisionChatConfig.documentUploadEndpoint, {
            method: 'POST',
            headers: {
                'RequestVerificationToken': window.RequestVerificationToken
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok || (!data.success && !(data.documents && data.documents.length))) {
            SetEnvisionChatStatus(data.error || 'The document upload failed.');
            return;
        }

        MergeEnvisionChatDocuments(data.documents || []);
        ExpandEnvisionChatDocumentsPanel();

        if (data.errors && data.errors.length) {
            SetEnvisionChatStatus('Documents uploaded with warnings: ' + data.errors.join(' '));
        }
        else {
            SetEnvisionChatStatus('Added ' + (data.documents || []).length.toString() + ' document(s) to the chat context.');
        }
    }
    catch (error) {
        SetEnvisionChatStatus('The document upload failed. Check server connectivity.');
    }
    finally {
        if (input) {
            input.value = '';
        }

        SetEnvisionChatSending(false);
    }
}

function FormatEnvisionChatJsonText(text) {
    if (typeof text !== 'string') {
        return text || '';
    }

    const trimmed = text.trim();
    if (!trimmed) {
        return text;
    }

    const startsLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}'))
        || (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!startsLikeJson) {
        return text;
    }

    try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
    }
    catch (error) {
        return text;
    }
}

function TryFormatEnvisionChatJsonText(text) {
    if (typeof text !== 'string') {
        return null;
    }

    const trimmed = text.trim();
    if (!trimmed) {
        return null;
    }

    const startsLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}'))
        || (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!startsLikeJson) {
        return null;
    }

    try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
    }
    catch (error) {
        return null;
    }
}

function ReadEnvisionChatJsonBlock(text, startIndex) {
    const startCharacter = text[startIndex];
    if (startCharacter !== '{' && startCharacter !== '[') {
        return null;
    }

    const stack = [];
    let inString = false;
    let isEscaped = false;

    for (let index = startIndex; index < text.length; index++) {
        const character = text[index];

        if (inString) {
            if (isEscaped) {
                isEscaped = false;
                continue;
            }

            if (character === '\\') {
                isEscaped = true;
                continue;
            }

            if (character === '"') {
                inString = false;
            }

            continue;
        }

        if (character === '"') {
            inString = true;
            continue;
        }

        if (character === '{') {
            stack.push('}');
            continue;
        }

        if (character === '[') {
            stack.push(']');
            continue;
        }

        if (character === '}' || character === ']') {
            if (!stack.length || stack[stack.length - 1] !== character) {
                return null;
            }

            stack.pop();
            if (!stack.length) {
                return {
                    start: startIndex,
                    end: index,
                    text: text.substring(startIndex, index + 1)
                };
            }
        }
    }

    return null;
}

function IsEnvisionChatJsonBoundary(text, startIndex, endIndex) {
    const beforeCharacter = startIndex > 0 ? text[startIndex - 1] : '';
    const afterCharacter = endIndex + 1 < text.length ? text[endIndex + 1] : '';
    const beforeIsBoundary = !beforeCharacter || /[\s(:=\-\u2014]/.test(beforeCharacter);
    const afterIsBoundary = !afterCharacter || /[\s,.;:!?)]/.test(afterCharacter);
    return beforeIsBoundary && afterIsBoundary;
}

function FormatEnvisionChatDisplayText(text) {
    if (typeof text !== 'string') {
        return text || '';
    }

    let formattedText = text.replace(/```([a-zA-Z0-9_-]*)\s*\r?\n([\s\S]*?)```/g, function (match, language, code) {
        const formattedJson = TryFormatEnvisionChatJsonText(code);
        if (formattedJson && (!language || language.toLowerCase() === 'json')) {
            return '\n' + formattedJson + '\n';
        }

        return '\n' + code.trim() + '\n';
    });

    const wholeJson = TryFormatEnvisionChatJsonText(formattedText);
    if (wholeJson) {
        return wholeJson;
    }

    let result = '';
    let cursor = 0;

    while (cursor < formattedText.length) {
        const objectIndex = formattedText.indexOf('{', cursor);
        const arrayIndex = formattedText.indexOf('[', cursor);
        let nextIndex = -1;

        if (objectIndex >= 0 && arrayIndex >= 0) {
            nextIndex = Math.min(objectIndex, arrayIndex);
        }
        else {
            nextIndex = Math.max(objectIndex, arrayIndex);
        }

        if (nextIndex < 0) {
            result += formattedText.substring(cursor);
            break;
        }

        const candidate = ReadEnvisionChatJsonBlock(formattedText, nextIndex);
        if (!candidate || !IsEnvisionChatJsonBoundary(formattedText, candidate.start, candidate.end)) {
            result += formattedText.substring(cursor, nextIndex + 1);
            cursor = nextIndex + 1;
            continue;
        }

        const formattedJson = TryFormatEnvisionChatJsonText(candidate.text);
        if (!formattedJson) {
            result += formattedText.substring(cursor, candidate.end + 1);
            cursor = candidate.end + 1;
            continue;
        }

        result += formattedText.substring(cursor, candidate.start);
        if (result.length > 0 && !result.endsWith('\n')) {
            result += '\n';
        }

        result += formattedJson;

        if (candidate.end + 1 < formattedText.length && formattedText[candidate.end + 1] !== '\n') {
            result += '\n';
        }

        cursor = candidate.end + 1;
    }

    return result;
}

function RenderEnvisionChatMessages() {
    const container = document.getElementById('EnvisionChatMessages');
    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (EnvisionChatMessages.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'EnvisionChatEmptyState';
        emptyState.textContent = 'Start a conversation to get help with the current ENVISION page.';
        container.appendChild(emptyState);
        return;
    }

    for (const message of EnvisionChatMessages) {
        const messageElement = document.createElement('div');
        messageElement.className = 'EnvisionChatMessage ' + (message.role === 'user' ? 'EnvisionChatMessageUser' : 'EnvisionChatMessageAssistant');

        const roleElement = document.createElement('div');
        roleElement.className = 'EnvisionChatMessageRole';
        roleElement.textContent = message.role === 'user' ? 'You' : 'Assistant';

        const contentElement = document.createElement('div');
        contentElement.className = 'EnvisionChatMessageContent';
        const messageContent = FormatEnvisionChatDisplayText(message.content || '');
        contentElement.textContent = messageContent;

        if (messageContent.length > EnvisionChatMessagePreviewLength) {
            contentElement.classList.add('EnvisionChatMessageContentCollapsed');

            const toggleButton = document.createElement('button');
            toggleButton.type = 'button';
            toggleButton.className = 'EnvisionChatMessageToggle';
            toggleButton.textContent = 'Show more';
            toggleButton.addEventListener('click', function () {
                const expanded = contentElement.classList.toggle('EnvisionChatMessageContentExpanded');
                contentElement.classList.toggle('EnvisionChatMessageContentCollapsed', !expanded);
                toggleButton.textContent = expanded ? 'Show less' : 'Show more';
            });

            messageElement.appendChild(roleElement);
            messageElement.appendChild(contentElement);
            messageElement.appendChild(toggleButton);
            container.appendChild(messageElement);
            continue;
        }

        messageElement.appendChild(roleElement);
        messageElement.appendChild(contentElement);
        container.appendChild(messageElement);
    }

    container.scrollTop = container.scrollHeight;
}

function RenderEnvisionChatToolActivities() {
    const container = document.getElementById('EnvisionChatToolActivityList');
    const summary = document.getElementById('EnvisionChatToolActivitySummary');
    const exportButton = document.getElementById('EnvisionChatExportToolActivityButton');
    if (!container || !summary) {
        return;
    }

    container.innerHTML = '';
    summary.textContent = '';

    if (exportButton) {
        exportButton.style.display = 'none';
        exportButton.disabled = true;
    }

    if (EnvisionChatToolActivities.length === 0) {
        summary.textContent = 'No tools used yet.';
        return;
    }

    if (exportButton) {
        exportButton.style.display = '';
        exportButton.disabled = false;
    }

    EnvisionChatToolActivities.forEach(function (activity, index) {
        const item = document.createElement('div');
        item.className = 'EnvisionChatToolActivityItem';

        const header = document.createElement('div');
        header.className = 'EnvisionChatToolActivityHeader';

        const headerMeta = document.createElement('div');
        headerMeta.className = 'EnvisionChatToolActivityHeaderMeta';

        const name = document.createElement('span');
        name.className = 'EnvisionChatToolActivityName';
        name.textContent = activity.toolName;

        const status = document.createElement('span');
        status.className = 'EnvisionChatToolActivityStatus EnvisionChatToolActivityStatus' + (activity.status || 'unknown').charAt(0).toUpperCase() + (activity.status || 'unknown').slice(1);
        status.textContent = activity.status || 'unknown';

        const exportActivityButton = document.createElement('button');
        exportActivityButton.type = 'button';
        exportActivityButton.className = 'EnvisionChatIconButton EnvisionChatToolActivityExportButton';
        exportActivityButton.title = 'Export full activity';
        exportActivityButton.setAttribute('aria-label', 'Export full activity for ' + (activity.toolName || 'tool'));
        exportActivityButton.innerHTML = '<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7" /><path d="M10 14L21 3" /><path d="M21 14v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4" /></svg>';
        exportActivityButton.addEventListener('click', function () {
            ExportEnvisionChatToolActivity(index);
        });

        headerMeta.appendChild(name);
        headerMeta.appendChild(status);
        header.appendChild(headerMeta);
        header.appendChild(exportActivityButton);

        const args = document.createElement('div');
        args.className = 'EnvisionChatToolActivityText';
        args.textContent = 'Args:\n' + FormatEnvisionChatJsonText(activity.argumentsSummary || '{}');

        if (activity.argumentsJson && activity.argumentsJson !== activity.argumentsSummary) {
            const argsToggle = document.createElement('button');
            argsToggle.type = 'button';
            argsToggle.className = 'EnvisionChatToolActivityToggle';
            argsToggle.textContent = 'Show full args';

            const argsDetails = document.createElement('pre');
            argsDetails.className = 'EnvisionChatToolActivityDetails';
            argsDetails.textContent = FormatEnvisionChatJsonText(activity.argumentsJson);
            argsDetails.style.display = 'none';

            argsToggle.addEventListener('click', function () {
                const expanded = argsDetails.style.display !== 'none';
                argsDetails.style.display = expanded ? 'none' : 'block';
                argsToggle.textContent = expanded ? 'Show full args' : 'Hide full args';
            });

            item.appendChild(argsToggle);
            item.appendChild(argsDetails);
        }

        const result = document.createElement('div');
        result.className = 'EnvisionChatToolActivityText';
        result.textContent = 'Result:\n' + FormatEnvisionChatJsonText(activity.resultSummary || '');

        item.appendChild(header);
        item.appendChild(args);
        item.appendChild(result);

        if (activity.resultText && activity.resultText !== activity.resultSummary) {
            const resultToggle = document.createElement('button');
            resultToggle.type = 'button';
            resultToggle.className = 'EnvisionChatToolActivityToggle';
            resultToggle.textContent = 'Show full result';

            const resultDetails = document.createElement('pre');
            resultDetails.className = 'EnvisionChatToolActivityDetails';
            resultDetails.textContent = FormatEnvisionChatJsonText(activity.resultText);
            resultDetails.style.display = 'none';

            resultToggle.addEventListener('click', function () {
                const expanded = resultDetails.style.display !== 'none';
                resultDetails.style.display = expanded ? 'none' : 'block';
                resultToggle.textContent = expanded ? 'Show full result' : 'Hide full result';
            });

            item.appendChild(resultToggle);
            item.appendChild(resultDetails);
        }
        container.appendChild(item);
    });

    container.scrollTop = container.scrollHeight;
}

function RenderEnvisionChatConfirmation() {
    const panel = document.getElementById('EnvisionChatConfirmationPanel');
    const summary = document.getElementById('EnvisionChatConfirmationSummary');
    const toggle = document.getElementById('EnvisionChatConfirmationToggle');
    const details = document.getElementById('EnvisionChatConfirmationDetails');
    if (!panel || !summary || !toggle || !details) {
        return;
    }

    if (!EnvisionChatPendingConfirmation) {
        panel.style.display = 'none';
        summary.textContent = '';
        toggle.style.display = 'none';
        toggle.textContent = 'Show full request';
        details.style.display = 'none';
        details.textContent = '';
        return;
    }

    summary.textContent = EnvisionChatPendingConfirmation.summary || ('Confirm ' + EnvisionChatPendingConfirmation.toolName + '.');
    if (EnvisionChatPendingConfirmation.argumentsJson) {
        toggle.style.display = 'inline-block';
        toggle.textContent = 'Show full request';
        details.style.display = 'none';
        details.textContent = FormatEnvisionChatJsonText(EnvisionChatPendingConfirmation.argumentsJson);
    }
    else {
        toggle.style.display = 'none';
        details.style.display = 'none';
        details.textContent = '';
    }
    panel.style.display = 'block';
}

function ToggleEnvisionChatConfirmationDetails() {
    const toggle = document.getElementById('EnvisionChatConfirmationToggle');
    const details = document.getElementById('EnvisionChatConfirmationDetails');
    if (!toggle || !details) {
        return;
    }

    const expanded = details.style.display !== 'none';
    details.style.display = expanded ? 'none' : 'block';
    toggle.textContent = expanded ? 'Show full request' : 'Hide full request';
}

function SetEnvisionChatStatus(text) {
    const status = document.getElementById('EnvisionChatStatusText');
    if (!status) {
        return;
    }

    status.textContent = text || '';
    status.classList.toggle('EnvisionChatStatusTextConnected', /^Connected via /i.test(text || ''));
    status.classList.toggle('EnvisionChatStatusTextReloaded', (text || '') === 'Reloaded');
    SaveEnvisionChatState();
}

function SetEnvisionChatSending(isSending) {
    EnvisionChatSending = isSending;

    const sendButton = document.getElementById('EnvisionChatSendButton');
    const confirmButton = document.getElementById('EnvisionChatConfirmButton');
    const uploadButton = document.getElementById('EnvisionChatUploadButton');
    const clearDocumentsButton = document.getElementById('EnvisionChatClearDocumentsButton');
    const documentInput = document.getElementById('EnvisionChatDocumentInput');
    const input = document.getElementById('EnvisionChatInput');

    if (sendButton) {
        sendButton.disabled = isSending;
        sendButton.textContent = isSending ? 'Sending...' : 'Send';
    }

    if (confirmButton) {
        confirmButton.disabled = isSending;
        confirmButton.textContent = isSending ? 'Working...' : 'Confirm action';
    }

    if (uploadButton) {
        uploadButton.disabled = isSending;
    }

    if (clearDocumentsButton) {
        clearDocumentsButton.disabled = isSending;
    }

    if (documentInput) {
        documentInput.disabled = isSending;
    }

    if (input) {
        input.disabled = isSending;
    }
}

function AppendToolActivities(activities) {
    if (!activities || !activities.length) {
        return;
    }

    EnvisionChatToolActivities = EnvisionChatToolActivities.concat(activities);
    RenderEnvisionChatToolActivities();
    SaveEnvisionChatState();
}

function ApplyEnvisionChatResponse(data) {
    AppendToolActivities(data.toolActivities || []);

    if (data.reply) {
        AddEnvisionChatMessage('assistant', data.reply);
    }

    EnvisionChatPendingConfirmation = data.pendingConfirmation || null;
    RenderEnvisionChatConfirmation();
    SaveEnvisionChatState();

    if (data.requiresConfirmation) {
        SetEnvisionChatStatus('Confirmation required before the pending action can run.');
        return;
    }

    SetEnvisionChatStatus('Connected via ' + (data.provider || window.EnvisionChatConfig.provider) + ' (' + (data.model || window.EnvisionChatConfig.model) + ').');

    if (NotifyEnvisionChatAfterSuccessfulToolExecution(data.toolActivities || [])) {
        return;
    }

    if (MaybeRefreshEnvisionChatConfigGrids(data.toolActivities || [])) {
        return;
    }

    MaybeReloadEnvisionChatHostPageAfterSuccessfulToolExecution(data.toolActivities || []);
}

function GetEnvisionChatCurrentContext() {
    if (window.EnvisionChatConfig && window.EnvisionChatConfig.currentContext) {
        return window.EnvisionChatConfig.currentContext;
    }

    return '';
}

async function SendEnvisionChatRequest(payload) {
    if (!IsEnvisionChatEnabled()) {
        SetEnvisionChatStatus('AI chat is disabled.');
        return;
    }

    payload.currentContext = GetEnvisionChatCurrentContext();

    const response = await fetch(window.EnvisionChatConfig.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': window.RequestVerificationToken
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        SetEnvisionChatStatus(data.error || 'The assistant request failed.');
        return;
    }

    ApplyEnvisionChatResponse(data);
}

async function SendEnvisionChatMessage() {
    if (!IsEnvisionChatEnabled()) {
        return;
    }

    if (EnvisionChatSending) {
        return;
    }

    const input = document.getElementById('EnvisionChatInput');
    if (!input) {
        return;
    }

    const text = input.value.trim();
    if (!text) {
        return;
    }

    EnvisionChatPendingConfirmation = null;
    RenderEnvisionChatConfirmation();
    AddEnvisionChatMessage('user', text);
    input.value = '';
    SetEnvisionChatStatus('Waiting for assistant response...');
    SetEnvisionChatSending(true);

    try {
        await SendEnvisionChatRequest({
            messages: EnvisionChatMessages,
            documents: EnvisionChatDocuments
        });
    }
    catch (error) {
        SetEnvisionChatStatus('The assistant request failed. Check server connectivity and provider settings.');
    }
    finally {
        SetEnvisionChatSending(false);
    }
}

async function ConfirmEnvisionChatPendingAction() {
    if (!IsEnvisionChatEnabled()) {
        return;
    }

    if (EnvisionChatSending || !EnvisionChatPendingConfirmation) {
        return;
    }

    SetEnvisionChatStatus('Executing confirmed action...');
    SetEnvisionChatSending(true);

    try {
        await SendEnvisionChatRequest({
            messages: EnvisionChatMessages,
            documents: EnvisionChatDocuments,
            toolConfirmation: {
                approved: true,
                toolName: EnvisionChatPendingConfirmation.toolName,
                argumentsJson: EnvisionChatPendingConfirmation.argumentsJson
            }
        });
    }
    catch (error) {
        SetEnvisionChatStatus('The confirmed action failed. Check server connectivity and provider settings.');
    }
    finally {
        SetEnvisionChatSending(false);
    }
}

function CancelEnvisionChatConfirmation() {
    if (!EnvisionChatPendingConfirmation) {
        return;
    }

    AddEnvisionChatMessage('assistant', 'Pending action canceled.');
    EnvisionChatPendingConfirmation = null;
    RenderEnvisionChatConfirmation();
    SaveEnvisionChatState();
    SetEnvisionChatStatus('Pending action canceled.');
}

window.addEventListener('resize', function () {
    const sidebar = document.getElementById('EnvisionChatSidebar');
    const body = document.getElementById('EnvisionChatBody');
    if (!sidebar) {
        return;
    }

    const currentWidth = Math.round(sidebar.getBoundingClientRect().width) || EnvisionChatSidebarDefaultWidth;
    SetEnvisionChatSidebarWidth(sidebar, currentWidth);

    if (body) {
        SetEnvisionChatToolActivityWidth(body, parseInt(window.getComputedStyle(body).getPropertyValue('--envision-chat-tool-activity-width'), 10)
            || EnvisionChatToolActivityDefaultWidth);
    }
});

// ---- AI focus mode (shared) -------------------------------------------------------
// Docks the assistant on the right and gives the page root the remaining width by
// absorbing the overlap in a right margin; nothing else about the page changes. Used by
// the Report Designer and the Asset Manager; call from DOMContentLoaded (this file loads
// after the page scripts). The button is shown only when the assistant is enabled, and
// activeClass marks it while the mode is on. Exits on toggle or when the sidebar closes.
function EnvisionChatSetupFocusButton(buttonId, rootId, activeClass) {
    const button = document.getElementById(buttonId);
    const root = document.getElementById(rootId);
    if (!button || !root || !IsEnvisionChatEnabled()) {
        return;
    }
    button.style.display = '';

    let active = false;
    let observer = null;

    function applyLayout() {
        const sidebar = document.getElementById('EnvisionChatSidebar');
        root.style.marginRight = '';
        if (!active || !sidebar || !sidebar.classList.contains('show')) {
            return;
        }
        // The overlap between the root and the sidebar is what the margin must absorb;
        // measuring it (instead of using the sidebar width) keeps page padding intact.
        // 10px on top so the page content never sits flush against the assistant.
        const overlap = root.getBoundingClientRect().right - sidebar.getBoundingClientRect().left + 10;
        if (overlap > 0) {
            root.style.marginRight = overlap + 'px';
        }
    }

    function exitFocusMode() {
        if (!active) {
            return;
        }
        active = false;
        button.classList.remove(activeClass);
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        const sidebar = document.getElementById('EnvisionChatSidebar');
        if (sidebar) {
            sidebar.removeEventListener('shown.bs.offcanvas', applyLayout);
            sidebar.removeEventListener('hidden.bs.offcanvas', exitFocusMode);
        }
        window.removeEventListener('resize', applyLayout);
        applyLayout();
    }

    button.addEventListener('click', function () {
        if (active) {
            exitFocusMode();
            return;
        }
        active = true;
        button.classList.add(activeClass);

        const sidebar = document.getElementById('EnvisionChatSidebar');
        if (sidebar && !sidebar.classList.contains('show')) {
            ToggleEnvisionChatSidebar();
        }
        if (sidebar) {
            // The offcanvas gets its 'show' class after the open transition, so the
            // first real layout pass runs from this event.
            sidebar.addEventListener('shown.bs.offcanvas', applyLayout);
            sidebar.addEventListener('hidden.bs.offcanvas', exitFocusMode);
            if (typeof ResizeObserver !== 'undefined') {
                observer = new ResizeObserver(applyLayout);
                observer.observe(sidebar);
            }
        }
        window.addEventListener('resize', applyLayout);
        applyLayout();
    });
}

document.addEventListener('DOMContentLoaded', InitializeEnvisionChat);
