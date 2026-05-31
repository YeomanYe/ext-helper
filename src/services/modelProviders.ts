import type { AiSettings, CustomModelProvider } from "@/types"

export interface ModelProviderPreset {
  id: string
  label: string
  logoName: string
  protocol: CustomModelProvider
  defaultBaseUrl: string
  defaultModel: string
  suggestedModels: string[]
  requiresApiKey: boolean
  note: string
}

export const modelProviderPresets: ModelProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    logoName: "openai",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    suggestedModels: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
    requiresApiKey: true,
    note: "Official OpenAI-compatible endpoint.",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    logoName: "anthropic",
    protocol: "anthropic-compatible",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-haiku-20241022",
    suggestedModels: [
      "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
    ],
    requiresApiKey: true,
    note: "Official Anthropic Messages endpoint.",
  },
  {
    id: "google",
    label: "Google",
    logoName: "google",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    suggestedModels: [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
    ],
    requiresApiKey: true,
    note: "Google OpenAI-compatible endpoint.",
  },
  {
    id: "azure",
    label: "Azure OpenAI",
    logoName: "azure",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://your-resource.openai.azure.com/openai/v1",
    defaultModel: "gpt-4o-mini",
    suggestedModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-35-turbo"],
    requiresApiKey: true,
    note: "Replace the base URL with your Azure OpenAI resource endpoint.",
  },
  {
    id: "ollama",
    label: "Ollama",
    logoName: "ollama",
    protocol: "openai-compatible",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    suggestedModels: ["llama3.2", "llama3.1", "mistral", "qwen2.5"],
    requiresApiKey: false,
    note: "Local Ollama OpenAI-compatible endpoint. API key is optional.",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    logoName: "openrouter",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    suggestedModels: [
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-2.0-flash",
      "deepseek/deepseek-chat",
    ],
    requiresApiKey: true,
    note: "Routes many providers. Model names usually use provider/model.",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    logoName: "deepseek",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    suggestedModels: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder"],
    requiresApiKey: true,
    note: "DeepSeek OpenAI-compatible endpoint.",
  },
  {
    id: "siliconflow",
    label: "SiliconFlow",
    logoName: "siliconflow",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api.siliconflow.cn/v1",
    defaultModel: "deepseek-ai/DeepSeek-V3",
    suggestedModels: [
      "deepseek-ai/DeepSeek-V3",
      "deepseek-ai/DeepSeek-R1",
      "Qwen/Qwen2.5-72B-Instruct",
    ],
    requiresApiKey: true,
    note: "SiliconFlow OpenAI-compatible endpoint.",
  },
  {
    id: "sglang",
    label: "SGLang",
    logoName: "openai",
    protocol: "openai-compatible",
    defaultBaseUrl: "http://127.0.0.1:8000/v1",
    defaultModel: "default",
    suggestedModels: ["default"],
    requiresApiKey: false,
    note: "Self-hosted SGLang OpenAI-compatible endpoint. API key is optional.",
  },
  {
    id: "gateway",
    label: "Vercel AI Gateway",
    logoName: "vercel",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://ai-gateway.vercel.sh/v1/ai",
    defaultModel: "openai/gpt-4o-mini",
    suggestedModels: [
      "openai/gpt-4o-mini",
      "anthropic/claude-sonnet-4-5",
      "google/gemini-2.0-flash",
    ],
    requiresApiKey: true,
    note: "Vercel AI Gateway. Model names usually use provider/model.",
  },
  {
    id: "doubao",
    label: "Doubao",
    logoName: "bytedance",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "doubao-1.5-pro-32k-250115",
    suggestedModels: [
      "doubao-1.5-thinking-pro-250415",
      "doubao-1.5-pro-32k-250115",
      "doubao-1.5-pro-256k-250115",
    ],
    requiresApiKey: true,
    note: "Volcengine Ark Doubao OpenAI-compatible endpoint.",
  },
  {
    id: "modelscope",
    label: "ModelScope",
    logoName: "modelscope",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api-inference.modelscope.cn/v1",
    defaultModel: "Qwen/Qwen3-32B",
    suggestedModels: [
      "Qwen/Qwen3-32B",
      "Qwen/Qwen2.5-72B-Instruct",
      "deepseek-ai/DeepSeek-R1-0528",
    ],
    requiresApiKey: true,
    note: "ModelScope OpenAI-compatible endpoint.",
  },
  {
    id: "glm",
    label: "GLM / Zhipu",
    logoName: "glm",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4-flash",
    suggestedModels: ["glm-4-flash", "glm-4-air", "glm-4-plus", "glm-4-long"],
    requiresApiKey: true,
    note: "Zhipu GLM OpenAI-compatible endpoint.",
  },
  {
    id: "qwen",
    label: "Qwen",
    logoName: "qwen",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    suggestedModels: ["qwen-plus", "qwen-turbo", "qwen-max", "qwen-long"],
    requiresApiKey: true,
    note: "Alibaba DashScope OpenAI-compatible endpoint.",
  },
  {
    id: "qiniu",
    label: "Qiniu",
    logoName: "qiniu",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api.qnaigc.com/v1",
    defaultModel: "deepseek-v3",
    suggestedModels: ["deepseek-v3", "deepseek-r1", "qwen-plus"],
    requiresApiKey: true,
    note: "Qiniu OpenAI-compatible endpoint.",
  },
  {
    id: "kimi",
    label: "Kimi",
    logoName: "kimi",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
    suggestedModels: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    requiresApiKey: true,
    note: "Moonshot Kimi OpenAI-compatible endpoint.",
  },
  {
    id: "minimax",
    label: "MiniMax",
    logoName: "minimax",
    protocol: "anthropic-compatible",
    defaultBaseUrl: "https://api.minimax.io/anthropic",
    defaultModel: "MiniMax-M2.7",
    suggestedModels: ["MiniMax-M2.7", "MiniMax-M2.7-highspeed", "MiniMax-M2.5"],
    requiresApiKey: true,
    note: "MiniMax Anthropic-compatible endpoint.",
  },
  {
    id: "novita",
    label: "Novita AI",
    logoName: "novita",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api.novita.ai/openai",
    defaultModel: "moonshotai/kimi-k2.5",
    suggestedModels: ["moonshotai/kimi-k2.5", "zai-org/glm-5", "minimax/minimax-m2.5"],
    requiresApiKey: true,
    note: "Novita AI OpenAI-compatible endpoint.",
  },
  {
    id: "custom-openai",
    label: "Custom OpenAI-compatible",
    logoName: "openai",
    protocol: "openai-compatible",
    defaultBaseUrl: "https://api.example.com/v1",
    defaultModel: "model-name",
    suggestedModels: ["model-name"],
    requiresApiKey: true,
    note: "Any OpenAI-compatible endpoint.",
  },
  {
    id: "custom-anthropic",
    label: "Custom Anthropic-compatible",
    logoName: "anthropic",
    protocol: "anthropic-compatible",
    defaultBaseUrl: "https://api.example.com/v1",
    defaultModel: "model-name",
    suggestedModels: ["model-name"],
    requiresApiKey: true,
    note: "Any Anthropic-compatible Messages endpoint.",
  },
]

export function getModelProviderPreset(id?: string): ModelProviderPreset {
  return modelProviderPresets.find((preset) => preset.id === id) ?? modelProviderPresets[0]
}

export function getKnownModelProviderPreset(id?: string): ModelProviderPreset | undefined {
  return modelProviderPresets.find((preset) => preset.id === id)
}

export function getModelProviderPresetForSettings(settings: AiSettings): ModelProviderPreset {
  const configured = getModelProviderPreset(settings.customModelProviderId)
  if (
    configured.protocol === settings.customModelProvider &&
    configured.defaultBaseUrl === settings.customModelBaseUrl
  ) {
    return configured
  }

  return (
    modelProviderPresets.find(
      (preset) =>
        preset.protocol === settings.customModelProvider &&
        preset.defaultBaseUrl === settings.customModelBaseUrl
    ) ?? configured
  )
}
