/* ============================================================
   admin.js — painel do lojista (produtos, regras, cupons, pedidos, vendas)
   Os dados são salvos via DB (localStorage). Para produção com vários
   aparelhos, troque as funções de DB em data.js por chamadas a um backend.
   ============================================================ */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let cfg = DB.load();
let dirty = false;
let tab = 'orders';
let orderFilter = 'all';
const uid = () => 'x' + Math.random().toString(36).slice(2, 8);
const digits = s => String(s || '').replace(/\D/g, '');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800); }

const opt = (arr, label = 'name') => () => arr().map(x => [x.id, x[label]]);
const SC = {
  categories: { arr: 'categories', title: 'Categorias', sub: 'Aparecem na página inicial e nos filtros do cardápio.',
    fields: [{ k: 'name', l: 'Nome' }, { k: 'emoji', l: 'Emoji' }, { k: 'id', l: 'Código (não repetir)' }],
    blank: () => ({ id: uid(), name: 'Nova categoria', emoji: '🍨' }) },
  products: { arr: 'products', title: 'Produtos', sub: 'Cadastre, edite preços, fotos e disponibilidade. “Personalizável” abre a montagem com os complementos pré-marcados.',
    fields: [
      { k: 'name', l: 'Nome' }, { k: 'cat', l: 'Categoria', t: 'sel', opts: opt(() => cfg.categories) }, { k: 'sizeLabel', l: 'Tamanho/quantidade (texto)' },
      { k: 'price', l: 'Preço (R$)', t: 'num' }, { k: 'oldPrice', l: 'Preço antigo (promoção)', t: 'num' },
      { k: 'desc', l: 'Descrição', wide: true }, { k: 'img', l: 'Imagem (URL da foto)', wide: true },
      { k: 'available', l: 'Disponível', t: 'bool' }, { k: 'popular', l: 'Mais pedido', t: 'bool' }, { k: 'custom', l: 'Personalizável', t: 'bool' },
      { k: 'sizeId', l: 'Tamanho da montagem', t: 'sel', opts: () => [['', '—'], ...cfg.sizes.map(s => [s.id, s.name])] },
      { k: 'baseId', l: 'Base da montagem', t: 'sel', opts: () => [['', '—'], ...cfg.bases.map(s => [s.id, s.name])] },
      { k: 'preset', l: 'Complementos pré-marcados (códigos separados por vírgula)', t: 'csv', wide: true }],
    blank: () => ({ id: uid(), cat: cfg.categories[0]?.id || '', name: 'Novo produto', desc: '', sizeLabel: '', price: 0, custom: false, popular: false, available: true, img: '' }) },
  sizes: { arr: 'sizes', title: 'Tamanhos', sub: 'Preço, complementos grátis e limite máximo por tamanho.',
    fields: [{ k: 'name', l: 'Nome (ex.: 500 ml)' }, { k: 'ml', l: 'Volume (ml)', t: 'num' }, { k: 'price', l: 'Preço (R$)', t: 'num' }, { k: 'freeToppings', l: 'Complementos grátis', t: 'num' }, { k: 'maxToppings', l: 'Máximo de complementos', t: 'num' }, { k: 'id', l: 'Código (não repetir)' }],
    blank: () => ({ id: uid(), name: 'Novo', ml: 500, price: 0, freeToppings: 3, maxToppings: 6 }) },
  bases: { arr: 'bases', title: 'Bases', sub: 'Sabores de base e adicional de preço (0 = sem adicional).',
    fields: [{ k: 'name', l: 'Nome' }, { k: 'extra', l: 'Adicional (R$)', t: 'num' }, { k: 'available', l: 'Disponível', t: 'bool' }, { k: 'id', l: 'Código (não repetir)' }],
    blank: () => ({ id: uid(), name: 'Nova base', extra: 0, available: true }) },
  toppingCats: { arr: 'toppingCats', title: 'Categorias de complementos', sub: 'Limite por categoria (0 = sem limite).',
    fields: [{ k: 'name', l: 'Nome' }, { k: 'max', l: 'Limite na categoria', t: 'num' }, { k: 'id', l: 'Código (não repetir)' }],
    blank: () => ({ id: uid(), name: 'Nova categoria', max: 0 }) },
  toppings: { arr: 'toppings', title: 'Complementos', sub: 'O “preço” é cobrado quando o item não é grátis. “Sempre cobrado” não usa a cota grátis. “Ilimitado” é grátis e não conta no limite.',
    fields: [{ k: 'name', l: 'Nome' }, { k: 'emoji', l: 'Emoji' }, { k: 'cat', l: 'Categoria', t: 'sel', opts: opt(() => cfg.toppingCats) },
      { k: 'price', l: 'Preço (R$)', t: 'num' }, { k: 'maxQty', l: 'Unidades máx.', t: 'num' },
      { k: 'alwaysPaid', l: 'Sempre cobrado', t: 'bool' }, { k: 'unlimited', l: 'Ilimitado', t: 'bool' }, { k: 'available', l: 'Disponível', t: 'bool' }, { k: 'id', l: 'Código (não repetir)' }],
    blank: () => ({ id: uid(), cat: cfg.toppingCats[0]?.id || '', name: 'Novo complemento', emoji: '🍨', price: 0, alwaysPaid: false, unlimited: false, maxQty: 1, available: true }) },
  specials: { arr: 'specials', title: 'Adicionais especiais', sub: 'Itens premium, sempre cobrados.',
    fields: [{ k: 'name', l: 'Nome' }, { k: 'emoji', l: 'Emoji' }, { k: 'price', l: 'Preço (R$)', t: 'num' }, { k: 'maxQty', l: 'Unidades máx.', t: 'num' }, { k: 'available', l: 'Disponível', t: 'bool' }, { k: 'id', l: 'Código (não repetir)' }],
    blank: () => ({ id: uid(), name: 'Novo adicional', emoji: '⭐', price: 0, maxQty: 1, available: true }) },
  coupons: { arr: 'coupons', title: 'Cupons de desconto', sub: 'Percentual, valor fixo ou frete grátis, com pedido mínimo.',
    fields: [{ k: 'code', l: 'Código' }, { k: 'type', l: 'Tipo', t: 'sel', opts: () => [['percent', 'Percentual (%)'], ['fixed', 'Valor fixo (R$)'], ['frete', 'Frete grátis']] },
      { k: 'value', l: 'Valor', t: 'num' }, { k: 'minOrder', l: 'Pedido mínimo (R$)', t: 'num' }, { k: 'active', l: 'Ativo', t: 'bool' }],
    blank: () => ({ code: 'NOVO10', type: 'percent', value: 10, minOrder: 0, active: true }) },
  store: { obj: 'store', title: 'Dados da loja', sub: 'Informações exibidas no site e usadas no pedido.',
    fields: [{ k: 'name', l: 'Nome da açaiteria' }, { k: 'whatsapp', l: 'WhatsApp (DDI+DDD+número, só dígitos)' }, { k: 'phone', l: 'Telefone exibido' }, { k: 'instagram', l: 'Instagram' },
      { k: 'address', l: 'Endereço', wide: true }, { k: 'hours', l: 'Horário de funcionamento', wide: true },
      { k: 'deliveryFee', l: 'Taxa de entrega (R$)', t: 'num' }, { k: 'freeDeliveryAbove', l: 'Frete grátis acima de (R$, 0 = não)', t: 'num' }, { k: 'minOrder', l: 'Pedido mínimo (R$)', t: 'num' },
      { k: 'pixKey', l: 'Chave PIX' }, { k: 'open', l: 'Loja aberta (aceitando pedidos)', t: 'bool' }, { k: 'adminPass', l: 'Senha do painel', t: 'pw' }] },
  promo: { obj: 'promo', title: 'Destaque promocional (página inicial)', sub: '',
    fields: [{ k: 'title', l: 'Título', wide: true }, { k: 'text', l: 'Texto', wide: true, t: 'area' }, { k: 'code', l: 'Cupom em destaque' }] }
};
const TABS = [
  ['orders', '📦 Pedidos'], ['sales', '📈 Vendas'], ['products', '🍨 Produtos'], ['sizes', '📏 Tamanhos e bases'],
  ['toppings', '🍓 Complementos'], ['coupons', '🏷️ Cupons'], ['settings', '⚙️ Loja']
];
const TAB_SECTIONS = { products: ['categories', 'products'], sizes: ['sizes', 'bases'], toppings: ['toppingCats', 'toppings', 'specials'], coupons: ['coupons'], settings: ['store', 'promo'] };

function setDirty(v) { dirty = v; $('#saveBar').hidden = !v; }

/* ---------- Edição genérica ---------- */
function fieldHTML(f, rec, key, idx) {
  const v = rec[f.k];
  const attr = `data-s="${key}" data-i="${idx}" data-k="${f.k}" data-t="${f.t || 'text'}"`;
  const cls = `fl${f.wide ? ' wide' : ''}${f.t === 'bool' ? ' chk' : ''}`;
  if (f.t === 'bool') return `<label class="${cls}"><input type="checkbox" ${attr} ${v ? 'checked' : ''}> ${f.l}</label>`;
  if (f.t === 'sel') return `<label class="${cls}">${f.l}<select ${attr}>${f.opts().map(([val, lab]) => `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select></label>`;
  if (f.t === 'num') return `<label class="${cls}">${f.l}<input type="number" step="0.01" min="0" ${attr} value="${v ?? ''}"></label>`;
  if (f.t === 'area') return `<label class="${cls}">${f.l}<textarea rows="3" ${attr}>${esc(v)}</textarea></label>`;
  if (f.t === 'csv') return `<label class="${cls}">${f.l}<input type="text" ${attr} value="${esc((v || []).join(', '))}"></label>`;
  return `<label class="${cls}">${f.l}<input type="${f.t === 'pw' ? 'text' : 'text'}" ${attr} value="${esc(v)}"></label>`;
}
function sectionHTML(key) {
  const S = SC[key];
  if (S.obj) return `<div class="a-card"><h2>${S.title}</h2>${S.sub ? `<p class="sub">${S.sub}</p>` : ''}<div class="fields">${S.fields.map(f => fieldHTML(f, cfg[S.obj], key, 0)).join('')}</div></div>`;
  const arr = cfg[S.arr];
  return `<div class="a-card"><h2>${S.title}</h2><p class="sub">${S.sub}</p><div class="rows">${arr.map((r, i) => `<div class="row-e"><div class="fields">${S.fields.map(f => fieldHTML(f, r, key, i)).join('')}</div><button class="btn danger sm" data-del="${key}" data-i="${i}">Remover</button></div>`).join('') || '<p class="muted">Nada cadastrado.</p>'}</div><button class="btn ghost" data-add="${key}">+ Adicionar</button></div>`;
}
function renderEditor() {
  let html = (TAB_SECTIONS[tab] || []).map(sectionHTML).join('');
  if (tab === 'settings') html += `<div class="a-card"><h2>Dados e backup</h2><p class="sub">Exporte para guardar uma cópia ou levar a configuração para outro aparelho.</p>
    <div class="toolbar"><button class="btn ghost" data-do="export">Exportar configuração</button><label class="btn ghost" style="cursor:pointer">Importar configuração<input type="file" accept=".json" id="impFile" hidden></label>
    <button class="btn ghost" data-do="export-orders">Exportar pedidos</button><button class="btn danger" data-do="reset">Restaurar padrão</button><button class="btn danger" data-do="clear-orders">Apagar pedidos</button></div></div>`;
  $('#view').innerHTML = html;
}

/* ---------- Pedidos ---------- */
function waCustomer(o) {
  let d = digits(o.customer.phone); if (d.length <= 11) d = '55' + d;
  const msg = `Olá, ${o.customer.name.split(' ')[0]}! Seu pedido ${o.number} na ${cfg.store.name} está: *${o.status}*.`;
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`;
}
function renderOrders() {
  const all = DB.orders().slice().reverse();
  const list = all.filter(o => orderFilter === 'all' || o.status === orderFilter);
  $('#view').innerHTML = `<div class="a-card"><h2>Pedidos</h2><p class="sub">Atualize o status e avise o cliente pelo WhatsApp.</p>
    <div class="toolbar"><select id="ordFilter" class="btn ghost" style="text-align:left"><option value="all">Todos (${all.length})</option>${STATUSES.map(s => `<option ${s === orderFilter ? 'selected' : ''} value="${s}">${s} (${all.filter(o => o.status === s).length})</option>`).join('')}</select></div>
    ${list.map(o => `<div class="ord"><div class="ord-h"><b>Pedido ${esc(o.number)}</b><span class="st ${esc(o.status)}">${esc(o.status)}</span></div>
      <div class="muted">${new Date(o.createdAt).toLocaleString('pt-BR')} · ${esc(o.customer.name)} · ${esc(o.customer.phone)}</div>
      <ul>${o.items.map(i => `<li><b>${i.qty}x ${esc(i.name)}</b> — ${money(i.unit * i.qty)}<br><span class="muted">${i.details.map(esc).join(' · ')}${i.note ? ' · 📝 ' + esc(i.note) : ''}</span></li>`).join('')}</ul>
      <div class="muted">${o.mode === 'delivery' ? `🛵 ${esc(o.address.street)}, ${esc(o.address.number)} — ${esc(o.address.district)} (${esc(o.address.cep)})${o.address.comp ? ' · ' + esc(o.address.comp) : ''}${o.address.ref ? ' · ref.: ' + esc(o.address.ref) : ''}` : '🏪 Retirada na loja'}</div>
      <div class="muted">💳 ${esc({ pix: 'PIX', credit: 'Cartão de crédito', debit: 'Cartão de débito', cash: 'Dinheiro' }[o.payment])}${o.change ? ' (troco p/ ' + money(o.change) + ')' : ''}${o.coupon ? ' · cupom ' + esc(o.coupon) : ''} · <b>Total ${money(o.total)}</b></div>
      <div class="ord-act"><select data-oid="${esc(o.id)}">${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select><a class="btn green sm" target="_blank" rel="noopener" href="${waCustomer(o)}">Avisar cliente</a></div></div>`).join('') || '<p class="muted">Nenhum pedido por aqui ainda.</p>'}</div>`;
}

/* ---------- Vendas ---------- */
function renderSales() {
  const orders = DB.orders().filter(o => o.status !== 'Cancelado');
  const sum = a => a.reduce((s, o) => s + o.total, 0);
  const today = new Date().toDateString();
  const todayO = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const per = days.map(d => sum(orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString())));
  const maxV = Math.max(...per, 1);
  const prod = {};
  orders.forEach(o => o.items.forEach(i => { prod[i.name] = (prod[i.name] || 0) + i.qty; }));
  const top = Object.entries(prod).sort((a, b) => b[1] - a[1]).slice(0, 8);
  $('#view').innerHTML = `<div class="stats">
    <div class="stat"><small>Faturamento total</small><b>${money(sum(orders))}</b></div>
    <div class="stat"><small>Pedidos (sem cancelados)</small><b>${orders.length}</b></div>
    <div class="stat"><small>Ticket médio</small><b>${money(orders.length ? sum(orders) / orders.length : 0)}</b></div>
    <div class="stat"><small>Hoje</small><b>${money(sum(todayO))}</b><small>${todayO.length} pedido(s)</small></div></div>
    <div class="a-card"><h2>Últimos 7 dias</h2><div class="bars">${per.map((v, i) => `<div><small>${v ? money(v).replace('R$ ', '') : ''}</small><span style="height:${Math.max(2, v / maxV * 100)}%"></span>${days[i].toLocaleDateString('pt-BR', { weekday: 'short' })}</div>`).join('')}</div></div>
    <div class="a-card"><h2>Mais vendidos</h2><ul class="toplist">${top.map(([n, q]) => `<li><span>${esc(n)}</span><b>${q}</b></li>`).join('') || '<li class="muted">Sem vendas ainda.</li>'}</ul></div>`;
}

/* ---------- Render principal ---------- */
function render() {
  $('#tabs').innerHTML = TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('');
  if (tab === 'orders') renderOrders(); else if (tab === 'sales') renderSales(); else renderEditor();
}

/* ---------- Eventos ---------- */
function download(name, data) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
document.addEventListener('click', e => {
  const t = e.target.closest('button,[data-do]'); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; render(); return; }
  if (t.dataset.add) { const S = SC[t.dataset.add]; cfg[S.arr].push(S.blank()); setDirty(true); render(); return; }
  if (t.dataset.del) { if (confirm('Remover este item?')) { cfg[SC[t.dataset.del].arr].splice(+t.dataset.i, 1); setDirty(true); render(); } return; }
  switch (t.dataset.do) {
    case 'export': download('configuracao-acaiteria.json', cfg); break;
    case 'export-orders': download('pedidos-acaiteria.json', DB.orders()); break;
    case 'reset': if (confirm('Restaurar produtos, preços e regras para o padrão? Isso apaga suas alterações.')) { DB.reset(); cfg = DB.load(); setDirty(false); render(); toast('Configuração restaurada.'); } break;
    case 'clear-orders': if (confirm('Apagar TODOS os pedidos deste aparelho?')) { DB.saveOrders([]); toast('Pedidos apagados.'); } break;
  }
});
function onEdit(e) {
  const el = e.target; const s = el.dataset.s; if (!s) return;
  const S = SC[s]; const rec = S.obj ? cfg[S.obj] : cfg[S.arr][+el.dataset.i]; const k = el.dataset.k, ty = el.dataset.t;
  if (ty === 'bool') rec[k] = el.checked;
  else if (ty === 'num') rec[k] = parseFloat(String(el.value).replace(',', '.')) || 0;
  else if (ty === 'csv') rec[k] = el.value.split(',').map(x => x.trim()).filter(Boolean);
  else rec[k] = el.value;
  setDirty(true);
}
document.addEventListener('input', onEdit);
document.addEventListener('change', e => {
  onEdit(e);
  if (e.target.id === 'ordFilter') { orderFilter = e.target.value; renderOrders(); }
  if (e.target.dataset.oid) { const os = DB.orders(); const o = os.find(x => x.id === e.target.dataset.oid); if (o) { o.status = e.target.value; DB.saveOrders(os); renderOrders(); toast('Status atualizado.'); } }
  if (e.target.id === 'impFile') {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (!d.products || !d.sizes) throw 0; cfg = d; DB.save(cfg); setDirty(false); render(); toast('Configuração importada.'); } catch (x) { toast('Arquivo inválido.'); } };
    r.readAsText(f);
  }
});
$('#saveBtn').addEventListener('click', () => { DB.save(cfg); setDirty(false); toast('Alterações salvas! A loja já usa os novos dados.'); });
$('#logout').addEventListener('click', () => { sessionStorage.removeItem('acai_admin'); location.reload(); });
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- Login ---------- */
function start() {
  $('#login').hidden = true; $('#app').hidden = false;
  $('#notice').innerHTML = '⚠️ <b>Importante:</b> neste modelo, os dados e pedidos ficam no navegador do aparelho usado. Os pedidos chegam à loja pelo <b>WhatsApp</b>. Para um painel central em vários aparelhos, conecte um backend (veja o README). A senha deste painel é uma proteção básica, não uma segurança de servidor.';
  render();
}
if (sessionStorage.getItem('acai_admin') === '1') start();
else {
  $('#login').hidden = false;
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    if ($('#pw').value === cfg.store.adminPass) { sessionStorage.setItem('acai_admin', '1'); start(); }
    else $('#pw').closest('.f').classList.add('bad');
  });
}
})();
