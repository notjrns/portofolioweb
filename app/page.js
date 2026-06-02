"use client";
import { useEffect, useRef, useState } from "react";

const CODE_LINES = [
  "import { createClient } from '@supabase/supabase-js'",
  "import { Telegraf } from 'telegraf'",
  "import Redis from 'ioredis'",
  "",
  "const supabase = createClient(url, key)",
  "const bot = new Telegraf(process.env.BOT_TOKEN)",
  "const redis = new Redis({ host: 'localhost', port: 6379 })",
  "",
  "bot.on('message', async (ctx) => {",
  " const cached = await redis.get(ctx.from.id)",
  " if (cached) return ctx.reply(cached)",
  "",
  " const { data } = await supabase",
  " .from('users')",
  " .select('*')",
  " .eq('telegram_id', ctx.from.id)",
  "",
  " await redis.set(ctx.from.id, data, 'EX', 3600)",
  " ctx.reply('done.')",
  "})",
  "",
  "export default async function handler(req, res) {",
  " const chain = await ethers.getContractAt(abi, addr)",
  " const tx = await chain.execute(req.body.payload)",
  " await tx.wait()",
  " res.json({ hash: tx.hash })",
  "}",
];

function tokenize(line) {
  if (line === "") return [{ text: "\u00a0", color: "transparent" }];

  const tokens = [];
  let rest = line;

  const rules = [
    { re: /^(import|from|const|async|await|if|return|export|default|function|new)(?=\b)/, color: "#7B8CDE" },
    { re: /^(createClient|Telegraf|Redis|ethers)/, color: "#50C6B8" },
    { re: /^(bot|redis|supabase|chain|tx|ctx|cached|data|req|res)(?=\b)/, color: "#E8D9A0" },
    { re: /^(['"`][^'"`]*['"`])/, color: "#98C8A0" },
    { re: /^(\d+)/, color: "#F0A070" },
    { re: /^([.,()\[\]{};:=><\-+!*&|?])/, color: "#556677" },
    { re: /^([a-zA-Z_$][a-zA-Z0-9_$]*)/, color: "#C0C0C0" },
    { re: /^(\s+)/, color: "transparent" },
    { re: /^(.)/, color: "#666" },
  ];

  while (rest.length > 0) {
    let matched = false;

    for (const rule of rules) {
      const m = rest.match(rule.re);
      if (m) {
        tokens.push({ text: m[1] || m[0], color: rule.color });
        rest = rest.slice((m[1] || m[0]).length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push({ text: rest[0], color: "#666" });
      rest = rest.slice(1);
    }
  }

  return tokens;
}

function CodeAnimation() {
  const [lines, setLines] = useState([{ tokens: [{ text: "", color: "#C0C0C0" }], done: false }]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [restarting, setRestarting] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (restarting) return;

    const currentLine = CODE_LINES[lineIdx];

    if (charIdx <= currentLine.length) {
      const delay = charIdx === 0 ? 80 : Math.random() * 38 + 12;
      const t = setTimeout(() => {
        const partial = currentLine.slice(0, charIdx);

        setLines((prev) => {
          const next = [...prev];
          next[lineIdx] = { tokens: tokenize(partial || "\u00a0"), done: false };
          return next;
        });

        setCharIdx((c) => c + 1);
      }, delay);

      return () => clearTimeout(t);
    }

    const doneTimer = setTimeout(() => {
      setLines((prev) => {
        const next = [...prev];
        next[lineIdx] = { tokens: tokenize(currentLine || "\u00a0"), done: true };
        return next;
      });
    }, 0);

    if (lineIdx < CODE_LINES.length - 1) {
      const t = setTimeout(() => {
        setLines((prev) => [...prev, { tokens: [{ text: "", color: "#C0C0C0" }], done: false }]);
        setLineIdx((l) => l + 1);
        setCharIdx(0);

        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 55);

      return () => {
        clearTimeout(doneTimer);
        clearTimeout(t);
      };
    }

    let resetTimer;
    const t = setTimeout(() => {
      setRestarting(true);
      resetTimer = setTimeout(() => {
        setLines([{ tokens: [{ text: "", color: "#C0C0C0" }], done: false }]);
        setLineIdx(0);
        setCharIdx(0);
        setRestarting(false);
      }, 700);
    }, 3000);

    return () => {
      clearTimeout(doneTimer);
      clearTimeout(t);
      clearTimeout(resetTimer);
    };
  }, [lineIdx, charIdx, restarting]);

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: "clamp(9px, 1.1vw, 12.5px)",
        lineHeight: "1.8",
        overflowY: "hidden",
        overflowX: "hidden",
        height: "100%",
        maxWidth: "100%",
        minWidth: 0,
        opacity: restarting ? 0 : 1,
        transition: "opacity 0.5s ease",
      }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", whiteSpace: "pre", minWidth: 0, maxWidth: "100%" }}>
          <span
            style={{
              color: "#282828",
              minWidth: "2.2em",
              userSelect: "none",
              marginRight: "1.2em",
              textAlign: "right",
              fontSize: "0.8em",
              paddingTop: "0.1em",
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>

          <span style={{ overflow: "hidden", textOverflow: "clip", minWidth: 0, maxWidth: "100%" }}>
            {line.tokens.map((tok, j) => (
              <span key={j} style={{ color: tok.color }}>
                {tok.text}
              </span>
            ))}

            {i === lineIdx && !line.done && (
              <span
                style={{
                  display: "inline-block",
                  width: "1.5px",
                  height: "1em",
                  background: "#7B8CDE",
                  verticalAlign: "text-bottom",
                  animation: "blink 0.85s step-end infinite",
                }}
              />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

const WORK_ITEMS = [
  {
    label: "Telegram Bots",
    scope: "Bot Demo",
    year: "2026",
    title: "Telegram Automation",
    summary: "Conversation flows, inline keyboards, webhook handling, and task automation built for real users.",
    stack: ["Telegraf", "Telethon", "Python"],
    media: "https://res.cloudinary.com/dvazzokyi/video/upload/v1780389784/Screen_Recording_20260602_142313_Telegram_vcxnqv.mp4",
    accent: "#50C6B8",
  },
  {
    label: "LLM Systems",
    scope: "AI Pipeline",
    year: "2026",
    title: "Production AI Systems",
    summary: "RAG pipelines, agent workflows, prompt evaluation, and model integrations built for product usage.",
    stack: ["OpenAI APIs", "RAG", "Agents"],
    accent: "#7B8CDE",
  },
  {
    label: "Full Stack",
    scope: "Web Runtime",
    year: "2025",
    title: "Next.js Systems",
    summary: "App router interfaces, API surfaces, server-side workflows, and infrastructure around product logic.",
    stack: ["Next.js", "React", "Node.js"],
    accent: "#A8B3FF",
  },
  {
    label: "Web3",
    scope: "Blockchain",
    year: "2025",
    title: "On-chain Integrations",
    summary: "Wallet authentication, smart contract interaction, transaction orchestration, and multi-chain tooling.",
    stack: ["Ethers.js", "Viem", "DeFi"],
    accent: "#E8D9A0",
  },
];

function PortfolioShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [motion, setMotion] = useState({ rotateX: 2, rotateY: -6, bgX: 0, bgY: 0 });
  const stageRef = useRef(null);
  const active = WORK_ITEMS[activeIndex];

  const updateMotion = (clientX, clientY) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    const compact = rect.width < 760;

    setMotion({
      rotateX: (compact ? 0 : 2) - y * (compact ? 4 : 6),
      rotateY: (compact ? 0 : -6) + x * (compact ? 5 : 9),
      bgX: x * 16,
      bgY: y * 12,
    });
  };

  const resetMotion = () => {
    const compact = stageRef.current?.getBoundingClientRect().width < 760;
    setMotion({ rotateX: compact ? 0 : 2, rotateY: compact ? 0 : -6, bgX: 0, bgY: 0 });
  };

  return (
    <div
      ref={stageRef}
      className="portfolio-stage hero-portfolio"
      onPointerMove={(e) => updateMotion(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) updateMotion(touch.clientX, touch.clientY);
      }}
      onPointerLeave={resetMotion}
      onTouchEnd={resetMotion}
      role="region"
      aria-label="Interactive portfolio preview"
      style={{
        animation: "heroIn 1s cubic-bezier(.22,1,.36,1) 0.18s both",
        position: "relative",
        minHeight: "clamp(360px, 54vh, 470px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1400px",
        overflow: "visible",
        touchAction: "pan-y",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-10%",
          borderRadius: "2rem",
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.08), transparent 46%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 70px), repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 70px)",
          filter: "blur(4px)",
          opacity: 0.64,
          transform: `translate(${motion.bgX}px, ${motion.bgY}px) scale(1.04)`,
          transition: "transform 120ms ease-out",
        }}
      />

      <div
        className="portfolio-frame"
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(460px, 100%)",
          padding: "0.72rem",
          borderRadius: "1.35rem",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.035))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 34px 72px rgba(0,0,0,0.54), inset 0 1px 0 rgba(255,255,255,0.16)",
          transformStyle: "preserve-3d",
          transform: `rotateY(${motion.rotateY}deg) rotateX(${motion.rotateX}deg) scale(0.98)`,
          transition: "transform 120ms ease-out",
        }}
      >
        <div className="portfolio-tabs" style={{ display: "grid", gridTemplateColumns: `repeat(${WORK_ITEMS.length}, minmax(0, 1fr))`, gap: "0.35rem", marginBottom: "0.65rem", transform: "translateZ(26px)" }}>
          {WORK_ITEMS.map((item, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={item.label}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                style={{
                  minHeight: "34px",
                  border: selected ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "0.72rem",
                  background: selected ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)",
                  color: selected ? "#F5F5F5" : "rgba(255,255,255,0.48)",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: "8px",
                  cursor: "pointer",
                  transition: "all 180ms ease",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          className="portfolio-preview"
          style={{
            position: "relative",
            overflow: "hidden",
            aspectRatio: active.media ? "auto" : "9 / 16",
            width: "min(255px, 100%)",
            margin: "0 auto",
            borderRadius: active.media ? "0.72rem" : "1rem",
            border: active.media ? "0" : "1px solid rgba(255,255,255,0.12)",
            background: active.media ? "transparent" : `linear-gradient(135deg, ${active.accent}2F, rgba(0,0,0,0.42))`,
            boxShadow: active.media ? "none" : "0 22px 48px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.12)",
            transform: "translateZ(46px)",
          }}
        >
          {active.media ? (
            <video
              src={active.media}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              style={{ width: "100%", height: "auto", objectFit: "contain", display: "block", opacity: 0.96, background: "transparent", borderRadius: "0.72rem" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "62px 62px" }}>
              <div style={{ width: "72%", display: "grid", gap: "0.7rem" }}>
                {active.stack.map((item, index) => (
                  <span key={item} style={{ padding: "0.85rem 1rem", borderRadius: "0.85rem", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.18)", color: "rgba(255,255,255,0.78)", fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", transform: `translateX(${index * 16}px)` }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!active.media ? (
            <>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.08), transparent 46%, rgba(0,0,0,0.58))", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: "0.8rem", right: "0.8rem", bottom: "0.8rem", display: "flex", alignItems: "end", justifyContent: "space-between", gap: "0.8rem" }}>
                <div>
                  <span style={{ display: "block", fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "rgba(255,255,255,0.58)", letterSpacing: "0.12em", marginBottom: "0.45rem" }}>
                    {active.scope}
                  </span>
                  <strong style={{ display: "block", fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(1rem,1.7vw,1.25rem)", lineHeight: 1, color: "#F4F4F4" }}>{active.title}</strong>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.68)" }}>{active.year}</span>
              </div>
            </>
          ) : null}
        </div>

        <div className="portfolio-meta" style={{ display: "grid", gridTemplateColumns: "1fr", alignItems: "center", gap: "0.7rem", padding: "0.75rem 0.25rem 0.05rem", transform: "translateZ(30px)" }}>
          <p style={{ margin: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "11.5px", lineHeight: 1.55, color: "rgba(255,255,255,0.54)" }}>{active.summary}</p>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {active.stack.map((item) => (
              <span key={item} style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: "999px", padding: "0.35rem 0.55rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: "rgba(255,255,255,0.60)" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeWindow() {
  return (
    <div
      style={{
        animation: "heroIn 1s cubic-bezier(.22,1,.36,1) 0.18s both",
        position: "relative",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
      }}
      className="code-win"
    >
      <div style={{ position: "absolute", inset: "-60px", background: "radial-gradient(ellipse at center, #7B8CDE08 0%, transparent 68%)", pointerEvents: "none" }} />

      <div
        className="code-shell"
        style={{
          background: "#0D0D0D",
          border: "1px solid #1C1C1C",
          borderRadius: "3px",
          overflow: "hidden",
          boxShadow: "0 48px 96px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ padding: "9px 14px", background: "#111", borderBottom: "1px solid #1A1A1A", display: "flex", alignItems: "center", gap: "7px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#222" }} />
          ))}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "#2E2E2E", marginLeft: "8px" }}>notjrnss / main.ts</span>
        </div>

        <div className="code-inner" style={{ padding: "1.4rem 1.2rem", height: "clamp(240px,38vh,460px)", overflow: "hidden", position: "relative" }}>
          <CodeAnimation />
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState({});
  const stackRef = useRef(null);
  const telegramRef = useRef(null);
  const aiRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible((v) => ({ ...v, [e.target.dataset.sid]: true }));
        }),
      { threshold: 0.1 }
    );

    [stackRef, telegramRef, aiRef, contactRef].forEach((ref) => ref.current && obs.observe(ref.current));
    return () => obs.disconnect();
  }, []);

  const fi = (key, delay = 0) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "none" : "translateY(28px)",
    transition: `opacity 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.85s cubic-bezier(.22,1,.36,1) ${delay}ms`,
  });

  const PX = "clamp(1.4rem, 5vw, 4rem)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth;width:100%;max-width:100%;overflow-x:hidden}
        body{background:#080808;color:#B8B8B8;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;width:100%;max-width:100%;overflow-x:hidden}
        ::selection{background:#7B8CDE22;color:#fff}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes heroIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#0A0A0A}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
        a{color:inherit;text-decoration:none}

        .hero-grid,
        .split,
        .code-win,
        .code-shell,
        .code-inner,
        .portfolio-stage,
        .portfolio-frame,
        .portfolio-preview,
        .portfolio-tabs,
        .portfolio-meta{min-width:0;max-width:100%}

        @media(max-width:760px){
          .split{grid-template-columns:1fr !important}
          .hero-grid{grid-template-columns:minmax(0,.98fr) minmax(122px,.72fr) !important;gap:clamp(.35rem,2vw,.75rem) !important;align-items:center !important;align-content:start !important;min-height:auto !important;padding-top:clamp(82px,16vw,96px) !important;padding-bottom:clamp(1.8rem,6vw,2.6rem) !important}
          .hero-copy-block{min-width:0 !important}
          .hero-kicker{margin-bottom:1.15rem !important}
          .hero-kicker span:last-child{font-size:8px !important;letter-spacing:.14em !important}
          .hero-title{font-size:clamp(2.1rem,10vw,3.35rem) !important;line-height:.92 !important;margin-bottom:1rem !important}
          .hero-summary{font-size:clamp(.68rem,2.45vw,.82rem) !important;line-height:1.68 !important;max-width:225px !important;margin-bottom:1.35rem !important}
          .code-win{width:100% !important;max-width:100% !important;min-width:0 !important;overflow:hidden !important;height:auto !important}
          .code-inner{height:300px !important;padding:1rem .8rem !important}
          .hero-links{gap:.7rem !important;flex-wrap:wrap !important}
          .hero-links > span:last-child{display:none !important}
          .hero-portfolio{width:100% !important;min-height:auto !important;justify-content:flex-end !important}
          .portfolio-frame{width:100% !important;margin-left:auto !important;border-radius:1rem !important;padding:.45rem !important;transform:none !important}
          .portfolio-tabs{display:flex !important;gap:.25rem !important;margin-bottom:.4rem !important;overflow:hidden !important}
          .portfolio-tabs button{min-height:24px !important;min-width:0 !important;padding:0 .35rem !important;border-radius:.55rem !important;font-size:7px !important}
          .portfolio-tabs button:not([aria-pressed="true"]){display:none !important}
          .portfolio-preview{width:min(128px,100%) !important;border-radius:.72rem !important}
          .portfolio-meta{display:none !important}
        }

        @media(max-width:420px){
          .hero-grid{grid-template-columns:minmax(0,1fr) minmax(108px,.58fr) !important;gap:.3rem !important}
          .hero-title{font-size:clamp(1.95rem,9.6vw,2.6rem) !important}
          .hero-summary{font-size:.66rem !important;line-height:1.62 !important;max-width:210px !important}
          .portfolio-preview{width:min(112px,100%) !important}
        }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${PX}`,
          background: scrolled ? "rgba(8,8,8,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid #181818" : "1px solid transparent",
          transition: "all 0.4s ease",
        }}
      >
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "13px", letterSpacing: "0.14em", color: "#E0E0E0" }}>
          NOTJRNSS
        </span>

        <a
          href="https://t.me/notjrnss"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: "10px",
            color: "#7B8CDE",
            letterSpacing: "0.08em",
            padding: "5px 13px",
            border: "1px solid #7B8CDE33",
            borderRadius: "2px",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#7B8CDE10";
            e.currentTarget.style.borderColor = "#7B8CDE77";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#7B8CDE33";
          }}
        >
          @notjrnss
        </a>
      </nav>

      {/* HERO */}
      <section
        style={{
          minHeight: "100dvh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(2rem,4vw,5rem)",
          padding: `0 ${PX}`,
          paddingTop: "clamp(72px,10vw,90px)",
          paddingBottom: "clamp(3rem,6vw,5rem)",
          alignItems: "center",
          maxWidth: "1380px",
          margin: "0 auto",
          width: "100%",
          overflow: "hidden",
        }}
        className="hero-grid"
      >
        <div className="hero-copy-block" style={{ animation: "heroIn 1s cubic-bezier(.22,1,.36,1) both", minWidth: 0 }}>
          <div className="hero-kicker" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.8rem" }}>
            <span style={{ width: "28px", height: "1px", background: "#7B8CDE" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#7B8CDE", letterSpacing: "0.18em" }}>
              AI ENGINEER / FULL STACK
            </span>
          </div>

          <h1
            className="hero-title"
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(3rem,6.5vw,5.8rem)",
              lineHeight: 0.93,
              letterSpacing: "-0.025em",
              color: "#EBEBEB",
              marginBottom: "1.6rem",
            }}
          >
            Building
            <br />
            <span style={{ color: "transparent", WebkitTextStroke: "1px #2E2E2E" }}>systems</span>
            <br />
            that think.
          </h1>

          <p
            className="hero-summary"
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 300,
              fontSize: "clamp(0.85rem,1.3vw,0.98rem)",
              lineHeight: 1.85,
              color: "#555",
              maxWidth: "390px",
              marginBottom: "2.5rem",
            }}
          >
            Middle AI engineer and full-stack developer focused on intelligent systems LLM pipelines, Telegram bots, blockchain integrations, and the infrastructure holding it all together.
          </p>

          <div className="hero-links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <a
              href="https://t.me/notjrnss"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", color: "#C0C0C0", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#50C6B8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#C0C0C0")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7B8CDE" strokeWidth="1.5">
                <path d="M21.5 4.5L2.5 11l7 2.5m12-9L12 16m-2.5-2.5L12 20l3-4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              t.me/notjrnss
            </a>

            <span style={{ width: "1px", height: "14px", background: "#202020" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#333" }}>jakarta, Indonesia</span>
          </div>
        </div>

        <PortfolioShowcase />
      </section>

      {/* TERMINAL */}
      <section style={{ padding: `clamp(4.5rem,8vw,7rem) ${PX}`, borderTop: "1px solid #121212", background: "#080808" }}>
        <div style={{ maxWidth: "980px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2.2rem" }}>
            <span style={{ width: "28px", height: "1px", background: "#7B8CDE" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#7B8CDE", letterSpacing: "0.18em" }}>SYSTEM TRACE</span>
          </div>
          <CodeWindow />
        </div>
      </section>

      {/* STACK */}
      <section data-sid="stack" ref={stackRef} style={{ padding: `clamp(5rem,10vw,9rem) ${PX}`, maxWidth: "1380px", margin: "0 auto" }}>
        <div style={fi("stack")}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4.5rem" }}>
            <span style={{ width: "28px", height: "1px", background: "#7B8CDE" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#7B8CDE", letterSpacing: "0.18em" }}>TECHNICAL STACK</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2.5rem,6vw,7rem)" }} className="split">
            {[
              {
                title: "Frontend & Runtime",
                items: [
                  { label: "Next.js", desc: "App router, RSC, edge functions, ISR/SSG/PPR pipelines" },
                  { label: "React", desc: "Component architecture, custom hooks, complex state patterns" },
                  { label: "Node.js", desc: "Event-driven servers, stream processing, CLI tooling" },
                  { label: "TypeScript", desc: "Strict typing across monorepos, generics, type-level logic" },
                ],
                start: 1,
              },
              {
                title: "Backend & Infrastructure",
                items: [
                  { label: "NestJS", desc: "Modular DI, guards, interceptors, CQRS, microservice transport" },
                  { label: "Supabase", desc: "Realtime DB, auth flows, edge functions, row-level security" },
                  { label: "Redis", desc: "Caching, pub/sub, session management, rate limiting layers" },
                  { label: "Docker", desc: "Containerized deployments, Compose orchestration, multi-stage builds" },
                ],
                start: 5,
              },
            ].map((col, ci) => (
              <div key={ci}>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "clamp(1.7rem,2.8vw,2.6rem)", color: "#EBEBEB", lineHeight: 1.1, marginBottom: "2.2rem" }}>
                  {col.title.split(" & ").map((part, pi) => (
                    <span key={pi}>
                      {part}
                      {pi < col.title.split(" & ").length - 1 ? (
                        <>
                          {' '}&&nbsp;
                          <br />
                        </>
                      ) : null}
                    </span>
                  ))}
                </h2>

                {col.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "1.4rem", padding: "1.15rem 0", borderTop: "1px solid #161616", ...fi("stack", i * 55 + ci * 30) }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "#282828", minWidth: "1.6rem", paddingTop: "2px" }}>{String(col.start + i).padStart(2, "0")}</span>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "13.5px", color: "#D8D8D8", marginBottom: "5px" }}>{item.label}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "12px", color: "#484848", lineHeight: 1.7 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TELEGRAM */}
      <section data-sid="tg" ref={telegramRef} style={{ padding: `clamp(4.5rem,9vw,8rem) ${PX}`, borderTop: "1px solid #121212", borderBottom: "1px solid #121212", background: "#0B0B0B" }}>
        <div style={{ maxWidth: "1380px", margin: "0 auto", ...fi("tg") }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4.5rem" }}>
            <span style={{ width: "28px", height: "1px", background: "#50C6B8" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#50C6B8", letterSpacing: "0.18em" }}>TELEGRAM DEVELOPMENT</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2.5rem,6vw,7rem)", alignItems: "center" }} className="split">
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,3.5vw,3.2rem)", color: "#EBEBEB", lineHeight: 1.05, marginBottom: "1.4rem" }}>
                Deep in the
                <br />
                <span style={{ color: "#50C6B8" }}>Telegram</span>
                <br />
                ecosystem.
              </h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "clamp(0.82rem,1.2vw,0.93rem)", color: "#4A4A4A", lineHeight: 1.95, maxWidth: "370px" }}>
                Actively building on the Telegram platform — sophisticated bots with conversation flows, Telethon-based automation at scale, userbot scripting, and MTProto internals. Multi-account orchestration is part of the daily toolkit.
              </p>
            </div>

            <div>
              {[
                { tech: "Telegraf", detail: "Bot framework — inline keyboards, scenes, session, middleware stacks, webhooks" },
                { tech: "Telethon", detail: "Python MTProto client — userbot automation, event listeners, bulk operations" },
                { tech: "Python", detail: "Bot logic, data pipelines, async task runners, automation scripts" },
                { tech: "Telegram API", detail: "Raw API — channels, groups, media handling, chat admin tooling" },
              ].map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "1.5rem", padding: "1.2rem 0", borderTop: i === 0 ? "1px solid #1C1C1C" : "none", borderBottom: "1px solid #1C1C1C", ...fi("tg", i * 70) }}>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "12.5px", color: "#50C6B8" }}>{item.tech}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "11.5px", color: "#484848", lineHeight: 1.75 }}>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI + WEB3 */}
      <section data-sid="ai" ref={aiRef} style={{ padding: `clamp(5rem,10vw,9rem) ${PX}`, maxWidth: "1380px", margin: "0 auto" }}>
        <div style={fi("ai")}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4.5rem" }}>
            <span style={{ width: "28px", height: "1px", background: "#7B8CDE" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#7B8CDE", letterSpacing: "0.18em" }}>AI + WEB3</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2.5rem,6vw,7rem)" }} className="split">
            {[
              {
                accent: "#7B8CDE",
                tag: "MACHINE INTELLIGENCE",
                title: "LLM Engineering",
                body: "Designing and deploying production LLM systems — prompt engineering, RAG pipelines, fine-tuning workflows, and agentic architectures. Integrating models into real products that handle real user load.",
                items: ["LLM APIs (OpenAI, Anthropic, Gemini)", "RAG + vector search pipelines", "Agentic workflows & tool use", "Prompt optimization & evaluation"],
              },
              {
                accent: "#7B8CDE",
                tag: "DECENTRALIZED SYSTEMS",
                title: "Blockchain & Web3",
                body: "Building on-chain integrations and dApp backends — smart contract interaction, wallet authentication, transaction orchestration, and multi-chain tooling. Comfortable with DeFi protocol surfaces.",
                items: ["Ethers.js / viem", "Smart contract interaction", "Wallet auth (WalletConnect, MetaMask)", "DeFi protocol integration"],
              },
            ].map((col, ci) => (
              <div key={ci}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: col.accent, letterSpacing: "0.14em", marginBottom: "1rem" }}>{col.tag}</div>
                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem,2.4vw,2rem)", color: "#EBEBEB", lineHeight: 1.15, marginBottom: "1.3rem" }}>{col.title}</h3>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "12.5px", color: "#4A4A4A", lineHeight: 1.9, marginBottom: "1.8rem" }}>{col.body}</p>

                <div style={{ borderTop: "1px solid #161616" }}>
                  {col.items.map((s, i) => (
                    <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", color: "#383838", padding: "9px 0", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: col.accent, flexShrink: 0, opacity: 0.7 }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer data-sid="contact" ref={contactRef} style={{ padding: `clamp(5rem,10vw,9rem) ${PX}`, borderTop: "1px solid #121212", background: "#070707" }}>
        <div style={{ maxWidth: "1380px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2.5rem,6vw,7rem)", alignItems: "end", ...fi("contact") }} className="split">
            <div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#252525", letterSpacing: "0.18em" }}>AVAILABLE FOR PROJECTS</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "clamp(2.6rem,5.5vw,4.8rem)", color: "#EBEBEB", lineHeight: 0.93, letterSpacing: "-0.025em", margin: "1.4rem 0 1rem" }}>
                Let&apos;s build
                <br />
                something.
              </h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 300, fontSize: "12.5px", color: "#383838", lineHeight: 1.8 }}>Reach out via Telegram. Usually fast.</p>
            </div>

            <div>
              <a
                href="https://t.me/notjrnss"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.6rem 0", borderTop: "1px solid #181818", borderBottom: "1px solid #181818", transition: "all 0.3s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.paddingLeft = "1.2rem";
                  e.currentTarget.style.borderColor = "#7B8CDE22";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.paddingLeft = "0";
                  e.currentTarget.style.borderColor = "#181818";
                }}
              >
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "17px", color: "#D8D8D8", marginBottom: "4px" }}>Telegram</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#50C6B8" }}>@notjrnss</div>
                </div>

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E2E2E" strokeWidth="1.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

          <div style={{ marginTop: "5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #121212", paddingTop: "1.8rem" }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "11px", letterSpacing: "0.16em", color: "#1E1E1E" }}>NOTJRNSS</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "#1E1E1E" }}>{new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
