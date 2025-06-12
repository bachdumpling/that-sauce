import { defineField, defineType } from "sanity";

export const landingPage = defineType({
  name: "landingPage",
  title: "Landing Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      description: "Internal title for content management",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "hero",
      title: "Hero Section",
      type: "object",
      fields: [
        defineField({
          name: "title",
          title: "Hero Title",
          type: "string",
          description: "Main headline displayed on the hero section",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "subtitle",
          title: "Hero Subtitle",
          type: "text",
          description: "Supporting text below the main headline",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "backgroundVideo",
          title: "Background Video",
          type: "file",
          options: {
            accept: "video/*",
          },
          description: "Video to play in the background of the hero section",
        }),
        defineField({
          name: "backgroundImage",
          title: "Background Image (Fallback)",
          type: "image",
          options: {
            hotspot: true,
          },
          description: "Fallback image if video is not available or fails to load",
        }),
        defineField({
          name: "videoSettings",
          title: "Video Settings",
          type: "object",
          fields: [
            defineField({
              name: "autoplay",
              title: "Autoplay",
              type: "boolean",
              initialValue: true,
              description: "Automatically play video when page loads",
            }),
            defineField({
              name: "loop",
              title: "Loop",
              type: "boolean",
              initialValue: true,
              description: "Loop video continuously",
            }),
            defineField({
              name: "muted",
              title: "Muted",
              type: "boolean",
              initialValue: true,
              description: "Mute video by default (required for autoplay)",
            }),
          ],
          description: "Video playback settings",
        }),
        defineField({
          name: "textColor",
          title: "Text Color",
          type: "string",
          options: {
            list: [
              { title: "White", value: "white" },
              { title: "Black", value: "black" },
              { title: "Primary", value: "primary" },
            ],
          },
          initialValue: "white",
          description: "Color of the hero text",
        }),
        defineField({
          name: "overlay",
          title: "Video Overlay",
          type: "object",
          fields: [
            defineField({
              name: "enabled",
              title: "Enable Overlay",
              type: "boolean",
              initialValue: false,
              description: "Add a color overlay on top of the video",
            }),
            defineField({
              name: "color",
              title: "Overlay Color",
              type: "string",
              options: {
                list: [
                  { title: "Dark", value: "rgba(0, 0, 0, 0.5)" },
                  { title: "Light", value: "rgba(255, 255, 255, 0.5)" },
                  { title: "Custom", value: "custom" },
                ],
              },
              hidden: ({ parent }) => !parent?.enabled,
            }),
            defineField({
              name: "customColor",
              title: "Custom Overlay Color",
              type: "string",
              description: "CSS color value (e.g., rgba(255, 0, 0, 0.3))",
              hidden: ({ parent }) => parent?.color !== "custom",
            }),
          ],
          description: "Optional overlay to improve text readability",
        }),
      ],
      description: "Hero section content and settings",
    }),
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          description: "Title for search engines and social media",
        }),
        defineField({
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          description: "Description for search engines and social media",
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: "ogImage",
          title: "Social Share Image",
          type: "image",
          description: "Image for social media sharing",
        }),
      ],
      description: "Search engine optimization settings",
    }),
  ],
  preview: {
    select: {
      title: "hero.title",
      subtitle: "hero.subtitle",
      media: "hero.backgroundImage",
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Landing Page",
        subtitle: subtitle || "No subtitle",
        media,
      };
    },
  },
}); 