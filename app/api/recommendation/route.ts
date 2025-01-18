import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const body = await request.json()
    console.log(body)
    try {
        const response = await fetch(`${process.env.FASTAPI_URL}/recommendation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            throw new Error('Failed to fetch recommendations from FastAPI')
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

