// 存储固定标签页的ID（从存储中加载）
let pinnedTabIds = new Set();

// 当Service Worker启动时，从存储中加载固定标签页ID
chrome.storage.local.get(['pinnedTabIds'], function(result) {
  if (result.pinnedTabIds) {
    pinnedTabIds = new Set(result.pinnedTabIds);
    // 确保已固定的标签页位置正确
    setTimeout(() => {
      rearrangePinnedTabs();
    }, 1000);
  }
});

// 监听标签页标题变化事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // 检查标题是否发生变化
  if (changeInfo.title) {
    // 获取保存的监控标题
    chrome.storage.local.get(['targetTitle'], function(result) {
      if (result.targetTitle && tab.title === result.targetTitle) {
        // 如果标签页标题包含监控标题且尚未固定，则自动固定
        if (!pinnedTabIds.has(tabId)) {
          // 将标签页ID添加到固定列表
          pinnedTabIds.add(tabId);
          
          // 保存到存储
          savePinnedTabIds();
          
          // 移动标签页到最右侧
          chrome.tabs.query({currentWindow: true}, function(allTabs) {
            const moveToIndex = allTabs.length - 1;
            chrome.tabs.move(tabId, {index: moveToIndex}, function(movedTab) {
              if (chrome.runtime.lastError) {
                // 从固定列表中移除
                pinnedTabIds.delete(tabId);
                // 保存到存储
                savePinnedTabIds();
                console.log("自动固定标签页失败: " + chrome.runtime.lastError.message);
              } else {
                console.log("标签页 '" + tab.title + "' 已自动固定");
              }
            });
          });
        }
      }
    });
  }
  
  // 如果标签页被固定且完成加载，确保其位置正确
  if (pinnedTabIds.has(tabId) && changeInfo.status === 'complete') {
    setTimeout(() => {
      rearrangePinnedTabs();
    }, 100);
  }
});

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
  } else if (request.action === "checkTabStatus") {
    // 检查当前标签页是否被固定
    checkTabStatus(sendResponse);
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
      
      // 保存到存储
      savePinnedTabIds();
      
      // 查询所有标签页以确定移动位置
      chrome.tabs.query({currentWindow: true}, function(allTabs) {
        // 计算目标位置（最右侧）
        const moveToIndex = allTabs.length - 1;
        
        // 移动标签页到最右侧
        chrome.tabs.move(currentTab.id, {index: moveToIndex}, function(movedTab) {
          if (chrome.runtime.lastError) {
            // 从固定列表中移除
            pinnedTabIds.delete(currentTab.id);
            // 保存到存储
            savePinnedTabIds();
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
  
  // 保存到存储
  savePinnedTabIds();
  
  sendResponse({success: true, message: `已取消固定 ${count} 个标签页`});
}

// 保存固定标签页ID到存储
function savePinnedTabIds() {
  chrome.storage.local.set({pinnedTabIds: Array.from(pinnedTabIds)}, function() {
    if (chrome.runtime.lastError) {
      console.log("保存固定标签页ID时出错: " + chrome.runtime.lastError.message);
    }
  });
}

// 监听标签页创建事件
chrome.tabs.onCreated.addListener(function(tab) {
  // 延迟执行以确保标签页完全创建
  setTimeout(() => {
    // 重新排列固定标签页到最右侧
    rearrangePinnedTabs();
  }, 100);
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // 如果标签页被固定且完成加载，确保其位置正确
  if (pinnedTabIds.has(tabId) && changeInfo.status === 'complete') {
    setTimeout(() => {
      rearrangePinnedTabs();
    }, 100);
  }
});

// 监听标签页移除事件
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  // 从固定列表中移除已关闭的标签页
  if (pinnedTabIds.has(tabId)) {
    pinnedTabIds.delete(tabId);
    // 保存到存储
    savePinnedTabIds();
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
    
    // 更新pinnedTabIds，移除已经不存在的标签页
    pinnedTabIds.forEach(id => {
      if (!allTabs.some(tab => tab.id === id)) {
        pinnedTabIds.delete(id);
      }
    });
    
    // 如果没有有效的固定标签页，直接返回
    if (pinnedTabIds.size === 0) return;
    
    // 保存到存储
    savePinnedTabIds();
    
    // 计算目标位置（最右侧）
    let moveToIndex = allTabs.length - 1;
    
    // 从右到左移动固定标签页
    for (let i = pinnedTabs.length - 1; i >= 0; i--) {
      // 检查标签页是否仍然存在
      if (allTabs.some(tab => tab.id === pinnedTabs[i].id)) {
        chrome.tabs.move(pinnedTabs[i].id, {index: moveToIndex}, function() {
          if (chrome.runtime.lastError) {
            console.log("移动固定标签页时出错: " + chrome.runtime.lastError.message);
            // 出错时从固定列表中移除
            pinnedTabIds.delete(pinnedTabs[i].id);
            // 保存到存储
            savePinnedTabIds();
          }
        });
        moveToIndex--;
      } else {
        // 标签页不存在时从固定列表中移除
        pinnedTabIds.delete(pinnedTabs[i].id);
        // 保存到存储
        savePinnedTabIds();
      }
    }
  });
}

// 检查当前标签页是否被固定
function checkTabStatus(sendResponse) {
  // 获取当前活动的标签页
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length > 0) {
      const currentTab = tabs[0];
      // 检查标签页是否在固定列表中
      const isPinned = pinnedTabIds.has(currentTab.id);
      sendResponse({pinned: isPinned});
    } else {
      sendResponse({pinned: false});
    }
  });
}