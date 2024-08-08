import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import OpenAI from "openai";
require('dotenv').config();

// Initialize OpenAI API client
const OPENAI_API_KEY: string | undefined = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not set in environment variables.");
}

const openai = new OpenAI({
  organization: "org-JdOoxLGCcoIpT1S5aOtGjb4n",
  apiKey: OPENAI_API_KEY
});

export async function openAiRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`HTTP function processed request for url "${request.url}"`);

    // Extract the query from the request
    const query: string | null = request.query.get('query') || await request.text();
    if (!query) {
        return { 
          status: 400,
          body: "Please provide a query parameter.",
          headers: {
            'Access-Control-Allow-Origin': '*', // Allow all origins (for development)
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        };
    }

    try {
        // Send a request to the OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Specify the model you want to use
            messages: [{ role: "user", content: query }],
        });

        // Extract and return the AI response
        const aiResponse: string = completion.choices[0].message?.content || "No response from AI.";
        return {
          body: aiResponse,
          headers: {
              'Access-Control-Allow-Origin': '*', // Change '*' to your Next.js domain in production
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
          }
        };
    } catch (error: any) {
        context.error("Error calling OpenAI API", error);
        return {
          status: 500,
          body: `An error occurred: ${error.message}`,
          headers: {
              'Access-Control-Allow-Origin': '*', // Allow all origins (for development)
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
          }
      };
    }
};

app.http('openAiRequest', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: openAiRequest
});
