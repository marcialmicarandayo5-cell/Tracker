const STORAGE_KEY = "habit-tracker-v1";
const WEEKS = 12;

let habits = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// Dates are stored as local "YYYY-MM-DD" strings
function key(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function currentStreak(habit) {
  let day = startOfToday();
  // If today isn't done yet, the streak is still alive from yesterday
  if (!habit.days[key(day)]) day = addDays(day, -1);
  let count = 0;
  while (habit.days[key(day)]) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

function toggle(habit, dateKey) {
  if (habit.days[dateKey]) delete habit.days[dateKey];
  else habit.days[dateKey] = true;
  save();
  render();
}

function buildGrid(habit) {
  const today = startOfToday();
  const todayKey = key(today);
  // Monday = 0 ... Sunday = 6
  const weekday = (today.getDay() + 6) % 7;
  const start = addDays(today, -(weekday + (WEEKS - 1) * 7));

  const grid = document.createElement("div");
  grid.className = "grid";

  for (let i = 0; i < WEEKS * 7; i++) {
    const date = addDays(start, i);
    const k = key(date);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.title = date.toDateString();
    cell.setAttribute("aria-label", `${habit.name}, ${date.toDateString()}`);

    if (date > today) {
      cell.classList.add("future");
      cell.disabled = true;
    } else {
      if (habit.days[k]) cell.classList.add("done");
      if (k === todayKey) cell.classList.add("today");
      cell.setAttribute("aria-pressed", Boolean(habit.days[k]));
      cell.addEventListener("click", () => toggle(habit, k));
    }
    grid.appendChild(cell);
  }
  return grid;
}

function buildHabit(habit) {
  const todayKey = key(startOfToday());
  const doneToday = Boolean(habit.days[todayKey]);

  const card = document.createElement("article");
  card.className = "habit";

  const top = document.createElement("div");
  top.className = "habit-top";

  const name = document.createElement("h2");
  name.className = "habit-name";
  name.textContent = habit.name;

  const streak = document.createElement("span");
  streak.className = "streak";
  const n = currentStreak(habit);
  streak.textContent = `${n} day${n === 1 ? "" : "s"} streak`;

  const check = document.createElement("button");
  check.type = "button";
  check.className = "check";
  check.setAttribute("aria-pressed", doneToday);
  check.textContent = doneToday ? "Done today" : "Mark done";
  check.addEventListener("click", () => toggle(habit, todayKey));

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete";
  del.textContent = "Delete";
  del.setAttribute("aria-label", `Delete ${habit.name}`);
  del.addEventListener("click", () => {
    if (confirm(`Delete "${habit.name}" and its history?`)) {
      habits = habits.filter((h) => h.id !== habit.id);
      save();
      render();
    }
  });

  top.append(name, streak, check, del);

  const wrap = document.createElement("div");
  wrap.className = "grid-wrap";
  wrap.appendChild(buildGrid(habit));

  card.append(top, wrap);
  return card;
}

function render() {
  const list = document.getElementById("habits");
  list.replaceChildren(...habits.map(buildHabit));
  document.getElementById("empty").hidden = habits.length > 0;
}

document.getElementById("add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("habit-name");
  const name = input.value.trim();
  if (!name) return;
  habits.push({ id: Date.now().toString(), name, days: {} });
  input.value = "";
  save();
  render();
});

document.getElementById("today-label").textContent =
  new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

render();
