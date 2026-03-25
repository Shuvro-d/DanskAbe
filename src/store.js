const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "data.json");

function defaultData() {
  return {
    settings: {
      classCode: process.env.CLASS_CODE || "DANSK101",
      popupCountPerDay: 6,
      intervalMinutes: 60,
      enabledCategories: ["time", "day_of_week", "vocab", "phrases"],
      teacherPassword: process.env.TEACHER_PASSWORD || "teacher123",
      datasetVersion: 1,
    },
    nextQuestionId: 5,
    nextHistoryId: 1,
    questions: [
      {
        id: 1,
        category: "time",
        prompt: "Hvad er klokken?",
        answer: "Klokken er to.",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        category: "day_of_week",
        prompt: "Hvilken dag er det i dag?",
        answer: "Det er mandag.",
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        category: "vocab",
        prompt: "Translate: apple",
        answer: "aeble",
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        category: "phrases",
        prompt: "Hvordan siger man 'Good morning'?",
        answer: "Godmorgen",
        createdAt: new Date().toISOString(),
      },
    ],
    studentHistory: [],
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData(), null, 2), "utf8");
  }
}

function loadData() {
  ensureDataFile();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function withData(mutator) {
  const data = loadData();
  const result = mutator(data);
  saveData(data);
  return result;
}

module.exports = {
  loadData,
  withData,
};
