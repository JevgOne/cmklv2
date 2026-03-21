import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "O nás",
  description:
    "CarMakléř — nová éra prodeje aut v Česku. 186 certifikovaných makléřů, 1 247 vozidel, 920+ spokojených klientů.",
  openGraph: {
    title: "O nás | CarMakléř",
    description:
      "186 certifikovaných makléřů, 1 247 vozidel, 920+ spokojených klientů. Poznejte náš příběh.",
  },
};

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

const stats = [
  { value: "186", label: "makléřů" },
  { value: "1 247", label: "vozidel" },
  { value: "920+", label: "spokojených klientů" },
  { value: "14 dní", label: "průměrná doba prodeje" },
];

const team = [
  {
    initials: "JC",
    name: "Jan Carmak",
    position: "CEO & Zakladatel",
    bio: "Vizionář s 15letou zkušeností v automobilovém průmyslu. Založil CarMakléř s cílem změnit způsob, jakým se v Česku prodávají auta.",
  },
  {
    initials: "PT",
    name: "Petr Tech",
    position: "CTO",
    bio: "Technologický nadšenec, který stojí za vývojem celé platformy. Dříve vedl vývoj v několika českých startupech.",
  },
  {
    initials: "EM",
    name: "Eva Manažerová",
    position: "COO",
    bio: "Zajišťuje hladký chod operací a rozvoj makléřské sítě. Má za sebou 10 let v managementu služeb.",
  },
  {
    initials: "MP",
    name: "Martin Prodej",
    position: "Head of Sales",
    bio: "Vede obchodní tým a stará se o spokojenost klientů. Jeho tým dosahuje průměrného hodnocení 4.8 z 5.",
  },
];

const values = [
  {
    icon: "🔍",
    title: "Transparentnost",
    desc: "Každý krok procesu je přehledný a srozumitelný. Žádné skryté poplatky, žádná překvapení.",
  },
  {
    icon: "🛡️",
    title: "Bezpečnost",
    desc: "Každé vozidlo prochází důkladnou prověrkou. Chráníme prodejce i kupující před podvody.",
  },
  {
    icon: "⚡",
    title: "Rychlost",
    desc: "Průměrná doba prodeje 14 dní. Díky technologiím a síti makléřů prodáváme rychleji než kdokoliv jiný.",
  },
  {
    icon: "🎯",
    title: "Profesionalita",
    desc: "Certifikovaní makléři s pravidelnými školeními. Každý klient dostane prémiový servis.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ONasPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-12 sm:py-16 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Nová éra prodeje aut v Česku
          </h1>
          <p className="text-white/60 mt-5 text-lg max-w-2xl mx-auto">
            Spojujeme technologie s osobním přístupem certifikovaných makléřů po celé České republice.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 mb-6">
            Náš příběh
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            CarMakléř vznikl z jednoduché myšlenky — prodej i nákup auta by měl být jednoduchý, bezpečný a férový.
            Viděli jsme, jak se lidé trápí s inzeráty, podvodníky a nekonečným papírováním. Proto jsme vytvořili
            platformu, která spojuje ty nejlepší makléře s klienty, kteří si zaslouží prémiový servis.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Dnes máme síť 186 certifikovaných makléřů po celé ČR, kteří každý den pomáhají lidem prodávat a kupovat
            auta bez stresu. Naše technologie — od prověrky vozidel po mobilní aplikaci pro makléře — zajišťují,
            že celý proces je transparentní, rychlý a bezpečný.
          </p>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 text-center">
                <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-500 mt-2">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Náš tým
            </h2>
            <p className="text-gray-500 mt-2">Lidé, kteří stojí za CarMakléř</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((person) => (
              <Card key={person.name} hover className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl font-extrabold text-white mx-auto">
                  {person.initials}
                </div>
                <h3 className="font-bold text-gray-900 mt-4">{person.name}</h3>
                <p className="text-sm text-orange-500 font-semibold mt-1">
                  {person.position}
                </p>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                  {person.bio}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Naše hodnoty
            </h2>
            <p className="text-gray-500 mt-2">Na čem stavíme každý den</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} hover className="p-6">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mb-4">
                  {value.icon}
                </div>
                <h3 className="font-bold text-gray-900">{value.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {value.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
