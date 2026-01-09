const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STUDENT_ID = "239210232";

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(`/${STUDENT_ID}/public`, express.static(path.join(__dirname, 'public')));

// 连接数据库
const db = new sqlite3.Database('./treehole.db', (err) => {
  if (err) console.error(err.message);
  // 创建表（含likes字段，默认0）
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0
  )`);
});

// 创建子路由
const router = express.Router();

// 首页
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
  db.run('UPDATE messages SET likes = likes + 1 WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT likes FROM messages WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ likes: row.likes });
    });
  });
});

// ========== 新增：删除留言接口 ==========
router.delete('/api/messages/:id', (req, res) => {
  // 获取URL中的留言ID
  const { id } = req.params;
  
  // 校验ID是否为有效数字
  if (isNaN(id)) {
    return res.status(400).json({ error: "留言ID必须是数字" });
  }

  // 执行删除操作
  db.run('DELETE FROM messages WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // 检查是否真的删除了数据（changes为删除的行数）
    if (this.changes === 0) {
      return res.status(404).json({ error: "未找到该留言，删除失败" });
    }
    // 删除成功返回
    res.json({ success: true, message: "留言删除成功" });
  });
});

// 挂载静态资源到学号路径
app.use(`/${STUDENT_ID}`, express.static('public'));
// 挂载子路由到学号路径
app.use(`/${STUDENT_ID}`, router);

// 启动服务
app.listen(PORT, () => {
  console.log(`服务运行在: http://localhost:${PORT}/${STUDENT_ID}`);
});