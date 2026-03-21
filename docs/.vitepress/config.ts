import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Colorino",
  description: "A super simple colorized logger that gets the most out of your terminal",
  ignoreDeadLinks: true,
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide' },
      { text: 'API Reference', link: '/api' },
      { text: 'Changelog', link: '/CHANGELOG' },
      { text: 'Contributing', link: '/CONTRIBUTING' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Colorino?', link: '/README' },
          { text: 'Getting Started', link: '/guide' },
          { text: 'Examples', link: '/example' },
        ]
      },
      {
        text: 'Configuration',
        items: [
          { text: 'Config Options', link: '/config' },
        ]
      },
      {
        text: 'API',
        items: [
          { text: 'API Reference', link: '/api' },
        ]
      },
      {
        text: 'Project',
        items: [
          { text: 'Contributing', link: '/CONTRIBUTING' },
          { text: 'Changelog', link: '/CHANGELOG' },
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
