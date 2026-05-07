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

    setLines((prev) => {
      const next = [...prev];
      next[lineIdx] = { tokens: tokenize(currentLine || "\u00a0"), done: true };
      return next;
    });

    if (lineIdx < CODE_LINES.length - 1) {
      const t = setTimeout(() => {
        setLines((prev) => [...prev, { tokens: [{ text: "", color: "#C0C0C0" }], done: false }]);
        setLineIdx((l) => l + 1);
        setCharIdx(0);

        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 55);

      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setRestarting(true);
      setTimeout(() => {
        setLines([{ tokens: [{ text: "", color: "#C0C0C0" }], done: false }]);
        setLineIdx(0);
        setCharIdx(0);
        setRestarting(false);
      }, 700);
    }, 3000);

    return () => clearTimeout(t);
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

export default function Portfolio() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState({});
  const refs = useRef({});

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

    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const reg = (key) => (el) => {
    refs.current[key] = el;
  };

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
        .code-inner{min-width:0;max-width:100%}

        @media(max-width:760px){
          .split{grid-template-columns:1fr !important}
          .hero-grid{grid-template-columns:1fr !important;gap:2rem !important;align-items:start !important}
          .code-win{width:100% !important;max-width:100% !important;min-width:0 !important;overflow:hidden !important;height:auto !important}
          .code-inner{height:300px !important;padding:1rem .8rem !important}
          .hero-links{gap:1rem !important;flex-wrap:wrap !important}
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
        <div style={{ animation: "heroIn 1s cubic-bezier(.22,1,.36,1) both", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.8rem" }}>
            <span style={{ width: "28px", height: "1px", background: "#7B8CDE" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#7B8CDE", letterSpacing: "0.18em" }}>
              AI ENGINEER / FULL STACK
            </span>
          </div>

          <h1
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
            Middle AI engineer and full-stack developer focused on intelligent systems — LLM pipelines, Telegram bots, blockchain integrations, and the infrastructure holding it all together.
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
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#333" }}>Palu, Indonesia</span>
          </div>
        </div>

        {/* Code window */}
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
      </section>

      {/* STACK */}
      <section data-sid="stack" ref={reg("stack")} style={{ padding: `clamp(5rem,10vw,9rem) ${PX}`, maxWidth: "1380px", margin: "0 auto" }}>
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
      <section data-sid="tg" ref={reg("tg")} style={{ padding: `clamp(4.5rem,9vw,8rem) ${PX}`, borderTop: "1px solid #121212", borderBottom: "1px solid #121212", background: "#0B0B0B" }}>
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
      <section data-sid="ai" ref={reg("ai")} style={{ padding: `clamp(5rem,10vw,9rem) ${PX}`, maxWidth: "1380px", margin: "0 auto" }}>
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
      <footer data-sid="contact" ref={reg("contact")} style={{ padding: `clamp(5rem,10vw,9rem) ${PX}`, borderTop: "1px solid #121212", background: "#070707" }}>
        <div style={{ maxWidth: "1380px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2.5rem,6vw,7rem)", alignItems: "end", ...fi("contact") }} className="split">
            <div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#252525", letterSpacing: "0.18em" }}>AVAILABLE FOR PROJECTS</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "clamp(2.6rem,5.5vw,4.8rem)", color: "#EBEBEB", lineHeight: 0.93, letterSpacing: "-0.025em", margin: "1.4rem 0 1rem" }}>
                Let's build
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
