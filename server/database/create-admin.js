const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'thuysan.db');
const db = new sqlite3.Database(dbPath);

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123'; // Đổi mật khẩu này sau khi đăng nhập
  const email = 'admin@thuysan.com';
  
  try {
    // Kiểm tra xem đã có admin chưa
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('❌ Lỗi:', err.message);
        db.close();
        return;
      }
      
      if (user) {
        console.log('⚠️  Tài khoản admin đã tồn tại!');
        console.log('Username:', username);
        db.close();
        return;
      }
      
      // Tạo admin mới
      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.run(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, email, 'admin'],
        function(err) {
          if (err) {
            console.error('❌ Lỗi tạo admin:', err.message);
          } else {
            console.log('✅ Tạo tài khoản admin thành công!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Username:', username);
            console.log('Password:', password);
            console.log('Email:', email);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⚠️  Vui lòng đổi mật khẩu sau khi đăng nhập!');
          }
          db.close();
        }
      );
    });
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    db.close();
  }
}

createAdmin();
