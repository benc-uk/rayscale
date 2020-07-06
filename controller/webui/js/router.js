import editor from './components/editor.js'
import jobs from './components/jobs.js'
import logs from './components/logs.js'

let router = new VueRouter({
  routes: [
    { path: '/', redirect: '/edit' },
    {
      path: '/edit',
      name: 'edit',
      component: editor
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: jobs
    },
    {
      path: '/logs',
      name: 'logs',
      component: logs
    },
    {
      path: '/tracers',
      name: 'tracers',
      component: logs
    }
  ]
})

export default router