var portBS = browser.runtime.connect({name:"port-from-translate"});
portBS.postMessage({event: "init", url: document.URL});

portBS.onMessage.addListener(function(m) {
  var source = document.getElementById('source')
  source.value = m.content;
  source.style.height = 'auto';
  source.style.height = source.scrollHeight+'px';
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Control') {
    var data = window.getSelection();
    if (data != "") {
      portBS.postMessage({event: "translate", content: data.toString()});
    }
  }
});
