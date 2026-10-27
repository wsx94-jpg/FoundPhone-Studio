// Wallet presentation for the fictional K-pop phone. Story data remains in kpop-work.json.
export function createWalletSkin(React, jsx) {
  const h = jsx.jsx, hs = jsx.jsxs;
  function Icon({ kind }) {
    const paths = {
      rail: ['M7 3h10a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Z', 'M5 11h14M9 3v3h6V3M8 19l-2 3m10-3 2 3M8 15h.01M16 15h.01'],
      bus: ['M6 4h12a2 2 0 0 1 2 2v12H4V6a2 2 0 0 1 2-2ZM4 12h16M8 4v3h8V4M7 16h.01M17 16h.01M6 18v3m12-3v3'],
      taxi: ['m5 10 2-5h10l2 5M4 10h16a1 1 0 0 1 1 1v7H3v-7a1 1 0 0 1 1-1ZM6 18v3m12-3v3M7 14h.01M17 14h.01M10 5V2h4v3'],
      gift: ['M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z']
    };
    return hs('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, children: (paths[kind] || paths.rail).map((d, i) => h('path', { d }, i)) });
  }
  function Card({ card, mini = false, onClick }) {
    const type = card.id.split('.').pop();
    return hs('button', { type: 'button', className: `kw-card kw-card-${type}${mini ? ' kw-mini' : ''}`, onClick, 'aria-label': `${card.title}，查看卡片和交易`, children: [
      hs('span', { className: 'kw-card-top', children: [h('strong', { children: card.title }), h('span', { className: 'kw-chip', 'aria-hidden': true })] }),
      h('span', { className: 'kw-card-mark', children: type === 'tmoney' ? 'T money' : type === 'stronger' ? 'STRONGER' : card.meta.bank }),
      h('small', { children: type === 'stronger' ? '转赠卡 · 李帝努转赠' : type === 'tmoney' ? '交通卡' : `持卡人：${card.sender}` })
    ] });
  }
  return function KpopWallet(p) {
    const cards = p.items.filter(i => i.folder !== '交易');
    const transactions = p.items.filter(i => i.folder === '交易');
    const [selected, setSelected] = React.useState('');
    const [record, setRecord] = React.useState(null);
    const [showInfo, setShowInfo] = React.useState(false);
    const card = cards.find(i => i.id === selected);
    const visible = card ? transactions.filter(i => i.meta.cardId === card.id) : transactions;
    const back = () => { if (record) setRecord(null); else if (showInfo) setShowInfo(false); else if (selected) setSelected(''); else p.onBack(); };
    const detail = record || (showInfo ? card : null);
    return hs('div', { className: 'catalog-skin kw-wallet', children: [
      hs('header', { className: 'kw-nav', children: [
        h('button', { type: 'button', className: 'kw-done', onClick: back, children: detail ? '返回' : card ? '完成' : '返回' }),
        card ? h(Card, { card, mini: true, onClick: () => { setSelected(''); setRecord(null); setShowInfo(false); } }) : h('strong', { children: '钱包' }),
        h('button', { type: 'button', className: 'kw-more', 'aria-label': card ? '卡片信息' : '返回手机', onClick: () => card ? (setRecord(null), setShowInfo(!showInfo)) : p.onBack(), children: card ? '•••' : '⌂' })
      ] }),
      h('div', { className: 'kw-scroll', children: detail ? hs('section', { className: 'kw-detail', children: [
        record ? h('div', { className: `kw-icon kw-icon-${record.meta.category}`, children: h(Icon, { kind: record.meta.category }) }) : h(Card, { card, onClick: () => setShowInfo(false) }),
        h('h1', { children: detail.title }),
        record ? h('p', { className: 'kw-detail-amount', children: record.meta.amount || '金额未设置' }) : null,
        h('p', { className: 'kw-detail-body', children: detail.body }),
        record && record.time ? h('p', { children: record.time }) : null
      ] }) : hs(jsx.Fragment, { children: [
        !card ? hs('section', { className: 'kw-overview', children: [h('h1', { children: '钱包' }), h('div', { className: 'kw-card-stack', children: cards.map(c => h(Card, { card: c, onClick: () => setSelected(c.id) }, c.id)) })] }) : null,
        h('h1', { className: 'kw-heading', children: '最新交易' }),
        visible.length ? h('section', { className: 'kw-transactions', 'aria-label': '最新交易', children: visible.map(i => hs('button', { type: 'button', className: 'kw-transaction', onClick: () => { setRecord(i); p.onRead?.(i.id); }, children: [
          h('span', { className: `kw-icon kw-icon-${i.meta.category}`, children: h(Icon, { kind: i.meta.category }) }),
          hs('span', { className: 'kw-transaction-copy', children: [h('strong', { children: i.title }), h('small', { children: i.time || i.sender })] }),
          h('span', { className: 'kw-amount', 'aria-label': i.meta.amount ? '金额' : '金额未设置', children: i.meta.amount || '—' }),
          h('span', { className: 'kw-chevron', 'aria-hidden': true, children: '›' })
        ] }, i.id)) }) : h('p', { className: 'kw-empty', children: '暂无交易记录' }),
        card ? h('button', { type: 'button', className: 'kw-all', onClick: () => setSelected(''), children: '查看全部卡片与交易' }) : null
      ] }) })
    ] });
  };
}
