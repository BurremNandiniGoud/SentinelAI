declare module 'three/examples/jsm/postprocessing/EffectComposer' {
  import { WebGLRenderer, WebGLRenderTarget } from 'three'
  export class EffectComposer {
    constructor(renderer: WebGLRenderer)
    render(delta?: number): void
    setSize(width: number, height: number): void
    renderToScreen: boolean
    renderTarget1: WebGLRenderTarget
    renderTarget2: WebGLRenderTarget
    addPass(pass: any): void
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
  import { Camera, Scene } from 'three'
  export class RenderPass {
    constructor(scene: Scene, camera: Camera)
    render(): void
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
  import { Vector2 } from 'three'
  export class UnrealBloomPass {
    constructor(resolution: Vector2, strength?: number, radius?: number, threshold?: number)
    strength: number
  }
}

declare module 'three/examples/jsm/postprocessing/ShaderPass' {
  import { ShaderMaterial } from 'three'
  export class ShaderPass {
    constructor(shader: { uniforms: Record<string, any>; vertexShader: string; fragmentShader: string })
    uniforms: Record<string, any>
    render(): void
  }
}

declare module 'three/examples/jsm/shaders/GammaCorrectionShader' {
  export const GammaCorrectionShader: any
}

declare module 'three/examples/jsm/shaders/CopyShader' {
  export const CopyShader: any
}
