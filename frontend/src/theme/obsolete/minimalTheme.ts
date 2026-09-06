// FILE: frontend/src/theme/obsolete/minimalTheme.ts
import { theme } from 'antd';
const { defaultAlgorithm } = theme;

export default {
  label           : 'Minimal',
  icon            : '⚪️',

  algorithm       : defaultAlgorithm,
  colorPrimary    : '#888888',
  colorPrimaryBg  : '#8888881a',
  colorBgLayout   : '#fafafa',
  colorBgContainer: '#f5f5f5',
  colorTextBase   : '#333333',

  bgMain   : '#fafafa',
  bgLight  : '#f5f5f5',
  bgDark   : '#888888',
  textMain : '#333333',
  accent   : '#888888',
} as const;
