"use client";

import { cn } from "@/lib/utils";

const sections = [
  {
    id: "who",
    bg: "bg-gray-900",
    content: (
      <div className="text-center text-white">
        <img src="/brand/logo-color.png" alt="Carmakler" className="h-20 mx-auto mb-8 brightness-0 invert" />
        <h1 className="text-4xl sm:text-6xl font-extrabold mb-6">
          Sit certifikovanych<br />automakleru
        </h1>
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-12">
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-orange-500">50+</div>
            <div className="text-sm text-gray-400 mt-1">Makleru</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-orange-500">500+</div>
            <div className="text-sm text-gray-400 mt-1">Prodanych aut</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-orange-500">30+</div>
            <div className="text-sm text-gray-400 mt-1">Partneru</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "how",
    bg: "bg-white",
    content: (
      <div className="text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
          Jak to funguje
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: "📋", title: "Nabirani", desc: "Makler nabere vuz, provede inspekci a fotodokumentaci" },
            { icon: "🌐", title: "Inzerce", desc: "Vuz se publikuje na Carmakler i dalsi portaly" },
            { icon: "🤝", title: "Prodej", desc: "Makler domlivi prodej, Carmakler zajisti platbu" },
          ].map((step) => (
            <div key={step.title} className="flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "bazar",
    bg: "bg-orange-500",
    content: (
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
            <div key={item} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
              <span className="text-xl mt-0.5">✅</span>
              <span className="text-lg font-semibold">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "vrakov",
    bg: "bg-gray-900",
    content: (
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
            <div key={item} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
              <span className="text-xl mt-0.5">✅</span>
              <span className="text-lg font-semibold">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "commission",
    bg: "bg-white",
    content: (
      <div className="text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
          Provizni model
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-orange-50 rounded-2xl p-8">
            <div className="text-3xl mb-4">🚗</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Autobazary</h3>
            <ul className="text-left space-y-3 text-gray-600">
              <li>• Provizi z prodeje plati <strong>kupujici</strong></li>
              <li>• Pro bazar: <strong>0 Kc naklady</strong></li>
              <li>• Bonus za zprostredkovani financovani</li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Vrakoviste</h3>
            <ul className="text-left space-y-3 text-gray-600">
              <li>• Provize Carmakler: <strong>15%</strong> z prodeje</li>
              <li>• Pro vrakoviste: <strong>85%</strong> z kazdeho prodeje</li>
              <li>• Mesicni vyuctovani</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "partners",
    bg: "bg-gray-50",
    content: (
      <div className="text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          Nasi partneri
        </h2>
        <p className="text-lg text-gray-500 mb-8">
          Partneri po cele Ceske republice
        </p>
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-orange-500">14</div>
            <div className="text-sm text-gray-400 mt-1">Kraju</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-orange-500">200+</div>
            <div className="text-sm text-gray-400 mt-1">Partneru v DB</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-orange-500">30+</div>
            <div className="text-sm text-gray-400 mt-1">Aktivnich</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "steps",
    bg: "bg-white",
    content: (
      <div className="text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12">
          Dalsi kroky
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-3xl mx-auto">
          {[
            { num: "1", label: "Podpiseme smlouvu" },
            { num: "2", label: "Nastavime profil" },
            { num: "3", label: "Do tydne jste online" },
          ].map((step, i) => (
            <div key={step.num} className="flex items-center gap-4">
              {i > 0 && (
                <div className="hidden sm:block text-3xl text-gray-300">→</div>
              )}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-6 py-4">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <span className="font-semibold text-gray-900">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "contact",
    bg: "bg-gray-900",
    content: (
      <div className="text-center text-white">
        <h2 className="text-3xl sm:text-5xl font-extrabold mb-8">
          Pojdte do toho s nami
        </h2>
        <div className="max-w-md mx-auto bg-white/10 rounded-2xl p-8">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-lg mb-6">
            Kontaktujte nas a zacneme spolupracovat
          </p>
          <div className="space-y-3 text-left">
            <div className="flex gap-3 items-center">
              <span>📧</span>
              <span className="font-semibold">partneri@carmakler.cz</span>
            </div>
            <div className="flex gap-3 items-center">
              <span>📞</span>
              <span className="font-semibold">+420 800 123 456</span>
            </div>
            <div className="flex gap-3 items-center">
              <span>🌐</span>
              <span className="font-semibold">carmakler.cz</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function PrezentacePage() {
  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={cn(
            "h-screen snap-start flex items-center justify-center px-6 sm:px-12",
            section.bg
          )}
        >
          <div className="w-full max-w-5xl">{section.content}</div>
        </section>
      ))}

      {/* Progress dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="w-3 h-3 rounded-full bg-white/30 hover:bg-white/60 transition-all block"
          />
        ))}
      </div>
    </div>
  );
}
