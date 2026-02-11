---
summary: "Configure NVIDIA API provider for Kimi 2.5 model access"
read_when:
  - You want to use Kimi 2.5 via NVIDIA's API
  - You need to understand NVIDIA API setup and configuration
  - You want copy/paste config for NVIDIA provider
title: "NVIDIA"
---

# NVIDIA

NVIDIA provides access to the Kimi 2.5 model through their API with OpenAI-compatible endpoints. This provider allows you to use the powerful Kimi 2.5 language model from Moonshot AI via NVIDIA's infrastructure.

## Quick Setup

```bash
openclaw onboard --auth-choice nvidia-api-key
```

## Config snippet

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  agents: {
    defaults: {
      model: { primary: "nvidia/moonshot/kimi-2-5" },
      models: {
        "nvidia/moonshot/kimi-2-5": { alias: "Kimi 2.5 (NVIDIA)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        apiKey: "${NVIDIA_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "moonshot/kimi-2-5",
            name: "Kimi 2.5 (NVIDIA)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Getting an API key

1. Visit [NVIDIA API Catalog](https://build.nvidia.com)
2. Sign up or log in to your NVIDIA account
3. Navigate to the API Keys section
4. Generate a new API key for accessing the Kimi 2.5 model
5. Copy your API key (it starts with `nvapi-`)

## Model Details

- **Model ID**: `moonshot/kimi-2-5`
- **Context Window**: 256,000 tokens
- **Max Tokens**: 8,192 tokens
- **Input Types**: Text
- **Reasoning**: No

## Notes

- Model refs use `nvidia/<model-id>` format
- The NVIDIA API is OpenAI-compatible
- Cost tracking defaults to 0 (update based on your NVIDIA pricing)
- Override pricing and context metadata in `models.providers` if needed
- If NVIDIA publishes different context limits, adjust `contextWindow` accordingly

## Environment Variable

Set your API key in the environment:

```bash
export NVIDIA_API_KEY="nvapi-your-key-here"
```

Or add it to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
echo 'export NVIDIA_API_KEY="nvapi-your-key-here"' >> ~/.bashrc
```

## Troubleshooting

### Authentication errors

If you receive authentication errors:

1. Verify your API key is correct
2. Check that the API key has not expired
3. Ensure you have access to the Kimi 2.5 model in your NVIDIA account

### Model not found

If the model is not found:

1. Verify the model ID is correct: `moonshot/kimi-2-5`
2. Check that the model is available in your NVIDIA API plan
3. Ensure the base URL is correct: `https://integrate.api.nvidia.com/v1`

## See also

- [Moonshot AI (Kimi) provider](/providers/moonshot) - Direct access to Kimi models
- [Model Providers](/concepts/model-providers) - Overview of all providers
- [Configuration](/configuration) - General configuration guide
