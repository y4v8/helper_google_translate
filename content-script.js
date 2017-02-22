const translateURL = 'https://translate.google.com/',
      portName = 'translate-port',
      contentSourceID = 'source',
      menuSourceID = 'gt-src-is',
      eventKey = 'Control',
      eventMaxDuration = 500;

let translate = document.URL.startsWith(translateURL);
let portBS = chrome.runtime.connect({
  name: portName
});
let eventTimeDown,
    eventKeyDown = false;
    
if (translate) {
  initTranslator();
}

function initTranslator() {
  let source = document.getElementById(contentSourceID);
  let menu = document.getElementById(menuSourceID);
  
  if (menu == undefined || source == undefined) {
    return;
  }

  let content = '';
  
  let obs = new MutationObserver(function(mutations) {
    if (menu.style.display == '' && source.value == content) {
      let focus = document.activeElement == source;
      source.focus();
      source.blur();
      if (focus) {
        source.focus();
      }
    }
  });
  obs.observe(menu, { attributes: true, attributeFilter: ['style'] });
  
  chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
    let id = 'extensionId' in sender ? sender.extensionId : sender.id;
    if (id != chrome.runtime.id) {
      return;
    }

    content = msg.content;

    source.value = msg.content;
    source.style.height = 'auto';
    source.style.height = source.scrollHeight+'px';
    source.focus();
  });
}

function eventActive() {
  if (eventKeyDown == false) {
    return false;
  }
  
  let now = new Date();
  if (now - eventTimeDown > eventMaxDuration) {
    return false;
  }
  
  return true;
}

function eventKeydown(event) {
  if (event.key === eventKey) {
    if (eventKeyDown == false) {
      eventTimeDown = new Date();
      eventKeyDown = true;
    }
    return;
  }
  eventKeyDown = false;
}

function eventKeyup(event) {
  let active = eventActive();
  eventKeyDown = false;
  if (active == false) {
    return;
  }
  
  if (translate) {
    portBS.postMessage({
      content: ''
    });
    return;
  }

  let data;
  if (event.target.type == 'textarea') {
    data = event.target.value.substring(event.target.selectionStart, event.target.selectionEnd).trim();
  } else {
    data = window.getSelection().toString().trim();
  }
  if (data != '') {
    portBS.postMessage({
      content: data
    });
  }
}

document.addEventListener('keydown', eventKeydown);
document.addEventListener('keyup', eventKeyup);

let elements = document.getElementsByTagName('textarea');
for (let i=0; i<elements.length; i++) {
  elements[i].addEventListener('keydown', eventKeydown);
  elements[i].addEventListener('keyup', eventKeyup);
}

let observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.type == 'textarea') {
        node.addEventListener('keydown', eventKeydown);
        node.addEventListener('keyup', eventKeyup);
      }
    });
    mutation.removedNodes.forEach(function(node) {
      if (node.type == 'textarea') {
        node.removeEventListener('keydown', eventKeydown);
        node.removeEventListener('keyup', eventKeyup);
      }
    });
  });    
});

let config = { childList: true, subtree: true };

observer.observe(document.body, config);
