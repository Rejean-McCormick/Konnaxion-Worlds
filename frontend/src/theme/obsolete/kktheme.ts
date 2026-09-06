// FILE: frontend/src/theme/obsolete/kktheme.ts
import { theme } from 'antd';
const { defaultAlgorithm } = theme;

export default {
  label           : 'KK',
  icon            : '🦄',

  algorithm       : defaultAlgorithm,
  colorPrimary    : '#1e6864',
  colorPrimaryBg  : '#1e68641a',
  colorBgLayout   : '#f0fefa',
  colorBgContainer: '#e0f7f5',
  colorTextBase   : '#05332b',

  bgMain   : '#f0fefa',
  bgLight  : '#e0f7f5',
  bgDark   : '#1e6864',
  textMain : '#05332b',
  accent   : '#1e6864',
} as const;
