import { ImageResponse } from "next/og";

import { getBuilderPageData } from "@/lib/builderPageData";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import { inspectPokemonTransfer } from "@/lib/pokemonTransfer";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function ShareOpenGraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = inspectPokemonTransfer(token);
  const data = getBuilderPageData();
  const speciesMeta = shared
    ? data.speciesCatalog.find((entry) => normalizeName(entry.name) === normalizeName(shared.species))
    : null;
  const sprites = shared ? buildSpriteUrls(shared.species, speciesMeta?.dex, { shiny: shared.shiny }) : { spriteUrl: undefined };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(circle at top left, rgba(190,255,120,0.24), transparent 28%), radial-gradient(circle at top right, rgba(94,240,203,0.2), transparent 24%), linear-gradient(180deg, rgb(12,30,36) 0%, rgb(7,20,25) 55%, rgb(4,12,15) 100%)",
          color: "rgb(232, 252, 242)",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.16,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(circle at center, black, transparent 80%)",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 760,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 28,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgb(190,255,120)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(190,255,120,0.35)",
                  background: "rgba(190,255,120,0.12)",
                }}
              >
                Shared Pokemon
              </span>
              <span>Redux Team Builder</span>
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "column",
                fontSize: 74,
                lineHeight: 0.94,
                fontWeight: 800,
                letterSpacing: -3,
              }}
            >
              <span>{shared?.nickname || shared?.species || "Pokemon compartido"}</span>
              <span style={{ color: "rgb(94,240,203)" }}>{shared?.species || "Abre el link para importarlo"}</span>
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                maxWidth: 700,
                fontSize: 30,
                lineHeight: 1.35,
                color: "rgba(232,252,242,0.84)",
              }}
            >
              {shared
                ? `Lv. ${shared.level}${shared.ability ? ` · ${shared.ability}` : ""}${shared.item ? ` · ${shared.item}` : ""}`
                : "Importa este Pokemon directamente a tu caja del team builder."}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: 320,
              height: 320,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 36,
              background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
            }}
          >
            {sprites.spriteUrl ? (
              <img
                src={sprites.spriteUrl}
                alt={shared?.species ?? "Pokemon"}
                width="260"
                height="260"
              />
            ) : null}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
