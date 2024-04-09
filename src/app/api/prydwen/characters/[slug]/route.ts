export async function GET(request: Request, { params }: { params: { slug: string } }) {
    const res = await fetch(`https://www.prydwen.gg/page-data/star-rail/characters/${params.slug}/page-data.json`)

    if (!res.ok) {
        throw new Error(`Failed to fetch character ${params.slug}`)
    }

    const data = (await res.json()).result.data.currentUnit.nodes[0];

    return Response.json(data)
}