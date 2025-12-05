import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import IaConfigEntity from '../../infrastructure/entities/ia-config.entity';
import UpdateIaConfigDto from '../../infrastructure/dto/update-ia-config.dto';
import ChatRequestDto from '../../infrastructure/dto/chat-request.dto';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const DEFAULT_PROMPT = `Eres Freeler Coach, un asistente especializado en capacitar a usuarios referidores.
Tu objetivo exclusiv0 es:
- Enseñar buenas prácticas para captar referidos de calidad.
- Explicar cómo vender cada campaña disponible y qué información ayuda a cerrar ventas.
- Dar consejos para obtener más datos del lead sin incomodarlo.

Formatea siempre tus respuestas usando viñetas (•) o listas numeradas, destaca conceptos clave con MAYÚSCULAS o **negritas** simples, y usa emojis relevantes para mantener la conversación amena.
Nunca abandones este propósito. Si el usuario se desvía, redirige la conversación a tips de referidos o campañas.
Utiliza un tono amable, motivador y breve.`;

const ENCRYPTED_PREFIX = 'enc::';
const AES_ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

@Injectable()
export class IaConfigService {
  private readonly logger = new Logger(IaConfigService.name);
  private readonly encryptionKey: Buffer | null;
  private readonly encryptionEnabled: boolean;

  constructor(
    @InjectRepository(IaConfigEntity)
    private readonly repo: Repository<IaConfigEntity>,
    private readonly configService: ConfigService,
  ) {
    const secret = (this.configService.get<string>('IA_CONFIG_SECRET') ?? '').trim();
    if (secret.length >= 16) {
      this.encryptionKey = createHash('sha256').update(secret).digest();
      this.encryptionEnabled = true;
    } else {
      if (!secret.length) {
        this.logger.warn('IA_CONFIG_SECRET is not defined; IA tokens will be stored without encryption.');
      } else {
        this.logger.warn('IA_CONFIG_SECRET is too short; IA tokens will be stored without encryption.');
      }
      this.encryptionKey = null;
      this.encryptionEnabled = false;
    }
  }

  private encrypt(value: string) {
    if (!this.encryptionEnabled || !this.encryptionKey) return value;
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(AES_ALGO, this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, tag, encrypted]).toString('base64')}`;
  }

  private decrypt(value?: string | null) {
    if (!value) return null;
    if (!this.encryptionEnabled || !this.encryptionKey) return value;
    if (!value.startsWith(ENCRYPTED_PREFIX)) return value;
    try {
      const raw = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64');
      const iv = raw.subarray(0, IV_LENGTH);
      const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const enc = raw.subarray(IV_LENGTH + TAG_LENGTH);
      const decipher = createDecipheriv(AES_ALGO, this.encryptionKey, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error(`Failed to decrypt IA API key: ${(error as Error).message}`);
      return null;
    }
  }

  private maskToken(value?: string | null) {
    if (!value) return null;
    if (value.length <= 6) {
      return `${value.slice(0, 1)}****${value.slice(-1)}`;
    }
    return `${value.slice(0, 4)}****${value.slice(-2)}`;
  }

  private async ensureConfig(): Promise<IaConfigEntity> {
    let current = await this.repo.findOne({ where: {}, order: { updatedAt: 'DESC' } });
    if (!current) {
      current = this.repo.create({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        basePrompt: DEFAULT_PROMPT,
        temperature: 0.35,
        guidance: 0.6,
        maxTokens: 600,
      });
      current = await this.repo.save(current);
    }
    return current;
  }

  async getConfig() {
    const config = await this.ensureConfig();
    const apiKey = this.decrypt(config.apiKey);
    return {
      provider: config.provider,
      model: config.model,
      basePrompt: config.basePrompt,
      temperature: Number(config.temperature),
      guidance: Number(config.guidance),
      maxTokens: config.maxTokens,
      tokenMasked: this.maskToken(apiKey),
      updatedAt: config.updatedAt,
    };
  }

  async updateConfig(dto: UpdateIaConfigDto) {
    const config = await this.ensureConfig();
    const sanitize = (value?: string | null) => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };

    const sanitizedApiKey = sanitize(dto.apiKey);
    const sanitizedModel = sanitize(dto.model);
    const sanitizedProvider = sanitize(dto.provider);
    const sanitizedPrompt = sanitize(dto.basePrompt);

    Object.assign(config, {
      provider: sanitizedProvider ?? config.provider,
      basePrompt: sanitizedPrompt ?? config.basePrompt,
      temperature: dto.temperature ?? config.temperature,
      guidance: dto.guidance ?? config.guidance,
      maxTokens: dto.maxTokens ?? config.maxTokens,
    });

    if (sanitizedApiKey) {
      config.apiKey = this.encrypt(sanitizedApiKey);
    }

    if (sanitizedModel) {
      config.model = sanitizedModel;
    }

    await this.repo.save(config);
    const publicConfig = await this.getConfig();
    return {
      message: 'IA_CONFIG_UPDATED',
      updatedAt: publicConfig.updatedAt,
      config: publicConfig,
    };
  }

  async createChat(dto: ChatRequestDto) {
    const config = await this.ensureConfig();
    const apiKey = this.decrypt(config.apiKey);
    if (!apiKey) {
      throw new BadRequestException('IA_TOKEN_NOT_CONFIGURED');
    }
    const history =
      dto.history?.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })) ?? [];

    const provider = (config.provider ?? 'openai').toLowerCase();
    if (provider === 'gemini') {
      return this.callGemini(config, apiKey, dto, history);
    }
    if (provider === 'groq') {
      return this.callGroq(config, apiKey, dto, history);
    }
    return this.callOpenAI(config, apiKey, dto, history);
  }

  private async callOpenAI(
    config: IaConfigEntity,
    apiKey: string,
    dto: ChatRequestDto,
    history: { role: string; content: string }[],
  ) {
    const payload = {
      model: config.model,
      temperature: Number(config.temperature),
      messages: [
        { role: 'system', content: config.basePrompt ?? DEFAULT_PROMPT },
        ...history,
        {
          role: 'user',
          content: dto.message,
        },
      ],
      max_tokens: config.maxTokens,
      presence_penalty: Number(config.guidance),
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const details = await response.text();
        this.logger.error(`OpenAI error [${response.status}]: ${details}`);
        throw new InternalServerErrorException('IA_PROVIDER_ERROR');
      }
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: Record<string, unknown>;
        model?: string;
      };
      const content =
        data.choices?.[0]?.message?.content?.trim() ??
        'No pude generar una respuesta en este momento, intenta nuevamente.';
      return {
        reply: content,
        model: data.model ?? config.model,
        usage: data.usage ?? null,
      };
    } catch (error) {
      this.logger.error(`IA chat error: ${(error as Error).message}`);
      throw new InternalServerErrorException('IA_CHAT_ERROR');
    }
  }

  private async callGemini(
    config: IaConfigEntity,
    apiKey: string,
    dto: ChatRequestDto,
    history: { role: string; content: string }[],
  ) {
    const model = config.model || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const contents = [
      {
        role: 'user',
        parts: [{ text: config.basePrompt ?? DEFAULT_PROMPT }],
      },
      ...history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: dto.message }],
      },
    ];

    const payload = {
      contents,
      generationConfig: {
        temperature: Number(config.temperature),
        maxOutputTokens: config.maxTokens,
        presencePenalty: Number(config.guidance),
      },
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const details = await response.text();
        this.logger.error(`Gemini error [${response.status}]: ${details}`);
        throw new InternalServerErrorException('IA_PROVIDER_ERROR');
      }
      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        usageMetadata?: Record<string, unknown>;
        modelVersion?: string;
      };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const content =
        parts.map((part) => part.text).filter(Boolean).join('\n').trim() ||
        'No pude generar una respuesta en este momento, intenta nuevamente.';
      return {
        reply: content,
        model: model,
        usage: data.usageMetadata ?? null,
      };
    } catch (error) {
      this.logger.error(`IA chat error (Gemini): ${(error as Error).message}`);
      throw new InternalServerErrorException('IA_CHAT_ERROR');
    }
  }

  private async callGroq(
    config: IaConfigEntity,
    apiKey: string,
    dto: ChatRequestDto,
    history: { role: string; content: string }[],
  ) {
    const payload = {
      model: config.model || 'llama-3.1-8b-instant',
      temperature: Number(config.temperature),
      messages: [
        { role: 'system', content: config.basePrompt ?? DEFAULT_PROMPT },
        ...history,
        {
          role: 'user',
          content: dto.message,
        },
      ],
      max_tokens: config.maxTokens,
      presence_penalty: Number(config.guidance),
    };

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const details = await response.text();
        this.logger.error(`Groq error [${response.status}]: ${details}`);
        throw new InternalServerErrorException('IA_PROVIDER_ERROR');
      }
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: Record<string, unknown>;
        model?: string;
      };
      const content =
        data.choices?.[0]?.message?.content?.trim() ??
        'No pude generar una respuesta en este momento, intenta nuevamente.';
      return {
        reply: content,
        model: data.model ?? payload.model,
        usage: data.usage ?? null,
      };
    } catch (error) {
      this.logger.error(`IA chat error (Groq): ${(error as Error).message}`);
      throw new InternalServerErrorException('IA_CHAT_ERROR');
    }
  }
}

export default IaConfigService;
