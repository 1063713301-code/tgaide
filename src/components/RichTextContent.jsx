/**
 * 详情页富文本渲染组件
 * 直接使用 dangerouslySetInnerHTML 渲染 Tiptap 输出的 HTML
 * 所有样式由 src/index.css 中的 .rich-text-content 规则控制
 */
export default function RichTextContent({ html }) {
  if (!html) {
    return (
      <div className="text-gray-400 italic text-center py-8">暂无内容</div>
    )
  }

  return (
    <div
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
