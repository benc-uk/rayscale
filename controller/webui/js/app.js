
let updater

export default {
  name: 'app',

  template: `
  <div class="grid-container">
    <div class="menu">
      <ul class="menu-list">
        <li>
          <router-link to="/edit"><img src="icons/edit.svg" class="i"> Job Edit</router-link>
        </li>
        <li>
          <router-link to="/jobs"><img src="icons/camera.svg" class="i"> Results</router-link>
        </li>
        <li>
          <router-link to="/logs"><img src="icons/scroll.svg" class="i"> Logs</router-link>
        </li>        
        <li>
          <router-link to="/tracers"><img src="icons/cogs.svg" class="i"> Tracers</router-link>
        </li>
        <li>
          <router-link to="/about"><img src="icons/sparkles.svg" class="i"> About</router-link>
        </li>
      </ul>
    </div>

  <div class="main">
    <!-- route outlet, component matched by the route will render here -->    
    <router-view @updateStatus="updateStatus" @statusRefresh="statusRefresh" :running="running"></router-view>
  </div>

  <div class="statusbar">
    <img src="img/spin.png" class="spinner" v-if="running">&nbsp;{{ status }}
  </div>
</div>`,

  data() {
    return {
      status: 'Idle...',
      running: false
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
          this.status = `Job: ${data.job.name} is running. Completed ${data.job.tasksComplete} of ${data.job.taskCount} tasks...`;
        } else if(data.job) {
          this.running = false
          this.status = `Job: ${data.job.name} is ${data.job.status}. ${data.job.reason}`;
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
