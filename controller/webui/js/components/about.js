export default {
  name: 'about',


  template: `
    <div>
      <section class="hero is-link is-bold">
      
        <div class="hero-body">
          <img src="img/icon.svg" class="logo"/>
          <div class="container">
            <h1 class="title is-1">
              RayScale
            </h1>
            <h2 class="subtitle">
              A network distributed raytracer
            </h2>
          </div>
        </div>
      </section>

      <div class="about">
        <p>RayScale is a network distributed, 3D renderer based on ray tracing.<br> Written in Node.js / TypeScript, RayScale is designed for scaling out using containers<br>
        <a class="button" href="https://rayscale.benco.io/">Read More</a>
        </p>

        <br><br>
        <p>RayScale is open source (MIT license) and more details and source code is available on GitHub <br>
        <a href="https://github.com/benc-uk/rayscale" class="button is-primary"><i class="fab fa-github"></i> &nbsp; Git Hub Project</a></p>

        <hr/>
        <p>Version 1.4.0, July 2020</p>
        <p>&copy; Ben Coleman 2018 ~ 2020</p>        
      </div>
    </div>
  `,
}
