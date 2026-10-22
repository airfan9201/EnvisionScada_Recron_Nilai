// Shared configuration data grid.
//
// Markup contract (see ModbusTcpDevices.cshtml for the reference implementation):
//   <section data-grid data-grid-key="devices" data-page-size="40"
//            data-load-url="..." data-select-class="select-device">
//     <div data-dg-viewport>
//       <div data-dg-header>
//         <div class="dg-cell" data-column="Name" data-label="Name" data-width="190"
//              data-min-width="65" data-priority="core" data-filter-type="text">
//           <button data-dg-sort="Name">Name</button>
//           <button data-dg-filter="Name">...</button>
//         </div>
//         ...
//       </div>
//       <div data-dg-body> server-rendered .dg-row elements (data-row-id="<id>") </div>
//       <div data-dg-sentinel> loader / end / error text </div>
//     </div>
//   </section>
// Optional elements inside the closest .dg-page scope:
//   [data-dg-search]   free-text search input
//   [data-dg-chips]    active filter chip container
//   [data-dg-total]    element that receives the filtered total count
//   [data-dg-filtered] element shown while filters or search are active
// The load URL must return the same .dg-row markup and an X-Total-Count response header.
// Translations come from window.DataGridTranslations (emitted by _DataGridTranslationsPartial).
// The runtime viewers replace that object once their client dictionary is loaded, so the grid
// chrome follows the operator's language rather than the culture cookie; t() re-reads the object
// on every call, which is what lets them swap it without rebuilding the grid. Column labels go
// through columnLabel() for the same reason - see the comment there.
// Column layout (visibility, order, widths) persists in localStorage per data-grid-key.
// After every load the root dispatches a "dg:loaded" CustomEvent with {offset, count, total}.
(function () {
    "use strict";

    // Utility columns kept at a fixed width: they never become the flexible 1fr column and are not
    // drag-resizable (a checkbox, a status pill, or the action buttons have a natural size). The
    // flexible column becomes the last visible non-fixed (content) column instead.
    // Utility columns: fixed width, anchored in the column picker, and never chosen as the
    // flexible (1fr) column. These hold runtime state or controls rather than content, so letting
    // one absorb the grid's slack just stretches a badge across empty space while the content
    // columns stay cramped. LastExecuted belongs here for the same reason as Quality/Status - it
    // is a runtime readout, and it must keep a width that fits a full date and time.
    // LastExecutedUtc/UpdatedUtc are the same readout under the Reports page's column keys;
    // without them listed, Updated became the flexible column and stretched across the slack.
    const FIXED_COLUMN_KEYS = new Set(["Select", "Enable", "Actions", "Status", "Quality", "LiveValue",
        "LastExecuted", "LastExecutedUtc", "UpdatedUtc"]);

    class DataGrid {
        constructor(root) {
            this.root = root;
            this.scope = root.closest(".dg-page") || root;
            this.body = root.querySelector("[data-dg-body]");
            this.viewport = root.querySelector("[data-dg-viewport]");
            this.header = root.querySelector("[data-dg-header]");
            this.sentinel = root.querySelector("[data-dg-sentinel]");
            this.chips = this.scope.querySelector("[data-dg-chips]");
            this.key = root.dataset.gridKey;
            this.loadUrl = root.dataset.loadUrl;
            this.selectClass = root.dataset.selectClass || "";
            this.pageSize = Number(root.dataset.pageSize) || 40;
            this.offset = this.body.querySelectorAll(".dg-row").length;
            this.filters = {};
            this.sorts = [];
            this.loading = false;
            this.ended = false;
            this.controller = null;
            // Collapsed variable arrays, keyed by the parent's row id. Session-local display
            // state only: it never changes what the server returns, it just hides the element
            // rows of a folded parent (including ones appended later by the infinite scroll).
            this.collapsedArrays = new Set();
            this.columns = Array.from(this.header.querySelectorAll("[data-column]")).map(cell => ({
                key: cell.dataset.column,
                label: cell.dataset.label || cell.dataset.column,
                labelKey: cell.dataset.labelKey || "",
                width: Number(cell.dataset.width) || 140,
                minWidth: Number(cell.dataset.minWidth) || 72,
                priority: cell.dataset.priority || "medium",
                filterType: cell.dataset.filterType || "text",
                defaultVisible: cell.dataset.defaultVisible !== "false",
                visible: cell.dataset.defaultVisible !== "false",
                cell
            }));

            this.restoreLayout();
            this.pinActionsColumn();
            this.bind();
            this.bindHeaderReorder();
            this.applyLayout();
            this.renderChips();
            this.observe();
        }

        t(key) {
            const translations = window.DataGridTranslations || {};
            return translations[key] || key;
        }

        // The label a column shows outside its own header: in the column manager, the filter chips
        // and the filter popover heading. It has to end up in the same language as the header text
        // sitting right above it.
        //
        // data-label is what the page rendered for display. data-label-key, where present, names
        // the dictionary entry for it - needed by the pages that render their label through the
        // server translator, whose data-label is therefore a translated string rather than a key.
        // Where there is no data-label-key the label doubles as the key, which is how the Alarm and
        // Event Viewers are written.
        //
        // The order matters for the Users page, which is both a configuration screen and an
        // embeddable viewer. Embedded it loads _SystemTranslationsPartial and resolves to the
        // operator's language; opened from the side menu it does not, and must keep showing the
        // server's label rather than falling back to a bare key.
        columnLabel(column, fallbackKey) {
            if (!column) {
                return window.EnvisionTranslateKey ? window.EnvisionTranslateKey(fallbackKey) : fallbackKey;
            }

            if (!window.EnvisionTranslateKey) return column.label;

            const key = column.labelKey || column.label;
            const translated = window.EnvisionTranslateKey(key);

            return (translated && translated !== key) ? translated : column.label;
        }

        // ==================== variable array folding ====================
        // (The Ungroup row action lives on window.DataGridUngroupArray below the class: it is
        // page-level, not grid-instance state.)

        toggleArray(parentId) {
            if (this.collapsedArrays.has(parentId)) this.collapsedArrays.delete(parentId);
            else this.collapsedArrays.add(parentId);
            this.applyArrayCollapse();
        }

        // Hides the element rows of every folded parent. Works purely on the rows currently in
        // the DOM: elements need not be adjacent to their parent (sorting and filtering may
        // scatter them), folding hides them wherever they are.
        applyArrayCollapse() {
            this.body.querySelectorAll(".dg-row[data-array-parent]").forEach(row => {
                const parent = row.dataset.arrayParent;
                if (parent && parent !== "0") {
                    row.classList.toggle("dg-array-folded", this.collapsedArrays.has(parent));
                }
            });
            this.body.querySelectorAll("[data-dg-array-toggle]").forEach(badge => {
                badge.classList.toggle("dg-array-collapsed", this.collapsedArrays.has(badge.dataset.dgArrayToggle));
            });
        }

        bind() {
            this.scope.addEventListener("click", event => {
                const arrayToggle = event.target.closest("[data-dg-array-toggle]");
                if (arrayToggle) {
                    this.toggleArray(arrayToggle.dataset.dgArrayToggle);
                    return;
                }

                const sort = event.target.closest("[data-dg-sort]");
                if (sort) {
                    this.toggleSort(sort.dataset.dgSort, event.shiftKey);
                    return;
                }

                const filter = event.target.closest("[data-dg-filter]");
                if (filter) {
                    this.openFilter(filter.dataset.dgFilter, filter);
                    return;
                }

                const columns = event.target.closest("[data-dg-columns]");
                if (columns) {
                    this.openColumnManager(columns);
                    return;
                }

                const remove = event.target.closest("[data-dg-remove-filter]");
                if (remove) {
                    delete this.filters[remove.dataset.dgRemoveFilter];
                    this.reload();
                    return;
                }

                if (event.target.closest("[data-dg-clear-filters]")) {
                    this.filters = {};
                    this.reload();
                }
            });

            document.addEventListener("pointerdown", event => {
                if (!this.popover || this.popover.contains(event.target)) return;
                if (event.target.closest("[data-dg-filter], [data-dg-columns]")) return;
                this.closePopover();
            });

            const search = this.scope.querySelector("[data-dg-search]");
            if (search) {
                let timer;
                search.addEventListener("input", () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => this.reload(), 250);
                });
            }

            // Show the full cell text as a native tooltip, but only while hovering a cell whose
            // content is actually clipped by the ellipsis (so short cells get no redundant tooltip).
            this.viewport?.addEventListener("mouseover", event => {
                const el = event.target.closest(".dg-row .form-control");
                if (!el) return;
                if (el.scrollWidth > el.clientWidth + 1) {
                    const text = el.tagName === "INPUT" ? el.value : (el.textContent || "").trim();
                    if (text && el.getAttribute("title") !== text) el.setAttribute("title", text);
                } else if (el.hasAttribute("title")) {
                    el.removeAttribute("title");
                }
            });

            this.columns.forEach(column => this.addResizeHandle(column));
            let resizeTimer;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => this.applyLayout(), 80);
            });
        }

        observe() {
            if (!this.sentinel || !this.loadUrl) return;

            this.observer = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) this.loadMore();
            }, { root: this.viewport, rootMargin: "240px" });

            this.observer.observe(this.sentinel);
        }

        async loadMore(reset) {
            if (!this.loadUrl) return;
            if (!reset && (this.loading || this.ended)) return;

            // A reset (new filter/sort/search) supersedes whatever is in flight.
            if (reset && this.controller) this.controller.abort();

            const controller = new AbortController();
            this.controller = controller;
            this.loading = true;
            this.root.classList.add("dg-loading");
            this.root.classList.remove("dg-error");

            if (reset) {
                this.offset = 0;
                this.ended = false;
                this.body.replaceChildren();
                this.root.classList.remove("dg-ended", "dg-empty");
            }

            const search = this.scope.querySelector("[data-dg-search]");
            const url = new URL(this.loadUrl, location.origin);
            url.searchParams.set("offset", this.offset);
            url.searchParams.set("limit", this.pageSize);
            url.searchParams.set("filters", JSON.stringify(this.filters));
            url.searchParams.set("sorts", JSON.stringify(this.sorts));
            if (search && search.value.trim()) url.searchParams.set("search", search.value.trim());

            try {
                const response = await fetch(url, { credentials: "same-origin", signal: controller.signal });
                if (!response.ok) throw new Error(`Grid request failed (${response.status})`);
                const html = await response.text();
                if (this.controller !== controller) return; // superseded while streaming

                const template = document.createElement("template");
                template.innerHTML = html.trim();
                const rows = Array.from(template.content.querySelectorAll(".dg-row"));

                rows.forEach(row => {
                    this.body.appendChild(row);
                    this.restoreSelection(row);
                });
                this.offset += rows.length;

                if (rows.length < this.pageSize) {
                    this.ended = true;
                    this.root.classList.add("dg-ended");
                    this.root.classList.toggle("dg-empty", this.offset === 0);
                }

                if (rows.length > 0) {
                    this.applyLayout();
                    // Newly streamed element rows of an already-folded parent stay hidden.
                    this.applyArrayCollapse();
                }

                const total = Number(response.headers.get("X-Total-Count"));
                this.updateTotal(Number.isFinite(total) ? total : null);

                this.root.dispatchEvent(new CustomEvent("dg:loaded", {
                    detail: { offset: this.offset, count: rows.length, total: Number.isFinite(total) ? total : null }
                }));
            } catch (error) {
                if (error.name === "AbortError") return;
                this.root.classList.add("dg-error");
                console.error(error);
            } finally {
                if (this.controller === controller) {
                    this.loading = false;
                    this.root.classList.remove("dg-loading");
                }
            }
        }

        reload() {
            this.renderChips();
            this.updateSortIndicators();
            this.loadMore(true);
        }

        hasActiveFilters() {
            const search = this.scope.querySelector("[data-dg-search]");
            return Object.keys(this.filters).length > 0 || Boolean(search && search.value.trim());
        }

        updateTotal(total) {
            if (total !== null) {
                const target = this.scope.querySelector("[data-dg-total]");
                if (target) target.textContent = total;
            }

            const filtered = this.scope.querySelector("[data-dg-filtered]");
            if (filtered) filtered.hidden = !this.hasActiveFilters();
        }

        restoreSelection(row) {
            const selectedIds = window._allSelectedIds;
            if (!(selectedIds instanceof Set) || !this.selectClass) return;
            const checkbox = row.querySelector("." + CSS.escape(this.selectClass));
            if (!checkbox) return;
            checkbox.checked = selectedIds.has(Number(row.dataset.rowId));
        }

        toggleSort(key, append) {
            const existing = this.sorts.find(sort => sort.column === key);
            if (!append) this.sorts = existing ? [existing] : [];

            if (!existing) {
                this.sorts.push({ column: key, descending: false });
            } else if (!existing.descending) {
                existing.descending = true;
            } else {
                this.sorts = this.sorts.filter(sort => sort.column !== key);
            }

            this.reload();
        }

        updateSortIndicators() {
            this.header.querySelectorAll("[data-dg-sort]").forEach(button => {
                const index = this.sorts.findIndex(sort => sort.column === button.dataset.dgSort);
                button.dataset.direction = index < 0 ? "" : (this.sorts[index].descending ? "desc" : "asc");
                button.dataset.sortIndex = index < 0 || this.sorts.length < 2 ? "" : String(index + 1);
            });
        }

        filterInput(column, value) {
            if (column && column.filterType === "bool") {
                const select = document.createElement("select");
                select.className = "form-control";
                [["", this.t("All")], ["true", this.t("Yes")], ["false", this.t("No")]].forEach(([optionValue, label]) => {
                    const option = document.createElement("option");
                    option.value = optionValue;
                    option.textContent = label;
                    if (optionValue === value) option.selected = true;
                    select.appendChild(option);
                });
                return select;
            }

            const input = document.createElement("input");
            input.className = "form-control";
            input.autocomplete = "off";
            input.value = value;
            if (column && column.filterType === "number") {
                input.type = "number";
                input.step = "any";
            }
            return input;
        }

        openFilter(key, anchor) {
            this.closePopover();
            const column = this.columns.find(item => item.key === key);
            const popover = document.createElement("form");
            popover.className = "dg-popover";

            const label = document.createElement("label");
            label.textContent = this.columnLabel(column, key);
            const field = this.filterInput(column, this.filters[key] || "");
            const buttons = document.createElement("div");
            const apply = document.createElement("button");
            apply.className = "btn";
            apply.type = "submit";
            apply.textContent = this.t("Apply");
            const clear = document.createElement("button");
            clear.className = "btn";
            clear.type = "button";
            clear.textContent = this.t("Clear");
            buttons.append(apply, clear);
            popover.append(label, field, buttons);

            document.body.appendChild(popover);
            this.positionPopover(popover, anchor);
            field.focus();

            popover.addEventListener("submit", event => {
                event.preventDefault();
                const value = field.value.trim();
                if (value) this.filters[key] = value; else delete this.filters[key];
                this.closePopover();
                this.reload();
            });
            clear.addEventListener("click", () => {
                delete this.filters[key];
                this.closePopover();
                this.reload();
            });
            this.popover = popover;
        }

        openColumnManager(anchor) {
            this.closePopover();
            const popover = document.createElement("div");
            popover.className = "dg-popover dg-column-manager";
            const list = document.createElement("div");
            list.className = "dg-column-list";

            this.pinActionsColumn();
            this.columns.forEach(column => {
                // Actions is pinned; the other fixed utility columns are anchored in place
                // (no drag handle, not draggable) to match their locked width.
                const anchored = column.key === "Actions" || this.isFixed(column);
                // A <div>, not a <label>: a <label> wrapping the checkbox swallows the native
                // drag gesture (the pointerdown is delegated to the control), which is why
                // column reordering did nothing. Clicking the label text still toggles below.
                const item = document.createElement("div");
                item.className = "dg-column-option";
                if (anchored) item.classList.add("dg-column-anchored");
                item.draggable = !anchored;
                item.dataset.column = column.key;

                const handle = document.createElement("span");
                handle.className = "dg-drag-handle";
                handle.textContent = anchored ? "" : "⋮⋮";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = column.visible;
                checkbox.disabled = column.key === "Actions";
                const text = document.createElement("span");
                text.className = "dg-column-label";
                text.textContent = this.columnLabel(column);
                item.append(handle, checkbox, text);

                checkbox.addEventListener("change", () => {
                    column.visible = checkbox.checked;
                    this.saveLayout();
                    this.applyLayout();
                });
                text.addEventListener("click", () => {
                    if (checkbox.disabled) return;
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event("change"));
                });
                if (!anchored) {
                    item.addEventListener("dragstart", () => item.classList.add("dragging"));
                    item.addEventListener("dragend", () => {
                        item.classList.remove("dragging");
                        this.columns = Array.from(list.children).map(child => this.columns.find(col => col.key === child.dataset.column));
                        this.pinActionsColumn();
                        this.saveLayout();
                        this.applyLayout();
                    });
                }
                list.appendChild(item);
            });

            list.addEventListener("dragover", event => {
                event.preventDefault();
                const dragging = list.querySelector(".dragging");
                const target = event.target.closest(".dg-column-option:not(.dragging)");
                if (!dragging || !target) return;
                if (target.dataset.column === "Actions") {
                    list.insertBefore(dragging, target);
                    return;
                }
                list.insertBefore(dragging, event.clientY < target.getBoundingClientRect().top + target.offsetHeight / 2 ? target : target.nextSibling);
            });

            const reset = document.createElement("button");
            reset.type = "button";
            reset.className = "btn";
            reset.textContent = this.t("ResetColumns");
            reset.addEventListener("click", () => {
                localStorage.removeItem(this.storageKey());
                this.columns.forEach(column => {
                    column.visible = column.key === "Actions" || column.defaultVisible;
                    column.width = Number(column.cell.dataset.width) || column.width;
                });
                this.pinActionsColumn();
                this.closePopover();
                this.applyLayout();
            });
            popover.append(list, reset);
            document.body.appendChild(popover);
            this.positionPopover(popover, anchor);
            this.popover = popover;
        }

        isFixed(column) {
            return FIXED_COLUMN_KEYS.has(column.key);
        }

        // Drag a column header sideways to reorder it. Pointer events (not native HTML5 drag)
        // because the header cell is filled by the sort <button>, which swallows a native drag
        // gesture the same way the column-manager <label> did. A movement threshold keeps a plain
        // click on the sort/filter buttons working; a real drag is swallowed so it never sorts.
        bindHeaderReorder() {
            const threshold = 5;
            this.columns.forEach(column => {
                if (column.key === "Actions" || this.isFixed(column)) return; // anchored columns don't move
                const cell = column.cell;
                cell.classList.add("dg-reorderable");
                cell.addEventListener("pointerdown", event => {
                    if (event.button !== 0) return;
                    // The resize handle stops propagation already; skip the filter button so it still opens.
                    if (event.target.closest("[data-dg-filter]")) return;
                    const startX = event.clientX;
                    const startY = event.clientY;
                    const pointerId = event.pointerId;
                    let dragging = false;
                    let target = null; // { key, after }

                    const clearMarkers = () => this.header
                        .querySelectorAll(".dg-drop-before, .dg-drop-after")
                        .forEach(node => node.classList.remove("dg-drop-before", "dg-drop-after"));

                    const move = moveEvent => {
                        if (moveEvent.pointerId !== pointerId) return;
                        if (!dragging) {
                            if (Math.abs(moveEvent.clientX - startX) < threshold && Math.abs(moveEvent.clientY - startY) < threshold) return;
                            dragging = true;
                            cell.classList.add("dg-col-dragging");
                            this.root.classList.add("dg-col-reordering");
                        }
                        const under = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
                        const targetCell = under && under.closest(".dg-header [data-column]");
                        clearMarkers();
                        if (targetCell && targetCell !== cell) {
                            const rect = targetCell.getBoundingClientRect();
                            const after = moveEvent.clientX > rect.left + rect.width / 2;
                            targetCell.classList.add(after ? "dg-drop-after" : "dg-drop-before");
                            target = { key: targetCell.dataset.column, after };
                        } else {
                            target = null;
                        }
                    };

                    const up = upEvent => {
                        if (upEvent.pointerId !== pointerId) return;
                        document.removeEventListener("pointermove", move);
                        document.removeEventListener("pointerup", up);
                        document.removeEventListener("pointercancel", up);
                        cell.classList.remove("dg-col-dragging");
                        this.root.classList.remove("dg-col-reordering");
                        clearMarkers();
                        if (dragging && target) {
                            this.reorderColumn(column.key, target.key, target.after);
                        }
                        if (dragging) {
                            // Swallow the click that fires after the drag so it does not trigger a sort.
                            this.header.addEventListener("click", swallow => {
                                swallow.stopPropagation();
                                swallow.preventDefault();
                            }, { capture: true, once: true });
                        }
                    };

                    document.addEventListener("pointermove", move);
                    document.addEventListener("pointerup", up);
                    document.addEventListener("pointercancel", up);
                });
            });
        }

        reorderColumn(sourceKey, targetKey, after) {
            if (sourceKey === targetKey) return;
            const source = this.columns.find(column => column.key === sourceKey);
            const target = this.columns.find(column => column.key === targetKey);
            if (!source || !target) return;
            this.columns = this.columns.filter(column => column !== source);
            const index = this.columns.indexOf(target);
            this.columns.splice(after ? index + 1 : index, 0, source);
            this.pinActionsColumn();
            this.saveLayout();
            this.applyLayout();
        }

        addResizeHandle(column) {
            if (this.isFixed(column)) return; // fixed utility columns are not resizable
            if (column.cell.querySelector(".dg-resize")) return;
            const handle = document.createElement("span");
            handle.className = "dg-resize";
            handle.addEventListener("pointerdown", event => {
                event.preventDefault();
                event.stopPropagation();
                const startX = event.clientX;
                const startWidth = column.width;
                const pointerId = event.pointerId;
                this.root.classList.add("dg-resizing");
                handle.classList.add("dg-resize-active");
                const move = moveEvent => {
                    if (moveEvent.pointerId !== pointerId) return;
                    column.width = Math.max(column.minWidth, startWidth + moveEvent.clientX - startX);
                    this.applyColumnTemplate();
                };
                const up = upEvent => {
                    if (upEvent.pointerId !== pointerId) return;
                    document.removeEventListener("pointermove", move);
                    document.removeEventListener("pointerup", up);
                    document.removeEventListener("pointercancel", up);
                    this.root.classList.remove("dg-resizing");
                    handle.classList.remove("dg-resize-active");
                    this.applyLayout();
                    this.saveLayout();
                };
                document.addEventListener("pointermove", move);
                document.addEventListener("pointerup", up);
                document.addEventListener("pointercancel", up);
            });
            column.cell.appendChild(handle);
        }

        applyColumnTemplate() {
            this.pinActionsColumn();
            const visible = this.columns.filter(column => column.visible && !this.isResponsiveHidden(column));
            // The flexible (1fr) column is the last visible column that is NOT a fixed utility column,
            // so Actions/checkboxes/runtime cells keep their natural width and a content column absorbs
            // the slack. Fall back to the last column if every visible column is fixed.
            let flexIndex = -1;
            for (let i = visible.length - 1; i >= 0; i--) {
                if (!this.isFixed(visible[i])) { flexIndex = i; break; }
            }
            if (flexIndex === -1) { flexIndex = visible.length - 1; }
            const template = visible.map((column, index) =>
                index === flexIndex ? `minmax(${column.width}px, 1fr)` : `${column.width}px`
            ).join(" ");
            this.root.style.setProperty("--dg-columns", template);
        }

        applyLayout() {
            const visible = this.columns.filter(column => column.visible && !this.isResponsiveHidden(column));
            this.applyColumnTemplate();

            [this.header, ...this.body.querySelectorAll(".dg-row")].forEach(row => {
                this.columns.forEach(column => {
                    const cell = row.querySelector(`[data-column="${CSS.escape(column.key)}"]`);
                    if (!cell) return;
                    cell.hidden = !visible.includes(column);
                    cell.classList.toggle("dg-last-visible", column === visible.at(-1));
                    row.appendChild(cell);
                });
            });
        }

        isResponsiveHidden(column) {
            if (column.priority === "core") return false;
            if (innerWidth <= 520) return true;
            if (innerWidth <= 700) return column.priority === "low" || column.priority === "medium";
            if (innerWidth <= 960) return column.priority === "low";
            return false;
        }

        renderChips() {
            if (!this.chips) return;
            this.chips.replaceChildren();
            Object.entries(this.filters).forEach(([key, value]) => {
                const column = this.columns.find(item => item.key === key);
                let display = value;
                if (column && column.filterType === "bool") {
                    display = value === "true" ? this.t("Yes") : this.t("No");
                }
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "dg-chip";
                chip.dataset.dgRemoveFilter = key;
                chip.textContent = `${this.columnLabel(column, key)}: ${display} `;
                const close = document.createElement("span");
                close.textContent = "×";
                chip.appendChild(close);
                this.chips.appendChild(chip);
            });

            if (Object.keys(this.filters).length > 1) {
                const clear = document.createElement("button");
                clear.type = "button";
                clear.className = "dg-chip dg-clear-filters";
                clear.dataset.dgClearFilters = "true";
                clear.textContent = this.t("ClearAll");
                this.chips.appendChild(clear);
            }
        }

        restoreLayout() {
            try {
                const saved = JSON.parse(localStorage.getItem(this.storageKey()));
                if (!Array.isArray(saved)) return;
                const declared = this.columns;                       // markup/declared order
                const map = new Map(declared.map(column => [column.key, column]));
                const restored = saved.map(item => {
                    const column = map.get(item.key);
                    if (!column) return null;
                    column.visible = item.visible !== false;
                    column.width = Math.max(column.minWidth, Number(item.width) || column.width);
                    map.delete(item.key);
                    return column;
                }).filter(Boolean);
                // Columns present in the markup but missing from the saved layout (e.g. a column
                // added in a later release) are inserted at their declared position instead of being
                // appended at the end, so a new default-visible column keeps the place the page gave
                // it (e.g. Simulation before the fixed Status column) rather than landing past the
                // non-movable runtime columns where it cannot be dragged back.
                map.forEach(column => {
                    const declaredIndex = declared.indexOf(column);
                    let insertAt = restored.length;
                    for (let i = 0; i < restored.length; i++) {
                        if (declared.indexOf(restored[i]) > declaredIndex) { insertAt = i; break; }
                    }
                    restored.splice(insertAt, 0, column);
                });
                this.columns = restored;
            } catch { }
        }

        pinActionsColumn() {
            const actions = this.columns.find(column => column.key === "Actions");
            if (!actions) return;
            actions.visible = true;
            this.columns = this.columns.filter(column => column !== actions).concat(actions);
        }

        saveLayout() {
            localStorage.setItem(this.storageKey(), JSON.stringify(this.columns.map(column => ({ key: column.key, visible: column.visible, width: column.width }))));
        }

        storageKey() {
            return `envision.grid.${this.key}`;
        }

        positionPopover(popover, anchor) {
            const rect = anchor.getBoundingClientRect();
            popover.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - popover.offsetWidth - 12))}px`;
            popover.style.top = `${Math.max(12, Math.min(rect.bottom + 6, innerHeight - popover.offsetHeight - 12))}px`;
        }

        closePopover() {
            this.popover?.remove();
            this.popover = null;
        }
    }

    function initialize(root) {
        if (!root.dataset.dgReady) {
            root.dataset.dgReady = "true";
            root.dataGrid = new DataGrid(root);
        }
    }

    document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-grid]").forEach(initialize));
    window.EnvisionDataGrid = { initialize };

    // Refreshes the grid after a save that touched a variable-array parent. A parent save fans
    // out to element rows the callers' in-place row sync cannot reflect: a resize adds or
    // removes rows, a rename or re-address rewrites every element. Called by EntityModal's
    // edit path and by the pages' inline cell-edit handlers; a no-op for ordinary rows.
    window.DataGridArrayRefresh = function (rowId, arrayCount) {
        var isParent = Number(arrayCount) >= 2;
        var hadElements = !!document.querySelector('.dg-row[data-array-parent="' + rowId + '"]');
        if (!isParent && !hadElements) return;

        var section = document.querySelector("[data-grid]");
        if (section && section.dataGrid && typeof section.dataGrid.reload === "function") section.dataGrid.reload();
        else location.reload();
    };

    // Ungroup row action for a variable array's parent row (the array's first element): the
    // one-way exit that releases the element rows as independent variables. Global rather than
    // grid-instance state because it is a config write followed by a page reload, shared by
    // every variable page. The endpoint keeps parity with the UDT Detach semantics.
    window.DataGridUngroupArray = function (deviceType, id) {
        const translations = window.DataGridTranslations || {};
        if (!confirm(translations.VariableArrayUngroupConfirm || "All element rows of this array become independent variables. This cannot be regrouped automatically. Continue?")) return;

        fetch("/API/Config/VariableArrays/Ungroup", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceType: deviceType, id: Number(id) })
        })
            .then(response => response.json())
            .then(data => {
                if (data && data.success) {
                    location.reload();
                    return;
                }
                alert((data && (data.error || (data.errors || []).map(e => e.message || e).join("\n"))) || translations.ErrorOccurredPleaseTryAgain || "Error");
            })
            .catch(() => alert(translations.ErrorOccurredPleaseTryAgain || "Error"));
    };
})();
