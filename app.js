// ---------- State ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

let tasks = store.get("fd-tasks", []);
let filter = "all";
let activeId = null;
let total = 25 * 60, left = total, timerId = null;
const today = new Date().toDateString();
let stats = store.get("fd-stats", { day: today, done: 0 });
if (stats.day !== today) stats = { day: today, done: 0 };

// ---------- Elements ----------
const $ = (id) => document.getElementById(id);
const list = $("list"), empty = $("empty"), clock = $("clock"), ring = $("ring");
const startBtn = $("start"), current = $("current");

// ---------- Tasks ----------
function save() { store.set("fd-tasks", tasks); }

function render() {
  list.innerHTML = "";
  const shown = tasks.filter(t =>
    filter === "all" || (filter === "done" ? t.done : !t.done));
  empty.hidden = shown.length > 0;

  shown.forEach(t => {
    const li = document.createElement("li");
    if (t.done) li.classList.add("done");
    if (t.id === activeId) li.classList.add("active");

    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = t.done;
    cb.setAttribute("aria-label", "Mark done: " + t.text);
    cb.onchange = () => { t.done = cb.checked; if (t.done && t.id === activeId) setActive(null); save(); render(); };

    const span = document.createElement("span");
    span.className = "t"; span.textContent = t.text;

    const focus = document.createElement("button");
    focus.textContent = t.id === activeId ? "Selected" : "Focus";
    focus.onclick = () => setActive(t.id);
    focus.disabled = t.done;

    const del = document.createElement("button");
    del.className = "del"; del.textContent = "Delete";
    del.onclick = () => {
      tasks = tasks.filter(x => x.id !== t.id);
      if (activeId === t.id) setActive(null);
      save(); render();
    };

    li.append(cb, span, focus, del);
    list.appendChild(li);
  });
}

function setActive(id) {
  activeId = id;
  const t = tasks.find(x => x.id === id);
  current.textContent = t ? "Working on: " + t.text : "No task selected";
  render();
}

$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("input").value.trim();
  if (!text) return;
  tasks.unshift({ id: Date.now(), text, done: false });
  $("input").value = "";
  save(); render();
});

document.querySelectorAll(".f").forEach(b => b.onclick = () => {
  filter = b.dataset.f;
  document.querySelectorAll(".f").forEach(x => x.classList.toggle("on", x === b));
  render();
});

// ---------- Timer ----------
function draw() {
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  clock.textContent = `${m}:${s}`;
  ring.style.setProperty("--p", ((total - left) / total) * 100);
  document.title = timerId ? `${m}:${s} – Focus Desk` : "Focus Desk – tasks and a focus timer";
}

function stop() { clearInterval(timerId); timerId = null; startBtn.textContent = "Start"; }

function tick() {
  left--;
  if (left <= 0) {
    left = 0; stop(); draw();
    if (total === 25 * 60) { stats.done++; store.set("fd-stats", stats); $("done").textContent = stats.done; }
    alert("Session finished!");
    return;
  }
  draw();
}

startBtn.onclick = () => {
  if (timerId) { stop(); draw(); return; }
  if (left === 0) left = total;
  timerId = setInterval(tick, 1000);
  startBtn.textContent = "Pause";
};

$("reset").onclick = () => { stop(); left = total; draw(); };

document.querySelectorAll(".mode").forEach(b => b.onclick = () => {
  stop();
  total = left = Number(b.dataset.min) * 60;
  document.querySelectorAll(".mode").forEach(x => x.classList.toggle("on", x === b));
  draw();
});

// ---------- Init ----------
$("done").textContent = stats.done;
draw(); render();
