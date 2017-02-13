var portCS, portTCS;

function connected(p) {
  portCS = p;
  portCS.onMessage.addListener(function(m) {
    if (m.event == 'init' && m.url.match('https?://translate.google') != null) {
      portTCS = p;
    } else if (m.event == 'translate' && portCS != portTCS && portTCS != undefined) {
      portTCS.postMessage(m);
    }
  });
}

browser.runtime.onConnect.addListener(connected);
