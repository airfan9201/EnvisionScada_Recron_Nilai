function DateTimePickerPad(value) {
    return String(value).padStart(2, "0");
}

var DateTimePickerInstances = {};

function DateTimePickerFormatDate(date, useUtc) {
    var year = useUtc ? date.getUTCFullYear() : date.getFullYear();
    var month = useUtc ? date.getUTCMonth() + 1 : date.getMonth() + 1;
    var day = useUtc ? date.getUTCDate() : date.getDate();
    return year + "-" + DateTimePickerPad(month) + "-" + DateTimePickerPad(day);
}

function DateTimePickerFormatTime(date, useUtc, hourMode, showSeconds) {
    var hours = useUtc ? date.getUTCHours() : date.getHours();
    var minutes = useUtc ? date.getUTCMinutes() : date.getMinutes();
    var seconds = useUtc ? date.getUTCSeconds() : date.getSeconds();
    var use12Hour = String(hourMode || "24") === "12";

    if (use12Hour) {
        var suffix = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) {
            hours = 12;
        }
        var base12 = DateTimePickerPad(hours) + ":" + DateTimePickerPad(minutes);
        if (showSeconds) {
            base12 += ":" + DateTimePickerPad(seconds);
        }
        return base12 + " " + suffix;
    }

    var base24 = DateTimePickerPad(hours) + ":" + DateTimePickerPad(minutes);
    if (showSeconds) {
        base24 += ":" + DateTimePickerPad(seconds);
    }
    return base24;
}

function DateTimePickerShouldShowSeconds(mode, displayformat) {
    if (mode === "DateOnly") {
        return false;
    }
    return /(s)/.test(DateTimePickerStripQuotedLiterals(displayformat || ""));
}

function DateTimePickerStripQuotedLiterals(format) {
    if (!format) {
        return "";
    }
    return String(format)
        .replace(/'([^']*)'/g, "")
        .replace(/"([^"]*)"/g, "");
}

function DateTimePickerNormalizeFormatForTempus(format) {
    if (!format) {
        return "";
    }

    // Tempus treats [text] as a literal block. Convert quoted text to this form.
    // Example: yyyy-MM-dd 'UTC' -> yyyy-MM-dd [UTC]
    return String(format)
        .replace(/'([^']*)'/g, "[$1]")
        .replace(/"([^"]*)"/g, "[$1]");
}

function DateTimePickerInferHourModeFromFormat(format) {
    var f = DateTimePickerStripQuotedLiterals(format || "").trim();
    if (f === "") {
        return null;
    }
    if (/\b(hh|h|tt)\b/.test(f)) {
        return "12";
    }
    if (/\b(HH|H)\b/.test(f)) {
        return "24";
    }
    return null;
}

function DateTimePickerBuildNormalizedFromDate(date, mode, isUtc, showSeconds) {
    if (!date) {
        return "";
    }

    if (mode === "DateOnly") {
        return DateTimePickerFormatDate(date, false);
    }
    if (mode === "TimeOnly") {
        var timeValue = DateTimePickerPad(date.getHours()) + ":" + DateTimePickerPad(date.getMinutes());
        if (showSeconds) {
            timeValue += ":" + DateTimePickerPad(date.getSeconds());
        }
        return timeValue;
    }

    if (isUtc) {
        return date.toISOString();
    }

    var localTime = DateTimePickerFormatTime(date, false, "24", showSeconds);
    return DateTimePickerFormatDate(date, false) + "T" + localTime;
}

function DateTimePickerParseTimeRaw(rawValue) {
    if (!rawValue) {
        return null;
    }
    var clean = String(rawValue).trim().toUpperCase();
    var ampm = null;
    if (clean.endsWith("AM")) {
        ampm = "AM";
        clean = clean.slice(0, -2).trim();
    } else if (clean.endsWith("PM")) {
        ampm = "PM";
        clean = clean.slice(0, -2).trim();
    }

    var parts = clean.split(":");
    if (parts.length < 2) {
        return null;
    }

    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var s = parseInt(parts[2] || "0", 10);

    if (isNaN(h) || isNaN(m) || isNaN(s)) {
        return null;
    }

    if (ampm) {
        if (h < 1 || h > 12) {
            return null;
        }
        if (ampm === "PM" && h < 12) {
            h += 12;
        }
        if (ampm === "AM" && h === 12) {
            h = 0;
        }
    }

    if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) {
        return null;
    }

    var d = new Date();
    d.setHours(h, m, s, 0);
    return d;
}

function DateTimePickerResolveDisplayFormat(mode, showSeconds) {
    if (mode === "TimeOnly") {
        return showSeconds ? "HH:mm:ss" : "HH:mm";
    }
    if (mode === "DateOnly") {
        return "yyyy-MM-dd";
    }
    return showSeconds ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd HH:mm";
}

function DateTimePickerParseInputValue(rawValue, mode) {
    if (!rawValue) {
        return null;
    }
    var parsed = new Date(rawValue);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    if (mode === "TimeOnly") {
        var t = DateTimePickerParseTimeRaw(rawValue);
        if (!t) {
            return null;
        }
        return t;
    }

    return null;
}

function DateTimePickerBuildInputValue(rawValue, mode, hourMode, showSeconds) {
    if (!rawValue) {
        return "";
    }

    var useHourMode = hourMode || "24";
    var useShowSeconds = (showSeconds === undefined ? true : !!showSeconds);
    var parsed = new Date(rawValue);

    if (isNaN(parsed.getTime())) {
        if (mode === "TimeOnly") {
            var rawTimeParsed = DateTimePickerParseTimeRaw(rawValue);
            if (rawTimeParsed) {
                var rawTime = DateTimePickerPad(rawTimeParsed.getHours()) + ":" + DateTimePickerPad(rawTimeParsed.getMinutes());
                if (useShowSeconds) {
                    rawTime += ":" + DateTimePickerPad(rawTimeParsed.getSeconds());
                }
                return rawTime;
            }
            return "";
        }
        if (mode === "DateOnly") {
            var datePart = String(rawValue).split("T")[0].split(" ")[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                return datePart;
            }
            return "";
        }
        return "";
    }

    if (mode === "TimeOnly") {
        return DateTimePickerFormatTime(parsed, false, useHourMode, useShowSeconds);
    }

    if (mode === "DateOnly") {
        return DateTimePickerFormatDate(parsed, false);
    }

    return DateTimePickerFormatDate(parsed, false) + " " + DateTimePickerFormatTime(parsed, false, useHourMode, useShowSeconds);
}

function DateTimePickerParseRawForPicker(rawValue, mode) {
    if (!rawValue) {
        return null;
    }
    if (mode === "TimeOnly") {
        var t = DateTimePickerParseTimeRaw(rawValue);
        if (!t) {
            return null;
        }
        return t;
    }
    var parsed = new Date(rawValue);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }
    if (mode === "DateOnly") {
        var datePart = String(rawValue).split("T")[0].split(" ")[0];
        var d = new Date(datePart + "T00:00:00");
        if (!isNaN(d.getTime())) {
            return d;
        }
    }
    return null;
}

function DateTimePickerHexToRgb(hex) {
    if (!hex) {
        return null;
    }
    var cleaned = String(hex).replace("#", "").trim();
    if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
        return null;
    }
    return {
        r: parseInt(cleaned.slice(0, 2), 16),
        g: parseInt(cleaned.slice(2, 4), 16),
        b: parseInt(cleaned.slice(4, 6), 16)
    };
}

function DateTimePickerRgbToHex(rgb) {
    if (!rgb) {
        return "#ffffff";
    }
    var toHex = function (v) {
        var clamped = Math.max(0, Math.min(255, Math.round(v)));
        var part = clamped.toString(16);
        return part.length === 1 ? "0" + part : part;
    };
    return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

function DateTimePickerLightenColor(hex, amount) {
    var rgb = DateTimePickerHexToRgb(hex);
    if (!rgb) {
        return "#f3f3f3";
    }
    return DateTimePickerRgbToHex({
        r: rgb.r + (255 - rgb.r) * amount,
        g: rgb.g + (255 - rgb.g) * amount,
        b: rgb.b + (255 - rgb.b) * amount
    });
}

function DateTimePickerApplyThemeVariables(ObjDom) {
    if (!ObjDom) {
        return;
    }

    var displayBackground = GetObjectColor(ObjDom.getAttribute("data-backgroundcolor") || "#ffffff");
    var displayText = GetObjectColor(ObjDom.getAttribute("data-color") || "#000000");
    var displayBorder = GetObjectColor(ObjDom.getAttribute("data-bordercolor") || "#c9c9c9");
    var pickerBackground = GetObjectColor(ObjDom.getAttribute("data-pickerbackgroundcolor") || "#ffffff");
    var pickerText = GetObjectColor(ObjDom.getAttribute("data-pickertextcolor") || "#212529");
    var selectedBackground = GetObjectColor(ObjDom.getAttribute("data-selectedbackgroundcolor") || "#0d6efd");
    var selectedText = GetObjectColor(ObjDom.getAttribute("data-selectedtextcolor") || "#ffffff");
    var todayBackground = GetObjectColor(ObjDom.getAttribute("data-todaybackgroundcolor") || selectedBackground);
    var todayText = GetObjectColor(ObjDom.getAttribute("data-todaytextcolor") || selectedText);
    var hoverBackground = GetObjectColor(ObjDom.getAttribute("data-hoverbackgroundcolor") || DateTimePickerLightenColor(pickerBackground, 0.18));
    var hoverTextColor = GetObjectColor(ObjDom.getAttribute("data-hovertextcolor") || "#6c757d");

    ObjDom.style.setProperty("--dtp-display-background", displayBackground);
    ObjDom.style.setProperty("--dtp-display-text", displayText);
    ObjDom.style.setProperty("--dtp-display-focus-border", displayBorder);
    ObjDom.style.setProperty("--dtp-picker-background", pickerBackground);
    ObjDom.style.setProperty("--dtp-picker-text", pickerText);
    ObjDom.style.setProperty("--dtp-selected-background", selectedBackground);
    ObjDom.style.setProperty("--dtp-selected-text", selectedText);
    ObjDom.style.setProperty("--dtp-today-background", todayBackground);
    ObjDom.style.setProperty("--dtp-today-text", todayText);
    ObjDom.style.setProperty("--dtp-hover-background", hoverBackground);
    ObjDom.style.setProperty("--dtp-hover-text", hoverTextColor);
    ObjDom.style.setProperty("--dtp-icon-color", pickerText);
}

function DateTimePickerSetGlobalThemeFromObject(ObjDom) {
    if (!ObjDom || !document || !document.documentElement) {
        return;
    }

    var style = ObjDom.style;
    document.documentElement.style.setProperty("--dtp-global-picker-background", style.getPropertyValue("--dtp-picker-background") || "#ffffff");
    document.documentElement.style.setProperty("--dtp-global-picker-text", style.getPropertyValue("--dtp-picker-text") || "#212529");
    document.documentElement.style.setProperty("--dtp-global-selected-background", style.getPropertyValue("--dtp-selected-background") || "#0d6efd");
    document.documentElement.style.setProperty("--dtp-global-selected-text", style.getPropertyValue("--dtp-selected-text") || "#ffffff");
    document.documentElement.style.setProperty("--dtp-global-today-background", style.getPropertyValue("--dtp-today-background") || "#0d6efd");
    document.documentElement.style.setProperty("--dtp-global-today-text", style.getPropertyValue("--dtp-today-text") || "#ffffff");
    document.documentElement.style.setProperty("--dtp-global-hover-background", style.getPropertyValue("--dtp-hover-background") || "#f3f3f3");
    document.documentElement.style.setProperty("--dtp-global-hover-text", style.getPropertyValue("--dtp-hover-text") || "#6c757d");
    document.documentElement.style.setProperty("--dtp-global-icon-color", style.getPropertyValue("--dtp-icon-color") || style.getPropertyValue("--dtp-picker-text") || "#212529");
}

function DateTimePickerSetDisplayFromPicker(ObjDom, rawValue, mode) {
    var key = DateTimePickerGetInstanceKey(ObjDom);
    var current = key ? DateTimePickerInstances[key] : null;
    if (!current || !current.picker || !current.picker.dates || typeof tempusDominus === "undefined") {
        return false;
    }
    var parsed = DateTimePickerParseRawForPicker(rawValue, mode);
    if (!parsed || isNaN(parsed.getTime())) {
        return false;
    }
    ObjDom.setAttribute("data-syncing", "true");
    current.picker.dates.setValue(new tempusDominus.DateTime(parsed));
    ObjDom.removeAttribute("data-syncing");
    return true;
}

function DateTimePickerRefreshCurrentDisplay(ObjDom) {
    if (!ObjDom) {
        return false;
    }

    var mode = ObjDom.getAttribute("data-datetimemode") || "DateTime";
    var key = DateTimePickerGetInstanceKey(ObjDom);
    var current = key ? DateTimePickerInstances[key] : null;
    if (current && current.picker && current.picker.dates && current.picker.dates.lastPicked && typeof tempusDominus !== "undefined") {
        var pickedDate = current.picker.dates.lastPicked;
        if (pickedDate && typeof pickedDate.getTime === "function" && !isNaN(pickedDate.getTime())) {
            ObjDom.setAttribute("data-syncing", "true");
            current.picker.dates.setValue(new tempusDominus.DateTime(new Date(pickedDate.getTime())));
            ObjDom.removeAttribute("data-syncing");
            return true;
        }
    }

    var parsed = DateTimePickerParseInputValue(ObjDom.value || "", mode);
    if (!parsed || isNaN(parsed.getTime()) || !current || !current.picker || !current.picker.dates || typeof tempusDominus === "undefined") {
        return false;
    }

    ObjDom.setAttribute("data-syncing", "true");
    current.picker.dates.setValue(new tempusDominus.DateTime(parsed));
    ObjDom.removeAttribute("data-syncing");
    return true;
}

function DateTimePickerSyncFromVariable(ObjDom) {
    if (!ObjDom) {
        return false;
    }

    var variable = ObjDom.getAttribute("data-variable") || "";
    // Names are free-form (dots optional): membership decides whether it is a variable.
    if (!variable || typeof VarDict[variable] === "undefined") {
        return false;
    }

    var mode = ObjDom.getAttribute("data-datetimemode") || "DateTime";
    var displayformat = ObjDom.getAttribute("data-displayformat") || "";
    var rawValue = VarDict[variable][0];
    var syncedByPicker = DateTimePickerSetDisplayFromPicker(ObjDom, rawValue, mode);
    if (!syncedByPicker) {
        var hourMode = DateTimePickerInferHourModeFromFormat(displayformat) || "24";
        var showSeconds = DateTimePickerShouldShowSeconds(mode, displayformat);
        var displayValue = DateTimePickerBuildInputValue(rawValue, mode, hourMode, showSeconds);
        if (ObjDom.value !== displayValue) {
            ObjDom.setAttribute("data-syncing", "true");
            ObjDom.value = displayValue;
            ObjDom.removeAttribute("data-syncing");
        }
    }

    return true;
}

function DateTimePickerGetNormalizedValue(ObjDom) {
    var mode = ObjDom.getAttribute("data-datetimemode") || "DateTime";
    var isUtc = (ObjDom.getAttribute("data-isutc") || "false").toLowerCase() === "true";
    var showSeconds = DateTimePickerShouldShowSeconds(mode, ObjDom.getAttribute("data-displayformat") || "");
    var value = ObjDom.value || "";

    if (value === "") {
        return "";
    }

    var key = DateTimePickerGetInstanceKey(ObjDom);
    var current = key ? DateTimePickerInstances[key] : null;
    if (current && current.picker && current.picker.dates && current.picker.dates.lastPicked) {
        var pickedDate = current.picker.dates.lastPicked;
        if (pickedDate && typeof pickedDate.getTime === "function" && !isNaN(pickedDate.getTime())) {
            return DateTimePickerBuildNormalizedFromDate(
                new Date(pickedDate.getTime()),
                mode,
                isUtc,
                showSeconds
            );
        }
    }

    if (mode === "DateOnly") {
        var dateOnly = value.split("T")[0].split(" ")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
            return dateOnly;
        }
        return "";
    }

    if (mode === "TimeOnly") {
        var timeOnlyParsed = DateTimePickerParseTimeRaw(value);
        if (!timeOnlyParsed) {
            return "";
        }
        var timeOnlyValue = DateTimePickerPad(timeOnlyParsed.getHours()) + ":" + DateTimePickerPad(timeOnlyParsed.getMinutes());
        if (showSeconds) {
            timeOnlyValue += ":" + DateTimePickerPad(timeOnlyParsed.getSeconds());
        }
        return timeOnlyValue;
    }

    var parsed = DateTimePickerParseInputValue(value, mode);
    if (!parsed || isNaN(parsed.getTime())) {
        return "";
    }

    if (isUtc) {
        return parsed.toISOString();
    }

    var localTime = DateTimePickerFormatTime(parsed, false, "24", showSeconds);
    return DateTimePickerFormatDate(parsed, false) + "T" + localTime;
}

function DateTimePickerGetInstanceKey(ObjDom) {
    if (!ObjDom) {
        return null;
    }
    return ObjDom.parentElement.id;
}

function DateTimePickerGetSignature(ObjDom) {
    return [
        ObjDom.getAttribute("data-datetimemode") || "DateTime",
        ObjDom.getAttribute("data-displayformat") || "yyyy-MM-dd HH:mm:ss",
        ObjDom.getAttribute("data-isutc") || "false"
    ].join("|");
}

function DateTimePickerGetLanguageCodeFromCultureCookie() {
    var cookieParts = document.cookie.split(".AspNetCore.Culture=");
    if (cookieParts.length < 2) {
        return "en";
    }
    var raw = cookieParts[1].split(";")[0];
    var decoded = decodeURIComponent(raw);
    var uicParts = decoded.split("uic=");
    if (uicParts.length < 2) {
        return "en";
    }
    return uicParts[1].split("|")[0].toLowerCase().split("-")[0];
}

function DateTimePickerBuildTempusOptions(ObjDom) {
    var mode = ObjDom.getAttribute("data-datetimemode") || "DateTime";
    var inferredHourMode = DateTimePickerInferHourModeFromFormat(ObjDom.getAttribute("data-displayformat") || "");
    var hourMode = inferredHourMode || "24";
    var showSeconds = DateTimePickerShouldShowSeconds(mode, ObjDom.getAttribute("data-displayformat") || "");
    var displayFormat = (ObjDom.getAttribute("data-displayformat") || "").trim();
    var normalizedDisplayFormat = DateTimePickerNormalizeFormatForTempus(displayFormat);
    var format = normalizedDisplayFormat !== "" ? normalizedDisplayFormat : DateTimePickerResolveDisplayFormat(mode, true);
    var showClock = mode !== "DateOnly";
    var showCalendar = mode !== "TimeOnly";

    var options = {
        allowInputToggle: true,
        container: document.body,
        display: {
            toolbarPlacement: "bottom",
            keepOpen: false,
            buttons: {
                today: false,
                clear: false,
                close: true
            },
            components: {
                calendar: showCalendar,
                date: showCalendar,
                month: showCalendar,
                year: showCalendar,
                decades: showCalendar,
                clock: showClock,
                hours: showClock,
                minutes: showClock,
                seconds: showClock && showSeconds
            },
            inline: false,
            theme: "auto"
        },
        localization: {
            format: format,
            hourCycle: hourMode === "12" ? "h12" : "h23"
        }
    };

    options.localization.locale = DateTimePickerGetLanguageCodeFromCultureCookie();

    return options;
}

function DateTimePickerEnsureTempus(ObjDom) {
    if (typeof tempusDominus === "undefined" || !ObjDom) {
        return null;
    }

    var key = DateTimePickerGetInstanceKey(ObjDom);
    var signature = DateTimePickerGetSignature(ObjDom);
    var existing = DateTimePickerInstances[key];

    if (existing && existing.signature === signature) {
        return existing.picker;
    }

    if (existing && existing.picker && typeof existing.picker.dispose === "function") {
        existing.picker.dispose();
    }

    ObjDom.setAttribute("type", "text");
    ObjDom.removeAttribute("min");
    ObjDom.removeAttribute("max");
    ObjDom.removeAttribute("data-td-target");
    ObjDom.removeAttribute("data-td-toggle");

    var picker = new tempusDominus.TempusDominus(ObjDom, DateTimePickerBuildTempusOptions(ObjDom));
    picker.subscribe(tempusDominus.Namespace.events.change, function () {
        //DateTimePickerChange(ObjDom);
    });

    // detect OPEN
    picker.subscribe(tempusDominus.Namespace.events.show, function () {
        //console.log("OPEN");
        ObjDom.dataset.systemIsopen = "true";
    });

    // detect CLOSE
    picker.subscribe(tempusDominus.Namespace.events.hide, function () {
        //console.log("CLOSED");
        ObjDom.dataset.systemIsopen = "false";
    });

    DateTimePickerInstances[key] = {
        picker: picker,
        signature: signature
    };

    // Initialize popup theme variables immediately after creating picker instance.
    DateTimePickerSetGlobalThemeFromObject(ObjDom);

    if (ObjDom.dataset.dtpopenbound !== "true") {
        var showPicker = function () {
            if (EditMode === true) {
                return;
            }
            DateTimePickerSetGlobalThemeFromObject(ObjDom);
            var current = DateTimePickerInstances[DateTimePickerGetInstanceKey(ObjDom)];
            if (current && current.picker && typeof current.picker.show === "function") {
                
                current.picker.show();
            }
        };

        ObjDom.addEventListener("click", showPicker);
        ObjDom.addEventListener("focus", showPicker);
        ObjDom.dataset.dtpopenbound = "true";
    }

    return picker;
}

function DateTimePickerUpdateTempusOptions(ObjDom) {
    var key = DateTimePickerGetInstanceKey(ObjDom);
    var current = key ? DateTimePickerInstances[key] : null;
    if (!current || !current.picker) {
        return DateTimePickerEnsureTempus(ObjDom);
    }

    if (typeof current.picker.updateOptions === "function") {
        current.picker.updateOptions(DateTimePickerBuildTempusOptions(ObjDom));
        current.signature = DateTimePickerGetSignature(ObjDom);
        DateTimePickerInstances[key] = current;
        return current.picker;
    }

    return current.picker;
}

// DATETIMEPICKER INPUT HANDLERS

function DateTimePickerContextInputHandlervariable(e) {

    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-variable', e.target.value);
            DateTimePickerSyncFromVariable(ElementToBeDecorated);
        }
    }
}

function DateTimePickerContextInputHandlerMode(e) {
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-datetimemode', e.target.value);
            ElementToBeDecorated.setAttribute("type", "text");

            DateTimePickerUpdateTempusOptions(ElementToBeDecorated);
            DateTimePickerRefreshCurrentDisplay(ElementToBeDecorated);
        }
    }
}

function DateTimePickerContextInputHandlerDisplayFormat(e) {
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-displayformat', e.target.value);

            // Update picker options in place + redraw immediately.
            DateTimePickerUpdateTempusOptions(ElementToBeDecorated);
            DateTimePickerRefreshCurrentDisplay(ElementToBeDecorated);
        }
    }
}

function DateTimePickerContextInputHandlerIsUtc(e) {
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute('data-isutc', e.target.checked);
            DateTimePickerUpdateTempusOptions(ElementToBeDecorated);
            DateTimePickerRefreshCurrentDisplay(ElementToBeDecorated);
        }
    }
}

function DateTimePickerContextApplyThemeAttribute(attributeName, value) {
    for (var i = ElementsToBeDecorated.length; i >= 1; i--) {
        ElementToBeDecorated = getObjDom(ElementsToBeDecorated[i - 1]);
        if (ElementToBeDecorated) {
            ElementToBeDecorated.setAttribute(attributeName, value);
            DateTimePickerApplyThemeVariables(ElementToBeDecorated);
            DateTimePickerSetGlobalThemeFromObject(ElementToBeDecorated);
        }
    }
}

function DateTimePickerContextInputHandlerPickerBackgroundColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-pickerbackgroundcolor", value);
}

function DateTimePickerContextInputHandlerDisplayTextColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-color", value);
}

function DateTimePickerContextInputHandlerDisplayBackgroundColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-backgroundcolor", value);
}

function DateTimePickerContextInputHandlerPickerTextColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-pickertextcolor", value);
}

function DateTimePickerContextInputHandlerSelectedBackgroundColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-selectedbackgroundcolor", value);
}

function DateTimePickerContextInputHandlerSelectedTextColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-selectedtextcolor", value);
}

function DateTimePickerContextInputHandlerTodayBackgroundColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-todaybackgroundcolor", value);
}

function DateTimePickerContextInputHandlerTodayTextColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-todaytextcolor", value);
}

function DateTimePickerContextInputHandlerHoverBackgroundColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-hoverbackgroundcolor", value);
}

function DateTimePickerContextInputHandlerHoverTextColor(value) {
    DateTimePickerContextApplyThemeAttribute("data-hovertextcolor", value);
}
