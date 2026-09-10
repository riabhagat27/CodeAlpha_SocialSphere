const bcrypt = require('bcryptjs');
const { dbRun, dbGet, initDatabase } = require('./database');

const seedDatabase = async () => {
  console.log('Seeding SocialSphere database...');
  await initDatabase();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Check if users already exist
  const existingUser = await dbGet('SELECT * FROM users WHERE username = ?', ['alex_dev']);
  if (existingUser) {
    console.log('Database already contains demo data. Skipping seeding.');
    process.exit(0);
  }

  // Create demo users
  const alexResult = await dbRun(
    `INSERT INTO users (full_name, username, email, password, bio, profile_image) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Alex Morgan',
      'alex_dev',
      'alex@socialsphere.com',
      hashedPassword,
      'Full-stack JavaScript developer building cool web apps with Express & SQLite. 🚀',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    ]
  );

  const sarahResult = await dbRun(
    `INSERT INTO users (full_name, username, email, password, bio, profile_image) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Sarah Chen',
      'sarah_design',
      'sarah@socialsphere.com',
      hashedPassword,
      'UI/UX Designer passionate about modern clean interfaces, micro-animations, and CSS magic. ✨',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
    ]
  );

  const codeAlphaResult = await dbRun(
    `INSERT INTO users (full_name, username, email, password, bio, profile_image) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'CodeAlpha Team',
      'code_alpha',
      'internship@codealpha.tech',
      hashedPassword,
      'Empowering student developers worldwide through practical full-stack internship tasks.',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80'
    ]
  );

  const alexId = alexResult.lastID;
  const sarahId = sarahResult.lastID;
  const codeAlphaId = codeAlphaResult.lastID;

  // Create demo posts
  const post1 = await dbRun(
    `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
    [
      codeAlphaId,
      'Welcome to SocialSphere! 🎉 This mini social platform is built for Task 2 of the CodeAlpha Full Stack Internship. Test features like post creation, likes, comments, and profile following!',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
    ]
  );

  const post2 = await dbRun(
    `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
    [
      alexId,
      'Just finished setting up the Express backend and SQLite database for SocialSphere. Clean RESTful API design makes everything so smooth!',
      ''
    ]
  );

  const post3 = await dbRun(
    `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`,
    [
      sarahId,
      'Designing clean, modern light themes with rounded cards and subtle drop shadows. What do you think of this aesthetic?',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'
    ]
  );

  // Add demo likes
  await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post1.lastID, alexId]);
  await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post1.lastID, sarahId]);
  await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post2.lastID, sarahId]);
  await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post3.lastID, alexId]);

  // Add demo comments
  await dbRun(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    [post1.lastID, alexId, 'Great task! Really enjoyed working on this project architecture.']
  );
  await dbRun(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    [post1.lastID, sarahId, 'The UI design turned out super sleek and clean!']
  );
  await dbRun(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    [post2.lastID, codeAlphaId, 'Excellent work Alex! Code structure looks very clean.']
  );

  // Add demo follow relationships
  await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [alexId, sarahId]);
  await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [alexId, codeAlphaId]);
  await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [sarahId, alexId]);
  await dbRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [sarahId, codeAlphaId]);

  console.log('✅ Demo data seeded successfully!');
  console.log('\nDemo Logins (Password for all accounts is: password123)');
  console.log('1. alex_dev / alex@socialsphere.com');
  console.log('2. sarah_design / sarah@socialsphere.com');
  console.log('3. code_alpha / internship@codealpha.tech');
  process.exit(0);
};

seedDatabase().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
