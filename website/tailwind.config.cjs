module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,md,mdx}', './docs/**/*.{md,mdx}'],
  prefix: 'tw-',
  corePlugins: {preflight: false},
  theme: {extend: {borderRadius: {xl: '0.85rem'}, colors: {accent: '#2563EB', ink: '#0F172A', surface: '#16223B'}}}
};
