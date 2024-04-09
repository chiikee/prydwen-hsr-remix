export async function GET() {
    const res = await fetch("https://www.prydwen.gg/page-data/star-rail/tier-list/page-data.json")

    if (!res.ok) {
        throw new Error('Failed to fetch tierlist')
    }

    const data = (await res.json()).result.data.allCharacters.nodes;

    return Response.json(data)
}