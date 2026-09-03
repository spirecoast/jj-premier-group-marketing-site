// jj-motion.jsx — JJ Premier Group logo reveal. Loads after animations-v3.jsx.
const { useComposition, animate, Easing, CompositionStage } = window;

const MOTION = {
  enter: (start, end) => animate({ from: 0, to: 1, start, end, ease: Easing.easeOutCubic }),
  draw:  (start, end) => animate({ from: 0, to: 1, start, end, ease: Easing.easeInOutQuart }),
  pop:   (start, end) => animate({ from: 0, to: 1, start, end, ease: Easing.easeOutExpo }),
};

const SERIF = "Contralto, 'Cormorant Garamond', Georgia, serif";
const TAG = "'IvyPresto Headline Thin', Newsreader, Georgia, serif";

function Piece() {
  const { T, CUES, authoredTotal } = useComposition();
  const R = CUES.Reveal, N = CUES.Name, G = CUES.Tagline, O = CUES.Out;

  const line   = MOTION.draw(R + 0.15, R + 1.25)(T);
  const jjOp   = MOTION.enter(R + 0.55, R + 1.45)(T);
  const jjY    = animate({ from: 56, to: 0, start: R + 0.55, end: R + 1.7, ease: Easing.easeOutCubic })(T);
  const nameOp = MOTION.enter(N, N + 0.9)(T);
  const track  = animate({ from: 0.95, to: 0.44, start: N, end: N + 1.2, ease: Easing.easeOutCubic })(T);
  const tagOp  = MOTION.enter(G + 0.1, G + 1.0)(T);
  const tagY   = animate({ from: 14, to: 0, start: G + 0.1, end: G + 1.1, ease: Easing.easeOutCubic })(T);
  const out    = 1 - MOTION.enter(O + 0.15, authoredTotal - 0.05)(T);

  const W = 1000, GAP = 410, SEG = (W - GAP) / 2;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#E6DDD1', fontFamily: SERIF }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-54%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: out }}>
        <div style={{ position: 'relative', width: W, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '58%', left: SEG * (1 - line), width: SEG * line, height: 2, background: '#5C86A0' }} />
          <div style={{ position: 'absolute', top: '58%', left: W - SEG, width: SEG * line, height: 2, background: '#5C86A0' }} />
          <div style={{ position: 'relative', fontWeight: 600, fontSize: 330, lineHeight: 1, letterSpacing: '0.12em', textIndent: '0.12em', color: '#2E4A5C', opacity: jjOp, transform: `translateY(${jjY}px)` }}>JJ</div>
        </div>
        <div style={{ fontWeight: 600, fontSize: 62, lineHeight: 1, letterSpacing: `${track}em`, textIndent: `${track}em`, color: '#2E4A5C', opacity: nameOp, whiteSpace: 'nowrap' }}>PREMIER GROUP</div>
        <div style={{ fontFamily: TAG, fontWeight: 200, fontStyle: 'italic', fontSize: 66, lineHeight: 1.1, color: '#6B5D4E', opacity: tagOp, transform: `translateY(${tagY}px)`, marginTop: 30, whiteSpace: 'nowrap' }}>Every move, expertly guided.</div>
      </div>
    </div>
  );
}

window.JJMotionStage = function JJMotionStage() {
  return (
    <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#E6DDD1">
      <Piece />
    </CompositionStage>
  );
};
