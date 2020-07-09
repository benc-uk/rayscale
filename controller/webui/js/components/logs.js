import error from './error.js'
let timer

export default {
  name: 'logs',

  components: { error },

  template: `<div>
    <pre ref="logpre" class="logs">
{{ logs }}
    </pre>
    <error title="Log Fetch Error" :message="errorMsg" @closed="errorMsg=''"/>
  </div>`,

  data () {
    return {
      logs: '',
      errorMsg: null,
      logCount: 0
    }
  },

  async mounted() {
    this.refreshLogs();
    timer = setInterval(this.refreshLogs, 2000)
  },

  destroyed() {
    clearInterval(timer)
  },

  updated() {
    this.$refs.logpre.style.height = `${this.$refs.logpre.parentNode.parentNode.clientHeight}px`
    this.$refs.logpre.scrollTop = this.$refs.logpre.scrollHeight;
  },

  methods: {
    refreshLogs: async function () {
      try {
        const logsResp = await fetch(`/api/logs/${this.logCount}`)
       
        if(!logsResp.ok) {
          this.errorMsg = `Fetching logs failed`
          return
        }

        let logs = await logsResp.json()
        this.logCount += logs.length    
        for(let l of logs) {
          this.logs += l
        }
        this.$refs.logpre.style.height = `${this.$refs.logpre.parentNode.parentNode.clientHeight}px`

      } catch(err) {
        this.errorMsg = err.toString()
      }
    }
  }
}
