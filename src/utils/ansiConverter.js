export function convertToAnsi(text, styles) {
  if (!styles.length) return text;

  let result = '';
  let currentIndex = 0;
  let activeStyles = [];

  // Sort styles by their starting position
  const sortedStyles = [...styles].sort((a, b) => a.start - b.start);

  for (const style of sortedStyles) {
    // Add text before the style with any active styles
    if (currentIndex < style.start) {
      const textBefore = text.slice(currentIndex, style.start);
      if (activeStyles.length) {
        result += `\x1b[${activeStyles.join(';')}m${textBefore}`;
      } else {
        result += textBefore;
      }
    }

    // Update active styles
    activeStyles = [...activeStyles, ...style.codes];

    // Add the styled text
    const styledText = text.slice(style.start, style.end);
    result += `\x1b[${activeStyles.join(';')}m${styledText}`;

    // Reset styles at the end of this segment
    result += '\x1b[0m';
    
    currentIndex = style.end;
    
    // Reapply active styles that continue after this segment
    const continuingStyles = styles.filter(s => s.start < style.end && s.end > style.end);
    activeStyles = continuingStyles.flatMap(s => s.codes);
  }

  // Add remaining text
  if (currentIndex < text.length) {
    result += text.slice(currentIndex);
  }

  return result;
}

export function getSelectionRange(textareaRef) {
  const textarea = textareaRef.current;
  if (!textarea) return null;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  if (start === end) return null;
  
  return {
    start,
    end,
    text: textarea.value.slice(start, end)
  };
}

export function applyStyle(text, selection, code, existingStyles) {
  if (!selection) return { text, styles: existingStyles };
  
  const { start, end } = selection;
  if (start === end) return { text, styles: existingStyles };

  // Reset style - remove all styles in the selection range
  if (code === 0) {
    const newStyles = existingStyles.filter(style => 
      style.end <= start || style.start >= end
    );
    return { text, styles: newStyles };
  }

  // Find any existing styles that overlap with the selection
  const overlappingStyles = existingStyles.filter(style => 
    !(style.end <= start || style.start >= end)
  );

  // Find if there's already a style with this exact code and range
  const exactStyle = overlappingStyles.find(style => 
    style.start === start && 
    style.end === end && 
    style.codes.includes(code)
  );

  if (exactStyle) {
    // Remove just this code from the style
    const newCodes = exactStyle.codes.filter(c => c !== code);
    if (newCodes.length === 0) {
      // If no codes left, remove the style entirely
      return {
        text,
        styles: existingStyles.filter(s => s !== exactStyle)
      };
    } else {
      // Update the style with remaining codes
      return {
        text,
        styles: existingStyles.map(s => 
          s === exactStyle ? { ...s, codes: newCodes } : s
        )
      };
    }
  }

  // Find or create a style for this exact range
  const rangeStyle = overlappingStyles.find(style => 
    style.start === start && style.end === end
  );

  if (rangeStyle) {
    // Add the new code to existing style at this range
    if (!rangeStyle.codes.includes(code)) {
      return {
        text,
        styles: existingStyles.map(s =>
          s === rangeStyle ? { ...s, codes: [...s.codes, code] } : s
        )
      };
    }
    return { text, styles: existingStyles };
  }

  // Create new style with this code
  const newStyle = {
    start,
    end,
    codes: [code]
  };

  // Remove any completely overlapped styles
  const nonOverlappedStyles = existingStyles.filter(style => 
    !(style.start >= start && style.end <= end)
  );

  // Split any partially overlapped styles
  const splitStyles = [];
  nonOverlappedStyles.forEach(style => {
    if (style.start < start && style.end > start && style.end <= end) {
      // Overlaps at start
      splitStyles.push({
        ...style,
        end: start
      });
    } else if (style.start >= start && style.start < end && style.end > end) {
      // Overlaps at end
      splitStyles.push({
        ...style,
        start: end
      });
    } else if (style.start < start && style.end > end) {
      // Style spans the entire selection
      splitStyles.push(
        {
          ...style,
          end: start
        },
        {
          ...style,
          start: end
        }
      );
    } else {
      splitStyles.push(style);
    }
  });

  return {
    text,
    styles: [...splitStyles, newStyle]
  };
} 