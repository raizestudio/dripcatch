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
const t = await getTranslations({ locale, namespace: 'Privacy' });
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dripcatch.eu';

return{
  title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: `${baseUrl}/${locale}/privacy`,
      languages: {
        'en': `${baseUrl}/en/privacy`,
        'fr': `${baseUrl}/fr/privacy`,
      },
    },
  }

};

export default async function TermsPage({params}:Props){
  const {locale} =await(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Privacy' });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 transition-colors selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">

        {/* Header Badge & Title */}
        <div className="mb-8 max-w-4xl">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100 dark:bg-zinc-800 rounded-full">
            {t('header.badge')}
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

          {/* Standardized legal layout matching /[locale]/terms */}
          <article className="lg:col-span-8 max-w-none prose prose-zinc dark:prose-invert">
            <section id="introduction" className="mb-8 lg:mb-4">
              <h2>{t('sections.introduction.title')}</h2>
              <p>
                {t('sections.introduction.p1')}{' '}
                <a href="mailto:contact@dripcatch.eu">contact@dripcatch.eu</a>.
              </p>
              <p>{t('sections.introduction.p2')}</p>
            </section>

            <section id="zero-bank" className="mb-8 lg:mb-4">
              <h2>{t('sections.zeroBank.title')}</h2>
              <p>{t('sections.zeroBank.p1')}</p>
              <p>{t('sections.zeroBank.p2')}</p>
              <p>{t('sections.zeroBank.p3')}</p>
            </section>

            <section id="information-collected" className="mb-8 lg:mb-4">
              <h2>{t('sections.informationCollected.title')}</h2>
              <p>{t('sections.informationCollected.intro')}</p>
              <ul>
                <li>
                  <strong>{t('sections.informationCollected.bullet1Label')}</strong>{' '}
                  {t('sections.informationCollected.bullet1Text')}
                </li>
                <li>
                  <strong>{t('sections.informationCollected.bullet2Label')}</strong>{' '}
                  {t('sections.informationCollected.bullet2Text')}
                </li>
                <li>
                  <strong>{t('sections.informationCollected.bullet3Label')}</strong>{' '}
                  {t('sections.informationCollected.bullet3Text')}
                </li>
              </ul>
            </section>

            <section id="data-usage" className="mb-8 lg:mb-4">
              <h2>{t('sections.dataUsage.title')}</h2>
              <p>{t('sections.dataUsage.intro')}</p>
              <ul>
                <li>{t('sections.dataUsage.bullet1')}</li>
                <li>{t('sections.dataUsage.bullet2')}</li>
                <li>{t('sections.dataUsage.bullet3')}</li>
              </ul>
            </section>

            <section id="retention-rights" className="mb-8 lg:mb-4">
              <h2>{t('sections.retentionRights.title')}</h2>
              <ul>
                <li>
                  <strong>{t('sections.retentionRights.bullet1Label')}</strong>{' '}
                  {t('sections.retentionRights.bullet1Text')}
                </li>
                <li>
                  <strong>{t('sections.retentionRights.bullet2Label')}</strong>{' '}
                  {t('sections.retentionRights.bullet2Text')}
                </li>
              </ul>
            </section>

            <section id="subprocessors" className="mb-8 lg:mb-4">
              <h2>{t('sections.subprocessors.title')}</h2>
              <p>{t('sections.subprocessors.intro')}</p>
              <ul>
                <li>
                  <strong>{t('sections.subprocessors.bullet1Label')}</strong>{' '}
                  {t('sections.subprocessors.bullet1Text')}
                </li>
                <li>
                  <strong>{t('sections.subprocessors.bullet2Label')}</strong>{' '}
                  {t('sections.subprocessors.bullet2Text')}
                </li>
              </ul>
            </section>
          </article>

          {/* Sticky table of contents on desktop */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-8 space-y-4 border-l border-zinc-200 dark:border-zinc-800 pl-6">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {t('header.tocTitle')}
            </h3>

            <nav className="flex flex-col space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <a href="#introduction" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                {t('nav.introduction')}
              </a>
              <a href="#zero-bank" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                {t('nav.zeroBank')}
              </a>
              <a href="#information-collected" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                {t('nav.informationCollected')}
              </a>
              <a href="#data-usage" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                {t('nav.dataUsage')}
              </a>
              <a href="#retention-rights" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                {t('nav.retentionRights')}
              </a>
              <a href="#subprocessors" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                {t('nav.subprocessors')}
              </a>
            </nav>
          </aside>

        </div>
      </div>
    </div>
  );
}
