"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

interface Broker {
  name: string;
  initials: string;
  region: string;
  badges: Array<"top" | "default" | "verified">;
  badgeLabels: string[];
  rating: string;
  sales: string;
  avgDays: string;
  slug: string;
}

const brokers: Broker[] = [
  {
    name: "Jan Novák",
    initials: "JN",
    region: "Praha",
    badges: ["top", "default"],
    badgeLabels: ["⭐ TOP Makléř", "⚡ Rychlá reakce"],
    rating: "4.9",
    sales: "156",
    avgDays: "14",
    slug: "jan-novak-praha",
  },
  {
    name: "Petra Malá",
    initials: "PM",
    region: "Brno",
    badges: ["top"],
    badgeLabels: ["⭐ TOP Makléř"],
    rating: "4.7",
    sales: "98",
    avgDays: "18",
    slug: "petra-mala-brno",
  },
  {
    name: "Karel Dvořák",
    initials: "KD",
    region: "Ostrava",
    badges: ["default"],
    badgeLabels: ["⚡ Rychlá reakce"],
    rating: "4.8",
    sales: "124",
    avgDays: "12",
    slug: "karel-dvorak-ostrava",
  },
  {
    name: "Eva Svobodová",
    initials: "ES",
    region: "Plzeň",
    badges: ["verified"],
    badgeLabels: ["✓ Ověřený"],
    rating: "4.6",
    sales: "67",
    avgDays: "22",
    slug: "eva-svobodova-plzen",
  },
  {
    name: "Tomáš Horák",
    initials: "TH",
    region: "Liberec",
    badges: ["top"],
    badgeLabels: ["⭐ TOP Makléř"],
    rating: "4.9",
    sales: "89",
    avgDays: "16",
    slug: "tomas-horak-liberec",
  },
  {
    name: "Marie Černá",
    initials: "MČ",
    region: "Olomouc",
    badges: ["verified"],
    badgeLabels: ["✓ Ověřený"],
    rating: "4.5",
    sales: "45",
    avgDays: "20",
    slug: "marie-cerna-olomouc",
  },
  {
    name: "Pavel Kříž",
    initials: "PK",
    region: "České Budějovice",
    badges: ["default"],
    badgeLabels: ["⚡ Rychlá reakce"],
    rating: "4.7",
    sales: "78",
    avgDays: "15",
    slug: "pavel-kriz-ceske-budejovice",
  },
  {
    name: "Lucie Nová",
    initials: "LN",
    region: "Hradec Králové",
    badges: ["verified"],
    badgeLabels: ["✓ Ověřený"],
    rating: "4.4",
    sales: "34",
    avgDays: "25",
    slug: "lucie-nova-hradec-kralove",
  },
  {
    name: "Jiří Procházka",
    initials: "JP",
    region: "Pardubice",
    badges: ["top", "default"],
    badgeLabels: ["⭐ TOP Makléř", "⚡ Rychlá reakce"],
    rating: "4.8",
    sales: "112",
    avgDays: "13",
    slug: "jiri-prochazka-pardubice",
  },
];

const cityOptions = [
  { value: "", label: "Všechna města" },
  { value: "Praha", label: "Praha" },
  { value: "Brno", label: "Brno" },
  { value: "Ostrava", label: "Ostrava" },
  { value: "Plzeň", label: "Plzeň" },
  { value: "Liberec", label: "Liberec" },
  { value: "Olomouc", label: "Olomouc" },
  { value: "České Budějovice", label: "České Budějovice" },
  { value: "Hradec Králové", label: "Hradec Králové" },
  { value: "Pardubice", label: "Pardubice" },
];

const specOptions = [
  { value: "", label: "Všechny specializace" },
  { value: "osobni", label: "Osobní" },
  { value: "suv", label: "SUV" },
  { value: "uzitkove", label: "Užitkové" },
  { value: "luxusni", label: "Luxusní" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MakleriPage() {
  const [city, setCity] = useState("");
  const [_spec, setSpec] = useState("");

  const filtered = city
    ? brokers.filter((b) => b.region === city)
    : brokers;

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Naši certifikovaní makléři
          </h1>
          <p className="text-white/60 mt-4 text-lg">
            186 makléřů po celé ČR
          </p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="sm:w-64">
              <Select
                options={cityOptions}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Všechna města"
              />
            </div>
            <div className="sm:w-64">
              <Select
                options={specOptions}
                value={_spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder="Všechny specializace"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((broker) => (
              <Link
                key={broker.slug}
                href={`/makler/${broker.slug}`}
                className="no-underline text-inherit"
              >
                <Card
                  hover
                  className="p-7 relative overflow-visible group h-full"
                >
                  {/* Orange top bar on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-t-2xl" />

                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-[60px] h-[60px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-[22px] font-extrabold text-white shrink-0">
                      {broker.initials}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {broker.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        📍 {broker.region}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-5">
                    {broker.badges.map((variant, i) => (
                      <Badge key={i} variant={variant}>
                        {broker.badgeLabels[i]}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-extrabold bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">
                        {broker.rating}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-500 mt-1">
                        Hodnocení
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-gray-900">
                        {broker.sales}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-500 mt-1">
                        Prodejů
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-gray-900">
                        {broker.avgDays}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-500 mt-1">
                        Dní &#x00D8;
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Žádní makléři nenalezeni
              </h3>
              <p className="text-gray-500 mt-2">
                Zkuste změnit filtry pro zobrazení výsledků.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
