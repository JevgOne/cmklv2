"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useSearchParams } from "next/navigation";
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
        "min-h-screen snap-start flex items-center justify-center px-6 sm:px-12",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-5xl"
      >
        {children}
      </motion.div>
    </section>
  );
}

function DotNav({ activeSection }: { activeSection: string }) {
  return (
    <nav
      className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50"
      aria-label="Navigace sekcí"
    >
      {sectionIds.map((id) => (
        <a
          key={id}
          href={`#${id}`}
          title={sectionLabels[id]}
          className={cn(
            "w-3 h-3 rounded-full transition-all block",
            activeSection === id
              ? "bg-orange-500 scale-125"
              : "bg-white/30 hover:bg-white/60"
          )}
        />
      ))}
    </nav>
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

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"
    >
      {/* 1. Kdo jsme */}
      <AnimatedSection id="who" className="bg-gray-900">
        <div className="text-center text-white">
          <Image
            src="/brand/logo-color.png"
            alt="CarMakléř"
            width={5517}
            height={1172}
            className="h-20 w-auto mx-auto mb-8 brightness-0 invert"
            priority
          />
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-6">
            Síť ověřených
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

      {/* 2. Jak to funguje */}
      <AnimatedSection id="how" className="bg-white">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
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
            ].map((step) => (
              <motion.div
                key={step.title}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 3. Pro autobazary */}
      <AnimatedSection id="bazar" className="bg-orange-500">
        <div className="text-center text-white">
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
            ].map((item) => (
              <motion.div
                key={item}
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 bg-white/10 rounded-xl p-4"
              >
                <span className="text-xl mt-0.5">&#10003;</span>
                <span className="text-lg font-semibold">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 4. Pro vrakoviště */}
      <AnimatedSection id="vrakov" className="bg-gray-900">
        <div className="text-center text-white">
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
            ].map((item) => (
              <motion.div
                key={item}
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 bg-white/10 rounded-xl p-4"
              >
                <span className="text-xl mt-0.5">&#10003;</span>
                <span className="text-lg font-semibold">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 5. Provizní model */}
      <AnimatedSection id="commission" className="bg-white">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
            Provizní model
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-orange-50 rounded-2xl p-8 border-2 border-orange-200"
            >
              <div className="text-3xl mb-4">🚗</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Autobazary
              </h3>
              <div className="text-3xl font-extrabold text-orange-500 mb-4">
                0 Kč nákladů
              </div>
              <ul className="text-left space-y-3 text-gray-600">
                <li>
                  Provizi z prodeje platí <strong>kupující</strong>
                </li>
                <li>
                  Pro bazar: <strong>0 Kč náklady</strong>
                </li>
                <li>Bonus za zprostředkování financování</li>
              </ul>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-900 rounded-2xl p-8 text-white"
            >
              <div className="text-3xl mb-4">🔧</div>
              <h3 className="text-xl font-bold mb-4">Vrakoviště</h3>
              <div className="text-3xl font-extrabold text-orange-500 mb-4">
                85 % pro vás
              </div>
              <ul className="text-left space-y-3 text-gray-300">
                <li>
                  Provize CarMakléř: <strong>15 %</strong> z prodeje
                </li>
                <li>
                  Pro vrakoviště: <strong>85 %</strong> z každého prodeje
                </li>
                <li>Měsíční vyúčtování</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* 6. Naši partneři */}
      <AnimatedSection id="partners" className="bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Naši partneři
          </h2>
          <p className="text-lg text-gray-500 mb-12">
            Partneři po celé České republice
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { value: "50+", label: "Autobazarů" },
              { value: "20+", label: "Vrakovišť" },
              { value: "14", label: "Krajů" },
              { value: "150+", label: "Makléřů v síti" },
              { value: "2 500+", label: "Prodaných vozů" },
              { value: "98 %", label: "Spokojenost" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-orange-500">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 7. Další kroky */}
      <AnimatedSection id="steps" className="bg-white">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
            Další kroky
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-3xl mx-auto">
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
              <div key={step.num} className="flex items-center gap-4">
                {i > 0 && (
                  <div className="hidden sm:block text-3xl text-gray-300">
                    &rarr;
                  </div>
                )}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center bg-gray-50 rounded-xl px-6 py-6"
                >
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-3">
                    {step.num}
                  </div>
                  <span className="font-bold text-gray-900 mb-1">
                    {step.label}
                  </span>
                  <span className="text-xs text-gray-500 text-center">
                    {step.desc}
                  </span>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 8. Kontakt */}
      <AnimatedSection id="contact" className="bg-gray-900">
        <div className="text-center text-white">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-8">
            Pojďte do toho s námi
          </h2>

          {managerSlug && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto">
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
            className="inline-flex items-center gap-2 mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-colors no-underline"
          >
            Registrovat se jako partner &rarr;
          </a>

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
