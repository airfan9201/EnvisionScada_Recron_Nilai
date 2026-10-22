// Map.js — MapObject widget for ENVISION.
// Leaflet handles the map (tiles, pan, zoom, projection); we show/hide and
// reposition one persisted GroupObject per map child at its lat/lon when in view.
// Load after ~/lib/leaflet/leaflet.js and after ~/js/Envision.js.

// ────────────────────────────────────────────────────────────────
// Small helpers
// ────────────────────────────────────────────────────────────────

function MapGetOuter(node) {
    while (node && node.getAttribute && node.getAttribute("name") !== "MapObject") {
        node = node.parentElement;
    }
    return node || null;
}

function MapParseLatLng(str, fallback) {
    if (!str) return fallback;
    var parts = ("" + str).split(",");
    if (parts.length !== 2) return fallback;
    var lat = parseFloat(parts[0]);
    var lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) return fallback;
    return [lat, lon];
}

// Resolve a value that is either a literal number or a VarDict variable name.
function MapResolveCoord(raw) {
    if (raw === null || raw === undefined || raw === "") return NaN;
    var s = ("" + raw).trim();
    if (MapIsLiteralNumber(s)) return parseFloat(s);
    // Look up the trimmed name: a coordinate typed with stray whitespace still
    // has to resolve, otherwise the pin silently vanishes.
    if (typeof VarDict !== "undefined" && VarDict[s] !== undefined) {
        var v = parseFloat(VarDict[s][0]);
        return isNaN(v) ? NaN : v;
    }
    var n = parseFloat(s);
    return isNaN(n) ? NaN : n;
}

function MapIsLiteralNumber(s) {
    return /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s);
}

// Register every variable this map needs subscribed, independent of which pins
// happen to be visible. PageVars is rebuilt each executeQuery pass and the
// collected set IS the subscription, so anything not registered here is never
// subscribed and never reaches VarDict.
function MapRegisterPageVars(outer) {
    if (typeof PageVars === "undefined" || !outer) return;

    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return;

    var children = overlay.querySelectorAll('[data-system-mapchild="true"]');
    for (var i = 0; i < children.length; i++) {
        var child = children[i];

        // Coordinates stay subscribed even while the pin is offscreen. If they did
        // not, an offscreen pin's position could never update and it could never
        // come back into view.
        MapRegisterCoordVar(child.getAttribute("data-lat"));
        MapRegisterCoordVar(child.getAttribute("data-lon"));

        // The pin's own position variable, when it has one.
        MapRegisterPositionVar(child.getAttribute("data-positionvariable"));

        // Offscreen pin: replay the variables it registered while it was visible,
        // so the subscription set is identical either way.
        if (child.getAttribute("data-system-map-offscreen") === "true" && child._mapChildVars) {
            for (var key in child._mapChildVars) {
                if (Object.prototype.hasOwnProperty.call(child._mapChildVars, key)) {
                    PageVars[key] = 0;
                }
            }
        }
    }
}

function MapRegisterCoordVar(raw) {
    if (raw === null || raw === undefined) return;
    var s = ("" + raw).trim();
    if (!s) return;
    if (MapIsLiteralNumber(s)) return;
    if (typeof isVariableName === "function" && !isVariableName(s)) return;
    PageVars[s] = 0;
}

// A pin's own position variable carries "lat,lon" in ONE value, so unlike a coordinate it is never
// a literal number - anything non-empty is a variable name.
function MapRegisterPositionVar(raw) {
    if (raw === null || raw === undefined) return;
    var s = ("" + raw).trim();
    if (!s) return;
    if (typeof isVariableName === "function" && !isVariableName(s)) return;
    PageVars[s] = 0;
}

// A pin carries its own position: one variable holding "lat,lon", or a longitude and a latitude
// that are each either a literal or the name of a variable holding one.
//
// A position variable that is set but does not resolve yields no position at all rather than
// falling through to the coordinates: a pin quietly sitting at a stale location while claiming to
// track something live is worse than a pin that is absent.
function MapResolveChildPosition(child) {
    var posvar = (child.getAttribute("data-positionvariable") || "").trim();
    if (posvar) return MapResolvePositionVariable(posvar);

    var lat = MapResolveCoord(child.getAttribute("data-lat"));
    var lon = MapResolveCoord(child.getAttribute("data-lon"));
    if (isNaN(lat) || isNaN(lon)) return null;

    return MapValidatePosition(lat, lon);
}

function MapGetMapChild(outer, callerid) {
    if (!outer || !callerid) return null;
    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return null;
    return overlay.querySelector('[data-system-mapchild="true"][data-popupcallerid="' + CSS.escape(callerid) + '"]');
}

// Basemap presets (free tiers; attribution is fixed per preset, not user-editable).
var MapTilePresets = {
    street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    },
    terrain: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17
    },
    light: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20
    },
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20
    },
    humanitarian: {
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &middot; <a href="https://www.hotosm.org/">HOT</a>',
        maxZoom: 19
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.esri.com/en-us/legal/attributions">Esri</a>',
        maxZoom: 19
    }
};

var MAP_DEFAULT_STYLE = "street";

function MapResolveMapStyle(outer) {
    if (!outer) return MAP_DEFAULT_STYLE;

    var style = outer.getAttribute("data-map-style");
    if (style && MapTilePresets[style]) return style;

    var legacyUrl = (outer.getAttribute("data-map-tileurl") || "").toLowerCase();
    if (legacyUrl.indexOf("opentopomap.org") !== -1) return "terrain";
    if (legacyUrl.indexOf("cartocdn.com/light") !== -1) return "light";
    if (legacyUrl.indexOf("cartocdn.com/dark") !== -1) return "dark";
    if (legacyUrl.indexOf("openstreetmap.fr/hot") !== -1) return "humanitarian";
    if (legacyUrl.indexOf("world_imagery") !== -1 || legacyUrl.indexOf("arcgisonline.com") !== -1) return "satellite";

    return MAP_DEFAULT_STYLE;
}

function MapGetTilePreset(styleId) {
    return MapTilePresets[styleId] || MapTilePresets[MAP_DEFAULT_STYLE];
}

function MapPersistViewport(outer, lmap) {
    if (!outer || !lmap) return;
    var c = lmap.getCenter();
    outer.setAttribute("data-map-center", c.lat.toFixed(6) + "," + c.lng.toFixed(6));
    outer.setAttribute("data-map-zoom", "" + lmap.getZoom());
}

function MapReinitMap(outer) {
    if (!outer) return;
    if (outer._leafletmap) {
        try { outer._leafletmap.remove(); } catch (e) {}
        outer._leafletmap = null;
    }
    initMap(outer);
    MapProjectChildren(outer);
}

// ────────────────────────────────────────────────────────────────
// Leaflet bootstrap
// ────────────────────────────────────────────────────────────────

function initMap(mapDom) {
    if (!mapDom) return;
    if (typeof L === "undefined") {
        console.error("Leaflet (L) not loaded — cannot init MapObject.");
        return;
    }
    var outer = (mapDom.getAttribute("name") === "MapObject") ? mapDom : MapGetOuter(mapDom);
    if (!outer || outer._leafletmap) return;

    var mapPane = outer.querySelector(".mapobject-mappane");
    if (!mapPane) return;

    var center = MapParseLatLng(outer.getAttribute("data-map-center"), [0, 0]);
    var zoom = parseInt(outer.getAttribute("data-map-zoom"), 10);
    if (isNaN(zoom)) zoom = 2;
    var preset = MapGetTilePreset(MapResolveMapStyle(outer));
    var locked = (outer.getAttribute("data-map-lockview") || "false").toLowerCase() === "true";

    // Presets cap out at different zooms (terrain 17, CARTO 20). Switching to a
    // shallower preset while zoomed in past its cap would leave the map above the
    // tile layer's maxZoom, which renders nothing at all - clamp instead.
    var maxZoom = preset.maxZoom || 19;
    if (zoom > maxZoom) {
        zoom = maxZoom;
        outer.setAttribute("data-map-zoom", "" + zoom);
    }

    // Inert while the designer is editing: the Leaflet handlers sit on top of the object and would
    // swallow the drag used to move the MapObject itself, panning the map instead of moving it.
    var inert = locked || (typeof EditMode !== "undefined" && EditMode === true);

    var lmap = L.map(mapPane, {
        center: center,
        zoom: zoom,
        maxZoom: maxZoom,
        zoomControl: !inert,
        dragging: !inert,
        scrollWheelZoom: !inert,
        doubleClickZoom: !inert,
        boxZoom: !inert,
        touchZoom: !inert,
        keyboard: !inert,
        attributionControl: true,
        worldCopyJump: true
    });

    if (lmap.attributionControl && lmap.attributionControl.setPrefix) {
        lmap.attributionControl.setPrefix(false);
    }

    L.tileLayer(preset.url, {
        attribution: preset.attribution,
        minZoom: 0,
        maxZoom: preset.maxZoom || 19,
        subdomains: preset.subdomains || "abc",
        noWrap: false
    }).addTo(lmap);

    outer._leafletmap = lmap;
    outer._mapInert = inert;

    var reproject = function () { MapProjectChildren(outer); };
    lmap.on("move", reproject);
    lmap.on("zoom", reproject);
    lmap.on("zoomend", reproject);
    lmap.on("moveend", function () { MapPersistViewport(outer, lmap); });
    lmap.on("zoomend", function () { MapPersistViewport(outer, lmap); });

    MapForwardOverlayWheel(outer);

    setTimeout(function () {
        try { lmap.invalidateSize(); } catch (e) {}
        MapProjectChildren(outer);
    }, 0);
}

// Scroll-zoom stops working while the pointer is over a pin, which reads as the map being stuck.
//
// The overlay pane is a SIBLING of the Leaflet container, not a descendant, so nothing that happens
// on it reaches Leaflet's own wheel handler. Pins carry pointer-events:auto because they have to be
// clickable, so the wheel lands on the pin and dies there.
//
// The event is re-dispatched to the Leaflet container rather than calling setZoom directly, so
// Leaflet's own scroll-zoom runs: delta accumulation, zoom-around-cursor and the snap behaviour all
// come out identical to wheeling over bare map. No recursion - the container is a sibling, so the
// synthetic event cannot bubble back here.
function MapForwardOverlayWheel(outer) {
    if (!outer || outer._mapWheelForwarded) return;
    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return;
    outer._mapWheelForwarded = true;

    overlay.addEventListener("wheel", function (ev) {
        var lmap = outer._leafletmap;
        if (!lmap || !lmap.scrollWheelZoom || !lmap.scrollWheelZoom.enabled()) return;

        var container = lmap.getContainer();
        if (!container || container === ev.target || container.contains(ev.target)) return;

        ev.preventDefault();
        container.dispatchEvent(new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            clientX: ev.clientX,
            clientY: ev.clientY,
            deltaX: ev.deltaX,
            deltaY: ev.deltaY,
            deltaZ: ev.deltaZ,
            deltaMode: ev.deltaMode,
            ctrlKey: ev.ctrlKey,
            shiftKey: ev.shiftKey,
            altKey: ev.altKey,
            metaKey: ev.metaKey
        }));
    }, { passive: false });
}

// ────────────────────────────────────────────────────────────────
// Feature: project + show/hide overlay children
// ────────────────────────────────────────────────────────────────

// Enables or disables the Leaflet interaction handlers for one map.
//
// The map is inert while "Lock View (runtime)" is set, and ALSO while the designer is in edit mode:
// the Leaflet handlers cover the object, so dragging to reposition the MapObject on the canvas
// would pan the map underneath instead of moving the object. Called on init and on every edit-mode
// switch, and it is idempotent so repeated calls cost nothing.
function MapApplyInteraction(mapDom) {
    var outer = (mapDom && mapDom.getAttribute && mapDom.getAttribute("name") === "MapObject") ? mapDom : MapGetOuter(mapDom);
    if (!outer || !outer._leafletmap) return;

    var lmap = outer._leafletmap;
    var locked = (outer.getAttribute("data-map-lockview") || "false").toLowerCase() === "true";
    var inert = locked || (typeof EditMode !== "undefined" && EditMode === true);

    if (outer._mapInert === inert) return;
    outer._mapInert = inert;

    ["dragging", "scrollWheelZoom", "doubleClickZoom", "boxZoom", "touchZoom", "keyboard"].forEach(function (handler) {
        if (!lmap[handler]) return;
        try { inert ? lmap[handler].disable() : lmap[handler].enable(); } catch (e) {}
    });

    try {
        if (inert) {
            if (lmap.zoomControl) { lmap.zoomControl.remove(); lmap._mapZoomControlHidden = true; }
        } else if (lmap._mapZoomControlHidden && lmap.zoomControl) {
            lmap.zoomControl.addTo(lmap);
            lmap._mapZoomControlHidden = false;
        }
    } catch (e) {}
}

// Applied to every map on the page; called by EnableEditMode/DisableEditMode.
function MapApplyInteractionAll() {
    var root = document.getElementById("EnvisionPage") || document;
    var maps = root.querySelectorAll('[name="MapObject"]');
    for (var i = 0; i < maps.length; i++) MapApplyInteraction(maps[i]);
}

function MapHideMapChild(child) {
    if (!child) return;
    child.style.display = "none";
    child.style.pointerEvents = "none";
    child.setAttribute("data-system-map-offscreen", "true");
}

function MapShowMapChild(child, point, zoomFactor) {
    if (!child || !point) return;

    var wasOffscreen = child.getAttribute("data-system-map-offscreen") === "true";

    child.style.display = "";
    child.style.position = "absolute";
    child.style.zIndex = "400";
    child.style.pointerEvents = "auto";
    child.setAttribute("data-system-map-offscreen", "false");

    // The designer's own scale is the reference; the zoom factor multiplies it. transform-origin is
    // pinned to top left to match how PropertyHandlers applies data-groupscale, so both agree.
    var designed = parseFloat(child.getAttribute("data-groupscale"));
    if (isNaN(designed) || designed <= 0) designed = 1;
    var scale = designed * (typeof zoomFactor === "number" && zoomFactor > 0 ? zoomFactor : 1);

    if (scale === 1) {
        child.style.transform = "";
        child.style.transformOrigin = "";
    }
    else {
        child.style.transform = "scale(" + scale + ")";
        child.style.transformOrigin = "top left";
    }

    // Measure after display is visible so offsetWidth/Height are correct.
    //
    // offsetWidth/Height report the UNSCALED layout box - a CSS transform does not affect them - so
    // centring on them put a scaled pin off its own coordinate by a quarter of its size. That was
    // invisible while every pin sat at a fixed scale; the moment scale varies with zoom, pins visibly
    // slide away from their location as you zoom. Centre on the VISUAL box instead.
    var w = child.offsetWidth * scale;
    var h = child.offsetHeight * scale;
    child.style.left = (point.x - w / 2) + "px";
    child.style.top = (point.y - h / 2) + "px";

    if (wasOffscreen) {
        // Marking walks every descendant with querySelectorAll("*") and stamps an attribute on
        // each. It used to run here on every call, which means on every frame of a pan: with 100
        // pins of 100 elements that is 10,000 setAttribute calls per frame, ~80% of the projection
        // cost, all of it rewriting values that were already correct. The attributes never change
        // once set, so marking belongs on the offscreen -> onscreen transition only.
        MapMarkUnselectable(child);

        // Rebuild the recorded variable set from scratch while visible, so a symbol
        // whose bindings changed (master push, replacer edit) does not keep replaying
        // variables it no longer uses.
        child._mapChildVars = null;
        MapInitMapChildRuntime(child);
    }
}

// Wire newly visible map children into executeQuery / theme resolution and drag handlers.
function MapInitMapChildRuntime(child) {
    if (!child) return;
    if (typeof initDraggable === "function") initDraggable();
    if (typeof ResetOnEnters === "function") ResetOnEnters();
    if (typeof executeQuery === "function") {
        setTimeout(executeQuery, 0);
    }
}

function MapProjectChildren(mapDom) {
    var outer = (mapDom.getAttribute("name") === "MapObject") ? mapDom : MapGetOuter(mapDom);
    if (!outer || !outer._leafletmap) return;
    var lmap = outer._leafletmap;
    var size = lmap.getSize();
    var bounds = lmap.getBounds();

    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return;
    if (overlay.style.pointerEvents !== "none") overlay.style.pointerEvents = "none";

    var children = overlay.querySelectorAll('[data-system-mapchild="true"]');
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var resolved = MapResolveChildPosition(child);
        var lat = resolved ? resolved[0] : NaN;
        var lon = resolved ? resolved[1] : NaN;

        if (isNaN(lat) || isNaN(lon)) {
            MapHideMapChild(child);
            continue;
        }

        var ll = L.latLng(lat, lon);
        if (!bounds.contains(ll)) {
            MapHideMapChild(child);
            continue;
        }

        var point = lmap.latLngToContainerPoint(ll);
        if (point.x < -80 || point.y < -80 || point.x > size.x + 80 || point.y > size.y + 80) {
            MapHideMapChild(child);
            continue;
        }

        MapShowMapChild(child, point, MapChildScaleFactor(lmap, child));
    }
}

// Pins keep their pixel size at every zoom, so zooming out packs them together until they overlap
// into an unreadable stack. Scaling them with the zoom keeps the map legible while staying
// continuous - no popping between representations, and no new visual vocabulary to learn.
//
// The two settings are a MIN and MAX scale spread across the map's zoom range, rather than a factor
// per zoom level: zoom is exponential, so a per-level factor is unpredictable (0.7 per level is 17%
// four levels out), while "smallest at fully zoomed out, largest at fully zoomed in, linear
// between" is two numbers a reader can hold in their head.
//
// The result MULTIPLIES the designer's data-groupscale rather than replacing it, so the size they
// chose is still the reference.
var MapDefaultMinScale = 0.4;
var MapDefaultMaxScale = 1;

function MapReadScaleSetting(child, attr, fallback) {
    var raw = (child.getAttribute(attr) || "").trim();
    if (!raw) return fallback;
    var n = parseFloat(raw);
    if (isNaN(n) || n <= 0) return fallback;
    return n;
}

function MapChildScaleFactor(lmap, child) {
    var min = MapReadScaleSetting(child, "data-minscale", MapDefaultMinScale);
    var max = MapReadScaleSetting(child, "data-maxscale", MapDefaultMaxScale);
    if (min === max) return min;

    var minZoom = lmap.getMinZoom();
    var maxZoom = lmap.getMaxZoom();
    if (!isFinite(minZoom) || !isFinite(maxZoom) || maxZoom <= minZoom) return max;

    var t = (lmap.getZoom() - minZoom) / (maxZoom - minZoom);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return min + (max - min) * t;
}

// Tag `node` and every descendant with data-noselect="true" so selectables.js
// (and any other selection mechanism that looks for this attr) skips them.
function MapMarkUnselectable(node) {
    if (!node || !node.setAttribute) return;
    node.setAttribute("data-noselect", "true");
    if (!node.querySelectorAll) return;
    var all = node.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
        if (all[i].setAttribute) all[i].setAttribute("data-noselect", "true");
    }
}

function MapStripActiveSelected(node) {
    if (!node) return;
    if (typeof ClassListRemoveSelectedActive === "function") {
        ClassListRemoveSelectedActive(node);
    } else if (node.classList) {
        node.classList.remove("ActiveSelected");
    }
    if (!node.querySelectorAll) return;
    var draggables = node.querySelectorAll(".draggable");
    for (var i = 0; i < draggables.length; i++) {
        if (typeof ClassListRemoveSelectedActive === "function") {
            ClassListRemoveSelectedActive(draggables[i]);
        } else if (draggables[i].classList) {
            draggables[i].classList.remove("ActiveSelected");
        }
    }
}

// Clone a Symbol Master into a persisted map-owned GroupSymbol instance.
// The full GroupSymbol HTML is saved with the page and survives master deletion.
function MapBuildSymbolInstance(master, symbolname, callerid) {
    try {
        var template = document.createElement("template");
        template.innerHTML = master.outerHTML;
        var content = template.content.childNodes[0];

        content.id = (typeof GenerateUniqueID === "function") ? GenerateUniqueID() : ("mapc_" + Math.random().toString(36).slice(2));
        content.removeAttribute("data-noid");
        content.setAttribute("data-groupsymbol", symbolname + "_" + content.id);
        content.setAttribute("data-groupsymbolmaster", symbolname);

        var elements = content.getElementsByTagName("*");
        for (var i = elements.length; i >= 1; i--) {
            var el = elements[i - 1];
            el.id = (typeof GenerateUniqueID === "function") ? GenerateUniqueID() : ("mapd_" + Math.random().toString(36).slice(2));
            el.removeAttribute("data-noid");
            el.outerHTML = el.outerHTML.replaceAll("data-nosrc=", "src=");
        }

        var html = template.innerHTML;
        html = html.replace("{UID}", "_GarbageCollect_" + content.id);
        html = html.replace("{GroupSymbol}", symbolname);
        html = html.replace("{CallerID}", callerid);

        template.innerHTML = html;
        return template.content.childNodes[0];
    } catch (err) {
        console.error("MapBuildSymbolInstance:", err);
        return null;
    }
}

function MapPanToChild(outer, child, callback) {
    if (!outer || !child) {
        if (callback) callback();
        return;
    }

    var resolved = MapResolveChildPosition(child);
    var lat = resolved ? resolved[0] : NaN;
    var lon = resolved ? resolved[1] : NaN;

    if (isNaN(lat) || isNaN(lon) || !outer._leafletmap || typeof L === "undefined") {
        MapProjectChildren(outer);
        if (callback) callback();
        return;
    }

    var lmap = outer._leafletmap;
    var ll = L.latLng(lat, lon);
    var needsPan = !lmap.getBounds().contains(ll);

    var done = function () {
        MapProjectChildren(outer);
        if (callback) callback();
    };

    if (needsPan) {
        lmap.once("moveend", done);
        try {
            lmap.panTo(ll, { animate: true });
        } catch (e) {
            lmap.off("moveend", done);
            done();
        }
    } else {
        done();
    }
}

function MapClearMapChildDecoration() {
    if (!MapDecoratingCallerId) return;

    var callerid = MapDecoratingCallerId;
    var outer = MapDecoratingOuter;
    MapDecoratingCallerId = null;
    MapDecoratingOuter = null;

    if (!outer) return;

    var child = MapGetMapChild(outer, callerid);
    if (child) {
        MapStripActiveSelected(child);
        if (typeof RemoveInfoTexts === "function") RemoveInfoTexts(child, true);
        if (typeof RemoveBorders === "function") RemoveBorders(child);
    }
}

// ────────────────────────────────────────────────────────────────
// Map child CRUD (decorator UI)
// ────────────────────────────────────────────────────────────────

// The map-child attribute contract (Docs/Design/MapObjectChildren.md section 5) in ONE place.
// Both producers go through here - MapAddChild, which builds a new instance from a master, and
// MapAdoptExistingSymbol, which takes a symbol already on the page. Adding an attribute to the
// contract means adding it here and in the design doc's table, nowhere else.
function MapStampAsChild(child, symbolname, lat, lon, callerid, positionvariable) {
    if (!child) return null;

    child.setAttribute("data-system-mapchild", "true");
    child.setAttribute("data-symbolname", symbolname || "");
    child.setAttribute("data-positionvariable", positionvariable || "");
    child.setAttribute("data-lat", lat == null ? "" : "" + lat);
    child.setAttribute("data-lon", lon == null ? "" : "" + lon);
    child.setAttribute("data-popupcallerid", callerid);
    child.setAttribute("data-system-map-offscreen", "true");
    child.style.display = "none";
    child.style.pointerEvents = "none";
    MapMarkUnselectable(child);

    // A symbol adopted from the canvas arrives still selected, so its edit-mode decoration (borders,
    // position/size/layer texts and the lock icon) exists as sibling divs in EnvisionPage. From this
    // point SetResetTexts skips map children, so nothing would ever clear them again and the lock
    // icon stayed on screen even after leaving edit mode. Drop them here, once, for both producers.
    MapStripActiveSelected(child);
    if (typeof RemoveInfoTexts === "function") RemoveInfoTexts(child, true);
    if (typeof RemoveBorders === "function") RemoveBorders(child);

    return child;
}

// Called from StopDragElement (edit mode only) when a real drag ended. If the dragged symbol was
// dropped onto a map, offer to make it a child of that map. Returns true when it converted.
//
// Deliberately narrow: only a group symbol INSTANCE qualifies. A master is a template that other
// pages instantiate, and a plain object has no symbol identity for the children dialog to list.
function MapTryAdoptOnDrop(node) {
    if (!node || typeof EditMode === "undefined" || !EditMode) return false;
    if (node.getAttribute("name") !== "GroupObject") return false;
    if (node.getAttribute("data-system-mapchild") === "true") return false;      // already on a map
    if (node.closest && node.closest(".mapobject-overlaypane")) return false;

    var symbol = node.getAttribute("data-groupsymbol") || "";
    var master = node.getAttribute("data-groupsymbolmaster") || "";
    if (symbol === "" || master === "") return false;                      // instances only

    var rect = node.getBoundingClientRect();
    var outer = MapFindMapAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (!outer) return false;
    if (node.contains(outer)) return false;                                // never swallow its own map

    if (!confirm(MapT("adoptConfirm").replace("{0}", symbol) + "\n\n" + MapT("adoptConfirmInfo"))) return false;

    var child = MapAdoptExistingSymbol(outer, node);
    if (!child) return false;

    // It is hidden until it has a position, so send the user straight to where that is set
    // rather than leaving a symbol that appears to have vanished.
    if (typeof MapOpenChildrenModal === "function") MapOpenChildrenModal(outer);
    return true;
}

// The topmost MapObject under a viewport point, or null. Reverse document order so a map drawn
// later (higher in the stack) wins when two overlap, matching what the user sees.
function MapFindMapAt(clientX, clientY) {
    var page = document.getElementById("EnvisionPage");
    if (!page) return null;

    var maps = page.querySelectorAll('[name="MapObject"]');
    for (var i = maps.length - 1; i >= 0; i--) {
        if (maps[i].id === "TypeMap") continue;
        var r = maps[i].getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
            return maps[i];
        }
    }
    return null;
}

// Moves a symbol that is already on the page into a map, instead of building a new one. The node
// is MOVED, not cloned: it keeps its id, its replacers, its UDT binding and its actions, so a
// symbol adopted this way stays the same object to every push that already knows it.
//
// Position does NOT carry over: a canvas symbol has pixel top/left, which means nothing on a map.
// It is stamped with an empty position and therefore sits hidden until one is supplied, which
// is why the caller opens the children dialog straight afterwards.
function MapAdoptExistingSymbol(outer, node) {
    if (!outer || outer.getAttribute("name") !== "MapObject" || !node) return null;
    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return null;

    var uid = (typeof GenerateUniqueID === "function") ? GenerateUniqueID() : Math.random().toString(36).slice(2);
    var callerid = outer.id + "_child_" + uid;

    // The master name is what the dialog lists the row under; an instance carries it on
    // data-groupsymbolmaster, and a plain group falls back to its own symbol name.
    var symbolname = node.getAttribute("data-groupsymbolmaster") || node.getAttribute("data-groupsymbol") || "";

    // Canvas geometry is meaningless inside the overlay pane: projection sets left/top per frame.
    node.style.left = "";
    node.style.top = "";
    node.style.position = "absolute";

    MapStampAsChild(node, symbolname, "", "", callerid, "");

    overlay.appendChild(node);
    MapProjectChildren(outer);
    MapInitMapChildRuntime(node);
    return node;
}

function MapAddChild(outer, symbolname, lat, lon, positionvariable) {
    if (!outer || outer.getAttribute("name") !== "MapObject") return null;
    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return null;

    var uid = (typeof GenerateUniqueID === "function") ? GenerateUniqueID() : Math.random().toString(36).slice(2);
    var callerid = outer.id + "_child_" + uid;

    var master = (typeof GetSymbolMaster === "function" && symbolname) ? GetSymbolMaster(symbolname) : null;
    if (!master) return null;

    var child = MapBuildSymbolInstance(master, symbolname, callerid);
    if (!child) return null;

    MapStampAsChild(child, symbolname, lat, lon, callerid, positionvariable);

    overlay.appendChild(child);
    MapProjectChildren(outer);
    MapInitMapChildRuntime(child);
    return child;
}

function MapRemoveChild(outer, callerid) {
    if (!outer || !callerid) return;

    if (MapDecoratingCallerId === callerid) {
        MapClearMapChildDecoration();
        if (typeof closeconfigs === "function") closeconfigs();
    }

    var child = MapGetMapChild(outer, callerid);
    if (child && child.parentElement) child.parentElement.removeChild(child);
}

function MapListChildren(outer) {
    var out = [];
    if (!outer) return out;
    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return out;
    var children = overlay.querySelectorAll('[data-system-mapchild="true"]');
    for (var i = 0; i < children.length; i++) {
        var c = children[i];
        var symbolname = c.getAttribute("data-symbolname") || "";
        if (!symbolname) symbolname = c.getAttribute("data-groupsymbolmaster") || "";
        out.push({
            callerid: c.getAttribute("data-popupcallerid") || "",
            symbolname: symbolname,
            // The instance's own name. Every row shows the same master under Symbol Name, so this
            // is the only column that tells two pins of the same type apart.
            instancename: c.getAttribute("data-groupsymbol") || "",
            minscale: c.getAttribute("data-minscale") || "",
            maxscale: c.getAttribute("data-maxscale") || "",
            positionvariable: c.getAttribute("data-positionvariable") || "",
            lat: c.getAttribute("data-lat") || "",
            lon: c.getAttribute("data-lon") || "",
            child: c
        });
    }
    return out;
}

// ────────────────────────────────────────────────────────────────
// Position resolution
// ────────────────────────────────────────────────────────────────

// Resolves a pin's position variable to [lat, lon], or null. One variable rather than a latitude
// and a longitude variable so the pair updates atomically: two would tear, briefly placing the
// symbol somewhere it has never been.
function MapResolvePositionVariable(name) {
    if (!name || typeof VarDict === "undefined") return null;

    var entry = VarDict[name];
    if (entry === undefined) return null;

    return MapParsePositionValue(entry[0]);
}

// Splits a combined "lat,lon" value. A semicolon is also accepted, and the split is strict:
// exactly two non-empty parts, so a partially written value fails rather than resolving to half a
// coordinate - which is the whole reason a position travels in one variable.
function MapParsePositionValue(value) {
    if (value === null || value === undefined) return null;

    var text = ("" + value).trim();
    if (!text) return null;

    var parts = text.split(text.indexOf(",") >= 0 ? "," : ";");
    if (parts.length !== 2) return null;

    return MapValidatePosition(parseFloat(parts[0].trim()), parseFloat(parts[1].trim()));
}

// A live feed can deliver nonsense; refuse to place a symbol off the globe.
function MapValidatePosition(lat, lon) {
    if (isNaN(lat) || isNaN(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return [lat, lon];
}

function RenderMapObject(mapDom) {
    var outer = (mapDom.getAttribute("name") === "MapObject") ? mapDom : MapGetOuter(mapDom);
    if (!outer) return;
    if (!outer._leafletmap) initMap(outer);

    MapProjectChildren(outer);

    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (overlay) {
        var visible = overlay.querySelectorAll('[data-system-mapchild="true"][data-system-map-offscreen="false"]');
        for (var i = 0; i < visible.length; i++) {
            MapInitMapChildRuntime(visible[i]);
        }
    }
}

function MapSyncFromExecuteQuery(mapDom) {
    var outer = (mapDom.getAttribute("name") === "MapObject") ? mapDom : MapGetOuter(mapDom);
    if (!outer || !outer._leafletmap) return;

    var w = outer.clientWidth, h = outer.clientHeight;
    if (outer._mapLastW !== w || outer._mapLastH !== h) {
        outer._mapLastW = w;
        outer._mapLastH = h;
        try { outer._leafletmap.invalidateSize(); } catch (e) {}
    }

    var sig = MapBuildVariableLatLonSignature(outer);
    if (outer._mapLastVarSig !== sig) {
        outer._mapLastVarSig = sig;
        MapProjectChildren(outer);
    }
}

function MapBuildVariableLatLonSignature(outer) {
    var parts = [];
    var overlay = outer.querySelector(".mapobject-overlaypane");
    if (!overlay) return "";
    var children = overlay.querySelectorAll('[data-system-mapchild="true"]');
    for (var i = 0; i < children.length; i++) {
        var c = children[i];
        var resolved = MapResolveChildPosition(c);
        parts.push(c.getAttribute("data-popupcallerid") + ":" + (resolved ? resolved[0] + "," + resolved[1] : ""));
    }
    return parts.join("|");
}

// ────────────────────────────────────────────────────────────────
// Lifecycle
// ────────────────────────────────────────────────────────────────

// Translations are injected by _MapPartial.cshtml (a plain .js file has no @T). Falls back to the
// English sentence rather than the key: this text lands in a confirm() the user has to answer.
var MapTranslationFallbacks = {
    deleteConfirm: "Delete this map?",
    deleteConfirmChildren: "symbol(s) placed on it are deleted with it.",
    adoptConfirm: "Place '{0}' on this map?",
    adoptConfirmInfo: "It is then positioned by its position variable or coordinates instead of by dragging, and stays hidden until one is set.",
    coordUnresolved: "not resolving",
    selectVariable: "Variables",
    minScaleHint: "Size of this symbol when the map is fully zoomed out, as a factor of its designed size. Empty uses the default.",
    maxScaleHint: "Size of this symbol when the map is fully zoomed in, as a factor of its designed size. Empty uses the default. Set both to 1 to keep a fixed size."
};

function MapT(key) {
    var map = window.MapTranslations || {};
    return map[key] || MapTranslationFallbacks[key] || key;
}

// Deleting a map deletes the symbols placed on it, because they are nested inside it - see
// Docs/Design/MapObjectChildren.md section 1. That is intended, but it is invisible from the
// canvas: the pins read as page objects, so the count is stated before it happens. Returns
// true when the delete may proceed. Mirrors AreYouSureDeleteSymbol.
function MapConfirmDelete(mapDom) {
    var outer = (mapDom && mapDom.getAttribute("name") === "MapObject") ? mapDom : MapGetOuter(mapDom);
    if (!outer) return true;

    var children = outer.querySelectorAll('[data-system-mapchild="true"]').length;
    var message = MapT("deleteConfirm");
    if (children > 0) message += "\n\n" + children + " " + MapT("deleteConfirmChildren");

    return confirm(message);
}

// Tears down every map in a subtree, for the paths that discard DOM wholesale instead of deleting
// one selected object: a group containing a map, a page switch, and undo/redo. Those replace or
// remove the nodes without any per-type cleanup, so Leaflet's document- and window-level handlers
// and its pending tile work outlive the elements they belong to - one orphaned instance per page
// switch onto a map page. MapReinitMaps does not cover it: it calls remove() on the NEW node's
// _leafletmap, which is null, so the old instance is never reached.
//
// Call this BEFORE the removal, while the nodes are still in the tree. Safe to call on a subtree
// with no maps, and safe to call twice - MapDestroy nulls _leafletmap.
function MapDestroyWithin(root) {
    if (!root) return 0;

    var maps = [];
    if (root.getAttribute && root.getAttribute("name") === "MapObject") maps.push(root);
    if (root.querySelectorAll) {
        var nested = root.querySelectorAll('[name="MapObject"]');
        for (var i = 0; i < nested.length; i++) maps.push(nested[i]);
    }

    var destroyed = 0;
    for (var j = 0; j < maps.length; j++) {
        // The type template (#TypeMap) is a prototype, never an initialised map. Skip it rather
        // than tearing down something that was never built.
        if (maps[j].id === "TypeMap") continue;
        try { MapDestroy(maps[j]); destroyed++; } catch (e) {}
    }
    return destroyed;
}

// Confirms deletion for every map inside a subtree (a group may contain one). Returns false as
// soon as the user declines, so the caller can abort the whole delete.
function MapConfirmDeleteWithin(root) {
    if (!root) return true;

    var maps = [];
    if (root.getAttribute && root.getAttribute("name") === "MapObject") maps.push(root);
    if (root.querySelectorAll) {
        var nested = root.querySelectorAll('[name="MapObject"]');
        for (var i = 0; i < nested.length; i++) maps.push(nested[i]);
    }

    for (var j = 0; j < maps.length; j++) {
        if (maps[j].id === "TypeMap") continue;
        if (!MapConfirmDelete(maps[j])) return false;
    }
    return true;
}

function MapDestroy(mapDom) {
    var outer = (mapDom.getAttribute("name") === "MapObject") ? mapDom : MapGetOuter(mapDom);
    if (!outer) return;

    if (MapDecoratingOuter === outer) {
        MapClearMapChildDecoration();
    }

    if (outer._leafletmap) {
        try { outer._leafletmap.remove(); } catch (e) {}
        outer._leafletmap = null;
    }
}

function MapStripRuntimeBeforeSave(rootClone) {
    if (!rootClone) return;

    var mapChildren = rootClone.querySelectorAll('[data-system-mapchild="true"]');
    for (var i = 0; i < mapChildren.length; i++) {
        var child = mapChildren[i];
        child.style.display = "none";
        child.style.pointerEvents = "none";
        child.setAttribute("data-system-map-offscreen", "true");
        child.style.left = "";
        child.style.top = "";

        // transform is zoom-dependent runtime state now that pins scale with the map, so it is
        // reset to the DESIGNED scale rather than saved. Otherwise the page would bake in whatever
        // zoom the designer happened to be at, and reopening it at another zoom would show a pin
        // sized for a view nobody is looking at. Same rule as left/top above, and invariant 6 of
        // MapObjectChildren.md: runtime state never persists into the page.
        var designed = parseFloat(child.getAttribute("data-groupscale"));
        if (isNaN(designed) || designed <= 0 || designed === 1) {
            child.style.transform = "";
            child.style.transformOrigin = "";
        }
        else {
            child.style.transform = "scale(" + designed + ")";
            child.style.transformOrigin = "top left";
        }

        MapMarkUnselectable(child);
    }

    var mapPanes = rootClone.querySelectorAll(".mapobject-mappane");
    for (var j = 0; j < mapPanes.length; j++) mapPanes[j].innerHTML = "";
}

// ────────────────────────────────────────────────────────────────
// Decorator: right-side panel inputs (MapContext)
// ────────────────────────────────────────────────────────────────

function MapContextInit() {
    var target = (typeof ElementToBeDecorated !== "undefined") ? ElementToBeDecorated : null;
    if (!target) return;
    var outer = (target.getAttribute && target.getAttribute("name") === "MapObject") ? target : MapGetOuter(target);
    if (!outer) return;

    var styleSelect = document.getElementById("MapContextStyle");
    var lockViewCheckbox = document.getElementById("MapContextLockView");

    if (styleSelect) {
        styleSelect.value = MapResolveMapStyle(outer);
        styleSelect.onchange = function (e) {
            MapReinitMaps(MapApplyAttribute(outer, "data-map-style", e.target.value));
        };
    }
    if (lockViewCheckbox) {
        lockViewCheckbox.checked = (outer.getAttribute("data-map-lockview") || "false").toLowerCase() === "true";
        lockViewCheckbox.oninput = function (e) {
            MapReinitMaps(MapApplyAttribute(outer, "data-map-lockview", e.target.checked ? "true" : "false"));
        };
    }
}

// Returns every MapObject the attribute was written to, so the caller can
// reinitialise all of them. With several maps selected the attribute applies to
// the whole selection, so repainting only the one under the cursor would leave
// the rest showing stale tiles until the page reloads.
function MapApplyAttribute(outer, attr, value) {
    var targets = (typeof ElementsToBeDecorated !== "undefined") ? ElementsToBeDecorated : [outer];
    var applied = [];
    for (var i = targets.length; i >= 1; i--) {
        var t = (typeof getObjDom === "function") ? getObjDom(targets[i - 1]) : targets[i - 1];
        if (!t) continue;
        var o = (t.getAttribute && t.getAttribute("name") === "MapObject") ? t : MapGetOuter(t);
        if (o) {
            o.setAttribute(attr, value);
            if (applied.indexOf(o) === -1) applied.push(o);
        }
    }
    if (!applied.length && outer) applied.push(outer);
    return applied;
}

function MapReinitMaps(outers) {
    if (!outers) return;
    for (var i = 0; i < outers.length; i++) MapReinitMap(outers[i]);
}

// ────────────────────────────────────────────────────────────────
// Modal: edit children (Search/Add/Remove + table)
// ────────────────────────────────────────────────────────────────

var MapCurrentDecoratorOuter = null;
var MapPendingSymbolSelectCallback = null;
var MapDecoratingCallerId = null;
var MapDecoratingOuter = null;

function MapPersistMapChildrenChanges() {
    if (typeof SilentUpdatePage === "function") {
        try { SilentUpdatePage(); } catch (e) {}
    }
    if (typeof SaveConfirm === "function") {
        SaveConfirm();
    }
}

function MapEnsureSymbolsModalStacking() {
    var modalEl = document.getElementById("SymbolsModal");
    if (!modalEl || modalEl._mapStackingHooked) return;
    modalEl._mapStackingHooked = true;
    modalEl.addEventListener("shown.bs.modal", function () {
        var mapModal = document.getElementById("MapChildrenModal");
        if (!mapModal || !mapModal.classList.contains("show")) return;
        var mapZ = parseInt(window.getComputedStyle(mapModal).zIndex, 10);
        if (isNaN(mapZ)) mapZ = 1055;
        var z = mapZ + 10;
        modalEl.style.zIndex = z;
        var backdrops = document.querySelectorAll(".modal-backdrop");
        if (backdrops.length) {
            backdrops[backdrops.length - 1].style.zIndex = z - 1;
        }
    });
}

function MapOpenSymbolPicker(onSymbolSelected) {
    MapPendingSymbolSelectCallback = onSymbolSelected;
    MapEnsureSymbolsModalStacking();
    var modalEl = document.getElementById("SymbolsModal");
    if (modalEl && !modalEl._mapSymbolCancelHooked) {
        modalEl.addEventListener("hidden.bs.modal", function () {
            MapPendingSymbolSelectCallback = null;
        });
        modalEl._mapSymbolCancelHooked = true;
    }

    if (typeof GetSymbolsList === "function") {
        GetSymbolsList();
    } else {
        MapPendingSymbolSelectCallback = null;
    }
}

function MapHandleSymbolSelected(symbolname) {
    if (!MapPendingSymbolSelectCallback) return false;
    var callback = MapPendingSymbolSelectCallback;
    MapPendingSymbolSelectCallback = null;
    callback(symbolname);
    return true;
}

// outerOverride lets a caller name the map explicitly. The decorator button passes nothing and
// keeps resolving from ElementToBeDecorated; the drop gesture passes the map it just adopted into,
// because after a drop the decorated element is the symbol, not the map.
function MapOpenChildrenModal(outerOverride) {
    if (typeof MapClearMapChildDecoration === "function") MapClearMapChildDecoration();

    var outer = null;
    if (outerOverride && outerOverride.getAttribute && outerOverride.getAttribute("name") === "MapObject") {
        outer = outerOverride;
    }
    else {
        var target = (typeof ElementToBeDecorated !== "undefined") ? ElementToBeDecorated : null;
        if (!target) return;
        outer = (target.getAttribute && target.getAttribute("name") === "MapObject") ? target : MapGetOuter(target);
    }
    if (!outer) return;
    MapCurrentDecoratorOuter = outer;

    MapRenderChildrenTable(outer);
    var modalEl = document.getElementById("MapChildrenModal");
    if (!modalEl) return;
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function MapRenderChildrenTable(outer) {
    var tbody = document.getElementById("MapChildrenModalRows");
    if (!tbody) return;
    tbody.innerHTML = "";

    var searchTerm = (document.getElementById("MapChildrenModalSearch") || { value: "" }).value.toLowerCase();
    var children = MapListChildren(outer);
    for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (searchTerm &&
            c.symbolname.toLowerCase().indexOf(searchTerm) === -1 &&
            (c.instancename || "").toLowerCase().indexOf(searchTerm) === -1 &&
            (c.positionvariable || "").toLowerCase().indexOf(searchTerm) === -1) continue;
        tbody.appendChild(MapBuildChildRow(outer, c));
    }
}

function MapBuildChildRow(outer, c) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-callerid", c.callerid);

    var tdCheck = document.createElement("td");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "form-check-input";
    cb.setAttribute("data-mapchild-check", c.callerid);
    tdCheck.appendChild(cb);
    tr.appendChild(tdCheck);

    var tdName = document.createElement("td");
    tdName.textContent = c.symbolname;
    tr.appendChild(tdName);

    var tdInstance = document.createElement("td");
    tdInstance.textContent = c.instancename || "";
    tr.appendChild(tdInstance);

    // A position variable places the pin on its own, so the coordinate cells are read-only while one
    // is set - and they stay that way even when it does not resolve. Letting them fall back to manual
    // entry would let a pin silently switch between two sources of truth; clear the variable to
    // position by hand.
    var posvar = (c.positionvariable || "").trim();

    tr.appendChild(MapBuildPositionVarCell(outer, c.callerid, posvar));
    tr.appendChild(MapBuildCoordCell(outer, c.callerid, "data-lon", c.lon, "e.g. 4.40", "Longitude in decimal degrees: -180 (West) to 180 (East), or the name of a variable holding it", posvar));
    tr.appendChild(MapBuildCoordCell(outer, c.callerid, "data-lat", c.lat, "e.g. 51.22", "Latitude in decimal degrees: -90 (South) to 90 (North), or the name of a variable holding it", posvar));
    // Empty means "use the default", so an untouched pin scales like every other one and the field
    // does not have to be filled in to get sensible behaviour. The placeholder shows what empty does.
    tr.appendChild(MapBuildTextCell(outer, c.callerid, "data-minscale", c.minscale,
        "" + MapDefaultMinScale, MapT("minScaleHint")));
    tr.appendChild(MapBuildTextCell(outer, c.callerid, "data-maxscale", c.maxscale,
        "" + MapDefaultMaxScale, MapT("maxScaleHint")));

    tr.appendChild(MapBuildChildSettingsCell(outer, c.callerid));

    return tr;
}

// The pin's position variable: one variable carrying "lat,lon". It outranks the coordinate columns,
// which go read-only and show what it currently resolves to.
function MapBuildPositionVarCell(outer, callerid, value) {
    var td = document.createElement("td");

    var group = document.createElement("div");
    group.className = "d-flex align-items-start gap-1";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "form-control form-control-sm configinput";
    input.value = value;
    input.placeholder = "e.g. Pump1_Position";
    input.title = "Name of one variable whose value is \"lat,lon\" (for example 51.2194,4.4025). "
        + "Takes precedence over the coordinates. Leave empty to position the symbol by hand.";
    // Only re-render when the name actually changed: an unchanged blur (clicking the picker, or
    // tabbing through) would otherwise rebuild the table and destroy the element being clicked.
    input.onblur = function (e) {
        if (e.target.value === value) return;
        MapUpdateChildAttr(outer, callerid, "data-positionvariable", e.target.value, true);
        if (MapCurrentDecoratorOuter) MapRenderChildrenTable(MapCurrentDecoratorOuter);
    };
    group.appendChild(input);

    // Same variable list as every other variable field in edit mode, so the name can be picked
    // instead of typed from memory - a typo here just leaves the pin unpositioned.
    var pick = document.createElement("button");
    pick.type = "button";
    // Same [...] affordance as the UDT editor's pickers, so a helper modal looks the same
    // wherever it is offered.
    pick.className = "map-varpick-btn";
    pick.tabIndex = -1;
    pick.title = MapT("selectVariable");
    pick.textContent = "...";
    // mousedown is where the click would blur the input; suppressing it keeps focus (and therefore
    // the row) alive until the click handler runs.
    pick.onmousedown = function (e) { e.preventDefault(); };
    pick.onclick = function () { MapPickPositionVariable(pick, input, outer, callerid); };
    group.appendChild(pick);

    td.appendChild(group);

    var name = (value || "").trim();
    if (name) {
        var note = document.createElement("div");
        note.style.fontSize = "11px";
        note.style.marginTop = "2px";

        var pos = MapResolvePositionVariable(name);
        if (pos) {
            note.style.color = "var(--ThemeFontColor2)";
            note.textContent = "Position: " + pos[0] + ", " + pos[1];
        }
        else {
            input.style.borderColor = "#d97706";
            note.style.color = "#d97706";
            // Told apart because the fix differs: a subscribed name carrying something else is a
            // value problem at the source, while an absent one is a typo OR a name entered seconds
            // ago, which is only subscribed from the next refresh. The wording must not accuse a
            // perfectly good name that simply has not been polled yet.
            note.textContent = (typeof VarDict !== "undefined" && VarDict[name] !== undefined)
                ? "This variable is not a \"lat,lon\" value."
                : "Not resolving yet. A name entered just now resolves after the next refresh.";
        }
        td.appendChild(note);
    }

    return td;
}

// The shared variables modal writes the picked name straight into the input it finds beside the
// button (see ChooseVariable in Popups.js) and knows nothing about map children, so the value is
// committed here once that modal has closed - whether a variable was picked or not, which also
// covers a plain Close after an edit.
function MapPickPositionVariable(btn, input, outer, callerid) {
    if (typeof VariablesModal !== "function") return;

    var modal = document.getElementById("VariablesModal");
    if (modal) {
        // Stacking above the children dialog is handled centrally by site.js.
        modal.addEventListener("hidden.bs.modal", function commit() {
            modal.removeEventListener("hidden.bs.modal", commit);
            MapUpdateChildAttr(outer, callerid, "data-positionvariable", input.value, true);
            if (MapCurrentDecoratorOuter) MapRenderChildrenTable(MapCurrentDecoratorOuter);
        });
    }

    VariablesModal(btn);
}

function MapBuildChildSettingsCell(outer, callerid) {
    var td = document.createElement("td");
    td.className = "text-center";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-sm";
    btn.title = "Settings";
    btn.innerHTML = '<i class="fa-solid fa-gear"></i>';
    btn.onclick = function () { MapOpenChildInstanceSettings(outer, callerid); };

    td.appendChild(btn);
    return td;
}

function MapOpenChildInstanceSettings(outer, callerid) {
    if (!outer || !callerid) return;

    var child = MapGetMapChild(outer, callerid);
    if (!child || child.getAttribute("name") !== "GroupObject") return;

    MapClearMapChildDecoration();

    var childrenModal = document.getElementById("MapChildrenModal");
    if (childrenModal) {
        var modalInstance = bootstrap.Modal.getInstance(childrenModal);
        if (modalInstance) modalInstance.hide();
    }

    MapPanToChild(outer, child, function () {
        MapFinishOpenChildInstanceSettings(outer, callerid, child);
    });
}

async function MapFinishOpenChildInstanceSettings(outer, callerid, child) {
    if (typeof DeselectAllObjects === "function") DeselectAllObjects();

    MapDecoratingCallerId = callerid;
    MapDecoratingOuter = outer;

    if (typeof ClassListAddSelectedActive === "function") {
        ClassListAddSelectedActive(child);
    }
    LastSelectedActive = child;
    RightClickedObjectId = child.id;

    if (typeof showmulticontextmenu === "function") {
        await showmulticontextmenu(child);
    }

    if (typeof SetResetTexts === "function") SetResetTexts();
}

function MapBuildTextCell(outer, callerid, attr, value, placeholder, title) {
    var td = document.createElement("td");
    var input = document.createElement("input");
    input.type = "text";
    input.className = "form-control form-control-sm configinput";
    input.value = value;
    input.placeholder = placeholder;
    input.title = title || "";
    input.onblur = function (e) { MapUpdateChildAttr(outer, callerid, attr, e.target.value, true); };
    td.appendChild(input);
    return td;
}

// A coordinate cell is read-only while a position variable drives the position, and stays that way
// even when that variable stops resolving. Falling back to manual entry would let a pin silently
// switch between two sources of truth. Clear the variable to edit by hand.
function MapBuildCoordCell(outer, callerid, attr, value, placeholder, title, posvar) {
    var name = (posvar || "").trim();
    if (!name) {
        return MapBuildTextCell(outer, callerid, attr, value, placeholder, title);
    }

    var td = document.createElement("td");
    var input = document.createElement("input");
    input.type = "text";
    input.className = "form-control form-control-sm configinput";

    // Show what the pin ACTUALLY uses - what the position variable resolves to - not the stored
    // data-lat/data-lon. Those are the hand-typed fallback and are ignored while a variable is set,
    // so displaying them stated a coordinate the symbol was not at, and a row whose variable did not
    // resolve showed a plausible position for a pin that was nowhere at all.
    var pos = MapResolvePositionVariable(name);

    if (pos) {
        input.value = "" + (attr === "data-lat" ? pos[0] : pos[1]);
        input.title = "From position variable '" + name + "'. Clear it to enter a position by hand.";
    }
    else {
        input.value = "";
        input.placeholder = MapT("coordUnresolved");
        input.title = "Position variable '" + name + "' is not resolving to a \"lat,lon\" value, so this symbol is not placed. "
            + "Check the variable, or clear it to enter a position by hand.";
    }

    input.readOnly = true;
    input.style.opacity = "0.6";
    input.style.cursor = "not-allowed";
    td.appendChild(input);
    return td;
}

function MapUpdateChildAttr(outer, callerid, attr, value, persist) {
    if (!outer || !callerid) return;
    var child = MapGetMapChild(outer, callerid);
    if (!child) return;
    child.setAttribute(attr, value);
    MapProjectChildren(outer);
    if (persist) MapPersistMapChildrenChanges();
}

// The map that a pending Add is destined for. Set between picking a master and the replacer
// dialog's OK, which is what tells AddEditSymbol to build a map child instead of a page symbol.
var MapPendingAddOuter = null;

function MapChildrenModalAddClicked() {
    var outer = MapCurrentDecoratorOuter;
    if (!outer) return;

    MapOpenSymbolPicker(function (symbolname) {
        if (!symbolname) return;

        // Adding a pin is creating a symbol instance, so it goes through the same dialog as
        // creating one from the Symbols menu: the user names the instance and fills its replacers
        // BEFORE it exists, instead of getting an unnamed copy of the master to fix up afterwards.
        if (typeof AddInstanceSymbolModal !== "function") {
            MapAddChild(outer, symbolname, "0", "0", "");
            MapRenderChildrenTable(outer);
            MapPersistMapChildrenChanges();
            return;
        }

        MapPendingAddOuter = outer;

        // The children dialog is hidden while the replacer dialog is up and reopened after, the
        // same handoff MapOpenChildInstanceSettings uses. Two modals at Bootstrap's default
        // z-index would otherwise fight, and the one underneath still takes clicks.
        var childrenModal = document.getElementById("MapChildrenModal");
        if (childrenModal) {
            var inst = bootstrap.Modal.getInstance(childrenModal);
            if (inst) inst.hide();
        }

        AddInstanceSymbolModal(symbolname);
        MapHookAddDialogCancel();
    });
}

// A cancelled replacer dialog must not leave a pending target armed, or the next ordinary symbol
// created from the Symbols menu would silently land on the map instead of the page.
function MapHookAddDialogCancel() {
    var dlg = document.getElementById("EditInstanceSymbolReplacersModal");
    if (!dlg || dlg._mapAddCancelHooked) return;
    dlg._mapAddCancelHooked = true;
    dlg.addEventListener("hidden.bs.modal", function () {
        if (!MapPendingAddOuter) return;
        var outer = MapPendingAddOuter;
        MapPendingAddOuter = null;
        MapOpenChildrenModal(outer);
    });
}

// Called from AddEditSymbol when a map Add is pending. Builds the child from the master, then
// applies the name and replacers the user just entered.
function MapFinishAddChildFromDialog() {
    var outer = MapPendingAddOuter;
    MapPendingAddOuter = null;
    if (!outer) return false;

    var master = (typeof selectedgroupsymbolmaster !== "undefined") ? selectedgroupsymbolmaster : "";
    var nameField = document.getElementById("EditInstanceSymbolReplacersModalName");
    var instanceName = nameField ? nameField.value.trim() : "";
    if (!master || !instanceName) return false;

    var child = MapAddChild(outer, master, "", "", "");
    if (!child) return false;

    // MapAddChild names the instance <master>_<id>; the user named it in the dialog.
    child.setAttribute("data-groupsymbol", instanceName);
    if (typeof SaveInstanceSymbolReplacers === "function") SaveInstanceSymbolReplacers(child);

    MapProjectChildren(outer);
    MapRenderChildrenTable(outer);
    MapPersistMapChildrenChanges();
    MapOpenChildrenModal(outer);
    return true;
}

function MapChildrenModalRemoveClicked() {
    var outer = MapCurrentDecoratorOuter;
    if (!outer) return;
    var checks = document.querySelectorAll('#MapChildrenModalRows [data-mapchild-check]:checked');
    for (var i = 0; i < checks.length; i++) {
        MapRemoveChild(outer, checks[i].getAttribute("data-mapchild-check"));
    }
    MapRenderChildrenTable(outer);
    MapPersistMapChildrenChanges();
}

function MapChildrenModalSearchInput() {
    if (MapCurrentDecoratorOuter) MapRenderChildrenTable(MapCurrentDecoratorOuter);
}
