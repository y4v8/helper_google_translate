const translate_url = 'https://translate.google.com/',
      translate_port_name = 'translate-port';

let lastContentTab;

function translateTab(tabs, current_window, current_tab) {
  let p_tab, tab;

  if (tabs.length == 0) {
    p_tab = browser.tabs.create({
      active: true,
      index: current_tab.index + 1,
      url: translate_url,
      windowId: current_window.index
    });
    return p_tab;
  }

  let f_tabs = tabs.filter(t => t.windowId != current_window.id);
  if (f_tabs.length == 0) {
    f_tabs = tabs.filter(t => t.index == current_tab.index + 1);
    if (f_tabs.length == 0) {
      let index = tabs[0].index < current_tab.index ? current_tab.index : current_tab.index + 1;
      p_tab = browser.tabs.move(tabs[0].id, {
        index: index
      });
      return p_tab;
    }
    tab = f_tabs[0];
  } else {
    let a_tabs = f_tabs.filter(t => t.active);
    if (a_tabs.length == 0) {
      tab = f_tabs[0];
    } else {
      tab = a_tabs[0];
    }
  }

  p_tab = new Promise((resolve, reject) => {
    resolve(tab);
  });

  return p_tab;
}

function postMessage(m) {
  let p_current_window = browser.windows.getCurrent();
  p_current_window.then(current_window => {
    let p_active_tabs = browser.tabs.query({
      windowId: current_window.Id,
      active: true
    });
    p_active_tabs.then(active_tabs => {
      if (active_tabs.length == 0) {
        return;
      }
      lastContentTab = active_tabs[0];

      let p_tabs = browser.tabs.query({
        url: translate_url + '*'
      });
      p_tabs.then(tabs => {
        let p_tab = translateTab(tabs, current_window, active_tabs[0]);
        p_tab.then(tab => {
          let t = Array.isArray(tab) ? tab[0] : tab;
          let u_tab = browser.tabs.update(t.id, {
            active: true
          });
          u_tab.then(u => {
            browser.tabs.sendMessage(u.id, m);
          });
        });
      });
    });
  });
}

function connected(p) {
  if (p.name != translate_port_name) {
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
