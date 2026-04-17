-- Cleanup existing tables for a fresh start
DROP TABLE IF EXISTS leaderboard;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS attempts;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'student')) DEFAULT 'student',
    profile_photo TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    schedule_start TEXT NOT NULL,
    schedule_end TEXT NOT NULL,
    passing_score INTEGER NOT NULL,
    status TEXT CHECK(status IN ('draft', 'published')) DEFAULT 'draft',
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('MCQ', 'SHORT_ANSWER', 'CODING')) NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT,
    correct_answer TEXT,
    marks INTEGER NOT NULL,
    explanation TEXT,
    coding_language TEXT,
    test_cases TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    exam_id TEXT REFERENCES exams(id),
    start_time TEXT DEFAULT CURRENT_TIMESTAMP,
    end_time TEXT,
    status TEXT CHECK(status IN ('in-progress', 'completed', 'cancelled')) DEFAULT 'in-progress',
    auto_submit_flag INTEGER DEFAULT 0, -- 0 for false, 1 for true
    score INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT REFERENCES attempts(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES questions(id),
    response TEXT,
    correctness INTEGER, -- 0 or 1
    marks_earned INTEGER DEFAULT 0,
    last_saved TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

-- Leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
    exam_id TEXT REFERENCES exams(id),
    user_id TEXT REFERENCES users(id),
    score INTEGER,
    time_taken INTEGER,
    submission_time TEXT,
    rank INTEGER,
    PRIMARY KEY (exam_id, user_id)
);
