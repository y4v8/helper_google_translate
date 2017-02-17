const translateURL = 'https://translate.google.com/',
      portName = 'translate-port';

let lastContentTab;

function translateTab(tabs, currentWindow, currentTab) {
  if (tabs.length == 0) {
    let pTab = browser.tabs.create({
      active: true,
      index: currentTab.index + 1,
      url: translateURL,
      windowId: currentWindow.index
    });
    return pTab;
  }

  let tab;
  let otherWindowTabs = tabs.filter(t => t.windowId != currentWindow.id);
  if (otherWindowTabs.length == 0) {
    otherWindowTabs = tabs.filter(t => t.index == currentTab.index + 1);
    if (otherWindowTabs.length == 0) {
      let index = tabs[0].index < currentTab.index ? currentTab.index : currentTab.index + 1;
      let pTab = browser.tabs.move(tabs[0].id, {
        index: index
      });
      return pTab;
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

  let pTab = new Promise((resolve, reject) => {
    resolve(tab);
  });

  return pTab;
}

function postMessage(m) {
  let pCurrentWindow = browser.windows.getCurrent();
  pCurrentWindow.then(currentWindow => {
    let pActiveTabs = browser.tabs.query({
      windowId: currentWindow.Id,
      active: true
    });
    pActiveTabs.then(activeTabs => {
      if (activeTabs.length == 0) {
        return;
      }
      lastContentTab = activeTabs[0];

      let pTabs = browser.tabs.query({
        url: translateURL + '*'
      });
      pTabs.then(tabs => {
        let pTab = translateTab(tabs, currentWindow, activeTabs[0]);
        pTab.then(tab => {
          let t = Array.isArray(tab) ? tab[0] : tab;
          let pUpdateTab = browser.tabs.update(t.id, {
            active: true
          });
          pUpdateTab.then(updateTab => {
            browser.tabs.sendMessage(updateTab.id, m);
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
  p.onMessage.addListener(function(m) {
    if (m.content != '') {
      postMessage(m);
    } else {
      if (lastContentTab != undefined) {
        browser.tabs.update(lastContentTab.id, {
          active: true
        });
      }
    }
  });
}

browser.runtime.onConnect.addListener(connected);
