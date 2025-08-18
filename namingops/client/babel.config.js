module.exports = {
  presets: [
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        importSource: 'react'
      }
    ]
  ],
  plugins: [
  process.env.NODE_ENV === 'development' && 'react-refresh/babel'
].filter(Boolean)
};
