"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { companyInfo } from "@/lib/company-info";

const sectionIds = [
  "who",
  "how",
  "bazar",
  "vrakov",
  "commission",
  "partners",
  "steps",
  "contact",
] as const;

const sectionLabels: Record<(typeof sectionIds)[number], string> = {
  who: "Kdo jsme",
  how: "Jak to funguje",
  bazar: "Pro autobazary",
  vrakov: "Pro vrakoviště",
  commission: "Provizní model",
  partners: "Naši partneři",
  steps: "Další kroky",
  contact: "Kontakt",
};

function AnimatedSection({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "min-h-screen snap-start flex items-center justify-center px-6 sm:px-12 relative overflow-hidden",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl relative z-10"
      >
        {children}
      </motion.div>
    </section>
  );
}

function DotNav({ activeSection }: { activeSection: string }) {
  return (
    <nav
      className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50"
      aria-label="Navigace sekcí"
    >
      {sectionIds.map((id) => (
        <a
          key={id}
          href={`#${id}`}
          title={sectionLabels[id]}
          className={cn(
            "block rounded-full transition-all duration-300",
            activeSection === id
              ? "w-3 h-3 bg-orange-500 shadow-lg shadow-orange-500/50"
              : "w-2 h-2 bg-white/20 hover:bg-white/50"
          )}
        />
      ))}
    </nav>
  );
}

const czRegions = [
  { name: "Praha", partners: 12, cx: 248, cy: 152 },
  { name: "Středočeský", partners: 8, cx: 225, cy: 175 },
  { name: "Jihočeský", partners: 3, cx: 195, cy: 250 },
  { name: "Plzeňský", partners: 4, cx: 120, cy: 195 },
  { name: "Karlovarský", partners: 2, cx: 65, cy: 130 },
  { name: "Ústecký", partners: 3, cx: 165, cy: 100 },
  { name: "Liberecký", partners: 2, cx: 275, cy: 80 },
  { name: "Královéhradecký", partners: 3, cx: 340, cy: 105 },
  { name: "Pardubický", partners: 2, cx: 340, cy: 155 },
  { name: "Vysočina", partners: 3, cx: 300, cy: 220 },
  { name: "Jihomoravský", partners: 5, cx: 385, cy: 265 },
  { name: "Olomoucký", partners: 3, cx: 395, cy: 170 },
  { name: "Zlínský", partners: 2, cx: 435, cy: 225 },
  { name: "Moravskoslezský", partners: 4, cx: 455, cy: 135 },
];

function CzechMap() {
  return (
    <div className="relative max-w-2xl mx-auto mb-10">
      <div className="absolute inset-0 bg-orange-500/5 blur-[80px] rounded-full" />
      <svg viewBox="0 0 520 330" className="w-full relative" role="img" aria-label="Mapa partnerů v České republice">
        <path
          d="M52,128 L68,108 L85,82 L105,68 L130,58 L155,62 L175,55 L200,62 L218,58 L240,65 L260,58 L278,62 L300,55 L318,65 L338,58 L358,68 L378,62 L400,72 L425,78 L448,88 L468,105 L480,125 L485,148 L478,170 L468,188 L458,210 L448,228 L435,248 L418,262 L398,278 L378,285 L355,282 L335,275 L315,268 L298,258 L280,248 L262,242 L245,238 L228,242 L210,252 L195,262 L178,268 L160,265 L142,258 L125,248 L110,238 L95,225 L82,210 L68,195 L58,178 L48,158 L45,142 Z"
          fill="#374151"
          stroke="#4b5563"
          strokeWidth="2"
        />
        {czRegions.map((r) => (
          <g key={r.name}>
            <circle
              cx={r.cx}
              cy={r.cy}
              r={r.partners > 5 ? 14 : r.partners > 3 ? 11 : 9}
              fill="#F97316"
              opacity={0.9}
            />
            <text
              x={r.cx}
              y={r.cy + 4}
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >
              {r.partners}
            </text>
            <title>{`${r.name}: ${r.partners} partnerů`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PrezentaceContent() {
  const searchParams = useSearchParams();
  const managerSlug = searchParams.get("manager");
  const [activeSection, setActiveSection] = useState<string>("who");
  const [manager, setManager] = useState<{
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const sectionHeight = container.clientHeight;
    const idx = Math.round(scrollTop / sectionHeight);
    const clamped = Math.max(0, Math.min(idx, sectionIds.length - 1));
    setActiveSection(sectionIds[clamped]);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!managerSlug) return;
    fetch(`/api/profile/${managerSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setManager(data.user);
      })
      .catch(() => {});
  }, [managerSlug]);

  useEffect(() => {
    const url = managerSlug
      ? `https://carmakler.cz/kontakt?ref=${managerSlug}`
      : "https://carmakler.cz/kontakt";
    QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setQrDataUrl);
  }, [managerSlug]);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"
    >
      {/* 1. Kdo jsme */}
      <AnimatedSection id="who" className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <div className="absolute w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="text-center text-white relative">
          <Image
            src="/brand/logo-color.png"
            alt="CarMakléř"
            width={5517}
            height={1172}
            className="h-24 sm:h-28 w-auto mx-auto mb-8 brightness-0 invert"
            priority
          />
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-6">
            Síť certifikovaných{" "}
            <br />
            <span className="text-orange-500">automakléřů</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Propojujeme prodejce, autobazary a vrakoviště s tisíci zájemců o
            koupi vozidel a autodílů.
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-12">
            {[
              { value: "150+", label: "Makléřů" },
              { value: "2 500+", label: "Prodaných aut" },
              { value: "50+", label: "Partnerů" },
              { value: "14", label: "Krajů" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + 0.15 * i, duration: 0.5 }}
              >
                <div className="text-5xl sm:text-7xl font-extrabold text-orange-500">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 2. Jak to funguje */}
      <AnimatedSection id="how" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-16">
            Jak to funguje
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: "📋",
                title: "Nabírání",
                desc: "Makléř nabere vůz, provede inspekci a fotodokumentaci",
              },
              {
                icon: "🌐",
                title: "Inzerce",
                desc: "Vůz se publikuje na CarMakléř i další portály",
              },
              {
                icon: "🤝",
                title: "Prodej",
                desc: "Makléř domluví prodej, CarMakléř zajistí platbu",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 * i, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-5xl mb-6 shadow-lg shadow-orange-500/20">
                  {step.icon}
                </div>
                <div className="text-orange-500 text-sm font-bold tracking-widest uppercase mb-2">
                  Krok {i + 1}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 3. Pro autobazary */}
      <AnimatedSection id="bazar" className="bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        <div className="text-center text-white relative">
          <div className="text-8xl mb-4">🚗</div>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-8">
            Pro autobazary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            {[
              "Leads od kupujících z celé ČR",
              "Větší viditelnost vašeho sortimentu",
              "Badge \u201EOvěřený partner CarMakléř\u201C",
              "Žádné náklady na start",
              "Provize jen z úspěšného prodeje",
              "Bonus za zprostředkování financování",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 bg-white/10 rounded-xl p-4"
              >
                <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm flex-shrink-0">&#10003;</span>
                <span className="text-lg font-semibold">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 4. Pro vrakoviště */}
      <AnimatedSection id="vrakov" className="bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="text-center text-white relative">
          <div className="text-8xl mb-4">🔧</div>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-8">
            Pro vrakoviště
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            {[
              "Online prodej dílů bez vlastního eshopu",
              "Objednávkový systém s trackingem",
              "Platby zajištěné — peníze na váš účet",
              "Jednoduché přidávání dílů z mobilu",
              "85 % z každého prodeje pro vás",
              "Profesionální profil na webu",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 bg-white/10 rounded-xl p-4"
              >
                <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm flex-shrink-0">&#10003;</span>
                <span className="text-lg font-semibold">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 5. Provizní model */}
      <AnimatedSection id="commission" className="bg-gradient-to-br from-orange-50 via-white to-gray-100">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Transparentní provize
          </h2>
          <p className="text-gray-500 mb-12 text-lg">Žádné skryté poplatky. Vydělávejte s námi.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-10 text-white text-left shadow-xl shadow-orange-500/20"
            >
              <div className="text-5xl mb-6">🚗</div>
              <h3 className="text-2xl font-bold mb-2">Autobazary</h3>
              <div className="text-6xl font-extrabold my-6">0 Kč</div>
              <p className="text-orange-100 text-lg font-medium">vstupní náklady</p>
              <div className="h-px bg-white/20 my-6" />
              <ul className="space-y-3 text-orange-50">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Provizi platí kupující</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Bonus za financování</span>
                </li>
              </ul>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 text-white text-left shadow-xl"
            >
              <div className="text-5xl mb-6">🔧</div>
              <h3 className="text-2xl font-bold mb-2">Vrakoviště</h3>
              <div className="text-6xl font-extrabold text-orange-500 my-6">85 %</div>
              <p className="text-gray-400 text-lg font-medium">z každého prodeje pro vás</p>
              <div className="h-px bg-white/10 my-6" />
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Provize CarMakléř: 15 %</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Měsíční vyúčtování</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* 6. Naši partneři */}
      <AnimatedSection id="partners" className="bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
            Naši partneři
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Partneři po celé České republice
          </p>

          <CzechMap />

          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            {[
              { value: "70+", label: "Partnerů celkem" },
              { value: "14", label: "Krajů" },
              { value: "98 %", label: "Spokojenost" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl sm:text-5xl font-extrabold text-orange-500">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 7. Další kroky */}
      <AnimatedSection id="steps" className="bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="text-center text-white">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-16">
            3 kroky k partnerství
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 max-w-4xl mx-auto">
            {[
              {
                num: "1",
                label: "Podepíšeme smlouvu",
                desc: "Jednoduchá partnerská smlouva bez skrytých závazků.",
              },
              {
                num: "2",
                label: "Nastavíme profil",
                desc: "Pomůžeme vám vytvořit profil a nahrát první vozidla či díly.",
              },
              {
                num: "3",
                label: "Do týdne jste online",
                desc: "Vaše nabídka bude viditelná tisícům zájemců.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 * i, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl font-extrabold mb-4">
                  {step.num}
                </div>
                <span className="text-xl font-bold mb-2">{step.label}</span>
                <span className="text-sm text-orange-100 text-center max-w-[200px]">{step.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 8. Kontakt */}
      <AnimatedSection id="contact" className="bg-gradient-to-b from-gray-900 to-black">
        <div className="absolute w-80 h-80 bg-orange-500/10 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="text-center text-white relative">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-8">
            Pojďte do toho s námi
          </h2>

          {managerSlug && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto border border-orange-500/30">
              <div className="text-sm text-gray-400 mb-1">
                Váš kontaktní manažer
              </div>
              <div className="text-xl font-bold text-orange-500">
                {manager
                  ? `${manager.firstName} ${manager.lastName}`
                  : managerSlug
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              {manager?.phone && (
                <a
                  href={`tel:${manager.phone}`}
                  className="flex gap-2 items-center justify-center mt-3 text-gray-300 hover:text-orange-400 transition-colors no-underline"
                >
                  <span>📞</span>
                  <span>{manager.phone}</span>
                </a>
              )}
              {manager?.email && (
                <a
                  href={`mailto:${manager.email}`}
                  className="flex gap-2 items-center justify-center mt-2 text-gray-300 hover:text-orange-400 transition-colors no-underline"
                >
                  <span>✉️</span>
                  <span>{manager.email}</span>
                </a>
              )}
            </div>
          )}

          <div className="max-w-md mx-auto bg-white/10 rounded-2xl p-8">
            <div className="text-5xl mb-4">🤝</div>
            <p className="text-lg mb-6">
              Kontaktujte nás a začneme spolupracovat
            </p>
            <div className="space-y-3 text-left">
              <a
                href="mailto:partneri@carmakler.cz"
                className="flex gap-3 items-center hover:text-orange-400 transition-colors no-underline text-white"
              >
                <span>✉️</span>
                <span className="font-semibold">partneri@carmakler.cz</span>
              </a>
              <a
                href={companyInfo.contact.phoneHref}
                className="flex gap-3 items-center hover:text-orange-400 transition-colors no-underline text-white"
              >
                <span>📞</span>
                <span className="font-semibold">
                  {companyInfo.contact.phone}
                </span>
              </a>
              <div className="flex gap-3 items-center">
                <span>🌐</span>
                <span className="font-semibold">carmakler.cz</span>
              </div>
            </div>
          </div>

          <a
            href="/kontakt"
            className="inline-flex items-center gap-2 mt-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-10 text-lg rounded-2xl transition-all no-underline shadow-lg shadow-orange-500/20"
          >
            Registrovat se jako partner &rarr;
          </a>

          {qrDataUrl && (
            <div className="mt-6 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR kód pro kontakt" className="w-36 h-36" />
              <p className="text-xs text-gray-500 mt-2">Naskenujte pro kontakt</p>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-8">
            &copy; {new Date().getFullYear()} {companyInfo.legalName} Všechna
            práva vyhrazena.
          </p>
        </div>
      </AnimatedSection>

      {/* Progress dots */}
      <DotNav activeSection={activeSection} />
    </div>
  );
}

export default function PrezentacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-pulse text-white text-xl">Načítám...</div>
        </div>
      }
    >
      <PrezentaceContent />
    </Suspense>
  );
}
