// ============================================================================
// SVG Editor  -  prep / slight-edit tool for SVG symbols, shown as a large modal
// on the Envision design page. Ported from the standalone prototype.
//
// Entry points:
//   OpenSvgEditor({ markup, mode, targetEl })  - core opener
//   OpenSvgEditorForSelected()                 - decorator "Open Editor" (mode 'object')
//   OpenSvgEditorFromLibrary(el)               - library right-click (mode 'library')
//   UploadSVG() (Persistence.js)               - routes uploads here (mode 'import')
//
// Modes:
//   import  / library -> footer: Add to My Library, Place on page
//   object            -> footer: Apply to object (primary), Add to My Library
// ============================================================================
(function () {
    "use strict";

    const NS = "http://www.w3.org/2000/svg";
    const $ = id => document.getElementById(id);
    const round = n => Math.round(n * 1e4) / 1e4;

    // ---- state ----
    let original = "";        // raw imported markup
    let baseDoc = null;       // parsed <svg> element, source of truth (mutated by edits)
    let view = "after", bg = "checker", previewColor = "#B3B3B3";
    const edits = { fill: "#B3B3B3", strokeW: 0, rot: 0, flipH: false, flipV: false };
    // Distinct paint slots found in the symbol. Each is bound to the single runtime
    // colour (-> currentColor) or baked to a literal. Runtime drives one colour per
    // SVGObject (executeSVGObject sets style.fill AND style.color), so "runtime" is
    // a per-slot opt-in to that one colour, not an independent colour per slot.
    let paintSlots = [];   // [{key, prop, value, mode:'runtime'|'static', color, count}]
    let mode = "import";      // import | library | object
    let targetEl = null;      // the on-page SVGObject div (object mode)
    let suggestedName = "symbol";

    // element-editing state
    let editMode = false, selectedEid = null, editSvg = null, eidSeq = 0;
    const SEL = "path,rect,circle,ellipse,line,polyline,polygon,text,use,image";

    function toast(m) {
        const t = $("sved_toast");
        if (!t) return;
        t.textContent = m;
        t.classList.add("show");
        clearTimeout(t._t);
        t._t = setTimeout(() => t.classList.remove("show"), 1800);
    }

    // ---- parsing / loading ----
    function parse(str) {
        try {
            const d = new DOMParser().parseFromString(str, "image/svg+xml");
            const svg = d.querySelector("svg");
            if (!svg || d.querySelector("parsererror")) return null;
            return svg;
        } catch (e) { return null; }
    }

    // Single writer for the runtime base colour: keeps edits.fill, both inputs, the
    // "base" pill and the preview colour in step.
    function setBaseColor(v, rerender) {
        edits.fill = v;
        const fc = $("sved_fillColor"); if (fc) fc.value = v.toLowerCase();
        const fh = $("sved_fillHex"); if (fh) fh.value = v.toUpperCase();
        const baseSw = document.querySelector('#sved_statePills .sved-sw[data-c="base"]');
        if (baseSw) {
            baseSw.style.background = v;
            if (baseSw.classList.contains("on")) previewColor = v;
        }
        if (rerender) { render(); renderSlots(); }
    }

    function load(str) {
        const svg = parse(str);
        if (!svg) { toast("Could not parse SVG"); return; }
        // Strip display-only concerns Envision manages on the object wrapper.
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.removeProperty("fill");
        svg.style.removeProperty("color");
        original = str;
        baseDoc = svg;
        edits.rot = 0; edits.flipH = false; edits.flipV = false;
        // An existing object carries its base colour in data-backgroundcolor (that is
        // what executeSVGObject drives fill/color from). Adopt it so editing an object
        // starts from its real colour instead of silently resetting it to grey.
        const existingBase = baseDoc.getAttribute("data-backgroundcolor");
        if (existingBase && /^#[0-9a-f]{6}$/i.test(existingBase.trim())) setBaseColor(existingBase.trim(), false);
        tagElements(baseDoc);
        paintSlots = scanPaintSlots(baseDoc);
        renderSlots();
        editMode = false; selectedEid = null; syncEditUI();
        $("sved_empty").style.display = "none";
        $("sved_frame").style.display = "flex";
        render();
        runChecks();
    }

    // ---- readiness checks (on the current baseDoc) ----
    function getFill(el) {
        if (el.hasAttribute("fill")) return el.getAttribute("fill");
        const st = el.getAttribute("style") || "";
        const m = st.match(/fill\s*:\s*([^;]+)/i);
        return m ? m[1].trim() : "";
    }
    // ---- paint slots ----
    const PAINTED = /^(path|rect|circle|ellipse|line|polyline|polygon|text|tspan)$/i;
    const inDefs = el => !!el.closest("defs,clipPath,mask,symbol,marker,pattern");

    // Effective author paint for a property: a style declaration beats the
    // presentation attribute. null = unset (inherits from the root, which the
    // runtime drives -> effectively already runtime-coloured).
    function readPaint(el, prop) {
        const st = el.getAttribute("style") || "";
        const m = st.match(new RegExp(prop + "\\s*:\\s*([^;]+)", "i"));
        if (m) return m[1].trim();
        if (el.hasAttribute(prop)) return (el.getAttribute(prop) || "").trim();
        return null;
    }
    // Effective paint, resolving inheritance up through ancestor <g>s. Paint is an
    // inherited SVG property, so a bare <circle> inside <g fill="none"> is NOT filled.
    // Reading only the element's own attributes would mis-file it as "inherited ->
    // runtime" and then stamp currentColor over the group's fill="none", filling
    // outline-only symbols solid. null = never declared anywhere.
    function resolvePaint(el, prop) {
        let n = el;
        while (n && n.nodeType === 1) {
            const v = readPaint(n, prop);
            if (v !== null) return v;
            if (n === baseDoc || n.tagName.toLowerCase() === "svg") break;
            n = n.parentElement;
        }
        return null;
    }
    // A slot is skipped (left untouched) when it paints nothing, or when it is a
    // gradient/pattern reference we must not flatten to a flat colour.
    function skipPaint(prop, v) {
        if (v !== null && /^none$/i.test(v)) return true;
        if (v !== null && /^url\(/i.test(v)) return true;
        if (v === null && prop === "stroke") return true;   // no stroke painted by default
        return false;
    }
    const slotKey = (prop, v) => prop + "|" + (v === null ? "(inherited)" : v.toLowerCase());

    function toHex(v) {
        if (!v) return "#b3b3b3";
        if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
        if (/^#[0-9a-f]{3}$/i.test(v)) return "#" + v.slice(1).split("").map(c => c + c).join("").toLowerCase();
        const d = document.createElement("span");
        d.style.cssText = "position:absolute;left:-9999px"; d.style.color = v;
        document.body.appendChild(d);
        const c = getComputedStyle(d).color; document.body.removeChild(d);
        const m = c.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return "#b3b3b3";
        return "#" + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, "0")).join("");
    }

    function scanPaintSlots(svg) {
        const map = new Map();
        [...svg.querySelectorAll("*")].forEach(el => {
            if (!PAINTED.test(el.tagName) || inDefs(el)) return;
            ["fill", "stroke"].forEach(prop => {
                const v = resolvePaint(el, prop);
                if (skipPaint(prop, v)) return;
                const key = slotKey(prop, v);
                if (!map.has(key)) {
                    const isRuntimeAlready = v === null || /currentcolor/i.test(v);
                    map.set(key, {
                        key: key, prop: prop, value: v, count: 0,
                        // Default preserves the symbol's appearance: only paints that
                        // already follow the root colour start bound. Opening a symbol
                        // must not silently repaint it.
                        mode: isRuntimeAlready ? "runtime" : "static",
                        color: isRuntimeAlready ? "#b3b3b3" : toHex(v)
                    });
                }
                map.get(key).count++;
            });
        });
        return [...map.values()];
    }

    function setPaint(el, prop, val) {
        // style beats the presentation attribute, so drop the declaration first
        const st = el.getAttribute("style");
        if (st) {
            const nx = st.replace(new RegExp(prop + "\\s*:\\s*[^;]+;?", "gi"), "").trim();
            nx ? el.setAttribute("style", nx) : el.removeAttribute("style");
        }
        el.setAttribute(prop, val);
    }
    function applyPaintSlots(svg) {
        if (!paintSlots.length) return;
        const byKey = new Map(paintSlots.map(s => [s.key, s]));
        // Resolve every decision BEFORE writing any: writing paint onto an element
        // would otherwise change what a nested element (tspan in text) resolves to.
        const writes = [];
        [...svg.querySelectorAll("*")].forEach(el => {
            if (!PAINTED.test(el.tagName) || inDefs(el)) return;
            ["fill", "stroke"].forEach(prop => {
                const v = resolvePaint(el, prop);
                if (skipPaint(prop, v)) return;
                const slot = byKey.get(slotKey(prop, v));
                if (!slot) return;
                // Static must be written explicitly: an unset paint would otherwise
                // inherit the root colour the runtime drives.
                writes.push([el, prop, slot.mode === "runtime" ? "currentColor" : slot.color]);
            });
        });
        writes.forEach(w => setPaint(w[0], w[1], w[2]));
    }

    function renderSlots() {
        const wrap = $("sved_slots"); if (!wrap) return;
        wrap.innerHTML = "";
        if (!paintSlots.length) { wrap.innerHTML = '<div class="sved-hint">No editable paints found</div>'; return; }
        paintSlots.forEach(s => {
            const shown = s.value === null ? "inherited" : (/currentcolor/i.test(s.value) ? "currentColor" : s.value);
            const row = document.createElement("div");
            row.className = "sved-slot";
            row.innerHTML =
                '<span class="sved-slot-sw" style="background:' + (s.mode === "runtime" ? previewColor : s.color) + '"></span>'
                + '<span class="sved-slot-lbl">' + s.prop + '<small>' + shown + ' &times; ' + s.count + '</small></span>'
                + '<input type="color" class="sved-slot-color" value="' + s.color + '"' + (s.mode === "runtime" ? " disabled" : "") + '>'
                + '<div class="sved-seg sved-slot-seg">'
                + '<button data-m="runtime"' + (s.mode === "runtime" ? ' class="on"' : '') + '>Runtime</button>'
                + '<button data-m="static"' + (s.mode === "static" ? ' class="on"' : '') + '>Static</button>'
                + '</div>';
            row.querySelectorAll(".sved-slot-seg button").forEach(b => b.onclick = () => {
                s.mode = b.dataset.m; renderSlots(); render(); runChecks();
            });
            row.querySelector(".sved-slot-color").oninput = e => { s.color = e.target.value; renderSlots(); render(); };
            wrap.appendChild(row);
        });
    }

    function analyze(svg) {
        const s = svg.outerHTML;
        const hasVb = svg.hasAttribute("viewBox");
        const pxSize = svg.hasAttribute("width") || svg.hasAttribute("height");
        const fills = [...svg.querySelectorAll("*")].map(getFill).filter(Boolean);
        const litFills = [...new Set(fills.filter(f => f !== "none" && !/currentcolor/i.test(f)))];
        const multiFill = litFills.length > 0;
        const raster = !!svg.querySelector("image");
        const cruft = /inkscape:|sodipodi:|<!--|<metadata|<rdf/i.test(s);
        return { hasVb, pxSize, multiFill, raster, cruft, uniqFills: litFills };
    }
    const CHECKDEFS = [
        { k: "hasVb", ok: a => a.hasVb, t: "Has a viewBox", oks: "Scales cleanly", bad: "Missing - object cannot scale", fix: "vb" },
        { k: "pxSize", ok: a => !a.pxSize, t: "No fixed px/mm size", oks: "Uses relative sizing", bad: "Absolute size will be stripped", fix: "px" },
        {
            k: "multiFill", ok: () => paintSlots.some(s => s.mode === "runtime"), t: "Runtime colors",
            oks: () => paintSlots.filter(s => s.mode === "runtime").length + " of " + paintSlots.length + " paints follow the runtime color",
            bad: "No paint bound to the runtime color", fix: "flat"
        },
        { k: "raster", ok: a => !a.raster, t: "Pure vector", oks: "No embedded bitmap", bad: "Contains a raster <image>", fix: null },
        { k: "cruft", ok: a => !a.cruft, t: "No editor metadata", oks: "Clean markup", bad: "Inkscape / metadata present", fix: "clean" }
    ];
    function runChecks() {
        const wrap = $("sved_checks"); wrap.innerHTML = "";
        if (!baseDoc) return;
        const a = analyze(baseDoc);
        CHECKDEFS.forEach(def => {
            const ok = def.ok(a);
            const row = document.createElement("div");
            row.className = "sved-chk " + (ok ? "ok" : "warn");
            const sub = ok ? (typeof def.oks === "function" ? def.oks(a) : def.oks)
                : (typeof def.bad === "function" ? def.bad(a) : def.bad);
            const icon = ok
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/></svg>';
            row.innerHTML = '<span class="sved-dot">' + icon + '</span>'
                + '<span class="sved-lbl">' + def.t + '<small>' + sub + '</small></span>'
                + '<button class="sved-fix"' + (def.fix ? "" : " style='visibility:hidden'") + '>' + (def.fix ? "Fix" : "") + '</button>';
            if (!ok && def.fix) row.querySelector(".sved-fix").onclick = () => applyFix(def.fix);
            wrap.appendChild(row);
        });
    }
    function applyFix(kind) {
        if (!baseDoc) return;
        const svg = baseDoc;
        if (kind === "vb") {
            const w = parseFloat(svg.getAttribute("width")) || 100, h = parseFloat(svg.getAttribute("height")) || 100;
            svg.setAttribute("viewBox", "0 0 " + w + " " + h);
            toast("viewBox added");
        }
        if (kind === "px") { svg.removeAttribute("width"); svg.removeAttribute("height"); toast("Fixed size removed"); }
        if (kind === "flat") { paintSlots.forEach(s => s.mode = "runtime"); renderSlots(); toast("All paints bound to the runtime color"); }
        if (kind === "clean") { cleanCruft(svg); toast("Metadata stripped"); }
        render(); runChecks();
    }
    function cleanCruft(svg) {
        svg.querySelectorAll("metadata,*|namedview").forEach(n => n.remove());
        const strip = n => { [...n.attributes].forEach(at => { if (/inkscape|sodipodi|^xmlns:(inkscape|sodipodi|rdf|cc|dc)/i.test(at.name)) n.removeAttribute(at.name); }); [...n.children].forEach(strip); };
        strip(svg);
        const it = document.createNodeIterator(svg, NodeFilter.SHOW_COMMENT); let c; const rm = []; while (c = it.nextNode()) rm.push(c); rm.forEach(n => n.remove());
    }

    // ---- build edited output ----
    function buildOutput() {
        if (!baseDoc) return null;
        const svg = baseDoc.cloneNode(true);
        applyPaintSlots(svg);   // runtime slots -> currentColor, static slots -> baked literal
        if (edits.strokeW > 0) svg.style.strokeWidth = edits.strokeW;
        const vb = (svg.getAttribute("viewBox") || "0 0 100 100").split(/\s+/).map(Number);
        let w = vb[2] || 100, h = vb[3] || 100;
        if (edits.rot || edits.flipH || edits.flipV) {
            const g = document.createElementNS(NS, "g");
            const cx = (vb[0] || 0) + w / 2, cy = (vb[1] || 0) + h / 2;
            const parts = ["translate(" + cx + " " + cy + ")"];
            if (edits.rot) parts.push("rotate(" + edits.rot + ")");
            if (edits.flipH) parts.push("scale(-1 1)");
            if (edits.flipV) parts.push("scale(1 -1)");
            parts.push("translate(" + (-cx) + " " + (-cy) + ")");
            g.setAttribute("transform", parts.join(" "));
            while (svg.firstChild) g.appendChild(svg.firstChild);
            svg.appendChild(g);
        }
        return { svg: svg, w: w, h: h, vb: vb };
    }
    function fitSvg(svg) {
        const vb = (svg.getAttribute("viewBox") || "0 0 100 100").split(/\s+/).map(Number);
        const w = vb[2] || 100, h = vb[3] || 100, maxW = 360, maxH = 320;
        const s = Math.min(maxW / w, maxH / h);
        svg.setAttribute("width", Math.round(w * s));
        svg.setAttribute("height", Math.round(h * s));
    }

    function render() {
        const frame = $("sved_frame"); if (!frame) return;
        frame.innerHTML = "";
        if (!baseDoc) return;
        if (editMode) { renderEditSurface(frame); updateMetrics(); return; }
        const out = (view === "before") ? { svg: baseDoc.cloneNode(true) } : buildOutput();
        if (!out || !out.svg) return;
        const svg = out.svg;
        fitSvg(svg);
        // Single writer: the preview colour stands in for the one runtime colour the
        // object will be driven with. Slots bound to runtime follow it; static ones don't.
        if (view === "after") { svg.style.fill = previewColor; svg.style.color = previewColor; }
        frame.appendChild(svg);
        updateMetrics();
    }

    // Clean markup for storage / placement: element edits + color normalization,
    // data-eid stripped, root display size removed (Envision re-adds on placement).
    function currentMarkup() {
        const o = buildOutput(); if (!o) return "";
        const s = o.svg;
        s.removeAttribute("width"); s.removeAttribute("height");
        s.querySelectorAll("[data-eid]").forEach(n => n.removeAttribute("data-eid"));
        // The runtime is the only thing that colours the object: executeSVGObject sets
        // fill/color from data-backgroundcolor (then data-colorstates overrides per state).
        // Without this the chosen base is dropped and the runtime falls back to #B3B3B3.
        s.setAttribute("data-backgroundcolor", edits.fill);
        return new XMLSerializer().serializeToString(s);
    }

    function updateMetrics() {
        if (!baseDoc) return;
        const after = new Blob([currentMarkup()]).size;
        const before = new Blob([original]).size;
        const pct = before ? Math.round((1 - after / before) * 100) : 0;
        $("sved_mSize").innerHTML = (after / 1024).toFixed(1) + "k" + (pct > 0 ? " <small>-" + pct + "%</small>" : "");
        $("sved_mVb").textContent = (baseDoc.getAttribute("viewBox") || "-").replace(/\s+/g, " ");
        $("sved_mEl").textContent = baseDoc.querySelectorAll("path,rect,circle,ellipse,polygon,polyline,line").length;
        const rw = baseDoc.getAttribute("width"), rh = baseDoc.getAttribute("height");
        const ss = $("sved_sizeState"); if (ss) ss.textContent = (rw || rh) ? (rw || "?") + " x " + (rh || "?") : "none (scales freely)";
    }

    function applyBg() {
        const st = $("sved_stage");
        st.classList.toggle("solid", bg !== "checker");
        st.style.background = bg === "dark" ? "#12202b" : bg === "light" ? "#eef2f5" : "";
        if (bg === "checker") st.style.background = "";
    }

    // ---- viewBox fit / square ----
    function contentBBox() {
        const tmp = baseDoc.cloneNode(true);
        tmp.removeAttribute("width"); tmp.removeAttribute("height");
        tmp.querySelectorAll(".sved-outline,.sved-handle").forEach(n => n.remove());
        const holder = document.createElement("div");
        holder.style.cssText = "position:absolute;left:-99999px;top:0;width:0;height:0;overflow:visible";
        holder.appendChild(tmp); document.body.appendChild(holder);
        let bb = null; try { bb = tmp.getBBox(); } catch (_) { }
        document.body.removeChild(holder);
        return bb;
    }
    function fitViewBox() {
        if (!baseDoc) return toast("Nothing loaded");
        const bb = contentBBox();
        if (!bb || !bb.width || !bb.height) return toast("No measurable content");
        const pad = Math.max(bb.width, bb.height) * 0.02;
        baseDoc.setAttribute("viewBox", round(bb.x - pad) + " " + round(bb.y - pad) + " " + round(bb.width + 2 * pad) + " " + round(bb.height + 2 * pad));
        render(); runChecks();
        toast("viewBox fit to content (" + Math.round(bb.width) + "x" + Math.round(bb.height) + ")");
    }
    function squareViewBox() {
        if (!baseDoc) return toast("Nothing loaded");
        const vb = (baseDoc.getAttribute("viewBox") || "0 0 100 100").split(/\s+/).map(Number);
        let x = vb[0] || 0, y = vb[1] || 0, w = vb[2] || 100, h = vb[3] || 100;
        const s = Math.max(w, h); x -= (s - w) / 2; y -= (s - h) / 2;
        baseDoc.setAttribute("viewBox", round(x) + " " + round(y) + " " + round(s) + " " + round(s));
        render(); runChecks(); toast("viewBox padded to square");
    }
    function resetSize() {
        if (!baseDoc) return toast("Nothing loaded");
        const vb = (baseDoc.getAttribute("viewBox") || "0 0 100 100").split(/\s+/).map(Number);
        const w = Math.round(vb[2] || 100), h = Math.round(vb[3] || 100);
        baseDoc.setAttribute("width", w); baseDoc.setAttribute("height", h);
        render(); runChecks(); toast("Root size reset to " + w + "x" + h + " (viewBox)");
    }

    // ---- element editing (Tier 1.5) ----
    function tagElements(svg) {
        [...svg.querySelectorAll(SEL)].forEach(el => {
            if (el.closest("defs,clipPath,mask,symbol,marker,pattern")) return;
            if (!el.hasAttribute("data-eid")) el.setAttribute("data-eid", "e" + (++eidSeq));
        });
    }
    const baseEl = eid => baseDoc && baseDoc.querySelector('[data-eid="' + eid + '"]');
    const editEl = eid => editSvg && editSvg.querySelector('[data-eid="' + eid + '"]');

    function syncEditUI() {
        const t = $("sved_editToggle"); if (!t) return;
        t.classList.toggle("editon", editMode);
        $("sved_stage").classList.toggle("editing", editMode);
        const has = !!selectedEid, sel = has && baseEl(selectedEid);
        $("sved_selText").innerHTML = !editMode ? "<span style='color:var(--sved-muted)'>Off - turn on to select shapes</span>"
            : sel ? "Selected <span class='sved-tag'>&lt;" + sel.tagName.toLowerCase() + "&gt;</span> " + selectedEid
                : "<span style='color:var(--sved-muted)'>Click a shape to select</span>";
        document.querySelectorAll("#SvgEditorModal [data-el]").forEach(b => b.toggleAttribute("disabled", !(editMode && has)));
        $("sved_flattenBtn").toggleAttribute("disabled", !(editMode && baseDoc && baseDoc.querySelector("g")));
    }
    function renderEditSurface(frame) {
        editSvg = baseDoc.cloneNode(true);
        fitSvg(editSvg);
        editSvg.classList.add("sved-editsurf");
        editSvg.style.color = "#7f8a97"; editSvg.style.fill = "#7f8a97";
        frame.appendChild(editSvg);
        editSvg.addEventListener("pointerdown", onSurfacePointerDown);
        if (selectedEid && editEl(selectedEid)) drawSelection();
    }
    function clientToUser(refEl, cx, cy) { const m = refEl.getScreenCTM().inverse(); const p = editSvg.createSVGPoint(); p.x = cx; p.y = cy; const r = p.matrixTransform(m); return { x: r.x, y: r.y }; }
    function elMatrix(el) { const t = el.transform.baseVal.consolidate(); return t ? t.matrix : editSvg.createSVGMatrix(); }
    const applyM = (m, x, y) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });
    function parentBBox(el) {
        const b = el.getBBox(), M = elMatrix(el);
        const pts = [applyM(M, b.x, b.y), applyM(M, b.x + b.width, b.y), applyM(M, b.x, b.y + b.height), applyM(M, b.x + b.width, b.y + b.height)];
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        const x = Math.min(...xs), y = Math.min(...ys);
        return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    function drawSelection() {
        editSvg.querySelectorAll(".sved-outline,.sved-handle").forEach(n => n.remove());
        const el = editEl(selectedEid); if (!el) return;
        const parent = el.parentNode, bb = parentBBox(el);
        const ctm = parent.getScreenCTM();
        const scale = Math.hypot(ctm.a, ctm.b) || 1;
        const hs = 7 / scale;
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("class", "sved-outline");
        rect.setAttribute("x", bb.x); rect.setAttribute("y", bb.y); rect.setAttribute("width", bb.w); rect.setAttribute("height", bb.h);
        parent.appendChild(rect);
        [["nw", bb.x, bb.y], ["ne", bb.x + bb.w, bb.y], ["sw", bb.x, bb.y + bb.h], ["se", bb.x + bb.w, bb.y + bb.h]].forEach(([k, x, y]) => {
            const h = document.createElementNS(NS, "rect");
            h.setAttribute("class", "sved-handle " + k); h.setAttribute("data-handle", k);
            h.setAttribute("x", x - hs); h.setAttribute("y", y - hs); h.setAttribute("width", hs * 2); h.setAttribute("height", hs * 2);
            parent.appendChild(h);
        });
    }
    function commitTransform(eid, transformStr) { const be = baseEl(eid); if (be) be.setAttribute("transform", transformStr); }

    let drag = null;
    function onSurfacePointerDown(e) {
        const handle = e.target.closest("[data-handle]");
        const shape = e.target.closest("[data-eid]");
        if (handle && selectedEid) { startResize(e, handle.getAttribute("data-handle")); return; }
        if (shape) { selectedEid = shape.getAttribute("data-eid"); syncEditUI(); drawSelection(); startMove(e); return; }
        selectedEid = null; syncEditUI();
        editSvg.querySelectorAll(".sved-outline,.sved-handle").forEach(n => n.remove());
    }
    function startMove(e) {
        const el = editEl(selectedEid), parent = el.parentNode;
        const orig = el.getAttribute("transform") || "";
        const start = clientToUser(parent, e.clientX, e.clientY);
        drag = { mode: "move", el, parent, orig, start };
        try { editSvg.setPointerCapture(e.pointerId); } catch (_) { }
        editSvg.addEventListener("pointermove", onDrag);
        editSvg.addEventListener("pointerup", endDrag, { once: true });
        e.preventDefault();
    }
    function startResize(e, corner) {
        const el = editEl(selectedEid), parent = el.parentNode;
        const orig = el.getAttribute("transform") || "";
        const bb = parentBBox(el);
        const opp = { nw: [bb.x + bb.w, bb.y + bb.h], ne: [bb.x, bb.y + bb.h], sw: [bb.x + bb.w, bb.y], se: [bb.x, bb.y] }[corner];
        const grab = { nw: [bb.x, bb.y], ne: [bb.x + bb.w, bb.y], sw: [bb.x, bb.y + bb.h], se: [bb.x + bb.w, bb.y + bb.h] }[corner];
        drag = { mode: "resize", el, parent, orig, fx: opp[0], fy: opp[1], gx: grab[0], gy: grab[1] };
        try { editSvg.setPointerCapture(e.pointerId); } catch (_) { }
        editSvg.addEventListener("pointermove", onDrag);
        editSvg.addEventListener("pointerup", endDrag, { once: true });
        e.preventDefault();
    }
    function onDrag(e) {
        if (!drag) return;
        const cur = clientToUser(drag.parent, e.clientX, e.clientY);
        if (!isFinite(cur.x) || !isFinite(cur.y)) return;
        let tf;
        if (drag.mode === "move") {
            const dx = round(cur.x - drag.start.x), dy = round(cur.y - drag.start.y);
            tf = ("translate(" + dx + " " + dy + ") " + drag.orig).trim();
        } else {
            let sx = (cur.x - drag.fx) / ((drag.gx - drag.fx) || 1e-6);
            let sy = (cur.y - drag.fy) / ((drag.gy - drag.fy) || 1e-6);
            sx = Math.max(0.05, Math.abs(sx)) * Math.sign(sx || 1);
            sy = Math.max(0.05, Math.abs(sy)) * Math.sign(sy || 1);
            tf = ("translate(" + round(drag.fx) + " " + round(drag.fy) + ") scale(" + round(sx) + " " + round(sy) + ") translate(" + round(-drag.fx) + " " + round(-drag.fy) + ") " + drag.orig).trim();
        }
        drag.el.setAttribute("transform", tf); drag.tf = tf;
        editSvg.querySelectorAll(".sved-outline,.sved-handle").forEach(n => n.remove()); drawSelection();
    }
    function endDrag() {
        editSvg.removeEventListener("pointermove", onDrag);
        if (drag && drag.tf) commitTransform(selectedEid, drag.tf);
        drag = null; render(); syncEditUI(); if (selectedEid) drawSelection();
    }
    function elementOp(op) {
        const be = baseEl(selectedEid); if (!be) return;
        if (op === "delete") { be.remove(); selectedEid = null; toast("Shape deleted"); }
        if (op === "reset") { be.removeAttribute("transform"); toast("Shape move/resize reset"); }
        if (op === "dup") {
            const c = be.cloneNode(true); c.setAttribute("data-eid", "e" + (++eidSeq));
            const t = c.getAttribute("transform") || ""; c.setAttribute("transform", ("translate(6 6) " + t).trim());
            be.parentNode.insertBefore(c, be.nextSibling); selectedEid = c.getAttribute("data-eid"); toast("Duplicated");
        }
        if (op === "front") { let n = be.nextElementSibling; while (n && !n.hasAttribute("data-eid")) n = n.nextElementSibling; if (n) be.parentNode.insertBefore(n, be); toast("Brought forward"); }
        if (op === "back") { let p = be.previousElementSibling; while (p && !p.hasAttribute("data-eid")) p = p.previousElementSibling; if (p) be.parentNode.insertBefore(be, p); toast("Sent back"); }
        render(); syncEditUI(); if (selectedEid) drawSelection();
    }
    function flattenGroups(svg) {
        const carry = ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "style"];
        let changed = true, guard = 0;
        while (changed && guard++ < 200) {
            changed = false;
            for (const g of [...svg.querySelectorAll("g")]) {
                if (g.closest("defs,clipPath,mask,symbol,marker,pattern")) continue;
                if (g.getAttribute("clip-path") || g.getAttribute("mask") || g.getAttribute("filter")) continue;
                const parent = g.parentNode, gt = g.getAttribute("transform");
                [...g.children].forEach(ch => {
                    if (gt) { const ct = ch.getAttribute("transform"); ch.setAttribute("transform", ct ? gt + " " + ct : gt); }
                    carry.forEach(a => { if (g.hasAttribute(a) && !ch.hasAttribute(a)) ch.setAttribute(a, g.getAttribute(a)); });
                    parent.insertBefore(ch, g);
                });
                parent.removeChild(g); changed = true;
            }
        }
    }

    // ---- footer actions ----
    function doPlaceOnPage() {
        if (!baseDoc) return toast("Nothing loaded");
        if (typeof placeSvgObject === "function") { placeSvgObject(currentMarkup()); }
        closeModal();
    }
    function doApplyToObject() {
        if (!baseDoc || !targetEl) return toast("No target object");
        targetEl.innerHTML = currentMarkup();
        const svgDom = targetEl.getElementsByTagName("svg")[0];
        if (svgDom) {
            // Seed the chosen base rather than a hardcoded grey; executeSVGObject then
            // re-derives it from data-backgroundcolor / data-colorstates.
            svgDom.style.fill = edits.fill; svgDom.style.color = edits.fill;
            svgDom.setAttribute("width", "100%"); svgDom.setAttribute("height", "100%");
        }
        if (typeof executeSVGObject === "function") executeSVGObject(targetEl);
        if (typeof saveSnapshot === "function") saveSnapshot();
        toast("Applied to object");
        closeModal();
    }

    // ---- Add to My Library (admin only, backend-gated) ----
    // NB: use fetch, not jQuery - the module-local $ is getElementById, which shadows jQuery.
    function verificationToken() {
        if (window.RequestVerificationToken) return window.RequestVerificationToken;
        const el = document.querySelector('input[name="__RequestVerificationToken"]');
        return el ? el.value : "";
    }
    function postJson(handler, body) {
        return fetch("/Envision?handler=" + handler, {
            method: "POST",
            headers: { "Content-Type": "application/json", "RequestVerificationToken": verificationToken() },
            body: JSON.stringify(body || {})
        }).then(r => r.json());
    }
    function openDestChooser() {
        if (!baseDoc) return toast("Nothing loaded");
        $("sved_fileName").value = (suggestedName || "symbol").replace(/\.svg$/i, "");
        const sel = $("sved_destFolder");
        sel.innerHTML = "<option value=''>0 My Library (root)</option>";
        $("sved_destModal").style.display = "flex";
        postJson("GetMyLibraryFolders", {}).then(res => {
            if (res && res.status === "OK" && res.folders) {
                res.folders.forEach(f => { if (f) { const o = document.createElement("option"); o.value = f; o.textContent = f; sel.appendChild(o); } });
            } else if (res && res.status === "no rights") {
                toast("Administrators only");
            }
        }).catch(() => toast("Could not load folders"));
    }
    function doSaveToLibrary() {
        let folder = $("sved_destFolder").value || "";
        const newFolder = ($("sved_newFolder").value || "").trim().replace(/^\/+|\/+$/g, "");
        if (newFolder) folder = folder ? folder + "/" + newFolder : newFolder;
        const model = { FolderRelPath: folder, FileName: $("sved_fileName").value, SvgMarkup: currentMarkup() };
        postJson("SaveSvgToLibrary", model).then(res => {
            if (res && res.status === "OK") {
                $("sved_destModal").style.display = "none";
                toast("Saved to " + res.path);
                injectLibraryItem(res.path, res.name);
                // remember a newly created subfolder for the next save this session
                if (folder) {
                    const dsel = $("sved_destFolder");
                    if (dsel && ![...dsel.options].some(o => o.value === folder)) {
                        const o = document.createElement("option"); o.value = folder; o.textContent = folder; dsel.appendChild(o);
                    }
                }
            } else if (res && res.status === "no rights") {
                toast("Administrators only");
            } else {
                toast("Save failed" + (res && res.message ? ": " + res.message : ""));
            }
        }).catch(() => toast("Save request failed"));
    }

    // Adds a just-saved symbol to the Library menu without a page reload. The menu's
    // IntersectionObserver only watches the server-rendered items, so we draw the
    // thumbnail directly, then let RedrawMenuImages apply the current-folder filter.
    function injectLibraryItem(fullPath, name) {
        const menu = document.getElementById("MenuImages");
        if (!menu || !fullPath) return;
        const libPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
        const el = document.createElement("div");
        el.className = "EnvisionLeftMenuCenterHomeBlock MenuLibrary menulib MenuImage";
        el.id = "menulib_" + (typeof GenerateUniqueID === "function" ? GenerateUniqueID() : "s" + eidSeq++);
        el.setAttribute("data-imgpath", fullPath);
        el.setAttribute("data-librarypath", libPath);
        el.setAttribute("onclick", "AddImageFromLibrary(this)");
        el.setAttribute("oncontextmenu", "OpenSvgEditorFromLibrary(this); return false;");
        el.innerHTML = "<div style='position:absolute;margin-left:auto;margin-right:auto;margin-top:-35px;font-size:12px;font-weight:bold;width:100%;'>"
            + (name || "").replace(/\.svg$/i, "") + "</div>";
        menu.appendChild(el);
        if (typeof LazyLoadMenuLib === "function") LazyLoadMenuLib(el);
        if (typeof RedrawMenuImages === "function") RedrawMenuImages();
    }

    // ---- public openers ----
    function setMode(m) {
        mode = m;
        const isObject = m === "object";
        $("sved_apply").style.display = isObject ? "" : "none";
        $("sved_place").style.display = isObject ? "none" : "";
        $("sved_modeLabel").textContent = m === "object" ? "editing object" : m === "library" ? "from library" : "import";
    }
    function openModal() { $("SvgEditorModal").style.display = "flex"; }
    function closeModal() {
        $("SvgEditorModal").style.display = "none";
        $("sved_destModal").style.display = "none";
        editMode = false; selectedEid = null; targetEl = null;
    }

    window.OpenSvgEditor = function (opts) {
        opts = opts || {};
        setMode(opts.mode || "import");
        targetEl = opts.targetEl || null;
        suggestedName = opts.name || "symbol";
        // reset edit controls to defaults
        edits.strokeW = 0;
        view = "after"; previewColor = "#B3B3B3";
        paintSlots = []; renderSlots();
        // select the base pill first so setBaseColor drives previewColor too
        const baseSw = document.querySelector('#sved_statePills .sved-sw[data-c="base"]');
        document.querySelectorAll("#sved_statePills .sved-sw").forEach(x => x.classList.toggle("on", x === baseSw));
        setBaseColor("#B3B3B3", false);   // load() may adopt the object's own base after this
        openModal();
        if (opts.markup) load(opts.markup);
    };
    window.OpenSvgEditorForSelected = function () {
        const sel = document.querySelector(".ActiveSelected");
        if (!sel || sel.getAttribute("name") !== "SVGObject") { toast("Select an SVG object first"); return; }
        const svg = sel.getElementsByTagName("svg")[0];
        if (!svg) { toast("No SVG content on this object"); return; }
        window.OpenSvgEditor({ markup: svg.outerHTML, mode: "object", targetEl: sel, name: sel.getAttribute("data-system-objectname") || "symbol" });
    };
    window.OpenSvgEditorFromLibrary = function (el) {
        const name = el && el.getAttribute("data-imgpath");
        if (!name || name.indexOf(".svg") < 0) { toast("Not an SVG"); return; }
        const url = decodeURI("/images/Library/" + name);
        const req = new XMLHttpRequest();
        req.open("GET", url, true); req.responseType = "text";
        req.onload = function () {
            if (req.status >= 200 && req.status < 300) {
                const leaf = name.split("/").pop().replace(/\.svg$/i, "");
                window.OpenSvgEditor({ markup: req.responseText, mode: "library", name: leaf });
            } else { toast("Could not load symbol"); }
        };
        req.onerror = function () { toast("Could not load symbol"); };
        req.send();
    };

    // ---- wire up UI (elements exist: partial is included before this script) ----
    function init() {
        if (!$("SvgEditorModal")) return;

        $("sved_close").onclick = closeModal;
        $("SvgEditorModal").addEventListener("mousedown", e => { if (e.target === $("SvgEditorModal")) closeModal(); });
        document.addEventListener("keydown", e => { if (e.key === "Escape" && $("SvgEditorModal").style.display === "flex") closeModal(); });

        $("sved_prepAll").onclick = () => {
            if (!baseDoc) return toast("Nothing loaded");
            const a = analyze(baseDoc);
            if (!a.hasVb) applyFix("vb");
            applyFix("px"); applyFix("flat"); applyFix("clean");
            render(); runChecks(); toast("Prepped for library");
        };

        $("sved_viewSeg").onclick = e => { const b = e.target.closest("button"); if (!b) return; view = b.dataset.v; [...e.currentTarget.children].forEach(x => x.classList.toggle("on", x === b)); render(); };
        $("sved_bgSeg").onclick = e => { const b = e.target.closest("button"); if (!b) return; bg = b.dataset.bg; [...e.currentTarget.children].forEach(x => x.classList.toggle("on", x === b)); applyBg(); };
        // The "base" pill IS the chosen base colour; the others simulate runtime states.
        $("sved_statePills").onclick = e => {
            const b = e.target.closest(".sved-sw"); if (!b) return;
            previewColor = (b.dataset.c === "base") ? edits.fill : b.dataset.c;
            document.querySelectorAll("#sved_statePills .sved-sw").forEach(x => x.classList.toggle("on", x === b));
            render(); renderSlots();
        };

        $("sved_fillColor").oninput = e => setBaseColor(e.target.value, true);
        $("sved_fillHex").oninput = e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setBaseColor(e.target.value, true); };
        $("sved_strokeW").oninput = e => { edits.strokeW = +e.target.value; $("sved_strokeWv").textContent = e.target.value; render(); };
        document.querySelectorAll("#SvgEditorModal .sved-tbtn[data-t]").forEach(b => b.onclick = () => {
            const t = b.dataset.t;
            if (t === "flipH") edits.flipH = !edits.flipH;
            if (t === "flipV") edits.flipV = !edits.flipV;
            if (t === "rotL") edits.rot = (edits.rot - 90 + 360) % 360;
            if (t === "rotR") edits.rot = (edits.rot + 90) % 360;
            b.classList.toggle("act", (t === "flipH" && edits.flipH) || (t === "flipV" && edits.flipV));
            render();
        });

        $("sved_fitVb").onclick = fitViewBox;
        $("sved_squareVb").onclick = squareViewBox;
        $("sved_resetSize").onclick = resetSize;

        $("sved_editToggle").onclick = () => {
            if (!baseDoc) return toast("Nothing loaded");
            editMode = !editMode; selectedEid = null; syncEditUI(); render();
            toast(editMode ? "Element editing on" : "Element editing off");
        };
        document.querySelectorAll("#SvgEditorModal [data-el]").forEach(b => b.onclick = () => { if (editMode && selectedEid) elementOp(b.getAttribute("data-el")); });
        $("sved_flattenBtn").onclick = () => { if (!baseDoc) return; flattenGroups(baseDoc); selectedEid = null; render(); runChecks(); syncEditUI(); toast("Groups flattened"); };

        $("sved_place").onclick = doPlaceOnPage;
        $("sved_apply").onclick = doApplyToObject;
        $("sved_addLib").onclick = openDestChooser;
        $("sved_destSave").onclick = doSaveToLibrary;
        $("sved_destCancel").onclick = () => { $("sved_destModal").style.display = "none"; };

        applyBg();
        syncEditUI();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
