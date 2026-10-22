// COLUMN RESIZE (index-based, stored per page)
(function () {

    function getPageName() {
        // stable key per page (ignores query string / hash)
        var p = location.pathname.split("/").filter(Boolean).slice(-1)[0] || "page";
        return p;
    }

    function getHeaderCells() {
        // sortable header cells only, excluding draglines
        return document.querySelectorAll(".rowcolboxinput2 .rowcolformsort, .rowcolboxinput2 .rowcolflexsort");
    }

    function getBodyRows() {
        return document.querySelectorAll(".eventrow");
    }

    function getBodyCells(row) {
        return row.querySelectorAll(".rowcol:not(.rowcoldragline):not(.rowcolstatic), .rowcolflex:not(.rowcolstatic)");
    }

    function getInsertRows() {
        return document.querySelectorAll(".rowcolinsert");
    }

    function getInsertCells(row) {
        return row.querySelectorAll(".rowcol:not(.rowcoldragline):not(.rowcolstatic), .rowcolflex:not(.rowcolstatic)");
    }

    function applyWidth(colIndex, width) {
        // apply to header
        var headerCells = getHeaderCells();
        if (headerCells[colIndex]) {
            headerCells[colIndex].style.width = width;

            // optional: also set width on parent form so layout stays aligned
            var form = headerCells[colIndex].closest("form");
            if (form) form.style.width = width;
        }

        // apply to each body row cell at same index
        var rows = getBodyRows();
        for (var r = 0; r < rows.length; r++) {
            var cells = getBodyCells(rows[r]);
            if (cells[colIndex]) {
                cells[colIndex].style.width = width;
            }
        }

        // apply to insert row cells at same index
        var insertRows = getInsertRows();
        for (var r = 0; r < insertRows.length; r++) {
            var cells = getInsertCells(insertRows[r]);
            if (cells[colIndex]) {
                cells[colIndex].style.width = width;
            }
        }
    }

    function restoreWidths() {
        var page = getPageName();
        var headerCells = getHeaderCells();

        for (var i = 0; i < headerCells.length; i++) {
            var w = localStorage.getItem(page + "_col_" + i);
            if (w) {
                applyWidth(i, w);
            } else {
                // sync form wrapper width from the cell's own width so flex items
                // never misalign against the fixed-width body/insert row cells
                var form = headerCells[i].closest("form");
                if (form && !form.style.width) {
                    form.style.width = getComputedStyle(headerCells[i]).width;
                }
            }
        }
    }

    function startResize(e, dragLine) {
        e.preventDefault();

        DraggingColumns = true;

        var headerCells = getHeaderCells();

        // header case: previous sibling is the <form>
        var el = dragLine.previousElementSibling;

        if (el && el.tagName && el.tagName.toLowerCase() === "form") {
            el = el.querySelector(".rowcolformsort, .rowcolflexsort");
        }

        if (!el) return;

        // Determine column index
        var colIndex = Array.prototype.indexOf.call(headerCells, el);

        // fallback: body row or insert row case
        if (colIndex < 0) {
            var row = dragLine.closest(".eventrow");
            if (row) {
                var rowCells = getBodyCells(row);
                colIndex = Array.prototype.indexOf.call(rowCells, el);
            } else {
                row = dragLine.closest(".rowcolinsert");
                if (!row) return;
                var rowCells = getInsertCells(row);
                colIndex = Array.prototype.indexOf.call(rowCells, el);
            }

            if (colIndex < 0) return;
        }

        var startWidth = parseInt(getComputedStyle(el).width, 10);
        var isTouch = (e.type === "touchstart");
        var startX = isTouch ? e.touches[0].clientX : e.clientX;

        function onMove(ev) {
            var x = (ev.type === "touchmove") ? ev.touches[0].clientX : ev.clientX;
            var desired = startWidth + x - startX;

            // clamp to available space in header container
            var container = getHeaderContainer();
            if (container) {
                var containerWidth = parseInt(getComputedStyle(container).width, 10) || 0;
                var others = getOtherColumnsWidth(getHeaderCells(), colIndex);

                var margin = 10;
                var max = containerWidth - others - margin;
                if (max > 0 && desired > max) desired = max;
            }

            var min = 40;
            if (desired < min) desired = min;

            applyWidth(colIndex, px(desired));
        }

        function onUp() {
            var finalWidth = el.style.width || getComputedStyle(el).width;
            localStorage.setItem(getPageName() + "_col_" + colIndex, finalWidth);

            document.documentElement.removeEventListener(isTouch ? "touchmove" : "mousemove", onMove, false);
            document.documentElement.removeEventListener(isTouch ? "touchend" : "mouseup", onUp, false);

            DraggingColumns = false;
        }

        document.documentElement.addEventListener(isTouch ? "touchmove" : "mousemove", onMove, false);
        document.documentElement.addEventListener(isTouch ? "touchend" : "mouseup", onUp, false);
    }

    // One-time global event handlers
    document.addEventListener("mousedown", function (e) {
        var dragLine = e.target.closest(".rowcoldragline");
        if (dragLine) startResize(e, dragLine);
    }, { passive: false });

    document.addEventListener("touchstart", function (e) {
        var dragLine = e.target.closest(".rowcoldragline");
        if (dragLine) startResize(e, dragLine);
    }, { passive: false });

    document.addEventListener("DOMContentLoaded", restoreWidths);

    document.body.addEventListener("htmx:afterSwap", function () {
        restoreWidths();
    });

    document.body.addEventListener("htmx:afterSettle", function () {
        restoreWidths();
    });

    function px(n) {
        return Math.max(0, Math.round(n)) + "px";
    }

    function getHeaderContainer() {
        return document.querySelector(".rowcolboxinput2");
    }

    function getOtherColumnsWidth(headerCells, excludeIndex) {
        var sum = 0;
        for (var i = 0; i < headerCells.length; i++) {
            if (i === excludeIndex) continue;
            sum += parseInt(getComputedStyle(headerCells[i]).width, 10) || 0;
        }
        return sum;
    }

    window.restoreWidths = restoreWidths;

})();