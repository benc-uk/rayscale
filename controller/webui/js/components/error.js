export default {
  template: `
    <div class="modal" :class="{ 'is-active': message }">
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head has-background-danger">
        <p class="modal-card-title">{{ title }}</p>
      </header>
      <section class="modal-card-body">
        {{ message }}
      </section>
      <footer class="modal-card-foot">
        <button class="button" @click="$emit('closed')">OK</button>
      </footer>
    </div>
  </div>`,

  props: {
    message: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: true
    }
  }
}