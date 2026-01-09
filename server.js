const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// 关键修改：改成你访问的学号 239210303
const STUDENT_ID = "239210303";

// 新增：解决Render部署的跨域问题
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// 静态资源挂载（确保public目录路径正确）
app.use(`/${STUDENT_ID}`, express.static(path.join(__dirname, 'public')));

// 连接数据库（Render是临时文件系统，建议用内存数据库避免文件丢失）
// 关键修改：改用内存数据库（Render重启后数据会清空，但能正常运行）
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to in-memory SQLite database');
  // 创建表
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0
  )`, (err) => {
    if (err) console.error('Create table error:', err.message);
  });
});

// 子路由
const router = express.Router();

// 获取所有留言
router.get('/api/messages', (req, res) => {
  db.all('SELECT * FROM messages', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 提交留言
router.post('/api/messages', (req, res) => {
  const { name, content } = req.body;
  if (!name || !content) return res.status(400).json({ error: "昵称和内容不能为空" });
  db.run('INSERT INTO messages (name, content) VALUES (?, ?)', [name, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, content, likes: 0 });
  });
});

// 点赞接口
router.post('/api/like', (req, res) => {
  const { id } = req.body;
  if (!id || isNaN(id)) return res.status(400).json({ error: "ID必须是数字" });
  db.run('UPDATE messages SET likes = likes + 1 WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT likes FROM messages WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ likes: row?.likes || 0 });
    });
  });
});

// 删除留言接口
router.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ error: "留言ID必须是数字" });
  }
  db.run('DELETE FROM messages WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "未找到该留言，删除失败" });
    }
    res.json({ success: true, message: "留言删除成功" });
  });
});

// 挂载子路由
app.use(`/${STUDENT_ID}`, router);

// 根路径重定向
app.get('/', (req, res) => {
  res.redirect(`/${STUDENT_ID}`);
});

// 处理404
app.use((req, res) => {
  res.status(404).json({ error: `路径 ${req.originalUrl} 不存在` });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`服务运行在: http://localhost:${PORT}`);
  console.log(`访问地址：https://tree-hole.onrender.com/${STUDENT_ID}`);
});