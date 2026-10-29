// Fictional in-game shop. Catalog lives in kpop-work.json; player orders stay local.
import { PAYMENT_METHODS, notifyShoppingPurchase } from './kpop-shopping-chat.js';
export function createShoppingSkin(React, jsx) {
  const h = jsx.jsx, hs = jsx.jsxs;
  const categories = ['线下活动', '护肤品', '衣服', '专辑'];
  const paths = {
    bag: ['M5 7h14l1 14H4L5 7Z', 'M9 8V5a3 3 0 0 1 6 0v3'],
    home: ['m3 11 9-8 9 8', 'M5 10v11h14V10M10 21v-7h4v7'],
    arrow: ['m14 5-7 7 7 7'],
    search: ['M21 21l-5-5', 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z'],
    ticket: ['M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Z', 'M14 5v3m0 3v2m0 3v3'],
    orders: ['M6 3h12v19l-3-2-3 2-3-2-3 2V3Z', 'M9 8h6m-6 4h6'],
    close: ['m6 6 12 12M6 18 18 6']
  };
  function Icon({ name, size = 22 }) {
    return hs('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.65, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, children: (paths[name] || paths.bag).map((d, i) => h('path', { d }, i)) });
  }
  function Artwork({ item, large = false }) {
    const m = item.meta;
    if (item.folder === '线下活动') return hs('div', { className: `ms-poster ms-poster-${m.art}${large ? ' ms-art-large' : ''}`, role: 'img', 'aria-label': `${item.title}设计封面`, children: [
      h('small', { children: m.eyebrow }), h('strong', { children: m.posterTitle }), h('span', { className: 'ms-poster-orbit', 'aria-hidden': true }), h('span', { className: 'ms-poster-footer', children: m.posterFooter })
    ] });
    return hs('div', { className: `ms-product-art ms-art-${m.art}${large ? ' ms-art-large' : ''}`, role: 'img', 'aria-label': `${item.title}示意图`, children: [
      h('span', { className: 'ms-product-object', children: h('i', { children: m.artLabel || m.brand }) }),
      h('span', { className: 'ms-art-caption', children: m.brand })
    ] });
  }
  function load(key, products) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      const validLine = l => l && typeof l.id === 'string' && products.some(p => p.id === l.id) && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 99;
      return { cart: Array.isArray(value.cart) ? value.cart.filter(validLine).slice(0, 100) : [], orders: Array.isArray(value.orders) ? value.orders.filter(o => o && typeof o.id === 'string' && Array.isArray(o.lines) && o.lines.every(validLine)).slice(0, 100) : [] };
    } catch { return { cart: [], orders: [] }; }
  }
  return function ShoppingSkin(p) {
    const products = p.items.filter(i => i.meta?.shopping === 'true');
    const storageKey = `kpop.shopping.v1:${p.owner || 'player'}`;
    const [saved, setSaved] = React.useState(() => load(storageKey, products));
    const [route, setRoute] = React.useState('catalog');
    const [category, setCategory] = React.useState('线下活动');
    const [query, setQuery] = React.useState('');
    const [selected, setSelected] = React.useState('');
    const [quantity, setQuantity] = React.useState(1);
    const [size, setSize] = React.useState('OS');
    const [notice, setNotice] = React.useState('');
    const [storageError, setStorageError] = React.useState(false);
    const [payment, setPayment] = React.useState('player-bank');
    const confirming = React.useRef(false);
    React.useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(saved)); setStorageError(false); } catch { setStorageError(true); } }, [saved, storageKey]);
    const item = products.find(i => i.id === selected);
    const count = saved.cart.reduce((n, l) => n + l.qty, 0);
    const visible = products.filter(i => i.folder === category && `${i.title} ${i.body} ${i.meta.brand || ''}`.toLowerCase().includes(query.toLowerCase()));
    const money = i => i?.meta?.price ? `${i.meta.currency || '₩'}${i.meta.price}` : '价格待设置';
    const goto = page => { setRoute(page); setNotice(''); };
    const open = i => { setSelected(i.id); setQuantity(1); setSize(i.meta.size || 'OS'); setRoute('detail'); setNotice(''); p.onRead?.(i.id); };
    const add = () => {
      if (!item) return;
      confirming.current = false;
      const variant = item.folder === '衣服' ? size : '';
      setSaved(old => {
        const found = old.cart.find(l => l.id === item.id && (l.size || '') === variant);
        return { ...old, cart: found ? old.cart.map(l => l === found ? { ...l, qty: Math.min(99, l.qty + quantity) } : l) : [...old.cart, { id: item.id, qty: quantity, size: variant }] };
      });
      setNotice(item.folder === '线下活动' ? '已加入购票清单' : '已加入购物车');
    };
    const changeQty = (index, delta) => setSaved(old => ({ ...old, cart: old.cart.map((l, n) => n === index ? { ...l, qty: Math.max(1, Math.min(99, l.qty + delta)) } : l) }));
    const remove = index => setSaved(old => ({ ...old, cart: old.cart.filter((_, n) => n !== index) }));
    const confirm = () => {
      if (!saved.cart.length || confirming.current || !PAYMENT_METHODS.some(m => m.id === payment)) return;
      confirming.current = true;
      const order = { id: `MS-${Date.now()}-${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 6)}`, created: new Date().toISOString(), status: '已完成', payment, paymentLabel: PAYMENT_METHODS.find(m => m.id === payment).label, lines: saved.cart.map(l => ({ ...l })) };
      const purchased = order.lines.map(line => products.find(i => i.id === line.id)).filter(Boolean).map(i => ({ title: i.title, category: i.folder }));
      setSaved(old => ({ cart: [], orders: [order, ...old.orders].slice(0, 100) }));
      setSelected(order.id); setRoute('order'); setPayment('player-bank'); setNotice('付款方式已记录，订单已完成');
      notifyShoppingPurchase(order, purchased);
    };
    const selectedOrder = saved.orders.find(o => o.id === selected);
    const back = () => { if (route === 'catalog') p.onBack(); else if (route === 'order') goto('orders'); else goto('catalog'); };
    const stepper = (value, less, more, label) => hs('div', { className: 'ms-stepper', children: [
      h('button', { type: 'button', disabled: value <= 1, onClick: less, 'aria-label': `减少${label}数量`, children: '−' }), h('span', { children: value }), h('button', { type: 'button', disabled: value >= 99, onClick: more, 'aria-label': `增加${label}数量`, children: '+' })
    ] });
    function lineView(line, index, editable) {
      const product = products.find(i => i.id === line.id); if (!product) return null;
      return hs('article', { className: 'ms-order-line', children: [
        h('button', { type: 'button', className: 'ms-line-art', onClick: () => open(product), 'aria-label': `查看${product.title}`, children: h(Artwork, { item: product }) }),
        hs('div', { className: 'ms-line-copy', children: [h('b', { children: product.meta.brand }), h('strong', { children: product.title }), h('small', { children: `${line.size ? line.size + ' · ' : ''}数量：${line.qty}${product.folder === '线下活动' ? '张' : '件'}` }), h('b', { className: 'ms-price', children: money(product) }), editable ? hs('div', { className: 'ms-line-actions', children: [stepper(line.qty, () => changeQty(index, -1), () => changeQty(index, 1), product.title), h('button', { type: 'button', className: 'ms-remove', onClick: () => remove(index), 'aria-label': `移除${product.title}`, children: '移除' })] }) : null] })
      ] }, `${line.id}:${line.size || ''}:${index}`);
    }
    const titles = { bag: '购物车', orders: '我的订单', order: 'ORDER DETAILS', detail: item?.folder === '线下活动' ? '演出详情' : '商品详情' };
    return hs('div', { className: 'catalog-skin ms-shop', children: [
      hs('header', { className: 'ms-header', children: [
        h('button', { type: 'button', className: 'ms-back', onClick: back, 'aria-label': route === 'catalog' ? '返回手机' : '返回购物首页', children: h(Icon, { name: 'arrow', size: 24 }) }),
        route === 'catalog' ? hs('button', { type: 'button', className: 'ms-logo', onClick: () => { setCategory('线下活动'); setQuery(''); }, 'aria-label': 'Melon风格购物首页', children: [h('strong', { children: 'Melon' }), h('span', { children: 'Ticket & Shop' })] }) : h('strong', { className: 'ms-page-title', children: titles[route] }),
        h('button', { type: 'button', className: 'ms-bag-icon', onClick: () => goto(route === 'bag' ? 'catalog' : 'bag'), 'aria-label': `购物车，${count}件`, children: [h(Icon, { name: 'bag', size: 24 }), count ? h('span', { className: 'ms-badge', children: count > 99 ? '99+' : count }) : null] })
      ] }),
      route === 'catalog' ? hs(jsx.Fragment, { children: [
        hs('div', { className: 'ms-search', children: [h(Icon, { name: 'search', size: 17 }), h('input', { value: query, onChange: e => setQuery(e.target.value), placeholder: '搜索商品、专辑或活动', 'aria-label': '搜索商品、专辑或活动' }), query ? h('button', { type: 'button', onClick: () => setQuery(''), 'aria-label': '清除搜索', children: h(Icon, { name: 'close', size: 16 }) }) : null] }),
        h('nav', { className: 'ms-categories', 'aria-label': '商品分类', children: categories.map(c => h('button', { type: 'button', onClick: () => { setCategory(c); setQuery(''); }, 'aria-pressed': c === category, className: c === category ? 'selected' : '', children: c }, c)) })
      ] }) : null,
      h('main', { className: 'ms-scroll', children: route === 'catalog' ? hs(jsx.Fragment, { children: [
        hs('section', { className: 'ms-section-heading', children: [h('span', { children: category === '线下活动' ? 'FIND YOUR NEXT MOMENT' : 'LITTLE THINGS, BIG JOY' }), h('h1', { children: category === '线下活动' ? 'AVAILABLE NOW' : category }), h('p', { children: category === '线下活动' ? '与你喜欢的人，一起奔赴现场。' : '把喜欢的日常，装进购物车。' })] }),
        visible.length ? h('div', { className: category === '线下活动' ? 'ms-events' : 'ms-products', children: visible.map(i => category === '线下活动' ? hs('article', { className: 'ms-event', children: [
          h('button', { type: 'button', className: 'ms-poster-button', onClick: () => open(i), 'aria-label': `查看${i.title}`, children: h(Artwork, { item: i }) }),
          hs('div', { className: 'ms-event-copy', children: [h('small', { children: i.meta.brand }), h('h2', { children: i.title }), h('p', { children: i.meta.subtitle }), h('span', { children: '日期 / 场地待设置' }), h('button', { type: 'button', className: 'ms-green ms-get-ticket', onClick: () => open(i), 'aria-label': `Get Tickets ${i.title}`, children: 'Get Tickets →' })] })
        ] }, i.id) : hs('button', { type: 'button', className: 'ms-product', onClick: () => open(i), children: [h(Artwork, { item: i }), h('small', { children: i.meta.brand }), h('h2', { children: i.title }), h('span', { className: 'ms-product-spec', children: i.meta.spec }), h('b', { className: 'ms-price', children: money(i) })] }, i.id)) }) : hs('div', { className: 'ms-empty', children: [h(Icon, { name: 'search', size: 35 }), h('h2', { children: '没有找到相关内容' }), h('p', { children: '试试其他关键词，或切换上方分类。' })] }),
        h('p', { className: 'ms-disclaimer', children: '剧情内购物与预约，不发生真实扣款。' })
      ] }) : route === 'detail' && item ? hs(jsx.Fragment, { children: [
        h('div', { className: 'ms-detail-art', children: h(Artwork, { item, large: true }) }),
        hs('section', { className: 'ms-detail-copy', children: [h('span', { className: 'ms-kicker', children: item.meta.brand }), h('h1', { children: item.title }), h('p', { children: item.body }), h('strong', { className: 'ms-detail-price', children: money(item) }), item.folder === '线下活动' ? hs('dl', { className: 'ms-event-info', children: [h('dt', { children: '活动日期' }), h('dd', { children: item.meta.date || '待设置' }), h('dt', { children: '演出场地' }), h('dd', { children: item.meta.venue || '待设置' }), h('dt', { children: '票种 / 座位' }), h('dd', { children: '待设置' })] }) : h('p', { className: 'ms-spec-line', children: item.meta.spec }), item.folder === '衣服' ? hs('label', { className: 'ms-size', children: ['尺码', h('select', { value: size, onChange: e => setSize(e.target.value), 'aria-label': '选择尺码', children: ['OS', 'S', 'M', 'L'].map(v => h('option', { value: v, children: v }, v)) })] }) : null, hs('div', { className: 'ms-quantity-row', children: [h('span', { children: item.folder === '线下活动' ? '票数' : '数量' }), stepper(quantity, () => setQuantity(q => Math.max(1, q - 1)), () => setQuantity(q => Math.min(99, q + 1)), item.title)] })] })
      ] }) : route === 'bag' ? hs(jsx.Fragment, { children: [
        hs('div', { className: 'ms-section-heading', children: [h('span', { children: 'YOUR SHOPPING BAG' }), h('h1', { children: `喜欢的，都在这里。` }), h('p', { children: `${count} 件商品与活动预约` })] }),
        saved.cart.length ? hs(jsx.Fragment, { children: [h('div', { className: 'ms-order-lines', children: saved.cart.map((l, n) => lineView(l, n, true)) }),
          hs('fieldset', { className: 'ms-payment-methods', children: [h('legend', { children: '付款方式' }), ...PAYMENT_METHODS.map(method => hs('label', { className: payment === method.id ? 'ms-payment selected' : 'ms-payment', children: [h('span', { className: `ms-payment-symbol ms-payment-${method.id}`, children: method.symbol }), hs('span', { className: 'ms-payment-copy', children: [h('strong', { children: method.label }), h('small', { children: method.note })] }), h('input', { type: 'radio', name: 'shopping-payment', value: method.id, checked: payment === method.id, onChange: () => setPayment(method.id), 'aria-label': method.label })] }, method.id))] }),
          h('p', { className: 'ms-payment-note', children: '金额待设置；剧情付款仅记录付款方式，不产生真实扣款。' })
        ] }) : hs('section', { className: 'ms-empty', children: [h(Icon, { name: 'bag', size: 42 }), h('h2', { children: '购物车还是空的' }), h('p', { children: '去找一件喜欢的商品，或下一场期待的演出。' }), h('button', { type: 'button', className: 'ms-green', onClick: () => goto('catalog'), children: '去逛逛' })] })
      ] }) : route === 'orders' ? hs(jsx.Fragment, { children: [
        hs('div', { className: 'ms-section-heading', children: [h('span', { children: 'MY ORDERS' }), h('h1', { children: '我的订单' }), h('p', { children: '商品与现场，收藏每一次期待。' })] }),
        saved.orders.length ? saved.orders.map(o => hs('button', { type: 'button', className: 'ms-order-card', onClick: () => { setSelected(o.id); goto('order'); }, children: [hs('div', { children: [h('span', { children: o.id }), h('b', { children: o.status })] }), h('strong', { children: products.find(i => i.id === o.lines[0]?.id)?.title || '购物订单' }), h('p', { children: `共 ${o.lines.reduce((n, l) => n + l.qty, 0)} 件 · 查看详情 →` })] }, o.id)) : hs('section', { className: 'ms-empty', children: [h(Icon, { name: 'orders', size: 42 }), h('h2', { children: '暂无订单' }), h('p', { children: '确认购物车后，订单会保存在这里。' })] })
      ] }) : route === 'order' && selectedOrder ? hs(jsx.Fragment, { children: [
        hs('section', { className: 'ms-order-summary', children: [h('span', { className: 'ms-kicker', children: selectedOrder.status }), h('h1', { children: selectedOrder.payment ? '付款完成' : '订单已创建' }), h('p', { children: selectedOrder.id }), selectedOrder.paymentLabel ? h('p', { className: 'ms-order-payment', children: `付款方式：${selectedOrder.paymentLabel}` }) : null, h('small', { children: '商品价格及活动资料待设置；未发生真实扣款。' })] }),
        h('div', { className: 'ms-order-lines', children: selectedOrder.lines.map((l, n) => lineView(l, n, false)) }),
        hs('div', { className: 'ms-total', children: [h('strong', { children: 'Order Total' }), h('span', { children: '待设置' })] })
      ] }) : null }),
      notice ? h('div', { className: 'ms-notice', role: 'status', children: notice }) : null,
      storageError ? h('p', { className: 'ms-storage-warning', role: 'status', children: '浏览器暂时无法保存，离开页面后本次记录可能丢失。' }) : null,
      route === 'detail' && item ? hs('footer', { className: 'ms-action-bar', children: [h('button', { type: 'button', className: 'ms-outline', onClick: () => goto('bag'), children: `购物车${count ? ` (${count})` : ''}` }), h('button', { type: 'button', className: 'ms-green', onClick: add, children: item.folder === '线下活动' ? '加入购票清单' : '加入购物车' })] }) : route === 'bag' && saved.cart.length ? hs('footer', { className: 'ms-checkout', children: [h('small', { children: `付款方式：${PAYMENT_METHODS.find(m => m.id === payment)?.label || ''}` }), h('button', { type: 'button', className: 'ms-green', onClick: confirm, children: `确认付款 · ${count} 件` })] }) : hs('nav', { className: 'ms-bottom-nav', 'aria-label': '购物导航', children: [
        h('button', { type: 'button', className: route === 'catalog' ? 'selected' : '', onClick: () => goto('catalog'), children: [h(Icon, { name: 'home' }), h('span', { children: '首页' })] }),
        h('button', { type: 'button', className: route === 'bag' ? 'selected' : '', onClick: () => goto('bag'), children: [h(Icon, { name: 'bag' }), h('span', { children: '购物车' })] }),
        h('button', { type: 'button', className: ['orders', 'order'].includes(route) ? 'selected' : '', onClick: () => goto('orders'), children: [h(Icon, { name: 'orders' }), h('span', { children: '订单' })] })
      ] })
    ] });
  };
}
