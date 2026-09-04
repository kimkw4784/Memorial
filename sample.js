const bgmAudio = new Audio();
bgmAudio.loop = true;
bgmAudio.volume = 0.4;
let isBgmPlaying = false;

function toggleBgmPlay() {
    const btn = document.getElementById('bgmToggleBtn');
    const select = document.getElementById('bgmSelect');

    if (!select.value) {
        select.selectedIndex = 1;
        bgmAudio.src = select.value;
    }

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

    if (!select.value) return;

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

// 기본 샘플 데이터 (초기 방문 시 노출용)
const DEFAULT_LETTERS = [
    { name: "수진", relation: "누나", msg: "코코야, 네가 없으니 방이 너무 조용해. 꿈속에 꼭 한번 놀러 와줘. 보고 싶다.", date: "2026.08.16" },
    { name: "민규", relation: "삼촌", msg: "갈 때마다 반갑게 꼬리 흔들어주던 모습이 생생하다. 좋은 곳에서 편히 쉬렴.", date: "2026.08.15" }
];

// 로컬스토리지에서 편지 불러오기 및 렌더링
function loadLetters() {
    const list = document.getElementById('letterList');
    if (!list) return;

    let saved = localStorage.getItem('memorial_letters');
    let letters = saved ? JSON.parse(saved) : DEFAULT_LETTERS;

    list.innerHTML = letters.map(letter => `
        <div class="letter-card">
            <div class="letter-header">
                <span class="letter-author">${letter.relation} ${letter.name}</span>
                <span class="letter-date">${letter.date}</span>
            </div>
            <p class="letter-content">${letter.msg}</p>
        </div>
    `).join('');
}

function handleLetterSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('letterName');
    const relationInput = document.getElementById('letterRelation');
    const msgInput = document.getElementById('letterMsg');

    const name = nameInput.value.trim();
    const relation = relationInput.value.trim();
    const msg = msgInput.value.trim();

    if (!name || !relation || !msg) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const currentDate = `${yyyy}.${mm}.${dd}`;

    const newLetter = {
        name: name,
        relation: relation,
        msg: msg,
        date: currentDate
    };

    let saved = localStorage.getItem('memorial_letters');
    let letters = saved ? JSON.parse(saved) : [...DEFAULT_LETTERS];
    letters.unshift(newLetter);

    localStorage.setItem('memorial_letters', JSON.stringify(letters));
    loadLetters();

    nameInput.value = '';
    relationInput.value = '';
    msgInput.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    loadLetters();
});

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

function copyMemorialLink() {
    const currentUrl = window.location.href;

    navigator.clipboard.writeText(currentUrl).then(() => {
        showToast("추모관 링크가 복사되었습니다.");
    }).catch(() => {
        const tempInput = document.createElement("input");
        tempInput.value = currentUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        showToast("추모관 링크가 복사되었습니다.");
    });
}

function showToast(message) {
    const toast = document.getElementById("toastMessage");
    if (!toast) return;

    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}