// To-Do list: all state lives in the `tasks` array.
// Every change updates the array, saves it, then render() rebuilds the page from it.

const STORAGE_KEY = 'tasks';

const form = document.getElementById('form');
const input = document.getElementById('text');
const errorBox = document.getElementById('error');
const filtersBox = document.getElementById('filters');
const list = document.getElementById('list');
const emptyMsg = document.getElementById('empty');
const countEl = document.getElementById('count');
const clearBtn = document.getElementById('clear');

let tasks = load();       // [{ id, text, done }]
let filter = 'all';       // 'all' | 'active' | 'done'
let lastAddedId = null;   // used only to animate a freshly added task

// ---------- Storage ----------

// localStorage only stores text, so tasks go in and out as JSON.
// If the stored value is missing, damaged or not an array, start with an empty list.
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    return data
      .filter(t => t && typeof t.text === 'string' && Number.isFinite(t.id))
      .map(t => ({ id: t.id, text: t.text, done: Boolean(t.done) }));
  } catch (err) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    // Storage can be blocked (private mode, full disk). The app keeps working for this visit.
  }
}

// ---------- Rendering ----------

function visibleTasks() {
  if (filter === 'active') return tasks.filter(t => !t.done);
  if (filter === 'done') return tasks.filter(t => t.done);
  return tasks;
}

function render() {
  const items = visibleTasks();
  list.replaceChildren();

  items.forEach(t => {
    const li = document.createElement('li');
    li.className = 'item' + (t.done ? ' done' : '') + (t.id === lastAddedId ? ' new' : '');
    li.dataset.id = t.id;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = 'task-' + t.id;
    box.checked = t.done;
    box.dataset.action = 'toggle';

    const label = document.createElement('label');
    label.htmlFor = box.id;
    label.textContent = t.text; // textContent, never innerHTML: user text can't inject code

    const del = document.createElement('button');
    del.type = 'button';
    del.dataset.action = 'delete';
    del.textContent = '\u00d7';
    del.setAttribute('aria-label', 'Delete task: ' + t.text);

    li.append(box, label, del);
    list.append(li);
  });

  const left = tasks.filter(t => !t.done).length;
  countEl.textContent = left + (left === 1 ? ' task left' : ' tasks left');
  clearBtn.disabled = !tasks.some(t => t.done);

  if (tasks.length === 0) {
    emptyMsg.textContent = 'Nothing here yet. Add your first task above.';
  } else if (items.length === 0) {
    emptyMsg.textContent = filter === 'done' ? 'No completed tasks yet.' : 'All caught up!';
  }
  emptyMsg.hidden = items.length > 0;

  filtersBox.querySelectorAll('button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
  });
}

function commit() {
  save();
  render();
}

// ---------- Actions ----------

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
}

function addTask(text) {
  const nextId = Math.max(Date.now(), ...tasks.map(t => t.id + 1));
  lastAddedId = nextId;
  tasks.push({ id: nextId, text, done: false });
  filter = filter === 'done' ? 'all' : filter; // make sure the new task is visible
}

// ---------- Events ----------

// Add button click and the Enter key both fire the form's submit event
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) {
    showError('Please type a task first.');
    input.focus();
    return;
  }
  hideError();
  addTask(text);
  input.value = '';
  commit();
  input.focus();
});

input.addEventListener('input', hideError);
input.addEventListener('keydown', e => {
  if (e.key === 'Escape') { input.value = ''; hideError(); }
});

// One click listener on the list handles every checkbox and delete button (event delegation)
list.addEventListener('click', e => {
  const control = e.target.closest('[data-action]');
  if (!control) return;
  const id = Number(control.closest('li').dataset.id);
  lastAddedId = null;

  if (control.dataset.action === 'toggle') {
    tasks = tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t));
    commit();
    const again = document.getElementById('task-' + id);
    if (again) again.focus(); // keep keyboard focus after the list is rebuilt
  } else if (control.dataset.action === 'delete') {
    tasks = tasks.filter(t => t.id !== id);
    commit();
    input.focus();
  }
});

filtersBox.addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  lastAddedId = null;
  render();
});

clearBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  lastAddedId = null;
  commit();
});

// ---------- Start ----------

document.getElementById('date').textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long'
});
render();
