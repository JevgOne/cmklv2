"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";

type ReviewType = "prodejce" | "kupujici";

interface Review {
  stars: number;
  quote: string;
  name: string;
  city: string;
  date: string;
  type: ReviewType;
}

const reviews: Review[] = [
  {
    stars: 5,
    quote: "Prodej proběhl hladce a rychle. Auto bylo prodané za 12 dní za cenu, která mě příjemně překvapila. Makléř se o vše postaral od fotek po převod.",
    name: "Jana K.",
    city: "Praha",
    date: "12. 2. 2026",
    type: "prodejce",
  },
  {
    stars: 5,
    quote: "Konečně někdo, kdo se o všechno postará. Nemusel jsem řešit nic — od fotek po převod. Doporučuji všem, kdo nechtějí ztrácet čas s prodejem.",
    name: "Martin D.",
    city: "Brno",
    date: "8. 2. 2026",
    type: "prodejce",
  },
  {
    stars: 5,
    quote: "Makléř byl profesionální, vždy dostupný. Auto jsem koupil s jistotou, že je prověřené a vše je v pořádku. Skvělá zkušenost.",
    name: "Tomáš H.",
    city: "Ostrava",
    date: "1. 2. 2026",
    type: "kupujici",
  },
  {
    stars: 4,
    quote: "Spokojený s celým procesem. Jediné, co bych vytknul, je delší čekání na odpověď přes víkend, ale jinak bezproblémové.",
    name: "Eva S.",
    city: "Plzeň",
    date: "25. 1. 2026",
    type: "kupujici",
  },
  {
    stars: 5,
    quote: "Auto prodané za 10 dní, skvělá cena. Makléř byl proaktivní, sám zajistil zájemce a domluvil prohlídky. Žádný stres.",
    name: "Pavel K.",
    city: "Liberec",
    date: "20. 1. 2026",
    type: "prodejce",
  },
  {
    stars: 5,
    quote: "Prověrka vozu mě ušetřila od špatného nákupu. Zjistilo se, že auto mělo stočený tachometr. Díky CarMakléř jsem se vyhnul problémům.",
    name: "Marie L.",
    city: "Olomouc",
    date: "15. 1. 2026",
    type: "kupujici",
  },
  {
    stars: 4,
    quote: "Rychlá komunikace, férové jednání. Auto se prodalo za rozumnou cenu a bez komplikací. Příště zase přes CarMakléř.",
    name: "Jiří N.",
    city: "Hradec Králové",
    date: "10. 1. 2026",
    type: "prodejce",
  },
  {
    stars: 5,
    quote: "Doporučuji každému, kdo chce prodat auto bez stresu. Makléř zvládl vše perfektně — od inzerce přes prohlídky až po předání.",
    name: "Lucie V.",
    city: "České Budějovice",
    date: "5. 1. 2026",
    type: "prodejce",
  },
];

const tabs = [
  { value: "all", label: "Všechny" },
  { value: "prodejce", label: "Prodejci" },
  { value: "kupujici", label: "Kupující" },
];

/* ------------------------------------------------------------------ */
/*  Stars helper                                                       */
/* ------------------------------------------------------------------ */

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < count ? "text-orange-400" : "text-gray-200"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RecenzePage() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? reviews
      : reviews.filter((r) => r.type === filter);

  return (
    <main>
      {/* Header */}
      <section className="py-10 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
            Co o nás říkají klienti
          </h1>
          <p className="text-gray-500 mt-4 text-lg">
            {(reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)} z 5 ★ · {reviews.length} recenzí
          </p>
        </div>
      </section>

      {/* Filter + Reviews */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs filter */}
          <div className="flex justify-center mb-10">
            <Tabs
              tabs={tabs}
              defaultTab="all"
              onTabChange={(val) => setFilter(val)}
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filtered.map((review, index) => (
              <Card key={index} hover className="p-6">
                <Stars count={review.stars} />
                <p className="text-gray-700 italic leading-relaxed mt-4">
                  &ldquo;{review.quote}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-gray-900 text-sm">
                      {review.name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      , {review.city} · {review.date}
                    </span>
                  </div>
                  <Badge variant={review.type === "prodejce" ? "verified" : "new"}>
                    {review.type === "prodejce" ? "Ověřený prodej" : "Ověřený nákup"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <a href="mailto:info@carmakler.cz?subject=Recenze%20CarMakl%C3%A9%C5%99" className="no-underline">
              <Button variant="primary" size="lg">
                Napište nám recenzi
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Cross-linking */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <Link href="/chci-prodat" className="no-underline block">
              <Card hover className="p-8 text-center h-full">
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                  Chcete prodat auto?
                </h2>
                <p className="text-sm text-gray-500">
                  Přidejte se ke spokojeným klientům. Průměrná doba prodeje 20 dní, férová cena.
                </p>
                <span className="inline-block mt-4 text-orange-500 font-semibold text-sm">
                  Prodat auto přes makléře &rarr;
                </span>
              </Card>
            </Link>
            <Link href="/makleri" className="no-underline block">
              <Card hover className="p-8 text-center h-full">
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                  Najděte svého makléře
                </h2>
                <p className="text-sm text-gray-500">
                  Vyberte si z naší sítě ověřených makléřů po celé ČR.
                </p>
                <span className="inline-block mt-4 text-orange-500 font-semibold text-sm">
                  Zobrazit ověřené makléře &rarr;
                </span>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
