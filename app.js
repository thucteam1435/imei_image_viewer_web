// app.js - IMEI Image Viewer (Copy & Download All Images)
let currentImages = [];

// -------------------- FETCH FROM APPS SCRIPT --------------------
function fetchFromGas() {
    const gasUrl = document.getElementById('gasUrl').value.trim();
    const imei = document.getElementById('imeiInput').value.trim();
    if (!gasUrl) return alert('Vui lòng nhập Apps Script API URL.');
    if (!imei) return alert('Vui lòng nhập IMEI.');

    const u = new URL(gasUrl);
    u.searchParams.set('imei', imei);

    const container = document.getElementById('images');
    container.innerHTML = '⏳ Đang gọi API...';

    fetch(u.toString())
        .then(r => {
            if (!r.ok) throw new Error('API trả lỗi: ' + r.status);
            return r.json();
        })
        .then(data => {
            if (!Array.isArray(data)) throw new Error('API phải trả về mảng JSON.');
            loadImages(data);
        })
        .catch(err => {
            alert('Lỗi khi gọi API: ' + err.message);
            container.innerHTML = '';
        });
}

// -------------------- LOAD FROM TEXTAREA --------------------
function loadFromTextarea() {
    const raw = document.getElementById('manualUrls').value.trim();
    if (!raw) return alert('Dán ít nhất 1 link ảnh');
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const imgs = lines.map((u, i) => ({ name: 'image_' + (i + 1), url: u }));
    loadImages(imgs);
}

// -------------------- LOAD IMAGES TO GRID --------------------
function loadImages(images) {
    currentImages = images;
    const container = document.getElementById('images');
    if (!images || images.length === 0) {
        container.innerHTML = '<p>Không có ảnh.</p>';
        return;
    }
    container.innerHTML = images.map((img, idx) => `
    <div class="image-card">
      <img src="${img.url}" alt="${escapeHtml(img.name)}" />
      <div class="meta">${escapeHtml(img.name)}</div>
    </div>
  `).join('');
}

// -------------------- COPY ALL IMAGES TO CLIPBOARD --------------------
async function copyAllImages() {
    if (!currentImages || currentImages.length === 0) return alert('Không có ảnh để copy.');

    const items = [];
    for (const imgData of currentImages) {
        try {
            const res = await fetch(imgData.url);
            const blob = await res.blob();
            items.push(new ClipboardItem({ [blob.type]: blob }));
        } catch (e) {
            console.warn('Không tải được ảnh', imgData.url, e);
        }
    }

    if (items.length === 0) return alert('❌ Không tải được ảnh để copy.');
    try {
        await navigator.clipboard.write(items);
        alert('✅ Đã copy tất cả ảnh vào clipboard (nếu trình duyệt hỗ trợ).');
    } catch (e) {
        alert('⚠️ Trình duyệt không hỗ trợ copy nhiều ảnh.\nBạn có thể tải về để dùng thủ công.');
    }
}

// -------------------- DOWNLOAD ALL IMAGES --------------------
async function downloadAllImages() {
    if (!currentImages || currentImages.length === 0) return alert('Không có ảnh để tải.');

    for (let i = 0; i < currentImages.length; i++) {
        const it = currentImages[i];
        const a = document.createElement('a');
        a.href = it.url;
        a.download = sanitizeFilename(it.name || ('image_' + (i + 1)));
        document.body.appendChild(a);
        a.click();
        a.remove();
        await new Promise(r => setTimeout(r, 300));
    }

    alert('✅ Đã bắt đầu tải tất cả ảnh (mở folder tải để kiểm tra).');
}

// -------------------- CLEAR ALL --------------------
function clearAll() {
    currentImages = [];
    document.getElementById('images').innerHTML = '';
    document.getElementById('manualUrls').value = '';
    document.getElementById('gasUrl').value = '';
    document.getElementById('imeiInput').value = '';
}

// -------------------- HELPERS --------------------
function escapeHtml(s) {
    return (s + '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function sanitizeFilename(n) {
    return (n || 'image').replace(/[^a-z0-9.\-_]/gi, '_');
}
