const renderer = new THREE.WebGLRenderer({
  antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(0x000000)
renderer.shadowMap.enabled = true

const sectionTag = document.querySelector("section")
sectionTag.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000)

const controls = new THREE.OrbitControls( camera, renderer.domElement )
camera.position.z = -900
controls.update()

const ambientLight = new THREE.AmbientLight(0xffffff)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight.position.set(100, 200, -200)
directionalLight.castShadow = true

directionalLight.shadow.mapSize.width = 3000
directionalLight.shadow.mapSize.height = 3000
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 10000
directionalLight.shadow.camera.top = 1000
directionalLight.shadow.camera.bottom = -1000
directionalLight.shadow.camera.left = -1000
directionalLight.shadow.camera.right = 1000

scene.add(directionalLight)

const loadOneItem = (url) => {
  return new Promise((resolve, reject) => {
    if (url.indexOf('.mtl') !== -1) {
      const mtlLoader = new THREE.MTLLoader()
      mtlLoader.load(url, (obj) => {
        resolve(obj)
      })
    } else if (url.indexOf('.obj') !== -1) {
      const objLoader = new THREE.OBJLoader()
      objLoader.load(url, (obj) => {
        resolve(obj)
      })
    }
  })
}

const loadAll = (urls) => {
  return Promise.all(
    urls.map(u => {
      return loadOneItem(u)
    })
    )
}

const loadFiles = function (mtlUrl, objUrl) {
  return new Promise((resolve, reject) => {
    const objLoader = new THREE.OBJLoader()
    const mtlLoader = new THREE.MTLLoader()

    mtlLoader.load(mtlUrl, function (materials) {
      objLoader.setMaterials(materials)
      objLoader.load(objUrl, function (obj) {
        resolve(obj)
      })
    })
  })
}

const uniforms = {
  time: { value: 1.0 },
  resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  solidColor: { value: new THREE.Color(0xffffff) }
}

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: `
  uniform float time;
  void main () {
    vec3 nPos = position;
    nPos.y *= sin(nPos.x * 0.001 + time);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( nPos, 1.0 );
  }
  `,
  fragmentShader: `
  uniform vec3 solidColor;
  void main (void) {
    gl_FragColor = vec4(solidColor, 0.7);
  }
  `
})

let delayItems = [
]

loadAll([
  './wave.obj'
  ]).then((items) => {
    let currentObject = items[0]
    let totalObjects = 6
    for (var i = 0; i < totalObjects; i++) {
      let currentMatClone  = material.clone()
      let currentClone = currentObject.clone()
      currentClone.traverse((child) => {
        if (child.type === 'Mesh') {
          child.material = currentMatClone
          child.castShadow = true
        }
      });
      currentClone.position.set(0,-100 * i, 0)
      let delay = 1000 * i
      delayItems.push({
        delay,
        update: () => {
          currentMatClone.uniforms.time.value = delay - window.performance.now() / 1000
        }
      })
      setTimeout(function(){
        scene.add(currentClone)
       }, 1000 * i)
    }
  })

  const animate = function (timestamp) {
    uniforms.time.value = timestamp / 1000
    delayItems.forEach(d => d.update())
    camera.lookAt(scene.position)
    controls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }

  animate()

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    uniforms.resolution.value.x = window.innerWidth
    uniforms.resolution.value.y = window.innerHeight
  })
