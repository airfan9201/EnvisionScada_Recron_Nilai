// --- Color Library themes ---
//
// The library holds one shared, ordered list of color NAMES and one color value per name per theme.
// The cards in the modal are that shared list: switching theme repaints the swatches and nothing
// else, and adding, deleting, renaming or reordering a card applies to every theme at once. That is
// not a convenience - a graphical object stores the color name, so a name missing from one theme
// would leave that object with no color at all after a theme switch.
//
// Stored shape (the ColorProfile parameter):
//   {"themes":{"Default":{"Pump":"#4CAF50"},"Night":{"Pump":"#1B5E20"}},"default":"Default"}
// A library saved before themes existed is a flat name-to-color object and is read as one theme
// named Default, which is why no migration is needed.

var ColorLibraryThemes = null;   // { themes: { name: { colorName: value } }, default: name }
var ColorLibraryEditedTheme = ''; // theme currently shown by the cards

var ColorLibraryDefaultThemeName = 'Default';

// Tolerant read of either shape. Returns a normalised structure and never throws, so a hand-edited
// parameter or an imported file cannot leave the modal empty without explanation.
function NormalizeColorLibrary(parsed) {

    var result = { themes: {}, default: ColorLibraryDefaultThemeName };

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        result.themes[ColorLibraryDefaultThemeName] = {};
        return result;
    }

    // A pre-theme library could hold a color named "themes", but its value would be a string, so
    // requiring an object here cannot misread one as themed.
    var themed = parsed.themes && typeof parsed.themes === 'object' && !Array.isArray(parsed.themes);

    if (themed) {
        for (var themeName in parsed.themes) {
            if (!Object.prototype.hasOwnProperty.call(parsed.themes, themeName)) { continue; }

            var theme = parsed.themes[themeName];
            if (!theme || typeof theme !== 'object') { continue; }

            var colors = {};
            for (var colorName in theme) {
                if (Object.prototype.hasOwnProperty.call(theme, colorName)) {
                    colors[colorName] = typeof theme[colorName] === 'string' ? theme[colorName] : '';
                }
            }
            result.themes[themeName] = colors;
        }

        if (typeof parsed.default === 'string' && parsed.default) {
            result.default = parsed.default;
        }
    } else {
        var flat = {};
        for (var legacyName in parsed) {
            if (Object.prototype.hasOwnProperty.call(parsed, legacyName)) {
                flat[legacyName] = typeof parsed[legacyName] === 'string' ? parsed[legacyName] : '';
            }
        }
        result.themes[ColorLibraryDefaultThemeName] = flat;
        result.default = ColorLibraryDefaultThemeName;
    }

    var names = ColorLibraryThemeNames(result);

    if (names.length === 0) {
        result.themes[ColorLibraryDefaultThemeName] = {};
        result.default = ColorLibraryDefaultThemeName;
        names = [ColorLibraryDefaultThemeName];
    }

    if (names.indexOf(result.default) === -1) {
        result.default = names[0];
    }

    // Repair the shared-name invariant: every theme ends up holding exactly the same color names,
    // seeded from the default theme where one is missing.
    var seed = result.themes[result.default];
    var canonical = Object.keys(seed);

    names.forEach(function (name) {
        Object.keys(result.themes[name]).forEach(function (colorName) {
            if (canonical.indexOf(colorName) === -1) { canonical.push(colorName); }
        });
    });

    names.forEach(function (name) {
        var repaired = {};
        canonical.forEach(function (colorName) {
            repaired[colorName] = Object.prototype.hasOwnProperty.call(result.themes[name], colorName)
                ? result.themes[name][colorName]
                : (seed[colorName] || '');
        });
        result.themes[name] = repaired;
    });

    return result;
}

function ColorLibraryThemeNames(library) {
    library = library || ColorLibraryThemes;
    if (!library || !library.themes) { return []; }
    return Object.keys(library.themes);
}

// The theme THIS client runs, from the cookie the Select Theme action writes. Used to decide which
// theme the runtime page repaints in when the modal closes.
function ActiveClientColorTheme() {
    var match = document.cookie.match(/(?:^|;\s*)EnvisionTheme=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

// The flat map the runtime resolves against: the named theme, falling back to the default one and
// then to whatever exists, so a deleted theme never leaves the page colorless.
function ColorLibraryThemeMap(themeName) {
    if (!ColorLibraryThemes) { return {}; }

    var names = ColorLibraryThemeNames();
    var resolved = names.indexOf(themeName) !== -1 ? themeName
        : (names.indexOf(ColorLibraryThemes.default) !== -1 ? ColorLibraryThemes.default : names[0]);

    return resolved ? ColorLibraryThemes.themes[resolved] : {};
}

// Paints a card swatch. Library colors may carry an alpha byte (#RRGGBBAA), so the color is
// layered over colorPick's checkerboard instead of being set as a plain background: a half
// transparent color otherwise blends into the card and shows as a different, solid color.
function PaintLibraryColorSwatch(swatch, color) {
    if (!swatch) { return; }
    if (typeof ColorPickSwatchBackground === 'function') {
        swatch.style.background = '';
        swatch.style.backgroundImage = ColorPickSwatchBackground(color);
    } else {
        swatch.style.background = color;
    }
}

// Attaches the modern colorPick popup to a Color Library row swatch.
// The library section is hidden here: you are editing the library itself,
// so named library colors must not be selectable as values (raw hex only).
// The chosen hex lives in the swatch's title attribute (read by Save/Export).
function InitLibraryColorSwatch(swatch) {
    if (!swatch) { return; }
    $(swatch).colorPick({
        'initialColor': swatch.getAttribute('title') || '#0000ff',
        'paletteLabel': 'Choose Color',
        'palette': palettecolors,
        'showLibrary': false,
        'init': function () {
            PaintLibraryColorSwatch(this.element[0], this.element.attr('title'));
        },
        'onColorSelected': function () {
            var hex = this.element.attr('title');
            PaintLibraryColorSwatch(this.element[0], hex);
            var card = this.element[0].closest('.ColorLibraryCard');
            if (card) {
                var hexDiv = card.getElementsByClassName('ColorLibraryRowHex')[0];
                if (hexDiv) { hexDiv.innerText = hex; }
            }
        }
    });
}

// The name is the key of the saved/exported ColorProfile object, so a name problem does not
// show up as an error later: it silently drops or mis-keys a color. This checks both problems
// in one pass and marks every offending input (the .ColorLibraryCardTextDuplicate class is the
// shared error styling for a card name).
//
// Checked on the TRIMMED name, because that is what Save/Export write as the key: "Pump" and
// "Pump " are the collision the user actually gets. The rules mirror ColorLibraryNameRegex on
// the Config API, so a name the API refuses cannot be created here either: an empty name is
// not addressable, a leading '#' is indistinguishable from a color value, and a comma breaks
// the comma-separated color lists.
function CheckColorLibraryNames() {

    var inputs = document.getElementById("flexGroup").getElementsByClassName("ColorLibraryCardText");

    var counts = {};
    for (var i = 0; i < inputs.length; i++) {
        var counted = inputs[i].value.trim();
        counts[counted] = (counts[counted] || 0) + 1;
    }

    var duplicates = [];
    var invalid = [];

    for (var j = 0; j < inputs.length; j++) {
        var name = inputs[j].value.trim();
        var isDuplicate = counts[name] > 1;
        var isInvalid = name === '' || name.charAt(0) === '#' || name.indexOf(',') !== -1;

        if (isDuplicate && duplicates.indexOf(name) === -1) { duplicates.push(name); }
        if (isInvalid && invalid.indexOf(name) === -1) { invalid.push(name); }

        inputs[j].classList.toggle('ColorLibraryCardTextDuplicate', isDuplicate || isInvalid);
    }

    return { duplicates: duplicates, invalid: invalid };
}

// Kept for callers that only need the duplicate list.
function GetDuplicateColorLibraryNames() {
    return CheckColorLibraryNames().duplicates;
}

// oninput handler on the card name inputs: live-updates the marking.
function ColorLibraryNameChanged(input) {
    CheckColorLibraryNames();
}

function ColorLibraryDuplicateNamesMessage(duplicates) {
    var shown = duplicates.map(function (name) { return name === '' ? '(empty)' : name; });
    return 'Duplicate color names are not permitted: ' + shown.join(', ') + '. Please rename the marked colors.';
}

function ColorLibraryInvalidNamesMessage(invalid) {
    var shown = invalid.map(function (name) { return name === '' ? '(empty)' : name; });
    return 'These color names cannot be used: ' + shown.join(', ') + '. A name is required, must not start with # and must not contain a comma.';
}

// Shared gate for the actions that turn the cards back into a name-keyed object.
function ColorLibraryNamesAreValid() {

    var problems = CheckColorLibraryNames();

    if (problems.invalid.length > 0) {
        alert(ColorLibraryInvalidNamesMessage(problems.invalid));
        return false;
    }

    if (problems.duplicates.length > 0) {
        alert(ColorLibraryDuplicateNamesMessage(problems.duplicates));
        return false;
    }

    return true;
}

function CloseColorProfile() {

    ColorLibraryChangeNameModalCancel();

    // keep the library open; saving would silently drop or mis-key colors
    if (!ColorLibraryNamesAreValid()) { return; }

    var backdrop = document.getElementById('ColorLibraryBackdrop');
    backdrop.style.display = 'none';

    var ColorLibrary = document.getElementById('ColorLibrary');
    ColorLibrary.style.animation = 'fadeoutcolor 0s linear forwards';

    SaveColorProfile();
}

function ColorLibraryContainerClicked() {
    ColorLibraryChangeNameModalCancel();
}

function OpenColorProfile() {

    var backdrop = document.getElementById('ColorLibraryBackdrop');
    backdrop.style.display = 'block';
    backdrop.style.animation = 'fadeincolor 0.2s linear forwards';

    var ColorLibrary = document.getElementById('ColorLibrary');
    ColorLibrary.style.display = "block";
    ColorLibrary.style.animation = 'fadeincolor 0.2s linear forwards';

    // Refresh from the server first: the library can also be changed through the Config API/MCP,
    // and closing the modal saves every card back, so rendering a stale copy would silently undo
    // those changes.
    if (typeof LoadColorProfile2Server === 'function') {
        LoadColorProfile2Server(LoadColorProfile);
    } else {
        LoadColorProfile();
    }

}

// Folds the cards back into ColorLibraryThemes. The cards are the canonical name list and order, so
// this is where a card added, deleted, renamed or dragged reaches EVERY theme.
//
// Each card carries data-colorkey: the name it had when it was rendered. That is what makes a rename
// a rename in the other themes too - without it a renamed card would read as one name deleted and
// another added, and the other themes would silently lose that color's value.
function HarvestColorLibraryCards() {

    if (!ColorLibraryThemes) { return; }

    var cards = document.getElementById("flexGroup").getElementsByClassName("ColorLibraryCard");
    var themeNames = ColorLibraryThemeNames();

    var rebuilt = {};
    themeNames.forEach(function (themeName) { rebuilt[themeName] = {}; });

    for (var i = 0; i < cards.length; i++) {

        var card = cards[i];
        var swatch = card.getElementsByClassName("ColorLibraryCardColor")[0];
        var text = card.getElementsByClassName("ColorLibraryCardText")[0];

        if (!swatch || !text) { continue; }

        // Trim: the name is the key of the saved object, so a stray space would make
        // "Pump " a different entry from the "Pump" the user believes they typed.
        var name = text.value.trim();
        var color = swatch.getAttribute('title');
        var previousKey = card.getAttribute('data-colorkey');

        themeNames.forEach(function (themeName) {

            if (themeName === ColorLibraryEditedTheme) {
                // The theme on screen: the swatch is the truth.
                rebuilt[themeName][name] = color;
                return;
            }

            var stored = ColorLibraryThemes.themes[themeName];

            // Follow the rename through the previous key. A card with no previous key is new, so
            // every theme is seeded with the color that was just picked.
            rebuilt[themeName][name] = (previousKey && Object.prototype.hasOwnProperty.call(stored, previousKey))
                ? stored[previousKey]
                : color;
        });

        // The card now answers to its new name.
        card.setAttribute('data-colorkey', name);
    }

    ColorLibraryThemes.themes = rebuilt;

    if (themeNames.indexOf(ColorLibraryThemes.default) === -1) {
        ColorLibraryThemes.default = themeNames.length ? themeNames[0] : ColorLibraryDefaultThemeName;
    }
}

function SaveColorProfile() {

    HarvestColorLibraryCards();

    if (!ColorLibraryThemes) { return; }

    // The runtime page repaints in the theme THIS client runs, not in the theme that happens to be
    // open in the modal: editing the Night theme must not recolor a station running Default.
    ColorProfile = ColorLibraryThemeMap(ActiveClientColorTheme());

    // localStorage holds the flat active map, exactly as before themes existed, so the color picker
    // and every other reader keep working unchanged.
    localStorage.setItem('ColorProfile', JSON.stringify(ColorProfile, null, 2));

    SaveColorProfile2Server(JSON.stringify(ColorLibraryThemes, null, 2));
}

// Fills the theme dropdown. The default theme is marked, because it is the one a client that has
// never picked a theme will get.
function RenderColorThemeSelector() {

    var select = document.getElementById('ColorLibraryThemeSelect');
    if (!select) { return; }

    select.innerHTML = '';

    ColorLibraryThemeNames().forEach(function (name) {
        var option = document.createElement('option');
        option.value = name;
        option.text = name === ColorLibraryThemes.default ? name + ' ★' : name;
        option.selected = name === ColorLibraryEditedTheme;
        select.appendChild(option);
    });
}

// Renders the cards for the theme being edited. Called on open, on theme switch and after a theme
// level change; the color names and their order come from the library and are identical in every
// theme, so only the swatches actually differ between calls.
function RenderColorLibraryCards() {

    const flexGroup = document.getElementById('flexGroup');
    flexGroup.innerHTML = '';

    const flexChildren = [];
    const dummycolor = document.getElementById('dummycolor');

    try {
        var colors = ColorLibraryThemes ? ColorLibraryThemes.themes[ColorLibraryEditedTheme] : null;

        if (colors && typeof colors === 'object') {
            for (const name in colors) {
                if (Object.prototype.hasOwnProperty.call(colors, name)) {
                    let div = dummycolor.cloneNode(true); // Clone the template

                    const color = colors[name]; // Get color by key

                    var swatch = div.getElementsByClassName("ColorLibraryCardColor")[0];
                    swatch.setAttribute('title', color); // Store hex in the swatch title
                    PaintLibraryColorSwatch(swatch, color); // Show the color, transparency included
                    div.getElementsByClassName("ColorLibraryCardText")[0].value = name; // Set text
                    div.getElementsByClassName("ColorLibraryRowHex")[0].innerText = color; // Set hex label

                    // Remembered so a rename can be carried into the other themes on harvest.
                    div.setAttribute('data-colorkey', name);

                    div.style.display = 'flex'; // Make it visible
                    InitLibraryColorSwatch(swatch); // Attach the modern picker
                    flexChildren.push(div); // Store the cloned div
                }
            }
        }

        flexGroup.append(...flexChildren);

    } catch (error) {
        console.error(error);
        alert('Color Profile in wrong format: ' + JSON.stringify(ColorLibraryThemes));
    }

    RenderColorThemeSelector();
}

function LoadColorProfile() {

    var parsed = null;

    try {
        parsed = JSON.parse(localStorage.getItem('ColorProfileEdit'));
    } catch (error) {
        console.error(error);
    }

    ColorLibraryThemes = NormalizeColorLibrary(parsed);

    var names = ColorLibraryThemeNames();
    if (names.indexOf(ColorLibraryEditedTheme) === -1) {
        // Open on the theme this client runs, so the designer edits what they can see.
        var active = ActiveClientColorTheme();
        ColorLibraryEditedTheme = names.indexOf(active) !== -1 ? active : ColorLibraryThemes.default;
    }

    RenderColorLibraryCards();
}

// Switches which theme the cards show. The current theme's swatches are folded back first, so an
// edit made just before switching is not lost.
function SwitchColorTheme(name) {

    ColorLibraryChangeNameModalCancel();

    if (!ColorLibraryThemes || ColorLibraryThemeNames().indexOf(name) === -1) { return; }

    // Names must be valid before harvesting: the harvest keys every theme by name, so a duplicate or
    // empty name would silently drop a color from all of them at once.
    if (!ColorLibraryNamesAreValid()) {
        RenderColorThemeSelector(); // put the dropdown back on the theme still being edited
        return;
    }

    HarvestColorLibraryCards();

    ColorLibraryEditedTheme = name;

    RenderColorLibraryCards();
}

function AddColorTheme() {

    ColorLibraryChangeNameModalCancel();

    if (!ColorLibraryThemes || !ColorLibraryNamesAreValid()) { return; }

    var name = (prompt('New theme name:', '') || '').trim();
    if (!name) { return; }

    if (!ColorThemeNameIsValid(name)) { return; }

    if (ColorLibraryThemeNames().indexOf(name) !== -1) {
        alert('A theme named "' + name + '" already exists.');
        return;
    }

    HarvestColorLibraryCards();

    // Copied from the theme on screen rather than started blank: a new theme is nearly always a
    // variation of an existing one, and every color name has to be present anyway.
    var source = ColorLibraryThemes.themes[ColorLibraryEditedTheme] || {};
    var copy = {};
    Object.keys(source).forEach(function (colorName) { copy[colorName] = source[colorName]; });

    ColorLibraryThemes.themes[name] = copy;
    ColorLibraryEditedTheme = name;

    RenderColorLibraryCards();
}

function ColorThemeNameIsValid(name) {

    // Mirrors ColorThemeNameRegex on the Config API. The name travels in a cookie, where a semicolon
    // or a comma would end the value early and hand the browser a different theme.
    if (!/^[a-zA-Z0-9 ._-]+$/.test(name)) {
        alert('A theme name may contain letters, digits, spaces, dot, dash and underscore only.');
        return false;
    }

    if (name.length > 40) {
        alert('A theme name may be at most 40 characters.');
        return false;
    }

    return true;
}

function RenameColorTheme() {

    ColorLibraryChangeNameModalCancel();

    if (!ColorLibraryThemes) { return; }

    var current = ColorLibraryEditedTheme;
    var name = (prompt('Rename theme "' + current + '" to:', current) || '').trim();

    if (!name || name === current) { return; }
    if (!ColorThemeNameIsValid(name)) { return; }

    if (ColorLibraryThemeNames().indexOf(name) !== -1) {
        alert('A theme named "' + name + '" already exists.');
        return;
    }

    if (!ColorLibraryNamesAreValid()) { return; }

    HarvestColorLibraryCards();

    // Rebuilt rather than assigned, so the theme keeps its position in the dropdown.
    var rebuilt = {};
    ColorLibraryThemeNames().forEach(function (themeName) {
        rebuilt[themeName === current ? name : themeName] = ColorLibraryThemes.themes[themeName];
    });

    ColorLibraryThemes.themes = rebuilt;

    if (ColorLibraryThemes.default === current) { ColorLibraryThemes.default = name; }

    ColorLibraryEditedTheme = name;

    alert('Clients still set to "' + current + '" fall back to the default theme until they pick again.');

    RenderColorLibraryCards();
}

function DeleteColorTheme() {

    ColorLibraryChangeNameModalCancel();

    if (!ColorLibraryThemes) { return; }

    var names = ColorLibraryThemeNames();

    // The last theme holds every color value in the library: removing it would empty the library
    // rather than switch anything.
    if (names.length <= 1) {
        alert('The last remaining theme cannot be deleted.');
        return;
    }

    if (!confirm('Delete the theme "' + ColorLibraryEditedTheme + '"? The colors themselves are kept, only this theme\'s values are removed.')) {
        return;
    }

    delete ColorLibraryThemes.themes[ColorLibraryEditedTheme];

    names = ColorLibraryThemeNames();

    if (names.indexOf(ColorLibraryThemes.default) === -1) { ColorLibraryThemes.default = names[0]; }

    ColorLibraryEditedTheme = ColorLibraryThemes.default;

    RenderColorLibraryCards();
}

function SetDefaultColorTheme() {

    ColorLibraryChangeNameModalCancel();

    if (!ColorLibraryThemes) { return; }

    ColorLibraryThemes.default = ColorLibraryEditedTheme;

    RenderColorThemeSelector();
}

// Exports EVERY theme, not just the one on screen: the themes share one color name set, and an
// export of a single theme could not be imported back without inventing values for the others.
function ExportColorProfile() {
    ColorLibraryChangeNameModalCancel();

    // the export object is keyed by name and would silently drop or mis-key colors
    if (!ColorLibraryNamesAreValid()) { return; }

    HarvestColorLibraryCards();

    const link = document.createElement("a");
    const content = JSON.stringify(ColorLibraryThemes, null, 2);
    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = "ColorProfile.txt";
    link.click();
    URL.revokeObjectURL(link.href);
}

function ImportColorProfile() {

    ColorLibraryChangeNameModalCancel();

    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = _ => {
        // you can use this method to get file and perform respective operations
        let files = Array.from(input.files);
        //console.log(files);

        var reader = new FileReader();

        reader.readAsText(files[0]);

        reader.onload = function () {

            // Validated rather than trusted. This used to write the file straight into storage and
            // re-render, so a file that was not a color library at all replaced the library with
            // nothing. With themes the same mistake would take every theme with it.
            var parsed = null;

            try {
                parsed = JSON.parse(reader.result);
            } catch (error) {
                alert('This file is not a Color Library: it is not valid JSON.');
                return;
            }

            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                alert('This file is not a Color Library.');
                return;
            }

            // NormalizeColorLibrary accepts both the themed shape and the pre-theme flat one, and
            // repairs a file whose themes disagree about which colors exist.
            var imported = NormalizeColorLibrary(parsed);

            var themeCount = ColorLibraryThemeNames(imported).length;
            var colorCount = Object.keys(imported.themes[imported.default] || {}).length;

            if (colorCount === 0) {
                alert('This file contains no colors.');
                return;
            }

            if (!confirm('Import ' + colorCount + ' color(s) in ' + themeCount + ' theme(s)? This replaces the whole library.')) {
                return;
            }

            ColorLibraryThemes = imported;
            ColorLibraryEditedTheme = imported.default;

            RenderColorLibraryCards();

        };

        reader.onerror = function () {
            //console.log(reader.error);
            alert(reader.error);
        };

    };
    input.click();

}

function SelectColorLibraryCard(event, el) {

    event.stopPropagation();

    ColorLibraryChangeNameModalCancel();

    DeselectAllColorLibraryCards();

    el.classList.add("ActiveColorLibraryCard");

}

function ColorLibraryUpdateHex(input) {
    var hexDiv = input.parentElement.getElementsByClassName('ColorLibraryRowHex')[0];
    if (hexDiv) hexDiv.innerText = input.value;
}

function DeselectAllColorLibraryCards() {

    var ColorLibraryCards = document.getElementById("flexGroup").getElementsByClassName("ColorLibraryCard");

    for (var i = 0; i < ColorLibraryCards.length; i++) {

        var ColorLibraryCard = ColorLibraryCards[i];

        if (ColorLibraryCard.classList.contains('ActiveColorLibraryCard')) {
            ColorLibraryCard.classList.remove("ActiveColorLibraryCard");
        }
    }
}


function ColorProfileChangeName(event) {

    event.stopPropagation();

    document.getElementById("ColorLibraryChangeNameModal").style.display = "block";

    var ColorLibraryCard = document.getElementById("flexGroup").getElementsByClassName("ActiveColorLibraryCard")[0];

    var ColorLibraryCardText = ColorLibraryCard.getElementsByClassName("ColorLibraryCardText")[0];

    document.getElementById("ColorLibraryChangeNameText").value = ColorLibraryCardText.innerText;

    //ColorLibraryCardText.innerText = 'Hello World!';
}

function ColorLibraryChangeNameModalClose() {

    var ColorLibraryCard = document.getElementById("flexGroup").getElementsByClassName("ActiveColorLibraryCard")[0];

    var ColorLibraryCardText = ColorLibraryCard.getElementsByClassName("ColorLibraryCardText")[0];

    var newName = document.getElementById("ColorLibraryChangeNameText").value;

    // reject a rename that collides with another card's name
    var inputs = document.getElementById("flexGroup").getElementsByClassName("ColorLibraryCardText");
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i] !== ColorLibraryCardText && inputs[i].value === newName) {
            alert(ColorLibraryDuplicateNamesMessage([newName]));
            return; // keep the rename modal open
        }
    }

    ColorLibraryCardText.value = newName;

    GetDuplicateColorLibraryNames(); // refresh duplicate marking

    document.getElementById("ColorLibraryChangeNameModal").style.display = "none";

}

function ColorLibraryChangeNameModalCancel() {

    document.getElementById("ColorLibraryChangeNameModal").style.display = "none";

}


function DeleteLibraryColor() {

    ColorLibraryChangeNameModalCancel();

    var ColorLibraryCards = document.getElementById("flexGroup").getElementsByClassName("ColorLibraryCard");

    for (var i = ColorLibraryCards.length; i >= 1; i--) { // reverse loop the livenodelist

        ColorLibraryCard = ColorLibraryCards[i - 1];

        if (ColorLibraryCard.classList.contains('ActiveColorLibraryCard')) {
            document.getElementById("flexGroup").removeChild(ColorLibraryCard);
        }

    }

}

function DeleteColorCard(btn) {
    var card = btn.closest('.ColorLibraryCard');
    if (card) card.remove();
}

function AddLibraryColor() {

    ColorLibraryChangeNameModalCancel();

    const flexGroup = document.getElementById('flexGroup');

    var dummycolor = document.getElementById('dummycolor');

    let div = dummycolor.cloneNode(true);

    var defaultColor = '#0000ff';
    var swatch = div.getElementsByClassName("ColorLibraryCardColor")[0];
    swatch.setAttribute('title', defaultColor);
    PaintLibraryColorSwatch(swatch, defaultColor);
    div.getElementsByClassName("ColorLibraryRowHex")[0].innerText = defaultColor;
    div.getElementsByClassName("ColorLibraryCardText")[0].value = '';
    div.style.display = 'flex';

    flexGroup.append(div);

    InitLibraryColorSwatch(swatch);

}
