let tasks = [];

document.addEventListener("DOMContentLoaded", () => {
  const storedTasks = JSON.parse(localStorage.getItem("tasks"));
  if (storedTasks) {
    storedTasks.forEach((task) => tasks.push(task));
    updateTasksList();
    updateStats();
  }

  initNotesSections();
});

const saveTasks = () => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

const addTask = () => {
  const taskInput = document.getElementById("taskInput");
  const text = taskInput.value.trim();

  if (text) {
    tasks.push({ text: text, completed: false });
    taskInput.value = "";
    updateTasksList();
    updateStats();
    saveTasks();
  }
};

const toggleTaskComplete = (index) => {
  tasks[index].completed = !tasks[index].completed;
  updateTasksList();
  updateStats();
  saveTasks();
};

const deleteTask = (index) => {
  tasks.splice(index, 1);
  updateTasksList();
  updateStats();
  saveTasks();
};

const editTask = (index) => {
  const taskInput = document.getElementById("taskInput");
  taskInput.value = tasks[index].text;

  tasks.splice(index, 1);
  updateTasksList();
  updateStats();
  saveTasks();
};

const updateStats = () => {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const progressBar = document.getElementById("progress");
  progressBar.style.width = `${progress}%`;

  document.getElementById("numbers").innerText =
    `${completedTasks}/${totalTasks}`;
};

const updateTasksList = () => {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const listItem = document.createElement("li");

    listItem.innerHTML = `
        <div class="taskItem">
            <div class="task ${task.completed ? "completed" : ""}">
            <input type="checkbox" class="checkbox" ${
              task.completed ? "checked" : ""
            }/>
            <p>${task.text}</p>
            </div>
            <div class="task-actions">
            <i class="fas fa-edit edit-icon" role="button" tabindex="0" aria-label="Edit task"></i>
            <i class="fa-solid fa-trash-can delete-icon" role="button" tabindex="0" aria-label="Delete task"></i>
            </div>
        </div>
        `;
    const checkbox = listItem.querySelector(".checkbox");
    const editIcon = listItem.querySelector(".edit-icon");
    const deleteIcon = listItem.querySelector(".delete-icon");

    checkbox.addEventListener("change", () => toggleTaskComplete(index));
    editIcon.addEventListener("click", () => editTask(index));
    deleteIcon.addEventListener("click", () => deleteTask(index));

    editIcon.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        editTask(index);
      }
    });

    deleteIcon.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        deleteTask(index);
      }
    });

    taskList.append(listItem);
  });
};

document.getElementById("newTask").addEventListener("click", function (e) {
  e.preventDefault();

  addTask();
});

// ===== Notes State =====
let editIndexBoost = null;
let editIndexMind = null;
let boostListVisible = false;
let mindListVisible = false;

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function initNotesSections() {
  const saveBoostBtn = document.getElementById("saveBoostBtn");
  const toggleBoostBtn = document.getElementById("toggleBoostBtn");
  const saveMindBtn = document.getElementById("saveMindBtn");
  const toggleMindBtn = document.getElementById("toggleMindBtn");

  if (saveBoostBtn) {
    saveBoostBtn.addEventListener("click", saveBoost);
  }

  if (toggleBoostBtn) {
    toggleBoostBtn.addEventListener("click", toggleBoost);
  }

  if (saveMindBtn) {
    saveMindBtn.addEventListener("click", saveMind);
  }

  if (toggleMindBtn) {
    toggleMindBtn.addEventListener("click", toggleMind);
  }
}

function renderNoteList(listElement, notes, onEdit, onDelete) {
  listElement.innerHTML = "";

  if (notes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "desc";
    empty.textContent = "No notes yet.";
    listElement.append(empty);
    return;
  }

  notes.forEach((note, index) => {
    const card = document.createElement("div");
    card.className = "note-card";

    const text = document.createElement("p");
    text.textContent = note;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "note-action-btn edit";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => onEdit(index));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "note-action-btn delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => onDelete(index));

    actions.append(editBtn, deleteBtn);
    card.append(text, actions);
    listElement.append(card);
  });
}

function saveBoost() {
  const input = document.getElementById("boostInput");
  const notes = getData("boostNotes");
  const text = input.value.trim();

  if (!text) {
    return;
  }

  if (editIndexBoost !== null) {
    notes[editIndexBoost] = text;
  } else {
    notes.push(text);
  }

  saveData("boostNotes", notes);
  input.value = "";
  editIndexBoost = null;

  if (boostListVisible) {
    displayBoost();
  }
}

function toggleBoost() {
  boostListVisible = !boostListVisible;
  const list = document.getElementById("boostList");
  const toggleBtn = document.getElementById("toggleBoostBtn");

  if (boostListVisible) {
    list.classList.add("visible");
    toggleBtn.textContent = "Hide Notes";
    displayBoost();
  } else {
    list.classList.remove("visible");
    toggleBtn.textContent = "View Notes";
  }
}

function displayBoost() {
  const list = document.getElementById("boostList");
  const notes = getData("boostNotes");
  renderNoteList(list, notes, editBoost, deleteBoost);
}

function editBoost(index) {
  const notes = getData("boostNotes");
  const input = document.getElementById("boostInput");
  input.value = notes[index];
  editIndexBoost = index;
  input.focus();
}

function deleteBoost(index) {
  const notes = getData("boostNotes");
  notes.splice(index, 1);
  saveData("boostNotes", notes);
  displayBoost();
}

function saveMind() {
  const input = document.getElementById("mindInput");
  const notes = getData("mindNotes");
  const text = input.value.trim();

  if (!text) {
    return;
  }

  if (editIndexMind !== null) {
    notes[editIndexMind] = text;
  } else {
    notes.push(text);
  }

  saveData("mindNotes", notes);
  input.value = "";
  editIndexMind = null;

  if (mindListVisible) {
    displayMind();
  }
}

function toggleMind() {
  mindListVisible = !mindListVisible;
  const list = document.getElementById("mindList");
  const toggleBtn = document.getElementById("toggleMindBtn");

  if (mindListVisible) {
    list.classList.add("visible");
    toggleBtn.textContent = "Hide Notes";
    displayMind();
  } else {
    list.classList.remove("visible");
    toggleBtn.textContent = "View Notes";
  }
}

function displayMind() {
  const list = document.getElementById("mindList");
  const notes = getData("mindNotes");
  renderNoteList(list, notes, editMind, deleteMind);
}

function editMind(index) {
  const notes = getData("mindNotes");
  const input = document.getElementById("mindInput");
  input.value = notes[index];
  editIndexMind = index;
  input.focus();
}

function deleteMind(index) {
  const notes = getData("mindNotes");
  notes.splice(index, 1);
  saveData("mindNotes", notes);
  displayMind();
}
