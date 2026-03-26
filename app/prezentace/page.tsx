"use client";

import { useRef, Suspense } from "react";
import { motion, useInView } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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

const sectionIds = [
  "who",
  "how",
  "bazar",
  "vrakov",
  "commission",
  "partners",
  "steps",
  "contact",
];

function PrezentaceContent() {
  const searchParams = useSearchParams();
  const managerSlug = searchParams.get("manager");

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* 1. Kdo jsme */}
      <AnimatedSection id="who" className="bg-gray-900">
        <div className="text-center text-white">
          <img
            src="/brand/logo-color.png"
            alt="Carmakler"
            className="h-20 mx-auto mb-8 brightness-0 invert"
          />
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-6">
            Sit certifikovanych
            <br />
            <span className="text-orange-500">automakleru</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Propojujeme prodejce, autobazary a vrakoviste s tisici zajemcu o
            koupi vozidel a autodilu.
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-12">
            {[
              { value: "150+", label: "Makleru" },
              { value: "2 500+", label: "Prodanych aut" },
              { value: "50+", label: "Partneru" },
              { value: "14", label: "Kraju" },
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
                title: "Nabirani",
                desc: "Makler nabere vuz, provede inspekci a fotodokumentaci",
              },
              {
                icon: "🌐",
                title: "Inzerce",
                desc: "Vuz se publikuje na Carmakler i dalsi portaly",
              },
              {
                icon: "🤝",
                title: "Prodej",
                desc: "Makler domlvi prodej, Carmakler zajisti platbu",
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
              "Leads od kupujicich z cele CR",
              "Vetsi viditelnost vaseho sortimentu",
              "Badge 'Overeny partner Carmakler'",
              "Zadne naklady na start",
              "Provize jen z uspesneho prodeje",
              "Bonus za zprostredkovani financovani",
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

      {/* 4. Pro vrakoviste */}
      <AnimatedSection id="vrakov" className="bg-gray-900">
        <div className="text-center text-white">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-8">
            Pro vrakoviste
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            {[
              "Online prodej dilu bez vlastniho eshopu",
              "Objednavkovy system s trackingem",
              "Platby zajistene — penize na vas ucet",
              "Jednoduche pridavani dilu z mobilu",
              "85% z kazdeho prodeje pro vas",
              "Profesionalni profil na webu",
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

      {/* 5. Provizni model */}
      <AnimatedSection id="commission" className="bg-white">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
            Provizni model
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
                0 Kc nakladu
              </div>
              <ul className="text-left space-y-3 text-gray-600">
                <li>
                  Provizi z prodeje plati <strong>kupujici</strong>
                </li>
                <li>
                  Pro bazar: <strong>0 Kc naklady</strong>
                </li>
                <li>Bonus za zprostredkovani financovani</li>
              </ul>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gray-900 rounded-2xl p-8 text-white"
            >
              <div className="text-3xl mb-4">🔧</div>
              <h3 className="text-xl font-bold mb-4">Vrakoviste</h3>
              <div className="text-3xl font-extrabold text-orange-500 mb-4">
                85 % pro vas
              </div>
              <ul className="text-left space-y-3 text-gray-300">
                <li>
                  Provize Carmakler: <strong>15 %</strong> z prodeje
                </li>
                <li>
                  Pro vrakoviste: <strong>85 %</strong> z kazdeho prodeje
                </li>
                <li>Mesicni vyuctovani</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* 6. Nasi partneri */}
      <AnimatedSection id="partners" className="bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Nasi partneri
          </h2>
          <p className="text-lg text-gray-500 mb-12">
            Partneri po cele Ceske republice
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { value: "50+", label: "Autobazaru" },
              { value: "20+", label: "Vrakovist" },
              { value: "14", label: "Kraju" },
              { value: "150+", label: "Makleru v siti" },
              { value: "2 500+", label: "Prodanych vozu" },
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

      {/* 7. Dalsi kroky */}
      <AnimatedSection id="steps" className="bg-white">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
            Dalsi kroky
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-3xl mx-auto">
            {[
              {
                num: "1",
                label: "Podpiseme smlouvu",
                desc: "Jednoducha partnerska smlouva bez skrytych zavazku.",
              },
              {
                num: "2",
                label: "Nastavime profil",
                desc: "Pomuzeme vam vytvorit profil a nahrat prvni vozidla ci dily.",
              },
              {
                num: "3",
                label: "Do tydne jste online",
                desc: "Vase nabidka bude viditelna tisicum zajemcu.",
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
            Pojdte do toho s nami
          </h2>

          {managerSlug && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto">
              <div className="text-sm text-gray-400 mb-1">
                Vas kontaktni manazer
              </div>
              <div className="text-xl font-bold text-orange-500">
                {managerSlug
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
            </div>
          )}

          <div className="max-w-md mx-auto bg-white/10 rounded-2xl p-8">
            <div className="text-5xl mb-4">🤝</div>
            <p className="text-lg mb-6">
              Kontaktujte nas a zacneme spolupracovat
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
                href="tel:+420800123456"
                className="flex gap-3 items-center hover:text-orange-400 transition-colors no-underline text-white"
              >
                <span>📞</span>
                <span className="font-semibold">+420 800 123 456</span>
              </a>
              <div className="flex gap-3 items-center">
                <span>🌐</span>
                <span className="font-semibold">carmakler.cz</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-8">
            &copy; {new Date().getFullYear()} Carmakler s.r.o. Vsechna prava
            vyhrazena.
          </p>
        </div>
      </AnimatedSection>

      {/* Progress dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {sectionIds.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="w-3 h-3 rounded-full bg-white/30 hover:bg-white/60 transition-all block"
          />
        ))}
      </div>
    </div>
  );
}

export default function PrezentacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-pulse text-white text-xl">Nacitam...</div>
        </div>
      }
    >
      <PrezentaceContent />
    </Suspense>
  );
}
