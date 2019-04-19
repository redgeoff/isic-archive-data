module.exports = {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        include: __dirname,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  }
};
