// Git Version Control UI logic
(function () {
    const statusPanel = document.getElementById('gitStatusPanel');
    const logPanel = document.getElementById('gitLogPanel');
    const outputPanel = document.getElementById('gitOutputPanel');
    const commitMsg = document.getElementById('gitCommitMessage');
    const branchSelect = document.getElementById('gitBranchSelect');
    const newBranchInput = document.getElementById('gitNewBranchName');
    let gitCurrentBranchName = null;

    function gt(key, fallback, ...args) {
        const translations = window.GitTranslations || {};
        let value = translations[key] || fallback || key;
        args.forEach(function (arg, index) {
            value = value.replaceAll('{' + index + '}', arg);
        });
        return value;
    }

    function getEntityLabel(key, fallback) {
        return (window.GitTranslations?.entityLabels || {})[key] || fallback || key;
    }

    function setOutput(html) {
        if (outputPanel) outputPanel.innerHTML = html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        // textContent -> innerHTML escapes & < > but NOT quotes. Every caller interpolates
        // into double-quoted attributes too (data-choice, title), where an unescaped quote
        // in an alarm condition truncated the attribute - silently dropping the user's
        // Keep Local choice - and could inject live attributes into the dialog.
        return div.innerHTML.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    // One operation at a time: a double-click on Replace / Confirm Merge / Commit used to
    // fire two overlapping imports or two commits.
    let gitBusy = false;
    async function runExclusive(fn) {
        if (gitBusy) return;
        gitBusy = true;
        try { await fn(); } finally { gitBusy = false; }
    }

    async function apiCall(url, method, body) {
        try {
            const opts = { method: method || 'GET', headers: {} };
            if (body) {
                opts.headers['Content-Type'] = 'application/json';
                opts.body = JSON.stringify(body);
            }
            const resp = await fetch(url, opts);
            const text = await resp.text();
            if (!text) return { error: gt('emptyResponse', 'Empty response from server (HTTP {0})', resp.status) };
            try {
                return JSON.parse(text);
            } catch (parseErr) {
                return { error: gt('serverReturnedNonJson', 'Server returned non-JSON (HTTP {0}): {1}', resp.status, text.substring(0, 200)) };
            }
        } catch (e) {
            return { error: e.message };
        }
    }

    async function refreshStatus() {
        statusPanel.innerHTML = '<span class="text-muted">' + escapeHtml(gt('loading', 'Loading...')) + '</span>';
        const data = await apiCall('/API/Git/Status');
        if (data.error) {
            statusPanel.innerHTML = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
            return;
        }
        let html = '';
        if (data.branch) html += '<div><strong>' + escapeHtml(gt('branchLabel', 'Branch')) + ':</strong> ' + escapeHtml(data.branch) + '</div>';
        if (data.repoPath) html += '<div><strong>' + escapeHtml(gt('repoLabel', 'Repo')) + ':</strong> ' + escapeHtml(data.repoPath) + '</div>';
        if (data.status !== null && data.status !== undefined) {
            const statusText = data.status.trim() === '' ? '<span class="text-success">' + escapeHtml(gt('cleanNoChanges', 'Clean (no changes)')) + '</span>' : '<pre style="margin:0;white-space:pre-wrap;">' + escapeHtml(data.status) + '</pre>';
            html += '<div class="mt-1"><strong>' + escapeHtml(gt('statusLabel', 'Status')) + ':</strong> ' + statusText + '</div>';
        }
        statusPanel.innerHTML = html || '<span class="text-muted">' + escapeHtml(gt('noData', 'No data')) + '</span>';
    }

    async function refreshLog() {
        logPanel.innerHTML = '<span class="text-muted">' + escapeHtml(gt('loading', 'Loading...')) + '</span>';
        const data = await apiCall('/API/Git/Log');
        if (data.error) {
            logPanel.innerHTML = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
            return;
        }
        if (data.commits && data.commits.length > 0) {
            let html = '<table style="width:100%;font-size:0.82em;border-collapse:collapse;border:none;">';
            data.commits.forEach(function (c) {
                html += '<tr style="border-bottom:1px solid var(--ThemeBorderColor);">'
                    + '<td style="padding:3px 6px;white-space:nowrap;font-family:monospace;color:var(--ThemeAccentColor);border:none;">' + escapeHtml(c.hash) + '</td>'
                    + '<td style="padding:3px 6px;white-space:nowrap;border:none;">' + escapeHtml(c.date) + '</td>'
                    + '<td style="padding:3px 6px;white-space:nowrap;font-family:monospace;border:none;">' + escapeHtml(c.branch || '') + '</td>'
                    + '<td style="padding:3px 6px;white-space:nowrap;border:none;">' + escapeHtml(c.author) + '</td>'
                    + '<td style="padding:3px 6px;width:100%;border:none;">' + escapeHtml(c.message) + '</td>'
                    + '<td style="padding:3px 6px;white-space:nowrap;border:none;"><button class="btn btn-xs btn-outline-warning git-restore-btn" style="font-size:0.8em;padding:1px 6px;" data-hash="' + escapeHtml(c.hash) + '"><i class="fas fa-undo"></i> ' + escapeHtml(gt('restore', 'Restore')) + '</button></td>'
                    + '</tr>';
            });
            html += '</table>';
            logPanel.innerHTML = html;
        } else {
            logPanel.innerHTML = '<span class="text-muted">' + escapeHtml(gt('noCommits', 'No commits')) + '</span>';
        }
        // Refresh status after log — in case the log triggered an auto-clone
        refreshStatus();
    }

    async function refreshBranches() {
        if (!branchSelect) return;

        branchSelect.innerHTML = '<option value="">' + escapeHtml(gt('loadingBranches', 'Loading branches...')) + '</option>';
        const data = await apiCall('/API/Git/Branches');
        if (data.error) {
            branchSelect.innerHTML = '<option value="">' + escapeHtml(gt('unableLoadBranches', 'Unable to load branches')) + '</option>';
            setOutput('<span class="text-danger">' + escapeHtml(data.error) + '</span>');
            return;
        }

        gitCurrentBranchName = data.currentBranch || null;
        branchSelect.innerHTML = '';

        if (!data.branches || data.branches.length === 0) {
            branchSelect.innerHTML = '<option value="">' + escapeHtml(gt('noBranchesFound', 'No branches found')) + '</option>';
            return;
        }

        data.branches.forEach(function (branch) {
            const option = document.createElement('option');
            option.value = branch.name;
            option.textContent = branch.isCurrent ? branch.displayName + ' (' + gt('currentSuffix', 'current') + ')' : branch.displayName;
            if (branch.isCurrent || branch.name === gitCurrentBranchName) option.selected = true;
            branchSelect.appendChild(option);
        });

        if (data.fetchWarning) {
            setOutput('<span class="text-warning">' + escapeHtml(data.fetchWarning) + '</span>');
        }
    }

    async function doCheckoutBranch() {
        if (!branchSelect || !branchSelect.value) {
            setOutput('<span class="text-warning">' + escapeHtml(gt('pleaseSelectBranch', 'Please select a branch first.')) + '</span>');
            return;
        }

        setOutput('<span class="text-muted">' + escapeHtml(gt('switchingBranch', 'Switching branch...')) + '</span>');
        const data = await apiCall('/API/Git/Checkout', 'POST', { branchName: branchSelect.value });
        if (data.error) {
            let html = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
            if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;">' + escapeHtml(data.details) + '</pre>';
            setOutput(html);
            return;
        }

        gitCurrentBranchName = data.currentBranch || branchSelect.value;
        setOutput('<span class="text-success">' + escapeHtml(gt('branchSwitched', 'Branch switched.')) + '</span>');
        refreshStatus();
        refreshLog();
        refreshBranches();
    }

    async function doCreateBranch() {
        const branchName = newBranchInput ? newBranchInput.value.trim() : '';
        if (!branchName) {
            setOutput('<span class="text-warning">' + escapeHtml(gt('pleaseEnterBranchName', 'Please enter a new branch name.')) + '</span>');
            return;
        }

        setOutput('<span class="text-muted">' + escapeHtml(gt('creatingBranch', 'Creating branch...')) + '</span>');
        const data = await apiCall('/API/Git/CreateBranch', 'POST', { branchName: branchName, checkout: true });
        if (data.error) {
            setOutput('<span class="text-danger">' + escapeHtml(data.error) + '</span>');
            return;
        }

        gitCurrentBranchName = data.currentBranch || branchName;
        if (newBranchInput) newBranchInput.value = '';
        setOutput('<span class="text-success">' + escapeHtml(gt('branchCreated', 'Branch created.')) + '</span>');
        refreshStatus();
        refreshLog();
        refreshBranches();
    }

    // ---- Import Mode Modal ----
    const importModal     = document.getElementById('GitImportModal');
    const importModalBS   = importModal ? new bootstrap.Modal(importModal) : null;
    const importTitle     = document.getElementById('gitImportModalTitle');
    const importModeDesc  = document.getElementById('gitImportModeDescription');
    const importModePanel = document.getElementById('gitImportModePanel');
    const importDiffPanel = document.getElementById('gitImportDiffPanel');
    const importDiffContent = document.getElementById('gitImportDiffContent');
    const importDiffSummary = document.getElementById('gitImportDiffSummary');
    const importFooter    = document.getElementById('gitImportModalFooter');

    const gitMainModal    = document.getElementById('GitModal');

    // Sequence nested-modal transitions so Bootstrap doesn't leave a stale backdrop.
    // Always fetches the live Bootstrap instance at call time to avoid stale references.
    function hideThenShow(hideEl, showEl) {
        const showBS = showEl ? bootstrap.Modal.getOrCreateInstance(showEl) : null;
        if (!hideEl || !hideEl.classList.contains('show')) {
            showBS?.show();
            return;
        }
        const hideBS = bootstrap.Modal.getInstance(hideEl);
        if (!hideBS) { showBS?.show(); return; }
        const handler = function () {
            hideEl.removeEventListener('hidden.bs.modal', handler);
            showBS?.show();
        };
        hideEl.addEventListener('hidden.bs.modal', handler);
        hideBS.hide();
    }

    document.getElementById('gitImportModalClose')?.addEventListener('click', () => hideThenShow(importModal, gitMainModal));
    document.getElementById('gitImportCancelBtn')?.addEventListener('click',  () => hideThenShow(importModal, gitMainModal));

    const CELL_MAX = 120;
    function truncateCell(str, id) {
        if (str.length <= CELL_MAX) return escapeHtml(str);
        return escapeHtml(str.substring(0, CELL_MAX))
            + '<span id="more-' + id + '" style="display:none;">' + escapeHtml(str.substring(CELL_MAX)) + '</span>'
            + ' <a href="#" style="font-size:0.75em;white-space:nowrap;" onclick="(function(e){e.preventDefault();'
            + 'var m=document.getElementById(\'more-' + id + '\');'
            + 'var l=document.getElementById(\'lnk-' + id + '\');'
            + 'if(m.style.display===\'none\'){m.style.display=\'inline\';l.textContent=' + JSON.stringify(gt('less', 'less')) + ';}else{m.style.display=\'none\';l.textContent=' + JSON.stringify(gt('more', 'more')) + ';}'
            + '})(event)" id="lnk-' + id + '">' + escapeHtml(gt('more', 'more')) + '</a>';
    }

    function renderFieldDiffTable(currentObj, incomingObj) {
        const allKeys = new Set([...Object.keys(currentObj), ...Object.keys(incomingObj)]);
        let rows = '';
        for (const field of allKeys) {
            const cur = currentObj[field];
            const inc = incomingObj[field];
            const curStr = (cur === undefined || cur === null) ? '' : (typeof cur === 'object' ? JSON.stringify(cur) : String(cur));
            const incStr = (inc === undefined || inc === null) ? '' : (typeof inc === 'object' ? JSON.stringify(inc) : String(inc));
            const changed  = curStr !== incStr;
            const isAdded  = cur === undefined || cur === null;
            const isRemoved = inc === undefined || inc === null;
            const uid = field + '_' + Math.random().toString(36).substring(2, 7);
            let curCell, incCell;
            if (changed) {
                curCell = isAdded   ? '<em style="color:#6c757d;">—</em>' : '<span style="background:#ffd7d7;color:#5a0000;padding:1px 4px;border-radius:3px;word-break:break-all;">' + truncateCell(curStr, 'c' + uid) + '</span>';
                incCell = isRemoved ? '<em style="color:#6c757d;">—</em>' : '<span style="background:#d4edda;color:#0a3d1a;padding:1px 4px;border-radius:3px;word-break:break-all;">' + truncateCell(incStr, 'i' + uid) + '</span>';
            } else {
                curCell = '<span style="word-break:break-all;">' + truncateCell(curStr, 'c' + uid) + '</span>';
                incCell = '<span style="word-break:break-all;">' + truncateCell(incStr, 'i' + uid) + '</span>';
            }
            rows += '<tr style="border-top:1px solid var(--ThemeBorderColor);">'
                + '<td style="padding:2px 6px;font-size:12px;font-family:monospace;color:#aaa;width:15%;border:none;">' + escapeHtml(field) + '</td>'
                + '<td style="padding:2px 6px;font-size:12px;width:42.5%;vertical-align:top;border:none;">' + curCell + '</td>'
                + '<td style="padding:2px 6px;font-size:12px;width:42.5%;vertical-align:top;border:none;">' + incCell + '</td>'
                + '</tr>';
        }
        if (!rows) return '<em style="color:#6c757d;">' + escapeHtml(gt('noFieldLevelDiff', 'No field-level differences detected')) + '</em>';
        return '<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:inherit;">'
            + '<thead><tr>'
            + '<th style="padding:2px 6px;font-size:12px;width:15%;color:#aaa;font-weight:400;border:none;">' + escapeHtml(gt('field', 'Field')) + '</th><th style="padding:2px 6px;font-size:12px;width:42.5%;color:#aaa;font-weight:400;border:none;">' + escapeHtml(gt('local', 'Local')) + '</th><th style="padding:2px 6px;font-size:12px;width:42.5%;color:#aaa;font-weight:400;border:none;">' + escapeHtml(gt('incoming', 'Incoming')) + '</th>'
            + '</tr></thead><tbody>' + rows + '</tbody></table>';
    }

    function renderSubTabs(added, deleted, modified, entityKey) {
        const tagItems = (arr) => arr ? arr.map(i => Object.assign({}, i, { entityKey })) : [];
        const subTabs = [
            { label: gt('added', 'Added'),      color: '#28a745', icon: 'fa-plus-circle', items: tagItems(added),    showData: true,  showDiff: false, showChoice: true, choiceLocalLabel: gt('skip', 'Skip') },
            { label: gt('localOnly', 'Local Only'), color: '#6c757d', icon: 'fa-bookmark',   items: tagItems(deleted),  showData: true,  showDiff: false, hint: gt('localOnlyKept', 'Local only items are kept: a merge never deletes them.') },
            { label: gt('modified', 'Modified'),   color: '#fd7e14', icon: 'fa-pen',        items: tagItems(modified), showData: false, showDiff: true  },
        ];
        if (subTabs.every(st => st.items.length === 0)) return '';

        const stId = 'gist_' + Math.random().toString(36).substring(2, 7);

        const defaultIdx = subTabs.findIndex(st => st.items.length > 0);

        // Sub-tab strip
        let html = '<div style="display:flex;gap:2px;margin-bottom:8px;border-bottom:1px solid var(--ThemeBorderColor);">';
        subTabs.forEach((st, i) => {
            const isDefault = i === defaultIdx;
            html += '<button type="button" id="' + stId + '_t' + i + '" data-stabg="' + stId + '" '
                + 'onclick="(function(btn){document.querySelectorAll(\'[data-stpanel=\\\'' + stId + '\\\']\').forEach(function(el){el.style.display=\'none\';});'
                + 'document.querySelectorAll(\'[data-stabg=\\\'' + stId + '\\\']\').forEach(function(el){el.style.borderBottom=\'2px solid transparent\';el.style.opacity=\'0.55\';});'
                + 'document.getElementById(\'' + stId + '_p' + i + '\').style.display=\'block\';'
                + 'btn.style.borderBottom=\'2px solid ' + st.color + '\';btn.style.opacity=\'1\';'
                + '})(this)" '
                + 'style="padding:3px 10px;border:none;background:none;cursor:pointer;font-size:0.8em;font-weight:600;color:' + st.color + ';'
                + 'border-bottom:2px solid ' + (isDefault ? st.color : 'transparent') + ';opacity:' + (isDefault ? '1' : '0.55') + ';white-space:nowrap;">'
                + '<i class="fas ' + st.icon + '"></i> ' + st.label + ' (' + st.items.length + ')'
                + '</button>';
        });
        html += '</div>';

        // Sub-tab panels
        subTabs.forEach((st, i) => {
            const isDefault = i === defaultIdx;
            const panelId = stId + '_p' + i;
            let collapseBtn = '';
            if (st.showDiff || st.showData) {
                collapseBtn = '<div style="display:flex;justify-content:flex-start;gap:4px;margin-bottom:4px;">'
                    + '<button type="button" '
                    + 'onclick="(function(){var p=document.getElementById(\'' + panelId + '\');'
                    + 'p.querySelectorAll(\'[data-grppanel]\').forEach(function(el){el.style.display=\'block\';});'
                    + 'p.querySelectorAll(\'.git-grp-chev\').forEach(function(el){el.style.transform=\'rotate(0deg)\';});'
                    + 'p.querySelectorAll(\'[data-itemdetail]\').forEach(function(el){el.style.display=\'block\';});'
                    + 'p.querySelectorAll(\'.git-item-chev\').forEach(function(el){el.style.transform=\'rotate(0deg)\';});'
                    + '})()" '
                    + 'style="font-size:0.75em;padding:2px 8px;border:1px solid var(--ThemeBorderColor);background:none;border-radius:3px;cursor:pointer;color:var(--ThemeMutedColor);">'
                    + '<i class="fas fa-expand-alt"></i> ' + escapeHtml(gt('expandAll', 'Expand All')) + '</button>'
                    + '<button type="button" '
                    + 'onclick="(function(){var p=document.getElementById(\'' + panelId + '\');'
                    + 'p.querySelectorAll(\'[data-grppanel]\').forEach(function(el){el.style.display=\'none\';});'
                    + 'p.querySelectorAll(\'.git-grp-chev\').forEach(function(el){el.style.transform=\'rotate(-90deg)\';});'
                    + 'p.querySelectorAll(\'[data-itemdetail]\').forEach(function(el){el.style.display=\'none\';});'
                    + 'p.querySelectorAll(\'.git-item-chev\').forEach(function(el){el.style.transform=\'rotate(-90deg)\';});'
                    + '})()" '
                    + 'style="font-size:0.75em;padding:2px 8px;border:1px solid var(--ThemeBorderColor);background:none;border-radius:3px;cursor:pointer;color:var(--ThemeMutedColor);">'
                    + '<i class="fas fa-compress-alt"></i> ' + escapeHtml(gt('collapseAll', 'Collapse All')) + '</button>'
                    + '</div>';
            }
            html += '<div id="' + panelId + '" data-stpanel="' + stId + '" style="display:' + (isDefault ? 'block' : 'none') + ';">';
            if (st.items.length === 0) {
                html += '<span style="font-size:0.82em;color:var(--ThemeMutedColor);padding:6px 4px;display:block;">' + escapeHtml(gt('noItems', 'No items')) + '</span>';
            } else {
                if (st.hint) html += '<div style="font-size:0.78em;color:var(--ThemeMutedColor);padding:2px 4px 6px 4px;">' + escapeHtml(st.hint) + '</div>';
                if (!varEntityKeys.has(entityKey)) html += collapseBtn;
                html += varEntityKeys.has(entityKey)
                    ? renderGroupedByDevice(st.items, st.showData, st.showDiff, entityKey, st.showChoice, st.choiceLocalLabel)
                    : renderItemBlock(st.items, st.showData, st.showDiff, st.showChoice, st.choiceLocalLabel);
            }
            html += '</div>';
        });

        return html;
    }

    const varEntityKeys = new Set(['modbusTcpVariables', 'opcUaVariables', 'mqttVariables', 'ethernetIPVariables', 'dnp3Variables', 'bacnetVariables', 'iec104Variables', 'melsecVariables', 'ethernetIPGenericVariables', 'beckhoffAdsVariables', 's7Variables']);

    function renderGroupedByDevice(items, showData, showDiff, entityKey, showChoice, choiceLocalLabel) {
        if (!items || items.length === 0) return '';
        // Group items by the device portion of the key (everything before the last ::).
        // For most entities the key is "Device::Variable". For mqttVariables it is
        // "Broker::Device::Variable", so the group header naturally becomes "Broker::Device".
        const groups = {};
        const groupOrder = [];
        for (const item of items) {
            const sep = item.name.lastIndexOf('::');
            const deviceName = sep >= 0 ? item.name.substring(0, sep) : item.name;
            const shortName  = sep >= 0 ? item.name.substring(sep + 2)  : item.name;
            if (!groups[deviceName]) { groups[deviceName] = []; groupOrder.push(deviceName); }
            groups[deviceName].push(Object.assign({}, item, { displayName: shortName }));
        }
        let html = '';
        for (const deviceName of groupOrder) {
            const groupItems = groups[deviceName];
            const grpId = 'gitgrp_' + Math.random().toString(36).substring(2, 9);
            html += '<div style="margin:4px 0;">';
            // Device group header row: chevron + name + count + per-group expand/collapse buttons
            html += '<div class="git-device-grp-hdr" style="display:flex;align-items:center;gap:6px;padding:4px 8px;'
                + 'background:var(--ThemeSecondaryBgColor,rgba(128,128,128,0.07));border-radius:3px;">';
            // Left side: clickable area to toggle the whole group
            html += '<span style="display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;" '
                + 'onclick="(function(el){'
                + 'var c=document.getElementById(\'' + grpId + '\');'
                + 'var open=c.style.display!==\'none\';c.style.display=open?\'none\':\'block\';'
                + 'el.querySelector(\'.git-grp-chev\').style.transform=open?\'rotate(-90deg)\':\'rotate(0deg)\';'
                + '})(this)">'
                + '<i class="fas fa-chevron-down git-grp-chev" style="font-size:0.65em;color:var(--ThemeMutedColor);transition:transform 0.15s;transform:rotate(-90deg);"></i>'
                + '<span style="font-size:0.82em;font-weight:600;">' + escapeHtml(deviceName) + '</span>'
                 + '<span style="font-size:0.75em;color:var(--ThemeMutedColor);margin-left:2px;">('
                 + groupItems.length + ' ' + escapeHtml(groupItems.length === 1 ? gt('variableSingle', 'variable') : gt('variablePlural', 'variables')) + ')</span>'
                + '</span>';
            // Expand/collapse all variable details within this group only
            html += '<span style="display:flex;gap:3px;flex-shrink:0;margin-left:25px;">'
                + '<button type="button" onclick="(function(){var g=document.getElementById(\'' + grpId + '\');'
                + 'if(g.style.display===\'none\'){g.style.display=\'block\';}' 
                + 'g.querySelectorAll(\'[data-itemdetail]\').forEach(function(el){el.style.display=\'block\';});'
                + 'g.querySelectorAll(\'.git-item-chev\').forEach(function(el){el.style.transform=\'rotate(0deg)\';});'
                + '})()" '
                 + 'style="font-size:0.7em;padding:1px 6px;border:1px solid var(--ThemeBorderColor);background:none;border-radius:3px;cursor:pointer;color:var(--ThemeMutedColor);" title="' + escapeHtml(gt('expandDeviceVariables', 'Expand all variables in this device')) + '">'
                + '<i class="fas fa-expand-alt"></i></button>'
                + '<button type="button" onclick="(function(){var g=document.getElementById(\'' + grpId + '\');'
                + 'g.querySelectorAll(\'[data-itemdetail]\').forEach(function(el){el.style.display=\'none\';});'
                + 'g.querySelectorAll(\'.git-item-chev\').forEach(function(el){el.style.transform=\'rotate(-90deg)\';});'
                + '})()" '
                 + 'style="font-size:0.7em;padding:1px 6px;border:1px solid var(--ThemeBorderColor);background:none;border-radius:3px;cursor:pointer;color:var(--ThemeMutedColor);" title="' + escapeHtml(gt('collapseDeviceVariables', 'Collapse all variables in this device')) + '">'
                + '<i class="fas fa-compress-alt"></i></button>'
                + '</span>';
            html += '</div>';
            html += '<div id="' + grpId + '" data-grppanel="1" style="display:none;padding-left:10px;border-left:2px solid var(--ThemeBorderColor);margin:2px 0 4px 8px;">';
            html += renderItemBlock(groupItems, showData, showDiff, showChoice, choiceLocalLabel);
            html += '</div></div>';
        }
        return html;
    }

    function renderItemBlock(items, showData, showDiff, showChoice, choiceLocalLabel) {
        if (!items || items.length === 0) return '';
        let html = '';
        for (const item of items) {
            const safeKey = escapeHtml(item.entityKey + '||' + item.name);
            const itemId = 'gititem_' + Math.random().toString(36).substring(2, 9);
            const hasDetail = (showDiff && item.current && item.incoming) || (showData && item.data);

            html += '<div style="margin:3px 0;border-bottom:1px solid var(--ThemeBorderColor)22;">';
            html += '<div style="display:flex;align-items:center;gap:4px;padding:3px 4px;">';

            if (hasDetail) {
                html += '<span style="cursor:pointer;user-select:none;display:flex;align-items:center;gap:4px;flex:1;min-width:0;" '
                    + 'onclick="(function(el){var c=document.getElementById(\'' + itemId + '\');'
                    + 'var open=c.style.display!==\'none\';c.style.display=open?\'none\':\'block\';'
                    + 'el.querySelector(\'.git-item-chev\').style.transform=open?\'rotate(-90deg)\':\'rotate(0deg)\';'
                    + '})(this)">'
                    + '<i class="fas fa-chevron-down git-item-chev" style="font-size:0.65em;color:var(--ThemeMutedColor);transition:transform 0.15s;flex-shrink:0;transform:rotate(-90deg);"></i>'
                    + '<span style="font-size:0.85em;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(item.name) + '">' + escapeHtml(item.displayName || item.name) + '</span>'
                    + '</span>';
            } else {
                html += '<span style="flex:1;min-width:0;font-size:0.85em;font-weight:500;padding-left:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(item.displayName || item.name) + '</span>';
            }

            if (showDiff || showChoice) {
                html += '<span style="white-space:nowrap;flex-shrink:0;">'
                    + '<button type="button" data-choice="' + safeKey + '" data-val="local" data-selected="0" onclick="gitDiffChoiceToggle(this)" '
                    + 'style="font-size:0.72em;padding:1px 6px;border-radius:3px 0 0 3px;border:1px solid #ccc;background:#f8f9fa;color:#333;cursor:pointer;">' + escapeHtml(choiceLocalLabel || gt('keepLocal', 'Keep Local')) + '</button>'
                    + '<button type="button" data-choice="' + safeKey + '" data-val="incoming" data-selected="1" onclick="gitDiffChoiceToggle(this)" '
                    + 'style="font-size:0.72em;padding:1px 6px;border-radius:0 3px 3px 0;border:1px solid #fd7e14;background:#fd7e14;color:#fff;cursor:pointer;">' + escapeHtml(gt('incoming', 'Incoming')) + '</button>'
                    + '</span>';
            }
            html += '</div>';

            if (hasDetail) {
                html += '<div id="' + itemId + '" data-itemdetail="1" style="display:none;margin:2px 0 6px 18px;padding:4px;border-left:2px solid var(--ThemeBorderColor);font-size:0.8em;">'; 
                if (showDiff && item.current && item.incoming) {
                    try {
                        html += renderFieldDiffTable(JSON.parse(item.current), JSON.parse(item.incoming));
                    } catch (e) {
                        html += '<pre style="font-size:0.78em;margin:0;white-space:pre-wrap;">'
                            + '<span style="color:#dc3545;">' + escapeHtml(gt('local', 'Local')) + ': </span>' + escapeHtml(item.current) + '\n'
                            + '<span style="color:#28a745;">' + escapeHtml(gt('incoming', 'Incoming')) + ': </span>' + escapeHtml(item.incoming) + '</pre>';
                    }
                } else if (showData && item.data) {
                    try {
                        const obj = JSON.parse(item.data);
                        html += '<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:inherit;">';
                        for (const [k, v] of Object.entries(obj)) {
                            const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
                            const uid = Math.random().toString(36).substring(2, 9);
                            html += '<tr><td style="padding:1px 6px;font-size:12px;font-family:monospace;color:#aaa;white-space:nowrap;width:15%;border:none;">' + escapeHtml(k) + '</td>'
                                    + '<td style="padding:1px 6px;font-size:12px;word-break:break-all;width:85%;border:none;">' + truncateCell(val, uid) + '</td></tr>';
                        }
                        html += '</table>';
                    } catch (e) {
                        html += '<pre style="font-size:0.78em;margin:0;white-space:pre-wrap;">' + escapeHtml(item.data) + '</pre>';
                    }
                }
                html += '</div>';
            }
            html += '</div>';
        }
        return html;
    }

    function renderDiff(diff) {
        const entityLabels = {
            parameters: getEntityLabel('parameters', 'Parameters'), pages: getEntityLabel('pages', 'Pages'), alarms: getEntityLabel('alarms', 'Alarms'), events: getEntityLabel('events', 'Events'),
            schedules: getEntityLabel('schedules', 'Schedules'), converters: getEntityLabel('converters', 'Converters'), userGroups: getEntityLabel('userGroups', 'User Groups'),
            users: getEntityLabel('users', 'Users'), dataForwarders: getEntityLabel('dataForwarders', 'Data Forwarders'), localVariables: getEntityLabel('localVariables', 'Local Variables'),
            modbusTcpDevices: getEntityLabel('modbusTcpDevices', 'Modbus TCP Devices'), opcUaDevices: getEntityLabel('opcUaDevices', 'OPC-UA Devices'),
            mqttClients: getEntityLabel('mqttClients', 'MQTT Clients'), mqttBrokerUsers: getEntityLabel('mqttBrokerUsers', 'MQTT Broker Users'), mqttDevices: getEntityLabel('mqttDevices', 'MQTT Devices'),
            ethernetIPDevices: getEntityLabel('ethernetIPDevices', 'EthernetIP Devices'), dnp3Devices: getEntityLabel('dnp3Devices', 'DNP3 Devices'),
            bacnetDevices: getEntityLabel('bacnetDevices', 'Bacnet Devices'), iec104Devices: getEntityLabel('iec104Devices', 'IEC104 Devices'), melsecDevices: getEntityLabel('melsecDevices', 'MELSEC Devices'), ethernetIPGenericDevices: getEntityLabel('ethernetIPGenericDevices', 'EtherNet/IP Generic Devices'), beckhoffAdsDevices: getEntityLabel('beckhoffAdsDevices', 'Beckhoff ADS Devices'), s7Devices: getEntityLabel('s7Devices', 'S7 Devices'),
            icmpDevices: getEntityLabel('icmpDevices', 'ICMP Devices'), kafkaDevices: getEntityLabel('kafkaDevices', 'Kafka Devices'), pythonScripts: getEntityLabel('pythonScripts', 'Python Scripts'),
            // The server diffs and keep-local-filters these three since F20; leaving them out of
            // this map silently applied ALL incoming UDT/Asset content on Confirm Merge with no
            // per-item choice, because a diff key without a label never renders a tab.
            assets: getEntityLabel('assets', 'Assets'),
            udtDefinitions: getEntityLabel('udtDefinitions', 'UDT Definitions'),
            udtInstances: getEntityLabel('udtInstances', 'UDT Instances'),
            loginBackgroundFiles: getEntityLabel('loginBackgroundFiles', 'Login Background'),
            onlineProjectFiles: getEntityLabel('onlineProjectFiles', 'Online Project Files'),
            offlineProjectFiles: getEntityLabel('offlineProjectFiles', 'Offline Project Files'),
            pythonLibraryFiles: getEntityLabel('pythonLibraryFiles', 'Python Library Files'),
            modbusTcpVariables: getEntityLabel('modbusTcpVariables', 'Modbus TCP Variables'), opcUaVariables: getEntityLabel('opcUaVariables', 'OPC-UA Variables'),
            mqttVariables: getEntityLabel('mqttVariables', 'MQTT Variables'), ethernetIPVariables: getEntityLabel('ethernetIPVariables', 'EthernetIP Variables'),
            dnp3Variables: getEntityLabel('dnp3Variables', 'DNP3 Variables'),
            bacnetVariables: getEntityLabel('bacnetVariables', 'Bacnet Variables'), iec104Variables: getEntityLabel('iec104Variables', 'IEC104 Variables'), melsecVariables: getEntityLabel('melsecVariables', 'MELSEC Variables'), ethernetIPGenericVariables: getEntityLabel('ethernetIPGenericVariables', 'EtherNet/IP Generic Variables'), beckhoffAdsVariables: getEntityLabel('beckhoffAdsVariables', 'Beckhoff ADS Variables'), s7Variables: getEntityLabel('s7Variables', 'S7 Variables'),
            recipeStores: getEntityLabel('recipeStores', 'Recipes')
        };
        let totalAdded = 0, totalDeleted = 0, totalModified = 0;
        let hasChanges = false;

        // Collect only entities that have changes. Iterate the DIFF's keys (the label map
        // provides ordering and naming): a server section absent from the label map used to
        // vanish from the dialog entirely and merge all-incoming with no per-item choice.
        const orderedKeys = Object.keys(entityLabels).filter(k => diff[k] !== undefined)
            .concat(Object.keys(diff).filter(k => !(k in entityLabels)));
        const tabs = [];
        for (const key of orderedKeys) {
            const label = entityLabels[key] || key;
            const e = diff[key];
            if (!e) continue;
            const nAdded    = e.added    ? e.added.length    : 0;
            const nDeleted  = e.deleted  ? e.deleted.length  : 0;
            const nModified = e.modified ? e.modified.length : 0;
            if (nAdded + nDeleted + nModified === 0) continue;
            hasChanges = true;
            totalAdded    += nAdded;
            totalDeleted  += nDeleted;
            totalModified += nModified;
            tabs.push({ key, label, e, nAdded, nDeleted, nModified });
        }

        if (!hasChanges) {
            return { html: '<span class="text-success"><i class="fas fa-check"></i> ' + escapeHtml(gt('noDifferencesExact', 'No differences — incoming state is identical to current.')) + '</span>', totalAdded: 0, totalDeleted: 0, totalModified: 0, hasChanges: false };
        }

        const tabsId = 'gittabs_' + Math.random().toString(36).substring(2, 7);

        // Tab strip
        let tabStrip = '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:10px;border-bottom:2px solid var(--ThemeBorderColor);padding-bottom:0;">';
        tabs.forEach((t, i) => {
            const badge = (t.nModified ? '<span style="color:#fd7e14;">~' + t.nModified + '</span>' : '')
                        + (t.nAdded    ? '<span style="color:#28a745;margin-left:2px;">+' + t.nAdded + '</span>' : '')
                        + (t.nDeleted  ? '<span style="color:#6c757d;margin-left:2px;">·' + t.nDeleted + '</span>' : '');
            tabStrip += '<button type="button" id="' + tabsId + '_tab_' + i + '" '
                + 'onclick="(function(btn){document.querySelectorAll(\'[data-tabgroup=\\\'' + tabsId + '\\\']\').forEach(function(el){el.style.display=\'none\';});'
                + 'document.querySelectorAll(\'[data-tabbtng=\\\'' + tabsId + '\\\']\').forEach(function(el){el.style.borderBottom=\'2px solid transparent\';el.style.fontWeight=\'400\';el.style.color=\'var(--ThemeMutedColor)\';});'
                + 'document.getElementById(\'' + tabsId + '_panel_' + i + '\').style.display=\'block\';'
                + 'btn.style.borderBottom=\'2px solid var(--ThemeButtonColor)\';btn.style.fontWeight=\'600\';btn.style.color=\'var(--ThemeFontColor)\';'
                + '})(this)" '
                + 'data-tabbtng="' + tabsId + '" '
                + 'style="padding:4px 10px;border:none;background:none;cursor:pointer;font-size:0.82em;border-bottom:2px solid ' + (i === 0 ? 'var(--ThemeButtonColor)' : 'transparent') + ';'
                + 'font-weight:' + (i === 0 ? '600' : '400') + ';color:' + (i === 0 ? 'var(--ThemeFontColor)' : 'var(--ThemeMutedColor)') + ';white-space:nowrap;">'
                + escapeHtml(t.label) + (badge ? ' <span style="font-size:0.85em;margin-left:3px;">' + badge + '</span>' : '')
                + '</button>';
        });
        tabStrip += '</div>';

        // Tab panels
        let panels = '';
        tabs.forEach((t, i) => {
            panels += '<div id="' + tabsId + '_panel_' + i + '" data-tabgroup="' + tabsId + '" style="display:' + (i === 0 ? 'block' : 'none') + ';">';
            panels += renderSubTabs(t.e.added, t.e.deleted, t.e.modified, t.key);
            panels += '</div>';
        });

        const html = tabStrip + panels;
        return { html, totalAdded, totalDeleted, totalModified, hasChanges };
    }

    const importModalDialog = document.getElementById('gitImportModalDialog');
    function setImportModalWide(wide) {
        if (!importModalDialog) return;
        importModalDialog.style.maxWidth = wide ? '85vw' : '600px';
        importModalDialog.style.width   = wide ? '85vw' : '600px';
        importModalDialog.style.height  = wide ? '90vh' : 'auto';
    }

    function showImportModal(title, description, onReplace, onMergeConfirm, diffHash) {
        if (!importModalBS) return;
        setImportModalWide(false);

        // Reset panels
        if (importTitle)     importTitle.innerHTML = '<i class="fas fa-file-import"></i> ' + escapeHtml(title);
        if (importModeDesc)  importModeDesc.textContent = description;
        importModePanel.style.display = '';
        importDiffPanel.style.display = 'none';
        importDiffContent.innerHTML = '<span class="text-muted"><i class="fas fa-spinner fa-spin"></i> ' + escapeHtml(gt('showDiffLoading', 'Loading diff...')) + '</span>';

        // Reset footer to just Cancel
        importFooter.innerHTML = '<button type="button" class="btn btn-secondary" id="gitImportCancelBtn"><i class="fas fa-times"></i> ' + escapeHtml(gt('cancel', 'Cancel')) + '</button>';
        document.getElementById('gitImportCancelBtn').addEventListener('click', () => hideThenShow(importModal, gitMainModal));

        // Replace button
        document.getElementById('gitImportReplaceBtn').onclick = () => runExclusive(async function () {
            setOutput('<span class="text-muted">' + escapeHtml(gt('working', 'Working...')) + '</span>');
            hideThenShow(importModal, gitMainModal);
            await onReplace();
        });

        // Merge button — load diff then show confirm button in footer
        document.getElementById('gitImportMergeBtn').onclick = async function () {
            setImportModalWide(true);
            importModePanel.style.display = 'none';
            importDiffPanel.style.display = 'block';
            if (importDiffSummary) importDiffSummary.innerHTML = '<span class="text-muted"><i class="fas fa-spinner fa-spin"></i> ' + escapeHtml(gt('loading', 'Loading...')) + '</span>';
            importDiffContent.innerHTML = '';

            const url = diffHash ? '/API/Git/PreviewDiff/' + diffHash : '/API/Git/PreviewDiff';
            const data = await apiCall(url);
            let previewOk = false;
            if (data.error) {
                if (importDiffSummary) importDiffSummary.innerHTML = '';
                importDiffContent.innerHTML = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
            } else {
                previewOk = true;
                const result = renderDiff(data.diff);
                importDiffContent.innerHTML = result.html;
                if (importDiffSummary) {
                    if (result.hasChanges) {
                        importDiffSummary.innerHTML =
                            '<span style="color:#28a745;"><i class="fas fa-plus-circle"></i> <strong>' + result.totalAdded    + '</strong> ' + escapeHtml(gt('addedSummary', 'added')) + '</span>'
                          + '<span style="color:#6c757d;"><i class="fas fa-bookmark"></i> <strong>' + result.totalDeleted  + '</strong> ' + escapeHtml(gt('localOnlySummary', 'local only')) + '</span>'
                          + '<span style="color:#fd7e14;"><i class="fas fa-pen"></i> <strong>' + result.totalModified + '</strong> ' + escapeHtml(gt('modifiedSummary', 'modified')) + '</span>';
                    } else {
                        importDiffSummary.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> ' + escapeHtml(gt('noDifferencesSummary', 'No differences')) + '</span>';
                    }
                }
            }

            // Footer: Back + Confirm Merge. NO Confirm button when the preview failed - it
            // would merge everything with zero per-item choices, exactly what this dialog
            // exists to prevent.
            importFooter.innerHTML =
                '<button type="button" class="btn btn-secondary me-auto" id="gitImportBackBtn"><i class="fas fa-arrow-left"></i> ' + escapeHtml(gt('back', 'Back')) + '</button>'
                + (previewOk ? '<button type="button" class="btn btn-warning" id="gitImportConfirmMergeBtn"><i class="fas fa-code-branch"></i> ' + escapeHtml(gt('confirmMerge', 'Confirm Merge')) + '</button>' : '')
                + '<button type="button" class="btn btn-secondary ms-2" id="gitImportCancelBtn2"><i class="fas fa-times"></i> ' + escapeHtml(gt('cancel', 'Cancel')) + '</button>';
            document.getElementById('gitImportBackBtn').addEventListener('click', function () {
                setImportModalWide(false);
                importDiffPanel.style.display = 'none';
                if (importDiffSummary) importDiffSummary.innerHTML = '';
                importModePanel.style.display = '';
                importFooter.innerHTML = '<button type="button" class="btn btn-secondary" id="gitImportCancelBtn"><i class="fas fa-times"></i> ' + escapeHtml(gt('cancel', 'Cancel')) + '</button>';
                document.getElementById('gitImportCancelBtn').addEventListener('click', () => hideThenShow(importModal, gitMainModal));
            });
            document.getElementById('gitImportCancelBtn2').addEventListener('click', () => hideThenShow(importModal, gitMainModal));
            document.getElementById('gitImportConfirmMergeBtn')?.addEventListener('click', () => runExclusive(async function () {
                setOutput('<span class="text-muted">' + escapeHtml(gt('working', 'Working...')) + '</span>');
                hideThenShow(importModal, gitMainModal);
                await onMergeConfirm();
            }));
        };

        hideThenShow(gitMainModal, importModal);
    }

    async function doRestore(hash) {
        showImportModal(
            gt('restoreCommitTitle', 'Restore commit {0}', hash),
            gt('restoreCommitDescription', 'Choose how to restore this commit into the current database:'),
            async function () { // Replace
                const data = await apiCall('/API/Git/Restore/' + hash, 'POST', { merge: false });
                if (data.error) {
                    let html = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
                    if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;font-size:0.8em;">' + escapeHtml(data.details.join('\n')) + '</pre>';
                    setOutput(html);
                } else {
                    setOutput('<span class="text-success">' + escapeHtml(gt('replaceSuccessfulReloading', 'Replace successful! Reloading...')) + '</span>');
                    setTimeout(() => window.location.reload(), 1500);
                }
            },
            async function () { // Merge confirmed
                const keepLocal = gitCollectKeepLocal();
                const data = await apiCall('/API/Git/Restore/' + hash, 'POST', { merge: true, keepLocal });
                if (data.error) {
                    let html = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
                    if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;font-size:0.8em;">' + escapeHtml(data.details.join('\n')) + '</pre>';
                    setOutput(html);
                }
                else { setOutput('<span class="text-success">' + escapeHtml(gt('mergeSuccessfulReloading', 'Merge successful! Reloading...')) + '</span>'); setTimeout(() => window.location.reload(), 1500); }
            },
            hash
        );
    }

    async function doCommit(push) {
        if (gitBusy) return;
        const message = commitMsg.value.trim();
        if (!message) {
            setOutput('<span class="text-warning">' + escapeHtml(gt('pleaseEnterCommitMessage', 'Please enter a commit message.')) + '</span>');
            return;
        }
        setOutput('<span class="text-muted">' + escapeHtml(gt('exportingAndCommitting', 'Exporting and committing...')) + '</span>');
        gitBusy = true;
        let data;
        try { data = await apiCall('/API/Git/Push', 'POST', { message: message, push: push }); }
        finally { gitBusy = false; }
        if (data.error) {
            let html = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
            if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;">' + escapeHtml(data.details.join('\n')) + '</pre>';
            setOutput(html);
        } else {
            let html = '<span class="text-success">' + escapeHtml(gt('success', 'Success!')) + '</span>';
            if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;">' + escapeHtml(data.details.join('\n')) + '</pre>';
            setOutput(html);
            commitMsg.value = '';
            refreshStatus();
            refreshLog();
        }
    }

    async function doPull(importToDb) {
        showImportModal(
            gt('pullImportTitle', 'Pull & Import'),
            gt('pullImportDescription', 'Choose how to import the remote state into the current database:'),
            async function () { // Replace
                const data = await apiCall('/API/Git/Pull', 'POST', { import: true, merge: false, branchName: gitCurrentBranchName });
                if (data.error) {
                    let html = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
                    if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;font-size:0.8em;">' + escapeHtml(data.details.join('\n')) + '</pre>';
                    setOutput(html);
                } else {
                    let html = '<span class="text-success">' + escapeHtml(gt('pullReplaceSuccessfulReloading', 'Pull & Replace successful! Reloading...')) + '</span>';
                    if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;font-size:0.8em;">' + escapeHtml(data.details.join('\n')) + '</pre>';
                    setOutput(html);
                    setTimeout(() => window.location.reload(), 2000);
                }
            },
            async function () { // Merge confirmed
                const keepLocal = gitCollectKeepLocal();
                const data = await apiCall('/API/Git/Pull', 'POST', { import: true, merge: true, branchName: gitCurrentBranchName, keepLocal });
                if (data.error) {
                    let html = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
                    if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;">' + escapeHtml(data.details.join('\n')) + '</pre>';
                    setOutput(html);
                } else { setOutput('<span class="text-success">' + escapeHtml(gt('pullMergeSuccessfulReloading', 'Pull & Merge successful! Reloading...')) + '</span>'); setTimeout(() => window.location.reload(), 1500); }
            },
            null // null = remote HEAD for diff
        );
    }

    async function doPushOnly() {
        if (gitBusy) return;
        setOutput('<span class="text-muted">' + escapeHtml(gt('working', 'Working...')) + '</span>');
        gitBusy = true;
        let data;
        try { data = await apiCall('/API/Git/PushOnly', 'POST', {}); }
        finally { gitBusy = false; }
        if (data.error) {
            let html = '<span class="text-danger">' + escapeHtml(data.error) + '</span>';
            if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;">' + escapeHtml(data.details) + '</pre>';
            setOutput(html);
        } else {
            let html = '<span class="text-success">' + escapeHtml(gt('success', 'Success!')) + '</span>';
            if (data.details) html += '<br/><pre style="margin:0;white-space:pre-wrap;">' + escapeHtml(data.details) + '</pre>';
            setOutput(html);
            refreshStatus();
            refreshLog();
        }
    }

    async function doClearLocal() {
        const confirmed = confirm(gt('confirmClearLocal', 'Are you sure you want to clear the local GitExport folder?'));
        if (!confirmed) return;

        setOutput('<span class="text-muted">' + escapeHtml(gt('clearingLocalRepository', 'Clearing local repository...')) + '</span>');
        const data = await apiCall('/API/Git/ClearLocal', 'POST', {});
        if (data.error) {
            setOutput('<span class="text-danger">' + escapeHtml(data.error) + '</span>');
            return;
        }

        statusPanel.innerHTML = '<span class="text-muted">' + escapeHtml(gt('localRepositoryCleared', 'Local repository cleared.')) + '</span>';
        logPanel.innerHTML = '<span class="text-muted">' + escapeHtml(gt('localRepositoryCleared', 'Local repository cleared.')) + '</span>';
        setOutput('<span class="text-success">' + escapeHtml(gt('localRepositoryCleared', 'Local repository cleared.')) + '</span>');
    }

    async function loadSettings() {
        const data = await apiCall('/API/Git/Settings');
        if (data.error) return;
        const f = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        f('gitSettingRemoteUrl', data.remoteUrl);
        f('gitSettingUsername', data.username);
        // Token is never returned — show placeholder indicating it is set or not
        const tokenEl = document.getElementById('gitSettingToken');
        if (tokenEl) tokenEl.placeholder = data.tokenSet ? gt('tokenSetPlaceholder', 'Token is set (leave empty to keep)') : gt('enterTokenPlaceholder', 'Enter Personal Access Token');
    }

    async function saveSettings() {
        const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
        const body = {
            remoteUrl: g('gitSettingRemoteUrl'),
            username: g('gitSettingUsername'),
            token: g('gitSettingToken')
        };
        setOutput('<span class="text-muted">' + escapeHtml(gt('savingSettings', 'Saving settings...')) + '</span>');
        const data = await apiCall('/API/Git/Settings', 'POST', body);
        if (data.error) {
            setOutput('<span class="text-danger">' + escapeHtml(data.error) + '</span>');
        } else {
            setOutput('<span class="text-success">' + escapeHtml(gt('settingsSaved', 'Settings saved.')) + '</span>');
            // Clear token field after save
            const tokenEl = document.getElementById('gitSettingToken');
            if (tokenEl) { tokenEl.value = ''; tokenEl.placeholder = gt('tokenSetPlaceholder', 'Token is set (leave empty to keep)'); }
        }
    }

    // Bind events
    document.getElementById('gitRefreshStatus')?.addEventListener('click', refreshStatus);
    document.getElementById('gitRefreshBranches')?.addEventListener('click', refreshBranches);
    document.getElementById('gitCheckoutBranchBtn')?.addEventListener('click', doCheckoutBranch);
    document.getElementById('gitCreateBranchBtn')?.addEventListener('click', doCreateBranch);
    document.getElementById('gitClearLocalBtn')?.addEventListener('click', doClearLocal);
    document.getElementById('gitRefreshLog')?.addEventListener('click', refreshLog);
    document.getElementById('gitCommitPushBtn')?.addEventListener('click', function () { doCommit(true); });
    document.getElementById('gitPullImportBtn')?.addEventListener('click', function () { doPull(true); });
    document.getElementById('gitSaveSettingsBtn')?.addEventListener('click', saveSettings);

    // Auto-refresh when modal opens
    const gitModal = document.getElementById('GitModal');
    if (gitModal) {
        gitModal.addEventListener('shown.bs.modal', function () {
            refreshStatus();
            refreshLog();
            refreshBranches();
            loadSettings();
        });
    }
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.git-restore-btn');
        if (btn) doRestore(btn.getAttribute('data-hash'));
    });

})();

// Global toggle for keep-local / use-incoming choice buttons in diff modal
function gitDiffChoiceToggle(btn) {
    const choice = btn.getAttribute('data-choice');
    const val    = btn.getAttribute('data-val');
    // Find the sibling button
    const parent = btn.parentElement;
    const btns   = parent.querySelectorAll('[data-choice]');
    btns.forEach(function (b) {
        const isActive = b.getAttribute('data-val') === val;
        b.setAttribute('data-selected', isActive ? '1' : '0');
        if (isActive) {
            b.style.background = b.getAttribute('data-val') === 'incoming' ? '#fd7e14' : '#495057';
            b.style.color = '#fff';
            b.style.borderColor = b.getAttribute('data-val') === 'incoming' ? '#fd7e14' : '#495057';
        } else {
            b.style.background = '#f8f9fa';
            b.style.color = '#333';
            b.style.borderColor = '#ccc';
        }
    });
}

// Collect keepLocal map from the current diff panel state
function gitCollectKeepLocal() {
    const keepLocal = {};
    document.querySelectorAll('#gitImportDiffContent [data-choice][data-val="local"]').forEach(function (btn) {
        // Only count it if "Keep Local" is the selected choice. data-selected is the state;
        // comparing the serialized background color broke on engine serialization quirks.
        if (btn.getAttribute('data-selected') !== '1') return;
        const raw = btn.getAttribute('data-choice'); // "entityKey||itemName"
        const sep = raw.indexOf('||');
        if (sep < 0) return;
        const entityKey = raw.substring(0, sep);
        const itemName  = raw.substring(sep + 2);
        if (!keepLocal[entityKey]) keepLocal[entityKey] = [];
        keepLocal[entityKey].push(itemName);
    });
    return keepLocal;
}
