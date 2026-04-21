"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CareerForm } from "@/components/web/CareerForm";

const benefits = [
  {
    icon: "🕐",
    title: "Pracujte kdy a kde chcete",
    desc: "Jste svým vlastním šéfem. Řídíte si čas, klienty i pracovní tempo. Žádná kancelář, žádné směny.",
  },
  {
    icon: "💰",
    title: "Výdělek bez stropu",
    desc: "Provize 5 % z každého prodeje. Čím víc prodáte, tím víc vyděláte. Průměrný makléř vydělá 40–80 000 Kč měsíčně.",
  },
  {
    icon: "📱",
    title: "Technologie, která vám usnadní práci",
    desc: "Mobilní aplikace pro správu vozidel, komunikaci s klienty, smlouvy a sledování provizí — vše v telefonu.",
  },
  {
    icon: "🎓",
    title: "Naučíme vás vše, co potřebujete",
    desc: "Vstupní školení, mentoring od zkušených makléřů a průběžná podpora. Předchozí zkušenosti nejsou nutné.",
  },
];

const positions = [
  {
    title: "Automakléř",
    location: "Praha",
    desc: "Pomáhejte klientům s prodejem a nákupem vozidel. Zajišťujte kompletní servis od prvního kontaktu po předání klíčů.",
  },
  {
    title: "Automakléř",
    location: "Brno",
    desc: "Pomáhejte klientům s prodejem a nákupem vozidel. Zajišťujte kompletní servis od prvního kontaktu po předání klíčů.",
  },
  {
    title: "Regionální manažer",
    location: "Celá ČR",
    desc: "Řiďte tým makléřů a rozvíjejte region. Zodpovídejte za výkon, kvalitu služeb a růst v přiděleném regionu.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function KarieraPage() {
  return (
    <main>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-orange-500 transition-colors no-underline">Domů</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Kariéra</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-12 sm:py-16 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Staňte se automakléřem
          </h1>
          <p className="text-white/60 mt-5 text-lg max-w-2xl mx-auto">
            Pomáhejte lidem prodat auto za nejvyšší cenu. Pracujte flexibilně, vydělejte bez stropu a buďte součástí rostoucí sítě.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Proč pracovat s CarMakléřem?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} hover className="p-6">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-gray-900">{benefit.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {benefit.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Otevřené pozice
            </h2>
            <p className="text-gray-500 mt-2">Vyberte si pozici, která vám sedí</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {positions.map((pos, i) => (
              <Card key={i} hover className="p-6 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900">{pos.title}</h3>
                <Badge variant="default" className="self-start mt-2">
                  📍 {pos.location}
                </Badge>
                <p className="text-sm text-gray-500 mt-4 leading-relaxed flex-1">
                  {pos.desc}
                </p>
                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="default"
                    onClick={() => {
                      const el = document.getElementById("kariera-form");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    Mám zájem
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Máte zájem? Napište nám
            </h2>
            <p className="text-gray-500 mt-2">
              Vyplňte formulář a my se vám ozveme
            </p>
          </div>

          <div id="kariera-form">
            <CareerForm />
          </div>
        </div>
      </section>

      {/* Cross-linking */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6 text-center">
            Zjistěte více o CarMakléři
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Link href="/o-nas" className="no-underline block">
              <Card hover className="p-6 text-center h-full">
                <h3 className="font-bold text-gray-900 mb-2">O nás</h3>
                <p className="text-sm text-gray-500">Kdo jsme a jak fungujeme</p>
                <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">Více o firmě &rarr;</span>
              </Card>
            </Link>
            <Link href="/makleri" className="no-underline block">
              <Card hover className="p-6 text-center h-full">
                <h3 className="font-bold text-gray-900 mb-2">Naši makléři</h3>
                <p className="text-sm text-gray-500">Seznamte se s týmem</p>
                <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">Zobrazit makléře &rarr;</span>
              </Card>
            </Link>
            <Link href="/kontakt" className="no-underline block">
              <Card hover className="p-6 text-center h-full">
                <h3 className="font-bold text-gray-900 mb-2">Kontakt</h3>
                <p className="text-sm text-gray-500">Máte dotaz? Ozvěte se nám</p>
                <span className="inline-block mt-3 text-orange-500 font-semibold text-sm">Kontaktovat nás &rarr;</span>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
