const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../database.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initDatabase = async () => {
  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        bio TEXT DEFAULT '',
        profile_image TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Posts table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Comments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Likes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Follows table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully.');
    await seedIfEmpty();
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

const seedIfEmpty = async () => {
  try {
    const userCountRow = await dbGet('SELECT COUNT(*) as count FROM users');
    if (userCountRow && userCountRow.count > 0) {
      console.log('Database already contains user records. Skipping automatic seeding.');
      return;
    }

    console.log('Database is empty. Populating demo seed data...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Demo@123', 10);

    // 1. Insert Demo Users
    const alexResult = await dbRun(
      `INSERT INTO users (full_name, username, email, password, bio, profile_image) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Alex Johnson',
        'alex',
        'alex@example.com',
        hashedPassword,
        'Full-stack JavaScript developer building cool web apps with Express & SQLite. 🚀',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
      ]
    );

    const sarahResult = await dbRun(
      `INSERT INTO users (full_name, username, email, password, bio, profile_image) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Sarah Williams',
        'sarah',
        'sarah@example.com',
        hashedPassword,
        'UI/UX Designer passionate about modern clean interfaces, micro-animations, and CSS magic. ✨',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
      ]
    );

    const rahulResult = await dbRun(
      `INSERT INTO users (full_name, username, email, password, bio, profile_image) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'Rahul Sharma',
        'rahul',
        'rahul@example.com',
        hashedPassword,
        'Software engineer exploring full-stack engineering and cloud deployments. 💻',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      ]
    );

    const alexId = alexResult.lastID;
    const sarahId = sarahResult.lastID;
    const rahulId = rahulResult.lastID;

    // 2. Insert Demo Posts (at least 5 posts)
    const post1 = await dbRun(
      `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
      [
        rahulId,
        'Welcome to SocialSphere! 🎉 Excited to join this community and share my full-stack web development journey.',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      ]
    );

    const post2 = await dbRun(
      `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
      [
        alexId,
        'Just completed setting up the Express backend and SQLite database for SocialSphere. Clean REST API design makes frontend integration seamless! 🚀',
        ''
      ]
    );

    const post3 = await dbRun(
      `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
      [
        sarahId,
        'Designing clean, modern light themes with rounded cards and subtle drop shadows. What do you think of this aesthetic? ✨',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'
      ]
    );

    const post4 = await dbRun(
      `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
      [
        alexId,
        'Learning full-stack development has been an amazing experience. Building something new every day keeps the momentum high!',
        ''
      ]
    );

    const post5 = await dbRun(
      `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
      [
        rahulId,
        'Sharing a major coding achievement today: SocialSphere is now ready for public deployment! 💻🌐',
        ''
      ]
    );

    const post1Id = post1.lastID;
    const post2Id = post2.lastID;
    const post3Id = post3.lastID;
    const post4Id = post4.lastID;
    const post5Id = post5.lastID;

    // 3. Insert Demo Comments
    await dbRun(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post1Id, alexId, 'Welcome aboard Rahul! Great to have you on SocialSphere.']
    );
    await dbRun(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post1Id, sarahId, 'This looks great! Excited to see your posts.']
    );
    await dbRun(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post2Id, sarahId, 'The API structure turned out super clean!']
    );
    await dbRun(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post2Id, rahulId, 'Nice project! SQLite + Express is such a lightweight yet powerful stack.']
    );
    await dbRun(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post3Id, alexId, 'I really like this idea and design! The card shadows look smooth.']
    );
    await dbRun(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post3Id, rahulId, 'Good luck with your development journey! The design aesthetic is top notch.']
    );

    // 4. Insert Demo Likes
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post1Id, alexId]);
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post1Id, sarahId]);
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post2Id, sarahId]);
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post2Id, rahulId]);
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post3Id, alexId]);
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post3Id, rahulId]);
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post4Id, sarahId]);
    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post5Id, alexId]);

    // 5. Insert Demo Follow Relationships
    await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [alexId, sarahId]);
    await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [rahulId, alexId]);
    await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [sarahId, rahulId]);

    console.log('✅ Demo seed data successfully created!');
  } catch (err) {
    console.error('Error seeding demo data:', err);
  }
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDatabase
};
