import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { uploadImageToStorage } from '../lib/supabase'

// ─── Word HTML 清理函数 ───────────────────────────
function cleanWordHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<o:p[^>]*>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<w:[^>]+>[\s\S]*?<\/w:[^>]+>/gi, '')
    .replace(/<m:[^>]+>[\s\S]*?<\/m:[^>]+>/gi, '')
    .replace(/\s*mso-[a-z-]+\s*:[^;]+;?/gi, '')
    .replace(/\s*MsoNormal\s*/gi, '')
    .replace(/class="?[^"]*Mso[^"]*"?/gi, '')
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    .replace(/<span\s+style="\s*">/gi, '<span>')
    .replace(/<span><\/span>/gi, '')
    .replace(/\s+style=""/gi, '')
    .replace(/<p\s+class="[^"]*">/gi, '<p>')
}

// ─── 工具栏按钮 ───────────────────────────────────
function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={`tiptap-toolbar-btn ${active ? 'is-active' : ''}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="toolbar-divider" />
}

// ─── 主编辑器组件 ─────────────────────────────────
export default function RichTextEditor({ value = '', onChange, placeholder = '请输入内容……' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        code: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
      Placeholder.configure({ placeholder }),
    ],

    content: value,

    editorProps: {
      // Word 粘贴 HTML 清理
      transformPastedHTML(html) {
        return cleanWordHTML(html)
      },
      // 剪贴板图片直接上传
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) continue

            uploadImageToStorage(file)
              .then((url) => {
                const node = view.state.schema.nodes.image.create({ src: url, alt: '' })
                const tr = view.state.tr.replaceSelectionWith(node)
                view.dispatch(tr)
              })
              .catch((err) => {
                console.warn('图片上传失败，使用本地预览:', err)
                const reader = new FileReader()
                reader.onload = (e) => {
                  const node = view.state.schema.nodes.image.create({ src: e.target.result, alt: '' })
                  const tr = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(tr)
                }
                reader.readAsDataURL(file)
              })
            return true
          }
        }
        return false
      },

      // 拖拽图片上传
      handleDrop(view, event, _slice, moved) {
        if (moved) return false
        const files = event.dataTransfer?.files
        if (!files?.length) return false

        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (!imageFiles.length) return false

        event.preventDefault()
        const { pos } = view.posAtCoords({ left: event.clientX, top: event.clientY }) || {}

        imageFiles.forEach((file) => {
          uploadImageToStorage(file)
            .then((url) => {
              const node = view.state.schema.nodes.image.create({ src: url })
              const tr = view.state.tr.insert(pos || view.state.selection.anchor, node)
              view.dispatch(tr)
            })
            .catch(console.warn)
        })
        return true
      },
    },

    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  // 插入表格
  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  // 插入本地图片
  const insertLocalImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const url = await uploadImageToStorage(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch {
        const reader = new FileReader()
        reader.onload = (ev) => {
          editor.chain().focus().setImage({ src: ev.target.result }).run()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  // 插入链接
  const setLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('请输入链接地址：', prev)
    if (url === null) return
    if (!url) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="tiptap-editor-wrapper">
      {/* ── 工具栏 ── */}
      <div className="tiptap-toolbar">
        {/* 撤销/重做 */}
        <ToolbarButton title="撤销 (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
          ↩
        </ToolbarButton>
        <ToolbarButton title="重做 (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
          ↪
        </ToolbarButton>

        <ToolbarDivider />

        {/* 标题 */}
        {[1, 2, 3].map((level) => (
          <ToolbarButton
            key={level}
            title={`标题${level}`}
            active={editor.isActive('heading', { level })}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            H{level}
          </ToolbarButton>
        ))}

        <ToolbarDivider />

        {/* 基础格式 */}
        <ToolbarButton title="加粗 (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton title="斜体 (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton title="下划线 (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton title="删除线" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </ToolbarButton>

        <ToolbarDivider />

        {/* 颜色 */}
        <label title="文字颜色" className="tiptap-toolbar-btn cursor-pointer relative overflow-hidden">
          <span>A</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            defaultValue="#111111"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <ToolbarButton
          title="高亮"
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
        >
          ✏️
        </ToolbarButton>

        <ToolbarDivider />

        {/* 对齐 */}
        <ToolbarButton title="左对齐" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          ≡
        </ToolbarButton>
        <ToolbarButton title="居中" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          ☰
        </ToolbarButton>
        <ToolbarButton title="右对齐" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          ≡
        </ToolbarButton>

        <ToolbarDivider />

        {/* 列表 */}
        <ToolbarButton title="无序列表" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •=
        </ToolbarButton>
        <ToolbarButton title="有序列表" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1=
        </ToolbarButton>
        <ToolbarButton title="引用块" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          "
        </ToolbarButton>

        <ToolbarDivider />

        {/* 表格 */}
        <ToolbarButton title="插入表格" onClick={insertTable}>
          ⊞
        </ToolbarButton>
        {editor.isActive('table') && (
          <>
            <ToolbarButton title="添加列" onClick={() => editor.chain().focus().addColumnAfter().run()}>+列</ToolbarButton>
            <ToolbarButton title="添加行" onClick={() => editor.chain().focus().addRowAfter().run()}>+行</ToolbarButton>
            <ToolbarButton title="删除列" onClick={() => editor.chain().focus().deleteColumn().run()}>-列</ToolbarButton>
            <ToolbarButton title="删除行" onClick={() => editor.chain().focus().deleteRow().run()}>-行</ToolbarButton>
            <ToolbarButton title="删除表格" onClick={() => editor.chain().focus().deleteTable().run()}>✕表</ToolbarButton>
          </>
        )}

        <ToolbarDivider />

        {/* 图片 & 链接 */}
        <ToolbarButton title="插入图片" onClick={insertLocalImage}>
          🖼
        </ToolbarButton>
        <ToolbarButton title="插入链接" active={editor.isActive('link')} onClick={setLink}>
          🔗
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton title="取消链接" onClick={() => editor.chain().focus().unsetLink().run()}>
            ✕链
          </ToolbarButton>
        )}

        <ToolbarDivider />

        {/* 分隔线 */}
        <ToolbarButton title="插入分隔线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          ─
        </ToolbarButton>

        {/* 清除格式 */}
        <ToolbarButton title="清除格式" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          ✗
        </ToolbarButton>
      </div>

      {/* ── 编辑区域 ── */}
      <EditorContent
        editor={editor}
        className="tiptap-content-area"
      />

      {/* 字数统计 */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 text-right">
        {editor.storage.characterCount?.characters?.() ?? 0} 字
      </div>
    </div>
  )
}
