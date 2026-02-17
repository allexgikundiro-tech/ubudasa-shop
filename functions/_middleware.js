export async function onRequest({ request, next }) {
    const url = new URL(request.url);
    const productId = url.searchParams.get('product');

    // Proceed normally if no product ID is in the URL
    if (!productId) {
        return next();
    }

    // Fetch exact product data from your Sanity backend
    const sanityQuery = encodeURIComponent(`*[_type == "product" && _id == "${productId}"][0]{name, details, "imageUrl": image.asset->url}`);
    const sanityUrl = `https://r5k0tcbx.api.sanity.io/v2023-01-01/data/query/production?query=${sanityQuery}`;

    try {
        const response = await fetch(sanityUrl);
        const { result } = await response.json();

        // If product not found, return normal page
        if (!result) return next();

        // Extract description text
        let descText = "Quality product from UBUDASA Shop";
        if (result.details && result.details[0] && result.details[0].children) {
            descText = result.details[0].children[0].text;
        } else if (typeof result.details === 'string') {
            descText = result.details;
        }

        // Get the original HTML response
        const htmlResponse = await next();

        // Inject dynamic Open Graph tags into the <head>
        return new HTMLRewriter()
            .on('head', {
                element(el) {
                    el.append(`<meta property="og:title" content="${result.name} | UBUDASA Shop">`, { html: true });
                    el.append(`<meta property="og:description" content="${descText}">`, { html: true });
                    if (result.imageUrl) {
                        // THIS IS THE UPDATED LINE
                        el.append(`<meta property="og:image" content="${result.imageUrl}?w=1200&h=630&fit=fill&bg=ffffff">`, { html: true });
                    }
                }
            })
            .transform(htmlResponse);

    } catch (error) {
        // Fallback to normal page if Sanity fetch fails
        return next();
    }
}
