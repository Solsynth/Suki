// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: 'https://kb.solsynth.dev',
  integrations: [
    starlight({
      title: "Suki",
      description:
        "Solsynth's products kownledge base, including Solar Network, GoatCraft and more.",
      defaultLocale: "zh-cn",
      locales: {
        en: {
          label: "English",
        },
        "zh-cn": {
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
          autogenerate: { directory: "solar-network" },
        },
        {
          label: "GoatCraft",
          autogenerate: { directory: "goatcraft" },
        },
        {
          label: "Solsynth Works",
          autogenerate: { directory: "standards" },
        },
      ],
    }),
  ],
});
