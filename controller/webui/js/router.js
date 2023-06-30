import editor from './components/editor.js'
import jobs from './components/jobs.js'
import logs from './components/logs.js'
import tracers from './components/tracers.js'
import about from './components/about.js'

window.process = {
  env: {
    NODE_ENV: 'development',
  },
}

import VueRouter from 'https://unpkg.com/vue-router@3.6.5/dist/vue-router.esm.js'

let router = new VueRouter({
  linkActiveClass: 'is-active',
  routes: [
    { path: '/', redirect: '/edit' },
    {
      path: '/edit',
      name: 'edit',
      component: editor,
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: jobs,
    },
    {
      path: '/logs',
      name: 'logs',
      component: logs,
    },
    {
      path: '/tracers',
      name: 'tracers',
      component: tracers,
    },
    {
      path: '/about',
      name: 'about',
      component: about,
    },
  ],
})

export default router
