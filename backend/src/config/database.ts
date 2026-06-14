import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

let pool: mysql.Pool;

const createDatabase = async () => {
  const tempPool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  });

  const conn = await tempPool.getConnection();
  try {
    await conn.execute('CREATE DATABASE IF NOT EXISTS customer_service DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  } finally {
    conn.release();
    await tempPool.end();
  }
};

const initTables = async () => {
  await createDatabase();

  pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'customer_service',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+08:00'
  });

  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        status ENUM('online', 'offline', 'busy') DEFAULT 'offline',
        last_online_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        visitor_id VARCHAR(100) NOT NULL,
        admin_id INT NULL,
        status ENUM('waiting', 'active', 'ended') DEFAULT 'waiting',
        started_at DATETIME NULL,
        ended_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_visitor_id (visitor_id),
        INDEX idx_admin_id (admin_id),
        INDEX idx_status (status),
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        sender_type ENUM('visitor', 'admin') NOT NULL,
        content TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_id (session_id),
        INDEX idx_is_read (is_read),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quick_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        category ENUM('greeting', 'faq', 'closing', 'custom') DEFAULT 'custom',
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_admin_id (admin_id),
        INDEX idx_category (category),
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL UNIQUE,
        admin_id INT NULL,
        visitor_id VARCHAR(100) NOT NULL,
        score ENUM('satisfied', 'neutral', 'dissatisfied') NOT NULL,
        feedback TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_id (session_id),
        INDEX idx_admin_id (admin_id),
        INDEX idx_score (score),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category ENUM('technical', 'billing', 'product', 'account', 'other') DEFAULT 'other',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        status ENUM('pending', 'processing', 'resolved', 'closed') DEFAULT 'pending',
        visitor_id VARCHAR(100) NOT NULL,
        session_id INT NULL,
        admin_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at DATETIME NULL,
        closed_at DATETIME NULL,
        INDEX idx_visitor_id (visitor_id),
        INDEX idx_admin_id (admin_id),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_category (category),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const hashedPassword = bcrypt.hashSync('123456', 10);
    const adminAccounts = [
      ['admin', hashedPassword],
      ['kefu1', hashedPassword],
      ['kefu2', hashedPassword],
      ['kefu3', hashedPassword],
      ['kefu4', hashedPassword],
      ['kefu5', hashedPassword],
    ];
    for (const [username, password] of adminAccounts) {
      await connection.execute(
        'INSERT IGNORE INTO admins (username, password) VALUES (?, ?)',
        [username, password]
      );
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

const getPool = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initTables() first.');
  }
  return pool;
};

export { getPool as pool, initTables };
