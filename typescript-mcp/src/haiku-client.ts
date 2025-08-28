#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';

export interface HaikuAnalysisResult {
  ffmpegCommand: string[];
  reasoning: string;
  safetyChecks: {
    validInputs: boolean;
    noDestructiveOps: boolean;
    outputPathSafe: boolean;
    resourceLimits: boolean;
  };
  estimatedProcessingTime?: number;
  confidence: number;
}

export interface VideoProcessingRequest {
  operation: string;
  inputFiles: string[];
  outputPath: string;
  parameters?: Record<string, any>;
  constraints?: {
    maxDuration?: number;
    maxFileSize?: number;
    allowedFormats?: string[];
  };
}

export class HaikuFFmpegClient {
  private anthropic: Anthropic;
  private dailySpend: number = 0;
  private dailyLimit: number = 5.0; // $5 daily limit
  private lastResetDate: string = '';

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key required for Haiku LLM integration');
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    this.resetDailySpendIfNeeded();
  }

  private resetDailySpendIfNeeded() {
    const today = new Date().toISOString().split('T')[0];
    if (this.lastResetDate !== today) {
      this.dailySpend = 0;
      this.lastResetDate = today;
      console.error(`🔄 Haiku daily spend reset for ${today}`);
    }
  }

  private estimateCost(request: VideoProcessingRequest): number {
    // Haiku pricing: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens
    // Estimate ~500 input + 200 output tokens per request = ~$0.0004
    const estimatedInputTokens = 500 + (request.inputFiles.length * 100);
    const estimatedOutputTokens = 200;
    
    const inputCost = (estimatedInputTokens / 1000000) * 0.25;
    const outputCost = (estimatedOutputTokens / 1000000) * 1.25;
    
    return inputCost + outputCost;
  }

  private canAffordRequest(estimatedCost: number): boolean {
    this.resetDailySpendIfNeeded();
    return (this.dailySpend + estimatedCost) <= this.dailyLimit;
  }

  public getDailySpendStatus() {
    this.resetDailySpendIfNeeded();
    return {
      dailySpend: this.dailySpend,
      dailyLimit: this.dailyLimit,
      remainingBudget: this.dailyLimit - this.dailySpend,
      canAffordTypicalRequest: this.canAffordRequest(0.001)
    };
  }

  /**
   * Generate FFmpeg command using Haiku LLM with safety validation
   */
  public async generateFFmpegCommand(request: VideoProcessingRequest): Promise<HaikuAnalysisResult> {
    const estimatedCost = this.estimateCost(request);
    
    if (!this.canAffordRequest(estimatedCost)) {
      throw new Error(`Daily budget exceeded. Spend: $${this.dailySpend.toFixed(3)}, Limit: $${this.dailyLimit}`);
    }

    console.error(`💰 Haiku analysis cost: ~$${estimatedCost.toFixed(4)}`);

    const systemPrompt = `You are a FFmpeg command generator that creates safe, efficient video processing commands.

CRITICAL SAFETY RULES:
1. NEVER use rm, del, or destructive file operations
2. ALWAYS validate input file paths exist and are readable
3. NEVER overwrite source files - always use different output paths
4. Use relative paths when possible, absolute paths when necessary
5. Apply reasonable resource limits (time, file size, complexity)
6. Validate all parameters for injection attacks

Your response must be valid JSON with this structure:
{
  "ffmpegCommand": ["ffmpeg", "-i", "input.mp4", ...],
  "reasoning": "Explanation of command choices",
  "safetyChecks": {
    "validInputs": boolean,
    "noDestructiveOps": boolean, 
    "outputPathSafe": boolean,
    "resourceLimits": boolean
  },
  "estimatedProcessingTime": seconds,
  "confidence": 0.0-1.0
}`;

    const userPrompt = `Generate a safe FFmpeg command for this request:

Operation: ${request.operation}
Input files: ${request.inputFiles.join(', ')}
Output path: ${request.outputPath}
Parameters: ${JSON.stringify(request.parameters || {}, null, 2)}

${request.constraints ? `Constraints: ${JSON.stringify(request.constraints, null, 2)}` : ''}

Ensure the command is safe, efficient, and follows FFmpeg best practices.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent, safe commands
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      // Track actual spend
      this.dailySpend += estimatedCost;
      
      if (response.content[0].type !== 'text') {
        throw new Error('Unexpected response format from Haiku');
      }

      const responseText = response.content[0].text;
      
      try {
        const result: HaikuAnalysisResult = JSON.parse(responseText);
        
        // Validate safety checks
        if (!this.validateSafetyChecks(result)) {
          throw new Error('Generated command failed safety validation');
        }
        
        console.error(`✅ Haiku generated safe FFmpeg command (confidence: ${result.confidence})`);
        return result;
        
      } catch (parseError) {
        console.error('Failed to parse Haiku response:', responseText);
        throw new Error(`Failed to parse LLM response: ${parseError}`);
      }
      
    } catch (error) {
      console.error('Haiku API error:', error);
      throw new Error(`Haiku LLM analysis failed: ${error}`);
    }
  }

  /**
   * Validate that the generated command passes all safety checks
   */
  private validateSafetyChecks(result: HaikuAnalysisResult): boolean {
    const { safetyChecks, ffmpegCommand } = result;
    
    // Check that all safety flags are true
    const allSafetyChecksPassed = Object.values(safetyChecks).every(check => check === true);
    if (!allSafetyChecksPassed) {
      console.error('❌ Safety checks failed:', safetyChecks);
      return false;
    }
    
    // Additional command validation
    if (!Array.isArray(ffmpegCommand) || ffmpegCommand.length === 0) {
      console.error('❌ Invalid FFmpeg command structure');
      return false;
    }
    
    if (ffmpegCommand[0] !== 'ffmpeg') {
      console.error('❌ Command must start with ffmpeg');
      return false;
    }
    
    // Check for dangerous operations
    const dangerousPatterns = ['rm ', 'del ', '--rm', '--delete', 'format', 'mkfs'];
    const commandString = ffmpegCommand.join(' ');
    
    for (const pattern of dangerousPatterns) {
      if (commandString.includes(pattern)) {
        console.error(`❌ Dangerous pattern detected: ${pattern}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Fallback heuristic command generation when Haiku is unavailable
   */
  public generateFallbackCommand(request: VideoProcessingRequest): HaikuAnalysisResult {
    console.error('🔄 Using fallback heuristic FFmpeg command generation');
    
    const { operation, inputFiles, outputPath, parameters = {} } = request;
    let ffmpegCommand: string[] = ['ffmpeg'];
    
    // Add input files
    inputFiles.forEach(file => {
      ffmpegCommand.push('-i', file);
    });
    
    // Generate command based on operation type
    switch (operation.toLowerCase()) {
      case 'trim':
      case 'cut':
        if (parameters.start) ffmpegCommand.push('-ss', String(parameters.start));
        if (parameters.duration) ffmpegCommand.push('-t', String(parameters.duration));
        break;
        
      case 'resize':
      case 'scale':
        if (parameters.width && parameters.height) {
          ffmpegCommand.push('-vf', `scale=${parameters.width}:${parameters.height}`);
        }
        break;
        
      case 'convert':
      case 'format':
        // Format conversion handled by output extension
        break;
        
      case 'extract_audio':
        ffmpegCommand.push('-vn', '-acodec', 'copy');
        break;
        
      default:
        console.error(`⚠️ Unknown operation: ${operation}, using basic copy`);
        ffmpegCommand.push('-c', 'copy');
    }
    
    // Add output
    ffmpegCommand.push('-y', outputPath); // -y to overwrite output
    
    return {
      ffmpegCommand,
      reasoning: `Fallback heuristic command for ${operation} operation`,
      safetyChecks: {
        validInputs: true, // Assume valid for fallback
        noDestructiveOps: true,
        outputPathSafe: true,
        resourceLimits: true
      },
      confidence: 0.7 // Medium confidence for heuristic approach
    };
  }
}

/**
 * Create Haiku client with environment-based configuration
 */
export function createHaikuClient(): HaikuFFmpegClient | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('⚠️ ANTHROPIC_API_KEY not set, Haiku LLM features disabled');
    return null;
  }
  
  try {
    return new HaikuFFmpegClient(apiKey);
  } catch (error) {
    console.error('❌ Failed to initialize Haiku client:', error);
    return null;
  }
}