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

const defaultPrompt = `
Generate a flowchart in JSON format for a system design use case. The flowchart should include the following node types:
- startNode: The starting point of the flowchart.
- codeExecutionNode: A node that executes a piece of code. It should include a "code" property with JavaScript code. If you need to reference input from the node above, use the variable "input". If the referenced input is JSON, expect it to be a parsed object already. The code should return the output to pass it to the nodes below. Ensure that the codeExecutionNode only processes synchronous JavaScript code and avoid using asynchronous operations.
- llmNode: A node that sends a query to a language model. It should include a "prompt" property with the query text.
- dataNode: A node that holds static data. It should include a "jsonData" property with JSON data.
- blobStorageNode: A node that stores data in blob storage.

Each node should have the following properties:
- id: A unique identifier for the node.
- type: The type of the node (e.g., "startNode", "codeExecutionNode", "llmNode", "dataNode", "blobStorageNode").
- data: An object containing the node's data, including a label and any additional properties specific to the node type.
- position: An object with x and y coordinates specifying the node's position.

Each edge should have the following properties:
- id: A unique identifier for the edge.
- source: The id of the source node.
- target: The id of the target node.
- type: The type of the edge.

Example JSON output:
{
  "nodes": [
    {
      "id": "1",
      "type": "startNode",
      "data": { "label": "Start Node" },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "2",
      "type": "codeExecutionNode",
      "data": { "label": "Execute Code", "code": "const name = input.name; return name;" },
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "3",
      "type": "llmNode",
      "data": { "label": "Query LLM", "prompt": "What is the capital of France?" },
      "position": { "x": 500, "y": 100 }
    },
    {
      "id": "4",
      "type": "dataNode",
      "data": { "label": "Static Data", "jsonData": "{\"key\": \"value\"}" },
      "position": { "x": 700, "y": 100 }
    },
    {
      "id": "5",
      "type": "blobStorageNode",
      "data": { "label": "Blob Storage" },
      "position": { "x": 900, "y": 100 }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "type": "default" },
    { "id": "e2-3", "source": "2", "target": "3", "type": "default" },
    { "id": "e3-4", "source": "3", "target": "4", "type": "default" },
    { "id": "e4-5", "source": "4", "target": "5", "type": "default" }
  ]
}

Generate a flowchart for the following user-inputted case, trying to position the nodes to make the most sense for the flow of data. Return ONLY the JSON.

Here is the user prompt:

`;

export async function generateFlowDiagram(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`HTTP function processed request for url "${request.url}"`);

    // Extract the query from the request
    const useCase: string | null = request.query.get('useCase') || await request.text();
    if (!useCase) {
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
            model: "gpt-4o", // Specify the model you want to use
            messages: [{ role: "user", content: defaultPrompt + useCase }],
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

app.http('generateFlowDiagram', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: generateFlowDiagram
});
