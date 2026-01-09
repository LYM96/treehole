// 页面加载后获取所有留言
window.onload = getMessages;

// 获取留言列表
function getMessages() {
  fetch(`./api/messages`)
    .then(res => {
      // 处理接口返回异常
      if (!res.ok) throw new Error('获取留言失败');
      return res.json();
    })
    .then(data => {
      const list = document.getElementById('messageList');
      list.innerHTML = '';
      
      // 渲染热门树洞（简单复用逻辑，可根据实际需求调整）
      const hotList = document.getElementById('hotList');
      hotList.innerHTML = '';
      
      // 渲染所有留言到最新倾诉区
      data.forEach(item => {
        const card = createMessageCard(item);
        list.appendChild(card);
        
        // 热门树洞取前3条（示例逻辑）
        if (data.indexOf(item) < 3) {
          const hotCard = createMessageCard(item);
          hotList.appendChild(hotCard);
        }
      });
    })
    .catch(err => {
      console.error('获取留言错误:', err);
      alert('获取留言失败，请稍后重试');
    });
}

// 创建留言卡片（抽离复用）
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

// 提交留言（含输入校验）
function submitMessage() {
  const name = document.getElementById('name').value.trim() || '匿名同学';
  const content = document.getElementById('content').value.trim();
  
  // 输入校验
  if (!content) {
    alert('留言内容不能为空！');
    return;
  }

  // 获取选中的情绪标签
  const activeMood = document.querySelector('.mood.active').dataset.mood;

  fetch(`./api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      name, 
      content,
      mood: activeMood // 可选：传递情绪标签
    })
  })
    .then(res => {
      if (!res.ok) throw new Error('提交留言失败');
      return res.json();
    })
    .then(() => {
      // 清空输入框并重新获取列表
      document.getElementById('name').value = '';
      document.getElementById('content').value = '';
      getMessages();
    })
    .catch(err => {
      console.error('提交留言错误:', err);
      alert('提交留言失败，请稍后重试');
    });
}

// 点赞功能（无刷新）
function likeMessage(id) {
  fetch(`./api/like`, {
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
  // 二次确认，防止误删
  if (!confirm('确定要删除这条留言吗？删除后无法恢复！')) {
    return;
  }

  fetch(`./api/messages/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => {
      if (!res.ok) throw new Error('删除留言失败');
      return res.json();
    })
    .then(() => {
      // 删除成功后重新加载留言列表
      getMessages();
      alert('留言删除成功！');
    })
    .catch(err => {
      console.error('删除留言错误:', err);
      alert('删除留言失败，请稍后重试');
    });
}

// 情绪标签点击切换（可选功能）
document.querySelectorAll('.mood').forEach(mood => {
  mood.addEventListener('click', function() {
    document.querySelectorAll('.mood').forEach(m => m.classList.remove('active'));
    this.classList.add('active');
  });
});