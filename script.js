const stage = document.querySelector('#camera-stage');
const subject = document.querySelector('#subject');
const device = document.querySelector('#device-location');
const lights = [...document.querySelectorAll('[data-signal]')];
const countdown = document.querySelector('#countdown');
const cameraStatus = document.querySelector('#camera-status');
const signupForm = document.querySelector('#signup-form');
const signupSuccess = document.querySelector('#signup-success');
const formError = document.querySelector('#form-error');
const position = { x: 34, y: 52 };
const target = { x: 50, y: 52 };
const labels = { left: 'move left', right: 'move right', up: 'move up', down: 'move down', center: 'centered' };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
let manual = false;
let animation = 0;
let centerTimer = [];
let drag = null;
let currentSignal = 'right';

function signalFor({ x, y }) {
  const dx = x - target.x;
  const dy = y - target.y;
  if (Math.abs(dx) <= 5 && Math.abs(dy) <= 6) return 'center';
  if (Math.abs(dx) / 5 >= Math.abs(dy) / 6) return dx < 0 ? 'right' : 'left';
  return dy < 0 ? 'down' : 'up';
}

function stopCountdown() {
  centerTimer.forEach(clearTimeout);
  centerTimer = [];
  countdown.hidden = true;
  countdown.textContent = '';
  cameraStatus.textContent = 'CAMERA / 01';
}

function startCountdown() {
  centerTimer = [
    setTimeout(() => { countdown.textContent = '3'; countdown.hidden = false; }, 550),
    setTimeout(() => { countdown.textContent = '2'; }, 1300),
    setTimeout(() => { countdown.textContent = '1'; }, 2050),
    setTimeout(() => { countdown.hidden = true; cameraStatus.innerHTML = '<i class="rec-dot"></i> REC'; }, 2800),
  ];
}

function render() {
  subject.style.left = `${position.x}%`;
  subject.style.top = `${position.y}%`;
  const next = signalFor(position);
  if (next !== currentSignal) {
    stopCountdown();
    currentSignal = next;
    if (next === 'center') startCountdown();
  }
  lights.forEach(light => light.classList.toggle('active', light.dataset.signal === next));
  device.setAttribute('aria-label', `FrameDot signal: ${labels[next]}`);
  stage.setAttribute('aria-label', `Drag the person or use arrow keys to reframe. Current FrameDot cue: ${labels[next]}. Press Home to center.`);
}

function setPosition(x, y) {
  position.x = clamp(x, 14, 86);
  position.y = clamp(y, 19, 81);
  render();
}

function stopAuto() {
  manual = true;
  cancelAnimationFrame(animation);
}

function updateFromPointer(event) {
  if (!drag) return;
  const rect = stage.getBoundingClientRect();
  setPosition(
    ((event.clientX - rect.left + drag.offsetX) / rect.width) * 100,
    ((event.clientY - rect.top + drag.offsetY) / rect.height) * 100,
  );
}

subject.addEventListener('pointerdown', event => {
  event.preventDefault();
  stopAuto();
  const rect = stage.getBoundingClientRect();
  drag = {
    offsetX: (position.x / 100) * rect.width - (event.clientX - rect.left),
    offsetY: (position.y / 100) * rect.height - (event.clientY - rect.top),
  };
  subject.setPointerCapture(event.pointerId);
  stage.focus();
});
subject.addEventListener('pointermove', event => { if (drag) updateFromPointer(event); });
subject.addEventListener('pointerup', event => { if (drag) updateFromPointer(event); drag = null; });
subject.addEventListener('pointercancel', () => { drag = null; });

stage.addEventListener('keydown', event => {
  const movement = {
    ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3],
  };
  if (event.key === 'Home') {
    event.preventDefault();
    stopAuto();
    setPosition(target.x, target.y);
  } else if (movement[event.key]) {
    event.preventDefault();
    stopAuto();
    const [dx, dy] = movement[event.key];
    setPosition(position.x + dx, position.y + dy);
  }
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setTimeout(() => {
    const start = performance.now();
    function animate(now) {
      if (manual) return;
      const progress = clamp((now - start) / 2600, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      setPosition(34 + (target.x - 34) * eased, target.y);
      if (progress < 1) animation = requestAnimationFrame(animate);
    }
    animation = requestAnimationFrame(animate);
  }, 1100);
}

signupForm.addEventListener('submit', async event => {
  event.preventDefault();
  formError.hidden = true;
  const button = signupForm.querySelector('button');
  const input = signupForm.querySelector('#email');
  const endpoint = 'https://formsubmit.co/ajax/d1a13b59ed1b38278af1b6b731630101';
  const data = new FormData(signupForm);
  button.disabled = true;
  input.disabled = true;
  button.firstChild.textContent = 'Joining…';
  try {
    if (data.get('_honey')) return;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: data.get('email'),
        _honey: data.get('_honey'),
        _subject: 'New FrameDot early-access signup',
        _captcha: 'false',
      }),
    });
    const result = await response.json();
    if (!response.ok || (result.success !== 'true' && result.success !== true))
      throw new Error('Couldn’t save your email. Please try again.');
    signupForm.hidden = true;
    signupSuccess.hidden = false;
  } catch (error) {
    formError.textContent = error.message || 'Something went wrong. Please try again.';
    formError.hidden = false;
  } finally {
    button.disabled = false;
    input.disabled = false;
    button.firstChild.textContent = 'Get early access';
  }
});
