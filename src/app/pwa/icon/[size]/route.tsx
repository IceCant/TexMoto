import { ImageResponse } from "next/og";

const supportedIconSizes = new Set([192, 512]);

function parseIconSize(value: string): number {
  const parsedSize = Number(value);
  if (!supportedIconSizes.has(parsedSize)) throw new Error(`Unsupported PWA icon size: ${value}`);
  return parsedSize;
}

export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const size = parseIconSize(sizeParam);
  const isMaskable = new URL(request.url).searchParams.get("maskable") === "1";
  const markSize = isMaskable ? "58%" : "72%";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2563eb",
      }}
    >
      <div
        style={{
          width: markSize,
          height: markSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "24%",
          background: "#ffffff",
          color: "#2563eb",
          fontFamily: "Arial, sans-serif",
          fontSize: size * (isMaskable ? 0.25 : 0.31),
          fontWeight: 900,
          letterSpacing: "-0.08em",
          paddingRight: size * 0.025,
        }}
      >
        TM
      </div>
    </div>,
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
