function updateLivePreview() {
    const name = document.getElementById('petNameInput').value || '우리 아이';
    const meetDate = document.getElementById('petMeetInput').value;
    const farewellDate = document.getElementById('petFarewellInput').value;
    const quote = document.getElementById('petQuoteInput').value || '영원히 기억할게.';

    document.getElementById('liveName').innerText = name;
    document.getElementById('liveQuoteText').innerText = quote;

    if (meetDate && farewellDate) {
        const start = new Date(meetDate);
        const end = new Date(farewellDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const startStr = meetDate.replace(/-/g, '.');
        const endStr = farewellDate.replace(/-/g, '.');

        document.getElementById('liveDates').innerHTML = `
                    <span>${startStr} — ${endStr}</span>
                    <span class="dates-dday">함께한 ${diffDays.toLocaleString()}일의 여정</span>
                `;
    }
}

function selectPetType(btn, type) {
    document.querySelectorAll('.pet-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const g1 = document.getElementById('giftInput1');
    const g2 = document.getElementById('giftInput2');

    if (type === 'dog') {
        g1.value = '좋아하던 간식';
        g2.value = '테니스공';
    } else if (type === 'cat') {
        g1.value = '맛있는 츄르';
        g2.value = '낚싯대';
    } else if (type === 'small') {
        g1.value = '해바라기씨';
        g2.value = '신선한 건초';
    }
    updateLiveGifts();
}

function updateLiveGifts() {
    const g1Val = document.getElementById('giftInput1').value || '첫 번째 선물';
    const g2Val = document.getElementById('giftInput2').value || '두 번째 선물';

    const live1 = document.getElementById('liveGift1');
    const live2 = document.getElementById('liveGift2');
    if (live1) live1.innerText = g1Val;
    if (live2) live2.innerText = g2Val;
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const avatar = document.getElementById('liveAvatar');
            avatar.innerHTML = `<img src="${e.target.result}" alt="업로드된 프로필">`;
        }
        reader.readAsDataURL(file);
    }
}

function addCount(btn) {
    const cntSpan = btn.querySelector('.cnt');
    if (cntSpan) {
        let count = parseInt(cntSpan.innerText, 10);
        cntSpan.innerText = count + 1;
        btn.style.borderColor = 'var(--accent-brown)';
        btn.style.transform = 'scale(1.05)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    }
}

function updateLiveBgm() {
    const bgmSelect = document.getElementById('petBgmSelect');
    const liveBgmText = document.getElementById('liveBgmText');
    if (bgmSelect && liveBgmText) {
        liveBgmText.innerText = bgmSelect.value;
    }
}