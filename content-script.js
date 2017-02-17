const translateURL = 'https://translate.google.com/',
      portName = 'translate-port',
      contentSourceID = 'source',
      eventKey = 'Control',
      eventMaxDuration = 500;

let translate = document.URL.startsWith(translateURL);
let portBS = chrome.runtime.connect({
  name: portName
});
let eventKeyTime,
    eventKeyDown = false;

if (translate) {
  chrome.runtime.onMessage.addListener((msg, sender, resp) => {
    let id = 'extensionId' in sender ? sender.extensionId : sender.id;
    if (id != chrome.runtime.id) {
      return;
    }
    let source = document.getElementById(contentSourceID);
    if (source == undefined) {
      return;
    }
    source.value = msg.content;
    source.style.height = 'auto';
    source.style.height = source.scrollHeight+'px';
  });
}

document.addEventListener('keydown', event => {
  if (event.key === eventKey) {
    if (eventKeyDown == false) {
      eventKeyTime = new Date();
      eventKeyDown = true;
    }
    return;
  }
  eventKeyDown = false;
});

document.addEventListener('keyup', event => {
  if (event.key !== eventKey || eventKeyDown == false) {
    return;
  }
  eventKeyDown = false;

  let now = new Date();
  if (now - eventKeyTime > eventMaxDuration) {
    return;
  }

  if (translate) {
    portBS.postMessage({
      content: ''
    });
    return;
  }

  let data = window.getSelection().toString().trim();
  if (data != '') {
    portBS.postMessage({
      content: data
    });
  }
});
