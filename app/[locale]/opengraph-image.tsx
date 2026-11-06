import { ImageResponse } from "next/og";

export const alt = "DripCatch — Subscription & Shared Expense Tracker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isFrench = locale === "fr";

  const headline = isFrench
    ? "Maîtrisez vos abonnements. Partagez équitablement."
    : "Stop subscription bleed. Split costs fairly.";

  const subline = isFrench
    ? "Suivez vos dépenses récurrentes, éliminez les abonnements oubliés et partagez le coût réel avec vos proches."
    : "Track recurring expenses, eliminate forgotten zombie subs, and split real net costs with friends.";

  const card1 = {
    tag: isFrench ? "Partage Équitable" : "Shared Splits",
    desc: isFrench ? "Chacun ne voit que sa part" : "Everyone only tracks their share",
  };
  const card2 = {
    tag: isFrench ? "Détection Zombie" : "Zombie Detection",
    desc: isFrench ? "Flaggez les services inutilisés" : "Flag and cut unused services",
  };
  const card3 = {
    tag: isFrench ? "Alerte Hausse" : "Price Hike Alerts",
    desc: isFrench ? "Détectez les hausses discrètes" : "Catch stealth cost increases",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          padding: "60px 70px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle radial emerald background glow */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            left: "-150px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(9, 9, 11, 0) 70%)",
          }}
        />

        {/* Top Header: Brand + Domain Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              {/* Flame SVG */}
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "30px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.5px",
              }}
            >
              DripCatch
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#a1a1aa",
              fontSize: "15px",
              fontWeight: 500,
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
              }}
            />
            dripcatch.eu
          </div>
        </div>

        {/* Center: Hero Typography */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "960px",
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "#a1a1aa",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {subline}
          </p>
        </div>

        {/* Bottom: Feature Cards */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            width: "100%",
            zIndex: 10,
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "20px 22px",
              backgroundColor: "rgba(24, 24, 27, 0.75)",
              border: "1px solid rgba(39, 39, 42, 0.8)",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: "#10b981",
                  fontSize: "15px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {card1.tag}
              </span>
            </div>
            <span style={{ color: "#71717a", fontSize: "14px" }}>
              {card1.desc}
            </span>
          </div>

          {/* Card 2 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "20px 22px",
              backgroundColor: "rgba(24, 24, 27, 0.75)",
              border: "1px solid rgba(39, 39, 42, 0.8)",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: "#f59e0b",
                  fontSize: "15px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {card2.tag}
              </span>
            </div>
            <span style={{ color: "#71717a", fontSize: "14px" }}>
              {card2.desc}
            </span>
          </div>

          {/* Card 3 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "20px 22px",
              backgroundColor: "rgba(24, 24, 27, 0.75)",
              border: "1px solid rgba(39, 39, 42, 0.8)",
              borderRadius: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: "#f43f5e",
                  fontSize: "15px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {card3.tag}
              </span>
            </div>
            <span style={{ color: "#71717a", fontSize: "14px" }}>
              {card3.desc}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
