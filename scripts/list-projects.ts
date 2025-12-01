import fs from "node:fs"
import path from "node:path"
import process from "node:process"

import { config as loadEnv } from "dotenv"

import { fetchLinearProjects, getLinearApiKey } from "../lib/linear"

function hydrateEnv() {
  const root = process.cwd()
  const envFiles = [".env.local", ".env"]

  for (const fileName of envFiles) {
    const filePath = path.join(root, fileName)
    if (fs.existsSync(filePath)) {
      loadEnv({ path: filePath, override: true })
    }
  }
}

function formatDate(date?: string | null) {
  if (!date) return "-"
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date))
  } catch {
    return date
  }
}

async function main() {
  hydrateEnv()

  const limitArg = process.argv[2]
  const limit = Number.isInteger(Number(limitArg)) ? Number(limitArg) : undefined

  if (!getLinearApiKey()) {
    console.error("LINEAR_API_KEY is missing. Add it to .env.local or export it before running this command.")
    process.exitCode = 1
    return
  }

  try {
    const projects = await fetchLinearProjects({ first: limit ?? 25 })

    if (!projects.length) {
      console.log("No projects returned. Check your Linear workspace permissions.")
      return
    }

    console.log(`Showing ${projects.length} Linear project(s):`)
    console.log("--------------------------------------------------------------")
    projects.forEach((project) => {
      const summary = [
        project.name,
        project.slug ? `(${project.slug})` : "",
        project.state ?? "",
      ]
        .filter(Boolean)
        .join(" ")

      const deadline = formatDate(project.targetDate)
      const line = `${project.id} | ${summary} | target: ${deadline} | ${project.url ?? ""}`.trim()
      console.log(line)
    })
  } catch (error) {
    console.error("Unable to load Linear projects:")
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exitCode = 1
  }
}

main()
