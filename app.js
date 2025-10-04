// app.js - client logic for static IMEI Image Viewer
let currentImages = [];

/**
 * Expectation:
 * If user sets a valid Apps Script API URL that accepts GET ?imei=..., the API should return JSON:
 * [ { "name": "...", "url": "https://..." }, ... ]
 *
 * Otherwise, user can paste image URLs manually into textarea.
 */

function fetchFromGas(){
  const gasUrl = document.getElementById('gasUrl').value.trim();
  const imei = document.getElementById('imeiInput').value.trim();
  if(!gasUrl) return alert('Vui lòng nhập Apps Script API URL.');
  if(!imei) return alert('Vui lòng nhập IMEI.');
  const u = new URL(gasUrl);
  u.searchParams.set('imei', imei);
  document.getElementById('images').innerHTML = '⏳ Đang gọi API...';
  fetch(u.toString()).then(r=>{
    if(!r.ok) throw new Error('API trả lỗi: '+r.status);
    return r.json();
  }).then(data=>{
    if(!Array.isArray(data)) throw new Error('API phải trả về mảng JSON.');
    loadImages(data);
  }).catch(err=>{
    alert('Lỗi khi gọi API: '+err.message);
    document.getElementById('images').innerHTML = '';
  });
}

function loadFromTextarea(){
  const raw = document.getElementById('manualUrls').value.trim();
  if(!raw) return alert('Dán ít nhất 1 link ảnh');
  const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const imgs = lines.map((u,i)=>({ name: 'image_'+(i+1), url: u }));
  loadImages(imgs);
}

function loadImages(images){
  currentImages = images;
  const container = document.getElementById('images');
  if(!images || images.length===0){ container.innerHTML = '<p>Không có ảnh.</p>'; return; }
  container.innerHTML = images.map((img, idx)=>`
    <div class="image-card">
      <img data-i="${idx}" src="${img.url}" alt="${img.name}" onclick="openPreview(${idx})" />
      <div class="meta">${escapeHtml(img.name)}</div>
      <div class="actions">
        <button class="small" onclick="copyLink(event, '${img.url}')">📋 Copy link</button>
        <button class="small" onclick="downloadSingle(event, '${img.url}', '${sanitizeFilename(img.name)}')">⬇️ Download</button>
      </div>
    </div>
  `).join('');
}

// helper: escape
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function sanitizeFilename(n){ return (n||'image').replace(/[^a-z0-9.\-_]/gi,'_'); }

// copy single link (text)
function copyLink(ev, url){
  ev.stopPropagation();
  navigator.clipboard.writeText(url).then(()=>alert('✅ Đã copy link ảnh')).catch(e=>alert('❌ Không thể copy: '+e.message));
}

// download single
function downloadSingle(ev, url, name){
  ev.stopPropagation();
  const a = document.createElement('a');
  a.href = url;
  a.download = name||'image.jpg';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// copy all links (one-per-line)
function copyAllLinks(){
  if(!currentImages || currentImages.length===0) return alert('Không có ảnh để copy');
  const txt = currentImages.map(i=>i.url).join('\n');
  navigator.clipboard.writeText(txt).then(()=>alert('✅ Đã copy toàn bộ link ảnh')).catch(e=>alert('❌ Lỗi khi copy: '+e.message));
}

// open modal preview (copy box)
function openCopyBox(){
  const box = document.getElementById('copyBox');
  const content = document.getElementById('copyContent');
  if(!currentImages || currentImages.length===0){ alert('Không có ảnh'); return; }
  content.innerHTML = currentImages.map(i=>`<img src="${i.url}" style="max-width:220px; margin:6px; border-radius:6px;">`).join('');
  box.style.display = 'flex';
}

// try to copy all images as blobs (may fail in some hosts)
async function tryCopyAll(){
  const imgs = Array.from(document.querySelectorAll('#copyContent img'));
  if(imgs.length===0) return alert('Không có ảnh trong hộp');
  const items = [];
  for(const img of imgs){
    try{
      const r = await fetch(img.src);
      const b = await r.blob();
      items.push(new ClipboardItem({ [b.type]: b }));
    }catch(e){
      console.warn('fetch err', e);
    }
  }
  if(items.length===0) return alert('Không tải được ảnh để copy.');
  try{
    await navigator.clipboard.write(items);
    alert('✅ Đã copy ảnh vào clipboard (nếu browser hỗ trợ).');
  }catch(e){
    alert('⚠️ Trình duyệt không cho phép copy hàng loạt ảnh.\nBạn có thể dùng Ctrl+A → Ctrl+C trong hộp để sao chép thủ công.');
  }
}

function closeCopyBox(){ document.getElementById('copyBox').style.display='none'; }

// download all images sequentially (no zip)
async function downloadAll(){
  if(!currentImages || currentImages.length===0) return alert('Không có ảnh để tải');
  for(let i=0;i<currentImages.length;i++){
    const it = currentImages[i];
    downloadSingle(new Event('click'), it.url, sanitizeFilename(it.name||('image_'+(i+1))));
    await new Promise(r=>setTimeout(r, 450));
  }
  alert('✅ Đã bắt đầu tải tất cả ảnh (mở folder tải để kiểm tra).');
}
