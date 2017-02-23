function save_options() {
  var showMenu = document.getElementById('show_menu').checked;

  if (showMenu) {
    chrome.contextMenus.create({
      id: 'hgt-translate',
      title: 'Translate',
      contexts: ['all'],
      onclick: function(info, tab) {
        chrome.tabs.sendMessage(tab.id, {});
      }
    });
  } else {
    chrome.contextMenus.removeAll();
  }

  chrome.storage.local.set({
    showMenu: showMenu
  }, function() {
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.local.get({
    showMenu: false
  }, function(items) {
    document.getElementById('show_menu').checked = items.showMenu;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);