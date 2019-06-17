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
camera.position.z = -900

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

let wave = null

const uniforms = {
  time: { value: 1.0 },
  resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  solidColor: { value: new THREE.Color(0xffffff) }
}

// function loadNextFile() {

//   if (index > files.length - 1) return

//   objLoader.load(files[index], function(object) {

//     scene.add(object)

//     index++
//     loadNextFile()

//   })

// }

loadNextFile()

loadFiles("wave.mtl", "wave.obj").then(function (obj) {
  // obj.rotateX(Math.PI / 2)
  // obj.rotateY(Math.PI)

  const wave1 = new THREE.Mesh(obj)
  wave1.position.set(0,0,0)
  const wave2 = new THREE.Mesh(obj)
  wave2.position.set(0,0,20)
  const wave3 = new THREE.Mesh(obj)
  wave3.position.set(0,0,40)

  // wave = obj
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

  material.uniforms.time.value = window.performance.now() * 0.03

  obj.traverse(child => {
    child.material = material
    child.castShadow = true
  })
  scene.add(obj)
})

const animate = function (timestamp) {
  uniforms.time.value = timestamp / 1000;
  camera.lookAt(scene.position)
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  uniforms.resolution.value.x = window.innerWidth;
  uniforms.resolution.value.y = window.innerHeight;
})
