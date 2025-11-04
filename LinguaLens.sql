CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255),
    contact_number VARCHAR(20),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE extracted_texts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255),
        text_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE tts_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    text_content TEXT NOT NULL,
    engine_used VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE image_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    extracted_text TEXT,
    objects_json JSON,
    image_description TEXT,
    ocr_engine VARCHAR(50),
    detection_engine VARCHAR(50),
    processing_time VARCHAR(20),
    language_used VARCHAR(100),
    confidence_score DECIMAL(5,2),
    analysis_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);