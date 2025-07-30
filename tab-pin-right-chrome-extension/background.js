// 存储固定标签页的ID
let pinnedTabIds = new Set();

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "pinTabRight") {
    // 将当前标签页固定到右侧
    pinTabToRight(sendResponse);
    // 返回true表示异步发送响应
    return true;
  } else if (request.action === "unpinTab") {
    // 取消固定标签页
    unpinTabs(sendResponse);
    // 返回true表示异步发送响应
    return true;
  }
});

// 将标签页固定到右侧
function pinTabToRight(sendResponse) {
  // 获取当前活动的标签页
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length > 0) {
      const currentTab = tabs[0];
      
      // 将标签页ID添加到固定列表
      pinnedTabIds.add(currentTab.id);
      
      // 查询所有标签页以确定移动位置
      chrome.tabs.query({currentWindow: true}, function(allTabs) {
        // 计算目标位置（最右侧）
        const moveToIndex = allTabs.length - 1;
        
        // 移动标签页到最右侧
        chrome.tabs.move(currentTab.id, {index: moveToIndex}, function(movedTab) {
          if (chrome.runtime.lastError) {
            // 从固定列表中移除
            pinnedTabIds.delete(currentTab.id);
            sendResponse({success: false, message: "移动标签页失败: " + chrome.runtime.lastError.message});
          } else {
            sendResponse({success: true, message: "标签页已固定在标签栏右侧"});
          }
        });
      });
    } else {
      sendResponse({success: false, message: "未找到当前标签页"});
    }
  });
}

// 取消固定所有固定标签页
function unpinTabs(sendResponse) {
  // 清空固定标签页列表
  const count = pinnedTabIds.size;
  pinnedTabIds.clear();
  
  sendResponse({success: true, message: `已取消固定 ${count} 个标签页`});
}

// 监听标签页创建事件
chrome.tabs.onCreated.addListener(function(tab) {
  // 延迟执行以确保标签页完全创建
  setTimeout(() => {
    // 重新排列固定标签页到最右侧
    rearrangePinnedTabs();
  }, 100);
});

// 监听标签页移除事件
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  // 从固定列表中移除已关闭的标签页
  if (pinnedTabIds.has(tabId)) {
    pinnedTabIds.delete(tabId);
  }
});

// 重新排列固定标签页到最右侧
function rearrangePinnedTabs() {
  // 如果没有固定标签页，直接返回
  if (pinnedTabIds.size === 0) return;
  
  // 获取所有标签页
  chrome.tabs.query({currentWindow: true}, function(allTabs) {
    // 获取固定标签页并按当前顺序排列
    const pinnedTabs = allTabs.filter(tab => pinnedTabIds.has(tab.id));
    
    // 计算目标位置（最右侧）
    let moveToIndex = allTabs.length - 1;
    
    // 从右到左移动固定标签页
    for (let i = pinnedTabs.length - 1; i >= 0; i--) {
      chrome.tabs.move(pinnedTabs[i].id, {index: moveToIndex}, function() {
        if (chrome.runtime.lastError) {
          console.log("移动固定标签页时出错: " + chrome.runtime.lastError.message);
        }
      });
      moveToIndex--;
    }
  });
}