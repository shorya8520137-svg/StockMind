const BASE_URL = "http://13.201.222.24:5000"

export async function api(url, method = "GET", body) {
    const res = await fetch(`${BASE_URL}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        throw new Error("API request failed")
    }

    return res.json()
}
