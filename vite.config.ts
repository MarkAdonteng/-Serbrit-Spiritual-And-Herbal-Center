/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { createHmac, randomUUID } from 'node:crypto'

function imagekitAuthPlugin(privateKey: string | undefined): Plugin {
  return {
    name: 'imagekit-auth',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__imagekit/auth', (_req: any, res: any, _next: any) => {
        void _next
        if (!privateKey) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing IMAGEKIT_PRIVATE_KEY' }))
          return
        }

        const token = randomUUID()
        const expire = Math.floor(Date.now() / 1000) + 30 * 60
        const signature = createHmac('sha1', privateKey).update(token + expire).digest('hex')
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ token, expire, signature }))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const privateKey = (env.IMAGEKIT_PRIVATE_KEY as string | undefined)?.trim()

  return {
    plugins: [tailwindcss(), imagekitAuthPlugin(privateKey)],
  }
})
