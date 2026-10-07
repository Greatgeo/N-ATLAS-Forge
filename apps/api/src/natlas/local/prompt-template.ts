import { Message } from '../../../../../packages/shared/types.ts';

export function formatNAtlasPrompt(messages: Message[]): string {
  // Llama-3 style chat template utilized by NCAIR1/N-ATLaS
  let formatted = '<|begin_of_text|>';

  for (const msg of messages) {
    formatted += `<|start_header_id|>${msg.role}<|end_header_id|>\n\n`;
    formatted += `${msg.content.trim()}<|eot_id|>`;
  }

  // Prime assistant response turn
  formatted += '<|start_header_id|>assistant<|end_header_id|>\n\n';
  return formatted;
}

export function cleanNAtlasOutput(rawText: string): string {
  // Strip trailing stop tokens if present
  let clean = rawText
    .replace(/<\|eot_id\|>/g, '')
    .replace(/<\|end_of_text\|>/g, '')
    .replace(/<\|start_header_id\|>.*?<\|end_header_id\|>/g, '')
    .trim();
  return clean;
}
