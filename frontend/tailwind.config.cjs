module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121826',
        slateDeep: '#1d2433',
        gold: '#c7a36b',
        paper: '#f5f2eb'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(18, 24, 38, 0.12)'
      }
    }
  },
  plugins: []
};
