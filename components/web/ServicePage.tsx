import { Card } from "@/components/ui/Card";
import { FAQ } from "@/components/web/FAQ";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";

export interface ServicePageProps {
  hero: {
    title: string;
    highlight?: string;
    subtitle: string;
  };
  steps: {
    icon: string;
    title: string;
    description: string;
  }[];
  benefits: {
    icon: string;
    title: string;
    description: string;
  }[];
  cta?: React.ReactNode;
  faq: {
    question: string;
    answer: string;
  }[];
  breadcrumbLabel?: string;
}

export function ServicePage({
  hero,
  steps,
  benefits,
  cta,
  faq,
  breadcrumbLabel,
}: ServicePageProps) {
  // Split title around highlight if provided
  const renderTitle = () => {
    if (!hero.highlight) {
      return <>{hero.title}</>;
    }
    const idx = hero.title.indexOf(hero.highlight);
    if (idx === -1) {
      return <>{hero.title}</>;
    }
    const before = hero.title.slice(0, idx);
    const after = hero.title.slice(idx + hero.highlight.length);
    return (
      <>
        {before}
        <span className="text-orange-500">{hero.highlight}</span>
        {after}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-10 sm:gap-16 md:gap-24 pb-12 sm:pb-16 md:pb-24">
      {breadcrumbLabel && (
        <Breadcrumbs
          items={[
            { label: "Domů", href: "/" },
            { label: "Služby", href: "/chci-prodat" },
            { label: breadcrumbLabel },
          ]}
        />
      )}
      {/* HERO */}
      <section className="max-w-6xl mx-auto w-full px-4 pt-6 sm:pt-8 md:pt-12">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 sm:p-8 md:p-12 lg:p-16 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-200/20 rounded-full blur-2xl" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              {renderTitle()}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* STEPS — Jak to funguje */}
      <section className="max-w-6xl mx-auto w-full px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-4">
          Jak to funguje
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Jednoduchý proces ve 3 krocích
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <Card key={i} className="p-5 sm:p-8 text-center relative">
              <div className="absolute top-4 left-4 text-6xl font-extrabold text-orange-100 select-none">
                {i + 1}
              </div>
              <div className="text-4xl mb-4 relative">{step.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 relative">
                {step.title}
              </h3>
              <p className="text-[15px] text-gray-500 relative">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="max-w-6xl mx-auto w-full px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-4">
          Proč zvolit nás
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Výhody, které jinde nenajdete
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {benefits.map((benefit) => (
            <Card key={benefit.title} hover className="p-5 sm:p-8 flex gap-4 sm:gap-5">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{benefit.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {benefit.title}
                </h3>
                <p className="text-[15px] text-gray-500 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      {cta && (
        <section className="w-full bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 md:py-16">
          <div className="max-w-2xl mx-auto px-4">{cta}</div>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-3xl mx-auto w-full px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-4">
          Časté dotazy
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Odpovědi na nejčastější otázky
        </p>
        <FAQ items={faq} />
      </section>
    </div>
  );
}
