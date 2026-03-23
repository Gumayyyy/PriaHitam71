let tasks = [];

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Notes page loaded, checking authentication...");
  if (window.auth) {
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User authenticated:", user.uid);
        await loadNotesData();
      } else {
        console.log("User not authenticated, loading from localStorage");
        await loadNotesData();
      }
    });
  } else {
    console.log("Firebase auth not initialized");
    await loadNotesData();
  }
  initNotesSections();
});

const loadNotesData = async () => {
  if (window.auth && window.db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const user = window.auth.currentUser;
      if (user) {
        console.log("Loading user data for user:", user.uid);
        const userDoc = await getDoc(doc(window.db, "userData", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data loaded:", userData);

          // Load tasks
          if (userData.tasks) {
            tasks = userData.tasks;
            console.log("Tasks loaded:", tasks);
            updateTasksList();
            updateStats();
          }

          // Load boost notes
          if (userData.boostNotes) {
            localStorage.setItem("boostNotes", JSON.stringify(userData.boostNotes));
            console.log("Boost notes loaded:", userData.boostNotes);
            // Show boost notes if they exist
            if (userData.boostNotes.length > 0) {
              boostListVisible = true;
              // Update button text after init
              setTimeout(() => {
                const toggleBtn = document.getElementById("toggleBoostBtn");
                if (toggleBtn) {
                  toggleBtn.textContent = "Hide Notes";
                  const list = document.getElementById("boostList");
                  if (list) {
                    list.classList.add("visible");
                    displayBoost();
                  }
                }
              }, 100);
            }
          }

          // Load mind notes
          if (userData.mindNotes) {
            localStorage.setItem("mindNotes", JSON.stringify(userData.mindNotes));
            console.log("Mind notes loaded:", userData.mindNotes);
            // Show mind notes if they exist
            if (userData.mindNotes.length > 0) {
              mindListVisible = true;
              // Update button text after init
              setTimeout(() => {
                const toggleBtn = document.getElementById("toggleMindBtn");
                if (toggleBtn) {
                  toggleBtn.textContent = "Hide Notes";
                  const list = document.getElementById("mindList");
                  if (list) {
                    list.classList.add("visible");
                    displayMind();
                  }
                }
              }, 100);
            }
          }

          return;
        } else {
          console.log("No user data document found");
        }
      } else {
        console.log("No authenticated user");
      }
    } catch (error) {
      console.error("Error loading from Firestore:", error);
    }
  } else {
    console.log("Firebase not initialized");
  }

  // Fallback to localStorage
  console.log("Falling back to localStorage");
  const storedTasks = JSON.parse(localStorage.getItem("tasks"));
  if (storedTasks) {
    storedTasks.forEach((task) => tasks.push(task));
    updateTasksList();
    updateStats();
  }

  // Check for boost notes in localStorage
  const boostNotes = JSON.parse(localStorage.getItem("boostNotes")) || [];
  if (boostNotes.length > 0) {
    boostListVisible = true;
    setTimeout(() => {
      const toggleBtn = document.getElementById("toggleBoostBtn");
      if (toggleBtn) {
        toggleBtn.textContent = "Hide Notes";
        const list = document.getElementById("boostList");
        if (list) {
          list.classList.add("visible");
          displayBoost();
        }
      }
    }, 100);
  }

  // Check for mind notes in localStorage
  const mindNotes = JSON.parse(localStorage.getItem("mindNotes")) || [];
  if (mindNotes.length > 0) {
    mindListVisible = true;
    setTimeout(() => {
      const toggleBtn = document.getElementById("toggleMindBtn");
      if (toggleBtn) {
        toggleBtn.textContent = "Hide Notes";
        const list = document.getElementById("mindList");
        if (list) {
          list.classList.add("visible");
          displayMind();
        }
      }
    }, 100);
  }
};

const saveTasks = async () => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  console.log("Tasks saved to localStorage:", tasks);

  // Save to Firestore if user is logged in
  if (window.auth && window.db) {
    try {
      const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const user = window.auth.currentUser;
      if (user) {
        // Get existing user data
        const userDoc = await getDoc(doc(window.db, "userData", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Update with new tasks and preserve other data
        await setDoc(doc(window.db, "userData", user.uid), {
          ...userData,
          tasks: tasks,
          lastUpdated: new Date()
        });
        console.log("Tasks saved to Firestore for user:", user.uid);
      }
    } catch (error) {
      console.error("Error saving tasks to Firestore:", error);
    }
  }
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

async function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  console.log(`${key} saved to localStorage:`, data);

  // Save to Firestore if user is logged in
  if (window.auth && window.db) {
    try {
      const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const user = window.auth.currentUser;
      if (user) {
        // Get existing user data
        const userDoc = await getDoc(doc(window.db, "userData", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Determine which field to update based on key
        const firestoreKey = key === "boostNotes" ? "boostNotes" : key === "mindNotes" ? "mindNotes" : key;

        // Update with new data and preserve other data
        await setDoc(doc(window.db, "userData", user.uid), {
          ...userData,
          [firestoreKey]: data,
          lastUpdated: new Date()
        });
        console.log(`${key} saved to Firestore for user:`, user.uid);
      }
    } catch (error) {
      console.error(`Error saving ${key} to Firestore:`, error);
    }
  }
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

async function saveBoost() {
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

  await saveData("boostNotes", notes);
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

async function deleteBoost(index) {
  const notes = getData("boostNotes");
  notes.splice(index, 1);
  await saveData("boostNotes", notes);
  displayBoost();
}

async function saveMind() {
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

  await saveData("mindNotes", notes);
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

async function deleteMind(index) {
  const notes = getData("mindNotes");
  notes.splice(index, 1);
  await saveData("mindNotes", notes);
  displayMind();
}
