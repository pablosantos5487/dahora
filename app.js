/* ============================================================
   app.js — loja: cardápio, montagem, carrinho, cupons, checkout, WhatsApp
   ============================================================ */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cfg = DB.load();
const ls = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const STEPS = ['Tamanho', 'Base', 'Complementos', 'Especiais', 'Observações', 'Revisão'];
const PAY = { pix: 'PIX', credit: 'Cartão de crédito', debit: 'Cartão de débito', cash: 'Dinheiro' };

let cart = ls('acai_cart', []);
let ui = { mode: ls('acai_mode', 'delivery'), code: '', cat: 'all', q: '' };
let B = null; // estado da montagem

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const typeOf = p => ({ tigelas: 'bowl', copos: 'cup', bebidas: 'shake', combos: 'combo' })[p.cat] || 'bowl';
const catName = id => (cfg.categories.find(c => c.id === id) || {}).name || '';
const show = s => { $(s).hidden = false; document.body.classList.add('lock'); };
const hide = s => { $(s).hidden = true; if (!$$('.overlay:not([hidden])').length) document.body.classList.remove('lock'); };
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }
function persist() { localStorage.setItem('acai_cart', JSON.stringify(cart)); localStorage.setItem('acai_mode', ui.mode); }

/* ---------- Home ---------- */
function art(p) {
  return p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : bowlSVG(typeOf(p), hash(p.id));
}
function card(p) {
  const off = p.available === false;
  const sale = p.oldPrice > p.price;
  return `<article class="card${off ? ' off' : ''}">
    <div class="card-art">${p.popular ? '<span class="badge">⭐ Mais pedido</span>' : ''}${sale ? `<span class="badge sale">-${Math.round(100 - p.price / p.oldPrice * 100)}%</span>` : ''}${art(p)}</div>
    <div class="card-body"><h3>${esc(p.name)}</h3><p class="muted">${esc(p.desc)}</p>
      <div class="meta"><span class="chip">${esc(p.sizeLabel || '')}</span><div class="price">${sale ? `<s>${money(p.oldPrice)}</s>` : ''}<b>${money(p.price)}</b></div></div>
      <div class="actions">${off ? '<button class="btn ghost" disabled>Indisponível</button>' :
        (p.custom ? `<button class="btn ghost" data-act="custom" data-id="${esc(p.id)}">Personalizar</button>` : '') +
        `<button class="btn primary" data-act="add" data-id="${esc(p.id)}">Adicionar</button>`}</div>
    </div></article>`;
}
function renderHome() {
  $$('[data-store]').forEach(el => el.textContent = cfg.store.name);
  document.title = `${cfg.store.name} | Açaiteria — Monte seu açaí online`;
  $('#catGrid').innerHTML = cfg.categories.map(c => `<button class="cat" data-act="cat" data-id="${esc(c.id)}"><i>${esc(c.emoji)}</i>${esc(c.name)}</button>`).join('');
  $('#popularGrid').innerHTML = cfg.products.filter(p => p.popular && p.available !== false).slice(0, 4).map(card).join('') || '<p class="muted">Em breve.</p>';
  const promos = cfg.products.filter(p => p.oldPrice > p.price && p.available !== false);
  $('#promoTitle').textContent = cfg.promo.title;
  $('#promoText').textContent = cfg.promo.text;
  const pc = $('#promoCode'); pc.textContent = cfg.promo.code ? `Copiar cupom ${cfg.promo.code}` : ''; pc.hidden = !cfg.promo.code; pc.dataset.code = cfg.promo.code;
  $('#promoGrid').innerHTML = promos.map(card).join('');
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.store.address)}`;
  $('#cAddress').innerHTML = `<a href="${maps}" target="_blank" rel="noopener">${esc(cfg.store.address)}</a>`;
  $('#cHours').textContent = cfg.store.hours;
  $('#cPhone').innerHTML = `<a href="tel:+${esc(cfg.store.whatsapp)}">${esc(cfg.store.phone)}</a>`;
  const ig = String(cfg.store.instagram || '').replace(/^@/, '');
  $('#cInsta').innerHTML = ig ? `<a href="https://www.instagram.com/${esc(ig)}/" target="_blank" rel="noopener">@${esc(ig)}</a>` : '';
  $('#cWa').href = `https://wa.me/${cfg.store.whatsapp}`;
  $('#closedBar').hidden = cfg.store.open !== false;
  $('#repeatBtn').hidden = !ls('acai_last', null);
  renderMenu();
}
function renderMenu() {
  const chips = [{ id: 'all', name: 'Todos' }, ...cfg.categories];
  $('#menuFilters').innerHTML = chips.map(c => `<button role="tab" class="${ui.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${esc(c.id)}" data-noscroll="1">${esc(c.name)}</button>`).join('');
  const q = ui.q.trim().toLowerCase();
  const list = cfg.products.filter(p => (ui.cat === 'all' || p.cat === ui.cat) && (!q || (p.name + ' ' + p.desc).toLowerCase().includes(q)));
  $('#menuGrid').innerHTML = list.map(card).join('');
  $('#menuEmpty').hidden = list.length > 0;
}

/* ---------- Montagem ---------- */
function mk(b) {
  const size = cfg.sizes.find(s => s.id === b.sizeId) || cfg.sizes[0];
  const base = cfg.bases.find(x => x.id === b.baseId);
  let used = 0, counted = 0, extra = 0;
  const catCount = {}, qty = {};
  b.order.forEach(id => { qty[id] = (qty[id] || 0) + 1; });
  for (const id of b.order) {
    const t = cfg.toppings.find(x => x.id === id);
    if (!t) continue;
    catCount[t.cat] = (catCount[t.cat] || 0) + 1;
    if (t.unlimited) continue;
    counted++;
    if (t.alwaysPaid) extra += t.price;
    else if (used < size.freeToppings) used++;
    else extra += t.price;
  }
  const spTotal = Object.entries(b.specials).reduce((s, [id, q]) => s + q * ((cfg.specials.find(x => x.id === id) || {}).price || 0), 0);
  const startPrice = b.override ?? size.price;
  const baseExtra = base ? base.extra : 0;
  return { size, base, qty, counted, used, freeLeft: Math.max(0, size.freeToppings - used), max: size.maxToppings, extra: round2(extra), spTotal: round2(spTotal), startPrice, baseExtra, catCount, total: round2(startPrice + baseExtra + extra + spTotal) };
}
function openBuilder(init = {}) {
  const firstBase = (cfg.bases.find(b => b.available !== false) || cfg.bases[0] || {}).id;
  B = Object.assign({ step: 1, reached: 1, sizeId: (cfg.sizes[2] || cfg.sizes[0]).id, baseId: firstBase, order: [], specials: {}, note: '', override: null, editUid: null, name: '', pid: null }, init);
  renderBuilder(); show('#builder');
}
function openFromProduct(id) {
  const p = cfg.products.find(x => x.id === id);
  if (!p || p.available === false) return;
  openBuilder({ override: p.price, sizeId: p.sizeId || undefined, baseId: p.baseId || undefined, order: [...(p.preset || [])].filter(t => cfg.toppings.some(x => x.id === t)), name: p.name, pid: p.id, step: 3, reached: 3 });
}
const builderName = () => B.name || `Açaí ${mk(B).size.name}`;
function warn(msg) { B.warn = msg; renderBuilder(); clearTimeout(warn.t); warn.t = setTimeout(() => { if (B) { B.warn = ''; renderBuilder(); } }, 4000); }
function renderBuilder() {
  const el = $('#builder');
  const old = $('.b-body', el); const sc = old ? old.scrollTop : 0;
  const m = mk(B);
  const last = B.step === 6;
  el.innerHTML = `<div class="b-wrap"><div class="b-main">
    <header class="b-head"><button class="icon-btn" data-act="b-back" aria-label="Voltar">←</button>
      <div><h2>${esc(builderName())}</h2><small>Etapa ${B.step} de 6 · ${STEPS[B.step - 1]}</small></div>
      <button class="icon-btn" data-act="b-close" aria-label="Fechar">✕</button></header>
    <ol class="stepper">${STEPS.map((s, i) => `<li class="${i + 1 === B.step ? 'on' : ''} ${i + 1 <= B.reached ? 'ok' : ''}"><button data-act="b-go" data-n="${i + 1}" ${i + 1 > B.reached ? 'disabled' : ''}><i>${i + 1}</i><span>${s}</span></button></li>`).join('')}</ol>
    <div class="progress"><span style="width:${B.step / 6 * 100}%"></span></div>
    <div class="b-body">${B.warn ? `<div class="warn" role="alert">⚠️ ${esc(B.warn)}</div>` : ''}${stepHTML(m)}</div>
    <div class="b-bar"><div><small>Total</small><b>${money(m.total)}</b></div>
      ${last ? `<div class="pair"><button class="btn ghost" data-act="b-go" data-n="3">Voltar e editar</button><button class="btn primary lg" data-act="b-next">${B.editUid ? 'Salvar alterações' : 'Adicionar ao carrinho'}</button></div>`
        : `<button class="btn primary lg" data-act="b-next">Continuar</button>`}</div>
  </div><aside class="b-side"><h3>Seu açaí</h3>${summaryHTML(m)}</aside></div>`;
  $('.b-body', el).scrollTop = sc;
}
function topLabel(t, m) {
  if (t.unlimited) return '<span class="tag">Grátis ilimitado</span>';
  if (t.alwaysPaid) return `<span class="tag paid">+${money(t.price)}</span>`;
  return m.freeLeft > 0 ? '<span class="tag">Grátis</span>' : `<span class="tag paid">+${money(t.price)}</span>`;
}
function stepHTML(m) {
  switch (B.step) {
    case 1: return `<h3 class="q">Escolha o tamanho</h3><p class="sub">Cada tamanho inclui uma quantidade de complementos grátis.</p>
      <div class="sizes">${cfg.sizes.map(s => `<button class="size${s.id === B.sizeId ? ' sel' : ''}" data-act="b-size" data-id="${esc(s.id)}">
        <span class="size-art" style="--s:${(.55 + s.ml / 1000 * .5).toFixed(2)}">${bowlSVG('cup', hash(s.id))}</span><b>${esc(s.name)}</b>
        <em>${money(B.override != null && s.id === B.sizeId ? B.override : s.price)}</em><small>${s.freeToppings} complementos grátis · até ${s.maxToppings}</small></button>`).join('')}</div>`;
    case 2: return `<h3 class="q">Escolha a base</h3><p class="sub">Alguns sabores têm adicional, informado ao lado.</p>
      <div class="opts">${cfg.bases.map(b => `<button class="opt${b.id === B.baseId ? ' sel' : ''}" data-act="b-base" data-id="${esc(b.id)}" ${b.available === false ? 'disabled' : ''}>
        <span>${esc(b.name)}${b.available === false ? ' <small>(indisponível)</small>' : ''}</span><span class="tag${b.extra > 0 ? ' paid' : ''}">${b.extra > 0 ? '+' + money(b.extra) : 'Sem adicional'}</span></button>`).join('')}</div>`;
    case 3: return `<h3 class="q">Escolha os complementos</h3><p class="sub">Toque para adicionar. O preço de cada item aparece antes de você escolher.</p>
      <div class="pill"><span class="${m.freeLeft === 0 ? 'full' : ''}">🎁 ${m.used}/${m.size.freeToppings} grátis</span><span class="${m.max > 0 && m.counted >= m.max ? 'full' : ''}">${m.counted}/${m.max} escolhidos</span>${m.extra > 0 ? `<span>+${money(m.extra)} em extras</span>` : ''}</div>
      ${cfg.toppingCats.map(c => {
        const items = cfg.toppings.filter(t => t.cat === c.id && t.available !== false);
        if (!items.length) return '';
        return `<section class="grp"><h3>${esc(c.name)} ${c.max > 0 ? `<small>(até ${c.max})</small>` : ''}</h3><div class="tops">${items.map(t => {
          const q = m.qty[t.id] || 0;
          return `<div class="top-c${q ? ' sel' : ''}" data-act="b-top" data-id="${esc(t.id)}" role="button" tabindex="0" aria-label="${esc(t.name)}">
            ${q ? `<span class="q">${q}</span>` : ''}${q ? `<button class="minus" data-act="b-top-rm" data-id="${esc(t.id)}" aria-label="Remover ${esc(t.name)}">−</button>` : ''}
            <span class="em">${esc(t.emoji)}</span><b>${esc(t.name)}</b>${topLabel(t, m)}</div>`;
        }).join('')}</div></section>`;
      }).join('')}
      ${m.counted >= 2 ? '' : '<p class="hint">Dica: combine uma fruta, um creme e um crocante para um açaí equilibrado.</p>'}`;
    case 4: return `<h3 class="q">Adicionais especiais <small style="font-size:.9rem;color:var(--muted)">(opcional)</small></h3><p class="sub">Capriche com itens premium. Os valores já entram no total.</p>
      ${cfg.specials.filter(s => s.available !== false).map(s => {
        const q = B.specials[s.id] || 0;
        return `<div class="sp${q ? ' sel' : ''}"><span class="em">${esc(s.emoji)}</span><div class="t"><b>${esc(s.name)}</b><br><small>+${money(s.price)} cada${s.maxQty > 1 ? ` · até ${s.maxQty}` : ''}</small></div>
          <div class="qty"><button data-act="b-sp-rm" data-id="${esc(s.id)}" aria-label="Menos" ${q ? '' : 'disabled'}>−</button><span>${q}</span><button data-act="b-sp" data-id="${esc(s.id)}" aria-label="Mais">+</button></div></div>`;
      }).join('') || '<p class="muted">Nenhum adicional disponível agora.</p>'}`;
    case 5: return `<h3 class="q">Alguma observação?</h3><p class="sub">Opcional. Ex.: pouco leite condensado, sem banana, separar o creme.</p>
      <textarea class="note" id="bNote" maxlength="140" placeholder="Escreva aqui…">${esc(B.note)}</textarea>
      <p class="hint"><span id="bCount">${B.note.length}</span>/140 · As observações dependem da disponibilidade e das possibilidades de preparo.</p>`;
    default: return `<h3 class="q">Revise seu açaí</h3><p class="sub">Confira tudo antes de adicionar ao carrinho.</p>${summaryHTML(m, true)}`;
  }
}
function toppingsText(m) {
  return Object.entries(m.qty).map(([id, q]) => { const t = cfg.toppings.find(x => x.id === id); return t ? (q > 1 ? `${q}x ` : '') + t.name : ''; }).filter(Boolean);
}
function specialsText() {
  return Object.entries(B.specials).filter(([, q]) => q > 0).map(([id, q]) => { const s = cfg.specials.find(x => x.id === id); return s ? (q > 1 ? `${q}x ` : '') + s.name : ''; }).filter(Boolean);
}
function summaryHTML(m, full) {
  const tops = toppingsText(m), sps = specialsText();
  return `<div class="rev">
    <div class="row"><span>Tamanho</span><span>${esc(m.size.name)}</span></div>
    <div class="row"><span>Base</span><span>${esc(m.base ? m.base.name : '—')}</span></div>
    <div class="row"><span>Complementos</span><span>${tops.length ? esc(tops.join(', ')) : 'Nenhum'}</span></div>
    <div class="row"><span>Especiais</span><span>${sps.length ? esc(sps.join(', ')) : 'Nenhum'}</span></div>
    ${B.note ? `<div class="row"><span>Observações</span><span>${esc(B.note)}</span></div>` : ''}
    <hr>
    <div class="row"><span>Valor inicial${B.override != null ? ' (produto)' : ''}</span><span>${money(m.startPrice)}</span></div>
    ${m.baseExtra > 0 ? `<div class="row"><span>Adicional da base</span><span>+${money(m.baseExtra)}</span></div>` : ''}
    ${m.extra > 0 ? `<div class="row"><span>Complementos extras</span><span>+${money(m.extra)}</span></div>` : ''}
    ${m.spTotal > 0 ? `<div class="row"><span>Adicionais especiais</span><span>+${money(m.spTotal)}</span></div>` : ''}
    <div class="row total"><span style="color:inherit">Total</span><span>${money(m.total)}</span></div></div>`;
}
function addTop(id) {
  const t = cfg.toppings.find(x => x.id === id); if (!t || t.available === false) return;
  const m = mk(B); const cur = m.qty[id] || 0; const maxQ = t.maxQty || 1;
  if (cur >= maxQ) return warn(`"${t.name}" permite no máximo ${maxQ} unidade${maxQ > 1 ? 's' : ''}.`);
  const cat = cfg.toppingCats.find(c => c.id === t.cat);
  if (cat && cat.max > 0 && (m.catCount[t.cat] || 0) >= cat.max) return warn(`Em "${cat.name}" você pode escolher até ${cat.max} ite${cat.max > 1 ? 'ns' : 'm'}.`);
  if (!t.unlimited && m.max > 0 && m.counted >= m.max) return warn(`O tamanho ${m.size.name} permite até ${m.max} complementos. Remova algum item ou escolha um tamanho maior.`);
  B.order.push(id); renderBuilder();
}
function rmTop(id) { const i = B.order.lastIndexOf(id); if (i >= 0) { B.order.splice(i, 1); renderBuilder(); } }
function setSize(id) {
  if (id === B.sizeId) return;
  const s = cfg.sizes.find(x => x.id === id);
  const m = mk(Object.assign({}, B, { sizeId: id }));
  if (s.maxToppings > 0 && m.counted > s.maxToppings) return warn(`Você já escolheu ${m.counted} complementos e o tamanho ${s.name} permite até ${s.maxToppings}. Remova alguns antes de trocar.`);
  B.sizeId = id; B.override = null; renderBuilder();
}
function goStep(n) { n = Math.max(1, Math.min(6, n)); B.step = n; B.reached = Math.max(B.reached, n); B.warn = ''; renderBuilder(); $('.b-body', $('#builder')).scrollTop = 0; }
function nextStep() {
  if (B.step < 6) {
    if (B.step === 2 && !(cfg.bases.find(b => b.id === B.baseId) || {}).id) return warn('Escolha uma base para continuar.');
    return goStep(B.step + 1);
  }
  finishBuilder();
}
function finishBuilder() {
  const m = mk(B);
  const tops = toppingsText(m), sps = specialsText();
  const details = [`Tamanho: ${m.size.name}`, `Base: ${m.base ? m.base.name : '—'}`];
  if (tops.length) details.push('Complementos: ' + tops.join(', '));
  if (sps.length) details.push('Especiais: ' + sps.join(', '));
  const build = JSON.parse(JSON.stringify({ step: 1, reached: 6, sizeId: B.sizeId, baseId: B.baseId, order: B.order, specials: B.specials, note: B.note, override: B.override, name: B.name, pid: B.pid }));
  const item = { uid: B.editUid || uid(), type: 'custom', name: B.pid ? `${B.name} (personalizado)` : `Açaí ${m.size.name} montado`, details, note: B.note.trim(), unit: m.total, qty: 1, build };
  if (B.editUid) { const i = cart.findIndex(c => c.uid === B.editUid); if (i >= 0) { item.qty = cart[i].qty; cart[i] = item; } else cart.push(item); toast('Açaí atualizado!'); }
  else { cart.push(item); toast('Açaí adicionado ao carrinho! 🎉'); }
  B = null; hide('#builder'); $('#builder').innerHTML = ''; updateCartUI(); bump();
  openCart();
}
function closeBuilder() {
  if (B && B.reached > 1 && !B.editUid && B.order.length && !confirm('Sair da montagem? Suas escolhas serão perdidas.')) return;
  B = null; hide('#builder'); $('#builder').innerHTML = '';
}

/* ---------- Carrinho ---------- */
function findCoupon() {
  if (!ui.code) return null;
  return cfg.coupons.find(c => c.active !== false && c.code.toUpperCase() === ui.code.toUpperCase()) || null;
}
function totals() {
  const subtotal = round2(cart.reduce((s, i) => s + i.unit * i.qty, 0));
  const c = findCoupon();
  let discount = 0, freeShip = false, couponMsg = '', couponOk = false;
  if (ui.code && !c) couponMsg = 'Cupom inválido ou expirado.';
  else if (c && subtotal < (c.minOrder || 0)) couponMsg = `Cupom válido para pedidos a partir de ${money(c.minOrder)}.`;
  else if (c) {
    couponOk = true;
    if (c.type === 'percent') discount = round2(subtotal * c.value / 100);
    else if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
    else freeShip = true;
    couponMsg = c.type === 'frete' ? 'Cupom aplicado: frete grátis!' : `Cupom aplicado: -${money(discount)}`;
  }
  let fee = 0;
  if (ui.mode === 'delivery' && cart.length) fee = (freeShip || (cfg.store.freeDeliveryAbove > 0 && subtotal >= cfg.store.freeDeliveryAbove)) ? 0 : cfg.store.deliveryFee;
  return { subtotal, discount, fee, total: round2(Math.max(0, subtotal - discount) + fee), couponMsg, couponOk, count: cart.reduce((s, i) => s + i.qty, 0) };
}
function updateCartUI() {
  const t = totals();
  persist();
  $('#cartCount').textContent = t.count;
  $('#fabCount').textContent = t.count;
  $('#fabTotal').textContent = money(t.subtotal);
  const fab = $('#fab'); const has = t.count > 0;
  fab.hidden = !has; fab.classList.toggle('show', has);
  document.body.classList.toggle('has-fab', has);
  if (!$('#cart').hidden) renderCart();
}
function bump() { const b = $('.cart-btn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
function renderCart() {
  const t = totals(); const el = $('#cart');
  const body = $('.panel-body', el); const sc = body ? body.scrollTop : 0;
  const sugg = cfg.products.filter(p => p.cat === 'bebidas' && p.available !== false && !cart.some(c => c.pid === p.id)).slice(0, 2);
  el.innerHTML = `<div class="panel">
    <div class="panel-head"><h2>Seu carrinho</h2><button class="icon-btn" data-act="cart-close" aria-label="Fechar carrinho">✕</button></div>
    <div class="panel-body">${!cart.length ? `<div class="empty"><i>🛒</i><h3>Seu carrinho está vazio</h3><p class="muted" style="margin:6px 0 16px">Monte um açaí ou escolha no cardápio.</p><button class="btn primary" data-act="b-from-cart">Monte seu açaí</button></div>` :
      cart.map(i => `<div class="ci"><div class="ci-top"><h4>${esc(i.name)}</h4><b>${money(i.unit * i.qty)}</b></div>
        <ul>${i.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>${i.note ? `<div class="note">📝 ${esc(i.note)}</div>` : ''}
        <div class="ci-bot"><div class="qty"><button data-act="qty-dec" data-id="${i.uid}" aria-label="Diminuir">−</button><span>${i.qty}</span><button data-act="qty-inc" data-id="${i.uid}" aria-label="Aumentar">+</button></div>
        <div>${i.build ? `<button class="link" data-act="edit" data-id="${i.uid}">Editar</button>` : ''}<button class="link red" data-act="remove" data-id="${i.uid}">Remover</button></div></div></div>`).join('') +
      (sugg.length ? `<div class="sugg"><b>Que tal acompanhar?</b>${sugg.map(p => `<div class="sugg-row"><span>${esc(p.name)} · ${money(p.price)}</span><button class="btn sm green" data-act="add" data-id="${esc(p.id)}">+ Adicionar</button></div>`).join('')}</div>` : '')}
    </div>
    ${cart.length ? `<div class="panel-foot">
      <div class="seg"><button class="${ui.mode === 'delivery' ? 'on' : ''}" data-act="mode" data-id="delivery">🛵 Entrega</button><button class="${ui.mode === 'pickup' ? 'on' : ''}" data-act="mode" data-id="pickup">🏪 Retirada</button></div>
      <div><div class="coupon"><input id="couponIn" placeholder="Cupom de desconto" value="${esc(ui.code)}" autocapitalize="characters"><button class="btn ghost sm" data-act="coupon">Aplicar</button></div>${t.couponMsg ? `<div class="cmsg ${t.couponOk ? 'ok' : 'bad'}">${esc(t.couponMsg)}</div>` : ''}</div>
      <div class="sum"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        ${t.discount > 0 ? `<div class="disc"><span>Desconto</span><span>-${money(t.discount)}</span></div>` : ''}
        ${ui.mode === 'delivery' ? `<div><span>Taxa de entrega</span><span>${t.fee > 0 ? money(t.fee) : 'Grátis'}</span></div>` : ''}
        <div class="tot"><span>Total</span><span>${money(t.total)}</span></div></div>
      <button class="btn primary lg" data-act="checkout">Finalizar pedido</button>
      <button class="btn ghost" data-act="cart-close">Continuar comprando</button></div>` : ''}
  </div>`;
  const nb = $('.panel-body', el); if (nb) nb.scrollTop = sc;
}
function openCart() { renderCart(); show('#cart'); }
function closeCart() { hide('#cart'); }
function addProduct(id) {
  const p = cfg.products.find(x => x.id === id); if (!p || p.available === false) return;
  const ex = cart.find(c => c.pid === id && c.type === 'product');
  if (ex) ex.qty++; else cart.push({ uid: uid(), type: 'product', pid: id, name: p.name, details: [p.sizeLabel, p.desc].filter(Boolean), note: '', unit: p.price, qty: 1 });
  toast(`${p.name} adicionado!`); updateCartUI(); bump();
}

/* ---------- Checkout ---------- */
function openCheckout() {
  if (!cart.length) return;
  if (cfg.store.open === false) return toast('Estamos fechados no momento. Voltamos em breve!');
  const t = totals();
  if (t.subtotal < cfg.store.minOrder) return toast(`Pedido mínimo: ${money(cfg.store.minOrder)}.`);
  closeCart(); renderCheckout(); show('#checkout');
}
const digits = s => String(s || '').replace(/\D/g, '');
function maskPhone(v) { const d = digits(v).slice(0, 11); if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, d.length > 10 ? 7 : 6)}-${d.slice(d.length > 10 ? 7 : 6)}`; if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`; return d; }
function maskCep(v) { const d = digits(v).slice(0, 8); return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; }
function renderCheckout() {
  const c = ls('acai_cust', {});
  const f = (id, label, val = '', extra = '') => `<div class="f" id="f-${id}"><label for="${id}">${label}</label><input id="${id}" value="${esc(val)}" ${extra}><span class="err"></span></div>`;
  $('#checkout').innerHTML = `<div class="ck"><div class="panel-head"><button class="icon-btn" data-act="ck-close" aria-label="Voltar ao carrinho">←</button><h2>Finalizar pedido</h2><span style="width:42px"></span></div>
    <form class="ck-body" id="ckForm" novalidate>
      <div class="fs"><h3>1. Seus dados</h3>${f('name', 'Nome completo', c.name, 'autocomplete="name"')}${f('phone', 'Telefone / WhatsApp', c.phone, 'inputmode="tel" autocomplete="tel" placeholder="(51) 99999-9999"')}</div>
      <div class="fs"><h3>2. Como você quer receber?</h3><div class="radios two">
        <label class="radio"><input type="radio" name="mode" value="delivery" ${ui.mode === 'delivery' ? 'checked' : ''}> 🛵 Entrega</label>
        <label class="radio"><input type="radio" name="mode" value="pickup" ${ui.mode === 'pickup' ? 'checked' : ''}> 🏪 Retirada</label></div>
        <p class="hint" id="pickHint" ${ui.mode === 'pickup' ? '' : 'hidden'}>Retire em: ${esc(cfg.store.address)}</p>
        <div id="addrBox" ${ui.mode === 'delivery' ? '' : 'hidden'} style="margin-top:14px">
          ${f('cep', 'CEP', c.cep, 'inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"')}
          ${f('street', 'Rua', c.street, 'autocomplete="address-line1"')}
          <div class="row3">${f('number', 'Número', c.number, 'inputmode="numeric"')}${f('district', 'Bairro', c.district)}</div>
          ${f('comp', 'Complemento (opcional)', c.comp)}${f('ref', 'Ponto de referência (opcional)', c.ref)}</div></div>
      <div class="fs"><h3>3. Pagamento</h3><div class="radios">${Object.entries(PAY).filter(([k]) => k !== 'pix' || cfg.store.pixKey).map(([k, v]) => `<label class="radio"><input type="radio" name="pay" value="${k}"> ${k === 'pix' ? '⚡' : k === 'cash' ? '💵' : '💳'} ${v}</label>`).join('')}</div>
        <p class="hint" id="payHint">Pagamento na entrega ou na retirada: dinheiro ou cartão na maquininha (Visa, Mastercard, Elo e Banricompras crédito).${cfg.store.pixKey ? ' PIX: enviaremos a chave ao confirmar.' : ''}</p>
        <span class="err" id="payErr" style="color:var(--red);font-size:.78rem;display:none">Escolha a forma de pagamento.</span>
        <div id="cashBox" hidden style="margin-top:12px"><p style="font-weight:500;margin-bottom:8px">Precisa de troco?</p><div class="radios two">
          <label class="radio"><input type="radio" name="chg" value="no" checked> Não preciso</label><label class="radio"><input type="radio" name="chg" value="yes"> Sim</label></div>
          <div id="chgBox" hidden style="margin-top:10px">${f('chgFor', 'Troco para quanto? (R$)', '', 'inputmode="decimal" placeholder="Ex.: 50"')}</div></div></div>
      <div class="fs"><h3>4. Resumo do pedido</h3><div id="ckSummary"></div></div>
      <button class="btn primary lg" style="width:100%" type="submit">Confirmar pedido</button>
      <p class="hint center" style="margin-top:10px">🔒 Seus dados são usados apenas para este pedido e ficam salvos só neste aparelho, para agilizar a próxima compra.</p>
    </form></div>`;
  refreshCkSummary();
  const form = $('#ckForm');
  form.addEventListener('input', e => {
    if (e.target.id === 'phone') e.target.value = maskPhone(e.target.value);
    if (e.target.id === 'cep') { e.target.value = maskCep(e.target.value); if (digits(e.target.value).length === 8) lookupCep(digits(e.target.value)); }
    e.target.closest('.f')?.classList.remove('bad');
  });
  form.addEventListener('change', e => {
    if (e.target.name === 'mode') { ui.mode = e.target.value; persist(); $('#addrBox').hidden = ui.mode !== 'delivery'; $('#pickHint').hidden = ui.mode !== 'pickup'; refreshCkSummary(); }
    if (e.target.name === 'pay') { $('#cashBox').hidden = e.target.value !== 'cash'; $('#payErr').style.display = 'none'; }
    if (e.target.name === 'chg') $('#chgBox').hidden = e.target.value !== 'yes';
  });
  form.addEventListener('submit', e => { e.preventDefault(); submitOrder(); });
}
async function lookupCep(cep) {
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`); const d = await r.json();
    if (d.erro) return;
    if (!$('#street').value) $('#street').value = d.logradouro || '';
    if (!$('#district').value) $('#district').value = d.bairro || '';
    $('#number').focus();
  } catch (e) { /* sem internet: preenche manualmente */ }
}
function refreshCkSummary() {
  const t = totals();
  $('#ckSummary').innerHTML = cart.map(i => `<div style="margin-bottom:10px"><div class="row" style="display:flex;justify-content:space-between;gap:8px"><b>${i.qty}x ${esc(i.name)}</b><span>${money(i.unit * i.qty)}</span></div><div class="muted" style="font-size:.8rem">${i.details.map(esc).join(' · ')}${i.note ? ' · 📝 ' + esc(i.note) : ''}</div></div>`).join('') +
    `<div class="sum" style="border-top:1px dashed var(--line);padding-top:10px"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>${t.discount > 0 ? `<div class="disc"><span>Desconto (${esc(ui.code.toUpperCase())})</span><span>-${money(t.discount)}</span></div>` : ''}${ui.mode === 'delivery' ? `<div><span>Taxa de entrega</span><span>${t.fee > 0 ? money(t.fee) : 'Grátis'}</span></div>` : ''}<div class="tot"><span>Total</span><span>${money(t.total)}</span></div></div>`;
}
function fieldErr(id, msg) { const f = $('#f-' + id); if (!f) return; f.classList.add('bad'); $('.err', f).textContent = msg; }
function submitOrder() {
  const t = totals(); let ok = true; let first = null;
  const bad = (id, m) => { fieldErr(id, m); ok = false; if (!first) first = $('#f-' + id); };
  document.querySelectorAll('.f.bad').forEach(f => f.classList.remove('bad'));
  const name = $('#name').value.trim(), phone = digits($('#phone').value);
  if (name.length < 3) bad('name', 'Informe seu nome completo.');
  if (phone.length < 10) bad('phone', 'Informe um telefone válido com DDD.');
  const addr = { cep: $('#cep').value.trim(), street: $('#street').value.trim(), number: $('#number').value.trim(), district: $('#district').value.trim(), comp: $('#comp').value.trim(), ref: $('#ref').value.trim() };
  if (ui.mode === 'delivery') {
    if (digits(addr.cep).length !== 8) bad('cep', 'CEP inválido.');
    if (!addr.street) bad('street', 'Informe a rua.');
    if (!addr.number) bad('number', 'Informe o número.');
    if (!addr.district) bad('district', 'Informe o bairro.');
  }
  const payEl = document.querySelector('input[name="pay"]:checked');
  if (!payEl) { $('#payErr').style.display = 'block'; ok = false; if (!first) first = $('#payErr'); }
  let change = null;
  if (payEl && payEl.value === 'cash' && document.querySelector('input[name="chg"]:checked').value === 'yes') {
    const v = parseFloat(String($('#chgFor').value).replace(',', '.'));
    if (!(v > t.total)) bad('chgFor', `Informe um valor maior que ${money(t.total)}.`); else change = v;
  }
  if (!ok) { first && first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  const order = {
    id: uid(), number: DB.nextOrderNumber(), createdAt: new Date().toISOString(), status: 'Recebido',
    customer: { name, phone: maskPhone(phone) }, mode: ui.mode, address: ui.mode === 'delivery' ? addr : null,
    payment: payEl.value, change, coupon: totals().couponOk ? ui.code.toUpperCase() : '',
    items: JSON.parse(JSON.stringify(cart)), subtotal: t.subtotal, discount: t.discount, fee: t.fee, total: t.total
  };
  const orders = DB.orders(); orders.push(order); DB.saveOrders(orders);
  localStorage.setItem('acai_cust', JSON.stringify(Object.assign({ name, phone: maskPhone(phone) }, addr)));
  localStorage.setItem('acai_last', JSON.stringify(order.items));
  cart = []; ui.code = ''; updateCartUI(); $('#repeatBtn').hidden = false;
  renderSuccess(order);
}
function waMsg(o) {
  const L = [`🍇 *NOVO PEDIDO ${o.number}* — ${cfg.store.name}`, '', `👤 *Cliente:* ${o.customer.name}`, `📱 *WhatsApp:* ${o.customer.phone}`, ''];
  o.items.forEach((it, i) => {
    L.push(`*${i + 1}) ${it.qty}x ${it.name}* — ${money(it.unit * it.qty)}`);
    it.details.forEach(d => L.push(`   • ${d}`));
    if (it.note) L.push(`   📝 Obs: ${it.note}`);
    L.push('');
  });
  L.push(`💰 Subtotal: ${money(o.subtotal)}`);
  if (o.discount > 0) L.push(`🏷️ Desconto${o.coupon ? ' (' + o.coupon + ')' : ''}: -${money(o.discount)}`);
  if (o.mode === 'delivery') L.push(`🛵 Entrega: ${o.fee > 0 ? money(o.fee) : 'Grátis'}`);
  L.push(`✅ *TOTAL: ${money(o.total)}*`, '');
  if (o.mode === 'delivery') {
    const a = o.address;
    L.push('📍 *ENTREGA*', `${a.street}, ${a.number} — ${a.district}`, `CEP: ${a.cep}`);
    if (a.comp) L.push(`Compl.: ${a.comp}`);
    if (a.ref) L.push(`Ref.: ${a.ref}`);
  } else L.push('🏪 *RETIRADA NA LOJA*');
  L.push('', `💳 *Pagamento:* ${PAY[o.payment]}${o.payment === 'cash' ? (o.change ? ` (troco para ${money(o.change)})` : ' (sem troco)') : ''}`);
  return L.join('\n');
}
function renderSuccess(o) {
  const url = `https://wa.me/${cfg.store.whatsapp}?text=${encodeURIComponent(waMsg(o))}`;
  $('#checkout').innerHTML = `<div class="ck"><div class="ck-body"><div class="ok-box"><div class="big">🎉</div><h2>Pedido registrado!</h2>
    <div class="num">Pedido ${esc(o.number)}</div>
    <p>Agora é só enviar pelo WhatsApp para a loja confirmar e iniciar o preparo. <b>Seu pedido só é confirmado após o envio.</b></p>
    <div class="btns"><a class="btn green lg" href="${url}" target="_blank" rel="noopener">Enviar pedido pelo WhatsApp</a>
    ${o.payment === 'pix' ? `<button class="btn ghost" data-act="copy-pix">Copiar chave PIX</button><p class="hint">Chave PIX: ${esc(cfg.store.pixKey)} · Total ${money(o.total)}</p>` : ''}
    <button class="btn ghost" data-act="ck-done">Voltar ao início</button></div></div></div></div>`;
}

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  if (a === 'b-top-rm') { e.stopPropagation(); return rmTop(id); }
  switch (a) {
    case 'cat': ui.cat = id; renderMenu(); if (!el.dataset.noscroll) $('#cardapio').scrollIntoView({ behavior: 'smooth' }); break;
    case 'add': addProduct(id); break;
    case 'custom': openFromProduct(id); break;
    case 'open-builder': openBuilder(); break;
    case 'b-from-cart': closeCart(); openBuilder(); break;
    case 'cart-open': openCart(); break;
    case 'cart-close': closeCart(); break;
    case 'toggle-nav': { const n = $('#nav'); const o = n.classList.toggle('open'); el.setAttribute('aria-expanded', o); break; }
    case 'copy-code': navigator.clipboard?.writeText(el.dataset.code).then(() => toast(`Cupom ${el.dataset.code} copiado!`)).catch(() => toast(`Use o cupom ${el.dataset.code}`)); break;
    case 'repeat': { const last = ls('acai_last', null); if (last) { last.forEach(i => { i.uid = uid(); cart.push(i); }); updateCartUI(); openCart(); toast('Itens do último pedido adicionados.'); } break; }
    case 'qty-inc': { const i = cart.find(c => c.uid === id); if (i && i.qty < 20) i.qty++; updateCartUI(); break; }
    case 'qty-dec': { const i = cart.find(c => c.uid === id); if (i) { i.qty--; if (i.qty <= 0) cart = cart.filter(c => c.uid !== id); } updateCartUI(); break; }
    case 'remove': cart = cart.filter(c => c.uid !== id); updateCartUI(); break;
    case 'edit': { const i = cart.find(c => c.uid === id); if (i && i.build) { closeCart(); openBuilder(Object.assign(JSON.parse(JSON.stringify(i.build)), { editUid: id, step: 3, reached: 6 })); } break; }
    case 'mode': ui.mode = id; updateCartUI(); break;
    case 'coupon': ui.code = ($('#couponIn').value || '').trim(); updateCartUI(); break;
    case 'checkout': openCheckout(); break;
    case 'ck-close': hide('#checkout'); openCart(); break;
    case 'ck-done': hide('#checkout'); $('#checkout').innerHTML = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'copy-pix': navigator.clipboard?.writeText(cfg.store.pixKey).then(() => toast('Chave PIX copiada!')).catch(() => toast('Chave: ' + cfg.store.pixKey)); break;
    // montagem
    case 'b-close': closeBuilder(); break;
    case 'b-back': B.step === 1 ? closeBuilder() : goStep(B.step - 1); break;
    case 'b-go': goStep(parseInt(el.dataset.n, 10)); break;
    case 'b-next': nextStep(); break;
    case 'b-size': setSize(id); break;
    case 'b-base': B.baseId = id; renderBuilder(); break;
    case 'b-top': { const q = mk(B).qty[id] || 0; const t = cfg.toppings.find(x => x.id === id); if (q > 0 && (t.maxQty || 1) === 1) rmTop(id); else addTop(id); break; }
    case 'b-sp': { const s = cfg.specials.find(x => x.id === id); const q = B.specials[id] || 0; if (q >= (s.maxQty || 1)) return warn(`"${s.name}" permite no máximo ${s.maxQty || 1} unidade(s).`); B.specials[id] = q + 1; renderBuilder(); break; }
    case 'b-sp-rm': { const q = B.specials[id] || 0; if (q <= 1) delete B.specials[id]; else B.specials[id] = q - 1; renderBuilder(); break; }
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!$('#builder').hidden) closeBuilder(); else if (!$('#checkout').hidden) { /* não fecha sem querer */ } else if (!$('#cart').hidden) closeCart();
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.top-c')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'bNote' && B) { B.note = e.target.value.slice(0, 140); $('#bCount').textContent = B.note.length; $('.b-side').innerHTML = `<h3>Seu açaí</h3>${summaryHTML(mk(B))}`; }
  if (e.target.id === 'menuSearch') { ui.q = e.target.value; renderMenu(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'couponIn') { e.preventDefault(); ui.code = e.target.value.trim(); updateCartUI(); } });
$('#cart').addEventListener('click', e => { if (e.target === $('#cart')) closeCart(); });
$$('.nav a').forEach(a => a.addEventListener('click', () => $('#nav').classList.remove('open')));
window.addEventListener('storage', e => { if (e.key === 'acai_cfg' && $('#builder').hidden && $('#checkout').hidden) location.reload(); });

renderHome();
updateCartUI();
})();
