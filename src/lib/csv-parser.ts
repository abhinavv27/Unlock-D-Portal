/**
 * A robust, lightweight RFC 4180-compliant CSV parser.
 * Handles double-quotes, commas inside cells, and variable line endings (\r\n or \n).
 */
export function parseCSV(csvText: string): string[][] {
  const result: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"'
          i++ // skip next double quote
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(cell.trim())
        cell = ''
      } else if (char === '\r' || char === '\n') {
        row.push(cell.trim())
        cell = ''
        if (row.length > 0 && row.some(c => c !== '')) {
          result.push(row)
        }
        row = []
        if (char === '\r' && nextChar === '\n') {
          i++ // skip LF in CRLF
        }
      } else {
        cell += char
      }
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim())
    if (row.some(c => c !== '')) {
      result.push(row)
    }
  }

  return result
}

/**
 * Parses a CSV export from Unstop, extracting the team ID, team name, and email columns.
 */
export function parseUnstopCSV(csvText: string): Array<{ teamId: string; teamName: string; email: string }> {
  const parsed = parseCSV(csvText)
  if (parsed.length < 2) return []

  const headers = parsed[0].map((h) => h.toLowerCase().trim())
  
  // Look for any headers matching team ID, team name, and email variations
  const teamIdIndex = headers.findIndex(
    (h) => h.includes('team id') || h.includes('team_id') || h === 'id' || h.includes('unstop id')
  )
  const teamNameIndex = headers.findIndex(
    (h) => h.includes('team name') || h.includes('team_name') || h === 'name'
  )
  const emailIndex = headers.findIndex(
    (h) => h.includes('email') || h.includes('e-mail') || h.includes('mail')
  )

  if (teamIdIndex === -1 || teamNameIndex === -1 || emailIndex === -1) {
    throw new Error('CSV headers must include "Team ID", "Team Name", and "Email" columns.')
  }

  const teams: Array<{ teamId: string; teamName: string; email: string }> = []
  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i]
    if (row.length <= Math.max(teamIdIndex, teamNameIndex, emailIndex)) continue

    const teamId = row[teamIdIndex]
    const teamName = row[teamNameIndex]
    const email = row[emailIndex]

    if (teamId && teamName && email) {
      teams.push({ teamId, teamName, email })
    }
  }

  return teams
}
