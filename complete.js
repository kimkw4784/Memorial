document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('recentMemorialOrder');

    if (rawData) {
        const order = JSON.parse(rawData);

        // 1. 상단 촛불 안내 배너 (주격 조사: 이/가)
        const noticeNameEl = document.getElementById('noticePetName');
        const noticeJosaEl = document.getElementById('noticePetJosa');

        if (noticeNameEl) {
            const name = order.petName || '아이';
            noticeNameEl.innerText = name;

            if (noticeJosaEl) {
                noticeJosaEl.innerText = getSubjectParticle(name);
            }
        }

        // 2. 하단 알림톡 배너 (목적격 조사: 이를/를)
        const smsNameEl = document.getElementById('smsPetName');
        const smsJosaEl = document.getElementById('smsPetJosa');

        if (smsNameEl) {
            const name = order.petName || '아이';
            smsNameEl.innerText = name;

            if (smsJosaEl) {
                smsJosaEl.innerText = getObjectParticle(name);
            }
        }

        // 3. 주문 정보 및 링크 바인딩
        if (order.applicantName) document.getElementById('applicantDisplay').innerText = order.applicantName;
        if (order.petName) document.getElementById('petNameDisplay').innerText = order.petName;

        const slug = order.roomSlug || '4K8F2G';
        const adminKey = order.adminKey || 'sec_' + Math.random().toString(36).substring(2, 10);

        // ⭐️ sample.html 대신 memorial.html 연결
        document.getElementById('memorialLinkInput').value = `https://memorial.me/memorial.html?room=${slug}`;
        document.getElementById('uploadLinkInput').value = `https://memorial.me/upload.html?room=${slug}`;

        const adminLinkInput = document.getElementById('adminSecretLinkInput');
        if (adminLinkInput) {
            adminLinkInput.value = `https://memorial.me/memorial.html?room=${slug}&key=${adminKey}`;
        }

        const viewBtn = document.getElementById('viewMemorialBtn');
        const adminBtn = document.getElementById('adminManageBtn');

        if (viewBtn) viewBtn.href = `memorial.html?room=${slug}`;
        if (adminBtn) adminBtn.href = `admin.html?room=${slug}&key=${adminKey}`;

        if (order.merchantUid) {
            document.getElementById('orderNumberDisplay').innerText = order.merchantUid;
        } else {
            document.getElementById('orderNumberDisplay').innerText = `ORD-${slug}`;
        }

        if (order.plan) {
            document.getElementById('planDisplay').innerText =
                order.plan === 'heritage' ? '헤리티지 패키지 (59,000원)' : '디지털 소장권 (19,500원)';
        }
    } else {
        const defaultSlug = '4K8F2G';
        const defaultKey = 'sec_w9a2kL9';

        document.getElementById('orderNumberDisplay').innerText = "ORD-4K8F2G";
        document.getElementById('memorialLinkInput').value = `https://memorial.me/${defaultSlug}`;
        document.getElementById('uploadLinkInput').value = `https://memorial.me/upload.html?room=${defaultSlug}`;

        const adminLinkInput = document.getElementById('adminSecretLinkInput');
        if (adminLinkInput) {
            adminLinkInput.value = `https://memorial.me/${defaultSlug}?key=${defaultKey}`;
        }

        const viewBtn = document.getElementById('viewMemorialBtn');
        const adminBtn = document.getElementById('adminManageBtn');
        if (viewBtn) viewBtn.href = `sample.html?room=${defaultSlug}`;
        if (adminBtn) adminBtn.href = `admin.html?room=${defaultSlug}&key=${defaultKey}`;
    }
});

// 한글 받침 유무에 따른 주격 조사(이/가) 판별 함수
function getSubjectParticle(name) {
    if (!name) return '가';
    const lastChar = name.charCodeAt(name.length - 1);
    if (lastChar < 0xAC00 || lastChar > 0xD7A3) return '가';
    return (lastChar - 0xAC00) % 28 > 0 ? '이가' : '가';
}

// 한글 받침 유무에 따른 목적격 조사(이를/를) 판별 함수
function getObjectParticle(name) {
    if (!name) return '를';
    const lastChar = name.charCodeAt(name.length - 1);
    if (lastChar < 0xAC00 || lastChar > 0xD7A3) return '를';
    return (lastChar - 0xAC00) % 28 > 0 ? '이를' : '를';
}

function copyLink(inputId) {
    const copyInput = document.getElementById(inputId);
    copyInput.select();
    copyInput.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(copyInput.value).then(() => {
        alert('링크가 클립보드에 복사되었습니다.');
    });
}