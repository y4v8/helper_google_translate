"use strict";

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

    if (msg.content != '') {
        content = source.value = msg.content;
    }
    source.style.height = 'auto';
    source.style.height = source.scrollHeight+'px';
    source.focus();
  });
}

function eventKeydown(event) {
  if (event.key === eventKey && !event.altKey && !event.shiftKey) {
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

  portBS.postMessage({
    content: getSelectedText(event.target)
  });
}

function getSelectedText(target) {
  let element = target instanceof Window ? target.document.body :
                target instanceof HTMLDocument ? target.body : target;

  if (element.tagName == "TEXTAREA" || element.tagName == "INPUT") {
    return element.value.substring(element.selectionStart, element.selectionEnd).trim();
  }
  return element.ownerDocument.getSelection().toString().trim();
}

function keyEvents(doc) {
  doc.addEventListener('keydown', eventKeydown);
  doc.addEventListener('keyup', eventKeyup);

  let observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.tagName == 'FRAME' || node.tagName == 'IFRAME') {
          node.contentWindow.addEventListener('keydown', eventKeydown);
          node.contentWindow.addEventListener('keyup', eventKeyup);
        }
      });
      mutation.removedNodes.forEach(function(node) {
        if (node.tagName == 'FRAME' || node.tagName == 'IFRAME') {
          node.contentWindow.removeEventListener('keydown', eventKeydown);
          node.contentWindow.removeEventListener('keyup', eventKeyup);
        }
      });
    });    
  });

  let config = { childList: true, subtree: true };

  observer.observe(doc.body, config);
}

keyEvents(document);

for (let i=0; i<window.frames.length; i++) {
  keyEvents(window.frames[i].document);
}
