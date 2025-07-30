// 页面加载完成后初始化开关状态
window.addEventListener('load', function() {
  // 查询当前标签页是否已被固定
  chrome.runtime.sendMessage({action: "checkTabStatus"}, function(response) {
    if (response.pinned) {
      document.getElementById('pinSwitch').checked = true;
    }
  });
});

// 监听开关按钮状态变化
document.getElementById('pinSwitch').addEventListener('change', function() {
  if (this.checked) {
    // 开关打开，固定当前标签页
    chrome.runtime.sendMessage({action: "pinTabRight"}, function(response) {
      showStatus(response.message, response.success ? 'success' : 'error');
    });
  } else {
    // 开关关闭，取消固定标签页
    chrome.runtime.sendMessage({action: "unpinTab"}, function(response) {
      showStatus(response.message, response.success ? 'success' : 'error');
    });
  }
});

// 显示状态信息
function showStatus(message, type) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = 'status ' + (type === 'success' ? 'success' : 'error');
  statusElement.style.display = 'block';
  
  // 3秒后隐藏状态信息
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}