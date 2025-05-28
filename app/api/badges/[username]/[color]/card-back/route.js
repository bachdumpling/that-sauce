import { ImageResponse } from "@vercel/og";

export async function GET(request) {
  const url = new URL(request.url);
  const scale = parseFloat(url.searchParams.get("scale") || "1");
  const color = url.searchParams.get("color") || "black";

  const bgColor = color === "black" ? "#000000" : "#FFFFFF";
  const textColor = color === "black" ? "#FFFFFF" : "#000000";

  // Create a simple card back with logo
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: bgColor,
          color: textColor,
          borderRadius: 12,
          padding: 24 * scale,
        }}
      >
        <div
          style={{
            fontSize: 24 * scale,
            fontWeight: "bold",
            opacity: 0.7,
          }}
        >
          that-sauce.com
        </div>
      </div>
    ),
    {
      width: 320 * scale,
      height: 437 * scale,
      deviceScaleFactor: scale,
    }
  );
}
