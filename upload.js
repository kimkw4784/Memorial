let selectedFiles = []; // 필수: 파일 담는 배열

// 기기 환경 감지 (모바일: 200MB, PC: 500MB)
function getMaxFileSize() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return {
        limit: isMobile ? 200 * 1024 * 1024 : 500 * 1024 * 1024,
        limitText: isMobile ? '200MB' : '500MB',
        isMobile: isMobile
    };
}

// 아이 이름 및 타이틀 연동
document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('recentMemorialOrder');
    if (rawData) {
        const order = JSON.parse(rawData);
        const petName = order.petName || '코코';

        document.title = `${petName}와의 추억 모으기 | 온새미로`;
        const nameEl = document.getElementById('targetPetName');
        const guideEl = document.getElementById('targetPetGuide');
        if (nameEl) nameEl.innerText = petName;
        if (guideEl) guideEl.innerText = petName;
    }
});

// 이미지 리사이징 & 압축 (가로세로 최대 1600px, 퀄리티 82%)
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1600;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                resolve({ dataUrl: compressedDataUrl, type: 'image' });
            };
        };
    });
}

// 파일 dataURL 변환기
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 미리보기 화면 추가
function appendPreviewItem(container, src, type, fileName) {
    const item = document.createElement('div');
    item.className = 'preview-item';

    if (type === 'video') {
        item.innerHTML = `
            <video src="${src}" muted playsinline></video>
            <button type="button" class="btn-remove-preview" onclick="removeFile(this, '${fileName}')">×</button>
        `;
    } else {
        item.innerHTML = `
            <img src="${src}" alt="미리보기">
            <button type="button" class="btn-remove-preview" onclick="removeFile(this, '${fileName}')">×</button>
        `;
    }

    container.appendChild(item);
}

// 첨부 파일 삭제
function removeFile(btn, fileName) {
    selectedFiles = selectedFiles.filter(f => f.name !== fileName);
    btn.parentElement.remove();
}

// 파일 선택 핸들러
async function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    const grid = document.getElementById('previewGrid');

    if (selectedFiles.length + files.length > 3) {
        alert("추억 파일은 최대 3개까지만 나누어 담을 수 있어요.");
        e.target.value = '';
        return;
    }

    const { limit, isMobile } = getMaxFileSize();
    const loader = document.getElementById('compressLoading');
    const progressText = document.getElementById('compressProgress');

    for (const file of files) {
        if (file.size > limit) {
            const currentMB = (file.size / (1024 * 1024)).toFixed(1);
            if (isMobile) {
                alert(`"${file.name}" 영상 용량(${currentMB}MB)이 커서 모바일 화면이 멈출 수 있어요.\n\n현재 링크를 복사하여 PC에서 접속하시면 최대 500MB까지 안전하게 담아내실 수 있습니다.`);
            } else {
                alert(`"${file.name}" 파일이 500MB를 초과하여 담지 못했습니다. 조금 더 짧은 영상으로 선택해 주세요.`);
            }
            continue;
        }

        if (loader) loader.style.display = 'flex';
        if (progressText) progressText.innerText = `"${file.name}" 추억을 고이 담아내는 중...`;

        try {
            if (file.type.startsWith('image/')) {
                const compressed = await compressImage(file);
                selectedFiles.push({ name: file.name, data: compressed.dataUrl, type: 'image' });
                appendPreviewItem(grid, compressed.dataUrl, 'image', file.name);
            } else if (file.type.startsWith('video/')) {
                const videoData = await readFileAsDataURL(file);
                selectedFiles.push({ name: file.name, data: videoData, type: 'video' });
                appendPreviewItem(grid, videoData, 'video', file.name);
            }
        } catch (err) {
            console.error("파일 처리 실패:", err);
            alert(`"${file.name}" 파일을 온전히 담아내지 못했어요. 잠시 후 다시 시도해 주세요.`);
        }
    }

    if (loader) loader.style.display = 'none';
    e.target.value = '';
}

// 최종 폼 제출
function handleUploadSubmit(e) {
    e.preventDefault();

    if (selectedFiles.length === 0) {
        alert("사진이나 영상을 최소 1개 이상 등록해 주세요.");
        return;
    }

    const newMemory = {
        id: 'MEM-' + Date.now(),
        sender: document.getElementById('senderName').value,
        relation: document.getElementById('senderRelation').value,
        story: document.getElementById('memoryStory').value,
        files: selectedFiles.map(f => ({ name: f.name, data: f.data, type: f.type })),
        status: 'pending', // 기본값: 승인 대기 중
        submittedAt: new Date().toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
    };

    // 로컬 스토리지에 검수 목록 누적
    const existingList = JSON.parse(localStorage.getItem('pendingMemories') || '[]');
    existingList.unshift(newMemory);
    localStorage.setItem('pendingMemories', JSON.stringify(existingList));

    showToast("소중한 추억이 가족분들께 안전하게 전달되었습니다.");

    setTimeout(() => {
        document.getElementById('memoryForm').reset();
        document.getElementById('previewGrid').innerHTML = '';
        selectedFiles = [];
    }, 800);
}

// 토스트 함수 추가
function showToast(message) {
    const toast = document.getElementById("toastMessage");
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}