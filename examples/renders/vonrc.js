module.exports = {
  directory: './',
  output: './index.html',
  template: 'mini',
  // templatePath: 'my-template.pug',
  title: 'RayScale Example Renders',
  description: 'These are images rendered by RayScale showing a range of features & capabilities of the ray tracer',
  definedGroupsOnly: false,
  recursive: false,
  grouping: ['folder', 'integer-prefix', 'string-prefix'],
  groupOrder: 'none', // 'asc', 'desc', 'none' or your own sorting function
  imageOrder: 'none',
  schema: {},
  groups: [
    {
      id: 2, // By default, Von only supports the `id` group property, but your template might support more.
    },
  ],
};