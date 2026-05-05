/**
 * 阿里云 DashScope (通义千问/万象) 供应商适配
 * @version 1.0
 */

// ============================================================
// 类型定义
// ============================================================

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
  associationSkills?: string;
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
  voices: { title: string; voice: string }[];
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

interface PollResult {
  completed: boolean;
  data?: string;
  error?: string;
}

// ============================================================
// 全局声明
// ============================================================

declare const axios: any;
declare const logger: (msg: string) => void;
declare const urlToBase64: (url: string) => Promise<string>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
declare const createOpenAI: any;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
  imageRequest: (c: any, m: ImageModel) => Promise<string>;
  videoRequest: (c: any, m: VideoModel) => Promise<string>;
  ttsRequest: (c: any, m: TTSModel) => Promise<string>;
};

// ============================================================
// 供应商配置
// ============================================================

const vendor: VendorConfig = {
  id: "dashscope",
  version: "1.0",
  author: "Toonflow",
  name: "阿里云 DashScope",
  description: "阿里云大模型服务平台，支持通义千问文本模型、万象视频生成等能力。\n\n需要在[阿里云百炼控制台](https://bailian.console.aliyun.com/)获取API-KEY。",
  icon: "",
  inputs: [
    { key: "apiKey", label: "API-KEY", type: "password", required: true, placeholder: "sk-开头的API Key" },
  ],
  inputValues: {
    apiKey: "",
  },
  models: [
    // 文本模型
    { name: "qwen-max", modelName: "qwen-max", type: "text", think: false },
    { name: "qwen-plus", modelName: "qwen-plus", type: "text", think: false },
    { name: "qwen-turbo", modelName: "qwen-turbo", type: "text", think: false },
    // 万象数字人视频模型
    {
      name: "wan2.2-s2v (数字人口型)",
      modelName: "wan2.2-s2v",
      type: "video",
      mode: ["singleImage"],
      audio: true,
      durationResolutionMap: [{ duration: [5, 10, 15, 20], resolution: ["480p", "720p"] }],
    },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

const getHeaders = () => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${vendor.inputValues.apiKey}`,
  } as Record<string, string>;
};

const baseUrl = "https://dashscope.aliyuncs.com";

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  return createOpenAI({
    baseURL: `${baseUrl}/compatible-mode/v1`,
    apiKey: vendor.inputValues.apiKey,
  }).chat(model.modelName);
};

const imageRequest = async (config: any, model: ImageModel): Promise<string> => {
  // 阿里云通义万相图片生成
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  throw new Error("图片生成功能暂未实现，请使用文本或视频功能");
};

const videoRequest = async (config: any, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  
  const headers = getHeaders();
  const lowerName = model.modelName.toLowerCase();

  // 万象数字人 wan2.2-s2v
  if (lowerName.includes("wan2.2-s2v")) {
    const imageRef = config.referenceList?.find((r: any) => r.type === "image");
    const audioRef = config.referenceList?.find((r: any) => r.type === "audio");

    if (!imageRef) throw new Error("wan2.2-s2v 需要提供参考图片");
    if (!audioRef) throw new Error("wan2.2-s2v 需要提供参考音频");

    const body: any = {
      model: model.modelName,
      input: {
        image_url: imageRef.base64,
        audio_url: audioRef.base64,
      },
      parameters: {
        resolution: config.resolution === "720p" ? "720P" : "480P",
      },
    };

    headers["X-DashScope-Async"] = "enable";

    logger(`[视频生成] 提交万象数字人任务, 模型: ${model.modelName}`);

    try {
      const createResponse = await axios.post(
        `${baseUrl}/api/v1/services/aigc/image2video/video-synthesis`,
        body,
        { headers }
      );

      const taskId = createResponse.data?.output?.task_id;
      if (!taskId) {
        throw new Error("视频生成任务创建失败：未返回任务ID");
      }

      logger(`[视频生成] 任务已创建, ID: ${taskId}`);

      const result = await pollTask(
        async (): Promise<PollResult> => {
          const queryResponse = await axios.get(
            `${baseUrl}/api/v1/tasks/${taskId}`,
            { headers }
          );
          const task = queryResponse.data;
          const status = task?.output?.task_status || task?.task_status;
          
          logger(`[视频生成] 任务状态: ${status}`);

          switch (status) {
            case "SUCCEEDED":
            case "SUCCESS":
              if (task?.output?.results && task.output.results.length > 0) {
                return { completed: true, data: task.output.results[0].url };
              }
              return { completed: true, error: "任务成功但未返回视频URL" };
            case "FAILED":
              return { completed: true, error: task?.output?.error_message || "视频生成失败" };
            case "CANCELED":
              return { completed: true, error: "视频生成任务已取消" };
            default:
              return { completed: false };
          }
        },
        5000,
        600000 * 5,
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return await urlToBase64(result.data!);
    } catch (error: any) {
      throw new Error(`视频生成失败：${error.message || JSON.stringify(error.response?.data)}`);
    }
  }

  throw new Error(`不支持的视频模型: ${model.modelName}`);
};

const ttsRequest = async (config: any, model: TTSModel): Promise<string> => {
  throw new Error("语音合成功能暂未实现");
};

// ============================================================
// 导出
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;

export {};
