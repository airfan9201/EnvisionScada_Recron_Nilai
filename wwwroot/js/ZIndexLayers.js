// ---- Global API: callable from anywhere -------------------------------
// Usage: SetLayerVisibility(layer, hide)
(function () {
    // internal registered context (when sidebar is present)
    let _ctx = null;

    function _doSetLayerVisibility(envisionPage, tableBody, hiddenLayers, layer, hide) {
        if (!envisionPage) return;

        const layerKey = String(layer);

        const allElems = envisionPage.querySelectorAll("*");
        allElems.forEach(el => {
            const z = window.getComputedStyle(el).zIndex;

            if (z === layerKey) {
                if (hide) {
                    if (el.dataset.zindexOriginalDisplay === undefined) {
                        el.dataset.zindexOriginalDisplay = el.style.display || "";
                    }
                    el.style.display = "none";
                } else {
                    if (el.dataset.zindexOriginalDisplay !== undefined) {
                        el.style.display = el.dataset.zindexOriginalDisplay;
                    } else {
                        el.style.display = "";
                    }
                }
            }
        });

        // track hidden layers if we have a Set
        if (hiddenLayers instanceof Set) {
            if (hide) hiddenLayers.add(layerKey);
            else hiddenLayers.delete(layerKey);
        }

        // update sidebar buttons if table exists
        if (tableBody) {
            const row = tableBody.querySelector(`tr[data-layer="${layerKey}"]`);
            if (row) {
                const hideBtn = row.querySelector(".zindex-hide-btn");
                const showBtn = row.querySelector(".zindex-show-btn");
                if (hideBtn && showBtn) {
                    if (hide) {
                        hideBtn.classList.add("active");
                        showBtn.classList.remove("active");
                    } else {
                        hideBtn.classList.remove("active");
                        showBtn.classList.add("active");
                    }
                }
            }
        }
    }

    // This is what you call from anywhere
    window.SetLayerVisibility = function (layer, hide) {
        // Prefer registered context (keeps hiddenLayers + updates table buttons)
        if (_ctx && _ctx.envisionPage) {
            _doSetLayerVisibility(_ctx.envisionPage, _ctx.tableBody, _ctx.hiddenLayers, layer, !!hide);
            return;
        }

        // Fallback: operate directly on DOM even if sidebar isn't initialized
        const envisionPage = document.getElementById("EnvisionPage");
        _doSetLayerVisibility(envisionPage, null, null, layer, !!hide);
    };

    window.SetLayerVisibilityByName = function (layerName, hide) {
        if (!layerName) return;

        let metadata = window.LayerSettings;

        // handle stringified JSON case
        if (typeof metadata === "string") {
            try {
                metadata = JSON.parse(metadata);
            } catch {
                return;
            }
        }

        if (!metadata || typeof metadata !== "object") return;

        const entry = Object.entries(metadata)
            .find(([_, v]) => v && v.name === layerName);

        if (!entry) {
            console.warn("Layer name not found:", layerName);
            return;
        }

        const layerKey = entry[0];
        window.SetLayerVisibility(layerKey, hide);
    };

    // Allow the sidebar module to register its context
    window.__ZIndexLayersRegister = function (ctx) {
        _ctx = ctx || null;
    };
})();

document.addEventListener("DOMContentLoaded", () => {

    const envisionPage = document.getElementById("EnvisionPage");
    const sidebarEl = document.getElementById("ZIndexLayersSidebar");
    const tableBody = document.getElementById("zIndexLayersTableBody");
    const exportButton = document.getElementById("zIndexExportBtn");
    const importButton = document.getElementById("zIndexImportBtn");
    const importFileInput = document.getElementById("zIndexImportFile");
    const clearHighlightsButton = document.getElementById("zIndexClearHighlightsBtn");
    const clearHidesButton = document.getElementById("zIndexClearHidesBtn");
    const toggleUnusedButton = document.getElementById("zIndexToggleUnusedBtn");

    if (!envisionPage || !sidebarEl || !tableBody) {
        console.warn("ZIndex sidebar: required elements not found.");
        return;
    }

    // Track which layers are currently hidden (actual DOM hides)
    const hiddenLayers = new Set();
    // Track which layers are "locked" (persistent highlight)
    const lockedLayers = new Set();
    // Current hover preview layer (non-persistent)
    let hoverLayer = null;

    // Register context so SetLayerVisibility updates hiddenLayers + table buttons
    window.__ZIndexLayersRegister({
        envisionPage,
        tableBody,
        hiddenLayers
    });

    // ---- LayerSettings helpers ------------------------------------------

    function loadZIndexMetadata() {
        if (typeof window.LayerSettings === "string") {
            try {
                window.LayerSettings = JSON.parse(window.LayerSettings);
            } catch (err) {
                console.warn("LayerSettings JSON parse failed, resetting.", err);
                window.LayerSettings = {};
            }
        }

        return window.LayerSettings || {};
    }

    function saveZIndexMetadata(data) {
        // Update the global store
        window.LayerSettings = data || {};

        // Notify backend
        if (typeof UpdateLayerSettings === "function") {
            try {
                UpdateLayerSettings(window.LayerSettings);
            } catch (err) {
                console.error("UpdateLayerSettings failed:", err);
            }
        }
    }

    // ---- Highlighting logic --------------------------------------------

    /**
     * Apply highlights for all locked layers + current hover layer.
     * Uses outline on the real elements; restores original outline when not highlighted.
     */
    function applyHighlights() {
        if (!envisionPage) return;

        const metadata = loadZIndexMetadata();
        const allElems = envisionPage.querySelectorAll("*");

        allElems.forEach(el => {
            const computed = window.getComputedStyle(el);
            const z = computed.zIndex;

            if (!z || z === "auto" || isNaN(parseInt(z, 10))) {
                // Restore any previously stored outlines if we shouldn't highlight this
                if (el.dataset.zindexOriginalOutline !== undefined) {
                    el.style.outline = el.dataset.zindexOriginalOutline;
                    el.style.outlineOffset = el.dataset.zindexOriginalOutlineOffset || "";
                    delete el.dataset.zindexOriginalOutline;
                    delete el.dataset.zindexOriginalOutlineOffset;
                }
                return;
            }

            const shouldHighlight =
                lockedLayers.has(z) || (hoverLayer !== null && hoverLayer === z);

            if (shouldHighlight) {
                if (el.dataset.zindexOriginalOutline === undefined) {
                    el.dataset.zindexOriginalOutline = el.style.outline || "";
                    el.dataset.zindexOriginalOutlineOffset = el.style.outlineOffset || "";
                }

                const meta = metadata[z] || {};
                const color = meta.color || "#fff";

                el.style.outline = `2px solid ${color}`;
                el.style.outlineOffset = "2px";
            } else {
                if (el.dataset.zindexOriginalOutline !== undefined) {
                    el.style.outline = el.dataset.zindexOriginalOutline;
                    el.style.outlineOffset = el.dataset.zindexOriginalOutlineOffset || "";
                    delete el.dataset.zindexOriginalOutline;
                    delete el.dataset.zindexOriginalOutlineOffset;
                }
            }
        });
    }

    /**
     * Clear only hover highlight (keep locked layers).
     */
    function clearHoverHighlight() {
        hoverLayer = null;
        applyHighlights();
    }

    /**
     * Completely remove all highlights (locked + hover) visually.
     * Does not touch LayerSettings, just restores outlines.
     * Optional 'page' parameter: if omitted, defaults to #EnvisionPage.
     */
    function removeAllZIndexHighlights(page) {
        const targetPage =
            page instanceof HTMLElement
                ? page
                : document.getElementById("EnvisionPage");

        if (!targetPage) return;

        const allElems = targetPage.querySelectorAll("*");

        allElems.forEach(el => {
            if (el.dataset.zindexOriginalOutline !== undefined) {
                el.style.outline = el.dataset.zindexOriginalOutline;
                el.style.outlineOffset = el.dataset.zindexOriginalOutlineOffset || "";

                delete el.dataset.zindexOriginalOutline;
                delete el.dataset.zindexOriginalOutlineOffset;
            }
        });

        // Also clear internal highlight state
        hoverLayer = null;
        lockedLayers.clear();

        // Clear locked row styling
        if (tableBody) {
            tableBody
                .querySelectorAll("tr.locked")
                .forEach(r => r.classList.remove("locked"));
        }
    }

    /**
     * Remove all artificial hides created by this tool.
     * Restores original display for any element we changed,
     * clears hiddenLayers, and updates buttons in the table.
     * Optional 'page' parameter: if omitted, defaults to #EnvisionPage.
     */
    function clearAllZIndexHides(page) {
        const targetPage =
            page instanceof HTMLElement
                ? page
                : document.getElementById("EnvisionPage");

        if (!targetPage) return;

        const allElems = targetPage.querySelectorAll("*");

        allElems.forEach(el => {
            if (el.dataset.zindexOriginalDisplay !== undefined) {
                el.style.display = el.dataset.zindexOriginalDisplay;
                delete el.dataset.zindexOriginalDisplay;
            }
        });

        // Clear our internal hidden tracking
        hiddenLayers.clear();

        // Update all rows' hide/show button states
        if (tableBody) {
            tableBody.querySelectorAll("tr[data-layer]").forEach(row => {
                const hideBtn = row.querySelector(".zindex-hide-btn");
                const showBtn = row.querySelector(".zindex-show-btn");
                if (hideBtn && showBtn) {
                    hideBtn.classList.remove("active");
                    showBtn.classList.add("active");
                }
            });
        }
    }

    // expose for any external usage if needed
    window.removeAllZIndexHighlights = removeAllZIndexHighlights;
    window.clearAllZIndexHides = clearAllZIndexHides;

    // ---- DOM scanning / grouping ---------------------------------------

    function collectZIndexLayers() {
        /** @type {Map<string, HTMLElement[]>} */
        const layerMap = new Map();

        const allElems = envisionPage.querySelectorAll(".draggable");

        allElems.forEach(el => {
            const computed = window.getComputedStyle(el);
            const z = computed.zIndex;

            // Skip auto / empty / non-numeric
            if (!z || z === "auto") return;
            if (isNaN(parseInt(z, 10))) return;

            if (!layerMap.has(z)) {
                layerMap.set(z, []);
            }
            layerMap.get(z).push(el);
        });

        return layerMap;
    }

    // ---- Table rendering -----------------------------------------------

    function clearTable() {
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
    }

    function buildTable() {
        const layerMap = collectZIndexLayers();              // actual DOM layers
        const metadata = loadZIndexMetadata() || {};         // LayerSettings from backend

        clearTable();

        // Build UNION of:
        //  - layers actually present on page
        //  - layers only in LayerSettings (ghost / unused)
        const layerKeysFromDom = Array.from(layerMap.keys());
        const layerKeysFromMeta = Object.keys(metadata);
        const allKeysSet = new Set([...layerKeysFromDom, ...layerKeysFromMeta]);

        if (allKeysSet.size === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 5;
            td.className = "text-center text-muted";
            td.textContent = "No explicit z-index values found inside #EnvisionPage.";
            tr.appendChild(td);
            tableBody.appendChild(tr);
            return;
        }

        const sortedLayers = Array.from(allKeysSet)
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

        sortedLayers.forEach(layer => {
            const elems = layerMap.get(layer) || [];
            const count = elems.length;
            const isHidden = hiddenLayers.has(layer);
            const meta = metadata[layer] || {};
            const isGhost = !layerMap.has(layer); // exists only in LayerSettings

            const tr = document.createElement("tr");
            tr.dataset.layer = layer;

            if (lockedLayers.has(layer)) {
                tr.classList.add("locked");
            }
            if (isGhost) {
                tr.classList.add("ghost-layer");
            }

            // Z-Index
            const tdLayer = document.createElement("td");
            tdLayer.textContent = layer;
            tdLayer.className = "fw-bold";
            tr.appendChild(tdLayer);

            // Name
            const tdName = document.createElement("td");
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.className = "form-control form-control-sm zindex-name-input";
            nameInput.placeholder = "Unnamed layer";
            nameInput.value = meta.name || "";
            nameInput.dataset.layer = layer;
            tdName.appendChild(nameInput);
            tr.appendChild(tdName);

            // Color
            const tdColor = document.createElement("td");
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            // only our custom class so CSS controls size
            colorInput.className = "zindex-color-input";
            colorInput.value = meta.color || "#fff";
            colorInput.dataset.layer = layer;
            colorInput.title = "Highlight color";
            tdColor.appendChild(colorInput);
            tr.appendChild(tdColor);

            // Count (ghost layers get #0)
            const tdCount = document.createElement("td");
            tdCount.textContent = `#${count}`;
            tdCount.className = "text-center";
            tr.appendChild(tdCount);

            // Actions (icon-only)
            const tdActions = document.createElement("td");
            tdActions.className = "text-center";

            // For real layers: show/hide buttons
            if (!isGhost) {
                const hideBtn = document.createElement("button");
                hideBtn.type = "button";
                hideBtn.className = "btn btn-sm btn-outline-danger me-1 zindex-hide-btn";
                hideBtn.dataset.layer = layer;
                hideBtn.title = "Hide layer";
                hideBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';

                const showBtn = document.createElement("button");
                showBtn.type = "button";
                showBtn.className = "btn btn-sm btn-outline-success me-1 zindex-show-btn";
                showBtn.dataset.layer = layer;
                showBtn.title = "Show layer";
                showBtn.innerHTML = '<i class="fas fa-eye"></i>';

                tdActions.appendChild(hideBtn);
                tdActions.appendChild(showBtn);

                // Reflect hide state ONLY when buttons exist
                if (isHidden) {
                    hideBtn.classList.add("active");
                } else {
                    showBtn.classList.add("active");
                }
            }

            // Delete button ONLY for ghost layers
            if (isGhost) {
                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "btn btn-sm btn-outline-secondary zindex-delete-layer-btn";
                deleteBtn.dataset.layer = layer;
                deleteBtn.title = "Delete unused layer";
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                tdActions.appendChild(deleteBtn);
            }

            tr.appendChild(tdActions);

            // Hover → temporary preview
            tr.addEventListener("mouseenter", () => {
                hoverLayer = layer;
                applyHighlights();
            });

            tr.addEventListener("mouseleave", () => {
                hoverLayer = null;
                applyHighlights();
            });

            // Click → toggle persistent lock for this layer
            tr.addEventListener("click", (e) => {
                const target = e.target;
                // Don't trigger on button or input clicks
                if (target instanceof HTMLElement &&
                    (target.closest("button") || target.closest("input"))) {
                    return;
                }

                if (lockedLayers.has(layer)) {
                    lockedLayers.delete(layer);
                    tr.classList.remove("locked");
                } else {
                    lockedLayers.add(layer);
                    tr.classList.add("locked");
                }
                applyHighlights();
            });

            tableBody.appendChild(tr);
        });
    }

    // ---- Event handlers: table (names, colors, hide/show/delete) -------

    // Save name + color edits
    tableBody.addEventListener("change", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        const layer = target.dataset.layer;
        if (!layer) return;

        const metadata = loadZIndexMetadata();
        metadata[layer] = metadata[layer] || {};

        if (target.type === "text") {
            metadata[layer].name = target.value.trim();
        } else if (target.type === "color") {
            metadata[layer].color = target.value;
        }

        saveZIndexMetadata(metadata);

        // If this layer is currently highlighted (locked or hover), reapply color
        if (lockedLayers.has(layer) || hoverLayer === layer) {
            applyHighlights();
        }
    });

    // Hide / show / delete via delegation
    tableBody.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;

        const hideBtn = target.closest(".zindex-hide-btn");
        const showBtn = target.closest(".zindex-show-btn");
        const deleteBtn = target.closest(".zindex-delete-layer-btn");

        if (hideBtn) {
            const layer = hideBtn.dataset.layer;
            if (layer) {
                SetLayerVisibility(layer, true);
            }
            return;
        }

        if (showBtn) {
            const layer = showBtn.dataset.layer;
            if (layer) {
                SetLayerVisibility(layer, false);
            }
            return;
        }

        if (deleteBtn) {
            const layer = deleteBtn.dataset.layer;
            if (layer) {
                // 🔔 Confirmation before deleting a (ghost) layer
                const confirmed = window.confirm("Are you sure? The layer might be used on other pages.");
                if (!confirmed) {
                    return;
                }

                const metadata = loadZIndexMetadata();
                // Remove from LayerSettings
                delete metadata[layer];
                saveZIndexMetadata(metadata);
                // Make sure it's not locked/hidden anymore
                lockedLayers.delete(layer);
                hiddenLayers.delete(layer);
                // Rebuild table so the ghost row disappears
                buildTable();
                applyHighlights();
            }
        }
    });

    // ---- Export / Import JSON ------------------------------------------

    function exportMetadata() {
        const data = loadZIndexMetadata();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "zindex-layers.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function importMetadataFromFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target.result;
                const data = JSON.parse(text);
                if (data && typeof data === "object") {
                    saveZIndexMetadata(data);
                    buildTable();
                    applyHighlights();
                } else {
                    console.error("Invalid JSON structure for z-index metadata.");
                }
            } catch (err) {
                console.error("Failed to import z-index metadata:", err);
            } finally {
                importFileInput.value = "";
            }
        };
        reader.readAsText(file);
    }

    if (exportButton) {
        exportButton.addEventListener("click", () => {
            exportMetadata();
        });
    }

    if (importButton && importFileInput) {
        importButton.addEventListener("click", () => {
            importFileInput.click();
        });

        importFileInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                importMetadataFromFile(file);
            }
        });
    }

    // Clear highlights button
    if (clearHighlightsButton) {
        clearHighlightsButton.addEventListener("click", () => {
            removeAllZIndexHighlights();
        });
    }

    // Clear all artificial hides button
    if (clearHidesButton) {
        clearHidesButton.addEventListener("click", () => {
            clearAllZIndexHides();
        });
    }

    // Toggle unused/ghost layers button — now disabled (ghosts are always shown)
    if (toggleUnusedButton) {
        toggleUnusedButton.title = "Unused layers are always shown";
        toggleUnusedButton.disabled = true;
        toggleUnusedButton.classList.add("disabled");
    }

    // ---- Lifecycle hooks ----------------------------------------------

    // When sidebar is opened, rebuild table and reapply any locked highlights
    sidebarEl.addEventListener("shown.bs.offcanvas", () => {
        buildTable();
        applyHighlights();
    });

    // When sidebar is closed, we leave highlights as-is (per your requirement)

    // ---- Add new ghost layer from sidebar -----------------------------

    function addNewZIndexLayer() {
        const raw = window.prompt("Enter z-index (integer) for the new layer:");
        if (raw === null) {
            // User pressed Cancel
            return;
        }

        const trimmed = raw.trim();
        if (!trimmed) {
            return;
        }

        const num = parseInt(trimmed, 10);
        if (isNaN(num)) {
            alert("Please enter a valid integer z-index value.");
            return;
        }

        const layerKey = String(num);

        // Get current metadata + DOM layers
        const metadata = loadZIndexMetadata();
        const layerMap = collectZIndexLayers();

        // If it already exists either in DOM or metadata, abort
        if (layerMap.has(layerKey) || Object.prototype.hasOwnProperty.call(metadata, layerKey)) {
            alert("A layer with z-index " + layerKey + " already exists.");
            return;
        }

        // Create ghost layer with default settings
        metadata[layerKey] = {
            name: "",
            color: "#ff0000" // same default as sidebar/editor
        };

        // Persist + notify backend
        saveZIndexMetadata(metadata);

        // Rebuild table so the new ghost layer shows up
        buildTable();
    }

    const addButton = document.getElementById("zIndexAddBtn");
    if (addButton) {
        addButton.addEventListener("click", addNewZIndexLayer);
    }

});

function closeZIndexLayersSidebar() {
    const sidebarEl = document.getElementById('ZIndexLayersSidebar');
    if (!sidebarEl) return;

    const offcanvas =
        bootstrap.Offcanvas.getInstance(sidebarEl) ||
        new bootstrap.Offcanvas(sidebarEl);

    offcanvas.hide();
}
