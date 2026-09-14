let currentFilter = 'pending';

document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('recentMemorialOrder');
    if (rawData) {
        const order = JSON.parse(rawData);
        const nameEl = document.getElementById('adminPetName');
        if (nameEl) nameEl.innerText = order.petName || '코코';
    }

    renderCards();
});

function getMemories() {
    return JSON.parse(localStorage.getItem('pendingMemories') || '[]');
}

function saveMemories(list) {
    localStorage.setItem('pendingMemories', JSON.stringify(list));
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));

    // 클릭된 버튼 활성화
    const clickedBtn = Array.from(document.querySelectorAll('.filter-tab')).find(btn =>
        btn.getAttribute('onclick')?.includes(`'${filter}'`)
    );
    if (clickedBtn) clickedBtn.classList.add('active');

    renderCards();
}

function updateCounts(list) {
    const pCount = list.filter(item => item.status === 'pending').length;
    const aCount = list.filter(item => item.status === 'approved').length;
    const uCount = list.filter(item => item.status === 'unposted' || item.status === 'private').length;

    const pEl = document.getElementById('countPending');
    const aEl = document.getElementById('countApproved');
    const uEl = document.getElementById('countUnposted');

    if (pEl) pEl.innerText = pCount;
    if (aEl) aEl.innerText = aCount;
    if (uEl) uEl.innerText = uCount;
}

// 개별 사진 토글
function toggleFileExclude(itemId, fileIndex) {
    const list = getMemories();
    const item = list.find(m => m.id === itemId);
    if (!item || !item.files[fileIndex]) return;

    item.files[fileIndex].excluded = !item.files[fileIndex].excluded;
    saveMemories(list);
    renderCards();
}

// 해당 카드의 전체 사진 선택 / 전체 해제
function toggleAllFiles(itemId) {
    const list = getMemories();
    const item = list.find(m => m.id === itemId);
    if (!item || !item.files || item.files.length === 0) return;

    const hasChecked = item.files.some(f => !f.excluded);
    item.files.forEach(f => {
        f.excluded = hasChecked;
    });

    saveMemories(list);
    renderCards();
}

// 1. 사진 분리 결정 시 원본 정보(originId, originFiles)를 함께 보존
function applyMediaDecision(itemId) {
    const list = getMemories();
    const index = list.findIndex(m => m.id === itemId);
    if (index === -1) return;

    const currentItem = list[index];
    const approvedFiles = currentItem.files.filter(f => !f.excluded);
    const unpostedFiles = currentItem.files.filter(f => f.excluded);

    // 원본 ID 추적 (이미 분리된 적 있다면 기존 originId 유지, 처음이면 현재 id)
    const originId = currentItem.originId || currentItem.id;
    // 원래 전체 사진 세트 보존
    const fullOriginalFiles = currentItem.originFiles || JSON.parse(JSON.stringify(currentItem.files));

    list.splice(index, 1);

    if (approvedFiles.length > 0 && unpostedFiles.length > 0) {
        // [일부 승인 + 일부 제외]: 두 개로 분리하되, 원본 추적 꼬리표를 달아둠
        const approvedItem = {
            ...currentItem,
            id: 'MEM-APP-' + Date.now(),
            originId: originId,
            originFiles: fullOriginalFiles,
            files: approvedFiles.map(f => ({ ...f, excluded: false })),
            status: 'approved'
        };
        const unpostedItem = {
            ...currentItem,
            id: 'MEM-UNP-' + (Date.now() + 1),
            originId: originId,
            originFiles: fullOriginalFiles,
            files: unpostedFiles.map(f => ({ ...f, excluded: true })),
            status: 'unposted'
        };

        list.unshift(approvedItem);
        list.unshift(unpostedItem);
        showToast(`${approvedFiles.length}장은 전시 승인, ${unpostedFiles.length}장은 제외 탭으로 이동했습니다.`);

    } else if (approvedFiles.length > 0 && unpostedFiles.length === 0) {
        // [전체 승인]
        currentItem.status = 'approved';
        currentItem.files.forEach(f => f.excluded = false);
        list.unshift(currentItem);
        showToast("모든 사진이 전시 승인되었습니다.");

    } else {
        // [전체 제외]
        currentItem.status = 'unposted';
        currentItem.files.forEach(f => f.excluded = true);
        list.unshift(currentItem);
        showToast("모든 사진이 제외 처리되었습니다.");
    }

    saveMemories(list);
    renderCards();
}

// 2. 다시 검수 시: 분리되었던 짝꿍 카드를 함께 찾아 3장 원본 1개로 복구
function revertStatus(itemId) {
    let list = getMemories();
    const targetItem = list.find(m => m.id === itemId);
    if (!targetItem) return;

    // 분리되어 나뉘어졌던 카드인지 확인
    if (targetItem.originId && targetItem.originFiles) {
        const oId = targetItem.originId;

        // 원본 3장 데이터를 가진 깨끗한 복원 카드 생성
        const restoredOriginalItem = {
            ...targetItem,
            id: oId,
            status: 'pending',
            files: targetItem.originFiles.map(f => ({ ...f, excluded: false })), // 모두 체크된 상태로 복원
            originId: undefined,
            originFiles: undefined
        };

        // 승인탭, 제외탭에 쪼개져 흩어져 있던 관련 카드들을 목록에서 전부 제거
        list = list.filter(m => m.id !== itemId && m.originId !== oId && m.id !== oId);

        // 복원된 3장 원본 카드 1개만 대기함 맨 앞에 삽입
        list.unshift(restoredOriginalItem);

    } else {
        // 쪼개지지 않고 통째로 넘어갔던 카드 복귀
        targetItem.status = 'pending';
        if (targetItem.files) {
            targetItem.files.forEach(f => f.excluded = false);
        }
    }

    saveMemories(list);
    showToast("처음 받았던 3장 전체가 대기함으로 복원되었습니다.");
    setFilter('pending');
}

function renderCards() {
    const list = getMemories();
    updateCounts(list);

    const filtered = list.filter(item => {
        if (currentFilter === 'unposted') {
            return item.status === 'unposted' || item.status === 'private';
        }
        return item.status === currentFilter;
    });

    const container = document.getElementById('memoryCardList');
    if (!container) return;
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">해당하는 추억 조각이 없습니다.</div>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'archive-card';

        let mediaHtml = '';
        let checkedCount = 0;
        const totalFiles = item.files ? item.files.length : 0;

        if (totalFiles > 0) {
            mediaHtml = '<div class="media-preview-box">';
            item.files.forEach((f, idx) => {
                const isExcluded = f.excluded === true;
                if (!isExcluded) checkedCount++;

                const mediaTag = f.type === 'video'
                    ? `<video src="${f.data}" controls playsinline></video>`
                    : `<img src="${f.data}" alt="추억 사진">`;

                const checkSvg = `
                    <svg viewBox="0 0 16 16" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3.5 8.5 6.5 11.5 12.5 5"></polyline>
                    </svg>
                `;

                const clickAction = (currentFilter === 'pending')
                    ? `onclick="toggleFileExclude('${item.id}', ${idx})"`
                    : '';

                mediaHtml += `
                    <div class="media-thumbnail ${isExcluded ? 'excluded' : ''}" ${clickAction}>
                        ${mediaTag}
                        ${currentFilter === 'pending' ? `
                            <button type="button" class="btn-toggle-check ${isExcluded ? 'unchecked' : 'checked'}">
                                ${checkSvg}
                            </button>
                        ` : ''}
                    </div>
                `;
            });
            mediaHtml += '</div>';
        }

        // 1. 헤더 우측 액션: 대기 탭일 때는 비워두고, 승인/제외 탭일 때만 '다시 검수' 버튼 노출
        const topActionHtml = (currentFilter === 'pending')
            ? ''
            : `<button type="button" class="btn-revert-mini" onclick="revertStatus('${item.id}')">↩ 다시 검수</button>`;

        // 2. 하단 액션바: 대기 탭일 때만 결정 버튼 노출
        let actionBarHtml = '';
        if (currentFilter === 'pending') {
            const hasChecked = checkedCount > 0;
            const toggleBtnText = (checkedCount === totalFiles) ? '전체 해제' : '전체 선택';
            const approveBtnText = hasChecked ? `🌿 선택한 ${checkedCount}장 전시하기` : `🚫 전시 제외하고 보관`;
            const approveBtnClass = hasChecked ? 'btn-approve-submit' : 'btn-approve-submit mode-reject';

            actionBarHtml = `
                <div class="card-action-bar">
                    <button type="button" class="btn-status btn-toggle-all" onclick="toggleAllFiles('${item.id}')">
                        ${toggleBtnText}
                    </button>
                    <button type="button" class="btn-status ${approveBtnClass}" onclick="applyMediaDecision('${item.id}')">
                        ${approveBtnText}
                    </button>
                </div>
            `;
        }

        // 3. 카드 조립 (헤더 좌측: 이름+관계+날짜, 헤더 우측: 다시검수 버튼)
        card.innerHTML = `
            <div class="card-top-info">
                <div class="sender-profile">
                    <span class="sender-name">${item.sender}</span>
                    <span class="sender-relation">${item.relation}</span>
                    <span class="submit-date">${item.submittedAt}</span>
                </div>
                ${topActionHtml}
            </div>
            ${mediaHtml}
            <div class="card-story-text">${item.story}</div>
            ${actionBarHtml}
        `;

        container.appendChild(card);
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