import './styles.css';
import { icon } from './icons.js';
import { createDemoClient } from './demo.js';
import { deviceOnline, sensorValue, commandState, canControl } from './policy.js';

const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const toastEl = document.querySelector('#toast');
const tabs = [['overview', 'dashboard', 'Tổng quan'], ['controls', 'controls', 'Điều khiển'], ['tanks', 'tank', 'Bể cá'], ['notifications', 'bell', 'Thông báo'], ['settings', 'settings', 'Cài đặt']];
const outputs = [['airPump','wind','Sủi oxy','Giữ nước giàu oxy'],['fan','fan','Quạt làm mát','Lưu thông không khí'],['relay','plug','Nguồn phụ','Điều khiển tải ngoài'],['led1','sun','Đèn 1','Chiếu sáng bể cá'],['led2','sun','Đèn 2','Chiếu sáng bổ sung'],['led3','sun','Đèn 3','Chiếu sáng bổ sung']];
const sensors = [['waterTemperature','temp','Nhiệt độ nước','°C',1],['tds','drop','Chất lượng nước','ppm',0],['ambientTemperature','sun','Nhiệt độ phòng','°C',1],['humidity','wind','Độ ẩm','%',0],['adapterVoltage','bolt','Điện áp nguồn','V',1]];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt = (value,digits=1) => value === null ? '—' : Number(value).toFixed(digits);
const time = value => Number(value) > 0 ? new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}).format(new Date(value)) : 'Chưa cập nhật';
let state = {mode:'demo',user:null,tanks:[],notifications:[],connected:true,serverOffset:0};
let tab = 'overview', selectedTank = '', selectedSystem = '', client, demoClient, liveClient, firebaseConfig = null, liveState = null;
let servoAngle = 90, theme = readLocal('aquarium-theme') || 'light', samples = [], sampleKey = '', lastSampleAt = 0;
let toastTimer, liveRequested = false, configDirty = false, buzzerDuration = 500;

function readLocal(key) { try {return localStorage.getItem(key);} catch {return null;} }
function writeLocal(key,value) { try {localStorage.setItem(key,value);} catch {} }
function now() { return Date.now() + (state.serverOffset || 0); }
function tank() { return state.tanks.find(t => t.id === selectedTank); }
function system() { return tank()?.systems?.[selectedSystem]; }
function keysystems(t) { return Object.entries(t?.systems || {}); }
function normalizeSelection() {
  if (!tank()) selectedTank = state.tanks[0]?.id || '';
  if (!system()) selectedSystem = keysystems(tank())[0]?.[0] || '';
  const s = system();
  if (s?.config?.servo) servoAngle = Math.min(s.config.servo.maxAngle, Math.max(s.config.servo.minAngle, servoAngle));
  const key = `${state.mode}/${selectedTank}/${selectedSystem}`;
  if (key !== sampleKey) {samples = []; sampleKey = key;lastSampleAt=0;}
}
function receive(next) {
  state = {...state,...next}; normalizeSelection(); collectSample();
  if (!isEditing()) render();
}
function isEditing() {return configDirty || (document.activeElement?.closest('#app') && document.activeElement.matches('input,select,textarea'));}
function collectSample() {
  const s=system(), sensor=s?.reported?.sensors?.waterTemperature;
  const value = sensorValue(s,'waterTemperature',now());
  if(value !== null && sensor.updatedAt !== lastSampleAt) {
    samples.push({at:sensor.updatedAt,value}); samples=samples.slice(-60);lastSampleAt=sensor.updatedAt;
  }
}
function toast(message) {
  toastEl.textContent = message; toastEl.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('visible'),4500);
}
async function action(fn, success) {
  try {await fn(); if(success)toast(success);return true;} catch(error) {toast(error.message || 'Không thể hoàn tất. Vui lòng thử lại.');return false;}
}
function badge(online,label) {return `<span class="badge ${online?'online':'offline'}"><i></i>${label || (online?'Đang kết nối':'Mất liên lạc')}</span>`;}
function heading(title,sub,extra='') {return `<div class="page-heading"><div><div class="eyebrow">KHÔNG GIAN CỦA BẠN</div><h1>${title}</h1><p>${sub}</p></div>${extra}</div>`;}
function empty(title,body,button='') {return `<div class="empty card">${icon('tank')}<h3>${title}</h3><p>${body}</p>${button}</div>`;}
function linkButton(label,event,cls='text-button',ico='arrow') {return `<button class="${cls}" data-action="${event}">${label}${icon(ico)}</button>`;}
function context() {
  if(!state.tanks.length)return '';
  return `<div class="context-bar"><label>${icon('tank')}<select id="tank-select" aria-label="Bể cá đang chọn">${state.tanks.map(t=>`<option value="${esc(t.id)}" ${t.id===selectedTank?'selected':''}>${esc(t.meta.name)}</option>`).join('')}</select></label><span class="context-divider"></span><label>${icon('wifi')}<select id="system-select" aria-label="Hệ thống đang chọn" ${!keysystems(tank()).length?'disabled':''}>${keysystems(tank()).length?keysystems(tank()).map(([id,s])=>`<option value="${esc(id)}" ${id===selectedSystem?'selected':''}>${esc(s.meta.name)}</option>`).join(''):'<option>Chưa có hệ thống</option>'}</select></label><span class="context-status">${badge(deviceOnline(system(),now()))}</span></div>`;
}
function render() {
  const unread=state.notifications.filter(n=>!n.readAt).length;
  const name=state.user?.displayName || 'Người dùng';
  document.documentElement.dataset.theme = theme;
  app.innerHTML=`<aside class="sidebar"><a class="brand" href="#overview" aria-label="AquariumControl trang chủ"><span class="brand-mark">${icon('fish')}</span><span>Aquarium<span class="brand-light">Control</span><small>BỂ CÁ THÔNG MINH</small></span></a><div class="nav-label">QUẢN LÝ BỂ CÁ</div><nav aria-label="Điều hướng chính">${tabs.map(([id,i,label])=>`<button data-tab="${id}" class="nav-item ${tab===id?'active':''}" ${tab===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${id==='notifications'&&unread?`<b class="count">${unread}</b>`:''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="ios-tip">${icon('share')}<strong>Bể cá, luôn bên bạn.</strong><p>Thêm vào Màn hình chính để mở nhanh trên iPhone.</p><button data-action="install" class="text-button">Xem hướng dẫn ${icon('arrow')}</button></div><button class="user-row" data-action="account"><span class="avatar">${esc(name.slice(0,1).toUpperCase())}</span><span><strong>${esc(name)}</strong><small>${state.mode==='demo'?'Tài khoản trải nghiệm':esc(state.user?.email)}</small></span>${icon('settings')}</button></div></aside><div class="main-shell"><header class="topbar"><div class="mobile-brand"><span class="brand-mark">${icon('fish')}</span><strong>AquariumControl</strong></div><div class="breadcrumb">Bể cá của tôi ${icon('chevron')} <strong>${tabs.find(t=>t[0]===tab)?.[2]}</strong></div><div class="top-actions"><span class="today">${new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'long',year:'numeric'}).format(new Date())}</span><button class="icon-button" data-tab="notifications" aria-label="Thông báo">${icon('bell')}${unread?'<i class="notification-dot"></i>':''}</button><button class="avatar small" data-action="account" aria-label="Tài khoản">${esc(name.slice(0,1).toUpperCase())}</button></div></header><main><div class="demo-banner ${state.mode==='demo'?'':'live-banner'}"><div>${icon(state.mode==='demo'?'info':'shield')}<span>${state.mode==='demo'?'<strong>Bạn đang xem bản demo.</strong> Dữ liệu mô phỏng, thao tác không điều khiển thiết bị thật.':`<strong>Kết nối hệ thống thật.</strong> ${state.connected?'Dữ liệu được cập nhật từ Firebase.':'Đang mất kết nối. Điều khiển tạm khóa.'}`}</span></div>${state.mode==='demo'?linkButton('Kết nối bể thật','connect'):''}</div>${state.storageWarning?`<div class="notice storage-notice">${esc(state.storageWarning)}</div>`:''}${tab==='overview'?overview():tab==='controls'?controlPage():tab==='tanks'?tanksPage():tab==='notifications'?notificationsPage():settingsPage()}<footer>AquariumControl <span>Chăm bể cá nhẹ nhàng hơn, mỗi ngày.</span></footer></main></div><nav class="mobile-nav" aria-label="Điều hướng trên điện thoại">${tabs.map(([id,i,label])=>`<button data-tab="${id}" class="${tab===id?'active':''}" ${tab===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span></button>`).join('')}</nav>`;
  bind();
}
function overview() {
  const t=tank(),s=system(),online=deviceOnline(s,now());
  const subtitle = t?`Một góc bình yên, trong tầm tay bạn. ${state.mode==='demo'?'Khám phá bể cá mẫu bên dưới.':''}`:'Bắt đầu chăm sóc bể cá của bạn ngay trên trình duyệt.';
  let content=heading('Bể cá hôm nay',subtitle,`<span class="page-label">${icon('wifi')} ${state.mode==='demo'?'Trải nghiệm trực tiếp':state.connected?'Đã kết nối dữ liệu':'Mất kết nối dữ liệu'}</span>`)+context();
  if(!t)return content+empty('Chào mừng đến với bể cá của bạn','Tạo bể đầu tiên, thêm hệ thống và ghép thiết bị để bắt đầu.',linkButton('Tạo bể cá','new-tank','button primary','plus'));
  if(!s)return content+empty('Bể cá đã sẵn sàng','Thêm một hệ thống điều khiển cho bể cá này.',linkButton('Thêm hệ thống','new-system','button primary','plus'));
  const temp=sensorValue(s,'waterTemperature',now()),tds=sensorValue(s,'tds',now()),voltage=sensorValue(s,'adapterVoltage',now());
  const th=s.config?.thresholds || {}, tempOk=temp!==null&&temp>=th.minWaterTemperature&&temp<=th.maxWaterTemperature;
  content+=`<section class="summary-grid">${metric('temp','Nhiệt độ nước',temp,'°C',1,temp===null?'Chưa có dữ liệu':tempOk?'Trong ngưỡng cài đặt':'Ngoài ngưỡng cài đặt',tempOk?'green':'amber',`${th.minWaterTemperature??'—'}–${th.maxWaterTemperature??'—'} °C`)}${metric('drop','Chỉ số TDS',tds,'ppm',0,tds===null?'Chưa có dữ liệu':tds<=th.maxTds?'Trong ngưỡng cài đặt':'Vượt ngưỡng cài đặt',tds!==null&&tds<=th.maxTds?'green':'amber',`Ngưỡng ${th.maxTds??'—'} ppm`)}${metric('bolt','Nguồn điện',voltage,'V',1,voltage===null?'Chưa có dữ liệu':voltage>=th.minAdapterVoltage?'Nguồn đang ổn định':'Điện áp thấp',voltage!==null&&voltage>=th.minAdapterVoltage?'green':'amber',`Tối thiểu ${th.minAdapterVoltage??'—'} V`)}<article class="metric-card"><div class="metric-title"><span class="metric-icon violet">${icon('wifi')}</span>Thiết bị</div><div class="metric-value connection-value">${online?'Trực tuyến':'Ngoại tuyến'}<span class="pulse ${online?'':'off'}"></span></div><div class="metric-status ${online?'green':'amber'}">${icon(online?'check':'info')}${online?'Đang nhận dữ liệu':'Chờ thiết bị kết nối'}</div><div class="metric-foot">${state.mode==='demo'?'Thiết bị mô phỏng':'Heartbeat trong 30 giây'}</div></article></section>`;
  content+=`<section class="overview-grid"><article class="aquarium-card"><div class="aquarium-card-top"><span class="eyebrow">BỂ CÁ ĐANG THEO DÕI</span>${badge(online,online?'Đang hoạt động':'Mất liên lạc')}</div><h2>${esc(t.meta.name)}</h2><p>${esc(t.meta.location || 'Chưa đặt vị trí')} <span>·</span> ${esc(t.meta.volumeLiters)} lít</p>${aquariumArt()}<div class="aquarium-bottom"><span>${icon('tank')} ${keysystems(t).length} hệ thống <span>·</span> ${state.mode==='demo'?'Bể mẫu mô phỏng':'Minh họa bể cá'}</span><button data-tab="tanks">Quản lý bể ${icon('arrow')}</button></div></article><article class="card quick-card"><div class="card-heading"><div><h2>Điều khiển nhanh</h2><p>Chạm để chăm sóc bể cá</p></div><button class="icon-button" data-tab="controls" aria-label="Xem tất cả điều khiển">${icon('arrow')}</button></div>${outputs.slice(0,3).map(o=>outputRow(o,s)).join('')}<button class="all-controls" data-tab="controls">Xem tất cả thiết bị ${icon('arrow')}</button></article><article class="card chart-card"><div class="card-heading"><div><h2>Nhiệt độ nước</h2><p>Các mẫu nhận trong phiên này${state.mode==='demo'?' · mô phỏng':''}</p></div><span class="chart-period">Phiên hiện tại</span></div>${chart()}<div class="chart-legend"><i></i>Nhiệt độ nước <span>${samples.length} mẫu đã nhận</span></div></article><article class="card environment-card"><div class="card-heading"><div><h2>Môi trường xung quanh</h2><p>Một bể cá khỏe, một góc nhà xanh</p></div>${icon('sun')}</div><div class="environment-values"><div><span>${icon('temp')} Nhiệt độ phòng</span><strong>${fmt(sensorValue(s,'ambientTemperature',now()))}<small> °C</small></strong></div><div><span>${icon('drop')} Độ ẩm</span><strong>${fmt(sensorValue(s,'humidity',now()),0)}<small> %</small></strong></div></div><div class="update-line">${icon('clock')} Cập nhật ${time(s.reported?.lastSeen)}</div></article></section>`;
  return content;
}
function metric(i,title,value,unit,digits,label,color,foot) {return `<article class="metric-card"><div class="metric-title"><span class="metric-icon ${i==='drop'?'blue':i==='bolt'?'amber-bg':'cyan'}">${icon(i)}</span>${title}</div><div class="metric-value">${fmt(value,digits)}<span>${unit}</span></div><div class="metric-status ${color}">${icon(value===null?'info':'check')}${label}</div><div class="metric-foot">${foot}</div></article>`;}
function aquariumArt() {return `<div class="aquascape" aria-hidden="true"><div class="light-rays"></div><div class="waterline"></div><div class="rock rock-one"></div><div class="rock rock-two"></div><div class="sand"></div>${[0,1,2,3,4,5,6,7,8].map(n=>`<div class="plant plant-${n}"><i></i><i></i><i></i><i></i><i></i></div>`).join('')}<div class="swimming-fish fish-one">${icon('fish')}</div><div class="swimming-fish fish-two">${icon('fish')}</div><div class="swimming-fish fish-three">${icon('fish')}</div><i class="bubble b1"></i><i class="bubble b2"></i><i class="bubble b3"></i><div class="glass-edge"></div></div>`;}
function chart() {
  if(samples.length<2)return `<div class="chart-wait">${icon('temp')}<strong>Đang thu thập dữ liệu</strong><span>Biểu đồ xuất hiện khi nhận đủ hai mẫu cảm biến.</span></div>`;
  const vals=samples.map(s=>s.value),min=Math.floor(Math.min(...vals))-1,max=Math.ceil(Math.max(...vals))+1;
  const pts=vals.map((v,i)=>`${40+i/(vals.length-1)*580},${154-(v-min)/(max-min)*126}`).join(' ');
  return `<div class="chart-wrap"><svg viewBox="0 0 650 184" role="img" aria-label="Biểu đồ nhiệt độ nước trong phiên hiện tại"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#17b9cb" stop-opacity=".2"/><stop offset="1" stop-color="#17b9cb" stop-opacity="0"/></linearGradient></defs>${[max,(max+min)/2,min].map((v,i)=>`<line x1="40" x2="630" y1="${28+i*63}" y2="${28+i*63}" stroke="var(--line)" stroke-dasharray="4 5"/><text x="2" y="${32+i*63}" fill="var(--muted)" font-size="11">${v.toFixed(0)}°</text>`).join('')}<polygon points="40,158 ${pts} 620,158" fill="url(#chart-fill)"/><polyline points="${pts}" stroke="#14adbe" stroke-width="2.5" fill="none" stroke-linejoin="round"/><text x="40" y="180" fill="var(--muted)" font-size="11">${time(samples[0].at).split(' ')[0]}</text><text x="582" y="180" fill="var(--muted)" font-size="11">${time(samples.at(-1).at).split(' ')[0]}</text></svg></div>`;
}
function outputRow([key,i,label,desc],s,card=false) {
  const desired=s.desired?.[key]===true,reported=s.reported?.outputs?.[key],online=deviceOnline(s,now());
  const status=!online?'Mất liên lạc':reported===desired?'Đã áp dụng':'Chờ thiết bị áp dụng';
  return `<div class="${card?'device-card card':'control-row'}"><span class="device-icon ${desired?'on':''}">${icon(i)}</span><div class="device-text"><strong>${label}</strong><small>${card?desc:status}</small>${card?`<span class="output-status">${desired?'Yêu cầu bật':'Yêu cầu tắt'} · ${status}</span>`:''}</div><button role="switch" aria-checked="${desired}" aria-label="${label}" class="switch ${desired?'on':''}" data-output="${key}" ${canControl(state,s,now())?'':'disabled'}><span></span></button></div>`;
}
function commandList(s) {
  const commands=Object.values(s?.commands || {}).sort((a,b)=>b.createdAt-a.createdAt).slice(0,6);
  if(!commands.length)return '<p class="muted command-empty">Chưa có thao tác trong hệ thống này.</p>';
  return commands.map(c=>{const cs=commandState(c,s.acks?.[c.id],now());return `<div class="command-row"><span class="device-icon">${icon(c.type==='servo'?'servo':'bell')}</span><div><strong>${c.type==='servo'?`Di chuyển servo · ${esc(c.angle)}°`:`Phát còi · ${esc(c.durationMs)} ms`}</strong><small>${time(c.createdAt)}</small>${cs.message?`<small>${esc(cs.message)}</small>`:''}</div><span class="command-badge ${cs.status}">${esc(cs.label)}</span></div>`;}).join('');
}
function controlPage() {
  const s=system();let result=heading('Chăm sóc trong một chạm','Điều khiển thiết bị và xem trạng thái đã được áp dụng.')+context();
  if(!s)return result+empty('Chưa có hệ thống điều khiển','Tạo bể cá và thêm hệ thống để bắt đầu.',linkButton('Quản lý bể cá','manage-tanks','button primary'));
  const enabled=canControl(state,s,now()),range=s.config?.servo || {minAngle:10,maxAngle:170};
  const pending=Object.values(s.commands || {}).some(c=>commandState(c,s.acks?.[c.id],now()).pending);
  result+=`${!enabled?'<div class="notice">Thiết bị hoặc kết nối dữ liệu chưa sẵn sàng. Các thao tác điều khiển đang tạm khóa.</div>':''}<h2 class="section-title">Thiết bị trong bể <span>6 ngõ ra</span></h2><section class="devices-grid">${outputs.map(o=>outputRow(o,s,true)).join('')}</section><section class="two-columns"><article class="card servo-card"><div class="card-heading"><div><h2>${icon('servo')} Điều khiển servo</h2><p>Chọn góc trong giới hạn đã cài đặt</p></div><span class="soft-label">${range.minAngle}–${range.maxAngle}°</span></div><div class="servo-dial"><span id="servo-display">${servoAngle}</span><small>độ</small></div><label class="range-label" for="servo-angle">Góc servo</label><input id="servo-angle" type="range" min="${range.minAngle}" max="${range.maxAngle}" value="${servoAngle}" ${!enabled?'disabled':''}/><div class="range-ends"><span>${range.minAngle}°</span><span>${range.maxAngle}°</span></div><button class="button primary full-width" data-action="servo" ${enabled&&!pending?'':'disabled'}>${icon('servo')} Di chuyển servo</button><p class="hint">Lệnh một lần · chờ thiết bị xác nhận hoàn thành</p></article><article class="card buzzer-card"><div class="card-heading"><div><h2>${icon('bell')} Còi báo hiệu</h2><p>Phát âm báo ngắn từ thiết bị</p></div></div><div class="buzzer-art">${icon('bell')}</div><label for="buzzer-duration">Thời gian phát</label><select id="buzzer-duration"><option value="500">0,5 giây</option><option value="1000">1 giây</option><option value="2000">2 giây</option></select><button class="button secondary full-width" data-action="buzzer" ${enabled&&!pending?'':'disabled'}>${icon('bell')} Phát còi</button><p class="hint">Không tự gửi lại khi kết quả chưa xác định</p></article></section><article class="card history-card"><div class="card-heading"><div><h2>Thao tác gần đây</h2><p>${state.mode==='demo'?'Kết quả từ thiết bị mô phỏng':'Kết quả được xác nhận từ thiết bị'}</p></div>${icon('clock')}</div>${commandList(s)}</article>`;
  return result;
}
function tanksPage() {
  return heading('Bể cá của tôi','Mỗi bể cá, một thế giới nhỏ để chăm sóc.',linkButton('Thêm bể cá','new-tank','button primary','plus'))+(!state.tanks.length?empty('Chưa có bể cá','Thêm bể cá đầu tiên của bạn.'): `<section class="tanks-grid">${state.tanks.map(t=>`<article class="card tank-card"><div class="tank-art">${icon('fish')}<span>${t.meta.volumeLiters} L</span></div><div class="tank-info"><div class="tank-title"><h2>${esc(t.meta.name)}</h2><button class="icon-button" data-action="edit-tank" data-id="${esc(t.id)}" aria-label="Sửa ${esc(t.meta.name)}">${icon('edit')}</button></div><p>${esc(t.meta.location || 'Chưa đặt vị trí')}</p>${keysystems(t).map(([id,s])=>`<div class="system-row"><button data-action="select-system" data-tank="${esc(t.id)}" data-system="${esc(id)}"><span class="mini-device">${icon('wifi')}</span><span><strong>${esc(s.meta.name)}</strong><small>${deviceOnline(s,now())?'Đang hoạt động':'Chưa nhận heartbeat'}</small></span></button><button class="icon-button" data-action="pair" data-tank="${esc(t.id)}" data-system="${esc(id)}" aria-label="Ghép thiết bị cho ${esc(s.meta.name)}">${icon('link')}</button><button class="icon-button subtle" data-action="delete-system" data-tank="${esc(t.id)}" data-system="${esc(id)}" aria-label="Xóa hệ thống ${esc(s.meta.name)}">${icon('trash')}</button></div>`).join('')||'<p class="muted">Chưa có hệ thống điều khiển.</p>'}<div class="tank-card-footer"><button class="text-button" data-action="new-system" data-tank="${esc(t.id)}">${icon('plus')} Thêm hệ thống</button><button class="icon-button subtle" data-action="delete-tank" data-id="${esc(t.id)}" aria-label="Xóa bể ${esc(t.meta.name)}">${icon('trash')}</button></div></div></article>`).join('')}</section>`);
}
function notificationsPage() {
  return heading('Thông báo','Theo dõi những thay đổi đáng chú ý trong bể cá.',linkButton('Đánh dấu đã đọc','read-all','button secondary','check'))+`<div class="notice">Thông báo hiển thị khi mở trang web. Bản này chưa hỗ trợ thông báo đẩy khi đóng trình duyệt.</div>`+(!state.notifications.length?empty('Mọi thứ đang yên tĩnh','Các cảnh báo từ hệ thống sẽ xuất hiện tại đây.'): `<section class="card notifications-list">${[...state.notifications].sort((a,b)=>b.createdAt-a.createdAt).map(n=>`<button class="notification-row ${!n.readAt?'unread':''}" data-action="read-notification" data-id="${esc(n.id)}"><span class="notification-icon ${n.type==='info'?'green-bg':'amber-bg'}">${icon(n.type==='offline'?'wifi':n.type==='info'?'check':'temp')}</span><span><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p><small>${time(n.createdAt)} ${state.mode==='demo'?'· Mô phỏng':''}</small></span>${!n.readAt?'<i class="unread-dot"></i>':icon('check')}</button>`).join('')}</section>`);
}
function settingsPage() {
  const s=system(),cfg=s?.config,th=cfg?.thresholds;
  return heading('Cài đặt','Tinh chỉnh trải nghiệm và ngưỡng theo dõi cho bể cá.')+context()+`<section class="settings-layout"><article class="card"><div class="card-heading"><div><h2>Giao diện</h2><p>Chọn phong cách hiển thị bạn yêu thích</p></div>${icon('sun')}</div><div class="theme-picker"><button data-theme="light" class="${theme==='light'?'selected':''}">${icon('sun')} Sáng</button><button data-theme="dark" class="${theme==='dark'?'selected':''}">${icon('settings')} Tối</button></div><div class="setting-line"><div><strong>Mở nhanh trên iPhone</strong><p>Lưu biểu tượng trang web vào Màn hình chính.</p></div><button data-action="install" class="icon-button" aria-label="Hướng dẫn thêm vào màn hình chính">${icon('arrow')}</button></div><div class="setting-line"><div><strong>${state.mode==='demo'?'Đang ở chế độ demo':'Tài khoản Firebase'}</strong><p>${state.mode==='demo'?'Khám phá với dữ liệu mô phỏng.':esc(state.user?.email)}</p></div><button data-action="${state.mode==='demo'?'connect':'logout'}" class="text-button">${state.mode==='demo'?'Kết nối':'Đăng xuất'}</button></div></article>${cfg?`<article class="card"><div class="card-heading"><div><h2>Ngưỡng theo dõi</h2><p>Áp dụng cho hệ thống đang chọn</p></div>${icon('controls')}</div><form id="config-form"><div class="form-grid"><label>Nhiệt độ nước tối thiểu (°C)<input type="number" step="0.1" name="minWaterTemperature" value="${th.minWaterTemperature}" required min="-55" max="125"></label><label>Nhiệt độ nước tối đa (°C)<input type="number" step="0.1" name="maxWaterTemperature" value="${th.maxWaterTemperature}" required min="-55" max="125"></label><label>TDS tối đa (ppm)<input type="number" name="maxTds" value="${th.maxTds}" required min="0" max="10000"></label><label>Điện áp tối thiểu (V)<input type="number" step="0.1" name="minAdapterVoltage" value="${th.minAdapterVoltage}" required min="0" max="60"></label><label>Góc servo tối thiểu (°)<input type="number" name="minAngle" value="${cfg.servo.minAngle}" required min="0" max="179"></label><label>Góc servo tối đa (°)<input type="number" name="maxAngle" value="${cfg.servo.maxAngle}" required min="1" max="180"></label></div><p class="hint left">Ngưỡng dùng để theo dõi và cảnh báo; không tự bật/tắt thiết bị.</p><button type="submit" class="button primary">${icon('check')} Lưu cài đặt</button></form></article>`:''}</section>`;
}
function openModal(title,body,onSubmit) {
  modal.innerHTML=`<div class="modal-heading"><h2 id="modal-title">${title}</h2><button class="icon-button" data-close aria-label="Đóng">${icon('close')}</button></div>${body}`;
  modal.querySelector('[data-close]').onclick=()=>modal.close();
  modal.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>modal.close());
  const form=modal.querySelector('form');
  if(form&&onSubmit) form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;const ok=await action(()=>onSubmit(new FormData(form)));button.disabled=false;if(ok)modal.close();};
  if(!modal.open)modal.showModal();
}
function tankModal(id) {
  const t=state.tanks.find(t=>t.id===id);
  openModal(t?'Chỉnh sửa bể cá':'Thêm bể cá',`<form><label>Tên bể cá<input name="name" value="${esc(t?.meta.name || '')}" placeholder="Ví dụ: Bể thủy sinh" required maxlength="80" autofocus></label><label>Vị trí<input name="location" value="${esc(t?.meta.location || '')}" placeholder="Ví dụ: Phòng khách" maxlength="120"></label><label>Dung tích (lít)<input name="volumeLiters" type="number" value="${t?.meta.volumeLiters || 120}" required min="1" max="1000000" step="0.1"></label><div class="modal-actions"><button type="button" data-cancel class="button secondary">Hủy</button><button type="submit" class="button primary">${t?'Lưu thay đổi':'Tạo bể cá'}</button></div></form>`,async data=>{const v={name:data.get('name').trim(),location:data.get('location').trim(),volumeLiters:Number(data.get('volumeLiters'))};await(t?client.updateTank(id,v):client.createTank(v));toast(t?'Đã cập nhật bể cá.':'Đã tạo bể cá. Thêm hệ thống để bắt đầu.');});
}
function confirm(title,description,run,label='Xác nhận') {
  openModal(title,`<p class="modal-description">${description}</p><form><div class="modal-actions"><button type="button" data-cancel class="button secondary">Hủy</button><button type="submit" class="button primary">${label}</button></div></form>`,run);
}
async function handle(name,el) {
  if(name==='pair' && state.mode==='live' && state.backendMode==='spark') {
    const prefix=`sparkAquariums/${state.user.uid}/${el.dataset.tank}/systems/${el.dataset.system}`;
    return openModal('Kết nối thiết bị với bể',`<p class="modal-description">Bản miễn phí dùng tài khoản riêng cho thiết bị. Quản trị viên cấp tài khoản và gán thiết bị vào hệ thống này trong Firebase. Trang web sẽ nhận dữ liệu khi thiết bị gửi heartbeat.</p><label>Đường dẫn hệ thống<input readonly value="${esc(prefix)}" aria-label="Đường dẫn hệ thống"></label><p class="hint left">Thông tin này dùng khi cấu hình firmware; không dùng tài khoản chủ bể để đăng nhập thiết bị.</p><button class="button primary full-width" data-cancel>Đã hiểu</button>`);
  }
  if(name==='install')return openModal('Thêm vào Màn hình chính',`<div class="install-steps"><span class="install-icon">${icon('share')}</span><p>Mở trang web bằng <strong>Safari</strong> trên iPhone.</p><ol><li>Chạm nút <strong>Chia sẻ</strong> trên thanh công cụ Safari.</li><li>Chọn <strong>Thêm vào Màn hình chính</strong>.</li><li>Chạm <strong>Thêm</strong>. Mở AquariumControl từ biểu tượng mới.</li></ol><p class="hint left">Cần kết nối Internet để nhận dữ liệu và điều khiển thiết bị.</p></div><button class="button primary full-width" data-cancel>Đã hiểu</button>`);
  if(name==='manage-tanks'){tab='tanks';render();return;}
  if(name==='new-tank'||name==='edit-tank')return tankModal(el.dataset.id);
  if(name==='new-system') {const tid=el.dataset.tank || selectedTank;if(!tid)return toast('Tạo bể cá trước khi thêm hệ thống.');return openModal('Thêm hệ thống',`<form><label>Tên hệ thống<input name="name" required maxlength="80" placeholder="Ví dụ: Hệ thống chính" autofocus></label><div class="modal-actions"><button type="button" data-cancel class="button secondary">Hủy</button><button type="submit" class="button primary">Thêm hệ thống</button></div></form>`,async data=>{await client.createSystem(tid,data.get('name').trim());toast('Đã thêm hệ thống.');});}
  if(name==='select-system'){selectedTank=el.dataset.tank;selectedSystem=el.dataset.system;tab='overview';normalizeSelection();render();return;}
  if(name==='delete-tank') {const t=state.tanks.find(t=>t.id===el.dataset.id);return confirm('Xóa bể cá?',`Bể <strong>${esc(t?.meta.name)}</strong> và các hệ thống, lệnh, lịch sử của bể sẽ bị xóa.`,()=>client.deleteTank(el.dataset.id),'Xóa bể cá');}
  if(name==='delete-system')return confirm('Xóa hệ thống?','Dữ liệu và quyền ghép thiết bị của hệ thống này sẽ bị xóa.',()=>client.deleteSystem(el.dataset.tank,el.dataset.system),'Xóa hệ thống');
  if(name==='pair')return openModal('Ghép thiết bị',`<p class="modal-description">${state.mode==='demo'?'Thao tác ghép trong bản demo chỉ mô phỏng kết nối.':'Nhập mã ghép dùng một lần được cấp cho thiết bị của bạn.'}</p><form><label>Mã ghép thiết bị<input name="code" required minlength="${state.mode==='demo'?1:16}" maxlength="128" autocomplete="off" placeholder="Nhập mã ghép" autofocus></label><div class="modal-actions"><button type="button" data-cancel class="button secondary">Hủy</button><button type="submit" class="button primary">Ghép thiết bị</button></div></form>`,async data=>{await client.pairDevice(el.dataset.tank,el.dataset.system,data.get('code'));toast(state.mode==='demo'?'Đã mô phỏng ghép thiết bị.':'Đã ghép thiết bị. Chờ heartbeat.');});
  if(name==='servo')return confirm('Di chuyển servo?',`Gửi lệnh di chuyển đến <strong>${servoAngle}°</strong>. ${state.mode==='demo'?'Đây là thao tác mô phỏng.':'Kiểm tra khu vực chuyển động của thiết bị trước khi gửi.'}`,()=>client.sendCommand(selectedTank,selectedSystem,'servo',servoAngle),'Gửi lệnh');
  if(name==='buzzer')return action(()=>client.sendCommand(selectedTank,selectedSystem,'buzzer',Number(document.querySelector('#buzzer-duration').value)));
  if(name==='read-all')return action(()=>client.markAllRead(),'Đã đánh dấu tất cả thông báo là đã đọc.');
  if(name==='read-notification')return action(()=>client.markRead(el.dataset.id));
  if(name==='account')return openModal('Tài khoản của bạn',`<div class="account-modal"><span class="avatar large">${esc((state.user?.displayName || 'N').slice(0,1))}</span><p>${esc(state.user?.email || '')}${state.mode==='demo'?'<br><span class="soft-label">Tài khoản demo trên trình duyệt này</span>':''}</p></div><form><label>Tên hiển thị<input name="displayName" required maxlength="80" value="${esc(state.user?.displayName)}"></label><div class="modal-actions"><button type="button" data-cancel class="button secondary">Đóng</button><button type="submit" class="button primary">Lưu tài khoản</button></div></form>`,async data=>{await client.saveProfile(data.get('displayName').trim());toast('Đã cập nhật tên hiển thị.');});
  if(name==='connect')return loginModal();
  if(name==='logout')return confirm('Đăng xuất?','Bạn sẽ quay lại bản demo trên trình duyệt này.',async()=>{await liveClient?.logout();liveRequested=false;client=demoClient;receive(demoClient.getState?demoClient.getState():demoSnapshot);},'Đăng xuất');
}
function loginModal(register=false) {
  if(!firebaseConfig)return openModal('Kết nối bể cá thật',`<div class="connect-illustration">${icon('wifi')}</div><p class="modal-description">Trang web đang ở giai đoạn demo. Khi project Firebase được cấu hình, bạn có thể đăng nhập bằng tài khoản đang dùng trên app Android để theo dõi và điều khiển cùng bể cá.</p><div class="notice">Hiện chưa kết nối với Firebase hoặc thiết bị thật.</div><button class="button primary full-width" data-cancel>Tiếp tục trải nghiệm demo</button>`);
  openModal(register?'Tạo tài khoản':'Đăng nhập bể cá của bạn',`<p class="modal-description">${firebaseConfig.backendMode==='spark'?'Đăng nhập tài khoản bể cá của bạn. Dữ liệu thật được lưu riêng cho từng người dùng trên Firebase.':'Dùng chung tài khoản với ứng dụng AquariumControl trên Android.'}</p><form>${register?'<label>Tên hiển thị<input name="name" required maxlength="80" autocomplete="name"></label>':''}<label>Email<input name="email" type="email" required autocomplete="email"></label><label>Mật khẩu<input name="password" type="password" required minlength="6" autocomplete="${register?'new-password':'current-password'}"></label><p id="auth-error" class="form-error" role="alert"></p><button type="submit" class="button primary full-width">${register?'Tạo tài khoản':'Đăng nhập'}</button><div class="auth-links"><button type="button" id="auth-toggle" class="text-button">${register?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}</button>${!register?'<button type="button" id="reset-password" class="text-button">Quên mật khẩu</button>':''}</div></form>`);
  modal.querySelector('#auth-toggle').onclick=()=>loginModal(!register);
  modal.querySelector('#reset-password')?.addEventListener('click',async()=>{const email=modal.querySelector('[name=email]').value;if(!email)return toast('Nhập email trước để đặt lại mật khẩu.');await action(()=>liveClient.resetPassword(email),'Nếu email hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi.');});
  modal.querySelector('form').onsubmit=async event=>{event.preventDefault();const data=new FormData(event.target),b=event.target.querySelector('[type=submit]');b.disabled=true;try {liveRequested=true;const result=await(register?liveClient.register(data.get('name'),data.get('email'),data.get('password')):liveClient.login(data.get('email'),data.get('password')));client=liveClient;if(liveState?.user)receive(liveState);modal.close();toast(result?.profilePending?'Đã tạo tài khoản. Bạn có thể lưu lại tên hiển thị trong Tài khoản.':'Đã đăng nhập. Đang tải bể cá của bạn.');}catch(error){liveRequested=false;modal.querySelector('#auth-error').textContent=error.message;}finally{b.disabled=false;}};
}
function bind() {
  app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{configDirty=false;tab=b.dataset.tab;history.replaceState(null,'',`#${tab}`);render();window.scrollTo({top:0,behavior:'instant'});});
  app.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>handle(b.dataset.action,b));
  app.querySelectorAll('[data-output]').forEach(b=>b.onclick=()=>action(()=>client.setOutput(selectedTank,selectedSystem,b.dataset.output,!system()?.desired?.[b.dataset.output])));
  app.querySelector('#tank-select')?.addEventListener('change',e=>{selectedTank=e.target.value;selectedSystem='';normalizeSelection();render();});
  app.querySelector('#system-select')?.addEventListener('change',e=>{selectedSystem=e.target.value;normalizeSelection();render();});
  app.querySelector('#servo-angle')?.addEventListener('input',e=>{servoAngle=Number(e.target.value);app.querySelector('#servo-display').textContent=servoAngle;});
  const buzzer=app.querySelector('#buzzer-duration');
  if(buzzer){buzzer.value=String(buzzerDuration);buzzer.addEventListener('change',e=>{buzzerDuration=Number(e.target.value);});}
  app.querySelector('#config-form')?.addEventListener('input',()=>{configDirty=true;});
  app.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{theme=b.dataset.theme;writeLocal('aquarium-theme',theme);render();});
  app.querySelector('#config-form')?.addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(e.target);const number=k=>Number(d.get(k));const cfg={servo:{minAngle:number('minAngle'),maxAngle:number('maxAngle')},thresholds:{minWaterTemperature:number('minWaterTemperature'),maxWaterTemperature:number('maxWaterTemperature'),maxTds:number('maxTds'),minAdapterVoltage:number('minAdapterVoltage')}};const ok=await action(()=>client.saveConfig(selectedTank,selectedSystem,cfg),'Đã lưu cài đặt.');if(ok){configDirty=false;render();}});
}
modal.addEventListener('click',e=>{const rect=modal.getBoundingClientRect();if(e.target===modal&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))modal.close();});
let demoSnapshot;
demoClient=createDemoClient(next=>{demoSnapshot=next;if(!liveRequested&&state.mode!=='live')receive(next);});
client=demoClient;
if(tabs.some(t=>t[0]===location.hash.slice(1)))tab=location.hash.slice(1);
render();
async function initializeLive() {
  try {
    const response=await fetch('/firebase-config.json',{cache:'no-store'});
    if(!response.ok||!response.headers.get('content-type')?.includes('json'))return;
    const config=await response.json();
    if(!config.apiKey||!config.projectId||!config.databaseURL||String(config.apiKey).includes('YOUR_'))return;
    const {createLiveClient}=await import('./live.js');
    liveClient=await createLiveClient(config,next=>{liveState={...liveState,...next};if(liveState.user){liveRequested=true;client=liveClient || client;receive(liveState);}else if(state.mode==='live'){liveRequested=false;configDirty=false;client=demoClient;selectedTank='';selectedSystem='';receive(demoSnapshot);}},message=>toast(typeof message==='string'?message:message.message));
    await liveClient.ready;
    firebaseConfig=config;
    if(liveState?.user){client=liveClient;receive(liveState);}
    else if(!modal.open)loginModal();
  }catch(error){firebaseConfig=null;toast(error.message || 'Chưa khởi tạo được kết nối Firebase.');}
}
initializeLive();
setInterval(()=>{if(document.hidden||modal.open||isEditing())return;collectSample();render();},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){collectSample();render();}});
window.addEventListener('pagehide',()=>{ /* No service worker stores authenticated data or hardware requests. */ });
