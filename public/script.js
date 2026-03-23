const password = localStorage.getItem("password");

// Redirect if not logged in
if (!password) {
    window.location.href = "login.html";
}

// ================= LOAD MAIN DATA =================
async function loadData() {
    const res = await fetch('/data', {
        headers: { password }
    });

    if (res.status === 401) {
        window.location.href = "login.html";
        return;
    }

    const data = await res.json();

    const list = document.getElementById('taskList');
    list.innerHTML = '';

    let completed = 0;

    data.tasks.forEach((task, i) => {
        const done = data.today[i];

        if (done) completed++;

        const li = document.createElement('li');

        li.innerHTML = `
            <span onclick="toggleTask(${i})">
                ${task} ${done ? "✅" : "❌"}
            </span>
            <button onclick="deleteTask(${i})">❌</button>
        `;

        list.appendChild(li);
    });

    // DAILY SCORE
    const percent = data.tasks.length === 0 ? 0 :
        Math.round((completed / data.tasks.length) * 100);

    document.getElementById("scoreBox").innerText =
        percent + "%";

    drawChart(completed, data.tasks.length);

    loadStreaks();
    loadHeatmap();
}

// ================= ADD TASK =================
async function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();

    if (!text) return;

    await fetch('/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            password
        },
        body: JSON.stringify({ text })
    });

    input.value = "";
    loadData();
}

// ================= TOGGLE =================
async function toggleTask(i) {
    await fetch('/toggle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            password
        },
        body: JSON.stringify({ index: i })
    });

    loadData();
}

// ================= DELETE =================
async function deleteTask(i) {
    if (!confirm("Delete this task?")) return;

    await fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            password
        },
        body: JSON.stringify({ index: i })
    });

    loadData();
}

// ================= DATE & TIME =================
function updateDateTime() {
    const now = new Date();
    document.getElementById("datetime").innerText =
        now.toLocaleDateString() + " | " + now.toLocaleTimeString();
}

setInterval(updateDateTime, 1000);
updateDateTime();

// ================= GRAPH =================
function drawChart(done, total) {
    const ctx = document.getElementById('chart');

    if (window.chart) window.chart.destroy();

    window.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Done', 'Remaining'],
            datasets: [{
                data: [done, total - done]
            }]
        }
    });
}

// ================= STREAK =================
async function loadStreaks() {
    const res = await fetch('/history', {
        headers: { password }
    });

    const history = await res.json();
    const box = document.getElementById("streaks");

    if (!box) return;

    box.innerHTML = "";

    const dates = Object.keys(history).sort().reverse();

    if (dates.length === 0) return;

    const taskCount = history[dates[0]].length;

    for (let i = 0; i < taskCount; i++) {
        let streak = 0;

        for (let d of dates) {
            if (history[d][i]) streak++;
            else break;
        }

        const div = document.createElement("div");
        div.innerText = `Task ${i + 1} 🔥 ${streak} days`;
        box.appendChild(div);
    }
}

// ================= HEATMAP =================
async function loadHeatmap() {
    const res = await fetch('/history', {
        headers: { password }
    });

    const history = await res.json();
    const heatmap = document.getElementById("heatmap");

    if (!heatmap) return;

    heatmap.innerHTML = "";

    const dates = Object.keys(history).sort();

    dates.forEach(date => {
        const arr = history[date];

        const done = arr.filter(x => x).length;
        const total = arr.length;

        const percent = total === 0 ? 0 : done / total;

        const div = document.createElement("div");
        div.classList.add("day");

        if (percent === 0) div.classList.add("empty");
        else if (percent < 0.5) div.classList.add("low");
        else if (percent < 1) div.classList.add("medium");
        else div.classList.add("high");

        heatmap.appendChild(div);
    });
}

// ================= START =================
loadData();