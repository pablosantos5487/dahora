/* ============================================================
   data.js — configuração padrão, camada de dados e utilitários
   Tudo que o administrador edita vive em DB (localStorage).
   Para ligar a um backend real (Wix Velo, Firebase, Supabase...),
   troque apenas as funções de DB.* — o resto do site não muda.
   ============================================================ */

const DEFAULTS = {
  store: {
    name: 'Açaí Vivo',
    whatsapp: '5551999999999',      // DDI+DDD+número, só dígitos. TROQUE pelo número real.
    phone: '(51) 99999-9999',
    address: 'Rua das Palmeiras, 123 — Centro',
    hours: 'Todos os dias, das 12h às 23h',
    instagram: '@acaivivo',
    deliveryFee: 6,
    freeDeliveryAbove: 60,          // 0 = desativado
    minOrder: 15,
    pixKey: 'pix@acaivivo.com.br',
    open: true,
    adminPass: 'admin123'           // TROQUE. (proteção básica; veja README)
  },
  promo: {
    title: 'Combo Casal com preço especial',
    text: 'Dois açaís de 500 ml com complementos à escolha. Use o cupom ACAI10 e ganhe 10% OFF no pedido.',
    code: 'ACAI10'
  },
  categories: [
    { id: 'tradicionais', name: 'Açaís tradicionais', emoji: '🍇' },
    { id: 'especiais', name: 'Açaís especiais', emoji: '✨' },
    { id: 'copos', name: 'Copos de açaí', emoji: '🥤' },
    { id: 'tigelas', name: 'Tigelas de açaí', emoji: '🥣' },
    { id: 'combos', name: 'Combos', emoji: '🎁' },
    { id: 'bebidas', name: 'Shakes e vitaminas', emoji: '🥛' }
  ],
  sizes: [
    { id: 's300', name: '300 ml', ml: 300, price: 14.9, freeToppings: 2, maxToppings: 5 },
    { id: 's400', name: '400 ml', ml: 400, price: 18.9, freeToppings: 3, maxToppings: 6 },
    { id: 's500', name: '500 ml', ml: 500, price: 22.9, freeToppings: 4, maxToppings: 8 },
    { id: 's700', name: '700 ml', ml: 700, price: 28.9, freeToppings: 5, maxToppings: 10 },
    { id: 's1000', name: '1 litro', ml: 1000, price: 38.9, freeToppings: 7, maxToppings: 12 }
  ],
  bases: [
    { id: 'b_trad', name: 'Açaí tradicional', extra: 0, available: true },
    { id: 'b_zero', name: 'Açaí zero açúcar', extra: 2, available: true },
    { id: 'b_banana', name: 'Açaí com banana', extra: 1.5, available: true },
    { id: 'b_morango', name: 'Açaí com morango', extra: 2, available: true }
  ],
  toppingCats: [
    { id: 'c_frutas', name: 'Frutas', max: 0 },
    { id: 'c_cremes', name: 'Cremes', max: 2 },
    { id: 'c_crocantes', name: 'Crocantes', max: 0 },
    { id: 'c_doces', name: 'Doces e coberturas', max: 0 }
  ],
  /* price = valor cobrado quando o item NÃO é grátis.
     alwaysPaid = sempre cobrado (não usa a cota grátis).
     unlimited  = grátis e não conta no limite.
     maxQty     = quantas unidades do mesmo item podem ser pedidas. */
  toppings: [
    { id: 't_banana', cat: 'c_frutas', name: 'Banana', emoji: '🍌', price: 2, alwaysPaid: false, unlimited: false, maxQty: 2, available: true },
    { id: 't_morango', cat: 'c_frutas', name: 'Morango', emoji: '🍓', price: 3, alwaysPaid: false, unlimited: false, maxQty: 2, available: true },
    { id: 't_kiwi', cat: 'c_frutas', name: 'Kiwi', emoji: '🥝', price: 3, alwaysPaid: true, unlimited: false, maxQty: 1, available: true },
    { id: 't_manga', cat: 'c_frutas', name: 'Manga', emoji: '🥭', price: 3, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_uva', cat: 'c_frutas', name: 'Uva', emoji: '🍇', price: 3, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_ninho', cat: 'c_cremes', name: 'Creme de ninho', emoji: '🥛', price: 3, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_avela', cat: 'c_cremes', name: 'Creme de avelã', emoji: '🌰', price: 3.5, alwaysPaid: true, unlimited: false, maxQty: 1, available: true },
    { id: 't_cmorango', cat: 'c_cremes', name: 'Creme de morango', emoji: '🍓', price: 3, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_cpacoca', cat: 'c_cremes', name: 'Creme de paçoca', emoji: '🥜', price: 3, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_granola', cat: 'c_crocantes', name: 'Granola', emoji: '🌾', price: 1.5, alwaysPaid: false, unlimited: false, maxQty: 2, available: true },
    { id: 't_sucrilhos', cat: 'c_crocantes', name: 'Sucrilhos', emoji: '🥣', price: 1.5, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_amendoim', cat: 'c_crocantes', name: 'Amendoim', emoji: '🥜', price: 1.5, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_ovomaltine', cat: 'c_crocantes', name: 'Ovomaltine', emoji: '🍫', price: 2.5, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_flactea', cat: 'c_crocantes', name: 'Farinha láctea', emoji: '🥄', price: 2, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_leitecond', cat: 'c_doces', name: 'Leite condensado', emoji: '🍯', price: 1.5, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_leitepo', cat: 'c_doces', name: 'Leite em pó', emoji: '🥛', price: 2, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_chocolate', cat: 'c_doces', name: 'Calda de chocolate', emoji: '🍫', price: 0, alwaysPaid: false, unlimited: true, maxQty: 1, available: true },
    { id: 't_cmorangoc', cat: 'c_doces', name: 'Calda de morango', emoji: '🍓', price: 1.5, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_pacoca', cat: 'c_doces', name: 'Paçoca', emoji: '🥜', price: 1.5, alwaysPaid: false, unlimited: false, maxQty: 1, available: true },
    { id: 't_confete', cat: 'c_doces', name: 'Confetes', emoji: '🍬', price: 1.5, alwaysPaid: false, unlimited: false, maxQty: 1, available: true }
  ],
  specials: [
    { id: 'sp_nutella', name: 'Nutella', emoji: '🍫', price: 6, maxQty: 2, available: true },
    { id: 'sp_pistache', name: 'Creme de pistache', emoji: '🥜', price: 7, maxQty: 1, available: true },
    { id: 'sp_leitecond', name: 'Leite condensado extra', emoji: '🍯', price: 2.5, maxQty: 3, available: true },
    { id: 'sp_morangos', name: 'Morangos extras', emoji: '🍓', price: 4, maxQty: 2, available: true },
    { id: 'sp_creme', name: 'Porção adicional de creme', emoji: '🥛', price: 3.5, maxQty: 3, available: true }
  ],
  /* custom=true → pode ser personalizado na montagem (preset = complementos já marcados) */
  products: [
    { id: 'p1', cat: 'tradicionais', name: 'Açaí Clássico', desc: 'Açaí cremoso com banana, granola e leite condensado.', sizeLabel: '300 ml', price: 15.9, custom: true, sizeId: 's300', baseId: 'b_trad', preset: ['t_banana', 't_granola', 't_leitecond'], popular: true, available: true, img: '' },
    { id: 'p2', cat: 'tradicionais', name: 'Açaí Zero Açúcar', desc: 'Base zero açúcar com banana e granola. Leve e saboroso.', sizeLabel: '400 ml', price: 21.9, custom: true, sizeId: 's400', baseId: 'b_zero', preset: ['t_banana', 't_granola'], popular: false, available: true, img: '' },
    { id: 'p3', cat: 'tradicionais', name: 'Açaí com Banana', desc: 'Batido com banana, granola, leite condensado e Ovomaltine.', sizeLabel: '500 ml', price: 24.9, custom: true, sizeId: 's500', baseId: 'b_banana', preset: ['t_granola', 't_leitecond', 't_ovomaltine'], popular: true, available: true, img: '' },
    { id: 'p4', cat: 'tradicionais', name: 'Açaí com Morango', desc: 'Base de morango com morangos frescos e leite em pó.', sizeLabel: '500 ml', price: 26.9, custom: true, sizeId: 's500', baseId: 'b_morango', preset: ['t_morango', 't_leitepo'], popular: false, available: true, img: '' },
    { id: 'p5', cat: 'especiais', name: 'Ninho com Morango', desc: 'O queridinho: creme de ninho, morangos e leite em pó.', sizeLabel: '500 ml', price: 29.9, custom: true, sizeId: 's500', baseId: 'b_trad', preset: ['t_ninho', 't_morango', 't_leitepo'], popular: true, available: true, img: '' },
    { id: 'p6', cat: 'especiais', name: 'Nutella Premium', desc: 'Creme de avelã, morangos e granola. Pura indulgência.', sizeLabel: '500 ml', price: 34.9, custom: true, sizeId: 's500', baseId: 'b_trad', preset: ['t_avela', 't_morango', 't_granola'], popular: false, available: true, img: '' },
    { id: 'p7', cat: 'especiais', name: 'Açaí Fit', desc: 'Zero açúcar, banana, granola e farinha láctea.', sizeLabel: '400 ml', price: 23.9, custom: true, sizeId: 's400', baseId: 'b_zero', preset: ['t_banana', 't_granola', 't_flactea'], popular: false, available: true, img: '' },
    { id: 'p8', cat: 'especiais', name: 'Paçoca Crocante', desc: 'Creme de paçoca, paçoca em pedaços e amendoim.', sizeLabel: '500 ml', price: 27.9, custom: true, sizeId: 's500', baseId: 'b_trad', preset: ['t_cpacoca', 't_pacoca', 't_amendoim'], popular: true, available: true, img: '' },
    { id: 'p9', cat: 'copos', name: 'Copo Power', desc: 'Prático para levar: açaí, banana e granola.', sizeLabel: '300 ml', price: 16.9, custom: true, sizeId: 's300', baseId: 'b_trad', preset: ['t_banana', 't_granola'], popular: false, available: true, img: '' },
    { id: 'p10', cat: 'copos', name: 'Copo Duplo', desc: 'Camadas de açaí e creme de ninho com morango.', sizeLabel: '500 ml', price: 25.9, custom: true, sizeId: 's500', baseId: 'b_trad', preset: ['t_ninho', 't_morango'], popular: false, available: true, img: '' },
    { id: 'p11', cat: 'tigelas', name: 'Tigela Tropical', desc: 'Manga, banana, granola e leite condensado.', sizeLabel: '700 ml', price: 32.9, custom: true, sizeId: 's700', baseId: 'b_trad', preset: ['t_manga', 't_banana', 't_granola', 't_leitecond'], popular: false, available: true, img: '' },
    { id: 'p12', cat: 'tigelas', name: 'Tigela Família', desc: 'Um litro para compartilhar, com 4 complementos.', sizeLabel: '1 litro', price: 42.9, custom: true, sizeId: 's1000', baseId: 'b_trad', preset: ['t_banana', 't_morango', 't_granola', 't_leitecond'], popular: false, available: true, img: '' },
    { id: 'p13', cat: 'combos', name: 'Combo Casal', desc: '2 açaís de 500 ml com 3 complementos cada.', sizeLabel: '2 × 500 ml', price: 44.9, oldPrice: 51.8, custom: false, popular: true, available: true, img: '' },
    { id: 'p14', cat: 'combos', name: 'Combo Amigos', desc: '3 copos de 300 ml com 2 complementos cada.', sizeLabel: '3 × 300 ml', price: 39.9, oldPrice: 47.7, custom: false, popular: false, available: true, img: '' },
    { id: 'p15', cat: 'bebidas', name: 'Milk-shake de Açaí', desc: 'Açaí batido com sorvete de creme. Cremoso e gelado.', sizeLabel: '400 ml', price: 17.9, custom: false, popular: false, available: true, img: '' },
    { id: 'p16', cat: 'bebidas', name: 'Vitamina de Açaí com Banana', desc: 'Açaí, banana e leite, batidos na hora.', sizeLabel: '500 ml', price: 15.9, custom: false, popular: false, available: true, img: '' },
    { id: 'p17', cat: 'bebidas', name: 'Água de coco', desc: 'Geladinha, para acompanhar seu açaí.', sizeLabel: '300 ml', price: 6.9, custom: false, popular: false, available: true, img: '' }
  ],
  coupons: [
    { code: 'ACAI10', type: 'percent', value: 10, minOrder: 30, active: true },
    { code: 'BEMVINDO', type: 'fixed', value: 5, minOrder: 25, active: true },
    { code: 'FRETEGRATIS', type: 'frete', value: 0, minOrder: 40, active: true }
  ]
};

const STATUSES = ['Recebido', 'Em preparação', 'Pronto para retirada', 'Saiu para entrega', 'Concluído', 'Cancelado'];

const DB = {
  load() {
    try {
      const s = JSON.parse(localStorage.getItem('acai_cfg'));
      if (s && s.products) {
        // garante chaves novas sem perder o que o lojista editou
        for (const k of Object.keys(DEFAULTS)) if (s[k] === undefined) s[k] = structuredClone(DEFAULTS[k]);
        s.store = Object.assign({}, DEFAULTS.store, s.store);
        s.promo = Object.assign({}, DEFAULTS.promo, s.promo);
        return s;
      }
    } catch (e) { /* usa padrão */ }
    return structuredClone(DEFAULTS);
  },
  save(cfg) { localStorage.setItem('acai_cfg', JSON.stringify(cfg)); },
  reset() { localStorage.removeItem('acai_cfg'); },
  orders() { try { return JSON.parse(localStorage.getItem('acai_orders')) || []; } catch (e) { return []; } },
  saveOrders(o) { localStorage.setItem('acai_orders', JSON.stringify(o)); },
  nextOrderNumber() {
    const n = (parseInt(localStorage.getItem('acai_seq'), 10) || 1000) + 1;
    localStorage.setItem('acai_seq', String(n));
    return '#' + n;
  }
};

const money = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round2 = v => Math.round((v + Number.EPSILON) * 100) / 100;

/* Ilustrações em SVG (substituíveis por fotos reais no painel admin → campo "Imagem (URL)") */
let _svgN = 0;
function bowlSVG(type = 'bowl', seed = 1) {
  const id = 'g' + (++_svgN);
  let s = (seed % 9973) + 1;
  const rnd = n => { s = (s * 9301 + 49297) % 233280; return s / 233280 * n; };
  const cols = ['#f6d55c', '#e5484d', '#c9a46a', '#8cc152', '#fff3dc', '#6b3a1e', '#f08cb0'];
  const defs = `<defs><radialGradient id="${id}" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#8a45c0"/><stop offset=".6" stop-color="#4a1a6b"/><stop offset="1" stop-color="#2d0d47"/></radialGradient></defs>`;
  const dots = (cx, cy, rx, ry, n) => {
    let o = '';
    for (let i = 0; i < n; i++) {
      const a = rnd(6.283), r = Math.sqrt(rnd(1));
      o += `<circle cx="${(cx + Math.cos(a) * r * rx).toFixed(1)}" cy="${(cy + Math.sin(a) * r * ry).toFixed(1)}" r="${(3.5 + rnd(3.5)).toFixed(1)}" fill="${cols[i % cols.length]}" stroke="rgba(0,0,0,.08)"/>`;
    }
    return o;
  };
  const cup = () => `<path d="M52 70h96l-12 98a8 8 0 0 1-8 7H72a8 8 0 0 1-8-7z" fill="#fff" stroke="#e6d9f3" stroke-width="3"/><path d="M58 98h84l-4 36H62z" fill="#d9c7f0" opacity=".55"/><ellipse cx="100" cy="72" rx="52" ry="14" fill="url(#${id})"/><path d="M50 72c4-34 96-34 100 0z" fill="url(#${id})"/>${dots(100, 56, 34, 10, 9)}<rect x="46" y="66" width="108" height="8" rx="4" fill="#f4ead7"/>`;
  if (type === 'cup') return `<svg viewBox="0 0 200 180" role="img" aria-hidden="true" focusable="false">${defs}${cup()}</svg>`;
  if (type === 'combo') return `<svg viewBox="0 0 200 180" role="img" aria-hidden="true" focusable="false">${defs}<g transform="translate(-34 18) scale(.82)">${cup()}</g><g transform="translate(52 4) scale(.82)">${cup()}</g></svg>`;
  if (type === 'shake') return `<svg viewBox="0 0 200 180" role="img" aria-hidden="true" focusable="false">${defs}<path d="M116 8l-14 70" stroke="#5aa44a" stroke-width="7" stroke-linecap="round"/><path d="M56 40h88l-10 126a8 8 0 0 1-8 7H74a8 8 0 0 1-8-7z" fill="#fff" fill-opacity=".85" stroke="#e6d9f3" stroke-width="3"/><path d="M62 62h76l-8 100H70z" fill="url(#${id})"/><path d="M62 62h76v14H62z" fill="#d9c7f0"/><ellipse cx="100" cy="42" rx="46" ry="10" fill="#f4ead7"/><circle cx="84" cy="36" r="8" fill="#e5484d"/></svg>`;
  return `<svg viewBox="0 0 200 160" role="img" aria-hidden="true" focusable="false">${defs}<path d="M22 80h156c0 46-32 70-78 70S22 126 22 80z" fill="#fff" stroke="#e6d9f3" stroke-width="3"/><path d="M40 118c20 14 100 14 120 0" fill="none" stroke="#5aa44a" stroke-width="5" stroke-linecap="round" opacity=".6"/><ellipse cx="100" cy="80" rx="80" ry="18" fill="url(#${id})"/><path d="M28 80C36 28 164 28 172 80z" fill="url(#${id})"/>${dots(100, 62, 56, 14, 14)}<ellipse cx="100" cy="80" rx="82" ry="6" fill="none" stroke="#f4ead7" stroke-width="5"/></svg>`;
}
