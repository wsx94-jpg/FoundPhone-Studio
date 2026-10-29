// Local fictional purchase-to-chat integration. No real messages or payments are sent.
let pendingChatTarget = '';
export const PAYMENT_METHODS = [
  { id: 'gift-card', label: '礼品卡', note: '李帝努转赠', symbol: '礼' },
  { id: 'shopping-credit', label: '购物金', note: '账户购物金', symbol: '金' },
  { id: 'jeno-bank', label: '李帝努银行卡', note: '韩国银行', symbol: '李' },
  { id: 'player-bank', label: '玩家银行卡', note: '首尔银行', symbol: '我' }
];
const topicOrder = ['护肤品', '衣服', '专辑', '线下活动'];
function topicLines(category, items) {
  const names = items.map(i => i.title).join('、');
  if (category === '护肤品') return [
    ['contact', '什么护肤品？'], ['player', `买了${names}。`],
    ['contact', '好用吗？'], ['player', '还没收到，等我试过再告诉你。'],
    ['contact', '下次也给我用一下嘛。'], ['player', '你连我的护肤品都惦记上了？'],
    ['contact', '想知道你每天用的是什么。'], ['player', '先看适不适合你的肤质。'],
    ['contact', '这个也有讲究啊。'], ['player', '当然啦，不能看见我的就直接往脸上涂。'],
    ['contact', '那你教我，我认真听。'], ['player', '先把洗脸和保湿做好。'],
    ['contact', '我记住了，还有呢？'], ['player', '白天出门记得防晒，其他的慢慢来。'],
    ['contact', '突然像在上小课堂。'], ['player', '是你自己要求我教的。'],
    ['contact', '嗯，老师讲得很好。'], ['player', '少贫嘴，收到以后我先试。'],
    ['contact', '好，使用感想第一时间发给我。'], ['player', '知道啦，合适的话下次一起用。']
  ];
  if (category === '衣服') return [
    ['contact', '挑了什么衣服？'], ['player', `这次选了${names}。`],
    ['contact', '什么颜色的？'], ['player', '选的是商品页里那款，收到再看看实物。'],
    ['contact', '感觉会很适合你。'], ['player', '你都还没看见我穿。'],
    ['contact', '所以，试穿的时候给我看一下？'], ['player', '先等快递送到吧。'],
    ['contact', '尺码确认好了吗？'], ['player', '确认过了，也选好了尺码。'],
    ['contact', '那就好，穿着舒服最重要。'], ['player', '你怎么突然这么认真。'],
    ['contact', '怕你只顾着好看，不顾舒服。'], ['player', '这次两个都要。'],
    ['contact', '准备搭什么鞋？'], ['player', '还没想好，等收到再搭。'],
    ['contact', '那我可以参加搭配讨论吗？'], ['player', '可以，但不许每一套都只说好看。'],
    ['contact', '知道了，我会认真给意见。'], ['player', '成交，收到以后再找你。']
  ];
  if (category === '专辑') return [
    ['contact', '买了哪张专辑？'], ['player', `购物车里选的是${names}。`],
    ['contact', '是想收藏，还是准备拆开听？'], ['player', '先拆开看看，再好好收藏。'],
    ['contact', '最期待看到什么？'], ['player', '封面、写真，还有实际收到的配置。'],
    ['contact', '开箱的时候可以给我看吗？'], ['player', '可以呀，你也想围观？'],
    ['contact', '想看你拆到喜欢的东西时的反应。'], ['player', '那你到时候不许笑我。'],
    ['contact', '保证不笑，会认真一起看。'], ['player', '这句话我可记住了。'],
    ['contact', '收到以后准备放在哪里？'], ['player', '书架上，已经给它留位置了。'],
    ['contact', '看来是认真期待很久了。'], ['player', '喜欢的东西当然要认真对待。'],
    ['contact', '那我们也一起听听歌吧。'], ['player', '好，我来挑第一首。'],
    ['contact', '剩下的慢慢听，不着急。'], ['player', '嗯，开箱那天叫你。']
  ];
  const running = items.some(i => /running/i.test(i.title));
  return [
    ['contact', '刚才订了什么线下活动？'], ['player', `选了${names}。`],
    ['contact', running ? '还打算去跑步活动呀？' : '想去现场很久了吗？'], ['player', running ? '对，想去动一动，也感受一下现场。' : '嗯，想亲自去感受一次现场。'],
    ['contact', '具体日期和地点都记好了吗？'], ['player', '会把确认后的信息放进日历里。'],
    ['contact', '到时候提前看看怎么过去。'], ['player', '你已经开始帮我规划路线了？'],
    ['contact', '怕你当天只顾着兴奋。'], ['player', '那交通和时间我也一起记下来。'],
    ['contact', running ? '跑步的话，鞋子要选舒服的。' : '如果要排队，鞋子也要选舒服的。'], ['player', '知道，不会只顾着拍照好看。'],
    ['contact', '手机充好电，出门前再检查一次。'], ['player', '充电宝也会带上的。'],
    ['contact', '可以跟朋友一起去吗？'], ['player', '我会先确认大家的时间。'],
    ['contact', '到了现场，给我报个平安。'], ['player', '好呀，也给你发一点现场感想。'],
    ['contact', '玩得开心，回来慢慢讲给我听。'], ['player', '一定，你准备好听我的长篇报告吧。']
  ];
}
export function purchaseMessages(order, items, at = Date.now()) {
  if (order?.payment !== 'jeno-bank' || !Array.isArray(items) || !items.length) return [];
  const valid = items.filter(i => i && typeof i.title === 'string' && topicOrder.includes(i.category));
  if (!valid.length) return [];
  const groups = topicOrder.filter(c => valid.some(i => i.category === c));
  const lines = [['contact', '买了什么？'], ['player', `刚刚买了${groups.join('、')}。`]];
  for (const category of groups) lines.push(...topicLines(category, valid.filter(i => i.category === category)));
  lines.push(['contact', '以后买到喜欢的东西，也跟我说说。'], ['player', '好，会跟你分享的。']);
  return lines.map(([speaker, text], n) => ({ id: `shopping.${order.id}.${n}`, sender: speaker === 'player' ? 'player' : 'jeno_alt', ko: text, zh: '', at: at + n, mine: speaker === 'player', type: 'text', media: '' }));
}
export function applyPurchaseChat(state, order, items) {
  if (!state?.kakao || order?.payment !== 'jeno-bank' || !order.id) return state;
  const old = state.kakao.messages.jeno_alt || [];
  if (old.some(m => m.id === `shopping.${order.id}.0`)) return state;
  const messages = purchaseMessages(order, items, Math.max(Date.now(), state.highWater || 0));
  if (!messages.length) return state;
  return { ...state, kakao: { ...state.kakao, messages: { ...state.kakao.messages, jeno_alt: [...old, ...messages] } } };
}
export function notifyShoppingPurchase(order, items) {
  if (order.payment === 'jeno-bank') window.dispatchEvent(new CustomEvent('kpop:shop-paid', { detail: { order, items } }));
}
export function consumeShoppingChatTarget() { const target = pendingChatTarget; pendingChatTarget = ''; return target; }
export function requestShoppingChat() {
  pendingChatTarget = 'jeno_alt';
  window.dispatchEvent(new CustomEvent('kpop:open-chat', { detail: { contactId: 'jeno_alt' } }));
}
export function usePhoneChatNavigation(React, openApp) {
  React.useEffect(() => {
    const listener = e => { if (e.detail?.contactId === 'jeno_alt') openApp('kakao'); };
    window.addEventListener('kpop:open-chat', listener);
    return () => window.removeEventListener('kpop:open-chat', listener);
  }, [openApp]);
}
export function useShoppingChatNavigation(React, setThread, setTab) {
  React.useEffect(() => {
    const listener = e => { if (e.detail?.contactId === 'jeno_alt') { consumeShoppingChatTarget(); setTab('채팅'); setThread('jeno_alt'); } };
    window.addEventListener('kpop:open-chat', listener);
    return () => window.removeEventListener('kpop:open-chat', listener);
  }, [setThread, setTab]);
}
export function createPurchaseBridge(React, jsx, useLife) {
  return function PurchaseBridge() {
    const { update } = useLife();
    const [popup, setPopup] = React.useState(null);
    const seen = React.useRef(new Set());
    React.useEffect(() => {
      const listener = event => {
        const { order, items } = event.detail || {};
        if (!order || order.payment !== 'jeno-bank' || typeof order.id !== 'string' || !Array.isArray(items) || seen.current.has(order.id)) return;
        if (!purchaseMessages(order, items).length) return;
        seen.current.add(order.id);
        update(state => applyPurchaseChat(state, order, items));
        setPopup(order.id);
      };
      window.addEventListener('kpop:shop-paid', listener);
      return () => window.removeEventListener('kpop:shop-paid', listener);
    }, [update]);
    if (!popup) return null;
    return jsx.jsxs('aside', { className: 'ms-kakao-popup', role: 'status', 'aria-label': 'KakaoTalk 新消息', children: [
      jsx.jsxs('button', { type: 'button', className: 'ms-kakao-open', onClick: () => { setPopup(null); requestShoppingChat(); }, 'aria-label': '打开太T了这家伙的聊天：买了什么？', children: [
        jsx.jsx('span', { className: 'ms-kakao-icon', children: 'TALK' }),
        jsx.jsxs('span', { children: [jsx.jsx('small', { children: 'KakaoTalk · 现在' }), jsx.jsx('strong', { children: '太T了这家伙' }), jsx.jsx('span', { children: '买了什么？' })] })
      ] }),
      jsx.jsx('button', { type: 'button', className: 'ms-kakao-close', onClick: () => setPopup(null), 'aria-label': '关闭聊天弹窗', children: '×' })
    ] });
  };
}
