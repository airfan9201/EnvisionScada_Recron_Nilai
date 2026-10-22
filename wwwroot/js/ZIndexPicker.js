// ---- Z-Index Picker Modal -----------------------------------------
// This script does NOT touch existing z-index sidebar code.
// It only reads from the DOM and window.LayerSettings.

const DEFAULT_COLOR = "#fff";

(function () {

    function loadZIndexMetadataForPicker() {
        // Same contract as your existing LayerSettings usage, but we don't touch that code.
        if (typeof window.LayerSettings === "string") {
            try {
                window.LayerSettings = JSON.parse(window.LayerSettings);
            } catch (err) {
                console.warn("LayerSettings JSON parse failed in picker:", err);
                window.LayerSettings = {};
            }
        }
        return window.LayerSettings || {};
    }

    function saveZIndexMetadataForPicker(metadata) {
        // Update the global store so sidebar/editor sees it too
        window.LayerSettings = metadata || {};

        // Notify backend, same as the main editor does
        if (typeof UpdateLayerSettings === "function") {
            try {
                UpdateLayerSettings(window.LayerSettings);
            } catch (err) {
                console.error("UpdateLayerSettings failed from picker:", err);
            }
        }
    }

    function collectZIndexLayersForPicker() {
        const envisionPage = document.getElementById("EnvisionPage");
        const layerMap = new Map();

        if (!envisionPage) {
            console.warn("ZIndex picker: #EnvisionPage not found.");
            return layerMap;
        }

        // Same selector as your main code
        const allElems = envisionPage.querySelectorAll(".draggable");

        allElems.forEach(el => {
            const computed = window.getComputedStyle(el);
            const z = computed.zIndex;

            if (!z || z === "auto") return;
            if (isNaN(parseInt(z, 10))) return;

            if (!layerMap.has(z)) {
                layerMap.set(z, []);
            }
            layerMap.get(z).push(el);
        });

        return layerMap;
    }

    function buildZIndexPickerTable() {
        const modalEl = document.getElementById("ZIndexPickerModal");
        if (!modalEl) return;

        const tableBody = modalEl.querySelector("#zIndexPickerTable tbody");
        if (!tableBody) return;

        // Clear current rows
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }

        const layerMap = collectZIndexLayersForPicker();
        const metadata = loadZIndexMetadataForPicker() || {};

        const layerKeysFromDom = Array.from(layerMap.keys());
        const layerKeysFromMeta = Object.keys(metadata);
        const allKeysSet = new Set([...layerKeysFromDom, ...layerKeysFromMeta]);

        if (allKeysSet.size === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 5; // Z, Color, Name, Actions, Count
            td.className = "text-center text-muted";
            td.textContent = "No explicit z-index values found.";
            tr.appendChild(td);
            tableBody.appendChild(tr);
            return;
        }

        const sortedLayers = Array.from(allKeysSet)
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

        sortedLayers.forEach(layer => {
            const elems = layerMap.get(layer) || [];
            const count = elems.length;
            const meta = metadata[layer] || {};
            const isGhost = !layerMap.has(layer); // only in LayerSettings

            const tr = document.createElement("tr");
            tr.dataset.layer = layer;

            if (isGhost) {
                tr.classList.add("ghost-layer");
            }

            // Z-index
            const tdLayer = document.createElement("td");
            tdLayer.textContent = layer;
            tdLayer.className = "fw-bold";
            tr.appendChild(tdLayer);

            // Color (editable)
            const tdColor = document.createElement("td");
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "zindex-picker-color-input";
            colorInput.value = meta.color || DEFAULT_COLOR;
            colorInput.dataset.layer = layer;
            colorInput.title = "Highlight color";
            tdColor.appendChild(colorInput);
            tr.appendChild(tdColor);

            // Name (editable)
            const tdName = document.createElement("td");
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.className = "form-control form-control-sm zindex-picker-name-input";
            nameInput.placeholder = "Unnamed layer";
            nameInput.value = meta.name || "";
            nameInput.dataset.layer = layer;
            tdName.appendChild(nameInput);
            tr.appendChild(tdName);

            // 🔹 Actions column (delete button for ghost layers)
            const tdActions = document.createElement("td");
            tdActions.className = "text-center";
            tdActions.style.width = "1%"; // small column
            tdActions.style.whiteSpace = "nowrap";

            if (isGhost) {
                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "btn btn-sm btn-outline-secondary zindex-picker-delete-layer-btn";
                deleteBtn.dataset.layer = layer;
                deleteBtn.title = "Delete unused layer";
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                tdActions.appendChild(deleteBtn);
            }

            tr.appendChild(tdActions);

            // Count
            const tdCount = document.createElement("td");
            tdCount.textContent = "#" + count;
            tdCount.className = "text-center";
            tr.appendChild(tdCount);

            tableBody.appendChild(tr);
        });
    }

    /**
     * Public function:
     *   showZIndexLayerPicker().then(layer => {... });
     * Resolves with the chosen z-index (string) or null if cancelled.
     */
    window.showZIndexLayerPicker = function () {
        return new Promise((resolve) => {
            const modalEl = document.getElementById("ZIndexPickerModal");
            if (!modalEl || typeof bootstrap === "undefined") {
                console.warn("ZIndex picker: modal or Bootstrap not available.");
                resolve(null);
                return;
            }

            buildZIndexPickerTable();

            const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
            let chosenLayer = null;

            const tableBody = modalEl.querySelector("#zIndexPickerTable tbody");

            function onRowClick(e) {
                const target = e.target;
                if (!(target instanceof HTMLElement)) return;

                // 🔹 Handle delete button for ghost/unused layers
                const deleteBtn = target.closest(".zindex-picker-delete-layer-btn");
                if (deleteBtn) {
                    const layer = deleteBtn.dataset.layer;
                    if (!layer) return;

                    const confirmed = window.confirm(
                        "Are you sure? The layer might be used on other pages."
                    );
                    if (!confirmed) {
                        return;
                    }

                    const metadata = loadZIndexMetadataForPicker();
                    delete metadata[layer];
                    saveZIndexMetadataForPicker(metadata);

                    // Rebuild the table so the deleted row disappears
                    buildZIndexPickerTable();
                    return; // Don't close the modal or select a layer
                }

                // ✅ Don't select layer when interacting with inputs (name/color)
                if (target.closest("input")) {
                    return;
                }

                const row = target.closest("tr[data-layer]");
                if (!row) return;

                chosenLayer = row.dataset.layer;
                bsModal.hide(); // triggers hidden.bs.modal
            }

            function onChange(e) {
                const target = e.target;
                if (!(target instanceof HTMLInputElement)) return;

                const layer = target.dataset.layer;
                if (!layer) return;

                const metadata = loadZIndexMetadataForPicker();
                metadata[layer] = metadata[layer] || {};

                if (target.type === "text") {
                    metadata[layer].name = target.value.trim();
                } else if (target.type === "color") {
                    metadata[layer].color = target.value || DEFAULT_COLOR;
                }

                saveZIndexMetadataForPicker(metadata);
            }

            function onHidden() {
                modalEl.removeEventListener("hidden.bs.modal", onHidden);
                if (tableBody) {
                    tableBody.removeEventListener("click", onRowClick);
                    tableBody.removeEventListener("change", onChange);
                }
                resolve(chosenLayer);
            }

            if (tableBody) {
                tableBody.addEventListener("click", onRowClick);
                tableBody.addEventListener("change", onChange);
            }

            modalEl.addEventListener("hidden.bs.modal", onHidden);

            bsModal.show();
        });
    };

    // ---- Picker Export / Import JSON -----------------------------

    function exportPickerMetadata() {
        const data = loadZIndexMetadataForPicker();
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

    function importPickerMetadataFromFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target.result;
                const data = JSON.parse(text);

                if (data && typeof data === "object") {
                    // Save to global LayerSettings so sidebar + picker see it
                    saveZIndexMetadataForPicker(data);

                    // Rebuild picker table so changes are visible immediately
                    buildZIndexPickerTable();
                } else {
                    console.error("Invalid JSON structure for z-index metadata (picker).");
                }
            } catch (err) {
                console.error("Failed to import z-index metadata in picker:", err);
            } finally {
                const input = document.getElementById("zIndexPickerImportFile");
                if (input) input.value = "";
            }
        };
        reader.readAsText(file);
    }

    function wirePickerImportExport() {
        const importBtn = document.getElementById("zIndexPickerImportBtn");
        const exportBtn = document.getElementById("zIndexPickerExportBtn");
        const fileInput = document.getElementById("zIndexPickerImportFile");

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                exportPickerMetadata();
            });
        }

        if (importBtn && fileInput) {
            importBtn.addEventListener("click", () => {
                fileInput.click();
            });

            fileInput.addEventListener("change", (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    importPickerMetadataFromFile(file);
                }
            });
        }
    }

    // Ensure DOM is ready before wiring buttons
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", wirePickerImportExport);
    } else {
        wirePickerImportExport();
    }

    // ---- Add new ghost layer from picker --------------------------------

    function addNewZIndexLayerFromPicker() {
        const raw = window.prompt("Enter z-index (integer) for the new layer:");
        if (raw === null) {
            // user pressed Cancel
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
        const metadata = loadZIndexMetadataForPicker();
        const layerMap = collectZIndexLayersForPicker();

        // If it already exists either in DOM or metadata, abort
        if (layerMap.has(layerKey) || Object.prototype.hasOwnProperty.call(metadata, layerKey)) {
            alert("A layer with z-index " + layerKey + " already exists.");
            return;
        }

        // Create ghost layer with default settings
        metadata[layerKey] = {
            name: "",
            color: DEFAULT_COLOR
        };

        // Persist + notify backend + refresh table
        saveZIndexMetadataForPicker(metadata);
        buildZIndexPickerTable();
    }

    // Hook up the Add button when DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        const addBtn = document.getElementById("zIndexPickerAddBtn");
        if (addBtn) {
            addBtn.addEventListener("click", addNewZIndexLayerFromPicker);
        }
    });

})();

// ---- Public helper used by your context UI -----------------------------

async function SelectZIndexLayer(btn) {
    // Open the picker and wait for user selection
    const selectedLayer = await showZIndexLayerPicker();

    if (!selectedLayer) {
        //console.log("User cancelled z-index picker.");
        return;
    }

    //console.log("User selected z-index:", selectedLayer);

    // Set the result into the Z-index config input
    const input = document.getElementById("StyleFormatContextzIndex");
    const name = document.getElementById('StyleFormatContextzIndexInfo');
    const color = document.getElementById('StyleFormatContextzIndexInfoColor');

    if (input) {
        input.value = selectedLayer;
        name.innerText = getLayerNameFromZIndex(selectedLayer);
        color.style.backgroundColor = getLayerColorFromZIndex(selectedLayer);

        // Trigger your existing input handler if needed
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }
}
function getLayerNameFromZIndex(z) {

    // Make sure LayerSettings exists
    if (!window.LayerSettings) return "";

    // If LayerSettings is a JSON string, parse it
    if (typeof window.LayerSettings === "string") {
        try {
            window.LayerSettings = JSON.parse(window.LayerSettings);
        } catch (err) {
            console.warn("LayerSettings JSON parse failed in getLayerNameFromZIndex");
            return "";
        }
    }

    const meta = window.LayerSettings[z];

    return meta && typeof meta.name === "string" && meta.name.trim() !== ""
        ? meta.name
        : "";
}

function getLayerColorFromZIndex(z) {

    // Make sure LayerSettings exists
    if (!window.LayerSettings) return "";

    // If LayerSettings is a JSON string, parse it
    if (typeof window.LayerSettings === "string") {
        try {
            window.LayerSettings = JSON.parse(window.LayerSettings);
        } catch (err) {
            console.warn("LayerSettings JSON parse failed in getLayerColorFromZIndex");
            return "";
        }
    }

    const meta = window.LayerSettings[z];

    return meta && typeof meta.color === "string" && meta.color.trim() !== ""
        ? meta.color
        : "#fff";
}