import { useState, useRef } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  CopyButton,
  Tooltip,
} from '@mantine/core';

const COLORS = {
  foreground: {
    '#4f545c': '30',   // Dark Gray
    '#dc322f': '31',   // Red
    '#859900': '32',   // Green
    '#b58900': '33',   // Gold
    '#268bd2': '34',   // Blue
    '#d33682': '35',   // Pink
    '#2aa198': '36',   // Teal
    '#ffffff': '37'    // White
  },
  background: {
    '#002b36': '40',   // Black
    '#cb4b16': '41',   // Red
    '#586e75': '42',   // Green
    '#657b83': '43',   // Yellow
    '#839496': '44',   // Blue
    '#6c71c4': '45',   // Magenta
    '#93a1a1': '46',   // Cyan
    '#fdf6e3': '47'    // White
  }
};

const tooltipTexts = {
  // FG
  "30": "Dark Gray (33%)",
  "31": "Red",
  "32": "Yellowish Green",
  "33": "Gold",
  "34": "Light Blue",
  "35": "Pink",
  "36": "Teal",
  "37": "White",
  // BG
  "40": "Blueish Black",
  "41": "Rust Brown",
  "42": "Gray (40%)",
  "43": "Gray (45%)",
  "44": "Light Gray (55%)",
  "45": "Blurple",
  "46": "Light Gray (60%)",
  "47": "Cream White",
};

export function ColoredTextGenerator() {
  const editorRef = useRef(null);

  const applyStyle = (code) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    const text = selection.toString();
    if (!text) return;

    const span = document.createElement("span");
    span.innerText = text;
    span.classList.add(`ansi-${code}`);

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);

    // Keep the text selected after styling
    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleInput = (e) => {
    const base = e.currentTarget.innerHTML.replace(/<(\/?(br|span|span class="ansi-[0-9]*"))>/g, "[$1]");
    if (base.includes("<") || base.includes(">")) {
      e.currentTarget.innerHTML = base
        .replace(/<.*?>/g, "")
        .replace(/[<>]/g, "")
        .replace(/\[(\/?(br|span|span class="ansi-[0-9]*"))\]/g, "<$1>");
    }
  };

  const nodesToANSI = (nodes, states = [{ fg: 2, bg: 2, st: 2 }]) => {
    let text = "";
    for (const node of nodes) {
      if (node.nodeType === 3) {  // Text node
        text += node.textContent;
        continue;
      }
      if (node.nodeName === "BR") {
        text += "\n";
        continue;
      }
      
      if (!node.className?.startsWith('ansi-')) continue;
      
      const ansiCode = +(node.className.split("-")[1]);
      const newState = { ...states[states.length - 1] };

      if (ansiCode < 30) newState.st = ansiCode;
      else if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
      else if (ansiCode >= 40) newState.bg = ansiCode;

      states.push(newState);
      
      // Apply the style
      const codes = [];
      if (newState.st !== 2) codes.push(newState.st);
      if (newState.fg !== 2) codes.push(newState.fg);
      if (newState.bg !== 2) codes.push(newState.bg);
      
      if (codes.length > 0) {
        text += `\x1b[${codes.join(';')}m`;
      }
      
      // Process child nodes
      text += nodesToANSI(node.childNodes, states);
      states.pop();
      
      // Reset and restore parent state
      text += `\x1b[0m`;
      const parentState = states[states.length - 1];
      const parentCodes = [];
      if (parentState.st !== 2) parentCodes.push(parentState.st);
      if (parentState.fg !== 2) parentCodes.push(parentState.fg);
      if (parentState.bg !== 2) parentCodes.push(parentState.bg);
      
      if (parentCodes.length > 0) {
        text += `\x1b[${parentCodes.join(';')}m`;
      }
    }
    return text;
  };

  const convertToDiscordFormat = () => {
    if (!editorRef.current) return "";
    const ansiText = nodesToANSI(editorRef.current.childNodes, [{ fg: 2, bg: 2, st: 2 }]);
    return `\`\`\`ansi\n${ansiText}\n\`\`\``;
  };

  return (
    <Container 
      size="sm" 
      py="xl" 
      sx={{
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: '20px',
        paddingRight: '20px'
      }}
    >
      <Title order={1} ta="center" mb="xl">
        Discord Colored Text Generator
      </Title>

      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={3} mb="md">Text Styling</Title>

        <Group mb="md">
          <Button 
            variant="light" 
            onClick={() => applyStyle(1)}
            fw={900}
          >
            Bold
          </Button>
          <Button 
            variant="light" 
            onClick={() => applyStyle(4)}
            td="underline"
          >
            Underline
          </Button>
          <Button 
            variant="light" 
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = "Welcome to Discord Colored Text Generator!";
              }
            }}
          >
            Reset
          </Button>
        </Group>

        <Title order={4} mb="sm">Foreground Colors</Title>
        <Group mb="xl" spacing="md">
          {Object.entries(COLORS.foreground).map(([color, code]) => (
            <Tooltip key={code} label={tooltipTexts[code]}>
              <Button 
                variant="filled"
                color="gray"
                style={{ 
                  backgroundColor: color,
                  width: '30px',
                  height: '30px',
                  padding: 0,
                  minWidth: 'unset'
                }}
                onClick={() => applyStyle(code)}
              />
            </Tooltip>
          ))}
        </Group>

        <Title order={4} mb="sm">Background Colors</Title>
        <Group mb="xl" spacing="md">
          {Object.entries(COLORS.background).map(([color, code]) => (
            <Tooltip key={code} label={tooltipTexts[code]}>
              <Button 
                variant="filled"
                color="gray"
                style={{ 
                  backgroundColor: color,
                  width: '30px',
                  height: '30px',
                  padding: 0,
                  minWidth: 'unset'
                }}
                onClick={() => applyStyle(code)}
              />
            </Tooltip>
          ))}
        </Group>
      </Card>

      <style>
        {`
          .ansi-1 { font-weight: 700; text-decoration: none; }
          .ansi-4 { font-weight: 500; text-decoration: underline; }
          ${Object.entries(COLORS.foreground).map(([color, code]) => `.ansi-${code} { color: ${color}; }`).join('\n')}
          ${Object.entries(COLORS.background).map(([color, code]) => `.ansi-${code} { background-color: ${color}; }`).join('\n')}
        `}
      </style>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          width: '100%',
          backgroundColor: '#2F3136',
          color: '#B9BBBE',
          border: '1px solid #202225',
          borderRadius: '4px',
          minHeight: '200px',
          padding: '12px',
          marginTop: '16px',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          whiteSpace: 'pre-wrap',
          outline: 'none',
          textAlign: 'left'
        }}
      >
        Welcome to Discord Colored Text Generator!
      </div>

      <Button 
        fullWidth 
        mt="md" 
        onClick={async () => {
          try {
            const formattedText = convertToDiscordFormat();
            await navigator.clipboard.writeText(formattedText);
            const btn = document.activeElement;
            if (btn) {
              btn.innerText = 'Copied!';
              btn.style.backgroundColor = '#3BA55D';
              setTimeout(() => {
                btn.innerText = 'Copy Discord Formatted Text';
                btn.style.backgroundColor = '#5865F2';
              }, 2000);
            }
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        }}
        sx={(theme) => ({
          backgroundColor: '#5865F2',
          '&:hover': {
            backgroundColor: '#4752C4',
          },
        })}
      >
        Copy Discord Formatted Text
      </Button>


    </Container>
  );
} 