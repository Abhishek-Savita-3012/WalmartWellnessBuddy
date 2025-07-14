import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const SERP_API_KEY = 'process.env.SERP_API_KEY';

async function searchWalmartTopItems(originalIngredientName) {
    let queryForWalmart = originalIngredientName; 

    const fruitVegetableRefinements = {
        'apple': 'fresh fuji apple',
        'banana': 'fresh ripe banana bunch', 
        'orange': 'fresh navel orange',
        'grape': 'fresh red seedless grapes',
        'strawberry': 'fresh strawberries 1lb',
        'blueberry': 'fresh blueberries 6oz',
        'carrot': 'fresh carrots bag',
        'potato': 'russet potato 5lb',
        'onion': 'yellow onion 3lb',
        'tomato': 'vine ripe tomato',
    };

    const lowerCaseOriginalIngredient = originalIngredientName.toLowerCase();
    if (fruitVegetableRefinements[lowerCaseOriginalIngredient]) {
        queryForWalmart = fruitVegetableRefinements[lowerCaseOriginalIngredient];
    } else {
        const lowerCaseQueryForWalmart = queryForWalmart.toLowerCase();
        if (!lowerCaseQueryForWalmart.includes('fresh') && !lowerCaseQueryForWalmart.includes('produce') && !lowerCaseQueryForWalmart.includes('grocery')) {
            queryForWalmart = `${originalIngredientName} fresh produce`;
        }
    }

    const url = `https://serpapi.com/search.json?engine=walmart&query=${encodeURIComponent(queryForWalmart)}&api_key=${SERP_API_KEY}`;
    console.log(`[SerpApi Request URL] ${url}`);

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`[SerpApi Raw Response for "${queryForWalmart}"]`, JSON.stringify(data, null, 2));

        if (data.error) {
            console.error(`[SerpApi Error for "${queryForWalmart}"]`, data.error);
            return []; 
        }

        const allWalmartResults = data?.organic_results || []; 
        const relevantResults = allWalmartResults.filter(product => {
            const lowerCaseTitle = product.title ? product.title.toLowerCase() : '';
            const lowerCaseDescription = product.description ? product.description.toLowerCase() : '';
            
            const coreIngredient = originalIngredientName.toLowerCase();

            const hasCoreIngredient =
                lowerCaseTitle.includes(coreIngredient) ||
                lowerCaseDescription.includes(coreIngredient) ||
                (coreIngredient === 'apple' && (lowerCaseTitle.includes('fuji') || lowerCaseTitle.includes('gala') || lowerCaseTitle.includes('apple'))) || // Added 'apple' itself
                (coreIngredient === 'banana' && (lowerCaseTitle.includes('bunch') || lowerCaseTitle.includes('ripe') || lowerCaseTitle.includes('banana'))) || // Added 'banana' itself
                (coreIngredient === 'orange' && (lowerCaseTitle.includes('navel') || lowerCaseTitle.includes('mandarin') || lowerCaseTitle.includes('citrus') || lowerCaseTitle.includes('orange'))); // Added 'orange' itself

            const isIrrelevant =
                lowerCaseTitle.includes('case') ||
                lowerCaseTitle.includes('watch') ||
                lowerCaseTitle.includes('toy') ||
                lowerCaseTitle.includes('clothing') ||
                lowerCaseTitle.includes('accessory') ||
                lowerCaseTitle.includes('tech') ||
                lowerCaseTitle.includes('sign') || 
                lowerCaseTitle.includes('jewelry') || 
                lowerCaseTitle.includes('head') || 
                lowerCaseTitle.includes('candy') ||
                lowerCaseDescription.includes('candy'); 

            const isDefinitelyProduce =
                lowerCaseTitle.includes('fresh') ||
                lowerCaseTitle.includes('produce') ||
                lowerCaseTitle.includes('fruit') ||
                lowerCaseTitle.includes('vegetable') ||
                lowerCaseTitle.includes('bag') || 
                lowerCaseTitle.includes('each') || 
                lowerCaseDescription.includes('fresh') ||
                lowerCaseDescription.includes('produce') ||
                lowerCaseDescription.includes('fruit') ||
                lowerCaseDescription.includes('vegetable');
                
            return hasCoreIngredient && !isIrrelevant && isDefinitelyProduce && !product.out_of_stock; 
        });

        return relevantResults.slice(0, 3).map(product => ({
            title: product.title,
            
            price: product.primary_offer && typeof product.primary_offer.offer_price === 'number' ? product.primary_offer.offer_price : 'N/A',
            link: product.product_page_url, 
            thumbnail: product.thumbnail
        }));

    } catch (error) {
        console.error(`Error fetching from SerpApi for "${queryForWalmart}":`, error);
        return [];
    }
}

router.post('/ai-meal-search', async (req, res) => {
    try {
        const { prompt } = req.body;

        const ingredients = [ 'Apple', 'Banana', 'Orange' ]; 

        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(200).json({
                message: 'AI did not return any specific ingredients. Please try rephrasing your request.',
                ingredients: [],
                results: {}
            });
        }

        const searchPromises = ingredients.map(ingredient =>
            searchWalmartTopItems(ingredient)
                .then(results => ({ ingredient, results }))
        );

        const allIngredientResults = await Promise.all(searchPromises);

        const searchResults = {};
        allIngredientResults.forEach(({ ingredient, results }) => {
            searchResults[ingredient] = results;
        });

        res.json({
            ingredients,
            results: searchResults
        });

    } catch (error) {
        console.error('Error in /ai-meal-search:', error);
        res.status(500).json({ error: 'Internal error occurred while searching meals.' });
    }
});

export default router;
