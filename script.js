const stage = document.querySelector('#camera-stage');
const subject = document.querySelector('#subject');
const device = document.querySelector('#device-location');
const lights = [...document.querySelectorAll('[data-signal]')];
const countdown = document.querySelector('#countdown');
const cameraStatus = document.querySelector('#camera-status');
const joinButton = document.querySelector('#join-button');
const joinCount = document.querySelector('#join-count');
const joinCountLabel = document.querySelector('#join-count-label');
const joinError = document.querySelector('#join-error');
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

const counterKey = location.hostname === 'localhost'
  ? 'framedot-waitlist-test-2026'
  : 'framedot-waitlist-v1';
const counterBase = `https://abacus.jasoncameron.dev`;
const counterPath = `vt-13.github.io/${counterKey}`;
const joinedKey = 'framedot-waitlist-joined-v1';

function hasJoined() {
  try { return localStorage.getItem(joinedKey) === '1'; }
  catch { return false; }
}

function markJoined() {
  try { localStorage.setItem(joinedKey, '1'); }
  catch { /* The count still works when browser storage is unavailable. */ }
}

function showJoined() {
  joinButton.disabled = true;
  joinButton.firstChild.textContent = 'You’re counted';
  joinButton.querySelector('span').textContent = '✓';
}

function showCount(value) {
  joinCount.textContent = value.toLocaleString();
  joinCountLabel.textContent = value === 1 ? 'person joined' : 'people joined';
}

async function loadCount() {
  try {
    const response = await fetch(`${counterBase}/get/${counterPath}`, { cache: 'no-store' });
    if (response.status === 404) {
      showCount(0);
      return;
    }
    if (!response.ok) throw new Error('Count unavailable');
    const result = await response.json();
    if (!Number.isSafeInteger(result.value) || result.value < 0) throw new Error('Invalid count');
    showCount(result.value);
  } catch {
    joinCount.textContent = '—';
  }
}

if (hasJoined()) showJoined();
loadCount();

joinButton.addEventListener('click', async () => {
  if (hasJoined()) {
    showJoined();
    return;
  }
  joinError.hidden = true;
  joinButton.disabled = true;
  joinButton.firstChild.textContent = 'Joining…';
  try {
    const response = await fetch(`${counterBase}/hit/${counterPath}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Couldn’t confirm your join. Please try again.');
    const result = await response.json();
    if (!Number.isSafeInteger(result.value) || result.value < 1)
      throw new Error('Couldn’t confirm your join. Please try again.');
    markJoined();
    showCount(result.value);
    showJoined();
  } catch (error) {
    joinError.textContent = error.message || 'Couldn’t confirm your join. Please try again.';
    joinError.hidden = false;
    joinButton.disabled = false;
    joinButton.firstChild.textContent = 'Join the waitlist';
  }
});
