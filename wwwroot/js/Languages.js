// Call this during render to show the current language nicely
// Example: setCurrentLanguage("@CultureInfo.CurrentUICulture.TwoLetterISOLanguageName");
function setCurrentLanguage(langCode) {
    const btn = document.getElementById("LangPickerButton");
    const label = document.getElementById("LangPickerLabel");
    const item = document.querySelector(`.lang-menu .dropdown-item[data-lang="${langCode}"]`);
    if (item) label.textContent = item.getAttribute("data-label");
}

// Wire up dropdown clicks
$(document).on("click", ".lang-menu .dropdown-item", function () {
    const lang = $(this).data("lang");
    const label = $(this).data("label");

    // Update button label immediately
    $("#LangPickerLabel").text(label);

    // Persist + reload (server picks up new culture)
    SetLanguage(lang);
});