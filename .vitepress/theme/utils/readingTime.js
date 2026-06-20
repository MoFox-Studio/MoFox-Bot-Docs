export function getReadingTime(text, charsPerMinute = 400) {
  const textLength = text.trim().replace(/\s/g, '').length;
  if (textLength === 0) {
    return { readingTime: '', wordCount: '' };
  }
  const minutes = Math.ceil(textLength / charsPerMinute);
  return {
    readingTime: `约 ${minutes} 分钟`,
    wordCount: `${textLength} 字`
  };
}