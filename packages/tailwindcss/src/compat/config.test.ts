import { test } from 'vitest'
import { compile } from '..'
import plugin from '../plugin'

const css = String.raw

test('Config files can add content', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({ content: ['./file.txt'] }),
  })

  expect(compiler.globs).toEqual(['./file.txt'])
})

test('Config files can change dark mode (media)', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({ darkMode: 'media' }),
  })

  expect(compiler.build(['dark:underline'])).toMatchInlineSnapshot(`
    ".dark\\:underline {
      @media (prefers-color-scheme: dark) {
        text-decoration-line: underline;
      }
    }
    "
  `)
})

test('Config files can change dark mode (selector)', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({ darkMode: 'selector' }),
  })

  expect(compiler.build(['dark:underline'])).toMatchInlineSnapshot(`
    ".dark\\:underline {
      &:where(.dark, .dark *) {
        text-decoration-line: underline;
      }
    }
    "
  `)
})

test('Config files can change dark mode (variant)', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({ darkMode: ['variant', '&:where(:not(.light))'] }),
  })

  expect(compiler.build(['dark:underline'])).toMatchInlineSnapshot(`
    ".dark\\:underline {
      &:where(:not(.light)) {
        text-decoration-line: underline;
      }
    }
    "
  `)
})

test('Config files can add plugins', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({
      plugins: [
        plugin(function ({ addUtilities }) {
          addUtilities({
            '.no-scrollbar': {
              'scrollbar-width': 'none',
            },
          })
        }),
      ],
    }),
  })

  expect(compiler.build(['no-scrollbar'])).toMatchInlineSnapshot(`
    ".no-scrollbar {
      scrollbar-width: none;
    }
    "
  `)
})

test('Plugins loaded from config files can contribute to the config', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({
      plugins: [
        plugin(() => {}, {
          darkMode: ['variant', '&:where(:not(.light))'],
        }),
      ],
    }),
  })

  expect(compiler.build(['dark:underline'])).toMatchInlineSnapshot(`
    ".dark\\:underline {
      &:where(:not(.light)) {
        text-decoration-line: underline;
      }
    }
    "
  `)
})

test('Config file presets can contribute to the config', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({
      presets: [
        {
          darkMode: ['variant', '&:where(:not(.light))'],
        },
      ],
    }),
  })

  expect(compiler.build(['dark:underline'])).toMatchInlineSnapshot(`
    ".dark\\:underline {
      &:where(:not(.light)) {
        text-decoration-line: underline;
      }
    }
    "
  `)
})

test('Config files can affect the theme', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({
      theme: {
        extend: {
          colors: {
            primary: '#c0ffee',
          },
        },
      },

      plugins: [
        plugin(function ({ addUtilities, theme }) {
          addUtilities({
            '.scrollbar-primary': {
              scrollbarColor: theme('colors.primary'),
            },
          })
        }),
      ],
    }),
  })

  expect(compiler.build(['bg-primary', 'scrollbar-primary'])).toMatchInlineSnapshot(`
    ".bg-primary {
      background-color: #c0ffee;
    }
    .scrollbar-primary {
      scrollbar-color: #c0ffee;
    }
    "
  `)
})

test('Variants in CSS overwrite variants from plugins', async ({ expect }) => {
  let input = css`
    @tailwind utilities;
    @config "./config.js";
    @variant dark (&:is(.my-dark));
    @variant light (&:is(.my-light));
  `

  let compiler = await compile(input, {
    loadConfig: async () => ({
      darkMode: ['variant', '&:is(.dark)'],
      plugins: [
        plugin(function ({ addVariant }) {
          addVariant('light', '&:is(.light)')
        }),
      ],
    }),
  })

  expect(compiler.build(['dark:underline', 'light:underline'])).toMatchInlineSnapshot(`
    ".dark\\:underline {
      &:is(.my-dark) {
        text-decoration-line: underline;
      }
    }
    .light\\:underline {
      &:is(.my-light) {
        text-decoration-line: underline;
      }
    }
    "
  `)
})
