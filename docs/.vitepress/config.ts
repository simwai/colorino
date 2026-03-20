import { defineConfig } from 'vitepress'
import { withTwoslash } from 'vitepress-plugin-shiki-twoslash'

export default withTwoslash(
  defineConfig({
    title: "Colorino",
    description: "A super simple colorized logger that gets the most out of your terminal",
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Guide', link: '/guide' }
      ],
      sidebar: [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Colorino?', link: '/' },
          ]
        }
      ],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/simwai/colorino' }
      ]
    }
  })
)
