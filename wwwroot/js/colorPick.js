/*!
*
* Envision ColorPick
* Modern, theme-aware, offline color picker.
*
* Drop-in replacement for the legacy ColorPick.js jQuery plugin. It keeps the
* original public surface ( $(el).colorPick({...}) with initialColor,
* paletteLabel, init and onColorSelected ) so existing call sites in
* Colorstates.js, BorderColorstates.js, Donut.js, Bargraph.js and Viewport.js
* do not change.
*
* Value contract preserved from the legacy plugin:
*  - Picking a raw color (spectrum / hex / recent / transparent) stores the hex
*    string in the element's title attribute and in this.color.
*  - Picking a named Color Library color stores the library NAME in the title
*    (this.color holds the resolved hex). GetObjectColor() resolves the name to
*    a hex at render time, so the object stays linked to the library entry.
*
*/
(function ($) {

    var POPOVER_ID = 'colorPickPopover';
    var TRANSPARENT = '#FFFFFF00';

    // Built-in fallbacks so the picker also works on pages that don't define the
    // Envision globals (palettecolors / transcolor), e.g. the Parameters page.
    var DEFAULT_TRANSCOLOR = 'linear-gradient(45deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 45%, rgba(255,0,0,1) 50%, rgba(255,255,255,1) 55%, rgba(255,255,255,1) 100%)';
    var DEFAULT_PALETTE = [
        '#FF80AB', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#FF4081', '#F50057', '#C51162',
        '#B388FF', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1', '#512DA8', '#7C4DFF', '#651FFF', '#6200EA',
        '#80D8FF', '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#40C4FF', '#00B0FF', '#0091EA',
        '#84FFFF', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#18FFFF', '#00E5FF', '#00B8D4',
        '#B9F6CA', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#69F0AE', '#00E676', '#00C853',
        '#CCFF90', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38', '#B2FF59', '#76FF03', '#64DD17',
        '#FFFF8D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#FFFF00', '#FFEA00', '#FFD600',
        '#FFD180', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#FFAB40', '#FF9100', '#FF6D00',
        '#FF9E80', '#FF8A65', '#FF7043', '#FF5722', '#F4511E', '#E64A19', '#FF6E40', '#FF3D00', '#DD2C00',
        '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723',
        '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238',
        '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121',
        '#000000', '#FFFFFF', '#FFFFFF00'
    ];

    function getTransColor() {
        return (typeof transcolor !== 'undefined' && transcolor) ? transcolor : DEFAULT_TRANSCOLOR;
    }

    $.fn.colorPick = function (config) {
        return this.each(function () {
            new $.colorPick(this, config || {});
        });
    };

    $.colorPick = function (element, options) {
        this.options = $.extend({}, $.fn.colorPick.defaults, options || {});
        this.element = $(element);

        var rawInitial = this.element.data('initialcolor') || this.options.initialColor || '#000000';
        this.rawValue = String(rawInitial);
        this.color = normalizeHex(resolveHex(this.rawValue)) || '#000000';

        element.title = this.rawValue;

        return this.init();
    };

    $.fn.colorPick.defaults = {
        'initialColor': '#3498db',
        'paletteLabel': 'Choose Color',
        'allowRecent': true,
        'recentMax': 20,
        'showLibrary': true,
        'onColorSelected': function () {
            this.element.css({
                'backgroundColor': GetObjectColor(this.element.attr('title')),
                'color': GetObjectColor(this.element.attr('title'))
            });
        }
    };

    $.colorPick.prototype = {

        init: function () {
            var self = this;

            if (typeof this.options.init === 'function') {
                $.proxy(this.options.init, this)();
            }

            this.element.off('.colorPick');

            this.element.on('click.colorPick', function (event) {
                if (event.target !== event.currentTarget) {
                    return;
                }
                event.preventDefault();
                self.open();
                return false;
            });

            return this;
        },

        appendToStorage: function (color) {
            if (this.options.allowRecent !== true || !color || color === TRANSPARENT) {
                return;
            }
            var stored = [];
            try { stored = JSON.parse(localStorage.getItem('colorPickRecentItems')) || []; } catch (e) { stored = []; }
            color = color.toUpperCase();
            var idx = stored.indexOf(color);
            if (idx !== -1) { stored.splice(idx, 1); }
            stored.unshift(color);
            stored = stored.slice(0, this.options.recentMax);
            localStorage.setItem('colorPickRecentItems', JSON.stringify(stored));
        },

        // Live apply of a raw hex color (spectrum / hex input / eyedropper / transparent).
        applyRaw: function (hex, commit) {
            hex = normalizeHex(hex);
            if (!hex) { return; }
            this.color = hex;
            this.alpha = decodeAlpha(hex);
            this.syncAlphaUI();
            this.element.attr('title', hex);
            if (commit) { this.appendToStorage(hex); }
            $.proxy(this.options.onColorSelected, this)();
        },

        // Apply a named Color Library color: title holds the name, this.color the hex.
        applyLibrary: function (name, hex) {
            this.color = normalizeHex(hex) || hex;
            this.alpha = decodeAlpha(this.color);
            this.syncAlphaUI();
            this.element.attr('title', name);
            this.appendToStorage(this.color);
            $.proxy(this.options.onColorSelected, this)();
        },

        syncAlphaUI: function () {
            if (!this.$alpha) { return; }
            var pct = Math.round(this.alpha * 100);
            this.$alpha.val(pct);
            this.$alphaValue.text(pct + '%');
        },

        open: function () {
            var self = this;
            this.close();

            var hsv = hexToHsv(this.color);
            this.hue = hsv.h;
            this.alpha = decodeAlpha(this.color);

            var pop = document.createElement('div');
            pop.id = POPOVER_ID;
            pop.className = 'colorPickPopover' + (this.options.showLibrary === false ? ' cpNoLibrary' : '');
            pop.innerHTML = this.template();
            document.body.appendChild(pop);
            this.pop = pop;

            this.$spectrum = $(pop).find('.cpSpectrum');
            this.$knob = $(pop).find('.cpSpectrumKnob');
            this.$preview = $(pop).find('.cpPreview');
            this.$hue = $(pop).find('.cpHue');
            this.$hexInput = $(pop).find('.cpHexInput');
            this.$alpha = $(pop).find('.cpAlpha');
            this.$alphaValue = $(pop).find('.cpAlphaValue');

            this.$hue.val(this.hue);
            this.paintSpectrum();
            this.moveKnobToHsv(hsv);
            this.paintPreview(this.color);
            this.$hexInput.val(stripHash(this.color));
            this.syncAlphaUI();

            this.renderPalette();
            if (this.options.showLibrary !== false) { this.renderLibrary(''); }
            this.renderRecent();
            this.bind();
            this.makeDraggable();

            requestAnimationFrame(function () {
                pop.classList.add('cpOpen');
            });
        },

        makeDraggable: function () {
            var self = this;
            var pop = this.pop;
            var handle = pop.querySelector('.cpHeader');
            if (!handle) { return; }

            var startX, startY, origLeft, origTop;

            this._dragMove = function (e) {
                var nl = origLeft + (e.clientX - startX);
                var nt = origTop + (e.clientY - startY);
                nl = clamp(nl, 0, window.innerWidth - pop.offsetWidth);
                nt = clamp(nt, 0, window.innerHeight - pop.offsetHeight);
                pop.style.left = nl + 'px';
                pop.style.top = nt + 'px';
            };
            this._dragUp = function () {
                document.removeEventListener('mousemove', self._dragMove);
                document.removeEventListener('mouseup', self._dragUp);
            };
            this._dragDown = function (e) {
                if (e.button !== 0) { return; }
                e.preventDefault();
                var rect = pop.getBoundingClientRect();
                // Switch from transform-centering to absolute pixel positioning.
                pop.style.transition = 'none';
                pop.style.transform = 'none';
                pop.style.left = rect.left + 'px';
                pop.style.top = rect.top + 'px';
                startX = e.clientX;
                startY = e.clientY;
                origLeft = rect.left;
                origTop = rect.top;
                document.addEventListener('mousemove', self._dragMove);
                document.addEventListener('mouseup', self._dragUp);
            };
            handle.addEventListener('mousedown', this._dragDown);
        },

        template: function () {
            var label = this.options.paletteLabel && this.options.paletteLabel !== 'Default palette:'
                ? this.options.paletteLabel : '';
            var eyedropper = window.EyeDropper
                ? '<button type="button" class="cpIconBtn cpEyedropper" title="Pick from screen">' + ICON_EYEDROPPER + '</button>'
                : '';
            return '' +
                (label ? '<div class="cpHeader">' + escapeHtml(label) + '</div>' : '') +
                '<div class="cpMain">' +
                    '<div class="cpSpectrum"><div class="cpSpectrumKnob"></div></div>' +
                    '<div class="cpControls">' +
                        '<div class="cpPreview"></div>' +
                        '<input type="range" class="cpHue" min="0" max="360" step="1" value="0" aria-label="Hue" />' +
                        eyedropper +
                    '</div>' +
                    '<div class="cpHexRow">' +
                        '<div class="cpHexField"><span class="cpHexHash">#</span><input type="text" class="cpHexInput" maxlength="8" spellcheck="false" aria-label="Hex value" /></div>' +
                        '<button type="button" class="cpTransparent" title="Transparent" aria-label="Transparent"></button>' +
                    '</div>' +
                    '<div class="cpAlphaRow">' +
                        '<input type="range" class="cpAlpha" min="0" max="100" step="1" value="100" aria-label="Opacity" />' +
                        '<span class="cpAlphaValue">100%</span>' +
                    '</div>' +
                    '<button type="button" class="cpApply" title="Use this color">Select</button>' +
                    '<div class="cpSection cpRecentSection">' +
                        '<div class="cpSectionHeader"><span>Recent</span></div>' +
                        '<div class="cpRecentGrid"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="cpPaletteSection">' +
                    '<div class="cpSectionHeader"><span>Palette</span></div>' +
                    '<div class="cpPaletteGrid"></div>' +
                '</div>' +
                (this.options.showLibrary === false ? '' :
                '<div class="cpSection cpLibrarySection">' +
                    '<div class="cpSectionHeader">' +
                        '<span>Color Library</span><span class="cpCount"></span>' +
                        (hasLibraryEditor() ?
                            '<button type="button" class="cpIconBtnSm cpLibAdd" title="Add selected color to library" aria-label="Add selected color to library">' + ICON_PLUS + '</button>' +
                            '<button type="button" class="cpIconBtnSm cpLibOpen" title="Open color library" aria-label="Open color library">' + ICON_EXPAND + '</button>'
                            : '') +
                    '</div>' +
                    '<div class="cpAddForm" style="display:none">' +
                        '<span class="cpAddSwatch"></span>' +
                        '<input type="text" class="cpAddName" maxlength="20" placeholder="Color name" aria-label="Color name" />' +
                        '<button type="button" class="cpIconBtnSm cpAddConfirm" title="Add" aria-label="Add">' + ICON_CHECK + '</button>' +
                        '<button type="button" class="cpIconBtnSm cpAddCancel" title="Cancel" aria-label="Cancel">' + ICON_X + '</button>' +
                    '</div>' +
                    '<div class="cpSearchRow">' + ICON_SEARCH + '<input type="text" class="cpLibSearch" placeholder="Search named colors" aria-label="Search color library" /></div>' +
                    '<div class="cpLibList"></div>' +
                '</div>');
        },

        bind: function () {
            var self = this;
            var pop = this.pop;

            // Spectrum drag (saturation / value)
            var draggingSpectrum = false;
            var specEl = this.$spectrum[0];
            var onSpectrumMove = function (clientX, clientY, commit) {
                var r = specEl.getBoundingClientRect();
                var x = clamp((clientX - r.left) / r.width, 0, 1);
                var y = clamp((clientY - r.top) / r.height, 0, 1);
                self.$knob.css({ left: (x * 100) + '%', top: (y * 100) + '%' });
                var hex = withAlpha(hsvToHex(self.hue, x, 1 - y), self.alpha);
                self.paintPreview(hex);
                self.$hexInput.val(stripHash(hex));
                self.applyRaw(hex, commit);
            };
            this.$spectrum.on('mousedown.colorPick', function (e) {
                e.preventDefault();
                draggingSpectrum = true;
                onSpectrumMove(e.clientX, e.clientY, false);
            });
            this._specMove = function (e) { if (draggingSpectrum) { onSpectrumMove(e.clientX, e.clientY, false); } };
            this._specUp = function (e) {
                if (draggingSpectrum) {
                    draggingSpectrum = false;
                    onSpectrumMove(e.clientX, e.clientY, true);
                }
            };
            document.addEventListener('mousemove', this._specMove);
            document.addEventListener('mouseup', this._specUp);

            // Hue slider
            this.$hue.on('input.colorPick', function () {
                self.hue = parseInt(this.value, 10) || 0;
                self.paintSpectrum();
                var pos = self.knobFraction();
                var hex = withAlpha(hsvToHex(self.hue, pos.s, pos.v), self.alpha);
                self.paintPreview(hex);
                self.$hexInput.val(stripHash(hex));
                self.applyRaw(hex, false);
            });
            this.$hue.on('change.colorPick', function () {
                self.appendToStorage(self.color);
            });

            // Alpha (opacity) slider
            this.$alpha.on('input.colorPick', function () {
                self.alpha = clamp(parseInt(this.value, 10), 0, 100) / 100;
                self.$alphaValue.text(Math.round(self.alpha * 100) + '%');
                var pos = self.knobFraction();
                var hex = withAlpha(hsvToHex(self.hue, pos.s, pos.v), self.alpha);
                self.paintPreview(hex);
                self.$hexInput.val(stripHash(hex));
                self.applyRaw(hex, false);
            });
            this.$alpha.on('change.colorPick', function () {
                self.appendToStorage(self.color);
            });

            // Hex input
            this.$hexInput.on('input.colorPick', function () {
                var hex = normalizeHex('#' + stripHash(this.value));
                if (hex) {
                    $(this).removeClass('cpError');
                    var hsv = hexToHsv(hex);
                    self.hue = hsv.h;
                    self.$hue.val(self.hue);
                    self.paintSpectrum();
                    self.moveKnobToHsv(hsv);
                    self.paintPreview(hex);
                    self.applyRaw(hex, false);
                } else {
                    $(this).addClass('cpError');
                }
            });
            this.$hexInput.on('change.colorPick', function () {
                self.appendToStorage(self.color);
            });

            // Transparent
            $(pop).find('.cpTransparent').on('click.colorPick', function () {
                self.applyRaw(TRANSPARENT, true);
                self.close();
            });

            // Select: commit the currently chosen color and close. The color is
            // already applied live; this keeps the current title (a hex from the
            // spectrum/hex, or an untouched library name) intact and just closes.
            $(pop).find('.cpApply').on('click.colorPick', function () {
                self.appendToStorage(self.color);
                self.close();
            });

            // Eyedropper
            $(pop).find('.cpEyedropper').on('click.colorPick', function () {
                if (!window.EyeDropper) { return; }
                new window.EyeDropper().open().then(function (res) {
                    var hex = normalizeHex(res.sRGBHex);
                    if (!hex) { return; }
                    var hsv = hexToHsv(hex);
                    self.hue = hsv.h;
                    self.$hue.val(self.hue);
                    self.paintSpectrum();
                    self.moveKnobToHsv(hsv);
                    self.paintPreview(hex);
                    self.$hexInput.val(stripHash(hex));
                    self.applyRaw(hex, true);
                }).catch(function () { });
            });

            // Library search
            $(pop).find('.cpLibSearch').on('input.colorPick', function () {
                self.renderLibrary(this.value.toLowerCase());
            });

            // Add selected color to the library
            var showAddForm = function (show) {
                var form = $(pop).find('.cpAddForm');
                if (!show) { form.css('display', 'none'); return; }
                $(pop).find('.cpAddSwatch').css('background-image', self.color === TRANSPARENT ? getTransColor() : 'linear-gradient(' + self.color + ', ' + self.color + '), ' + CHECKERBOARD_GRADIENTS);
                form.css('display', 'flex');
                var input = form.find('.cpAddName');
                input.val('').removeClass('cpError');
                setTimeout(function () { input.focus(); }, 0);
            };
            var doAdd = function () {
                var input = $(pop).find('.cpAddName');
                var name = (input.val() || '').trim();
                if (!name) { input.addClass('cpError').focus(); return; }
                var lib = readColorProfile();
                if (Object.prototype.hasOwnProperty.call(lib, name) && !window.confirm('Name already exists, replace?')) {
                    input.focus();
                    return;
                }
                addColorToLibrary(name, self.color);
                showAddForm(false);
                $(pop).find('.cpLibSearch').val('');
                self.renderLibrary('');
            };
            $(pop).find('.cpLibAdd').on('click.colorPick', function () { showAddForm(true); });
            $(pop).find('.cpAddConfirm').on('click.colorPick', doAdd);
            $(pop).find('.cpAddCancel').on('click.colorPick', function () { showAddForm(false); });
            $(pop).find('.cpAddName').on('keydown.colorPick', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); doAdd(); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); showAddForm(false); }
            });

            // Open the full Color Library editor
            $(pop).find('.cpLibOpen').on('click.colorPick', function () {
                self.close();
                if (typeof OpenColorProfile === 'function') { OpenColorProfile(); }
            });

            // Outside click / escape
            this._outside = function (e) {
                if (self.pop && !self.pop.contains(e.target) && !self.element[0].contains(e.target)) {
                    self.close();
                }
            };
            this._key = function (e) { if (e.key === 'Escape') { self.close(); } };
            setTimeout(function () {
                document.addEventListener('mousedown', self._outside);
                document.addEventListener('keydown', self._key);
            }, 0);
        },

        renderLibrary: function (filter) {
            var self = this;
            var list = $(this.pop).find('.cpLibList');
            var count = $(this.pop).find('.cpCount');
            list.empty();

            var library = readColorProfile();
            var names = Object.keys(library).filter(function (name) {
                return !filter || name.toLowerCase().indexOf(filter) !== -1;
            });
            count.text(Object.keys(library).length || '');

            if (!names.length) {
                list.append('<div class="cpEmpty">' + (Object.keys(library).length ? 'No matches' : 'No library colors') + '</div>');
                return;
            }

            names.forEach(function (name) {
                var hex = library[name];
                var row = $('<div class="cpLibRow"></div>');
                row.append('<span class="cpLibSwatch"></span>');
                row.find('.cpLibSwatch').css('background-image', swatchBackground(hex));
                row.append('<span class="cpLibName"></span>');
                row.append('<span class="cpLibHex"></span>');
                row.find('.cpLibName').text(name);
                row.find('.cpLibHex').text(String(hex).toUpperCase());
                row.on('click', function () {
                    self.applyLibrary(name, hex);
                    self.close();
                });
                list.append(row);
            });
        },

        renderPalette: function () {
            var self = this;
            var section = $(this.pop).find('.cpPaletteSection');
            var grid = $(this.pop).find('.cpPaletteGrid');
            grid.empty();

            var source = this.options.palette;
            if (!source && typeof palettecolors !== 'undefined') { source = palettecolors; }
            source = source || DEFAULT_PALETTE;

            // Deduplicate, uppercase-insensitive, preserving order (legacy behaviour).
            var seen = {};
            var colors = [];
            source.forEach(function (c) {
                if (!c) { return; }
                var key = String(c).toUpperCase();
                if (!seen[key]) { seen[key] = true; colors.push(c); }
            });

            if (!colors.length) {
                section.hide();
                return;
            }
            section.show();
            colors.forEach(function (c) {
                var isTransparent = String(c).toUpperCase() === TRANSPARENT;
                var sw = $('<div class="cpSwatch"></div>');
                sw.attr('title', c).css('background-image', swatchBackground(c));
                sw.on('click', function () {
                    self.applyRaw(isTransparent ? TRANSPARENT : c, true);
                    self.close();
                });
                grid.append(sw);
            });
        },

        renderRecent: function () {
            var self = this;
            var section = $(this.pop).find('.cpRecentSection');
            var grid = $(this.pop).find('.cpRecentGrid');
            grid.empty();

            var recent = [];
            try { recent = JSON.parse(localStorage.getItem('colorPickRecentItems')) || []; } catch (e) { recent = []; }
            recent = recent.filter(function (c) { return c && c !== TRANSPARENT; });

            if (!recent.length) {
                section.hide();
                return;
            }
            section.show();
            recent.slice(0, this.options.recentMax).forEach(function (hex) {
                var sw = $('<div class="cpSwatch"></div>');
                sw.attr('title', hex).css('background-image', swatchBackground(hex));
                sw.on('click', function () {
                    self.applyRaw(hex, true);
                    self.close();
                });
                grid.append(sw);
            });
        },

        // --- spectrum helpers ---

        paintSpectrum: function () {
            var hueColor = hsvToHex(this.hue, 1, 1);
            this.$spectrum.css('background',
                'linear-gradient(to top, #000, rgba(0,0,0,0)), ' +
                'linear-gradient(to right, #fff, ' + hueColor + ')');
        },

        paintPreview: function (hex) {
            this.$preview.css('background-image', swatchBackground(hex));
        },

        moveKnobToHsv: function (hsv) {
            this.$knob.css({ left: (hsv.s * 100) + '%', top: ((1 - hsv.v) * 100) + '%' });
        },

        knobFraction: function () {
            var s = parseFloat(this.$knob[0].style.left) / 100;
            var v = 1 - parseFloat(this.$knob[0].style.top) / 100;
            return { s: clamp(s || 0, 0, 1), v: clamp(isNaN(v) ? 1 : v, 0, 1) };
        },

        close: function () {
            if (this._specMove) { document.removeEventListener('mousemove', this._specMove); this._specMove = null; }
            if (this._specUp) { document.removeEventListener('mouseup', this._specUp); this._specUp = null; }
            if (this._dragMove) { document.removeEventListener('mousemove', this._dragMove); this._dragMove = null; }
            if (this._dragUp) { document.removeEventListener('mouseup', this._dragUp); this._dragUp = null; }
            if (this._outside) { document.removeEventListener('mousedown', this._outside); this._outside = null; }
            if (this._key) { document.removeEventListener('keydown', this._key); this._key = null; }
            if (this.pop && this.pop.parentNode) { this.pop.parentNode.removeChild(this.pop); }
            this.pop = null;
        }
    };

    // --- shared helpers ---

    function readColorProfile() {
        var raw = localStorage.getItem('ColorProfile');
        if (!raw) { return {}; }
        try {
            var obj = JSON.parse(raw);
            return (obj && typeof obj === 'object') ? obj : {};
        } catch (e) { return {}; }
    }

    // The full Color Library editor is only present on pages that render it.
    function hasLibraryEditor() {
        return !!document.getElementById('flexGroup');
    }

    // Persist a named color into the Color Library, mirroring ColorLibrary.js:
    // update localStorage, the in-memory ColorProfile, and enqueue to the server.
    function addColorToLibrary(name, hex) {
        if (!name) { return; }
        var lib = readColorProfile();
        lib[name] = normalizeHex(hex) || hex;
        var json = JSON.stringify(lib, null, 2);
        localStorage.setItem('ColorProfile', json);
        window.ColorProfile = lib;
        if (typeof SaveColorProfile2Server === 'function') { SaveColorProfile2Server(json); }
    }

    // Resolve a stored value (hex or library name) to a hex string. Mirrors GetObjectColor in
    // wwwroot/js/envision/Utils.js: the library is consulted first, so an entry may be named
    // anything, including a name starting with 'r' or '#'.
    function resolveHex(value) {
        if (!value) { return value; }
        value = String(value);
        var lib = readColorProfile();
        // Must be a string: see GetObjectColor - a plain object lookup also reaches inherited
        // Object.prototype members, so "toString" would otherwise resolve to a function.
        var found = lib[value];
        return (typeof found === 'string' && found) ? found : value;
    }

    // Exported so the pages that store a color OUTSIDE a data-* attribute can resolve one library
    // name the same way: the Parameters page (viewer, Login, numpad and keyboard colors) and the
    // Trend Analyst settings. Those pages do not load the Envision runtime, so GetObjectColor does
    // not exist there, and duplicating the lookup would leave three copies to keep in step.
    $.colorPick = $.colorPick || {};
    $.colorPick.resolveHex = resolveHex;
    $.colorPick.normalizeHex = function (value) { return normalizeHex(value); };

    function normalizeHex(value) {
        if (!value) { return null; }
        value = String(value).trim();
        if (value.toUpperCase() === TRANSPARENT) { return TRANSPARENT; }
        var hex = value.charAt(0) === '#' ? value : '#' + value;
        if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{8}$/.test(hex)) {
            return hex.toUpperCase();
        }
        return null;
    }

    function stripHash(value) {
        return String(value || '').replace(/^#/, '').toUpperCase();
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    // 1 for opaque 6-digit hex, decoded alpha byte (0-1) for 8-digit '#RRGGBBAA' hex.
    function decodeAlpha(hex) {
        if (!hex) { return 1; }
        hex = String(hex).toUpperCase();
        if (hex.length === 9) {
            var a = parseInt(hex.substr(7, 2), 16);
            return isNaN(a) ? 1 : a / 255;
        }
        return 1;
    }

    function alphaByteHex(a) {
        var n = Math.round(clamp(a, 0, 1) * 255);
        var s = n.toString(16).toUpperCase();
        return s.length === 1 ? '0' + s : s;
    }

    // Appends the alpha byte only when < 1, so fully-opaque picks stay a clean 6-digit hex.
    function withAlpha(hex6, alpha) {
        return alpha >= 1 ? hex6 : hex6 + alphaByteHex(alpha);
    }

    // Background for any swatch that must show transparency truthfully. The color is painted as a
    // flat gradient layer on top of a checkerboard, so an #RRGGBBAA value blends against the checks
    // instead of against whatever happens to sit behind the swatch - which would make a half
    // transparent color look like a solid, and a different, color. Elements using this need the
    // checkerboard background-size/background-position from colorPick.css.
    // Exposed on window so the Color Library editor paints its cards the same way.
    function swatchBackground(color) {
        if (!color || String(color).toUpperCase() === TRANSPARENT) { return getTransColor(); }
        return 'linear-gradient(' + color + ', ' + color + '), ' + CHECKERBOARD_GRADIENTS;
    }
    window.ColorPickSwatchBackground = swatchBackground;

    var CHECKERBOARD_GRADIENTS =
        'linear-gradient(45deg, #bdbdbd 25%, transparent 25%), ' +
        'linear-gradient(-45deg, #bdbdbd 25%, transparent 25%), ' +
        'linear-gradient(45deg, transparent 75%, #bdbdbd 75%), ' +
        'linear-gradient(-45deg, transparent 75%, #bdbdbd 75%)';

    function hexToHsv(hex) {
        hex = normalizeHex(hex) || '#000000';
        if (hex === TRANSPARENT) { hex = '#FFFFFF'; }
        var r = parseInt(hex.substr(1, 2), 16) / 255;
        var g = parseInt(hex.substr(3, 2), 16) / 255;
        var b = parseInt(hex.substr(5, 2), 16) / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        var h = 0;
        if (d !== 0) {
            if (max === r) { h = ((g - b) / d) % 6; }
            else if (max === g) { h = (b - r) / d + 2; }
            else { h = (r - g) / d + 4; }
            h = h * 60;
            if (h < 0) { h += 360; }
        }
        var s = max === 0 ? 0 : d / max;
        return { h: h, s: s, v: max };
    }

    function hsvToHex(h, s, v) {
        h = ((h % 360) + 360) % 360;
        var c = v * s;
        var x = c * (1 - Math.abs((h / 60) % 2 - 1));
        var m = v - c;
        var r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        var toHex = function (n) {
            var s2 = Math.round((n + m) * 255).toString(16).toUpperCase();
            return s2.length === 1 ? '0' + s2 : s2;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    var ICON_SEARCH = '<svg class="cpSvg" viewBox="0 0 512 512" width="14" height="14" aria-hidden="true"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>';
    var ICON_EYEDROPPER = '<svg class="cpSvg" viewBox="0 0 512 512" width="16" height="16" aria-hidden="true"><path d="M341.6 29.2L240.1 130.8l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4L482.8 170.4c39-39 39-102.2 0-141.1s-102.2-39-141.1 0zM55.4 323.3c-15 15-23.4 35.4-23.4 56.6l0 42.4L5.4 462.2c-8.5 12.7-6.8 29.6 4 40.4s27.7 12.5 40.4 4L89.7 480l42.4 0c21.2 0 41.6-8.4 56.6-23.4L302.4 342.6 169.4 209.6 55.4 323.3z"/></svg>';
    var ICON_PLUS = '<svg class="cpSvg" viewBox="0 0 448 512" width="13" height="13" aria-hidden="true"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>';
    var ICON_EXPAND = '<svg class="cpSvg" viewBox="0 0 512 512" width="13" height="13" aria-hidden="true"><path d="M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87-39-39c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2S177.7 512 168 512z"/></svg>';
    var ICON_CHECK = '<svg class="cpSvg" viewBox="0 0 448 512" width="13" height="13" aria-hidden="true"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>';
    var ICON_X = '<svg class="cpSvg" viewBox="0 0 384 512" width="12" height="12" aria-hidden="true"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>';

}(jQuery));
