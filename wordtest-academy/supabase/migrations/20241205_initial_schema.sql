-- Multi-Tenant SaaS Vocabulary Learning Platform Database Schema
-- Created: 2024-12-05

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Academies (학원)
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  footer_content TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_academies_status ON academies(status);

-- Users (사용자 - Super Admin, Academy Admin, Student)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'academy_admin', 'student')),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(username, academy_id)
);

CREATE INDEX idx_users_academy_role ON users(academy_id, role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Classes (반)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_academy ON classes(academy_id);

-- Student-Class Relationship (학생-반 관계)
CREATE TABLE student_classes (
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, class_id)
);

CREATE INDEX idx_student_classes_class ON student_classes(class_id);

-- =====================================================
-- CONTENT TABLES
-- =====================================================

-- Wordbooks (단어장)
CREATE TABLE wordbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  textbook_name TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wordbooks_academy ON wordbooks(academy_id);
CREATE INDEX idx_wordbooks_shared ON wordbooks(is_shared) WHERE is_shared = TRUE;

-- Words (단어)
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordbook_id UUID NOT NULL REFERENCES wordbooks(id) ON DELETE CASCADE,
  no INTEGER,
  textbook_name TEXT,
  major_unit TEXT,
  minor_unit TEXT,
  unit_name TEXT,
  number INTEGER,
  english TEXT NOT NULL,
  korean TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_words_wordbook ON words(wordbook_id);
CREATE INDEX idx_words_units ON words(wordbook_id, major_unit, minor_unit, number);

-- Listening Questions (듣기 문제)
CREATE TABLE listening_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  question_set_name TEXT NOT NULL,
  major_unit TEXT,
  minor_unit TEXT,
  question_number INTEGER,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  audio_source_type TEXT NOT NULL CHECK (audio_source_type IN ('online', 'tts', 'local')),
  audio_url TEXT,
  script TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listening_academy ON listening_questions(academy_id);
CREATE INDEX idx_listening_set ON listening_questions(academy_id, question_set_name);

-- =====================================================
-- CURRICULUM TABLES
-- =====================================================

-- Curriculums (커리큘럼 템플릿)
CREATE TABLE curriculums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_curriculums_academy ON curriculums(academy_id);

-- Curriculum Items (커리큘럼 항목)
CREATE TABLE curriculum_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_id UUID NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('wordbook', 'listening')),
  wordbook_id UUID REFERENCES wordbooks(id) ON DELETE CASCADE,
  listening_set_name TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('typing', 'sentence_ordering', 'multiple_choice')),
  words_per_day INTEGER,
  unit_per_day DECIMAL(3,1),
  time_limit_seconds INTEGER NOT NULL DEFAULT 20,
  pass_score INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_curriculum_items_curriculum ON curriculum_items(curriculum_id, sequence);

-- Student Curriculums (학생에게 할당된 커리큘럼)
CREATE TABLE student_curriculums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id UUID NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  study_days JSONB NOT NULL,
  vacation_periods JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_curriculums_student ON student_curriculums(student_id);

-- Daily Lessons (일일 학습)
CREATE TABLE daily_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_curriculum_id UUID NOT NULL REFERENCES student_curriculums(id) ON DELETE CASCADE,
  lesson_date DATE NOT NULL,
  curriculum_item_id UUID NOT NULL REFERENCES curriculum_items(id) ON DELETE CASCADE,
  wordbook_id UUID REFERENCES wordbooks(id),
  start_word_number INTEGER,
  end_word_number INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_daily_lessons_student_date ON daily_lessons(student_curriculum_id, lesson_date);
CREATE INDEX idx_daily_lessons_status ON daily_lessons(status, lesson_date);

-- =====================================================
-- TEST TABLES
-- =====================================================

-- Test Sessions (시험 세션)
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_lesson_id UUID NOT NULL REFERENCES daily_lessons(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('flashcard', 'primary', 'review', 'retest_primary', 'retest_review')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  primary_score INTEGER,
  review_score INTEGER
);

CREATE INDEX idx_test_sessions_student ON test_sessions(student_id);
CREATE INDEX idx_test_sessions_lesson ON test_sessions(daily_lesson_id);

-- Test Results (시험 결과)
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id),
  question_id UUID REFERENCES listening_questions(id),
  attempt_number INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  student_answer TEXT,
  time_taken INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_results_session ON test_results(test_session_id);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Notices (공지사항)
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'class')),
  target_class_ids JSONB,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notices_academy_dates ON notices(academy_id, start_date, end_date);

-- Messages (쪽지)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- =====================================================
-- REWARD SYSTEM
-- =====================================================

-- Dollar Transactions (달러 거래)
CREATE TABLE dollar_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('daily_completion', 'game', 'manual_add', 'manual_deduct')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dollar_transactions_student ON dollar_transactions(student_id);

-- Academy Settings (학원 설정)
CREATE TABLE academy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL UNIQUE REFERENCES academies(id) ON DELETE CASCADE,
  daily_completion_dollars INTEGER NOT NULL DEFAULT 10,
  game_dollars INTEGER NOT NULL DEFAULT 5,
  dictation_blank_percentage INTEGER NOT NULL DEFAULT 30,
  other_settings JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dollar_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_settings ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be implemented in the application layer
-- using Supabase service role key for admin operations
-- and regular client for student operations with proper filtering

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_academies_updated_at BEFORE UPDATE ON academies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wordbooks_updated_at BEFORE UPDATE ON wordbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_curriculums_updated_at BEFORE UPDATE ON curriculums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academy_settings_updated_at BEFORE UPDATE ON academy_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
