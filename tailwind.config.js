/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        jira: {
          blue:    '#0052cc',
          'blue-dark': '#0747a6',
          'blue-light': '#deebff',
          dark:    '#172b4d',
          mid:     '#42526e',
          muted:   '#6b778c',
          border:  '#dfe1e6',
          bg:      '#f4f5f7',
          'bg-alt':'#fafbfc',
          green:   '#006644',
          'green-light': '#e3fcef',
          red:     '#bf2600',
          'red-light': '#ffebe6',
          orange:  '#ff8b00',
          'orange-light': '#fffae6',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
