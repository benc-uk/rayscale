import error from './error.js'
let timer

export default {
  name: 'tracers',

  components: { error },

  template: `
  <div>
    <div class="mb-1 title is-4">
      Tracers online: {{ Object.keys(tracers).length }}
    </div>
    <table class="table is-fullwidth is-hoverable">
      <thead>
        <tr><th></th><th>Host</th><th>Port</th><th>ID</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr v-for="tracer in tracers">
          <td><i class="fas fa-cube"/></td>
          <td>{{ hostname(tracer.endPoint) }}</td>
          <td>{{ port(tracer.endPoint) }}</td>
          <td>{{ tracer.id }}</td>
          <td><a :href="tracer.endPoint+'/ping'" target="_blank"> Status </a></td>
        </tr>
      </tbody>
    </table>
    <error title="Tracer Details Error" :message="errorMsg" @closed="errorMsg=''"/>
  </div>`,

  data () {
    return {
      tracers: [],
      errorMsg: ''
    }
  },

  async mounted() {
    this.refreshTracers();
    timer = setInterval(this.refreshTracers, 2000)
  },

  destroyed() {
    clearInterval(timer)
  },

  methods: {
    refreshTracers: async function() {
      try {
        const tracerResp = await fetch('/api/tracers')
        if(!tracerResp.ok) {
          if(tracerResp.headers.get('content-type').startsWith('application/json')) { 
            const data = await tracerResp.json() 
            this.errorMsg = data.msg
            return
          }
          this.errorMsg = `Fetch tracers failed`
          return
        }
        this.tracers = await tracerResp.json()
      } catch(err) {
        this.errorMsg = err.toString()
      }
    },

    hostname: function(url) {
      return new URL(url).hostname
    },

    port: function(url) {
      return new URL(url).port
    }    
  }
}
