let isBgmPlaying = true;

function toggleBgmPlay() {
    const btn = document.getElementById('bgmToggleBtn');
    isBgmPlaying = !isBgmPlaying;
    btn.innerText = isBgmPlaying ? '정지' : '재생';
}

function switchBgm() {
    const btn = document.getElementById('bgmToggleBtn');
    isBgmPlaying = true;
    btn.innerText = '정지';
}

function addInteractCount(btn) {
    const cntSpan = btn.querySelector('.cnt');
    if (cntSpan) {
        let cnt = parseInt(cntSpan.innerText, 10);
        cntSpan.innerText = cnt + 1;
        btn.style.transform = 'scale(1.08)';
        setTimeout(() => { btn.style.transform = 'scale(1)'; }, 150);
    }
}

function toggleVideoSound() {
    const video = document.getElementById('sampleVideo');
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');

    if (video.muted) {
        video.muted = false;
        icon.innerText = '🔊';
        text.innerText = '음소거';
    } else {
        video.muted = true;
        icon.innerText = '🔇';
        text.innerText = '소리 켜기';
    }
}

function handleLetterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('letterName').value;
    const relation = document.getElementById('letterRelation').value;
    const msg = document.getElementById('letterMsg').value;

    const card = document.createElement('div');
    card.className = 'letter-card';
    card.innerHTML = `
        <div class="letter-header">
            <span class="letter-author">${relation} ${name}</span>
            <span class="letter-date">방금 전</span>
        </div>
        <p class="letter-content">${msg}</p>
    `;

    const list = document.getElementById('letterList');
    list.insertBefore(card, list.firstChild);

    document.getElementById('letterName').value = '';
    document.getElementById('letterRelation').value = '';
    document.getElementById('letterMsg').value = '';
}