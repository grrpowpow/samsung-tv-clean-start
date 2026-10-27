(function () {
  'use strict';
  var panel = document.getElementById('panel');
  var wallpaper = document.getElementById('wallpaper');
  var notice = document.getElementById('notice');
  var photoFile = document.getElementById('photo-file');
  var lastFocus = document.querySelector('.tile');
  var appIds = {}; // Populate only after installed IDs have been verified on the target TV.
  function load(key) { try {return localStorage.getItem('mytv.' + key);} catch (error) {return null;} }
  function save(key, value) {try {localStorage.setItem('mytv.' + key, value);} catch (error) {notice.textContent = 'Speicher voll: Änderung gilt nur bis zum Neuladen.';} }
  function focus(element) {
    var old = document.querySelector('.focused');
    if (old) old.classList.remove('focused');
    element.classList.add('focused');
    element.focus();
  }
  function setPhoto(value) {wallpaper.style.backgroundImage = value ? 'url("' + value + '")' : '';}
  function tick() {
    var now = new Date();
    document.getElementById('clock').textContent = now.getHours() + ':' + ('0' + now.getMinutes()).slice(-2);
    document.getElementById('date').textContent = now.toLocaleDateString('de-DE', {weekday:'long',day:'numeric',month:'long'});
  }
  function openPanel() {lastFocus = document.activeElement; panel.hidden = false; focus(document.getElementById('choose-photo'));}
  function closePanel() {panel.hidden = true; focus(lastFocus);}
  document.getElementById('settings').onclick = openPanel;
  document.getElementById('photo').onclick = openPanel;
  document.getElementById('close-panel').onclick = closePanel;
  document.getElementById('choose-photo').onclick = function () {photoFile.click();};
  document.getElementById('reset-photo').onclick = function () {setPhoto(''); save('photo', '');};
  document.getElementById('toggle-title').onclick = function () {document.body.classList.toggle('compact'); save('compact', document.body.classList.contains('compact') ? '1' : '0');};
  document.getElementById('layout').onclick = function () {document.body.classList.toggle('grid'); save('grid', document.body.classList.contains('grid') ? '1' : '0');};
  photoFile.onchange = function () {
    var file = photoFile.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {notice.textContent = 'Bitte eine Bilddatei wählen.'; return;}
    if (file.size > 3 * 1024 * 1024) {notice.textContent = 'Bitte ein Bild unter 3 MB wählen.'; return;}
    var reader = new FileReader();
    reader.onload = function () {setPhoto(reader.result); save('photo', reader.result);};
    reader.readAsDataURL(file);
  };
  var tiles = document.querySelectorAll('.tile');
  for (var i = 0; i < tiles.length; i++) {
    tiles[i].onclick = function () {
      focus(this);
      var id = appIds[this.getAttribute('data-app')];
      if (!id || !window.tizen || !window.tizen.application) {
        notice.textContent = this.textContent.replace(/\s+/g, ' ').trim() + ': Vorschau – noch keine geprüfte TV-App-ID hinterlegt.';
        return;
      }
      window.tizen.application.launch(id, function () {notice.textContent = 'Start an Tizen übergeben.';}, function (error) {notice.textContent = 'Start fehlgeschlagen: ' + error.message;});
    };
  }
  document.addEventListener('keydown', function (event) {
    var code = event.keyCode;
    if (code === 27 || code === 10009) {if (!panel.hidden) {event.preventDefault(); closePanel();} return;}
    var group = panel.hidden ? (document.activeElement.classList.contains('tile') ? tiles : document.querySelectorAll('nav button')) : panel.querySelectorAll('button');
    var index = 0;
    for (var j = 0; j < group.length; j++) if (group[j] === document.activeElement) index = j;
    if (code === 37 || code === 39 || code === 38 || code === 40) {
      event.preventDefault();
      if (panel.hidden && code === 38 && document.activeElement.classList.contains('tile')) {focus(document.getElementById('settings')); return;}
      if (panel.hidden && code === 40 && !document.activeElement.classList.contains('tile')) {focus(tiles[0]); return;}
      var delta = code === 37 || code === 38 ? -1 : 1;
      focus(group[(index + delta + group.length) % group.length]);
    }
  });
  setPhoto(load('photo'));
  if (load('compact') === '1') document.body.classList.add('compact');
  if (load('grid') === '1') document.body.classList.add('grid');
  tick(); setInterval(tick, 30000); focus(tiles[0]);
}());
