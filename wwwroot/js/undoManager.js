const DB_NAME = "EnvisionUndo";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";
const MAX_HISTORY = 100;

let currentOrder = -1;
let snapshotCount = 0;

indexedDB.deleteDatabase(DB_NAME);

saveSnapshot();

function openDB(callback) {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    };

    request.onsuccess = function () {
        callback(request.result);
    };

    request.onerror = function (event) {
        console.error("IndexedDB error:", event.target.errorCode);
    };
}

function saveSnapshot() {
    const html = document.getElementById("EnvisionPage").innerHTML;
    const label = "Snapshot @ " + new Date().toLocaleTimeString();
    const newOrder = currentOrder + 1;

    openDB((db) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        store.getAll().onsuccess = ({ target: { result: snaps } }) => {
            // Step 1: Remove redo chain (snapshots beyond currentOrder)
            snaps.forEach(snap => {
                if (snap.order > currentOrder) {
                    store.delete(snap.id);
                }
            });

            // Step 2: Add new snapshot
            store.add({
                html,
                label,
                timestamp: Date.now(),
                order: newOrder,
            }).onsuccess = () => {
                currentOrder = newOrder;

                // Step 3: Enforce MAX_HISTORY
                store.getAll().onsuccess = ({ target: { result: all } }) => {
                    const sorted = all.sort((a, b) => a.order - b.order);
                    const overflow = sorted.slice(0, Math.max(0, sorted.length - MAX_HISTORY));

                    overflow.forEach(s => store.delete(s.id));

                    const kept = sorted.slice(overflow.length);
                    snapshotCount = kept.length;
                    const currentIndex = kept.findIndex(s => s.order === currentOrder);

                    //showUndoRedoFeedback("Saved", currentIndex + 1, snapshotCount, currentOrder);
                };
            };
        };

        tx.oncomplete = () => db.close();
    });
}

function undo() {
    if (currentOrder <= 0) return;

    const targetOrder = currentOrder - 1;

    openDB((db) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);

        store.getAll().onsuccess = ({ target: { result } }) => {
            const sorted = result.sort((a, b) => a.order - b.order);
            const matches = sorted.filter(s => s.order === targetOrder);
            if (matches.length) {
                const snap = matches[0];
                // Restoring a snapshot discards the live nodes: destroy any maps first so Leaflet
                // does not leave handlers and tile work behind on elements that no longer exist.
                if (typeof MapDestroyWithin === "function") {
                    try { MapDestroyWithin(document.getElementById("EnvisionPage")); } catch (e) {}
                }
                document.getElementById("EnvisionPage").innerHTML = snap.html;
                currentOrder = snap.order;

                const currentIndex = sorted.findIndex(s => s.order === currentOrder);
                showUndoRedoFeedback("Undo", currentIndex + 1, sorted.length, currentOrder);
            }
        };

        tx.oncomplete = () => db.close();
    });
}

function redo() {
    const targetOrder = currentOrder + 1;

    openDB((db) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);

        store.getAll().onsuccess = ({ target: { result } }) => {
            const sorted = result.sort((a, b) => a.order - b.order);
            const matches = sorted.filter(s => s.order === targetOrder);
            if (matches.length) {
                const snap = matches[0];
                // Same teardown as undo above.
                if (typeof MapDestroyWithin === "function") {
                    try { MapDestroyWithin(document.getElementById("EnvisionPage")); } catch (e) {}
                }
                document.getElementById("EnvisionPage").innerHTML = snap.html;
                currentOrder = snap.order;

                const currentIndex = sorted.findIndex(s => s.order === currentOrder);
                showUndoRedoFeedback("Redo", currentIndex + 1, sorted.length, currentOrder);
            }
        };

        tx.oncomplete = () => db.close();
    });
}

if (!document.getElementById("undoRedoIndicator")) {
    const indicator = document.createElement("div");
    indicator.id = "undoRedoIndicator";
    document.body.appendChild(indicator);
}

function showUndoRedoFeedback(actionText, displayIndex, totalCount, versionOrder = null) {
    const indicator = document.getElementById("undoRedoIndicator");
    if (!indicator) return;

    const countDisplay = (displayIndex && totalCount)
        ? ` (${displayIndex} / ${totalCount})`
        : "";

    const versionDisplay = versionOrder != null
        ? ` [v${versionOrder + 1}]`
        : "";

    indicator.textContent = `${actionText}${countDisplay}${versionDisplay}`;
    indicator.style.opacity = "1";

    clearTimeout(indicator._hideTimer);
    indicator._hideTimer = setTimeout(() => {
        indicator.style.opacity = "0";
    }, 1500);
}
