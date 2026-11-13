import type { Metadata } from "next";
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { CurrentYear } from '@/app/components/ui/current-year';

export const instant = false;

type Props = {
  params: Promise<{locale:string}>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
const {locale} = await params;
const t = await getTranslations({ locale, namespace: 'Terms' });
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dripcatch.eu';

return{
  title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: `${baseUrl}/${locale}/terms`,
      languages: {
        'en': `${baseUrl}/en/terms`,
        'fr': `${baseUrl}/fr/terms`,
      },
    },
  }

};

export default async function TermsPage({params}:Props){
  const {locale} =await(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Terms' });

  return(
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">

        {/* Header Badge & Title */}
        <div className="mb-8 max-w-4xl">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100 dark:bg-zinc-800 rounded-full">
            Legal
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {t('header.title')}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {t('header.lastUpdated')} <CurrentYear />
          </p>
        </div>

    {/* Main Layout: Legal Content + Sticky Table of Contents */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

      {/* Standardized legal layout matching /[locale]/privacy */}
      <article className="lg:col-span-8 max-w-none prose prose-zinc dark:prose-invert">
        <section id="acceptance" className="mb-8 lg:mb-4">
          <h2>{t('sections.acceptance.title')}</h2>
          <p>
          {t('sections.acceptance.content')}{' '}
          <a href="mailto:contact@dripcatch.eu">contact@dripcatch.eu</a>.
          </p>
        </section>

        <section id="description" className="mb-8 lg:mb-4">
          <h2>{t('sections.description.title')}</h2>
          <p>
          {t('sections.description.p1')}
          </p>
          <p>
          <strong>{t('sections.description.clarificationTitle')}</strong> {t('sections.description.clarificationText')}
          </p>
        </section>

        <section id="shared-subscriptions" className="mb-8 lg:mb-4">
              <h2>{t('sections.sharedSubscriptions.title')}</h2>
              <p>{t('sections.sharedSubscriptions.intro')}</p>
              <ul>
                <li><strong>Zero Fund Processing:</strong> {t('sections.sharedSubscriptions.bullet1').replace('Zero Fund Processing: ', '')}</li>
                <li>{t('sections.sharedSubscriptions.bullet2')}</li>
                <li>{t('sections.sharedSubscriptions.bullet3')}</li>
              </ul>
            </section>

            <section id="accounts" className="mb-8 lg:mb-4">
              <h2>{t('sections.accounts.title')}</h2>
              <p>{t('sections.accounts.content')}</p>
            </section>

            <section id="acceptable-use" className="mb-8 lg:mb-4">
              <h2>{t('sections.acceptableUse.title')}</h2>
              <p>{t('sections.acceptableUse.intro')}</p>
              <ul>
                <li>{t('sections.acceptableUse.bullet1')}</li>
                <li>{t('sections.acceptableUse.bullet2')}</li>
              </ul>
            </section>

            <section id="warranties" className="mb-8 lg:mb-4">
              <h2>{t('sections.warranties.title')}</h2>
              <p>{t('sections.warranties.content')}</p>
            </section>

            <section id="liability" className="mb-8 lg:mb-4">
              <h2>{t('sections.liability.title')}</h2>
              <p>{t('sections.liability.content')}</p>
            </section>

            <section id="termination" className="mb-8 lg:mb-4">
              <h2>{t('sections.termination.title')}</h2>
              <p>{t('sections.termination.content')}</p>
            </section>

            <section id="governing-law" className="mb-8 lg:mb-4">
              <h2>{t('sections.governingLaw.title')}</h2>
              <p>{t('sections.governingLaw.content')}</p>
            </section>
      </article>

      {/* Sticky table of contents on desktop (hidden lg:block) */}
      <aside className="hidden lg:block lg:col-span-4 sticky top-8 space-y-4 border-l border-zinc-200 dark:border-zinc-800 pl-6">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
        {t('header.tocTitle')}
        </h3>

        <nav className="flex flex-col space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <a href="#acceptance" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.acceptance')}</a>
              <a href="#description" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.description')}</a>
              <a href="#shared-subscriptions" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.sharedSubscriptions')}</a>
              <a href="#accounts" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.accounts')}</a>
              <a href="#acceptable-use" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.acceptableUse')}</a>
              <a href="#warranties" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.warranties')}</a>
              <a href="#liability" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.liability')}</a>
              <a href="#termination" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.termination')}</a>
              <a href="#governing-law" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">{t('nav.governingLaw')}</a>
        </nav>
      </aside>

    </div>
  </div>
  </div>
  )
}
