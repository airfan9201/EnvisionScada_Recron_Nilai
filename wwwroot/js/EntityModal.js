// EntityModal - shared create/edit modal driver for driver config pages (Modbus TCP first).
// Both modes submit through the Config API (/API/Config/...): create = POST [dto], edit = PUT [{Id, ...dto}].
//
// Modal markup contract (see _ModbusTcpDeviceModalPartial.cshtml):
//   root:   #EntityModal_<entity> (Bootstrap modal) containing one <form> whose reset() restores create defaults
//   fields: [data-field="X"] inputs/selects; data-type="bool" -> .checked, data-type="number" -> numeric JSON
//   error:  [data-entitymodal-error] alert div
//   labels: [data-entitymodal-create] / [data-entitymodal-edit] elements toggled per mode
// Row inputs follow the existing 'Update<entity><Field> <id>' id convention; on a successful edit the
// saved values are synced back into them so inline cell edits and Duplicate stay consistent.
var EntityModal = (function () {
    'use strict';

    var configs = {};
    var state = {};

    function modalEl(entity) { return document.getElementById('EntityModal_' + entity); }
    function fieldEls(entity) { return modalEl(entity).querySelectorAll('[data-field]'); }
    function rowInput(entity, field, id) { return document.getElementById('Update' + entity + field + ' ' + id); }

    function hideError(entity) {
        var alertEl = modalEl(entity).querySelector('[data-entitymodal-error]');
        if (alertEl) { alertEl.classList.add('d-none'); alertEl.innerHTML = ''; }
    }

    function showError(entity, message) {
        var alertEl = modalEl(entity).querySelector('[data-entitymodal-error]');
        if (alertEl) { alertEl.innerHTML = message; alertEl.classList.remove('d-none'); }
    }

    function setMode(entity, mode) {
        state[entity] = state[entity] || {};
        state[entity].mode = mode;
        modalEl(entity).querySelectorAll('[data-entitymodal-create]').forEach(function (el) {
            el.classList.toggle('d-none', mode !== 'create');
        });
        modalEl(entity).querySelectorAll('[data-entitymodal-edit]').forEach(function (el) {
            el.classList.toggle('d-none', mode !== 'edit');
        });
        hideError(entity);
    }

    function register(entity, config) {
        configs[entity] = config;
        applyRequiredMarkers(entity);
    }

    // Reads data-required-fields (comma-separated Dto property names, see ConfigValidator.GetRequiredFieldNames)
    // off the modal root and marks the matching [data-field] inputs/labels as required.
    function applyRequiredMarkers(entity) {
        var modal = modalEl(entity);
        var raw = modal && modal.dataset.requiredFields;
        if (!raw) { return; }
        raw.split(',').forEach(function (field) {
            field = field.trim();
            if (!field) { return; }
            var input = modal.querySelector('[data-field="' + field + '"]');
            if (!input) { return; }
            input.required = true;
            var label = input.id ? modal.querySelector('label[for="' + input.id + '"]') : null;
            if (label && !label.querySelector('.entity-modal-required-marker')) {
                var marker = document.createElement('span');
                marker.className = 'entity-modal-required-marker text-danger';
                marker.setAttribute('aria-hidden', 'true');
                marker.textContent = ' *';
                label.appendChild(marker);
            }
        });
    }

    function openCreate(entity) {
        var modal = modalEl(entity);
        bindCloseSync(entity, modal);
        var form = modal.querySelector('form');
        if (form) { form.reset(); }
        state[entity] = state[entity] || {};
        state[entity].createdSinceOpen = false;
        setMode(entity, 'create');
        new bootstrap.Modal(modal).show();
    }

    // Create keeps the modal open so several records can be added in a row. The grid is refreshed
    // once, when the modal is finally closed, and only if at least one create actually happened.
    function bindCloseSync(entity, modal) {
        if (!modal || modal.dataset.emCloseBound) { return; }
        modal.dataset.emCloseBound = '1';
        modal.addEventListener('hidden.bs.modal', function () {
            var st = state[entity];
            if (!st || !st.createdSinceOpen) { return; }
            st.createdSinceOpen = false;
            var section = document.querySelector('[data-grid]');
            if (section && section.dataGrid && typeof section.dataGrid.reload === 'function') {
                section.dataGrid.reload();
            } else {
                location.reload();
            }
        });
    }

    function bumpRowCount() {
        var el = document.querySelector('[data-dg-total]');
        if (!el) { return; }
        var n = parseInt((el.textContent || '').replace(/[^0-9-]/g, ''), 10);
        if (!isNaN(n)) { el.textContent = n + 1; }
    }

    // Transient in-modal "Created" confirmation (the modal stays open, so this is where the eye is).
    function showCreated(entity) {
        var modal = modalEl(entity);
        var el = modal.querySelector('[data-entitymodal-created]');
        if (!el) {
            el = document.createElement('div');
            el.setAttribute('data-entitymodal-created', '');
            el.className = 'alert alert-success';
            el.style.transition = 'opacity 300ms ease';
            el.style.marginBottom = '10px';
            var anchor = modal.querySelector('[data-entitymodal-error]');
            if (anchor && anchor.parentNode) { anchor.parentNode.insertBefore(el, anchor.nextSibling); }
            else { var form = modal.querySelector('form'); if (form) { form.insertBefore(el, form.firstChild); } }
        }
        var t = window.EntityModalTranslations;
        el.textContent = (t && t.messages && t.messages.Created) || 'Created';
        el.style.display = '';
        el.style.opacity = '1';
        clearTimeout(el._emHide);
        el._emHide = setTimeout(function () {
            el.style.opacity = '0';
            setTimeout(function () { el.style.display = 'none'; }, 320);
        }, 700);
    }

    // Keep the entered values and put the cursor back on the identity field so near-identical
    // records (Tank1_Level, Tank2_Level, ...) only need a name change before the next create.
    function focusNameField(entity) {
        var modal = modalEl(entity);
        var field = modal.querySelector('[data-field="Name"]')
            || modal.querySelector('[data-field="UserName"]')
            || modal.querySelector('[data-field="GroupName"]')
            || modal.querySelector('[data-field="Condition"]')
            || modal.querySelector('[data-field]:not([data-type="bool"])');
        if (!field) { return; }
        try { field.focus(); if (typeof field.select === 'function') { field.select(); } } catch (e) { }
    }

    function onCreated(entity) {
        state[entity] = state[entity] || {};
        state[entity].createdSinceOpen = true;
        bumpRowCount();
        showCreated(entity);
        focusNameField(entity);
    }

    // A UDT-managed row is editable, but only in the fields the definition does NOT own. The
    // owned set is per member (a protocol extra the member leaves empty stays per-row), so it
    // comes from the server rather than a list duplicated here. Everything is re-enabled first,
    // because the modal element is shared by every row of the page.
    function applyManagedFields(entity, id) {
        fieldEls(entity).forEach(function (el) { el.disabled = false; el.removeAttribute('title'); });
        var row = document.querySelector('[data-row-id="' + id + '"][data-udt-instance]');
        var instanceId = row ? parseInt(row.getAttribute('data-udt-instance'), 10) : 0;
        if (!instanceId) { return; }
        var memberId = parseInt(row.getAttribute('data-udt-member'), 10) || 0;

        fetch('/API/Config/UdtInstances/ManagedFields?instanceId=' + instanceId + '&memberId=' + memberId, { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var fields = (data && data.fields) || [];
                if (!fields.length) { return; }
                var lookup = {};
                fields.forEach(function (f) { lookup[f] = true; });
                fieldEls(entity).forEach(function (el) {
                    if (!lookup[el.getAttribute('data-field')]) { return; }
                    el.disabled = true;
                    el.title = (window.EntityModalTranslations && EntityModalTranslations.messages
                        && EntityModalTranslations.messages.UdtManagedField) || '';
                });
            })
            .catch(function () { /* leave the form fully editable; the API still refuses the write */ });
    }

    // A <select> silently refuses a value that is not one of its options: el.value stays "", the
    // modal shows an empty dropdown, and saving fails the field's Required check. That is not a
    // corrupt row - a column can legitimately hold a value the dropdown does not list (OPC UA
    // Subscription stores "1" while the list offers "Subscription 1", and both are accepted by the
    // driver, which normalises them). So keep the stored value as an extra option, exactly like
    // UamVocabField does in the UDT editor: the row round-trips unchanged instead of being blanked
    // or silently rewritten to a different subscription.
    function setFieldValue(el, value) {
        if (el.tagName !== 'SELECT') { el.value = value; return; }
        el.value = value;
        if (el.value === value || value === '' || value === null || value === undefined) { return; }
        var extra = document.createElement('option');
        extra.value = value;
        extra.textContent = value;
        extra.setAttribute('data-entitymodal-extra', '');
        el.appendChild(extra);
        el.value = value;
    }

    function openEdit(entity, id) {
        // Drop the extra options a previous row added; the modal is shared by every row.
        modalEl(entity).querySelectorAll('option[data-entitymodal-extra]').forEach(function (o) { o.remove(); });
        fieldEls(entity).forEach(function (el) {
            var row = rowInput(entity, el.getAttribute('data-field'), id);
            if (!row) { return; }
            if (el.getAttribute('data-type') === 'bool') { el.checked = row.checked || false; }
            else { setFieldValue(el, row.value); }
        });
        setMode(entity, 'edit');
        state[entity].id = id;
        applyManagedFields(entity, id);
        new bootstrap.Modal(modalEl(entity)).show();
    }

    function collect(entity) {
        var dto = {};
        fieldEls(entity).forEach(function (el) {
            var name = el.getAttribute('data-field');
            var type = el.getAttribute('data-type');
            if (type === 'bool') { dto[name] = el.checked; }
            else if (type === 'number') { dto[name] = Number(el.value) || 0; }
            else { dto[name] = el.value; }
        });
        return dto;
    }

    function syncRow(entity, id, dto) {
        Object.keys(dto).forEach(function (name) {
            var row = rowInput(entity, name, id);
            if (!row) { return; }
            if (row.type === 'checkbox') { row.checked = dto[name] === true; }
            else { row.value = dto[name]; }
        });
    }

    function submit(entity, signatureToken) {
        var config = configs[entity];
        var current = state[entity] || {};
        var mode = current.mode || 'create';
        var dto = collect(entity);
        if (config.extraFields) {
            Object.assign(dto, typeof config.extraFields === 'function' ? config.extraFields() : config.extraFields);
        }
        var url = config.apiUrl;
        var method = 'POST';

        if (mode === 'edit') {
            method = 'PUT';
            dto.Id = parseInt(current.id, 10);
        }
        else if (config.createQueryProvider) {
            url += config.createQueryProvider();
        }
        else if (config.deviceIdProvider) {
            url += '?deviceId=' + encodeURIComponent(config.deviceIdProvider());
        }

        hideError(entity);

        var headers = { 'Content-Type': 'application/json' };
        if (signatureToken) { headers['X-Signature-Token'] = signatureToken; }

        fetch(url, {
            method: method,
            credentials: 'same-origin',
            headers: headers,
            body: JSON.stringify([dto])
        })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            // Part 11 electronic signature flow (F19 Phase 2): collect the signature and retry
            // the same save once with the token header.
            if (data && data.signatureRequired && !signatureToken && window.EnvisionSignature) {
                EnvisionSignature.request(data.actionKey, data.meanings).then(function (token) {
                    submit(entity, token);
                }).catch(function () { /* signature cancelled */ });
                return;
            }

            if (data && data.success) {
                if (mode === 'create') {
                    onCreated(entity);
                    return;
                }
                syncRow(entity, current.id, dto);
                var instance = bootstrap.Modal.getInstance(modalEl(entity));
                if (instance) { instance.hide(); }
                if (typeof ServerConfirm === 'function') { ServerConfirm(); }
                if (config.onEditSaved) { config.onEditSaved(current.id, dto); }
                // Variable-array parent saves fan out to element rows syncRow cannot reflect
                // (resize adds/removes rows, a rename renames all of them): reload the grid.
                if ('ArrayCount' in dto && typeof window.DataGridArrayRefresh === 'function') {
                    window.DataGridArrayRefresh(current.id, dto.ArrayCount);
                }
                offerRenamePropagation(data);
                return;
            }

            var error = (data && data.error) || '';
            if (error.indexOf('Authorization header') === 0 || error.indexOf('Authentication failed') === 0) {
                location.reload();
                return;
            }
            showError(entity, formatErrors(data) || 'Error');
        })
        .catch(function () {
            showError(entity, typeof errorOccurred !== 'undefined' ? errorOccurred : 'Error');
        });
    }

    // ---------- Variable rename: offer to rewire the references ----------
    //
    // Renaming a variable rewrites only its own row. Everything that USES it - page object
    // bindings, alarm and event conditions and messages, python scripts, schedules, converter
    // expressions, report template fields, UDT definition members - stores the name as text and
    // is left pointing at a key that no longer resolves, silently. The save answers with a
    // VariableRenameReferences warning carrying the old name, the new name and how many places
    // still name the old one; this turns that into a choice instead of a surprise.
    //
    // The rename itself is never fanned out by the save (see ConfigController.VariableRenamed):
    // renaming a variable so the existing references point at a DIFFERENT variable is a real
    // workflow, so nothing here happens without the operator asking for it.
    // The two wordings a rename warning comes in. Which entity was renamed travels as the FOURTH
    // argument (the message itself only uses the first three), and it is what names the endpoint
    // that rewires it - one route per entity type, because how far a rename fans out and where its
    // references can live both depend on what was renamed.
    var RENAME_KEYS = ['VariableRenameReferences', 'DeviceRenameReferences'];

    // warnings[] holds the English sentences and warningKeys[] the { key, args } beside them,
    // aligned by index (ValidationError serializes as its message string, the key travels apart).
    function renameWarning(data) {
        var keys = (data && data.warningKeys) || [];
        var texts = (data && data.warnings) || [];
        for (var i = 0; i < keys.length; i++) {
            if (!keys[i] || RENAME_KEYS.indexOf(keys[i].key) < 0) { continue; }

            var entityType = (keys[i].args || [])[3];
            if (!entityType) { continue; }

            return {
                keyInfo: keys[i],
                english: texts[i] || '',
                url: '/API/Config/' + encodeURIComponent(entityType) + '/RenameReferences'
            };
        }
        return null;
    }

    function message(key, fallback) {
        var translations = window.EntityModalTranslations;
        var text = translations && translations.messages ? translations.messages[key] : null;
        return text || fallback;
    }

    // Every save path calls this. It does two things, and the second one used to be missing
    // entirely: a successful save's warnings were read for the rename keys and everything else
    // was dropped on the floor.
    //
    // That silence had teeth. Renaming a device breaks every UDT/asset instance whose Device
    // parameter named it, and the API says so - but the operator saw nothing at all. One rename
    // left 24 instances naming a device that no longer existed, unpushable, with no sign of it.
    function offerRenamePropagation(data) {
        var info = renameWarning(data);
        var others = otherWarnings(data);

        if (info) {
            // One dialog, not two stacked on top of each other: the rename prompt is the primary
            // interaction, so anything else the save reported rides along underneath it.
            showRenameDialog(info, others);
            return;
        }

        if (others.length) { showPageError(others.join('<br/>')); }
    }

    // The warnings that are NOT the rename prompt, translated and ready to display.
    function otherWarnings(data) {
        var keys = (data && data.warningKeys) || [];
        var texts = (data && data.warnings) || [];
        var messages = [];

        for (var i = 0; i < texts.length; i++) {
            var keyInfo = keys[i];
            if (keyInfo && RENAME_KEYS.indexOf(keyInfo.key) >= 0) { continue; }
            var text = translateError(texts[i], keyInfo);
            if (text) { messages.push(text); }
        }

        return messages;
    }

    // The same prompt for a caller that is not a config API response: the Pages screen saves
    // through its own page handler, and the UDT push reports its renames as plain pairs.
    //
    // renames carries a whole SET when the caller renamed more than one thing at once (a push
    // renames every materialized row a definition change touched). The set MUST travel in one
    // request: applied one pair at a time, each call re-searches the database after the previous
    // one wrote to it, so a push that yields T[0]->T[1] and T[1]->T[2] walks a single binding all
    // the way to T[2] - a real but WRONG variable, showing a plausible live value.
    //
    // options.text overrides the dialog's own sentence, for a caller whose own wording is better
    // than "N place(s) still name X" (the push already says which rows it renamed), and
    // options.report replaces the result message for a host page that has no CustomModal of its
    // own - the Asset Manager lives on the Envision page and reports through its own alert.
    function promptRenameReferences(entityType, oldName, newName, count, options) {
        options = options || {};
        showRenameDialog({
            keyInfo: { key: 'VariableRenameReferences', args: [oldName, newName, String(count), entityType] },
            english: count + " place(s) in the project still name '" + oldName + "'. Update them to '" + newName + "'?",
            url: '/API/Config/' + encodeURIComponent(entityType) + '/RenameReferences',
            renames: (options.renames && options.renames.length) ? options.renames : null,
            text: options.text || '',
            report: typeof options.report === 'function' ? options.report : null,
            pairs: (options.pairs && options.pairs.length) ? options.pairs : null
        });
    }

    // Injected once, and every rule is scoped to the dialog's own id. The Envision page carries
    // global element selectors that put a border on every td, and the dialog is appended to the
    // body of whatever page opened it - so the table states its own borders and spacing rather
    // than inheriting whatever the host page happens to have.
    function ensureRenameStyles() {
        if (document.getElementById('EntityModal_RenameStyles')) { return; }
        var style = document.createElement('style');
        style.id = 'EntityModal_RenameStyles';
        style.textContent =
            // Tall enough to judge a list rather than peer at three rows of it: the whole point of
            // the table is that the operator reads every place before approving it.
            '#EntityModal_RenameReferences .em-rename-scroll{max-height:50vh;overflow:auto;margin:8px 0;border:1px solid rgba(0,0,0,.12);border-radius:6px;}' +
            '#EntityModal_RenameReferences .em-rename-pairs .em-rename-scroll{max-height:20vh;}' +
            '#EntityModal_RenameReferences .em-rename-table{width:100%;margin:0;font-size:.875rem;border-collapse:separate;border-spacing:0;}' +
            '#EntityModal_RenameReferences .em-rename-table th{position:sticky;top:0;z-index:1;background:var(--bs-tertiary-bg,#f2f2f2);font-weight:600;text-align:left;white-space:nowrap;}' +
            '#EntityModal_RenameReferences .em-rename-table th,#EntityModal_RenameReferences .em-rename-table td{border:0;border-bottom:1px solid rgba(0,0,0,.08);padding:6px 10px;vertical-align:top;}' +
            '#EntityModal_RenameReferences .em-rename-table tr:last-child td{border-bottom:0;}' +
            // Only the context column wraps. Type is an identifier (PageHtml, PythonScript) and
            // Location is a path: broken mid-word they read as two different things, and one page
            // of raw markup in the third column is enough to squeeze them to a letter per line.
            '#EntityModal_RenameReferences .em-rename-table td.em-rename-type,#EntityModal_RenameReferences .em-rename-table td.em-rename-location{white-space:nowrap;width:1%;}' +
            '#EntityModal_RenameReferences .em-rename-table td.em-rename-context{word-break:break-word;}' +
            // The value a data-actions or data-replacers attribute holds is a page of JSON, and
            // one such row used to be taller than the dialog. Six lines per row keeps the list
            // scannable and scrolls the rest inside its own cell.
            '#EntityModal_RenameReferences .em-rename-context-inner{max-height:6.5em;overflow:auto;}' +
            // Same yellow the Cross Reference list marks a hit with, so the two read alike.
            '#EntityModal_RenameReferences .em-rename-mark{background-color:var(--ThemeCrossRefMarker,#ffe066);}' +
            // The tick column stays as narrow as the box, and an unticked row is dimmed so what
            // will and will not be rewritten is readable at a glance while scrolling. Dimmed
            // only: a strikethrough over the value makes the very text the operator is judging
            // harder to read, and the row is still the thing being decided about.
            '#EntityModal_RenameReferences .em-rename-table th.em-rename-pick,#EntityModal_RenameReferences .em-rename-table td.em-rename-pick{width:1%;white-space:nowrap;padding-right:0;}' +
            '#EntityModal_RenameReferences .em-rename-table tr.em-rename-off td:not(.em-rename-pick){opacity:.45;}' +
            '#EntityModal_RenameReferences .em-rename-filter{display:flex;align-items:center;gap:8px;margin-top:8px;}' +
            '#EntityModal_RenameReferences .em-rename-filter input{flex:1 1 auto;}' +
            '#EntityModal_RenameReferences .em-rename-count{white-space:nowrap;}';
        document.head.appendChild(style);
    }

    function escapeHtml(value) {
        var div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function escapeRegex(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Marks the names that were actually matched inside the stored value, the same way the Cross
    // Reference list marks a hit. It is what makes a row judgeable: the context of a page object
    // is a page of JSON, and the only question the operator has is WHERE the old name sits in it.
    //
    // The marking happens in ESCAPED space - the text is escaped first and the terms are escaped
    // the same way before becoming a pattern - so a name containing & or < still lines up with
    // what is on screen and no part of the value can be injected as markup.
    function highlightTerms(text, terms) {
        var escaped = escapeHtml(text);
        var usable = (terms || []).filter(function (term) { return term; });
        if (!usable.length) { return escaped; }

        // Longest first: a device rename carries both PLC1 and PLC1.Level, and the shorter one
        // would otherwise mark half of the longer and leave the rest looking untouched.
        var pattern = usable.slice()
            .sort(function (a, b) { return b.length - a.length; })
            .map(function (term) { return escapeRegex(escapeHtml(term)); })
            .join('|');

        return escaped.replace(new RegExp('(' + pattern + ')', 'gi'),
            '<span class="em-rename-mark">$1</span>');
    }

    // A scrollable table rather than a growing modal: a push can rename thirty rows at once, and
    // an arrow-separated line per rename wraps into an unreadable block at the width of a dialog.
    function renameTable(headers, rows) {
        var head = headers.map(function (h) { return '<th>' + escapeHtml(h) + '</th>'; }).join('');
        var body = rows.map(function (cells) {
            return '<tr>' + cells.map(function (c) { return '<td>' + escapeHtml(c) + '</td>'; }).join('') + '</tr>';
        }).join('');
        return '<div class="em-rename-scroll"><table class="table table-sm em-rename-table">' +
               '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    // The renames themselves, when the caller renamed more than one thing in one operation.
    function renderRenamePairs(host, pairs) {
        if (!host) { return; }
        if (!pairs || !pairs.length) { host.innerHTML = ''; return; }
        host.innerHTML = renameTable(
            [message('From', 'From'), message('To', 'To')],
            pairs.map(function (p) { return [p.oldName, p.newName]; }));
    }

    // WHERE the old name is still written. The save answered with a count only, so the list is
    // fetched here - once, when the dialog opens - through the same preview the Review button
    // would have used. It fills in behind the buttons: the decision does not wait on it, and a
    // preview that fails leaves the dialog exactly as it was rather than blocking the rewire.
    //
    // Every place is ticked by default and can be UNticked. The search is whole-reference, so it
    // never matches half a name - but a whole reference is not always a binding: a variable name
    // written into an alarm message or a page label is a real match and still prose, and until
    // this the choice was to rewrite it or to rewire nothing at all. onChange reports the tally
    // to the dialog, which is what the Update button counts.
    function loadReferencePlaces(host, info, oldName, newName, onChange) {
        if (!host) { return; }
        host.innerHTML = '';
        host._emRefs = null;
        if (!info.url) { onChange(0, 0); return; }

        var body = info.renames && info.renames.length
            ? { oldName: oldName, newName: newName, renames: info.renames }
            : { oldName: oldName, newName: newName };

        var token = (host._emToken = (host._emToken || 0) + 1);

        fetch(info.url + '/Preview', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            // The dialog is reused, so a slow preview must not paint over a later prompt.
            if (token !== host._emToken) { return; }
            // The preview's own notes replace the standing historian line when it has any:
            // they say what a rewire will and will not repair for THIS rename (an untouched
            // historian, a UDT instance that still needs a push).
            var notes = (data && data.notes) || [];
            if (notes.length) {
                var noteEl = document.querySelector('#EntityModal_RenameReferences .em-rename-note');
                if (noteEl) { noteEl.innerHTML = notes.map(escapeHtml).join('<br/>'); }
            }

            var references = (data && data.references) || [];
            if (!references.length) { host.innerHTML = ''; onChange(0, 0); return; }

            renderReferencePlaces(host, references, onChange);
        })
        .catch(function () {
            // No list means no selection to send: the rewire falls back to what the apply's own
            // search finds, which is exactly what it did before the list existed.
            if (token === host._emToken) { host.innerHTML = ''; onChange(0, 0); }
        });
    }

    // The places table: a tick box per row, a search over what is written in the row, and a
    // header box that ticks or unticks everything the search is currently showing.
    function renderReferencePlaces(host, references, onChange) {
        host._emRefs = references.map(function (r) {
            return {
                key: r.key || '',
                on: true,
                type: labelFor(r.entityType),
                location: r.location || '',
                context: r.context || '',
                // Every name this one value contains. A device rename searches for hundreds at
                // once and a single alarm condition can name two of them, so the row marks the
                // ones that actually matched, not just the first.
                terms: (r.matchedTerms && r.matchedTerms.length) ? r.matchedTerms : [r.searchTerm]
            };
        });

        host.innerHTML =
            '<p class="em-rename-verify small">' + escapeHtml(message('VariableRenameVerifyHint',
                'Check that every place listed below really is a reference, and untick anything that should keep its current text.')) + '</p>' +
            '<div class="em-rename-filter">' +
            '<input type="search" class="form-control form-control-sm em-rename-search" autocomplete="cc-csc" placeholder="' +
                escapeHtml(message('Search', 'Search')) + '">' +
            '<span class="text-muted small em-rename-count"></span></div>' +
            '<div class="em-rename-scroll"><table class="table table-sm em-rename-table"><thead><tr>' +
            '<th class="em-rename-pick"><input type="checkbox" class="form-check-input em-rename-allbox" checked title="' +
                escapeHtml(message('SelectAll', 'Select all')) + '"></th>' +
            '<th>' + escapeHtml(message('Type', 'Type')) + '</th>' +
            '<th>' + escapeHtml(message('Location', 'Location')) + '</th>' +
            '<th>' + escapeHtml(message('Context', 'Context')) + '</th>' +
            '</tr></thead><tbody>' +
            host._emRefs.map(function (ref, index) {
                return '<tr data-em-index="' + index + '">' +
                    '<td class="em-rename-pick"><input type="checkbox" class="form-check-input em-rename-box" checked></td>' +
                    '<td class="em-rename-type">' + escapeHtml(ref.type) + '</td>' +
                    '<td class="em-rename-location">' + escapeHtml(ref.location) + '</td>' +
                    '<td class="em-rename-context"><div class="em-rename-context-inner">' +
                        highlightTerms(ref.context, ref.terms) + '</div></td></tr>';
            }).join('') +
            '</tbody></table></div>';

        var rows = Array.prototype.slice.call(host.querySelectorAll('tbody tr'));
        var allBox = host.querySelector('.em-rename-allbox');
        var search = host.querySelector('.em-rename-search');
        var count = host.querySelector('.em-rename-count');

        function visibleRows() {
            return rows.filter(function (row) { return row.style.display !== 'none'; });
        }

        function refresh() {
            var selected = host._emRefs.filter(function (ref) { return ref.on; }).length;
            // The header box answers for what is on screen, so after a search it reflects the
            // rows the operator can actually see rather than the whole list.
            var shown = visibleRows();
            var shownOn = shown.filter(function (row) { return host._emRefs[+row.dataset.emIndex].on; }).length;
            allBox.checked = shown.length > 0 && shownOn === shown.length;
            allBox.indeterminate = shownOn > 0 && shownOn < shown.length;
            count.textContent = message('VariableRenameSelectedCount', '{0} of {1} selected')
                .replace('{0}', selected).replace('{1}', host._emRefs.length);
            onChange(selected, host._emRefs.length);
        }

        rows.forEach(function (row) {
            var box = row.querySelector('.em-rename-box');
            box.onchange = function () {
                host._emRefs[+row.dataset.emIndex].on = box.checked;
                row.classList.toggle('em-rename-off', !box.checked);
                refresh();
            };
        });

        allBox.onchange = function () {
            var on = allBox.checked;
            visibleRows().forEach(function (row) {
                host._emRefs[+row.dataset.emIndex].on = on;
                row.querySelector('.em-rename-box').checked = on;
                row.classList.toggle('em-rename-off', !on);
            });
            refresh();
        };

        // Filtering only hides rows; it never changes a tick, so narrowing the list to read one
        // part of it cannot silently drop the rest from the rewire.
        search.oninput = function () {
            var term = search.value.trim().toLowerCase();
            rows.forEach(function (row) {
                var ref = host._emRefs[+row.dataset.emIndex];
                var hit = !term || (ref.type + ' ' + ref.location + ' ' + ref.context).toLowerCase().indexOf(term) >= 0;
                row.style.display = hit ? '' : 'none';
            });
            refresh();
        };

        refresh();
    }

    // The keys of the ticked places, or null when there is no list to speak of (the preview
    // failed, or the caller opened the dialog without one) - which leaves the apply doing what it
    // has always done: rewire everything its own search finds.
    function selectedReferenceKeys(host) {
        if (!host || !host._emRefs) { return null; }
        return host._emRefs.filter(function (ref) { return ref.on; })
                           .map(function (ref) { return ref.key; });
    }

    // Entity type names travel as the English identifier; the translations partial carries the
    // GUI label for the ones it knows and the identifier stands in for the rest.
    function labelFor(value) {
        var translations = window.EntityModalTranslations;
        return (translations && translations.labels && translations.labels[value]) || value || '';
    }

    function showRenameDialog(info, others) {
        ensureRenameStyles();
        var args = info.keyInfo.args || [];
        var oldName = args[0] || '';
        var newName = args[1] || '';

        var dialog = document.getElementById('EntityModal_RenameReferences');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'EntityModal_RenameReferences';
            dialog.className = 'modal fade';
            dialog.setAttribute('tabindex', '-1');
            dialog.innerHTML =
                // Wide, because the third column is the value that has to be READ to decide
                // whether the reference is a binding or a sentence that happens to name it.
                '<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">' +
                '<div class="modal-header"><h5 class="modal-title"></h5>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
                '<div class="modal-body">' +
                '<p class="em-rename-text"></p>' +
                '<div class="em-rename-pairs"></div>' +
                '<p class="em-rename-other small"></p>' +
                '<div class="em-rename-places"></div>' +
                '<p class="em-rename-note text-muted small"></p></div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary em-rename-keep" data-bs-dismiss="modal"></button>' +
                '<button type="button" class="btn btn-secondary em-rename-review"></button>' +
                '<button type="button" class="btn btn-primary em-rename-all"></button>' +
                '</div></div></div>';
            document.body.appendChild(dialog);
        }

        dialog.querySelector('.modal-title').textContent = message('VariableRenameReferencesTitle', 'Update references?');
        dialog.querySelector('.em-rename-text').textContent = info.text || translateError(info.english, info.keyInfo);
        // Anything else the save reported (a device rename repointing UDT instances, say) shown
        // in the same dialog rather than lost or stacked behind it.
        dialog.querySelector('.em-rename-other').innerHTML = (others && others.length) ? others.join('<br/>') : '';
        dialog.querySelector('.em-rename-note').textContent = message('VariableRenameHistorianNote', 'Historian samples already recorded keep the old name.');
        renderRenamePairs(dialog.querySelector('.em-rename-pairs'), info.pairs);
        dialog.querySelector('.em-rename-keep').textContent = message('VariableRenameKeep', 'Keep as is');
        dialog.querySelector('.em-rename-review').textContent = message('VariableRenameReview', 'Review');
        dialog.querySelector('.em-rename-all').textContent = message('VariableRenameUpdateAll', 'Update all');

        var places = dialog.querySelector('.em-rename-places');
        var updateButton = dialog.querySelector('.em-rename-all');

        // The button says what it will do. "Update all" until something is unticked, and then the
        // number it will actually write - so a partial rewire cannot be mistaken for a full one.
        loadReferencePlaces(places, info, oldName, newName, function (selected, total) {
            if (total === 0 || selected === total) {
                updateButton.textContent = message('VariableRenameUpdateAll', 'Update all');
                updateButton.disabled = false;
                return;
            }
            updateButton.textContent = message('VariableRenameUpdateSelected', 'Update selected ({0})')
                .replace('{0}', selected);
            updateButton.disabled = selected === 0;
        });

        // Review is offered only where the search term IS the thing being renamed. A DEVICE rename
        // renames a whole set of variable keys, and the Cross Reference modal carries a single
        // search box: the only term it could be given is the bare device name, which turns the
        // review into a substring find-and-replace - it would list PLC10.Level while renaming PLC1
        // and rewrite it to PLC20.Level, with a select-all checkbox one click away. Until the
        // review list can carry a term SET, the device rename offers Update all or nothing.
        // A multi-pair set (a UDT push) is the same case for the same reason.
        //
        // A USER GROUP is excluded for the opposite reason: its rename search is deliberately
        // narrow (the UserGroups access lists only, matched per list entry), while the Cross
        // Reference modal searches everything as a substring - so Review would list the word
        // "Operators" inside descriptions and alarm messages and offer to rewrite them.
        var reviewable = info.keyInfo.key === 'VariableRenameReferences'
            && (info.keyInfo.args || [])[3] !== 'UserGroups'
            && !(info.renames && info.renames.length > 1);
        dialog.querySelector('.em-rename-review').style.display = reviewable ? '' : 'none';

        var modal = bootstrap.Modal.getInstance(dialog) || new bootstrap.Modal(dialog);

        // The dialog is reused, so a previous prompt may have left a button disabled.
        var review = dialog.querySelector('.em-rename-review');
        var all = dialog.querySelector('.em-rename-all');
        all.disabled = false;

        // Re-bound per prompt (the names differ each time), so the handlers are replaced rather
        // than stacked on the reused dialog.
        review.onclick = function () {
            modal.hide();
            if (window.CrossReference && typeof window.CrossReference.openForRename === 'function') {
                // Always whole-reference: the button is only shown for the renames whose search
                // term is the renamed name itself.
                window.CrossReference.openForRename(oldName, newName, true);
            }
        };
        all.onclick = function () {
            all.disabled = true;
            // The ticked keys travel with the request whenever a list was loaded, whether or not
            // anything was unticked: the apply searches again, and sending them is what makes it
            // write exactly the places the operator read. A reference that appeared in between is
            // left alone rather than rewritten unseen.
            applyRenamePropagation(info.url, oldName, newName, info.renames, function () {
                all.disabled = false;
                modal.hide();
            }, null, info.report, selectedReferenceKeys(places));
        };

        modal.show();
    }

    // report, when the host page has no CustomModal of its own, is where the outcome goes.
    // selectedKeys, when the dialog listed the places, is which of them to rewire; null means
    // everything the server's own search finds, which is what a caller without a list means.
    function applyRenamePropagation(url, oldName, newName, renames, done, signatureToken, report, selectedKeys) {
        var tell = report || showPageError;
        var headers = { 'Content-Type': 'application/json' };
        if (signatureToken) { headers['X-Signature-Token'] = signatureToken; }

        // oldName/newName identify the operation in the audit record; renames, when the caller
        // has a set, carries what is actually rewired - resolved in one pass.
        var body = { oldName: oldName, newName: newName };
        if (renames && renames.length) { body.renames = renames; }
        if (selectedKeys) { body.selectedKeys = selectedKeys; }

        fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: headers,
            body: JSON.stringify(body)
        })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            // Same electronic-signature retry the save itself uses.
            if (data && data.signatureRequired && !signatureToken && window.EnvisionSignature) {
                EnvisionSignature.request(data.actionKey, data.meanings).then(function (token) {
                    applyRenamePropagation(url, oldName, newName, renames, done, token, report);
                }).catch(function () { done(); });
                return;
            }

            done();

            if (data && data.success) {
                // What was left alone is part of the outcome, not an omission: it is the whole
                // point of unticking a row, and the count is what tells the operator the rewire
                // was partial on purpose.
                tell(data.skipped
                    ? message('VariableRenameResultSkipped', '{0} reference(s) updated, {1} failed, {2} left unchanged.')
                        .replace('{0}', data.replaced).replace('{1}', data.failed).replace('{2}', data.skipped)
                    : message('VariableRenameResult', '{0} reference(s) updated, {1} failed.')
                        .replace('{0}', data.replaced).replace('{1}', data.failed));
                return;
            }

            tell(formatErrors(data) || 'Error');
        })
        .catch(function () {
            done();
            tell(typeof errorOccurred !== 'undefined' ? errorOccurred : 'Error');
        });
    }

    // Renders an API error in the user's language: the response carries the English text plus a
    // stable key + args (validationErrorKeys / errorKey); when the page provides
    // window.EntityModalTranslations the key wins, otherwise the English text is shown as-is.
    function translateError(englishMessage, keyInfo) {
        var translations = window.EntityModalTranslations;
        if (!translations || !keyInfo || !keyInfo.key || !translations.messages[keyInfo.key]) {
            return englishMessage;
        }
        var args = keyInfo.args || [];
        return translations.messages[keyInfo.key].replace(/\{(\d+)\}/g, function (match, index) {
            var value = args[index];
            if (value === undefined || value === null) { return match; }
            return (translations.labels && translations.labels[value]) || value;
        });
    }

    function formatErrors(data) {
        if (!data) { return ''; }

        // ASP.NET model binding rejects a malformed field BEFORE the request reaches the
        // controller, and answers with RFC problem details - { title, status, errors: { field: [...] } } -
        // which carries none of the shapes below. Unhandled, every one of those became the generic
        // "An error has occurred", so a simple typo (writing {device} instead of the case-sensitive
        // {Device}) told the operator nothing at all.
        if (data.errors && !data.validationErrors && typeof data.errors === 'object') {
            var fieldMessages = [];
            Object.keys(data.errors).forEach(function (field) {
                var messages = data.errors[field];
                if (Array.isArray(messages)) { fieldMessages = fieldMessages.concat(messages); }
            });
            if (fieldMessages.length) { return fieldMessages.join('<br/>'); }
        }

        if (data.validationErrors && data.validationErrors.length) {
            var keys = data.validationErrorKeys || [];
            return data.validationErrors.map(function (message, index) {
                return translateError(message, keys[index]);
            }).join('<br/>');
        }
        if (data.error) { return translateError(data.error, data.errorKey); }
        return '';
    }

    function showPageError(message) {
        var textEl = document.getElementById('CustomModalText');
        if (textEl) {
            textEl.innerHTML = message;
            new bootstrap.Modal(document.getElementById('CustomModal')).show();
        }
    }

    function deleteIds(entity, ids, onDeleted, signatureToken) {
        var config = configs[entity];
        var headers = { 'Content-Type': 'application/json' };
        if (signatureToken) { headers['X-Signature-Token'] = signatureToken; }

        fetch(config.apiUrl + '/Delete', {
            method: 'POST',
            credentials: 'same-origin',
            headers: headers,
            body: JSON.stringify(ids.map(function (id) { return parseInt(id, 10); }))
        })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            // Part 11 electronic signature flow (F19 Phase 2).
            if (data && data.signatureRequired && !signatureToken && window.EnvisionSignature) {
                EnvisionSignature.request(data.actionKey, data.meanings).then(function (token) {
                    deleteIds(entity, ids, onDeleted, token);
                }).catch(function () { /* signature cancelled */ });
                return;
            }

            if (data && data.success) {
                if (onDeleted) { onDeleted(data); }
                return;
            }

            var error = (data && data.error) || '';
            if (error.indexOf('Authorization header') === 0 || error.indexOf('Authentication failed') === 0) {
                location.reload();
                return;
            }

            var message = formatErrors(data);
            if (data && data.results) {
                var failed = data.results.filter(function (r) { return !r.success; })
                    .map(function (r) { return (r.key ? r.key + ': ' : '') + translateError(r.error || '', r.errorKey); });
                if (failed.length) { message = failed.join('<br/>'); }
            }
            showPageError(message || (typeof errorOccurred !== 'undefined' ? errorOccurred : 'Error'));
        })
        .catch(function () {
            showPageError(typeof errorOccurred !== 'undefined' ? errorOccurred : 'Error');
        });
    }

    // Inserts a token (e.g. "{Device}") into a text input at the caret position, replacing any
    // selection. Used by the clickable "{Device}" token in the variable modals' built-in-tokens hint.
    function insertToken(inputId, token) {
        var input = document.getElementById(inputId);
        if (!input) { return; }
        var start = typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length;
        var end = typeof input.selectionEnd === 'number' ? input.selectionEnd : input.value.length;
        input.value = input.value.slice(0, start) + token + input.value.slice(end);
        var caret = start + token.length;
        input.focus();
        try { input.setSelectionRange(caret, caret); } catch (e) { }
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return {
        register: register,
        openCreate: openCreate,
        openEdit: openEdit,
        submit: submit,
        deleteIds: deleteIds,
        formatErrors: formatErrors,
        insertToken: insertToken,
        // Public because the entity pages ALSO save from the grid row, which PUTs straight to the
        // config API without going through submit() above. That path has to offer the rename
        // prompt too, or renaming in the grid - the quickest way to do it - silently leaves every
        // reference behind. promptRenameReferences is for callers that are not a config API
        // response at all (the Pages screen's own handler, the UDT push).
        offerRenamePropagation: offerRenamePropagation,
        promptRenameReferences: promptRenameReferences
    };
})();
