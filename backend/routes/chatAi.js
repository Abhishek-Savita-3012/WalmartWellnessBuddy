import fetch from 'node-fetch';

const TOGETHER_AI_API_KEY = '2e58b40d614daa2548fedb888ba701982e1c1f28cc73ad01132b2ea3cdee6e45';

if (!TOGETHER_AI_API_KEY) {
  console.error("TOGETHER_AI_API_KEY is not set.");
  process.exit(1);

  async function generateChatResponse(prompt) {
    const messages = [
      {
        role: "system",
        content: "You are a helpful AI assistant. When asked for ingredients for a meal, list only the ingredient names, clearly separated by commas. Do not include any other text or formatting like numbered lists or introductory phrases. For example, if asked for fruits, return 'Apple, Banana, Orange'."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    try {
      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOGETHER_AI_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
          messages: messages,
          max_tokens: 150,
          temperature: 0.5,
          stop: [".", "\n", "-"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error from Together AI: ${response.status} - ${errorText}`);
        throw new Error(`Together AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      let aiReplyContent = data.choices[0].message.content.trim();

      // Further clean up the AI reply
      aiReplyContent = aiReplyContent.replace(/^[-\d\s.]*/gm, '').trim();
      if (aiReplyContent.startsWith('Here are some suggested ingredients:')) {
        aiReplyContent = aiReplyContent.replace('Here are some suggested ingredients:', '').trim();
      }
      if (aiReplyContent.startsWith('The ingredients are:')) {
        aiReplyContent = aiReplyContent.replace('The ingredients are:', '').trim();
      }

      let ingredients = aiReplyContent.split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (ingredients.length === 1 && ingredients[0].includes(' and ')) {
        ingredients = ingredients[0].split(' and ').map(item => item.trim());
      }

      console.log("Parsed Ingredients from AI:", ingredients);
      return ingredients;

    } catch (error) {
      console.error("Error calling Together AI:", error);
      throw error;
    }
  }
}
export default generateChatResponse;
