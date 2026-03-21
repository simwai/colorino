import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Colorino",
  description: "A super simple colorized logger that gets the most out of your terminal",
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide' },
      { text: 'API Reference', link: '/api' },
      { text: '0.19.3', items: [
          { text: 'Changelog', link: 'https://github.com/simwai/colorino/blob/main/CHANGELOG.md' },
          { text: 'Contributing', link: 'https://github.com/simwai/colorino/blob/main/CONTRIBUTING.md' }
        ]
      }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide' },
          { text: 'Configuration', link: '/config' },
        ]
      },
      {
        text: 'API',
        items: [
          { text: 'API Reference', link: '/api' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/simwai/colorino' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present simwai'
    }
  }
})
