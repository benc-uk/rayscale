let editor
require.config({ paths: { 'vs': 'js/monaco' } })

export default {
  name: 'editor',

  props: {
    running: {
      type: Boolean,
      default: false
    }
  },

  template: `
  <div class="flexcol">
    <div class="mb-1">
      <button class="button is-success is-medium" @click="jobSubmit" v-if="!running">Start Job 🏃‍♂️</button>
      <button class="button is-warning is-medium" @click="jobCancel" v-if="running">Cancel Job ❌</button>
    </div>
    
    <div id="editor" name="editor" />

    <div class="modal" :class="{ 'is-active': errorMsg }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head has-background-danger">
          <p class="modal-card-title">Job Control Failed</p>
        </header>
        <section class="modal-card-body">
          {{ errorMsg }}
        </section>
        <footer class="modal-card-foot">
          <button class="button" @click="errorMsg = ''">OK</button>
        </footer>
      </div>
    </div>
  </div>
  `,

  data () {
    return {
      errorMsg: null,
    }
  },

  mounted() {
    window.addEventListener('resize', (e) => {
      editor.layout()
    })

    require(['vs/editor/editor.main'], function() {
      editor = monaco.editor.create(document.getElementById('editor'), {
        minimap: { enabled: false },
        theme: 'vs-dark',
        fontSize: '17px',
        language: 'yaml',
        useTabStops: false,
        automaticLayout: true
      })

      // Restore old job YAML
      let oldjob = window.localStorage.getItem('rayScaleJob')
      editor.setValue(oldjob)
    })
  },

  methods: {
    jobSubmit: async function() {
      try {
        const job = editor.getValue();
        window.localStorage.setItem('rayScaleJob', job);
        const submitResp = await fetch("/api/jobs", {
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-yaml' },
          method: "POST",
          body: job
        })
        if(!submitResp.ok) {
          if(submitResp.headers.get('content-type').startsWith('application/json')) { 
            const data = await submitResp.json() 
            this.errorMsg = data.msg
            return
          }
          this.errorMsg = `Submit failed - ${submitResp.status} ${submitResp.statusText}`
        }
        this.$emit('statusRefresh')
      } catch(err) {
        this.errorMsg = err.toString()
      }
    },

    jobCancel: async function() {
      try {
        const cancelResp = await fetch("/api/jobs/cancel", {
          method: "POST",
          body: {}
        })
        if(!cancelResp.ok) {
          if(submitResp.headers.get('content-type').startsWith('application/json')) { 
            const data = await submitResp.json() 
            this.errorMsg = data.msg
            return
          }
          this.errorMsg = `Cancel failed - ${submitResp.status} ${submitResp.statusText}`
        }
        this.$emit('statusRefresh')
      } catch(err) {
        this.errorMsg = err.toString()
      }
    }          
  }
}
