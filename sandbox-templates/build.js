import { Template, defaultBuildLogger, waitForURL } from "e2b";

const template = Template()
  .fromNodeImage("21-slim")
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
      'npx --yes create-next-app@15.5.4 . --yes'
    )
  .runCmd('npx --yes shadcn@2.6.3 init --yes -b neutral --force')
  .runCmd('npx --yes shadcn@2.6.3 add --all --yes')
  .runCmd(
      'mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app'
    )
  .setWorkdir('/home/user')
  .setStartCmd(
    "npx next dev --turbo --hostname 0.0.0.0 --port 3000",
    waitForURL("http://localhost:3000") //{ timeoutMs: 120_000 })
  )

async function main() {
  try {
    console.log("🔨 Building template...")

    const templateId = await Template.build(template, {
      alias: 'v0-clone-build-v1',
      cpuCount: 2,
      memoryMB: 2048,
      onBuildLogs: defaultBuildLogger({ level: "debug" }),
    })

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✓ Template built successfully!")
    console.log("📦 Template ID:", templateId)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━")

  } catch (error) {
    console.error("❌ Build Error:", error)
    process.exit(1)
  }
}

main()