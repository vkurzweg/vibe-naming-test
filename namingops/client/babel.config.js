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
    // Force all JSX transforms to use the same runtime
    ['@babel/plugin-transform-react-jsx', {
      runtime: 'automatic',
      importSource: 'react'
    }]
  ]
};
