import { defineType } from "sanity";

export const navigation = defineType({
  name: "navigation",
  title: "Navigation Menu",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Navigation Title",
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
      description: "Unique identifier for this navigation menu",
    },
    {
      name: "isActive",
      title: "Active Navigation",
      type: "boolean",
      initialValue: true,
      description: "Whether this navigation menu is currently active",
    },
    {
      name: "brand",
      title: "Brand Settings",
      type: "object",
      fields: [
        {
          name: "logoLight",
          title: "Logo (Light Theme)",
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
          description: "Brand logo displayed in light theme/light backgrounds",
        },
        {
          name: "logoDark",
          title: "Logo (Dark Theme)",
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
          description: "Brand logo displayed in dark theme/dark backgrounds",
        },
        {
          name: "logoDefault",
          title: "Default/Fallback Logo",
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
          description:
            "Fallback logo used when theme-specific logos aren't available",
        },
        {
          name: "logoWidth",
          title: "Logo Width",
          type: "number",
          initialValue: 200,
          description: "Logo width in pixels",
        },
        {
          name: "logoHeight",
          title: "Logo Height",
          type: "number",
          initialValue: 200,
          description: "Logo height in pixels",
        },
        {
          name: "brandName",
          title: "Brand Name",
          type: "string",
          description: "Brand name displayed alongside or instead of logo",
        },
        {
          name: "homeUrl",
          title: "Home URL",
          type: "string",
          initialValue: "/",
          description: "URL the logo/brand links to",
        },
        {
          name: "showBrandName",
          title: "Show Brand Name",
          type: "boolean",
          initialValue: false,
          description: "Whether to display brand name alongside logo",
        },
        {
          name: "logoPosition",
          title: "Logo Position",
          type: "string",
          options: {
            list: [
              { title: "Left", value: "left" },
              { title: "Center", value: "center" },
              { title: "Right", value: "right" },
            ],
          },
          initialValue: "center",
          description: "Logo position in navigation",
        },
      ],
      description: "Brand logo and identity settings with theme support",
    },
    {
      name: "mainNavigation",
      title: "Main Navigation",
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
              name: "path",
              title: "Path",
              type: "string",
              validation: (Rule) => Rule.required(),
              description: "URL path (e.g., /search, /feed)",
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
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "path",
            },
          },
        },
      ],
      description: "Main navigation links",
    },
    {
      name: "authNavigation",
      title: "Authentication Navigation",
      type: "object",
      fields: [
        {
          name: "signInText",
          title: "Sign In Text",
          type: "string",
          initialValue: "Log in",
        },
        {
          name: "signInUrl",
          title: "Sign In URL",
          type: "string",
          initialValue: "/sign-in",
        },
        {
          name: "signUpText",
          title: "Sign Up Text",
          type: "string",
          initialValue: "Sign up",
        },
        {
          name: "signUpUrl",
          title: "Sign Up URL",
          type: "string",
          initialValue: "/sign-up",
        },
        {
          name: "signOutText",
          title: "Sign Out Text",
          type: "string",
          initialValue: "Sign out",
        },
      ],
      description: "Authentication-related navigation settings",
    },
    {
      name: "creatorNavigation",
      title: "Creator Navigation",
      type: "object",
      fields: [
        {
          name: "portfolioText",
          title: "Portfolio Text",
          type: "string",
          initialValue: "Portfolio",
        },
        {
          name: "myPortfolioText",
          title: "My Portfolio Text",
          type: "string",
          initialValue: "My Portfolio",
        },
        {
          name: "editProfileText",
          title: "Edit Profile Text",
          type: "string",
          initialValue: "Edit Profile",
        },
      ],
      description: "Creator-specific navigation settings",
    },
    {
      name: "adminNavigation",
      title: "Admin Navigation",
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
              name: "path",
              title: "Path",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "isVisible",
              title: "Visible",
              type: "boolean",
              initialValue: true,
            },
            {
              name: "order",
              title: "Order",
              type: "number",
            },
          ],
        },
      ],
      description: "Admin-only navigation links",
    },
    {
      name: "userGreeting",
      title: "User Greeting Settings",
      type: "object",
      fields: [
        {
          name: "greetingPrefix",
          title: "Greeting Prefix",
          type: "string",
          initialValue: "Hey,",
        },
        {
          name: "fallbackGreeting",
          title: "Fallback Greeting",
          type: "string",
          initialValue: "there",
        },
      ],
      description: "Settings for user greeting text in navigation",
    },
  ],
  preview: {
    select: {
      title: "title",
      isActive: "isActive",
    },
    prepare({ title, isActive }) {
      return {
        title,
        subtitle: isActive ? "Active" : "Inactive",
      };
    },
  },
});
