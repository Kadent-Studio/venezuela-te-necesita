import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Unidos Venezuela — Coordinación ciudadana de ayuda tras el sismo del 24-J";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #cf2230 0%, #cf2230 50%, #e07c0a 50%, #e07c0a 100%)",
          fontFamily: '"Public Sans", system-ui, sans-serif',
          color: "#faf7f2",
          padding: 80,
          position: "relative",
        }}
      >
        {/* Grid de puntos decorativo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexWrap: "wrap",
            opacity: 0.08,
          }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 60,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#faf7f2",
                }}
              />
            </div>
          ))}
        </div>

        {/* Círculos concéntricos decorativos (eco del ícono) */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "2px solid rgba(250,247,242,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "2px solid rgba(250,247,242,0.08)",
          }}
        />

        {/* Monograma UNVe */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            marginBottom: 24,
            textShadow: "0 4px 24px rgba(0,0,0,0.25)",
          }}
        >
          UNVe
        </div>

        {/* Título principal */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            textAlign: "center",
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          Coordinación ciudadana de ayuda
        </div>

        {/* Subtítulo */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.4,
            textAlign: "center",
            maxWidth: 750,
            opacity: 0.85,
            marginBottom: 40,
          }}
        >
          Reporta dónde se necesita ayuda tras el sismo del 24 de junio de 2026
        </div>

        {/* Footer con dominio */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.04em",
            opacity: 0.7,
            position: "absolute",
            bottom: 48,
          }}
        >
          unidosvenezuela.org
        </div>

        {/* Barra de urgencia inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            display: "flex",
          }}
        >
          <div
            style={{ flex: 1, background: "#cf2230" }}
          />
          <div
            style={{ flex: 1, background: "#d9442e" }}
          />
          <div
            style={{ flex: 1, background: "#e07c0a" }}
          />
          <div
            style={{ flex: 1, background: "#e8a620" }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
