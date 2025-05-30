import { defineType } from "sanity";

export const authPage = defineType({
  name: "authPage",
  title: "Auth Page",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Page Title",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Internal title for content management",
    },
    {
      name: "heading",
      title: "Login Heading",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
      description: "Main heading displayed on the auth page",
    },
    {
      name: "subheading",
      title: "Subheading",
      type: "text",
      validation: (Rule) => Rule.max(200),
      description: "Optional subheading or description text",
    },
    {
      name: "image",
      title: "Auth Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          title: "Alt Text",
          type: "string",
          validation: (Rule) => Rule.required(),
          description: "Alternative text for accessibility",
        },
      ],
      description: "Image displayed on the auth page",
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this content is currently active",
    },
  ],
  preview: {
    select: {
      title: "heading",
      subtitle: "title",
      media: "image",
    },
  },
});
