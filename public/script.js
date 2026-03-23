const password = localStorage.getItem("password");

if (!password) {
    window.location.href = "login.html";
}

async function loadData() {
    const res = await fetch('/data', {
        headers: { password }
    });

    const data = await res.json();

    const list = document.getElementById('taskList');
    list.innerHTML = '';

    let done = 0;

    data.tasks.forEach((t, i) => {
        const li = document.createElement('li');

        if (data.today[i]) done++;

        li.textContent = t + (data.today[i] ? " ✅" : " ❌");

        li.onclick = async () => {
            await fetch('/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    password
                },
                body: JSON.stringify({ index: i })
            });
            loadData();
        };

        list.appendChild(li);
    });

    const percent = data.tasks.length === 0 ? 0 :
        Math.round((done / data.tasks.length) * 100);

    document.getElementById("scoreBox").innerText = percent + "%";

    drawChart(done, data.tasks.length);

    loadStreaks();
    loadHeatmap();
}

async function addTask() {
    const text = document.getElementById('taskInput').value;

    await fetch('/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            password
        },
        body: JSON.stringify({ text })
    });

    loadData();
}

setInterval(() => {
    document.getElementById("datetime").innerText =
        new Date().toLocaleString();
}, 1000);

function drawChart(done, total) {
    const ctx = document.getElementById('chart');

    if (window.chart) window.chart.destroy();

    window.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Done', 'Left'],
            datasets: [{
                data: [done, total - done]
            }]
        }
    });
}

// STREAK
async function loadStreaks() {
    const res = await fetch('/history', {
        headers: { password }
    });

    const history = await res.json();
    const box = document.getElementById("streaks");
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
        div.innerText = `Task ${i+1} 🔥 ${streak} days`;
        box.appendChild(div);
    }
}

// HEATMAP
async function loadHeatmap() {
    const res = await fetch('/history', {
        headers: { password }
    });

    const history = await res.json();
    const heatmap = document.getElementById("heatmap");
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

loadData();