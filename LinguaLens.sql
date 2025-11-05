
-- Create database
CREATE DATABASE IF NOT EXISTS lingualens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE lingualens;

-- ========================================
-- Table structure for table users
-- ========================================
CREATE TABLE users (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  profile_photo varchar(255) DEFAULT NULL,
  contact_number varchar(20) DEFAULT NULL,
  address varchar(255) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================
-- Table structure for table extracted_texts
-- ========================================
CREATE TABLE extracted_texts (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) DEFAULT NULL,
  filename varchar(255) DEFAULT NULL,
  text_content text DEFAULT NULL,
  translated_text text DEFAULT NULL,
  source_language varchar(10) DEFAULT NULL,
  target_language varchar(10) DEFAULT NULL,
  confidence_score decimal(5,2) DEFAULT NULL,
  processing_time varchar(20) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  CONSTRAINT extracted_texts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================
-- Table structure for table tts_history
-- ========================================
CREATE TABLE tts_history (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) NOT NULL,
  text_content text NOT NULL,
  engine_used varchar(50) NOT NULL,
  language_used varchar(10) DEFAULT NULL,
  voice_speed decimal(3,1) DEFAULT 1.0,
  audio_file_path varchar(255) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT tts_history_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================
-- Table structure for table image_analysis
-- ========================================
CREATE TABLE image_analysis (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) DEFAULT NULL,
  filename varchar(255) NOT NULL,
  extracted_text text DEFAULT NULL,
  objects_json longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(objects_json)),
  image_description text DEFAULT NULL,
  ocr_engine varchar(50) DEFAULT NULL,
  detection_engine varchar(50) DEFAULT NULL,
  processing_time varchar(20) DEFAULT NULL,
  language_used varchar(100) DEFAULT NULL,
  confidence_score decimal(5,2) DEFAULT NULL,
  analysis_type varchar(20) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT image_analysis_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================
-- Table structure for table image_analysis_translator
-- ========================================
CREATE TABLE image_analysis_translator (
  id int(11) NOT NULL AUTO_INCREMENT,
  user_id int(11) DEFAULT NULL,
  filename varchar(255) NOT NULL,
  extracted_text text DEFAULT NULL,
  translated_text text DEFAULT NULL,
  objects_json longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(objects_json)),
  source_language varchar(10) DEFAULT NULL,
  target_language varchar(10) DEFAULT NULL,
  processing_time varchar(20) DEFAULT NULL,
  confidence_score decimal(5,2) DEFAULT NULL,
  analysis_type varchar(20) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT image_analysis_translator_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
