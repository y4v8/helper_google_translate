const translateURL = 'https://translate.google.com/',
      portName = 'translate-port',
      contentSourceID = 'source',
      menuSourceID = 'gt-src-is',
      eventKey = 'Control',
      eventMaxDuration = 250;

let translate = document.URL.startsWith(translateURL);
let portBS = chrome.runtime.connect({
  name: portName
});
let eventTimeDown = 0,
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

function eventKeydown(event) {
  if (event.key === eventKey) {
    if (eventKeyDown == false) {
      // if (event.timeStamp - eventTimeDown < eventMaxDuration) { console.log('double press'); }
      eventTimeDown = event.timeStamp;
      eventKeyDown = true;
    }
    return;
  }
  eventTimeDown = 0;
  eventKeyDown = false;
}

function eventKeyup(event) {
  if (eventKeyDown == false) {
    return;
  }
  eventKeyDown = false;
  
  if (event.timeStamp - eventTimeDown > eventMaxDuration) {
    return;
  }

  if (translate) {
    portBS.postMessage({
      switchToPreviousTab: true
    });
    return;
  }

  let data;
  if (event.target.tagName == 'TEXTAREA' || event.target.tagName == 'INPUT') {
    data = event.target.value.substring(event.target.selectionStart, event.target.selectionEnd).trim();
  } else {
    data = window.getSelection().toString().trim();
  }
  portBS.postMessage({
    content: data
  });
}

document.addEventListener('keydown', eventKeydown);
document.addEventListener('keyup', eventKeyup);

let elements = document.getElementsByTagName('TEXTAREA');
for (let i=0; i<elements.length; i++) {
  elements[i].addEventListener('keydown', eventKeydown);
  elements[i].addEventListener('keyup', eventKeyup);
}

let observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.tagName == 'TEXTAREA') {
        node.addEventListener('keydown', eventKeydown);
        node.addEventListener('keyup', eventKeyup);
      }
    });
    mutation.removedNodes.forEach(function(node) {
      if (node.tagName == 'TEXTAREA') {
        node.removeEventListener('keydown', eventKeydown);
        node.removeEventListener('keyup', eventKeyup);
      }
    });
  });    
});

let config = { childList: true, subtree: true };

observer.observe(document.body, config);
