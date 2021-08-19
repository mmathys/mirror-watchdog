#!/usr/bin/env node
import meow from "meow"
import puppeteer from "puppeteer"

const defaultAppUrl = "https://mirror-1598972059056.web.app/"

const cli = meow(
  `
  Usage
	  $ watchdog -c <chrome executable path>

	Options
	  --chrome, -c    Specify the chrome executable path. This is required.
	  --kiosk, -k     Launch in kiosk mode
    --url, -u       Specify the application url. Defaults to ${defaultAppUrl}.
`,
  {
    importMeta: import.meta,
    flags: {
      chrome: {
        type: "string",
        alias: "c",
        isRequired: true,
      },
      kiosk: {
        type: "boolean",
        alias: "k"
      },
      url: {
        type: "string",
        alias: "u"
      },
    },
  }
)

async function launch() {
  let url = cli.flags.url || defaultAppUrl
  let args = ["--noerrdialogs", "--disable-infobars"]
  if (cli.flags.kiosk) args.push("--kiosk")
  
  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: cli.flags.chrome,
      headless: false,
      args,
      defaultViewport: null,
      ignoreDefaultArgs: ["--enable-automation"],
    })
  } catch (e) {
    fail("could not launch browser", e)
  }

  const page = await browser.newPage()
  await page.goto(url, { waitUntil: "networkidle2" })
  console.log("app loaded.")

  setInterval(async () => {
    try {
      await page.waitForSelector("#watchdog-identifier", { timeout: 5 * 1000 })
    } catch (e) {
      console.log("Could not find element #watchdog-identifier – restarting app.")
      await page.goto(url)
    }
  }, 20 * 1000)
}

function fail(msg, e) {
  console.error(msg)
  console.error(e)
  process.exit(1)
}

launch()
