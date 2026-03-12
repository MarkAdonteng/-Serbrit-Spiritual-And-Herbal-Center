/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { createHmac, randomUUID } from 'node:crypto'

function imagekitAuthPlugin(privateKey: string | undefined) {
  return {
    name: 'imagekit-auth',
    configureServer(server: { middlewares: { use: (path: string, handler: unknown) => void } }) {
      server.middlewares.use('/__imagekit/auth', (req: any, res: any) => {
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
