const enableReactRefresh =
  process.env.NODE_ENV === 'development' ||
  process.env.REACT_APP_DEMO_MODE === 'true';

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