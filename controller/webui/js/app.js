
let updater

export default {
  name: 'app',

  template: `
  <div class="grid-container">
    <div class="menu">
      <ul class="menu-list">
        <li>
          <router-link to="/edit"><i class="fas fa-edit fa-fw fa-lg"></i> Job Edit</router-link>
        </li>
        <li>
          <router-link to="/jobs"><i class="fas fa-camera fa-fw fa-lg"></i> Results</router-link>
        </li>
        <li>
          <router-link to="/logs"><i class="fas fa-scroll fa-fw fa-lg"></i> Logs</router-link>
        </li>        
        <li>
          <router-link to="/tracers"><i class="fas fa-cogs fa-fw fa-lg"></i> Tracers</router-link>
        </li>
        <li>
          <router-link to="/about"><i class="fas fa-comment-dots fa-fw fa-lg"></i> About</router-link>
        </li>
      </ul>
    </div>

  <div class="main">
    <!-- route outlet, component matched by the route will render here -->    
    <router-view @statusRefresh="statusRefresh" :running="running"></router-view>
  </div>
  
  <div class="statusbar">
    <img src="img/spin.png" class="spinner" v-if="running">
    &nbsp;{{ status }}
    <progress class="progress is-white" :value="tasksComplete" :max="taskCount" v-if="running"></progress>
  </div>
</div>`,

  data() {
    return {
      status: 'Idle...',
      running: false,
      taskCount: 0,
      tasksComplete: 0,
      prevStatus: ''
    }
  },

  mounted() {
    this.statusRefresh()
    setInterval(this.statusRefresh, 2000)
  },

  methods: {
    updateStatus(status) {
      this.status = status
    },

    statusRefresh: async function() {
      try {
        let statusResp = await fetch('/api/status', { headers: { 'Accept': 'application/json' }, method: "GET" })
        
        if(!statusResp.ok) throw new Error('Failed to fetch data from controller')
        let data = await statusResp.json()
        if(data.job && data.job.status == 'RUNNING') {
          this.running = true
          this.taskCount = data.job.taskCount
          this.tasksComplete = data.job.tasksComplete
          this.status = `Job: ${data.job.name} is running. Completed ${data.job.tasksComplete} of ${data.job.taskCount} tasks...`;
          this.prevStatus = data.job.status
        } else if(data.job) {
          this.running = false
          this.status = `Job: ${data.job.name} is ${data.job.status}. ${data.job.reason}`;
          if(this.prevStatus == 'RUNNING' && data.job.status == 'COMPLETE') {
            this.$root.$emit('refreshJobs')
          }
          this.prevStatus = data.job.status
        }
        // Fall back
        if(data.msg) this.status = data.msg

      } catch(err) {
        this.running = false
        this.status = err.toString()
      }
    }  
  }
}
