import { cache } from "react"

const DUNE_KEY = process.env.DUNE_KEY || ""
const meta = {
  "x-dune-api-key": DUNE_KEY,
}
const header = new Headers(meta)

const duneQuery = async <ResponseT>(
  id: number
): Promise<{
  execution_started_at: string
  result: {
    rows: ResponseT
  }
}> => {
  return await fetch(`https://api.dune.com/api/v1/query/${id}/results`, {
    headers: header,
  })
    .then((res) => res.json())
    .catch(() => [])
}

type HstEmission = {
  block_date: string
  hnt_minted: string
}

type TreasuryHntEmission = {
  block_date: string
  entity: "IOT Treasury" | "MOBILE Treasury"
  hnt_minted: string
}

type TotalHntEmission = {
  block_date: string
  hnt_minted: number
}

export const fetchHntEmissions = cache(async () => {
  const [subDaoEmissions, hstEmissions] = await Promise.all([
    duneQuery<TreasuryHntEmission[]>(3321568),
    duneQuery<HstEmission[]>(3439959),
  ])

  const totalEmissionsCombined: { [date: string]: TotalHntEmission } = {}
  hstEmissions.result.rows.forEach(({ block_date, hnt_minted }) => {
    totalEmissionsCombined[block_date] = {
      block_date,
      hnt_minted: parseFloat(hnt_minted),
    }
  })
  subDaoEmissions.result.rows.forEach(({ block_date, hnt_minted }) => {
    if (totalEmissionsCombined[block_date]) {
      totalEmissionsCombined[block_date].hnt_minted += parseFloat(hnt_minted)
    }
  })

  const totalEmissions = Object.keys(totalEmissionsCombined).map((date) => {
    const { block_date, hnt_minted } = totalEmissionsCombined[date]
    return {
      block_date,
      hnt_minted: Math.floor(hnt_minted),
    }
  })

  return {
    totalEmissions,
    subDaoEmissions,
  }
})

type HntBurned = {
  block_date: string
  dc_minted: string
  hnt_burned: number
  hnt_avg_price: string
}

export const fetchHntBurn = () => {
  return duneQuery<HntBurned[]>(2627250)
}
