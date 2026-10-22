// THIS IS THE RANGE SLIDER LOGIC DO NOT CHANGE !!
var ZBRangeSlider = function (element) {
    var self = this;
    var startX = 0, x = 0;

    self.sliding = false;

    // retrieve touch button
    var slider = element;
    var touchLeft = slider.querySelector('.slider-touch-left');
    var touchRight = slider.querySelector('.slider-touch-right');
    var lineSpan = slider.querySelector('.slider-line span');
    var sliderline = slider.querySelector('.slider-line');
    var feedback = slider.querySelector('.slider-feedback');

    sliderline.style.width = "calc(100% - " + parseInt(touchLeft.style.width) + "px)";
    sliderline.style.left = parseInt(touchLeft.style.width) / 2 + "px";

    // get some properties
    var min = parseFloat(slider.getAttribute('se-min'));
    var max = parseFloat(slider.getAttribute('se-max'));

    // retrieve default values
    var defaultMinValue = min;
    if (slider.hasAttribute('se-min-value')) {
        defaultMinValue = parseFloat(slider.getAttribute('se-min-value'));
    }
    var defaultMaxValue = max;

    if (slider.hasAttribute('se-max-value')) {
        defaultMaxValue = parseFloat(slider.getAttribute('se-max-value'));
    }

    // check values are correct
    if (defaultMinValue < min) {
        defaultMinValue = min;
    }

    if (defaultMaxValue > max) {
        defaultMaxValue = max;
    }

    if (defaultMinValue > defaultMaxValue) {
        defaultMinValue = defaultMaxValue;
    }

    var step = 0.0;

    if (slider.getAttribute('se-step')) {
        step = Math.abs(parseFloat(slider.getAttribute('se-step')));
    }

    // normalize flag
    var normalizeFact = 0;

    self.slider = slider;
    self.reset = function () {

        touchLeft.style.left = '0px';
        touchRight.style.left = (slider.offsetWidth - touchLeft.offsetWidth) + 'px';
        lineSpan.style.marginLeft = '0px';
        lineSpan.style.width = (slider.offsetWidth - touchLeft.offsetWidth) + 'px';
        startX = 0;
        x = 0;
    };

    self.setMinValue = function (minValue) {
        var ratio = ((minValue - min) / (max - min));
        touchLeft.style.left = Math.ceil(ratio * (slider.offsetWidth - (touchLeft.offsetWidth + normalizeFact))) + 'px';
        lineSpan.style.marginLeft = touchLeft.offsetLeft + 'px';
        lineSpan.style.width = (touchRight.offsetLeft - touchLeft.offsetLeft) + 'px';
        slider.setAttribute('se-min-value', minValue);
        feedback.innerHTML = slider.getAttribute('se-min-value');
    }

    self.setMaxValue = function (maxValue) {
        var ratio = ((maxValue - min) / (max - min));
        touchRight.style.left = Math.ceil(ratio * (slider.offsetWidth - (touchLeft.offsetWidth + normalizeFact)) + normalizeFact) + 'px';
        lineSpan.style.marginLeft = touchLeft.offsetLeft + 'px';
        lineSpan.style.width = (touchRight.offsetLeft - touchLeft.offsetLeft) + 'px';
        slider.setAttribute('se-max-value', maxValue);
    }

    // initial reset
    self.reset();

    // usefull values, min, max, normalize fact is the width of both touch buttons
    var maxX = slider.offsetWidth - touchRight.offsetWidth;
    var selectedTouch = null;
    var initialValue = (lineSpan.offsetWidth - normalizeFact);

    // set defualt values
    self.setMinValue(defaultMinValue);
    self.setMaxValue(defaultMaxValue);

    // setup touch/click events
    function onStart(event) {

        if (EditMode === true) {
            return;
        }

        self.sliding = true;

        if (slider.getAttribute('data-texthidden') === 'true') { 
            feedback.classList.toggle('is-invisible');
            feedback.classList.toggle('is-visible');
        }

        // Prevent default dragging of selected content
        event.preventDefault();
        var eventTouch = event;

        if (event.touches) {
            eventTouch = event.touches[0];
        }

        if (this === touchLeft) {
            x = touchLeft.offsetLeft;
        }
        else {
            x = touchRight.offsetLeft;
        }

        startX = eventTouch.pageX - x;
        selectedTouch = this;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onStop);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onStop);


    }

    function onMove(event) {

        if (EditMode === true) {
            return;
        }

        var eventTouch = event;

        if (event.touches) {
            eventTouch = event.touches[0];
        }

        x = eventTouch.pageX - startX;

        if (selectedTouch === touchLeft) {
    
            if (x > (touchRight.offsetLeft - selectedTouch.offsetWidth + parseInt(touchLeft.style.width))) {
                x = (touchRight.offsetLeft - selectedTouch.offsetWidth + parseInt(touchLeft.style.width))
            }
            else if (x < 0) {
                x = 0;
            }

            selectedTouch.style.left = x + 'px';
        }
        else if (selectedTouch === touchRight) {
            if (x < (touchLeft.offsetLeft + touchLeft.offsetWidth - parseInt(touchRight.style.width))) {
                x = (touchLeft.offsetLeft + touchLeft.offsetWidth - parseInt(touchRight.style.width))
            }
            else if (x > maxX) {
                x = maxX;
            }
            
            selectedTouch.style.left = x + 'px';
        }

        // update line span
        lineSpan.style.marginLeft = touchLeft.offsetLeft + 'px';
        lineSpan.style.width = (touchRight.offsetLeft - touchLeft.offsetLeft) + 'px';

        // write new value
        calculateValue();

        // call on change
        if (slider.getAttribute('on-change')) {
            var fn = new Function('min, max', slider.getAttribute('on-change'));
            fn(slider.getAttribute('se-min-value'), slider.getAttribute('se-max-value'));
        }

        if (self.onChange) {
            self.onChange(slider.getAttribute('se-min-value'), slider.getAttribute('se-max-value'));
            feedback.innerHTML = slider.getAttribute('se-min-value');
        }

    }

    function onStop(event) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onStop);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onStop);

        self.sliding = false;

        if (slider.getAttribute('data-texthidden') === 'true') {
            feedback.classList.toggle('is-invisible');
            feedback.classList.toggle('is-visible');
        }

        selectedTouch = null;

        // write new value
        calculateValue();

        // call did changed
        if (slider.getAttribute('did-changed')) {
            var fn = new Function('min, max', slider.getAttribute('did-changed'));
            fn(slider.getAttribute('se-min-value'), slider.getAttribute('se-max-value'));
        }

        if (self.didChanged) {

            self.didChanged(slider.getAttribute('se-min-value'), slider.getAttribute('se-max-value'));

            UpdateValue();
        }
    }

    function onWheel(event) {

        if (EditMode === true) {
            return;
        }

        if (slider.getAttribute('data-texthidden') === 'true') {
            feedback.classList.toggle('is-invisible');
            feedback.classList.toggle('is-visible');
        }

        var minValue = parseFloat(slider.getAttribute('se-min'));
        var maxValue = parseFloat(slider.getAttribute('se-max'));

        var step = parseFloat(slider.getAttribute('se-step'));

        var min = parseFloat(slider.getAttribute('se-min-value'));

        if (event.deltaY > 0) { // more

            if (step != 0.0) {
                min = min + step;
            }
            else {
                min = min + 1.0;
            }

            if (min > maxValue) {
                min = maxValue;
            }
        }
        else { // less
            if (step != 0.0) {
                min = min - step;
            }
            else {
                min = min - 1.0;
            }

            if (min < minValue) {
                min = minValue;
            }
        }

        self.setMinValue(min);

        UpdateValue();

        if (slider.getAttribute('data-texthidden') === 'true') {
            feedback.classList.toggle('is-invisible');
            feedback.classList.toggle('is-visible');
        }

        //console.log('wheeling' + event.deltaY);
        
    }

    function UpdateValue() {
        var action = "setvalue";
        var variable = slider.getAttribute('data-variable');
        DoAction(action, variable, slider.getAttribute('se-min-value'));

        slider.setAttribute('data-writetimeout', slider.getAttribute("data-WriteTimeoutTime"));
    }

    function calculateValue() {
        
        var newValue = (lineSpan.offsetWidth - normalizeFact) / initialValue;
        var minValue = lineSpan.offsetLeft / initialValue;
        var maxValue = minValue + newValue;

        var minValue = minValue * (max - min) + min;
        var maxValue = maxValue * (max - min) + min;

        if (step !== 0.0) {
            var multi = Math.floor((minValue / step));
            minValue = step * multi;

            multi = Math.floor((maxValue / step));
            maxValue = step * multi;
        }

        slider.setAttribute('se-min-value', minValue);
        slider.setAttribute('se-max-value', maxValue);
    }

    // link events
    touchLeft.addEventListener('mousedown', onStart);
    touchRight.addEventListener('mousedown', onStart);
    touchLeft.addEventListener('touchstart', onStart);
    touchRight.addEventListener('touchstart', onStart);
    slider.addEventListener('wheel', onWheel);
};

// -------------------
// How to use? 
//var newRangeSlider = new ZBRangeSlider('my-slider');

//newRangeSlider.onChange = function (min, max) {
//    //console.log(min, max, this);
//    //document.getElementById('result').innerHTML = 'Min: ' + min + ' Max: ' + max;
//}

//newRangeSlider.didChanged = function (min, max) {
//    //console.log(min, max, this);
//    //document.getElementById('result').innerHTML = 'Min: ' + min + ' Max: ' + max;
//}

// call reset if needed
//newRangeSlider.reset();

function setthumbwidth(element, width) {

    var slider = element;
    var touchLeft = slider.querySelector('.slider-touch-left');
    var touchRight = slider.querySelector('.slider-touch-right');
    var sliderline = slider.querySelector('.slider-line');

    touchLeft.style.width = width;

    sliderline.style.width = "calc(100% - " + width + "px)";

    sliderline.style.left = width / 2 + "px";

    //newRangeSlider.reset();
}

function resetthumbheight(element) {

    var slider = element; // .getElementsByTagName("div")[0];

    var touchLeft = slider.querySelector('.slider-touch-left');
    var sliderline = slider.querySelector('.slider-line');

    var height = parseInt(touchLeft.style.height);

    touchLeft.style.height = height + "px";

    let compStyles = window.getComputedStyle(sliderline);

    var trackheight = compStyles.getPropertyValue('height');

    if (parseInt(touchLeft.style.height) !== parseInt(trackheight)) {
        if (parseInt(touchLeft.style.height) > parseInt(touchLeft.style.height)) {

            touchLeft.style.top = "calc(" + (parseInt(trackheight) - parseInt(touchLeft.style.height)) / 2 + "px)";

        }
        else {
            touchLeft.style.top = "calc(" + (parseInt(trackheight) - parseInt(touchLeft.style.height)) / 2 + "px)";
        }
    }
    else {
        touchLeft.style.top = "0px";
    }

    //newRangeSlider.reset();
}

function setthumbheight(element, height) {
    var slider = element;
    var touchLeft = slider.querySelector('.slider-touch-left');
    var sliderline = slider.querySelector('.slider-line');

    touchLeft.style.height = height;

    let compStyles = window.getComputedStyle(sliderline);

    var trackheight = compStyles.getPropertyValue('height');

    if (parseInt(touchLeft.style.height) !== parseInt(trackheight)) {
        if (parseInt(touchLeft.style.height) > parseInt(touchLeft.style.height)) {

            touchLeft.style.top = "calc(" + (parseInt(trackheight) - parseInt(touchLeft.style.height)) / 2 + "px)";
            
        }
        else {
            touchLeft.style.top = "calc(" + (parseInt(trackheight) - parseInt(touchLeft.style.height)) / 2 + "px)";
        }
    }
    else {
        touchLeft.style.top = "0px";
    }

    //newRangeSlider.reset();
}

//function setthumbheight(height) {
//    var slider = document.getElementById('my-slider');
//    var touchLeft = slider.querySelector('.slider-touch-left');

//    touchLeft.style.height = height + "px";

//    newRangeSlider.reset();
//}

//function setthumbtop(top) {
//    var slider = document.getElementById('my-slider');
//    var touchLeft = slider.querySelector('.slider-touch-left');

//    touchLeft.style.top = top + "px";

//    newRangeSlider.reset();
//}