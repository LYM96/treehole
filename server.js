const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STUDENT_ID = "239210303";

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

// 删除留言接口
router.delete('/api/messages/:id', (req, res) => {
  // 获取前端传过来的留言ID
  const messageId = req.params.id;
  // 根据ID删除对应留言
  db.run('DELETE FROM messages WHERE id = ?', [messageId], function(err) {
    if (err) {
      return res.status(500).json({ error: "删除留言失败：" + err.message });
    }
    // 判断是否真的删除了数据
    if (this.changes > 0) {
      res.json({ success: true, msg: "留言删除成功" });
    } else {
      res.status(404).json({ error: "该留言不存在或已被删除" });
    }
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