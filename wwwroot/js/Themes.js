
var r = document.querySelector(':root');

SetSelectedTheme();

function SetLight() {

    /*r.style.setProperty('--ThemeBackground', 'white');*/
    r.style.setProperty('--ThemeBackground', '#F0F1F3');
    r.style.setProperty('--ThemeBackground2', '#D6D6D6');
    r.style.setProperty('--ThemeBackgroundSideMenu', '#e8e8e8');
    /*r.style.setProperty('--ThemeBackgroundFancy', 'linear-gradient(94deg, rgba(255,255,255,1) 0%, rgba(37, 150, 190,0.2) 100%)');*///#f2f3f9
    r.style.setProperty('--ThemeBackgroundFancy', 'linear-gradient(94deg, rgba(255,255,255,1) 0%, rgba(0, 0, 0,0.2) 100%)');
    /*r.style.setProperty('--ThemeElements', 'transparant');*/
    r.style.setProperty('--ThemeElements', 'white');
    r.style.setProperty('--ThemeFontColor', '#545454');
    r.style.setProperty('--ThemeFontColor2', '#545454');
    r.style.setProperty('--ThemeFontColorHover', 'lightgrey');

    r.style.setProperty('--ThemeBorderColor', '#dbdbdb');
    r.style.setProperty('--ThemeBorderColorHover', 'lightgrey');
    r.style.setProperty('--ThemePlaceholderFontColor', 'lightgrey');
    r.style.setProperty('--ThemeFormLineColor', 'lightgrey');
    r.style.setProperty('--ThemeFormLineColorHorizontal', '#e8e6e6');
    r.style.setProperty('--ThemeFormLineColorVertical', 'lightgrey');
    r.style.setProperty('--ThemeFormLineColorEven', '#ededed');
    r.style.setProperty('--ThemeFormLineColorHover', '#e6e6e6');
    r.style.setProperty('--ThemeFormBackgroundColor', '#e6e7e8');

    r.style.setProperty('--ThemeButtonBackgroundColor', 'lightgrey');
    r.style.setProperty('--ThemeButtonBackgroundColorHover', 'darkgray');
    r.style.setProperty('--ThemeButtonColor', 'white');
    r.style.setProperty('--ThemeButtonColorHover', 'black');

    r.style.setProperty('--ThemeIconColor', '#7198C8'); // NEW BLUE
    r.style.setProperty('--ThemeIconColorHover', 'lightgrey');

    r.style.setProperty('--ThemeGridInputBackgroundColorFocus', 'white');
    r.style.setProperty('--ThemeGridInputFontColorFocus', 'black');

    r.style.setProperty('--ThemeSettingsInputBackgroundColor', 'white');
    r.style.setProperty('--ThemeSettingsInputFontColor', 'black');
    r.style.setProperty('--ThemeSettingsInputBorderColor', 'lightgrey');

    r.style.setProperty('--ThemeConfigInputBackgroundColor', 'white');
    r.style.setProperty('--ThemeConfigInputColor', 'black');

    r.style.setProperty('--ThemeConfigInputReadOnlyBackgroundColor', '#F4F5F5');
    r.style.setProperty('--ThemeConfigInputReadOnlyColor', '#515252');

    r.style.setProperty('--ThemeCrossRefMarker', 'yellow');

    r.style.setProperty('--ThemeCloseButtonFilter', 'none');

    document.documentElement.classList.remove('theme-dark');
    localStorage.setItem('Theme', 'Light');
}

function SetDark() {

    r.style.setProperty('--ThemeBackground', '#2b2b2b'); // #2B2B2B
    r.style.setProperty('--ThemeBackground2', '#474747');
    r.style.setProperty('--ThemeBackgroundSideMenu', '#474747'); //#+#474747
    /*r.style.setProperty('--ThemeBackgroundFancy', 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(37, 150, 190,0.3) 100%)');*///#f2f3f9
    r.style.setProperty('--ThemeBackgroundFancy', 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0, 0, 0,0.3) 100%)');
    /*r.style.setProperty('--ThemeElements', 'transparant');*/
    r.style.setProperty('--ThemeElements', '#454545');
    r.style.setProperty('--ThemeFontColor', '#e8e6e6');
    r.style.setProperty('--ThemeFontColor2', '#bfbfbf');
    r.style.setProperty('--ThemeFontColorHover', '#9c9c9c');

    r.style.setProperty('--ThemeBorderColor', '#3d3d3d');
    r.style.setProperty('--ThemeBorderColorHover', '#9c9c9c');
    r.style.setProperty('--ThemePlaceholderFontColor', '#9c9c9c');
    r.style.setProperty('--ThemeFormLineColor', '#9c9c9c');
    r.style.setProperty('--ThemeFormLineColorHorizontal', '#2a2a2a');
    r.style.setProperty('--ThemeFormLineColorVertical', '#545454');
    r.style.setProperty('--ThemeFormLineColorEven', '#303030');
    r.style.setProperty('--ThemeFormLineColorHover', '#384042');
    r.style.setProperty('--ThemeFormBackgroundColor', '#4a4a4a');

    r.style.setProperty('--ThemeButtonBackgroundColor', '#9c9c9c');
    r.style.setProperty('--ThemeButtonBackgroundColorHover', 'Darkgray');
    r.style.setProperty('--ThemeButtonColor', '#e8e6e6');
    r.style.setProperty('--ThemeButtonColorHover', '#e8e6e6');
    r.style.setProperty('--ThemeIconColor', '#2596be'); // NEW BLUE
    r.style.setProperty('--ThemeIconColorHover', '#9c9c9c');

    r.style.setProperty('--ThemeGridInputBackgroundColorFocus', '#dedede');
    r.style.setProperty('--ThemeGridInputFontColorFocus', 'black');

    r.style.setProperty('--ThemeSettingsInputBackgroundColor', '#48494d');
    r.style.setProperty('--ThemeSettingsInputFontColor', 'lightgrey');
    r.style.setProperty('--ThemeSettingsInputBorderColor', '#545454');

    r.style.setProperty('--ThemeConfigInputBackgroundColor', '#48494d');
    r.style.setProperty('--ThemeConfigInputColor', 'lightgrey');

    r.style.setProperty('--ThemeConfigInputReadOnlyBackgroundColor', '#2e2e30');
    r.style.setProperty('--ThemeConfigInputReadOnlyColor', 'lightgrey');

    r.style.setProperty('--ThemeLayerSettingsFocus', '#424346');

    document.documentElement.classList.add('theme-dark');
    r.style.setProperty('--ThemeCrossRefMarker', 'purple');

    r.style.setProperty('--ThemeCloseButtonFilter', 'invert(1)');

    localStorage.setItem('Theme', 'Dark');
}

function SetBlueLight() {

    r.style.setProperty('--ThemeBackground', '#F8FAFC');
    r.style.setProperty('--ThemeBackground2', '#EEF2F6');
    r.style.setProperty('--ThemeBackgroundSideMenu', '#F1F5F9');
    r.style.setProperty('--ThemeBackgroundFancy', 'linear-gradient(94deg, rgba(248,250,252,1) 0%, rgba(59,130,246,0.08) 100%)');
    r.style.setProperty('--ThemeElements', '#FFFFFF');
    r.style.setProperty('--ThemeFontColor', '#1E293B');
    r.style.setProperty('--ThemeFontColor2', '#475569');
    r.style.setProperty('--ThemeFontColorHover', '#94A3B8');

    r.style.setProperty('--ThemeBorderColor', '#E2E8F0');
    r.style.setProperty('--ThemeBorderColorHover', '#94A3B8');
    r.style.setProperty('--ThemePlaceholderFontColor', '#CBD5E1');
    r.style.setProperty('--ThemeFormLineColor', '#CBD5E1');
    r.style.setProperty('--ThemeFormLineColorHorizontal', '#F1F5F9');
    r.style.setProperty('--ThemeFormLineColorVertical', '#E2E8F0');
    r.style.setProperty('--ThemeFormLineColorEven', '#F8FAFC');
    r.style.setProperty('--ThemeFormLineColorHover', '#EEF2F6');
    r.style.setProperty('--ThemeFormBackgroundColor', '#F1F5F9');

    r.style.setProperty('--ThemeButtonBackgroundColor', '#94A3B8');
    r.style.setProperty('--ThemeButtonBackgroundColorHover', '#3B82F6');
    r.style.setProperty('--ThemeButtonColor', '#FFFFFF');
    r.style.setProperty('--ThemeButtonColorHover', '#FFFFFF');

    r.style.setProperty('--ThemeIconColor', '#3B82F6');
    r.style.setProperty('--ThemeIconColorHover', '#2563EB');

    r.style.setProperty('--ThemeGridInputBackgroundColorFocus', '#FFFFFF');
    r.style.setProperty('--ThemeGridInputFontColorFocus', '#1E293B');

    r.style.setProperty('--ThemeSettingsInputBackgroundColor', '#FFFFFF');
    r.style.setProperty('--ThemeSettingsInputFontColor', '#1E293B');
    r.style.setProperty('--ThemeSettingsInputBorderColor', '#E2E8F0');

    r.style.setProperty('--ThemeConfigInputBackgroundColor', '#FFFFFF');
    r.style.setProperty('--ThemeConfigInputColor', '#1E293B');

    r.style.setProperty('--ThemeConfigInputReadOnlyBackgroundColor', '#F1F5F9');
    r.style.setProperty('--ThemeConfigInputReadOnlyColor', '#64748B');

    r.style.setProperty('--ThemeCrossRefMarker', '#FBBF24');

    r.style.setProperty('--ThemeCloseButtonFilter', 'none');

    document.documentElement.classList.remove('theme-dark');
    localStorage.setItem('Theme', 'BlueLight');
}

function SetBlueDark() {

    r.style.setProperty('--ThemeBackground', '#1A2332');
    r.style.setProperty('--ThemeBackground2', '#243447');
    r.style.setProperty('--ThemeBackgroundSideMenu', '#1E2D3D');
    r.style.setProperty('--ThemeBackgroundFancy', 'linear-gradient(90deg, rgba(10,15,25,1) 0%, rgba(37,150,190,0.3) 100%)');
    r.style.setProperty('--ThemeElements', '#263850');
    r.style.setProperty('--ThemeFontColor', '#D0DEE8');
    r.style.setProperty('--ThemeFontColor2', '#A0B8CC');
    r.style.setProperty('--ThemeFontColorHover', '#6A8CA8');

    r.style.setProperty('--ThemeBorderColor', '#2A3F55');
    r.style.setProperty('--ThemeBorderColorHover', '#4A7A9B');
    r.style.setProperty('--ThemePlaceholderFontColor', '#5A7A94');
    r.style.setProperty('--ThemeFormLineColor', '#5A7A94');
    r.style.setProperty('--ThemeFormLineColorHorizontal', '#1A2535');
    r.style.setProperty('--ThemeFormLineColorVertical', '#2E4560');
    r.style.setProperty('--ThemeFormLineColorEven', '#1E2E40');
    r.style.setProperty('--ThemeFormLineColorHover', '#2A4058');
    r.style.setProperty('--ThemeFormBackgroundColor', '#2A3E52');

    r.style.setProperty('--ThemeButtonBackgroundColor', '#2596BE');
    r.style.setProperty('--ThemeButtonBackgroundColorHover', '#30B0DC');
    r.style.setProperty('--ThemeButtonColor', '#D0DEE8');
    r.style.setProperty('--ThemeButtonColorHover', '#FFFFFF');

    r.style.setProperty('--ThemeIconColor', '#2596BE');
    r.style.setProperty('--ThemeIconColorHover', '#5A7A94');

    r.style.setProperty('--ThemeGridInputBackgroundColorFocus', '#C8D8E4');
    r.style.setProperty('--ThemeGridInputFontColorFocus', '#1A2332');

    r.style.setProperty('--ThemeSettingsInputBackgroundColor', '#2A3E52');
    r.style.setProperty('--ThemeSettingsInputFontColor', '#C0D0DD');
    r.style.setProperty('--ThemeSettingsInputBorderColor', '#2E4560');

    r.style.setProperty('--ThemeConfigInputBackgroundColor', '#2A3E52');
    r.style.setProperty('--ThemeConfigInputColor', '#C0D0DD');

    r.style.setProperty('--ThemeConfigInputReadOnlyBackgroundColor', '#1A2535');
    r.style.setProperty('--ThemeConfigInputReadOnlyColor', '#A0B8CC');

    r.style.setProperty('--ThemeLayerSettingsFocus', '#263B50');

    r.style.setProperty('--ThemeCrossRefMarker', '#7B68EE');

    r.style.setProperty('--ThemeCloseButtonFilter', 'invert(1)');

    document.documentElement.classList.add('theme-dark');
    localStorage.setItem('Theme', 'BlueDark');
}

function ShowThemePicker() {
    var overlay = document.getElementById('ThemePickerOverlay');
    overlay.style.display = 'flex';

    var current = localStorage.getItem('Theme') || 'Light';
    var options = overlay.querySelectorAll('.theme-picker-option');
    options.forEach(function (opt) {
        opt.classList.remove('active');
    });
    options.forEach(function (opt) {
        if (opt.getAttribute('onclick') === "PickTheme('" + current + "')") {
            opt.classList.add('active');
        }
    });
}

function HideThemePicker() {
    document.getElementById('ThemePickerOverlay').style.display = 'none';
}

function PickTheme(name) {
    switch (name) {
        case 'Light':     SetLight();     break;
        case 'Dark':      SetDark();      break;
        case 'BlueLight': SetBlueLight(); break;
        case 'BlueDark':  SetBlueDark();  break;
        default:          SetLight();     break;
    }
    HideThemePicker();
}

function SetSelectedTheme() {

    const theme = localStorage.getItem('Theme');

    switch (theme) {
        case 'Light':
            SetLight();
            break;
        case 'Dark':
            SetDark();
            break;
        case 'BlueLight':
            SetBlueLight();
            break;
        case 'BlueDark':
            SetBlueDark();
            break;
        default:
            SetLight();
    }
}