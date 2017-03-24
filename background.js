const translateURL = 'https://translate.google.com/',
      portName = 'translate-port';

let lastContentTab;

function translateTab(tabs, currentWindow, currentTab, callback) {
  if (tabs.length == 0) {
    chrome.tabs.create({
      active: true,
      index: currentTab.index + 1,
      url: translateURL,
      windowId: currentWindow.id
    }, callback);
    return;
  }

  let tab;
  let otherWindowTabs = tabs.filter(t => t.windowId != currentWindow.id);
  if (otherWindowTabs.length == 0) {
    otherWindowTabs = tabs.filter(t => t.index == currentTab.index + 1);
    if (otherWindowTabs.length == 0) {
      let index = tabs[0].index < currentTab.index ? currentTab.index : currentTab.index + 1;
      chrome.tabs.move(tabs[0].id, {
        index: index
      }, callback);
      return;
    }
    tab = otherWindowTabs[0];
  } else {
    let activeTabs = otherWindowTabs.filter(t => t.active);
    if (activeTabs.length == 0) {
      tab = otherWindowTabs[0];
    } else {
      tab = activeTabs[0];
    }
  }
  
  callback(tab);
}

function postMessage(m) {
  chrome.windows.getCurrent(currentWindow => {
    chrome.tabs.query({
      windowId: currentWindow.id,
      active: true
    }, activeTabs => {
      if (activeTabs.length == 0) {
        return;
      }
      lastContentTab = activeTabs[0];

      chrome.tabs.query({
        url: translateURL + '*'
      }, tabs => {
        let filteredTabs = tabs.filter(t => {
          if (t.url == translateURL) {
            return true;
          }
          let pathBegin = t.url[translateURL.length];
          return pathBegin == '?' || pathBegin == '#';
        });

        translateTab(filteredTabs, currentWindow, activeTabs[0], tab => {
          let t = Array.isArray(tab) ? tab[0] : tab;
          chrome.tabs.update(t.id, {
            active: true
          }, updateTab => {
            chrome.windows.update(updateTab.windowId, {
              focused: true
            }, window => {
              chrome.tabs.sendMessage(updateTab.id, m);
            });
          });
        });
      });
    });
  });
}

function connected(p) {
  if (p.name != portName) {
    return;
  }
  p.onMessage.addListener(m => {
    if ('switchToPreviousTab' in m) {
      if (lastContentTab != undefined) {
        chrome.windows.update(lastContentTab.windowId, {
          focused: true
        }, window => {
          chrome.tabs.update(lastContentTab.id, {
            active: true
          });
        });
      }
    } else {
      postMessage(m);
    }
  });
}

chrome.runtime.onConnect.addListener(connected);
