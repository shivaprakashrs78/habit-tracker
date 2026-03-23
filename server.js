const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const FILE = 'data.json';
const PASSWORD = "shivaprakash";

function readData() {
    if (!fs.existsSync(FILE)) {
        return { tasks: [], history: {} };
    }
    return JSON.parse(fs.readFileSync(FILE));
}

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

// GET DATA
app.get('/data', checkAuth, (req, res) => {
    const data = readData();
    const today = new Date().toISOString().split('T')[0];

    if (!data.history[today]) {
        data.history[today] = new Array(data.tasks.length).fill(false);
        writeData(data);
    }

    res.json({ tasks: data.tasks, today: data.history[today] });
});

// ADD TASK
app.post('/add', checkAuth, (req, res) => {
    const data = readData();
    data.tasks.push(req.body.text);

    for (let d in data.history) {
        data.history[d].push(false);
    }

    writeData(data);
    res.sendStatus(200);
});

// TOGGLE
app.post('/toggle', checkAuth, (req, res) => {
    const data = readData();
    const today = new Date().toISOString().split('T')[0];

    data.history[today][req.body.index] =
        !data.history[today][req.body.index];

    writeData(data);
    res.sendStatus(200);
});

// HISTORY
app.get('/history', checkAuth, (req, res) => {
    const data = readData();
    res.json(data.history);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
    console.log(`Running on port ${PORT}`)
);