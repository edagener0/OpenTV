import { buildApp } from './app.js'
import { loadConfig } from './config.js'

async function main(): Promise<void> {
  const config = loadConfig()
  const app = await buildApp({ config })

  if (!config.tmdbApiKey) {
    app.log.warn('TMDB_API_KEY is not set. Browsing and search will be unavailable.')
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Shutting down')
    try {
      await app.close()
      process.exit(0)
    } catch (error) {
      app.log.error(error)
      process.exit(1)
    }
  }
  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))

  await app.listen({ host: config.host, port: config.port })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
