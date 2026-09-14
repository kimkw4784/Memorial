let currentFilter = 'pending';

function normalizeDate(dateStr) {
    if (!dateStr) return '';
    // 숫자만 추출 후 'YYYY. MM. DD.' 형태로 조립
    const cleaned = dateStr.replace(/[^\d]/g, '');
    if (cleaned.length === 8) {
        return `${cleaned.slice(0, 4)}. ${cleaned.slice(4, 6)}. ${cleaned.slice(6, 8)}.`;
    }
    return dateStr.trim();
}

document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('recentMemorialOrder');
    if (rawData) {
        const order = JSON.parse(rawData);
        const nameEl = document.getElementById('adminPetName');
        if (nameEl) nameEl.innerText = order.petName || '코코';
    }

    renderCards();
    renderAdminTimeline();
});

// =========================================
// 1. 지인 사진/영상 검수 로직
// =========================================
function getMemories() {
    return JSON.parse(localStorage.getItem('pendingMemories') || '[]');
}

function saveMemories(list) {
    localStorage.setItem('pendingMemories', JSON.stringify(list));
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));

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

function toggleFileExclude(itemId, fileIndex) {
    const list = getMemories();
    const item = list.find(m => m.id === itemId);
    if (!item || !item.files[fileIndex]) return;

    item.files[fileIndex].excluded = !item.files[fileIndex].excluded;
    saveMemories(list);
    renderCards();
}

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

function applyMediaDecision(itemId) {
    const list = getMemories();
    const index = list.findIndex(m => m.id === itemId);
    if (index === -1) return;

    const currentItem = list[index];
    const approvedFiles = currentItem.files.filter(f => !f.excluded);
    const unpostedFiles = currentItem.files.filter(f => f.excluded);

    const originId = currentItem.originId || currentItem.id;
    const fullOriginalFiles = currentItem.originFiles || JSON.parse(JSON.stringify(currentItem.files));

    list.splice(index, 1);

    if (approvedFiles.length > 0 && unpostedFiles.length > 0) {
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
        currentItem.status = 'approved';
        currentItem.files.forEach(f => f.excluded = false);
        list.unshift(currentItem);
        showToast("모든 사진이 전시 승인되었습니다.");

    } else {
        currentItem.status = 'unposted';
        currentItem.files.forEach(f => f.excluded = true);
        list.unshift(currentItem);
        showToast("모든 사진이 제외 처리되었습니다.");
    }

    saveMemories(list);
    renderCards();
}

function revertStatus(itemId) {
    let list = getMemories();
    const targetItem = list.find(m => m.id === itemId);
    if (!targetItem) return;

    if (targetItem.originId && targetItem.originFiles) {
        const oId = targetItem.originId;
        const restoredOriginalItem = {
            ...targetItem,
            id: oId,
            status: 'pending',
            files: targetItem.originFiles.map(f => ({ ...f, excluded: false })),
            originId: undefined,
            originFiles: undefined
        };

        list = list.filter(m => m.id !== itemId && m.originId !== oId && m.id !== oId);
        list.unshift(restoredOriginalItem);

    } else {
        targetItem.status = 'pending';
        if (targetItem.files) {
            targetItem.files.forEach(f => f.excluded = false);
        }
    }

    saveMemories(list);
    showToast("처음 받았던 전체 사진이 대기함으로 복원되었습니다.");
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

        const topActionHtml = (currentFilter === 'pending')
            ? ''
            : `<button type="button" class="btn-revert-mini" onclick="revertStatus('${item.id}')">↩ 다시 검수</button>`;

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

// =========================================
// 2. 발자취 타임라인 관리 로직 (CRUD)
// =========================================
function getTimelineList() {
    const raw = localStorage.getItem('memorial_timeline_list');
    if (raw) return JSON.parse(raw);

    const orderRaw = localStorage.getItem('recentMemorialOrder');
    const order = orderRaw ? JSON.parse(orderRaw) : {};
    const name = order.petName || '아이';

    const defaultList = [
        {
            id: 'TL-1',
            date: normalizeDate(order.meetDate) || '2013.05.10',
            story: `손바닥만 하던 ${name}이가 처음 우리 집에 오던 날, 온 세상이 따뜻해졌어.`
        },
        {
            id: 'TL-2',
            date: normalizeDate(order.farewellDate) || '2026.02.15',
            story: '가족들의 품에서 조용히 눈을 감고, 가장 빛나는 별이 된 날.'
        }
    ];
    localStorage.setItem('memorial_timeline_list', JSON.stringify(defaultList));
    return defaultList;
}

function renderAdminTimeline() {
    const list = getTimelineList();
    const container = document.getElementById('adminTimelineList');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<div class="empty-state" style="padding: 24px;">등록된 발자취가 없습니다.</div>`;
        return;
    }

    // YYYY.MM.DD 기준 오름차순(과거 -> 최신) 정렬
    list.sort((a, b) => {
        const timeA = new Date(a.date.replace(/\./g, '-')).getTime() || 0;
        const timeB = new Date(b.date.replace(/\./g, '-')).getTime() || 0;
        return timeA - timeB;
    });

    container.innerHTML = list.map(item => `
        <div class="admin-timeline-item" id="tlItem-${item.id}">
            <div class="admin-tl-meta">
                <span class="admin-tl-date">${item.date}</span>
                <span class="admin-tl-text">${item.story}</span>
            </div>
            <div class="admin-tl-actions">
                <button type="button" class="btn-tl-edit" onclick="startEditTimeline('${item.id}')">수정</button>
                <button type="button" class="btn-tl-delete" onclick="deleteTimelineItem('${item.id}')">삭제</button>
            </div>
        </div>
    `).join('');
}

function handleAddTimeline(e) {
    e.preventDefault();
    const dateInput = document.getElementById('timelineDate');
    const storyInput = document.getElementById('timelineStory');

    const formattedDate = normalizeDate(dateInput.value);
    const storyVal = storyInput.value.trim();

    if (!formattedDate || !storyVal) return;

    const list = getTimelineList();
    list.push({
        id: 'TL-' + Date.now(),
        date: formattedDate,
        story: storyVal
    });

    localStorage.setItem('memorial_timeline_list', JSON.stringify(list));
    renderAdminTimeline();
    showToast("발자취가 등록되었습니다.");

    dateInput.value = '';
    storyInput.value = '';
}

function startEditTimeline(id) {
    const list = getTimelineList();
    const target = list.find(item => item.id === id);
    if (!target) return;

    const itemEl = document.getElementById(`tlItem-${id}`);
    if (!itemEl) return;

    itemEl.classList.add('editing');
    const nums = target.date.replace(/[^\d]/g, '');
    const pickerVal = `${nums.slice(0, 4)}-${nums.slice(4, 6)}-${nums.slice(6, 8)}`;

    itemEl.innerHTML = `
        <form class="edit-mode-form" onsubmit="saveEditTimeline(event, '${id}')">
            <input type="date" id="editDate-${id}" class="edit-input-date" value="${pickerVal}" required>
            <input type="text" id="editStory-${id}" class="edit-input-story" value="${target.story}" required>
            <div class="edit-action-row">
                <button type="submit" class="btn-edit-save">완료</button>
                <button type="button" class="btn-edit-cancel" onclick="renderAdminTimeline()">취소</button>
            </div>
        </form>
    `;
}

function saveEditTimeline(e, id) {
    e.preventDefault();
    const dateVal = document.getElementById(`editDate-${id}`).value;
    const storyVal = document.getElementById(`editStory-${id}`).value.trim();

    if (!dateVal || !storyVal) return;

    let list = getTimelineList();
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1) {
        list[idx].date = normalizeDate(dateVal);
        list[idx].story = storyVal;
        localStorage.setItem('memorial_timeline_list', JSON.stringify(list));
        showToast("발자취가 수정되었습니다.");
    }

    renderAdminTimeline();
    list.sort((a, b) => {
        const numA = parseInt(a.date.replace(/[^\d]/g, ''), 10) || 0;
        const numB = parseInt(b.date.replace(/[^\d]/g, ''), 10) || 0;
        return numA - numB;
    });
}

function deleteTimelineItem(id) {
    if (!confirm("이 발자취를 삭제하시겠습니까?")) return;
    let list = getTimelineList();
    list = list.filter(item => item.id !== id);
    localStorage.setItem('memorial_timeline_list', JSON.stringify(list));
    renderAdminTimeline();
    showToast("발자취가 삭제되었습니다.");
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