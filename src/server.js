const path = require("path");
const express = require("express");
const session = require("express-session");
const { loadData, withData } = require("./store");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(process.cwd(), "public")));

function nowIso() {
  return new Date().toISOString();
}

function dateKey(isoString) {
  return new Date(isoString).toDateString();
}

function getSettings() {
  return loadData().settings;
}

function requireTeacher(req, res, next) {
  if (!req.session || !req.session.isTeacher) {
    return res.status(401).json({ error: "Teacher auth required" });
  }
  return next();
}

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/api/public-config", (_, res) => {
  const settings = getSettings();
  res.json({
    popupCountPerDay: settings.popupCountPerDay,
    intervalMinutes: settings.intervalMinutes,
    datasetVersion: settings.datasetVersion,
  });
});

app.get("/api/student/question-bank", (req, res) => {
  const { classCode } = req.query;
  if (!classCode) {
    return res.status(400).json({ error: "classCode is required" });
  }

  const data = loadData();
  if (classCode !== data.settings.classCode) {
    return res.status(403).json({ error: "Invalid class code" });
  }

  const questions = data.questions.filter((q) =>
    data.settings.enabledCategories.includes(q.category)
  );

  return res.json({ datasetVersion: data.settings.datasetVersion, questions });
});

app.post("/api/student/join", (req, res) => {
  const { classCode } = req.body || {};
  if (!classCode) {
    return res.status(400).json({ error: "Class code is required" });
  }

  const settings = getSettings();
  if (classCode !== settings.classCode) {
    return res.status(403).json({ error: "Invalid class code" });
  }

  return res.json({ ok: true });
});

app.post("/api/teacher/login", (req, res) => {
  const { password } = req.body || {};
  const settings = getSettings();

  if (!password || password !== settings.teacherPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  req.session.isTeacher = true;
  return res.json({ ok: true });
});

app.post("/api/teacher/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/teacher/settings", requireTeacher, (_, res) => {
  const settings = getSettings();
  res.json(settings);
});

app.put("/api/teacher/settings", requireTeacher, (req, res) => {
  const { classCode, popupCountPerDay, intervalMinutes, enabledCategories } = req.body || {};

  if (!classCode || !Array.isArray(enabledCategories)) {
    return res.status(400).json({ error: "classCode and enabledCategories are required" });
  }

  withData((data) => {
    data.settings.classCode = classCode;
    data.settings.popupCountPerDay = Number(popupCountPerDay) || 1;
    data.settings.intervalMinutes = Number(intervalMinutes) || 5;
    data.settings.enabledCategories = enabledCategories;
    data.settings.datasetVersion += 1;
  });

  res.json({ ok: true });
});

app.get("/api/teacher/questions", requireTeacher, (_, res) => {
  const data = loadData();
  const rows = [...data.questions].sort((a, b) => b.id - a.id);
  res.json(rows);
});

app.post("/api/teacher/questions", requireTeacher, (req, res) => {
  const { category, prompt, answer } = req.body || {};
  if (!category || !prompt || !answer) {
    return res.status(400).json({ error: "category, prompt, answer are required" });
  }

  const created = withData((data) => {
    const item = {
      id: data.nextQuestionId,
      category,
      prompt,
      answer,
      createdAt: nowIso(),
    };
    data.nextQuestionId += 1;
    data.questions.push(item);
    data.settings.datasetVersion += 1;
    return item;
  });

  res.json({ id: created.id });
});

app.delete("/api/teacher/questions/:id", requireTeacher, (req, res) => {
  const questionId = Number(req.params.id);
  withData((data) => {
    data.questions = data.questions.filter((q) => q.id !== questionId);
    data.settings.datasetVersion += 1;
  });
  res.json({ ok: true });
});

app.get("/api/student/next-question", (req, res) => {
  const { classCode, deviceId } = req.query;
  if (!classCode || !deviceId) {
    return res.status(400).json({ error: "classCode and deviceId are required" });
  }

  const data = loadData();
  if (classCode !== data.settings.classCode) {
    return res.status(403).json({ error: "Invalid class code" });
  }

  const enabled = data.questions.filter((q) =>
    data.settings.enabledCategories.includes(q.category)
  );

  if (!enabled.length) {
    return res.status(404).json({ error: "No categories enabled" });
  }

  const today = new Date().toDateString();
  const counts = {};
  for (const h of data.studentHistory) {
    if (h.deviceId !== deviceId) continue;
    if (h.datasetVersion !== data.settings.datasetVersion) continue;
    if (dateKey(h.shownAt) !== today) continue;
    counts[h.questionId] = (counts[h.questionId] || 0) + 1;
  }

  const available = enabled.filter((q) => (counts[q.id] || 0) < 2);
  if (!available.length) {
    return res.status(404).json({ error: "No questions available for today" });
  }

  const unseen = available.filter((q) => (counts[q.id] || 0) === 0);
  const pool = unseen.length ? unseen : available;
  const question = pool[Math.floor(Math.random() * pool.length)];

  withData((latest) => {
    latest.studentHistory.push({
      id: latest.nextHistoryId,
      deviceId,
      questionId: question.id,
      shownAt: nowIso(),
      datasetVersion: latest.settings.datasetVersion,
      correct: null,
    });
    latest.nextHistoryId += 1;
  });

  return res.json({
    id: question.id,
    category: question.category,
    prompt: question.prompt,
    answer: question.answer,
  });
});

app.post("/api/student/answer", (req, res) => {
  const { deviceId, questionId, correct } = req.body || {};
  if (!deviceId || !questionId) {
    return res.status(400).json({ error: "deviceId and questionId are required" });
  }

  withData((data) => {
    for (let i = data.studentHistory.length - 1; i >= 0; i -= 1) {
      const row = data.studentHistory[i];
      if (row.deviceId === deviceId && row.questionId === Number(questionId)) {
        row.correct = Boolean(correct);
        break;
      }
    }
  });

  return res.json({ ok: true });
});

app.get("/api/teacher/stats", requireTeacher, (_, res) => {
  const data = loadData();
  const map = {};

  for (const q of data.questions) {
    if (!map[q.category]) {
      map[q.category] = { category: q.category, shown: 0, correct: 0 };
    }
  }

  for (const row of data.studentHistory) {
    const q = data.questions.find((item) => item.id === row.questionId);
    if (!q) continue;
    if (!map[q.category]) {
      map[q.category] = { category: q.category, shown: 0, correct: 0 };
    }
    map[q.category].shown += 1;
    if (row.correct === true) {
      map[q.category].correct += 1;
    }
  }

  res.json(Object.values(map).sort((a, b) => a.category.localeCompare(b.category)));
});

app.listen(PORT, () => {
  console.log(`DanskAbe prototype running on http://localhost:${PORT}`);
});
