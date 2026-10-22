// ReportDesigner.js - client module for the Report Designer page.
//
// Report CRUD goes through the Config API (/API/Config/Reports); execution and the
// data-source browser go through the page handlers (?handler=...). The template JSON
// shape is Models/Dto/ReportTemplate.cs (camelCase), validated server-side by
// ReportService.ValidateTemplate on every save.

(function () {
    'use strict';

    var $id = function (id) { return document.getElementById(id); };

    // ---- state ----
    var reports = [];
    var current = null;      // the whole GET /API/Config/Reports/{id} row (id, name, enable,
                             // description, outputPath, fileNamePattern, templateJson, updatedUtc, ...)
    var template = null;     // parsed template object
    var curPage = 0;
    var selected = -1;       // anchor component index on the current page, -1 = none
    // Every selected index on the current page. `selected` is the anchor (the one the
    // Properties panel edits); alignment and group operations act on the whole set.
    var selection = [];
    // Inside a Columns band: which column new components go into (-1 = none), and which
    // child the Properties panel edits ({slot, index} or null). Both only mean anything
    // while a single columns component is selected, and both are cleared by any other
    // selection change, so the rest of the designer keeps working on page-level indices.
    var activeSlot = -1;
    var childSel = null;
    var COLUMN_GAP_PX = 15;   // 4 mm at the designer's 3.78 px/mm, matching COLUMN_GAP_MM
    var MAX_COLUMN_SLOTS = 4;
    var dirty = false;
    var zoom = 0.8;
    var sources = { variables: [], databases: [], modules: [] };
    var brokenTemplateJson = null; // non-null = repair mode: stored JSON did not parse
    var lastRunOptions = { periodStart: '', periodEnd: '', params: {} }; // Execute overrides, kept per session
    // A completed drag or marquee is followed by a browser 'click' on the same element
    // chain; without these one-shot flags that click cleared the selection the gesture
    // had just made (paper click) or collapsed a multi-select (band click).
    var suppressPaperClick = false;
    var suppressBandClick = false;

    // Numeric-or-default that treats 0 as a real value: `comp.x || 40` displayed a
    // component stored at x=0 at 40px while the PDF printed it at 0.
    function posOr(value, fallback) {
        return (typeof value === 'number' && isFinite(value)) ? value : fallback;
    }

    // Undo/redo: snapshots of the editable state, pushed by markDirty() BEFORE each
    // change is recorded (lastSnapshot always holds the pre-change state).
    var undoStack = [];
    var redoStack = [];
    var lastSnapshot = null;
    var UNDO_LIMIT = 50;

    function captureSnapshot() {
        if (!template) return null;
        return JSON.stringify({
            t: template,
            page: curPage,
            name: current ? current.name : '',
            desc: current ? (current.description || '') : '',
            enable: current ? current.enable !== false : true
        });
    }

    function refreshSnapshot() { lastSnapshot = captureSnapshot(); }

    function resetHistory() {
        undoStack = [];
        redoStack = [];
        refreshSnapshot();
    }

    function applySnapshot(snapshot) {
        var s = JSON.parse(snapshot);
        template = s.t;
        curPage = Math.max(0, Math.min(s.page, (template.pages || []).length - 1));
        if (current) {
            current.name = s.name;
            current.description = s.desc;
            current.enable = s.enable;
        }
        selection = [];
        selected = -1;
        markDirtyUi();
        refreshSnapshot();
        renderAll();
    }

    function undo() {
        if (!undoStack.length) { toastMsg('Nothing to undo.'); return; }
        redoStack.push(captureSnapshot());
        applySnapshot(undoStack.pop());
    }

    function redo() {
        if (!redoStack.length) { toastMsg('Nothing to redo.'); return; }
        undoStack.push(captureSnapshot());
        applySnapshot(redoStack.pop());
    }

    var PRESETS = ['yesterday', 'today', 'last24h', 'last7days', 'last30days', 'thismonth', 'lastmonth'];
    var AGGREGATES = ['', 'sum', 'avg', 'min', 'max', 'count'];

    var COMPONENT_DEFS = {
        header: { label: 'Header', make: function () { return { type: 'header', text: template.title || 'Report', subText: '{Report.PeriodStart} - {Report.PeriodEnd}' }; } },
        text: { label: 'Text', make: function () { return { type: 'text', text: 'Text', style: 'body' }; } },
        kpiRow: { label: 'KPI row', make: function () { return { type: 'kpiRow', tiles: [{ label: 'KPI 1', binding: '', units: '', format: '', compare: false }] }; } },
        chart: { label: 'Trend chart', make: function () { return { type: 'chart', text: 'Chart', chartType: 'line', series: [], resample: '1h', height: 55 }; } },
        table: { label: 'Table', make: function () { return { type: 'table', text: 'Table', source: 'sqlite', database: '', query: 'SELECT * FROM MyTable WHERE Day = {Report.Day}', columns: [], groupBy: '', maxRows: 200 }; } },
        image: { label: 'Image', make: function () { return { type: 'image', path: '', imageWidth: 0, align: 'left' }; } },
        alarmList: { label: 'Alarm list', make: function () { return { type: 'alarmList', text: 'Alarms in period', minSeverity: 0, maxRows: 50 }; } },
        eventList: { label: 'Event list', make: function () { return { type: 'eventList', text: 'Events in period', maxRows: 50 }; } },
        columns: {
            label: 'Columns', make: function () {
                return { type: 'columns', slots: [{ width: 0, components: [] }, { width: 0, components: [] }] };
            }
        },
        spacer: { label: 'Spacer', make: function () { return { type: 'spacer', spacerHeight: 12 }; } },
        footer: { label: 'Page footer', make: function () { return { type: 'footer', text: 'ENVISION', subText: 'Page {Page} / {Pages}' }; } }
    };

    var TOOL_ICONS = {
        header: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16M4 9h10"/><path d="M4 15h16v4H4z"/></svg>',
        text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M12 5v14M9 19h6"/></svg>',
        kpiRow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="8" height="6" rx="1"/><path d="M3 16h8M13 6h8M13 10h8M13 14h5"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M6 15l4-5 4 3 5-7"/></svg>',
        table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9h18M9 9v11M15 9v11"/></svg>',
        image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
        alarmList: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
        eventList: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
        columns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7.5" height="16" rx="1.5"/><rect x="13.5" y="4" width="7.5" height="16" rx="1.5"/></svg>',
        spacer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>',
        footer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16h18"/></svg>'
    };

    // ---- utilities ----
    function esc(s) {
        return String(s === undefined || s === null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function highlightTokens(escaped) {
        // Expressions first: {Token} cannot match them (its character class excludes "="),
        // but highlighting them afterwards would run over the markup just inserted.
        return escaped
            .replace(/\{=[^{}]*\}/g, '<span class="rdp-ph">$&</span>')
            .replace(/\{([A-Za-z0-9_.\- ]+)\}/g, '<span class="rdp-ph">{$1}</span>');
    }

    // True when the whole field is one inline expression. Mirrors envision_report._EXPR_RE and
    // ReportService.IsExpression: a binding, computed column or aggregate accepts that form
    // only, never an expression mixed with other text.
    function isExpression(value) {
        return /^\{=[^{}]*\}$/.test((value || '').trim());
    }

    // ---------------------------------------------------------------------------
    // Field editor
    // ---------------------------------------------------------------------------
    // The properties rail is ~300px wide, which is fine for {Report.Day} and useless for a
    // sentence carrying several expressions. Any field that accepts placeholders gets an expand
    // button opening it here instead.
    //
    // Two modes, because the fields are not the same kind of thing:
    //   'text'       a free-text field - prose mixed with {Token} and {= expression }
    //   'expression' a KPI binding, computed column or summary aggregate - ONE whole expression,
    //                which the dialog reports while typing rather than leaving to the save
    //
    // Validation and evaluation are both server-side on purpose: the same regex and the same
    // rules the save path uses (ReportService), and the real renderer for the value. A second
    // implementation here would drift and start accepting what the save refuses.
    var editor = {
        cm: null,
        mode: 'text',
        apply: null,
        checkTimer: null,
        reference: []
    };

    // The names an expression can use, mirroring the list in Report Settings and the MCP schema.
    var EXPRESSION_REFERENCE = [
        ['{Report.Day}', 'Date of the period start'],
        ['{Report.PeriodStart}', 'Start of the period, as text'],
        ['{Report.PeriodEnd}', 'End of the period, as text'],
        ['{Report.Generated}', 'Render moment'],
        ['{Report.Name}', 'Report name'],
        ['{Report.Title}', 'Report title'],
        ['{Page}', 'Page number (footers)'],
        ['{Pages}', 'Page count (footers)'],
        ['{= Report.Hours }', 'Period length in hours, as a number'],
        ['{= Report.Days }', 'Period length in days'],
        ['{= Report.Start }', 'Period start as a date and time value'],
        ['{= Report.End }', 'Period end as a date and time value'],
        ['{= Param.name }', 'A report parameter'],
        ['{= Expr.key }', 'A value the hook script stored'],
        ['{= Var("Name") }', 'Live variable value, as text'],
        ['{= Num("Name", 0) }', 'Live variable value, as a number'],
        ['{= Hist("Name","sum") }', 'Historian aggregate: sum avg min max count delta'],
        ['{= Val(x, 0) }', 'Number-or-default coercion'],
        ['{= Row[\'Column\'] }', 'Source row - computed column only'],
        ['{= sum(Values) }', 'Numeric cells of a column - summary aggregate only'],
        ['{= max(Values) - min(Values) }', 'Range of a column'],
        ['{= len(Raw) }', 'Every cell of a column, non-numeric included - summary aggregate only'],
        ['{= round(sum(Values) / len(Values), 1) }',
            'Average of a column. Value functions: abs all any bool divmod enumerate filter float '
            + 'format int len list map max min pow range reversed round sorted str sum tuple zip'],
        ['{= round(math.sqrt(2), 3) }', 'The math module is available'],
        ['{= Report.Start + timedelta(days=1) }', 'Date arithmetic; datetime and timedelta are available']
    ];

    // CodeMirror overlay highlighting {= expression } and {Token}. Expressions first, because
    // the token pattern must not run over one. Same two colours as the paper preview.
    function defineOverlay() {
        if (!window.CodeMirror || CodeMirror._rdOverlayReady) return;
        CodeMirror._rdOverlay = {
            token: function (stream) {
                if (stream.match(/^\{=[^{}]*\}/)) return 'rd-expr';
                if (stream.match(/^\{[A-Za-z0-9_.\- ]+\}/)) return 'rd-token';
                // Advance to the next '{' so the overlay never stalls on ordinary prose.
                while (stream.next() != null && stream.peek() !== '{') { }
                return null;
            }
        };
        CodeMirror._rdOverlayReady = true;
    }

    function openFieldEditor(options) {
        var modalEl = $id('rdEditorModal');
        if (!modalEl || !window.CodeMirror) return false;

        editor.mode = options.mode === 'expression' ? 'expression' : 'text';
        editor.apply = options.onApply;

        $id('rdEditorTitle').textContent = options.label || 'Edit';
        $id('rdEditorModeHint').innerHTML = editor.mode === 'expression'
            ? 'This field holds one whole {= expression }, so the calculated value keeps its type and the Format setting still applies.'
            : 'Mixed text: {Report.Day}, {Param.name}, {Expr.key}, a variable name, and {= expression } for a calculation. Expressions resolve before the placeholders.';

        defineOverlay();
        var host = $id('rdEditorText');
        if (!editor.cm) {
            editor.cm = CodeMirror.fromTextArea(host, {
                lineNumbers: false,
                lineWrapping: true,
                mode: null,
                viewportMargin: Infinity
            });
            editor.cm.addOverlay(CodeMirror._rdOverlay);
            editor.cm.on('change', scheduleCheck);
        }
        editor.cm.setValue(options.value || '');
        // A filter left over from the previous field would hide the reference on reopen.
        var search = $id('rdEditorRefSearch');
        if (search) search.value = '';
        renderReference('');
        setStatus('', '');
        $id('rdEditorEvalHint').textContent = '';

        var modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
        // CodeMirror measures wrong inside a hidden dialog, and again whenever the dialog is
        // resized with the window, since its height now follows the viewport.
        setTimeout(function () { editor.cm.refresh(); editor.cm.focus(); scheduleCheck(); }, 220);
        return true;
    }

    function refreshEditorOnResize() {
        var modalEl = $id('rdEditorModal');
        if (editor.cm && modalEl && modalEl.classList.contains('show')) editor.cm.refresh();
    }

    function setStatus(text, kind) {
        var el = $id('rdEditorStatus');
        if (!el) return;
        el.className = kind || '';
        el.innerHTML = text || '<span style="opacity:.6;">No problems.</span>';
    }

    function scheduleCheck() {
        clearTimeout(editor.checkTimer);
        editor.checkTimer = setTimeout(runCheck, 400);
    }

    function runCheck() {
        if (!editor.cm) return;
        var value = editor.cm.getValue();
        api('?handler=ValidateExpressions', 'POST', { name: current ? current.name : '', text: value, mode: editor.mode })
            .then(function (res) {
                if (!res || res.error) { setStatus(esc((res && res.error) || 'Check failed.'), 'bad'); return; }
                var lines = (res.problems || []).map(function (p) { return esc(p.message); });
                // A binding, computed column and aggregate each also accept a plain form
                // (var:Name, a hook function name, sum). The whole-field rule therefore only
                // applies once the author has actually started an expression.
                if (editor.mode === 'expression' && res.wholeFieldOk === false && value.indexOf('{=') >= 0) {
                    lines.unshift('An expression here must be the whole field: one {= expression } with nothing outside it.');
                }
                if (lines.length) setStatus(lines.join('<br>'), 'bad');
                else setStatus('', value.indexOf('{') >= 0 ? 'good' : '');
            })
            .catch(function () { setStatus('', ''); });
    }

    function insertAtCursor(text) {
        if (!editor.cm) return;
        editor.cm.replaceSelection(text);
        editor.cm.focus();
    }

    // Rows shown for a variable search. The list is never a dump of the project's variables: a
    // plant can hold well over a hundred thousand, so without a search term only the reference is
    // shown, and a search asks the server (?handler=SearchVariables) which walks the whole
    // dictionary and returns the first matches plus the true match count. Filtering a preloaded
    // list client-side could never reach a name beyond the GetDataSources cap.
    var REF_VARIABLE_LIMIT = 40;
    var refSearchTimer = null;
    var refSearchSeq = 0;

    function referenceRows() {
        var rows = EXPRESSION_REFERENCE.slice();
        if (editor.mode === 'expression') {
            // A bare {Token} is not a valid whole-field expression, so offer expression forms only.
            rows = rows.filter(function (r) { return r[0].indexOf('{=') === 0; });
        }
        return rows;
    }

    function variableInsertText(name) {
        return editor.mode === 'expression' ? '{= Var("' + name + '") }' : '{' + name + '}';
    }

    function paintReference(rows, note) {
        var host = $id('rdEditorRefList');
        if (!host) return;
        host.innerHTML = (note ? '<div class="rd-refnote">' + esc(note) + '</div>' : '')
            + (rows.map(function (r) {
                return '<div class="rd-refrow" data-insert="' + esc(r[0]) + '"><code>' + esc(r[0]) + '</code><span>' + esc(r[1]) + '</span></div>';
            }).join('') || '<div class="rd-refrow"><span>No match.</span></div>');

        Array.prototype.forEach.call(host.querySelectorAll('.rd-refrow[data-insert]'), function (row) {
            row.onclick = function () { insertAtCursor(row.getAttribute('data-insert')); };
        });
    }

    // Called on every keystroke: the reference part is static and painted at once, the variable
    // part is debounced so typing does not fire a dictionary scan per character.
    function renderReference(filter) {
        var needle = (filter || '').trim();
        clearTimeout(refSearchTimer);

        var matching = referenceRows().filter(function (r) {
            var lower = needle.toLowerCase();
            return !needle || r[0].toLowerCase().indexOf(lower) >= 0 || r[1].toLowerCase().indexOf(lower) >= 0;
        });

        if (!needle) {
            paintReference(matching, 'Type to search the variables of the project.');
            return;
        }

        paintReference(matching, 'Searching variables...');
        var seq = ++refSearchSeq;
        refSearchTimer = setTimeout(function () {
            api('?handler=SearchVariables', 'POST', { search: needle, limit: REF_VARIABLE_LIMIT })
                .then(function (res) {
                    // A slower earlier search must not overwrite a newer one's result.
                    if (seq !== refSearchSeq) return;
                    if (!res || res.error) { paintReference(matching, (res && res.error) || 'Variable search failed.'); return; }
                    var rows = matching.concat((res.names || []).map(function (name) {
                        return [variableInsertText(name), 'Variable'];
                    }));
                    var note = '';
                    if ((res.total || 0) > (res.names || []).length) {
                        note = 'Showing ' + res.names.length + ' of ' + res.total + ' matching variables. Refine the search.';
                    }
                    paintReference(rows, note);
                })
                .catch(function () { if (seq === refSearchSeq) paintReference(matching, 'Variable search failed.'); });
        }, 250);
    }

    function evaluateField() {
        if (!editor.cm) return;
        if (!current || !current.name) {
            $id('rdEditorEvalHint').textContent = 'Save the report once before evaluating.';
            return;
        }
        var hint = $id('rdEditorEvalHint');
        if (!editor.cm.getValue().trim()) { hint.textContent = 'Nothing to evaluate.'; return; }
        hint.textContent = 'Evaluating...';
        api('?handler=EvaluateText', 'POST', { name: current.name, text: editor.cm.getValue(), mode: editor.mode })
            .then(function (res) {
                if (!res) { hint.textContent = 'No response.'; return; }
                if (res.ok) {
                    var typeNote = res.type ? ' (' + res.type + ')' : '';
                    hint.innerHTML = 'Result' + esc(typeNote) + ': ';
                    var out = document.createElement('code');
                    out.style.cssText = 'font-family:var(--rd-mono);color:var(--rd-text);';
                    out.textContent = res.value === '' ? '(empty)' : res.value;
                    hint.appendChild(out);
                    // A hook that failed is reported even when the field itself resolved.
                    if (res.error) hint.innerHTML += ' <span style="color:#c8443a;">' + esc(res.error) + '</span>';
                } else {
                    hint.innerHTML = '<span style="color:#c8443a;">' + esc(res.error || 'Evaluation failed.') + '</span>';
                }
            })
            .catch(function (err) { hint.textContent = String(err); });
    }

    function wireFieldEditor() {
        var apply = $id('rdEditorApply');
        if (apply) apply.onclick = function () {
            if (editor.apply && editor.cm) editor.apply(editor.cm.getValue());
            bootstrap.Modal.getInstance($id('rdEditorModal')).hide();
        };
        var insertExpr = $id('rdEditorInsertExpr');
        if (insertExpr) insertExpr.onclick = function () {
            insertAtCursor('{=  }');
            // Land the caret between the braces, ready to type.
            var pos = editor.cm.getCursor();
            editor.cm.setCursor({ line: pos.line, ch: pos.ch - 2 });
        };
        var evalBtn = $id('rdEditorEvaluate');
        if (evalBtn) evalBtn.onclick = evaluateField;
        var search = $id('rdEditorRefSearch');
        if (search) search.oninput = function () { renderReference(this.value); };
        window.addEventListener('resize', refreshEditorOnResize);
    }

    // Expand button markup for a field row. `target` is the id of the input/textarea it opens.
    function expandButton(id) {
        return '<button type="button" class="rd-expand" id="' + id + '" title="Open in the editor">&#10530;</button>';
    }

    // Wires an expand button to a field: the editor starts from the field's current value and
    // writes back through the same setter the inline field uses, so both paths stay identical.
    function bindExpand(buttonId, fieldId, label, mode, setValue) {
        var btn = $id(buttonId);
        var field = $id(fieldId);
        if (!btn || !field) return;
        btn.onclick = function () {
            openFieldEditor({
                label: label,
                value: field.value,
                mode: mode,
                onApply: function (value) {
                    field.value = value;
                    setValue(value);
                    markDirty();
                    renderPaper();
                }
            });
        };
    }

    // ---- variable picker ----
    // A field that holds NOTHING BUT a variable name gets a small picker beside it, so the name
    // never has to be typed from memory: the period start/end, a chart series, and the historian
    // variable list of a table. A field that accepts mixed text or an expression carries the
    // expand button instead, and the editor dialog it opens already searches variables and
    // inserts them in the right form - two controls for one job would only be confusing.
    //
    // The list comes from the SAME server search that editor uses (?handler=SearchVariables,
    // whole dictionary, match count reported); the preloaded GetDataSources list is only the
    // idle view, because it is capped and could never reach a name beyond that cap.
    var VAR_PICK_LIMIT = 40;
    var VAR_PICK_IDLE = 40;   // names shown before anything is typed
    var VAR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>';
    var pickSearchTimer = null;
    var pickSearchSeq = 0;

    // Picker button markup. `cls` lets a dynamically built row (a chart series) be found by
    // class, the same way its neighbours are; `id` is for the fixed field rows.
    function pickButton(options) {
        options = options || {};
        return '<button type="button" class="rd-pickbtn' + (options.cls ? ' ' + options.cls : '') + '"'
            + (options.id ? ' id="' + options.id + '"' : '')
            + ' title="' + esc(options.title || 'Pick a variable') + '">' + VAR_ICON + '</button>';
    }

    function closeVariablePicker() {
        clearTimeout(pickSearchTimer);
        var menu = $id('rdVarPick');
        if (menu) menu.remove();
    }

    function openVariablePicker(anchor, options) {
        closeVariablePicker();

        var menu = document.createElement('div');
        menu.id = 'rdVarPick';
        menu.className = 'rd-dropmenu rd-varpick';
        menu.innerHTML = '<div class="hdr">' + esc(options.label || 'Pick a variable') + '</div>'
            // autocomplete="cc-csc" for the same reason as the Parameters page: it is the one
            // value browsers do not offer to autofill from saved profile data.
            + '<input class="rd-fin" id="rdVarPickSearch" placeholder="Search variables" autocomplete="cc-csc" spellcheck="false">'
            + '<div class="rd-varlist" id="rdVarPickList"></div>'
            + '<div class="rd-varnote" id="rdVarPickNote"></div>';
        document.body.appendChild(menu);

        // Opens below the button, flipped above it when the viewport bottom is nearer.
        var rect = anchor.getBoundingClientRect();
        var menuRect = menu.getBoundingClientRect();
        var below = rect.bottom + 4;
        menu.style.left = Math.max(4, Math.min(rect.right - menuRect.width, window.innerWidth - menuRect.width - 4)) + 'px';
        menu.style.top = (below + menuRect.height > window.innerHeight - 4
            ? Math.max(4, rect.top - menuRect.height - 4)
            : below) + 'px';

        var search = $id('rdVarPickSearch');
        var list = $id('rdVarPickList');
        var note = $id('rdVarPickNote');
        var rows = [];
        var active = -1;

        function dismiss() {
            document.removeEventListener('mousedown', onOutside, true);
            closeVariablePicker();
        }
        function onOutside(ev) { if (!menu.contains(ev.target) && ev.target !== anchor) dismiss(); }
        setTimeout(function () { document.addEventListener('mousedown', onOutside, true); }, 0);

        function choose(name) {
            options.onPick(name);
            // The historian variable list takes several names, so the picker stays open for it;
            // every other field holds one, and closing confirms the choice.
            if (options.keepOpen) {
                search.focus();
                search.select();
            } else {
                dismiss();
            }
        }

        function highlight(index) {
            if (rows[active]) rows[active].classList.remove('on');
            active = index;
            if (rows[active]) {
                rows[active].classList.add('on');
                rows[active].scrollIntoView({ block: 'nearest' });
            }
        }

        function paint(names, message) {
            list.innerHTML = '';
            rows = [];
            active = -1;
            names.forEach(function (name) {
                var row = document.createElement('div');
                row.className = 'rd-varrow';
                row.textContent = name;
                row.title = name;
                row.onclick = function () { choose(name); };
                list.appendChild(row);
                rows.push(row);
            });
            if (!names.length) {
                var empty = document.createElement('div');
                empty.className = 'rd-varnote';
                empty.textContent = 'No matching variable.';
                list.appendChild(empty);
            }
            note.textContent = message || '';
            if (rows.length) highlight(0);
        }

        // Idle view: the head of the preloaded list, so the picker is never empty on open.
        var idle = (sources.variables || []).slice(0, VAR_PICK_IDLE);
        paint(idle, (sources.variables || []).length > idle.length ? 'Type to search every variable of the project.' : '');

        search.oninput = function () {
            var needle = this.value.trim();
            clearTimeout(pickSearchTimer);
            if (!needle) {
                paint(idle, (sources.variables || []).length > idle.length ? 'Type to search every variable of the project.' : '');
                return;
            }
            note.textContent = 'Searching...';
            var seq = ++pickSearchSeq;
            pickSearchTimer = setTimeout(function () {
                api('?handler=SearchVariables', 'POST', { search: needle, limit: VAR_PICK_LIMIT })
                    .then(function (res) {
                        if (seq !== pickSearchSeq || !$id('rdVarPick')) return;   // a newer search won
                        if (!res || res.error) { paint([], (res && res.error) || 'Variable search failed.'); return; }
                        var found = res.names || [];
                        paint(found, (res.total || 0) > found.length
                            ? 'Showing ' + found.length + ' of ' + res.total + ' matches. Refine the search.'
                            : '');
                    })
                    .catch(function () { if (seq === pickSearchSeq) paint([], 'Variable search failed.'); });
            }, 250);
        };

        search.onkeydown = function (ev) {
            if (ev.key === 'ArrowDown') { ev.preventDefault(); highlight(Math.min(active + 1, rows.length - 1)); }
            else if (ev.key === 'ArrowUp') { ev.preventDefault(); highlight(Math.max(active - 1, 0)); }
            else if (ev.key === 'Enter') { ev.preventDefault(); if (rows[active]) choose(rows[active].textContent); }
            else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); dismiss(); }
        };

        search.focus();
    }

    // Wires a picker button onto a field. `mode` decides what the chosen name becomes:
    //   'name'  the field IS one variable, so the name replaces its whole value
    //   'line'  the historian variable list: one name per line, appended, no duplicates
    // `setValue` is the same setter the inline field uses, so both paths stay identical.
    function bindPick(button, field, options) {
        if (!button || !field) return;
        button.onclick = function () {
            openVariablePicker(button, {
                label: options.label || 'Pick a variable',
                keepOpen: options.mode === 'line',
                onPick: function (name) {
                    if (options.mode === 'line') {
                        var lines = field.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
                        if (lines.indexOf(name) < 0) lines.push(name);
                        field.value = lines.join('\n');
                    } else {
                        field.value = name;
                    }
                    options.setValue(field.value);
                    markDirty();
                    renderPaper();
                }
            });
        };
    }

    function bindPickById(buttonId, fieldId, options) {
        bindPick($id(buttonId), $id(fieldId), options);
    }

    // Color swatch square opening the colorPick popup (same pattern as the Parameters
    // page); falls back to the native color input when the plugin is unavailable.
    function makeColorSwatch(initial, onPick) {
        var hex = /^#[0-9A-Fa-f]{6}$/.test(initial || '') ? initial : '#2596BE';

        if (!(window.jQuery && window.jQuery.fn && window.jQuery.fn.colorPick)) {
            var input = document.createElement('input');
            input.type = 'color';
            input.value = hex;
            input.style.cssText = 'width:26px;height:26px;padding:1px;border:1px solid var(--rd-line);border-radius:5px;background:none;cursor:pointer;flex:none;';
            input.onchange = function () { onPick(input.value); };
            return input;
        }

        var swatch = document.createElement('div');
        swatch.className = 'rd-colorswatch';
        swatch.title = hex;
        swatch.style.background = hex;
        window.jQuery(swatch).colorPick({
            initialColor: hex,
            paletteLabel: 'Choose Color',
            showLibrary: false,
            init: function () {
                this.element.css('background', this.element.attr('title'));
            },
            onColorSelected: function () {
                var chosen = this.color;
                this.element.css('background', chosen);
                swatch.title = chosen;
                onPick(chosen);
            }
        });
        return swatch;
    }

    function toastMsg(msg) {
        var el = $id('rdToast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
    }

    function markDirtyUi() {
        dirty = true;
        $id('rdSaveState').innerHTML = '<span class="dot">&#9679;</span> unsaved changes';
    }

    function markDirty() {
        // The pre-change state goes onto the undo stack; every recorded change starts a
        // fresh redo history.
        if (lastSnapshot !== null) {
            undoStack.push(lastSnapshot);
            if (undoStack.length > UNDO_LIMIT) undoStack.shift();
            redoStack = [];
        }
        markDirtyUi();
        refreshSnapshot();
    }

    function markClean() {
        dirty = false;
        $id('rdSaveState').textContent = '';
    }

    function api(url, method, body) {
        return fetch(url, {
            method: method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': window.RequestVerificationToken
            },
            body: body === undefined ? undefined : JSON.stringify(body)
        }).then(function (r) {
            // A dead session answers with a redirect to the login page (HTML) instead of
            // JSON - e.g. after a server restart. Surface that clearly instead of failing
            // silently on r.json().
            var contentType = (r.headers.get('content-type') || '');
            if (r.redirected || contentType.indexOf('text/html') >= 0) {
                throw 'Session expired - refresh the page and log in again.';
            }
            return r.json();
        });
    }

    function pageObj() { return template && template.pages ? template.pages[curPage] : null; }
    function selectedComp() {
        var page = pageObj();
        return page && selected >= 0 && selected < page.components.length ? page.components[selected] : null;
    }

    // ---- report loading ----
    // The report to edit is chosen on the Reports page and arrives as ?report=<name>; the
    // designer itself has no picker, and creating/deleting reports lives on that page too.
    // The full list is still fetched to resolve the name to an id (and to fall back to the
    // first report when the page is opened without one).
    function loadReports(preselect) {
        api('/API/Config/Reports').then(function (list) {
            reports = Array.isArray(list) ? list : [];
            var target = null;
            if (preselect) {
                target = reports.find(function (r) { return r.name === preselect; });
                // A stale link (renamed/deleted report) used to open the FIRST report
                // without a word - easy to edit the wrong report from there.
                if (!target) toastMsg('Report "' + preselect + '" was not found (renamed or deleted?). Opening the first report instead.');
            }
            if (!target && reports.length > 0 && !current) target = reports[0];
            if (target) openReport(target.id);
            else renderAll();
        }).catch(function (e) { toastMsg('Loading reports failed: ' + e); });
    }

    // The embedded AI chat reads window.EnvisionChatConfig.currentContext on every message,
    // so keep it pointing at the report that is actually open (the server-rendered context
    // only knows the ?report= parameter of the initial load).
    function updateChatContext() {
        if (!window.EnvisionChatConfig) return;
        window.EnvisionChatConfig.currentContext =
            'User is currently viewing the Report Designer' + (current ? ' with the report named ' + current.name + ' open' : '')
            + '. Reports are the Reports config entity type: use GetConfigEntities with entityType Reports to read the report'
            + ' (its layout is the TemplateJson field), GetReportTemplateSchema for the template JSON contract,'
            + ' UpdateConfigEntities to change it, and ExecuteReport to render it. The open designer reloads the report'
            + ' automatically after a successful update. When building report content, prefer data-bound components'
            + ' (kpiRow, chart, table, alarmList, eventList with var:/hist: bindings) over pasting live values into'
            + ' text components: bound components resolve at render time, so the report stays live on every execution'
            + ' instead of freezing a snapshot.';
    }

    // Mirrors PythonEdit's chat hook: when the embedded AI assistant successfully updates
    // the report that is open here (UpdateConfigEntities on Reports), reload it into the
    // designer straight away - no confirmation step, the saved report is the truth.
    function initAiChatHook() {
        if (!window.EnvisionChatConfig) return;
        window.EnvisionChatConfig.onAfterSuccessfulTool = function (activity) {
            if (!isCurrentReportUpdateActivity(activity)) return false;
            // Unsaved designer work is not silently clobbered by an AI edit: the user
            // picks which version wins.
            if (dirty && !confirm('The AI assistant updated this report on the server. Reload it and discard your unsaved designer changes?')) {
                toastMsg('Kept your unsaved changes; the AI edit is stored on the server.');
                return true;
            }
            openReport(current.id);
            toastMsg('Report updated by the AI assistant.');
            return true;
        };
    }

    // Only react when the update targets the report open in this designer, so an AI edit
    // to a different report does not clobber unsaved work here.
    function isCurrentReportUpdateActivity(activity) {
        if (!activity || !current) return false;
        if ((activity.toolName || '') !== 'UpdateConfigEntities') return false;
        try {
            var args = JSON.parse(activity.argumentsJson || '{}');
            if ((args.entityType ? String(args.entityType) : '').trim().toLowerCase() !== 'reports') return false;
            var items = args.items;
            if (!Array.isArray(items)) return false;
            return items.some(function (item) {
                if (!item) return false;
                var itemId = item.id !== undefined && item.id !== null ? item.id : item.Id;
                if (itemId !== undefined && itemId !== null) return Number(itemId) === Number(current.id);
                var itemName = item.name !== undefined ? item.name : item.Name;
                return itemName !== undefined && itemName !== null && String(itemName) === current.name;
            });
        } catch (e) {
            return false;
        }
    }

    function openReport(id) {
        api('/API/Config/Reports/' + id).then(function (r) {
            if (r && r.error) { toastMsg(r.error); return; }
            current = r;
            updateChatContext();
            try {
                template = JSON.parse(r.templateJson || '{}');
            } catch (e) {
                // Repair mode: NEVER silently replace a malformed stored template with an
                // empty one (a later Save would destroy the recoverable original). The raw
                // JSON opens editable in the Script view; Save stores it once it parses.
                brokenTemplateJson = r.templateJson || '';
                template = null;
                curPage = 0;
                selection = [];
                selected = -1;
                markClean();
                resetHistory();
                renderAll();
                switchView('script');
                var templateOut = $id('rdTemplateText');
                templateOut.readOnly = false;
                templateOut.value = brokenTemplateJson;
                $id('rdOutputText').value = 'Template JSON is invalid: ' + e.message +
                    '\nRepair it in the Script view and press Save. The stored template stays untouched until the repaired JSON parses.';
                toastMsg('Template JSON is invalid - repair it in the Script view.');
                return;
            }
            brokenTemplateJson = null;
            $id('rdTemplateText').readOnly = true;
            template.pages = template.pages || [];
            if (template.pages.length === 0) template.pages.push({ layout: 'banded', components: [] });
            curPage = 0;
            selection = [];
            selected = -1;
            markClean();
            resetHistory();
            renderAll();
        }).catch(function (e) { toastMsg('Loading the report failed: ' + e); });
    }

    function loadReportsThenOpen(id, name) {
        return api('/API/Config/Reports').then(function (list) {
            reports = Array.isArray(list) ? list : [];
            var target = id ? reports.find(function (r) { return r.id === id; })
                            : reports.find(function (r) { return r.name === name; });
            if (target) openReport(target.id);
        }).catch(function (e) { toastMsg('Reloading reports failed: ' + e); });
    }

    // After a successful save only the server-stamped fields need refreshing. The old
    // full reload (loadReportsThenOpen -> openReport) reset the designer to page 1,
    // dropped the selection and destroyed the undo history on every Ctrl+S - the layout
    // on screen IS what was just stored, so nothing visual needs to change.
    function refreshAfterSave() {
        var savedId = current.id;
        return api('/API/Config/Reports/' + savedId).then(function (r) {
            if (!r || r.error || !current || current.id !== savedId) return;
            current.updatedUtc = r.updatedUtc;     // the next save's concurrency echo
            current.userGroups = r.userGroups;
            current.templateJson = r.templateJson; // the normalized stored form
            var row = reports.find(function (x) { return x.id === savedId; });
            if (row) {
                row.name = r.name;
                row.enable = r.enable;
                row.description = r.description;
                row.userGroups = r.userGroups;
                row.updatedUtc = r.updatedUtc;
            }
            $id('rdCurrentName').textContent = r.name;
        }).catch(function () { /* save succeeded; the refresh only carried updatedUtc */ });
    }

    function saveReport() {
        if (!current) { toastMsg('No report selected.'); return Promise.resolve(false); }
        var wasRepair = brokenTemplateJson !== null;

        // Repair mode: the stored JSON did not parse. Save means "store the repaired JSON
        // from the Script view", once it actually parses.
        if (brokenTemplateJson !== null) {
            try {
                template = JSON.parse($id('rdTemplateText').value);
            } catch (e) {
                toastMsg('The repaired JSON still does not parse: ' + e.message);
                return Promise.resolve(false);
            }
            brokenTemplateJson = null;
            $id('rdTemplateText').readOnly = true;
            template.pages = template.pages || [];
            if (template.pages.length === 0) template.pages.push({ layout: 'banded', components: [] });
            resetHistory();
        }

        template.schemaVersion = template.schemaVersion || 1;
        current.templateJson = JSON.stringify(template);
        var saveBtn = $id('rdSaveBtn');
        saveBtn.disabled = true;
        // updatedUtc = optimistic concurrency: the server rejects the save when someone
        // else (another designer session, the Reports page, MCP) saved in between.
        // userGroups is echoed because the DTO's value-typed fields overwrite on update: a
        // payload without it would reset the report to Administrators only on every save.
        var payload = [{ id: current.id, name: current.name, enable: current.enable !== false, description: current.description || '', userGroups: current.userGroups || '', templateJson: current.templateJson, updatedUtc: current.updatedUtc || '' }];
        return api('/API/Config/Reports', 'PUT', payload).then(function (res) {
            saveBtn.disabled = false;
            if (res && res.success) {
                markClean();
                toastMsg('Report saved.');
                if (wasRepair) {
                    // The repaired template replaced the whole object; show it.
                    curPage = 0;
                    selection = [];
                    selected = -1;
                    renderAll();
                    switchView('design');
                }
                return refreshAfterSave().then(function () { return true; });
            }
            var msg = (res && res.error) || 'Save failed.';
            if (res && res.validationErrors && res.validationErrors.length) {
                msg += '\n- ' + res.validationErrors.join('\n- ');
            }
            $id('rdOutputText').value = msg;
            switchView('output');
            toastMsg('Save failed - see Output.');
            return false;
        }).catch(function (e) {
            saveBtn.disabled = false;
            $id('rdOutputText').value = 'Save failed: ' + e;
            switchView('output');
            toastMsg('Save failed: ' + e);
            return false;
        });
    }

    // ---- execute / preview ----

    // Run-options dialog next to the Execute button: optional period override and per-run
    // parameter overrides (the server already accepted both; the designer just never asked).
    // Empty fields fall back to the template period / parameter defaults. Values are kept
    // for the session so re-running a past window is one click.
    function showRunOptions(anchorBtn, run) {
        closeDropChoice();
        var menu = document.createElement('div');
        menu.id = 'rdDropMenu';
        menu.className = 'rd-dropmenu rd-runmenu';
        var paramKeys = Object.keys((template && template.parameters) || {});
        var html = '<div class="hdr">Run ' + esc(current.name) + '</div>'
            + '<div class="rd-frow"><label>From</label><input class="rd-fin" id="rdRunStart" placeholder="template period" value="' + esc(lastRunOptions.periodStart) + '"></div>'
            + '<div class="rd-frow"><label>To</label><input class="rd-fin" id="rdRunEnd" placeholder="YYYY-MM-DD HH:MM:SS" value="' + esc(lastRunOptions.periodEnd) + '"></div>';
        paramKeys.forEach(function (k, i) {
            var remembered = lastRunOptions.params[k] !== undefined ? lastRunOptions.params[k] : '';
            html += '<div class="rd-frow"><label>' + esc(k) + '</label><input class="rd-fin rd-runparam" data-key="' + esc(k) + '" placeholder="' + esc(template.parameters[k] || 'default') + '" value="' + esc(remembered) + '"></div>';
        });
        html += '<div class="rd-listrow" style="justify-content:flex-end;margin-top:6px;">'
            + '<button type="button" class="rd-minibtn" id="rdRunCancel">Cancel</button>'
            + '<button type="button" class="rd-minibtn" id="rdRunGo" style="font-weight:600;">Run</button></div>';
        menu.innerHTML = html;
        document.body.appendChild(menu);

        var rect = anchorBtn.getBoundingClientRect();
        var menuRect = menu.getBoundingClientRect();
        menu.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - menuRect.width - 4)) + 'px';
        menu.style.top = Math.min(rect.bottom + 4, window.innerHeight - menuRect.height - 4) + 'px';

        function dismiss() {
            document.removeEventListener('mousedown', onOutside, true);
            document.removeEventListener('keydown', onEscape, true);
            closeDropChoice();
        }
        function onOutside(ev) { if (!menu.contains(ev.target)) dismiss(); }
        function onEscape(ev) { if (ev.key === 'Escape') { ev.stopPropagation(); dismiss(); } }
        setTimeout(function () {
            document.addEventListener('mousedown', onOutside, true);
            document.addEventListener('keydown', onEscape, true);
        }, 0);

        $id('rdRunCancel').onclick = dismiss;
        $id('rdRunGo').onclick = function () {
            var options = {
                periodStart: ($id('rdRunStart').value || '').trim(),
                periodEnd: ($id('rdRunEnd').value || '').trim(),
                params: {}
            };
            [].forEach.call(menu.querySelectorAll('.rd-runparam'), function (input) {
                var value = (input.value || '').trim();
                if (value !== '') options.params[input.dataset.key] = value;
            });
            lastRunOptions = options;
            dismiss();
            run(options);
        };
    }

    // Runs the report. `options` is optional: without it the template's own period and
    // parameter defaults are used, which is what the plain Execute button does. The caret
    // next to it collects overrides first (see executeReportWithOptions).
    function runReportNow(options) {
        var body = { name: current.name };
        if (options) {
            if (options.periodStart && options.periodEnd) {
                body.periodStart = options.periodStart;
                body.periodEnd = options.periodEnd;
            } else if (options.periodStart || options.periodEnd) {
                toastMsg('Set both From and To to override the period; leaving both empty uses the template period.');
                return;
            }
            if (Object.keys(options.params).length) body.parameters = options.params;
        }

        var btn = $id('rdExecuteBtn');
        var caret = $id('rdExecuteOptionsBtn');
        btn.disabled = true;
        if (caret) caret.disabled = true;
        $id('rdOutputText').value = 'Executing...';
        switchView('output');
        api('?handler=ExecuteReport', 'POST', body).then(function (res) {
            btn.disabled = false;
            if (caret) caret.disabled = false;
            var text = '';
            if (res.result) text += res.result;
            if (res.error && res.error !== 'Program Succesfully Executed...') text += (text ? '\n' : '') + res.error;
            $id('rdOutputText').value = text || 'Done.';
            updatePreviewFiles(res.files || []);
            if ((res.files || []).length > 0) switchView('preview');
        }).catch(function (e) {
            btn.disabled = false;
            if (caret) caret.disabled = false;
            $id('rdOutputText').value = 'Execute failed: ' + e;
            toastMsg('Execute failed: ' + e);
        });
    }

    // Shared pre-flight for both Execute paths. Returns false when the run cannot start
    // yet (no report, broken template, or the user declined the save-first prompt).
    function readyToExecute(retry) {
        if (!current) { toastMsg('No report selected.'); return false; }
        if (brokenTemplateJson !== null) { toastMsg('Repair the template JSON first (Script view).'); return false; }

        // Save-and-run instead of a hard refusal: schedules and RunReport read the stored
        // row, so the run always reflects what was just saved.
        if (dirty) {
            if (!confirm('Unsaved changes are saved before executing. Continue?')) return false;
            saveReport().then(function (saved) { if (saved) retry(); });
            return false;
        }
        return true;
    }

    // Plain Execute: one click, template defaults, no dialog.
    function executeReport() {
        if (!readyToExecute(executeReport)) return;
        runReportNow(null);
    }

    // Caret: ask for a period and/or per-run parameter overrides first.
    function executeReportWithOptions() {
        if (!readyToExecute(executeReportWithOptions)) return;
        showRunOptions($id('rdExecuteOptionsBtn') || $id('rdExecuteBtn'), runReportNow);
    }

    var previewNativeExtensions = ['.pdf', '.html', '.htm', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

    function updatePreviewFiles(files) {
        var select = $id('rdPreviewFileSelect');
        var frame = $id('rdPreviewFrame');
        var empty = $id('rdPreviewEmpty');
        select.innerHTML = '';
        if (!files || files.length === 0) {
            frame.style.display = 'none';
            frame.src = 'about:blank';
            select.style.display = 'none';
            empty.style.display = '';
            return;
        }
        empty.style.display = 'none';
        select.style.display = '';
        files.forEach(function (f) {
            var option = document.createElement('option');
            option.value = f;
            option.textContent = previewFileLabel(f);
            select.appendChild(option);
        });
        select.selectedIndex = 0;
        loadSelectedPreviewFile();
    }

    // Display name for a preview URL. Preview files are served by the authenticated
    // handler as /API/Config/PreviewFile?token=...&file=<name>, so the name lives in the
    // query string, not in the path - taking the last path segment would show the whole
    // "PreviewFile?token=..." string as the label.
    function previewFileLabel(url) {
        var match = /[?&]file=([^&]+)/.exec(url || '');
        var name = match ? match[1] : String(url || '').split('/').pop();
        try {
            return decodeURIComponent(name);
        } catch (e) {
            return name;
        }
    }

    function loadSelectedPreviewFile() {
        var select = $id('rdPreviewFileSelect');
        var frame = $id('rdPreviewFrame');
        if (!select.value) return;
        var url = select.value;
        // Extension comes from the file NAME, which may be a query parameter.
        var name = previewFileLabel(url);
        var ext = name.lastIndexOf('.') >= 0 ? name.substring(name.lastIndexOf('.')).toLowerCase() : '';
        var bust = url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
        frame.style.display = '';
        if (previewNativeExtensions.indexOf(ext) >= 0) {
            // srcdoc takes precedence over src, so it must be REMOVED here: after viewing
            // an .xlsx entry once, re-selecting the .pdf kept showing the xlsx message.
            frame.removeAttribute('srcdoc');
            frame.src = bust;
        } else {
            frame.src = 'about:blank';
            frame.srcdoc = '<html><body style="font-family:sans-serif;padding:10px;">Open the file from the project folder: ' + esc(name) + '</body></html>';
        }
    }

    // ---- view switching ----
    function switchView(view) {
        var seg = $id('rdViewSeg');
        seg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === view); });
        ['design', 'preview', 'output', 'script'].forEach(function (v) {
            $id('rdView' + v.charAt(0).toUpperCase() + v.slice(1)).classList.toggle('on', v === view);
        });
        if (view === 'script') loadRunnerScript();
    }

    // Read-only view, two panels: how this report is executed (reference) and the report
    // template (JSON in the Reports table). Components live in the TEMPLATE - that is
    // what keeps designer and AI/MCP edits interchangeable.
    function loadRunnerScript() {
        var usageOut = $id('rdScriptText');
        var templateOut = $id('rdTemplateText');
        if (!current) {
            usageOut.value = 'No report selected.';
            templateOut.value = '';
            return;
        }

        // Repair mode owns the template textarea (it holds the raw broken JSON).
        if (brokenTemplateJson !== null) {
            usageOut.value = 'Template JSON is invalid. Repair it below and press Save.';
            return;
        }

        var nameLiteral = JSON.stringify(current.name);
        var paramKeys = Object.keys((template && template.parameters) || {});
        var paramsExample = paramKeys.length
            ? '{' + paramKeys.map(function (k) { return JSON.stringify(k) + ': "..."'; }).join(', ') + '}'
            : '{"Name": "value"}';
        // The status variable suffix maps every character outside A-Za-z0-9_ to '_' so
        // the key is always usable in alarm/event expressions.
        var statusSuffix = current.name.replace(/[^A-Za-z0-9_]/g, '_');

        usageOut.value =
            '# Ways to execute this report:\n' +
            '#  - Designer: the Execute button (always runs, also when disabled).\n' +
            '#  - Schedules / Alarms / Events: action "Execute Report" with report ' + nameLiteral + '.\n' +
            '#  - From any Python script:\n' +
            'RunReport(' + nameLiteral + ')\n' +
            '# ... or with an explicit period and per-run parameters:\n' +
            'RunReport(' + nameLiteral + ', "2026-07-01 06:00:00", "2026-07-02 06:00:00", params=' + paramsExample + ')\n' +
            '#\n' +
            '# Run status: System.ReportStatus_' + statusSuffix + '  /  System.ReportMsg_' + statusSuffix + '\n' +
            '# Output files: Project/Reports/. Enable in Report Settings gates the action and RunReport.';

        try {
            templateOut.value = (dirty ? '// Includes UNSAVED changes - press Save to store.\n' : '')
                + JSON.stringify(template, null, 2);
        } catch (e) {
            templateOut.value = '(template not available)';
        }
    }

    // ---- template JSON import/export (Script view toolbar) ----
    function copyTemplateJson() {
        if (!template) { toastMsg('No template to copy.'); return; }
        var text = JSON.stringify(template, null, 2);
        copyTextToClipboard(text, 'Template JSON copied.');
    }

    // navigator.clipboard only exists in a secure context, and this product commonly runs
    // on plain-http LAN addresses - a "copied" toast with nothing on the clipboard is
    // worse than a fallback. execCommand still works there.
    function copyTextToClipboard(text, successMsg) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () { toastMsg(successMsg); },
                function () { toastMsg('Copy failed.'); });
            return;
        }
        var area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { /* fall through */ }
        area.remove();
        toastMsg(ok ? successMsg : 'Copy failed - select the text and copy manually.');
    }

    function downloadTemplateJson() {
        if (!template || !current) { toastMsg('No template to download.'); return; }
        var blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = current.name + '.template.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function importTemplateJson(file) {
        if (!current) { toastMsg('Open a report first.'); return; }
        var reader = new FileReader();
        reader.onload = function () {
            var parsed;
            try {
                parsed = JSON.parse(String(reader.result));
            } catch (e) {
                toastMsg('The file is not valid JSON: ' + e.message);
                return;
            }
            // A root that is not an object (null, a number, an array) would leave the
            // designer with a template nothing can render or save.
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                toastMsg('The file is not a report template (expected a JSON object with "pages").');
                return;
            }
            if (!confirm('Replace the layout of "' + current.name + '" with the imported template? (Not stored until you press Save.)')) return;
            template = parsed;
            template.pages = template.pages || [];
            if (template.pages.length === 0) template.pages.push({ layout: 'banded', components: [] });
            brokenTemplateJson = null;
            $id('rdTemplateText').readOnly = true;
            curPage = 0;
            selection = [];
            selected = -1;
            markDirty();
            renderAll();
            switchView('design');
            toastMsg('Template imported - press Save to store it.');
        };
        reader.readAsText(file);
    }

    // ---- paper rendering ----
    function accent() { return (template && template.accentColor) || '#2596BE'; }

    function componentTag(comp) {
        var def = COMPONENT_DEFS[comp.type];
        return def ? def.label : comp.type;
    }

    function componentHtml(comp) {
        var t = comp.type;
        var text = highlightTokens(esc(comp.text || ''));
        var sub = highlightTokens(esc(comp.subText || ''));

        if (t === 'header') {
            return '<div class="rdp-header"><h1>' + (text || 'Report') + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
        }
        if (t === 'text' || t === 'value') {
            var cls = { h1: 'rdp-h1', h2: 'rdp-h2', callout: 'rdp-callout' }[comp.style] || 'rdp-body';
            return '<div class="' + cls + '">' + (text || '&nbsp;') + '</div>';
        }
        if (t === 'kpiRow') {
            var tiles = comp.tiles || [];
            var html = '<div class="rdp-kpirow" style="grid-template-columns:repeat(' + Math.max(1, tiles.length) + ',1fr);">';
            tiles.forEach(function (tile) {
                html += '<div class="rdp-kpi"><div class="k">' + esc(tile.label || 'KPI') + '</div>'
                    + '<div class="v">&#8212; <small>' + esc(tile.units || '') + '</small></div>'
                    + '<div class="b">' + esc(tile.binding || 'no binding') + (tile.compare ? ' &middot; vs prev' : '') + '</div></div>';
            });
            return html + '</div>';
        }
        if (t === 'chart') {
            var palette = [accent(), '#e6a63c', '#5cc98a', '#c8443a', '#7a6be2'];
            var series = comp.series || [];
            var legend = series.map(function (s, i) {
                var color = s.color || palette[i % palette.length];
                return '<span><i style="background:' + esc(color) + '"></i>' + esc(s.label || s.variable || 'series') + '</span>';
            }).join('');
            var lines = '';
            series.forEach(function (s, i) {
                var color = s.color || palette[i % palette.length];
                var seed = (i * 37) % 60;
                var pts = [];
                for (var px = 0; px <= 10; px++) {
                    var y = 95 - ((Math.sin((px + seed) * 0.9 + i) + 1) * 30 + (i * 8)) % 78;
                    pts.push((30 + px * 62) + ' ' + y.toFixed(0));
                }
                if ((comp.chartType || 'line') === 'bar' && i === 0) {
                    for (var b = 0; b <= 10; b++) {
                        var bh = 20 + ((b * 13 + seed) % 55);
                        lines += '<rect x="' + (30 + b * 62 - 9) + '" y="' + (115 - bh) + '" width="18" height="' + bh + '" rx="2" fill="' + esc(color) + '"/>';
                    }
                } else {
                    lines += '<polyline points="' + pts.join(',') + '" fill="none" stroke="' + esc(color) + '" stroke-width="2" stroke-linejoin="round"/>';
                }
            });
            return '<div class="rdp-chart">'
                + '<div class="rdp-charttitle">' + (text || 'Chart') + '<small>Historian &middot; ' + esc(comp.resample || '1h') + ' &middot; sample preview</small></div>'
                + '<svg viewBox="0 0 680 130" style="width:100%;height:auto;display:block;">'
                + '<line x1="28" y1="115" x2="660" y2="115" stroke="#e3eaf0"/>'
                + '<line x1="28" y1="20" x2="28" y2="115" stroke="#e3eaf0"/>'
                + (series.length ? lines : '<text x="340" y="70" text-anchor="middle" font-size="12" fill="#8a99a8">Add a series from Data sources</text>')
                + '</svg>'
                + (legend ? '<div class="rdp-legend">' + legend + '</div>' : '')
                + '</div>';
        }
        if (t === 'table' || t === 'alarmList' || t === 'eventList') {
            var cols;
            // Default list columns match the renderer's SELECTs exactly, so the preview
            // shows the same column count and crowding as the printed page.
            if (t === 'alarmList' && !(comp.columns && comp.columns.length)) cols = ['OnTime', 'OffTime', 'Asset', 'Message', 'Severity', 'AckTime', 'AckUser'];
            else if (t === 'eventList' && !(comp.columns && comp.columns.length)) cols = ['OnTime', 'Asset', 'Message', 'AckTime', 'AckUser'];
            else if ((t === 'alarmList' || t === 'eventList') && comp.columns && comp.columns.length)
                cols = comp.columns.map(function (c) { return (c.fn ? 'f ' : '') + (c.header || c.name || '?'); });
            else if (comp.source === 'historian' && !(comp.columns && comp.columns.length)) cols = ['TimeStamp', 'Variable', 'Value'];
            else cols = (comp.columns && comp.columns.length)
                ? comp.columns.map(function (c) { return (c.fn ? 'f ' : '') + (c.header || c.name || '?'); })
                : ['(all query columns)'];
            var srcNote = t === 'table'
                ? (comp.source === 'sqlite' ? esc(comp.database || 'project db') + ' &middot; query'
                    : (comp.source === 'historian' ? 'Historian &middot; ' + (comp.variables || []).length + ' variable(s)' : esc(comp.source)))
                : (t === 'alarmList' ? 'Alarms in period' : 'Events in period');
            var head = cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('');
            var body = '';
            for (var r = 0; r < 3; r++) {
                body += '<tr>' + cols.map(function () { return '<td style="color:#9db0c0;">&#8943;</td>'; }).join('') + '</tr>';
            }
            var hasAgg = t === 'table' && (comp.columns || []).some(function (c) { return c.aggregate; });
            if (hasAgg) {
                body += '<tr class="total">' + (comp.columns || []).map(function (c) {
                    // Standard aggregates read better upper-cased; a py: function name and an
                    // inline expression are shown exactly as written.
                    var agg = (c.aggregate || '').trim();
                    var verbatim = agg.indexOf('py:') === 0 || isExpression(agg);
                    return '<td>' + esc(agg ? (verbatim ? agg : agg.toUpperCase()) : '') + '</td>';
                }).join('') + '</tr>';
            }
            return '<div class="rdp-tbltitle">' + (text || componentTag(comp)) + '<small>' + srcNote + '</small></div>'
                + '<table class="rdp-tbl"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
        }
        if (t === 'image') {
            if (comp.path) {
                // Same width rule as the renderer, so the page shows the printed size: a
                // percentage of the space the component has, defaulting to a third of the
                // page on a banded layout and the whole box on a canvas one.
                var imgPage = pageObj() || {};
                var imgPct = parseFloat(comp.imageWidth) > 0
                    ? Math.min(100, parseFloat(comp.imageWidth))
                    : ((imgPage.layout || 'banded') === 'canvas' ? 100 : 33);
                var imgAlign = comp.align === 'center' ? 'margin-left:auto;margin-right:auto;'
                    : (comp.align === 'right' ? 'margin-left:auto;' : '');
                return '<img src="/' + esc(comp.path.replace(/\\/g, '/')) + '" style="width:' + imgPct + '%;display:block;' + imgAlign + '" ' +
                    'onerror="this.outerHTML=\'&lt;div style=&quot;color:#8a99a8;font-size:11px;&quot;&gt;Image not found&lt;/div&gt;\'">';
            }
            return '<div style="border:1px dashed #c9d4de;border-radius:6px;padding:18px;text-align:center;color:#8a99a8;font-size:11px;">Image - set a path (relative to wwwroot, e.g. Project/logo.png)</div>';
        }
        if (t === 'columns') {
            // Same width rule as the renderer: an explicit percentage takes its share of the
            // band minus the gaps, and the columns left at 0 divide the rest between them.
            var slots = comp.slots || [];
            var gapTotal = COLUMN_GAP_PX * Math.max(0, slots.length - 1);
            var cols = '<div class="rdp-cols">';
            slots.forEach(function (slot, si) {
                var pct = parseFloat(slot.width) > 0 ? Math.min(100, parseFloat(slot.width)) : 0;
                var flex = pct > 0
                    ? 'flex:0 0 calc((100% - ' + gapTotal + 'px) * ' + (pct / 100) + ');'
                    : 'flex:1 1 0;';
                cols += '<div class="rdp-col" data-slot="' + si + '" style="' + flex + 'min-width:0;">';
                var kids = slot.components || [];
                if (kids.length === 0) {
                    cols += '<div class="rdp-col-empty">Empty column<br>drop a component here</div>';
                }
                kids.forEach(function (kid, ci) {
                    cols += '<div class="rdp-col-child" data-slot="' + si + '" data-child="' + ci + '"'
                        + ' data-tag="' + esc(componentTag(kid)) + '">'
                        // Guard rather than recurse: a columns component inside a column is
                        // refused by validation, so it can only come from a hand-written
                        // template, and drawing it would nest the flex rows indefinitely.
                        + (kid.type === 'columns'
                            ? '<div class="rdp-body">A columns component cannot sit inside a column.</div>'
                            : componentHtml(kid))
                        + '</div>';
                });
                cols += '</div>';
            });
            return cols + '</div>';
        }
        if (t === 'spacer') {
            return '<div style="height:' + Math.max(2, comp.spacerHeight || 10) + 'px;"></div>';
        }
        if (t === 'footer') {
            return '<div class="rdp-foot"><span>' + text + '</span><span class="r">' + sub + '</span></div>';
        }
        return '<div class="rdp-body">' + esc(t) + '</div>';
    }

    function renderPaper() {
        var paper = $id('rdPaper');
        paper.style.setProperty('--rdp-accent', accent());
        paper.classList.toggle('landscape', (template && template.orientation) === 'landscape');
        var page = pageObj();
        paper.innerHTML = '';
        if (!template || !page) {
            paper.innerHTML = '<div class="rd-empty-paper">Select or create a report to start designing.</div>';
            return;
        }
        var canvas = (page.layout || 'banded') === 'canvas';
        paper.classList.toggle('canvasmode', canvas);

        if (page.components.length === 0) {
            paper.innerHTML = '<div class="rd-empty-paper">Empty page - click or drag components from the Toolbox.</div>';
        }

        page.components.forEach(function (comp, index) {
            var band = document.createElement('div');
            band.className = 'rd-band' + (canvas && comp.type !== 'footer' ? ' free' : '');
            // A period override is invisible in the layout, so the band tag says so - it is
            // the only sign that this component does not cover the report period.
            var override = (comp.periodStart || '') || (comp.periodEnd || '');
            band.dataset.tag = componentTag(comp)
                + (override ? '  ' + (comp.periodStart || 'period start') + ' .. ' + (comp.periodEnd || 'period end') : '');
            band.dataset.index = index;
            if (selection.indexOf(index) >= 0) band.classList.add('sel');
            band.innerHTML = componentHtml(comp);
            if (index === selected && selection.length > 1) band.classList.add('anchor');

            if (canvas && comp.type !== 'footer') {
                band.style.left = posOr(comp.x, 40) + 'px';
                band.style.top = posOr(comp.y, 40) + 'px';
                band.style.width = (comp.w || 320) + 'px';
                attachDrag(band, comp);
                attachResize(band, comp);
            } else if (!canvas && comp.type !== 'footer') {
                attachBandReorder(band, index);
            }

            band.addEventListener('click', function (e) {
                e.stopPropagation();
                // The click after a group drag would collapse the multi-selection the
                // drag just moved.
                if (suppressBandClick) { suppressBandClick = false; return; }
                selectComponent(index, e.ctrlKey || e.metaKey || e.shiftKey);
            });

            // Inside a Columns band, a click reaches the component under the cursor: on a
            // child it edits that child, on the empty part of a column it makes that column
            // the one the Toolbox adds to.
            if (comp.type === 'columns') {
                band.querySelectorAll('.rdp-col-child').forEach(function (el) {
                    el.addEventListener('click', function (e) {
                        e.stopPropagation();
                        selectChild(index, parseInt(el.dataset.slot, 10), parseInt(el.dataset.child, 10));
                    });
                });
                band.querySelectorAll('.rdp-col').forEach(function (col) {
                    col.addEventListener('click', function (e) {
                        e.stopPropagation();
                        selectSlot(index, parseInt(col.dataset.slot, 10));
                    });
                });
            }
            paper.appendChild(band);
        });

        // Canvas pages: the paper grows with content, but the PDF clips at the sheet
        // height (no auto page break on canvas). Mark where the printed page ends so
        // components below the line are visibly off-page in the designer too.
        if (canvas) {
            var marker = document.createElement('div');
            marker.className = 'rd-pageend';
            marker.style.top = canvasPageHeightPx() + 'px';
            marker.innerHTML = '<span>Page end - content below this line is not printed</span>';
            paper.appendChild(marker);
        } else {
            // Banded pages flow onto further PDF pages instead of clipping, so the breaks
            // are guides rather than a warning: they show WHERE the split lands, which is
            // what decides whether a table or KPI row gets separated from its heading.
            renderBandedPageGuides(paper);
        }

        // Images load after render and grow the paper; refresh the scaled box then.
        paper.querySelectorAll('img').forEach(function (img) {
            img.addEventListener('load', applyZoom);
        });

        applyZoom();
    }

    // Sheet size in millimetres for the current page size/orientation.
    function sheetMm() {
        var letter = (template && template.pageSize || 'A4').toLowerCase() === 'letter';
        var landscape = (template && template.orientation) === 'landscape';
        var w = letter ? 215.9 : 210.0;
        var h = letter ? 279.4 : 297.0;
        return landscape ? { w: h, h: w } : { w: w, h: h };
    }

    // Printable sheet height in design px for the current page size/orientation
    // (portrait pages are 794px wide, landscape 1123px; height follows the aspect).
    function canvasPageHeightPx() {
        var mm = sheetMm();
        var paperWidthPx = (template && template.orientation) === 'landscape' ? 1123 : 794;
        return Math.round(paperWidthPx * (mm.h / mm.w));
    }

    // Where the PDF's automatic page breaks fall on a BANDED page, in design px measured
    // from the top of the paper element.
    //
    // The renderer uses 14mm margins and breaks 18mm above the bottom edge, so each PDF
    // page holds (sheet height - 14 - 18) mm of content. That is converted with the
    // designer's own px-per-mm and offset by the paper's top padding, which is where the
    // component flow actually starts. Indicative rather than exact: the paper padding and
    // the PDF margin are not the identical fraction of the sheet.
    var PDF_TOP_MARGIN_MM = 14;
    var PDF_BOTTOM_MARGIN_MM = 18;

    // Components whose printed height depends on the data they return, not on the design.
    // The paper draws them with a few sample rows, so the guides below can only describe
    // the DESIGNED layout - the real report is usually longer.
    var DATA_DRIVEN_TYPES = ['table', 'alarmList', 'eventList'];

    function pageHasDataDrivenComponents() {
        var page = pageObj();
        if (!page) return false;
        var dataDriven = function (c) {
            if (DATA_DRIVEN_TYPES.indexOf(c.type) >= 0) return true;
            // A table inside a column expands at run time just the same.
            return (c.slots || []).some(function (slot) {
                return (slot.components || []).some(dataDriven);
            });
        };
        return (page.components || []).some(dataDriven);
    }

    // Draws the guides. Called after the bands exist, and again from applyZoom once the
    // paper's final height is known (images and long tables settle late).
    function renderBandedPageGuides(paper) {
        paper.querySelectorAll('.rd-pagebreak').forEach(function (g) { g.remove(); });
        var offsets = bandedPageBreakOffsetsPx(paper.offsetHeight);
        var dataDriven = pageHasDataDrivenComponents();
        var caveat = 'Tables, alarm lists and event lists are drawn with sample rows here and '
            + 'expand to their real row count when the report runs, so the printed report usually '
            + 'has more pages than these guides show. Execute the report and use the Preview tab '
            + 'for the true page count.';

        offsets.forEach(function (top, i) {
            var guide = document.createElement('div');
            guide.className = 'rd-pagebreak' + (dataDriven ? ' estimated' : '');
            guide.style.top = top + 'px';
            guide.innerHTML = '<span>Page ' + (i + 2) + (dataDriven && i === 0 ? ' &middot; layout only' : '') + '</span>';
            guide.title = dataDriven
                ? 'Start of PDF page ' + (i + 2) + ' for the designed layout. ' + caveat
                : 'Start of PDF page ' + (i + 2) + '.';
            paper.appendChild(guide);
        });
    }

    function bandedPageBreakOffsetsPx(paperHeightPx) {
        var mm = sheetMm();
        var paper = $id('rdPaper');
        var paperWidthPx = paper.offsetWidth || ((template && template.orientation) === 'landscape' ? 1123 : 794);
        var pxPerMm = paperWidthPx / mm.w;
        var contentPx = (mm.h - PDF_TOP_MARGIN_MM - PDF_BOTTOM_MARGIN_MM) * pxPerMm;
        if (contentPx <= 0) return [];

        var padTop = parseFloat(getComputedStyle(paper).paddingTop) || 0;
        var offsets = [];
        for (var y = padTop + contentPx, guard = 0; y < paperHeightPx && guard < 50; y += contentPx, guard++) {
            offsets.push(Math.round(y));
        }
        return offsets;
    }

    function attachDrag(band, comp) {
        band.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            e.preventDefault();
            var index = parseInt(band.dataset.index, 10);

            // Dragging a component that is already part of a multi-selection moves the
            // whole set; dragging any other one selects it first (normal behaviour).
            var additive = e.ctrlKey || e.metaKey || e.shiftKey;
            if (additive || selection.indexOf(index) < 0) selectComponent(index, additive);

            var group = selectedComps().filter(function (entry) {
                var page = pageObj();
                return (page.layout || 'banded') === 'canvas';
            });
            if (group.length === 0) group = [{ index: index, comp: comp }];

            var startX = e.clientX, startY = e.clientY;
            var origins = group.map(function (entry) {
                return { comp: entry.comp, index: entry.index, x: posOr(entry.comp.x, 40), y: posOr(entry.comp.y, 40) };
            });
            var paper = $id('rdPaper');
            var movedAny = false;

            function move(ev) {
                // One snapped delta for the whole set, so relative spacing is preserved.
                var dx = Math.round(((ev.clientX - startX) / zoom) / 10) * 10;
                var dy = Math.round(((ev.clientY - startY) / zoom) / 10) * 10;
                var minX = Math.min.apply(null, origins.map(function (o) { return o.x; }));
                var minY = Math.min.apply(null, origins.map(function (o) { return o.y; }));
                dx = Math.max(dx, -minX);
                dy = Math.max(dy, -minY);
                if (dx !== 0 || dy !== 0) movedAny = true;
                origins.forEach(function (o) {
                    o.comp.x = o.x + dx;
                    o.comp.y = o.y + dy;
                    var el = paper.querySelector('.rd-band[data-index="' + o.index + '"]');
                    if (el) {
                        el.style.left = o.comp.x + 'px';
                        el.style.top = o.comp.y + 'px';
                    }
                });
                var px = $id('rdPosX'), py = $id('rdPosY');
                if (px) px.value = comp.x;
                if (py) py.value = comp.y;
            }
            function up() {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
                // Only an actual move is a change: plain clicks used to mark the report
                // dirty, push a junk undo entry and wipe the redo stack.
                if (movedAny) {
                    suppressBandClick = true;
                    markDirty();
                }
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
    }

    // Banded pages: a component drags up or down to reorder the flow, showing the same
    // insertion line a toolbox drop uses. Same result as the Move up/down buttons in the
    // Properties panel, which stay as the precision/keyboard path. The footer is excluded:
    // it always prints last.
    function attachBandReorder(band, index) {
        band.draggable = true;
        band.title = 'Drag to reorder';
        band.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData(COMP_MIME, String(index));
            e.dataTransfer.effectAllowed = 'move';
            band.classList.add('dragging');
            selectComponent(index, false);
        });
        band.addEventListener('dragend', function () {
            band.classList.remove('dragging');
            hideDropLine();
        });
    }

    // ---- marquee (rubber-band) selection on a free-canvas page ----
    function attachMarquee() {
        var paper = $id('rdPaper');
        paper.addEventListener('mousedown', function (e) {
            var page = pageObj();
            if (e.button !== 0 || !page || (page.layout || 'banded') !== 'canvas') return;
            if (e.target.closest('.rd-band')) return;   // starting on a component = drag/select

            var rect = paper.getBoundingClientRect();
            var startX = (e.clientX - rect.left) / zoom;
            var startY = (e.clientY - rect.top) / zoom;
            var box = document.createElement('div');
            box.className = 'rd-marquee';
            paper.appendChild(box);
            var moved = false;

            function move(ev) {
                moved = true;
                var x = (ev.clientX - rect.left) / zoom;
                var y = (ev.clientY - rect.top) / zoom;
                box.style.left = Math.min(startX, x) + 'px';
                box.style.top = Math.min(startY, y) + 'px';
                box.style.width = Math.abs(x - startX) + 'px';
                box.style.height = Math.abs(y - startY) + 'px';
            }
            function up(ev) {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
                box.remove();
                if (!moved) return;

                var x2 = (ev.clientX - rect.left) / zoom;
                var y2 = (ev.clientY - rect.top) / zoom;
                var left = Math.min(startX, x2), right = Math.max(startX, x2);
                var top = Math.min(startY, y2), bottom = Math.max(startY, y2);

                // Anything the marquee touches joins the selection (additive with Ctrl/Shift).
                var hits = [];
                paper.querySelectorAll('.rd-band.free').forEach(function (b) {
                    var i = parseInt(b.dataset.index, 10);
                    var bx = b.offsetLeft, by = b.offsetTop;
                    var bw = b.offsetWidth, bh = b.offsetHeight;
                    if (bx < right && bx + bw > left && by < bottom && by + bh > top) hits.push(i);
                });
                if (!(ev.ctrlKey || ev.metaKey || ev.shiftKey)) selection = [];
                hits.forEach(function (i) { if (selection.indexOf(i) < 0) selection.push(i); });
                selected = selection.length ? selection[selection.length - 1] : -1;
                // The click that follows this mouseup lands on the paper and would clear
                // the selection the marquee just made.
                suppressPaperClick = true;
                paintSelection();
                renderProps();
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
    }

    // Free-canvas width handle on the right edge. Only the width is set: the height of a
    // component follows its content (a trend chart carries its own height property).
    var MIN_COMPONENT_WIDTH = 60;

    function attachResize(band, comp) {
        var handle = document.createElement('div');
        handle.className = 'rd-resize';
        handle.title = 'Drag to set the width';
        handle.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation(); // otherwise attachDrag would move the component instead
            selectComponent(parseInt(band.dataset.index, 10));
            var startX = e.clientX;
            var origW = comp.w || 320;
            var paper = $id('rdPaper');
            var maxW = Math.max(MIN_COMPONENT_WIDTH, paper.offsetWidth - (comp.x || 0));
            function move(ev) {
                var w = origW + (ev.clientX - startX) / zoom;
                comp.w = Math.max(MIN_COMPONENT_WIDTH, Math.min(maxW, Math.round(w / 10) * 10));
                band.style.width = comp.w + 'px';
                var pw = $id('rdPosW');
                if (pw) pw.value = comp.w;
            }
            function up() {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
                // A grab that never changed the width is not a change (see attachDrag).
                if (comp.w !== origW) {
                    markDirty();
                    applyZoom();
                }
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
        band.appendChild(handle);
    }

    function applyZoom() {
        var paper = $id('rdPaper');
        var box = $id('rdPaperBox');
        paper.style.transform = 'scale(' + zoom + ')';
        // Selection badge/border counter-scale so they stay readable at any zoom.
        paper.style.setProperty('--rd-zoom', zoom);
        // offsetWidth/offsetHeight are the unscaled layout size (transform does not
        // change them); the box takes the scaled size so the page keeps its true
        // proportions and the stage scrolls/centers on the visual size.
        if (box) {
            box.style.width = Math.round(paper.offsetWidth * zoom) + 'px';
            box.style.height = Math.round(paper.offsetHeight * zoom) + 'px';
        }

        // The paper's height settles after images load and tables lay out, so the page
        // guides are recomputed here rather than only at render time.
        var page = pageObj();
        if (page && (page.layout || 'banded') !== 'canvas' && !paper.querySelector('.rd-empty-paper')) {
            renderBandedPageGuides(paper);
        }
    }

    // Continuous zoom (Ctrl + scroll or the preset buttons). When an anchor event is
    // given, the paper point under the cursor stays put while zooming.
    function setZoom(value, anchorEvent) {
        var stage = $id('rdStage');
        var paper = $id('rdPaper');
        var oldZoom = zoom;
        zoom = Math.min(2, Math.max(0.3, value));

        var anchor = null;
        if (anchorEvent && paper) {
            var before = paper.getBoundingClientRect();
            anchor = { unscaledY: (anchorEvent.clientY - before.top) / oldZoom, clientY: anchorEvent.clientY };
        }

        applyZoom();
        updateZoomUi();

        if (anchor && stage && paper) {
            var after = paper.getBoundingClientRect();
            stage.scrollTop += (after.top + anchor.unscaledY * zoom) - anchor.clientY;
        }
    }

    function updateZoomUi() {
        var seg = $id('rdZoomSeg');
        seg.querySelectorAll('button').forEach(function (b) {
            b.classList.toggle('on', Math.abs(parseFloat(b.dataset.z) - zoom) < 0.01);
        });
        var label = $id('rdZoomLabel');
        if (label) label.textContent = 'zoom ' + Math.round(zoom * 100) + '%';
    }

    // additive (Ctrl/Cmd or Shift click) toggles the component in the selection instead of
    // replacing it, so several components can be aligned or moved together.
    // ---- columns band: columns and their children ----

    // The selected component, but only when it is a Columns band.
    function columnsComp() {
        var comp = selectedComp();
        return comp && comp.type === 'columns' && selection.length === 1 ? comp : null;
    }

    function slotOf(slotIndex) {
        var comp = columnsComp();
        if (!comp) return null;
        var slot = (comp.slots || [])[slotIndex];
        if (!slot) return null;
        slot.components = slot.components || [];
        return slot;
    }

    // The child the Properties panel edits, or null when the selection is not a child.
    function activeChild() {
        if (!childSel) return null;
        var slot = slotOf(childSel.slot);
        return slot ? (slot.components[childSel.index] || null) : null;
    }

    function selectSlot(index, slotIndex) {
        selection = [index];
        selected = index;
        childSel = null;
        activeSlot = slotIndex;
        paintSelection();
        renderProps();
    }

    function selectChild(index, slotIndex, childIndex) {
        selection = [index];
        selected = index;
        activeSlot = slotIndex;
        childSel = { slot: slotIndex, index: childIndex };
        paintSelection();
        renderProps();
    }

    // Types a column cannot hold: nesting would make the band's "one page, one unit" rule
    // recursive, and a footer is printed once per page rather than in the flow.
    function allowedInColumn(type) {
        return type !== 'columns' && type !== 'footer';
    }

    // Adds into the active column, after the selected child when there is one. Answers
    // false when the Toolbox click was not meant for a column after all.
    function addComponentToSlot(type) {
        var comp = columnsComp();
        var slot = slotOf(activeSlot);
        if (!comp || !slot) return false;
        if (!allowedInColumn(type)) {
            toastMsg(COMPONENT_DEFS[type].label + ' cannot be placed inside a column.');
            return true;
        }
        var at = childSel && childSel.slot === activeSlot ? childSel.index + 1 : slot.components.length;
        slot.components.splice(at, 0, buildComponent(type));
        childSel = { slot: activeSlot, index: at };
        markDirty();
        renderAll();
        return true;
    }

    function moveChild(delta) {
        var slot = slotOf(childSel && childSel.slot);
        if (!slot) return;
        var to = childSel.index + delta;
        if (to < 0 || to >= slot.components.length) return;
        var child = slot.components.splice(childSel.index, 1)[0];
        slot.components.splice(to, 0, child);
        childSel.index = to;
        markDirty();
        renderAll();
    }

    function duplicateChild() {
        var slot = slotOf(childSel && childSel.slot);
        var child = activeChild();
        if (!slot || !child) return;
        var copy = JSON.parse(JSON.stringify(child));
        copy.id = (child.type || 'component') + '_' + Date.now().toString(36);
        slot.components.splice(childSel.index + 1, 0, copy);
        childSel.index += 1;
        markDirty();
        renderAll();
    }

    function deleteChild() {
        var slot = slotOf(childSel && childSel.slot);
        if (!slot || !activeChild()) return;
        slot.components.splice(childSel.index, 1);
        childSel = null;
        markDirty();
        renderAll();
    }

    function selectComponent(index, additive) {
        childSel = null;
        activeSlot = -1;
        if (additive && index >= 0) {
            var at = selection.indexOf(index);
            if (at >= 0) {
                selection.splice(at, 1);
                selected = selection.length ? selection[selection.length - 1] : -1;
            } else {
                selection.push(index);
                selected = index;
            }
        } else {
            selection = index >= 0 ? [index] : [];
            selected = index;
        }
        paintSelection();
        renderProps();
    }

    function paintSelection() {
        var paper = $id('rdPaper');
        paper.querySelectorAll('.rd-band').forEach(function (b) {
            var i = parseInt(b.dataset.index, 10);
            b.classList.toggle('sel', selection.indexOf(i) >= 0);
            b.classList.toggle('anchor', i === selected && selection.length > 1);
        });
        paper.querySelectorAll('.rdp-col').forEach(function (col) {
            var band = col.closest('.rd-band');
            var mine = band && parseInt(band.dataset.index, 10) === selected;
            col.classList.toggle('active', !!mine && parseInt(col.dataset.slot, 10) === activeSlot);
        });
        paper.querySelectorAll('.rdp-col-child').forEach(function (el) {
            var band = el.closest('.rd-band');
            var mine = band && parseInt(band.dataset.index, 10) === selected;
            el.classList.toggle('sel', !!mine && !!childSel
                && parseInt(el.dataset.slot, 10) === childSel.slot
                && parseInt(el.dataset.child, 10) === childSel.index);
        });
    }

    function clearSelection() {
        selection = [];
        selected = -1;
        childSel = null;
        activeSlot = -1;
        paintSelection();
        renderProps();
    }

    // Selected components on the current page, as {index, comp} - skipping the footer,
    // which is not positionable.
    function selectedComps() {
        var page = pageObj();
        if (!page) return [];
        return selection
            .filter(function (i) { return i >= 0 && i < page.components.length; })
            .map(function (i) { return { index: i, comp: page.components[i] }; })
            .filter(function (e) { return e.comp && e.comp.type !== 'footer'; });
    }

    // ---- page tabs / layout ----
    var PAGE_MIME = 'text/rd-page';

    function renderPageTabs() {
        var host = $id('rdPageTabs');
        host.innerHTML = '';
        if (!template) return;
        template.pages.forEach(function (page, i) {
            var tab = document.createElement('button');
            tab.className = 'rd-pagetab' + (i === curPage ? ' on' : '');
            tab.innerHTML = 'Page ' + (i + 1) + ' <small>' + esc(page.layout || 'banded') + '</small>';
            tab.title = 'Drag to reorder';
            tab.onclick = function () { curPage = i; selection = []; selected = -1; renderAll(); };

            // Tabs reorder by drag; the move buttons next to the tab strip do the same
            // thing for the current page (a keyboard/precision path, like the component
            // move up/down buttons).
            tab.draggable = true;
            tab.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData(PAGE_MIME, String(i));
                e.dataTransfer.effectAllowed = 'move';
                tab.classList.add('dragging');
            });
            tab.addEventListener('dragend', function () {
                tab.classList.remove('dragging');
                host.querySelectorAll('.rd-pagetab').forEach(function (t) { t.classList.remove('dropbefore'); });
            });
            tab.addEventListener('dragover', function (e) {
                if ([].indexOf.call(e.dataTransfer.types, PAGE_MIME) < 0) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                tab.classList.add('dropbefore');
            });
            tab.addEventListener('dragleave', function () { tab.classList.remove('dropbefore'); });
            tab.addEventListener('drop', function (e) {
                var from = parseInt(e.dataTransfer.getData(PAGE_MIME), 10);
                tab.classList.remove('dropbefore');
                if (isNaN(from) || from === i) return;
                e.preventDefault();
                movePageTo(from, i);
            });

            host.appendChild(tab);
        });
        var add = document.createElement('button');
        add.className = 'rd-pagetab';
        add.textContent = '+';
        add.title = 'Add page';
        add.onclick = function () {
            template.pages.push({ layout: 'banded', components: [] });
            curPage = template.pages.length - 1;
            selection = [];
            selected = -1;
            markDirty();
            renderAll();
        };
        host.appendChild(add);

        var seg = $id('rdLayoutSeg');
        var layout = (pageObj() && pageObj().layout) || 'banded';
        seg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === layout); });

        // Move buttons only make sense with more than one page.
        var multi = template.pages.length > 1;
        var left = $id('rdPageLeftBtn');
        var right = $id('rdPageRightBtn');
        if (left) left.disabled = !multi || curPage === 0;
        if (right) right.disabled = !multi || curPage === template.pages.length - 1;
    }

    // Moves a page and keeps the current selection pointing at the SAME page, so
    // reordering never silently switches which page is being edited.
    function movePageTo(from, to) {
        if (!template || from === to) return;
        if (from < 0 || to < 0 || from >= template.pages.length || to >= template.pages.length) return;
        var page = template.pages.splice(from, 1)[0];
        template.pages.splice(to, 0, page);
        if (curPage === from) curPage = to;
        else if (from < curPage && to >= curPage) curPage--;
        else if (from > curPage && to <= curPage) curPage++;
        selection = [];
        selected = -1;
        markDirty();
        renderAll();
    }

    function setPageLayout(layout) {
        var page = pageObj();
        if (!page || page.layout === layout) return;
        if (layout === 'canvas' && template.excelCompatible) {
            toastMsg('Excel-compatible mode allows banded pages only. Disable it in Report settings first.');
            renderPageTabs();
            return;
        }
        page.layout = layout;
        if (layout === 'canvas') {
            var y = 40;
            page.components.forEach(function (c) {
                if (c.type === 'footer') return;
                if (!c.x) c.x = 40;
                if (!c.y) { c.y = y; y += 90; }
                if (!c.w) c.w = 500;
            });
        } else {
            page.components.sort(function (a, b) {
                if (a.type === 'footer') return 1;
                if (b.type === 'footer') return -1;
                return (a.y || 0) - (b.y || 0);
            });
        }
        markDirty();
        renderAll();
    }

    // ---- toolbox (click to add, or drag onto the page) ----
    var DRAG_MIME = 'text/rd-component';
    var VAR_MIME = 'text/rd-variable';
    var COMP_MIME = 'text/rd-comp-move';   // an existing banded component being reordered

    function renderToolbox() {
        var host = $id('rdToolbox');
        host.innerHTML = '';
        Object.keys(COMPONENT_DEFS).forEach(function (type) {
            var def = COMPONENT_DEFS[type];
            var tool = document.createElement('div');
            tool.className = 'rd-tool';
            tool.innerHTML = (TOOL_ICONS[type] || '') + def.label;
            tool.onclick = function () { addComponent(type); };
            tool.draggable = true;
            tool.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData(DRAG_MIME, type);
                e.dataTransfer.effectAllowed = 'copy';
            });
            tool.addEventListener('dragend', hideDropLine);
            host.appendChild(tool);
        });
    }

    function buildComponent(type) {
        var comp = COMPONENT_DEFS[type].make();
        comp.id = type + '_' + Date.now().toString(36);
        return comp;
    }

    // Insert keeping the footer last; index null = append before the footer.
    function insertComponent(page, comp, index) {
        var footerIndex = page.components.findIndex(function (c) { return c.type === 'footer'; });
        if (comp.type === 'footer') {
            // One footer per page: the renderers print exactly one, and validation
            // rejects more - select the existing one instead of adding a duplicate.
            if (footerIndex >= 0) {
                selected = footerIndex;
                selection = [footerIndex];
                toastMsg('This page already has a footer - selected it.');
                return;
            }
            page.components.push(comp);
            selected = page.components.length - 1;
            selection = [selected];
            return;
        }
        var target = index !== null && index !== undefined
            ? Math.min(index, footerIndex >= 0 ? footerIndex : page.components.length)
            : (footerIndex >= 0 ? footerIndex : page.components.length);
        page.components.splice(target, 0, comp);
        // selection follows selected: leaving the old indices painted the outline on the
        // wrong band while the Properties panel already showed the new component.
        selected = target;
        selection = [target];
    }

    function addComponent(type) {
        var page = pageObj();
        if (!page) { toastMsg('Create or select a report first.'); return; }
        // Same rule the ExcelCompatible toggle enforces, caught at add time instead of at
        // the failed save.
        if (type === 'columns' && template && template.excelCompatible) {
            toastMsg('A Columns component is not available while Excel-compatible mode is on. Disable it in Report settings first.');
            return;
        }
        // With a column selected the Toolbox fills that column instead of the page - the
        // only way to put something inside a Columns band from the Toolbox.
        if (addComponentToSlot(type)) return;
        var comp = buildComponent(type);
        if ((page.layout || 'banded') === 'canvas' && type !== 'footer') {
            comp.x = 40; comp.y = 40; comp.w = 500;
        }
        insertComponent(page, comp, null);
        markDirty();
        renderAll();
    }

    // ---- drag & drop onto the page ----

    // Banded insertion index from the drop Y: before the first band whose midpoint is
    // below the cursor; otherwise at the end (before the footer, via insertComponent).
    function bandedInsertIndex(clientY) {
        var page = pageObj();
        var bands = [].slice.call(document.querySelectorAll('#rdPaper .rd-band'));
        for (var k = 0; k < bands.length; k++) {
            var index = parseInt(bands[k].dataset.index, 10);
            var comp = page.components[index];
            if (comp && comp.type === 'footer') continue;
            var rect = bands[k].getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) return index;
        }
        return null;
    }

    function showDropLine(clientY) {
        var paper = $id('rdPaper');
        var page = pageObj();
        if (!paper || !page) return;
        var line = $id('rdDropLine');
        if (!line) {
            line = document.createElement('div');
            line.id = 'rdDropLine';
            paper.appendChild(line);
        }
        var paperRect = paper.getBoundingClientRect();
        var index = bandedInsertIndex(clientY);
        var bands = [].slice.call(paper.querySelectorAll('.rd-band'));
        var y = 40;
        if (index !== null) {
            var band = bands.find(function (b) { return parseInt(b.dataset.index, 10) === index; });
            if (band) y = (band.getBoundingClientRect().top - paperRect.top) / zoom - 3;
        } else {
            var footerBand = bands.find(function (b) {
                var c = page.components[parseInt(b.dataset.index, 10)];
                return c && c.type === 'footer';
            });
            var anchor = footerBand || bands[bands.length - 1];
            if (anchor) {
                var rect = anchor.getBoundingClientRect();
                y = (((footerBand ? rect.top : rect.bottom) - paperRect.top) / zoom) - (footerBand ? 3 : 0);
            }
        }
        line.style.top = y + 'px';
    }

    function hideDropLine() {
        var line = $id('rdDropLine');
        if (line) line.remove();
    }

    function handleToolDrop(e) {
        var types = [].slice.call(e.dataTransfer.types);
        if (types.indexOf(COMP_MIME) >= 0) { handleBandReorderDrop(e); return; }
        if (types.indexOf(VAR_MIME) >= 0) { handleVariableDrop(e); return; }
        if (types.indexOf('Files') >= 0) { handleImageFileDrop(e); return; }

        var type = e.dataTransfer.getData(DRAG_MIME);
        hideDropLine();
        if (!type || !COMPONENT_DEFS[type]) return;
        e.preventDefault();
        var page = pageObj();
        if (!page) { toastMsg('Create or select a report first.'); return; }

        // Dropped inside a column of a Columns band: it goes into that column instead of
        // onto the page.
        if (dropIntoColumn(type, e)) return;

        var comp = buildComponent(type);
        if ((page.layout || 'banded') === 'canvas' && type !== 'footer') {
            placeOnCanvas(comp, e);
            insertComponent(page, comp, null);
        } else {
            insertComponent(page, comp, bandedInsertIndex(e.clientY));
        }
        markDirty();
        renderAll();
    }

    // The column under the cursor, as {index, slot, at}: `index` is the band on the page,
    // `at` the insertion point among the children (before the first child whose midpoint is
    // below the cursor). Null when the cursor is not over a column.
    function columnDropTarget(clientX, clientY) {
        var el = document.elementFromPoint(clientX, clientY);
        var col = el && el.closest ? el.closest('.rdp-col') : null;
        if (!col) return null;
        var band = col.closest('.rd-band');
        if (!band) return null;
        var index = parseInt(band.dataset.index, 10);
        var page = pageObj();
        var comp = page && page.components[index];
        if (!comp || comp.type !== 'columns') return null;

        var at = null;
        col.querySelectorAll('.rdp-col-child').forEach(function (kid) {
            if (at !== null) return;
            var rect = kid.getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) at = parseInt(kid.dataset.child, 10);
        });
        return { index: index, slot: parseInt(col.dataset.slot, 10), at: at };
    }

    function dropIntoColumn(type, e) {
        var target = columnDropTarget(e.clientX, e.clientY);
        if (!target) return false;
        if (!allowedInColumn(type)) {
            toastMsg(COMPONENT_DEFS[type].label + ' cannot be placed inside a column.');
            return true;
        }
        var page = pageObj();
        var slot = page.components[target.index].slots[target.slot];
        slot.components = slot.components || [];
        var at = target.at === null ? slot.components.length : target.at;
        slot.components.splice(at, 0, buildComponent(type));
        selection = [target.index];
        selected = target.index;
        activeSlot = target.slot;
        childSel = { slot: target.slot, index: at };
        markDirty();
        renderAll();
        return true;
    }

    // Drop of a component that is being dragged within a banded page.
    function handleBandReorderDrop(e) {
        hideDropLine();
        var page = pageObj();
        var from = parseInt(e.dataTransfer.getData(COMP_MIME), 10);
        if (!page || isNaN(from) || from < 0 || from >= page.components.length) return;
        e.preventDefault();
        moveComponentTo(from, bandedInsertIndex(e.clientY));
    }

    // Moves a banded component to an insertion index taken BEFORE the removal
    // (null = end of the flow). The footer keeps its place at the end.
    function moveComponentTo(from, to) {
        var page = pageObj();
        if (!page) return;
        var comp = page.components[from];
        if (!comp || comp.type === 'footer') return;
        var footerIndex = page.components.findIndex(function (c) { return c.type === 'footer'; });
        var last = footerIndex >= 0 ? footerIndex : page.components.length;
        var target = (to === null || to === undefined) ? last : Math.min(to, last);
        if (target === from || target === from + 1) return;  // dropped back where it was
        page.components.splice(from, 1);
        if (target > from) target--;
        page.components.splice(target, 0, comp);
        selection = [target];
        selected = target;
        markDirty();
        renderAll();
    }

    // Canvas drop position, snapped to a 10pt grid and clamped to the sheet.
    function placeOnCanvas(comp, e) {
        var paperRect = $id('rdPaper').getBoundingClientRect();
        comp.x = Math.max(0, Math.round(((e.clientX - paperRect.left) / zoom) / 10) * 10);
        comp.y = Math.max(0, Math.round(((e.clientY - paperRect.top) / zoom) / 10) * 10);
        comp.w = 500;
    }

    // Label for a dropped variable: the part after the last dot, so PLC1.Pump1_Speed
    // reads as Pump1_Speed. Names are free-form, so a dot-less name is used as is.
    function variableLabel(name) {
        var dot = name.lastIndexOf('.');
        return dot >= 0 && dot < name.length - 1 ? name.slice(dot + 1) : name;
    }

    // The component under the cursor, when it is one a variable can join (a KPI row or a
    // trend chart). Anything else means the drop creates its own component.
    function variableTargetAt(e) {
        var page = pageObj();
        var band = page && e.target && e.target.closest ? e.target.closest('#rdPaper .rd-band') : null;
        if (!band) return null;
        var index = parseInt(band.dataset.index, 10);
        var comp = page.components[index];
        if (!comp || (comp.type !== 'kpiRow' && comp.type !== 'chart')) return null;
        return { comp: comp, index: index };
    }

    // ---- image upload (button and drop) ----
    // The file is stored in the project folder (wwwroot/Project) by the page handler, which
    // answers with the wwwroot-relative path an Image component takes. Resolves to null when
    // the upload was refused; the reason is toasted here so every caller behaves the same.
    function uploadImageFile(file) {
        if (!file) return Promise.resolve(null);
        var form = new FormData();
        form.append('file', file);
        toastMsg('Uploading ' + file.name + '...');
        // No Content-Type header on purpose: the browser sets the multipart boundary.
        return fetch('?handler=UploadImage', {
            method: 'POST',
            headers: { 'RequestVerificationToken': window.RequestVerificationToken },
            body: form
        }).then(function (r) {
            // Same dead-session detection as api(): a login redirect answers with HTML,
            // and r.json() on it produced a raw parse error instead of the real reason.
            var contentType = (r.headers.get('content-type') || '');
            if (r.redirected || contentType.indexOf('text/html') >= 0) {
                throw new Error('The session has expired - reload the page and log in again.');
            }
            return r.json();
        }).then(function (res) {
            if (!res || res.error) { toastMsg(res && res.error ? res.error : 'Upload failed.'); return null; }
            toastMsg('Stored as ' + res.path + '.');
            return res.path;
        }).catch(function (e) { toastMsg('Upload failed: ' + e); return null; });
    }

    function imageFileFrom(dataTransfer) {
        var files = dataTransfer && dataTransfer.files ? [].slice.call(dataTransfer.files) : [];
        return files.filter(function (f) { return /\.(png|jpe?g)$/i.test(f.name || ''); })[0] || null;
    }

    // An image file dropped on an existing Image component replaces its file; anywhere else on
    // the page it becomes a new Image component. The drop position is read before the upload,
    // because the cursor has moved by the time the file has been stored.
    function handleImageFileDrop(e) {
        hideDropLine();
        var file = imageFileFrom(e.dataTransfer);
        if (!file) return;
        e.preventDefault();
        var page = pageObj();
        if (!page) { toastMsg('Create or select a report first.'); return; }

        var band = e.target && e.target.closest ? e.target.closest('#rdPaper .rd-band') : null;
        var existing = band ? page.components[parseInt(band.dataset.index, 10)] : null;
        var target = existing && existing.type === 'image' ? existing : null;
        var at = { clientX: e.clientX, clientY: e.clientY };
        var insertIndex = target ? null : bandedInsertIndex(e.clientY);

        uploadImageFile(file).then(function (path) {
            if (!path) return;
            if (target) {
                target.path = path;
            } else {
                var comp = buildComponent('image');
                comp.path = path;
                if ((page.layout || 'banded') === 'canvas') {
                    placeOnCanvas(comp, at);
                    insertComponent(page, comp, null);
                } else {
                    insertComponent(page, comp, insertIndex);
                }
                selection = [selected];
            }
            markDirty();
            renderAll();
        });
    }

    // A variable dropped on an existing KPI row or trend chart is added to it; anywhere
    // else on the page it becomes a new KPI row bound to that variable.
    function handleVariableDrop(e) {
        var name = e.dataTransfer.getData(VAR_MIME);
        hideDropLine();
        if (!name) return;
        e.preventDefault();
        var page = pageObj();
        if (!page) { toastMsg('Create or select a report first.'); return; }

        var target = variableTargetAt(e);

        if (target && target.comp.type === 'kpiRow') {
            target.comp.tiles = target.comp.tiles || [];
            target.comp.tiles.push({ label: variableLabel(name), binding: 'var:' + name, units: '', format: '', compare: false });
            selected = target.index;
            markDirty();
            renderAll();
            toastMsg('Added ' + name + ' to the KPI row.');
            return;
        }

        if (target && target.comp.type === 'chart') {
            target.comp.series = target.comp.series || [];
            target.comp.series.push({ variable: name, label: variableLabel(name), color: '' });
            selected = target.index;
            markDirty();
            renderAll();
            toastMsg('Added ' + name + ' to the chart.');
            return;
        }

        // Dropped on open page space: ask what to create. The drop position is captured
        // now, because the menu is answered later and the cursor has moved by then.
        var at = { clientX: e.clientX, clientY: e.clientY };
        var index = bandedInsertIndex(e.clientY);
        showDropChoice(e.clientX, e.clientY, name, function (kind) {
            createVariableComponent(kind, name, at, index);
        });
    }

    function createVariableComponent(kind, name, at, index) {
        var page = pageObj();
        if (!page) return;
        var comp;
        if (kind === 'text') {
            comp = buildComponent('text');
            // {Name} resolves to the variable's value at render time.
            comp.text = variableLabel(name) + ': {' + name + '}';
        } else {
            comp = buildComponent('kpiRow');
            comp.tiles = [{ label: variableLabel(name), binding: 'var:' + name, units: '', format: '', compare: false }];
        }
        if ((page.layout || 'banded') === 'canvas') {
            placeOnCanvas(comp, at);
            insertComponent(page, comp, null);
        } else {
            insertComponent(page, comp, index);
        }
        markDirty();
        renderAll();
        toastMsg('Added ' + (kind === 'text' ? 'a text for ' : 'a KPI for ') + name + '.');
    }

    function closeDropChoice() {
        var menu = $id('rdDropMenu');
        if (menu) menu.remove();
    }

    // Small popup at the drop position: the same variable can be wanted as a KPI tile or
    // as a line of text, and only the user knows which. Dismissing it cancels the drop.
    function showDropChoice(x, y, name, pick) {
        closeDropChoice();
        var menu = document.createElement('div');
        menu.id = 'rdDropMenu';
        menu.className = 'rd-dropmenu';
        menu.innerHTML = '<div class="hdr">' + esc(name) + '</div>';

        [['kpiRow', 'KPI tile'], ['text', 'Text']].forEach(function (choice) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML = (TOOL_ICONS[choice[0]] || '') + '<span>' + choice[1] + '</span>';
            btn.onclick = function () {
                dismiss();
                pick(choice[0] === 'text' ? 'text' : 'kpi');
            };
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);

        // Keep the popup on screen when the drop lands near an edge.
        var rect = menu.getBoundingClientRect();
        menu.style.left = Math.max(4, Math.min(x, window.innerWidth - rect.width - 4)) + 'px';
        menu.style.top = Math.max(4, Math.min(y, window.innerHeight - rect.height - 4)) + 'px';

        setTimeout(function () {
            document.addEventListener('mousedown', onOutside, true);
            document.addEventListener('keydown', onEscape, true);
        }, 0);

        function onOutside(ev) {
            if (menu.contains(ev.target)) return;
            dismiss();
        }
        function onEscape(ev) {
            if (ev.key !== 'Escape') return;
            ev.stopPropagation();
            dismiss();
        }
        function dismiss() {
            document.removeEventListener('mousedown', onOutside, true);
            document.removeEventListener('keydown', onEscape, true);
            closeDropChoice();
        }
    }

    // ---- report settings panel ----
    function renderReportSettings() {
        var host = $id('rdReportSettings');
        closeVariablePicker();
        if (!current || !template) { host.innerHTML = '<div class="rd-hint">Open a report from the Reports page, or use + New.</div>'; return; }
        var period = template.period = template.period || { source: 'preset', preset: 'yesterday', startVariable: '', endVariable: '' };

        var html = '';
        html += '<div class="rd-frow"><label>Name</label><input class="rd-fin" id="rdSetName" value="' + esc(current.name) + '"></div>';
        html += '<div class="rd-frow"><label>Description</label><input class="rd-fin" id="rdSetDesc" value="' + esc(current.description || '') + '"></div>';
        html += '<label class="rd-check"><input type="checkbox" id="rdSetEnable"' + (current.enable !== false ? ' checked' : '') + '> Enable (Execute Report action and RunReport; manual Execute always runs)</label>';
        html += '<div class="rd-frow"><label>Title</label><input class="rd-fin" id="rdSetTitle" value="' + esc(template.title || '') + '"></div>';
        html += '<div class="rd-frow"><label>Page</label><select class="rd-fsel" id="rdSetSize">'
            + ['A4', 'Letter'].map(function (s) { return '<option' + ((template.pageSize || 'A4') === s ? ' selected' : '') + '>' + s + '</option>'; }).join('')
            + '</select><select class="rd-fsel" id="rdSetOrient">'
            + ['portrait', 'landscape'].map(function (s) { return '<option' + ((template.orientation || 'portrait') === s ? ' selected' : '') + '>' + s + '</option>'; }).join('')
            + '</select></div>';
        html += '<div class="rd-frow"><label>Accent</label><input class="rd-fin" id="rdSetAccent" value="' + esc(template.accentColor || '#2596BE') + '"></div>';
        html += '<label class="rd-check"><input type="checkbox" id="rdSetExcel"' + (template.excelCompatible ? ' checked' : '') + '> Excel compatible (banded pages only, also writes .xlsx)</label>';
        // The destination folder AND the file name are report fields (Reports.OutputPath and
        // Reports.FileNamePattern), not part of the template. They used to be echoed here as a
        // read-only "Output to" row, which showed the folder only - half the answer once the file
        // name became configurable. The Reports page owns both and previews the resolved result;
        // after an Execute the Preview view lists the files this run actually produced.
        html += '<div class="rd-hint">Where the rendered files are written, and how they are named, is set per report on the Reports page (Settings). The Preview view lists the files produced by the last Execute.</div>';

        html += '<div class="rd-sect">Period</div>';
        html += '<div class="rd-frow"><label>Source</label><select class="rd-fsel" id="rdSetPeriodSource">'
            + ['preset', 'variables'].map(function (s) { return '<option' + ((period.source || 'preset') === s ? ' selected' : '') + '>' + s + '</option>'; }).join('')
            + '</select></div>';
        if ((period.source || 'preset') === 'preset') {
            html += '<div class="rd-frow"><label>Preset</label><select class="rd-fsel" id="rdSetPreset">'
                + PRESETS.map(function (p) { return '<option' + ((period.preset || 'yesterday') === p ? ' selected' : '') + '>' + p + '</option>'; }).join('')
                + '</select></div>';
        } else {
            html += '<div class="rd-frow"><label>Start var</label><input class="rd-fin" id="rdSetStartVar" value="' + esc(period.startVariable || '') + '">'
                + pickButton({ id: 'rdSetStartVarPick', title: 'Pick a variable' }) + '</div>';
            html += '<div class="rd-frow"><label>End var</label><input class="rd-fin" id="rdSetEndVar" value="' + esc(period.endVariable || '') + '">'
                + pickButton({ id: 'rdSetEndVarPick', title: 'Pick a variable' }) + '</div>';
            html += '<div class="rd-hint">Two variables holding the window as text, for example 2026-07-30 06:00:00. The report reads them at render time, so an operator can pick the period on a page.</div>';
        }

        html += '<div class="rd-sect">Parameters</div>';
        html += '<div id="rdSetParams" style="display:flex;flex-direction:column;gap:5px;"></div>';
        html += '<button class="rd-minibtn" id="rdAddParam">+ parameter</button>';
        html += '<div class="rd-hint">Per-run values with a default. Use them as {Param.name} placeholders in texts and titles, and inside SQLite queries (bound as SQL parameters). RunReport("' + esc(current.name) + '", params={...}) and MCP override them per run; hooks read ctx.params.</div>';

        html += '<div class="rd-sect">Expressions</div>';
        html += '<div class="rd-hint">Write {= expression } in any text, KPI binding, computed column or summary aggregate to calculate a value in the template itself.<br>'
            + 'Available: Report.Name/.Title/.Day/.PeriodStart/.PeriodEnd/.Start/.End/.Hours/.Days, Param.name, Expr.key (hook values), '
            + 'Var("Name") live text, Num("Name") live number, Hist("Name","sum|avg|min|max|count|delta") period aggregate, Val(x) number-or-default, and math.<br>'
            + 'Row[\'Column\'] is available in a computed column; Values (numeric cells) and Raw (all cells) in a summary aggregate.<br>'
            + 'Example: {= Hist("PLC1.Flow","sum") / Report.Hours }</div>';

        html += '<div class="rd-sect">Python hook</div>';
        html += '<div class="rd-frow"><label>Module</label><select class="rd-fsel" id="rdSetHook"><option value="">(none)</option>'
            + sources.modules.map(function (m) { return '<option' + ((template.hookScript || '') === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('')
            + '</select></div>';
        html += '<div class="rd-hint">For logic an expression cannot express. A Module script with prepare_report(ctx) provides {Expr.*} values, computed table columns and py: aggregates. Enable/scheduling of this report is on the Python Scripts page.</div>';

        host.innerHTML = html;

        $id('rdSetName').onchange = function () {
            // Same rule as the server (RegexHelper.ReportNameRegex): letters, digits,
            // spaces, underscore, dash, dot and parentheses, no leading/trailing space.
            var value = this.value;
            if (!/^[a-zA-Z0-9_ \-\.\(\)]+$/.test(value) || value !== value.trim()) {
                toastMsg('Report names may contain letters, digits, spaces, underscores, dashes, dots and parentheses (no leading or trailing space).');
                this.value = current.name;
                return;
            }
            current.name = value;
            $id('rdCurrentName').textContent = current.name;
            markDirty();
        };
        $id('rdSetDesc').onchange = function () { current.description = this.value; markDirty(); };
        $id('rdSetEnable').onchange = function () { current.enable = this.checked; markDirty(); };
        renderParamsEditor();
        $id('rdSetTitle').onchange = function () { template.title = this.value; markDirty(); renderPaper(); };
        $id('rdSetSize').onchange = function () { template.pageSize = this.value; markDirty(); };
        $id('rdSetOrient').onchange = function () { template.orientation = this.value; markDirty(); renderPaper(); };

        // Accent: hex text field + colorPick swatch pair, like the Parameters page.
        var accentInput = $id('rdSetAccent');
        var accentSwatch = makeColorSwatch(template.accentColor || '#2596BE', function (hex) {
            accentInput.value = hex;
            template.accentColor = hex;
            markDirty();
            renderPaper();
        });
        accentInput.parentElement.appendChild(accentSwatch);
        accentInput.onchange = function () {
            template.accentColor = this.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
                accentSwatch.style.background = this.value;
                accentSwatch.title = this.value;
            }
            markDirty();
            renderPaper();
        };
        $id('rdSetExcel').onchange = function () {
            if (this.checked && template.pages.some(function (p) { return (p.layout || 'banded') === 'canvas'; })) {
                toastMsg('This template has free-canvas pages. Switch them to banded first.');
                this.checked = false;
                return;
            }
            // Columns bands are refused in Excel mode too (a sheet has no page width to
            // divide); catching it here instead of at the failed save.
            if (this.checked && template.pages.some(function (p) {
                return (p.components || []).some(function (c) { return c.type === 'columns'; });
            })) {
                toastMsg('This template has Columns components, which Excel-compatible mode does not support. Remove them first.');
                this.checked = false;
                return;
            }
            template.excelCompatible = this.checked;
            markDirty();
        };
        $id('rdSetPeriodSource').onchange = function () { period.source = this.value; markDirty(); renderReportSettings(); };
        var preset = $id('rdSetPreset');
        if (preset) preset.onchange = function () { period.preset = this.value; markDirty(); };
        var startVar = $id('rdSetStartVar');
        if (startVar) startVar.onchange = function () { period.startVariable = this.value; markDirty(); };
        var endVar = $id('rdSetEndVar');
        if (endVar) endVar.onchange = function () { period.endVariable = this.value; markDirty(); };
        bindPickById('rdSetStartVarPick', 'rdSetStartVar', {
            label: 'Period start variable', mode: 'name', setValue: function (v) { period.startVariable = v; }
        });
        bindPickById('rdSetEndVarPick', 'rdSetEndVar', {
            label: 'Period end variable', mode: 'name', setValue: function (v) { period.endVariable = v; }
        });
        $id('rdSetHook').onchange = function () { template.hookScript = this.value; markDirty(); };
    }

    // Template parameter defaults editor (Report Settings). template.parameters is an
    // object of name -> default value.
    function renderParamsEditor() {
        var host = $id('rdSetParams');
        if (!host) return;
        host.innerHTML = '';
        var params = template.parameters = template.parameters || {};
        Object.keys(params).forEach(function (key) {
            var row = document.createElement('div');
            row.className = 'rd-listrow';
            row.innerHTML = '<input class="rd-fin" style="max-width:110px;" placeholder="name" value="' + esc(key) + '">'
                + '<input class="rd-fin" placeholder="default value" value="' + esc(params[key]) + '">'
                + '<button class="rd-minibtn warn">&#10005;</button>';
            var inputs = row.querySelectorAll('input');
            inputs[0].onchange = function () {
                var newKey = this.value.trim();
                if (!newKey || (newKey !== key && Object.prototype.hasOwnProperty.call(params, newKey))) {
                    toastMsg('Parameter names must be unique and not empty.');
                    this.value = key;
                    return;
                }
                if (newKey !== key) {
                    params[newKey] = params[key];
                    delete params[key];
                    markDirty();
                    renderParamsEditor();
                }
            };
            inputs[1].onchange = function () { params[key] = this.value; markDirty(); };
            row.querySelector('button').onclick = function () { delete params[key]; markDirty(); renderParamsEditor(); };
            host.appendChild(row);
        });
        $id('rdAddParam').onclick = function () {
            var base = 'Param';
            var n = 1;
            while (Object.prototype.hasOwnProperty.call(params, base + n)) n++;
            params[base + n] = '';
            markDirty();
            renderParamsEditor();
        };
    }

    // ---- properties panel ----
    // Component types that can carry a period override (everything that reads the period or
    // prints it). Mirrors what envision_report.component_context can usefully shift.
    var PERIOD_TYPES = ['header', 'text', 'value', 'kpiRow', 'chart', 'table', 'alarmList', 'eventList'];

    function fieldRow(label, id, value, placeholder) {
        return '<div class="rd-frow"><label>' + esc(label) + '</label><input class="rd-fin" id="' + id + '" value="' + esc(value) + '"' +
            (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + '></div>';
    }

    // A field that accepts placeholders and expressions: monospace, plus an expand button that
    // opens it in the field editor. No variable picker here on purpose - the editor dialog the
    // expand button opens already searches the variables and inserts them in the right form, so
    // a second control beside the field would only duplicate it.
    function textFieldRow(label, id, value, placeholder) {
        return '<div class="rd-frow"><label>' + esc(label) + '</label><input class="rd-fin rd-code" id="' + id + '" value="' + esc(value) + '"'
            + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + '>' + expandButton(id + 'Expand') + '</div>';
    }

    function textAreaRow(label, id, value, placeholder) {
        return '<div class="rd-frow" style="align-items:flex-start;"><label>' + esc(label) + '</label>'
            + '<textarea class="rd-farea rd-code" id="' + id + '"'
            + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + '>' + esc(value) + '</textarea>'
            + expandButton(id + 'Expand') + '</div>';
    }

    function selectRow(label, id, value, options) {
        return '<div class="rd-frow"><label>' + esc(label) + '</label><select class="rd-fsel" id="' + id + '">'
            + options.map(function (o) {
                var val = Array.isArray(o) ? o[0] : o;
                var lbl = Array.isArray(o) ? o[1] : (o === '' ? '(none)' : o);
                return '<option value="' + esc(val) + '"' + (String(value) === String(val) ? ' selected' : '') + '>' + esc(lbl) + '</option>';
            }).join('') + '</select></div>';
    }

    function bindField(id, fn, rerender) {
        var el = $id(id);
        if (!el) return;
        el.onchange = function () {
            fn(el.type === 'checkbox' ? el.checked : el.value);
            markDirty();
            if (rerender !== false) renderPaper();
        };
    }

    function renderProps() {
        var host = $id('rdProps');
        var comp = selectedComp();

        // A picker anchored to a field that is about to be replaced would be left hanging.
        closeVariablePicker();

        // Two or more selected: the panel switches to alignment and group actions, since
        // per-field editing of several components at once has no single answer.
        if (selection.length > 1) {
            $id('rdSelName').textContent = selection.length + ' selected';
            renderMultiSelectProps(host, selection.length);
            return;
        }

        $id('rdSelName').textContent = comp ? componentTag(comp) : '';
        if (!comp) {
            host.innerHTML = '<div class="rd-hint">Select a component on the page to edit its properties, or add one from the Toolbox. Ctrl or Shift click, or drag a box on a free-canvas page, to select several.</div>';
            return;
        }

        var page = pageObj();
        // A child of a Columns band is edited by the same panel: from here on `comp` IS the
        // child, so every field and binding below applies to it unchanged. Only the sections
        // that belong to the band itself (position on a canvas page, the column editor) and
        // the component buttons have to know the difference.
        var band = null;
        var child = activeChild();
        if (child) {
            band = comp;
            comp = child;
            $id('rdSelName').textContent = 'Columns / ' + componentTag(comp);
        }

        var canvas = !child && (page.layout || 'banded') === 'canvas' && comp.type !== 'footer';
        var html = '';
        if (child) {
            html += '<div class="rd-listrow"><button class="rd-minibtn" id="rdPBackToColumns">&#8592; Columns</button>'
                + '<span class="rd-hint" style="margin:0;">column ' + (childSel.slot + 1) + '</span></div>';
        }
        html += '<div class="rd-sect">General</div>';
        var t = comp.type;

        if (t === 'header' || t === 'footer') {
            html += textFieldRow(t === 'header' ? 'Title' : 'Left text', 'rdPText', comp.text || '');
            html += textFieldRow(t === 'header' ? 'Subtitle' : 'Right text', 'rdPSub', comp.subText || '');
        } else if (t === 'text' || t === 'value') {
            html += textAreaRow('Text', 'rdPText', comp.text || '');
            html += selectRow('Style', 'rdPStyle', comp.style || 'body', ['h1', 'h2', 'body', 'callout']);
            html += '<div class="rd-hint">Placeholders: {Report.Day}, {Param.name}, {Expr.key}, a variable name, or a calculation such as {= Num("PLC1.Level") * 2 }. See Report settings for the full expression list.</div>';
        } else if (t === 'spacer') {
            html += fieldRow('Height (px)', 'rdPSpacer', comp.spacerHeight || 10);
        } else if (t === 'chart') {
            html += textFieldRow('Title', 'rdPText', comp.text || '');
            html += selectRow('Type', 'rdPChartType', comp.chartType || 'line', ['line', 'bar', 'area']);
            html += selectRow('Resample', 'rdPResample', comp.resample || '1h', [['raw', 'Raw samples'], ['15m', '15 min average'], ['1h', '1 h average'], ['1d', '1 day average']]);
            html += fieldRow('Height (mm)', 'rdPHeight', comp.height || 55);
            html += '<div class="rd-hint">Height of the printed chart in millimetres (minimum 30). Width follows the component.</div>';
            html += '<div class="rd-sect">Series</div><div id="rdPSeries"></div>';
            html += '<button class="rd-minibtn" id="rdPAddSeries">+ series</button>';
        } else if (t === 'kpiRow') {
            html += '<div class="rd-sect">Tiles</div><div id="rdPTiles"></div>';
            html += '<button class="rd-minibtn" id="rdPAddTile">+ tile</button>';
            html += '<div class="rd-hint">Bindings: var:VariableName (live), hist:sum|avg|min|max|count|delta:VariableName (period aggregate), expr:key (hook value), or one {= expression } such as {= Hist("PLC1.Flow","sum") / 1000 }. Format and Units apply to a calculated value too, and Compare re-evaluates it over the previous period.</div>';
        } else if (t === 'table') {
            html += textFieldRow('Title', 'rdPText', comp.text || '');
            html += selectRow('Source', 'rdPSource', comp.source || 'sqlite', [['sqlite', 'Project SQLite'], ['historian', 'Historian'], ['alarms', 'Alarms'], ['events', 'Events']]);
            if ((comp.source || 'sqlite') === 'sqlite') {
                html += selectRow('Database', 'rdPDatabase', comp.database || '', [''].concat(sources.databases.map(function (d) { return d.name; })));
                html += textAreaRow('Query', 'rdPQuery', comp.query || '');
                html += '<div class="rd-hint">Single SELECT (WITH ... SELECT also works); {Report.Day}, {Report.PeriodStart}, {Report.PeriodEnd} and {Param.name} are bound as parameters.</div>';
            }
            if ((comp.source || 'sqlite') === 'historian') {
                html += '<div class="rd-frow" style="align-items:flex-start;"><label>Variables</label><textarea class="rd-farea" id="rdPVariables" placeholder="One variable name per line">' + esc((comp.variables || []).join('\n')) + '</textarea>'
                    + pickButton({ id: 'rdPVariablesPick', title: 'Add a variable to the list' }) + '</div>';
                html += '<div class="rd-hint">Raw samples of these variables in the report period, columns TimeStamp, Variable, Value. Use the full variable name.</div>';
            }
            if ((comp.source || 'sqlite') === 'alarms') {
                html += fieldRow('Min severity', 'rdPMinSeverity', comp.minSeverity || 0);
            }
            html += fieldRow('Group by', 'rdPGroupBy', comp.groupBy || '');
            html += '<div class="rd-hint">Group by matches a column Name or Header; grouped rows get heading rows.</div>';
            html += fieldRow('Max rows', 'rdPMaxRows', comp.maxRows || 200);
            html += '<div class="rd-sect">Columns &middot; summary row</div><div id="rdPColumns"></div>';
            html += '<button class="rd-minibtn" id="rdPAddColumn">+ column</button>';
            html += '<div class="rd-hint">No columns = all query columns, no summary. Aggregate py:functionName calls the hook script. f = computed column (Fn receives the row).</div>';
        } else if (t === 'image') {
            html += fieldRow('Path', 'rdPImagePath', comp.path || '', 'Project/logo.png (relative to wwwroot)');
            html += '<div class="rd-listrow"><button class="rd-minibtn" id="rdPImageUpload">Upload image</button>'
                + '<input type="file" id="rdPImageFile" accept=".png,.jpg,.jpeg" style="display:none;"></div>';
            html += '<div class="rd-hint">A .png, .jpg or .jpeg file under wwwroot, for example Project/logo.png or images/Project/LoginBackground.jpg. Upload image stores the file in the project folder and fills in the path; dropping an image file on the page does the same and creates the component.</div>';
            html += fieldRow('Width (%)', 'rdPImageWidth', comp.imageWidth || '', canvas ? '100 (full component)' : '33 (default)');
            html += selectRow('Align', 'rdPImageAlign', comp.align || 'left', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']]);
            html += '<div class="rd-hint">Width is a percentage of the space the component has - the printable page width on a banded page, the component box on a free-canvas page - and the height follows the picture. Empty prints a third of the page width on a banded page and fills the box on a free-canvas page. Align places the picture inside that space.</div>';
        } else if (t === 'columns') {
            html += '<div class="rd-hint">Components placed side by side. Click a column on the page and add from the Toolbox, or drop a component straight into it. A columns band prints as one block on one page.</div>';
            html += '<div class="rd-sect">Columns</div><div id="rdPSlots"></div>';
            html += '<button class="rd-minibtn" id="rdPAddSlot">+ column</button>';
            html += '<div class="rd-hint">Width is a percentage of the band; the columns left empty share what is left over, so two empty columns are two equal halves.</div>';
        } else if (t === 'alarmList') {
            html += textFieldRow('Title', 'rdPText', comp.text || '');
            html += fieldRow('Min severity', 'rdPMinSeverity', comp.minSeverity || 0);
            html += fieldRow('Max rows', 'rdPMaxRows', comp.maxRows || 50);
            html += '<div class="rd-sect">Columns</div><div id="rdPColumns"></div>';
            html += '<button class="rd-minibtn" id="rdPAddColumn">+ column</button>';
            html += '<div class="rd-hint">No columns = OnTime, OffTime, Asset, Message, Severity, AckTime, AckUser. Add columns to pick/rename a subset.</div>';
        } else if (t === 'eventList') {
            html += textFieldRow('Title', 'rdPText', comp.text || '');
            html += fieldRow('Max rows', 'rdPMaxRows', comp.maxRows || 50);
            html += '<div class="rd-sect">Columns</div><div id="rdPColumns"></div>';
            html += '<button class="rd-minibtn" id="rdPAddColumn">+ column</button>';
            html += '<div class="rd-hint">No columns = OnTime, Asset, Message, AckTime, AckUser. Add columns to pick/rename a subset.</div>';
        }

        // Optional per-component period. Offered on the components that read the period or
        // print it; a spacer, an image and the page footer have nothing to shift.
        if (PERIOD_TYPES.indexOf(t) >= 0) {
            html += '<div class="rd-sect">Period</div>';
            html += fieldRow('Start', 'rdPPeriodStart', comp.periodStart || '', 'report period');
            html += fieldRow('End', 'rdPPeriodEnd', comp.periodEnd || '', 'report period');
            html += '<div class="rd-hint">Empty means the report period. An offset shifts that boundary: -7d, +12h, -90m, +2w (units m, h, d, w). A timestamp such as 2026-07-01 06:00 is absolute, and {Param.name} or one {= Report.End - timedelta(days=1) } resolves per run. The override applies to this component only - its data, the Hist() aggregates in its expressions and the {Report.PeriodStart} / {Report.PeriodEnd} it prints. The report keeps its own period for the file name, the footer and every other component.</div>';
        }

        if (canvas) {
            html += '<div class="rd-sect">Position</div>';
            html += '<div class="rd-frow"><label>X / Y</label><input class="rd-fin" id="rdPosX" value="' + (comp.x || 0) + '"> <input class="rd-fin" id="rdPosY" value="' + (comp.y || 0) + '"></div>';
            html += fieldRow('Width (px)', 'rdPosW', comp.w || 320);
        }

        html += '<div class="rd-sect">Component</div>';
        html += '<div class="rd-listrow">';
        if (!canvas) {
            html += '<button class="rd-minibtn" id="rdPMoveUp" title="Move up">&#8593;</button>';
            html += '<button class="rd-minibtn" id="rdPMoveDown" title="Move down">&#8595;</button>';
        }
        if (t !== 'footer') {
            html += '<button class="rd-minibtn" id="rdPDuplicate" title="Duplicate (Ctrl+D)">Duplicate</button>';
            html += '<button class="rd-minibtn" id="rdPCopy" title="'
                + (child ? 'Copy - paste with Ctrl+V to put it on the page' : 'Copy (Ctrl+C) - paste with Ctrl+V on any page or report')
                + '">Copy</button>';
        }
        html += '<button class="rd-minibtn warn" id="rdPDelete">Delete component</button></div>';

        host.innerHTML = html;

        bindField('rdPText', function (v) { comp.text = v; });
        bindField('rdPSub', function (v) { comp.subText = v; });

        // Expand buttons on the fields that accept placeholders and expressions. The query is
        // included because it is long, even though an expression is refused there.
        bindExpand('rdPTextExpand', 'rdPText', t === 'text' || t === 'value' ? 'Text' : 'Title',
            'text', function (v) { comp.text = v; });
        bindExpand('rdPSubExpand', 'rdPSub', t === 'header' ? 'Subtitle' : 'Right text',
            'text', function (v) { comp.subText = v; });
        bindExpand('rdPQueryExpand', 'rdPQuery', 'Query', 'text', function (v) { comp.query = v; });

        // The historian variable list is a plain list of names, with no field editor of its own,
        // so it carries a picker; the fields that open the editor rely on the editor's own
        // variable search instead.
        bindPickById('rdPVariablesPick', 'rdPVariables', {
            label: 'Add a historian variable', mode: 'line',
            setValue: function (v) {
                comp.variables = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
            }
        });

        bindField('rdPPeriodStart', function (v) { comp.periodStart = v.trim(); });
        bindField('rdPPeriodEnd', function (v) { comp.periodEnd = v.trim(); });
        bindField('rdPStyle', function (v) { comp.style = v; });
        bindField('rdPSpacer', function (v) { comp.spacerHeight = parseFloat(v) || 10; });
        bindField('rdPChartType', function (v) { comp.chartType = v; });
        bindField('rdPResample', function (v) { comp.resample = v; });
        bindField('rdPHeight', function (v) { comp.height = Math.max(30, parseFloat(v) || 55); });
        bindField('rdPSource', function (v) { comp.source = v; renderProps(); });
        bindField('rdPDatabase', function (v) { comp.database = v; });
        bindField('rdPQuery', function (v) { comp.query = v; });
        bindField('rdPVariables', function (v) { comp.variables = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); });
        bindField('rdPImagePath', function (v) { comp.path = v.trim(); });
        // 0 is the "renderer default" sentinel the template carries, so an empty or nonsense
        // entry falls back to it rather than printing a zero-width picture.
        bindField('rdPImageWidth', function (v) {
            var pct = parseFloat(v);
            comp.imageWidth = !isFinite(pct) || pct <= 0 ? 0 : Math.min(100, pct);
        });
        bindField('rdPImageAlign', function (v) { comp.align = v; });

        // Upload straight into the selected Image component: the file goes to the project
        // folder and its path is filled in, so the operator never types a path by hand.
        var imageUpload = $id('rdPImageUpload');
        var imageFile = $id('rdPImageFile');
        if (imageUpload && imageFile) {
            imageUpload.onclick = function () { imageFile.click(); };
            imageFile.onchange = function () {
                var picked = this.files && this.files[0];
                this.value = '';
                if (!picked) return;
                uploadImageFile(picked).then(function (path) {
                    if (!path) return;
                    comp.path = path;
                    markDirty();
                    renderAll();
                });
            };
        }
        bindField('rdPGroupBy', function (v) { comp.groupBy = v; });
        bindField('rdPMaxRows', function (v) { comp.maxRows = parseInt(v, 10) || 200; });
        bindField('rdPMinSeverity', function (v) { comp.minSeverity = parseInt(v, 10) || 0; });
        bindField('rdPosX', function (v) { comp.x = parseFloat(v) || 0; });
        bindField('rdPosY', function (v) { comp.y = parseFloat(v) || 0; });
        bindField('rdPosW', function (v) { comp.w = parseFloat(v) || 320; });

        if (t === 'chart') renderSeriesEditor(comp);
        if (t === 'kpiRow') renderTilesEditor(comp);
        if (t === 'table' || t === 'alarmList' || t === 'eventList') renderColumnsEditor(comp);
        if (t === 'columns') renderSlotsEditor(comp);

        var back = $id('rdPBackToColumns');
        if (back) back.onclick = function () { selectSlot(selected, childSel ? childSel.slot : 0); };

        // Inside a column the same four buttons act on the child within its column; on the
        // page they act on the page selection.
        var del = $id('rdPDelete');
        del.onclick = child ? deleteChild : deleteSelectedComponent;
        var dup = $id('rdPDuplicate');
        if (dup) dup.onclick = child ? duplicateChild : duplicateSelectedComponent;
        var copyBtn = $id('rdPCopy');
        if (copyBtn) copyBtn.onclick = child ? function () { putClipboard([comp]); } : copySelectedComponents;
        var up = $id('rdPMoveUp');
        if (up) up.onclick = child ? function () { moveChild(-1); } : function () { moveComponent(-1); };
        var down = $id('rdPMoveDown');
        if (down) down.onclick = child ? function () { moveChild(1); } : function () { moveComponent(1); };
    }

    // The columns of the selected band: width, the components inside, and the buttons that
    // reorder or remove them. Clicking a row selects that child, which is the same state a
    // click on the page produces.
    function renderSlotsEditor(comp) {
        var host = $id('rdPSlots');
        host.innerHTML = '';
        var slots = comp.slots = comp.slots || [];
        slots.forEach(function (slot, si) {
            slot.components = slot.components || [];
            var wrap = document.createElement('div');
            wrap.className = 'rd-slotbox' + (si === activeSlot ? ' active' : '');
            var head = '<div class="rd-listrow"><label style="flex:1;">Column ' + (si + 1) + '</label>'
                + '<input class="rd-fin" style="max-width:70px;" placeholder="auto %" value="' + esc(slot.width || '') + '">'
                + '<button class="rd-minibtn warn rd-slotdel" title="Remove this column">&#10005;</button></div>';
            var list = '';
            slot.components.forEach(function (kid, ci) {
                var selectedRow = childSel && childSel.slot === si && childSel.index === ci;
                list += '<div class="rd-listrow rd-slotchild' + (selectedRow ? ' on' : '') + '" data-child="' + ci + '">'
                    + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
                    + esc(componentTag(kid)) + (kid.text ? ' - ' + esc(kid.text) : '') + '</span>'
                    + '<button class="rd-minibtn" data-act="up" title="Move up">&#8593;</button>'
                    + '<button class="rd-minibtn" data-act="down" title="Move down">&#8595;</button>'
                    + '<button class="rd-minibtn warn" data-act="del" title="Remove">&#10005;</button></div>';
            });
            if (!slot.components.length) {
                list += '<div class="rd-hint" style="margin:2px 0 0;">Empty - select this column and add from the Toolbox.</div>';
            }
            wrap.innerHTML = head + list;

            var widthInput = wrap.querySelector('input');
            widthInput.onclick = function (e) { e.stopPropagation(); };
            widthInput.onchange = function () {
                var pct = parseFloat(this.value);
                slot.width = !isFinite(pct) || pct <= 0 ? 0 : Math.min(100, pct);
                markDirty();
                renderAll();
            };
            wrap.querySelector('.rd-slotdel').onclick = function (e) {
                e.stopPropagation();
                // Validation requires at least one column; deleting the last one only
                // produced a failed save later.
                if (slots.length <= 1) { toastMsg('A columns component needs at least one column. Delete the component itself instead.'); return; }
                if (slot.components.length && !confirm('Remove column ' + (si + 1) + ' and the ' + slot.components.length + ' component(s) in it?')) return;
                slots.splice(si, 1);
                childSel = null;
                activeSlot = Math.min(activeSlot, slots.length - 1);
                markDirty();
                renderAll();
            };
            wrap.onclick = function () { if (activeSlot !== si) selectSlot(selected, si); };
            wrap.querySelectorAll('.rd-slotchild').forEach(function (row) {
                var ci = parseInt(row.dataset.child, 10);
                row.onclick = function (e) {
                    if (e.target.dataset.act) return;
                    e.stopPropagation();
                    selectChild(selected, si, ci);
                };
                row.querySelectorAll('[data-act]').forEach(function (b) {
                    b.onclick = function (e) {
                        e.stopPropagation();
                        childSel = { slot: si, index: ci };
                        if (b.dataset.act === 'del') deleteChild();
                        else moveChild(b.dataset.act === 'up' ? -1 : 1);
                    };
                });
            });
            host.appendChild(wrap);
        });

        $id('rdPAddSlot').onclick = function () {
            if (slots.length >= MAX_COLUMN_SLOTS) { toastMsg('A columns component holds at most ' + MAX_COLUMN_SLOTS + ' columns.'); return; }
            slots.push({ width: 0, components: [] });
            activeSlot = slots.length - 1;
            childSel = null;
            markDirty();
            renderAll();
        };
    }

    // ---- alignment / distribution (free-canvas, 2+ selected) ----
    // Widths are known; heights are not (a band's height follows its content), so the
    // rendered element height is read from the DOM for vertical operations.
    function bandHeight(index) {
        var el = $id('rdPaper').querySelector('.rd-band[data-index="' + index + '"]');
        return el ? el.offsetHeight : 0;
    }

    function alignSelection(mode) {
        // x/y only mean anything on a free canvas; on a banded page this would write
        // meaningless coordinates into flowing components.
        var alignPage = pageObj();
        if (!alignPage || (alignPage.layout || 'banded') !== 'canvas') {
            toastMsg('Align works on free-canvas pages; banded components flow top to bottom.');
            return;
        }
        var entries = selectedComps();
        if (entries.length < 2) { toastMsg('Select two or more components to align.'); return; }

        var lefts = entries.map(function (e) { return e.comp.x || 0; });
        var widths = entries.map(function (e) { return e.comp.w || 320; });
        var tops = entries.map(function (e) { return e.comp.y || 0; });
        var heights = entries.map(function (e) { return bandHeight(e.index); });

        var minLeft = Math.min.apply(null, lefts);
        var maxRight = Math.max.apply(null, entries.map(function (e, i) { return lefts[i] + widths[i]; }));
        var minTop = Math.min.apply(null, tops);
        var maxBottom = Math.max.apply(null, entries.map(function (e, i) { return tops[i] + heights[i]; }));

        entries.forEach(function (e, i) {
            switch (mode) {
                case 'left': e.comp.x = minLeft; break;
                case 'right': e.comp.x = maxRight - widths[i]; break;
                case 'centerh': e.comp.x = Math.round(((minLeft + maxRight) / 2 - widths[i] / 2)); break;
                case 'top': e.comp.y = minTop; break;
                case 'bottom': e.comp.y = maxBottom - heights[i]; break;
                case 'middlev': e.comp.y = Math.round(((minTop + maxBottom) / 2 - heights[i] / 2)); break;
            }
            e.comp.x = Math.max(0, Math.round(e.comp.x));
            e.comp.y = Math.max(0, Math.round(e.comp.y));
        });
        markDirty();
        renderPaper();
        paintSelection();
    }

    function distributeSelection(axis) {
        // Canvas-only, for the same reason as alignSelection.
        var distPage = pageObj();
        if (!distPage || (distPage.layout || 'banded') !== 'canvas') {
            toastMsg('Distribute works on free-canvas pages; banded components flow top to bottom.');
            return;
        }
        var entries = selectedComps();
        if (entries.length < 3) { toastMsg('Select three or more components to distribute.'); return; }

        // Equal gaps between the outer two, in placement order along the axis.
        var sorted = entries.slice().sort(function (a, b) {
            return axis === 'h' ? (a.comp.x || 0) - (b.comp.x || 0) : (a.comp.y || 0) - (b.comp.y || 0);
        });
        var sizes = sorted.map(function (e) { return axis === 'h' ? (e.comp.w || 320) : bandHeight(e.index); });
        var first = axis === 'h' ? (sorted[0].comp.x || 0) : (sorted[0].comp.y || 0);
        var lastIdx = sorted.length - 1;
        var lastEnd = (axis === 'h' ? (sorted[lastIdx].comp.x || 0) : (sorted[lastIdx].comp.y || 0)) + sizes[lastIdx];
        var totalSize = sizes.reduce(function (a, b) { return a + b; }, 0);
        var gap = (lastEnd - first - totalSize) / (sorted.length - 1);

        var cursor = first;
        sorted.forEach(function (e, i) {
            var pos = Math.max(0, Math.round(cursor));
            if (axis === 'h') e.comp.x = pos; else e.comp.y = pos;
            cursor += sizes[i] + gap;
        });
        markDirty();
        renderPaper();
        paintSelection();
    }

    var ALIGN_TOOLS = [
        ['left', 'Align left', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16M8 8h10M8 16h6"/></svg>'],
        ['centerh', 'Align centres vertically', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M7 8h10M9 16h6"/></svg>'],
        ['right', 'Align right', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 4v16M6 8h10M10 16h6"/></svg>'],
        ['top', 'Align top', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16M8 8v10M16 8v6"/></svg>'],
        ['middlev', 'Align middles horizontally', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M8 7v10M16 9v6"/></svg>'],
        ['bottom', 'Align bottom', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16M8 6v10M16 10v6"/></svg>']
    ];

    function renderMultiSelectProps(host, count) {
        var html = '<div class="rd-sect">Selection &middot; ' + count + ' components</div>';
        html += '<div class="rd-aligngrid" id="rdAlignTools">';
        ALIGN_TOOLS.forEach(function (t) {
            html += '<button class="rd-minibtn rd-alignbtn" data-align="' + t[0] + '" title="' + esc(t[1]) + '">' + t[2] + '</button>';
        });
        html += '</div>';
        html += '<div class="rd-listrow"><button class="rd-minibtn" data-dist="h">Distribute across</button>'
            + '<button class="rd-minibtn" data-dist="v">Distribute down</button></div>';
        html += '<div class="rd-sect">Selection actions</div>';
        html += '<div class="rd-listrow"><button class="rd-minibtn" id="rdSelDuplicate">Duplicate</button>'
            + '<button class="rd-minibtn" id="rdSelCopy" title="Copy (Ctrl+C) - paste with Ctrl+V on any page or report">Copy</button>'
            + '<button class="rd-minibtn warn" id="rdSelDelete">Delete selected</button></div>';
        html += '<div class="rd-hint">Ctrl or Shift click to add to the selection, or drag a box on empty page space. Drag any selected component to move them together; arrow keys nudge them. Ctrl+C copies the selection and Ctrl+V pastes it onto the current page, including another report.</div>';
        host.innerHTML = html;

        host.querySelectorAll('[data-align]').forEach(function (b) {
            b.onclick = function () { alignSelection(b.dataset.align); };
        });
        host.querySelectorAll('[data-dist]').forEach(function (b) {
            b.onclick = function () { distributeSelection(b.dataset.dist); };
        });
        $id('rdSelDuplicate').onclick = duplicateSelectedComponent;
        $id('rdSelCopy').onclick = copySelectedComponents;
        $id('rdSelDelete').onclick = deleteSelectedComponent;
    }

    function duplicateSelectedComponent() {
        var page = pageObj();
        var entries = selectedComps();
        if (!page || entries.length === 0) return;

        // Copies are appended (before the footer) and become the new selection, so the
        // duplicate can be dragged away as a group straight afterwards.
        var canvas = (page.layout || 'banded') === 'canvas';
        var stamp = Date.now().toString(36);
        var newSelection = [];
        entries.forEach(function (entry, n) {
            var copy = JSON.parse(JSON.stringify(entry.comp));
            copy.id = entry.comp.type + '_' + stamp + '_' + n;
            if (canvas) {
                copy.x = (entry.comp.x || 40) + 20;
                copy.y = (entry.comp.y || 40) + 20;
            }
            insertComponent(page, copy, null);
            newSelection.push(selected);
        });
        selection = newSelection;
        selected = newSelection.length ? newSelection[newSelection.length - 1] : -1;
        markDirty();
        renderAll();
    }

    // ---- component clipboard (Ctrl+C / Ctrl+V) ----
    // The copy is the components' own template JSON, kept in localStorage, so it survives
    // switching page and opening another report in the same browser. Ids are reissued on
    // paste, never on copy, so the same copy can be pasted repeatedly.
    var CLIPBOARD_KEY = 'rdComponentClipboard';

    function putClipboard(comps) {
        var payload = comps.map(function (c) { return JSON.parse(JSON.stringify(c)); });
        try {
            localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload));
        } catch (e) {
            toastMsg('Copy failed: ' + e);
            return;
        }
        toastMsg(payload.length === 1 ? 'Component copied.' : payload.length + ' components copied.');
    }

    function copySelectedComponents() {
        // A child of a Columns band is copied on its own; the Properties panel wires its
        // Copy button straight to putClipboard, so this only sees page-level selections.
        var entries = selectedComps();
        if (entries.length === 0) return;
        putClipboard(entries.map(function (e) { return e.comp; }));
    }

    function clipboardComponents() {
        var raw = null;
        try { raw = localStorage.getItem(CLIPBOARD_KEY); } catch (e) { return []; }
        if (!raw) return [];
        try {
            var list = JSON.parse(raw);
            return Array.isArray(list) ? list.filter(function (c) { return c && c.type; }) : [];
        } catch (e) { return []; }
    }

    function pasteComponents() {
        var page = pageObj();
        if (!page) return;
        var comps = clipboardComponents();
        if (comps.length === 0) { toastMsg('Nothing to paste.'); return; }

        var canvas = (page.layout || 'banded') === 'canvas';
        // On a canvas page the paste is offset until it no longer lands exactly on top of
        // something, so pasting onto the source page (or pasting twice) cascades instead of
        // hiding the copy. The whole group moves by the same delta, keeping its layout.
        var delta = 0;
        if (canvas) {
            var first = comps[0];
            var occupied = function (x, y) {
                return page.components.some(function (c) { return (c.x || 0) === x && (c.y || 0) === y; });
            };
            while (delta < 400 && occupied((first.x || 40) + delta, (first.y || 40) + delta)) delta += 20;
        }

        // Components copied from a BANDED page carry no position, so a shared delta would
        // drop them all on one spot; those get a per-component step instead. Components
        // copied from a canvas keep their relative layout.
        var flat = canvas && comps.every(function (c) {
            return (c.x || 0) === (comps[0].x || 0) && (c.y || 0) === (comps[0].y || 0);
        });

        var stamp = Date.now().toString(36);
        var newSelection = [];
        comps.forEach(function (comp, n) {
            var copy = JSON.parse(JSON.stringify(comp));
            copy.id = (comp.type || 'component') + '_' + stamp + '_' + n;
            if (canvas) {
                var step = flat ? n * 30 : 0;
                copy.x = Math.max(0, (comp.x || 40) + delta + step);
                copy.y = Math.max(0, (comp.y || 40) + delta + step);
                if (!copy.w) copy.w = 500;
            }
            insertComponent(page, copy, null);
            newSelection.push(selected);
        });
        selection = newSelection;
        selected = newSelection.length ? newSelection[newSelection.length - 1] : -1;
        markDirty();
        renderAll();
    }

    function deleteSelectedComponent() {
        var page = pageObj();
        if (!page || selection.length === 0) return;
        // Descending, so earlier splices cannot shift the indices still to be removed.
        var indices = selection.slice().filter(function (i) { return i >= 0 && i < page.components.length; })
            .sort(function (a, b) { return b - a; });
        if (indices.length === 0) return;
        if (indices.length > 1 && !confirm('Delete ' + indices.length + ' selected components?')) return;
        indices.forEach(function (i) { page.components.splice(i, 1); });
        selection = [];
        selected = -1;
        markDirty();
        renderAll();
    }

    function moveComponent(delta) {
        var page = pageObj();
        var to = selected + delta;
        if (to < 0 || to >= page.components.length) return;
        // The footer always prints last: it neither moves itself nor lets another band
        // slip below it (every other reorder path already excludes it).
        var comp = page.components[selected];
        if (!comp || comp.type === 'footer') return;
        if ((page.components[to] || {}).type === 'footer') return;
        page.components.splice(selected, 1);
        page.components.splice(to, 0, comp);
        selected = to;
        selection = [to];
        markDirty();
        renderAll();
    }

    function renderSeriesEditor(comp) {
        var host = $id('rdPSeries');
        host.innerHTML = '';
        (comp.series = comp.series || []).forEach(function (s, i) {
            var row = document.createElement('div');
            row.className = 'rd-listrow';
            var palette = ['#2596BE', '#e6a63c', '#5cc98a', '#c8443a', '#7a6be2'];
            row.innerHTML = '<input class="rd-fin" placeholder="Variable name" value="' + esc(s.variable || '') + '">'
                + pickButton({ cls: 'rd-series-pick', title: 'Pick a variable' })
                + '<input class="rd-fin" style="max-width:64px;" placeholder="label" value="' + esc(s.label || '') + '">'
                + '<button class="rd-minibtn warn">&#10005;</button>';
            var inputs = row.querySelectorAll('input');
            inputs[0].onchange = function () { s.variable = this.value; markDirty(); renderPaper(); };
            inputs[1].onchange = function () { s.label = this.value; markDirty(); renderPaper(); };
            bindPick(row.querySelector('.rd-series-pick'), inputs[0], {
                label: 'Series variable', mode: 'name', setValue: function (v) { s.variable = v; }
            });
            var swatch = makeColorSwatch(s.color || palette[i % palette.length], function (hex) {
                s.color = hex;
                markDirty();
                renderPaper();
            });
            swatch.title = swatch.title || 'Series color';
            // Selected by class, not by tag: the row now also holds the picker button.
            var removeBtn = row.querySelector('.rd-minibtn.warn');
            row.insertBefore(swatch, removeBtn);
            removeBtn.onclick = function () { comp.series.splice(i, 1); markDirty(); renderProps(); renderPaper(); };
            host.appendChild(row);
        });
        $id('rdPAddSeries').onclick = function () {
            comp.series.push({ variable: '', label: '', color: '' });
            markDirty(); renderProps(); renderPaper();
        };
    }

    function renderTilesEditor(comp) {
        var host = $id('rdPTiles');
        host.innerHTML = '';
        (comp.tiles = comp.tiles || []).forEach(function (tile, i) {
            var wrap = document.createElement('div');
            wrap.style.cssText = 'border:1px solid var(--rd-line);border-radius:7px;padding:7px;margin-bottom:6px;display:flex;flex-direction:column;gap:5px;';
            wrap.innerHTML =
                '<div class="rd-listrow"><input class="rd-fin" placeholder="Label" value="' + esc(tile.label || '') + '"><button class="rd-minibtn warn">&#10005;</button></div>'
                + '<div class="rd-listrow"><input class="rd-fin rd-code" placeholder="Binding, e.g. hist:sum:PLC1.Total or {= Hist(\'PLC1.Total\',\'sum\') / 1000 }" value="' + esc(tile.binding || '') + '">'
                + '<button type="button" class="rd-expand rd-tile-expand" title="Open in the editor">&#10530;</button></div>'
                + '<div class="rd-listrow"><input class="rd-fin" style="max-width:70px;" placeholder="units" value="' + esc(tile.units || '') + '">'
                + '<input class="rd-fin" style="max-width:70px;" placeholder="format" value="' + esc(tile.format || '') + '">'
                + '<label class="rd-check" style="flex:1;"><input type="checkbox"' + (tile.compare ? ' checked' : '') + '> compare</label></div>';
            var inputs = wrap.querySelectorAll('input');
            inputs[0].onchange = function () { tile.label = this.value; markDirty(); renderPaper(); };
            inputs[1].onchange = function () { tile.binding = this.value; markDirty(); renderPaper(); };
            inputs[2].onchange = function () { tile.units = this.value; markDirty(); renderPaper(); };
            inputs[3].onchange = function () { tile.format = this.value; markDirty(); renderPaper(); };
            inputs[4].onchange = function () { tile.compare = this.checked; markDirty(); renderProps(); renderPaper(); };
            wrap.querySelector('.rd-minibtn.warn').onclick = function () { comp.tiles.splice(i, 1); markDirty(); renderProps(); renderPaper(); };
            wrap.querySelector('.rd-tile-expand').onclick = function () {
                openFieldEditor({
                    label: 'KPI binding' + (tile.label ? ' - ' + tile.label : ''),
                    value: tile.binding || '',
                    mode: 'expression',
                    onApply: function (v) {
                        tile.binding = v.trim();
                        inputs[1].value = tile.binding;
                        markDirty(); renderPaper();
                    }
                });
            };
            host.appendChild(wrap);
        });
        $id('rdPAddTile').onclick = function () {
            comp.tiles.push({ label: 'KPI', binding: '', units: '', format: '', compare: false });
            markDirty(); renderProps(); renderPaper();
        };
    }

    function renderColumnsEditor(comp) {
        var host = $id('rdPColumns');
        host.innerHTML = '';
        (comp.columns = comp.columns || []).forEach(function (col, i) {
            var wrap = document.createElement('div');
            wrap.style.cssText = 'border:1px solid var(--rd-line);border-radius:7px;padding:7px;margin-bottom:6px;display:flex;flex-direction:column;gap:5px;';
            var aggValue = (col.aggregate || '').trim();
            var isExpr = isExpression(aggValue);
            var isPy = !isExpr && aggValue.indexOf('py:') === 0;
            var aggOptions = AGGREGATES.map(function (a) {
                return '<option value="' + a + '"' + (!isPy && !isExpr && aggValue === a ? ' selected' : '') + '>' + (a === '' ? '(none)' : a) + '</option>';
            }).join('');
            aggOptions += '<option value="__expr__"' + (isExpr ? ' selected' : '') + '>{= } expression</option>';
            aggOptions += '<option value="__py__"' + (isPy ? ' selected' : '') + '>py: function</option>';
            wrap.innerHTML =
                '<div class="rd-listrow"><input class="rd-fin" placeholder="Column name" value="' + esc(col.name || '') + '">'
                + '<input class="rd-fin" placeholder="Header" value="' + esc(col.header || '') + '"><button class="rd-minibtn warn">&#10005;</button></div>'
                + '<div class="rd-listrow"><select class="rd-fsel">' + aggOptions + '</select>'
                + '<input class="rd-fin" style="max-width:70px;" placeholder="format" value="' + esc(col.format || '') + '"></div>'
                + (isExpr ? '<div class="rd-listrow"><input class="rd-fin rd-code rd-aggexpr" placeholder="{= max(Values) - min(Values) }" value="' + esc(aggValue) + '">'
                    + '<button type="button" class="rd-expand rd-agg-expand" title="Open in the editor">&#10530;</button></div>' : '')
                + (isPy ? '<input class="rd-fin rd-pyagg" placeholder="Hook aggregate function, receives (values, ctx)" value="' + esc(aggValue.slice(3)) + '">' : '')
                + '<div class="rd-listrow"><input class="rd-fin rd-code rd-colfn" placeholder="Computed value: {= Row[\'Flow\'] * 2 } or a hook function name" value="' + esc(col.fn || '') + '">'
                + '<button type="button" class="rd-expand rd-fn-expand" title="Open in the editor">&#10530;</button></div>';
            var inputs = wrap.querySelectorAll('input');
            var sel = wrap.querySelector('select');
            inputs[0].onchange = function () { col.name = this.value; markDirty(); renderPaper(); };
            inputs[1].onchange = function () { col.header = this.value; markDirty(); renderPaper(); };
            sel.onchange = function () {
                // "{= } expression" and "py: function" show an inline field instead of a browser
                // prompt (which browsers can suppress and cannot be styled). Both start from a
                // working example rather than an empty value, which would fail validation on save.
                col.aggregate = this.value === '__py__' ? 'py:'
                    : this.value === '__expr__' ? '{= sum(Values) }'
                    : this.value;
                markDirty(); renderProps(); renderPaper();
            };
            inputs[2].onchange = function () { col.format = this.value; markDirty(); };
            var exprInput = wrap.querySelector('.rd-aggexpr');
            if (exprInput) exprInput.onchange = function () {
                col.aggregate = this.value.trim();
                markDirty(); renderPaper();
            };
            var pyInput = wrap.querySelector('.rd-pyagg');
            if (pyInput) pyInput.onchange = function () {
                col.aggregate = this.value.trim() ? 'py:' + this.value.trim() : '';
                markDirty(); renderPaper();
            };
            var fnInput = wrap.querySelector('.rd-colfn');
            fnInput.onchange = function () { col.fn = this.value; markDirty(); renderPaper(); };
            wrap.querySelector('.rd-minibtn.warn').onclick = function () { comp.columns.splice(i, 1); markDirty(); renderProps(); renderPaper(); };

            var columnLabel = col.header || col.name || 'Column ' + (i + 1);
            wrap.querySelector('.rd-fn-expand').onclick = function () {
                openFieldEditor({
                    label: 'Computed value - ' + columnLabel,
                    value: col.fn || '',
                    mode: 'expression',
                    onApply: function (v) {
                        col.fn = v.trim();
                        fnInput.value = col.fn;
                        markDirty(); renderPaper();
                    }
                });
            };
            var aggExpand = wrap.querySelector('.rd-agg-expand');
            if (aggExpand) aggExpand.onclick = function () {
                openFieldEditor({
                    label: 'Summary aggregate - ' + columnLabel,
                    value: col.aggregate || '',
                    mode: 'expression',
                    onApply: function (v) {
                        col.aggregate = v.trim();
                        if (exprInput) exprInput.value = col.aggregate;
                        markDirty(); renderPaper();
                    }
                });
            };
            host.appendChild(wrap);
        });
        $id('rdPAddColumn').onclick = function () {
            comp.columns.push({ name: '', header: '', format: '', aggregate: '', fn: '' });
            markDirty(); renderProps(); renderPaper();
        };
    }

    // ---- data sources ----
    function loadDataSources() {
        api('?handler=GetDataSources', 'POST', {}).then(function (res) {
            if (res && !res.error) sources = res;
            renderSourceTree('');
            renderReportSettings();
        }).catch(function () { renderSourceTree(''); });
    }

    // Collapse state per group, kept across visits. A group is force-expanded while a
    // search filter is active, otherwise a collapsed group would hide its own matches.
    function groupCollapsed(key) { return localStorage.getItem('rdTree_' + key) === '1'; }

    function renderSourceTree(filter) {
        var host = $id('rdSourceTree');
        host.innerHTML = '';
        filter = (filter || '').toLowerCase();

        // variableName set = the leaf can be dragged onto the page to bind a component to it.
        function leaf(parent, text, copyText, variableName) {
            var el = document.createElement('div');
            el.className = 'rd-tleaf';
            el.textContent = text;
            el.title = variableName ? 'Click to copy, or drag onto the page' : 'Click to copy';
            el.onclick = function () {
                copyTextToClipboard(copyText || text, 'Copied: ' + (copyText || text));
            };
            if (variableName) {
                el.draggable = true;
                el.addEventListener('dragstart', function (e) {
                    e.dataTransfer.setData(VAR_MIME, variableName);
                    e.dataTransfer.effectAllowed = 'copy';
                });
                el.addEventListener('dragend', hideDropLine);
            }
            parent.appendChild(el);
        }

        // Returns the body element the caller fills with leaves; clicking the node folds it.
        function group(key, label, icon, count) {
            var node = document.createElement('div');
            node.className = 'rd-tnode';
            node.innerHTML = icon + '<b>' + esc(label) + '</b>'
                + (count !== undefined ? '<span class="cnt">' + count + '</span>' : '')
                + '<svg class="rd-tchevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

            var body = document.createElement('div');
            body.className = 'rd-tgroup';

            var collapsed = !filter && groupCollapsed(key);
            node.classList.toggle('collapsed', collapsed);
            body.hidden = collapsed;

            node.onclick = function () {
                var nowCollapsed = !node.classList.contains('collapsed');
                node.classList.toggle('collapsed', nowCollapsed);
                body.hidden = nowCollapsed;
                localStorage.setItem('rdTree_' + key, nowCollapsed ? '1' : '0');
            };

            host.appendChild(node);
            host.appendChild(body);
            return body;
        }

        var varIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>';
        var dbIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>';
        var pyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17l6-6-6-6M12 19h8"/></svg>';

        var vars = sources.variables.filter(function (v) { return !filter || v.toLowerCase().indexOf(filter) >= 0; });
        var varBody = group('variables', 'Variables', varIcon, vars.length);
        vars.slice(0, 60).forEach(function (v) { leaf(varBody, v, v, v); });
        if (vars.length > 60) {
            var more = document.createElement('div');
            more.className = 'rd-hint';
            more.style.paddingLeft = '25px';
            more.textContent = '+ ' + (vars.length - 60) + ' more - refine the search';
            varBody.appendChild(more);
        }

        var dbBody = group('databases', 'Project SQLite', dbIcon, sources.databases.length);
        sources.databases.forEach(function (db) {
            (db.tables || []).filter(function (t) { return !filter || t.toLowerCase().indexOf(filter) >= 0 || db.name.toLowerCase().indexOf(filter) >= 0; })
                .forEach(function (t) { leaf(dbBody, db.name + ' · ' + t, 'SELECT * FROM ' + t); });
            if (!db.tables || db.tables.length === 0) leaf(dbBody, db.name, db.name);
        });

        var modBody = group('modules', 'Module scripts (hooks)', pyIcon, sources.modules.length);
        sources.modules.filter(function (m) { return !filter || m.toLowerCase().indexOf(filter) >= 0; })
            .forEach(function (m) { leaf(modBody, m); });
    }

    // ---- render all ----
    function renderAll() {
        $id('rdCurrentName').textContent = current ? current.name : '-';
        renderPageTabs();
        renderPaper();
        renderReportSettings();
        renderProps();
    }

    // ---- layout ----
    // The designer fills the viewport below the page chrome; without an explicit height
    // the flex column has nothing to distribute and collapses (same pattern as
    // PythonEdit's fitPanelContainer).
    function fitDesignerRoot() {
        var root = $id('ReportDesignerRoot');
        if (!root) return;
        var top = root.getBoundingClientRect().top + window.scrollY;
        root.style.height = Math.max(480, window.innerHeight - top - 10) + 'px';
    }

    // ---- init / wiring ----
    function init() {
        if (!$id('ReportDesignerRoot')) return;

        fitDesignerRoot();
        window.addEventListener('resize', fitDesignerRoot);

        renderToolbox();
        wireFieldEditor();

        // AI focus mode via the shared EnvisionChat helper, plus the chat hook that reloads
        // the open report after an AI edit. EnvisionChatConfig is defined by a layout script
        // that loads after this file, so bind on DOMContentLoaded (same timing as PythonEdit).
        function initAiIntegration() {
            if (typeof EnvisionChatSetupFocusButton === 'function') {
                EnvisionChatSetupFocusButton('rdAiFocusBtn', 'ReportDesignerRoot', 'primary');
            }
            initAiChatHook();
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAiIntegration);
        else initAiIntegration();
        // Stage background choice, persisted; absent/unknown value = default stripes.
        var bgSelect = $id('rdStageBgSelect');
        var storedBg = localStorage.getItem('rdStageBg') || 'stripes';
        if ([].some.call(bgSelect.options, function (o) { return o.value === storedBg; })) {
            bgSelect.value = storedBg;
            if (storedBg !== 'stripes') $id('rdStage').dataset.bg = storedBg;
        }
        bgSelect.onchange = function () {
            if (this.value === 'stripes') delete $id('rdStage').dataset.bg;
            else $id('rdStage').dataset.bg = this.value;
            localStorage.setItem('rdStageBg', this.value);
        };

        $id('rdSaveBtn').onclick = saveReport;

        // Template JSON toolbar (Script view): copy / download / import a template file.
        var tplCopy = $id('rdTplCopyBtn');
        if (tplCopy) tplCopy.onclick = copyTemplateJson;
        var tplDownload = $id('rdTplDownloadBtn');
        if (tplDownload) tplDownload.onclick = downloadTemplateJson;
        var tplImportBtn = $id('rdTplImportBtn');
        var tplImportFile = $id('rdTplImportFile');
        if (tplImportBtn && tplImportFile) {
            tplImportBtn.onclick = function () { tplImportFile.click(); };
            tplImportFile.onchange = function () {
                if (this.files && this.files[0]) importTemplateJson(this.files[0]);
                this.value = '';
            };
        }

        $id('rdReturnBtn').onclick = function () {
            if (dirty && !confirm('Discard unsaved changes?')) return;
            dirty = false; // suppress the beforeunload prompt for an intentional leave
            location.href = '/Reports';
        };
        $id('rdExecuteBtn').onclick = executeReport;
        var executeOptionsBtn = $id('rdExecuteOptionsBtn');
        if (executeOptionsBtn) executeOptionsBtn.onclick = executeReportWithOptions;
        $id('rdPreviewFileSelect').onchange = loadSelectedPreviewFile;
        $id('rdSourceSearch').oninput = function () { renderSourceTree(this.value); };

        $id('rdViewSeg').addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (b) switchView(b.dataset.view);
        });

        $id('rdZoomSeg').addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (b) setZoom(parseFloat(b.dataset.z));
        });

        // Ctrl + scroll zooms the canvas toward the cursor; plain scroll keeps scrolling.
        $id('rdStage').addEventListener('wheel', function (e) {
            if (!e.ctrlKey) return;
            e.preventDefault();
            setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e);
        }, { passive: false });

        // Drag & drop onto the page: toolbox components, and variables from Data Sources.
        var stage = $id('rdStage');
        stage.addEventListener('dragover', function (e) {
            var types = [].slice.call(e.dataTransfer.types);
            var isComponent = types.indexOf(DRAG_MIME) >= 0;
            var isVariable = types.indexOf(VAR_MIME) >= 0;
            var isReorder = types.indexOf(COMP_MIME) >= 0;
            // An image file dragged in from the desktop: it becomes an Image component, or
            // replaces the file of the Image component it lands on.
            var isFile = types.indexOf('Files') >= 0;
            if (!isComponent && !isVariable && !isReorder && !isFile) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = isReorder ? 'move' : 'copy';
            var page = pageObj();
            // Over a KPI row or chart the variable joins that component, so no insertion
            // line: the drop will not create a band at this position.
            var ontoComponent = isVariable && variableTargetAt(e);
            if (isFile) {
                var band = e.target && e.target.closest ? e.target.closest('#rdPaper .rd-band') : null;
                var over = band && page ? page.components[parseInt(band.dataset.index, 10)] : null;
                ontoComponent = over && over.type === 'image';
            }
            if (page && (page.layout || 'banded') !== 'canvas' && !ontoComponent) showDropLine(e.clientY);
            else hideDropLine();
        });
        stage.addEventListener('drop', handleToolDrop);
        stage.addEventListener('dragleave', function (e) {
            if (e.target === stage) hideDropLine();
        });

        // A file dropped anywhere BUT the stage would otherwise make the browser navigate to
        // it, losing unsaved work. Swallow those without doing anything.
        ['dragover', 'drop'].forEach(function (type) {
            document.addEventListener(type, function (e) {
                if (stage.contains(e.target)) return;
                if ([].indexOf.call(e.dataTransfer ? e.dataTransfer.types : [], 'Files') < 0) return;
                e.preventDefault();
                if (type === 'drop') e.dataTransfer.dropEffect = 'none';
            });
        });

        updateZoomUi();

        $id('rdLayoutSeg').addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (b) setPageLayout(b.dataset.m);
        });

        $id('rdPageLeftBtn').onclick = function () { movePageTo(curPage, curPage - 1); };
        $id('rdPageRightBtn').onclick = function () { movePageTo(curPage, curPage + 1); };

        $id('rdDeletePageBtn').onclick = function () {
            if (!template || template.pages.length <= 1) { toastMsg('A report needs at least one page.'); return; }
            if (!confirm('Delete page ' + (curPage + 1) + ' and its components?')) return;
            template.pages.splice(curPage, 1);
            curPage = Math.max(0, curPage - 1);
            selection = [];
            selected = -1;
            markDirty();
            renderAll();
        };

        // Clicking bare paper deselects; a marquee drag ends on the paper too, so ignore
        // the click that follows one (the marquee already set the selection).
        $id('rdPaper').addEventListener('click', function (e) {
            if (suppressPaperClick) { suppressPaperClick = false; return; }
            if (e.target.closest && e.target.closest('.rd-band')) return;
            clearSelection();
        });
        attachMarquee();

        // Repair mode: edits to the raw-JSON textarea are unsaved work too - without this,
        // navigating away discarded a half-finished repair with no prompt. markDirtyUi only
        // (no undo snapshot): there is no parsed template to snapshot while it is broken.
        $id('rdTemplateText').addEventListener('input', function () {
            if (brokenTemplateJson !== null && !dirty) markDirtyUi();
        });

        document.addEventListener('keydown', function (e) {
            var key = (e.key || '').toLowerCase();
            var t = e.target;
            var inField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

            if ((e.ctrlKey || e.metaKey) && key === 's') {
                e.preventDefault();
                saveReport();
                return;
            }
            // Text fields keep their native undo/duplicate behavior.
            if ((e.ctrlKey || e.metaKey) && !inField) {
                if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
                if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return; }
                if (key === 'd') {
                    // With a Columns-band child selected the shortcut targets the CHILD,
                    // exactly like the Properties-panel buttons - duplicating the whole
                    // band when the panel shows one column entry surprised every time.
                    if (activeChild()) { e.preventDefault(); duplicateChild(); return; }
                    if (selectedComp()) { e.preventDefault(); duplicateSelectedComponent(); }
                    return;
                }
                // Copy/paste of components. A live text selection still copies as text, so
                // selecting a label on the page and pressing Ctrl+C keeps working.
                var textSelected = window.getSelection && String(window.getSelection()) !== '';
                if (key === 'c' && !textSelected) {
                    var childComp = activeChild();
                    if (childComp) { e.preventDefault(); putClipboard([childComp]); return; }
                    if (selectedComps().length) { e.preventDefault(); copySelectedComponents(); }
                    return;
                }
                if (key === 'v') {
                    if (pageObj()) { e.preventDefault(); pasteComponents(); }
                    return;
                }
            }
            if (inField) return;
            // Ctrl+A selects every component on the page (free canvas, where it is useful).
            if ((e.ctrlKey || e.metaKey) && key === 'a') {
                var pageAll = pageObj();
                if (!pageAll) return;
                e.preventDefault();
                selection = pageAll.components
                    .map(function (c, i) { return c.type === 'footer' ? -1 : i; })
                    .filter(function (i) { return i >= 0; });
                selected = selection.length ? selection[selection.length - 1] : -1;
                paintSelection();
                renderProps();
                return;
            }
            if (e.key === 'Escape' && selection.length) {
                clearSelection();
                return;
            }
            if (e.key === 'Delete') {
                // Same child routing as Ctrl+D: Delete with a column child selected used
                // to remove the WHOLE band with all its children, without a confirm.
                if (activeChild()) {
                    e.preventDefault();
                    deleteChild();
                    return;
                }
                if (selection.length) {
                    e.preventDefault();
                    deleteSelectedComponent();
                }
                return;
            }
            // Arrow nudge: 1px, Shift = 10px (the grid step). Moves the whole selection.
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) >= 0) {
                var page = pageObj();
                if (!page || (page.layout || 'banded') !== 'canvas') return;
                var entries = selectedComps();
                if (entries.length === 0) return;
                e.preventDefault();
                var step = e.shiftKey ? 10 : 1;
                var dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
                var dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);
                // Clamp as a group so relative spacing survives a nudge against an edge.
                if (dx < 0) dx = -Math.min(step, Math.min.apply(null, entries.map(function (en) { return en.comp.x || 0; })));
                if (dy < 0) dy = -Math.min(step, Math.min.apply(null, entries.map(function (en) { return en.comp.y || 0; })));
                entries.forEach(function (en) {
                    en.comp.x = Math.max(0, (en.comp.x || 0) + dx);
                    en.comp.y = Math.max(0, (en.comp.y || 0) + dy);
                });
                markDirty();
                renderPaper();
                paintSelection();
                var anchor = selectedComp();
                var px = $id('rdPosX'), py = $id('rdPosY');
                if (px && anchor) px.value = anchor.x || 0;
                if (py && anchor) py.value = anchor.y || 0;
            }
        });

        window.addEventListener('beforeunload', function (e) {
            if (dirty) { e.preventDefault(); e.returnValue = ''; }
        });

        // Collapsible cards; each remembers its own state.
        function wireCollapsibleCard(cardId, headerId, storageKey) {
            var card = $id(cardId);
            var header = $id(headerId);
            if (!card || !header) return;
            if (localStorage.getItem(storageKey) === '1') card.classList.add('collapsed');
            header.addEventListener('click', function () {
                card.classList.toggle('collapsed');
                localStorage.setItem(storageKey, card.classList.contains('collapsed') ? '1' : '0');
            });
        }
        wireCollapsibleCard('rdSettingsCard', 'rdSettingsHeader', 'rdSettingsCollapsed');
        wireCollapsibleCard('rdToolboxCard', 'rdToolboxHeader', 'rdToolboxCollapsed');
        wireCollapsibleCard('rdSourcesCard', 'rdSourcesHeader', 'rdSourcesCollapsed');

        // Draggable side-column widths (persisted). grow: +1 widens with rightward drag
        // (left column), -1 widens with leftward drag (right column). A column collapses
        // when dragged well below its minimum, and a double-click on the handle toggles
        // the collapse; no extra buttons. Width 0 in storage means collapsed.
        function setupColumnDrag(handleId, cssVar, storageKey, fallback, grow, collapsedClass) {
            var handle = $id(handleId);
            var main = document.querySelector('.rd-main');
            if (!handle || !main) return;

            function storedWidth() {
                var w = parseInt(localStorage.getItem(storageKey), 10);
                return w > 0 ? w : fallback;
            }
            function setCollapsed(collapsed) {
                main.classList.toggle(collapsedClass, collapsed);
                localStorage.setItem(storageKey, collapsed ? '0' : String(parseInt(getComputedStyle(main).getPropertyValue(cssVar), 10) || fallback));
            }

            if (localStorage.getItem(storageKey) === '0') main.classList.add(collapsedClass);
            else if (storedWidth() !== fallback) main.style.setProperty(cssVar, storedWidth() + 'px');

            handle.title = 'Drag to resize, double-click to collapse';
            handle.addEventListener('dblclick', function () {
                setCollapsed(!main.classList.contains(collapsedClass));
            });

            handle.addEventListener('mousedown', function (e) {
                e.preventDefault();
                handle.classList.add('dragging');
                var startX = e.clientX;
                var collapsed = main.classList.contains(collapsedClass);
                var startW = collapsed ? 0 : parseInt(getComputedStyle(main).getPropertyValue(cssVar), 10) || fallback;
                function move(ev) {
                    var raw = startW + grow * (ev.clientX - startX);
                    if (raw < 90) {
                        main.classList.add(collapsedClass);
                        return;
                    }
                    main.classList.remove(collapsedClass);
                    main.style.setProperty(cssVar, Math.min(640, Math.max(180, raw)) + 'px');
                }
                function up() {
                    handle.classList.remove('dragging');
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                    setCollapsed(main.classList.contains(collapsedClass));
                }
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            });
        }
        setupColumnDrag('rdLeftDragger', '--rd-left-w', 'rdLeftColW', 250, 1, 'rd-left-collapsed');
        setupColumnDrag('rdRightDragger', '--rd-right-w', 'rdRightColW', 300, -1, 'rd-right-collapsed');

        loadDataSources();
        loadReports(window.ReportDesignerInitialReport || '');
    }

    init();
})();
