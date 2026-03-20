import DefaultTheme from 'vitepress/theme'
import 'vitepress-plugin-shiki-twoslash/styles.css'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // ...
  }
} satisfies Theme
