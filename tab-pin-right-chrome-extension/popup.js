// 监听固定标签页按钮点击
document.getElementById('pinTab').addEventListener('click', function() {
  // 调用后台脚本将当前标签页固定到右侧
  chrome.runtime.sendMessage({action: "pinTabRight"}, function(response) {
    showStatus(response.message, response.success ? 'success' : 'error');
  });
});

// 监听取消固定标签页按钮点击
document.getElementById('unpinTab').addEventListener('click', function() {
  // 调用后台脚本取消固定标签页
  chrome.runtime.sendMessage({action: "unpinTab"}, function(response) {
    showStatus(response.message, response.success ? 'success' : 'error');
  });
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