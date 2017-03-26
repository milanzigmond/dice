"use strict";

function dice_initialize(container) {


    var info_div = $t.id('info_div');
    var canvas = $t.id('canvas');

    canvas.style.width = window.innerWidth - 1 + 'px';
    canvas.style.height = window.innerHeight - 1 + 'px';

    $t.dice.use_true_random = false;

    function getSet() {
        // get random number of dice 1 - 6
        var numberOfDice = Math.floor(Math.random()*6+1);
        var set = [];
        for (var i = numberOfDice - 1; i >= 0; i--) {
            set.push('d6');
        }
        return set;
    }

    function throw_data() {
        return {
            // set: ['d6', 'd6', 'd6', 'd6', 'd6', 'd6' ],
            set: getSet(),
            result: [ 1, 2, 3, 4, 5, 6],
            // result: [ 1, 1, 1, 1, 1, 1],
            // result: [],
        };
    }

    function before_roll(vectors, notation, callback) {
        callback();
    }

    function after_roll(notation, result) {
    }

    var w = window.innerWidth/4;
    var h = window.innerHeight/4;
    // var w = 400;
    // var h = 300;
    var box = new $t.dice.dice_box(canvas, { w: w, h: h });

    $t.bind(window, 'resize', function() {
        let newW = window.innerWidth - 1 + 'px';
        let newH = window.innerHeight - 1 + 'px';
        canvas.style.width = newW;
        canvas.style.height = newH;
        box.reinit(canvas, { w: w, h: h });
    });

    box.bind_mouse(container, throw_data, before_roll, after_roll);
    box.start_throw(throw_data, before_roll, after_roll);
}
