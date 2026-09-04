const bgmAudio = new Audio();
bgmAudio.loop = true;
bgmAudio.volume = 0.4;
let isBgmPlaying = false;

function toggleBgmPlay() {
    const btn = document.getElementById('bgmToggleBtn');
    const select = document.getElementById('bgmSelect');

    if (!bgmAudio.src) {
        bgmAudio.src = select.value;
    }

    if (isBgmPlaying) {
        bgmAudio.pause();
        isBgmPlaying = false;
        btn.innerText = '재생';
    } else {
        bgmAudio.play().then(() => {
            isBgmPlaying = true;
            btn.innerText = '정지';
        }).catch(err => {
            console.log("오디오 재생 에러:", err);
        });
    }
}

function switchBgm() {
    const btn = document.getElementById('bgmToggleBtn');
    const select = document.getElementById('bgmSelect');

    bgmAudio.src = select.value;
    bgmAudio.play().then(() => {
        isBgmPlaying = true;
        btn.innerText = '정지';
    }).catch(err => {
        console.log("곡 변경 재생 대기:", err);
    });
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

let wasBgmPlayingBeforeVideo = false;

function openVideoModal(videoSrc, dateText, descText) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('modalVideoPlayer');
    const dateElem = document.getElementById('modalVideoDate');
    const descElem = document.getElementById('modalVideoDesc');
    const bgmBtn = document.getElementById('bgmToggleBtn');

    if (isBgmPlaying) {
        wasBgmPlayingBeforeVideo = true;
        bgmAudio.pause();
        isBgmPlaying = false;
        if (bgmBtn) bgmBtn.innerText = '재생';
    } else {
        wasBgmPlayingBeforeVideo = false;
    }

    player.src = videoSrc;
    dateElem.innerText = dateText;
    descElem.innerText = descText;
    player.muted = true;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    player.load();
    const playPromise = player.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => console.log("자동재생 차단됨:", err));
    }
}

function closeVideoModal(event) {
    if (event.target.id === 'videoModal') {
        forceCloseModal();
    }
}

function forceCloseModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('modalVideoPlayer');
    const bgmBtn = document.getElementById('bgmToggleBtn');

    player.pause();
    player.removeAttribute('src');
    player.load();

    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (wasBgmPlayingBeforeVideo) {
        bgmAudio.play().then(() => {
            isBgmPlaying = true;
            if (bgmBtn) bgmBtn.innerText = '정지';
        }).catch(err => console.log("BGM 복구 에러:", err));
        wasBgmPlayingBeforeVideo = false;
    }
}

function openImageModal(item) {
    const img = item.querySelector('img');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalFullImage');
    const caption = document.getElementById('modalImageCaption');

    modalImg.src = img.src;
    caption.innerText = img.alt || '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageModal(event) {
    if (event.target.id === 'imageModal') {
        closeImageModalDirect();
    }
}

function closeImageModalDirect() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalFullImage');

    modal.classList.remove('active');
    modalImg.src = '';
    document.body.style.overflow = '';
}