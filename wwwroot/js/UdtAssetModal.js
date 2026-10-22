// Asset Manager / UDT editor modal on the Envision page (F20). Self-contained like
// CrossReference.js: all state and element ids are Uam-prefixed, all data comes from the
// Config/Design APIs, and the standalone /AssetManager and /UdtManager pages stay authoritative
// for deep links. Lists are client-rendered: UDT/asset sets are small by nature.

/* global bootstrap */

var uamNodes = [];
var uamSelectedNodeId = 0;
var uamEditNodeId = 0;
var uamEditNodeSortOrder = 0;   // carried through the node dialog; drag owns the value
var uamDefinitions = [];
var uamCurrentDefinition = null;   // working copy (DTO shape) in the definition editor
var uamCurrentDefinitionId = 0;
var uamInstanceDefinition = null;  // definition whose instances are listed
var uamInstances = [];
var uamCurrentInstanceId = 0;
var uamPushIds = [];
var uamPushSelected = {};   // instance id -> push it? (absent/true = yes; see UamPushSelectedIds)
var uamSymbolInstance = '';
var uamDesignChanged = false;      // a symbol was created: refresh the editor page on close

function UamT(key) { return (window.UamTranslations || {})[key] || key; }

function UamApi(url, method, body, signatureToken) {
    var verb = String(method || 'GET').toUpperCase();
    var headers = { 'Content-Type': 'application/json' };
    if (signatureToken) headers['X-Signature-Token'] = signatureToken;

    return fetch(url, {
        method: verb,
        credentials: 'same-origin',
        headers: headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (data) {
        // Part 11 electronic signature flow (F19 Phase 2), same shape as UamPageApi below. In
        // compliance mode AdminApiControllerBase.PassesConfigSignatureGate refuses EVERY non-GET
        // config call with { signatureRequired: true, actionKey, meanings } and writes nothing -
        // which is every save, push, detach, release, reorder, delete and type import this editor
        // makes. Without this they all ended in an opaque error and the operator could not sign.
        // Collect the signature through the ONE shared dialog (wwwroot/js/signature.js +
        // _SignatureModalPartial, included by Envision.cshtml) and retry the same call once with
        // the single-use token header - passing the token makes the guard below false, so a
        // rejected token surfaces as an ordinary error instead of re-prompting forever.
        //
        // Reads are deliberately skipped: the gate lets GET through, and this modal is mostly GETs.
        if (verb !== 'GET' && data && data.signatureRequired && !signatureToken && window.EnvisionSignature) {
            return EnvisionSignature.request(data.actionKey, data.meanings)
                .then(function (token) { return UamApi(url, method, body, token); },
                    function () {
                        // Cancelling the dialog is a decision, not a failure: tag the rejection so
                        // the caller can stay silent instead of following it with an error box.
                        var cancelled = new Error('Signature cancelled');
                        cancelled.uamSignatureCancelled = true;
                        throw cancelled;
                    });
        }
        return data;
    });
}

// The copy is the one Uam operation that is NOT a config API endpoint: it exists to make this
// dialog usable and is deliberately kept off the configuration surface, so that surface and the
// MCP tool set stay exactly parallel. Page handlers are session-authenticated and therefore need
// the antiforgery token, which UamApi's plain JSON POST does not carry.
function UamPageApi(handler, body, signatureToken) {
    var headers = {
        'Content-Type': 'application/json',
        'RequestVerificationToken': window.RequestVerificationToken || ''
    };
    if (signatureToken) headers['X-Signature-Token'] = signatureToken;

    return fetch('/Envision?handler=' + handler, {
        method: 'POST',
        credentials: 'same-origin',
        headers: headers,
        body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (data) {
        // Part 11 electronic signature flow (F19 Phase 2). ImportUdtRows and CopyAsset are gated
        // with SignatureHelper.RequireSignatureIfNeeded("Config.Save", ...) like every config
        // write, so in compliance mode they answer { signatureRequired: true, actionKey, meanings }
        // and do nothing. Without this the operator saw an opaque failure and had no way to sign.
        // Same handling as EntityModal.js and the runtime actions: collect the signature through
        // the ONE shared dialog (wwwroot/js/signature.js, _SignatureModalPartial, included by
        // Envision.cshtml) and retry the same call once with the single-use token header.
        if (data && data.signatureRequired && !signatureToken && window.EnvisionSignature) {
            return EnvisionSignature.request(data.actionKey, data.meanings)
                .then(function (token) { return UamPageApi(handler, body, token); },
                    function () {
                        // Cancelling the dialog is a decision, not a failure: tag the rejection so
                        // the caller can stay silent instead of following it with an error box.
                        var cancelled = new Error('Signature cancelled');
                        cancelled.uamSignatureCancelled = true;
                        throw cancelled;
                    });
        }
        return data;
    });
}

function UamSignatureCancelled(e) {
    return !!(e && e.uamSignatureCancelled);
}

function UamEsc(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

// For a value interpolated into a DOUBLE-QUOTED HTML attribute. UamEsc is not enough there: it
// escapes &, < and > but leaves quotes intact, so a value containing one closes the attribute
// early and the rest of it disappears. Member values are free text - an alarm Message with a
// quoted word, or an Actions JSON template, which is nothing but quotes - so every attribute the
// member editor writes needs this.
function UamEscAttr(value) {
    return UamEsc(value).replace(/"/g, '&quot;');
}

function UamField(obj, name) {
    return obj[name] !== undefined ? obj[name] : obj[name.charAt(0).toUpperCase() + name.slice(1)];
}

// What to CALL an instance anywhere inside the tree: the LEAF of its dotted identity. The identity
// is composed as <asset path with dots>.<leaf> (UdtService.ComposeInstanceName), so the path half is
// already on screen as the branch the row sits in and repeating it per row is noise. Mirrors
// UdtService.LeafName - the one place this rule lives on the client.
function UamLeafName(name) {
    var value = String(name == null ? '' : name);
    var dot = value.lastIndexOf('.');
    return dot >= 0 ? value.substring(dot + 1) : value;
}

function UamInstanceLabel(instance) {
    return UamLeafName(UamField(instance, 'name'));
}

// Lifecycle state of an instance (server-computed): NotMaterialized (staged only, no rows yet),
// Outdated (a push would change the rows) or Synced. Older rows without the field fall back to
// the outdated flag so nothing breaks mid-rollout.
function UamInstanceState(instance) {
    var state = UamField(instance, 'state');
    if (state) return state;
    return UamField(instance, 'outdated') ? 'Outdated' : 'Synced';
}

// The status chip every list and panel shares, so the three states render identically everywhere.
function UamStateChip(instance) {
    var state = UamInstanceState(instance);
    if (state === 'NotMaterialized') return '<span class="udt-chip udt-chip-line">' + UamEsc(UamT('notMaterialized')) + '</span>';
    if (state === 'Outdated') return '<span class="udt-chip udt-chip-warn">' + UamEsc(UamT('outdated')) + '</span>';
    return '<span class="udt-chip udt-chip-ok">' + UamEsc(UamT('synced')) + '</span>';
}

// Client mirror of UdtService.ComposeInstanceName. Used only to SHOW the identity while typing -
// the server composes the stored value - but it must agree with it, or the dialog previews a name
// the save would not produce.
function UamComposeInstanceName(assetPath, leafOrName) {
    var leaf = UamLeafName(leafOrName);
    var path = String(assetPath == null ? '' : assetPath).trim().replace(/^\/+|\/+$/g, '');
    return path.length ? path.split('/').join('.') + '.' + leaf : leaf;
}

// The composed identity under the Name field: the field takes a leaf, but the identity is what
// collides, what a symbol binds to and what an export carries, so it must be visible before saving
// rather than discovered in an error afterwards.
//
// It also answers "is this name free" right here. Copy opens the dialog prefilled from the source,
// which composes the identity that already exists, so without this the only signal that the
// destination still has to be changed was the save failing.
function UamUpdateNamePreview() {
    var host = document.getElementById('UamInstNamePreview');
    if (!host) return;

    var leaf = (document.getElementById('UamInstName').value || '').trim();
    var asset = document.getElementById('UamInstAsset').value || '';
    if (!leaf) { host.textContent = ''; host.classList.remove('uam-name-taken'); return; }

    var composed = UamComposeInstanceName(asset, leaf);

    // Excludes the instance being edited, or renaming nothing would report a clash with itself.
    // A bulk create ({N} in the name) composes one name per number, so the literal pattern is not
    // a real identity and is not checked.
    var taken = !leaf.includes('{N}') && (uamAllInstances || []).some(function (i) {
        return UamField(i, 'name') === composed && UamField(i, 'id') !== uamCurrentInstanceId;
    });

    host.textContent = taken ? composed + ' - ' + UamT('nameTaken') : composed;
    host.classList.toggle('uam-name-taken', taken);
}

// Destination picker for the instance dialog. Same combo as the Copy node dialog's Destination -
// indented tree in the menu, full path on the closed toggle so nodes sharing a name under different
// branches stay apart - but keyed on the PATH, because the instance API takes Asset as a path.
// The first entry is "no node": an instance may legitimately sit outside the tree (AssetId 0).
function UamRenderAssetPicker(selectedPath) {
    var menu = document.getElementById('UamInstAssetMenu');
    if (!menu) return;

    var items = [{ path: '', name: UamT('root'), depth: 0 }];
    (function walk(parentId, depth) {
        UamChildren(parentId).forEach(function (node) {
            items.push({ path: UamField(node, 'path'), name: UamField(node, 'name'), depth: depth + 1 });
            walk(UamField(node, 'id'), depth + 1);
        });
    })(0, 0);

    var current = String(selectedPath == null ? '' : selectedPath).trim();
    menu.innerHTML = items.map(function (item) {
        return '<div class="uam-combo-item' + (item.path === current ? ' selected' : '') + '"'
            + ' style="padding-left:' + (item.depth * 16 + 8) + 'px"'
            + ' data-path="' + UamEscAttr(item.path) + '" onclick="UamAssetPick(this)">'
            + (item.path ? '<svg viewBox="0 0 24 24"><path d="M12 3l8 5v8l-8 5-8-5V8z"/></svg>' : '')
            + UamEsc(item.name)
            + '</div>';
    }).join('');
}

// Sets both halves of the combo: the stored path and the label on the closed toggle.
function UamAssetComboSet(path) {
    document.getElementById('UamInstAsset').value = path || '';
    document.getElementById('UamInstAssetToggle').textContent = path || UamT('root');
    document.getElementById('UamInstAssetMenu').style.display = 'none';
    UamUpdateNamePreview();
}

function UamAssetPick(element) {
    var menu = document.getElementById('UamInstAssetMenu');
    menu.querySelectorAll('.uam-combo-item').forEach(function (item) { item.classList.remove('selected'); });
    element.classList.add('selected');
    UamAssetComboSet(element.dataset.path || '');
}

function UamAssetPickerToggle(e) {
    e.stopPropagation();
    var menu = document.getElementById('UamInstAssetMenu');
    if (menu.style.display !== 'none') { menu.style.display = 'none'; return; }

    UamRenderAssetPicker(document.getElementById('UamInstAsset').value || '');
    menu.style.display = '';
    var close = function (ev) {
        if (ev.target.closest('#UamInstAssetCombo')) return;
        menu.style.display = 'none';
        document.removeEventListener('click', close, true);
    };
    document.addEventListener('click', close, true);
}

// The small message dialog. Its argument is TEXT, never markup. Server error strings quote values
// the user authored - a parameter value, an asset node name, an alarm message - so writing them as
// HTML made this a stored-XSS sink: a value like <img src=x onerror=...> stored through the API
// ran in the next operator's session the moment a push or save reported on it. Every line is
// escaped here, the way UamShowFindings already does, so no caller has to remember.
// An ARRAY renders as one line per entry; that <br /> is the only markup this function emits.
function UamError(message) {
    var lines = (Array.isArray(message) ? message : [message])
        .filter(function (line) { return line != null && String(line) !== ''; })
        .map(function (line) { return UamEsc(line); });

    document.getElementById('UamMsgText').innerHTML = lines.length ? lines.join('<br />') : UamEsc(UamT('errorOccurred'));
    new bootstrap.Modal(document.getElementById('UamMsgModal')).show();
}

// The findings of a rejected write, as a LIST. Kept separate from the joined-string version below
// because a validation failure carries one message per materialized row - one pump reports eight -
// and the difference between a readable dialog and a wall of text is whether they stay separate.
function UamErrorList(data) {
    if (!data) return [];
    var parts = [];
    function add(obj) {
        if (!obj) return;
        if (obj.error) parts.push(typeof obj.error === 'string' ? obj.error : (obj.error.Message || obj.error.message || JSON.stringify(obj.error)));
        var list = obj.validationErrors || obj.ValidationErrors;
        if (list && list.length) list.forEach(function (e) { parts.push(typeof e === 'string' ? e : (e.Message || e.message || JSON.stringify(e))); });
    }
    add(data);
    if (data.results && data.results.length) data.results.forEach(add);

    // "Validation failed" is a header, not a finding: the rows underneath say what failed, and the
    // dialog already carries it as its title.
    return parts.filter(function (p, i) { return !(i === 0 && parts.length > 1 && /^validation failed\.?$/i.test(p.trim())); });
}

// Shows those findings one per row. Falls back to the small message modal for a single line, which
// is what that dialog is good at - this one exists for the list case.
function UamShowErrors(data) {
    var parts = UamErrorList(data);
    if (parts.length <= 1) { UamError(parts[0] || UamT('errorOccurred')); return; }
    UamShowFindings(parts, UamT('validationFailed'));
}

// The findings dialog with an explicit title, so staged-save warnings ("Saved, but the next push
// would report:") reuse the same list rendering as hard validation failures.
function UamShowFindings(parts, title) {
    if (!parts || !parts.length) return;
    if (parts.length === 1 && !title) { UamError(parts[0]); return; }

    document.getElementById('UamFindingsTitle').textContent = title || UamT('validationFailed');
    document.getElementById('UamFindingsList').innerHTML = parts.map(function (p) {
        return '<li>' + UamEsc(p) + '</li>';
    }).join('');
    document.getElementById('UamFindingsCount').textContent =
        UamT('findingsCount').replace('{0}', parts.length);
    new bootstrap.Modal(document.getElementById('UamFindingsModal')).show();
}

// ==================== shell ====================

function UamOpen() {
    uamDesignChanged = false;
    UamShowAssetView();
    var loaded = UamLoadTree(false);
    UamWireTreeDragDrop();
    UamWireActionsEditor();
    UamWireSplitter();
    var el = document.getElementById('UdtAssetModal');
    var modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modal.show();

    // AI focus mode button, only when the embedded assistant is enabled.
    var aiBtn = document.getElementById('UamAiFocusBtn');
    if (aiBtn && window.EnvisionChatConfig && window.EnvisionChatConfig.enabled) {
        aiBtn.style.display = '';
    }

    if (!el.dataset.uamCloseHooked) {
        el.dataset.uamCloseHooked = '1';
        el.addEventListener('hidden.bs.modal', function () {
            // Leave AI focus with the modal, so the next open starts normal.
            UamExitAiFocus();
            // A symbol was dropped on the page currently open in the editor: silently
            // refresh so it appears without losing more context than necessary.
            if (uamDesignChanged) { uamDesignChanged = false; location.reload(); }
        });
    }

    return loaded;
}

// Opens the Asset Manager straight onto one UDT instance, by name. Used by the "Open UDT instance"
// jump in the Edit Instance replacer dialog, where the symbol knows only the name it is bound to.
// The instance list does not exist client-side until UamLoadTree resolves, hence the chain;
// UamSelectInstance then expands the owning node so the selection is visible in the tree.
function UamOpenInstanceByName(instanceName) {
    if (!instanceName) return;

    var loaded = UamOpen();

    (loaded || Promise.resolve()).then(function () {
        var instance = (uamAllInstances || []).filter(function (i) {
            return UamField(i, 'name') === instanceName;
        })[0];

        // A binding can outlive its instance (deleting a UDT instance leaves its symbols in
        // place), so a miss is an ordinary state, not an error condition.
        if (!instance) { UamError(UamT('instanceNotFound')); return; }

        UamSelectInstance(UamField(instance, 'id'));
    }).catch(function () { UamError(); });
}

function UamToggleExpand() {
    document.getElementById('UamDialog').classList.toggle('uam-full');
}

// ---- AI focus mode -------------------------------------------------------------------
// Docks the AI assistant right of the Asset Manager. A modal needs more than the shared
// page helper (EnvisionChatSetupFocusButton): the modal layer must shrink so the dialog
// centers left of the assistant, the sidebar must be lifted over the modal backdrop
// (sidebar z 1046 < backdrop 1050 < modal 1055), and Bootstrap's focus trap must pause
// or every click into the chat input would be yanked straight back into the modal.
var uamAiFocusActive = false;
var uamAiFocusObserver = null;
var uamAiSidebarOldZ = '';
// Whether the dialog was already full-size before focus mode, so exit can restore it.
var uamAiWasFull = false;

function UamApplyAiFocusLayout() {
    var modalEl = document.getElementById('UdtAssetModal');
    var sidebar = document.getElementById('EnvisionChatSidebar');
    if (!modalEl) return;
    modalEl.style.width = '';
    if (!uamAiFocusActive || !sidebar || !sidebar.classList.contains('show')) return;
    var w = Math.round(sidebar.getBoundingClientRect().width) || 0;
    // Flush against the assistant on purpose: the full-size dialog and the sidebar read
    // as one split screen, and a gap here shows a stripe of the page behind the backdrop.
    if (w > 0) modalEl.style.width = 'calc(100% - ' + w + 'px)';
}

function UamExitAiFocus() {
    if (!uamAiFocusActive) return;
    uamAiFocusActive = false;

    var btn = document.getElementById('UamAiFocusBtn');
    if (btn) btn.classList.remove('uam-on');
    if (uamAiFocusObserver) { uamAiFocusObserver.disconnect(); uamAiFocusObserver = null; }

    // Restore the pre-focus dialog size (full-size only if it already was).
    if (!uamAiWasFull) {
        var dialog = document.getElementById('UamDialog');
        if (dialog) dialog.classList.remove('uam-full');
    }

    var sidebar = document.getElementById('EnvisionChatSidebar');
    if (sidebar) {
        sidebar.removeEventListener('shown.bs.offcanvas', UamApplyAiFocusLayout);
        sidebar.removeEventListener('hidden.bs.offcanvas', UamExitAiFocus);
        sidebar.style.zIndex = uamAiSidebarOldZ;
    }
    window.removeEventListener('resize', UamApplyAiFocusLayout);

    // Resume the focus trap only while the modal is still open (its own hide path
    // deactivates the trap itself, and re-activating on a hidden modal would strand focus).
    var modalEl = document.getElementById('UdtAssetModal');
    var instance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (instance && modalEl.classList.contains('show')) {
        try { instance._focustrap.activate(); } catch (e) { /* private API absent: trap stays off */ }
    }
    UamApplyAiFocusLayout();
}

function UamToggleAiFocus() {
    if (uamAiFocusActive) { UamExitAiFocus(); return; }
    uamAiFocusActive = true;

    var btn = document.getElementById('UamAiFocusBtn');
    if (btn) btn.classList.add('uam-on');

    // Focus mode also goes full-size, so the Asset Manager uses all width left of the
    // assistant; exit restores the size the dialog had before.
    var dialog = document.getElementById('UamDialog');
    uamAiWasFull = dialog.classList.contains('uam-full');
    dialog.classList.add('uam-full');

    var sidebar = document.getElementById('EnvisionChatSidebar');
    // Show the offcanvas directly: ToggleEnvisionChatSidebar first runs closeconfigs(),
    // which would close this very modal.
    if (sidebar && !sidebar.classList.contains('show')) {
        (bootstrap.Offcanvas.getInstance(sidebar) || new bootstrap.Offcanvas(sidebar)).show();
    }
    if (sidebar) {
        uamAiSidebarOldZ = sidebar.style.zIndex;
        sidebar.style.zIndex = '1056'; // over the modal (1055) and its backdrop (1050)
        sidebar.addEventListener('shown.bs.offcanvas', UamApplyAiFocusLayout);
        sidebar.addEventListener('hidden.bs.offcanvas', UamExitAiFocus);
        if (typeof ResizeObserver !== 'undefined') {
            uamAiFocusObserver = new ResizeObserver(UamApplyAiFocusLayout);
            uamAiFocusObserver.observe(sidebar);
        }
    }
    window.addEventListener('resize', UamApplyAiFocusLayout);

    var modalEl = document.getElementById('UdtAssetModal');
    var instance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (instance) {
        try { instance._focustrap.deactivate(); } catch (e) { /* private API absent: chat input may lose focus */ }
    }
    UamApplyAiFocusLayout();
}

// Draggable splitter between the asset tree and the detail panel, for big trees.
// The chosen width sticks per browser via localStorage.
function UamWireSplitter() {
    var splitter = document.getElementById('UamSplitter');
    var split = document.getElementById('UamAssetSplit');
    if (!splitter || splitter.dataset.uamWired) return;
    splitter.dataset.uamWired = '1';

    try {
        var saved = parseInt(localStorage.getItem('UamTreeWidth'), 10);
        if (saved) split.style.setProperty('--uam-tree-width', saved + 'px');
    } catch (e) { }

    splitter.addEventListener('mousedown', function (e) {
        e.preventDefault();
        splitter.classList.add('uam-splitting');
        var startX = e.clientX;
        var startWidth = document.getElementById('UamAssetTree').getBoundingClientRect().width;

        function move(ev) {
            var width = Math.round(startWidth + (ev.clientX - startX));
            width = Math.max(200, Math.min(width, split.getBoundingClientRect().width - 320));
            split.style.setProperty('--uam-tree-width', width + 'px');
        }
        function up() {
            splitter.classList.remove('uam-splitting');
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            try { localStorage.setItem('UamTreeWidth', parseInt(split.style.getPropertyValue('--uam-tree-width'), 10) || ''); } catch (e) { }
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    });
}

function UamShowAssetView() {
    document.getElementById('UamAssetView').style.display = '';
    document.getElementById('UamUdtView').style.display = 'none';
    document.getElementById('UamTitle').textContent = UamT('assetManager');
    UamResetSearch('UamAssetSearch');
    uamAssetSearch = '';
    // Only when the tree is already loaded: at open time UamLoadTree draws it, and rendering here
    // first would flash the "tree is empty" message.
    if (uamNodes.length) UamRenderTree();
}

function UamShowUdtView() {
    document.getElementById('UamAssetView').style.display = 'none';
    document.getElementById('UamUdtView').style.display = '';
    document.getElementById('UamTitle').textContent = UamT('udtDefinitions');
    UamResetSearch('UamDefSearch');
    uamDefSearch = '';
    UamRenderDefinitionsList();
}

// Entering a list starts unfiltered: a leftover term would hide rows for no visible reason.
function UamResetSearch(id) {
    var input = document.getElementById(id);
    if (input) input.value = '';
}

// ==================== asset tree ====================

var uamAllInstances = [];          // every instance, for the tree's instance children
var uamExpandedNodes = {};         // asset node id -> instances expanded in the tree
var uamSelectedInstanceId = 0;     // instance selected in the tree (0 = a node is selected)

// Multi-selection sets (Ctrl/Cmd-click toggles, Shift-click range-selects). The single globals
// above stay the ANCHOR (last-touched row) so the detail panel, node editor and drag paths keep
// working unchanged when the selection collapses to one. These object maps are the source of truth
// for highlight and bulk delete; keys are ids. uamSelAnchor is {type:'node'|'instance', id}.
var uamSelectedNodeIds = {};
var uamSelectedInstanceIds = {};
var uamSelAnchor = null;
// Returns the load promise so a caller can act once the tree data is actually in - used by
// UamOpenInstanceByName to select an instance that does not exist client-side until this resolves.
function UamLoadTree(keepSelection) {
    return Promise.all([
        UamApi('/API/Config/Assets'),
        UamApi('/API/Config/UdtInstances'),
        UamApi('/API/Config/UdtDefinitions')
    ]).then(function (results) {
        if (results[0] && results[0].error) { UamError(results[0].error); return; }
        uamNodes = results[0] || [];
        uamAllInstances = results[1] && !results[1].error ? results[1] : [];
        if (results[2] && !results[2].error) uamDefinitions = UamStampMemberIds(results[2]);
        if (!keepSelection) { uamSelectedNodeId = 0; uamSelectedInstanceId = 0; uamSelectedNodeIds = {}; uamSelectedInstanceIds = {}; uamSelAnchor = null; }
        UamUpdateSelectionButtons();
        UamRenderTree();
        if (uamSelectedInstanceId) UamRenderInstanceDetail();
        else UamRenderPanel();
    }).catch(function () { UamError(); });
}

// Instances attached to exactly this node (the panel additionally lists the whole subtree).
function UamNodeInstances(nodeId) {
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === nodeId; })[0];
    if (!node) return [];
    var path = UamField(node, 'path');
    // Same ordering rule as UamChildren and the server (SortOrder ASC, Name ASC): everything sits
    // at the 0 default until a node's instances are dragged, so an untouched tree stays alphabetical.
    return uamAllInstances.filter(function (i) { return (UamField(i, 'asset') || '') === path; })
        .sort(function (a, b) { return (UamField(a, 'sortOrder') - UamField(b, 'sortOrder')) || String(UamField(a, 'name')).localeCompare(String(UamField(b, 'name'))); });
}

function UamChildren(parentId) {
    return uamNodes.filter(function (n) { return UamField(n, 'parentId') === parentId; })
        .sort(function (a, b) { return (UamField(a, 'sortOrder') - UamField(b, 'sortOrder')) || String(UamField(a, 'name')).localeCompare(String(UamField(b, 'name'))); });
}

// ---------- tree filter ----------
//
// One box over the whole tree. A node survives when it matches itself, when one of its attached
// instances matches, or when anything in its subtree does - so a hit is shown with its full path
// rather than rootless. Filtering never touches the data, only what is drawn.
var uamAssetSearch = '';

function UamSearchAssets(value) { uamAssetSearch = value; UamRenderTree(); }

function UamTextHit(value, term) {
    return String(value === null || value === undefined ? '' : value).toLowerCase().indexOf(term) >= 0;
}

function UamNodeHit(node, term) {
    return UamTextHit(UamField(node, 'name'), term) || UamTextHit(UamField(node, 'description'), term);
}

// Definition and device are matched too: "which nodes carry a Pump1 instance" and "what hangs off
// PLC1" are the questions this tree gets asked, and neither is answerable by node name alone.
// The device list is DERIVED (the instance DTO has no device field since the device moved onto
// the member) - the same derivation the device column uses.
function UamInstanceHit(instance, term) {
    var definition = (uamDefinitions || []).filter(function (d) { return d.name === UamField(instance, 'definition'); })[0];
    return UamTextHit(UamField(instance, 'name'), term)
        || UamTextHit(UamField(instance, 'definition'), term)
        || UamTextHit(UamInstanceDeviceLabel(definition, instance), term);
}

// Memoized per render pass; the cache doubles as a cycle guard (the backend refuses cycles, but a
// bad row must not hang the editor).
function UamSubtreeHit(nodeId, term, cache) {
    if (cache[nodeId] !== undefined) return cache[nodeId];
    cache[nodeId] = false;
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === nodeId; })[0];
    var hit = !!node && UamNodeHit(node, term);
    if (!hit) hit = UamNodeInstances(nodeId).some(function (i) { return UamInstanceHit(i, term); });
    if (!hit) {
        hit = UamChildren(nodeId).some(function (c) { return UamSubtreeHit(UamField(c, 'id'), term, cache); });
    }
    cache[nodeId] = hit;
    return hit;
}

function UamRenderTree() {
    var term = String(uamAssetSearch || '').trim().toLowerCase();
    var hitCache = {};

    function level(parentId, depth) {
        var children = UamChildren(parentId);
        if (term) children = children.filter(function (n) { return UamSubtreeHit(UamField(n, 'id'), term, hitCache); });
        return children.map(function (node) {
            var id = UamField(node, 'id');
            var count = UamField(node, 'instanceCount') || 0;
            var attached = UamNodeInstances(id);
            // While filtering, a node with matching instances lists only those and opens itself, so
            // the hit is visible without hunting for twisties. The expand state is really set (not
            // faked per render) so the twisty keeps collapsing the node while the filter is on.
            if (term) {
                var matching = attached.filter(function (i) { return UamInstanceHit(i, term); });
                if (matching.length) {
                    if (uamExpandedNodes[id] === undefined) uamExpandedNodes[id] = true;
                    attached = matching;
                }
            }
            var expanded = !!uamExpandedNodes[id];
            var twisty = attached.length
                ? '<span class="asset-twisty' + (expanded ? ' open' : '') + '" onclick="UamToggleNodeInstances(event,' + id + ')">'
                + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>'
                : '<span class="asset-twisty asset-twisty-none"></span>';
            // data-parent-id is carried because the tree is FLAT in the DOM (children are appended as
            // siblings and only indented by margin-left), so a sibling reorder cannot read the parent
            // off the DOM structure.
            var html = '<div class="asset-node' + (uamSelectedNodeIds[id] ? ' selected' : '') + '" style="margin-left:' + (depth * 18) + 'px" onclick="UamNodeClick(event,' + id + ')"'
                + ' ondblclick="UamNodeDblClick(event,' + id + ')"'
                + ' draggable="true" data-node-id="' + id + '" data-parent-id="' + parentId + '">'
                + twisty
                + '<svg viewBox="0 0 24 24"><path d="M12 3l8 5v8l-8 5-8-5V8z"/></svg>'
                + UamEsc(UamField(node, 'name'))
                + (count > 0 ? '<span class="asset-count">' + count + '</span>' : '')
                + '</div>';
            if (expanded) {
                html += attached.map(function (i) {
                    var iid = UamField(i, 'id');
                    var instState = UamInstanceState(i);
                    var outdated = instState === 'Outdated';
                    return '<div class="asset-instance-node' + (uamSelectedInstanceIds[iid] ? ' selected' : '') + '" style="margin-left:' + ((depth + 1) * 18) + 'px"'
                        + ' onclick="UamInstanceClick(event,' + iid + ')" ondblclick="UamInstanceDblClick(event,' + iid + ')"'
                        + ' draggable="true" data-instance-id="' + iid + '" data-node-of-instance="' + id + '">'
                        + '<svg class="asset-instance-sync' + (outdated ? ' outdated' : instState === 'NotMaterialized' ? ' staged' : '') + '" viewBox="0 0 24 24"><title>' + UamEsc(UamT(outdated ? 'outdated' : instState === 'NotMaterialized' ? 'notMaterialized' : 'synced')) + '</title>'
                        + (outdated
                            ? '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
                            : instState === 'NotMaterialized'
                                ? '<circle cx="12" cy="12" r="9" stroke-dasharray="4 3"/>'
                                : '<path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.6-4.2"/><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.6 4.2"/><path d="M21 3v4.5h-4.5"/><path d="M3 21v-4.5h4.5"/>')
                        + '</svg>'
                        // The tree shows the CONTAINED name - that is what it is for. The identity
                        // is in the tooltip, because it is what every other surface (the instances
                        // list, a symbol binding, an export) calls this instance.
                        + '<span title="' + UamEscAttr(UamField(i, 'name')) + '">' + UamEsc(UamInstanceLabel(i)) + '</span>'
                        + '<span class="asset-instance-def">' + UamEsc(UamField(i, 'definition')) + '</span>'
                        + '</div>';
                }).join('');
            }
            return html + level(id, depth + 1);
        }).join('');
    }
    document.getElementById('UamAssetTree').innerHTML =
        level(0, 0) || '<p style="color:var(--ThemeFontColor2);font-size:13px;">' + UamEsc(UamT(term ? 'noResults' : 'treeEmpty')) + '</p>';
}

function UamToggleNodeInstances(e, nodeId) {
    e.stopPropagation();
    uamExpandedNodes[nodeId] = !uamExpandedNodes[nodeId];
    UamRenderTree();
}

// ==================== drag and drop (tree re-parent + instance re-attach) ====================

// Moves a node under a new parent: same PUT as the edit dialog, so the backend cycle check,
// sibling-name check and Asset path rewrite fan-out all apply. Confirms first when rows carry
// an affected path (same warning as the edit dialog shows).
function UamMoveNode(nodeId, newParentId) {
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === nodeId; })[0];
    if (!node || UamField(node, 'parentId') === newParentId || nodeId === newParentId) return;

    // Same immediate feedback UamReorderNodes gives: without it, dropping a node onto one of its
    // own descendants first asked the operator to confirm that N rows would be re-pathed and only
    // then had the server refuse the move, so the warning was about something that never happened.
    if (UamIsSelfOrDescendant(newParentId, nodeId)) { UamError(UamT('errorOccurred')); return; }

    UamApi('/API/Config/Assets/Attached?id=' + nodeId).then(function (data) {
        var counts = (data && (data.counts || data.Counts)) || {};
        var total = Object.keys(counts).reduce(function (sum, key) { return sum + counts[key]; }, 0);
        if (total > 0 && !confirm(UamT('renameWarning').replace('{0}', total))) return;

        UamApi('/API/Config/Assets', 'PUT', [{
            Id: nodeId,
            ParentId: newParentId,
            Name: UamField(node, 'name'),
            Description: UamField(node, 'description') || '',
            SortOrder: UamField(node, 'sortOrder') || 0
        }]).then(function (result) {
            if (result && result.success) { UamLoadTree(true); return; }
            UamShowErrors((result));
        }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
        // The outer catch stays plain: it only ever sees the Attached GET, which is not gated.
    }).catch(function () { UamError(); });
}

function UamFindInstance(instanceId) {
    return (uamPanelInstances || []).concat(uamAllInstances || []).filter(function (i) { return UamField(i, 'id') === instanceId; })[0];
}

// The attach PUT on its own, so a cross-node reorder can chain an order onto it. SortOrder is
// deliberately absent: the instance PUT ignores it (the API reorders via UdtInstances/Reorder).
function UamAttachInstancePut(instance, target) {
    return UamApi('/API/Config/UdtInstances', 'PUT', [{
        Id: UamField(instance, 'id'),
        Name: UamField(instance, 'name'),
        Definition: UamField(instance, 'definition'),
        Asset: UamField(target, 'path'),
        ParameterValues: UamField(instance, 'parameterValues') || {}
    }]);
}

// Re-attaches an instance to a node. Like any other instance edit this STAGES: the identity
// re-composes at once (the tree shows the instance under its new node straight away), while the
// materialized rows keep the old Asset value until the next push moves them.
function UamAttachInstance(instanceId, nodeId) {
    var target = uamNodes.filter(function (n) { return UamField(n, 'id') === nodeId; })[0];
    var instance = UamFindInstance(instanceId);
    if (!target || !instance) return;
    if ((UamField(instance, 'asset') || '') === UamField(target, 'path')) return;

    UamAttachInstancePut(instance, target).then(function (result) {
        if (result && result.success) { UamLoadTree(true); return; }
        UamShowErrors((result));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// True when candidateId is nodeId itself or sits inside its subtree - i.e. moving nodeId there
// would make it its own ancestor. The backend refuses this too (AssetService.UpdateNode); this is
// only so the drag gives immediate feedback instead of a round trip.
function UamIsSelfOrDescendant(candidateId, nodeId) {
    var cursor = candidateId;
    var guard = 0;
    while (cursor && guard++ < 512) {
        if (cursor === nodeId) return true;
        var parent = uamNodes.filter(function (n) { return UamField(n, 'id') === cursor; })[0];
        if (!parent) return false;
        cursor = UamField(parent, 'parentId');
    }
    return false;
}

// Places a node before/after one of its siblings. The whole sibling set is renumbered 0..n-1 and
// PUT in one batch: UamChildren breaks SortOrder ties by name, so an arbitrary order is only
// expressible once every sibling holds a distinct value (everything starts at the 0 default).
// Dropping into another parent's sibling list re-parents and positions in the same call.
function UamReorderNodes(nodeId, targetNodeId, place) {
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === nodeId; })[0];
    var target = uamNodes.filter(function (n) { return UamField(n, 'id') === targetNodeId; })[0];
    if (!node || !target || nodeId === targetNodeId) return;

    var newParentId = UamField(target, 'parentId');
    if (UamIsSelfOrDescendant(newParentId, nodeId)) { UamError(UamT('errorOccurred')); return; }

    var siblings = UamChildren(newParentId).filter(function (n) { return UamField(n, 'id') !== nodeId; });
    var index = siblings.map(function (n) { return UamField(n, 'id'); }).indexOf(targetNodeId);
    if (index < 0) return;
    if (place === 'after') index++;
    siblings.splice(index, 0, node);

    var payload = siblings.map(function (n, position) {
        return {
            Id: UamField(n, 'id'),
            ParentId: newParentId,
            Name: UamField(n, 'name'),
            Description: UamField(n, 'description') || '',
            SortOrder: position
        };
    });

    function apply() {
        UamApi('/API/Config/Assets', 'PUT', payload).then(function (result) {
            if (result && result.success) { UamLoadTree(true); return; }
            UamShowErrors((result));
        }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
    }

    // Only a re-parent rewrites Asset paths, so only then is the warning relevant: a pure reorder
    // touches nothing but SortOrder and must not nag.
    if (UamField(node, 'parentId') === newParentId) { apply(); return; }
    UamApi('/API/Config/Assets/Attached?id=' + nodeId).then(function (data) {
        var counts = (data && (data.counts || data.Counts)) || {};
        var total = Object.keys(counts).reduce(function (sum, key) { return sum + counts[key]; }, 0);
        if (total > 0 && !confirm(UamT('renameWarning').replace('{0}', total))) return;
        apply();
    }).catch(function () { UamError(); });
}

// Places an instance before/after one of the instances of a node, renumbering that node's
// instances 0..n-1 (same tie rule as the nodes). Dragging in from another node re-attaches first,
// then positions.
function UamReorderInstances(instanceId, targetInstanceId, place) {
    var dragged = UamFindInstance(instanceId);
    var target = UamFindInstance(targetInstanceId);
    if (!dragged || !target || instanceId === targetInstanceId) return;

    var path = UamField(target, 'asset') || '';
    var node = uamNodes.filter(function (n) { return UamField(n, 'path') === path; })[0];
    if (!node) return;

    function applyOrder() {
        var list = UamNodeInstances(UamField(node, 'id')).filter(function (i) { return UamField(i, 'id') !== instanceId; });
        var index = list.map(function (i) { return UamField(i, 'id'); }).indexOf(targetInstanceId);
        if (index < 0) { UamLoadTree(true); return; }
        if (place === 'after') index++;
        list.splice(index, 0, dragged);

        UamApi('/API/Config/UdtInstances/Reorder', 'POST', list.map(function (i, position) {
            return { Id: UamField(i, 'id'), SortOrder: position };
        })).then(function (result) {
            if (result && result.success) { UamLoadTree(true); return; }
            UamShowErrors((result));
        }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
    }

    if ((UamField(dragged, 'asset') || '') === path) { applyOrder(); return; }

    UamAttachInstancePut(dragged, node).then(function (result) {
        if (!result || !result.success) { UamShowErrors((result)); return; }
        // Patch the local copy so the ordering math below sees the instance in its new node
        // (uamAllInstances is only refreshed by UamLoadTree, which runs after the reorder).
        if ('asset' in dragged) dragged.asset = path; else dragged.Asset = path;
        applyOrder();
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

function UamWireTreeDragDrop() {
    var tree = document.getElementById('UamAssetTree');
    if (!tree || tree.dataset.uamDndWired) return;
    tree.dataset.uamDndWired = '1';

    tree.addEventListener('dragstart', function (e) {
        // Instance children drag like the panel's instance rows: drop on a node re-attaches.
        var instanceRow = e.target.closest('.asset-instance-node');
        if (instanceRow) {
            e.dataTransfer.setData('text/uam-instance', instanceRow.dataset.instanceId);
            e.dataTransfer.effectAllowed = 'move';
            return;
        }
        var node = e.target.closest('.asset-node');
        if (!node) return;
        e.dataTransfer.setData('text/uam-node', node.dataset.nodeId);
        e.dataTransfer.effectAllowed = 'move';
    });

    // Instances in the detail panel drag onto tree nodes to re-attach.
    var panel = document.getElementById('UamAssetPanel');
    panel.addEventListener('dragstart', function (e) {
        var row = e.target.closest('.uam-draggable');
        if (!row) return;
        e.dataTransfer.setData('text/uam-instance', row.dataset.instanceId);
        e.dataTransfer.effectAllowed = 'move';
    });

    // dragend fires on the drag SOURCE, so the tree's own dragend never sees a drag that started
    // in the panel: cancelling one (ESC, or a drop outside a target) stranded the dashed drop
    // outline on the tree row it was last over, which reads as a drop still pending.
    panel.addEventListener('dragend', function () { UamClearDropMarks(tree); });

    tree.addEventListener('dragover', function (e) {
        var types = Array.from(e.dataTransfer.types || []);
        var isNode = types.indexOf('text/uam-node') >= 0;
        var isInstance = types.indexOf('text/uam-instance') >= 0;
        if (!isNode && !isInstance) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        UamClearDropMarks(tree);

        var row = UamDropRow(e);
        if (!row) return;                                             // empty space: node drops to root
        if (isNode && row.classList.contains('asset-instance-node')) return;   // a node has no business there

        // An instance over a node row only ever means "re-attach here" - there is no ordering
        // relationship between an instance and a node.
        if (isInstance && row.classList.contains('asset-node')) { row.classList.add('uam-drop-target'); return; }

        var zone = UamDropZone(row, e);
        row.classList.add(zone === 'into' ? 'uam-drop-target' : (zone === 'before' ? 'uam-drop-before' : 'uam-drop-after'));
    });

    tree.addEventListener('dragleave', function (e) {
        if (e.target === tree) UamClearDropMarks(tree);
    });

    // Without this a cancelled drag leaves its marker behind until the next dragover.
    tree.addEventListener('dragend', function () { UamClearDropMarks(tree); });

    tree.addEventListener('drop', function (e) {
        e.preventDefault();
        UamClearDropMarks(tree);
        var row = UamDropRow(e);

        var draggedNode = e.dataTransfer.getData('text/uam-node');
        if (draggedNode) {
            var nodeId = parseInt(draggedNode, 10);
            // Dropping on empty tree space moves a node to the root level.
            if (!row) { UamMoveNode(nodeId, 0); return; }
            if (row.classList.contains('asset-instance-node')) return;
            var nodeZone = UamDropZone(row, e);
            var targetNodeId = parseInt(row.dataset.nodeId, 10);
            if (nodeZone === 'into') UamMoveNode(nodeId, targetNodeId);
            else UamReorderNodes(nodeId, targetNodeId, nodeZone);
            return;
        }

        var draggedInstance = e.dataTransfer.getData('text/uam-instance');
        if (!draggedInstance || !row) return;
        var instanceId = parseInt(draggedInstance, 10);
        if (row.classList.contains('asset-node')) { UamAttachInstance(instanceId, parseInt(row.dataset.nodeId, 10)); return; }
        UamReorderInstances(instanceId, parseInt(row.dataset.instanceId, 10), UamDropZone(row, e));
    });
}

function UamClearDropMarks(root) {
    root.querySelectorAll('.uam-drop-target, .uam-drop-before, .uam-drop-after').forEach(function (n) {
        n.classList.remove('uam-drop-target', 'uam-drop-before', 'uam-drop-after');
    });
}

// Instance rows are checked first: they are nested inside the tree next to node rows, and an
// instance row is never a node row's ancestor.
function UamDropRow(e) {
    return e.target.closest('.asset-instance-node') || e.target.closest('.asset-node');
}

// Where in the row the pointer is decides the meaning: the edges insert next to the row, the
// middle drops into it. Instance rows have no middle - nothing can be dropped inside an instance.
function UamDropZone(row, e) {
    var rect = row.getBoundingClientRect();
    var pos = rect.height ? (e.clientY - rect.top) / rect.height : 0.5;
    if (row.classList.contains('asset-instance-node')) return pos < 0.5 ? 'before' : 'after';
    if (pos < 0.25) return 'before';
    if (pos > 0.75) return 'after';
    return 'into';
}

var uamPanelInstances = [];

function UamSelectNode(id) {
    uamSelectedNodeId = id;
    uamSelectedInstanceId = 0;
    // Plain (non-modifier) select: the selection collapses to this one node.
    uamSelectedNodeIds = {}; uamSelectedNodeIds[id] = true;
    uamSelectedInstanceIds = {};
    uamSelAnchor = { type: 'node', id: id };
    UamUpdateSelectionButtons();
    UamRenderTree();
    UamRenderPanel();
}

// Double-click a tree row to edit it, the usual tree convention. The single click still selects,
// and fires first, so the editor opens against the row the user just selected.
function UamNodeDblClick(ev, id) {
    // The twisty lives inside the node row and expands on click; a double-click there is two
    // expands, not a request to edit.
    if (ev && ev.target && ev.target.closest && ev.target.closest('.asset-twisty')) return;
    UamOpenNodeEditor(id);
}

function UamInstanceDblClick(ev, id) {
    // The instance dialog is built for the UDT view and reads TWO globals that view sets up and the
    // asset tree does not:
    //   uamInstances          - the row is looked up in it, so without it the dialog opens as an
    //                           empty "Add instance" form instead of the instance double-clicked.
    //   uamInstanceDefinition - UamRenderInstanceParams reads .parameters off it and throws on null,
    //                           which aborts the function BEFORE it shows the modal: the fields fill
    //                           in behind a dialog that never appears.
    // Both are pointed at the right thing here, the same preparation UamOpenInstanceEditorFromAsset
    // does for the create case.
    if (typeof uamAllInstances !== 'undefined' && uamAllInstances) uamInstances = uamAllInstances;

    var instance = (uamInstances || []).filter(function (i) { return i.id === parseInt(id, 10); })[0];
    if (instance && typeof uamDefinitions !== 'undefined' && uamDefinitions) {
        var definition = uamDefinitions.filter(function (d) { return d.name === instance.definition; })[0];
        if (definition) uamInstanceDefinition = definition;
    }
    if (!uamInstanceDefinition) return;   // nothing sensible to render against

    UamOpenInstanceEditor(id);
}

function UamSelectInstance(id) {
    // The drawer-expansion state is index-keyed, so it only means anything for the instance it
    // was built against - carrying it over would open another instance's row (possibly of a
    // different definition) at the same position.
    if (uamSelectedInstanceId !== id) uamExpandedInstanceVars = {};
    uamSelectedInstanceId = id;
    // Plain (non-modifier) select: the selection collapses to this one instance.
    uamSelectedInstanceIds = {}; uamSelectedInstanceIds[id] = true;
    uamSelectedNodeIds = {};
    uamSelAnchor = { type: 'instance', id: id };

    // UamRenderInstanceDetail resolves out of uamAllInstances, which is loaded once when the modal
    // opens, and falls back to the node panel when it cannot find the id. The node panel's own
    // instance table is a SEPARATE later fetch, so an instance created since the modal opened
    // exists only there - clicking its row would silently bounce back to the node. Adopt the row
    // into uamAllInstances first so the click always lands.
    if (!uamAllInstances.some(function (i) { return UamField(i, 'id') === id; })) {
        var known = uamPanelInstances.filter(function (i) { return UamField(i, 'id') === id; })[0]
            || uamInstances.filter(function (i) { return UamField(i, 'id') === id; })[0];
        if (known) uamAllInstances.push(known);
    }

    UamExpandOwningNode(id);

    UamUpdateSelectionButtons();
    UamRenderTree();
    UamRenderInstanceDetail();
}

// ==================== multi-selection (Ctrl/Shift-click) ====================

// Row click dispatchers: plain click = single-select (unchanged UX), Ctrl/Cmd = toggle, Shift =
// range from the anchor. The tree onclicks call these; the node-panel instance table still calls
// UamSelectInstance directly for a plain single-select.
function UamNodeClick(ev, id) {
    if (ev && (ev.ctrlKey || ev.metaKey)) { UamToggleSel('node', id); return; }
    if (ev && ev.shiftKey && uamSelAnchor) { UamRangeSelect('node', id); return; }
    UamSelectNode(id);
}
function UamInstanceClick(ev, id) {
    if (ev && (ev.ctrlKey || ev.metaKey)) { UamToggleSel('instance', id); return; }
    if (ev && ev.shiftKey && uamSelAnchor) { UamRangeSelect('instance', id); return; }
    UamSelectInstance(id);
}

function UamToggleSel(type, id) {
    var set = type === 'node' ? uamSelectedNodeIds : uamSelectedInstanceIds;
    if (set[id]) delete set[id]; else set[id] = true;
    // Anchor follows the toggled row (so a subsequent Shift-click ranges from here), unless it was
    // just deselected and nothing is left to anchor on.
    uamSelAnchor = set[id] ? { type: type, id: id } : uamSelAnchor;
    UamAfterSelectionChange();
}

// Selects every visible row between the anchor and the clicked row, replacing the current
// selection (standard tree range behaviour). Order comes from the rendered DOM, which is flat and
// top-to-bottom, so nodes and instances range together across types.
function UamRangeSelect(type, id) {
    var rows = Array.prototype.slice.call(document.getElementById('UamAssetTree').querySelectorAll('.asset-node, .asset-instance-node'));
    var items = rows.map(function (el) {
        return el.classList.contains('asset-node')
            ? { type: 'node', id: parseInt(el.getAttribute('data-node-id'), 10) }
            : { type: 'instance', id: parseInt(el.getAttribute('data-instance-id'), 10) };
    });
    function indexOf(t, i) { for (var k = 0; k < items.length; k++) if (items[k].type === t && items[k].id === i) return k; return -1; }
    var to = indexOf(type, id);
    var from = indexOf(uamSelAnchor.type, uamSelAnchor.id);
    if (to < 0) return;
    if (from < 0) { UamToggleSel(type, id); return; }
    var lo = Math.min(from, to), hi = Math.max(from, to);
    uamSelectedNodeIds = {}; uamSelectedInstanceIds = {};
    for (var k = lo; k <= hi; k++) {
        if (items[k].type === 'node') uamSelectedNodeIds[items[k].id] = true;
        else uamSelectedInstanceIds[items[k].id] = true;
    }
    // Anchor stays put across a shift-range so the range can be re-dragged from the same origin.
    UamAfterSelectionChange();
}

// Re-render after a multi-select change: collapse to the single-item detail view when exactly one
// remains (so Edit and the resolved detail keep working), show a summary when many, empty when none.
function UamAfterSelectionChange() {
    var nodeIds = Object.keys(uamSelectedNodeIds);
    var instIds = Object.keys(uamSelectedInstanceIds);
    var total = nodeIds.length + instIds.length;
    UamUpdateSelectionButtons();
    UamRenderTree();
    if (total === 0) {
        uamSelectedNodeId = 0; uamSelectedInstanceId = 0; uamSelAnchor = null;
        UamRenderPanel();   // shows the "select a node" placeholder
        return;
    }
    if (total === 1) {
        if (nodeIds.length === 1) { uamSelectedNodeId = parseInt(nodeIds[0], 10); uamSelectedInstanceId = 0; UamRenderPanel(); }
        else { uamSelectedInstanceId = parseInt(instIds[0], 10); UamRenderInstanceDetail(); }
        return;
    }
    UamRenderSelectionSummary(nodeIds.length, instIds.length);
}

// The detail panel while several rows are selected: a headline count and per-type chips, plus the
// bulk Delete (the toolbar button is the same action). Keeps the panel from showing a stale single
// item's detail during a multi-select.
function UamRenderSelectionSummary(nodeCount, instCount) {
    var total = nodeCount + instCount;
    var panel = document.getElementById('UamAssetPanel');
    panel.innerHTML =
        '<div class="asset-panel-title">' + UamEsc(UamT('itemsSelected').replace('{0}', total)) + '</div>'
        + '<p style="margin-top:10px;">'
        + '<span class="udt-chip udt-chip-line">' + nodeCount + ' ' + UamEsc(UamT('nodesWord')) + '</span> '
        + '<span class="udt-chip udt-chip-line">' + instCount + ' ' + UamEsc(UamT('udtInstances')) + '</span></p>'
        + '<button type="button" class="btn uam-btn uam-danger" onclick="UamDeleteSelected()">' + UamEsc(UamT('deleteSelected')) + ' (' + total + ')</button>';
}

// Toolbar Edit/Delete state and the Delete label, driven purely by the selection sets. Edit is
// single-node only (multi-edit is ambiguous); Delete acts on the whole selection.
function UamUpdateSelectionButtons() {
    var editBtn = document.getElementById('UamEditNodeBtn');
    var delBtn = document.getElementById('UamDeleteNodeBtn');
    var copyBtn = document.getElementById('UamCopyNodeBtn');
    if (!editBtn || !delBtn) return;
    var nodeCount = Object.keys(uamSelectedNodeIds).length;
    var total = nodeCount + Object.keys(uamSelectedInstanceIds).length;
    editBtn.disabled = !(nodeCount === 1 && total === 1);
    // Copy takes exactly one node, like Edit: it asks for one new name and one parent.
    if (copyBtn) copyBtn.disabled = !(nodeCount === 1 && total === 1);
    delBtn.disabled = total === 0;
    // Keep the historic single-node label; widen it only for a real multi-selection.
    delBtn.textContent = total > 1 ? UamT('deleteSelected') + ' (' + total + ')' : UamT('deleteNode');
}

// Bulk delete of the whole selection. Instances go FIRST (a node with an attached instance cannot
// be deleted until the instance is gone), then nodes DEEPEST-FIRST (a parent cannot be deleted
// before its children). Both endpoints take an id list and report per-item results, so a partial
// failure (e.g. a node still holding an unselected instance) is surfaced rather than swallowed.
function UamDeleteSelected() {
    var nodeIds = Object.keys(uamSelectedNodeIds).map(Number);
    var instIds = Object.keys(uamSelectedInstanceIds).map(Number);
    var total = nodeIds.length + instIds.length;
    if (total === 0) return;
    if (!confirm(UamT('deleteSelectedConfirm').replace('{0}', total))) return;

    nodeIds.sort(function (a, b) { return UamNodeDepth(b) - UamNodeDepth(a); });   // children before parents

    var summary = { deleted: 0, failed: 0, errorData: [] };
    function absorb(data) {
        if (!data) { summary.failed++; return; }
        if (typeof data.deleted === 'number') summary.deleted += data.deleted;
        else if (data.success) summary.deleted += 1;
        if (typeof data.failed === 'number') summary.failed += data.failed;
        else if (!data.success) summary.failed += 1;
        if (!data.success) summary.errorData.push(data);
    }

    var chain = instIds.length
        ? UamApi('/API/Config/UdtInstances/Delete', 'POST', instIds).then(function (d) { absorb(d); })
        : Promise.resolve();

    chain.then(function () {
        if (!nodeIds.length) return;
        return UamApi('/API/Config/Assets/Delete', 'POST', nodeIds).then(function (d) { absorb(d); });
    }).then(function () {
        uamSelectedNodeIds = {}; uamSelectedInstanceIds = {}; uamSelAnchor = null;
        uamSelectedNodeId = 0; uamSelectedInstanceId = 0;
        UamLoadTree(false);
        if (summary.failed > 0) {
            // Show the server's own per-item reasons (e.g. "still has N attached UDT instance(s)");
            // the tree has already reloaded to reflect whatever did delete.
            UamShowErrors({ results: summary.errorData });
        }
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// Depth of a node in the tree (root children = 0), walking parentId up. Used only to order a bulk
// node delete leaf-first; the guard caps a malformed cycle rather than spinning.
function UamNodeDepth(id) {
    var depth = 0, cur = id, guard = 0;
    while (guard++ < 1000) {
        var node = uamNodes.filter(function (n) { return UamField(n, 'id') === cur; })[0];
        if (!node) break;
        cur = UamField(node, 'parentId');
        if (!cur) break;
        depth++;
    }
    return depth;
}

// Expands the node that OWNS this instance, so selecting one always shows it highlighted in the
// tree instead of leaving the selection invisible under a collapsed twisty.
//
// The owner is the node whose path equals the instance's asset EXACTLY - the same rule
// UamNodeInstances uses to hang instances off a node. The node panel's table is deliberately
// broader (it also lists instances of descendant nodes, path + '/'), so the row clicked under
// "Process" can belong to a node further down; expanding the clicked node would then expand the
// wrong one. Only the instance list is collapsible - child NODES are always rendered - so there
// are no ancestors to expand as well.
function UamExpandOwningNode(instanceId) {
    var instance = uamAllInstances.filter(function (i) { return UamField(i, 'id') === instanceId; })[0];
    if (!instance) return;

    var assetPath = UamField(instance, 'asset') || '';
    if (assetPath === '') return;   // unattached instance: no node to expand

    var owner = uamNodes.filter(function (n) { return UamField(n, 'path') === assetPath; })[0];
    if (owner) uamExpandedNodes[UamField(owner, 'id')] = true;
}

// Mirrors UdtService.Substitute: single pass, unknown tokens stay literal.
function UamSubstitute(text, tokens) {
    return String(text == null ? '' : text).replace(/\{([^{}]+)\}/g, function (match, name) {
        return tokens[name] !== undefined ? tokens[name] : match;
    });
}

// Mirrors UdtService.OpcUaTypeMap so the instance detail shows the type materialization
// will actually write for OPC UA targets (canonical REAL becomes Float, etc.).
var uamOpcUaTypeMap = {
    BOOL: 'Boolean', BYTE: 'Byte', INT: 'Int16', UINT: 'UInt16', WORD: 'UInt16',
    DINT: 'Int32', UDINT: 'UInt32', DWORD: 'UInt32', LINT: 'Int64', ULINT: 'UInt64',
    REAL: 'Float', LREAL: 'Double', STRING: 'String'
};

// ==================== devices (the model: a device is a PARAMETER) ====================

// An instance no longer has a device. Its definition declares Device-typed parameters, the
// instance supplies a device NAME for each, and every variable member points at one of them
// through its DeviceName. So "which device is this instance on" is a question about parameter
// values, and the answer can legitimately be several devices at once.

function UamDeviceParameters(definition) {
    // Effective parameters when the server sent them (composition: inherited Device parameters
    // count too); a plain definition's effective list equals its own.
    var parameters = (definition && definition.effectiveParameters && definition.effectiveParameters.length)
        ? definition.effectiveParameters
        : ((definition && definition.parameters) || []);
    return parameters.filter(function (p) { return p.type === 'Device'; });
}

// ==================== composition mirrors (client side of ResolveEffective/BuildSlotTokens) ====

/// The definition's parameter list an instance supplies values for - effective when available.
function UamEffectiveParameters(definition) {
    return (definition && definition.effectiveParameters && definition.effectiveParameters.length)
        ? definition.effectiveParameters
        : ((definition && definition.parameters) || []);
}

/// The slot list of a definition INCLUDING its base chain's slots, in server context order
/// (base first, then own). Depth-capped against stored cycles.
function UamEffectiveSlots(definition, depth) {
    if (!definition || (depth || 0) > 8) return [];
    var result = [];
    if (definition.baseDefinition) {
        var base = uamDefinitions.filter(function (x) { return x.name === definition.baseDefinition; })[0];
        result = result.concat(UamEffectiveSlots(base, (depth || 0) + 1));
    }
    return result.concat(definition.slots || []);
}

/// Client mirror of UdtService.BuildSlotTokens: token map per slot path, derived from the outer
/// context's tokens through the slot's parameter mapping (an omitted inner parameter keeps its
/// own default). Returns { '': {tokens, included}, 'MotorA': {tokens, included}, ... } so the
/// resolved detail shows exactly what a push would produce, per slot.
function UamSlotTokenMap(definition, rootTokens) {
    var map = { '': { tokens: rootTokens, included: true } };

    function walk(def, path, outer, outerIncluded, depth) {
        if (!def || depth > 8) return;
        UamEffectiveSlots(def, depth).forEach(function (slot) {
            var inner = uamDefinitions.filter(function (x) { return x.name === slot.definition; })[0];
            var slotPath = path ? path + '.' + slot.name : slot.name;
            var included = outerIncluded && UamMemberMaterializes({ includeWhen: slot.includeWhen || '' }, outer);
            var mapping = slot.parameterMapping || {};
            var tokens = {};
            UamEffectiveParameters(inner).forEach(function (p) {
                var expression = mapping[p.name];
                tokens[p.name] = (expression !== undefined && expression !== '')
                    ? UamComputeTokens(UamSubstitute(expression, outer))
                    : UamComputeTokens(p.defaultValue || '');
            });
            tokens.Instance = outer.Instance || '';
            tokens.Asset = outer.Asset || '';
            tokens.Slot = slot.name || '';
            tokens.SlotPath = slotPath;
            map[slotPath] = { tokens: tokens, included: included };
            walk(inner, slotPath, tokens, included, depth + 1);
        });
    }
    walk(definition, '', rootTokens, true, 0);

    return map;
}

/// The render list of one effective member kind: [{ m (member DTO + __memberId/__slotPath),
/// tokens, slotPath, source }], slot-excluded contexts dropped. Falls back to the authored
/// members for a definition the server sent no effective projection for.
function UamEffectiveRenderList(definition, kind, tokenMap) {
    var effective = definition && definition['effective' + kind];
    if (effective && effective.length) {
        return effective.map(function (e) {
            var m = Object.assign({}, e.member || {});
            m.__memberId = e.memberId || 0;
            m.__slotPath = e.slotPath || '';
            var context = tokenMap[m.__slotPath];
            return context && context.included ? { m: m, tokens: context.tokens, slotPath: m.__slotPath, source: e.sourceDefinition || '' } : null;
        }).filter(function (x) { return !!x; });
    }
    var own = (definition && definition[kind.charAt(0).toLowerCase() + kind.slice(1)]) || [];
    return own.map(function (m) {
        var copy = Object.assign({}, m);
        copy.__slotPath = '';
        return { m: copy, tokens: tokenMap[''].tokens, slotPath: '', source: '' };
    });
}

/// Slot badge shown on resolved rows of a slot expansion.
function UamSlotBadge(slotPath) {
    return slotPath ? '<span class="udt-chip udt-chip-line" title="' + UamEscAttr(UamT('slot')) + '">' + UamEsc(slotPath) + '</span> ' : '';
}

// Explicit value, else the definition default - the same precedence materialization uses.
function UamInstanceDeviceValues(definition, instance) {
    var values = UamField(instance, 'parameterValues') || {};
    var result = {};
    UamDeviceParameters(definition).forEach(function (p) {
        result[p.name] = (values[p.name] !== undefined && values[p.name] !== '') ? values[p.name] : (p.defaultValue || '');
    });
    return result;
}

// Every distinct device an instance is configured to use, for the one-line summaries.
function UamInstanceDevices(definition, instance) {
    var values = UamInstanceDeviceValues(definition, instance);
    var seen = [];
    Object.keys(values).forEach(function (key) {
        var value = values[key];
        if (value && seen.indexOf(value) < 0) seen.push(value);
    });
    return seen;
}

function UamInstanceDeviceLabel(definition, instance) {
    return UamInstanceDevices(definition, instance).join(', ');
}

function UamMappedType(deviceType, type) {
    if (deviceType !== 'OpcUa') return type || '';
    return uamOpcUaTypeMap[String(type || '').toUpperCase()] || type || '';
}

// Collapse state of the detail sections; sections start expanded and the choice sticks
// while switching between instances.
var uamDetailCollapsed = {};

function UamToggleDetailSection(key) {
    uamDetailCollapsed[key] = !uamDetailCollapsed[key];
    var header = document.getElementById('UamDetailHead-' + key);
    var body = document.getElementById('UamDetailBody-' + key);
    if (!header || !body) return;
    header.classList.toggle('open', !uamDetailCollapsed[key]);
    body.style.display = uamDetailCollapsed[key] ? 'none' : '';
}

// Export/Import for one instance's materialized rows. Scoped to THIS instance, unlike the
// device page's export which covers the whole device - the useful unit here is one pump.
// Import is update-only: which rows an instance has is the definition's business, so a file
// can change values but never add or remove one. stopPropagation because the buttons sit in
// the section header, which toggles the section.
function UamRowIoButtons(kind) {
    return '<span class="uam-rowio">'
        + '<button type="button" class="btn uam-btn" onclick="event.stopPropagation();UamExportInstanceRows(&quot;' + kind + '&quot;)">' + UamEsc(UamT('export')) + '</button>'
        + '<button type="button" class="btn uam-btn" onclick="event.stopPropagation();UamImportInstanceRows(&quot;' + kind + '&quot;)">' + UamEsc(UamT('import')) + '</button>'
        + '</span>';
}

// One download helper for every export in the modal (instance rows, copy plan, type export,
// per-tab export). Appending the link keeps Firefox happy; revoking after the click frees the URL.
function UamDownload(fileName, mime, content) {
    var link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: mime }));
    link.download = fileName;
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(link.href);
}

function UamExportInstanceRows(kind) {
    var instance = uamAllInstances.filter(function (i) { return UamField(i, 'id') === uamSelectedInstanceId; })[0];
    if (!instance) return;
    var id = UamField(instance, 'id');
    var url = kind === 'Alarm' ? '/API/Config/Alarms'
        : kind === 'Event' ? '/API/Config/Events'
        : '/API/Config/UdtInstances/Rows?instanceId=' + id;

    UamApi(url).then(function (rows) {
        // The rows endpoint returns {protocol, device, row} across every table, because a member
        // carries its own device and one instance can materialize into several of them.
        if (kind !== 'Alarm' && kind !== 'Event') rows = (rows || []).map(function (r) { return r.row || r.Row; });
        // The variable GET filters server-side; Alarms and Events have no such filter, so narrow here.
        var mine = (rows || []).filter(function (r) { return r.udtInstanceId === id; });
        if (!mine.length) { UamError(UamT('noResults')); return; }

        var delimiter = UamDelimiter();
        // The header is the UNION of every row's keys: an instance's variables can span protocol
        // tables (the device is per member), so taking the first row's keys silently dropped the
        // other protocols' columns from the file.
        var fields = [];
        mine.forEach(function (r) {
            Object.keys(r).forEach(function (k) { if (fields.indexOf(k) < 0) fields.push(k); });
        });
        var lines = [fields.join(delimiter)];
        mine.forEach(function (r) {
            lines.push(fields.map(function (f) { return UamCsvEscape(r[f], delimiter); }).join(delimiter));
        });
        UamDownload(UamField(instance, 'name') + '_' + kind + 's.csv', 'text/csv;charset=utf-8', lines.join(String.fromCharCode(13, 10)));
    }).catch(function () { UamError(); });
}

function UamImportInstanceRows(kind) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            var rows;
            try {
                rows = file.name.toLowerCase().slice(-5) === '.json'
                    ? JSON.parse(reader.result)
                    : UamParseCsv(reader.result);
            } catch (e) { UamError(String(e.message || e)); return; }

            UamPageApi('ImportUdtRows', {
                instanceId: uamSelectedInstanceId, memberKind: kind, rows: rows
            }).then(function (result) {
                if (!result || result.error) { UamShowErrors((result)); return; }
                // One plain line per fact; UamError escapes each and joins them.
                var lines = [UamT('imported') + ': ' + result.updated];
                if (result.ignoredRows > 0) {
                    lines.push(String(UamT('importIgnoredOwnedFields'))
                        .replace('{0}', result.ignoredRows)
                        .replace('{1}', (result.ignoredFields || []).join(', ')));
                }
                if (result.skipped > 0) lines.push(UamT('rowsSkipped') + ': ' + result.skipped);
                UamError(lines);
                uamInstanceRows = { instanceId: 0, state: 'none', byMember: {} };
                UamRenderInstanceDetail();
            }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
        };
        reader.readAsText(file);
    };
    input.click();
}

function UamDetailSection(key, title, count, bodyHtml, rowKind) {
    var open = !uamDetailCollapsed[key];
    return '<div class="asset-panel-section' + (open ? ' open' : '') + '" id="UamDetailHead-' + key + '" onclick="UamToggleDetailSection(\'' + key + '\')">'
        + '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'
        + UamEsc(title)
        + '<span class="udt-chip udt-chip-line">' + count + '</span>'
        + (rowKind ? UamRowIoButtons(rowKind) : '')
        + '</div>'
        + '<div id="UamDetailBody-' + key + '"' + (open ? '' : ' style="display:none;"') + '>' + bodyHtml + '</div>';
}

// Client mirror of UdtService.EvaluateComputeTokens for the resolved detail view only: same
// {= ... } grammar, same digits-and-operators guard, evaluated after UamSubstitute. Anything
// that does not reduce to arithmetic is left in place, exactly like the server pass.
function UamComputeTokens(text) {
    return String(text || '').replace(/\{=([^{}]*)\}/g, function (match, expr) {
        if (!expr.trim() || !/^[0-9+\-*/(). \t]+$/.test(expr)) return match;
        try {
            var v = Function('"use strict"; return (' + expr + ');')();
            return (typeof v === 'number' && isFinite(v)) ? String(v) : match;
        } catch (e) { return match; }
    });
}

// Resolved array expansion of a member for THIS instance's tokens. Null = scalar. count is
// null when the size does not resolve to a number (the push would error; the raw text is shown).
function UamResolveArray(m, tokens) {
    var raw = String(UamField(m, 'arrayCount') || '').trim();
    if (!raw) return null;
    var count = parseInt(UamComputeTokens(UamSubstitute(raw, tokens)), 10);
    var start = parseInt(UamComputeTokens(UamSubstitute(String(UamField(m, 'arrayStart') || '').trim() || '0', tokens)), 10);
    if (isNaN(start)) start = 0;
    return { count: isNaN(count) ? null : count, start: start, raw: raw };
}

// Client mirror of UdtService.ResolveMemberIncluded: does this member materialize anything for
// THIS instance? Two ways it can materialize nothing - IncludeWhen resolving false, or an array
// size resolving to 0 - and both are shown the same way here, by leaving the member out of the
// resolved detail entirely, which is exactly what a push would do.
//
// A value that resolves to something OTHER than true/false/1/0 is left INCLUDED on purpose: the
// push reports it as an error (UdtIncludeWhenInvalid) and hiding the member here would hide the
// row the user has to fix. Empty (the default) always includes.
function UamMemberMaterializes(m, tokens) {
    var raw = String(UamField(m, 'includeWhen') || '').trim();
    if (raw) {
        var resolved = UamComputeTokens(UamSubstitute(raw, tokens)).trim().toLowerCase();
        if (resolved === 'false' || resolved === '0') return false;
    }
    var arr = UamResolveArray(m, tokens);
    return !(arr && arr.count === 0);
}

// Display name/condition of an array member: {Index} becomes the resolved index range
// ("0…5"), so one row reads as the whole expansion.
function UamArrayRangeText(template, tokens, arr) {
    var resolved = UamSubstitute(template, tokens);
    if (!arr) return UamComputeTokens(resolved);
    var range = arr.count === null ? '{Index}'
        : arr.count === 1 ? String(arr.start)
        : arr.start + '…' + (arr.start + arr.count - 1);
    return resolved.split('{Index}').join(range);
}

function UamArrayCountChip(arr) {
    if (!arr) return '';
    var label = arr.count === null ? arr.raw : arr.count;
    return '<span class="udt-chip udt-chip-line" title="' + UamEscAttr(UamT('arrayMember')) + '">&#215;&nbsp;' + UamEsc(label) + '</span> ';
}

// Section counts report materialized rows, not members: a 6-element array is 6 variables.
function UamResolvedRowCount(members, tokens) {
    return members.reduce(function (total, m) {
        var arr = UamResolveArray(m, tokens);
        return total + (arr && arr.count !== null ? arr.count : 1);
    }, 0);
}

function UamSeverityChip(severity) {
    var cls = severity >= 3 ? 'udt-chip-crit' : severity === 2 ? 'udt-chip-warn' : 'udt-chip-line';
    return '<span class="udt-chip ' + cls + '">' + UamEsc(severity) + '</span>';
}

// Instance detail in the right panel: the definition members with every token RESOLVED for
// this instance (the built-ins + parameter values over defaults), i.e. what materialization
// produces - not the {Token} template forms.
function UamRenderInstanceDetail() {
    var panel = document.getElementById('UamAssetPanel');
    var instance = uamAllInstances.filter(function (i) { return UamField(i, 'id') === uamSelectedInstanceId; })[0];
    if (!instance) { UamRenderPanel(); return; }
    var definition = uamDefinitions.filter(function (d) { return d.name === UamField(instance, 'definition'); })[0];
    // No single device to name: an instance uses as many as its Device parameters resolve to.
    // Header label only - it is deliberately NOT a token, see below.
    var devices = UamInstanceDevices(definition, instance);
    var deviceLabel = devices.join(', ');
    var values = UamField(instance, 'parameterValues') || {};

    // Kicks off once per instance and re-renders when it lands, so the drawer's editable
    // RecipeTargets field shows the row's real value rather than the definition's seed.
    UamLoadInstanceRows(instance);

    // Mirrors UdtService.BuildTokenMap: {Instance} is the LEAF, not the dotted identity, so this
    // panel shows the names the push actually produces. {Device} is NOT seeded here - it is not a
    // built-in on the server either, so inside a UDT it only resolves when the type declares a
    // parameter literally named Device. Seeding it made the panel display resolved names for a
    // member the push then refused with "Unresolved token '{Device}'", and with two or more
    // Device-typed parameters it showed a name starting with a bare dot.
    var tokens = {
        Instance: UamLeafName(UamField(instance, 'name')),
        Asset: UamField(instance, 'asset') || ''
    };
    // EFFECTIVE parameters (composition): inherited base parameters take instance values exactly
    // like own ones, so they are listed and resolved here identically.
    var effectiveParameters = UamEffectiveParameters(definition);
    var paramRows = '';
    effectiveParameters.forEach(function (p) {
        var explicit = values[p.name] !== undefined && values[p.name] !== '';
        // Compute-expression values resolve to their result, mirroring BuildTokenMap: the
        // detail answers "what did this instance materialize", not "what text is stored".
        var value = UamComputeTokens(explicit ? values[p.name] : (p.defaultValue || ''));
        tokens[p.name] = value;
        paramRows += '<tr><td><b>' + UamEsc(p.label || p.name) + '</b>'
            + (p.sourceDefinition && definition && p.sourceDefinition !== definition.name ? ' <span class="udt-chip udt-chip-line">' + UamEsc(p.sourceDefinition) + '</span>' : '') + '</td>'
            + '<td class="uam-code">' + UamEsc(value) + '</td>'
            + '<td>' + (explicit ? '<span class="udt-chip udt-chip-ok">' + UamEsc(UamT('value')) + '</span>' : '<span class="udt-chip udt-chip-line">' + UamEsc(UamT('defaultValue')) + '</span>') + '</td></tr>';
    });

    // Own/inherited members substitute {Slot}/{SlotPath} empty; slot expansions get their own
    // derived maps - the client mirror of BuildPlanContexts.
    tokens.Slot = '';
    tokens.SlotPath = '';
    var slotTokenMap = UamSlotTokenMap(definition, tokens);

    var status = UamStateChip(instance);

    // Placing a symbol instantiates the definition's group symbol master, so with no
    // GroupSymbol bound there is nothing to place: offer the button disabled (with the reason)
    // rather than letting the click fail server-side in CreateUdtSymbol.
    var canPlace = UamInstanceHasSymbol(instance);

    var html =
        // Titled by the leaf, with the full dotted identity beside it: that identity is what a
        // symbol binding and an export name, so hiding it would make those unfindable from here.
        '<div class="asset-panel-title">' + UamEsc(UamInstanceLabel(instance)) + ' ' + status + '</div>'
        + '<div class="asset-panel-path">'
        + '<span class="uam-code" title="' + UamEscAttr(UamT('instanceNameHint')) + '">' + UamEsc(UamField(instance, 'name')) + '</span> &middot; '
        + UamEsc(UamField(instance, 'definition'))
        + (deviceLabel ? ' &middot; ' + UamEsc(deviceLabel) : '')
        + (UamInstanceDevices(definition, instance).length > 1 ? ' <span class="udt-chip udt-chip-line" title="' + UamEscAttr(UamT('instanceSpansDevices')) + '">' + UamInstanceDevices(definition, instance).length + '</span>' : '')
        + (UamField(instance, 'asset') ? ' &middot; ' + UamEsc(UamField(instance, 'asset')) : '') + '</div>'
        + '<p style="margin-top:8px;">'
        + '<button type="button" class="btn uam-btn" onclick="UamEditInstanceFromTree(' + uamSelectedInstanceId + ')">' + UamEsc(UamT('edit')) + '</button> '
        + '<button type="button" class="btn uam-btn" onclick="UamDuplicateInstance(' + uamSelectedInstanceId + ')">' + UamEsc(UamT('duplicate')) + '</button> '
        + '<button type="button" class="btn uam-btn"' + (canPlace ? '' : ' disabled title="' + UamEsc(UamT('noGroupSymbolBound')) + '"')
        + ' onclick="UamEnterDropMode(\'' + UamEsc(UamField(instance, 'name')).replace(/'/g, "\\'") + '\')">' + UamEsc(UamT('placeOnPage')) + '</button>'
        + (definition ? ' <button type="button" class="btn uam-btn" onclick="UamOpenDefinitionEditor(' + definition.id + ')">' + UamEsc(UamT('edit')) + ' ' + UamEsc(definition.name) + '</button>' : '')
        // Push THIS instance only. Goes through the same preview + mandatory reason as a bulk push -
        // a single push is still a config write and still lands in the audit trail.
        + ' <button type="button" class="btn uam-btn" onclick="UamOpenPushPreview([' + uamSelectedInstanceId + '])">' + UamEsc(UamT('push')) + '</button>'
        // Same two actions the instances list offers, so the tree is not a read-mostly dead end
        // that sends you to the other view to finish a job. Both confirm first and both are
        // separated from the actions above by a divider - Detach is one-way and Delete removes the
        // materialized rows, so neither should sit flush against Edit.
        + ' <span class="uam-action-sep"></span>'
        + ' <button type="button" class="btn uam-btn" onclick="UamDetachInstance(' + uamSelectedInstanceId + ')" title="' + UamEsc(UamT('detachInfo')) + '">' + UamEsc(UamT('detach')) + '</button>'
        + ' <button type="button" class="btn uam-btn uam-danger" onclick="UamDeleteInstance(' + uamSelectedInstanceId + ')">' + UamEsc(UamT('delete')) + '</button>'
        + '</p>';

    if (paramRows) {
        html += UamDetailSection('params', UamT('parameters'), effectiveParameters.length,
            '<table class="udt-members udt-detail-table"><thead><tr><th>' + UamEsc(UamT('name')) + '</th><th>' + UamEsc(UamT('value')) + '</th><th></th></tr></thead><tbody>' + paramRows + '</tbody></table>');
    }

    if (definition) {
        // EFFECTIVE members (composition resolved): the render list pairs every member with its
        // own context's token map, so a slot's rows resolve through the slot mapping. Enable
        // false still materializes a (disabled) row, so it is a display choice here; a member
        // this instance EXCLUDES materializes nothing at all, so leaving it out is what the push
        // actually does.
        var vars = UamEffectiveRenderList(definition, 'VariableMembers', slotTokenMap)
            .filter(function (x) { return x.m.enable !== false && UamMemberMaterializes(x.m, x.tokens); });
        if (vars.length) {
            // No Type/Address columns: those fields died with the per-protocol union (they were
            // still read from m.type/m.address here, so both columns rendered permanently empty
            // and pushed the rest of the row out of line). The instance's own protocol group is
            // in the drawer below, resolved. Writeable joins it there, matching the editor - the
            // row keeps only Historian, which is the flag worth scanning a list for.
            html += UamDetailSection('vars', UamT('variables'), vars.reduce(function (t, x) { var arr = UamResolveArray(x.m, x.tokens); return t + (arr && arr.count !== null ? arr.count : 1); }, 0),
                '<table class="udt-members udt-detail-table"><thead><tr><th>' + UamEsc(UamT('name')) + '</th><th>' + UamEsc(UamT('units')) + '</th><th></th></tr></thead><tbody>'
                + vars.map(function (x, i) {
                    var m = x.m;
                    // An array member reads as one row for the whole expansion: {Index} shown as
                    // the resolved range and an element-count chip beside the flags.
                    var arr = UamResolveArray(m, x.tokens);
                    var flags = UamSlotBadge(x.slotPath) + UamArrayCountChip(arr) + (m.historian ? '<span class="udt-chip udt-chip-ok">' + UamEsc(UamT('historian')) + '</span>' : '');
                    return '<tr><td class="uam-code uam-member-namecell">'
                        + '<span class="asset-twisty' + (uamExpandedInstanceVars[i] ? ' open' : '') + '" onclick="UamToggleInstanceVarDetail(' + i + ')">'
                        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>'
                        + UamEsc(UamArrayRangeText(m.name, x.tokens, arr)) + '</td>'
                        + '<td>' + UamEsc(m.units || '') + '</td>'
                        + '<td>' + flags + '</td></tr>'
                        + UamInstanceVarDetailRow(m, i, x.tokens);
                }).join('') + '</tbody></table>', 'Variable');
        }
        var alarms = UamEffectiveRenderList(definition, 'AlarmMembers', slotTokenMap)
            .filter(function (x) { return x.m.enable !== false && UamMemberMaterializes(x.m, x.tokens); });
        if (alarms.length) {
            html += UamDetailSection('alarms', UamT('alarms'), alarms.reduce(function (t, x) { var arr = UamResolveArray(x.m, x.tokens); return t + (arr && arr.count !== null ? arr.count : 1); }, 0),
                '<table class="udt-members udt-detail-table"><thead><tr><th>' + UamEsc(UamT('condition')) + '</th><th>' + UamEsc(UamT('message')) + '</th><th>' + UamEsc(UamT('severity')) + '</th></tr></thead><tbody>'
                + alarms.map(function (x) {
                    var arr = UamResolveArray(x.m, x.tokens);
                    return '<tr><td class="uam-code">' + UamEsc(UamArrayRangeText(x.m.condition, x.tokens, arr)) + '</td><td>' + UamEsc(UamArrayRangeText(x.m.message, x.tokens, arr)) + '</td><td>' + UamSlotBadge(x.slotPath) + UamArrayCountChip(arr) + UamSeverityChip(x.m.severity) + '</td></tr>';
                }).join('') + '</tbody></table>', 'Alarm');
        }
        var events = UamEffectiveRenderList(definition, 'EventMembers', slotTokenMap)
            .filter(function (x) { return x.m.enable !== false && UamMemberMaterializes(x.m, x.tokens); });
        if (events.length) {
            // Trailing empty column so this table shares the same three-column rhythm as the
            // others; the sections read as one panel instead of three differently-ruled grids.
            html += UamDetailSection('events', UamT('events'), events.reduce(function (t, x) { var arr = UamResolveArray(x.m, x.tokens); return t + (arr && arr.count !== null ? arr.count : 1); }, 0),
                '<table class="udt-members udt-detail-table"><thead><tr><th>' + UamEsc(UamT('condition')) + '</th><th>' + UamEsc(UamT('message')) + '</th><th></th></tr></thead><tbody>'
                + events.map(function (x) {
                    var arr = UamResolveArray(x.m, x.tokens);
                    return '<tr><td class="uam-code">' + UamEsc(UamArrayRangeText(x.m.condition, x.tokens, arr)) + '</td><td>' + UamEsc(UamArrayRangeText(x.m.message, x.tokens, arr)) + '</td><td>' + UamSlotBadge(x.slotPath) + UamArrayCountChip(arr) + '</td></tr>';
                }).join('') + '</tbody></table>', 'Event');
        }
    }

    // Replacing the panel's content resets whatever is scrolling it, which would throw the user
    // back to the top every time they overrode or reverted a field far down a long variable list.
    // Which element actually scrolls depends on the layout - the panel itself when it overflows,
    // its split container otherwise - so capture the whole ancestor chain rather than guessing.
    // The expanded-drawer state already survives via uamExpandedInstanceVars.
    var scroll = UamCaptureScroll(panel);
    panel.innerHTML = html;
    UamRestoreScroll(scroll);
}

function UamCaptureScroll(el) {
    var saved = [];
    for (var n = el; n && n !== document.body; n = n.parentElement) {
        if (n.scrollTop > 0) saved.push({ el: n, top: n.scrollTop });
    }
    return saved;
}

// Restored twice: once synchronously, and once after layout, because a taller re-render can
// clamp the assignment before the new content has been measured.
function UamRestoreScroll(saved) {
    if (!saved.length) return;
    var apply = function () { saved.forEach(function (s) { s.el.scrollTop = s.top; }); };
    apply();
    requestAnimationFrame(apply);
}

// ==================== instance detail: resolved member drawer ====================

// The same drawer as the definition editor, read-only and resolved: this panel answers "what
// did this instance actually materialize", so tokens are substituted and empty protocol extras
// report the default the row was given rather than showing blank.
var uamExpandedInstanceVars = {};

function UamToggleInstanceVarDetail(index) {
    if (uamExpandedInstanceVars[index]) delete uamExpandedInstanceVars[index];
    else uamExpandedInstanceVars[index] = true;
    UamRenderInstanceDetail();
}

function UamReadOnlyField(label, value, options) {
    options = options || {};
    var text = value === '' || value === undefined || value === null ? '' : String(value);
    return '<div class="uam-detail-field"><span>' + UamEsc(label)
        + (options.tags || []).map(function (p) { return '<span class="udt-chip udt-chip-line uam-extra-tag">' + UamEsc(p) + '</span>'; }).join('')
        + '</span>'
        + '<div class="uam-detail-value' + (options.code ? ' uam-code' : '') + (text ? '' : ' uam-detail-empty') + '">'
        + (text ? UamEsc(text) : '&mdash;')
        + (options.isDefault ? ' <span class="udt-chip udt-chip-line">' + UamEsc(UamT('defaultValue')) + '</span>' : '')
        + '</div></div>';
}

function UamBoolText(value) {
    return value ? UamT('enable') : '';
}

// ---- Materialized rows of the selected instance -------------------------------------------
// The panel above renders the DEFINITION resolved through tokens, which is the right source for
// everything the definition owns. RecipeTargets is not owned by it: it is seeded at creation and
// then belongs to the row, so the only place its current value exists is the row itself. These
// are fetched per instance (the GETs take ?udtInstanceId=, so this is not a whole-table load) and
// indexed by UdtMemberId, which is why that column is now on the read DTOs - matching on resolved
// name would break on every array member and every rename.
// Member rows carry UdtMemberId; the member objects in a definition do not carry an id at all
// (that DTO is the write contract). The definition GET returns VariableMemberIds in the same order,
// so stamp it onto each member once at load and everything downstream can key by it.
function UamStampMemberIds(defs) {
    (defs || []).forEach(function (d) {
        var ids = d.variableMemberIds || [];
        (d.variableMembers || []).forEach(function (m, idx) { m.__memberId = ids[idx] || 0; });
    });
    return defs;
}

var uamInstanceRows = { instanceId: 0, state: 'none', byMember: {} };

function UamLoadInstanceRows(instance, force) {
    var id = UamField(instance, 'id');
    if (!force && uamInstanceRows.instanceId === id && uamInstanceRows.state !== 'none') return;

    // A forced refresh keeps the rows already on screen until the new ones arrive. Dropping
    // them first would collapse the panel to nothing for one frame, and the browser would
    // clamp the restored scroll position to that empty height.
    if (!force) uamInstanceRows = { instanceId: id, state: 'loading', byMember: {} };
    UamApi('/API/Config/UdtInstances/Rows?instanceId=' + id).then(function (entries) {
        // A slower earlier request must not overwrite a newer selection's rows.
        if (uamSelectedInstanceId !== id) return;
        var byMember = {};
        (entries || []).forEach(function (entry) {
            // Each row arrives tagged with the protocol and device it actually materialized onto -
            // members of one instance can differ - and the drawer renders per row from that.
            var r = entry.row || entry.Row;
            if (!r) return;
            r.uamProtocol = entry.protocol || entry.Protocol || '';
            r.uamDevice = entry.device || entry.Device || '';
            var key = r.udtMemberId || 0;
            (byMember[key] = byMember[key] || []).push(r);
        });
        uamInstanceRows = { instanceId: id, state: 'ready', byMember: byMember };
        UamRenderInstanceDetail();
    }).catch(function () {
        if (uamSelectedInstanceId === id) uamInstanceRows = { instanceId: id, state: 'error', byMember: {} };
    });
}

// Recipe Targets on the instance: editable, unlike everything else in this drawer. An array
// member owns several rows and the drawer shows one example, so the edit applies to EVERY element
// row of the member - editing only element 0 through a panel that says "first element" would be a
// trap. If the elements currently disagree the field shows empty with a mixed-values placeholder,
// so saving is an explicit choice to make them agree rather than a silent flattening.
// ---- Per-row fields of a materialized variable ---------------------------------------------
// Everything above in the drawer is the DEFINITION resolved through tokens. This group is the
// opposite: the fields the definition does NOT own, read from the rows themselves and editable
// here. The set is not hard-coded - it is the row's own keys minus what the server reports as
// managed for THIS member, so it is automatically right per protocol, and a protocol extra the
// member leaves empty appears here while a templated one does not. Keeping it as its own group
// rather than mixing editable fields into the read-only ones makes "editable means per-row" a
// rule the user can learn instead of a list to memorise.
var uamManagedFields = {};   // memberId -> { state, fields[] }

// Row keys that are identity/provenance rather than configuration.
var uamRowMeta = ['id', 'udtInstanceId', 'udtMemberId', 'arrayParentId', 'elementIndex', 'deviceName', 'mqttClientName',
    // The release list itself is not a setting: it is GET-only on the row contract and is
    // changed through the Override action, never by typing into the drawer.
    'releasedFields',
    // Composition and schema v68 added three more GET-only keys. The write DTOs have no such
    // properties, so offering them for editing meant the drawer drew a text box / checkbox
    // labelled with the raw key, reported success on change and silently reverted on the next
    // render: udtMemberSlot is the slot path of a containment expansion, storedName is the raw
    // DB form of the name the definition owns, and valid is a runtime verdict.
    'udtMemberSlot', 'storedName', 'valid'];

// Every config DTO exposes a field as its property name with a lowercase first letter.
function UamRowKeyFor(field) {
    return field.charAt(0).toLowerCase() + field.slice(1);
}

function UamLoadManagedFields(memberId, force) {
    if (!memberId) return;
    if (uamManagedFields[memberId] && !force) return;
    // A forced refresh keeps the previous answer on screen until the new one lands. Clearing it
    // would make the next render draw a drawer with no fields, collapsing the panel - and the
    // browser clamps the restored scroll position to that momentary height.
    if (!uamManagedFields[memberId]) uamManagedFields[memberId] = { state: 'loading', fields: [] };
    // rowId makes the answer row-accurate: the definition's set minus what this row has
    // released, plus the released list itself so the drawer can tell an override from a field
    // the definition never owned.
    var sample = (uamInstanceRows.byMember[memberId] || [])[0];
    UamApi('/API/Config/UdtInstances/ManagedFields?instanceId=' + uamSelectedInstanceId + '&memberId=' + memberId
        + (sample ? '&rowId=' + sample.id : ''))
        .then(function (data) {
            uamManagedFields[memberId] = { state: 'ready', fields: (data && data.fields) || [], released: (data && data.released) || [] };
            UamRenderInstanceDetail();
        })
        .catch(function () { uamManagedFields[memberId] = { state: 'error', fields: [] }; });
}

// Field layout of the instance drawer, mirroring the Edit Variable dialog's tabs so the same
// setting is found in the same place on both screens. Anything the row carries that is not
// listed here still appears, appended to the protocol group - a new column can never go
// invisible just because this table was not updated.
var uamInstanceGroups = [
    { title: 'general',   keys: ['enable', 'asset', 'description', 'userGroups', 'trendGroups', 'recipeTargets', 'recipeParameterName', 'arrayCount'] },
    { title: 'scaling',   keys: ['units', 'converter', 'minRaw', 'maxRaw', 'minScaled', 'maxScaled'] },
    { title: 'historian', keys: ['historian', 'deadband', 'minimumTime', 'sampleGroup'] },
    { title: 'gateway',   keys: ['opcUa', 'writeable', 'modbusAddress'] },
    { title: 'kafka',     keys: ['kafkaDevice', 'kafkaProducer', 'kafkaConsumer', 'kafkaRemapDevice', 'kafkaRemapVariable'] }
];

// Name is the row's identity: the push, the collision check and Adopt all find it again by
// name, so it is never releasable and never editable here.
var uamNeverReleasable = { name: true, condition: true };

// The same [...] helper modals the definition editor offers (UamDetailFieldPicker), keyed by ROW
// key instead of property name. A field the instance has taken over is edited here and nowhere
// else, so without these the user would have to type a user group or converter name from memory
// on exactly the fields the UDT editor lets them pick.
var uamInstancePickers = {
    userGroups: 'UserGroupsModal',
    trendGroups: 'TrendGroupsModal',
    recipeTargets: 'RecipesModal',
    converter: 'ConvertersModal',
    sampleGroup: 'SampleGroupsModal'
};

// slotPath is the containment slot the drawer was rendered for, stamped onto every editable
// control so the save can narrow to exactly the rows shown. Undefined means "not stamped", which
// is the un-narrowed case UamMemberRows also leaves alone.
function UamInstanceFieldHtml(memberId, row, rows, key, owned, releasedSet, slotPath) {
    var label = (window.UamTranslations || {})['field_' + key] || UamT(key);
    var values = rows.map(function (r) { return r[key]; });
    var mixed = values.some(function (v) { return v !== values[0]; });
    var value = mixed ? '' : values[0];
    var isBool = typeof values[0] === 'boolean';

    // Three states, one per field: owned by the definition (read-only + Override), taken over by
    // this instance (editable + Revert), or never owned at all (editable, nothing to revert to).
    var prop = owned[key] || releasedSet[key];
    var editable = !owned[key];
    var slotAttr = slotPath === undefined ? '' : ' data-uam-slot="' + UamEscAttr(slotPath) + '"';
    var control;
    if (!editable) {
        control = '<div class="uam-detail-value' + (String(value === undefined || value === null ? '' : value) ? '' : ' uam-detail-empty') + '">'
            + (isBool ? UamEsc(UamBoolText(value)) : (String(value === null || value === undefined ? '' : value) ? UamEsc(value) : '&mdash;'))
            + '</div>';
    } else if (isBool) {
        control = '<input type="checkbox" class="form-check-input uam-member-input" data-uam-rowfield="' + UamEscAttr(key) + '"'
            + slotAttr
            + (value === true ? ' checked' : '') + ' onchange="UamSaveInstanceRowField(' + memberId + ', this)" />';
    } else {
        control = '<input class="uam-member-input" data-uam-rowfield="' + UamEscAttr(key) + '"'
            + ' data-uam-member="' + memberId + '"'
            + slotAttr
            + ' value="' + UamEscAttr(value === null || value === undefined ? '' : value) + '"'
            + (mixed ? ' placeholder="' + UamEscAttr(UamT('mixedValues')) + '"' : '')
            + ' onchange="UamSaveInstanceRowField(' + memberId + ', this)" />';

        // The shared modals find their target with parentElement.getElementsByTagName('input')[0],
        // so the button and the input MUST share a direct parent - hence the wrapper.
        if (uamInstancePickers[key]) {
            control = '<div class="uam-detail-picker">' + control
                + '<button type="button" class="uam-detail-pickerbtn" tabindex="-1"'
                + ' onclick="' + uamInstancePickers[key] + '(this)">...</button></div>';
        }
    }

    var action = '';
    if (!uamNeverReleasable[key] && prop) {
        var release = !!owned[key];
        action = '<button type="button" class="uam-released-btn' + (release ? '' : ' on') + '"'
            + ' title="' + UamEscAttr(UamT(release ? 'override' : 'revertToDefinition')) + '"'
            + ' onclick="UamSetFieldRelease(' + memberId + ', &quot;' + UamEscAttr(prop) + '&quot;, ' + release + ')">'
            + '&#9998;</button>';
    }

    return '<label class="uam-detail-field"><span>' + UamEsc(label)
        + (rows.length > 1 ? '<span class="udt-chip udt-chip-line uam-extra-tag">' + rows.length + '</span>' : '')
        + action + '</span>' + control + '</label>';
}

// The protocol and device a member's rows actually landed on. Read from the rows because that
// is the only authority now: two members of one instance can sit on different devices, and even
// on different protocols. With containment one member id owns one row set PER SLOT, so the
// lookup narrows by the member's slot path when the render list stamped one.
function UamMemberRows(m) {
    var rows = ((uamInstanceRows.byMember || {})[m.__memberId]) || [];
    if (m.__slotPath !== undefined)
        rows = rows.filter(function (r) { return (r.udtMemberSlot || '') === m.__slotPath; });
    return rows;
}

function UamMemberRow(m) {
    var rows = UamMemberRows(m);
    return rows.length ? rows[0] : null;
}

// The save-side half of UamMemberRows: an editable control carries the slot it was drawn for in
// data-uam-slot, so a write reaches exactly the rows the drawer showed. No attribute means the
// render list stamped no slot, which is the un-narrowed case.
function UamRowsForSlot(rows, el) {
    var slotPath = el && el.getAttribute ? el.getAttribute('data-uam-slot') : null;
    if (slotPath === null) return rows;
    return rows.filter(function (r) { return (r.udtMemberSlot || '') === slotPath; });
}

function UamMemberProtocol(m) {
    var row = UamMemberRow(m);
    return row ? (row.uamProtocol || '') : '';
}

function UamInstanceFieldsHtml(m) {
    var deviceType = UamMemberProtocol(m);
    var memberId = m.__memberId;
    if (uamInstanceRows.state !== 'ready') return '';
    // Slot-narrowed: one member id owns one row set per slot expansion.
    var rows = UamMemberRows(m);
    if (!rows.length) return '';
    var managed = uamManagedFields[memberId];
    if (!managed || managed.state !== 'ready') { UamLoadManagedFields(memberId); return ''; }

    // Both maps go row key -> PROPERTY name, because the release API speaks PascalCase property
    // names (RecipeTargets) while the row speaks camelCase wire keys (recipeTargets).
    var owned = {}, releasedSet = {};
    managed.fields.forEach(function (f) { owned[UamRowKeyFor(f)] = f; });
    (managed.released || []).forEach(function (f) { releasedSet[UamRowKeyFor(f)] = f; });

    var placed = {};
    uamInstanceGroups.forEach(function (g) { g.keys.forEach(function (k) { placed[k] = true; }); });
    var leftover = Object.keys(rows[0]).filter(function (k) {
        return !placed[k] && uamRowMeta.indexOf(k) < 0 && !uamNeverReleasable[k];
    });

    var groups = uamInstanceGroups.map(function (g) {
        var keys = g.keys.filter(function (k) { return k in rows[0]; });
        if (!keys.length) return '';
        return '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT(g.title)) + '</div>'
            + '<div class="uam-detail-grid">'
            + keys.map(function (k) { return UamInstanceFieldHtml(memberId, rows[0], rows, k, owned, releasedSet, m.__slotPath); }).join('')
            + '</div></div>';
    }).join('');

    if (leftover.length) {
        groups += '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('advanced'))
            + ' <span class="udt-chip udt-chip-line uam-extra-tag">' + UamEsc(deviceType) + '</span></div>'
            + '<div class="uam-detail-grid">'
            + leftover.map(function (k) { return UamInstanceFieldHtml(memberId, rows[0], rows, k, owned, releasedSet, m.__slotPath); }).join('')
            + '</div></div>';
    }
    return groups;
}
// Release ('Override' on) or reclaim a field for one member of the selected instance. Its own
// action, not part of a row update: the API refuses a request that would release a field and
// change it in the same call.
function UamSetFieldRelease(memberId, field, release) {
    UamApi('/API/Config/UdtInstances/ReleaseFields', 'POST', {
        instanceId: uamSelectedInstanceId, memberId: memberId, fields: [field], release: release
    }).then(function (result) {
        if (result && result.error) { UamShowErrors((result)); return; }
        // Both the release list and the row values can have changed (a reclaim re-materializes
        // the field), so drop the caches and let the drawer refetch.
        UamLoadManagedFields(memberId, true);
        var instance = uamAllInstances.filter(function (i) { return UamField(i, 'id') === uamSelectedInstanceId; })[0];
        if (instance) UamLoadInstanceRows(instance, true);
        UamRenderInstanceDetail();
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

function UamSaveInstanceRowField(memberId, el) {
    // Narrow to the slot the drawer was rendered for, with the same predicate UamMemberRows uses.
    // With containment one member id owns one row set PER SLOT, so an unnarrowed save wrote the
    // value onto every slot's rows: editing slot MotorA destroyed MotorB's own per-row value,
    // while the field's row-count chip (drawn from the narrowed set) still said one row.
    var rows = UamRowsForSlot(uamInstanceRows.byMember[memberId] || [], el);
    if (!rows.length) return;
    var key = el.getAttribute('data-uam-rowfield');
    var sample = rows[0][key];
    var value = typeof sample === 'boolean' ? el.checked
        : typeof sample === 'number' ? (Number(el.value) || 0)
        : el.value;

    // The row knows which table it came from; the instance no longer does.
    var deviceType = (rows[0] && rows[0].uamProtocol) || '';
    if (!deviceType) return;

    // Full-row round-trip: the config PUT rejects a partial body at model binding, and the
    // managed-row lock compares every managed field against the stored row - so send the rows
    // exactly as they were read, with only this field changed.
    var payload = rows.map(function (r) {
        var copy = {};
        Object.keys(r).forEach(function (n) { copy[n] = r[n]; });
        copy[key] = value;
        return copy;
    });

    el.disabled = true;
    UamApi('/API/Config/' + encodeURIComponent(deviceType) + 'Variables', 'PUT', payload).then(function (result) {
        el.disabled = false;
        if (result && result.error) { UamShowErrors((result)); UamRenderInstanceDetail(); return; }
        rows.forEach(function (r) { r[key] = value; });
        UamRenderInstanceDetail();
        // The input is re-enabled on a cancel too - the operator declined to sign, so the field
        // must go back to being editable rather than staying dead until the panel re-renders.
    }).catch(function (e) { el.disabled = false; if (!UamSignatureCancelled(e)) UamError(); });
}

function UamInstanceVarDetailRow(m, i, tokens) {
    var deviceType = UamMemberProtocol(m);
    if (!uamExpandedInstanceVars[i]) return '';

    // An array member's drawer resolves for the FIRST element ({Index} = First index): one
    // concrete example beats N repeated groups, and the row above already shows the range.
    var arr = UamResolveArray(m, tokens);
    if (arr) tokens = Object.assign({}, tokens, { Index: String(arr.start) });

    // Only this MEMBER's protocol group. The definition editor shows every group because the
    // template is protocol-agnostic; here the row exists, so its own device decides.
    var group = UamGroupFor(deviceType);
    var extrasHtml = !group ? '' : group.fields.map(function (f) {
        var templated = UamField(m, f.prop.charAt(0).toLowerCase() + f.prop.slice(1));
        var empty = !templated || !String(templated).trim();
        // An empty optional field reports the default the row was given; an empty required one
        // is what the plan will reject, so say so rather than showing a bare dash.
        var value = empty ? (f.fallback !== undefined ? f.fallback : '') : UamComputeTokens(UamSubstitute(String(templated), tokens));
        // This panel answers "what did materialization write", and OPC UA maps the canonical type
        // onto its own vocabulary (REAL -> Float), so show the mapped value, not the template one.
        if (f.label === 'type') value = UamMappedType(deviceType, value);
        return UamReadOnlyField(UamT(f.label), value, { isDefault: empty && f.fallback !== undefined });
    }).join('');

    // colspan tracks the variables table's column count (name + units + flags).
    //
    // Every field is rendered from the ROW, not from the member resolved through tokens. For a
    // field the definition owns the two agree (a push keeps them in step), and for one this
    // instance has taken over only the row is true - so reading the row is right in both cases
    // and the drawer answers "what is this variable" rather than "what does the template say".
    var fieldsHtml = UamInstanceFieldsHtml(m);

    return '<tr class="uam-member-detail"><td colspan="3"><div class="uam-detail-panel">'
        + (!arr ? '' : '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('array')) + '</div>'
            + '<div class="uam-detail-grid">'
            + UamReadOnlyField(UamT('arraySize'), arr.count === null ? arr.raw : arr.count)
            + UamReadOnlyField(UamT('firstIndex'), arr.start)
            + '</div></div>')
        + (fieldsHtml || ('<div class="uam-detail-group"><div class="uam-detail-grid">'
            + UamReadOnlyField(UamT('description'), UamSubstitute(UamField(m, 'description') || '', tokens))
            + '</div></div>'))
        + '</div></td></tr>';
}
// Edit from the tree: route through the definition-scoped instance editor with its
// definition as context, then return to the asset view on save via the reload in UamSaveInstance.
function UamEditInstanceFromTree(id) {
    var instance = uamAllInstances.filter(function (i) { return UamField(i, 'id') === id; })[0];
    if (!instance) return;
    var definition = uamDefinitions.filter(function (d) { return d.name === UamField(instance, 'definition'); })[0];
    if (!definition) { UamError(); return; }
    uamInstanceDefinition = definition;
    uamInstances = uamAllInstances;
    UamOpenInstanceEditor(id);
}

function UamRenderPanel() {
    var panel = document.getElementById('UamAssetPanel');
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === uamSelectedNodeId; })[0];
    if (!node) {
        panel.innerHTML = '<p style="color:var(--ThemeFontColor2);font-size:13px;">' + UamEsc(UamT('selectNode')) + '</p>';
        document.getElementById('UamEditNodeBtn').disabled = true;
        document.getElementById('UamDeleteNodeBtn').disabled = true;
        var copyBtn = document.getElementById('UamCopyNodeBtn');
        if (copyBtn) copyBtn.disabled = true;
        return;
    }
    var path = UamField(node, 'path');
    panel.innerHTML =
        '<div class="asset-panel-title">' + UamEsc(UamField(node, 'name')) + '</div>'
        + '<div class="asset-panel-path">' + UamEsc(path) + '</div>'
        + (UamField(node, 'description') ? '<p style="font-size:13px;">' + UamEsc(UamField(node, 'description')) + '</p>' : '')
        + '<p><span class="udt-chip udt-chip-line">' + UamChildren(uamSelectedNodeId).length + ' ' + UamEsc(UamT('childNodes')) + '</span> '
        + '<span class="udt-chip udt-chip-line">' + (UamField(node, 'instanceCount') || 0) + ' ' + UamEsc(UamT('udtInstances')) + '</span></p>'
        + '<div id="UamAssetInstances"></div>';

    UamApi('/API/Config/UdtInstances').then(function (instances) {
        var attached = (instances || []).filter(function (i) {
            var assetPath = UamField(i, 'asset') || '';
            return assetPath === path || assetPath.indexOf(path + '/') === 0;
        });
        uamPanelInstances = attached;
        if (!attached.length) return;
        document.getElementById('UamAssetInstances').innerHTML =
            '<table class="udt-members" style="margin-top:10px;"><thead><tr><th>' + UamEsc(UamT('instances')) + '</th><th>' + UamEsc(UamT('udtDefinitions')) + '</th><th>' + UamEsc(UamT('device')) + '</th><th>' + UamEsc(UamT('asset')) + '</th><th>' + UamEsc(UamT('status')) + '</th></tr></thead><tbody>'
            + attached.map(function (i) {
                var status = UamField(i, 'outdated')
                    ? '<span class="udt-chip udt-chip-warn">' + UamEsc(UamT('outdated')) + '</span>'
                    : '<span class="udt-chip udt-chip-ok">' + UamEsc(UamT('synced')) + '</span>';
                // Clicking a row opens that instance's resolved detail, the same view the tree's
                // instance children lead to (UamSelectInstance). The row stays draggable for
                // re-attaching to another node; a drag does not synthesise a click, so the two
                // gestures do not collide.
                return '<tr class="uam-draggable uam-row-clickable" draggable="true" onclick="UamSelectInstance(' + UamField(i, 'id') + ')" data-instance-id="' + UamField(i, 'id') + '"><td><b>' + UamEsc(UamField(i, 'name')) + '</b></td><td>' + UamEsc(UamField(i, 'definition')) + '</td><td>'
                    + UamEsc(UamInstanceDeviceLabel(uamDefinitions.filter(function (d) { return d.name === UamField(i, 'definition'); })[0], i)) + '</td><td class="udt-version">' + UamEsc(UamField(i, 'asset')) + '</td><td>' + status + '</td></tr>';
            }).join('') + '</tbody></table>';
    });
}

// Hierarchical parent picker: renders the tree with real indentation and node icons in a
// custom dropdown (a native select cannot indent or style options). The hidden
// #<prefix>Parent input keeps carrying the selected id for the save path.
// prefix selects which dialog's combo is driven ('UamNode' = the node editor, 'UamCopy' = the
// subtree copy); it defaults to the node editor so the existing call sites read unchanged.
// Excluding a node excludes its whole subtree: the walk returns before recursing into it.
function UamRenderParentCombo(excludeId, selectedId, prefix) {
    prefix = prefix || 'UamNode';
    var items = [{ id: 0, name: UamT('root'), path: UamT('root'), depth: 0, root: true }];
    (function walk(parentId, depth) {
        UamChildren(parentId).forEach(function (node) {
            var id = UamField(node, 'id');
            if (id === excludeId) return;
            items.push({ id: id, name: UamField(node, 'name'), path: UamField(node, 'path'), depth: depth + 1 });
            walk(id, depth + 1);
        });
    })(0, 0);

    // The menu keeps the indented tree; the closed toggle shows the FULL PATH so nodes with
    // the same name under different branches stay distinguishable.
    document.getElementById(prefix + 'ParentMenu').innerHTML = items.map(function (item) {
        return '<div class="uam-combo-item' + (item.id === selectedId ? ' selected' : '') + '" style="padding-left:' + (item.depth * 16 + 8) + 'px"'
            + ' data-path="' + UamEscAttr(item.path) + '" onclick="UamParentComboPick(' + item.id + ', this, \'' + prefix + '\')">'
            + (item.root ? '' : '<svg viewBox="0 0 24 24"><path d="M12 3l8 5v8l-8 5-8-5V8z"/></svg>')
            + UamEsc(item.name)
            + '</div>';
    }).join('');

    var selected = items.filter(function (item) { return item.id === selectedId; })[0] || items[0];
    UamParentComboSet(selected.id, selected.path, prefix);
}

function UamParentComboSet(id, label, prefix) {
    prefix = prefix || 'UamNode';
    document.getElementById(prefix + 'Parent').value = id;
    document.getElementById(prefix + 'ParentToggle').textContent = label;
}

function UamParentComboPick(id, element, prefix) {
    prefix = prefix || 'UamNode';
    var menu = document.getElementById(prefix + 'ParentMenu');
    menu.querySelectorAll('.uam-combo-item').forEach(function (item) { item.classList.remove('selected'); });
    element.classList.add('selected');
    UamParentComboSet(id, element.dataset.path || element.textContent, prefix);
    menu.style.display = 'none';

    // The destination is half of every name the copy produces - the node's new siblings and the
    // path part of each instance's identity - so picking one has to re-run the preview. This used
    // to call a UamCopyInvalidate() that was never defined, so the pick threw a ReferenceError and
    // the tree kept showing the plan computed for the ORIGINAL parent: a destination with no name
    // clash still reported every row as already existing.
    if (prefix === 'UamCopy') UamCopyChanged();
}

function UamParentComboToggle(e, prefix) {
    prefix = prefix || 'UamNode';
    e.stopPropagation();
    var menu = document.getElementById(prefix + 'ParentMenu');
    var open = menu.style.display !== 'none';
    menu.style.display = open ? 'none' : '';
    if (!open) {
        var close = function (ev) {
            if (ev.target.closest('#' + prefix + 'ParentCombo')) return;
            menu.style.display = 'none';
            document.removeEventListener('click', close, true);
        };
        document.addEventListener('click', close, true);
    }
}



function UamOpenNodeEditor(id) {
    uamEditNodeId = id ? parseInt(id, 10) : 0;
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === uamEditNodeId; })[0];
    document.getElementById('UamNodeTitle').textContent = node ? UamField(node, 'name') : UamT('addNode');
    document.getElementById('UamNodeName').value = node ? UamField(node, 'name') : '';
    UamRenderParentCombo(uamEditNodeId, node ? UamField(node, 'parentId') : (uamSelectedNodeId || 0));
    document.getElementById('UamNodeParentMenu').style.display = 'none';
    document.getElementById('UamNodeDescription').value = node ? (UamField(node, 'description') || '') : '';
    // Display order is owned by drag-and-drop in the tree, which renumbers a whole sibling set on
    // every drop, so the dialog no longer offers a Sort order field. The current value is carried
    // here and re-sent verbatim on save: the Assets PUT takes the whole DTO, so omitting it (or
    // defaulting to 0) would silently reset the node to unordered and drop it back into
    // alphabetical position - the exact trap the standalone Asset Manager page once had.
    uamEditNodeSortOrder = node ? (UamField(node, 'sortOrder') || 0) : 0;
    document.getElementById('UamNodeWarning').style.display = 'none';
    if (node) {
        UamApi('/API/Config/Assets/Attached?id=' + uamEditNodeId).then(function (data) {
            var counts = (data && (data.counts || data.Counts)) || {};
            var total = Object.keys(counts).reduce(function (sum, key) { return sum + counts[key]; }, 0);
            if (total > 0) {
                document.getElementById('UamNodeWarningText').textContent = UamT('renameWarning').replace('{0}', total);
                document.getElementById('UamNodeWarning').style.display = '';
            }
        });
    }
    new bootstrap.Modal(document.getElementById('UamNodeModal')).show();
}

function UamSaveNode() {
    var payload = {
        ParentId: parseInt(document.getElementById('UamNodeParent').value, 10) || 0,
        Name: document.getElementById('UamNodeName').value,
        Description: document.getElementById('UamNodeDescription').value,
        SortOrder: uamEditNodeSortOrder
    };
    var promise;
    if (uamEditNodeId) { payload.Id = uamEditNodeId; promise = UamApi('/API/Config/Assets', 'PUT', [payload]); }
    else promise = UamApi('/API/Config/Assets', 'POST', [payload]);
    promise.then(function (data) {
        if (data && data.success) {
            bootstrap.Modal.getInstance(document.getElementById('UamNodeModal')).hide();
            UamLoadTree(true);
            return;
        }
        UamShowErrors((data));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}
// ==================== node copy (recursive subtree) ====================

// Copying a node is a re-CREATE, not a row clone: an instance's target device is fixed at
// creation - it is a Device-typed PARAMETER VALUE, so copying onto another device means remapping
// those values. The dialog is therefore the RESULT TREE - it redraws from a server preview on every
// edit, so what is on screen is exactly what would be created, and every finding sits on the row
// that caused it instead of in a list underneath.
//
// Names are edited in place, and every field carries the server's resulting name as a real value:
// a copied row derives its SOURCE name, so what the field shows is what would be created. Clearing
// a field hands the row back to that derived name.
//
// Renaming is not optional: instance names are globally unique, so a freshly opened copy reports a
// collision on every instance row until they are renamed. One row at a time for a small branch,
// and through the exported plan file (UamExportCopyPlan / UamImportCopyPlan) for a large one -
// that file is the bulk rename mechanism, and it is deliberately the only one. An in-dialog
// find/replace existed here and was removed: it rewrote parameter VALUES as well as names, so a
// short Find could shift an address or a setpoint across a whole branch in one keystroke. An
// editor does the same job with the change visible and undoable before it reaches the dialog.
var uamCopyNodeId = 0;
var uamCopyInstParams = {};    // source instance id -> {parameter: value} typed on the row
var uamCopyExpanded = {};      // source instance id -> drawer state, overriding the default below
var uamCopyExpandAll = true;   // drawers open by default: the parameters ARE what a copy sets
var uamCopyRootName = '';
var uamCopyNodeNames = {};     // source node id -> typed name
var uamCopyInstNames = {};     // source instance id -> typed LEAF name (the identity is composed)
var uamCopyTimer = null;
var uamCopyLast = null;
var uamCopyPlanNotes = [];     // what the last plan import brought in; cleared by the next edit

function UamOpenNodeCopy(id) {
    uamCopyNodeId = parseInt(id, 10) || 0;
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === uamCopyNodeId; })[0];
    if (!node) { UamError(); return; }

    var path = UamField(node, 'path');
    document.getElementById('UamCopySourcePath').textContent = path;
    document.getElementById('UamCopyResult').innerHTML = '';
    document.getElementById('UamCopyMessages').innerHTML = '';
    document.getElementById('UamCopySummary').textContent = '';
    document.getElementById('UamCopyApplyBtn').disabled = true;

    // Prefilled with the source name: the sibling-name check refuses it unchanged under the same
    // parent, which is the cue to append a number or switch the parent - both one edit away.
    uamCopyRootName = UamField(node, 'name');
    uamCopyNodeNames = {};
    uamCopyInstNames = {};
    uamCopyInstParams = {};
    uamCopyExpanded = {};
    uamCopyExpandAll = true;
    uamCopyLast = null;
    uamCopyPlanNotes = [];
    document.getElementById('UamCopyExportBtn').disabled = true;
    UamCopySyncExpandBtn();

    // The copy cannot land inside the subtree being copied, so that whole branch is excluded from
    // the picker. It opens on the source's own parent, where a copy usually belongs.
    UamRenderParentCombo(uamCopyNodeId, UamField(node, 'parentId') || 0, 'UamCopy');
    document.getElementById('UamCopyParentMenu').style.display = 'none';

    UamCopyPreview();

    new bootstrap.Modal(document.getElementById('UamNodeCopyModal')).show();
}

function UamCopyRootName(value) { uamCopyRootName = value; UamCopyChanged(); }
function UamCopyNodeName(id, value) { uamCopyNodeNames[id] = value; UamCopyChanged(); }
function UamCopyInstName(id, value) { uamCopyInstNames[id] = value; UamCopyChanged(); }

function UamCopyParam(id, parameter, value) {
    (uamCopyInstParams[id] = uamCopyInstParams[id] || {})[parameter] = value;
    UamCopyChanged();
}

function UamCopyRowExpanded(id) {
    return uamCopyExpanded[id] === undefined ? uamCopyExpandAll : uamCopyExpanded[id];
}

function UamCopyToggleParams(id) {
    uamCopyExpanded[id] = !UamCopyRowExpanded(id);
    if (uamCopyLast) UamRenderCopyResult(uamCopyLast);
}

// Expand/collapse every row at once. Per-row exceptions are dropped, so the button always does
// what it says instead of leaving a few rows behind in the opposite state.
function UamCopyToggleAllParams() {
    uamCopyExpandAll = !uamCopyExpandAll;
    uamCopyExpanded = {};
    UamCopySyncExpandBtn();
    if (uamCopyLast) UamRenderCopyResult(uamCopyLast);
}

// The button is named after what it will DO, not the state it is in.
function UamCopySyncExpandBtn() {
    var btn = document.getElementById('UamCopyExpandBtn');
    if (btn) btn.textContent = UamT(uamCopyExpandAll ? 'collapseAll' : 'expandAll');
}

// Every edit invalidates the tree on screen, so Copy goes unavailable until the preview that
// matches the current state comes back. It also drops the import notes: they count what one file
// brought in, which stops being true the moment a row is edited by hand.
function UamCopyChanged() {
    document.getElementById('UamCopyApplyBtn').disabled = true;
    uamCopyPlanNotes = [];
    if (uamCopyTimer) clearTimeout(uamCopyTimer);
    uamCopyTimer = setTimeout(UamCopyPreview, 350);
}

// The GUI sends no ValueMap: every value the request says nothing about carries over from the
// source, and anything that must change is edited on its own row. The bulk remap and the fan-out
// it enabled remain in the API and the MCP tools for scripted callers, which is also why the
// server's read-only multi-copy result is still handled below - the GUI just never produces one.
function UamCopyBody() {
    var instanceIds = {};
    Object.keys(uamCopyInstNames).forEach(function (key) { instanceIds[key] = true; });
    Object.keys(uamCopyInstParams).forEach(function (key) { instanceIds[key] = true; });

    return {
        SourceId: uamCopyNodeId,
        TargetParentId: parseInt(document.getElementById('UamCopyParent').value, 10) || 0,
        NewName: uamCopyRootName,
        NodeOverrides: Object.keys(uamCopyNodeNames)
            .filter(function (key) { return (uamCopyNodeNames[key] || '').trim() !== ''; })
            .map(function (key) { return { SourceId: parseInt(key, 10), NewName: uamCopyNodeNames[key] }; }),
        InstanceOverrides: Object.keys(instanceIds)
            .map(function (key) {
                var edits = {};
                Object.keys(uamCopyInstParams[key] || {}).forEach(function (parameter) {
                    edits[parameter] = uamCopyInstParams[key][parameter];
                });
                // NewName carries the LEAF; the server composes the identity from it and the
                // target node, so client and server cannot disagree about a row's name.
                return { SourceId: parseInt(key, 10), NewName: uamCopyInstNames[key] || '', ParameterValues: edits };
            })
            .filter(function (entry) { return entry.NewName.trim() !== '' || Object.keys(entry.ParameterValues).length > 0; })
    };
}

// ---------- plan file (the bulk rename mechanism) ----------
//
// The file is the tree, flattened: one entry per row, carrying what is editable on it - a name for
// a node, a name plus the parameter values for an instance. It is written from the LAST PREVIEW,
// so it always describes what the dialog currently shows rather than a client-side recomputation.
//
// sourceId is the match key. sourceName and definition ride along as context for whoever opens the
// file in an editor and are ignored on import - the ids are what address a row, and echoing a
// stale source name back would be a second, silent source of truth.
var UamCopyPlanKind = 'EnvisionAssetCopyPlan';

// Every row is exported, not just the ones already overridden: the point of the file is to fill in
// names, and a file listing only what someone had already renamed by hand would be empty exactly
// when it is needed. Disabled until a preview exists, and refused on a fan-out result - several
// copies of one source row leave "which copy does this entry mean" unanswerable, the same reason
// the server refuses overrides there.
function UamExportCopyPlan() {
    if (!uamCopyLast || (uamCopyLast.copyCount || 1) !== 1) return;

    var nodes = uamCopyLast.nodes || uamCopyLast.Nodes || [];
    var instances = uamCopyLast.instances || uamCopyLast.Instances || [];
    if (!nodes.length) return;

    var plan = {
        kind: UamCopyPlanKind,
        schemaVersion: 1,
        sourceNodeId: uamCopyNodeId,
        sourcePath: document.getElementById('UamCopySourcePath').textContent || '',
        nodes: nodes.map(function (node) {
            return {
                sourceId: UamField(node, 'sourceId'),
                sourceName: UamField(node, 'sourceName') || '',
                newName: UamField(node, 'newName') || ''
            };
        }),
        instances: instances.map(function (instance) {
            return {
                sourceId: UamField(instance, 'sourceId'),
                sourceName: UamField(instance, 'sourceName') || '',
                definition: UamField(instance, 'definition') || '',
                // newName is the composed identity - what the row will actually be called. Import
                // reduces it to its leaf and lets the server recompose, so a file edited after the
                // branch moved cannot pin a stale path.
                newName: UamField(instance, 'newName') || '',
                parameterValues: UamField(instance, 'parameterValues') || {}
            };
        })
    };

    UamDownload((uamCopyRootName || 'AssetCopy') + '_copyplan.json', 'application/json', JSON.stringify(plan, null, 2));
}

// Import writes the file's values in as row overrides and lets the ordinary debounced preview
// re-validate them, so an imported plan goes through exactly the checks a typed one does and Copy
// stays disabled until it comes back clean.
//
// A row the file omits keeps what it has - the same "silence means carry it over" rule the value
// map follows - and an empty newName hands the row back to its derived name, which is how the GUI
// clears an override.
function UamImportCopyPlan() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            var plan;
            try { plan = JSON.parse(String(reader.result)); } catch (e) { plan = null; }
            if (!plan || typeof plan !== 'object' || plan.kind !== UamCopyPlanKind) {
                UamError(UamT('copyPlanInvalid'));
                return;
            }
            UamApplyCopyPlan(plan);
        };
        reader.readAsText(file);
    };
    input.click();
}

function UamApplyCopyPlan(plan) {
    // Match against the rows the OPEN dialog knows about. A plan exported from another subtree
    // shares no source ids, so it would otherwise apply nothing and say nothing; the unmatched
    // count is reported instead of being swallowed.
    var knownNodes = {}, knownInstances = {}, rootId = 0;
    (uamCopyLast && (uamCopyLast.nodes || uamCopyLast.Nodes) || []).forEach(function (node) {
        var id = UamField(node, 'sourceId');
        knownNodes[id] = true;
        if ((UamField(node, 'sourceParentId') || 0) === 0) rootId = id;
    });
    (uamCopyLast && (uamCopyLast.instances || uamCopyLast.Instances) || []).forEach(function (instance) {
        knownInstances[UamField(instance, 'sourceId')] = true;
    });

    var nodeCount = 0, instanceCount = 0, unmatched = 0;

    (plan.nodes || []).forEach(function (entry) {
        var id = parseInt(entry && entry.sourceId, 10);
        if (!id || !knownNodes[id]) { unmatched++; return; }
        var name = String(entry.newName == null ? '' : entry.newName);
        if (id === rootId) uamCopyRootName = name;
        else uamCopyNodeNames[id] = name;
        nodeCount++;
    });

    (plan.instances || []).forEach(function (entry) {
        var id = parseInt(entry && entry.sourceId, 10);
        if (!id || !knownInstances[id]) { unmatched++; return; }

        // Reduced to the leaf: the path half of the identity belongs to the node the row lands
        // under, which the dialog already knows, so a stale path in the file is simply ignored.
        uamCopyInstNames[id] = UamLeafName(String(entry.newName == null ? '' : entry.newName));

        // Unknown parameter names are kept and sent: the server reports them on the row that
        // carries them (UdtUnknownParameter), which is where a typo in the file has to surface.
        // Dropping them here would make the file silently lossy.
        var values = entry.parameterValues || {};
        if (values && typeof values === 'object') {
            var edits = uamCopyInstParams[id] = uamCopyInstParams[id] || {};
            Object.keys(values).forEach(function (parameter) {
                edits[parameter] = String(values[parameter] == null ? '' : values[parameter]);
            });
        }
        instanceCount++;
    });

    var messages = [UamT('copyPlanImported').replace('{0}', nodeCount).replace('{1}', instanceCount)];
    if (unmatched) messages.push(UamT('copyPlanUnmatched').replace('{0}', unmatched));
    if (plan.sourceNodeId && parseInt(plan.sourceNodeId, 10) !== uamCopyNodeId) messages.push(UamT('copyPlanOtherSubtree'));

    // Order matters: UamCopyChanged CLEARS the notes, so they are set after it. That is what makes
    // them survive the preview they just triggered (which owns the message area and would wipe
    // them) and then disappear on the next manual edit, when the counts no longer describe what is
    // on screen. Writing them straight into #UamCopyMessages instead lasted 350ms.
    UamCopyChanged();
    uamCopyPlanNotes = messages;
}

function UamCopyPreview() {
    if (uamCopyTimer) { clearTimeout(uamCopyTimer); uamCopyTimer = null; }
    UamPageApi('CopyPreview', UamCopyBody()).then(function (data) {
        uamCopyLast = data;
        UamRenderCopyResult(data);
    }).catch(function () { UamError(); });
}

function UamApplyNodeCopy() {
    UamPageApi('CopyAsset', UamCopyBody()).then(function (data) {
        if (data && data.success && data.applied) {
            bootstrap.Modal.getInstance(document.getElementById('UamNodeCopyModal')).hide();
            // Land on the copy rather than on the source: the new branch may sit anywhere in the
            // tree, and selecting it is the confirmation that the copy happened.
            var newRoot = (data.nodes || data.Nodes || [])[0];
            UamLoadTree(true).then(function () {
                var path = newRoot ? UamField(newRoot, 'newPath') : '';
                var created = uamNodes.filter(function (n) { return UamField(n, 'path') === path; })[0];
                if (created) UamSelectNode(UamField(created, 'id'));
            });
            return;
        }
        // A copy that fails is rolled back whole, so the dialog stays open on the reported reason
        // rather than closing over a half-finished tree.
        uamCopyLast = data;
        UamRenderCopyResult(data);
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// ---------- result tree ----------

function UamRenderCopyResult(data) {
    var host = document.getElementById('UamCopyResult');
    if (!data) { host.innerHTML = ''; UamError(); return; }

    var nodes = data.nodes || data.Nodes || [];
    var instances = data.instances || data.Instances || [];
    var copyCount = data.copyCount || data.CopyCount || 1;
    var editable = copyCount === 1;

    // Redrawing on every keystroke would eject the caret without this: the row being typed in is
    // found again by its key and the cursor put back where it was.
    var active = document.activeElement;
    var focusKey = active && active.dataset ? active.dataset.copykey : null;
    var caret = focusKey && active.selectionStart != null ? active.selectionStart : null;
    var focusValue = focusKey ? active.value : null;

    var html = '';
    for (var copyIndex = 0; copyIndex < copyCount; copyIndex++) {
        html += UamRenderCopyBranch(
            nodes.filter(function (n) { return (UamField(n, 'copyIndex') || 0) === copyIndex; }),
            instances.filter(function (i) { return (UamField(i, 'copyIndex') || 0) === copyIndex; }),
            editable);
    }
    host.innerHTML = html;

    if (focusKey) {
        var restored = host.querySelector('[data-copykey="' + focusKey + '"]');
        if (restored) {
            if (focusValue != null) restored.value = focusValue;
            restored.focus();
            if (caret != null && restored.setSelectionRange) restored.setSelectionRange(caret, caret);
        }
    }

    // Request-level findings only: anything about a row is drawn on the row. The import notes lead:
    // they explain why the rows just changed under the user, and the server's findings below them
    // are the verdict on the result.
    var messages = uamCopyPlanNotes.map(function (text) {
        return '<div class="uam-copy-msg">' + UamEsc(text) + '</div>';
    });
    (data.validationErrors || data.ValidationErrors || []).forEach(function (e) {
        messages.push('<div class="uam-copy-msg-bad">' + UamEsc(typeof e === 'string' ? e : (e.Message || e.message || '')) + '</div>');
    });
    if (!editable) messages.push('<div class="uam-copy-msg">' + UamEsc(UamT('copyFanOutReadOnly')) + '</div>');
    (data.warnings || data.Warnings || []).forEach(function (w) {
        messages.push('<div class="uam-copy-msg">' + UamEsc(w) + '</div>');
    });
    document.getElementById('UamCopyMessages').innerHTML = messages.join('');

    // Export writes what this tree shows, so it needs a tree: no preview, or a read-only fan-out
    // result, and there is nothing addressable to write out.
    var exportBtn = document.getElementById('UamCopyExportBtn');
    if (exportBtn) exportBtn.disabled = !editable || !nodes.length;

    document.getElementById('UamCopySummary').textContent = nodes.length
        ? UamT('copySummary').replace('{0}', nodes.length).replace('{1}', instances.length)
        : '';
    document.getElementById('UamCopyApplyBtn').disabled = !(data.success && nodes.length);
}

function UamRenderCopyBranch(nodes, instances, editable) {
    var byParent = {};
    nodes.forEach(function (node) {
        var parentId = UamField(node, 'sourceParentId') || 0;
        (byParent[parentId] = byParent[parentId] || []).push(node);
    });

    var byNode = {};
    instances.forEach(function (instance) {
        var nodeId = UamField(instance, 'sourceNodeId') || 0;
        (byNode[nodeId] = byNode[nodeId] || []).push(instance);
    });

    var html = '';

    // The copied root is the only node reporting parent 0, so the walk starts there and follows
    // the SOURCE parent ids - the copy has no ids of its own yet.
    (function walk(parentId, depth) {
        (byParent[parentId] || []).forEach(function (node) {
            html += UamCopyNodeRow(node, depth, editable);
            (byNode[UamField(node, 'sourceId')] || []).forEach(function (instance) {
                html += UamCopyInstanceRow(instance, depth + 1, editable);
            });
            walk(UamField(node, 'sourceId'), depth + 1);
        });
    })(0, 0);

    return html;
}

function UamCopyNodeRow(node, depth, editable) {
    var id = UamField(node, 'sourceId');
    var isRoot = (UamField(node, 'sourceParentId') || 0) === 0;
    var errors = UamField(node, 'errors') || [];
    var derived = UamField(node, 'newName') || '';
    var source = UamField(node, 'sourceName') || '';

    var field;
    if (!editable) {
        field = '<span class="uam-copy-ro">' + UamEsc(derived) + '</span>';
    } else if (isRoot) {
        // The root's name is the one value the copy cannot derive, so it is a real value rather
        // than an override with a placeholder.
        field = '<input class="form-control uam-copy-name" data-copykey="n' + id + '" autocomplete="cc-csc"'
            + ' value="' + UamEscAttr(derived) + '"'
            + ' title="' + UamEscAttr(source) + '"'
            + ' oninput="UamCopyRootName(this.value)" />';
    } else {
        field = '<input class="form-control uam-copy-name" data-copykey="n' + id + '" autocomplete="cc-csc"'
            + ' value="' + UamEscAttr(derived) + '"'
            + ' title="' + UamEscAttr(source + ' - ' + UamT('copyNameOverrideHint')) + '"'
            + ' oninput="UamCopyNodeName(' + id + ', this.value)" />';
    }

    return UamCopyRow(errors, depth, '<svg class="uam-copy-icon" viewBox="0 0 24 24"><path d="M12 3l8 5v8l-8 5-8-5V8z"/></svg>', field, '');
}

// The row edits the LEAF name. The identity composes from it and the node the row sits under, so
// there is nothing else to maintain per row and no second field: the branch on screen already
// shows the path half of every identity.
function UamCopyInstanceRow(instance, depth, editable) {
    var id = UamField(instance, 'sourceId');
    var errors = UamField(instance, 'errors') || [];
    var derived = UamLeafName(UamField(instance, 'newName') || '');
    var source = UamLeafName(UamField(instance, 'sourceName') || '');

    var field = editable
        ? '<input class="form-control uam-copy-name" data-copykey="i' + id + '" autocomplete="cc-csc"'
            + ' value="' + UamEscAttr(derived) + '"'
            + ' title="' + UamEscAttr(source + ' - ' + UamT('copyNameOverrideHint')) + '"'
            + ' oninput="UamCopyInstName(' + id + ', this.value)" />'
        : '<span class="uam-copy-ro">' + UamEsc(derived) + '</span>';

    // No device column: the device is a parameter, and it is listed with the others in the drawer.
    var twisty = editable
        ? '<span class="uam-copy-twisty' + (UamCopyRowExpanded(id) ? ' open' : '') + '" onclick="UamCopyToggleParams(' + id + ')"'
            + ' title="' + UamEscAttr(UamT('parameters')) + '">'
            + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>'
        : '';

    return UamCopyRow(errors, depth, twisty + '<svg class="uam-copy-icon uam-copy-icon-inst" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg>', field, '')
        + (editable && UamCopyRowExpanded(id) ? UamCopyParamsDrawer(instance, id, depth) : '');
}

// The parameters this instance would be created with, editable in place. Values come from the
// preview, so they are what the copy will actually use - typing here overrides just this row.
// This is the ONLY place a copy's devices are set: a device is a parameter like any other.
function UamCopyParamsDrawer(instance, id, depth) {
    var definition = uamDefinitions.filter(function (d) { return d.name === UamField(instance, 'definition'); })[0];
    var parameters = (definition && definition.parameters) || [];
    if (!parameters.length) return '';

    var resolved = UamField(instance, 'parameterValues') || {};

    // Every parameter is a text box, Device-typed included: its value may be composed from other
    // parameters, so a picker over the inventory could only ever offer a subset of what is legal.
    return '<div class="uam-copy-params" style="padding-left:' + (depth * 18 + 26) + 'px">'
        + parameters.map(function (p) {
            var value = resolved[p.name] !== undefined ? resolved[p.name] : '';
            return '<label class="uam-copy-paramrow"><span>' + UamEsc(p.label || p.name) + '</span>'
                + '<input class="form-control uam-copy-param" value="' + UamEscAttr(value) + '"'
                + ' data-copykey="p' + id + '|' + UamEscAttr(p.name) + '" autocomplete="cc-csc"'
                + ' oninput="UamCopyParam(' + id + ', \'' + UamEsc(p.name) + '\', this.value)" /></label>';
        }).join('')
        + '</div>';
}

// One row of the result tree. The name field IS the tree label - renaming happens in place rather
// than in a second column beside the source name, which doubled the width of every row for
// information the placeholder and the tooltip already carry.
function UamCopyRow(errors, depth, icon, field, device) {
    return '<div class="uam-copy-row' + (errors.length ? ' uam-copy-bad' : '') + '" style="padding-left:' + (depth * 18 + 4) + 'px">'
        + icon + field + device
        + '</div>'
        + UamCopyRowErrors(errors, depth);
}

function UamCopyRowErrors(errors, depth) {
    if (!errors.length) return '';
    return '<div class="uam-copy-rowerr" style="padding-left:' + (depth * 18 + 26) + 'px">'
        + errors.map(function (e) { return UamEsc(typeof e === 'string' ? e : (e.Message || e.message || '')); }).join('<br />')
        + '</div>';
}

// ==================== definitions list ====================

// Definition and instance lists are fetched once and then filtered/sorted client-side, so
// typing in the search box or clicking a header never re-hits the API.
var uamDefSort = { key: 'name', dir: 1 };
var uamDefSearch = '';
var uamInstSort = { key: 'name', dir: 1 };
var uamInstSearch = '';

// Case-insensitive "contains" across the given accessors.
function UamFilterList(items, term, fields) {
    var text = String(term || '').trim().toLowerCase();
    if (!text) return items;
    return items.filter(function (item) {
        return fields.some(function (field) {
            var value = field(item);
            return value != null && String(value).toLowerCase().indexOf(text) >= 0;
        });
    });
}

// Counts compare numerically; text compares naturally, so Pump2 sorts before Pump10.
function UamSortList(items, sort, accessors) {
    var get = accessors[sort.key];
    if (!get) return items;
    return items.slice().sort(function (a, b) {
        var av = get(a), bv = get(b);
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir;
        return String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv), undefined, { numeric: true, sensitivity: 'base' }) * sort.dir;
    });
}

function UamSortHeader(label, key, sort, handler) {
    var sorted = sort.key === key;
    return '<th class="uam-sortable' + (sorted ? ' sorted' : '') + '" onclick="' + handler + '(\'' + key + '\')">'
        + UamEsc(label)
        + '<svg class="uam-sort-arrow" viewBox="0 0 24 24"><path d="' + (sorted && sort.dir < 0 ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6') + '"/></svg>'
        + '</th>';
}

// Same column re-clicked flips direction; a new column starts ascending.
function UamToggleSort(sort, key, draw) {
    if (sort.key === key) sort.dir = -sort.dir;
    else { sort.key = key; sort.dir = 1; }
    draw();
}

function UamEmptyRow(columns) {
    return '<tr><td class="uam-empty" colspan="' + columns + '">' + UamEsc(UamT('noResults')) + '</td></tr>';
}

var uamDefColumns = {
    name: function (d) { return d.name; },
    description: function (d) { return d.description; },
    parameters: function (d) { return d.parameters.length; },
    variables: function (d) { return d.variableMembers.length; },
    alarms: function (d) { return d.alarmMembers.length; },
    events: function (d) { return d.eventMembers.length; },
    instances: function (d) { return d.instanceCount; },
    version: function (d) { return d.version; },
    // Rank rather than label, so sorting groups by sync state: unused, synced, then outdated.
    status: function (d) { return d.instanceCount === 0 ? 0 : (d.outdatedCount > 0 ? 2 : 1); }
};

// The UDT view is two levels deep (definitions -> one definition's instances), so its back button
// walks one level at a time instead of always dropping out to the Asset Manager.
function UamSetUdtBack(labelKey, handler) {
    var btn = document.getElementById('UamUdtBackBtn');
    if (!btn) return;
    btn.textContent = '← ' + UamT(labelKey);
    btn.onclick = handler;
}

function UamRenderDefinitionsList() {
    UamSetUdtBack('assetManager', UamShowAssetView);
    document.getElementById('UamUdtCrumb').textContent = '';
    document.getElementById('UamDefToolbar').style.display = '';
    document.getElementById('UamInstToolbar').style.display = 'none';
    UamApi('/API/Config/UdtDefinitions').then(function (defs) {
        uamDefinitions = UamStampMemberIds(defs || []);
        // Cleared on every re-fetch: a definition may have been renamed or deleted since, and a
        // stale name would quietly narrow the next export to something that no longer exists.
        uamDefSelected = {};
        UamDrawDefinitionsList();
    }).catch(function () { UamError(); });
}

function UamSearchDefinitions(value) { uamDefSearch = value; UamDrawDefinitionsList(); }

// Export every UDT type as one portable, version-stamped file. The server stamps schemaVersion
// (its DB user_version) so an import elsewhere can check compatibility.
// ==================== type export / import selection ====================
//
// Keyed by NAME, not id: the export endpoint filters by name (?names=a,b), and a name is what the
// import file carries too, so one key works for both directions. Selection survives re-sorting and
// re-filtering the list; it is cleared when the list is re-fetched.
var uamDefSelected = {};

function UamToggleDefSelected(cb) {
    if (cb.checked) uamDefSelected[cb.dataset.name] = true; else delete uamDefSelected[cb.dataset.name];
    UamRefreshDefSelectionUi();
}

// Applies to the rows currently VISIBLE, so it agrees with what the user can see when a search
// filter is active - same rule the push dialog's select-all uses.
function UamToggleAllDefsSelected(source) {
    document.querySelectorAll('#UamUdtBody .uam-def-select').forEach(function (cb) {
        cb.checked = source.checked;
        if (source.checked) uamDefSelected[cb.dataset.name] = true; else delete uamDefSelected[cb.dataset.name];
    });
    UamRefreshDefSelectionUi();
}

function UamSelectedDefNames() {
    return Object.keys(uamDefSelected);
}

// The Export button carries the count so "what am I about to export" is answerable without
// counting ticks. With nothing ticked it exports everything, which is the behaviour this list has
// always had - the selection narrows it rather than becoming a precondition.
function UamRefreshDefSelectionUi() {
    var names = UamSelectedDefNames();
    var btn = document.getElementById('UamExportTypesBtn');
    if (btn) btn.textContent = names.length ? UamT('exportLabel') + ' (' + names.length + ')' : UamT('exportLabel');

    var boxes = document.querySelectorAll('#UamUdtBody .uam-def-select');
    var all = document.getElementById('UamDefSelectAll');
    if (all) {
        var checked = [].filter.call(boxes, function (cb) { return cb.checked; }).length;
        all.checked = boxes.length > 0 && checked === boxes.length;
        all.indeterminate = checked > 0 && checked < boxes.length;
    }
}

function UamExportTypes() {
    var names = UamSelectedDefNames();
    var query = names.length ? '?names=' + encodeURIComponent(names.join(',')) : '';

    UamApi('/API/Config/UdtDefinitions/Export' + query).then(function (data) {
        if (!data || data.error) { UamError(data && data.error ? data.error : undefined); return; }
        UamDownload('UdtTypes.udt.json', 'application/json', JSON.stringify(data, null, 2));
    }).catch(function () { UamError(); });
}

// Import a type file. First pass is create-only (existing names are skipped and reported); if any
// collided, ask once whether to replace them and, on yes, re-send with overwrite. The whole file
// is re-sent on overwrite - re-importing the already-created ones is a harmless no-op.
function UamImportTypes() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.udt.json,application/json';
    input.onchange = function () {
        var f = input.files && input.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () { UamPickImportTypes(reader.result); };
        reader.readAsText(f);
    };
    input.click();
}

// A type file can hold many definitions and importing all of them is rarely what is wanted, so the
// file is parsed client-side and its contents offered for selection first. Only the ticked ones are
// sent: the envelope is rebuilt with a filtered `definitions` array, keeping kind/schemaVersion/
// appVersion intact - schemaVersion in particular drives the server's compatibility check and the
// version-keyed content migrations, so it must travel unchanged.
function UamPickImportTypes(raw) {
    var file;
    try {
        file = JSON.parse(raw);
    } catch (e) {
        UamError(UamT('importInvalidFile'));
        return;
    }

    var defs = (file && file.definitions) || [];
    if (defs.length === 0) { UamError(UamT('importInvalidFile')); return; }

    // Nothing to choose from: keep the old one-step flow.
    if (defs.length === 1) { UamPostImport(JSON.stringify(file), false); return; }

    uamImportFile = file;
    document.getElementById('UamImportPickList').innerHTML = defs.map(function (d, i) {
        return '<label class="uam-import-pick">'
            + '<input type="checkbox" class="form-check-input uam-import-select" data-index="' + i + '" checked>'
            + '<span><b>' + UamEsc(d.name) + '</b>'
            + (d.description ? ' <span class="udt-version">' + UamEsc(d.description) + '</span>' : '')
            + '</span></label>';
    }).join('');

    document.getElementById('UamImportPickInfo').textContent =
        UamT('importPickInfo').replace('{0}', defs.length).replace('{1}', file.schemaVersion || '?');

    new bootstrap.Modal(document.getElementById('UamImportPickModal')).show();
}

var uamImportFile = null;

function UamConfirmImportPick() {
    if (!uamImportFile) return;

    var chosen = [].filter.call(document.querySelectorAll('#UamImportPickList .uam-import-select'), function (cb) { return cb.checked; })
        .map(function (cb) { return uamImportFile.definitions[parseInt(cb.dataset.index, 10)]; });

    if (chosen.length === 0) { UamError(UamT('importPickNone')); return; }

    var filtered = {};
    Object.keys(uamImportFile).forEach(function (k) { filtered[k] = uamImportFile[k]; });
    filtered.definitions = chosen;

    bootstrap.Modal.getInstance(document.getElementById('UamImportPickModal')).hide();
    UamPostImport(JSON.stringify(filtered), false);
}

function UamPostImport(raw, overwrite) {
    UamApi('/API/Config/UdtDefinitions/Import?overwrite=' + (overwrite ? 'true' : 'false'), 'POST', JSON.parse(raw)).then(function (data) {
        if (!data || data.success === false) { UamShowErrors((data)); return; }

        var skipped = data.skippedExisting || [];
        if (!overwrite && skipped.length) {
            if (confirm(UamT('importReplaceExisting').replace('{0}', skipped.join(', ')))) {
                UamPostImport(raw, true);
                return;
            }
        }

        UamRenderDefinitionsList();
        // Plain strings: both the imported type names and the server warnings are user-authored,
        // and UamError escapes every line before it joins them.
        var parts = [UamT('importDone').replace('{0}', (data.imported || []).join(', ') || '-').replace('{1}', (overwrite ? [] : skipped).join(', ') || '-')];
        (data.warnings || []).forEach(function (w) { parts.push(w); });
        UamError(parts);
        // Note the overwrite retry above is a SECOND import call, so in compliance mode it asks for
        // its own signature - the first token was single use and was spent on the first attempt.
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

function UamSortDefinitions(key) { UamToggleSort(uamDefSort, key, UamDrawDefinitionsList); }

function UamDrawDefinitionsList() {
    var list = UamSortList(UamFilterList(uamDefinitions, uamDefSearch, [
        function (d) { return d.name; },
        function (d) { return d.description; }
    ]), uamDefSort, uamDefColumns);

    var rows = list.map(function (d) {
        var status = d.instanceCount === 0
            ? '<span class="udt-chip udt-chip-line">' + UamEsc(UamT('noInstances')) + '</span>'
            : (d.outdatedCount > 0
                ? '<span class="udt-chip udt-chip-warn">' + d.outdatedCount + ' ' + UamEsc(UamT('outdated')) + '</span>'
                : '<span class="udt-chip udt-chip-ok">' + UamEsc(UamT('synced')) + '</span>');
        return '<tr>'
            + '<td class="uam-select-cell"><input type="checkbox" class="form-check-input uam-def-select" data-name="' + UamEsc(d.name) + '"'
            + (uamDefSelected[d.name] ? ' checked' : '') + ' onchange="UamToggleDefSelected(this)"></td>'
            + '<td><b>' + UamEsc(d.name) + '</b></td>'
            + '<td class="uam-def-desc">' + UamEsc(d.description) + '</td>'
            + '<td>' + d.parameters.length + '</td><td>' + d.variableMembers.length + '</td><td>' + d.alarmMembers.length + '</td><td>' + d.eventMembers.length + '</td>'
            + '<td>' + d.instanceCount + '</td>'
            + '<td class="udt-version">' + UamEsc(d.version) + '</td>'
            + '<td>' + status + '</td>'
            + '<td class="uam-actions">'
            + '<button type="button" class="btn uam-btn" onclick="UamOpenDefinitionEditor(' + d.id + ')">' + UamEsc(UamT('edit')) + '</button> '
            + '<button type="button" class="btn uam-btn" onclick="UamShowInstances(' + d.id + ')">' + UamEsc(UamT('instances')) + '</button> '
            + '<button type="button" class="btn uam-btn uam-danger" onclick="UamDeleteDefinition(' + d.id + ')">' + UamEsc(UamT('delete')) + '</button>'
            + '</td></tr>';
    }).join('');

    document.getElementById('UamUdtBody').innerHTML =
        '<table class="udt-members"><thead><tr>'
        + '<th class="uam-select-cell"><input type="checkbox" class="form-check-input" id="UamDefSelectAll" title="' + UamEsc(UamT('selectAll')) + '" onchange="UamToggleAllDefsSelected(this)"></th>'
        + UamSortHeader(UamT('name'), 'name', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('description'), 'description', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('parameters'), 'parameters', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('variables'), 'variables', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('alarms'), 'alarms', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('events'), 'events', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('instances'), 'instances', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('version'), 'version', uamDefSort, 'UamSortDefinitions')
        + UamSortHeader(UamT('status'), 'status', uamDefSort, 'UamSortDefinitions')
        + '<th></th></tr></thead><tbody>'
        + (rows || UamEmptyRow(11)) + '</tbody></table>';

    UamRefreshDefSelectionUi();
}

function UamDeleteDefinition(id) {
    if (!confirm(UamT('areYouSure'))) return;
    UamApi('/API/Config/UdtDefinitions/Delete', 'POST', [id]).then(function (data) {
        if (data && data.success) { UamRenderDefinitionsList(); return; }
        UamShowErrors((data));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// ==================== definition editor ====================

function UamEmptyDefinition() {
    return { Name: '', Description: '', BaseDefinition: '', Slots: [], Symbols: [], Parameters: [], VariableMembers: [], AlarmMembers: [], EventMembers: [], ScriptMembers: [] };
}

// The GET-only effective projection of the definition being edited (inherited + slot members),
// rendered read-only in the tabs. NEVER merged into uamCurrentDefinition: the working copy is the
// WRITE contract (this type's OWN content) and an inherited member that entered it would be saved
// back as an own member - a silent copy-down that permanently forks the base.
var uamCurrentEffective = null;

// ---- Member identity across a save --------------------------------------------------------
// Materialized rows point at their member by UdtMemberId, and the update reconcile matches
// SUBMITTED ids before natural keys - so a definition saved without them turns a member RENAME
// into a delete+insert that orphans every row's provenance. The GET hands out one row id per
// member in list order (UdtDefinitionDto.VariableMemberIds and friends) and the write contract
// takes the same lists back.
//
// The id is parked ON the working-copy member rather than in a parallel array: it then travels
// with the row through add, remove, drag-reorder and the import merge for free, which is the only
// way to guarantee the alignment the server insists on. ConfigController.ToDefinitionModel honours
// a list ONLY when its length equals the member count, so a list built any other way (or drifting
// by one) is either ignored or hands one member's rows to another.
var uamMemberIdFields = {
    VariableMembers: 'VariableMemberIds',
    AlarmMembers: 'AlarmMemberIds',
    EventMembers: 'EventMemberIds',
    ScriptMembers: 'ScriptMemberIds'
};

function UamStampWorkingIds(dto, read) {
    Object.keys(uamMemberIdFields).forEach(function (collection) {
        var field = uamMemberIdFields[collection];
        var ids = UamField(read, field.charAt(0).toLowerCase() + field.slice(1)) || [];
        (dto[collection] || []).forEach(function (m, index) { m.__memberId = parseInt(ids[index], 10) || 0; });
    });
}

// The ids as the write contract wants them: one entry per member, always. A member added in the
// editor contributes 0, which the server skips and matches by natural key exactly as before.
function UamMemberIdList(members) {
    return (members || []).map(function (m) { return m.__memberId || 0; });
}

// Member rows as they go on the wire. __memberId is editor bookkeeping, and it must not reach an
// exported member file either - a machine-local row id is meaningless on another machine, which is
// why the ids live beside the member lists instead of on the member DTO.
function UamMembersForWire(members) {
    return (members || []).map(function (m) {
        var copy = Object.assign({}, m);
        delete copy.__memberId;
        return copy;
    });
}

function UamDtoFromRead(d) {
    var dto = {
        Name: d.name || '', Description: d.description || '',
        BaseDefinition: d.baseDefinition || '',
        Slots: (d.slots || []).map(function (s) {
            return { Name: s.name || '', Definition: s.definition || '', ParameterMapping: Object.assign({}, s.parameterMapping || {}), IncludeWhen: s.includeWhen || '' };
        }),
        Symbols: (d.symbols || []).map(function (s) { return { GroupSymbol: s.groupSymbol || '', ReplacerMapping: s.replacerMapping || '' }; }),
        Parameters: (d.parameters || []).map(function (p) { return { Name: p.name || '', Label: p.label || '', Type: p.type || 'Text', DefaultValue: p.defaultValue || '' }; }),
        VariableMembers: (d.variableMembers || []).map(function (m) { return UamMemberFromApi('VariableMembers', m); }),
        // Alarm and event members go through UamMemberFromApi like variables: the editor saves
        // the whole DTO back, so a hand-written read map here silently blanks on save any field
        // it omits (which is how ArrayCount/ArrayStart would have been lost).
        AlarmMembers: (d.alarmMembers || []).map(function (m) { return UamMemberFromApi('AlarmMembers', m); }),
        EventMembers: (d.eventMembers || []).map(function (m) { return UamMemberFromApi('EventMembers', m); }),
        ScriptMembers: (d.scriptMembers || []).map(function (m) { return UamMemberFromApi('ScriptMembers', m); })
    };
    UamStampWorkingIds(dto, d);
    return dto;
}

function UamOpenDefinitionEditor(id) {
    uamCurrentDefinitionId = id ? parseInt(id, 10) : 0;
    if (!uamCurrentDefinitionId) {
        uamCurrentDefinition = UamEmptyDefinition();
        uamCurrentEffective = null;
        UamRenderDefinitionEditor();
        new bootstrap.Modal(document.getElementById('UamDefModal')).show();
        return;
    }
    UamApi('/API/Config/UdtDefinitions').then(function (defs) {
        uamDefinitions = defs || uamDefinitions;   // the slot/base pickers list every definition
        var match = (defs || []).filter(function (d) { return d.id === uamCurrentDefinitionId; })[0];
        if (!match) { UamError(); return; }
        uamCurrentDefinition = UamDtoFromRead(match);
        uamCurrentEffective = {
            variables: match.effectiveVariableMembers || [],
            alarms: match.effectiveAlarmMembers || [],
            events: match.effectiveEventMembers || [],
            scripts: match.effectiveScriptMembers || [],
            parameters: match.effectiveParameters || []
        };
        UamRenderDefinitionEditor();
        new bootstrap.Modal(document.getElementById('UamDefModal')).show();
    }).catch(function () { UamError(); });
}

function UamInput(collection, index, field, value, options) {
    options = options || {};
    var attrs = ' data-collection="' + collection + '" data-index="' + index + '" data-field="' + field + '"';
    if (options.checkbox) return '<input type="checkbox" class="form-check-input uam-member-input"' + attrs + (value ? ' checked' : '') + ' />';
    // A textarea is still a .uam-member-input with the same data-* triple, so the capture-phase
    // sync listener picks it up unchanged - it reads el.value, not the tag name.
    if (options.textarea) {
        // Textarea CONTENT is text, so UamEsc; the placeholder is an attribute, so UamEscAttr.
        return '<textarea class="uam-member-input uam-member-textarea"' + attrs + ' rows="' + (options.rows || 3) + '"'
            + (options.placeholder ? ' placeholder="' + UamEscAttr(options.placeholder) + '"' : '') + '>' + UamEsc(value) + '</textarea>';
    }
    return '<input class="uam-member-input"' + attrs + ' value="' + UamEscAttr(value) + '"'
        + (options.placeholder ? ' placeholder="' + UamEscAttr(options.placeholder) + '"' : '')
        + (options.title ? ' title="' + UamEscAttr(options.title) + '"' : '')
        + ' />';
}

function UamRemoveBtn(collection, index) {
    return '<button type="button" class="udt-row-remove uam-row-remove" data-collection="' + collection + '" data-index="' + index + '">&#10005;</button>';
}

// ==================== variable member detail drawer ====================

// Protocol extras, mirroring UdtService.ExtraFieldsFor. `fallback` is what the materialized
// row gets when the member leaves the field empty (and the point at which the row stays
// hand-tunable after a detach), so it doubles as the editor placeholder and as the value the
// instance detail reports. Protocol names are proper nouns: the tags need no translation.
// The definition editor shows all of these (a definition is not bound to one protocol); the
// instance detail knows its device type and shows only what applies.
// One group per protocol, mirroring UdtVariableMemberDto and UdtService.BuildDesiredVariable.
// `vocab` names a server-injected vocabulary (a projection of the validator's own constants, so
// the dropdown cannot drift); `fallback` is what the materialized row gets when an optional
// field is left empty, so it doubles as the placeholder and as what the instance detail reports.
// Fields without a fallback are required: the plan errors when they are missing.
var uamProtocolGroups = [
    { protocol: 'ModbusTcp', fields: [
        { prop: 'ModbusTcpType', label: 'type', vocab: 'canonical' },
        { prop: 'ModbusTcpAddress', label: 'address', placeholder: '%MW{BaseAddress}' },
        { prop: 'ModbusTcpStartNewBlock', label: 'field_startNewBlock', fallback: 'false' } ] },
    { protocol: 'EthernetIP', fields: [
        { prop: 'EthernetIPType', label: 'type', vocab: 'canonical' },
        { prop: 'EthernetIPAddress', label: 'address' } ] },
    { protocol: 'EthernetIPGeneric', fields: [
        { prop: 'EthernetIPGenericType', label: 'type', vocab: 'canonical' },
        { prop: 'EthernetIPGenericAddress', label: 'address', placeholder: '0x64/{Instance}/3' } ] },
    { protocol: 'BeckhoffAds', fields: [
        { prop: 'BeckhoffAdsType', label: 'type', vocab: 'canonical' },
        { prop: 'BeckhoffAdsAddress', label: 'address', placeholder: '{Instance}.rSpeed' } ] },
    { protocol: 'S7', fields: [
        { prop: 'S7Type', label: 'type', vocab: 's7' },
        { prop: 'S7Address', label: 'address', placeholder: 'DB{DbNumber}.DBD0' } ] },
    { protocol: 'Melsec', fields: [
        { prop: 'MelsecType', label: 'type', vocab: 'melsec' },
        { prop: 'MelsecAddress', label: 'address', placeholder: 'D{BaseAddress}' } ] },
    { protocol: 'OpcUa', fields: [
        { prop: 'OpcUaType', label: 'type', vocab: 'canonical' },
        { prop: 'OpcUaNodeId', label: 'address', placeholder: 'ns=2;s={Instance}_Speed' },
        { prop: 'OpcUaSamplingInterval', label: 'samplingInterval', fallback: '1000' },
        // Mirror of BuildDesiredVariable's default: the canonical list name, never bare "1"
        // (which landed in no subscription list, the historically broken value).
        { prop: 'OpcUaSubscription', label: 'subscription', fallback: 'Subscription 1' },
        { prop: 'OpcUaQueueSize', label: 'field_queueSize', fallback: '0' },
        { prop: 'OpcUaDiscardOldest', label: 'field_discardOldest', fallback: 'false' } ] },
    { protocol: 'Dnp3', fields: [
        { prop: 'Dnp3ObjectType', label: 'type', vocab: 'dnp3' },
        { prop: 'Dnp3IndexNumber', label: 'address', placeholder: '{Index}' },
        { prop: 'Dnp3Pulse', label: 'pulse', fallback: 'false' } ] },
    { protocol: 'Bacnet', fields: [
        { prop: 'BacnetObjectType', label: 'type', vocab: 'bacnet' },
        { prop: 'BacnetObjectInstance', label: 'address', placeholder: '{Instance}' },
        { prop: 'BacnetWritePriority', label: 'writePriority', fallback: '0' } ] },
    { protocol: 'Iec104', fields: [
        { prop: 'Iec104ObjectType', label: 'type', vocab: 'iec104' },
        { prop: 'Iec104InformationObjectAddress', label: 'address', placeholder: '{Ioa}' },
        { prop: 'Iec104Pulse', label: 'pulse', fallback: 'false' },
        { prop: 'Iec104CommandMode', label: 'commandMode', vocab: 'iec104CommandMode', fallback: 'Direct execute' } ] },
    { protocol: 'Mqtt', fields: [
        { prop: 'MqttType', label: 'type', fallback: 'REAL' },
        { prop: 'MqttSubscribeTopic', label: 'subscribeTopic' },
        { prop: 'MqttPublishTopic', label: 'publishTopic' } ] },
    { protocol: 'Local', fields: [
        { prop: 'LocalType', label: 'type', vocab: 'canonical' } ] }
];

function UamGroupFor(deviceType) {
    return uamProtocolGroups.filter(function (g) { return g.protocol === deviceType; })[0];
}

// A member "uses" a protocol when any field of its group is filled in; that is what decides
// which collapsibles open by default, so an existing member shows its own protocols first.
function UamGroupUsed(group, m) {
    return group.fields.some(function (f) { return String(UamField(m, f.prop.charAt(0).toLowerCase() + f.prop.slice(1)) || '').trim().length > 0; });
}

function UamVocab(name) {
    var all = window.UamVocabularies || {};
    return all[name] || [];
}

// The member row shows the fields you set on almost every member; everything else lives in a
// drawer so the table stays readable. Expanded state is by row index: the editor re-renders the
// whole table on add/remove/reorder, and index is all a working-copy row has (new rows have no Id).
// Keyed "Collection:index", NOT by bare index: Variables, Alarms and Events each have their own
// drawer now, and a shared index key would open alarm row 0 whenever variable row 0 was opened.
var uamExpandedMembers = {};

function UamDetailKey(collection, index) { return collection + ':' + index; }

function UamToggleMemberDetail(collection, index) {
    UamSyncDefinitionHeader();
    var key = UamDetailKey(collection, index);
    if (uamExpandedMembers[key]) delete uamExpandedMembers[key];
    else uamExpandedMembers[key] = true;
    UamRenderDefinitionEditor();
}

// The JSON preview collapses independently of the drawer that contains it: it is reference
// material, and left open it pushes the member rows below it off screen. Same index-keyed map and
// the same reset points as uamExpandedMembers, for the same reason - the key is positional.
var uamExpandedJson = {};

function UamToggleActionsJson(collection, index) {
    UamSyncDefinitionHeader();
    var key = UamDetailKey(collection, index);
    if (uamExpandedJson[key]) delete uamExpandedJson[key];
    else uamExpandedJson[key] = true;
    UamRenderDefinitionEditor();
}

// Drawer for an alarm or event member. Alarms and Events carry Actions, which the row has no
// column for and which the managed-row lock makes unreachable anywhere else: a materialized alarm
// cannot be edited on the Alarms page, so if the member cannot express Actions, a UDT alarm can
// never do anything. Same argument that put the per-protocol fields on the variable member.
//
// The value is a TOKENIZED TEMPLATE, not a finished action list - it may contain {Device},
// {Instance} and parameter tokens - so it is edited as text here and resolved, parsed and
// validated at materialization against the same ConfigValidator the config API uses. The editor
// stays a projection of the validator, never a second rulebook.
function UamConditionDetailRow(collection, m, i, colspan) {
    if (!uamExpandedMembers[UamDetailKey(collection, i)]) return '';

    var list = UamParseActions(m.Actions);
    var count = list === null ? null : list.length;

    return '<tr class="uam-member-detail"><td></td><td colspan="' + colspan + '"><div class="uam-detail-panel">'
        // Conditional membership, same field and meaning as on a variable member.
        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('instantiation')) + '</div>'
        + '<div class="uam-detail-grid">'
        + '<label class="uam-detail-field"><span>' + UamEsc(UamT('includeWhen')) + '</span>' + UamInput(collection, i, 'IncludeWhen', m.IncludeWhen, { placeholder: '{HasVFD}' }) + '</label>'
        + '</div>'
        + '<div class="uam-detail-hint">' + UamEsc(UamT('includeWhenHint')) + '</div>'
        + '</div>'

        // Array expansion: one alarm/event row per element, {Index} resolved per element in
        // condition, message and actions. Generic UamInput (not UamDetailField) because this
        // drawer serves both AlarmMembers and EventMembers.
        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('array')) + '</div>'
        + '<div class="uam-detail-grid">'
        + '<label class="uam-detail-field"><span>' + UamEsc(UamT('arraySize')) + '</span>' + UamInput(collection, i, 'ArrayCount', m.ArrayCount, { placeholder: '{StageCount}' }) + '</label>'
        + '<label class="uam-detail-field"><span>' + UamEsc(UamT('firstIndex')) + '</span>' + UamInput(collection, i, 'ArrayStart', m.ArrayStart, { placeholder: '0' }) + '</label>'
        + '</div>'
        + '<div class="uam-detail-hint">' + UamEsc(UamT('arrayConditionHint')) + '</div>'
        + '</div>'
        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('actions')) + '</div>'
        + '<div class="uam-actions-row">'
        + '<span class="uam-actions-summary">' + UamEsc(UamActionsSummary(m.Actions)) + '</span>'
        + '<button type="button" class="btn uam-btn" onclick="UamEditMemberActions(\'' + collection + '\', ' + i + ')">'
        + UamEsc(UamT('editActions'))
        // Only a real count earns a pill: null means unparseable (a number there would be invented)
        // and 0 is already said, better, by the "No actions" summary next to it.
        + (count ? ' <span class="uam-actions-count">' + count + '</span>' : '')
        + '</button>'
        + '</div>'
        + '<div class="uam-detail-hint">' + UamEsc(UamT('actionsHint')) + '</div>'
        + UamActionsJsonView(collection, i, m.Actions)
        + '</div></div></td><td></td></tr>';
}

// The stored JSON, shown read-only under the hint. The rich editor owns editing; this is the
// reference view for what export/import will carry, and the only place the raw template tokens are
// visible verbatim. Pretty-printed when it parses so it stays readable; malformed content is shown
// exactly as stored, because that is what has to be recognised in order to be fixed.
function UamActionsJsonView(collection, index, json) {
    var raw = String(json || '').trim();
    if (!raw) return '';

    var list = UamParseActions(json);
    var text = list === null ? raw : JSON.stringify(list, null, 2);
    // Malformed content opens regardless: it is the one case the reader has to see to act on.
    var open = list === null || !!uamExpandedJson[UamDetailKey(collection, index)];

    return '<div class="uam-actions-json' + (list === null ? ' invalid' : '') + (open ? ' open' : '') + '">'
        + '<div class="uam-actions-json-label" onclick="UamToggleActionsJson(\'' + collection + '\', ' + index + ')">'
        + '<span class="uam-detail-twisty' + (open ? ' open' : '') + '">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>'
        + UamEsc(UamT('actionsJson'))
        + '</div>'
        + (open ? '<pre>' + UamEsc(text) + '</pre>' : '')
        + '</div>';
}

// A one-line read of what the member's actions do, so the row says something without the JSON.
function UamActionsSummary(json) {
    var list = UamParseActions(json);
    if (list === null) return UamT('actionsInvalid');
    if (list.length === 0) return UamT('actionsNone');
    return list.map(function (a) { return a && a.Type ? a.Type : '?'; }).join(', ');
}

function UamParseActions(json) {
    if (!json || !String(json).trim()) return [];
    try {
        var parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
        return null;   // malformed - reported, never silently treated as "no actions"
    }
}

// Opens the product's own Actions editor (_SettingsModalPartial) on a member.
//
// It is driven with the literal id "EntityModal" on purpose: that is the one id for which the
// partial does NOT call site.js's Update(), which does not exist on the Envision page. The editor
// reads and writes a hidden input named "UpdateActions <id>", so the member's JSON is staged there
// and read back when the editor closes.
var uamActionsTarget = null;

function UamEditMemberActions(collection, index) {
    UamSyncDefinitionHeader();

    var field = document.getElementById('UpdateActions EntityModal');
    if (!field || typeof OpenActions !== 'function') { UamError(UamT('errorOccurred')); return; }

    var member = uamCurrentDefinition[collection][index];
    var parsed = UamParseActions(member.Actions);
    if (parsed === null && !confirm(UamT('actionsInvalidReplace'))) return;

    uamActionsTarget = { collection: collection, index: index };
    // Malformed JSON is dropped here rather than handed to the editor. The confirm above promised
    // it would be replaced, and staging it verbatim would let it survive a close that touches
    // nothing - the editor only rewrites this field for actions it could parse.
    field.value = parsed === null ? '' : (member.Actions || '');
    OpenActions('EntityModal');
}

// The editor has no completion callback for this id, so the write-back hangs off the modal closing.
// Hooked once; a close with no target (the editor opened from somewhere else) is ignored.
function UamWireActionsEditor() {
    var modal = document.getElementById('SettingsModal');
    if (!modal || modal.dataset.uamWired) return;
    modal.dataset.uamWired = '1';

    // Deferred to 'shown' because Bootstrap creates the backdrop as part of showing; guarded on
    // uamActionsTarget so opening this editor from anywhere else keeps its normal stacking.
    modal.addEventListener('shown.bs.modal', function () {
        if (uamActionsTarget) UamRaiseActionsEditor();
    });

    modal.addEventListener('hidden.bs.modal', function () {
        UamLowerActionsEditor();
        if (!uamActionsTarget) return;

        var field = document.getElementById('UpdateActions EntityModal');
        var target = uamActionsTarget;
        uamActionsTarget = null;
        if (!field) return;

        var member = uamCurrentDefinition && uamCurrentDefinition[target.collection]
            ? uamCurrentDefinition[target.collection][target.index] : null;
        if (!member) return;

        member.Actions = field.value || '';
        UamRenderDefinitionEditor();
    });
}

// SettingsModal is a SHARED partial (alarms, events, schedules, the designer), so its stacking
// cannot be raised globally - that would change how it sits on every one of those pages. The UAM
// sub-modals each pin themselves to z-index 11055 inline to clear the Asset Manager, which leaves
// the editor at Bootstrap's default 1055 and therefore BEHIND the definition editor that opened it.
// So the lift is applied per-open and reverted on close: the editor goes above whatever is
// currently topmost, and its backdrop just under it so the modal underneath is still dimmed and
// click-blocked.
function UamRaiseActionsEditor() {
    var modal = document.getElementById('SettingsModal');
    if (!modal) return;

    // Clear first: a backdrop still transitioning out from a previous close can otherwise keep a
    // stale lifted z-index and sit above the modal we are about to raise.
    UamLowerActionsEditor();

    var top = 0;
    [].forEach.call(document.querySelectorAll('.modal.show'), function (m) {
        if (m === modal) return;
        var z = parseInt(getComputedStyle(m).zIndex, 10);
        if (!isNaN(z) && z > top) top = z;
    });
    if (!top) return;   // nothing above us: leave the default alone

    modal.style.zIndex = (top + 20);
    modal.dataset.uamLifted = '1';

    // Bootstrap appends this modal's backdrop last, so the final one is ours.
    var backdrops = document.querySelectorAll('.modal-backdrop');
    var backdrop = backdrops[backdrops.length - 1];
    if (backdrop) {
        backdrop.style.zIndex = (top + 10);
        backdrop.dataset.uamLifted = '1';
    }
}

function UamLowerActionsEditor() {
    var modal = document.getElementById('SettingsModal');
    if (modal && modal.dataset.uamLifted) {
        modal.style.zIndex = '';
        delete modal.dataset.uamLifted;
    }
    [].forEach.call(document.querySelectorAll('.modal-backdrop[data-uam-lifted]'), function (b) {
        b.style.zIndex = '';
        delete b.dataset.uamLifted;
    });
}

// Array badge in the member row's name cell: the one array fact worth seeing without opening
// the drawer. Shows the raw (possibly tokenized) size, e.g. "x {StageCount}" - the resolved
// per-instance count belongs to the instance detail, not the definition editor.
function UamArrayBadge(m) {
    var count = String(m.ArrayCount || '').trim();
    if (!count) return '';
    return '<span class="udt-chip udt-chip-line uam-extra-tag" title="' + UamEscAttr(UamT('arrayMember')) + '">&#215;&nbsp;' + UamEsc(count) + '</span>';
}

function UamConditionTwisty(collection, index) {
    return '<span class="uam-detail-twisty' + (uamExpandedMembers[UamDetailKey(collection, index)] ? ' open' : '')
        + '" onclick="UamToggleMemberDetail(\'' + collection + '\', ' + index + ')">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>';
}

function UamDetailField(label, index, field, value, options) {
    return '<label class="uam-detail-field"><span>' + UamEsc(label) + UamReleasedMarker(index, field) + '</span>'
        + UamInput('VariableMembers', index, field, value, options) + '</label>';
}

// Released-by-default marker. The definition owns every field; this says which ones a
// materialized row starts out owning instead, so a setting that is a commissioning decision
// (a Modbus slave address, a Kafka remap) does not have to be overridden instance by instance.
// It is a property of the MEMBER, so it is edited here rather than on an instance, and it only
// affects rows at creation - re-asserting it on a push would wipe deliberate per-instance
// overrides. Name and Condition can never be released.
function UamReleasedMarker(index, field) {
    if (field === 'Name' || field === 'Condition') return '';
    var member = (uamCurrentDefinition && uamCurrentDefinition.VariableMembers || [])[index];
    if (!member) return '';
    var on = UamReleasedByDefaultSet(member)[field] === true;
    // One icon, colour carries the state: muted pen = the definition owns it, accent pen = each
    // instance owns it. Same pair the instance drawer uses, so a pen means the same thing on both
    // screens and only its colour says who holds the field.
    return '<button type="button" class="uam-released-btn' + (on ? ' on' : '') + '"'
        + ' title="' + UamEscAttr(UamT(on ? 'releasedByDefaultOn' : 'releasedByDefaultOff')) + '"'
        + ' onclick="UamToggleReleasedByDefault(' + index + ', &quot;' + UamEscAttr(field) + '&quot;)">'
        + '&#9998;</button>';
}

function UamReleasedByDefaultSet(member) {
    var set = {};
    String(member.ReleasedByDefault || '').split(',').forEach(function (f) {
        f = f.trim(); if (f) set[f] = true;
    });
    return set;
}

function UamToggleReleasedByDefault(index, field) {
    UamSyncDefinitionHeader();
    var member = (uamCurrentDefinition && uamCurrentDefinition.VariableMembers || [])[index];
    if (!member) return;
    var set = UamReleasedByDefaultSet(member);
    if (set[field]) delete set[field]; else set[field] = true;
    member.ReleasedByDefault = Object.keys(set).sort().join(',');
    UamRenderDefinitionEditor();
}

// Same field, plus the GUI's own [...] picker. The shared modals (UserGroupsModal, SampleGroupsModal,
// ConvertersModal, TrendGroupsModal in site.js) locate their target with
// el.parentElement.getElementsByTagName("input")[0], so the button and the input MUST share a direct
// parent - hence the wrapper div. They write el.value and dispatch 'focusout', which the member sync
// listener also handles. Values stay free text: a member may hold a {Token}, so the picker fills the
// field in, it does not constrain it.
function UamDetailFieldPicker(label, index, field, value, picker) {
    // Same ownership marker as a plain field - UserGroups, Trend Groups, Recipe Targets,
    // Converter and SampleGroup are ordinary owned member fields; only their editor differs.
    return '<label class="uam-detail-field"><span>' + UamEsc(label) + UamReleasedMarker(index, field) + '</span>'
        + '<div class="uam-detail-picker">'
        + UamInput('VariableMembers', index, field, value)
        + '<button type="button" class="uam-detail-pickerbtn" onclick="' + picker + '(this)" tabindex="-1">...</button>'
        + '</div></label>';
}

// One collapsible per protocol. A definition is not bound to a protocol, so the editor shows
// every group; collapsed by default unless the member already uses that protocol, which keeps
// the noise down without hiding what a member actually declares.
var uamOpenGroups = {};

// Stores the NEGATED state the header was drawn with, instead of expressing "closed" by deleting
// the key. The default for a protocol the member already uses is OPEN, so absence meant open too
// and such a group re-opened on every click - its twisty was a dead control and a member with
// several protocols filled in could never be shortened.
function UamToggleProtocolGroup(index, protocol, open) {
    UamSyncDefinitionHeader();
    uamOpenGroups[index + '|' + protocol] = !open;
    UamRenderDefinitionEditor();
}

function UamProtocolGroupHtml(group, m, i) {
    var key = i + '|' + group.protocol;
    var used = UamGroupUsed(group, m);
    var open = uamOpenGroups[key] !== undefined ? uamOpenGroups[key] : used;

    var head = '<div class="uam-detail-title uam-group-head' + (open ? ' open' : '') + '" onclick="UamToggleProtocolGroup(' + i + ',\'' + group.protocol + '\',' + (open ? 'true' : 'false') + ')">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
        + UamEsc(group.protocol)
        + (used ? '<span class="udt-chip udt-chip-ok uam-extra-tag">&#10003;</span>' : '')
        + '</div>';
    if (!open) return '<div class="uam-detail-group">' + head + '</div>';

    var fields = group.fields.map(function (f) {
        var value = m[f.prop];
        if (f.vocab) return UamVocabField(UamT(f.label), i, f.prop, value, f.vocab);
        return UamDetailField(UamT(f.label), i, f.prop, value, { placeholder: f.fallback || f.placeholder || '' });
    }).join('');

    return '<div class="uam-detail-group">' + head + '<div class="uam-detail-grid">' + fields + '</div></div>';
}

// Dropdown over a server-injected vocabulary. A stored value outside it is kept as an extra
// option so the row round-trips unchanged rather than being silently rewritten.
function UamVocabField(label, index, field, value, vocabName) {
    var list = UamVocab(vocabName);
    var options = ['<option value=""' + (value ? '' : ' selected') + '></option>'].concat(list.map(function (t) {
        return '<option' + (t === value ? ' selected' : '') + '>' + UamEsc(t) + '</option>';
    }));
    if (value && list.indexOf(value) < 0) options.push('<option selected>' + UamEsc(value) + '</option>');
    // Third field variant, same ownership marker: a vocabulary dropdown is still an ordinary
    // owned member field.
    return '<label class="uam-detail-field"><span>' + UamEsc(label) + UamReleasedMarker(index, field) + '</span>'
        + '<select class="uam-member-input" data-collection="VariableMembers" data-index="' + index + '" data-field="' + field + '">'
        + options.join('') + '</select></label>';
}

function UamMemberDetailRow(m, i) {
    if (!uamExpandedMembers[UamDetailKey('VariableMembers', i)]) return '';
    // Spans the row between the drag handle and the remove button: 7 header columns
    // (handle + Enable/Name/Device/Units/Historian + remove), so the drawer body covers the 5 in
    // between. This colspan must be retuned whenever a member column is added or removed.
    return '<tr class="uam-member-detail"><td></td><td colspan="5"><div class="uam-detail-panel">'
        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('general')) + '</div>'
        + '<div class="uam-detail-grid">'
        + UamDetailField(UamT('description'), i, 'Description', m.Description)
        + UamDetailFieldPicker(UamT('userGroups'), i, 'UserGroups', m.UserGroups, 'UserGroupsModal')
        // Trend groups and the two recipe fields are General in the Edit Variable dialog, not
        // Historian - they drive trending and recipes, neither of which is the historian.
        + UamDetailFieldPicker(UamT('trendGroups'), i, 'TrendGroups', m.TrendGroups, 'TrendGroupsModal')
        + UamDetailField(UamT('recipeParameterName'), i, 'RecipeParameterName', m.RecipeParameterName)
        + UamDetailFieldPicker(UamT('recipeTargets'), i, 'RecipeTargets', m.RecipeTargets, 'RecipesModal')
        + '</div></div>'

        // Whether this member exists for an instance at all, as opposed to Enable (which ships
        // the row switched off). Its own group rather than a field in Array: the two answer
        // different questions, and an array member can be excluded as a whole.
        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('instantiation')) + '</div>'
        + '<div class="uam-detail-grid">'
        + UamDetailField(UamT('includeWhen'), i, 'IncludeWhen', m.IncludeWhen, { placeholder: '{HasVFD}' })
        + '</div>'
        + '<div class="uam-detail-hint">' + UamEsc(UamT('includeWhenHint')) + '</div>'
        + '</div>'

        // Array expansion. Both fields are tokenized like every other member field; the plan
        // resolves and range-checks them at push, so the editor stays a projection of the
        // validator and offers no second rulebook here.
        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('array')) + '</div>'
        + '<div class="uam-detail-grid">'
        + UamDetailField(UamT('arraySize'), i, 'ArrayCount', m.ArrayCount, { placeholder: '{StageCount}' })
        + UamDetailField(UamT('firstIndex'), i, 'ArrayStart', m.ArrayStart, { placeholder: '0' })
        + '</div>'
        + '<div class="uam-detail-hint">' + UamEsc(UamT('arrayHint')) + '</div>'
        + '</div>'

        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('scaling')) + '</div>'
        + '<div class="uam-detail-grid">'
        + UamDetailFieldPicker(UamT('converter'), i, 'Converter', m.Converter, 'ConvertersModal')
        + UamDetailField(UamT('minRaw'), i, 'MinRaw', m.MinRaw)
        + UamDetailField(UamT('maxRaw'), i, 'MaxRaw', m.MaxRaw)
        + UamDetailField(UamT('minScaled'), i, 'MinScaled', m.MinScaled)
        + UamDetailField(UamT('maxScaled'), i, 'MaxScaled', m.MaxScaled)
        + '</div></div>'

        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('historian')) + '</div>'
        + '<div class="uam-detail-grid">'
        + UamDetailField(UamT('deadband'), i, 'Deadband', m.Deadband)
        + UamDetailField(UamT('minimumTime'), i, 'MinimumTime', m.MinimumTime)
        + UamDetailFieldPicker(UamT('sampleGroup'), i, 'SampleGroup', m.SampleGroup, 'SampleGroupsModal')
        + '</div></div>'

        // Gateway: how OUR servers expose this variable, not how a driver reads it. Protocol
        // agnostic - the runtime copies all three onto every variable regardless of device type -
        // which is why they are their own group and not filed under a protocol heading.
        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('gateway')) + '</div>'
        + '<div class="uam-detail-grid">'
        + UamDetailField(UamT('opcUaLabel'), i, 'OpcUa', m.OpcUa, { checkbox: true })
        + UamDetailField(UamT('writeable'), i, 'Writeable', m.Writeable, { checkbox: true })
        + UamDetailField(UamT('field_modbusAddress'), i, 'ModbusAddress', m.ModbusAddress)
        + '</div></div>'

        + '<div class="uam-detail-group"><div class="uam-detail-title">' + UamEsc(UamT('kafka')) + '</div>'
        + '<div class="uam-detail-grid">'
        + UamDetailField(UamT('field_kafkaDevice'), i, 'KafkaDevice', m.KafkaDevice)
        + UamDetailField(UamT('field_kafkaProducer'), i, 'KafkaProducer', m.KafkaProducer)
        + UamDetailField(UamT('field_kafkaConsumer'), i, 'KafkaConsumer', m.KafkaConsumer)
        + UamDetailField(UamT('field_kafkaRemapDevice'), i, 'KafkaRemapDevice', m.KafkaRemapDevice)
        + UamDetailField(UamT('field_kafkaRemapVariable'), i, 'KafkaRemapVariable', m.KafkaRemapVariable)
        + '</div></div>'

        + uamProtocolGroups.map(function (g) { return UamProtocolGroupHtml(g, m, i); }).join('')
        + '</div></td><td></td></tr>';
}

// Drag handle cell: rows reorder within their table; the array order is what Save persists
// (the API stamps SortOrder from array position). Handle-only dragging keeps text selection
// working inside the member inputs.
function UamDragCell(collection, index) {
    // Inline SVG rather than a glyph: the old '&#8942;&#8942;' needed letter-spacing:-3px to sit in
    // an 18px cell, which overlapped the two dot columns into something that read as neither dots
    // nor stripes. Three horizontal bars are unambiguous at this size and scale with the font.
    return '<td class="uam-member-drag" draggable="true" data-collection="' + collection + '" data-index="' + index + '" title="' + UamEsc(UamT('dragToReorder')) + '">'
        + '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" /></svg></td>';
}

// Export / Import buttons rendered under each member tab next to + Add. Export offers
// JSON or CSV; import takes either (detected by extension/content).
// The tab tools sit at the BOTTOM of the pane, under the member table, so the space below the
// button is only ever the modal's padding and footer while the space above always holds the table
// and header. A downward menu therefore overflows the modal whenever the table is short - most
// obviously with a single row - and needs scrolling to reach. `dropup` is not a workaround for
// that case, it is the correct direction for a control anchored to the bottom of its container;
// Bootstrap still flips it back down if it ever runs out of room above.
function UamTabTools(collection) {
    // Two plain buttons rather than an Export dropdown, matching the Push dialog's toolbar.
    //
    // The dropdown could not be made reliable here: these tools sit at the bottom of
    // .udt-editor-scroll, which is `overflow:auto` and collapses to ~68px when the list is empty,
    // so the menu was clipped by the scroll container whichever way it opened (downward it fell
    // past the modal, upward it was cut off above the pane). Popper cannot escape an overflow
    // ancestor - only removing the popup or moving it out of the DOM subtree can - and two buttons
    // are fewer clicks anyway.
    //
    // Export is disabled on an empty list: there is nothing to write, and a file containing only a
    // header reads like a successful export of nothing.
    var count = ((uamCurrentDefinition && uamCurrentDefinition[collection]) || []).length;
    var disabled = count === 0 ? ' disabled title="' + UamEsc(UamT('exportNothing')) + '"' : '';

    return '<button type="button" class="btn uam-btn udt-add-row"' + disabled
        + ' onclick="UamExportTab(\'' + collection + '\', \'json\')">' + UamEsc(UamT('exportJson')) + '</button> '
        + '<button type="button" class="btn uam-btn udt-add-row"' + disabled
        + ' onclick="UamExportTab(\'' + collection + '\', \'csv\')">' + UamEsc(UamT('exportCsv')) + '</button> '
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamImportTab(\'' + collection + '\')" title="' + UamEsc(UamT('importMergeInfo')) + '">' + UamEsc(UamT('importLabel')) + '</button>';
}

// CSV follows the project's CSVDelimiter parameter (Parameters page), like every other CSV
// the product writes; quotes only when needed. Falls back to a comma, which is the
// parameter's own seeded default, if the page did not inject it.
// Named apart from the injected window.UamCsvDelimiter global on purpose: a top-level
// function declaration IS a window property, so sharing the name would have the partial's
// inline script overwrite this function with the string.
function UamDelimiter() {
    return window.UamCsvDelimiter || ',';
}

function UamCsvEscape(value, delimiter) {
    var text = value == null ? '' : String(value);
    if (text.indexOf(delimiter) >= 0 || text.indexOf('"') >= 0 || text.indexOf('\n') >= 0 || text.indexOf('\r') >= 0) {
        return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
}

function UamRowsToCsv(collection, rows) {
    var delimiter = UamDelimiter();
    var fields = Object.keys(UamMemberDefaults(collection));
    var lines = [fields.join(delimiter)];
    rows.forEach(function (row) {
        lines.push(fields.map(function (f) { return UamCsvEscape(row[f], delimiter); }).join(delimiter));
    });
    return lines.join('\r\n');
}

// Minimal CSV parser: quoted fields with "" escapes, CRLF/LF, and a delimiter detected from
// the header row. Import stays deliberately tolerant rather than demanding the project's
// CSVDelimiter: files also arrive from Excel or another project. The configured delimiter is
// simply a candidate, and wins ties. The scanner compares single characters, so a multi-
// character CSVDelimiter is not a candidate here (export still honours it).
function UamParseCsv(text) {
    // Strip a UTF-8 BOM (Excel exports carry one).
    text = String(text).replace(new RegExp('^' + String.fromCharCode(0xFEFF)), '');
    var firstLine = text.split(/\r?\n/, 1)[0] || '';

    var configured = UamDelimiter();
    var candidates = [';', ',', '\t'];
    if (configured.length === 1 && candidates.indexOf(configured) < 0) candidates.push(configured);
    // Configured first: ties resolve to what this project writes.
    if (configured.length === 1) candidates.sort(function (a, b) { return (a === configured ? -1 : 0) - (b === configured ? -1 : 0); });

    var delimiter = candidates[0];
    var best = -1;
    candidates.forEach(function (c) {
        var count = firstLine.split(c).length - 1;
        if (count > best) { best = count; delimiter = c; }
    });

    var records = [];
    var record = [];
    var field = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') inQuotes = false;
            else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === delimiter) { record.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            record.push(field); field = '';
            if (record.length > 1 || record[0] !== '') records.push(record);
            record = [];
        }
        else field += c;
    }
    record.push(field);
    if (record.length > 1 || record[0] !== '') records.push(record);
    if (records.length < 2) return [];

    var headers = records[0].map(function (h) { return h.trim(); });
    return records.slice(1).map(function (r) {
        var row = {};
        headers.forEach(function (h, index) { if (h) row[h] = r[index] !== undefined ? r[index] : ''; });
        return row;
    });
}

// CSV values arrive as strings; coerce them to the field types of the collection's
// defaults so booleans and numbers merge correctly.
function UamCoerceRow(collection, row) {
    var defaults = UamMemberDefaults(collection);
    var out = {};
    Object.keys(row).forEach(function (k) {
        var key = k.charAt(0).toUpperCase() + k.slice(1);
        var value = row[k];
        if (typeof defaults[key] === 'boolean' && typeof value === 'string') {
            out[key] = value.trim().toLowerCase() === 'true' || value.trim() === '1';
        } else if (typeof defaults[key] === 'number' && typeof value === 'string') {
            out[key] = Number(value.replace(',', '.')) || 0;
        } else {
            out[key] = value;
        }
    });
    return out;
}

function UamExportTab(collection, format) {
    UamSyncDefinitionHeader();
    var rows = uamCurrentDefinition[collection];
    var content, mime, ext;
    if (format === 'csv') {
        content = UamRowsToCsv(collection, rows);
        mime = 'text/csv;charset=utf-8';
        ext = '.csv';
    } else {
        // UamMembersForWire, not the working rows: an exported file must not carry __memberId, the
        // machine-local row id this editor tracks internally (uamMemberIdFields).
        content = JSON.stringify(UamMembersForWire(rows), null, 2);
        mime = 'application/json';
        ext = '.json';
    }
    UamDownload((uamCurrentDefinition.Name || 'UdtDefinition') + '_' + collection + ext, mime, content);
}

// Import merges into the working copy by natural key (Name for parameters/variables,
// Condition for alarms/events): matching rows are updated, new rows appended. Nothing is
// persisted until Save, so a wrong file is undone by Cancel.
function UamMergeImportedRows(collection, rows) {
    var keyField = (collection === 'AlarmMembers' || collection === 'EventMembers') ? 'Condition' : 'Name';
    UamSyncDefinitionHeader();
    var list = uamCurrentDefinition[collection];
    rows.forEach(function (row) {
        if (!row || typeof row !== 'object') return;
        // Accept both DTO-cased and camelCase field names from exported files.
        var clean = {};
        Object.keys(row).forEach(function (k) { clean[k.charAt(0).toUpperCase() + k.slice(1)] = row[k]; });
        delete clean.Id;
        delete clean.UdtDefinitionId;
        delete clean.SortOrder;
        // Same reason as Id, for the internal member id (uamMemberIdFields): a file must never
        // reassign identity. A matched row keeps the id it already has, an appended row gets none.
        delete clean.__memberId;
        var key = clean[keyField];
        if (key === undefined || key === null || key === '') return;
        var match = list.filter(function (item) { return item[keyField] === key; })[0];
        if (match) Object.assign(match, clean);
        else list.push(Object.assign({}, UamMemberDefaults(collection), clean));
    });
    UamRenderDefinitionEditor();
}

function UamImportTab(collection) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,application/json,text/csv';
    input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            var text = String(reader.result);
            var rows;
            var looksJson = /\.json$/i.test(file.name) || /^[\[\{]/.test(text.trim());
            if (looksJson) {
                try { rows = JSON.parse(text); } catch (e) { UamError(UamT('errorOccurred')); return; }
                if (!Array.isArray(rows)) { UamError(UamT('errorOccurred')); return; }
            } else {
                rows = UamParseCsv(text).map(function (row) { return UamCoerceRow(collection, row); });
            }
            UamMergeImportedRows(collection, rows);
        };
        reader.readAsText(file);
    };
    input.click();
}

function UamRenderDefinitionEditor() {
    var d = uamCurrentDefinition;
    document.getElementById('UamDefTitle').textContent = uamCurrentDefinitionId ? d.Name : UamT('udtDefinitions');
    document.getElementById('UamDefName').value = d.Name;
    document.getElementById('UamDefDescription').value = d.Description;

    // Base type picker: every definition except this one. Deeper cycles (A -> B -> A) are the
    // validator's job and come back as UdtCompositionCycle on Save.
    var baseSelect = document.getElementById('UamDefBase');
    if (baseSelect) {
        baseSelect.innerHTML = '<option value="">' + UamEsc(UamT('noBaseType')) + '</option>'
            + uamDefinitions
                .filter(function (x) { return x.name !== d.Name; })
                .map(function (x) { return x.name; })
                .sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); })
                .map(function (n) { return '<option value="' + UamEscAttr(n) + '"' + (d.BaseDefinition === n ? ' selected' : '') + '>' + UamEsc(n) + '</option>'; })
                .join('');
        baseSelect.value = d.BaseDefinition || '';
    }

    document.getElementById('UamPaneParams').innerHTML =
        '<table class="udt-members"><thead><tr><th></th><th>' + UamEsc(UamT('name')) + '</th><th>' + UamEsc(UamT('label')) + '</th><th>' + UamEsc(UamT('type')) + '</th><th>' + UamEsc(UamT('defaultValue')) + '</th><th></th></tr></thead><tbody>'
        + d.Parameters.map(function (p, i) {
            return '<tr data-collection="Parameters" data-index="' + i + '">' + UamDragCell('Parameters', i)
                + '<td>' + UamInput('Parameters', i, 'Name', p.Name) + '</td><td>' + UamInput('Parameters', i, 'Label', p.Label) + '</td>'
                // value= is mandatory here: the sync listener stores el.value and the backend
                // compares Type == "Number" exactly, so without it a translated option label would
                // BE the stored value and numeric validation would silently stop working in every
                // non-English locale.
                + '<td><select class="uam-member-input" data-collection="Parameters" data-index="' + i + '" data-field="Type">'
                + '<option value="Text"' + (p.Type === 'Text' ? ' selected' : '') + '>' + UamEsc(UamT('typeText')) + '</option>'
                + '<option value="Number"' + (p.Type === 'Number' ? ' selected' : '') + '>' + UamEsc(UamT('typeNumber')) + '</option>'
                + '<option value="Device"' + (p.Type === 'Device' ? ' selected' : '') + '>' + UamEsc(UamT('device')) + '</option></select></td>'
                // A Device parameter's default is typed like every other default: a type is often
                // authored before its devices exist, and an inventory list could only offer what is
                // already there.
                + '<td>' + UamInput('Parameters', i, 'DefaultValue', p.DefaultValue) + '</td>'
                + '<td>' + UamRemoveBtn('Parameters', i) + '</td></tr>';
        }).join('') + '</tbody></table>'
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamAddRow(\'Parameters\')">+ ' + UamEsc(UamT('add')) + '</button> ' + UamTabTools('Parameters')
        // No {Device} line here: it is NOT a built-in, it is just the usual NAME for a Device-typed
        // parameter, and showing it beside the built-ins in the same code style said otherwise.
        + '<p style="font-size:12px;color:var(--ThemeFontColor2);margin-top:8px;">' + UamEsc(UamT('builtInTokens')) + ' <code>{Instance}</code> <code>{Asset}</code> <code>{Index}</code></p>';

    document.getElementById('UamPaneVars').innerHTML =
        // No Type/Address column: those are per protocol now and live in the drawer's groups.
        // Writeable lives in the drawer's General group: it is a per-point detail, not something
        // you scan the list for, so it does not earn a column next to Enable/Name/Units/Historian.
        '<table class="udt-members"><thead><tr><th></th><th>' + UamEsc(UamT('enable')) + '</th><th>' + UamEsc(UamT('name')) + '</th><th>' + UamEsc(UamT('device')) + '</th><th>' + UamEsc(UamT('units')) + '</th><th>' + UamEsc(UamT('historian')) + '</th><th></th></tr></thead><tbody>'
        + d.VariableMembers.map(function (m, i) {
            return '<tr data-collection="VariableMembers" data-index="' + i + '">' + UamDragCell('VariableMembers', i)
                + '<td>' + UamInput('VariableMembers', i, 'Enable', m.Enable, { checkbox: true }) + '</td>'
                + '<td class="uam-member-namecell">'
                + '<span class="uam-detail-twisty' + (uamExpandedMembers[UamDetailKey('VariableMembers', i)] ? ' open' : '') + '" onclick="UamToggleMemberDetail(\'VariableMembers\', ' + i + ')">'
                + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>'
                + UamInput('VariableMembers', i, 'Name', m.Name, { placeholder: '{Device}.{Instance}_Speed' }) + UamArrayBadge(m) + '</td>'
                + '<td>' + UamInput('VariableMembers', i, 'DeviceName', m.DeviceName, { title: UamT('memberDeviceHint') }) + '</td>'
                + '<td>' + UamInput('VariableMembers', i, 'Units', m.Units) + '</td>'
                + '<td>' + UamInput('VariableMembers', i, 'Historian', m.Historian, { checkbox: true }) + '</td>'
                + '<td>' + UamRemoveBtn('VariableMembers', i) + '</td></tr>'
                + UamMemberDetailRow(m, i);
        }).join('') + '</tbody></table>'
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamAddRow(\'VariableMembers\')">+ ' + UamEsc(UamT('add')) + '</button> ' + UamTabTools('VariableMembers')
        + '<p style="font-size:12px;color:var(--ThemeFontColor2);margin-top:8px;">' + UamEsc(UamT('memberDeviceHint')) + '</p>'
        + UamCompositionRows('variables');

    document.getElementById('UamPaneAlarms').innerHTML =
        '<table class="udt-members"><thead><tr><th></th><th>' + UamEsc(UamT('enable')) + '</th><th>' + UamEsc(UamT('condition')) + '</th><th>' + UamEsc(UamT('message')) + '</th><th>' + UamEsc(UamT('severity')) + '</th><th>' + UamEsc(UamT('alarmGroups')) + '</th><th></th></tr></thead><tbody>'
        + d.AlarmMembers.map(function (m, i) {
            return '<tr data-collection="AlarmMembers" data-index="' + i + '">' + UamDragCell('AlarmMembers', i)
                + '<td>' + UamInput('AlarmMembers', i, 'Enable', m.Enable, { checkbox: true }) + '</td>'
                + '<td class="uam-member-namecell">' + UamConditionTwisty('AlarmMembers', i)
                + UamInput('AlarmMembers', i, 'Condition', m.Condition, { placeholder: '{Device}.{Instance}_Speed > {HighLimit}' }) + UamArrayBadge(m) + '</td>'
                + '<td>' + UamInput('AlarmMembers', i, 'Message', m.Message, { placeholder: '{Asset}: message' }) + '</td>'
                + '<td>' + UamInput('AlarmMembers', i, 'Severity', m.Severity) + '</td>'
                + '<td>' + UamInput('AlarmMembers', i, 'AlarmGroups', m.AlarmGroups) + '</td>'
                + '<td>' + UamRemoveBtn('AlarmMembers', i) + '</td></tr>'
                + UamConditionDetailRow('AlarmMembers', m, i, 5);
        }).join('') + '</tbody></table>'
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamAddRow(\'AlarmMembers\')">+ ' + UamEsc(UamT('add')) + '</button> ' + UamTabTools('AlarmMembers')
        + UamCompositionRows('alarms');

    document.getElementById('UamPaneEvents').innerHTML =
        '<table class="udt-members"><thead><tr><th></th><th>' + UamEsc(UamT('enable')) + '</th><th>' + UamEsc(UamT('condition')) + '</th><th>' + UamEsc(UamT('message')) + '</th><th></th></tr></thead><tbody>'
        + d.EventMembers.map(function (m, i) {
            return '<tr data-collection="EventMembers" data-index="' + i + '">' + UamDragCell('EventMembers', i)
                + '<td>' + UamInput('EventMembers', i, 'Enable', m.Enable, { checkbox: true }) + '</td>'
                // Placeholders match the Alarms tab. The condition example is the one the DTO
                // already documents (UdtEventMemberDto.Condition), not a new invention, so the
                // hint the editor shows and the hint MCP/Swagger show cannot drift apart.
                + '<td class="uam-member-namecell">' + UamConditionTwisty('EventMembers', i)
                + UamInput('EventMembers', i, 'Condition', m.Condition, { placeholder: '{Device}.{Instance}_RunHours > 8000' }) + UamArrayBadge(m) + '</td>'
                + '<td>' + UamInput('EventMembers', i, 'Message', m.Message, { placeholder: '{Asset}: message' }) + '</td>'
                + '<td>' + UamRemoveBtn('EventMembers', i) + '</td></tr>'
                + UamConditionDetailRow('EventMembers', m, i, 3);
        }).join('') + '</tbody></table>'
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamAddRow(\'EventMembers\')">+ ' + UamEsc(UamT('add')) + '</button> ' + UamTabTools('EventMembers')
        + UamCompositionRows('events');

    UamRenderScriptsPane();
    UamRenderSlotsPane();
    UamRenderSymbolPane();
}

/// The Scripts tab (type-owned logic): trigger fields per row, the shared Python body in a
/// full-width editor row underneath. The body is NOT tokenized - it reads per-instance values
/// with GetParam('...') - while Interval/RunWhen/RunAtStartup are tokenized like member fields.
function UamRenderScriptsPane() {
    var pane = document.getElementById('UamPaneScripts');
    if (!pane) return;
    var d = uamCurrentDefinition;

    pane.innerHTML =
        '<table class="udt-members"><thead><tr><th></th><th>' + UamEsc(UamT('enable')) + '</th><th>' + UamEsc(UamT('name')) + '</th><th>Interval (ms)</th><th>RunWhen</th><th>' + UamEsc(UamT('runAtStartup')) + '</th><th></th></tr></thead><tbody>'
        + d.ScriptMembers.map(function (m, i) {
            return '<tr data-collection="ScriptMembers" data-index="' + i + '">' + UamDragCell('ScriptMembers', i)
                + '<td>' + UamInput('ScriptMembers', i, 'Enable', m.Enable, { checkbox: true }) + '</td>'
                + '<td>' + UamInput('ScriptMembers', i, 'Name', m.Name, { placeholder: 'MaintenanceCheck' }) + '</td>'
                + '<td>' + UamInput('ScriptMembers', i, 'Interval', m.Interval, { placeholder: '{ScanRate}' }) + '</td>'
                + '<td>' + UamInput('ScriptMembers', i, 'RunWhen', m.RunWhen, { placeholder: '{Instance}_Fault = 1' }) + '</td>'
                + '<td>' + UamInput('ScriptMembers', i, 'RunAtStartup', m.RunAtStartup, { placeholder: 'false' }) + '</td>'
                + '<td>' + UamRemoveBtn('ScriptMembers', i) + '</td></tr>'
                + '<tr class="uam-member-detailrow"><td></td><td colspan="6">'
                + UamInput('ScriptMembers', i, 'Script', m.Script, { textarea: true, rows: 8, placeholder: "speed = GetFloatValue(GetParam('Instance') + '_Speed')" })
                + '</td></tr>';
        }).join('') + '</tbody></table>'
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamAddRow(\'ScriptMembers\')">+ ' + UamEsc(UamT('add')) + '</button>'
        + '<p style="font-size:12px;color:var(--ThemeFontColor2);margin-top:8px;">' + UamEsc(UamT('scriptsInfo')) + '</p>'
        + UamCompositionRows('scripts');
}

// ==================== COMPOSITION (base type + slots) ====================
//
// Storage and the write contract hold what the user AUTHORED: the working copy's collections are
// this type's OWN members, and inherited/slot members arrive only through the GET-only effective
// projection (uamCurrentEffective). They are rendered read-only and never enter
// uamCurrentDefinition - merged in, the whole-DTO save would write them back as own members and
// permanently fork the base.

/// Read-only listing of the inherited and slot members for one editor tab, badged with their
/// origin and offering a jump to the definition that owns them.
function UamCompositionRows(kind) {
    if (!uamCurrentEffective) return '';
    var entries = (uamCurrentEffective[kind] || []).filter(function (e) { return (e.origin || '') !== 'Own'; });
    if (!entries.length) return '';

    var rows = entries.map(function (e) {
        var m = e.member || {};
        var slotPath = e.slotPath || '';
        var source = e.sourceDefinition || '';
        var badge = slotPath
            ? '<span class="udt-chip udt-chip-line" title="' + UamEscAttr(UamT('slot')) + '">' + UamEsc(slotPath) + ' &rarr; ' + UamEsc(source) + '</span>'
            : '<span class="udt-chip udt-chip-line" title="' + UamEscAttr(UamT('inheritedFrom')) + '">' + UamEsc(UamT('inherited')) + ': ' + UamEsc(source) + '</span>';
        var key = (kind === 'variables' || kind === 'scripts') ? (UamField(m, 'name') || '') : (UamField(m, 'condition') || '');
        var extra = kind === 'variables' ? (UamField(m, 'deviceName') || '') : kind === 'scripts' ? (UamField(m, 'description') || '') : (UamField(m, 'message') || '');
        return '<tr><td class="uam-code">' + UamEsc(key) + '</td><td>' + UamEsc(extra) + '</td><td>' + badge
            + ' <button type="button" class="btn uam-btn" onclick="UamOpenDefinitionEditorByName(\'' + UamEsc(source).replace(/'/g, "\\'") + '\')">' + UamEsc(UamT('edit')) + ' ' + UamEsc(source) + '</button></td></tr>';
    }).join('');

    return '<div style="margin-top:14px;"><b>' + UamEsc(UamT('compositionMembers')) + '</b>'
        + '<table class="udt-members udt-detail-table"><tbody>' + rows + '</tbody></table>'
        + '<p style="font-size:12px;color:var(--ThemeFontColor2);">' + UamEsc(UamT('compositionMembersHint')) + '</p></div>';
}

function UamOpenDefinitionEditorByName(name) {
    var match = uamDefinitions.filter(function (d) { return d.name === name; })[0];
    if (match) UamOpenDefinitionEditor(match.id);
}

function UamBaseChanged() {
    // The capture-phase sync does not cover the header (no data-collection), so read it here.
    UamSyncDefinitionHeader();
}

/// The Slots tab: one row per slot (Name | Contained definition | IncludeWhen) plus a mapping
/// sub-table generated from the CONTAINED type's declared effective parameters - the Symbol tab
/// pattern, where rows come from the master's declared replacers rather than free-text JSON.
function UamRenderSlotsPane() {
    var pane = document.getElementById('UamPaneSlots');
    if (!pane) return;
    var d = uamCurrentDefinition;

    var definitionNames = uamDefinitions
        .filter(function (x) { return x.name !== d.Name; })
        .map(function (x) { return x.name; })
        .sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });

    pane.innerHTML =
        '<table class="udt-members"><thead><tr><th></th><th>' + UamEsc(UamT('name')) + '</th><th>' + UamEsc(UamT('slotDefinition')) + '</th><th>IncludeWhen</th><th></th></tr></thead><tbody>'
        + d.Slots.map(function (s, i) {
            // data-slot-mappable marks a slot whose contained type IS known here, so the mapping
            // rows below it are the complete picture and UamSyncSlotsPane may prune from them.
            return '<tr data-collection="Slots" data-index="' + i + '"'
                + (UamSlotInnerDefinition(s) ? ' data-slot-mappable="1"' : '') + '>' + UamDragCell('Slots', i)
                + '<td>' + UamInput('Slots', i, 'Name', s.Name, { placeholder: 'MotorA' }) + '</td>'
                + '<td><select class="uam-member-input" data-collection="Slots" data-index="' + i + '" data-field="Definition" onchange="UamSlotDefinitionChanged(this)">'
                + '<option value=""></option>'
                + definitionNames.map(function (n) { return '<option value="' + UamEscAttr(n) + '"' + (s.Definition === n ? ' selected' : '') + '>' + UamEsc(n) + '</option>'; }).join('')
                + '</select></td>'
                + '<td>' + UamInput('Slots', i, 'IncludeWhen', s.IncludeWhen, { placeholder: '{HasSecondMotor}' }) + '</td>'
                + '<td>' + UamRemoveBtn('Slots', i) + '</td></tr>'
                + UamSlotMappingRow(s, i);
        }).join('') + '</tbody></table>'
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamAddSlot()">+ ' + UamEsc(UamT('add')) + '</button>'
        + '<p style="font-size:12px;color:var(--ThemeFontColor2);margin-top:8px;">' + UamEsc(UamT('slotsInfo')) + '</p>';
}

/// The contained type a slot's mapping rows are generated from. Null when the slot names no type
/// or that type is not in the loaded list: in both cases the rows on screen are NOT a complete
/// picture of the mapping, so nothing may be pruned from them.
function UamSlotInnerDefinition(s) {
    if (!s || !s.Definition) return null;
    return uamDefinitions.filter(function (x) { return x.name === s.Definition; })[0] || null;
}

/// The mapping sub-table of one slot: one row per parameter the CONTAINED type declares
/// (effective, so a contained type's inherited parameters appear too). An empty expression means
/// "use the contained type's own default" - exactly the omitted-parameter rule of the push.
function UamSlotMappingRow(s, i) {
    var inner = UamSlotInnerDefinition(s);
    var parameters = inner ? ((inner.effectiveParameters && inner.effectiveParameters.length ? inner.effectiveParameters : inner.parameters) || []) : [];
    if (!parameters.length) return '';

    var rows = parameters.map(function (p) {
        var expression = s.ParameterMapping[p.name] !== undefined ? s.ParameterMapping[p.name] : '';
        return '<tr><td><b>' + UamEsc(p.label || p.name) + '</b>'
            + (p.type === 'Device' ? ' <span class="udt-chip udt-chip-line">' + UamEsc(UamT('device')) + '</span>' : '') + '</td>'
            + '<td class="uam-code">' + UamEsc(p.defaultValue || '') + '</td>'
            + '<td><input class="uam-member-input uam-slot-map-input" data-slot="' + i + '" data-param="' + UamEscAttr(p.name) + '"'
            + ' value="' + UamEscAttr(expression) + '" placeholder="' + UamEscAttr(UamT('defaultValue')) + '" /></td></tr>';
    }).join('');

    return '<tr class="uam-member-detailrow"><td></td><td colspan="4">'
        + '<div style="padding:4px 0 10px 0;"><b>' + UamEsc(UamT('slotMapping')) + '</b>'
        + '<table class="udt-members udt-detail-table"><thead><tr><th>' + UamEsc(UamT('name')) + '</th><th>' + UamEsc(UamT('defaultValue')) + '</th><th>' + UamEsc(UamT('value')) + '</th></tr></thead><tbody>'
        + rows + '</tbody></table>'
        + '<p style="font-size:12px;color:var(--ThemeFontColor2);">' + UamEsc(UamT('slotMappingHint')) + '</p></div></td></tr>';
}

function UamAddSlot() {
    UamSyncDefinitionHeader();
    uamCurrentDefinition.Slots.push({ Name: '', Definition: '', ParameterMapping: {}, IncludeWhen: '' });
    UamRenderDefinitionEditor();
}

function UamSlotDefinitionChanged(el) {
    // Sync FIRST, clear second: the mapping rows still on screen belong to the OUTGOING type, so
    // a sync after the clear would read them straight back in.
    UamSyncDefinitionHeader();

    // The capture-phase sync already stored the new Definition. The outgoing definition's mapping
    // keys mean nothing on the incoming one and the validator rejects unknown keys, so they are
    // cleared rather than left to linger invisibly - the Symbol tab's master-change rule.
    var slot = uamCurrentDefinition.Slots[parseInt(el.dataset.index, 10)];
    if (slot) slot.ParameterMapping = {};
    UamRenderDefinitionEditor();
}

// ==================== SYMBOL TAB ====================
//
// A definition binds any number of group symbol masters, each with its own replacer mapping,
// because replacer UUIDs belong to the master that declares them. The editor therefore renders one
// block per bound master: a picker of the masters that actually exist in the project, and below it
// one row per replacer THAT master declares, prefilled from the mapping. The stored shape is still
// {GroupSymbol, ReplacerMapping-as-JSON}; the JSON is assembled here so nobody has to type a UUID.

/// Master names known to the designer (the Symbols panel data), sorted for the picker.
function UamMasterNames() {
    if (typeof menusymbols === 'undefined' || !menusymbols) return [];
    return menusymbols.map(function (s) { return s.name; })
        .filter(function (n) { return !!n; })
        .sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
}

/// The replacers a master declares, as [{uuid, label, default}]. Empty when the master is gone.
function UamMasterReplacers(masterName) {
    if (!masterName || typeof GetSymbolMaster !== 'function') return [];

    var master = GetSymbolMaster(masterName);
    if (!master || !master.getAttribute) return [];

    var parsed;
    try {
        parsed = JSON.parse(master.getAttribute('data-replacers') || '{}');
    } catch (e) {
        return [];
    }

    return Object.keys(parsed || {}).map(function (uuid) {
        return { uuid: uuid, label: (parsed[uuid] || {}).label || '', def: (parsed[uuid] || {}).default || '' };
    });
}

function UamParseMapping(json) {
    if (!json) return {};
    try {
        var parsed = JSON.parse(json);
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
        return {};
    }
}

function UamRenderSymbolPane() {
    var symbols = uamCurrentDefinition.Symbols || [];
    var names = UamMasterNames();

    var html = symbols.map(function (s, i) {
        var mapping = UamParseMapping(s.ReplacerMapping);
        var replacers = UamMasterReplacers(s.GroupSymbol);
        var missing = s.GroupSymbol && names.indexOf(s.GroupSymbol) < 0;

        // The picker always offers the stored master even when it no longer exists on any page, so
        // opening the editor cannot silently drop a binding whose symbol was renamed or deleted.
        var options = ['<option value=""></option>'].concat(
            (missing ? [s.GroupSymbol] : []).concat(names).map(function (n) {
                return '<option value="' + UamEsc(n) + '"' + (n === s.GroupSymbol ? ' selected' : '') + '>' + UamEsc(n) + '</option>';
            })).join('');

        var body;
        if (!s.GroupSymbol) {
            body = '<p class="udt-symbol-hint">' + UamEsc(UamT('symbolPickMaster')) + '</p>';
        } else if (missing) {
            body = '<p class="udt-symbol-warning">' + UamEsc(UamT('symbolMasterMissing')) + '</p>';
        } else if (replacers.length === 0) {
            body = '<p class="udt-symbol-hint">' + UamEsc(UamT('symbolNoReplacers')) + '</p>';
        } else {
            // One row per replacer the master declares. An empty expression means "not mapped":
            // that replacer stays designer-owned and no push ever writes it.
            body = '<table class="udt-members udt-symbol-replacers"><thead><tr>'
                + '<th>' + UamEsc(UamT('replacer')) + '</th><th>' + UamEsc(UamT('tokenExpression')) + '</th></tr></thead><tbody>'
                + replacers.map(function (r) {
                    return '<tr><td><span class="udt-replacer-label">' + UamEsc(r.label || r.uuid) + '</span>'
                        + (r.def ? '<span class="udt-replacer-default">' + UamEsc(r.def) + '</span>' : '')
                        + '</td><td><input class="form-control udt-symbol-map" data-symbol-index="' + i + '" data-uuid="' + UamEscAttr(r.uuid) + '"'
                        + ' value="' + UamEscAttr(mapping[r.uuid] || '') + '" placeholder="' + UamEscAttr(UamT('tokenExpressionPlaceholder')) + '" /></td></tr>';
                }).join('') + '</tbody></table>';
        }

        // Same crosshair icon and the same FindMasterSymbol call as the group symbol decorator's
        // Find master button, so the gesture means the same thing in both places. Only offered for
        // a master that actually exists in the project - there is nothing to navigate to otherwise.
        var findBtn = (s.GroupSymbol && !missing)
            ? '<button type="button" class="uam-find-master" title="' + UamEsc(UamT('findMaster')) + '"'
                + ' onclick="UamFindMaster(\'' + UamEsc(s.GroupSymbol).replace(/'/g, "\\'") + '\')">'
                + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
                + '<circle cx="12" cy="12" r="8" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /></svg>'
                + '</button>'
            : '';

        return '<div class="udt-symbol-block" data-symbol-index="' + i + '">'
            + '<div class="udt-symbol-head">'
            + '<label class="form-label">' + UamEsc(UamT('groupSymbol')) + '</label>'
            + '<select class="form-control udt-symbol-master" data-symbol-index="' + i + '">' + options + '</select>'
            + findBtn
            + '<button type="button" class="btn uam-btn udt-symbol-remove" onclick="UamRemoveSymbol(' + i + ')">' + UamEsc(UamT('remove')) + '</button>'
            + '</div>' + body + '</div>';
    }).join('');

    document.getElementById('UamPaneSymbol').innerHTML =
        html
        + '<button type="button" class="btn uam-btn udt-add-row" onclick="UamAddSymbol()">+ ' + UamEsc(UamT('addSymbol')) + '</button>'
        + '<p style="font-size:12px;color:var(--ThemeFontColor2);margin-top:6px;">' + UamEsc(UamT('replacerMappingInfo')) + '</p>';

    // Changing the master re-renders, because the replacer rows below it belong to that master.
    // The mapping of the outgoing master is dropped on purpose: its UUIDs mean nothing on the new
    // one, and keeping them would leave invisible entries that CreateUdtSymbol later rejects.
    Array.prototype.forEach.call(document.querySelectorAll('#UamPaneSymbol .udt-symbol-master'), function (el) {
        el.addEventListener('change', function () {
            UamSyncSymbolPane();
            var index = parseInt(el.getAttribute('data-symbol-index'), 10);
            uamCurrentDefinition.Symbols[index].GroupSymbol = el.value;
            uamCurrentDefinition.Symbols[index].ReplacerMapping = '';
            UamRenderSymbolPane();
        });
    });
}

// Navigates to the page holding this group symbol master, reusing the designer's own
// FindMasterSymbol - same handler, same behaviour as the decorator's Find master button.
//
// Both dialogs are closed first, and deliberately WITHOUT saving: the definition editor's Save is
// the only thing that persists it, so unsaved edits are discarded exactly as Cancel would discard
// them. Confirm when there is something to lose rather than dropping it silently. FindMasterSymbol
// reloads the page when it finds the master, which is why nothing after it can be relied on.
function UamFindMaster(masterName) {
    if (!masterName) return;

    // The standalone /UdtManager page loads this file without the designer's ajax helpers.
    if (typeof FindMasterSymbol !== 'function') { UamError(UamT('errorOccurred')); return; }

    if (!confirm(UamT('findMasterDiscardConfirm'))) return;

    ['UamDefModal', 'UdtAssetModal'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var modal = bootstrap.Modal.getInstance(el);
        if (modal) modal.hide();
    });

    FindMasterSymbol(masterName);
}

function UamAddSymbol() {
    UamSyncDefinitionHeader();
    if (!uamCurrentDefinition.Symbols) uamCurrentDefinition.Symbols = [];
    uamCurrentDefinition.Symbols.push({ GroupSymbol: '', ReplacerMapping: '' });
    UamRenderSymbolPane();
}

function UamRemoveSymbol(index) {
    UamSyncDefinitionHeader();
    uamCurrentDefinition.Symbols.splice(index, 1);
    UamRenderSymbolPane();
}

/// Reads the symbol blocks back into the working copy, rebuilding each mapping from the rows.
function UamSyncSymbolPane() {
    var pane = document.getElementById('UamPaneSymbol');
    if (!pane || !uamCurrentDefinition.Symbols) return;

    var mappings = {};
    Array.prototype.forEach.call(pane.querySelectorAll('.udt-symbol-map'), function (el) {
        var index = el.getAttribute('data-symbol-index');
        var value = (el.value || '').trim();
        if (value === '') return;
        if (!mappings[index]) mappings[index] = {};
        mappings[index][el.getAttribute('data-uuid')] = value;
    });

    uamCurrentDefinition.Symbols.forEach(function (s, i) {
        var select = pane.querySelector('.udt-symbol-master[data-symbol-index="' + i + '"]');
        if (select) s.GroupSymbol = select.value;

        // Only rewrite the mapping when this master's replacer rows are on screen. A master that
        // is missing from the project renders a warning instead of rows, and blanking its mapping
        // here would quietly discard a binding the user never touched.
        var hasRows = pane.querySelector('.udt-symbol-map[data-symbol-index="' + i + '"]') !== null;
        if (hasRows) s.ReplacerMapping = mappings[i] ? JSON.stringify(mappings[i]) : '';
    });
}

/// Rebuilds each slot's ParameterMapping from the rows on screen, the Symbol pane's rule applied
/// to the Slots tab. This is about PRUNING, not reading: the per-input sync already stores every
/// value, but the rows are generated from the contained type's CURRENT parameters, so a key for a
/// parameter that type no longer declares had no row on screen, survived every edit, and made
/// Save - and every push of an instance of this type - fail with "mapped parameter 'X' does not
/// exist on definition 'Y'", with nothing on screen naming the offending key.
function UamSyncSlotsPane() {
    var pane = document.getElementById('UamPaneSlots');
    if (!pane || !uamCurrentDefinition.Slots) return;

    var mappings = {};
    Array.prototype.forEach.call(pane.querySelectorAll('.uam-slot-map-input'), function (el) {
        var value = (el.value || '').trim();
        if (value === '') return;   // empty means "use the contained type's default": no key at all
        var index = el.getAttribute('data-slot');
        if (!mappings[index]) mappings[index] = {};
        mappings[index][el.getAttribute('data-param')] = value;
    });

    uamCurrentDefinition.Slots.forEach(function (s, i) {
        // Only when the rows on screen are the full picture. A slot with no contained type, or one
        // whose type is not in the loaded list, keeps whatever it had - blanking it here would
        // discard a mapping the user never saw, which is the trap UamSyncSymbolPane guards too.
        if (!pane.querySelector('tr[data-collection="Slots"][data-index="' + i + '"][data-slot-mappable="1"]')) return;
        s.ParameterMapping = mappings[i] || {};
    });
}

function UamSyncDefinitionHeader() {
    uamCurrentDefinition.Name = document.getElementById('UamDefName').value;
    uamCurrentDefinition.Description = document.getElementById('UamDefDescription').value;
    var baseSelect = document.getElementById('UamDefBase');
    if (baseSelect) uamCurrentDefinition.BaseDefinition = baseSelect.value || '';
    UamSyncSymbolPane();
    UamSyncSlotsPane();
}

// Builds a working-copy row from an API member, keyed off the collection's defaults rather than
// a hand-written field list. The editor saves the whole DTO back, so a field missing from a
// read map was silently blanked on save even when the editor never rendered it; deriving the
// shape from one place removes that failure mode. API rows are camelCase, the working copy is
// PascalCase, and UamField bridges either casing.
function UamMemberFromApi(collection, m) {
    var defaults = UamMemberDefaults(collection);
    var row = {};
    Object.keys(defaults).forEach(function (key) {
        var value = UamField(m, key.charAt(0).toLowerCase() + key.slice(1));
        row[key] = (value === undefined || value === null) ? defaults[key] : value;
    });
    return row;
}

function UamMemberDefaults(collection) {
    var defaults = {
        Parameters: { Name: '', Label: '', Type: 'Text', DefaultValue: '' },
        // The universal fields, then one group per protocol (see UdtVariableMemberDto). This
        // object is the single source for the member shape: UamMemberFromApi builds the working
        // copy from these keys, so a field can no longer be silently dropped by being missing
        // from a hand-written read map.
        VariableMembers: {
            // The device this member materializes on. Present here or the working copy blanks it
            // on save and every member silently falls back to the default device.
            Enable: true, Name: '', DeviceName: '{Device}', Description: '', UserGroups: '', Units: '',
            MinRaw: 0, MaxRaw: 0, MinScaled: 0, MaxScaled: 0,
            Historian: false, Deadband: 0, MinimumTime: 0, SampleGroup: '', TrendGroups: '',
            RecipeParameterName: '', RecipeTargets: '',
            // Must be present or the working copy blanks it on save - the member's release
            // policy would silently reset every time someone edited the definition.
            ReleasedByDefault: '',
            ModbusAddress: '', KafkaDevice: '', KafkaProducer: '', KafkaConsumer: '', KafkaRemapDevice: '', KafkaRemapVariable: '', ModbusTcpStartNewBlock: '', OpcUaQueueSize: '', OpcUaDiscardOldest: '',
            Converter: '', Writeable: false, OpcUa: true,
            // Conditional membership: empty = always materialized.
            IncludeWhen: '',
            ArrayCount: '', ArrayStart: '',
            ModbusTcpType: '', ModbusTcpAddress: '',
            EthernetIPType: '', EthernetIPAddress: '',
            S7Type: '', S7Address: '',
            MelsecType: '', MelsecAddress: '',
            EthernetIPGenericType: '', EthernetIPGenericAddress: '',
            BeckhoffAdsType: '', BeckhoffAdsAddress: '',
            OpcUaType: '', OpcUaNodeId: '', OpcUaSamplingInterval: '', OpcUaSubscription: '',
            Dnp3ObjectType: '', Dnp3IndexNumber: '', Dnp3Pulse: '',
            BacnetObjectType: '', BacnetObjectInstance: '', BacnetWritePriority: '',
            Iec104ObjectType: '', Iec104InformationObjectAddress: '', Iec104Pulse: '', Iec104CommandMode: '',
            MqttType: '', MqttSubscribeTopic: '', MqttPublishTopic: '',
            LocalType: ''
        },
        // ReleasedByDefault is carried here although this editor does not render it: the working
        // copy is derived from this shape and the whole DTO is saved back, so a missing key blanks
        // the field - it was absent for alarm and event members, which silently reset their
        // release policy on every definition edit.
        AlarmMembers: { Enable: true, Condition: '', Message: '', Severity: 1, AlarmGroups: '', Actions: '', IncludeWhen: '', ArrayCount: '', ArrayStart: '', ReleasedByDefault: '' },
        EventMembers: { Enable: true, Condition: '', Message: '', Actions: '', IncludeWhen: '', ArrayCount: '', ArrayStart: '', ReleasedByDefault: '' },
        // Type-owned logic. The body is shared (GetParam contract); the trigger fields are
        // tokenized per instance. All keys must be here or the whole-DTO save blanks them.
        ScriptMembers: { Enable: true, Name: '', Description: '', Script: '', Interval: '', RunWhen: '', RunAtStartup: '', IncludeWhen: '' }
    };
    return Object.assign({}, defaults[collection]);
}

function UamAddRow(collection) {
    UamSyncDefinitionHeader();
    uamCurrentDefinition[collection].push(UamMemberDefaults(collection));
    UamRenderDefinitionEditor();
}

function UamSaveDefinition() {
    UamSyncDefinitionHeader();
    var payload = Object.assign({}, uamCurrentDefinition);
    // Member identity (see uamMemberIdFields): hand back the ids the GET gave us, positionally, so
    // a renamed member stays the same member and its materialized rows keep their provenance
    // instead of being replaced (new row id, alarm runtime state gone, field overrides reset).
    // The lists are built from the members themselves, so they cannot be out of step with them.
    Object.keys(uamMemberIdFields).forEach(function (collection) {
        payload[collection] = UamMembersForWire(uamCurrentDefinition[collection]);
        payload[uamMemberIdFields[collection]] = UamMemberIdList(uamCurrentDefinition[collection]);
    });
    var method = 'POST';
    if (uamCurrentDefinitionId) { payload.Id = uamCurrentDefinitionId; method = 'PUT'; }
    UamApi('/API/Config/UdtDefinitions', method, [payload]).then(function (data) {
        if (data && data.success) {
            bootstrap.Modal.getInstance(document.getElementById('UamDefModal')).hide();
            // A definition save changes what the row/managed-field caches hold (members added or
            // removed, fields templated or not), so they must not answer for the next render.
            uamInstanceRows = { instanceId: 0, state: 'none', byMember: {} };
            uamManagedFields = {};
            // Refresh whichever view the editor was opened from: the definitions list, or the
            // asset view (Edit <definition> in the instance detail), where sync state changed.
            if (document.getElementById('UamAssetView').style.display !== 'none') UamLoadTree(true);
            else UamRenderDefinitionsList();
            return;
        }
        UamShowErrors((data));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// ==================== instances ====================

function UamShowInstances(definitionId) {
    uamInstanceDefinition = uamDefinitions.filter(function (d) { return d.id === definitionId; })[0];
    // Back goes to the definitions list, not out to the Asset Manager: this is a sub-level of the
    // UDT view, and UamShowUdtView is exactly "the definitions list".
    UamSetUdtBack('udtDefinitions', UamShowUdtView);
    document.getElementById('UamUdtCrumb').textContent = '/ ' + uamInstanceDefinition.name + ' · ' + UamT('instances');
    document.getElementById('UamDefToolbar').style.display = 'none';
    document.getElementById('UamInstToolbar').style.display = '';
    UamResetSearch('UamInstSearch');
    uamInstSearch = '';
    UamRenderInstancesList();
}

var uamInstColumns = {
    name: function (i) { return i.name; },
    device: function (i) { return UamInstanceDeviceLabel(uamInstanceDefinition, i); },
    asset: function (i) { return i.asset; },
    parameters: function (i) { return JSON.stringify(i.parameterValues || {}); },
    syncedVersion: function (i) { return i.syncedVersion; },
    status: function (i) { var s = UamInstanceState(i); return s === 'Outdated' ? 2 : s === 'NotMaterialized' ? 1 : 0; }
};

function UamRenderInstancesList() {
    UamApi('/API/Config/UdtInstances?definitionId=' + uamInstanceDefinition.id).then(function (instances) {
        uamInstances = instances || [];
        uamInstSelected = {};
        UamDrawInstancesList();
    }).catch(function () { UamError(); });
}

function UamSearchInstances(value) { uamInstSearch = value; UamDrawInstancesList(); }

function UamSortInstances(key) { UamToggleSort(uamInstSort, key, UamDrawInstancesList); }

// Instance selection for a partial push. Keyed by id (the push API takes ids), cleared whenever
// the list is re-fetched so a deleted instance cannot linger in the scope.
var uamInstSelected = {};

function UamToggleInstSelected(cb) {
    var id = parseInt(cb.dataset.id, 10);
    if (cb.checked) uamInstSelected[id] = true; else delete uamInstSelected[id];
    UamRefreshInstSelectionUi();
}

function UamToggleAllInstSelected(source) {
    document.querySelectorAll('#UamUdtBody .uam-inst-select').forEach(function (cb) {
        cb.checked = source.checked;
        var id = parseInt(cb.dataset.id, 10);
        if (source.checked) uamInstSelected[id] = true; else delete uamInstSelected[id];
    });
    UamRefreshInstSelectionUi();
}

function UamSelectedInstIds() {
    return Object.keys(uamInstSelected).map(function (k) { return parseInt(k, 10); });
}

// The Push button says what it will act on: a count when rows are ticked, plain "Push" otherwise
// (meaning every outdated instance, the behaviour this button has always had).
function UamRefreshInstSelectionUi() {
    var ids = UamSelectedInstIds();
    var btn = document.getElementById('UamPushBtn');
    if (btn) btn.textContent = ids.length ? UamT('push') + ' (' + ids.length + ')' : UamT('push');

    var boxes = document.querySelectorAll('#UamUdtBody .uam-inst-select');
    var all = document.getElementById('UamInstSelectAll');
    if (all) {
        var checked = [].filter.call(boxes, function (cb) { return cb.checked; }).length;
        all.checked = boxes.length > 0 && checked === boxes.length;
        all.indeterminate = checked > 0 && checked < boxes.length;
    }
}

function UamDrawInstancesList() {
    var list = UamSortList(UamFilterList(uamInstances, uamInstSearch, [
        function (i) { return i.name; },
        function (i) { return UamInstanceDeviceLabel(uamInstanceDefinition, i); },
        function (i) { return i.asset; },
        function (i) { return JSON.stringify(i.parameterValues || {}); }
    ]), uamInstSort, uamInstColumns);

    // Placing a symbol instantiates one of the definition's bound masters, so a definition that
    // binds none has nothing to place and the Symbol button is offered disabled with the reason -
    // matching the detail panel's Place on page. Resolved once from the definition these instances
    // belong to (not per row, and not fail-open like the panel's check): here the definition is
    // known for certain, so an enabled button that can only fail server-side is avoidable.
    var canPlace = (UamDefinitionMasters(uamInstanceDefinition) || []).length > 0;

    var rows = list.map(function (i) {
        var status = UamStateChip(i);
        // Not draggable: placement is the Place on page button, not a hidden gesture on the row.
        // The NAME cell opens the instance in the Asset Manager; the row itself is not clickable,
        // so the action buttons and the checkbox keep working without stopPropagation games.
        return '<tr data-instance-name="' + UamEsc(i.name) + '">'
            + '<td class="uam-select-cell"><input type="checkbox" class="form-check-input uam-inst-select" data-id="' + i.id + '"'
            + (uamInstSelected[i.id] ? ' checked' : '') + ' onchange="UamToggleInstSelected(this)"></td>'
            + '<td><b><a href="javascript:void(0)" class="uam-link" onclick="UamOpenInstanceByName(\'' + UamEsc(i.name).replace(/'/g, "\\'") + '\')">' + UamEsc(i.name) + '</a></b></td>'
            + '<td>' + UamEsc(UamInstanceDeviceLabel(uamInstanceDefinition, i)) + '</td>'
            + '<td>' + UamEsc(i.asset) + '</td>'
            + '<td class="udt-paramvalues">' + UamEsc(JSON.stringify(i.parameterValues || {})) + '</td>'
            + '<td class="udt-version">' + UamEsc(i.syncedVersion) + '</td>'
            + '<td>' + status + '</td>'
            + '<td class="uam-actions">'
            + '<button type="button" class="btn uam-btn" onclick="UamOpenInstanceEditor(' + i.id + ')">' + UamEsc(UamT('edit')) + '</button> '
            + '<button type="button" class="btn uam-btn" onclick="UamDuplicateInstance(' + i.id + ')">' + UamEsc(UamT('duplicate')) + '</button> '
            + '<button type="button" class="btn uam-btn"' + (canPlace ? '' : ' disabled title="' + UamEsc(UamT('noGroupSymbolBound')) + '"')
            + ' onclick="UamEnterDropMode(\'' + UamEsc(i.name).replace(/'/g, "\\'") + '\')">' + UamEsc(UamT('placeOnPage')) + '</button> '
            + '<button type="button" class="btn uam-btn" onclick="UamDetachInstance(' + i.id + ')">' + UamEsc(UamT('detach')) + '</button> '
            + '<button type="button" class="btn uam-btn uam-danger" onclick="UamDeleteInstance(' + i.id + ')">' + UamEsc(UamT('delete')) + '</button>'
            + '</td></tr>';
    }).join('');

    document.getElementById('UamUdtBody').innerHTML =
        '<table class="udt-members"><thead><tr>'
        + '<th class="uam-select-cell"><input type="checkbox" class="form-check-input" id="UamInstSelectAll" title="' + UamEsc(UamT('selectAll')) + '" onchange="UamToggleAllInstSelected(this)"></th>'
        + UamSortHeader(UamT('name'), 'name', uamInstSort, 'UamSortInstances')
        + UamSortHeader(UamT('device'), 'device', uamInstSort, 'UamSortInstances')
        + UamSortHeader(UamT('asset'), 'asset', uamInstSort, 'UamSortInstances')
        + UamSortHeader(UamT('parameters'), 'parameters', uamInstSort, 'UamSortInstances')
        + UamSortHeader(UamT('syncedVersion'), 'syncedVersion', uamInstSort, 'UamSortInstances')
        + UamSortHeader(UamT('status'), 'status', uamInstSort, 'UamSortInstances')
        + '<th></th></tr></thead><tbody>'
        + (rows || UamEmptyRow(8)) + '</tbody></table>';

    UamRefreshInstSelectionUi();
}

function UamRenderInstanceParams(instance) {
    var params = uamInstanceDefinition.parameters || [];
    var values = instance ? (instance.parameterValues || {}) : {};
    // No parameter is privileged and none is picked from a list: a device name may be composed from
    // other parameters ("PLC{Line}{Machine}"), so an inventory dropdown could only ever offer a
    // subset of what is legal. Every parameter is a text box.
    // Fan-out (one instance per device) is offered on CREATE when the type declares exactly one
    // Device parameter - the only case where "which parameter varies" has one answer - and is
    // expressed as a comma-separated list, which device names can never contain.
    var deviceParams = UamDeviceParameters(uamInstanceDefinition);
    var fanOutParam = (!uamCurrentInstanceId && deviceParams.length === 1) ? deviceParams[0].name : '';

    document.getElementById('UamInstParams').innerHTML = params.map(function (p) {
        var value = values[p.name] !== undefined ? values[p.name] : '';
        var fanOut = p.name === fanOutParam;
        return '<div class="mb-2"><label class="form-label">' + UamEsc(p.label || p.name) + '</label>'
            + '<input class="form-control uam-instparam" data-param="' + UamEsc(p.name) + '"'
            + (fanOut ? ' data-fanout="1"' : '')
            + ' value="' + UamEscAttr(value) + '" placeholder="' + UamEscAttr(p.defaultValue || '') + '" />'
            + '<span class="uam-param-hint"><code>{' + UamEsc(p.name) + '}</code>'
            + (p.defaultValue ? '<span class="uam-param-default">' + UamEsc(UamT('defaultValue')) + ': ' + UamEsc(p.defaultValue) + '</span>' : '')
            + '</span></div>';
    }).join('') || '<p style="font-size:12px;color:var(--ThemeFontColor2);">' + UamEsc(UamT('noParameters')) + '</p>';

    // The comma-list hint belongs to the fan-out parameter, so it is shown only when there is one:
    // on an edit, or a type with no single Device parameter, it would describe nothing.
    var hint = document.getElementById('UamBulkHint');
    if (hint) hint.style.display = fanOutParam ? '' : 'none';
}

// Duplicate: the +1 gesture - the Add Instance dialog in create mode, prefilled from an
// existing instance (definition, device type/device, asset and the EXPLICIT parameter values;
// inherited parameters stay inherited on the copy). The Name starts empty so a collision
// cannot be saved by accident. Pure dialog prefill: creation, validation and materialization
// are the ordinary create flow.
function UamDuplicateInstance(id) {
    var pool = (uamAllInstances && uamAllInstances.length ? uamAllInstances : uamInstances) || [];
    var source = pool.filter(function (i) { return UamField(i, 'id') === id; })[0]
        || (uamInstances || []).filter(function (i) { return UamField(i, 'id') === id; })[0];
    if (!source) { UamError(); return; }

    var definition = uamDefinitions.filter(function (d) { return d.name === UamField(source, 'definition'); })[0];
    if (!definition) { UamError(); return; }
    uamInstanceDefinition = definition;

    uamCurrentInstanceId = 0;
    document.getElementById('UamInstDefinitionWrap').style.display = 'none';
    document.getElementById('UamInstTitle').textContent = UamT('addInstance');
    document.getElementById('UamInstName').value = UamLeafName(UamField(source, 'name'));
    UamAssetComboSet(UamField(source, 'asset') || '');
    document.getElementById('UamInstBulkWrap').style.display = '';
    document.getElementById('UamInstCount').value = 1;
    document.getElementById('UamInstCountStart').value = 1;
    document.getElementById('UamInstCountPad').value = '0';
    UamUpdateBulkPreview();

    UamRenderInstanceParams(source);
    new bootstrap.Modal(document.getElementById('UamInstModal')).show();
    document.getElementById('UamInstName').focus();
}

function UamOpenInstanceEditor(id) {
    uamCurrentInstanceId = id ? parseInt(id, 10) : 0;
    var instance = uamInstances.filter(function (i) { return i.id === uamCurrentInstanceId; })[0];
    document.getElementById('UamInstDefinitionWrap').style.display = 'none';
    document.getElementById('UamInstTitle').textContent = instance ? instance.name : UamT('addInstance');
    document.getElementById('UamInstName').value = instance ? UamLeafName(instance.name) : '';
    UamAssetComboSet(instance ? instance.asset : '');

    // Bulk-by-count applies to creation only: an existing instance is one instance.
    document.getElementById('UamInstBulkWrap').style.display = instance ? 'none' : '';
    document.getElementById('UamInstCount').value = 1;
    document.getElementById('UamInstCountStart').value = 1;
    document.getElementById('UamInstCountPad').value = '0';
    UamUpdateBulkPreview();

    UamRenderInstanceParams(instance);
    new bootstrap.Modal(document.getElementById('UamInstModal')).show();
}

// Create an instance straight from the Asset Manager view: the same dialog gains a
// definition picker and the selected node's path is pre-filled as the Asset. Without
// any definitions yet, the UDT view opens instead (a definition must exist first).
function UamOpenInstanceEditorFromAsset() {
    if (!uamDefinitions || !uamDefinitions.length) { UamShowUdtView(); return; }
    var node = uamNodes.filter(function (n) { return UamField(n, 'id') === uamSelectedNodeId; })[0];

    var select = document.getElementById('UamInstDefinition');
    select.innerHTML = uamDefinitions.map(function (d) {
        return '<option value="' + d.id + '">' + UamEsc(d.name) + '</option>';
    }).join('');
    uamInstanceDefinition = uamDefinitions[0];
    uamInstances = uamAllInstances;

    UamOpenInstanceEditor(0);
    document.getElementById('UamInstDefinitionWrap').style.display = '';
    if (node) UamAssetComboSet(UamField(node, 'path'));
}

function UamInstDefinitionChanged() {
    var id = parseInt(document.getElementById('UamInstDefinition').value, 10);
    uamInstanceDefinition = uamDefinitions.filter(function (d) { return d.id === id; })[0];
    UamRenderInstanceParams(null);
}

// The name list one device gets from the Count/Start/Zero-pad fields: Count=1 is just the
// pattern; above 1 the pattern must contain {N}, or every instance would collide on one name.
// Returns null on a missing {N} so the caller reports it as a validation message, not silently.
// Each entry carries the padded number alongside the name: parameter values substitute the same
// {N}, which is how bulk-created instances on ONE device get stepped values (e.g. Base register
// "{= 3000 + ({N} - 1) * 100 }" - the arithmetic is evaluated per instance at materialization).
function UamBulkNames(pattern) {
    var count = parseInt(document.getElementById('UamInstCount').value, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count === 1) return [{ number: '', name: pattern }];
    if (count > 512 || pattern.indexOf('{N}') < 0) return null;

    var start = parseInt(document.getElementById('UamInstCountStart').value, 10);
    if (isNaN(start) || start < 0) start = 1;
    var pad = parseInt(document.getElementById('UamInstCountPad').value, 10) || 0;

    var items = [];
    for (var i = 0; i < count; i++) {
        var n = String(start + i);
        while (n.length < pad) n = '0' + n;
        items.push({ number: n, name: pattern.split('{N}').join(n) });
    }
    return items;
}

function UamUpdateBulkPreview() {
    UamUpdateNamePreview();
    var preview = document.getElementById('UamInstBulkPreview');
    if (!preview) return;
    var count = parseInt(document.getElementById('UamInstCount').value, 10);
    if (isNaN(count) || count < 2) { preview.textContent = UamT('bulkCountInfo'); return; }

    var items = UamBulkNames(document.getElementById('UamInstName').value || '');
    if (items === null) { preview.textContent = UamT('bulkCountNamePattern'); return; }
    var names = items.map(function (item) { return item.name; });
    preview.textContent = UamT('bulkCreates') + ' ' + names.slice(0, 5).join(', ') + (names.length > 5 ? ' … +' + (names.length - 5) : '');
}

function UamSaveInstance() {
    var values = {};
    var fanOutParam = '';
    var fanOutValues = [];

    document.querySelectorAll('#UamInstParams .uam-instparam').forEach(function (input) {
        // The fan-out parameter, if any, is the axis: one instance per comma-separated value. A
        // single value behaves exactly like any other parameter, so the comma is opt-in.
        if (input.dataset.fanout) {
            fanOutParam = input.dataset.param;
            fanOutValues = input.value.split(',').map(function (v) { return v.trim(); }).filter(function (v) { return v !== ''; });
        } else if (input.value !== '') {
            values[input.dataset.param] = input.value;
        }
    });

    var namePattern = document.getElementById('UamInstName').value;
    var asset = document.getElementById('UamInstAsset').value;

    var promise;
    if (uamCurrentInstanceId) {
        // Changing a Device-typed parameter here is a legitimate retarget: the push moves the rows.
        promise = UamApi('/API/Config/UdtInstances', 'PUT', [{
            Id: uamCurrentInstanceId, Name: namePattern, Definition: uamInstanceDefinition.name,
            Asset: asset, ParameterValues: values
        }]);
    } else {
        // No pick means "inherit the definition's default for that parameter", exactly like every
        // other parameter left blank in this dialog. If the parameter has no default the push says
        // so clearly rather than this dialog guessing.
        var devices = fanOutValues.length ? fanOutValues : [''];
        if (devices.length > 1 && namePattern.indexOf('{Device}') < 0) { UamError(UamT('bulkNamePattern')); return; }

        // Count fan-out composes with the multi-device fan-out: names per device times devices,
        // e.g. {Device}_Oven{N} across 2 devices with Count 4 creates 8 instances.
        var items = UamBulkNames(namePattern);
        if (items === null) { UamError(UamT('bulkCountNamePattern')); return; }

        var payloads = [];
        devices.forEach(function (device) {
            items.forEach(function (item) {
                // {N} and {Device} substitute in the PARAMETER VALUES too: several instances on
                // one device with identical parameters would poll the same points, so a stepped
                // value ("{= 3000 + ({N} - 1) * 100 }") is what makes same-device bulk create
                // useful. {N} is resolved here, before the request; it is never stored.
                var instanceValues = {};
                Object.keys(values).forEach(function (key) {
                    instanceValues[key] = String(values[key]).split('{N}').join(item.number).split('{Device}').join(device);
                });
                // The fan-out value becomes that parameter's value: an instance carries its
                // devices nowhere else.
                if (fanOutParam && device !== '') instanceValues[fanOutParam] = device;
                payloads.push({
                    Name: item.name.split('{Device}').join(device),
                    Definition: uamInstanceDefinition.name, Asset: asset, ParameterValues: instanceValues
                });
            });
        });
        promise = UamApi('/API/Config/UdtInstances', 'POST', payloads);
    }

    promise.then(function (data) {
        if (data && data.success) {
            bootstrap.Modal.getInstance(document.getElementById('UamInstModal')).hide();
            // Refresh whichever view the editor was reached from (instances list or asset tree).
            if (document.getElementById('UamAssetView').style.display !== 'none') UamLoadTree(true);
            else UamRenderInstancesList();

            // A save STAGES; these are the findings the next push would report (unknown device,
            // name collision). The save succeeded, so they are informational - but silent staging
            // of something unpushable is how a problem hides until commissioning.
            var warnings = (data.warnings || []).slice();
            (data.results || []).forEach(function (r) { (r.warnings || []).forEach(function (w) { warnings.push(r.key ? r.key + ': ' + w : w); }); });
            if (warnings.length) UamShowFindings(warnings, UamT('savedWithWarnings'));
            return;
        }
        UamShowErrors((data));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// Detach and Delete are reachable from BOTH the instances list and the asset tree's detail panel,
// so they refresh whichever view is on screen instead of naming one. Refreshing the instances list
// from the tree would also throw: it reads uamInstanceDefinition.id, which the tree never sets.
function UamAfterInstanceRemoved() {
    var udtViewOpen = document.getElementById('UamUdtView').style.display !== 'none';

    if (udtViewOpen) { UamRenderInstancesList(); return; }

    // The tree's selection pointed at the instance that just went away, so fall back to its node's
    // panel rather than re-rendering a detail for something that no longer exists.
    uamSelectedInstanceId = 0;
    UamLoadTree(true);
}

// Same view dispatch for a change that KEEPS the instance (a push): the tree reloads but holds its
// selection, so the detail panel redraws with the new synced version instead of jumping to the node.
// The row and managed-field caches are dropped here: a push (or definition save) changes exactly
// what they hold, and the reused cache made the drawer keep showing pre-push values - after a
// retarget the old device's protocol group - as if the push had done nothing.
function UamRefreshAfterInstanceChange() {
    uamInstanceRows = { instanceId: 0, state: 'none', byMember: {} };
    uamManagedFields = {};
    var udtViewOpen = document.getElementById('UamUdtView').style.display !== 'none';
    if (udtViewOpen) UamRenderInstancesList(); else UamLoadTree(true);
}

function UamDeleteInstance(id) {
    if (!confirm(UamT('areYouSure'))) return;
    UamApi('/API/Config/UdtInstances/Delete', 'POST', [id]).then(function (data) {
        if (data && data.success) { UamAfterInstanceRemoved(); return; }
        UamShowErrors((data));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

function UamDetachInstance(id) {
    if (!confirm(UamT('detachConfirm'))) return;
    UamApi('/API/Config/UdtInstances/Detach', 'POST', [id]).then(function (data) {
        if (data && data.success) { UamAfterInstanceRemoved(); return; }
        UamShowErrors((data));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// ==================== push ====================

// Which of the previewed instances will actually be pushed. Every outdated instance is previewed
// and ticked by default (the historic behaviour), but a push is per-instance atomic - each gets
// its own plan and its own apply - so holding one back is safe: it simply stays Outdated until a
// later push. Nothing needs detaching to skip it.
function UamPushSelectedIds() {
    return uamPushIds.filter(function (id) { return uamPushSelected[id] !== false; });
}

function UamTogglePushInstance(id, checked) {
    uamPushSelected[id] = checked;
    UamUpdatePushFooter();
}

function UamTogglePushAll(checked) {
    uamPushIds.forEach(function (id) { uamPushSelected[id] = checked; });
    document.querySelectorAll('#UamPushBody input[data-push-id]').forEach(function (cb) { cb.checked = checked; });
    UamUpdatePushFooter();
}

// The count on the button is the honest answer to "what is this about to touch".
function UamUpdatePushFooter() {
    var selected = UamPushSelectedIds().length;
    var button = document.getElementById('UamPushApplyBtn');
    if (button) {
        button.textContent = UamT('push') + ' (' + selected + '/' + uamPushIds.length + ')';
        button.disabled = selected === 0;
    }
    var all = document.getElementById('UamPushSelectAll');
    if (all) {
        all.checked = selected === uamPushIds.length && selected > 0;
        all.indeterminate = selected > 0 && selected < uamPushIds.length;
    }
}

// Scope, in order of precedence:
//   explicit ids  - the single-instance Push on the tree detail panel
//   selection     - whatever is ticked in the instances list
//   everything outdated - the historic default, so the toolbar button still means "catch up"
// A push is per-instance atomic, so any subset is valid; the preview then lets you untick further.
function UamOpenPushPreview(ids) {
    if (ids && ids.length) {
        uamPushIds = ids;
    } else {
        var selected = UamSelectedInstIds();
        uamPushIds = selected.length
            ? selected
            : uamInstances.filter(function (i) { return UamInstanceState(i) !== 'Synced'; }).map(function (i) { return i.id; });
    }

    if (uamPushIds.length === 0) { UamError(UamT('nothingToPush')); return; }
    uamPushSelected = {};
    // A fresh dialog starts clean: the previous push's reason must not be one click away from
    // the audit trail, and Adopt is a per-push decision. Reset here (dialog open), NOT in
    // UamRequestPushPreview - the Adopt toggle re-previews and must keep what the user set.
    var reason = document.getElementById('UamPushReason');
    if (reason) reason.value = '';
    var adopt = document.getElementById('UamPushAdopt');
    if (adopt) adopt.checked = false;
    UamRequestPushPreview();
}

// (Re)runs the preview for the current id set; called on open and when the Adopt toggle flips,
// because adopt changes what the plans contain (collisions become take-over entries).
function UamRequestPushPreview() {
    var adopt = document.getElementById('UamPushAdopt') && document.getElementById('UamPushAdopt').checked;
    UamApi('/API/Config/UdtInstances/PushPreview', 'POST', { Ids: uamPushIds, Reason: '', Adopt: !!adopt }).then(function (data) {
        if (!data || !data.success) { UamShowErrors((data)); return; }
        document.getElementById('UamPushBody').innerHTML = (data.plans || []).map(function (plan) {
            var parts = ['<div class="udt-diff-instance">'
                + '<input type="checkbox" class="form-check-input uam-push-check" data-push-id="' + plan.instanceId + '" checked'
                + ' onchange="UamTogglePushInstance(' + plan.instanceId + ', this.checked)" />'
                + UamEsc(plan.instance || '') + ' <span class="udt-version">' + UamEsc(plan.fromVersion || '(new)') + ' &rarr; ' + UamEsc(plan.toVersion || '') + '</span></div>'];
            (plan.errors || []).forEach(function (e) { parts.push('<div class="udt-diff-error">' + UamEsc(typeof e === 'string' ? e : (e.message || JSON.stringify(e))) + '</div>'); });
            if (!(plan.entries || []).length && !(plan.errors || []).length) parts.push('<div class="udt-diff-changes">' + UamEsc(UamT('upToDate')) + '</div>');
            // Array expansions make identical per-element updates common (resize a deadband on a
            // 64-element array = 64 identical Update entries), so consecutive entries with the
            // same kind, action, changes and warnings fold into one line carrying the first and
            // last key plus an element-count chip. Adds/deletes with distinct changes (different
            // addresses) still list individually - they are the rows a resize actually touches.
            var folded = [];
            (plan.entries || []).forEach(function (entry) {
                var last = folded[folded.length - 1];
                var signature = (entry.kind || '') + '|' + (entry.action || '') + '|' + (entry.changes || []).join('\n') + '|' + (entry.warnings || []).join('\n');
                if (last && last.signature === signature && (entry.changes || []).length) {
                    last.count++;
                    last.lastKey = entry.key || '';
                    return;
                }
                folded.push({ entry: entry, signature: signature, count: 1, lastKey: '' });
            });
            folded.forEach(function (f) {
                var entry = f.entry;
                var action = entry.action || '';
                var markClass = action === 'Add' ? 'udt-diff-add' : action === 'Delete' ? 'udt-diff-delete' : action === 'Adopt' ? 'udt-diff-adopt' : 'udt-diff-update';
                var mark = action === 'Add' ? '+' : action === 'Delete' ? '&minus;' : action === 'Adopt' ? '&#8618;' : '~';
                parts.push('<div class="udt-diff-entry"><span class="udt-diff-mark ' + markClass + '">' + mark + '</span><div><b>' + UamEsc(entry.kind || '') + '</b> '
                    + (f.count > 1 ? UamEsc(entry.key || '') + ' &hellip; ' + UamEsc(f.lastKey) + ' <span class="udt-chip udt-chip-line">&#215;&nbsp;' + f.count + '</span>' : UamEsc(entry.key || ''))
                    + ((entry.changes || []).length ? '<span class="udt-diff-changes">' + entry.changes.map(UamEsc).join('<br />') + '</span>' : '')
                    + ((entry.warnings || []).length ? '<span class="udt-diff-warning">' + entry.warnings.map(UamEsc).join('<br />') + '</span>' : '')
                    + '</div></div>');
            });
            return parts.join('');
        }).join('');
        UamUpdatePushFooter();
        UamUpdatePushReasonHint();
        new bootstrap.Modal(document.getElementById('UamPushModal')).show();
        // The preview writes nothing, but the gate is per HTTP METHOD and this is a POST, so in
        // compliance mode it too asks for a signature. Cancelling simply leaves the push dialog
        // closed, which is the operator's own decision - no error box.
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// The reason is required only when the push changes something LIVE. A push of nothing but
// never-materialized instances is the initial create, so the field relaxes and says so.
function UamPushReasonOptional() {
    var byId = {};
    (uamAllInstances || []).forEach(function (i) { byId[i.id] = i; });
    return UamPushSelectedIds().every(function (id) {
        return byId[id] && UamInstanceState(byId[id]) === 'NotMaterialized';
    });
}

function UamUpdatePushReasonHint() {
    var hint = document.getElementById('UamPushReasonHint');
    var star = document.getElementById('UamPushReasonStar');
    var optional = UamPushReasonOptional();
    if (hint) hint.style.display = optional ? '' : 'none';
    if (star) star.style.display = optional ? 'none' : '';
}

var uamPushInFlight = false;

function UamApplyPush() {
    // A second click sends a second push; the first has already committed by the time it lands,
    // so the second returns no entries and no renames - and whichever answer arrives last is the
    // one the operator sees.
    if (uamPushInFlight) return;

    var reason = document.getElementById('UamPushReason').value;
    if ((!reason || !reason.trim()) && !UamPushReasonOptional()) { UamError(UamT('reasonRequired')); return; }
    var ids = UamPushSelectedIds();
    if (ids.length === 0) { UamError(UamT('nothingToPush')); return; }
    var adopt = document.getElementById('UamPushAdopt') && document.getElementById('UamPushAdopt').checked;

    uamPushInFlight = true;
    var applyButton = document.getElementById('UamPushApplyBtn');
    if (applyButton) applyButton.disabled = true;

    UamApi('/API/Config/UdtInstances/Push', 'POST', { Ids: ids, Reason: reason, Adopt: !!adopt }).then(function (data) {
        // Captured FIRST, and offered regardless of the batch flag.
        //
        // renamedVariables only ever describes instances that COMMITTED, so it is just as valid
        // when part of the batch failed - and that is exactly when it matters most: the default
        // gesture selects every non-Synced instance, so one name collision used to make the whole
        // answer success:false, skip the offer, and leave the instances that DID rename with every
        // reference to their old names dangling and nothing said. Measured on one such push: rows
        // renamed, 27 page references orphaned, operator shown only an error box.
        //
        // It is read before hide()/refresh because a throw in either used to fall into the .catch
        // below and discard the pairs permanently - the rename cannot be replayed afterwards, as
        // the old names are gone from the database by then.
        var renames = (data && data.renamedVariables) || [];

        try {
            if (data && data.success) {
                var modal = bootstrap.Modal.getInstance(document.getElementById('UamPushModal'));
                if (modal) modal.hide();
                // Push is reachable from the instances list AND the tree detail panel, so refresh
                // whichever is open - the same reason Detach/Delete stopped naming one view.
                UamRefreshAfterInstanceChange();
            } else {
                UamShowErrors((data));
            }
        } finally {
            UamOfferRenamePropagation(renames);
        }
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); })
      .then(function () {
          uamPushInFlight = false;
          if (applyButton) applyButton.disabled = false;
      });
}

/// A push that renamed materialized rows (a renamed definition member, or a token that now
/// resolves differently) leaves every page object, condition, script, schedule, converter and
/// report naming the OLD key pointing at a name that no longer resolves. The push cannot rewire
/// them on its own - which references should follow a rename is the engineer's call - so the
/// renames are offered here, one confirmation for the whole set, and rewired through the same
/// Variables/RenameReferences endpoint the variable pages use.
function UamOfferRenamePropagation(renames) {
    if (!renames || renames.length === 0) return;

    var pairs = renames.map(function (r) { return { oldName: r.oldName, newName: r.newName }; });
    var question = UamT('renamedVariablesPrompt').replace('{0}', renames.length);

    // The same Keep as is / Update all dialog the variable and device grids show, so a rename
    // reached from a push is not a different-looking decision from a rename reached from a grid.
    // Review is hidden by the dialog itself for a multi-pair set: the Cross Reference modal has
    // one search box and cannot carry a term SET.
    //
    // ONE call for the whole set, never one per pair. A push can rename in a chain - re-basing an
    // array member yields T[0]->T[1], T[1]->T[2], T[2]->T[3] - and because every call re-searches
    // the database after the previous one wrote to it, applying these one at a time walks a single
    // binding from T[0] all the way to T[3]. That leaves the page object pointing at a REAL but
    // WRONG variable, showing a plausible live value, and it reports success while doing it.
    // Sending the pairs together resolves the whole set in one pass.
    if (window.EntityModal && typeof EntityModal.promptRenameReferences === 'function') {
        // Variables: what a push renames is always a materialized variable row. oldName/newName
        // identify the operation in the audit record; renames carries the actual set.
        EntityModal.promptRenameReferences('Variables', pairs[0].oldName, pairs[0].newName, pairs.length, {
            renames: pairs,
            text: question,
            pairs: pairs,
            // The Envision page has no CustomModal, so the outcome comes back through the Asset
            // Manager's own alert instead of disappearing. UamError escapes what it is given and
            // joins a list with line breaks, so the <br/>-separated string is split rather than
            // shown with its tags spelled out.
            report: function (html) { UamError(String(html).split(/<br\s*\/?>/i)); }
        });
        return;
    }

    // EntityModal.js absent (a host page that does not load it): the offer must still happen,
    // because losing it silently is exactly the failure this whole flow exists to prevent.
    if (!confirm(question + '\n\n' + pairs.map(function (r) { return r.oldName + ' -> ' + r.newName; }).join('\n'))) return;

    UamApi('/API/Config/Variables/RenameReferences', 'POST', {
        oldName: pairs[0].oldName,
        newName: pairs[0].newName,
        renames: pairs
    }).then(function (data) {
        if (data && data.success) {
            UamError(UamT('renamedVariablesResult').replace('{0}', data.replaced || 0).replace('{1}', data.failed || 0));
        } else {
            UamShowErrors(data);
        }
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// ==================== symbol placement dialog ====================
//
// Placement is one gesture everywhere now - Place on page, i.e. drop mode - reached from both the
// instances list and the tree detail panel. This dialog is no longer an entry point of its own; it
// survives as drop mode's fallback for the one case a click on the canvas cannot express: which of
// several bound masters to place.

/// The dialog, reached by instance name when drop mode has to defer the master choice here.
function UamOpenSymbolDialogByName(instanceName) {
    var instance = UamFindInstanceByName(instanceName);
    if (!instance) { UamError(); return; }
    UamOpenSymbolDialogFor(instance);
}

function UamOpenSymbolDialogFor(instance) {
    uamSymbolInstance = UamField(instance, 'name');

    // One symbol per master, placed one at a time. The picker is the only place the choice is
    // made, so it is shown whenever more than one master is bound and hidden (but still submitted)
    // when there is exactly one.
    var masters = UamInstanceMasters(instance) || [];
    var row = document.getElementById('UamSymbolMasterRow');
    document.getElementById('UamSymbolMaster').innerHTML = masters.map(function (n) {
        return '<option>' + UamEsc(n) + '</option>';
    }).join('');
    if (row) row.style.display = masters.length > 1 ? '' : 'none';

    UamApi('/API/Config/Pages').then(function (pages) {
        document.getElementById('UamSymbolPage').innerHTML = (pages || []).map(function (p) {
            return '<option>' + UamEsc(p.name) + '</option>';
        }).join('');
        document.getElementById('UamSymbolTitle').textContent = UamT('createSymbol') + ' - ' + uamSymbolInstance;
        new bootstrap.Modal(document.getElementById('UamSymbolModal')).show();
    }).catch(function () { UamError(); });
}

function UamCreateSymbol() {
    var pageName = document.getElementById('UamSymbolPage').value;
    UamApi('/API/Design/CreateUdtSymbol', 'POST', {
        PageName: pageName,
        UdtInstanceName: uamSymbolInstance,
        MasterSymbolName: document.getElementById('UamSymbolMaster').value || null,
        Attributes: {
            'top': (parseInt(document.getElementById('UamSymbolTop').value, 10) || 0) + 'px',
            'left': (parseInt(document.getElementById('UamSymbolLeft').value, 10) || 0) + 'px'
        }
    }).then(function (data) {
        if (data && (data.status === 'OK')) {
            bootstrap.Modal.getInstance(document.getElementById('UamSymbolModal')).hide();
            // Only refresh the editor when the symbol landed on the page it has open.
            try {
                var current = new URLSearchParams(window.location.search).get('Page');
                if (current && current === pageName) uamDesignChanged = true;
                if (!current && typeof PageName !== 'undefined' && PageName === pageName) uamDesignChanged = true;
            } catch (e) { }
            return;
        }
        UamError((data && (data.error || data.Error)) || UamT('errorOccurred'));
        // DesignController derives from AdminApiControllerBase, so this POST passes the same
        // signature gate as the config writes above.
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// ==================== drop mode: place a symbol on the open page ====================

// Place on page (or dragging an instance row out of the instances list) collapses the modal into
// a floating chip; the next press on the page places the symbol at that position (translated
// through the editor's zoom, same math as DoDragObject in CanvasEditing.js). ESC cancels and
// restores the modal. Placement targets the page currently open in the editor.
var uamDropInstance = '';
var uamDropMaster = '';
var uamDropChip = null;

// The tree renders from uamAllInstances (loaded once on open) while the instances view refetches
// per definition into uamInstances, so an instance created without reopening the modal lives only
// in the latter: search every pool before deciding.
function UamFindInstanceByName(instanceName) {
    return (uamInstances || []).concat(uamAllInstances || []).concat(uamPanelInstances || [])
        .filter(function (i) { return UamField(i, 'name') === instanceName; })[0];
}

// The group symbol masters an instance's definition binds. The definitions list carries Symbols as
// the raw JSON column (the grid projection) while the read DTO carries a parsed array, so both
// shapes are accepted.
function UamInstanceMasters(instance) {
    if (!instance) return null;
    var definition = (uamDefinitions || []).filter(function (d) { return d.name === UamField(instance, 'definition'); })[0];
    if (!definition) return null;
    return UamDefinitionMasters(definition);
}

// The group symbol masters a DEFINITION binds. Accepts both shapes Symbols arrives in: the
// definitions grid carries the raw JSON column, the read DTO a parsed array.
function UamDefinitionMasters(definition) {
    if (!definition) return null;

    var symbols = UamField(definition, 'symbols');
    if (typeof symbols === 'string') {
        try { symbols = JSON.parse(symbols || '[]'); } catch (e) { symbols = []; }
    }

    return (symbols || []).map(function (s) { return UamField(s, 'groupSymbol'); })
        .filter(function (n) { return !!n; });
}

// A symbol is an instantiation of one of the definition's bound masters, so an instance whose
// definition binds none has nothing to place. Single source for both entry points (the
// detail-panel button and the instances-list drag). Fails OPEN: if the instance or its definition
// cannot be resolved we let the click through and CreateUdtSymbol reports the real reason,
// rather than disabling the button on stale client state.
function UamInstanceHasSymbol(instance) {
    var masters = UamInstanceMasters(instance);
    if (masters === null) return true;
    return masters.length > 0;
}

// Which master to place. Placement is one symbol per gesture (place again for another), so with
// several masters bound the user must choose rather than have the first one picked for them; the
// symbol modal carries the picker, so drop mode defers to it in that case.
function UamEnterDropMode(instanceName, master) {
    var instance = UamFindInstanceByName(instanceName);
    if (!UamInstanceHasSymbol(instance)) { UamError(UamT('noGroupSymbolBound')); return; }

    var masters = UamInstanceMasters(instance);
    if (!master && masters && masters.length > 1) { UamOpenSymbolDialogByName(instanceName); return; }

    uamDropMaster = master || ((masters && masters.length === 1) ? masters[0] : '');
    uamDropInstance = instanceName;
    bootstrap.Modal.getInstance(document.getElementById('UdtAssetModal')).hide();

    // Mirror the object library's placement flow (AddImageFromLibrary / AddType in Persistence.js
    // and CanvasEditing.js): close the left menu and crosshair the canvas.
    if (typeof closemenu === 'function') closemenu();
    var viewer = document.getElementById('EnvisionPage');
    if (viewer) viewer.style.cursor = 'crosshair';

    uamDropChip = document.createElement('div');
    uamDropChip.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:12000;'
        + 'background:var(--ThemeBackground,#fff);color:var(--ThemeFontColor,#545454);border:2px solid var(--ThemeIconColor,goldenrod);'
        + 'border-radius:999px;padding:7px 18px;font-size:13px;font-weight:600;box-shadow:0 4px 18px rgba(0,0,0,0.25);pointer-events:none;';
    uamDropChip.textContent = UamT('createSymbol') + ': ' + instanceName + ' — ' + UamT('dropModeHint');
    document.body.appendChild(uamDropChip);

    // MOUSEDOWN on the canvas, not a document click. A plain click never arrives here: the
    // Selectables lasso opens on every canvas mousedown, inserts #s-rectBox under the cursor
    // (so mouseup targets a different element) and suspends click on .draggable items. That is
    // why the object library binds mousedown too - placement must not depend on a click event.
    // Pointer events are dropped on existing objects for the same reason AddType does it: the
    // press must land on the canvas instead of grabbing whatever is under the cursor.
    setTimeout(function () {
        if (viewer) viewer.addEventListener('mousedown', UamDropPlace, false);
        document.addEventListener('keydown', UamDropKey, true);
        if (typeof DisableDraggablesPointerEvents === 'function') DisableDraggablesPointerEvents();
    }, 50);
}

function UamExitDropMode() {
    var viewer = document.getElementById('EnvisionPage');
    if (viewer) {
        viewer.removeEventListener('mousedown', UamDropPlace, false);
        viewer.style.cursor = 'default';
    }
    document.removeEventListener('keydown', UamDropKey, true);
    if (typeof EnableDraggablesPointerEvents === 'function') EnableDraggablesPointerEvents();
    if (uamDropChip) { uamDropChip.remove(); uamDropChip = null; }
    uamDropInstance = '';
    uamDropMaster = '';
}

function UamDropKey(e) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    UamExitDropMode();
    new bootstrap.Modal(document.getElementById('UdtAssetModal')).show();
}

// mousedown handler (see UamEnterDropMode): stopPropagation keeps the press from also reaching
// the document-level pan/drag handlers, so placing never starts a canvas drag.
function UamDropPlace(e) {
    if (e.button !== 0) return;                 // left button only, like the lasso's own guard
    var viewer = document.getElementById('EnvisionPage');
    if (!viewer) { UamExitDropMode(); return; }
    e.preventDefault();
    e.stopPropagation();

    // Same zoom extraction as the editor's own drag math (CanvasEditing.js).
    var transform = viewer.style.transform || '';
    var scale = 1.0;
    var idx = transform.indexOf('scale(');
    if (idx >= 0) {
        var open = idx + 6;
        var close = transform.indexOf(',', open);
        if (close === -1 || close > transform.indexOf(')', open)) close = transform.indexOf(')', open);
        scale = parseFloat(transform.substring(open, close)) || 1.0;
    }

    var rect = viewer.getBoundingClientRect();
    var left = Math.round((e.clientX - rect.left) / scale);
    var top = Math.round((e.clientY - rect.top) / scale);
    var instanceName = uamDropInstance;
    var masterName = uamDropMaster;
    UamExitDropMode();

    var pageName = typeof CurrentPage !== 'undefined' ? CurrentPage : new URLSearchParams(window.location.search).get('Page');
    if (!pageName) { UamError(); return; }

    UamApi('/API/Design/CreateUdtSymbol', 'POST', {
        PageName: pageName,
        UdtInstanceName: instanceName,
        MasterSymbolName: masterName || null,
        Attributes: { 'top': top + 'px', 'left': left + 'px' }
    }).then(function (data) {
        if (data && data.status === 'OK') { location.reload(); return; }
        UamError((data && (data.error || data.Error)) || UamT('errorOccurred'));
    }).catch(function (e) { if (!UamSignatureCancelled(e)) UamError(); });
}

// ==================== wiring ====================

// The instance drawer's [...] pickers report their result the same way the definition editor's do:
// they assign el.value and fire a NON-bubbling event, so the input's inline onchange never runs and
// the picked value would sit on screen while the row still held the old one. Capture phase (which
// sees non-bubbling events) plus both event names, and a value check so an ordinary focusout on an
// untouched field does not fire a PUT.
function UamSyncInstancePickerInput(e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    var key = el.getAttribute('data-uam-rowfield');
    var memberId = el.getAttribute('data-uam-member');
    if (!key || !memberId || !uamInstancePickers[key]) return;

    // Same slot narrowing as the save: the "did it actually change" check has to read the row the
    // drawer is showing, not another slot's row of the same member.
    var rows = UamRowsForSlot(uamInstanceRows.byMember[memberId] || [], el);
    if (!rows.length) return;
    var current = rows[0][key];
    if (String(current === null || current === undefined ? '' : current) === el.value) return;

    UamSaveInstanceRowField(memberId, el);
}

document.addEventListener('input', UamSyncInstancePickerInput, true);
document.addEventListener('focusout', UamSyncInstancePickerInput, true);

document.addEventListener('DOMContentLoaded', function () {
    var defModal = document.getElementById('UamDefModal');
    if (!defModal) return;

    // NOTE: instance rows in the instances list are deliberately NOT draggable. Dragging a row
    // used to start symbol drop mode, which made the whole row a hidden second Place on page - easy
    // to trigger by accident while selecting text, and invisible as an affordance. Placement is the
    // button, and only the button. (The asset TREE keeps its drags: there they mean re-attach to a
    // node and reorder, which are real drag gestures with a drop target.)

    // tabs
    document.querySelectorAll('#UamDefTabs .udt-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('#UamDefTabs .udt-tab').forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
            btn.setAttribute('aria-selected', 'true');
            document.querySelectorAll('#UamDefModal .udt-tabpane').forEach(function (p) { p.classList.remove('show'); });
            document.getElementById(btn.dataset.pane).classList.add('show');
        });
    });

    // member edits sync into the working copy; row removal re-renders
    function UamSyncMemberInput(e) {
        var el = e.target;
        if (!el.classList.contains('uam-member-input')) return;

        // Slot mapping inputs address a DICTIONARY entry (inner parameter -> expression), not a
        // row field, so they carry data-slot/data-param instead of the collection triple. An
        // empty expression means "not mapped" (the contained type's default applies) and is
        // removed rather than stored - the Symbol tab's empty-expression rule.
        if (el.classList.contains('uam-slot-map-input')) {
            var slot = uamCurrentDefinition.Slots[parseInt(el.dataset.slot, 10)];
            if (!slot) return;
            if (el.value === '') delete slot.ParameterMapping[el.dataset.param];
            else slot.ParameterMapping[el.dataset.param] = el.value;
            return;
        }

        if (!el.dataset.collection) return;
        var item = uamCurrentDefinition[el.dataset.collection][parseInt(el.dataset.index, 10)];
        var numeric = ['MinRaw', 'MaxRaw', 'MinScaled', 'MaxScaled', 'Deadband', 'MinimumTime', 'Severity'];
        if (el.type === 'checkbox') item[el.dataset.field] = el.checked;
        else if (numeric.indexOf(el.dataset.field) >= 0) item[el.dataset.field] = Number(el.value) || 0;
        else item[el.dataset.field] = el.value;
    }

    // CAPTURE phase, and both event names, because of how the [...] pickers report their result.
    // They assign el.value in code and announce it with `new Event(...)`, which defaults to
    // bubbles:false - so a delegated listener on this modal never sees it, and the picked value
    // would sit on screen while Save wrote the previous one. The capture phase runs for
    // non-bubbling events too, which a bubble-phase listener does not. Both names are needed
    // because the Envision copies (envision/Popups.js) fire 'input' while the site.js copies used
    // by the configuration pages fire 'focusout'.
    defModal.addEventListener('input', UamSyncMemberInput, true);
    defModal.addEventListener('focusout', UamSyncMemberInput, true);
    defModal.addEventListener('click', function (e) {
        var btn = e.target.closest('.uam-row-remove');
        if (!btn) return;
        UamSyncDefinitionHeader();
        uamCurrentDefinition[btn.dataset.collection].splice(parseInt(btn.dataset.index, 10), 1);
        uamExpandedMembers = {};   // drawer state is index-keyed; removing a row shifts the rest
        uamExpandedJson = {};
        uamOpenGroups = {};        // ... and so are the per-protocol groups inside the drawer
        UamRenderDefinitionEditor();
    });

    // Row reordering: drag a handle cell onto another row of the same collection. The array
    // is respliced and re-rendered; Save persists the array order (API stamps SortOrder).
    var uamDragFrom = null;
    defModal.addEventListener('dragstart', function (e) {
        var handle = e.target.closest('.uam-member-drag');
        if (!handle) return;
        uamDragFrom = { collection: handle.dataset.collection, index: parseInt(handle.dataset.index, 10) };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/uam-member', '1');
    });
    defModal.addEventListener('dragover', function (e) {
        if (!uamDragFrom) return;
        var row = e.target.closest('tr[data-collection]');
        if (!row || row.dataset.collection !== uamDragFrom.collection) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        defModal.querySelectorAll('tr.uam-drop-target').forEach(function (r) { r.classList.remove('uam-drop-target'); });
        row.classList.add('uam-drop-target');
    });
    defModal.addEventListener('drop', function (e) {
        defModal.querySelectorAll('tr.uam-drop-target').forEach(function (r) { r.classList.remove('uam-drop-target'); });
        if (!uamDragFrom) return;
        var row = e.target.closest('tr[data-collection]');
        if (!row || row.dataset.collection !== uamDragFrom.collection) { uamDragFrom = null; return; }
        e.preventDefault();
        var to = parseInt(row.dataset.index, 10);
        var from = uamDragFrom.index;
        var list = uamCurrentDefinition[uamDragFrom.collection];
        uamDragFrom = null;
        if (to === from || to < 0 || to >= list.length) return;
        UamSyncDefinitionHeader();
        list.splice(to, 0, list.splice(from, 1)[0]);
        uamExpandedMembers = {};   // drawer state is index-keyed; reordering moves the rows
        uamExpandedJson = {};
        uamOpenGroups = {};        // ... and so are the per-protocol groups inside the drawer
        UamRenderDefinitionEditor();
    });
    defModal.addEventListener('dragend', function () {
        defModal.querySelectorAll('tr.uam-drop-target').forEach(function (r) { r.classList.remove('uam-drop-target'); });
        uamDragFrom = null;
    });
});
