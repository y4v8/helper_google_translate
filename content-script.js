const extensionID = '{e2652cfc-37d0-4d74-a4f7-a56812392073}',
      translateURL = 'https://translate.google.com/',
      portName = 'translate-port',
      contentSourceID = 'source',
      eventKey = 'Control',
      eventMaxDuration = 500;

let translate = document.URL.startsWith(translateURL);
let portBS = browser.runtime.connect({
  name: portName
});
let eventKeyTime,
    eventKeyDown = false;

if (translate) {
  browser.runtime.onMessage.addListener((msg, sender, resp) => {
    if (sender.extensionId != extensionID) {
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

document.addEventListener('keydown', (event) => {
  if (event.key === eventKey) {
    if (eventKeyDown == false) {
      eventKeyTime = new Date();
      eventKeyDown = true;
    }
    return;
  }
  eventKeyDown = false;
});

document.addEventListener('keyup', (event) => {
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
