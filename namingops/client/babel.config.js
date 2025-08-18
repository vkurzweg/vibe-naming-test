const enableReactRefresh =
  process.env.NODE_ENV === 'development';

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
    enableReactRefresh && 'react-refresh/babel'
  ].filter(Boolean)
};