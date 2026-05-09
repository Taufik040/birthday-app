// ============================================
//  RETRO BIRTHDAY — main.js (Supabase version)
// ============================================

// ---- DATE ----
(function () {
  const el = document.getElementById('current-date');
  if (el) {
    const d = new Date();
    el.textContent = d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
})();

// ---- CONFETTI ----
(function spawnConfetti() {
  const container = document.getElementById('confetti');
  const shapes = ['🎉', '🎊', '⭐', '✨', '🌟', '🎈', '🎂', '♪', '♫'];
  const colors = ['#c9a84c', '#c0392b', '#2a7f7f', '#d44000', '#e8d8b0'];
  function createPiece() {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const isEmoji = Math.random() > 0.5;
    if (isEmoji) {
      el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      el.style.fontSize = (Math.random() * 14 + 8) + 'px';
    } else {
      el.style.width = (Math.random() * 8 + 4) + 'px';
      el.style.height = (Math.random() * 8 + 4) + 'px';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    }
    el.style.left = Math.random() * 100 + 'vw';
    const duration = Math.random() * 5 + 5;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = Math.random() * 8 + 's';
    el.style.opacity = 0;
    container.appendChild(el);
    setTimeout(() => el.remove(), (duration + 8) * 1000);
  }
  for (let i = 0; i < 30; i++) createPiece();
  setInterval(() => { if (container.children.length < 40) createPiece(); }, 600);
})();

// ---- AUDIO PLAYER ----
const player = {
  audio: document.getElementById('audioPlayer'),
  playPauseBtn: document.getElementById('playPauseBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  progressFill: document.getElementById('progressFill'),
  progressBar: document.getElementById('progressBar'),
  currentTimeEl: document.getElementById('currentTime'),
  totalTimeEl: document.getElementById('totalTime'),
  songTitle: document.getElementById('songTitle'),
  songArtist: document.getElementById('songArtist'),
  volumeSlider: document.getElementById('volumeSlider'),
  tracklist: document.getElementById('tracklist'),
  reelLeft: document.getElementById('reelLeft'),
  reelRight: document.getElementById('reelRight'),

  // tracks = [{name, url}, ...]
  tracks: [],
  currentIndex: -1,
  isPlaying: false,

  init() {
    this.audio.volume = 0.8;
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.next());
    this.audio.addEventListener('loadedmetadata', () => {
      this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
    });
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
    this.volumeSlider.addEventListener('input', e => { this.audio.volume = parseFloat(e.target.value); });
    this.progressBar.addEventListener('click', e => {
      if (!this.audio.duration) return;
      const rect = this.progressBar.getBoundingClientRect();
      this.audio.currentTime = ((e.clientX - rect.left) / rect.width) * this.audio.duration;
    });
    this.refreshTracklist();
  },

  async refreshTracklist() {
    try {
      const res  = await fetch('/get_files');
      const data = await res.json();
      // data.music = [{name, url}, ...]
      this.tracks = data.music.map(m => ({
        name: m.name.replace(/\.[^.]+$/, ''),
        url:  m.url
      }));
      this.renderTracklist();
    } catch (e) { console.error(e); }
  },

  renderTracklist() {
    const tl = this.tracklist;
    if (this.tracks.length === 0) {
      tl.innerHTML = '<div class="tracklist-empty">Belum ada lagu. Upload di bawah!</div>';
      return;
    }
    tl.innerHTML = this.tracks.map((t, i) => `
      <div class="track-item ${i === this.currentIndex ? 'active' : ''}" data-index="${i}">
        <span class="track-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="track-name">${t.name}</span>
      </div>
    `).join('');
    tl.querySelectorAll('.track-item').forEach(el => {
      el.addEventListener('click', () => this.loadTrack(parseInt(el.dataset.index)));
    });
  },

  loadTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;
    this.currentIndex = index;
    const track = this.tracks[index];
    this.audio.src = track.url;   // ← Supabase public URL
    this.songTitle.textContent  = track.name.toUpperCase();
    this.songArtist.textContent = '♪ NOW PLAYING ♪';
    this.audio.load();
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updatePlayBtn();
      this.startReels();
      startPhotoAnimation();
    }).catch(e => console.log(e));
    this.renderTracklist();
  },

  togglePlay() {
    if (this.tracks.length === 0) return;
    if (this.currentIndex === -1) { this.loadTrack(0); return; }
    if (this.isPlaying) {
      this.audio.pause(); this.isPlaying = false;
      this.stopReels(); stopPhotoAnimation();
    } else {
      this.audio.play(); this.isPlaying = true;
      this.startReels(); startPhotoAnimation();
    }
    this.updatePlayBtn();
  },

  next() {
    if (!this.tracks.length) return;
    this.loadTrack((this.currentIndex + 1) % this.tracks.length);
  },
  prev() {
    if (!this.tracks.length) return;
    this.loadTrack((this.currentIndex - 1 + this.tracks.length) % this.tracks.length);
  },

  updatePlayBtn() {
    this.playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
    this.playPauseBtn.classList.toggle('playing', this.isPlaying);
  },
  updateProgress() {
    if (!this.audio.duration) return;
    this.progressFill.style.width = (this.audio.currentTime / this.audio.duration * 100) + '%';
    this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
  },
  formatTime(s) {
    if (isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  },
  startReels() { this.reelLeft.classList.add('spinning'); this.reelRight.classList.add('spinning'); },
  stopReels()  { this.reelLeft.classList.remove('spinning'); this.reelRight.classList.remove('spinning'); }
};

player.init();

// ---- PHOTO ANIMATION ----
function startPhotoAnimation() { document.querySelectorAll('.photo-frame').forEach(f => f.classList.add('dancing')); }
function stopPhotoAnimation()  { document.querySelectorAll('.photo-frame').forEach(f => f.classList.remove('dancing')); }

// ---- FILE UPLOADS ----

// Music
const musicDropZone = document.getElementById('musicDropZone');
const musicInput    = document.getElementById('musicInput');

musicDropZone.addEventListener('click', () => musicInput.click());
musicInput.addEventListener('change', e => uploadMusic(e.target.files));
musicDropZone.addEventListener('dragover',  e => { e.preventDefault(); musicDropZone.classList.add('dragover'); });
musicDropZone.addEventListener('dragleave', () => musicDropZone.classList.remove('dragover'));
musicDropZone.addEventListener('drop', e => { e.preventDefault(); musicDropZone.classList.remove('dragover'); uploadMusic(e.dataTransfer.files); });

async function uploadMusic(files) {
  for (const file of files) {
    const fd = new FormData();
    fd.append('music', file);
    showStatus(`Mengupload ${file.name}...`);
    try {
      const res  = await fetch('/upload_music', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        addMusicItem(data.filename);
        await player.refreshTracklist();
        showStatus(`✓ ${data.filename} berhasil diupload!`);
      } else {
        showStatus(`✗ Gagal: ${data.error}`, true);
      }
    } catch (e) { showStatus('✗ Error saat upload', true); }
  }
  musicInput.value = '';
}

function addMusicItem(filename) {
  const list = document.getElementById('musicList');
  const div  = document.createElement('div');
  div.className    = 'upload-item';
  div.dataset.file = filename;
  div.dataset.type = 'music';
  div.innerHTML = `
    <span class="item-icon">♪</span>
    <span class="item-name">${filename}</span>
    <button class="item-delete" onclick="deleteFile('${filename}','music')">✕</button>
  `;
  list.appendChild(div);
}

// Photos
const photoDropZone = document.getElementById('photoDropZone');
const photoInput    = document.getElementById('photoInput');

photoDropZone.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', e => uploadPhotos(e.target.files));
photoDropZone.addEventListener('dragover',  e => { e.preventDefault(); photoDropZone.classList.add('dragover'); });
photoDropZone.addEventListener('dragleave', () => photoDropZone.classList.remove('dragover'));
photoDropZone.addEventListener('drop', e => { e.preventDefault(); photoDropZone.classList.remove('dragover'); uploadPhotos(e.dataTransfer.files); });

async function uploadPhotos(files) {
  const fd = new FormData();
  let count = 0;
  for (const file of files) { fd.append('photos', file); count++; }
  if (!count) return;
  showStatus(`Mengupload ${count} foto...`);
  try {
    const res  = await fetch('/upload_photos', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      // data.files = [{name, url}, ...]
      data.files.forEach(f => {
        addPhotoItem(f.name);
        addPhotoToGallery(f.name, f.url);
      });
      showStatus(`✓ ${data.files.length} foto berhasil diupload!`);
    }
  } catch (e) { showStatus('✗ Error saat upload foto', true); }
  photoInput.value = '';
}

function addPhotoItem(filename) {
  const list = document.getElementById('photoList');
  const div  = document.createElement('div');
  div.className    = 'upload-item';
  div.dataset.file = filename;
  div.dataset.type = 'photo';
  div.innerHTML = `
    <span class="item-icon">📷</span>
    <span class="item-name">${filename}</span>
    <button class="item-delete" onclick="deleteFile('${filename}','photo')">✕</button>
  `;
  list.appendChild(div);
}

function addPhotoToGallery(filename, url) {
  const gallery = document.getElementById('photoGallery');
  const emptyEl = gallery.querySelector('.gallery-empty');
  if (emptyEl) emptyEl.remove();
  const div = document.createElement('div');
  div.className = 'photo-frame' + (player.isPlaying ? ' dancing' : '');
  div.innerHTML = `
    <div class="frame-outer">
      <div class="frame-corner fc-tl"></div><div class="frame-corner fc-tr"></div>
      <div class="frame-corner fc-bl"></div><div class="frame-corner fc-br"></div>
      <div class="frame-inner">
        <img src="${url}" alt="Memory" class="photo-img">
        <div class="photo-caption">✦ memory ✦</div>
      </div>
    </div>
    <div class="photo-shadow"></div>
  `;
  gallery.appendChild(div);
}

// Delete
async function deleteFile(filename, type) {
  const url = type === 'music'
    ? `/delete_music/${encodeURIComponent(filename)}`
    : `/delete_photo/${encodeURIComponent(filename)}`;
  try {
    const res  = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      document.querySelectorAll(`.upload-item[data-file="${filename}"]`).forEach(el => el.remove());
      if (type === 'music') {
        await player.refreshTracklist();
        showStatus(`✓ ${filename} dihapus`);
      } else {
        document.querySelectorAll('.photo-frame').forEach(frame => {
          const img = frame.querySelector('img');
          if (img && decodeURIComponent(img.src).includes(filename)) frame.remove();
        });
        showStatus('✓ Foto dihapus');
      }
    }
  } catch (e) { showStatus('✗ Error saat menghapus', true); }
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('uploadStatus');
  el.textContent  = msg;
  el.style.color  = isError ? '#c0392b' : '#2a7f7f';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = ''; }, 4000);
}

window.deleteFile = deleteFile;
