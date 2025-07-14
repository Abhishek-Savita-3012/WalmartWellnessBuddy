const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('userInput');

async function sendMessage() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    appendMessage(prompt, 'user');
    userInput.value = '';

    try {
        const res = await fetch('http://localhost:5000/api/meals/ai-meal-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Server error response:', errorData);
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('Combined AI and Walmart search response:', data);

        if (data.message) {
            appendMessage(data.message, 'bot');
        }

        if (data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0) {
            if (!data.message || !data.message.includes('ingredients')) { 
                 appendMessage(`Here are some suggested ingredients: ${data.ingredients.join(', ')}`, 'bot');
            }

            if (data.results && Object.keys(data.results).length > 0) {
                for (const ingredient of data.ingredients) {
                    const products = data.results[ingredient] || []; 

                    if (products.length > 0) {
                        appendMessage(`🛒 Top results for "${ingredient}":`, 'bot');

                        products.forEach(p => {
                            const priceDisplay = typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : 'N/A';

                            const productHTML = `
                                <div class="product-item">
                                    ${p.thumbnail ? `<img src="${p.thumbnail}" alt="${p.title}" style="max-width: 80px; max-height: 80px; margin-right: 10px; vertical-align: middle;">` : ''}
                                    <div>
                                        🛍️ <strong>${p.title}</strong><br>
                                        💵 Price: ${priceDisplay}<br>
                                        🔗 <a href="${p.link}" target="_blank">View on Walmart</a>
                                    </div>
                                </div>
                            `;
                            appendMessage(productHTML, 'bot', true); 
                        });
                    } else {
                        appendMessage(`No results found for "${ingredient}".`, 'bot');
                    }
                }
            } else {
                appendMessage('No Walmart products found for the suggested ingredients.', 'bot');
            }
        } else if (!data.message) {
            appendMessage('AI did not return a recognizable meal or ingredients. Please try rephrasing your request.', 'bot');
        }

    } catch (err) {
        console.error('Error in sendMessage:', err);
        appendMessage(`❌ Error: ${err.message || 'An unknown error occurred.'} Please try again.`, 'bot');
    }
}

function appendMessage(text, sender, isHTML = false) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    if (isHTML) {
        msg.innerHTML = text;
    } else {
        msg.innerText = text;
    }
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
