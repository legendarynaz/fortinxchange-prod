import { describe, it, expect } from 'vitest'
import postcssConfig from './postcss.config.js'

describe('PostCSS configuration', () => {
  it('correctly applies the Tailwind CSS plugin', () => {
    expect(postcssConfig).toBeDefined()
    expect(postcssConfig.plugins).toBeDefined()
    expect(postcssConfig.plugins['@tailwindcss/postcss']).toBeDefined()
  })
})
