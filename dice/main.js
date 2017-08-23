/* eslint-env browser */

function dice_initialize(container) {
  const canvas = document.getElementById('canvas');

  canvas.style.width = `${window.innerWidth - 1}px`;
  canvas.style.height = `${window.innerHeight - 1}px`;

  function getSet() {
    // get random number of dice 1 - 6
    const numberOfDice = Math.floor(Math.random() * 6 + 1);
    const set = [];
    for (let i = numberOfDice - 1; i >= 0; i--) {
      set.push('d6');
    }
    return set;
  }

  const throw_data = {
    set: ['d6', 'd6', 'd6', 'd6', 'd6', 'd6'],
    // set: getSet(),
    result: [1, 2, 3, 4, 5, 6],
    // result: [ 1, 1, 1, 1, 1, 1],
    // result: [],
  };

  function before_roll(vectors, notation, callback) {
    callback();
  }

  function after_roll(notation, result) {
  }

  const w = window.innerWidth / 4;
  const h = window.innerHeight / 4;
  const box = new roller.dice_box(canvas, { w, h });

  window.addEventListener('resize', () => {
    const newW = `${window.innerWidth - 1}px`;
    const newH = `${window.innerHeight - 1}px`;
    canvas.style.width = newW;
    canvas.style.height = newH;
    box.reinit(canvas, { w, h });
  });

  box.bind_mouse(container, throw_data, before_roll, after_roll);
  box.start_throw(throw_data, before_roll, after_roll);
}
