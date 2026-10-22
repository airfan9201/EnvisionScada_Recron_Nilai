/*
 *   Selectables  
 *   
 *   v1.4.1
 *       
 *   https://github.com/p34eu/Selectables.git
 */

function Selectables(opts) {
    'use strict';
    var defaults = {
        zone: "#EnvisionPage", // ID of the element whith selectables.        
        elements: "div", //  items to be selectable .list-group, #id > .class,'htmlelement' - valid querySelectorAll        
        selectedClass: 'ActiveSelected', // class name to apply to seleted items
        key: false, //'altKey,ctrlKey,metaKey,false  // activate using optional key     
        moreUsing: 'ctrlKey', //altKey,ctrlKey,metaKey   // add more to selection
        enabled: true, //false to .enable() at later time       
        start: null, //  event on selection start
        stop: null, // event on selection end
        onSelect: null, // event fired on every item when selected.               
        onDeselect: null         // event fired on every item when selected.
    };
    var extend = function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    };
    this.foreach = function (items, callback, scope) {
        if (Object.prototype.toString.call(items) === '[object Object]') {
            for (var prop in items) {
                if (Object.prototype.hasOwnProperty.call(items, prop)) {
                    callback.call(scope, items[prop], prop, items);
                }
            }
        } else {
            for (var i = 0, len = items.length; i < len; i++) {
                callback.call(scope, items[i], i, items);
            }
        }
    }
    this.options = extend(defaults, opts || {});
    this.on = false;
    var self = this;
    this.enable = function () {
        if (this.on) {
            throw new Error(this.constructor.name + " :: is alredy enabled");
            return;
        }
        this.zone = document.querySelector(this.options.zone);
        if (!this.zone) {
            throw new Error(this.constructor.name + " :: no zone defined in options. Please use element with ID");
        }
        this.items = document.querySelectorAll(this.options.zone + ' ' + this.options.elements);
        this.disable();
        this.zone.addEventListener('mousedown', self.rectOpen);
        this.on = true;
        return this;
    };
    this.disable = function () {
        this.zone.removeEventListener('mousedown', self.rectOpen);
        this.on = false;
        return this;
    };
    var offset = function (el) {
        var r = el.getBoundingClientRect();
        return {top: r.top + document.body.scrollTop, left: r.left + document.body.scrollLeft}
    };
    this.suspend = function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    this.rectOpen = function (e) {

        // OVERWRITTEN BY AUTHOR STIJN ABELOOS TO DISABLE RIGHT CLICK MOUSE DRAG
        if (e.which == 1) { 

            self.options.start && self.options.start(e);
            if (self.options.key && !e[self.options.key]) {
                return;
            }
            document.body.classList.add('s-noselect');
            self.foreach(self.items, function (el) {
                el.addEventListener('click', self.suspend, true); //skip any clicks
                if (!e[self.options.moreUsing]) {

                    el.classList.remove(self.options.selectedClass);  // CLEARING SELECT HERE
                    
                    /*SetResetTexts();*/
                }
            });
            self.ipos = [e.pageX, e.pageY];
            if (!rb()) {
                var gh = document.createElement('div');
                gh.id = 's-rectBox';
                gh.style.left = e.pageX + 'px';
                gh.style.top = e.pageY + 'px';
                document.body.appendChild(gh);
            }
            document.body.addEventListener('mousemove', self.rectDraw);
            window.addEventListener('mouseup', self.select);

        }
    };
    var rb = function () {
        return document.getElementById('s-rectBox');
    };
    var cross = function (a, b) {
        var aTop = offset(a).top, aLeft = offset(a).left, bTop = offset(b).top, bLeft = offset(b).left;
        return !(((aTop + a.offsetHeight) < (bTop)) || (aTop > (bTop + b.offsetHeight)) || ((aLeft + a.offsetWidth) < bLeft) || (aLeft > (bLeft + b.offsetWidth)));
    };
    this.select = function (e) {
        var a = rb();
        if (!a) {
            return;
        }


        //delete(self.ipos);
        //document.body.classList.remove('s-noselect');
        //document.body.removeEventListener('mousemove', self.rectDraw);
        //window.removeEventListener('mouseup', self.select);

        // IGNORE tiny drags: if selection box < 10x10, do nothing
        var tooSmall = a.offsetWidth < 10 && a.offsetHeight < 10;

        delete (self.ipos);
        document.body.classList.remove('s-noselect');
        document.body.removeEventListener('mousemove', self.rectDraw);
        window.removeEventListener('mouseup', self.select);

        if (tooSmall) {
            // cleanup: remove skip-click handler and the rect box, then bail out
            self.foreach(self.items, function (el) {
                setTimeout(function () {
                    el.removeEventListener('click', self.suspend, true);
                }, 100);
            });

            a.parentNode.removeChild(a);
            self.options.stop && self.options.stop(e);
            return;
        }

        var s = self.options.selectedClass;
        
        if (EditMode === true) { // ADDED BY AUTHOR STIJN ABELOOS TO DISABLE WHEN STOP EDIT
            /*console.log(self.items);*/

            self.foreach(self.items, function (el) {
                /*console.log(el);*/
                if (cross(a, el) === true && polylineEndsInsideSelection(a, el)) {
                    // Opt-out: any element (or descendant of an element) tagged
                    // data-noselect="true" is skipped by the rubber-band. Used by
                    // MapObject map-owned GroupSymbol children whose position
                    // is owned by lat/lon, not by user drag.
                    if ((el.hasAttribute && el.hasAttribute("data-noselect")) ||
                        (el.closest && el.closest('[data-noselect="true"]'))) {
                        setTimeout(function () {
                            el.removeEventListener('click', self.suspend, true);
                        }, 100);
                        return;
                    }
                    /*console.log(el);*/
                    if (el.classList.contains(s)) {
                        el.classList.remove(s);  // CLEARING SELECT HERE

                        self.options.onDeselect && self.options.onDeselect(el);
                    } else {

                        // OVERWRITTEN BY AUTHOR STIJN ABELOOS TO ADD SYMBOL GROUP SELECTION

                        /*console.log(el.getAttribute("Name"));*/

                        //if (el.getAttribute("Name") == "PolylineObject") {

                        //    var polylinedots = el.querySelectorAll(".polylinedot");

                        //    var dotinside = false;
                        //    if (polylinedots) {
                        //        polylinedots.forEach(polylinedot => {
                        //            if (cross(a, polylinedot) === true) {
                        //                /*console.log('selected dot ' + polylinedot);*/
                        //                dotinside = true;
                        //                //break;
                        //            }
                        //        });
                        //    }

                        //    if (!dotinside) {
                        //        //console.log('reject');
                        //        return;
                        //    }

                        //}

                        //if (el.getAttribute("Name") == "PolygonObject") {

                        //    var polygondots = el.querySelectorAll(".polygondot");

                        //    var dotinside = false;
                        //    if (polygondots) {
                        //        polygondots.forEach(polygondot => {
                        //            if (cross(a, polygondot) === true) {
                        //                /*console.log('selected dot ' + polygondot);*/
                        //                dotinside = true;
                        //                //break;
                        //            }
                        //        });
                        //    }

                        //    if (!dotinside) {
                        //        //console.log('reject');
                        //        return;
                        //    }

                        //}

                        //console.log(el.classList);

                        //console.log(el);

                        //if (el.style.pointerEvents == "none") { // locked
                        //    return;
                        //}

                        el = GetTopMostParentGroupObjectSelectables(el); 

                        if (el.style.pointerEvents == "none") { // locked
                            //return;
                        }
                        else {
                            LastSelectedActive = el;
                            el.classList.add(s);

                            self.options.onSelect && self.options.onSelect(el);
                        }

                        //console.log(el.classList);

                        //if (el.classList.contains("polygondot")) {
                        //    console.log('reject');
                        //    return;
                        //}

/*                        console.log(el);*/
                        
                    }

                    // OVERWRITTEN BY AUTHOR STIJN ABELOOS TO ADD SYMBOL GROUP SELECTION
                    //if (el.parentElement.getAttribute('name') == "GroupObject") {
                    //    SelectGroupAll(el.parentElement);
                    //}

                    //while (el.parentElement.getAttribute('name') == "GroupObject") { // REMOVED IN FAVOR OF GetTopMostParentGroupObjectSelectables V20231002
                    //    el = el.parentElement;

                    //    SelectGroupAll(el);
                    //}


                }
                setTimeout(function () {
                    el.removeEventListener('click', self.suspend, true);
                }, 100);

            });

            SetResetTexts();
            SetBorders();
        }
        
        a.parentNode.removeChild(a);
        self.options.stop && self.options.stop(e);
    }
    this.rectDraw = function (e) {

        // ADDED BY AUTHOR STIJN ABELOOS TO DISABLE WHEN STOP EDIT
        if (EditMode === false) {
            //this.suspend(e);
            //var a = rb();
            //a.parentNode.removeChild(a);

           // return;
        }

        var g = rb();
        if (!self.ipos || g === null) {
            return;
        }
        var tmp, x1 = self.ipos[0], y1 = self.ipos[1], x2 = e.pageX, y2 = e.pageY;
        if (x1 > x2) {
            tmp = x2, x2 = x1, x1 = tmp;
        }
        if (y1 > y2) {
            tmp = y2, y2 = y1, y1 = tmp;
        }
        g.style.left = x1 + 'px', g.style.top = y1 + 'px', g.style.width = (x2 - x1) + 'px', g.style.height = (y2 - y1) + 'px';
    }
    this.options.selectables = this;

    if (this.options.enabled) {
        return this.enable();
    }
    return this;
}


// check if selection rect 'a' intersects the poly-hit stroke of a PolylineObject
function polylineEndsInsideSelection(a, el) {
    // Only special-case PolylineObject
    if (el.getAttribute("name") !== "PolylineObject") {
        return true; // non-polylines behave as before
    }

    var svg = el.querySelector("svg");
    if (!svg) return false;

    var selRect = a.getBoundingClientRect();
    var polylines = svg.querySelectorAll("polyline");

    function pointInRect(px, py, r) {
        return px >= r.left && px <= r.right &&
            py >= r.top && py <= r.bottom;
    }

    for (var i = 0; i < polylines.length; i++) {
        var pl = polylines[i];

        // total length of this polyline
        var totalLen;
        try {
            totalLen = pl.getTotalLength();
        } catch (e) {
            continue;
        }
        if (!totalLen || isNaN(totalLen)) continue;

        // get start and end points in SVG coords
        var start = pl.getPointAtLength(0);
        var end = pl.getPointAtLength(totalLen);

        // transform them to screen coords
        var ctm = pl.getScreenCTM();
        if (!ctm) continue;

        var sx = start.x * ctm.a + start.y * ctm.c + ctm.e;
        var sy = start.x * ctm.b + start.y * ctm.d + ctm.f;
        var ex = end.x * ctm.a + end.y * ctm.c + ctm.e;
        var ey = end.x * ctm.b + end.y * ctm.d + ctm.f;

        // if BOTH ends are inside the selection rectangle -> OK
        if (pointInRect(sx, sy, selRect) && pointInRect(ex, ey, selRect)) {
            return true;
        }
    }

    // No polyline inside this object has both ends inside the selection box
    return false;
}
