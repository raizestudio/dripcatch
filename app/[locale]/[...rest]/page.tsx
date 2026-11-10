import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import NotFound from "../not-found";

export default function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense>
      <CatchAllContent params={params} />
    </Suspense>
  );
}

async function CatchAllContent({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NotFound />;
}
