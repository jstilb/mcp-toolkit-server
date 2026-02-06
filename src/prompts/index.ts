/**
 * MCP Prompts - reusable prompt templates.
 *
 * Prompts are parameterized templates that clients can use
 * to generate structured interactions with the tools.
 */

import { z } from "zod";

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: PromptArgument[];
}

export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface PromptMessage {
  role: "user" | "assistant";
  content: string;
}

export function getPromptDefinitions(): PromptDefinition[] {
  return [
    {
      name: "research_topic",
      description:
        "Research a topic by searching the web, summarizing findings, and extracting key entities",
      arguments: [
        {
          name: "topic",
          description: "The topic to research",
          required: true,
        },
        {
          name: "depth",
          description: "Research depth: quick, standard, or deep",
          required: false,
        },
      ],
    },
    {
      name: "analyze_text",
      description:
        "Analyze text for sentiment, entities, and provide a summary",
      arguments: [
        {
          name: "text",
          description: "The text to analyze",
          required: true,
        },
      ],
    },
    {
      name: "weather_briefing",
      description:
        "Get a weather briefing with recommendations for a location",
      arguments: [
        {
          name: "location",
          description: "City or location name",
          required: true,
        },
      ],
    },
  ];
}

export function generatePromptMessages(
  name: string,
  args: Record<string, string>
): PromptMessage[] {
  switch (name) {
    case "research_topic": {
      const topic = args["topic"] ?? "general topic";
      const depth = args["depth"] ?? "standard";
      return [
        {
          role: "user",
          content: `I'd like to research "${topic}" at a ${depth} level. Please:\n\n1. Search for the most relevant and recent information\n2. Summarize the key findings\n3. Extract important entities (people, organizations, technologies)\n4. Provide a structured overview with sources\n\nUse the web_search, summarize, and extract_entities tools to gather and process the information.`,
        },
      ];
    }

    case "analyze_text": {
      const text = args["text"] ?? "";
      return [
        {
          role: "user",
          content: `Please analyze the following text comprehensively:\n\n"${text}"\n\nPerform:\n1. Sentiment analysis (using analyze_sentiment tool)\n2. Entity extraction (using extract_entities tool)\n3. Brief summary (using summarize tool)\n\nProvide a structured analysis report.`,
        },
      ];
    }

    case "weather_briefing": {
      const location = args["location"] ?? "current location";
      return [
        {
          role: "user",
          content: `Get the current weather for ${location} and provide:\n\n1. Current conditions (temperature, humidity, wind)\n2. Brief forecast\n3. Activity recommendations based on the weather\n\nUse the get_weather tool to fetch the data.`,
        },
      ];
    }

    default:
      return [
        {
          role: "user",
          content: `Unknown prompt: ${name}. Available prompts: research_topic, analyze_text, weather_briefing.`,
        },
      ];
  }
}
