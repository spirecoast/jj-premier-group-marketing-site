// jj-motion-reel.jsx — ten working JJ Premier Group motion pieces, one continuous composition.
const { useComposition, animate, Easing, CompositionStage, Shot } = window;
const M = {
  enter: (s, e) => animate({ from: 0, to: 1, start: s, end: e, ease: Easing.easeOutCubic }),
  draw:  (s, e) => animate({ from: 0, to: 1, start: s, end: e, ease: Easing.easeInOutQuart }),
  fade:  (s, e) => animate({ from: 1, to: 0, start: s, end: e, ease: Easing.easeInOutSine }),
};
const CON = "Contralto, 'Cormorant Garamond', Georgia, serif";
const SER = "'IvyPresto Headline Thin', Newsreader, Georgia, serif";
const MONO = "'IBM Plex Mono', monospace";
const JOST = "Jost, Helvetica, sans-serif";
const NAVY = '#2E4A5C', LINEN = '#E6DDD1', SKY = '#89D4E3', TEAL = '#2C6E7E', RULE = '#5C86A0', BRASS = '#96702A';

function Waterline({ ink, rule, size, prog, y, op }) {
  const seg = size * 0.9, jj = size;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: jj * 0.11, opacity: op, transform: `translateY(${y || 0}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: jj * 0.12 }}>
        <div style={{ width: seg * prog, height: Math.max(2, jj * 0.008), background: rule, position: 'relative', top: jj * 0.1 }} />
        <div style={{ fontFamily: CON, fontWeight: 600, fontSize: jj, lineHeight: 1, letterSpacing: '0.12em', textIndent: '0.12em', color: ink }}>JJ</div>
        <div style={{ width: seg * prog, height: Math.max(2, jj * 0.008), background: rule, position: 'relative', top: jj * 0.1 }} />
      </div>
      <div style={{ fontFamily: CON, fontWeight: 600, fontSize: jj * 0.2, lineHeight: 1, letterSpacing: '0.44em', textIndent: '0.44em', color: ink, whiteSpace: 'nowrap' }}>PREMIER GROUP</div>
    </div>
  );
}
const Full = ({ bg, children, style }) => <div style={{ position: 'absolute', inset: 0, background: bg, fontFamily: JOST, ...style }}>{children}</div>;
const Center = ({ children, gap }) => <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: gap || 40 }}>{children}</div>;
const Mono = ({ children, color, size, op, y }) => <div style={{ fontFamily: MONO, fontSize: size || 24, letterSpacing: '0.16em', textTransform: 'uppercase', color, opacity: op, transform: `translateY(${y || 0}px)` }}>{children}</div>;
const Serif = ({ children, color, size, op, y, italic, weight }) => <div style={{ fontFamily: SER, fontWeight: weight || 200, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.08, letterSpacing: '-0.018em', color, opacity: op, transform: `translateY(${y || 0}px)`, textAlign: 'center', whiteSpace: 'nowrap' }}>{children}</div>;

// 01 Reveal
function Reveal({ T, s }) {
  const line = M.draw(s + .15, s + 1.25)(T), jjOp = M.enter(s + .55, s + 1.45)(T), jjY = animate({ from: 56, to: 0, start: s + .55, end: s + 1.7, ease: Easing.easeOutCubic })(T);
  const tag = M.enter(s + 2.4, s + 3.3)(T), out = M.fade(s + 4.4, s + 5)(T);
  return <Full bg={LINEN}><Center gap={46}><div style={{ opacity: out }}><Waterline ink={NAVY} rule={RULE} size={300} prog={line} y={jjY} op={jjOp} /></div><Serif color="#6B5D4E" size={60} italic op={tag * out} y={(1 - tag) * 14}>Every move, expertly guided.</Serif></Center></Full>;
}
// 02 Stat count-up
function Stat({ T, s }) {
  const eyb = M.enter(s, s + .6)(T), n = Math.round(animate({ from: 0, to: 712, start: s + .6, end: s + 2.4, ease: Easing.easeOutQuart })(T));
  const lab = M.enter(s + 2.4, s + 3.1)(T), src = M.enter(s + 3.6, s + 4.1)(T), out = M.fade(s + 4.5, s + 5)(T);
  return <Full bg="#FAF8F5"><Center gap={26}><div style={{ opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}><Mono color={BRASS} op={eyb} y={(1 - eyb) * 10}>Lakewood Ranch · Q2 2026</Mono><div style={{ fontFamily: MONO, fontSize: 260, fontWeight: 500, lineHeight: 1, color: NAVY }}>${n}</div><div style={{ fontFamily: JOST, fontSize: 40, fontWeight: 500, color: '#2B2D30', opacity: lab, transform: `translateY(${(1 - lab) * 12}px)` }}>median per square foot, up four dollars</div><Mono color="#7A7E84" size={20} op={src}>Stellar MLS · pulled 2 April 2026</Mono></div></Center></Full>;
}
// 03 Listing tour title
function Tour({ T, s }) {
  const dim = animate({ from: .35, to: .85, start: s, end: s + .5, ease: Easing.easeOutCubic })(T), line = M.draw(s + .4, s + 1.4)(T), split = animate({ from: 0, to: 1, start: s + 1.4, end: s + 2.0, ease: Easing.easeInOutQuart })(T);
  const tx = M.enter(s + 1.6, s + 2.4)(T), out = M.fade(s + 3.8, s + 4.6)(T), up = animate({ from: .85, to: 1, start: s + 3.8, end: s + 4.8 })(T);
  const gap = 640 * split;
  return <Full bg="#142530"><img src="assets/library/interior-living-room.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: Math.min(dim, up) }} /><Center gap={0}><div style={{ display: 'flex', alignItems: 'center', gap: gap, opacity: out }}><div style={{ width: (1920 - gap) / 2 * line * .92, height: 2, background: SKY }} /><div style={{ width: (1920 - gap) / 2 * line * .92, height: 2, background: SKY }} /></div><div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: tx * out, transform: `translateY(${(1 - tx) * 20}px)` }}><Serif color="#FFFFFF" size={92}>18 Cliffside Terrace</Serif><Mono color="#C7E7EF" size={26}>$2,850,000 · 4 BD · 3.5 BA · 3,940 SF</Mono></div></Center></Full>;
}
// 04 Series bumper
function Bumper({ T, s }) {
  const eyb = M.enter(s + .3, s + .9)(T), title = M.enter(s + .9, s + 1.7)(T), art = animate({ from: 0, to: .35, start: s + 2, end: s + 2.8 })(T), out = M.fade(s + 3.2, s + 3.9)(T), artUp = animate({ from: .35, to: 1, start: s + 3.2, end: s + 4.2 })(T);
  return <Full bg={TEAL}><img src="assets/library/art-oak-silkscreen.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: T > s + 3.2 ? artUp : art }} /><Center gap={30}><div style={{ opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}><Mono color="#C7E7EF" op={eyb} y={(1 - eyb) * 10}>The Suncoast Calendar</Mono><Serif color="#FFFFFF" size={120} op={title} y={(1 - title) * 20}>Where to go this week</Serif></div></Center></Full>;
}
// 05 Lower third
function Lower({ T, s }) {
  const x = animate({ from: -60, to: 0, start: s + .4, end: s + .9, ease: Easing.easeOutCubic })(T), op = M.enter(s + .4, s + .8)(T), out = M.fade(s + 4.2, s + 4.7)(T);
  return <Full bg="#142530"><img src="assets/library/place-sea-oats-dusk.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .9 }} /><div style={{ position: 'absolute', left: 120, bottom: 110, display: 'flex', alignItems: 'stretch', opacity: op * out, transform: `translateX(${x}px)` }}><div style={{ width: 8, background: SKY }} /><div style={{ background: 'rgba(46,74,92,0.92)', padding: '30px 46px 30px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}><div style={{ fontFamily: JOST, fontSize: 46, fontWeight: 500, color: '#FFFFFF' }}>Joelyn Nauman</div><Mono color={SKY} size={22}>JJ Premier Group · Coldwell Banker Realty</Mono></div></div></Full>;
}
// 06 Quote card
function Quote({ T, s }) {
  const q = M.enter(s + .3, s + 1.3)(T), mark = M.enter(s + 1.8, s + 2.5)(T), out = M.fade(s + 4.3, s + 5)(T);
  return <Full bg={LINEN}><Center gap={60}><div style={{ opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60 }}><div style={{ fontFamily: SER, fontWeight: 200, fontStyle: 'italic', fontSize: 84, lineHeight: 1.18, color: NAVY, textAlign: 'center', maxWidth: 1400, opacity: q, transform: `translateY(${(1 - q) * 24}px)` }}>Ask what the last three sold for.<br />Not the list price. The sold price.</div><Waterline ink={NAVY} rule={RULE} size={72} prog={1} op={mark} /></div></Center></Full>;
}
// 07 Open house
function OpenHouse({ T, s }) {
  const eyb = M.enter(s + .2, s + .7)(T), big = M.enter(s + .6, s + 1.4)(T), rule = M.draw(s + 1.3, s + 1.9)(T), det = M.enter(s + 1.9, s + 2.6)(T), out = M.fade(s + 4.3, s + 5)(T);
  return <Full bg={NAVY}><Center gap={34}><div style={{ opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}><Mono color={SKY} op={eyb}>Lakewood Ranch · Sunday</Mono><Serif color="#FFFFFF" size={200} op={big} y={(1 - big) * 24}>Open house</Serif><div style={{ width: 200 * rule, height: 2, background: SKY }} /><Mono color="#C7E7EF" size={34} op={det} y={(1 - det) * 10}>1 – 3 PM · 18 Cliffside Terrace</Mono></div></Center></Full>;
}
// 08 Sold
function Sold({ T, s }) {
  const w = M.enter(s + .2, s + .9)(T), n = Math.round(animate({ from: 0, to: 104, start: s + .9, end: s + 2.4, ease: Easing.easeOutQuart })(T)), lab = M.enter(s + 2.4, s + 3)(T), out = M.fade(s + 4.3, s + 5)(T);
  return <Full bg={TEAL}><Center gap={20}><div style={{ opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}><Serif color="#FFFFFF" size={150} op={w} y={(1 - w) * 20}>Sold</Serif><div style={{ fontFamily: MONO, fontSize: 200, fontWeight: 500, lineHeight: 1, color: '#FFFFFF' }}>{n}%</div><Mono color="#C7E7EF" size={28} op={lab}>of list · nine days · Riverwalk Court</Mono></div></Center></Full>;
}
// 09 Price improved
function Price({ T, s }) {
  const tag = M.enter(s + .2, s + .7)(T), old = M.enter(s + .6, s + 1.2)(T), strike = M.draw(s + 1.4, s + 2.0)(T), neu = M.enter(s + 2.0, s + 2.8)(T), out = M.fade(s + 4.3, s + 5)(T);
  return <Full bg="#F1E9DC"><Center gap={28}><div style={{ opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}><div style={{ background: NAVY, color: LINEN, padding: '12px 26px', fontFamily: MONO, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: tag }}>Price improved</div><div style={{ position: 'relative', fontFamily: MONO, fontSize: 84, color: '#6B5D4E', opacity: old }}>$1,295,000<div style={{ position: 'absolute', left: 0, top: '52%', height: 4, background: '#6B5D4E', width: `${strike * 100}%` }} /></div><div style={{ fontFamily: MONO, fontSize: 180, fontWeight: 500, lineHeight: 1, color: NAVY, opacity: neu, transform: `translateY(${(1 - neu) * 20}px)` }}>$1,150,000</div><Mono color="#4A4438" size={26} op={neu}>7104 Waterside Way · 3 BD</Mono></div></Center></Full>;
}
// 10 End card
function End({ T, s, total }) {
  const mark = M.enter(s + .2, s + 1)(T), tag = M.enter(s + 1, s + 1.8)(T), meta = M.enter(s + 1.8, s + 2.4)(T), out = M.fade(total - .8, total - .05)(T);
  return <Full bg={LINEN}><Center gap={44}><div style={{ opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 }}><Waterline ink={NAVY} rule={RULE} size={200} prog={1} op={mark} y={(1 - mark) * 20} /><Serif color="#6B5D4E" size={64} italic op={tag} y={(1 - tag) * 12}>Every move, expertly guided.</Serif><Mono color="#4E5157" size={24} op={meta}>jjpremiergroup.com · @jjpremiergroup</Mono></div></Center></Full>;
}

function Piece() {
  const { T, CUES, authoredTotal } = useComposition();
  const P = [['Reveal', Reveal], ['Stat', Stat], ['Tour', Tour], ['Bumper', Bumper], ['LowerThird', Lower], ['Quote', Quote], ['OpenHouse', OpenHouse], ['Sold', Sold], ['Price', Price], ['End', End]];
  return (
    <div style={{ position: 'absolute', inset: 0, background: LINEN }}>
      {P.map(([name, C], i) => { const from = CUES[name], to = i < P.length - 1 ? CUES[P[i + 1][0]] : authoredTotal; return <Shot key={name} from={from} to={to}><C T={T} s={from} total={authoredTotal} /></Shot>; })}
    </div>
  );
}
window.JJMotionReel = function JJMotionReel() {
  return <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={LINEN}><Piece /></CompositionStage>;
};

const mk=(name,C)=>function Single(){ const {T,CUES,authoredTotal}=useComposition(); return <div style={{position:'absolute',inset:0,background:LINEN}}><C T={T} s={CUES[name]} total={authoredTotal}/></div>; };
const wrap=(S)=>function Stage(){ return <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={LINEN}><S/></CompositionStage>; };
window.JJSingles={Reveal:wrap(mk('Reveal',Reveal)),Stat:wrap(mk('Stat',Stat)),Tour:wrap(mk('Tour',Tour)),Bumper:wrap(mk('Bumper',Bumper)),LowerThird:wrap(mk('LowerThird',Lower)),Quote:wrap(mk('Quote',Quote)),OpenHouse:wrap(mk('OpenHouse',OpenHouse)),Sold:wrap(mk('Sold',Sold)),Price:wrap(mk('Price',Price)),End:wrap(mk('End',End))};
