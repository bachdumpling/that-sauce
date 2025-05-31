import { defineType } from "sanity";

export const footer = defineType({
  name: "footer",
  title: "Footer",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Footer Title",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Internal title for content management",
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      validation: (Rule) => Rule.required(),
      options: {
        source: "title",
        maxLength: 50,
      },
      description: "Unique identifier for this footer",
    },
    {
      name: "isActive",
      title: "Active Footer",
      type: "boolean",
      initialValue: true,
      description: "Whether this footer is currently active",
    },
    {
      name: "brand",
      title: "Brand Section",
      type: "object",
      fields: [
        {
          name: "logo",
          title: "Footer Logo",
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
          description: "Brand logo displayed in footer",
        },
        {
          name: "logoWidth",
          title: "Logo Width",
          type: "number",
          initialValue: 80,
          description: "Logo width in pixels",
        },
        {
          name: "logoHeight",
          title: "Logo Height",
          type: "number", 
          initialValue: 80,
          description: "Logo height in pixels",
        },
        {
          name: "brandName",
          title: "Brand Name",
          type: "string",
          initialValue: "that sauce",
          description: "Brand name displayed in footer",
        },
        {
          name: "tagline",
          title: "Tagline",
          type: "string",
          initialValue: "creative talent search engine",
          description: "Brand tagline or description",
        },
        {
          name: "showBrandName",
          title: "Show Brand Name",
          type: "boolean",
          initialValue: true,
          description: "Whether to display the brand name",
        },
        {
          name: "showTagline",
          title: "Show Tagline",
          type: "boolean",
          initialValue: true,
          description: "Whether to display the tagline",
        },
      ],
      description: "Brand logo, name, and tagline settings",
    },
    {
      name: "navigationLinks",
      title: "Navigation Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "url",
              title: "URL",
              type: "string",
              validation: (Rule) => Rule.required(),
              description: "URL path or external link",
            },
            {
              name: "isVisible",
              title: "Visible",
              type: "boolean",
              initialValue: true,
            },
            {
              name: "openInNewTab",
              title: "Open in New Tab",
              type: "boolean",
              initialValue: false,
            },
            {
              name: "order",
              title: "Order",
              type: "number",
              description: "Display order (lower numbers appear first)",
            },
            {
              name: "isInternal",
              title: "Internal Link",
              type: "boolean",
              initialValue: true,
              description: "Whether this is an internal site link",
            },
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "url",
            },
          },
        },
      ],
      description: "Footer navigation links",
    },
    {
      name: "socialMedia",
      title: "Social Media",
      type: "object",
      fields: [
        {
          name: "showSocialMedia",
          title: "Show Social Media",
          type: "boolean",
          initialValue: false,
          description: "Whether to display social media links",
        },
        {
          name: "socialLinks",
          title: "Social Links",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "platform",
                  title: "Platform",
                  type: "string",
                  options: {
                    list: [
                      { title: "Twitter/X", value: "twitter" },
                      { title: "Instagram", value: "instagram" },
                      { title: "LinkedIn", value: "linkedin" },
                      { title: "YouTube", value: "youtube" },
                      { title: "TikTok", value: "tiktok" },
                      { title: "Facebook", value: "facebook" },
                      { title: "Discord", value: "discord" },
                      { title: "Other", value: "other" },
                    ],
                  },
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: "url",
                  title: "URL",
                  type: "url",
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: "label",
                  title: "Label",
                  type: "string",
                  description: "Custom label (for 'other' platform)",
                },
                {
                  name: "isVisible",
                  title: "Visible",
                  type: "boolean",
                  initialValue: true,
                },
              ],
              preview: {
                select: {
                  platform: "platform",
                  label: "label",
                  url: "url",
                },
                prepare({ platform, label, url }) {
                  return {
                    title: label || platform,
                    subtitle: url,
                  };
                },
              },
            },
          ],
          description: "Social media platform links",
        },
      ],
      description: "Social media links and settings",
    },
    {
      name: "copyright",
      title: "Copyright Section",
      type: "object",
      fields: [
        {
          name: "showCopyright",
          title: "Show Copyright",
          type: "boolean",
          initialValue: true,
          description: "Whether to display copyright notice",
        },
        {
          name: "copyrightText",
          title: "Copyright Text",
          type: "string",
          initialValue: "© 2025 that sauce. All rights reserved.",
          description: "Copyright notice text",
        },
        {
          name: "year",
          title: "Copyright Year",
          type: "number",
          initialValue: new Date().getFullYear(),
          description: "Copyright year (auto-updates if left empty)",
        },
        {
          name: "companyName",
          title: "Company Name",
          type: "string",
          initialValue: "that sauce",
          description: "Company name for copyright",
        },
        {
          name: "autoUpdateYear",
          title: "Auto-Update Year",
          type: "boolean",
          initialValue: true,
          description: "Automatically use current year",
        },
      ],
      description: "Copyright notice settings",
    },
    {
      name: "newsletter",
      title: "Newsletter Section",
      type: "object",
      fields: [
        {
          name: "showNewsletter",
          title: "Show Newsletter Signup",
          type: "boolean",
          initialValue: false,
          description: "Whether to display newsletter signup",
        },
        {
          name: "heading",
          title: "Newsletter Heading",
          type: "string",
          initialValue: "Stay Updated",
          description: "Newsletter section heading",
        },
        {
          name: "description",
          title: "Newsletter Description",
          type: "text",
          initialValue: "Get the latest updates and creative insights delivered to your inbox.",
          description: "Newsletter signup description",
        },
        {
          name: "placeholderText",
          title: "Email Placeholder",
          type: "string",
          initialValue: "Enter your email",
          description: "Email input placeholder text",
        },
        {
          name: "buttonText",
          title: "Subscribe Button Text",
          type: "string",
          initialValue: "Subscribe",
          description: "Subscribe button text",
        },
      ],
      description: "Newsletter signup section settings",
    },
    {
      name: "layout",
      title: "Layout Settings",
      type: "object",
      fields: [
        {
          name: "backgroundColor",
          title: "Background Color",
          type: "string",
          options: {
            list: [
              { title: "Default (Background)", value: "background" },
              { title: "Muted", value: "muted" },
              { title: "Card", value: "card" },
              { title: "Accent", value: "accent" },
            ],
          },
          initialValue: "background",
          description: "Footer background color theme",
        },
        {
          name: "showBorder",
          title: "Show Top Border",
          type: "boolean",
          initialValue: true,
          description: "Whether to show border at top of footer",
        },
        {
          name: "alignment",
          title: "Content Alignment",
          type: "string",
          options: {
            list: [
              { title: "Center", value: "center" },
              { title: "Left", value: "left" },
              { title: "Right", value: "right" },
            ],
          },
          initialValue: "center",
          description: "Footer content alignment",
        },
        {
          name: "maxWidth",
          title: "Max Width",
          type: "string",
          options: {
            list: [
              { title: "Small (4xl)", value: "max-w-4xl" },
              { title: "Medium (5xl)", value: "max-w-5xl" },
              { title: "Large (6xl)", value: "max-w-6xl" },
              { title: "Extra Large (7xl)", value: "max-w-7xl" },
              { title: "Full Width", value: "max-w-full" },
            ],
          },
          initialValue: "max-w-6xl",
          description: "Maximum width of footer content",
        },
      ],
      description: "Visual layout and styling options",
    },
  ],
  preview: {
    select: {
      title: "title",
      isActive: "isActive",
      brandName: "brand.brandName",
    },
    prepare({ title, isActive, brandName }) {
      return {
        title,
        subtitle: `${brandName || "Footer"} - ${isActive ? "Active" : "Inactive"}`,
      };
    },
  },
}); 