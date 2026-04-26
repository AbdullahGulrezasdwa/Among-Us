"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    particles: THREE.Points
    rings: THREE.Group
    frameId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return

    const container = containerRef.current
    const width = window.innerWidth
    const height = window.innerHeight

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000011, 0.0008)

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000)
    camera.position.z = 500

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000011, 1)
    container.appendChild(renderer.domElement)

    // Starfield particles
    const particleCount = 5000
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const neonColors = [
      new THREE.Color(0x00ffff),
      new THREE.Color(0xff00ff),
      new THREE.Color(0x00ff00),
      new THREE.Color(0xff6600),
      new THREE.Color(0x0066ff),
    ]

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 2000
      positions[i3 + 1] = (Math.random() - 0.5) * 2000
      positions[i3 + 2] = (Math.random() - 0.5) * 2000

      const color = neonColors[Math.floor(Math.random() * neonColors.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = Math.random() * 3 + 1
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // Glowing rings
    const rings = new THREE.Group()
    const ringColors = [0x00ffff, 0xff00ff, 0x00ff00]

    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.TorusGeometry(100 + i * 60, 2, 16, 100)
      const material = new THREE.MeshBasicMaterial({
        color: ringColors[i % ringColors.length],
        transparent: true,
        opacity: 0.3 + Math.random() * 0.3,
      })
      const ring = new THREE.Mesh(geometry, material)
      ring.rotation.x = Math.random() * Math.PI
      ring.rotation.y = Math.random() * Math.PI
      rings.add(ring)
    }
    scene.add(rings)

    // Central sphere (spaceship/station)
    const sphereGeometry = new THREE.IcosahedronGeometry(30, 1)
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    scene.add(sphere)

    // Grid floor
    const gridHelper = new THREE.GridHelper(2000, 50, 0x00ffff, 0x004444)
    gridHelper.position.y = -300
    gridHelper.material.transparent = true
    gridHelper.material.opacity = 0.3
    scene.add(gridHelper)

    // Animation
    let time = 0
    const animate = () => {
      time += 0.005

      // Rotate particles slowly
      particles.rotation.y += 0.0003
      particles.rotation.x += 0.0001

      // Animate rings
      rings.children.forEach((ring, i) => {
        ring.rotation.x += 0.001 * (i + 1) * 0.5
        ring.rotation.z += 0.002 * (i + 1) * 0.3
      })

      // Pulse sphere
      sphere.scale.setScalar(1 + Math.sin(time * 2) * 0.1)
      sphere.rotation.y += 0.01
      sphere.rotation.x += 0.005

      // Camera slight movement
      camera.position.x = Math.sin(time * 0.3) * 50
      camera.position.y = Math.cos(time * 0.2) * 30
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      sceneRef.current!.frameId = requestAnimationFrame(animate)
    }

    sceneRef.current = { scene, camera, renderer, particles, rings, frameId: 0 }
    animate()

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId)
        renderer.dispose()
        container.removeChild(renderer.domElement)
        sceneRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} className="fixed inset-0 -z-10" />
}
