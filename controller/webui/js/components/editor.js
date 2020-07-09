import error from './error.js'

let editor
require.config({ paths: { 'vs': 'js/monaco' } })

export default {
  name: 'editor',

  components: { error },

  props: {
    running: {
      type: Boolean,
      default: false
    }
  },

  template: `
  <div class="flexcol">
    <div class="mb-1">
      <button class="button is-success is-medium" @click="jobSubmit" v-show="!running">Start Job &nbsp;<i class="fas fa-play fa-fw"></i></button>
      <button class="button is-warning is-medium" @click="jobCancel" v-show="running">Cancel Job &nbsp;<i class="fas fa-stop fa-fw"></i></button>
      <button class="button is-loading is-medium is-dark" v-show="running">Loading</button>

      <div class="is-pulled-right">
        <a href="https://github.com/benc-uk/rayscale/tree/master/examples/jobs" target="_blank" class="button is-medium is-info">Sample Scenes&nbsp;<i class="fas fa-eye fa-fw"></i></a>
        <a href="http://rayscale.benco.io/docs/reference.html" target="_blank" class="button is-medium is-info">Docs&nbsp;<i class="fas fa-book fa-fw"></i></a>
      </div>
    </div>
    
    <div id="editor" name="editor" />
    <error title="Job Submission Error" :message="errorMsg" @closed="errorMsg=''"/>
  </div>`,

  data () {
    return {
      errorMsg: null,
    }
  },

  mounted() {
    /*window.addEventListener('resize', (e) => {
      editor.layout()
    })*/

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
        const submitResp = await fetch('/api/jobs', {
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-yaml' },
          method: 'POST',
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
