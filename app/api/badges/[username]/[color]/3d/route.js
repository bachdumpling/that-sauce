import fs from "fs/promises";
import path from "path";
import { ImageResponse } from "@vercel/og";
import { getCreatorAction } from "@/actions/creator-actions";
import { NextResponse } from "next/server";
import { getDisplayName } from "@/utils/display-name";

export async function GET(request, { params }) {
  // const ua = request.headers.get("user-agent") || "";
  // const isBot = /bot|facebookexternalhit|Twitterbot|Googlebot|Applebot/i.test(
  //   ua
  // );

  // if (!isBot) {
  //   return NextResponse.redirect(
  //     `${process.env.NEXT_PUBLIC_CLIENT_URL}/${params.username}`,
  //     307
  //   );
  // }

  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username, color } = resolvedParams;
  const url = new URL(request.url);
  const scale = parseFloat(url.searchParams.get("scale") || "1");

  let creator;

  if (username === "username") {
    // Use default values when username is just "username"
    creator = null;
  } else {
    const creatorResponse = await getCreatorAction(username);
    if (!creatorResponse.success || !creatorResponse.data) {
      return new Response(JSON.stringify({ error: "Creator not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    creator = creatorResponse.data;
  }

  const defaultValues = {
    username: creator?.username || "username",
    name:
      creator?.first_name && creator?.last_name
        ? `${creator.first_name} ${creator.last_name}`
        : creator?.username || "First Last",
    role: creator?.primary_role?.[0] || "Creative",
    location: creator?.location || "New York, NY",
    joinedDate: creator?.created_at
      ? new Date(creator.created_at)
          .toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "/")
      : "06/06/25",
    website: "www.that-sauce.com",
  };

  const displayName = creator ? getDisplayName(creator) : defaultValues.name;

  try {
    // Image path based on color
    const imgPath =
      color === "black"
        ? path.join(process.cwd(), "public", "badge-3d-black.png")
        : path.join(process.cwd(), "public", "badge-white-1.jpg");

    // Read image file
    const imgData = await fs.readFile(imgPath);

    // Determine the mime type based on file extension
    const fileExtension = path.extname(imgPath).toLowerCase();
    const mimeType = fileExtension === ".png" ? "image/png" : "image/jpeg";

    // Create data URI with proper mime type
    const bgDataUri = `data:${mimeType};base64,${imgData.toString("base64")}`;

    // Read the font file
    const fontPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "HelveticaNeueMedium.otf"
    );
    const fontData = await fs.readFile(fontPath);

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            borderRadius: 12,
            position: "relative",
            color: color === "black" ? "white" : "black",
            transform: "scaleY(-1)",
          }}
        >
          {/* Background image */}
          <img
            src={bgDataUri}
            alt="Badge Background"
            width="1024"
            height="1024"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Two column content layout */}
          <div
            style={{
              position: "absolute",
              display: "flex",
              width: "100%",
              bottom: 260,
            }}
          >
            {/* Left column - with creator info */}
            <div
              style={{
                position: "relative",
                width: "50%",
                padding: 24 * scale,
                display: "flex",
                flexDirection: "column",
                gap: 4 * scale,
              }}
            >
              {/* Username on the image */}
              <div
                style={{
                  position: "absolute",
                  bottom: "160%",
                  right: 24 * scale,
                  fontSize: 14 * scale,
                  textAlign: "right",
                  display: "flex",
                }}
              >
                @{defaultValues.username}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8 * scale,
                }}
              >
                {/* Name */}
                <div
                  style={{
                    fontSize: 24 * scale,
                    fontWeight: 500,
                    fontFamily: "HelveticaNeueLight",
                  }}
                >
                  {displayName}
                </div>

                {/* Role */}
                <div
                  style={{
                    fontSize: 14 * scale,
                    fontWeight: 300,
                    fontFamily: "HelveticaNeueLight",
                  }}
                >
                  {defaultValues.role}
                </div>
              </div>

              {/* Bottom metadata in horizontal stack */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: 10 * scale,
                  fontSize: 7 * scale,
                  opacity: 0.8,
                  fontFamily: "HelveticaNeueLight",
                }}
              >
                <span>{defaultValues.location}</span>
                <span>{defaultValues.website}</span>
                <span>Joined: {defaultValues.joinedDate}</span>
              </div>
            </div>

            {/* Right column - empty */}
            <div style={{ width: "50%" }}></div>
          </div>
        </div>
      ),
      {
        width: 1024,
        height: 1024,
        deviceScaleFactor: scale,
        fonts: [
          {
            name: "HelveticaNeueLight",
            data: fontData,
          },
        ],
      }
    );
  } catch (error) {
    console.error("ImageResponse error:", error);
    return new Response(`Error generating image: ${error.message}`, {
      status: 500,
    });
  }
}
