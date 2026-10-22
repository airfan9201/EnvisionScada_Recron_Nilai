function ToggleCheckBox(checkbox) {

    if (!EditMode) {
        var variable = checkbox.getAttribute("data-variable");

        if (checkbox.classList.contains("checkboxchecked")) {
            //console.log('unchecking');

            var action = "reset";
            var variable = variable;
            DoAction(action, variable);

        }
        else {
            //console.log('checking');

            var action = "set";
            var variable = variable;
            DoAction(action, variable);
        }
    }
    
}
