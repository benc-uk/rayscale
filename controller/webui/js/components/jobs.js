import error from './error.js'

export default {
  name: 'jobs',

  components: { error },

  template: `
  <div>
    <div class="mb-1">
      <button class="button is-success is-medium" @click="fetchJobs">Refresh &nbsp;<i class="fas fa-sync-alt fa-fw"></i></button>
    </div>

    <div class="jobs">
      <div class="card jobcard" v-for="job in jobData.jobs">
        <header class="card-header">
          <p class="card-header-title">
            {{ job }}
          </p>
        </header> 
        <div class="card-image">
          <figure class="image">
            <!-- the random appended string on the URL prevents caching -->
            <a :target="job+'_render'" @click="showImage='/jobs/'+job+'/'+'result_00001.png'"><img :src="'/jobs/'+job+'/result_00001.png'"></a>
          </figure>
        </div>
        <footer class="card-footer">
          <a :href="'/jobs/'+job+'/video.mp4'" class="card-footer-item" :target="job+'_video'"><i class="fas fa-video fa-fw"></i> &nbsp; Video</a>
          <a :href="'/jobs/'+job+'/result.json'" class="card-footer-item" :target="job+'_details'"><i class="fas fa-info-circle fa-fw"></i> &nbsp; Details</a>
          <a :href="'/jobs/'+job+'/job.yaml'" class="card-footer-item" :target="job+'_job'"><i class="fas fa-code fa-fw"></i> &nbsp; Job</a>
          <a @click="deleteJob(job)" class="card-footer-item is-warning"><i class="fas fa-trash fa-fw"></i> &nbsp; Delete</a>
        </footer>
      </div>
    </div>

    <article v-if="jobData.jobs && jobData.jobs.length == 0" class="message is-info">
      <div class="message-header">
        <p>No Jobs</p>
      </div>
      <div class="message-body">No job output available, please run some jobs</div>
    </article>

    <!-- Light box alike modal -->
    <div class="modal" :class="{ 'is-active': showImage }" @click="showImage=''">
      <div class="modal-background"></div>
      <div class="modal-content lightbox" >
        <img :src="showImage">
      </div>
      <button class="modal-close is-large" aria-label="close""></button>
    </div>

    <error title="Job Fetch Error" :message="errorMsg" @closed="errorMsg=''"/>
  </div>`,

  data() {
    return {
      jobData: [],
      errorMsg: '',
      showImage: ''
    }
  },

  async mounted() {
    this.fetchJobs()
    this.$root.$on('refreshJobs', () => {
      this.fetchJobs()
    })
  },

  methods: {
    fetchJobs: async function () {
      this.jobData = []
      try {
        const listResp = await fetch('/api/jobs')
        if (!listResp.ok) {
          if (listResp.headers.get('content-type').startsWith('application/json')) {
            const data = await submitResp.json()
            this.errorMsg = data.msg
            return
          }
          this.errorMsg = `Fetch jobs failed`
          return
        }
        this.jobData = await listResp.json()
      } catch (err) {
        this.errorMsg = err.toString()
      }
    },

    deleteJob: async function (job) {
      try {
        await fetch(`/api/jobs/${job}`, { method: 'DELETE' })
        this.fetchJobs()
      } catch (err) {
        this.errorMsg = err.toString()
      }
    }
  }
}
