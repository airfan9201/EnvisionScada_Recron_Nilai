
function AddWidthHeightToAllDraggables() { 

    //console.log('Starting Upgrade...');

    var draggables = document.getElementById("EnvisionPage").getElementsByClassName("draggable");

    for (var i = 0; i < draggables.length; i++) {

        var element = draggables[i];

        //console.log('Upgrading ' + element.id);

        let compStyles = window.getComputedStyle(element);
        //console.log(compStyles.getPropertyValue("width"));
        //console.log(compStyles.getPropertyValue("height"));
        element.style.width = compStyles.getPropertyValue("width");
        element.style.height = compStyles.getPropertyValue("height");

    }

    //console.log('Upgrade Complete!');
}

function RemoveAllResizers() {

    //console.log('Starting Upgrade...');

    var elements = document.getElementById("EnvisionPage").getElementsByClassName("resizer-bottom");

    for (var i = 0; i < elements.length; i++) {

        var element = elements[i];
        //console.log('removing ' + element.classList);
        element.remove();

    }

    elements = document.getElementById("EnvisionPage").getElementsByClassName("resizer-right");

    for (var i = 0; i < elements.length; i++) {

        var element = elements[i];
        //console.log('removing ' + element.classList);
        element.remove();

    }

    elements = document.getElementById("EnvisionPage").getElementsByClassName("resizer-both");

    for (var i = 0; i < elements.length; i++) {

        var element = elements[i];
        //console.log('removing ' + element.classList);
        element.remove();

    }

    //console.log('Upgrade Complete!');
}