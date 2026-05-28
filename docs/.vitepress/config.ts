import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Colorino",
  description: "A super simple colorized logger that gets the most out of your terminal",
  ignoreDeadLinks: true,
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/README' },
      { text: 'Examples', link: '/example' },
      { text: 'Reference', items: [
        { text: 'Configuration', link: '/config' },
        { text: 'API Reference', link: '/api' }
      ]},
      { text: 'Project', items: [
        { text: 'Changelog', link: '/CHANGELOG' },
        { text: 'Contributing', link: '/CONTRIBUTING' }
      ]}
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/README' },
          { text: 'Examples', link: '/example' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/config' },
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
    },
    editLink: {
      pattern: 'https://github.com/simwai/colorino/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
