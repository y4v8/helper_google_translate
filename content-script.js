const translate_url = 'https://translate.google.com/',
      port_name = 'translate-port',
      content_source_id = 'source',
      event_key = 'Control',
      wait_max = 500;

let translate = document.URL.startsWith(translate_url);
let portBS = browser.runtime.connect({
  name: port_name
});
let event_key_time,
    event_key_down = false;

if (translate) {
  browser.runtime.onMessage.addListener((msg, sender, resp) => {
    let source = document.getElementById(content_source_id);
    source.value = msg.content;
    source.style.height = 'auto';
    source.style.height = source.scrollHeight+'px';
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === event_key) {
    if (event_key_down == false) {
      event_key_time = new Date();
      event_key_down = true;
    }
    return;
  }
  event_key_down = false;
});

document.addEventListener('keyup', (event) => {
  if (event.key !== event_key || event_key_down == false) {
    return;
  }
  event_key_down = false;

  let now = new Date();
  if (now - event_key_time > wait_max) {
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
