export default {
  // 暂存的 TS：自动修 + 格式化 + 全项目 tsc 类型门禁
  // （tsc --noEmit 必须项目级运行，不能喂单个文件，否则丢 tsconfig 的 paths/jsx 配置）
  'src/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write', () => 'tsc --noEmit'],
  'src/**/*.{css,md}': ['prettier --write'],
}
