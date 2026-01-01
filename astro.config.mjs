// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://kb.solsynth.dev",
  integrations: [
    starlight({
      title: "Suki",
      description:
        "Solsynth's products kownledge base, including Solar Network, GoatCraft and more.",
      defaultLocale: 'root',
      favicon: 'favicon.png',
      locales: {
        en: {
          label: "English",
          lang: 'en',
        },
        root: {
          label: "简体中文",
          lang: "zh-CN",
        },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/Solsynth",
        },
      ],
      sidebar: [
        {
          label: "Solar Network",
          items: [
            {
              label: "Getting Started",
              link: "solar-network",
              translations: { "zh-CN": "快速开始" },
            },
            {
              label: "Solarpass",
              link: "solar-network/account",
              translations: { "zh-CN": "太阳通行证" },
            },
            {
              label: "Publish & Publishers",
              link: "solar-network/publisher",
              translations: { "zh-CN": "发布者和发布内容" },
            },
            {
              label: "Stickers & Pack",
              link: "solar-network/sticker",
              translations: { "zh-CN": "贴图与贴图包" },
            },
            {
              label: "Wallet",
              link: "solar-network/wallet",
              translations: { "zh-CN": "源点钱包" },
            },
            {
              label: "Stellar Program",
              link: "solar-network/stellar-program",
              translations: { "zh-CN": "恒星计划" },
            },
            {
              label: "ActivityPub & Fediverse",
              link: "solar-network/activitypub",
              translations: { "zh-CN": "ActivityPub 和联邦网络" },
            },
            {
              label: "Open Platform",
              autogenerate: { directory: "solar-network/developers" },
              translations: { "zh-CN": "开放平台" },
              collapsed: true,
            },
          ],
        },
        {
          label: "GoatCraft",
          autogenerate: { directory: "goatcraft" },
        },
        {
          label: "Solsynth Works",
          autogenerate: { directory: "standards" },
          translations: { "zh-cn": "标准" },
        },
      ],
    }),
  ],
});
