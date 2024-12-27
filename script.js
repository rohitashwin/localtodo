/***********************************************
 * LOCAL STORAGE KEYS
 ***********************************************/
const OPEN_KEY = "openItems";
const CLOSED_KEY = "closedItems";

/***********************************************
 * DYNAMIC VARS
 ***********************************************/

let timerInterval = null;


/***********************************************
 * INITIALIZE ARRAYS FROM LOCAL STORAGE
 ***********************************************/
let openItems = JSON.parse(localStorage.getItem(OPEN_KEY)) || [
    "SUBJECT: sample task 1",
    "SUBJECT: sample task 2",
    "SUBJECT2: sample task 3"
];
let closedItems = JSON.parse(localStorage.getItem(CLOSED_KEY)) || [
    "SUBJECT: sample completed task 1",
    "SUBJECT2: sample completed task 2"
];

// References to Open and Closed lists
let mainHeading = document.getElementById("mainHeading");
const openList = document.getElementById("openList");
const closedList = document.getElementById("closedList");
const clearCompletedButton = document.getElementById("clearCompletedButton");
const clearAllButton = document.getElementById("clearAllButton");
const addButton = document.getElementById("addButton");
const timerHeading = document.getElementById("timerHeading");
const timerStartButton = document.getElementById("timerStartButton");
const timerStopButton = document.getElementById("timerStopButton");
const timerResetButton = document.getElementById("timerResetButton");

/***********************************************
 * SAVE TO LOCAL STORAGE
 ***********************************************/
function saveToLocalStorage() {
    localStorage.setItem(OPEN_KEY, JSON.stringify(openItems));
    localStorage.setItem(CLOSED_KEY, JSON.stringify(closedItems));
}

/***********************************************
 * RENDER FUNCTION
 ***********************************************/
function renderLists() {
    // Clear existing items
    openList.innerHTML = "";
    closedList.innerHTML = "";

    // Render Open items
    openItems.forEach((item, index) => {
        const li = createListItem(item, index, false); // false = not closed
        openList.appendChild(li);
    });

    // Render Closed items
    closedItems.forEach((item, index) => {
        const li = createListItem(item, index, true); // true = closed
        li.classList.add("closed");
        closedList.appendChild(li);
    });

    mainHeading.textContent = `todo list (${closedItems.length}/${openItems.length + closedItems.length
        })`;
}

/***********************************************
 * CREATE A LIST ITEM (<li>)
 ***********************************************/
function createListItem(text, index, isClosed) {
    const li = document.createElement("li");
    li.draggable = true; // Enable dragging
    li.dataset.index = index;

    // Add checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("checkbox");
    checkbox.checked = isClosed; // Checked if in the Closed list
    checkbox.addEventListener("change", handleCheckboxChange);

    // Add label for the task name
    const label = document.createElement("span");
    label.textContent = text;

    // the text is of the form "SUBJECT: task"
    // SUBJECT: should be bold
    let colonIndex = text.indexOf(":");
    let subject = text.substring(0, colonIndex + 1);
    let task = text.substring(colonIndex + 1);
    label.innerHTML = `<b >${subject}</b>${task}`;

    // Append checkbox and label to the list item
    li.appendChild(label);
    li.appendChild(checkbox);

    // Add drag-and-drop event listeners
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragenter", handleDragEnter);
    li.addEventListener("dragleave", handleDragLeave);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    return li;
}

/***********************************************
 * CHECKBOX CHANGE HANDLER
 ***********************************************/
function handleCheckboxChange(e) {
    const li = e.target.closest("li");
    const index = parseInt(li.dataset.index, 10);

    if (e.target.checked) {
        // Move item to Closed list
        const [movedItem] = openItems.splice(index, 1);
        closedItems.push(movedItem);
    } else {
        // Move item to Open list
        const [movedItem] = closedItems.splice(index, 1);
        openItems.push(movedItem);
    }

    // Save changes to localStorage
    saveToLocalStorage();

    // Re-render lists
    renderLists();
}

/***********************************************
 * DRAG-AND-DROP HANDLERS
 ***********************************************/
let dragStartIndex = null;
let dragStartList = null; // "openList" or "closedList"

function handleDragStart(e) {
    const li = e.target.closest("li");
    if (!li) return;

    dragStartIndex = parseInt(li.dataset.index, 10);
    dragStartList = li.closest("ul").id;

    e.dataTransfer.setData("text/plain", dragStartIndex);
    e.dataTransfer.effectAllowed = "move";

    // Visual feedback
    li.classList.add("dragging");
}

function handleDragEnter(e) {
    e.preventDefault();
    const li = e.target.closest("li");
    if (!li) return;
    // Only highlight if we’re in the same list
    const thisList = li.closest("ul").id;
    if (thisList === dragStartList) {
        li.classList.add("target");
    }
}

function handleDragLeave(e) {
    const li = e.target.closest("li");
    if (li) {
        li.classList.remove("target");
    }
}

function handleDragOver(e) {
    e.preventDefault(); // Must do this to allow drop
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log("Dropped!");

    const li = e.target.closest("li");
    if (!li) return; // if dropped outside any <li>

    // Remove highlight
    li.classList.remove("target");

    // Identify which list we’re dropping into
    const dropList = li.closest("ul").id;
    // If different from where we started, ignore
    if (dropList !== dragStartList) return;

    // Identify the drop index
    let dropIndex = parseInt(li.dataset.index, 10);
    if (isNaN(dropIndex)) return;

    // If dropIndex is the same, do nothing
    if (dropIndex === dragStartIndex) return;

    // Decide which array to reorder
    let arr = dropList === "openList" ? openItems : closedItems;

    // Manually reorder items in the array
    reorderItems(arr, dragStartIndex, dropIndex);

    // Save changes & re-render
    saveToLocalStorage();
    renderLists();
}

function handleDragEnd(e) {
    // Remove any drag-related classes
    document
        .querySelectorAll(".dragging, .target")
        .forEach((el) => el.classList.remove("dragging", "target"));

    // Reset
    dragStartIndex = null;
    dragStartList = null;
}

/***********************************************
 * MANUAL REORDER HELPER
 ***********************************************/
function reorderItems(arr, fromIndex, toIndex) {
    const item = arr[fromIndex];
    
    if (fromIndex < toIndex) {
        // Shift everything from (fromIndex + 1) up to toIndex UP by 1
        for (let i = fromIndex; i < toIndex; i++) {
            arr[i] = arr[i + 1];
        }
    } else {
        // Shift everything from (fromIndex - 1) down to toIndex DOWN by 1
        for (let i = fromIndex; i > toIndex; i--) {
            arr[i] = arr[i - 1];
        }
    }
    
    // Place the originally dragged item at the new index
    arr[toIndex] = item;
}

/***********************************************
 * CLEAR BUTTON CLICK HANDLER
 ***********************************************/

// clearButton.addEventListener("click", () => {
//     closedItems = [];
//     saveToLocalStorage();
//     renderLists();
// });

clearAllButton.addEventListener("click", () => {
    openItems = [];
    closedItems = [];
    saveToLocalStorage();
    renderLists();
});

clearCompletedButton.addEventListener("click", () => {
    closedItems = [];
    saveToLocalStorage();
    renderLists();
});

/***********************************************
 * ADD BUTTON CLICK HANDLER
 ***********************************************/

addButton.addEventListener("click", () => {
    const input = document.getElementById("newItem");
    const newItem = input.value.trim();
    if (newItem) {
        openItems.unshift(newItem); // Add to the beginning of the list
        saveToLocalStorage();
        renderLists();
        input.value = "";
    }
});

/***********************************************
 * INITIAL RENDER
 ***********************************************/
renderLists();

/***********************************************
 * TIMER FUNCTIONALITY
 ***********************************************/

let timerStart = null;
let timerRunning = false;
let elapsedTime = 0;

// Initialize timer display to 00:00:00.000
timerHeading.textContent = "00:00:00.000";

// create a renderer that is called every 100 ms
// it should update if the timer is running otherwise not
// each time, it should get the system time and compare against start time
// should display in the format HH:MM:SS:mmm
function renderTimer() {
    if (timerRunning) {
        let currentTime = new Date().getTime();
        let totalElapsedTime = elapsedTime + (currentTime - timerStart);
        let date = new Date(totalElapsedTime);
        let hours = String(date.getUTCHours()).padStart(2, '0');
        let minutes = String(date.getUTCMinutes()).padStart(2, '0');
        let seconds = String(date.getUTCSeconds()).padStart(2, '0');
        let milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
        timerHeading.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
}

// start button should start the timer
timerStartButton.addEventListener("click", () => {
    if (!timerRunning) {
        timerStart = new Date().getTime();
        timerRunning = true;
        timerInterval = setInterval(renderTimer, 29);
    }
});

// stop button should stop the timer
timerStopButton.addEventListener("click", () => {
    if (timerRunning) {
        timerRunning = false;
        elapsedTime += new Date().getTime() - timerStart;
        clearInterval(timerInterval);
    }
});

// reset button should reset the timer
timerResetButton.addEventListener("click", () => {
    timerRunning = false;
    clearInterval(timerInterval);
    elapsedTime = 0;
    timerHeading.textContent = "00:00:00.000";
});