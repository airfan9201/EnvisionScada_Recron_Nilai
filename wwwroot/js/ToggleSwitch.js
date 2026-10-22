function ToggleSwitch(checkbox) {

    if (!EditMode) {

        var variable = checkbox.getAttribute("data-variable");

        if (checkbox.classList.contains("toggletoggled")) {
            //console.log('untoggled');

            var action = "reset";
            var variable = variable;
            DoAction(action, variable);
            /*checkbox.classList.remove("toggletoggled");*/
        }
        else {
            //console.log('toggled');

            var action = "set";
            var variable = variable;
            DoAction(action, variable);

           /* checkbox.classList.add("toggletoggled");*/
        }
    }

}
