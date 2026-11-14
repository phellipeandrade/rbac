module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,md,mdx}', './docs/**/*.{md,mdx}'],
  prefix: 'tw-',
  corePlugins: {preflight: false},
  theme: {extend: {borderRadius: {xl: '0.85rem'}, colors: {accent: '#b1f369', ink: '#111827', surface: '#161c27'}}}
};
