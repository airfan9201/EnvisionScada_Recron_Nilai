// Envision Shapes - Vector shapes: polygon/polyline drawing, dots, borders, line helpers.
// Split from Envision.js. All functions/variables are globals (no module system); load order is defined in Envision.cshtml.

// POLYGON POLYLINE

// Cursor position in page coordinates: the same space as the left/top of the objects on
// the page. The canvas is CSS-scaled by the zoom while coordinates are stored unscaled,
// so screen pixels are divided by the zoom, and the page border is taken off so the
// result lines up with the grid instead of sitting a fraction of a pixel next to it.
function CursorPagePos(e) {

    var viewer = document.getElementById("EnvisionPage");
    var rect = viewer.getBoundingClientRect();
    var scale = viewportScale ? viewportScale : 1;
    var borderleft = parseFloat(getComputedStyle(viewer).borderLeftWidth) || 0;
    var bordertop = parseFloat(getComputedStyle(viewer).borderTopWidth) || 0;

    return {
        left: (e.clientX - rect.left) / scale - borderleft,
        top: (e.clientY - rect.top) / scale - bordertop
    };
}

// Position of an object in page coordinates. Walks the offset chain up to EnvisionPage so
// objects inside a group are handled too, and stays exact where getCoords() rounds.
function PageObjectPos(elem) {

    var page = document.getElementById("EnvisionPage");

    // Own border: a selected object gets a border with a compensating negative margin, so
    // its offset is the border box while the points live in the content box.
    var left = elem.clientLeft;
    var top = elem.clientTop;
    var node = elem;

    while (node && node !== page) {
        left += node.offsetLeft;
        top += node.offsetTop;
        node = node.offsetParent;
    }

    return { left: left, top: top };
}

function ResetViewBoxPolygon(ObjDom) {

    var strokeWidth;
    var viewportwidth = parseFloat(ObjDom.parentElement.style.width.replace("px", ""));
    var viewportheight = parseFloat(ObjDom.parentElement.style.height.replace("px", ""));

    if (ObjDom.style.strokeWidth) {
        strokeWidth = parseFloat(ObjDom.style.strokeWidth.replace('px', ''));
    }
    else {
        let compStyles = window.getComputedStyle(ObjDom);
        strokeWidth = parseFloat(compStyles.getPropertyValue("stroke-width").replace('px', ''));
        ObjDom.style.strokeWidth = compStyles.getPropertyValue("stroke-width");
    }

    var viewboxLeft = -strokeWidth / 2;
    var viewboxTop = -strokeWidth / 4;
    var viewboxWidth = viewportwidth + strokeWidth;
    var viewboxHeight = viewportheight + (strokeWidth / 2);

    //var viewboxLeft = -strokeWidth;
    //var viewboxTop = 0;
    //var viewboxWidth = viewportwidth + strokeWidth;
    //var viewboxHeight = viewportheight + (strokeWidth / 2);


    ObjDom.setAttribute("height", viewportheight + (strokeWidth));
    ObjDom.setAttribute("width", viewportwidth + (strokeWidth));
    ObjDom.style.border = "0px solid red";
    ObjDom.style.marginLeft = -strokeWidth / 2
    ObjDom.style.marginTop = -strokeWidth / 2;
    //console.log(ObjDom);
    //var viewboxLeft = -strokeWidth / 1;
    //var viewboxTop = -strokeWidth / 4;
    //var viewboxWidth = viewportwidth;
    //var viewboxHeight = viewportheight;



    //var viewboxLeft = 0;
    //var viewboxTop = 0;
    //var viewboxWidth = viewportwidth;
    //var viewboxHeight = viewportheight;

    ObjDom.setAttribute('viewBox', viewboxLeft + " " + viewboxTop + " " + viewboxWidth + " " + viewboxHeight);
}

//function ResetViewBoxPolyline(ObjDom) {

//    var strokeWidth;
//    var viewportwidth = parseFloat(ObjDom.parentElement.style.width.replace("px", ""));
//    var viewportheight = parseFloat(ObjDom.parentElement.style.height.replace("px", ""));

//    strokeWidth = parseFloat(ObjDom.style.strokeWidth.replace('px', ''));

//    //console.log(strokeWidth);

//    var viewboxLeft = -strokeWidth / 2;
//    var viewboxTop = -strokeWidth / 4;
//    var viewboxWidth = viewportwidth + strokeWidth;
//    var viewboxHeight = viewportheight + (strokeWidth / 2);

//    //var viewboxLeft = -strokeWidth;
//    //var viewboxTop = 0;
//    //var viewboxWidth = viewportwidth + strokeWidth;
//    //var viewboxHeight = viewportheight + (strokeWidth / 2);


//    ObjDom.setAttribute("height", viewportheight + (strokeWidth));
//    ObjDom.setAttribute("width", viewportwidth + (strokeWidth));
//    ObjDom.style.border = "0px solid red";
//    ObjDom.style.marginLeft = -strokeWidth / 2
//    ObjDom.style.marginTop = -strokeWidth / 2;
//    //console.log(ObjDom);
//    //var viewboxLeft = -strokeWidth / 1;
//    //var viewboxTop = -strokeWidth / 4;
//    //var viewboxWidth = viewportwidth;
//    //var viewboxHeight = viewportheight;



//    //var viewboxLeft = 0;
//    //var viewboxTop = 0;
//    //var viewboxWidth = viewportwidth;
//    //var viewboxHeight = viewportheight;

//    ObjDom.setAttribute('viewBox', viewboxLeft + " " + viewboxTop + " " + viewboxWidth + " " + viewboxHeight);

//    RedrawPolylineBorder(ObjDom);
//}

function ResetViewBoxPolyline(ObjDom) {

    // ObjDom is the <svg class="polylineobject">
    var viewportwidth = parseFloat(ObjDom.parentElement.style.width.replace("px", ""));
    var viewportheight = parseFloat(ObjDom.parentElement.style.height.replace("px", ""));

    // Rebuild the arrowhead markers before the viewBox is sized, so the padding below is computed
    // against the heads that are actually going to be drawn. No-op when no arrows are configured.
    RedrawPolylineArrows(ObjDom);

    // Determine the maximum stroke width used by any polyline inside this SVG
    var maxStrokeWidth = 0;
    var polylines = ObjDom.querySelectorAll('polyline');

    polylines.forEach(function (pl) {
        var sw = 0;

        // Prefer explicit stroke-width attribute if present
        var attr = pl.getAttribute('stroke-width');
        if (attr) {
            sw = parseFloat(attr);
        } else {
            // Fallback to computed style (for CSS defined widths)
            var cs = window.getComputedStyle(pl);
            if (cs && cs.strokeWidth) {
                sw = parseFloat(cs.strokeWidth);
            }
        }

        if (!isNaN(sw) && sw > maxStrokeWidth) {
            maxStrokeWidth = sw;
        }
    });

    // Fallback to 1 if nothing found
    if (!maxStrokeWidth || isNaN(maxStrokeWidth)) {
        maxStrokeWidth = 1;
    }

    var strokeWidth = maxStrokeWidth;

    // Pad by half the max stroke so the whole stroke fits in the viewBox. An arrowhead sticks
    // out further than the stroke does, so the padding is the LARGER of the two — a line without
    // arrowheads keeps exactly the historical stroke/2 padding and is byte-identical to before.
    var pad = PolylinePadding(ObjDom, strokeWidth);

    var viewboxLeft = -pad;
    var viewboxTop = -pad;
    var viewboxWidth = viewportwidth + (pad * 2);
    var viewboxHeight = viewportheight + (pad * 2);

    // Expand the SVG element itself accordingly
    ObjDom.setAttribute("height", viewportheight + (pad * 2));
    ObjDom.setAttribute("width", viewportwidth + (pad * 2));

    ObjDom.style.border = "0px solid red";
    ObjDom.style.marginLeft = -pad + "px";
    ObjDom.style.marginTop = -pad + "px";

    ObjDom.setAttribute(
        'viewBox',
        viewboxLeft + " " + viewboxTop + " " + viewboxWidth + " " + viewboxHeight
    );

    RedrawPolylineBorder(ObjDom);
}

// ── Polyline arrowheads ────────────────────────────────────────────────────────────────────
// Arrowheads are SVG <marker>s generated INSIDE the object's own <svg>, so they inherit nothing
// they should not and every existing styling path (stroke color, colorstates, blink classes,
// dasharray from data-linestyle, visibility, access control) keeps working untouched.
//
// The marker ids are derived from the outer div's id and regenerated on every draw, never
// persisted as a fixed value: CloneObjectFrom() only re-ids the outer div, so a stored marker id
// would be duplicated across every copy/paste and all copies would resolve to the first one.

// Head length in px, expressed as a multiple of the stroke width, clamped so a hairline still
// gets a visible head and a very thick pipe does not get an absurd one.
function PolylineArrowLength(ObjDom, strokeWidth) {

    var size = parseFloat(ObjDom.getAttribute("data-arrowsize"));

    if (isNaN(size) || size <= 0) {
        size = 4; // default: 4x the stroke width
    }

    var length = strokeWidth * size;

    if (length < 6) {
        length = 6;
    }

    return length;
}

function PolylineHasArrow(ObjDom) {

    var start = (ObjDom.getAttribute("data-arrowstart") || "None");
    var end = (ObjDom.getAttribute("data-arrowend") || "None");

    return (start !== "None" && start !== "") || (end !== "None" && end !== "");
}

// Padding the viewBox needs so nothing is clipped: half the widest stroke, or the arrowhead if
// longer, or the bridge arc if that is larger still.
//
// maxStrokeWidth is the widest stroke in the SVG, which in edit mode is the 14px INVISIBLE hit
// line rather than the line the operator sees. That width is the right input for the stroke term
// (the hit line really does need the room) but the wrong one for the arrowhead and hop terms,
// which are sized from the visible line - so those two are computed from the object's own
// data-strokewidth and the padding comes out the same in edit mode as in runtime.
function PolylinePadding(ObjDom, maxStrokeWidth) {

    var pad = maxStrokeWidth / 2;

    if (!ObjDom) {
        return pad;
    }

    var ownStrokeWidth = PolylineStrokeWidthOf(ObjDom);

    if (PolylineHasArrow(ObjDom)) {
        var arrow = PolylineArrowLength(ObjDom, ownStrokeWidth);
        if (arrow > pad) {
            pad = arrow;
        }
    }

    if (ObjDom.getAttribute("data-bridge") === "true") {
        // A hop bulges one radius perpendicular to the line; without this a crossing near the
        // object's own edge would have its arc clipped by the viewBox.
        var hop = PolylineBridgeRadius(ObjDom, ownStrokeWidth) + (ownStrokeWidth / 2);
        if (hop > pad) {
            pad = hop;
        }
    }

    return pad;
}

// Current stroke color of the visible line, so a head matches whatever the line is showing right
// now — including a data-colorstates color the runtime tick just applied.
function PolylineStrokeColor(ObjDom) {

    var polyVisible = ObjDom.querySelector('polyline.poly-visible') || ObjDom.querySelector('polyline');

    if (polyVisible) {
        try {
            var cs = window.getComputedStyle(polyVisible);
            if (cs && cs.stroke && cs.stroke !== "none" && cs.stroke !== "") {
                return cs.stroke;
            }
        } catch (e) { }
    }

    if (ObjDom.style.stroke) {
        return ObjDom.style.stroke;
    }

    if (ObjDom.getAttribute("data-backgroundcolor")) {
        return GetObjectColor(ObjDom.getAttribute("data-backgroundcolor"));
    }

    return "#000";
}

function RemovePolylineArrows(ObjDom) {

    if (!ObjDom) return;

    ObjDom.querySelectorAll('defs.poly-arrowdefs').forEach(function (d) { d.remove(); });
    ObjDom.querySelectorAll('polyline.poly-arrowcarrier').forEach(function (c) { c.remove(); });

    ObjDom.querySelectorAll('polyline').forEach(function (pl) {
        pl.removeAttribute("marker-start");
        pl.removeAttribute("marker-end");
        pl.style.markerStart = "";
        pl.style.markerEnd = "";
    });
}

// Builds one <marker>. "reverse" mirrors the geometry for the start of the line instead of
// relying on orient="auto-start-reverse", so the head points outwards on every browser.
function BuildPolylineArrowMarker(id, style, length, strokeWidth, color, reverse) {

    var svgns = "http://www.w3.org/2000/svg";

    var halfWidth = length * 0.4;

    var marker = document.createElementNS(svgns, "marker");

    marker.setAttribute("id", id);
    marker.setAttribute("markerUnits", "userSpaceOnUse");
    marker.setAttribute("markerWidth", length);
    marker.setAttribute("markerHeight", halfWidth * 2);
    marker.setAttribute("viewBox", "0 " + (-halfWidth) + " " + length + " " + (halfWidth * 2));
    marker.setAttribute("refX", reverse ? 0 : length);
    marker.setAttribute("refY", 0);
    marker.setAttribute("orient", "auto");

    // The open head is drawn with a stroke that would otherwise be clipped at the viewBox edge.
    marker.setAttribute("overflow", "visible");

    var tipX = reverse ? 0 : length;
    var baseX = reverse ? length : 0;

    var shape = document.createElementNS(svgns, "path");

    if (style === "OpenArrow") {
        shape.setAttribute("d", "M " + baseX + " " + (-halfWidth) + " L " + tipX + " 0 L " + baseX + " " + halfWidth);
        shape.setAttribute("fill", "none");
        shape.setAttribute("stroke", color);
        shape.setAttribute("stroke-width", strokeWidth);
        shape.setAttribute("stroke-linecap", "round");
        shape.setAttribute("stroke-linejoin", "round");
    }
    else {
        shape.setAttribute("d", "M " + baseX + " " + (-halfWidth) + " L " + tipX + " 0 L " + baseX + " " + halfWidth + " Z");
        shape.setAttribute("fill", color);
        shape.setAttribute("stroke", "none");
    }

    // Lets the blink CSS reach the head as well - see .poly-arrowhead rules in Envision.css.
    shape.setAttribute("class", "poly-arrowhead");

    marker.appendChild(shape);

    return marker;
}

// (Re)builds the arrowhead markers of one polyline object. Safe to call repeatedly: it always
// removes the previous defs first, so ids follow the object's CURRENT id after a copy/paste.
function RedrawPolylineArrows(ObjDom) {

    if (!ObjDom || !ObjDom.parentElement) return;

    RemovePolylineArrows(ObjDom);

    if (!PolylineHasArrow(ObjDom)) {
        // No arrows configured. Still rebuild the mask, so an arrow that was just switched OFF
        // gives its trimmed stroke end back instead of staying short.
        RebuildPolylineMask(ObjDom);
        return; // otherwise the object stays exactly as it was before this feature
    }

    var polyVisible = ObjDom.querySelector('polyline.poly-visible') || ObjDom.querySelector('polyline');

    if (!polyVisible) return;

    // The object's OWN stroke width, never the widest in the SVG: in edit mode that would be the
    // 14px invisible hit line and every head would come out four times too big.
    var strokeWidth = PolylineStrokeWidthOf(ObjDom);

    var length = PolylineArrowLength(ObjDom, strokeWidth);
    var color = PolylineStrokeColor(ObjDom);

    var svgns = "http://www.w3.org/2000/svg";
    var defs = document.createElementNS(svgns, "defs");
    defs.setAttribute("class", "poly-arrowdefs");

    var baseId = ObjDom.parentElement.id;
    var startStyle = ObjDom.getAttribute("data-arrowstart") || "None";
    var endStyle = ObjDom.getAttribute("data-arrowend") || "None";

    // A marker is painted as part of the element that references it, which means the mask that
    // trims the stroke back would punch its hole straight through the arrowhead as well and take
    // the point off it. So the heads are hung on their OWN copy of the line: same points, no
    // stroke of its own, and deliberately not masked. It paints nothing but its markers.
    var svgns = "http://www.w3.org/2000/svg";
    var carrier = document.createElementNS(svgns, "polyline");
    carrier.setAttribute("class", "poly-arrowcarrier");
    carrier.setAttribute("points", polyVisible.getAttribute("points") || "");
    carrier.setAttribute("fill", "none");
    carrier.setAttribute("stroke", "none");
    carrier.style.pointerEvents = "none";

    if (startStyle !== "None" && startStyle !== "") {
        var startId = baseId + "_arrowstart";
        defs.appendChild(BuildPolylineArrowMarker(startId, startStyle, length, strokeWidth, color, true));
        carrier.setAttribute("marker-start", "url(#" + startId + ")");
    }

    if (endStyle !== "None" && endStyle !== "") {
        var endId = baseId + "_arrowend";
        defs.appendChild(BuildPolylineArrowMarker(endId, endStyle, length, strokeWidth, color, false));
        carrier.setAttribute("marker-end", "url(#" + endId + ")");
    }

    // Appended, never prepended: RedrawPolylineHit() treats getElementsByTagName("polyline")[0]
    // as the visible line, so nothing may be inserted ahead of it.
    ObjDom.appendChild(defs);
    ObjDom.appendChild(carrier);

    // Stops the stroke short under each head, so the square end of the line does not show through
    // the point of the arrow.
    RebuildPolylineMask(ObjDom);
}

// Runtime counterpart of RedrawPolylineArrows, called from executePolylineObject on every tick.
// Rebuilding the markers each tick would churn the DOM for nothing, so this only repaints the
// existing heads when the line color actually changed (data-colorstates), and falls back to a
// full rebuild when the markers are missing or stale - which also re-ids them after a paste.
function SyncPolylineArrows(ObjDom) {

    if (!ObjDom || !ObjDom.parentElement) return;

    if (!PolylineHasArrow(ObjDom)) {

        // Arrows were switched off (or never on): drop anything left over from a previous state.
        if (ObjDom.querySelector('defs.poly-arrowdefs') || ObjDom.querySelector('polyline.poly-arrowcarrier')) {
            RemovePolylineArrows(ObjDom);
            RebuildPolylineMask(ObjDom);
        }
        return;
    }

    var defs = ObjDom.querySelector('defs.poly-arrowdefs');
    var carrier = ObjDom.querySelector('polyline.poly-arrowcarrier');
    var baseId = ObjDom.parentElement.id;

    // A missing defs or carrier, or a carrier whose marker ids no longer match this object's id
    // (a copy/paste carried the previous owner's ids over), needs the full rebuild. The missing
    // carrier also covers page markup saved while the markers still sat on the visible line
    // itself, which the mask would clip.
    if (!defs || !carrier ||
        (defs.firstChild && defs.firstChild.getAttribute("id") &&
         defs.firstChild.getAttribute("id").indexOf(baseId + "_arrow") !== 0)) {
        RedrawPolylineArrows(ObjDom);
        return;
    }

    // Keep the heads on the line even if the geometry moved without a designer redraw.
    var polyPoints = (ObjDom.querySelector('polyline.poly-visible') || ObjDom.querySelector('polyline'));

    if (polyPoints && carrier.getAttribute("points") !== polyPoints.getAttribute("points")) {
        carrier.setAttribute("points", polyPoints.getAttribute("points"));
    }

    var color = PolylineStrokeColor(ObjDom);

    defs.querySelectorAll('.poly-arrowhead').forEach(function (shape) {

        if (shape.getAttribute("fill") === "none") {
            if (shape.getAttribute("stroke") !== color) {
                shape.setAttribute("stroke", color);
            }
        }
        else if (shape.getAttribute("fill") !== color) {
            shape.setAttribute("fill", color);
        }
    });
}

// ── Polyline bridges (hops at crossings) ───────────────────────────────────────────────────────
// A line with data-bridge="true" hops OVER the lines it crosses. Two pieces per crossing:
//
//   1. a <mask> hole punched in the visible line, so the line itself is interrupted;
//   2. a <path class="poly-hop"> arc bridging the hole.
//
// Both live inside the object's own <svg>, so the arc inherits stroke color, stroke width, dash
// pattern and the blink animation from exactly the same place the line does — a hopped line and a
// plain line cannot drift apart. The mask is applied to the VISIBLE line only; the .poly-hit line
// stays continuous, so selecting and dragging a bridged line behaves exactly as before.
//
// Crossings are DERIVED, never stored: they are recomputed from live geometry on every design
// redraw and every runtime tick, so an API/MCP edit that moves a line can never leave a stale arc
// behind (the Design API knows nothing about hops and does not need to).

// Hop radius in px: half the width of the gap the arc spans.
function PolylineBridgeRadius(ObjDom, strokeWidth) {

    var size = parseFloat(ObjDom.getAttribute("data-bridgesize"));

    if (isNaN(size) || size <= 0) {
        size = 2.5; // default: 2.5x the stroke width
    }

    var radius = strokeWidth * size;

    if (radius < 4) {
        radius = 4;
    }

    return radius;
}

function PolylineStrokeWidthOf(ObjDom) {

    var strokeWidth = parseFloat(ObjDom.getAttribute("data-strokewidth"));

    if (!strokeWidth || isNaN(strokeWidth)) {
        var polyVisible = ObjDom.querySelector('polyline.poly-visible') || ObjDom.querySelector('polyline');
        if (polyVisible) {
            try {
                strokeWidth = parseFloat(window.getComputedStyle(polyVisible).strokeWidth);
            } catch (e) { }
        }
    }

    if (!strokeWidth || isNaN(strokeWidth)) {
        strokeWidth = 1;
    }

    return strokeWidth;
}

// Reads one polyline's points into PAGE coordinates. Every line on the page has its own absolutely
// positioned div with its own local origin, so crossings can only be compared in page space.
// PageObjectPos() walks offsetParent up to EnvisionPage, so a line nested in a GroupObject maps
// correctly too.
function PolylinePageGeometry(ObjDom) {

    var div = ObjDom.parentElement;

    if (!div) return null;

    var polyVisible = ObjDom.querySelector('polyline.poly-visible') || ObjDom.querySelector('polyline');

    if (!polyVisible) return null;

    var raw = polyVisible.getAttribute('points');

    if (!raw) return null;

    var origin = PageObjectPos(div);
    var pts = [];
    var tokens = raw.trim().split(/\s+/);

    for (var i = 0; i < tokens.length; i++) {

        var xy = tokens[i].split(',');

        if (xy.length < 2) continue;

        var x = parseFloat(xy[0]);
        var y = parseFloat(xy[1]);

        if (isNaN(x) || isNaN(y)) continue;

        pts.push({ x: origin.left + x, y: origin.top + y });
    }

    if (pts.length < 2) return null;

    var z = parseFloat(div.style.zIndex);

    return {
        ObjDom: ObjDom,
        div: div,
        origin: origin,
        points: pts,
        zIndex: isNaN(z) ? 0 : z,
        bridge: ObjDom.getAttribute("data-bridge") === "true"
    };
}

// Intersection of segments p1->p2 and p3->p4, excluding shared endpoints and parallel overlap.
// Returns the point plus how far along the FIRST segment it sits, or null.
function SegmentIntersection(p1, p2, p3, p4) {

    var d1x = p2.x - p1.x;
    var d1y = p2.y - p1.y;
    var d2x = p4.x - p3.x;
    var d2y = p4.y - p3.y;

    var denom = (d1x * d2y) - (d1y * d2x);

    if (denom === 0) {
        return null; // parallel or collinear: no single crossing to hop
    }

    var t = (((p3.x - p1.x) * d2y) - ((p3.y - p1.y) * d2x)) / denom;
    var u = (((p3.x - p1.x) * d1y) - ((p3.y - p1.y) * d1x)) / denom;

    // Strictly inside both segments; a shared corner is a junction, not a crossing.
    if (t <= 0.0001 || t >= 0.9999 || u <= 0.0001 || u >= 0.9999) {
        return null;
    }

    return {
        x: p1.x + (d1x * t),
        y: p1.y + (d1y * t),
        t: t
    };
}

// Decides which of two crossing lines draws the hop. Only a line that opted in can hop; when both
// opted in the one rendered on top hops, because a hop drawn under the other line is invisible.
// The id comparison is only a stable tie-break so the same line hops on every recompute.
function PolylineHops(a, b) {

    if (!a.bridge) return false;

    // A line can only hop over what it is drawn ON TOP OF. A hop drawn underneath the line it
    // crosses is painted over by it: the arc is cut in half and the gap in the stroke reads as
    // damage rather than as a crossing. So z-order decides, and ticking Bridge Crossings on the
    // lower line does nothing until it is raised above the line it crosses.
    if (a.zIndex !== b.zIndex) {
        return a.zIndex > b.zIndex;
    }

    // Equal z-index: the browser paints in document order, so whichever div comes later is on top.
    return (a.div.compareDocumentPosition(b.div) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
}

function RemovePolylineBridges(ObjDom) {

    if (!ObjDom) return;

    ObjDom._polyCrossings = null;
    ObjDom.querySelectorAll('path.poly-hop').forEach(function (p) { p.remove(); });

    // The mask is shared with the arrowhead trim, so it is rebuilt rather than dropped - an
    // arrowed line that stops bridging must keep the trim that hides its square stroke end.
    RebuildPolylineMask(ObjDom);
}

// ── The line's mask ────────────────────────────────────────────────────────────────────────────
// One mask per line, holding every piece of stroke that has to be taken away:
//
//   * a hole at each crossing, which is what a bridge hop spans;
//   * a hole at an end that carries an arrowhead.
//
// The second one exists because a triangle has ZERO width at its tip. The head's tip sits exactly
// on the line's end point, so for the last stretch the stroke is wider than the head covering it
// and its flat, square end shows through as a nub past the point of the arrow. Taking that stretch
// out of the stroke is what makes the head sit flush on the end of the line.
//
// Both live in one mask because an element can only carry one, and a line can need both at once.

// How far back from an arrowed end the stroke has to stop. The head is 0.4 x its length wide at
// the base, so at distance d from the tip it covers 0.4 x d - to cover a stroke of width w the
// stroke must therefore end at least w / 0.8 = 1.25 x w back from the tip.
function PolylineArrowTrim(strokeWidth) {
    return strokeWidth * 1.25;
}

function PolylinePointsOf(ObjDom) {

    var polyVisible = ObjDom.querySelector('polyline.poly-visible') || ObjDom.querySelector('polyline');

    if (!polyVisible) return [];

    var raw = polyVisible.getAttribute('points');

    if (!raw) return [];

    var pts = [];
    var tokens = raw.trim().split(/\s+/);

    for (var i = 0; i < tokens.length; i++) {
        var xy = tokens[i].split(',');
        if (xy.length < 2) continue;
        var x = parseFloat(xy[0]), y = parseFloat(xy[1]);
        if (isNaN(x) || isNaN(y)) continue;
        pts.push({ x: x, y: y });
    }

    return pts;
}

function RebuildPolylineMask(ObjDom) {

    if (!ObjDom || !ObjDom.parentElement) return;

    // poly-bridgedefs is the name this defs block had while the bridge mask and the arrow trim were
    // still separate. Pages saved in between carry one in their markup, and leaving it would put a
    // second mask with a colliding id in the document, so it is swept up here as well.
    ObjDom.querySelectorAll('defs.poly-maskdefs, defs.poly-bridgedefs').forEach(function (d) { d.remove(); });

    var polyVisible = ObjDom.querySelector('polyline.poly-visible') || ObjDom.querySelector('polyline');

    if (!polyVisible) return;

    var svgns = "http://www.w3.org/2000/svg";
    var strokeWidth = PolylineStrokeWidthOf(ObjDom);
    var holes = [];

    // Bridge crossings, as computed by the last RedrawPolylineBridges() pass.
    //
    // The cut is a straight-edged box ACROSS the line, not a disc. A disc bites the stroke away on
    // both sides of the centre line, but the hop that replaces it is a semicircle covering only the
    // upper side - which left the underside of each foot cut away with nothing over it, a small
    // notch that a border made four times more obvious. A box aligned to the segment ends the
    // stroke on a straight edge exactly under each foot, where the arc's own end meets it flush.
    var crossings = ObjDom._polyCrossings;

    if (crossings && crossings.length) {

        var radius = PolylineBridgeRadius(ObjDom, strokeWidth);

        // Across the line the cut has to clear the border as well, because the border clone reuses
        // this same mask and its stroke is the line's plus twice the border width. Kept no wider
        // than that, so a neighbouring segment of the SAME line passing close by is not cut too.
        var borderWidth = parseFloat((ObjDom.getAttribute("data-borderwidth") || "0").replace("px", ""));

        if (isNaN(borderWidth)) {
            borderWidth = 0;
        }

        var halfWidth = (strokeWidth / 2) + borderWidth + 1;

        // Along the line the cut reaches half a stroke PAST the arc's feet. The arc meets the line
        // at a right angle, so its foot is a band centred on the foot point: half of it lands
        // beyond the cut and half before it, which left a little step at every foot. Cutting to the
        // far edge of that band instead, and squaring off the arc's ends (see the hop path), makes
        // the two silhouettes finish in the same place.
        var reach = radius + (strokeWidth / 2);

        for (var i = 0; i < crossings.length; i++) {

            var c = crossings[i];

            holes.push({
                cls: "poly-bridgehole",
                points: [
                    [c.x - (c.dx * reach) - (-c.dy * halfWidth), c.y - (c.dy * reach) - (c.dx * halfWidth)],
                    [c.x + (c.dx * reach) - (-c.dy * halfWidth), c.y + (c.dy * reach) - (c.dx * halfWidth)],
                    [c.x + (c.dx * reach) + (-c.dy * halfWidth), c.y + (c.dy * reach) + (c.dx * halfWidth)],
                    [c.x - (c.dx * reach) + (-c.dy * halfWidth), c.y - (c.dy * reach) + (c.dx * halfWidth)]
                ]
            });
        }
    }

    // Arrowhead ends. Only a FILLED head needs the stroke pulled back: it is solid, so it hides
    // the square end of the line, and a triangle is too narrow near its tip to do that without the
    // trim. An OPEN head is two stroked legs with nothing between them, so trimming would leave a
    // hole where the line stops short of the vertex - and it does not need one, because the legs
    // meet in a joint of exactly the line's own width and cover the end anyway.
    var startStyle = ObjDom.getAttribute("data-arrowstart") || "None";
    var endStyle = ObjDom.getAttribute("data-arrowend") || "None";

    if (startStyle === "Arrow" || endStyle === "Arrow") {

        var pts = PolylinePointsOf(ObjDom);

        if (pts.length >= 2) {

            var trim = PolylineArrowTrim(strokeWidth);

            if (startStyle === "Arrow") {
                holes.push({ x: pts[0].x, y: pts[0].y, r: trim, cls: "poly-arrowtrim" });
            }

            if (endStyle === "Arrow") {
                holes.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, r: trim, cls: "poly-arrowtrim" });
            }
        }
    }

    if (holes.length === 0) {
        polyVisible.removeAttribute("mask");
        polyVisible.style.mask = "";
        return;
    }

    var defs = document.createElementNS(svgns, "defs");
    defs.setAttribute("class", "poly-maskdefs");

    // The mask region is deliberately NOT derived from the viewBox. ResetViewBoxPolyline() resizes
    // viewBoxes one object at a time, so a mask sized to the box could be built from a stale one
    // and silently erase part of a line. A region far larger than any page keeps "white = keep"
    // true everywhere and makes the mask independent of when the viewBox is recalculated.
    var maskId = ObjDom.parentElement.id + "_linemask";
    var mask = document.createElementNS(svgns, "mask");
    mask.setAttribute("id", maskId);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    mask.setAttribute("x", -100000);
    mask.setAttribute("y", -100000);
    mask.setAttribute("width", 200000);
    mask.setAttribute("height", 200000);

    // White keeps, black removes.
    //
    // stroke MUST be turned off on every shape in here. Mask content inherits from the <svg>, which
    // carries the line's own stroke colour and width - so a "black" hole was being outlined with a
    // 4px band of the line colour, and a mask reads LUMINANCE: that outline is not 0, it is roughly
    // 0.2 for a mid blue. The result was the line reappearing at about 20% right where it was
    // supposed to be cut away, in a band as wide as the shape's stroke.
    var keep = document.createElementNS(svgns, "rect");
    keep.setAttribute("x", -100000);
    keep.setAttribute("y", -100000);
    keep.setAttribute("width", 200000);
    keep.setAttribute("height", 200000);
    keep.setAttribute("fill", "#fff");
    keep.setAttribute("stroke", "none");
    mask.appendChild(keep);

    for (var h = 0; h < holes.length; h++) {

        var hole;

        if (holes[h].points) {
            // Straight-edged cut across the line (a bridge).
            hole = document.createElementNS(svgns, "polygon");
            hole.setAttribute("points", holes[h].points.map(function (p) { return p[0] + "," + p[1]; }).join(" "));
        }
        else {
            // Round cut at a line end (under a filled arrowhead, which is round enough to hide it).
            hole = document.createElementNS(svgns, "circle");
            hole.setAttribute("cx", holes[h].x);
            hole.setAttribute("cy", holes[h].y);
            hole.setAttribute("r", holes[h].r);
        }

        hole.setAttribute("class", holes[h].cls);
        hole.setAttribute("fill", "#000");
        hole.setAttribute("stroke", "none"); // see the note on the keep rect above
        mask.appendChild(hole);
    }

    defs.appendChild(mask);
    ObjDom.appendChild(defs);

    polyVisible.setAttribute("mask", "url(#" + maskId + ")");
}

// Draws the hops of ONE line from crossings already reduced to that line's local coordinates.
function ApplyPolylineBridges(geo, crossings) {

    var ObjDom = geo.ObjDom;
    var had = (ObjDom._polyCrossings && ObjDom._polyCrossings.length) ? true : false;

    ObjDom.querySelectorAll('path.poly-hop').forEach(function (p) { p.remove(); });
    ObjDom._polyCrossings = (crossings && crossings.length) ? crossings : null;

    // The crossings feed the shared mask, which also carries the arrowhead trims.
    RebuildPolylineMask(ObjDom);

    if (!crossings || crossings.length === 0) {

        // Went from bridged to plain: shrink the box back and rebuild the border clone, which
        // still carries the old hop.
        if (had) {
            ResetViewBoxPolyline(ObjDom);
        }
        return;
    }

    var svgns = "http://www.w3.org/2000/svg";
    var radius = PolylineBridgeRadius(ObjDom, PolylineStrokeWidthOf(ObjDom));
    var d = "";

    for (var i = 0; i < crossings.length; i++) {

        var c = crossings[i];

        // The arc spans exactly the hole the mask punched, so its ends meet the line ends.
        var ax = c.x - (c.dx * radius);
        var ay = c.y - (c.dy * radius);
        var bx = c.x + (c.dx * radius);
        var by = c.y + (c.dy * radius);

        d += "M " + ax + " " + ay + " A " + radius + " " + radius + " 0 0 1 " + bx + " " + by + " ";
    }

    var hop = document.createElementNS(svgns, "path");
    hop.setAttribute("class", "poly-hop");
    hop.setAttribute("d", d.trim());
    hop.setAttribute("fill", "none");

    // Square ends, whatever Line Cap the line itself uses. The arc meets the line at a right angle,
    // so a square cap extends it back across the line's own thickness and it finishes flush with
    // the cut instead of stopping on the centre line and leaving a step. The caps are buried inside
    // the line, so this is never visible as a cap - and it must be set here rather than inherited,
    // because a Butt cap (the default) is exactly what produced the step.
    hop.style.strokeLinecap = "square";

    // No stroke/color set on purpose: inheriting from the <svg> is what keeps a hop in step with
    // colorstates, the blink classes and data-linestyle without a second code path.
    ObjDom.appendChild(hop);

    // A hop bulges one radius PERPENDICULAR to the line, far outside the half-stroke padding a
    // plain line needs, so the box has to be re-padded or every arc is clipped flat by the SVG
    // edge. This also rebuilds the border clone from the markup that now has the mask and the hop,
    // which a bordered line needs or its continuous border fills the gap straight back in.
    ResetViewBoxPolyline(ObjDom);
}

// Page-wide recompute. Cheap to call repeatedly: it fingerprints the geometry it used and returns
// immediately when nothing that affects crossings has moved.
var PolylineBridgeSignature = null;

function RedrawPolylineBridges(force) {

    var page = document.getElementById("EnvisionPage");

    if (!page) return;

    var svgs = page.getElementsByClassName("polylineobject");
    var geos = [];
    var anyBridge = false;

    for (var i = 0; i < svgs.length; i++) {

        var geo = PolylinePageGeometry(svgs.item(i));

        if (!geo) continue;

        if (geo.bridge) {
            anyBridge = true;
        }

        geos.push(geo);
    }

    if (!anyBridge) {

        // Nothing opts in. The cleanup still has to run ONCE per page even when this session drew
        // nothing: hops are saved into the page HTML like every other rendered element, so a page
        // whose last save had bridges - and that has since had data-bridge removed through the
        // Design API - would otherwise keep showing arcs nobody can account for. "" is the
        // cleaned state and the initial null is not, so the first call always sweeps.
        if (PolylineBridgeSignature !== "") {
            for (var c = 0; c < geos.length; c++) {

                var wasBridged = (geos[c].ObjDom._polyCrossings && geos[c].ObjDom._polyCrossings.length) ? true : false;

                RemovePolylineBridges(geos[c].ObjDom);

                // Give back the extra room the hop arcs needed, so the box matches the plain line
                // again instead of keeping a bridge-sized viewBox nothing draws into.
                if (wasBridged) {
                    ResetViewBoxPolyline(geos[c].ObjDom);
                }
            }
            PolylineBridgeSignature = "";
        }
        return;
    }

    // Fingerprint: object id, page origin and points of every line, so any move, resize, point
    // drag, z-index change or opt-in toggle invalidates it.
    var signature = "";

    for (var s = 0; s < geos.length; s++) {
        signature += geos[s].div.id + "|" + geos[s].bridge + "|" + geos[s].zIndex + "|";
        for (var p = 0; p < geos[s].points.length; p++) {
            signature += geos[s].points[p].x + "," + geos[s].points[p].y + " ";
        }
        signature += ";";
    }

    if (!force && signature === PolylineBridgeSignature) {
        return;
    }

    PolylineBridgeSignature = signature;

    for (var a = 0; a < geos.length; a++) {

        var self = geos[a];
        var crossings = [];

        if (self.bridge) {

            for (var b = 0; b < geos.length; b++) {

                if (a === b) continue;

                var other = geos[b];

                if (!PolylineHops(self, other)) continue;

                for (var si = 0; si < self.points.length - 1; si++) {

                    var s1 = self.points[si];
                    var s2 = self.points[si + 1];

                    var segLength = Math.sqrt(((s2.x - s1.x) * (s2.x - s1.x)) + ((s2.y - s1.y) * (s2.y - s1.y)));

                    if (segLength === 0) continue;

                    var dx = (s2.x - s1.x) / segLength;
                    var dy = (s2.y - s1.y) / segLength;

                    var radius = PolylineBridgeRadius(self.ObjDom, PolylineStrokeWidthOf(self.ObjDom));

                    for (var oi = 0; oi < other.points.length - 1; oi++) {

                        var hit = SegmentIntersection(s1, s2, other.points[oi], other.points[oi + 1]);

                        if (!hit) continue;

                        // A crossing closer to a corner than the hop is wide would produce an arc
                        // that runs off the end of its own segment; leave those lines plain.
                        var along = hit.t * segLength;

                        if (along < radius || (segLength - along) < radius) continue;

                        crossings.push({
                            x: hit.x - self.origin.left,
                            y: hit.y - self.origin.top,
                            dx: dx,
                            dy: dy
                        });
                    }
                }
            }
        }

        ApplyPolylineBridges(self, crossings);
    }
}

function ResetViewBoxPolylineBorder(ObjDom) {

    var viewportwidth = parseFloat(ObjDom.parentElement.style.width.replace("px", ""));
    var viewportheight = parseFloat(ObjDom.parentElement.style.height.replace("px", ""));

    // Determine the maximum stroke width of polylines inside this border SVG
    var strokeWidth = 0;
    var polylines = ObjDom.querySelectorAll("polyline");

    for (var i = 0; i < polylines.length; i++) {
        var pl = polylines[i];
        var sw = 0;

        var attr = pl.getAttribute("stroke-width");
        if (attr) {
            sw = parseFloat(attr);
        } else if (pl.style.strokeWidth) {
            sw = parseFloat(pl.style.strokeWidth);
        } else {
            try {
                var cs = window.getComputedStyle(pl);
                if (cs && cs.strokeWidth) {
                    sw = parseFloat(cs.strokeWidth);
                }
            } catch (e) { }
        }

        if (!isNaN(sw) && sw > strokeWidth) {
            strokeWidth = sw;
        }
    }

    if (!strokeWidth || isNaN(strokeWidth)) {
        strokeWidth = 1;
    }

    // Symmetric padding so the fat border is fully visible. A bridged border also carries the hop
    // arc, which bulges one hop RADIUS perpendicular to the line - far outside half the border
    // stroke. Without this term the arc is clipped flat by the border SVG's own edge and the
    // border reads as "not bridging" even though its mask and its arc are both there.
    var pad = strokeWidth / 2;

    if (ObjDom.getAttribute("data-bridge") === "true") {

        // The hop geometry was cloned from the real line, so its radius comes from the LINE's
        // stroke width (data-strokewidth), not from the fatter border stroke measured above.
        var hop = PolylineBridgeRadius(ObjDom, PolylineStrokeWidthOf(ObjDom)) + (strokeWidth / 2);

        if (hop > pad) {
            pad = hop;
        }
    }

    var viewboxLeft = -pad;
    var viewboxTop = -pad;
    var viewboxWidth = viewportwidth + (pad * 2);
    var viewboxHeight = viewportheight + (pad * 2);

    ObjDom.setAttribute("height", viewportheight + (pad * 2));
    ObjDom.setAttribute("width", viewportwidth + (pad * 2));

    ObjDom.style.border = "0px solid red";
    ObjDom.style.marginLeft = -pad + "px";
    ObjDom.style.marginTop = -pad + "px";

    ObjDom.setAttribute(
        "viewBox",
        viewboxLeft + " " + viewboxTop + " " + viewboxWidth + " " + viewboxHeight
    );
}

function RedrawPolylineBorder(element) {
    
    // element is usually the inner <svg> or something inside it
    RemovePolylineBorder(element.parentElement);
    
    var polylineobject = element.parentElement.cloneNode(true);
    var ObjDom = polylineobject.getElementsByTagName('svg')[0];
    if (!ObjDom) return;

    if (ObjDom.getAttribute("data-borderwidth")) {

        var borderWidth = parseFloat(
            ObjDom.getAttribute("data-borderwidth").replace("px", "")
        );

        if (isNaN(borderWidth) || borderWidth === 0) {
            return;
        }

        // 🔹 get the visible polyline (geometry for the border)
        var polyVisible = ObjDom.querySelector('polyline.poly-visible')
            || ObjDom.querySelector('polyline');
        if (!polyVisible) return;

        // base stroke: from visible polyline, not from svg

        var strokeWidth = 1;

        if (ObjDom.getAttribute("data-strokewidth")) {
            strokeWidth = parseFloat(ObjDom.getAttribute('data-strokewidth'));
        }
        //else
        //{
        //    strokeWidth = parseFloat(polyVisible.getAttribute('stroke-width'));
        //}

        var borderColor = GetObjectColor(ObjDom.getAttribute("data-bordercolor"));
        polyVisible.parentElement.style.stroke = GetObjectColor(bordercolor);

        polylineobject.classList.remove('draggable');
        polylineobject.classList.remove('ActiveSelected');
        polylineobject.setAttribute('name', "PolylineBorder");
        polylineobject.style.zIndex = element.parentElement.style.zIndex - 1;

        polylineobject.style.pointerEvents = "";
        polylineobject.style.cursor = "";

        // 🔹 in the cloned border, we don't need the hit line at all
        var hitClones = ObjDom.querySelectorAll('.poly-hit');
        hitClones.forEach(function (h) { h.remove(); });

        // The border is a deep clone, so it would carry a duplicate of the arrowhead <defs> with
        // the SAME marker ids as the real object - two elements answering to one id, and every
        // reference resolving to whichever comes first in the document. Strip them: the border
        // outlines the line, the arrowheads stay on the object itself.
        RemovePolylineArrows(ObjDom);

        // 🔹 apply border thickness to the visible line in the clone
        // base border stroke width
        var borderStrokeWidth = strokeWidth + (borderWidth * 2);

        // round to nearest integer
        borderStrokeWidth = Math.round(borderStrokeWidth);

        // force even number to avoid half-pixel artifacts
        if (borderStrokeWidth % 2 !== 0) {
            borderStrokeWidth += 1;
        }

        polyVisible.style.strokeWidth = borderStrokeWidth + "px";

        // The border is drawn BEHIND the line and is deliberately fatter, so it has to hop with the
        // line: a continuous border would simply fill the gap back in and the bridge would vanish
        // wherever a border is configured. The cloned mask keeps its geometry but needs its own id
        // (the clone would otherwise answer to the original's id), and the cloned hop arc needs the
        // border thickness, because it inherits stroke-width from the <svg> rather than the line.
        // Any legacy defs the source still carried was already dropped by RebuildPolylineMask, but
        // the clone is taken from whatever is in the DOM, so guard the border the same way.
        ObjDom.querySelectorAll('defs.poly-bridgedefs').forEach(function (d) { d.remove(); });

        var clonedMask = ObjDom.querySelector('defs.poly-maskdefs mask');

        if (clonedMask) {

            // The arrowheads were stripped from the border above, so the trim holes that hid the
            // stroke ends underneath them have nothing covering them any more and would just leave
            // the border's ends cut short. Only the crossing holes belong on the border.
            clonedMask.querySelectorAll('circle.poly-arrowtrim').forEach(function (c) { c.remove(); });

            if (clonedMask.querySelector('.poly-bridgehole')) {

                var borderMaskId = element.parentElement.id + "_border_linemask";

                clonedMask.setAttribute("id", borderMaskId);
                polyVisible.setAttribute("mask", "url(#" + borderMaskId + ")");

                ObjDom.querySelectorAll('path.poly-hop').forEach(function (hop) {
                    hop.style.strokeWidth = borderStrokeWidth + "px";
                });
            }
            else {
                // Nothing left to take out of the border: drop the mask entirely rather than leave
                // it pointing at an id that is about to be a duplicate of the real line's.
                clonedMask.parentElement.remove();
                polyVisible.removeAttribute("mask");
            }
        }

        //polyVisible.setAttribute("stroke-width", borderStrokeWidth);
        //polyVisible.style.stroke = borderColor;

        ResetViewBoxPolylineBorder(ObjDom);

        polylineobject.id = element.parentElement.id + "_border";
        polylineobject.classList.add("PolylineBorder");

        // keep only the svg inside the border wrapper
        $(polylineobject).children().not('svg').remove();
        ObjDom.classList.remove('polylineobject');

        ObjDom.removeAttribute("onclick");

        ObjDom.setAttribute(
            "onclick",
            "ClickAction(document.getElementById('" + element.parentElement.id + "'), event)"
        );

        element.parentElement.parentElement.appendChild(polylineobject);
    }
}
function RemovePolylineBorder(polylineobject) {

    if (document.getElementById(polylineobject.id + "_border")) {
        document.getElementById(polylineobject.id + "_border").remove();
    }

}

function RemovePolylineBordersInsideGroup(group) {

    var PolylineObjects = group.querySelectorAll('[name="PolylineObject"]')

    for (var i = 0; i < PolylineObjects.length; i++) {

        RemovePolylineBorder(PolylineObjects.item(i).parentElement);
    }
}
function RedrawPolylineBordersInsideGroup(group) { 

    var PolylineObjects = group.querySelectorAll('[name="PolylineObject"]')

    for (var i = 0; i < PolylineObjects.length; i++) {

        RedrawPolylineBorder(PolylineObjects.item(i));
    }
}

function ResetPolylineBorders(group) {

    var source = document.getElementById("EnvisionPage");

    if (group) {
        source = group;
    }

    source.querySelectorAll('.PolylineBorder').forEach(e => e.remove());

    var PolylineObjects = source.querySelectorAll('[name="PolylineObject"]')

    //console.log('count ' + PolylineObjects.length);
    for (var i = 0; i < PolylineObjects.length; i++) {

        var PolylineObject = PolylineObjects.item(i);
        var dom = getObjDom(PolylineObject);
        RedrawPolylineBorder(dom);
    }

    RedrawPolylineDots();
}

function RedrawPolygonDots() {

    RemovePolygonDots();

    if (!EditMode) {
        return;
    }

    var polygonobjects = document.getElementById("EnvisionPage").getElementsByClassName("polygonobject");
    
    for (var i = 0; i < polygonobjects.length; i++) {

        var polygonobject = polygonobjects.item(i);

        if (polygonobject.parentElement.style.pointerEvents == "none") {
            return;
        }

        RedrawPolygonDot(polygonobject);
  
    }
}

function RedrawPolygonDot(polygonobject) {

    if (CheckLocked(polygonobject.parentElement) === true) {  // locked
        return;
    }

    polygonobject.parentElement.querySelectorAll('.polygondot').forEach(e => e.remove());

    let polygon = polygonobject.getElementsByTagName("polygon")[0];

    polygonpoints = polygon.getAttribute('points');

    var points = [];
    var pointsX = [];
    var pointsY = [];

    points = polygonpoints.split(',');

    for (var j = 0; j < points.length; j++) {
        var xy = points[j].split(' ');
        pointsX[j] = xy[0];
        pointsY[j] = xy[1];

        var dot = document.createElement("div");
        dot.className = "polygondot";
        dot.style.left = (xy[0] - 5) + "px";
        dot.style.top = (xy[1] - 5) + "px";
        dot.setAttribute("data-polygonobjectid", polygonobject.parentElement.id);
        dot.setAttribute("data-polygondotno", j);
        dot.setAttribute("data-polygondotx", xy[0]);
        dot.setAttribute("data-polygondoty", xy[1]);
        dot.style.zIndex = polygonobject.style.zIndex + 1;

        if (window.polygonobject && polygondotno) {
            if (window.polygonobject.id == polygonobject.parentElement.id && j == polygondotno) {
                dot.style.borderColor = '#FFA500';
                //console.log("orange");
            }
        }

        dot.addEventListener("mousedown", StartDragPolygonDot, false);

        polygonobject.parentElement.appendChild(dot);
    }
}

function StartDragPolygonDot(e) {

    DraggingObject = true;

    ClosePolygonDotContextMenu();

    var caller = e.target || e.srcElement;
    //console.log(caller);

    e.stopPropagation(); // prevents selecting object

    polygonobjectid = caller.getAttribute("data-polygonobjectid");
    polygondotno = caller.getAttribute("data-polygondotno");
    polygondotx = caller.getAttribute("data-polygondotx");
    polygondoty = caller.getAttribute("data-polygondoty");

    //console.log(polygonobjectid);
    polygonobject = document.getElementById(polygonobjectid);

    ClassListAddSelectedActive(polygonobject);

    polygon = polygonobject.getElementsByTagName("polygon")[0];

    if (e.which == 3) {
        var PolygonDotContextMenu = document.getElementById('PolygonDotContextMenu');
        PolygonDotContextMenu.style.display = "block";
        PolygonDotContextMenu.style.left = e.clientX + 20 + "px";
        PolygonDotContextMenu.style.top = e.clientY + "px";
        return;
    }

    document.documentElement.addEventListener('mousemove', doDragPolygonDot, false);
    document.documentElement.addEventListener('mouseup', stopDragPolygonDot, false);

    // Remember where the dot was grabbed relative to the cursor, in page units and in
    // page coordinates, so the point can be snapped to the page grid while dragging.
    var cursor = CursorPagePos(e);
    var origin = PageObjectPos(polygonobject);

    polygondotgrabx = origin.left + parseFloat(polygondotx) - cursor.left;
    polygondotgraby = origin.top + parseFloat(polygondoty) - cursor.top;

    SetResetTexts();
}

function doDragPolygonDot(e) {

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polygonpoints = polygon.getAttribute('points');

    points = polygonpoints.split(',');

    for (var i = 0; i < points.length; i++) {
        var xy = points[i].split(' ');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];
    }

    // Snap the dragged dot on the page grid itself, not on a grid relative to the object
    // origin: the origin drifts off the grid when points are added or the object is
    // resized, and a relative snap would then keep the dot permanently off the grid.
    var cursor = CursorPagePos(e);
    var origin = PageObjectPos(polygonobject);

    var targetx = roundDownToNearestX(cursor.left + polygondotgrabx) - origin.left;
    var targety = roundDownToNearestX(cursor.top + polygondotgraby) - origin.top;

    //recalc points ~ only the dragged dot moves, the others keep their position
    for (var i = 0; i < points.length; i++) {

        newx = parseFloat(pointsX[i]);
        newy = parseFloat(pointsY[i]);

        if (i == polygondotno) {

            newx = targetx;
            newy = targety;
        }

        pointsX[i] = newx;
        pointsY[i] = newy;
    }

    ResizePolygonDraggable(points, pointsX, pointsY);
}

function stopDragPolygonDot() {
    document.documentElement.removeEventListener('mousemove', doDragPolygonDot, false);
    document.documentElement.removeEventListener('mouseup', stopDragPolygonDot, false);

    polygondotno = undefined;

    ResetViewBoxPolygon(getObjDom(polygonobject));
    RedrawPolygonDots();

    DraggingObject = false;

    DeselectAllObjects();

    if (true) {
        saveSnapshot();
    }
}

function ResizePolygonDraggable(points, pointsX, pointsY) {

    if (!points) {
        points = [];
        pointsX = [];
        pointsY = [];

        var polygonpoints = polygon.getAttribute('points');

        points = polygonpoints.split(',');

        for (var i = 0; i < points.length; i++) {
            var xy = points[i].split(' ');
            pointsX[i] = xy[0];
            pointsY[i] = xy[1];
        }
    }

    var polygonobjectwidth = parseFloat(polygonobject.style.width.replace('px', ''));
    var polygonobjectheight = parseFloat(polygonobject.style.height.replace('px', ''));
    var polygonobjectleft = parseFloat(polygonobject.style.left.replace('px', ''));
    var polygonobjecttop = parseFloat(polygonobject.style.top.replace('px', ''));

    //make draggable wider when necessary
    for (var i = 0; i < points.length; i++) {

        newx = pointsX[i];
        newy = pointsY[i];

        if (newx > polygonobjectwidth) {
            polygonobject.style.width = newx + 'px';
        }

        //console.log('newy ' + newy);

        if (newy > polygonobjectheight) {
            polygonobject.style.height = newy + 'px';
        }

        //console.log('polygonobjectheight ' + polygonobjectheight);

        if (newx < 0) {

            polygonobject.style.left = (polygonobjectleft - Math.abs(newx)) + 'px';

            polygonobject.style.width = (polygonobjectwidth + Math.abs(newx)) + 'px';

            for (var j = 0; j < points.length; j++) {
                if (j != polygondotno) {
                    pointsX[j] = parseFloat(pointsX[j]) + Math.abs(newx);
                }
            }

            newx = 0;
        }

        if (newy < 0) {

            polygonobject.style.top = (polygonobjecttop - Math.abs(newy)) + 'px';

            polygonobject.style.height = (polygonobjectheight + Math.abs(newy)) + 'px';

            for (var j = 0; j < points.length; j++) {
                if (j != polygondotno) {
                    pointsY[j] = parseFloat(pointsY[j]) + Math.abs(newy);
                }
            }

            newy = 0;
        }

        pointsX[i] = newx;
        pointsY[i] = newy;
    }

    //make draggable smaller when necessary
    var smallestx = 99999;
    var smallesty = 99999;
    var biggestx = -99999;
    var biggesty = -99999;

    for (var i = 0; i < points.length; i++) {

        var pointX = parseFloat(pointsX[i]);
        var pointY = parseFloat(pointsY[i]);

        if (pointX < smallestx) {
            smallestx = pointX;
        }

        if (pointX > biggestx) {
            biggestx = pointX;
        }

        if (pointY < smallesty) {
            smallesty = pointY;
        }

        if (pointY > biggesty) {
            biggesty = pointY;
        }
    }

    //console.log('smallestx ' + smallestx);
    //console.log('biggestx ' + biggestx);
    //console.log('smallesty ' + smallesty);
    //console.log('biggesty ' + biggesty);

    if (biggestx < polygonobjectwidth) {
        polygonobject.style.width = biggestx + 'px';
    }

    if (biggesty < polygonobjectheight) {
        polygonobject.style.height = biggesty + 'px';
    }

    if (smallestx > 0) {

        polygonobject.style.left = (polygonobjectleft + smallestx) + 'px';

        polygonobject.style.width = (polygonobjectwidth - smallestx) + 'px';

        for (var j = 0; j < points.length; j++) {
            pointsX[j] = parseFloat(pointsX[j]) - smallestx;
        }
    }

    if (smallesty > 0) {

        polygonobject.style.top = (polygonobjecttop + smallesty) + 'px';

        polygonobject.style.height = (polygonobjectheight - smallesty) + 'px';
        //console.log('polygonobjectheight ' + polygonobjectheight);
        //console.log('smallesty ' + smallesty);
        //console.log(polygonobject.style.height);
        for (var j = 0; j < points.length; j++) {
            pointsY[j] = parseFloat(pointsY[j]) - smallesty;
        }

        newy = 0;
    }

    var newpoints = "";

    for (var i = 0; i < points.length; i++) {

        newx = pointsX[i];
        newy = pointsY[i];

        newpoints = newpoints + newx + " " + newy + ",";
    }

    newpoints = newpoints.slice(0, -1); // remove last 

    //console.log('newpoints ' + newpoints);
    //console.log('movementx ' + movementx);
    //console.log('movementy ' + movementy);

    polygon.setAttribute('points', newpoints);
    //console.log("e.clientX " + e.clientX + " - " + "e.clientY " + e.clientY);

    ResetViewBoxPolygon(getObjDom(polygonobject));
    SetResetTexts();
    SetBorders();

    RedrawPolygonDots();
}

function RemovePolygonDots() {

    var polygonobjects = document.getElementById("EnvisionPage").getElementsByClassName("polygonobject");

    for (var i = 0; i < polygonobjects.length; i++) {

        var polygonobject = polygonobjects.item(i);

        RemovePolygonDot(polygonobject);
    }
}
function RemovePolygonDot(polygonobject) {
    polygonobject.parentElement.querySelectorAll('.polygondot').forEach(e => e.remove());
}

function ClosePolygonDotContextMenu() {
    document.getElementById('PolygonDotContextMenu').style.display = "none";
}

function PolygonDotAddBefore() {

    ClosePolygonDotContextMenu();

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polygonpoints = polygon.getAttribute('points');

    points = polygonpoints.split(',');

    for (var i = 0; i < points.length; i++) {

        var xy = points[i].split(' ');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];
    }

    var newpoints = "";

    for (var i = 0; i < points.length; i++) {

        if (i == polygondotno) {
            newpoints = newpoints + pointsX[i] + " " + pointsY[i] + ",";

            var newpoint;

            if (i == points.length - 1) {
                newpoint = 0;
            }
            else {
                newpoint = i + 1;
            }

            var newpointx = Math.abs(parseFloat(pointsX[i]) - parseFloat(pointsX[newpoint])) / 2;
            var newpointy = Math.abs(parseFloat(pointsY[i]) - parseFloat(pointsY[newpoint])) / 2;

            if ((parseFloat(pointsX[i]) < parseFloat(pointsX[newpoint]))) {
                newpointx = parseFloat(pointsX[i]) + newpointx;
            } else {
                newpointx = parseFloat(pointsX[newpoint]) + newpointx;
            }

            if ((parseFloat(pointsY[i]) < parseFloat(pointsY[newpoint]))) {
                newpointy = parseFloat(pointsY[i]) + newpointy;
            } else {
                newpointy = parseFloat(pointsY[newpoint]) + newpointy;
            }

            newpoints = newpoints + newpointx + " " + newpointy + ",";
        }
        else {
            newpoints = newpoints + pointsX[i] + " " + pointsY[i] + ",";
        }
    }

    newpoints = newpoints.slice(0, -1); // remove last ,
    //console.log(newpoints);
    polygon.setAttribute('points', newpoints);

    ResizePolygonDraggable();

    if (true) {
        saveSnapshot();
    }

}

function PolygonDotAddBehind() {

    ClosePolygonDotContextMenu();

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polygonpoints = polygon.getAttribute('points');

    points = polygonpoints.split(',');

    for (var i = 0; i < points.length; i++) {

        var xy = points[i].split(' ');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];
    }

    var newpoints = "";

    for (var i = 0; i < points.length; i++) {

        if (i == polygondotno) {
            var newpoint;

            if (i == 0) {
                newpoint = points.length - 1;
            }
            else {
                newpoint = i - 1;
            }

            var newpointx = Math.abs(parseFloat(pointsX[i]) - parseFloat(pointsX[newpoint])) / 2;
            var newpointy = Math.abs(parseFloat(pointsY[i]) - parseFloat(pointsY[newpoint])) / 2;

            if ((parseFloat(pointsX[i]) < parseFloat(pointsX[newpoint]))) {
                newpointx = parseFloat(pointsX[i]) + newpointx;
            } else {
                newpointx = parseFloat(pointsX[newpoint]) + newpointx;
            }

            if ((parseFloat(pointsY[i]) < parseFloat(pointsY[newpoint]))) {
                newpointy = parseFloat(pointsY[i]) + newpointy;
            } else {
                newpointy = parseFloat(pointsY[newpoint]) + newpointy;
            }

            newpoints = newpoints + newpointx + " " + newpointy + ",";
        }

        newpoints = newpoints + pointsX[i] + " " + pointsY[i] + ",";

    }

    newpoints = newpoints.slice(0, -1); // remove last ,
    //console.log(newpoints);
    polygon.setAttribute('points', newpoints);

    ResizePolygonDraggable();

    if (true) {
        saveSnapshot();
    }
}

function PolygonDotRemove() {

    ClosePolygonDotContextMenu();

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polygonpoints = polygon.getAttribute('points');

    points = polygonpoints.split(',');

    if (points.length == 3) {
        document.getElementById("CustomModalText").innerHTML = 'The polygon must have at least 3 corners.';
        var myModal = new bootstrap.Modal(document.getElementById('CustomModal'));
        myModal.show();
        return;
    }

    var newpoints = ""

    for (var i = 0; i < points.length; i++) {

        var xy = points[i].split(' ');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];

        if (i == polygondotno) {
            continue;
        }
        newpoints = newpoints + pointsX[i] + " " + pointsY[i] + ",";
    }

    newpoints = newpoints.slice(0, -1); // remove last ,
    /*console.log(newpoints);*/
    polygon.setAttribute('points', newpoints);

    ResizePolygonDraggable();

    if (true) {
        saveSnapshot();
    }
}

function PolygonDotCancel() {
    ClosePolygonDotContextMenu();
}

// -

function RedrawPolylineDots() {

    RemovePolylineDots();

    // Crossings are page-wide, so they are refreshed here rather than per object: this runs after
    // every move, resize, point drag, paste, undo and group operation. The call is fingerprinted
    // and returns immediately when no geometry that affects a crossing has changed.
    RedrawPolylineBridges();

    if (!EditMode) {
        return;
    }

    var polylineobjects = document.getElementById("EnvisionPage").getElementsByClassName("polylineobject");

    for (var i = 0; i < polylineobjects.length; i++) {

        var polylineobject = polylineobjects.item(i);

        if (polylineobject.parentElement.style.pointerEvents == "none") { // locked
            continue;
        }

        RedrawPolylineDot(polylineobject);
    } 
}

function RedrawPolylineHits() {
    
    RemovePolylineHits();

    if (!EditMode) {
        return;
    }

    var polylineobjects = document.getElementById("EnvisionPage").getElementsByClassName("polylineobject");

    for (var i = 0; i < polylineobjects.length; i++) {

        var polylineobject = polylineobjects.item(i);
        
        if (polylineobject.parentElement.style.pointerEvents == "none") { // locked
            continue;
        }
        

        RedrawPolylineHit(polylineobject);
        ResetViewBoxPolyline(polylineobject);
    }
}

function RedrawPolylineHit(polylineobject) {
    if (!polylineobject) return;

    // Find existing polylines inside this SVG/group
    var polylines = polylineobject.getElementsByTagName("polyline");
    if (polylines.length === 0) {
        return;
    }

    // If we already have a hit polyline, do nothing
    if (polylineobject.querySelector("polyline.poly-hit")) {
        return;
    }

    // Take the first existing polyline as the visible one
    var original = polylines[0];

    // Mark it as the visible polyline
    original.classList.add("poly-visible");

    // Clone it to create the invisible hit-area polyline
    var hit = original.cloneNode(false); // shallow clone is enough (no children)
    hit.removeAttribute("onclick");      // avoid any existing inline handlers
    hit.classList.remove("poly-visible");
    hit.classList.add("poly-hit");

    // The hit line is a transparent 14px stroke, but an arrowhead marker carries its OWN explicit
    // fill, so a copied marker reference would paint a fat, fully opaque head on an otherwise
    // invisible line. Arrowheads belong to the visible line only.
    hit.removeAttribute("marker-start");
    hit.removeAttribute("marker-end");
    hit.style.markerStart = "";
    hit.style.markerEnd = "";

    // The mask must not come along either. It exists to take stroke AWAY - at a bridge hop and
    // under an arrowhead - and this line is what the mouse grabs: masking it would punch holes in
    // the grab area, so a bridged line could not be picked up at exactly the interesting places.
    hit.removeAttribute("mask");
    hit.style.mask = "";

    //console.log(polylineobject);

    // Optional: if you want a visible debug line, give it some style
    // hit.style.stroke = "red";
    //hit.style.strokeWidth = getPolylineHitStrokeWidth(original.style.strokeWidth);

    hit.style.strokeWidth = 14;

    hit.style.cursor = "move";

    hit.addEventListener(
        "mousedown",
        SetDragConditions.bind(polylineobject.parentElement),
        false
    );

    // Put hit and original together INSIDE the same SVG/group
    // If you want hit behind original:
    polylineobject.insertBefore(hit, original);

    // Or, equivalently:
    // polylineobject.appendChild(hit);
    // polylineobject.appendChild(original);

    // Wire the hit polyline to selection logic
    //hit.addEventListener("mousedown", function (evt) { NOT NECESSARY BECAUSE RIGHT CLICK LOGIC COMES FROM REINIT DRAGGABLES
    //    evt.stopPropagation();
    //    if (typeof ClickAction === "function") {
    //        ClickAction(polylineobject, evt);
    //    }
    //});
}


function RedrawPolylineDot(polylineobject) {

    if (CheckLocked(polylineobject.parentElement) === true) {
        return;
    }

    polylineobject.parentElement.querySelectorAll('.polylinedot').forEach(e => e.remove());

    let polyline = polylineobject.getElementsByTagName("polyline")[0];

    polylinepoints = polyline.getAttribute('points');

    var points = [];
    var pointsX = [];
    var pointsY = [];

    points = polylinepoints.split(' ');

    for (var j = 0; j < points.length; j++) {
        var xy = points[j].split(',');
        pointsX[j] = xy[0];
        pointsY[j] = xy[1];

        var dot = document.createElement("div");

        dot.className = "polylinedot";

        if (j == 0) {
            dot.classList.add("polylinedotstart");
        }

        dot.style.left = (xy[0] - 5) + "px";
        dot.style.top = (xy[1] - 5) + "px";
        dot.setAttribute("data-polylineobjectid", polylineobject.parentElement.id);
        dot.setAttribute("data-polylinedotno", j);
        dot.setAttribute("data-polylinedotx", xy[0]);
        dot.setAttribute("data-polylinedoty", xy[1]);
        dot.style.zIndex = polylineobject.style.zIndex + 1;

        if (!polylineobject.parentElement.hasAttribute("data-isbackground") || ShowHidden) {
            dot.style.pointerEvents = "auto";
            dot.style.cursor = "pointer";

            if (window.polylineobject && polylinedotno) {
                if (window.polylineobject.id == polylineobject.parentElement.id && j == polylinedotno) {
                    dot.style.borderColor = '#FFA500';
                    //console.log("orange");
                }
            }

            dot.addEventListener("mousedown", StartDragPolylineDot, false);

            polylineobject.parentElement.appendChild(dot);
        }
    }
}

function StartDragPolylineDot(e) {

    DraggingObject = true;
    
    ClosePolylineDotContextMenu();

    var caller = e.target || e.srcElement;
    //console.log(caller);

    e.stopPropagation(); // prevents selecting object

    polylinedot = caller;

    polylineobjectid = caller.getAttribute("data-polylineobjectid");
    polylinedotno = caller.getAttribute("data-polylinedotno");
    polylinedotx = caller.getAttribute("data-polylinedotx");
    polylinedoty = caller.getAttribute("data-polylinedoty");

    //console.log(polylineobjectid);
    polylineobject = document.getElementById(polylineobjectid);

    ClassListAddSelectedActive(polylineobject);

    polyline = polylineobject.getElementsByTagName("polyline")[0];

    if (e.which == 3) {

        var points = [];

        var polylinepoints = polyline.getAttribute('points');

        points = polylinepoints.split(' ');

        if (polylinedotno == 0) {

            document.getElementById('PolylineDotContextMenuDrawNewLine').style.display = "block";
            document.getElementById('PolylineDotContextMenuAddBehind').style.display = "none";
            document.getElementById('PolylineDotContextMenuAddBefore').style.display = "block";
        }
        else if (polylinedotno == points.length - 1) {
            document.getElementById('PolylineDotContextMenuDrawNewLine').style.display = "block";
            document.getElementById('PolylineDotContextMenuAddBehind').style.display = "block";
            document.getElementById('PolylineDotContextMenuAddBefore').style.display = "none";
        }
        else {
            document.getElementById('PolylineDotContextMenuDrawNewLine').style.display = "none";
            document.getElementById('PolylineDotContextMenuAddBehind').style.display = "block";
            document.getElementById('PolylineDotContextMenuAddBefore').style.display = "block";
        }

        var PolylineDotContextMenu = document.getElementById('PolylineDotContextMenu');
        PolylineDotContextMenu.style.display = "block";
        PolylineDotContextMenu.style.left = e.clientX + 20 + "px";
        PolylineDotContextMenu.style.top = e.clientY + "px";
        return;
    }

    document.documentElement.addEventListener('mousemove', doDragPolylineDot, false);
    document.documentElement.addEventListener('mouseup', stopDragPolylineDot, false);

    // Remember where the dot was grabbed relative to the cursor, in page units and in
    // page coordinates, so the point can be snapped to the page grid while dragging.
    var cursor = CursorPagePos(e);
    var origin = PageObjectPos(polylineobject);

    polylinedotgrabx = origin.left + parseFloat(polylinedotx) - cursor.left;
    polylinedotgraby = origin.top + parseFloat(polylinedoty) - cursor.top;

    DeselectAllObjects();
    ClassListAddSelectedActive(polylineobject);

    SetResetTexts();
}

function doDragPolylineDot(e) {

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polylinepoints = polyline.getAttribute('points');

    points = polylinepoints.split(' ');

    for (var i = 0; i < points.length; i++) {
        var xy = points[i].split(',');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];
    }

    // Snap the dragged dot on the page grid itself, not on a grid relative to the object
    // origin: the origin drifts off the grid when points are added or the object is
    // resized, and a relative snap would then keep the dot permanently off the grid.
    var cursor = CursorPagePos(e);
    var origin = PageObjectPos(polylineobject);

    var targetx = roundDownToNearestX(cursor.left + polylinedotgrabx) - origin.left;
    var targety = roundDownToNearestX(cursor.top + polylinedotgraby) - origin.top;

    //recalc points ~ only the dragged dot moves, the others keep their position
    for (var i = 0; i < points.length; i++) {

        newx = parseFloat(pointsX[i]);
        newy = parseFloat(pointsY[i]);

        if (i == polylinedotno) {

            newx = targetx;
            newy = targety;
        }

        pointsX[i] = newx;
        pointsY[i] = newy;
    }

    ResizePolylineDraggable(points, pointsX, pointsY);
}

function stopDragPolylineDot() {

    CheckResizeGroup2(polylineobject);

    document.documentElement.removeEventListener('mousemove', doDragPolylineDot, false);
    document.documentElement.removeEventListener('mouseup', stopDragPolylineDot, false);

    polylinedotno = undefined;

    RedrawPolylineDots();

    DraggingObject = false;

    DeselectAllObjects();

    if (true) {
        saveSnapshot();
    }

    
}

//function ResizePolylineDraggable(points, pointsX, pointsY) {

//    //console.log("--------------");

//    if (!points) {
//        points = [];
//        pointsX = [];
//        pointsY = [];

//        var polylinepoints = polyline.getAttribute('points');

//        points = polylinepoints.split(' ');

//        for (var i = 0; i < points.length; i++) {
//            var xy = points[i].split(',');
//            pointsX[i] = xy[0];
//            pointsY[i] = xy[1];
//        }
//    }

//    //console.log('points ' + polyline.getAttribute('points'));

//    var polylineobjectwidth = parseFloat(polylineobject.style.width.replace('px', ''));
//    var polylineobjectheight = parseFloat(polylineobject.style.height.replace('px', ''));
//    var polylineobjectleft = parseFloat(polylineobject.style.left.replace('px', ''));
//    var polylineobjecttop = parseFloat(polylineobject.style.top.replace('px', ''));

//    //make draggable wider when necessary
//    for (var i = 0; i < points.length; i++) {

//        newx = pointsX[i];
//        newy = pointsY[i];

//        if (newx > polylineobjectwidth) {
//            polylineobject.style.width = newx + 'px';
//        }

//        //console.log('newy ' + newy);

//        if (newy > polylineobjectheight) {
//            polylineobject.style.height = newy + 'px';
//            //console.log('setting 1');
//        }

//        //console.log('polylineobjectheight ' + polylineobjectheight);

//        if (newx < 0) {

//            polylineobject.style.left = (polylineobjectleft - Math.abs(newx)) + 'px';

//            polylineobject.style.width = (polylineobjectwidth + Math.abs(newx)) + 'px';

//            for (var j = 0; j < points.length; j++) {
//                if (j != polylinedotno || PolylineNew == true) {
//                    pointsX[j] = parseFloat(pointsX[j]) + Math.abs(newx);
//                }
//            }

//            newx = 0;
//        }

//        if (newy < 0) {

//            polylineobject.style.top = (polylineobjecttop - Math.abs(newy)) + 'px';

//            polylineobject.style.height = (polylineobjectheight + Math.abs(newy)) + 'px';
//            //console.log('setting 2');
//            for (var j = 0; j < points.length; j++) {
//                if (j != polylinedotno || PolylineNew == true) {
//                    pointsY[j] = parseFloat(pointsY[j]) + Math.abs(newy);
//                }
//            }

//            newy = 0;
//        }

//        pointsX[i] = newx;
//        pointsY[i] = newy;

//        polylineobjectwidth = parseFloat(polylineobject.style.width.replace('px', ''));
//        polylineobjectheight = parseFloat(polylineobject.style.height.replace('px', ''));
//        polylineobjectleft = parseFloat(polylineobject.style.left.replace('px', ''));
//        polylineobjecttop = parseFloat(polylineobject.style.top.replace('px', ''));
//    }

//    //make draggable smaller when necessary
//    var smallestx = 99999;
//    var smallesty = 99999;
//    var biggestx = -99999;
//    var biggesty = -99999;

//    for (var i = 0; i < points.length; i++) {

//        var pointX = parseFloat(pointsX[i]);
//        var pointY = parseFloat(pointsY[i]);

//        if (pointX < smallestx) {
//            smallestx = pointX;
//        }

//        if (pointX > biggestx) {
//            biggestx = pointX;
//        }

//        if (pointY < smallesty) {
//            smallesty = pointY;
//        }

//        if (pointY > biggesty) {
//            biggesty = pointY;
//        }
//    }

//    //console.log('smallestx ' + smallestx);
//    //console.log('biggestx ' + biggestx);
//    //console.log('smallesty ' + smallesty);
//    //console.log('biggesty ' + biggesty);

//    if (biggestx < polylineobjectwidth) {
//        polylineobject.style.width = biggestx + 'px';
//    }

//    if (biggesty < polylineobjectheight) {
//        polylineobject.style.height = biggesty + 'px';
//        //console.log('setting 3');
//    }

//    if (smallestx > 0) {

//        polylineobject.style.left = (polylineobjectleft + smallestx) + 'px';

//        polylineobject.style.width = (polylineobjectwidth - smallestx) + 'px';

//        for (var j = 0; j < points.length; j++) {
//            pointsX[j] = parseFloat(pointsX[j]) - smallestx;
//        }
//    }

//    if (smallesty > 0) {

//        polylineobject.style.top = (polylineobjecttop + smallesty) + 'px';

//        polylineobject.style.height = (polylineobjectheight - smallesty) + 'px';
//        //console.log('setting 4');
//        //console.log('polylineobjectheight ' + polylineobjectheight);
//        //console.log('smallesty ' + smallesty);
//        //console.log(polylineobject.style.height);
//        for (var j = 0; j < points.length; j++) {
//            pointsY[j] = parseFloat(pointsY[j]) - smallesty;
//        }

//        newy = 0;
//    }

//    var newpoints = "";

//    for (var i = 0; i < points.length; i++) {

//        newx = pointsX[i];
//        newy = pointsY[i];

//        newpoints = newpoints + newx + "," + newy + " ";
//    }

//    newpoints = newpoints.slice(0, -1); // remove space

//    //console.log('newpoints ' + newpoints);
//    //console.log('movementx ' + movementx);
//    //console.log('movementy ' + movementy);

//    polyline.setAttribute('points', newpoints);
//    //console.log("e.clientX " + e.clientX + " - " + "e.clientY " + e.clientY);

//    ResetViewBoxPolyline(getObjDom(polylineobject));

//    SetResetTexts();
//    SetBorders();

//    RedrawPolylineDots();
//}

function ResizePolylineDraggable(points, pointsX, pointsY) {

    // Get both polylines inside this SVG
    // (assuming polylineobject is already set globally like before)
    var polyVisible = polylineobject.querySelector('.poly-visible');
    var polyHit = polylineobject.querySelector('.poly-hit');

    // Fallbacks in case classes are missing (for older objects)
    if (!polyVisible || !polyHit) {
        var allPolys = polylineobject.getElementsByTagName('polyline');
        if (!polyHit && allPolys.length > 0) polyHit = allPolys[0];
        if (!polyVisible && allPolys.length > 0) polyVisible = allPolys[allPolys.length - 1];
    }

    // Use the visible polyline as the geometry source
    var polyline = polyVisible || polyHit;
    if (!polyline) return; // nothing to do

    if (!points) {
        points = [];
        pointsX = [];
        pointsY = [];

        var polylinepoints = polyline.getAttribute('points');

        points = polylinepoints.split(' ');

        for (var i = 0; i < points.length; i++) {
            var xy = points[i].split(',');
            pointsX[i] = xy[0];
            pointsY[i] = xy[1];
        }
    }

    var polylineobjectwidth = parseFloat(polylineobject.style.width.replace('px', ''));
    var polylineobjectheight = parseFloat(polylineobject.style.height.replace('px', ''));
    var polylineobjectleft = parseFloat(polylineobject.style.left.replace('px', ''));
    var polylineobjecttop = parseFloat(polylineobject.style.top.replace('px', ''));

    //make draggable wider when necessary
    for (var i = 0; i < points.length; i++) {

        newx = pointsX[i];
        newy = pointsY[i];

        if (newx > polylineobjectwidth) {
            polylineobject.style.width = newx + 'px';
        }

        if (newy > polylineobjectheight) {
            polylineobject.style.height = newy + 'px';
        }

        if (newx < 0) {

            polylineobject.style.left = (polylineobjectleft - Math.abs(newx)) + 'px';
            polylineobject.style.width = (polylineobjectwidth + Math.abs(newx)) + 'px';

            for (var j = 0; j < points.length; j++) {
                if (j != polylinedotno || PolylineNew == true) {
                    pointsX[j] = parseFloat(pointsX[j]) + Math.abs(newx);
                }
            }

            newx = 0;
        }

        if (newy < 0) {

            polylineobject.style.top = (polylineobjecttop - Math.abs(newy)) + 'px';
            polylineobject.style.height = (polylineobjectheight + Math.abs(newy)) + 'px';

            for (var j = 0; j < points.length; j++) {
                if (j != polylinedotno || PolylineNew == true) {
                    pointsY[j] = parseFloat(pointsY[j]) + Math.abs(newy);
                }
            }

            newy = 0;
        }

        pointsX[i] = newx;
        pointsY[i] = newy;

        polylineobjectwidth = parseFloat(polylineobject.style.width.replace('px', ''));
        polylineobjectheight = parseFloat(polylineobject.style.height.replace('px', ''));
        polylineobjectleft = parseFloat(polylineobject.style.left.replace('px', ''));
        polylineobjecttop = parseFloat(polylineobject.style.top.replace('px', ''));
    }

    //make draggable smaller when necessary
    var smallestx = 99999;
    var smallesty = 99999;
    var biggestx = -99999;
    var biggesty = -99999;

    for (var i = 0; i < points.length; i++) {

        var pointX = parseFloat(pointsX[i]);
        var pointY = parseFloat(pointsY[i]);

        if (pointX < smallestx) {
            smallestx = pointX;
        }

        if (pointX > biggestx) {
            biggestx = pointX;
        }

        if (pointY < smallesty) {
            smallesty = pointY;
        }

        if (pointY > biggesty) {
            biggesty = pointY;
        }
    }

    if (biggestx < polylineobjectwidth) {
        polylineobject.style.width = biggestx + 'px';
    }

    if (biggesty < polylineobjectheight) {
        polylineobject.style.height = biggesty + 'px';
    }

    if (smallestx > 0) {

        polylineobject.style.left = (polylineobjectleft + smallestx) + 'px';
        polylineobject.style.width = (polylineobjectwidth - smallestx) + 'px';

        for (var j = 0; j < points.length; j++) {
            pointsX[j] = parseFloat(pointsX[j]) - smallestx;
        }
    }

    if (smallesty > 0) {

        polylineobject.style.top = (polylineobjecttop + smallesty) + 'px';
        polylineobject.style.height = (polylineobjectheight - smallesty) + 'px';

        for (var j = 0; j < points.length; j++) {
            pointsY[j] = parseFloat(pointsY[j]) - smallesty;
        }

        newy = 0;
    }

    var newpoints = "";

    for (var i = 0; i < points.length; i++) {

        newx = pointsX[i];
        newy = pointsY[i];

        newpoints = newpoints + newx + "," + newy + " ";
    }

    newpoints = newpoints.slice(0, -1); // remove trailing space

    // 🔹 Update BOTH polylines so they stay in sync
    if (polyVisible) {
        polyVisible.setAttribute('points', newpoints);
    }
    if (polyHit) {
        polyHit.setAttribute('points', newpoints);
    }

    ResetViewBoxPolyline(getObjDom(polylineobject));

    SetResetTexts();
    SetBorders();

    RedrawPolylineDots();
}


function RemovePolylineDots() {

    var polylineobjects = document.getElementById("EnvisionPage").getElementsByClassName("polylineobject");

    for (var i = 0; i < polylineobjects.length; i++) {

        var polylineobject = polylineobjects.item(i);

        RemovePolylineDot(polylineobject);
    }
}

function RemovePolylineDot(polylineobject) {

    polylineobject.parentElement.querySelectorAll('.polylinedot').forEach(e => e.remove());
}

function RemovePolylineHits() {

    var polylineobjects = document
        .getElementById("EnvisionPage")
        .getElementsByClassName("polylineobject");

    for (var i = 0; i < polylineobjects.length; i++) {

        var polylineobject = polylineobjects.item(i);

        RemovePolylineHit(polylineobject);
    }
}

function RemovePolylineHit(polylineobject) {

    // remove all .poly-hit lines inside this SVG
    polylineobject.querySelectorAll('.poly-hit').forEach(function (e) {
        e.remove();
    });
}


function ClosePolylineDotContextMenu() {
    document.getElementById('PolylineDotContextMenu').style.display = "none";
}

function PolylineDotDrawNewLine() {

    ClosePolylineDotContextMenu();

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polylinepoints = polyline.getAttribute('points');

    points = polylinepoints.split(' ');

    for (var i = 0; i < points.length; i++) {

        var xy = points[i].split(',');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];
    }

    for (var i = 0; i < points.length; i++) {

        if (i == polylinedotno) {

            DrawLineFromObject = polylineobject
            DrawLineFromObjectX = parseFloat(polylineobject.style.left.replace("px", ""));
            DrawLineFromObjectY = parseFloat(polylineobject.style.top.replace("px", ""));
            DrawLineFromDotX = parseFloat(pointsX[i]);
            DrawLineFromDotY = parseFloat(pointsY[i]);

            DrawingLine = true;

            DisableDraggablesPointerEvents();

            polylineobject.style.pointerEvents = "none";

            RedrawPolylineDots();

            DeselectAllObjects();
            ClassListAddSelectedActive(polylineobject);

            return;
        }
    }

    SetResetTexts();
}

//async function PolylineDotDrawLine() {

//    EnableDraggablesPointerEvents();
//    DrawingLine = false;
//    RemoveDrawLineHelper();
//    polylineobject.style.pointerEvents = "auto";

//    //if (DrawConnectParent) {
//    //    var newdotlineid = CloneObjectFrom(ConnectToElement.parentNode, DrawConnectParent.id);
//    //} else {
//    //    var newdotlineid = CloneObjectFrom(ConnectToElement.parentNode);
//    //}

//    x_pos = DrawLineHelperX;
//    y_pos = DrawLineHelperY;

//    //console.log("x_pos " + x_pos + " y_pos " + y_pos);

//    x_pos = DrawLineHelperX - DrawLineFromObjectX;
//    y_pos = DrawLineHelperY - DrawLineFromObjectY;

//    //console.log("x_pos " + x_pos + " y_pos " + y_pos);

//    if (DrawConnectParent) {
//        //console.log('in group');

//        x_pos = x_pos - DrawLineParentX;
//        y_pos = y_pos - DrawLineParentY;
//    }


//    //if (DrawLineFromObject.parentElement.getAttribute('name') == "GroupObject") {
//    //    console.log('in group');

//    //    DrawConnectParentX = parseFloat(DrawLineFromObject.parentElement.style.left.replace("px", ""));
//    //    DrawConnectParentY = parseFloat(DrawLineFromObject.parentElement.style.top.replace("px", ""));

//    //    x_pos = x_pos - DrawConnectParentX;
//    //    y_pos = y_pos - DrawConnectParentY;
//    //}

//    var polylinepoints = polyline.getAttribute('points');
//    //console.log("polylinepoints " + polylinepoints);

//    var newlinexy;

//    if (polylinedotno == 0) {
//        newlinexy = x_pos + "," + y_pos + " ";
//        polylinepoints = newlinexy + polylinepoints;
//    }
//    else { // then it is the last one
//        newlinexy = " " + x_pos + "," + y_pos;
//        polylinepoints = polylinepoints + newlinexy;
//    }

//    //console.log("polylinepoints " + polylinepoints);

//    // RECALC like resize
//    polyline.setAttribute('points', polylinepoints);

//    PolylineNew = true;
//    ResizePolylineDraggable(); // need to do a second time
//    PolylineNew = false;


//    await sleep(100);
//    //Necessary because selectables clears selected objects when clicking the page.
//    ClassListAddSelectedActive(polylineobject);

//    polylinedotno = -1;
//    RedrawPolylineDots();
//    StopDragElement(); // triggers groupresize2 if in group
//    SetResetTexts();

//    if (true) {
//        saveSnapshot();
//    }
//}

async function PolylineDotDrawLine() {

    EnableDraggablesPointerEvents();
    DrawingLine = false;
    RemoveDrawLineHelper();
    polylineobject.style.pointerEvents = "auto";

    x_pos = DrawLineHelperX;
    y_pos = DrawLineHelperY;

    x_pos = DrawLineHelperX - DrawLineFromObjectX;
    y_pos = DrawLineHelperY - DrawLineFromObjectY;

    if (DrawConnectParent) {
        x_pos = x_pos - DrawLineParentX;
        y_pos = y_pos - DrawLineParentY;
    }

    // 🔹 get both polylines from this SVG
    var polyVisible = polylineobject.querySelector('.poly-visible');
    var polyHit = polylineobject.querySelector('.poly-hit');

    // fallbacks for old objects if classes are not there yet
    if (!polyVisible || !polyHit) {
        var allPolys = polylineobject.getElementsByTagName('polyline');
        if (!polyHit && allPolys.length > 0) polyHit = allPolys[0];
        if (!polyVisible && allPolys.length > 0) polyVisible = allPolys[allPolys.length - 1];
    }

    // use visible polyline as canonical geometry
    var polyGeom = polyVisible || polyHit;
    if (!polyGeom) return;

    // keep global `polyline` in sync if other code still depends on it
    polyline = polyGeom;

    var polylinepoints = polyGeom.getAttribute('points');
    var newlinexy;

    if (polylinedotno == 0) {
        // insert at start
        newlinexy = x_pos + "," + y_pos + " ";
        polylinepoints = newlinexy + polylinepoints;
    } else {
        // append at end
        newlinexy = " " + x_pos + "," + y_pos;
        polylinepoints = polylinepoints + newlinexy;
    }

    // 🔹 write new points to BOTH polylines so they stay in sync
    if (polyVisible) polyVisible.setAttribute('points', polylinepoints);
    if (polyHit) polyHit.setAttribute('points', polylinepoints);

    // RECALC like resize
    PolylineNew = true;
    ResizePolylineDraggable(); // this now also updates both
    PolylineNew = false;

    await sleep(100);
    //Necessary because selectables clears selected objects when clicking the page.
    ClassListAddSelectedActive(polylineobject);

    polylinedotno = -1;
    RedrawPolylineDots();
    StopDragElement(); // triggers groupresize2 if in group
    SetResetTexts();

    if (true) {
        saveSnapshot();
    }
}

function PolylineDotAddBefore() {

    ClosePolylineDotContextMenu();

    // 🔹 Resolve SVG + visible + hit polylines
    var svg = polyline.closest('svg') || polyline.parentElement;

    var polyVisible = svg.querySelector('polyline.poly-visible') || polyline;
    var polyHit = svg.querySelector('polyline.poly-hit');

    // keep the global reference consistent
    polyline = polyVisible;

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polylinepoints = polyVisible.getAttribute('points');

    points = polylinepoints.split(' ');

    for (var i = 0; i < points.length; i++) {
        if (!points[i]) continue;
        var xy = points[i].split(',');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];
    }

    var newpoints = "";

    for (var i = 0; i < points.length; i++) {

        if (i == polylinedotno) {

            // keep the existing point first
            newpoints += pointsX[i] + "," + pointsY[i] + " ";

            var newpoint;

            if (i == points.length - 1) {
                newpoint = 0;
            } else {
                newpoint = i + 1;
            }

            var newpointx = Math.abs(parseFloat(pointsX[i]) - parseFloat(pointsX[newpoint])) / 2;
            var newpointy = Math.abs(parseFloat(pointsY[i]) - parseFloat(pointsY[newpoint])) / 2;

            if (parseFloat(pointsX[i]) < parseFloat(pointsX[newpoint])) {
                newpointx = parseFloat(pointsX[i]) + newpointx;
            } else {
                newpointx = parseFloat(pointsX[newpoint]) + newpointx;
            }

            if (parseFloat(pointsY[i]) < parseFloat(pointsY[newpoint])) {
                newpointy = parseFloat(pointsY[i]) + newpointy;
            } else {
                newpointy = parseFloat(pointsY[newpoint]) + newpointy;
            }

            // add midpoint AFTER the current point
            newpoints += newpointx + "," + newpointy + " ";
        }
        else {
            newpoints += pointsX[i] + "," + pointsY[i] + " ";
        }
    }

    newpoints = newpoints.slice(0, -1); // trim final space

    // 🔹 Update BOTH visible + hit
    polyVisible.setAttribute('points', newpoints);
    if (polyHit) {
        polyHit.setAttribute('points', newpoints);
    }

    ResizePolylineDraggable();

    if (true) {
        saveSnapshot();
    }
}

function PolylineDotAddBehind() {

    ClosePolylineDotContextMenu();

    // 🔹 Resolve SVG + visible + hit polylines
    // `polyline` is your current global pointing somewhere inside the SVG
    var svg = polyline.closest('svg') || polyline.parentElement;

    var polyVisible = svg.querySelector('polyline.poly-visible') || polyline;
    var polyHit = svg.querySelector('polyline.poly-hit');

    // keep global `polyline` pointing at the canonical visible one
    polyline = polyVisible;

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polylinepoints = polyVisible.getAttribute('points');

    points = polylinepoints.split(' ');

    for (var i = 0; i < points.length; i++) {
        if (!points[i]) continue;
        var xy = points[i].split(',');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];
    }

    var newpoints = "";

    for (var i = 0; i < points.length; i++) {

        if (i == polylinedotno) {
            var newpoint;

            if (i == 0) {
                newpoint = points.length - 1;
            } else {
                newpoint = i - 1;
            }

            var newpointx = Math.abs(parseFloat(pointsX[i]) - parseFloat(pointsX[newpoint])) / 2;
            var newpointy = Math.abs(parseFloat(pointsY[i]) - parseFloat(pointsY[newpoint])) / 2;

            if (parseFloat(pointsX[i]) < parseFloat(pointsX[newpoint])) {
                newpointx = parseFloat(pointsX[i]) + newpointx;
            } else {
                newpointx = parseFloat(pointsX[newpoint]) + newpointx;
            }

            if (parseFloat(pointsY[i]) < parseFloat(pointsY[newpoint])) {
                newpointy = parseFloat(pointsY[i]) + newpointy;
            } else {
                newpointy = parseFloat(pointsY[newpoint]) + newpointy;
            }

            newpoints = newpoints + newpointx + "," + newpointy + " ";
        }

        newpoints = newpoints + pointsX[i] + "," + pointsY[i] + " ";
    }

    newpoints = newpoints.slice(0, -1); // remove last space

    // 🔹 Update BOTH visible + hit so they stay in sync
    polyVisible.setAttribute('points', newpoints);
    if (polyHit) {
        polyHit.setAttribute('points', newpoints);
    }

    ResizePolylineDraggable();

    if (true) {
        saveSnapshot();
    }
}

function PolylineDotRemove() {

    ClosePolylineDotContextMenu();

    // 🔹 Resolve SVG + visible + hit polylines
    var svg = polyline.closest && polyline.closest('svg')
        ? polyline.closest('svg')
        : polyline.parentElement;

    var polyVisible = svg.querySelector('polyline.poly-visible') || polyline;
    var polyHit = svg.querySelector('polyline.poly-hit');

    // keep global ref consistent with the visible one
    polyline = polyVisible;

    var points = [];
    var pointsX = [];
    var pointsY = [];

    var polylinepoints = polyVisible.getAttribute('points');

    points = polylinepoints.split(' ');

    if (points.length == 2) {
        document.getElementById("CustomModalText").innerHTML =
            'The polyline must have at least 2 ends.';
        var myModal = new bootstrap.Modal(document.getElementById('CustomModal'));
        myModal.show();
        return;
    }

    var newpoints = "";

    for (var i = 0; i < points.length; i++) {

        if (!points[i]) continue;

        var xy = points[i].split(',');
        pointsX[i] = xy[0];
        pointsY[i] = xy[1];

        if (i == polylinedotno) {
            continue;   // 🔹 your original logic unchanged
        }

        newpoints = newpoints + pointsX[i] + "," + pointsY[i] + " ";
    }

    newpoints = newpoints.slice(0, -1); // remove last space

    // 🔹 Update BOTH visible + hit
    polyVisible.setAttribute('points', newpoints);
    if (polyHit) polyHit.setAttribute('points', newpoints);

    ResizePolylineDraggable();

    if (true) {
        saveSnapshot();
    }
}

function PolylineDotCancel() {
    ClosePolylineDotContextMenu();
}

function RemoveDrawConnectToHelper() {
    document.querySelectorAll(".lineboxhelper").forEach(el => el.remove());
    document.querySelectorAll(".mousepos").forEach(el => el.remove());
}

function DrawLineHelper(x_pos, y_pos) {

    DrawLineOriginalX = 0;
    DrawLineOriginalY = 0;
    DrawLineParentX = 0;
    DrawLineParentY = 0;
    DrawLineParent = null;

    var linewidth = 6;

    //if (ConnectToElement.getAttribute("data-linewidth")) {
    //    linewidth = ConnectToElement.getAttribute("data-linewidth");
    //}

    document.querySelectorAll(".lineboxhelper").forEach(el => el.remove());
    document.querySelectorAll(".mousepos").forEach(el => el.remove());

    //var x1 = parseInt(ConnectToElement.parentElement.style.left.replace('px', '')) + linewidth / 2;
    //var y1 = parseInt(ConnectToElement.parentElement.style.top.replace('px', '')) + linewidth / 2;

    //DrawLineFromObject
    //DrawLineFromObjectX
    //DrawLineFromObjectY
    //DrawLineFromDotX
    //DrawLineFromDotY

    var x1 = DrawLineFromObjectX + DrawLineFromDotX;
    var y1 = DrawLineFromObjectY + DrawLineFromDotY;

    var viewer = document.getElementById("EnvisionPage");

    var transform = viewer.style.transform;

    if (transform !== 'scale(1)' || transform !== 'scale(1.0)') {
        var positionopenscale = transform.indexOf("scale") + 6;
        var positionclosescale = transform.indexOf(", ", positionopenscale);

        if (positionclosescale == -1) {
            positionclosescale = transform.indexOf(")", positionopenscale);
        }

        transform = transform.substr(positionopenscale, positionclosescale - positionopenscale);
    }
    else {
        if (transform == "") {
            transform = "1.0";
        }
        else {
            transform = transform.replace("scale(", "");
            transform = transform.replace(")", "");
        }
    }


    var rect = viewer.getBoundingClientRect();

    var x2 = (x_pos - rect.left) * (1 / transform);
    var y2 = (y_pos - rect.top) * (1 / transform);

    var x2line = x2 + linewidth / 2;
    var y2line = y2 + linewidth / 2;

    x2 = roundDownToNearestX(x2);
    y2 = roundDownToNearestX(y2);

    if (DrawLineFromObject.parentElement.getAttribute('name') === "GroupObject") {

        DrawConnectParent = DrawLineFromObject.parentElement;

        var GroupCoords = getCoords(DrawLineFromObject);

        var cx1 = GroupCoords.left;
        var cy1 = GroupCoords.top;

        var px1 = parseInt(DrawLineFromObject.parentElement.parentElement.style.left.replace('px', ''));
        var py1 = parseInt(DrawLineFromObject.parentElement.parentElement.style.top.replace('px', ''));

        DrawLineOriginalX = x1;
        DrawLineOriginalY = y1;

        //x1 = cx1;
        //y1 = cy1;

        x1 = cx1 + DrawLineFromDotX;
        y1 = cy1 + DrawLineFromDotY;

        DrawLineParentX = cx1 - DrawLineOriginalX;
        DrawLineParentY = cy1 - DrawLineOriginalY;

    }

    //if (ConnectToElement.parentElement.parentElement.getAttribute('name') === "GroupObject") {

    //    DrawConnectParent = ConnectToElement.parentElement.parentElement;

    //    var GroupCoords = getCoords(ConnectToElement);

    //    var cx1 = GroupCoords.left;
    //    var cy1 = GroupCoords.top;

    //    var px1 = parseInt(ConnectToElement.parentElement.parentElement.style.left.replace('px', ''));
    //    var py1 = parseInt(ConnectToElement.parentElement.parentElement.style.top.replace('px', ''));

    //    DrawConnectOriginalX = x1;
    //    DrawConnectOriginalY = y1;

    //    x1 = cx1;
    //    y1 = cy1;

    //    DrawConnectParentX = cx1 - DrawConnectOriginalX;
    //    DrawConnectParentY = cy1 - DrawConnectOriginalY;

    //}

    var name = "linedothelper";

    var line = "<line name='" + name + "' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2line + "' y2='" + y2line + "' stroke-dasharray='10, 10' stroke='grey' stroke-width='1'/>"

    var svg = "<svg>" + line + "</svg>";

    var helperline = document.createElement("div");
    helperline.innerHTML = svg
    helperline.className = "lineboxhelper";
    helperline.style.width = "100%";
    helperline.style.height = "100%";
    helperline.style.zIndex = 999;

    document.getElementById("EnvisionPage").appendChild(helperline);

    var positiontext = document.createElement("div");
    positiontext.innerHTML = x2 + "px" + " " + y2 + "px";
    positiontext.className = "mousepos";
    positiontext.style.top = y2 + "px";
    positiontext.style.left = x2 + 10 + "px";

    DrawLineHelperX = x2;
    DrawLineHelperY = y2;

    document.getElementById("EnvisionPage").appendChild(positiontext);
}

function RemoveDrawLineHelper() {
    document.querySelectorAll(".lineboxhelper").forEach(el => el.remove());
    document.querySelectorAll(".mousepos").forEach(el => el.remove());
}

function initdragline(ev) {
    //console.log('initdragline');

    if (EditMode) {

        if (!CtrlKeyPressed) {
            if (ev.which == 1) {
                StartDragObject(this);
            }
        }

    }

}

function getPolylineHitStrokeWidth(realStrokeWidth, minWidth = 14) {
    var base = parseFloat(realStrokeWidth) || 0;

    // +2 px each side = +4 total
    var padded = base + 4;

    return (padded < minWidth ? minWidth : padded);
}
