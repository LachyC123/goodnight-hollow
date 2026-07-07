// Keyboard input handling.
const down = new Set();
const pressed = new Set();

window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if (!down.has(e.code)) pressed.add(e.code);
  down.add(e.code);
});
window.addEventListener('keyup', e => down.delete(e.code));
window.addEventListener('blur', () => down.clear());

export const Input = {
  isDown(...codes) { return codes.some(c => down.has(c)); },
  wasPressed(...codes) { return codes.some(c => pressed.has(c)); },
  endFrame() { pressed.clear(); },
  moveX() {
    return (this.isDown('KeyD','ArrowRight') ? 1 : 0) - (this.isDown('KeyA','ArrowLeft') ? 1 : 0);
  },
  moveY() {
    return (this.isDown('KeyS','ArrowDown') ? 1 : 0) - (this.isDown('KeyW','ArrowUp') ? 1 : 0);
  },
  attack() { return this.wasPressed('KeyJ','KeyZ','Space'); },
  dodge() { return this.wasPressed('KeyK','KeyX','ShiftLeft','ShiftRight'); },
  interact() { return this.wasPressed('KeyE','Enter'); },
  confirm() { return this.wasPressed('KeyE','Enter','Space','KeyJ','KeyZ'); },
};
