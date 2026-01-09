// 全局变量：基础URL（适配Render环境）
const BASE_URL = `https://tree-hole.onrender.com/239210303`;

// 页面加载后获取所有留言
window.onload = getMessages;

// 获取留言列表
function getMessages() {
  fetch(`${BASE_URL}/api/messages`)
    .then(res => {
      if (!res.ok) throw new Error('获取留言失败');
      return res.json();
    })
    .then(data => {
      const list = document.getElementById('messageList');
      list.innerHTML = '';
      
      const hotList = document.getElementById('hotList');
      hotList.innerHTML = '';
      
      // 最新留言倒序排列（更符合用户习惯）
      const sortedData = [...data].reverse();
      
      sortedData.forEach(item => {
        const card = createMessageCard(item);
        list.appendChild(card);
        
        // 热门树洞取点赞数最高的前3条（优化逻辑）
        const hotData = [...data].sort((a, b) => b.likes - a.likes).slice(0, 3);
        hotList.innerHTML = '';
        hotData.forEach(hotItem => {
          hotList.appendChild(createMessageCard(hotItem));
        });
      });
    })
    .catch(err => {
      console.error('获取留言错误:', err);
      alert('获取留言失败，请稍后重试');
    });
}

// 创建留言卡片
function createMessageCard(item) {
  const card = document.createElement('div');
  card.className = 'message-card';
  card.innerHTML = `
    <div class="name">${item.name || '匿名同学'}</div>
    <div class="content">${item.content}</div>
    <div class="btn-container">
      <button class="like-btn" onclick="likeMessage(${item.id})">
        👍 <span id="like-${item.id}">${item.likes || 0}</span>
      </button>
      <button class="delete-btn" onclick="deleteMessage(${item.id})">
        🗑️ 删除
      </button>
    </div>
  `;
  return card;
}

// 提交留言
function submitMessage() {
  const name = document.getElementById('name').value.trim() || '匿名同学';
  const content = document.getElementById('content').value.trim();
  
  if (!content) {
    alert('留言内容不能为空！');
    return;
  }

  const activeMood = document.querySelector('.mood.active').dataset.mood;

  fetch(`${BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      name, 
      content,
      mood: activeMood
    })
  })
    .then(res => {
      if (!res.ok) throw new Error('提交留言失败');
      return res.json();
    })
    .then(() => {
      document.getElementById('name').value = '';
      document.getElementById('content').value = '';
      getMessages();
    })
    .catch(err => {
      console.error('提交留言错误:', err);
      alert('提交留言失败，请稍后重试');
    });
}

// 点赞功能
function likeMessage(id) {
  fetch(`${BASE_URL}/api/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
    .then(res => {
      if (!res.ok) throw new Error('点赞失败');
      return res.json();
    })
    .then(data => {
      document.getElementById(`like-${id}`).innerText = data.likes;
    })
    .catch(err => {
      console.error('点赞错误:', err);
      alert('点赞失败，请稍后重试');
    });
}

// 删除留言功能
function deleteMessage(id) {
  if (!confirm('确定要删除这条留言吗？删除后无法恢复！')) {
    return;
  }

  fetch(`${BASE_URL}/api/messages/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => {
      if (!res.ok) throw new Error('删除留言失败');
      return res.json();
    })
    .then(() => {
      getMessages();
      alert('留言删除成功！');
    })
    .catch(err => {
      console.error('删除留言错误:', err);
      alert('删除留言失败，请稍后重试');
    });
}

// 情绪标签切换
document.querySelectorAll('.mood').forEach(mood => {
  mood.addEventListener('click', function() {
    document.querySelectorAll('.mood').forEach(m => m.classList.remove('active'));
    this.classList.add('active');
  });
});