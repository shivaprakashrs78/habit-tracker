const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const FILE = 'data.json';
const PASSWORD = "shiva"; // change if needed

// Read data
function readData() {
    if (!fs.existsSync(FILE)) {
        return { tasks: [], history: {} };
    }
    return JSON.parse(fs.readFileSync(FILE));
}

// Write data
function writeData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// LOGIN
app.post('/login', (req, res) => {
    if (req.body.password === PASSWORD) res.sendStatus(200);
    else res.status(401).send("Wrong password");
});

// AUTH
function checkAuth(req, res, next) {
    if (req.headers.password === PASSWORD) next();
    else res.status(401).send("Unauthorized");
}

// GET DATA (AUTO FILL MISSING DAYS 🔥)
app.get('/data', checkAuth, (req, res) => {
    const data = readData();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const dates = Object.keys(data.history).sort();

    let lastDate = dates.length > 0
        ? new Date(dates[dates.length - 1])
        : null;

    if (!lastDate) {
        // first use
        data.history[todayStr] = new Array(data.tasks.length).fill(false);
    } else {
        let d = new Date(lastDate);
        d.setDate(d.getDate() + 1);

        while (d <= today) {
            const dStr = d.toISOString().split('T')[0];

            if (!data.history[dStr]) {
                data.history[dStr] = new Array(data.tasks.length).fill(false);
            }

            d.setDate(d.getDate() + 1);
        }
    }

    writeData(data);

    res.json({
        tasks: data.tasks,
        today: data.history[todayStr]
    });
});

// ADD TASK
app.post('/add', checkAuth, (req, res) => {
    const data = readData();
    data.tasks.push(req.body.text);

    // update all past days
    for (let d in data.history) {
        data.history[d].push(false);
    }

    writeData(data);
    res.sendStatus(200);
});

// TOGGLE TASK
app.post('/toggle', checkAuth, (req, res) => {
    const data = readData();
    const todayStr = new Date().toISOString().split('T')[0];

    data.history[todayStr][req.body.index] =
        !data.history[todayStr][req.body.index];

    writeData(data);
    res.sendStatus(200);
});

// HISTORY (for streak + heatmap)
app.get('/history', checkAuth, (req, res) => {
    const data = readData();
    res.json(data.history);
});

// PORT (for Render deployment)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Running on port " + PORT);
});

app.post('/delete', checkAuth, (req, res) => {
    const data = readData();
    const index = req.body.index;

    // remove from tasks
    data.tasks.splice(index, 1);

    // remove from all history
    for (let d in data.history) {
        data.history[d].splice(index, 1);
    }

    writeData(data);
    res.sendStatus(200);
});