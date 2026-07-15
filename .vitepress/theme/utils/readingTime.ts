export interface ReadingTimeResult {
  readingTime: string;
  wordCount: string;
}

export function getReadingTime(
  text: string,
  charsPerMinute: number = 400,
): ReadingTimeResult {
  const textLength = text.trim().replace(/\s/g, "").length;
  if (textLength === 0) {
    return { readingTime: "", wordCount: "" };
  }
  const minutes = Math.ceil(textLength / charsPerMinute);
  return {
    readingTime: `约 ${minutes} 分钟`,
    wordCount: `${textLength} 字`,
  };
}
